/**
 * SENZEDY AGENCY — src/screens/AgenceScreen.tsx
 * Page L'agence — Reproduction fidèle de senzedyagency.com/agence
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
  Linking,
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

// ── Données (textes identiques au site web) ──────────────────────────
const SERVICES_DATA = [
  { icon: "document-text-outline" as const, titleKey: "agence.serviceSale", descKey: "agence.serviceSaleDesc" },
  { icon: "people-outline" as const, titleKey: "agence.serviceRental", descKey: "agence.serviceRentalDesc" },
  { icon: "trending-up-outline" as const, titleKey: "agence.serviceInvestment", descKey: "agence.serviceInvestmentDesc" },
  { icon: "aperture-outline" as const, titleKey: "agence.serviceProjects", descKey: "agence.serviceProjectsDesc" },
];

const VALEURS_DATA = [
  { icon: "ribbon-outline" as const, titleKey: "agence.excellence", descKey: "agence.excellenceDesc" },
  { icon: "people-outline" as const, titleKey: "agence.community", descKey: "agence.communityDesc" },
  { icon: "eye-outline" as const, titleKey: "agence.vision", descKey: "agence.visionDesc" },
  { icon: "shield-checkmark-outline" as const, titleKey: "agence.integrity", descKey: "agence.integrityDesc" },
];

// CEO data removed — replaced by inline CEO section below

// ══════════════════════════════════════════════════════════════════════════
export default function AgenceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);

  const { t } = useTranslation();
  const [contactSubject, setContactSubject] = useState("");
  const openContactWith = (subject: string) => {
    setContactSubject(subject);
    setContactOpen(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("agence.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ HERO (dark, image buildings) ══════════════════════════════ */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80" }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(42,21,16,0.55)", "rgba(42,21,16,0.82)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroSubLabel}>SENZEDY AGENCY</Text>
            <Text style={styles.heroTitle}>{t("agence.heroTitle")}</Text>
            <Text style={styles.heroDesc}>
              {t("agence.heroDesc")}
            </Text>
          </View>
        </View>

        {/* ══ NOS SERVICES (cream bg) ══════════════════════════════════ */}
        <View style={styles.sectionLight}>
          <Text style={styles.subLabel}>{t("agence.servicesLabel")}</Text>
          <Text style={styles.sectionTitleSerif}>{t("agence.servicesTitle")}</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.sectionSubtitle}>
            {t("agence.servicesSubtitle")}
          </Text>

          <View style={styles.servicesGrid}>
            {SERVICES_DATA.map((s) => (
              <View key={s.titleKey} style={styles.serviceCard}>
                <View style={styles.serviceIconWrap}>
                  <Ionicons name={s.icon} size={22} color={colors.offwhite.DEFAULT} />
                </View>
                <Text style={styles.serviceTitleText}>{t(s.titleKey)}</Text>
                <Text style={styles.serviceDesc}>{t(s.descKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ KINSHASA (dark bg, image nature) ═════════════════════════ */}
        <View style={styles.kinSection}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.subLabelDark}>{t("agence.territory")}</Text>
            <Text style={styles.kinTitle}>Kinshasa</Text>
            <View style={styles.goldDividerLeft} />
            <Text style={styles.kinDesc}>
              {t("agence.kinshasaDesc")}
            </Text>
          </View>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&q=80" }}
            style={styles.kinImage}
            contentFit="cover"
          />
        </View>

        {/* ══ NOTRE HISTOIRE (white bg) ════════════════════════════════ */}
        <View style={styles.sectionLight}>
          <Text style={styles.subLabel}>{t("agence.whoWeAre")}</Text>
          <Text style={styles.sectionTitleSerif}>{t("agence.ourHistory")}</Text>
          <View style={styles.goldDivider} />

          <Text style={styles.historyText}>
            {t("agence.historyP1")}
          </Text>
          <Text style={[styles.historyText, { marginTop: 16 }]}>
            {t("agence.historyP2")}
          </Text>
          <Text style={[styles.historyText, { marginTop: 16 }]}>
            {t("agence.historyP3")}
          </Text>
        </View>

        {/* ══ NOS VALEURS (dark bg) ════════════════════════════════════ */}
        <View style={styles.sectionDark}>
          <Text style={styles.subLabelGold}>{t("agence.valuesLabel")}</Text>
          <Text style={styles.sectionTitleSerifGold}>{t("agence.valuesTitle")}</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.sectionSubtitleLight}>
            {t("agence.valuesSubtitle")}
          </Text>

          <View style={styles.servicesGrid}>
            {VALEURS_DATA.map((v) => (
              <View key={v.titleKey} style={styles.valeurCard}>
                <View style={styles.valeurIconWrap}>
                  <Ionicons name={v.icon} size={22} color={colors.gold.DEFAULT} />
                </View>
                <Text style={styles.valeurTitle}>{t(v.titleKey)}</Text>
                <Text style={styles.valeurDesc}>{t(v.descKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ CEO (dark bg, premium frame) ═══════════════════════════ */}
        <View style={styles.sectionDark}>
          <Text style={styles.subLabelGold}>{t("agence.leadershipLabel", { defaultValue: "Notre Direction" })}</Text>
          <Text style={styles.sectionTitleSerifGold}>{t("agence.leadershipTitle", { defaultValue: "L'Équipe Dirigeante" })}</Text>
          <View style={styles.goldDivider} />

          {/* CEO Card */}
          <View style={styles.ceoCard}>
            {/* Gold top border accent */}
            <View style={styles.ceoGoldBar} />

            {/* Initials avatar */}
            <View style={styles.ceoAvatarWrap}>
              <View style={styles.ceoAvatar}>
                <Text style={styles.ceoAvatarText}>YB</Text>
              </View>
            </View>

            {/* Name & Title */}
            <Text style={styles.ceoName}>YANNICK BADIBANGA</Text>
            <Text style={styles.ceoRole}>{t("agence.ceoFounderRole")}</Text>
            <View style={styles.ceoDivider} />

            {/* Story */}
            <Text style={styles.ceoQuote}>
              {t("agence.ceoQuote1")}
            </Text>
            <Text style={[styles.ceoQuote, { marginTop: 16 }]}>
              {t("agence.ceoQuote2Prefix")}{" "}
              <Text style={{ fontWeight: "700", color: colors.gold.DEFAULT }}>SENZEDY AGENCY</Text>
              {" "}{t("agence.ceoQuote2Suffix")}
            </Text>

            {/* Vision statement */}
            <View style={styles.ceoVisionBox}>
              <Text style={styles.ceoVisionTitle}>{t("agence.ceoVisionTitle")}</Text>
              <Text style={styles.ceoVisionText}>
                {t("agence.ceoVisionText")}
              </Text>
            </View>

            {/* Keywords */}
            <View style={styles.ceoKeywords}>
              <View style={styles.ceoKeywordTag}>
                <Ionicons name="trending-up-outline" size={14} color={colors.gold.DEFAULT} />
                <Text style={styles.ceoKeywordText}>{t("agence.opportunities")}</Text>
              </View>
              <View style={styles.ceoKeywordTag}>
                <Ionicons name="diamond-outline" size={14} color={colors.gold.DEFAULT} />
                <Text style={styles.ceoKeywordText}>{t("agence.exclusivity")}</Text>
              </View>
              <View style={styles.ceoKeywordTag}>
                <Ionicons name="eye-outline" size={14} color={colors.gold.DEFAULT} />
                <Text style={styles.ceoKeywordText}>{t("agence.vision")}</Text>
              </View>
            </View>

            {/* Devis CTA */}
            <View style={styles.ceoDevisWrap}>
              <View style={styles.ceoDivider} />
              <Text style={styles.ceoDevisText}>{t("agence.ourQuote")}</Text>
            </View>
          </View>
        </View>

        {/* ══ TEAM MEMBERS (dark bg) ════════════════════════════════ */}
        <View style={styles.sectionDark}>
          <Text style={styles.subLabelGold}>{t("agence.teamLabel", { defaultValue: "Notre Équipe" })}</Text>
          <View style={styles.goldDivider} />

          <View style={styles.teamGrid}>
            {[
              { initials: "HN", name: "HERVÉ NGANDU", role: t("agence.roleDirector", { defaultValue: "Directeur Général" }) },
              { initials: "AM", name: "ADDEL MABUNDA", role: t("agence.roleAdmin", { defaultValue: "Agente Administrative" }) },
              { initials: "OK", name: "OLIVIER KIAMBA", role: t("agence.roleArchitect", { defaultValue: "Architecte" }) },
            ].map((member) => (
              <View key={member.initials} style={styles.teamCard}>
                <View style={styles.teamGoldBar} />
                <View style={styles.teamCardContent}>
                  <View style={styles.teamAvatarWrap}>
                    <View style={styles.teamAvatar}>
                      <Text style={styles.teamAvatarText}>{member.initials}</Text>
                    </View>
                  </View>
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ══ CONTACTEZ-NOUS (dark bg) ═════════════════════════════════ */}
        <View style={styles.sectionDark}>
          <Text style={styles.sectionTitleSerifGold}>{t("agence.contactUs")}</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.sectionSubtitleLight}>
            {t("agence.contactSubtitle")}
          </Text>

          {/* Contact grid 2x2 */}
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL("https://wa.me/243997628617")}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.contactCardText}>+243 997 628 617</Text>
              <Text style={styles.contactCardSub}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL("tel:+243997628617")}>
              <Ionicons name="call-outline" size={24} color={colors.gold.DEFAULT} />
              <Text style={styles.contactCardText}>+243 997 628 617</Text>
              <Text style={styles.contactCardSub}>{t("agence.callLabel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL("mailto:agency.senzedy@yahoo.com")}>
              <Ionicons name="mail-outline" size={24} color={colors.gold.DEFAULT} />
              <Text style={styles.contactCardText}>agency.senzedy{"\n"}@yahoo.com</Text>
            </TouchableOpacity>
            <View style={styles.contactCard}>
              <Ionicons name="location-outline" size={24} color={colors.gold.DEFAULT} />
              <Text style={styles.contactCardText}>Quartier Domaine,{"\n"}Commune N'sele{"\n"}Dajin, Kinshasa, RDC</Text>
            </View>
          </View>

          {/* CTA Button maroon */}
          <TouchableOpacity style={styles.contactBtn} onPress={() => setContactOpen(true)}>
            <Text style={styles.contactBtnText}>{t("agence.getInTouch")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ContactModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultSubject={contactSubject || t("agence.contactSubjectDefault")}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold.DEFAULT + "40",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.gold.DEFAULT,
    fontSize: 18,
    fontFamily: fonts.serif.regular,
    fontStyle: "italic",
    letterSpacing: 1,
  },

  // ── Hero ──
  heroSection: {
    height: 260,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 24,
  },
  heroSubLabel: {
    color: colors.gold.pale,
    fontSize: 10,
    fontFamily: fonts.sans.semiBold,
    letterSpacing: 4,
    marginBottom: 10,
  },
  heroTitle: {
    color: colors.offwhite.DEFAULT,
    fontSize: 32,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    marginBottom: 12,
  },
  heroDesc: {
    color: colors.offwhite.DEFAULT,
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    lineHeight: 20,
    opacity: 0.85,
  },

  // ── Shared section styles ──
  subLabel: {
    color: colors.gold.DEFAULT,
    fontSize: 10,
    fontFamily: fonts.sans.semiBold,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 8,
  },
  subLabelDark: {
    color: colors.gold.pale,
    fontSize: 10,
    fontFamily: fonts.sans.semiBold,
    letterSpacing: 4,
    marginBottom: 8,
  },
  subLabelGold: {
    color: colors.gold.DEFAULT,
    fontSize: 10,
    fontFamily: fonts.sans.semiBold,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 8,
  },
  sectionTitleSerif: {
    fontSize: 28,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  sectionTitleSerifGold: {
    fontSize: 28,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    color: colors.gold.DEFAULT,
    textAlign: "center",
    marginBottom: 4,
  },
  goldDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold.DEFAULT,
    alignSelf: "center",
    marginVertical: 12,
  },
  goldDividerLeft: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold.DEFAULT,
    marginVertical: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionSubtitleLight: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.gold.pale,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionLight: {
    backgroundColor: colors.cream.light,
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  sectionDark: {
    backgroundColor: colors.dark.bg,
    paddingHorizontal: 20,
    paddingVertical: 36,
  },

  // ── Services ──
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  serviceCard: {
    width: (SW - 52) / 2,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.dark.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  serviceTitleText: {
    fontSize: 15,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    color: colors.text.primary,
    marginBottom: 6,
  },
  serviceDesc: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  // ── Kinshasa ──
  kinSection: {
    backgroundColor: colors.dark.bg,
    flexDirection: "row",
    padding: 24,
    gap: 16,
    minHeight: 200,
  },
  kinTitle: {
    color: colors.offwhite.DEFAULT,
    fontSize: 32,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    marginBottom: 4,
  },
  kinDesc: {
    color: colors.cream.DEFAULT,
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    lineHeight: 20,
    opacity: 0.85,
  },
  kinImage: {
    width: SW * 0.38,
    height: 180,
    borderRadius: 8,
  },

  // ── Histoire ──
  historyText: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // ── Valeurs ──
  valeurCard: {
    width: (SW - 52) / 2,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gold.DEFAULT + "15",
  },
  valeurIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.gold.DEFAULT + "30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  valeurTitle: {
    fontSize: 16,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    color: colors.offwhite.DEFAULT,
    textAlign: "center",
    marginBottom: 6,
  },
  valeurDesc: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.gold.pale,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── CEO ──
  ceoCard: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.gold.DEFAULT + "30",
    overflow: "hidden" as const,
  },
  ceoGoldBar: {
    height: 3,
    backgroundColor: colors.gold.DEFAULT,
  },
  ceoAvatarWrap: {
    alignItems: "center" as const,
    marginTop: 28,
    marginBottom: 16,
  },
  ceoAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dark.bg,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT + "60",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  ceoAvatarText: {
    fontSize: 26,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic" as const,
    color: colors.gold.DEFAULT,
  },
  ceoName: {
    fontSize: 22,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic" as const,
    color: colors.offwhite.DEFAULT,
    textAlign: "center" as const,
    letterSpacing: 2,
    marginBottom: 4,
  },
  ceoRole: {
    fontSize: 11,
    fontFamily: fonts.sans.semiBold,
    color: colors.gold.DEFAULT,
    textAlign: "center" as const,
    letterSpacing: 3,
    marginBottom: 20,
  },
  ceoDivider: {
    width: 50,
    height: 1,
    backgroundColor: colors.gold.DEFAULT + "40",
    alignSelf: "center" as const,
    marginBottom: 20,
  },
  ceoQuote: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.cream.DEFAULT,
    lineHeight: 24,
    paddingHorizontal: 24,
    opacity: 0.9,
  },
  ceoVisionBox: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold.DEFAULT,
    backgroundColor: colors.dark.bg + "80",
  },
  ceoVisionTitle: {
    fontSize: 13,
    fontFamily: fonts.sans.bold,
    color: colors.gold.DEFAULT,
    letterSpacing: 2,
    marginBottom: 10,
  },
  ceoVisionText: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.cream.DEFAULT,
    lineHeight: 22,
    opacity: 0.85,
  },
  ceoKeywords: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  ceoKeywordTag: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gold.DEFAULT + "40",
    backgroundColor: colors.dark.bg + "60",
  },
  ceoKeywordText: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.gold.DEFAULT,
    letterSpacing: 2,
  },
  ceoDevisWrap: {
    marginTop: 28,
    paddingBottom: 28,
    alignItems: "center" as const,
  },
  ceoDevisText: {
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.gold.DEFAULT,
    letterSpacing: 4,
  },

  // ── Team ──
  teamGrid: {
    gap: 12,
    paddingHorizontal: 4,
  },
  teamCard: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.gold.DEFAULT + "30",
    overflow: "hidden" as const,
    marginBottom: 4,
  },
  teamGoldBar: {
    height: 3,
    backgroundColor: colors.gold.DEFAULT,
  },
  teamCardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center" as const,
  },
  teamAvatarWrap: {
    marginBottom: 12,
  },
  teamAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.bg,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT + "60",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  teamAvatarText: {
    fontSize: 20,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic" as const,
    color: colors.gold.DEFAULT,
  },
  teamName: {
    fontSize: 16,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic" as const,
    color: colors.offwhite.DEFAULT,
    textAlign: "center" as const,
    letterSpacing: 2,
    marginBottom: 6,
  },
  teamRole: {
    fontSize: 10,
    fontFamily: fonts.sans.semiBold,
    color: colors.gold.DEFAULT,
    textAlign: "center" as const,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
  },

  // ── Contact ──
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 28,
  },
  contactCard: {
    width: (SW - 40) / 2,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gold.DEFAULT + "15",
    gap: 8,
  },
  contactCardText: {
    color: colors.offwhite.DEFAULT,
    fontSize: 13,
    fontFamily: fonts.sans.medium,
    textAlign: "center",
    lineHeight: 18,
  },
  contactCardSub: {
    color: colors.gold.pale,
    fontSize: 9,
    fontFamily: fonts.sans.medium,
    letterSpacing: 2,
  },
  contactBtn: {
    backgroundColor: colors.maroon,
    borderRadius: 0,
    paddingHorizontal: 40,
    paddingVertical: 16,
    alignSelf: "center",
  },
  contactBtnText: {
    color: colors.offwhite.DEFAULT,
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    letterSpacing: 3,
  },
});
