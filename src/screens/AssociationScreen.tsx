/**
 * SENZEDY AGENCY — src/screens/AssociationScreen.tsx
 * Page HNC La Main de l'Espoir — Association humanitaire
 */

import React from "react";
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
import { useTranslation } from "react-i18next";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const { width: SW } = Dimensions.get("window");

// ── Missions court terme ──
const MISSIONS_CT = [
  {
    icon: "heart-outline" as const,
    titleFr: "Hygiène féminine",
    titleEn: "Women's Hygiene",
    descFr: "Fournir des produits d'hygiène aux femmes qui ne sont pas en mesure de s'en procurer : serviettes hygiéniques, savons intimes, déodorants et préservatifs.",
    descEn: "Provide hygiene products to women who cannot afford them: sanitary pads, intimate soaps, deodorants and condoms.",
  },
  {
    icon: "people-outline" as const,
    titleFr: "Prévention & Sensibilisation",
    titleEn: "Prevention & Awareness",
    descFr: "Campagnes de prévention, de sensibilisation et d'éducation aux femmes sur l'importance des moyens de contraception et l'utilisation des préservatifs afin de prévenir les MST.",
    descEn: "Prevention, awareness and education campaigns for women on the importance of contraception and condom use to prevent STDs.",
  },
  {
    icon: "gift-outline" as const,
    titleFr: "Kits post-accouchement",
    titleEn: "Post-birth Kits",
    descFr: "Fournir des kits post-accouchements aux femmes avec peu de moyens à la sortie de la maternité : vêtements bébés, couches, biberons, tétines, couvertures, coussinets d'allaitement…",
    descEn: "Provide post-birth kits to women with limited means leaving maternity: baby clothes, diapers, bottles, pacifiers, blankets, nursing pads...",
  },
  {
    icon: "home-outline" as const,
    titleFr: "Aide aux orphelinats",
    titleEn: "Orphanage Support",
    descFr: "Apporter de l'aide matérielle, financière et alimentaire aux enfants des orphelinats. Participer à leur développement personnel et à leur éducation.",
    descEn: "Provide material, financial and food aid to orphanage children. Participate in their personal development and education.",
  },
  {
    icon: "hand-left-outline" as const,
    titleFr: "Présence humaine",
    titleEn: "Human Presence",
    descFr: "Établir une relation de confiance, une écoute et apporter une présence humaine à ces femmes et enfants souvent seuls, livrés à eux-mêmes sans repère.",
    descEn: "Establish a trusting relationship, listen and provide a human presence to these women and children who are often alone.",
  },
];

// ── Missions long terme ──
const MISSIONS_LT = [
  {
    icon: "business-outline" as const,
    titleFr: "Centre de suivi gynécologique",
    titleEn: "Gynecological Care Center",
    descFr: "Ouverture d'un établissement permettant aux femmes de bénéficier d'un suivi gynécologique, d'un accompagnement social et d'un lieu d'échange et d'écoute.",
    descEn: "Opening a facility where women can receive gynecological care, social support, and a place for exchange and listening.",
  },
  {
    icon: "globe-outline" as const,
    titleFr: "Expansion en Afrique",
    titleEn: "African Expansion",
    descFr: "Approfondir et élargir notre aide aux orphelinats du Congo RDC et étendre notre collaboration dans d'autres pays d'Afrique.",
    descEn: "Deepen and expand our aid to orphanages in Congo DRC and extend our collaboration to other African countries.",
  },
  {
    icon: "school-outline" as const,
    titleFr: "Formation professionnelle",
    titleEn: "Professional Training",
    descFr: "Accompagner les enfants à l'enseignement et à la formation professionnelle en collaboration avec les autorités compétentes.",
    descEn: "Support children in education and vocational training in collaboration with competent authorities.",
  },
  {
    icon: "people-circle-outline" as const,
    titleFr: "Centre d'accueil de jour",
    titleEn: "Day Care Center",
    descFr: "Ouvrir un centre d'accueil de jour pour les enfants de la rue.",
    descEn: "Open a day care center for street children.",
  },
];

// ── Réseaux sociaux ──
const SOCIALS = [
  { icon: "logo-facebook" as const, label: "Facebook", handle: "HNC la main de l'espoir", url: "https://www.facebook.com/profile.php?id=61575726498498" },
  { icon: "logo-tiktok" as const, label: "TikTok", handle: "@hnc.lamaindelespoir", url: "https://www.tiktok.com/@hnc.lamaindelespoir" },
  { icon: "mail-outline" as const, label: "Email", handle: "HNC.lamaindelespoir@hotmail.com", url: "mailto:HNC.lamaindelespoir@hotmail.com" },
];

