/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/AdminDashboard.tsx
 *  Dashboard Admin Pro — Analytics + Gestion
 *
 *  Onglets :
 *    • Aperçu    — KPIs, distribution statuts, mix transaction
 *    • Membres   — leads, appel / email direct
 *    • Inventaire — biens + changement statut + ajout
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons }          from "@expo/vector-icons";
import { useNavigation }     from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth }           from "../context/AuthContext";
import { supabase }          from "../lib/supabase";
import type { PropertyStatus } from "../types/database";
import type { MainStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─── Design System ─────────────────────────────────────────────────────

const BG      = "#060606";
const CARD    = "#0D0D0D";
const CARD2   = "#111111";
const BORDER  = "#1C1C1C";
const WHITE   = "#F0F0F0";
const MUTED   = "#4A4A4A";
const MUTED2  = "#2A2A2A";
const GOLD    = "#C9A87E";
const GREEN   = "#22C55E";
const ORANGE  = "#F59E0B";
const RED     = "#EF4444";
const BLUE    = "#60A5FA";

// ─── Types ─────────────────────────────────────────────────────────────

interface AdminStats {
  totalViews:       number;
  totalFavorites:   number;
  totalProperties:  number;
  activeCount:      number;
  vendusCount:      number;
  louesCount:       number;
  reservesCount:    number;
  enVenteCount:     number;
  enLocationCount:  number;
  featuredCount:    number;
  membersCount:     number;
  revenuePotential: number;   // somme des prix des biens disponibles
}

interface Lead {
  id:         string;
  full_name:  string | null;
  email:      string;
  phone:      string | null;
  created_at: string;
}

interface AdminProperty {
  id:          string;
  title:       string;
  commune:     string | null;
  status:      PropertyStatus;
  price:       number | null;
  transaction: string | null;
  views_count: number | null;
}

// ─── Status config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<PropertyStatus, { labelKey: string; color: string; shortKey: string }> = {
  disponible: { labelKey: "admin.statusLabelAvailable",  color: GREEN,  shortKey: "admin.statusAvailable"  },
  reserve:    { labelKey: "admin.statusLabelReserved",   color: ORANGE, shortKey: "admin.statusReserved"   },
  vendu:      { labelKey: "admin.statusLabelSold",       color: RED,    shortKey: "admin.statusSold"       },
  loue:       { labelKey: "admin.statusLabelRented",     color: BLUE,   shortKey: "admin.statusRented"     },
};

const ALL_STATUSES: PropertyStatus[] = ["disponible", "reserve", "vendu", "loue"];

// ─── Helpers ───────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// timeAgo is now a function that takes t as parameter - see component usage

// ─── Hook de données ───────────────────────────────────────────────────

function useAdminData(t: (key: string) => string) {
  const ZERO: AdminStats = {
    totalViews: 0, totalFavorites: 0, totalProperties: 0,
    activeCount: 0, vendusCount: 0, louesCount: 0, reservesCount: 0,
    enVenteCount: 0, enLocationCount: 0, featuredCount: 0,
    membersCount: 0, revenuePotential: 0,
  };

  const [stats,      setStats]      = useState<AdminStats>(ZERO);
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = React.useRef(true);

  React.useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async (mounted = mountedRef) => {
    const fetchProps = async () =>
      supabase
        .from("properties")
        .select("id, title, commune, status, price, transaction, views_count, is_featured")
        .order("created_at", { ascending: false });

    const fetchFavs = async () =>
      supabase.from("favorites").select("id", { count: "exact", head: true });

    const fetchMembers = async () =>
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    const [propsR, favR, membersR] = await Promise.allSettled([
      withTimeout(fetchProps()),
      withTimeout(fetchFavs()),
      withTimeout(fetchMembers()),
    ]);

    if (!mounted.current) return;

    // ── Biens ──────────────────────────────────────────────────────────
    const propsVal = propsR.status === "fulfilled" ? propsR.value as { data: any[] | null; count: number | null } : null;
    if (propsVal?.data) {
      const ps = (propsVal.data ?? []) as (AdminProperty & { is_featured?: boolean })[];
      const favVal = favR.status === "fulfilled" ? favR.value as { count: number | null } : null;
      const computed: AdminStats = {
        totalViews:       ps.reduce((s, p) => s + (p.views_count ?? 0), 0),
        totalFavorites:   favVal?.count ?? 0,
        totalProperties:  ps.length,
        activeCount:      ps.filter(p => p.status === "disponible").length,
        vendusCount:      ps.filter(p => p.status === "vendu").length,
        louesCount:       ps.filter(p => p.status === "loue").length,
        reservesCount:    ps.filter(p => p.status === "reserve").length,
        enVenteCount:     ps.filter(p => p.transaction === "vente").length,
        enLocationCount:  ps.filter(p => p.transaction === "location").length,
        featuredCount:    ps.filter(p => p.is_featured).length,
        membersCount:     0,
        revenuePotential: ps
          .filter(p => p.status === "disponible" && p.price)
          .reduce((s, p) => s + (p.price ?? 0), 0),
      };
      setStats(computed);
      setProperties(ps as AdminProperty[]);
    }

    // ── Membres ────────────────────────────────────────────────────────
    const membersVal = membersR.status === "fulfilled" ? membersR.value as { data: any[] | null } : null;
    if (membersVal?.data) {
      const ms = (membersVal.data ?? []) as Lead[];
      setLeads(ms);
      setStats(prev => ({ ...prev, membersCount: ms.length }));
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    load(mounted);
    return () => { mounted.current = false; };
  }, [load]);

  const refresh = useCallback(() => { setRefreshing(true); load(mountedRef); }, [load]);

  const updateStatus = useCallback(async (id: string, status: PropertyStatus) => {
    const prev = properties;
    setProperties(p => p.map(item => item.id === id ? { ...item, status } : item));
    try {
      const { error } = await supabase.from("properties").update({ status }).eq("id", id);
      if (error) {
        Alert.alert(t("admin.errorLabel"), error.message);
        setProperties(prev);
      }
    } catch {
      setProperties(prev);
    }
  }, [properties, t]);

  return { stats, leads, properties, loading, refreshing, refresh, updateStatus };
}

