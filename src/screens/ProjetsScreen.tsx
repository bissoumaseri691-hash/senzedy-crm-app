/**
 * SENZEDY AGENCY — src/screens/ProjetsScreen.tsx
 * Reproduction fidèle de senzedyagency.com/Projets
 */

import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import ContactModal from "../components/ContactModal";

const { width: SW } = Dimensions.get("window");

const PROJETS = [
  {
    id: "1", title: "Résidence Les Palmiers", location: "Gombe, Kinshasa",
    type: "Appartement", status: "en_cours", statusLabel: "En construction",
    statusColor: "#D4A85A", prix: "À partir de: 85 M CDF",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    desc: "Complexe résidentiel de standing avec vue panoramique sur le fleuve Congo.",
  },
  {
    id: "2", title: "Domaine Vert de N'sele", location: "N'sele, Kinshasa",
    type: "Villa", status: "a_venir", statusLabel: "À venir",
    statusColor: "#25D366", prix: "À partir de: 120 M CDF",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    desc: "Villas individuelles dans un cadre verdoyant avec toutes les commodités modernes.",
  },
  {
    id: "3", title: "Tower Business Center", location: "Limete, Kinshasa",
    type: "Bureau", status: "a_venir", statusLabel: "Phase d'étude",
    statusColor: colors.text.muted, prix: "Sur demande",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    desc: "Bureaux et espaces commerciaux modernes au cœur de Limete.",
  },
];

