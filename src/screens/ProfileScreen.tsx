/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/ProfileScreen.tsx
 *  Espace membre : Profil · Historique IA · Visites
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Animated,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../hooks/useNotifications";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import type { MainStackNavProp } from "../navigation/AppNavigator";

// ─── Constantes ────────────────────────────────────────────────────────

const BG          = "#2A1510";
const SURFACE     = "#1A0F0A";
const SURFACE2    = "#221510";
const GOLD        = "#C9A87E";
const GOLD_LIGHT  = "#D4A85A";
const GOLD_DIM    = "#C9A87E40";
const RED         = "#C0392B";

// Role labels are now handled via t() calls - see getRoleLabel()

// ─── Mock data (sera remplacé par Supabase) ────────────────────────────

const MOCK_AI_HISTORY = [
  { id: "1", date: "28 fév. 2026", preview: "Quels sont les biens disponibles à Gombe ?", messages: 12 },
  { id: "2", date: "25 fév. 2026", preview: "Budget 200 000 USD — villa avec piscine", messages: 8 },
  { id: "3", date: "20 fév. 2026", preview: "Différence entre titre foncier et certificat", messages: 5 },
];

const MOCK_VISITS = [
  { id: "1", property: "Villa Prestige — Gombe", date: "3 mars 2026 à 10h00", status: "confirmé" },
  { id: "2", property: "Appartement Vue Fleuve — Lingwala", date: "7 mars 2026 à 15h30", status: "en attente" },
  { id: "3", property: "Penthouse — La Gombe", date: "12 fév. 2026 à 14h00", status: "passé" },
];

const STATUS_VISIT: Record<string, { labelKey: string; color: string; bg: string }> = {
  confirmé:    { labelKey: "profile.statusConfirmed", color: "#27AE60", bg: "#27AE6020" },
  "en attente":{ labelKey: "profile.statusPending",   color: GOLD,      bg: GOLD_DIM },
  passé:       { labelKey: "profile.statusPast",      color: "#7A6050", bg: "#7A605020" },
};

// ─── Composant principal ───────────────────────────────────────────────

type Tab = "profil" | "ia" | "visites";

