/**
 * SENZEDY AGENCY — src/screens/KinbnbScreen.tsx
 * Kinbnb — Location à la nuitée + Gestion locative (JeLoue)
 * Reproduction fidèle de senzedyagency.com/Kinbnb
 */

import { useTranslation } from "react-i18next";
import React, { useState, createContext, useContext } from "react";
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

const KinbnbContactCtx = createContext<{ open: (subject: string) => void }>({ open: () => {} });

type TabKey = "nuitee" | "gestion";

export default function KinbnbScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("nuitee");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");

  const openContact = (subject: string) => {
    setContactSubject(subject);
    setContactOpen(true);
  };

  return (
    <KinbnbContactCtx.Provider value={{ open: openContact }}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t("kinbnb.title")}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={s.tabBar}>
          <TouchableOpacity
            style={[s.tabBtn, tab === "nuitee" && s.tabBtnActive]}
            onPress={() => setTab("nuitee")}
          >
            <Ionicons name="bed-outline" size={16} color={tab === "nuitee" ? colors.offwhite.DEFAULT : colors.gold.pale} />
            <Text style={[s.tabText, tab === "nuitee" && s.tabTextActive]}>{t("kinbnb.tabNightly")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, tab === "gestion" && s.tabBtnActive]}
            onPress={() => setTab("gestion")}
          >
            <Ionicons name="key-outline" size={16} color={tab === "gestion" ? colors.offwhite.DEFAULT : colors.gold.pale} />
            <Text style={[s.tabText, tab === "gestion" && s.tabTextActive]}>{t("kinbnb.tabManagement")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} key={tab}>
          {tab === "nuitee" ? <NuiteeTab /> : <GestionTab />}
          <View style={{ height: 40 }} />
        </ScrollView>

        <ContactModal
          visible={contactOpen}
          onClose={() => setContactOpen(false)}
          defaultSubject={contactSubject}
        />
      </View>
    </KinbnbContactCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 : LOCATION À LA NUITÉE