export default function AssociationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";

  const openUrl = (url: string) => Linking.openURL(url);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Association</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ HERO ══ */}
        <View style={s.heroSection}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1603998382124-c9835bf50409?w=900&q=80" }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(42,21,16,0.85)", "rgba(14,7,5,0.92)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.heroContent}>
            {/* Logo */}
            <View style={s.logoCircle}>
              <Image
                source={require("../../assets/images/logo-hnc.jpg")}
                style={s.logoImg}
                contentFit="contain"
              />
            </View>

            <Text style={s.heroLabel}>
              {fr ? "ASSOCIATION HUMANITAIRE" : "HUMANITARIAN ASSOCIATION"}
            </Text>
            <Text style={s.heroTitle}>HNC</Text>
            <Text style={s.heroSubtitle}>
              {fr ? "La Main de l'Espoir" : "The Hand of Hope"}
            </Text>
            <Text style={s.heroDesc}>
              {fr
                ? "Huguette, Nadia et Carine — trois femmes unies par la volonté de tendre leurs mains à ceux qui en ont le plus besoin."
                : "Huguette, Nadia and Carine — three women united by the desire to extend their hands to those who need it most."}
            </Text>

            {/* CTA Don */}
            <TouchableOpacity
              style={s.ctaBtn}
              activeOpacity={0.8}
              onPress={() => openUrl("https://www.paypal.me/hnclamaindelespoir")}
            >
              <Ionicons name="heart" size={18} color={colors.offwhite.DEFAULT} />
              <Text style={s.ctaBtnText}>
                {fr ? "FAIRE UN DON" : "DONATE"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ POURQUOI HNC ══ */}
        <View style={s.sectionLight}>
          <Text style={s.sectionLabel}>{fr ? "NOTRE HISTOIRE" : "OUR STORY"}</Text>
          <View style={s.goldLine} />
          <Text style={s.sectionTitle}>{fr ? "Pourquoi HNC ?" : "Why HNC?"}</Text>
          <Text style={s.sectionBody}>
            {fr
              ? "HNC, ce sont les initiales de Huguette, Nadia et Carine. La Main de l'Espoir, car nous voulons tendre nos mains à ceux qui en ont le plus besoin. La main, c'est avec elle que nous donnons et que nous recevons. Elle permet d'être solidaire, de soutenir et répondre aux besoins fondamentaux des personnes."
              : "HNC are the initials of Huguette, Nadia and Carine. The Hand of Hope, because we want to reach out to those who need it most. The hand is what we give and receive with. It allows us to show solidarity, support and meet people's fundamental needs."}
          </Text>

          {/* Founders */}
          <View style={s.foundersRow}>
            {[
              { letter: "H", name: "Huguette" },
              { letter: "N", name: "Nadia" },
              { letter: "C", name: "Carine" },
            ].map((f) => (
              <View key={f.letter} style={s.founderItem}>
                <View style={s.founderCircle}>
                  <Text style={s.founderLetter}>{f.letter}</Text>
                </View>
                <Text style={s.founderName}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ OBJECTIF ══ */}
        <View style={s.sectionCream}>
          <View style={s.iconSquare}>
            <Ionicons name="heart" size={18} color={colors.gold.DEFAULT} />
          </View>
          <Text style={s.sectionTitle}>{fr ? "Notre objectif" : "Our Goal"}</Text>
          <View style={s.goldLine} />
          <Text style={s.sectionBody}>
            {fr
              ? "Contribuer à l'amélioration du quotidien des personnes en difficulté. Nous n'arrêterons pas la pauvreté mais nous pouvons contribuer à l'amélioration de la qualité de vie de certains démunis. Soyons des altruistes."
              : "Contribute to improving the daily lives of people in difficulty. We will not stop poverty but we can contribute to improving the quality of life of some of the underprivileged. Let's be altruists."}
          </Text>
          <View style={s.quoteBox}>
            <Text style={s.quoteText}>
              {fr
                ? "« L'altruiste est un être dévoué et charitable qui n'attend jamais rien en retour de sa bonté »"
                : '"The altruist is a devoted and charitable person who never expects anything in return for their kindness"'}
            </Text>
          </View>
        </View>

        {/* ══ MISSIONS COURT TERME ══ */}
        <View style={s.sectionLight}>
          <Text style={s.sectionLabel}>{fr ? "NOS MISSIONS" : "OUR MISSIONS"}</Text>
          <View style={s.goldLine} />
          <Text style={s.sectionTitle}>{fr ? "À court terme" : "Short Term"}</Text>

          <View style={s.missionsList}>
            {MISSIONS_CT.map((m, i) => (
              <View key={i} style={s.missionRow}>
                <Text style={s.missionNum}>{String(i + 1).padStart(2, "0")}</Text>
                <View style={s.missionIconBox}>
                  <Ionicons name={m.icon} size={18} color={colors.gold.DEFAULT} />
                </View>
                <View style={s.missionTextCol}>
                  <Text style={s.missionTitle}>{fr ? m.titleFr : m.titleEn}</Text>
                  <Text style={s.missionDesc}>{fr ? m.descFr : m.descEn}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ══ MISSIONS LONG TERME ══ */}
        <View style={s.sectionDark}>
          <Text style={s.sectionLabelDark}>{fr ? "VISION" : "VISION"}</Text>
          <View style={s.goldLine} />
          <Text style={s.sectionTitleDark}>{fr ? "À long terme" : "Long Term"}</Text>

          {MISSIONS_LT.map((m, i) => (
            <View key={i} style={s.missionLtRow}>
              <View style={s.missionLtIcon}>
                <Ionicons name={m.icon} size={18} color={colors.gold.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.missionLtTitle}>{fr ? m.titleFr : m.titleEn}</Text>
                <Text style={s.missionLtDesc}>{fr ? m.descFr : m.descEn}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ══ APPEL AUX DONS ══ */}
        <View style={s.sectionCream}>
          <View style={s.iconSquare}>
            <Ionicons name="hand-left" size={18} color={colors.gold.DEFAULT} />
          </View>
          <Text style={s.sectionTitle}>{fr ? "Nous avons besoin de vous" : "We Need You"}</Text>
          <View style={s.goldLine} />
          <Text style={s.sectionBody}>
            {fr
              ? "Pour réussir et mener à bien nos missions, nous avons besoin de soutien matériel, financier et alimentaire à travers des dons. Notre association étant à but non lucratif, tous les fonds récoltés seront uniquement au profit de l'association et de la population ciblée. Ensemble nous pouvons y arriver."
              : "To succeed in our missions, we need material, financial and food support through donations. As a non-profit organization, all funds raised will solely benefit the association and the targeted population. Together we can make it."}
          </Text>

          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.8}
            onPress={() => openUrl("https://www.paypal.me/hnclamaindelespoir")}
          >
            <Ionicons name="heart" size={18} color={colors.offwhite.DEFAULT} />
            <Text style={s.ctaBtnText}>{fr ? "FAIRE UN DON VIA PAYPAL" : "DONATE VIA PAYPAL"}</Text>
            <Ionicons name="open-outline" size={16} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
        </View>

        {/* ══ RÉSEAUX ══ */}
        <View style={s.sectionLight}>
          <Text style={s.sectionTitle}>{fr ? "Rejoignez-nous" : "Join Us"}</Text>
          <View style={s.goldLine} />

          {SOCIALS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.socialRow}
              activeOpacity={0.75}
              onPress={() => openUrl(item.url)}
            >
              <View style={s.socialIcon}>
                <Ionicons name={item.icon} size={20} color={colors.gold.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.socialLabel}>{item.label}</Text>
                <Text style={s.socialHandle}>{item.handle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gold.DEFAULT} />
            </TouchableOpacity>
          ))}

          {/* PayPal */}
          <TouchableOpacity
            style={s.socialRow}
            activeOpacity={0.75}
            onPress={() => openUrl("https://www.paypal.me/hnclamaindelespoir")}
          >
            <View style={s.socialIcon}>
              <Ionicons name="heart" size={20} color={colors.gold.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.socialLabel}>PayPal</Text>
              <Text style={s.socialHandle}>{fr ? "Faire un don" : "Make a donation"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gold.DEFAULT} />
          </TouchableOpacity>
        </View>

        {/* ══ BOTTOM BANNER ══ */}
        <View style={s.bottomBanner}>
          <Text style={s.bottomQuote}>
            {fr
              ? "Ensemble, tendons nos mains pour redonner de l'espoir à ceux qui en ont le plus besoin."
              : "Together, let's reach out to restore hope to those who need it most."}
          </Text>
          <Text style={s.bottomLabel}>HNC — La Main de l'Espoir</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold.DEFAULT + "30",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: {
    fontFamily: fonts.serif.bold,
    fontSize: 18,
    color: colors.offwhite.DEFAULT,
    letterSpacing: 1,
  },

  // Hero
  heroSection: {
    height: SW * 1.1,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 24,
    paddingBottom: 36,
    alignItems: "center",
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoImg: { width: "85%", height: "85%" },
  heroLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.gold.DEFAULT,
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: fonts.serif.bold,
    fontSize: 48,
    color: colors.offwhite.DEFAULT,
    lineHeight: 52,
  },
  heroSubtitle: {
    fontFamily: fonts.serif.italic,
    fontSize: 26,
    color: colors.gold.DEFAULT,
    marginBottom: 16,
  },
  heroDesc: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.gold.DEFAULT,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 28,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.maroon,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  ctaBtnText: {
    fontFamily: fonts.sans.bold,
    fontSize: 12,
    color: colors.offwhite.DEFAULT,
    letterSpacing: 1.5,
  },

  // Sections
  sectionLight: {
    backgroundColor: colors.offwhite.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionCream: {
    backgroundColor: colors.cream.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  sectionDark: {
    backgroundColor: colors.dark.bg,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.gold.DEFAULT,
    marginBottom: 8,
  },
  sectionLabelDark: {
    fontFamily: fonts.sans.medium,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.gold.DEFAULT,
    marginBottom: 8,
  },
  goldLine: {
    width: 40,
    height: 1,
    backgroundColor: colors.gold.DEFAULT,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.serif.italic,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 16,
  },
  sectionTitleDark: {
    fontFamily: fonts.serif.italic,
    fontSize: 28,
    color: colors.offwhite.DEFAULT,
    marginBottom: 24,
  },
  sectionBody: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 500,
  },
  iconSquare: {
    width: 44,
    height: 44,
    backgroundColor: colors.dark.bg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // Founders
  foundersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 32,
  },
  founderItem: { alignItems: "center" },
  founderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.maroon,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  founderLetter: {
    fontFamily: fonts.serif.bold,
    fontSize: 28,
    color: colors.offwhite.DEFAULT,
  },
  founderName: {
    fontFamily: fonts.serif.italic,
    fontSize: 16,
    color: colors.text.primary,
  },

  // Quote
  quoteBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    marginTop: 24,
    paddingTop: 24,
  },
  quoteText: {
    fontFamily: fonts.serif.italic,
    fontSize: 15,
    color: colors.maroon,
    textAlign: "center",
    lineHeight: 24,
  },

  // Missions CT
  missionsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    marginTop: 8,
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: 12,
  },
  missionNum: {
    fontFamily: fonts.serif.regular,
    fontSize: 32,
    color: colors.gold.DEFAULT,
    opacity: 0.5,
    width: 40,
    lineHeight: 36,
  },
  missionIconBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.dark.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  missionTextCol: { flex: 1 },
  missionTitle: {
    fontFamily: fonts.serif.italic,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 6,
  },
  missionDesc: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Missions LT
  missionLtRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold.DEFAULT + "15",
  },
  missionLtIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.maroon,
    justifyContent: "center",
    alignItems: "center",
  },
  missionLtTitle: {
    fontFamily: fonts.serif.italic,
    fontSize: 17,
    color: colors.offwhite.DEFAULT,
    marginBottom: 6,
  },
  missionLtDesc: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.gold.DEFAULT,
    opacity: 0.65,
    lineHeight: 20,
  },

  // Socials
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  socialIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.dark.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  socialLabel: {
    fontFamily: fonts.serif.italic,
    fontSize: 16,
    color: colors.text.primary,
  },
  socialHandle: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Bottom banner
  bottomBanner: {
    backgroundColor: colors.dark.bg,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: colors.gold.DEFAULT + "30",
  },
  bottomQuote: {
    fontFamily: fonts.serif.italic,
    fontSize: 20,
    color: colors.offwhite.DEFAULT,
    textAlign: "center",
    lineHeight: 30,
    maxWidth: 340,
    marginBottom: 20,
  },
  bottomLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 11,
    color: colors.gold.DEFAULT,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