// ─── Onglets internes ──────────────────────────────────────────────────

type Tab = "apercu" | "membres" | "inventaire";

const TABS: { id: Tab; labelKey: string; icon: string }[] = [
  { id: "apercu",     labelKey: "admin.tabOverview",   icon: "analytics-outline"  },
  { id: "membres",    labelKey: "admin.tabMembers",    icon: "people-outline"     },
  { id: "inventaire", labelKey: "admin.tabInventory",  icon: "home-outline"       },
];

// ─── Écran principal ───────────────────────────────────────────────────

export default function AdminDashboard() {
  const { profile }     = useAuth();
  const navigation      = useNavigation<Nav>();
  const { t } = useTranslation();
  const [tab, setTab]   = useState<Tab>("apercu");
  const { stats, leads, properties, loading, refreshing, refresh, updateStatus } = useAdminData(t);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <DashboardHeader name={profile?.full_name ?? null} onAdd={() => navigation.navigate("AddProperty")} />

      {/* ── Tab bar interne ────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.id}
            style={[styles.tabItem, tab === tb.id && styles.tabItemActive]}
            onPress={() => setTab(tb.id)}
          >
            <Ionicons
              name={tb.icon as any}
              size={14}
              color={tab === tb.id ? GOLD : MUTED}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.tabLabel, tab === tb.id && styles.tabLabelActive]}>
              {t(tb.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenu ────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={GOLD} size="small" />
          <Text style={styles.loaderText}>{t("admin.loadingData")}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
        >
          {tab === "apercu"     && <TabApercu     stats={stats} />}
          {tab === "membres"    && <TabMembres    leads={leads} />}
          {tab === "inventaire" && (
            <TabInventaire
              properties={properties}
              onStatusChange={updateStatus}
              onAdd={() => navigation.navigate("AddProperty")}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Header ────────────────────────────────────────────────────────────

function DashboardHeader({ name, onAdd }: { name: string | null; onAdd: () => void }) {
  const { t } = useTranslation();
  const initials = name
    ? name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerEye}>{t("admin.dashboard")}</Text>
        <Text style={styles.headerTitle}>{t("admin.adminTitle")}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Ionicons name="add" size={18} color={BG} />
          <Text style={styles.addBtnText}>{t("admin.addBtn")}</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Onglet Aperçu ─────────────────────────────────────────────────────

function TabApercu({ stats }: { stats: AdminStats }) {
  const { t } = useTranslation();
  const total = stats.totalProperties;

  return (
    <View style={styles.tabContent}>

      {/* ── KPI Row 1 ─────────────────────────────────────── */}
      <SectionLabel text={t("admin.keyIndicators")} />
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="eye-outline"
          value={fmtNum(stats.totalViews)}
          label={t("admin.totalViews")}
          color={GOLD}
        />
        <KpiCard
          icon="heart-outline"
          value={fmtNum(stats.totalFavorites)}
          label={t("admin.totalFavorites")}
          color={RED}
        />
        <KpiCard
          icon="home-outline"
          value={String(stats.activeCount)}
          label={t("admin.activeProperties")}
          color={GREEN}
        />
        <KpiCard
          icon="people-outline"
          value={String(stats.membersCount)}
          label={t("admin.members")}
          color={BLUE}
        />
      </View>

      {/* ── Potentiel revenu ──────────────────────────────── */}
      {stats.revenuePotential > 0 && (
        <View style={styles.revenueCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.revenueLabel}>{t("admin.revenuePotential")}</Text>
            <Text style={styles.revenueNote}>
              {t("admin.revenueNote", { count: stats.activeCount })}
            </Text>
          </View>
          <Text style={styles.revenueValue}>{fmtPrice(stats.revenuePotential)}</Text>
        </View>
      )}

      {/* ── Répartition statuts ──────────────────────────── */}
      {total > 0 && (
        <>
          <SectionLabel text={t("admin.statusDistribution")} />
          <View style={styles.chartCard}>
            <BarStat
              label={t("admin.available")}
              count={stats.activeCount}
              total={total}
              color={GREEN}
            />
            <BarStat
              label={t("admin.reserved")}
              count={stats.reservesCount}
              total={total}
              color={ORANGE}
            />
            <BarStat
              label={t("admin.sold")}
              count={stats.vendusCount}
              total={total}
              color={RED}
            />
            <BarStat
              label={t("admin.rented")}
              count={stats.louesCount}
              total={total}
              color={BLUE}
            />
          </View>
        </>
      )}

      {/* ── Mix transaction ───────────────────────────────── */}
      {total > 0 && (
        <>
          <SectionLabel text={t("admin.saleVsRental")} />
          <View style={styles.chartCard}>
            <BarStat
              label={t("admin.forSaleLabel")}
              count={stats.enVenteCount}
              total={total}
              color={GOLD}
            />
            <BarStat
              label={t("admin.forRentLabel")}
              count={stats.enLocationCount}
              total={total}
              color="#A78BFA"
            />
          </View>
        </>
      )}

      {/* ── Autres chiffres ───────────────────────────────── */}
      <SectionLabel text={t("admin.otherMetrics")} />
      <View style={styles.miniGrid}>
        <MiniStat label={t("admin.totalProperties")} value={String(total)}               />
        <MiniStat label={t("admin.featuredLabel")}    value={String(stats.featuredCount)} />
        <MiniStat label={t("admin.ongoingSales")}     value={String(stats.enVenteCount)}  />
        <MiniStat label={t("admin.rentals")}          value={String(stats.enLocationCount)} />
      </View>

    </View>
  );
}