export default function ProjetsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");

  const FILTERS = [
    { key: "all",      label: t("projets.filterAll") },
    { key: "en_cours", label: t("projets.filterConstruction") },
    { key: "a_venir",  label: t("projets.filterUpcoming") },
    { key: "livre",    label: t("projets.filterDelivered") },
  ];

  const AVANTAGES = [
    { icon: "trending-up-outline" as const, title: t("projets.bestPrices"), desc: t("projets.bestPricesDesc") },
    { icon: "document-text-outline" as const, title: t("projets.verifiedProjects"), desc: t("projets.verifiedProjectsDesc") },
    { icon: "people-outline" as const, title: t("projets.fullSupport"), desc: t("projets.fullSupportDesc") },
  ];

  const filtered = filter === "all" ? PROJETS : PROJETS.filter((p) => p.status === filter);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("projets.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <View style={s.heroSection}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80" }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={["rgba(42,21,16,0.4)", "rgba(42,21,16,0.85)"]} style={StyleSheet.absoluteFillObject} />
          <View style={s.heroContent}>
            <Text style={s.heroSubLabel}>{t("projets.heroLabel")}</Text>
            <Text style={s.heroTitle}>{t("projets.heroTitle")}</Text>
            <View style={s.goldDivider} />
            <Text style={s.heroDesc}>
              {t("projets.heroDesc")}
            </Text>
          </View>
        </View>

        {/* ══ FILTER PILLS ══════════════════════════════════════ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 10 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.key} style={[s.filterPill, filter === f.key && s.filterPillActive]} onPress={() => setFilter(f.key)}>
              <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ══ PROJETS ═══════════════════════════════════════════ */}
        <View style={s.sectionLight}>
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.text.secondary, marginBottom: 16 }}>
            {t("projets.projectsCount", { count: filtered.length })}
          </Text>

          {filtered.map((p) => (
            <View key={p.id} style={s.projetCard}>
              <View style={{ height: 200, position: "relative" }}>
                <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                <View style={[s.badge, { backgroundColor: p.statusColor }]}>
                  <Text style={s.badgeText}>{p.statusLabel}</Text>
                </View>
              </View>
              <View style={s.projetBody}>
                <Text style={s.projetType}>{p.type} — Kinshasa</Text>
                <Text style={s.projetTitle}>{p.title}</Text>
                <Text style={s.projetPrix}>{p.prix}</Text>
                <Text style={s.projetDesc}>{p.desc}</Text>
                <View style={s.divider} />
                <View style={s.projetFooter}>
                  <TouchableOpacity onPress={() => { setContactSubject(`Projet - ${p.title}`); setContactOpen(true); }}>
                    <Text style={s.footerLink}>{t("projets.contactAgent")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => { setContactSubject(`Projet - ${p.title}`); setContactOpen(true); }}>
                    <Text style={s.footerLinkGold}>{t("common.discover")}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.gold.DEFAULT} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ══ POURQUOI INVESTIR (dark) ══════════════════════════ */}
        <View style={s.sectionDark}>
          <Text style={s.subLabelGold}>{t("projets.advantagesLabel")}</Text>
          <Text style={s.titleSerifGold}>{t("projets.advantagesTitle")}</Text>
          <View style={s.goldDivider} />

          <View style={{ gap: 16, marginTop: 8 }}>
            {AVANTAGES.map((a) => (
              <View key={a.title} style={s.avCard}>
                <View style={s.avIcon}>
                  <Ionicons name={a.icon} size={22} color={colors.offwhite.DEFAULT} />
                </View>
                <Text style={s.avTitle}>{a.title}</Text>
                <Text style={s.avDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ CTA ═══════════════════════════════════════════════ */}
        <View style={s.sectionLight}>
          <Text style={s.subLabel}>{t("projets.ctaLabel")}</Text>
          <Text style={s.titleSerif}>{t("projets.ctaTitle")}</Text>
          <View style={s.goldDivider} />
          <Text style={s.subtitle}>{t("projets.ctaSubtitle")}</Text>
          <TouchableOpacity style={s.ctaMaroon} onPress={() => { setContactSubject("Projets immobiliers"); setContactOpen(true); }}>
            <Text style={s.ctaText}>{t("projets.ctaButton")}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ContactModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultSubject={contactSubject || t("projets.contactSubject")}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream.DEFAULT },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.dark.surface, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: colors.gold.DEFAULT + "40",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.gold.DEFAULT, fontSize: 18, fontFamily: fonts.serif.italic, fontStyle: "italic", letterSpacing: 1 },

  heroSection: { height: 300, justifyContent: "center", alignItems: "center" },
  heroContent: { alignItems: "center", padding: 24 },
  heroSubLabel: { color: colors.gold.pale, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, marginBottom: 12 },
  heroTitle: { color: colors.offwhite.DEFAULT, fontSize: 34, fontFamily: fonts.serif.italic, fontStyle: "italic", textAlign: "center" },
  heroDesc: { color: colors.offwhite.DEFAULT, fontSize: 13, fontFamily: fonts.sans.regular, textAlign: "center", opacity: 0.85, lineHeight: 20 },

  goldDivider: { width: 40, height: 2, backgroundColor: colors.gold.DEFAULT, alignSelf: "center", marginVertical: 14 },
  subLabel: { color: colors.gold.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  subLabelGold: { color: colors.gold.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  titleSerif: { fontSize: 26, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, textAlign: "center", marginBottom: 4 },
  titleSerifGold: { fontSize: 26, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.gold.DEFAULT, textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, textAlign: "center", marginBottom: 24 },
  sectionLight: { backgroundColor: colors.cream.light, paddingHorizontal: 20, paddingVertical: 32 },
  sectionDark: { backgroundColor: colors.dark.bg, paddingHorizontal: 20, paddingVertical: 36 },

  filterPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border.DEFAULT, backgroundColor: colors.offwhite.pure },
  filterPillActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  filterText: { fontSize: 11, fontFamily: fonts.sans.bold, color: colors.text.primary, letterSpacing: 1.5 },
  filterTextActive: { color: colors.offwhite.DEFAULT },

  projetCard: { backgroundColor: colors.offwhite.pure, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: 20 },
  badge: { position: "absolute", top: 12, left: 12, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.dark.bg, fontSize: 10, fontFamily: fonts.sans.bold, letterSpacing: 1 },
  projetBody: { padding: 20 },
  projetType: { fontSize: 10, fontFamily: fonts.sans.semiBold, color: colors.gold.DEFAULT, letterSpacing: 2, marginBottom: 6 },
  projetTitle: { fontSize: 20, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, marginBottom: 6 },
  projetPrix: { fontSize: 13, fontFamily: fonts.sans.semiBold, color: colors.text.secondary, marginBottom: 8 },
  projetDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border.DEFAULT, marginVertical: 14 },
  projetFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLink: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.text.secondary },
  footerLinkGold: { fontSize: 12, fontFamily: fonts.sans.semiBold, color: colors.gold.DEFAULT },

  avCard: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.gold.DEFAULT + "20", borderRadius: 12 },
  avIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.maroon, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avTitle: { fontSize: 18, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.gold.DEFAULT, textAlign: "center", marginBottom: 8 },
  avDesc: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.gold.pale, textAlign: "center", lineHeight: 18 },

  ctaMaroon: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.maroon, paddingHorizontal: 28, paddingVertical: 16, alignSelf: "center" },
  ctaText: { color: colors.offwhite.DEFAULT, fontSize: 12, fontFamily: fonts.sans.bold, letterSpacing: 2.5 },
});