// ═══════════════════════════════════════════════════════════════════════
function NuiteeTab() {
  const { open } = useContext(KinbnbContactCtx);
  const { t } = useTranslation();
  return (
    <>
      {/* Hero */}
      <View style={{ height: 260, justifyContent: "flex-end" }}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80" }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient colors={["rgba(42,21,16,0.4)", "rgba(42,21,16,0.85)"]} style={StyleSheet.absoluteFillObject} />
        <View style={{ padding: 24 }}>
          <Text style={s.heroSubLabel}>{t("kinbnb.nightlyLabel")}</Text>
          <Text style={s.heroTitle}>{t("kinbnb.nightlyTitle")}</Text>
          <Text style={s.heroDesc}>{t("kinbnb.nightlyDesc")}</Text>
        </View>
      </View>

      {/* Count + filter bar */}
      <View style={s.filterBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="bed-outline" size={18} color={colors.text.primary} />
          <Text style={s.filterCount}>{t("kinbnb.availableCount")}</Text>
        </View>
        <View style={s.filterPill}>
          <Ionicons name="funnel-outline" size={14} color={colors.text.primary} />
          <Text style={s.filterPillText}>{t("kinbnb.filtersLabel")}</Text>
        </View>
      </View>

      {/* Empty state */}
      <View style={s.emptyState}>
        <Ionicons name="bed-outline" size={56} color={colors.border.DEFAULT} />
        <Text style={s.emptyTitle}>{t("kinbnb.noAccommodation")}</Text>
        <Text style={s.emptyDesc}>{t("kinbnb.comingSoon")}</Text>
      </View>

      {/* CTA */}
      <View style={s.sectionLight}>
        <Text style={s.subLabel}>{t("kinbnb.reservationLabel")}</Text>
        <Text style={s.titleSerif}>{t("kinbnb.needAccommodation")}</Text>
        <View style={s.goldDivider} />
        <Text style={s.subtitle}>{t("kinbnb.reservationSubtitle")}</Text>
        <TouchableOpacity style={s.ctaMaroon} onPress={() => open(t("kinbnb.contactSubjectNightly"))}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={s.ctaText}>{t("kinbnb.bookNow")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 : GESTION LOCATIVE (JELOUE)
// ═══════════════════════════════════════════════════════════════════════
function GestionTab() {
  const { open } = useContext(KinbnbContactCtx);
  const { t } = useTranslation();
  return (
    <>
      {/* Hero */}
      <View style={s.heroSectionCenter}>
        <LinearGradient colors={[colors.dark.bg, colors.dark.surface2]} style={StyleSheet.absoluteFillObject} />
        <View style={s.heroContentCenter}>
          <Text style={s.heroSubLabel}>{t("kinbnb.managementLabel")}</Text>
          <Text style={s.heroTitleGold}>{t("kinbnb.managementTitle")}</Text>
          <Text style={s.heroDescCenter}>
            {t("kinbnb.managementDesc")}
          </Text>

          {/* Standing pills */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <View style={[s.standingPill, s.standingPillActive]}>
              <Text style={s.standingTextActive}>{t("kinbnb.allProperties")}</Text>
            </View>
            <View style={s.standingPill}>
              <Text style={s.standingText}>{t("kinbnb.standardStanding")}</Text>
            </View>
            <View style={s.standingPill}>
              <Text style={s.standingText}>{t("kinbnb.premium")}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Count + filter bar */}
      <View style={s.filterBar}>
        <View style={s.filterPill}>
          <Ionicons name="funnel-outline" size={14} color={colors.text.primary} />
          <Text style={s.filterPillText}>{t("kinbnb.filtersLabel")}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.text.primary} />
        </View>
        <Text style={s.filterCountRight}>{t("kinbnb.listingsCount")}</Text>
      </View>

      {/* Empty state */}
      <View style={s.emptyState}>
        <Ionicons name="search-outline" size={56} color={colors.border.DEFAULT} />
        <Text style={s.emptyTitle}>{t("kinbnb.noResults")}</Text>
        <Text style={s.emptyDesc}>{t("kinbnb.adjustFilters")}</Text>
        <TouchableOpacity style={s.resetBtn}>
          <Text style={s.resetText}>{t("kinbnb.resetLabel")}</Text>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <View style={s.sectionLight}>
        <Text style={s.subLabel}>{t("kinbnb.ownerLabel")}</Text>
        <Text style={s.titleSerif}>{t("kinbnb.trustUs")}</Text>
        <View style={s.goldDivider} />
        <Text style={s.subtitle}>
          {t("kinbnb.trustUsDesc")}
        </Text>
        <TouchableOpacity style={s.ctaMaroon} onPress={() => open(t("kinbnb.contactSubjectManagement"))}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={s.ctaText}>{t("kinbnb.contactUs")}</Text>
        </TouchableOpacity>
      </View>
    </>
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

  tabBar: { flexDirection: "row", backgroundColor: colors.dark.bg, paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.gold.DEFAULT + "40",
    backgroundColor: colors.dark.surface,
  },
  tabBtnActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  tabText: { color: colors.gold.pale, fontSize: 13, fontFamily: fonts.sans.semiBold },
  tabTextActive: { color: colors.offwhite.DEFAULT },

  // Hero
  heroSubLabel: { color: colors.gold.pale, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, marginBottom: 10 },
  heroTitle: { color: colors.offwhite.DEFAULT, fontSize: 28, fontFamily: fonts.serif.italic, fontStyle: "italic", marginBottom: 8 },
  heroDesc: { color: colors.offwhite.DEFAULT, fontSize: 13, fontFamily: fonts.sans.regular, opacity: 0.85, lineHeight: 20 },
  heroSectionCenter: { height: 300, justifyContent: "center", alignItems: "center" },
  heroContentCenter: { alignItems: "center", padding: 24 },
  heroTitleGold: { color: colors.offwhite.DEFAULT, fontSize: 26, fontFamily: fonts.serif.italic, fontStyle: "italic", textAlign: "center", marginBottom: 10 },
  heroDescCenter: { color: colors.gold.pale, fontSize: 13, fontFamily: fonts.sans.regular, textAlign: "center", lineHeight: 20 },

  // Standing pills
  standingPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: colors.gold.DEFAULT + "40" },
  standingPillActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  standingText: { color: colors.offwhite.DEFAULT, fontSize: 11, fontFamily: fonts.sans.bold, letterSpacing: 1.5 },
  standingTextActive: { color: colors.offwhite.DEFAULT, fontSize: 11, fontFamily: fonts.sans.bold, letterSpacing: 1.5 },

  // Filter bar
  filterBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.cream.DEFAULT, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border.DEFAULT },
  filterPillText: { fontSize: 11, fontFamily: fonts.sans.bold, color: colors.text.primary, letterSpacing: 2 },
  filterCount: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.text.primary, letterSpacing: 1.5 },
  filterCountRight: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.text.secondary, letterSpacing: 1 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 22, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary },
  resetBtn: { backgroundColor: colors.maroon + "20", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  resetText: { fontSize: 11, fontFamily: fonts.sans.bold, color: colors.maroon, letterSpacing: 2 },

  // Shared
  goldDivider: { width: 40, height: 2, backgroundColor: colors.gold.DEFAULT, alignSelf: "center", marginVertical: 14 },
  subLabel: { color: colors.gold.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  titleSerif: { fontSize: 26, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, textAlign: "center", marginBottom: 24 },
  sectionLight: { backgroundColor: colors.cream.light, paddingHorizontal: 20, paddingVertical: 36 },
  ctaMaroon: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.maroon, paddingHorizontal: 28, paddingVertical: 16, alignSelf: "center" },
  ctaText: { color: colors.offwhite.DEFAULT, fontSize: 12, fontFamily: fonts.sans.bold, letterSpacing: 2 },
});