// ─── Onglet Membres ────────────────────────────────────────────────────

function TabMembres({ leads }: { leads: Lead[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.tabContent}>
      <SectionLabel text={t("admin.membersRegistered", { count: leads.length })} />
      {leads.length === 0 ? (
        <EmptyState text={t("admin.noMembers")} icon="people-outline" />
      ) : (
        leads.map(lead => <LeadRow key={lead.id} lead={lead} />)
      )}
    </View>
  );
}

// ─── Onglet Inventaire ─────────────────────────────────────────────────

function TabInventaire({
  properties, onStatusChange, onAdd,
}: {
  properties:     AdminProperty[];
  onStatusChange: (id: string, s: PropertyStatus) => void;
  onAdd:          () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.tabContent}>
      {/* Bouton Ajouter un bien */}
      <TouchableOpacity style={styles.addPropertyBtn} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={20} color={BG} style={{ marginRight: 8 }} />
        <Text style={styles.addPropertyBtnText}>{t("admin.addProperty")}</Text>
      </TouchableOpacity>

      <SectionLabel text={t("admin.inventory", { count: properties.length })} />

      {properties.length === 0 ? (
        <EmptyState text={t("admin.noProperties")} icon="home-outline" />
      ) : (
        properties.map(p => (
          <PropertyRow
            key={p.id}
            property={p}
            onStatusChange={(s) => onStatusChange(p.id, s)}
          />
        ))
      )}
    </View>
  );
}