export default function ProfileScreen() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const { hasPermission, requestPermission } = useNotifications(user?.id);

  // Animation header glow
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glow]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      client: t("profile.roleClient"),
      agent:  t("profile.roleAgent"),
      admin:  t("profile.roleAdmin"),
    };
    return map[role] ?? t("profile.roleClient");
  };

  const handleLogout = () => {
    Alert.alert(
      t("profile.logoutTitle"),
      t("profile.logoutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("profile.logout"), style: "destructive", onPress: signOut },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.headerWrap}>
          {/* Glow orb */}
          <Animated.View
            style={[styles.glowOrb, { opacity: glowOpacity }]}
            pointerEvents="none"
          />

          {/* Top row */}
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{t("profile.mySpace")}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={11} color={GOLD} />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>

          {/* Avatar card */}
          <View style={styles.avatarCard}>
            <LinearGradient
              colors={[GOLD, "#7A3B2E"]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>
                {profile?.full_name || t("profile.privateMember")}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {getRoleLabel(profile?.role ?? "client")}
                </Text>
              </View>
            </View>
          </View>

        </View>

        {/* ── Tabs ── */}
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* ── Sections ───────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
          {activeTab === "profil"  && <SectionProfil   profile={profile} user={user} isAdmin={isAdmin} onLogout={handleLogout} hasPermission={hasPermission} requestPermission={requestPermission} getRoleLabel={getRoleLabel} />}
          {activeTab === "ia"      && <SectionIA       />}
          {activeTab === "visites" && <SectionVisites  />}
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Section Profil ────────────────────────────────────────────────────

function SectionProfil({ profile, user, isAdmin, onLogout, hasPermission, requestPermission, getRoleLabel }: any) {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavProp>();

  return (
    <>
      {/* Infos */}
      <DarkCard>
        <Text style={styles.sectionLabel}>{t("profile.infoSection")}</Text>
        <InfoRow icon="call-outline"   label={t("profile.phone")} value={profile?.phone || t("profile.notProvided")} />
        <Separator />
        <InfoRow icon="mail-outline"   label={t("profile.email")}     value={user?.email || "—"} />
        <Separator />
        <InfoRow icon="shield-outline" label={t("profile.status")}    value={getRoleLabel(profile?.role ?? "client")} />
      </DarkCard>

      {/* Menu */}
      <DarkCard>
        <Text style={styles.sectionLabel}>{t("profile.accountSection")}</Text>
        <MenuRow icon="heart-outline"         label={t("profile.myFavorites")}     onPress={() => navigation.navigate("Favorites")} />
        <Separator />
        <MenuRow icon="document-text-outline" label={t("profile.myDocuments")}         onPress={() => navigation.navigate("Documents")} />
        <Separator />
        <MenuRow icon="settings-outline"      label={t("profile.settings")}            onPress={() => navigation.navigate("Settings")} />
        {isAdmin && (
          <>
            <Separator />
            <MenuRow icon="bar-chart-outline" label={t("profile.adminDashboard")} gold onPress={() => navigation.navigate("Admin")} />
          </>
        )}
      </DarkCard>

      {/* Notifications */}
      <SectionNotifs hasPermission={hasPermission} requestPermission={requestPermission} />

      {/* Déconnexion */}
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={19} color={RED} />
        <Text style={styles.logoutText}>{t("profile.logout")}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>{t("profile.version")}</Text>
    </>
  );
}

// ─── Section Notifications ─────────────────────────────────────────────

const NOTIF_KEYS = {
  properties: "@senzedy/notif_properties",
  ai:         "@senzedy/notif_ai",
};

function SectionNotifs({ hasPermission, requestPermission }: {
  hasPermission:    boolean;
  requestPermission: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [notifProps, setNotifProps] = useState(false);
  const [notifAI,    setNotifAI]    = useState(false);

  // Charger les préférences sauvegardées
  useEffect(() => {
    AsyncStorage.multiGet([NOTIF_KEYS.properties, NOTIF_KEYS.ai]).then((vals) => {
      setNotifProps(vals[0][1] === "true");
      setNotifAI(vals[1][1] === "true");
    });
  }, []);

  const toggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    if (value && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          t("profile.notifDisabled"),
          t("profile.notifDisabledDesc")
        );
        return;
      }
    }
    setter(value);
    await AsyncStorage.setItem(key, String(value));
  };

  return (
    <DarkCard>
      <Text style={styles.sectionLabel}>{t("profile.notifSection")}</Text>

      {/* Switch : Nouveaux biens */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
        <View style={styles.rowIcon}>
          <Ionicons name="home-outline" size={16} color={notifProps ? GOLD : "#7A6050"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowValue, { color: notifProps ? "#D4C4A8" : "#4A3020" }]}>
            {t("profile.notifProperties")}
          </Text>
          <Text style={styles.rowLabel}>{t("profile.notifPropertiesDesc")}</Text>
        </View>
        <Switch
          value={notifProps}
          onValueChange={(v) => toggle(NOTIF_KEYS.properties, v, setNotifProps)}
          trackColor={{ false: "#2A1810", true: GOLD + "60" }}
          thumbColor={notifProps ? GOLD : "#3A2010"}
          ios_backgroundColor="#150A06"
        />
      </View>

      <Separator />

      {/* Switch : Messages IA */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
        <View style={styles.rowIcon}>
          <Text style={{ fontSize: 14, color: notifAI ? GOLD : "#7A6050" }}>✦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowValue, { color: notifAI ? "#D4C4A8" : "#4A3020" }]}>
            {t("profile.notifAI")}
          </Text>
          <Text style={styles.rowLabel}>{t("profile.notifAIDesc")}</Text>
        </View>
        <Switch
          value={notifAI}
          onValueChange={(v) => toggle(NOTIF_KEYS.ai, v, setNotifAI)}
          trackColor={{ false: "#2A1810", true: GOLD + "60" }}
          thumbColor={notifAI ? GOLD : "#3A2010"}
          ios_backgroundColor="#150A06"
        />
      </View>

      {!hasPermission && (notifProps || notifAI) && (
        <View style={styles.notifWarning}>
          <Ionicons name="information-circle-outline" size={13} color={GOLD} />
          <Text style={styles.notifWarningText}>
            {t("profile.notifWarning")}
          </Text>
        </View>
      )}
    </DarkCard>
  );
}

// ─── Section Historique IA ─────────────────────────────────────────────

function SectionIA() {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavProp>();
  if (MOCK_AI_HISTORY.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ fontSize: 32 }}>✦</Text>
        <Text style={styles.emptyTitle}>{t("profile.noConversation")}</Text>
        <Text style={styles.emptySubtitle}>{t("profile.conversationsHere")}</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionHeader}>{t("profile.recentConversations")}</Text>
      {MOCK_AI_HISTORY.map((item) => (
        <TouchableOpacity key={item.id} style={styles.iaCard} activeOpacity={0.75} onPress={() => navigation.navigate("AIChat")}>
          <View style={styles.iaIconWrap}>
            <Text style={{ fontSize: 16 }}>✦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.iaPreview} numberOfLines={2}>{item.preview}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text style={styles.iaMeta}>{item.date}</Text>
              <Text style={styles.iaDot}>·</Text>
              <Text style={styles.iaMeta}>{item.messages} {t("profile.messages")}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#4A3020" />
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── Section Visites ───────────────────────────────────────────────────

function SectionVisites() {
  const { t } = useTranslation();
  const navigation = useNavigation<MainStackNavProp>();
  return (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionHeader}>{t("profile.visitRequests")}</Text>
        <TouchableOpacity style={styles.newVisitBtn} onPress={() => navigation.navigate("Contact")}>
          <Ionicons name="add" size={14} color={GOLD} />
          <Text style={styles.newVisitText}>{t("profile.request")}</Text>
        </TouchableOpacity>
      </View>

      {MOCK_VISITS.map((item) => {
        const s = STATUS_VISIT[item.status] ?? STATUS_VISIT["passé"];
        return (
          <View key={item.id} style={styles.visitCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.visitProperty}>{item.property}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 }}>
                <Ionicons name="calendar-outline" size={12} color="#7A6050" />
                <Text style={styles.visitDate}>{item.date}</Text>
              </View>
            </View>
            <View style={[styles.visitStatus, { backgroundColor: s.bg }]}>
              <Text style={[styles.visitStatusText, { color: s.color }]}>{t(s.labelKey)}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

// ─── Petits composants ─────────────────────────────────────────────────

function DarkCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.darkCard}>{children}</View>;
}

function ProfileTabs({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const { t } = useTranslation();
  const tabs: { key: Tab; label: string }[] = [
    { key: "profil", label: t("profile.tabProfile") },
    { key: "ia", label: t("profile.tabAI") },
    { key: "visites", label: t("profile.tabVisits") },
  ];

  // On web, use a separate state-driven approach to ensure clicks work
  const handlePress = React.useCallback((key: Tab) => {
    setActiveTab(key);
  }, [setActiveTab]);

  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.6}
            onPress={() => handlePress(t.key)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? GOLD : "transparent",
            }}
          >
            <Text style={{
              color: isActive ? GOLD : "#4A3020",
              fontSize: 13,
              fontWeight: "600",
              letterSpacing: 0.5,
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label, gold, onPress }: { icon: any; label: string; gold?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={gold ? GOLD : "#7A6050"} />
      </View>
      <Text style={[styles.rowValue, { flex: 1, color: gold ? GOLD : "#D4C4A8" }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="#4A3020" />
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={{ height: 1, backgroundColor: "#2A1810", marginLeft: 52 }} />;
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Header */
  headerWrap: {
    backgroundColor: "#150A06",
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 0,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A1810",
  },
  glowOrb: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: GOLD,
    zIndex: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#D4C4A8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GOLD_DIM,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: GOLD + "50",
  },
  adminBadgeText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* Avatar card */
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: GOLD + "60",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
  },
  profileName: {
    color: "#FAF7F2",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  profileEmail: {
    color: "#7A6050",
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: GOLD_DIM,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: GOLD + "40",
  },
  roleBadgeText: {
    color: GOLD_LIGHT,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#150A06",
    borderBottomWidth: 1,
    borderBottomColor: "#2A1810",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: GOLD,
  },
  tabText: {
    color: "#4A3020",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: GOLD,
  },

  /* Cards */
  darkCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2A1810",
  },
  sectionLabel: {
    color: "#4A3020",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeader: {
    color: "#7A6050",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },

  /* Row items */
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: "#4A3020",
    fontSize: 10,
    marginBottom: 1,
    letterSpacing: 0.5,
  },
  rowValue: {
    color: "#D4C4A8",
    fontSize: 13,
    fontWeight: "500",
  },

  /* Logout */
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: RED + "12",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: RED + "30",
  },
  logoutText: {
    color: RED,
    fontWeight: "600",
    fontSize: 14,
  },
  version: {
    color: "#3A2010",
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  /* Notification warning */
  notifWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: GOLD + "12",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: GOLD + "30",
  },
  notifWarningText: {
    flex: 1,
    color: GOLD,
    fontSize: 11,
    lineHeight: 15,
  },

  /* IA */
  iaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A1810",
  },
  iaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GOLD_DIM,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD + "40",
  },
  iaPreview: {
    color: "#D4C4A8",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  iaMeta: {
    color: "#4A3020",
    fontSize: 11,
  },
  iaDot: {
    color: "#3A2010",
  },

  /* Visites */
  visitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A1810",
  },
  visitProperty: {
    color: "#D4C4A8",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  visitDate: {
    color: "#4A3020",
    fontSize: 11,
  },
  visitStatus: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  visitStatusText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  newVisitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GOLD_DIM,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: GOLD + "50",
  },
  newVisitText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "600",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: "#D4C4A8",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#4A3020",
    fontSize: 13,
    textAlign: "center",
  },
});