// ─── Composants UI ─────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionLabel}>{text}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function KpiCard({
  icon, value, label, color,
}: {
  icon: string; value: string; label: string; color: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function BarStat({
  label, count, total, color,
}: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barCount}>{count} · <Text style={{ color }}>{pct}%</Text></Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniCard}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const { t } = useTranslation();
  const name    = lead.full_name ?? lead.email.split("@")[0];
  const initial = (name[0] ?? "?").toUpperCase();

  const timeAgo = (dateStr: string): string => {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const days  = Math.floor(diff / 86_400_000);
    if (days === 0) return t("admin.today");
    if (days === 1) return t("admin.yesterday");
    if (days < 7)   return `J-${days}`;
    if (days < 30)  return `${Math.floor(days / 7)}sem`;
    return `${Math.floor(days / 30)}mois`;
  };

  const call = () => {
    if (!lead.phone) {
      Alert.alert(t("admin.noPhone"), t("admin.noPhoneDesc"));
      return;
    }
    Linking.openURL("tel:" + lead.phone);
  };

  const email = () => Linking.openURL("mailto:" + lead.email);

  return (
    <View style={styles.leadRow}>
      <View style={styles.leadInitial}>
        <Text style={styles.leadInitialText}>{initial}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.leadName}>{name}</Text>
        <Text style={styles.leadSub} numberOfLines={1}>
          {lead.email}
        </Text>
        {lead.phone && (
          <Text style={styles.leadPhone}>{lead.phone}</Text>
        )}
      </View>

      <View style={styles.leadActions}>
        <Text style={styles.leadDate}>{timeAgo(lead.created_at)}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={email}>
            <Ionicons name="mail-outline" size={14} color={GOLD} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={call}>
            <Ionicons name="call-outline" size={14} color={GREEN} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PropertyRow({
  property, onStatusChange,
}: {
  property:       AdminProperty;
  onStatusChange: (s: PropertyStatus) => void;
}) {
  const { t } = useTranslation();
  const cfg = STATUS_CFG[property.status];
  return (
    <View style={styles.propBlock}>
      <View style={styles.propHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.propTitle} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.propMeta}>
            {property.commune ?? "—"}
            {property.price ? `  ·  $${property.price.toLocaleString("fr-FR")}` : ""}
            {property.views_count ? `  ·  ${property.views_count} ${t("admin.views")}` : ""}
          </Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: cfg.color, backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{t(cfg.shortKey)}</Text>
        </View>
      </View>

      {/* Pills de changement de statut */}
      <View style={styles.pillRow}>
        {ALL_STATUSES.map(s => {
          const c = STATUS_CFG[s];
          const active = property.status === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => !active && onStatusChange(s)}
              style={[
                styles.pill,
                active && { borderColor: c.color, backgroundColor: c.color + "18" },
              ]}
            >
              <Text style={[styles.pillText, { color: active ? c.color : MUTED }]}>
                {t(c.shortKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function EmptyState({ text, icon }: { text: string; icon: string }) {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name={icon as any} size={28} color={MUTED2} style={{ marginBottom: 10 }} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  /* Header */
  header: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "center",
    paddingTop:        Platform.OS === "ios" ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom:     16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor:   BG,
  },
  headerEye: {
    color:        MUTED,
    fontSize:     10,
    fontWeight:   "600",
    letterSpacing: 3,
    marginBottom:  4,
  },
  headerTitle: {
    color:        WHITE,
    fontSize:     26,
    fontWeight:   "700",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
  },
  addBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   GOLD,
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   8,
    gap:               5,
  },
  addBtnText: {
    color:      BG,
    fontSize:   12,
    fontWeight: "800",
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   9,
    borderWidth:    1,
    borderColor:    BORDER,
    backgroundColor: CARD,
    alignItems:     "center",
    justifyContent: "center",
  },
  avatarText: {
    color:      GOLD,
    fontSize:   13,
    fontWeight: "700",
  },

  /* Tab Bar */
  tabBar: {
    flexDirection:     "row",
    backgroundColor:   BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
  },
  tabItem: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 4,
  },
  tabItemActive: {
    borderBottomColor: GOLD,
  },
  tabLabel: {
    color:      MUTED,
    fontSize:   12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: WHITE,
  },

  /* Scroll */
  scroll: {
    paddingBottom: 80,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop:        20,
    gap:               4,
  },

  /* Loader */
  loader: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    gap:            12,
  },
  loaderText: {
    color:    MUTED,
    fontSize: 12,
  },

  /* Section label */
  sectionRow: {
    flexDirection: "row",
    alignItems:    "center",
    marginTop:     20,
    marginBottom:  12,
    gap:           10,
  },
  sectionLine: {
    flex:            1,
    height:          1,
    backgroundColor: BORDER,
  },
  sectionLabel: {
    color:        MUTED,
    fontSize:     9,
    fontWeight:   "700",
    letterSpacing: 2,
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           8,
  },
  kpiCard: {
    width:           "48%",
    backgroundColor:  CARD,
    borderRadius:     14,
    borderWidth:      1,
    borderColor:      BORDER,
    padding:          16,
    alignItems:       "flex-start",
    gap:              6,
  },
  kpiIconWrap: {
    width:          32,
    height:         32,
    borderRadius:   8,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   2,
  },
  kpiValue: {
    fontSize:     24,
    fontWeight:   "800",
    letterSpacing: -1,
  },
  kpiLabel: {
    color:     MUTED,
    fontSize:  11,
    lineHeight: 15,
  },

  /* Revenue card */
  revenueCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor:  GOLD + "12",
    borderRadius:     14,
    borderWidth:      1,
    borderColor:      GOLD + "30",
    padding:          18,
    marginTop:        8,
  },
  revenueLabel: {
    color:      WHITE,
    fontSize:   13,
    fontWeight: "700",
  },
  revenueNote: {
    color:     MUTED,
    fontSize:  11,
    marginTop: 3,
  },
  revenueValue: {
    color:        GOLD,
    fontSize:     22,
    fontWeight:   "800",
    letterSpacing: -0.5,
  },

  /* Bar chart */
  chartCard: {
    backgroundColor: CARD,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         16,
    gap:             14,
  },
  barRow: {
    gap: 6,
  },
  barMeta: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  barLabel: {
    color:     WHITE,
    fontSize:  12,
    fontWeight: "500",
  },
  barCount: {
    color:     MUTED,
    fontSize:  11,
  },
  barTrack: {
    height:          6,
    backgroundColor: MUTED2,
    borderRadius:    3,
    overflow:        "hidden",
  },
  barFill: {
    height:       6,
    borderRadius: 3,
    minWidth:     4,
  },

  /* Mini grid */
  miniGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           8,
    marginBottom:  8,
  },
  miniCard: {
    width:           "48%",
    backgroundColor:  CARD,
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      BORDER,
    padding:          14,
    alignItems:       "center",
  },
  miniValue: {
    color:      WHITE,
    fontSize:   20,
    fontWeight: "700",
  },
  miniLabel: {
    color:     MUTED,
    fontSize:  10,
    marginTop: 3,
  },

  /* Lead Row */
  leadRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    backgroundColor: CARD,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         14,
    marginBottom:    8,
  },
  leadInitial: {
    width:          38,
    height:         38,
    borderRadius:   10,
    backgroundColor: "#1A1A1A",
    borderWidth:    1,
    borderColor:    BORDER,
    alignItems:     "center",
    justifyContent: "center",
  },
  leadInitialText: {
    color:      WHITE,
    fontSize:   15,
    fontWeight: "600",
  },
  leadName: {
    color:      WHITE,
    fontSize:   13,
    fontWeight: "600",
  },
  leadSub: {
    color:     MUTED,
    fontSize:  11,
    marginTop: 2,
  },
  leadPhone: {
    color:     MUTED,
    fontSize:  11,
    marginTop: 1,
  },
  leadActions: {
    alignItems: "flex-end",
  },
  leadDate: {
    color:     MUTED,
    fontSize:  10,
  },
  iconBtn: {
    width:          30,
    height:         30,
    borderRadius:   8,
    borderWidth:    1,
    borderColor:    BORDER,
    backgroundColor: CARD2,
    alignItems:     "center",
    justifyContent: "center",
  },

  /* Add Property Button */
  addPropertyBtn: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: GOLD,
    borderRadius:    14,
    paddingVertical: 14,
    marginBottom:    4,
  },
  addPropertyBtnText: {
    color:      BG,
    fontSize:   14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* Property Row */
  propBlock: {
    backgroundColor: CARD,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         14,
    gap:             10,
    marginBottom:    8,
  },
  propHeader: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           8,
  },
  propTitle: {
    color:      WHITE,
    fontSize:   13,
    fontWeight: "600",
  },
  propMeta: {
    color:     MUTED,
    fontSize:  11,
    marginTop: 3,
  },
  statusBadge: {
    borderWidth:      1,
    borderRadius:     8,
    paddingHorizontal: 8,
    paddingVertical:  4,
  },
  statusBadgeText: {
    fontSize:  10,
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    gap:           6,
    flexWrap:      "wrap",
  },
  pill: {
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      BORDER,
    paddingHorizontal: 10,
    paddingVertical:  5,
    backgroundColor:  "transparent",
  },
  pillText: {
    fontSize:  10,
    fontWeight: "600",
  },

  /* Empty */
  emptyBox: {
    backgroundColor: CARD,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         32,
    alignItems:      "center",
    justifyContent:  "center",
  },
  emptyText: {
    color:     MUTED,
    fontSize:  12,
  },
});
