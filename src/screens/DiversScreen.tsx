/**
 * SENZEDY AGENCY — src/screens/DiversScreen.tsx
 * Page Divers — 4 onglets : Véhicules, Taxi, MJM, Mabunda Tech
 * Reproduction fidèle de senzedyagency.com/Divers
 */

import { useTranslation } from "react-i18next";
import React, { useState, useRef, createContext, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  FlatList,
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

// Context to share contact modal state with sub-tabs
const ContactContext = createContext<{ open: (subject: string) => void }>({ open: () => {} });

type TabKey = "vehicules" | "taxi" | "mjm" | "mabunda";

// ══════════════════════════════════════════════════════════════════════════
export default function DiversScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("vehicules");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");

  const TABS: { key: TabKey; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "vehicules", icon: "car-outline",       label: t("divers.vehiclesTab") },
    { key: "taxi",      icon: "navigate-outline",  label: t("divers.taxiTab") },
    { key: "mjm",       icon: "water-outline",     label: t("divers.mjmTab") },
    { key: "mabunda",   icon: "flash-outline",     label: t("divers.mabundaTab") },
  ];

  const openContact = (subject: string) => {
    setContactSubject(subject);
    setContactOpen(true);
  };

  return (
    <ContactContext.Provider value={{ open: openContact }}>
      <View style={[st.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
          <Text style={st.headerTitle}>{t("divers.title")}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab bar */}
        <View style={st.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
            {TABS.map((tabItem) => (
              <TouchableOpacity
                key={tabItem.key}
                style={[st.tabBtn, tab === tabItem.key && st.tabBtnActive]}
                onPress={() => setTab(tabItem.key)}
              >
                <Ionicons name={tabItem.icon} size={15} color={tab === tabItem.key ? colors.offwhite.DEFAULT : colors.gold.pale} />
                <Text style={[st.tabText, tab === tabItem.key && st.tabTextActive]}>{tabItem.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} key={tab}>
          {tab === "vehicules" && <VehiculesTab />}
          {tab === "taxi"      && <TaxiTab />}
          {tab === "mjm"       && <MJMTab />}
          {tab === "mabunda"   && <MabundaTab />}
          <View style={{ height: 40 }} />
        </ScrollView>

        <ContactModal
          visible={contactOpen}
          onClose={() => setContactOpen(false)}
          defaultSubject={contactSubject}
        />
      </View>
    </ContactContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 : LOCATION DE VÉHICULES
// ═══════════════════════════════════════════════════════════════════════
function VehiculesTab() {
  const { open } = useContext(ContactContext);
  const { t } = useTranslation();
  return (
    <>
      <HeroBanner
        subLabel={t("divers.fleetLabel")}
        title={t("divers.vehicleTitle")}
        desc={t("divers.vehicleDesc")}
        image="https://images.unsplash.com/photo-1449965408869-ebd3fee5230f?w=900&q=80"
        btnText={t("kinbnb.contactUs")}
        onPress={() => open(t("divers.contactSubjectVehicles"))}
      />

      {/* Services */}
      <View style={st.sectionLight}>
        <Text style={st.subLabel}>{t("divers.whatWeOffer")}</Text>
        <Text style={st.titleSerif}>{t("divers.ourServices")}</Text>
        <View style={st.goldDivider} />
        <View style={st.cardsGrid}>
          <ServiceCard icon="car-sport-outline" title={t("divers.urbanRides")} desc={t("divers.urbanRidesDesc")} />
          <ServiceCard icon="time-outline" title={t("divers.service247")} desc={t("divers.service247Desc")} />
          <ServiceCard icon="location-outline" title={t("divers.airportTransfer")} desc={t("divers.airportTransferDesc")} />
          <ServiceCard icon="shield-checkmark-outline" title={t("divers.secureTransport")} desc={t("divers.secureTransportDesc")} />
        </View>
      </View>

      {/* Pourquoi Nous Choisir */}
      <View style={st.sectionDark}>
        <Text style={st.subLabelGold}>{t("divers.ourAdvantages")}</Text>
        <Text style={st.titleSerifGold}>{t("divers.whyChooseUs")}</Text>
        <View style={st.goldDivider} />
        <View style={st.engRow}>
          <EngCard icon="checkmark-circle-outline" title={t("divers.recentFleet")} desc={t("divers.recentFleetDesc")} />
          <EngCard icon="checkmark-circle-outline" title={t("divers.support247")} desc={t("divers.support247Desc")} />
        </View>
      </View>

      {/* CTA */}
      <View style={st.sectionLight}>
        <TouchableOpacity style={st.ctaMaroon} onPress={() => open(t("divers.contactSubjectVehicles"))}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={st.ctaText}>{t("divers.contactForRental")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 : SOCIÉTÉ DE TAXI
// ═══════════════════════════════════════════════════════════════════════
function TaxiTab() {
  const { open } = useContext(ContactContext);
  const { t } = useTranslation();
  return (
    <>
      <HeroBanner
        subLabel={t("divers.taxiLabel")}
        title={t("divers.taxiTitle")}
        desc={t("divers.taxiDesc")}
        image="https://images.unsplash.com/photo-1449965408869-ebd3fee5230f?w=900&q=80"
        btnText={t("divers.bookTaxi")}
        onPress={() => open(t("divers.contactSubjectTaxi"))}
      />

      {/* Services */}
      <View style={st.sectionLight}>
        <Text style={st.subLabel}>{t("divers.whatWeOffer")}</Text>
        <Text style={st.titleSerif}>{t("divers.ourServices")}</Text>
        <View style={st.goldDivider} />
        <View style={st.cardsGrid}>
          <ServiceCard icon="car-sport-outline" title={t("divers.urbanRides")} desc={t("divers.urbanRidesDesc")} />
          <ServiceCard icon="time-outline" title={t("divers.service247")} desc={t("divers.service247Desc")} />
          <ServiceCard icon="airplane-outline" title={t("divers.airportTransfer")} desc={t("divers.airportTransferDesc")} />
          <ServiceCard icon="shield-checkmark-outline" title={t("divers.secureTransport")} desc={t("divers.secureTransportDesc")} />
        </View>
      </View>

      {/* Pourquoi Nous Choisir */}
      <View style={st.sectionDark}>
        <Text style={st.subLabelGold}>{t("divers.ourCommitments")}</Text>
        <Text style={st.titleSerifGold}>{t("divers.whyChooseUs")}</Text>
        <View style={st.goldDivider} />
        <View style={st.engRow}>
          <EngCard icon="checkmark-circle-outline" title={t("divers.punctuality")} desc={t("divers.punctualityDesc")} />
          <EngCard icon="checkmark-circle-outline" title={t("divers.transparentPricing")} desc={t("divers.transparentPricingDesc")} />
          <EngCard icon="checkmark-circle-outline" title={t("divers.trainedDrivers")} desc={t("divers.trainedDriversDesc")} />
        </View>
      </View>

      {/* Besoin d'un Taxi */}
      <View style={st.sectionLight}>
        <Text style={st.subLabel}>{t("kinbnb.reservationLabel")}</Text>
        <Text style={st.titleSerif}>{t("divers.needTaxi")}</Text>
        <View style={st.goldDivider} />
        <Text style={st.subtitle}>{t("divers.callOrBook")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary }}>agency.senzedy@yahoo.com</Text>
        </View>
        <TouchableOpacity style={st.ctaMaroon} onPress={() => open(t("divers.contactSubjectTaxi"))}>
          <Text style={st.ctaText}>{t("divers.bookNow")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 3 : SOCIÉTÉS MJM (FORAGE)
// ═══════════════════════════════════════════════════════════════════════
function MJMTab() {
  const { open } = useContext(ContactContext);
  const { t } = useTranslation();
  return (
    <>
      {/* Hero dark */}
      <View style={st.sectionDark}>
        <Text style={st.subLabelGold}>{t("divers.mjmLabel")}</Text>
        <Text style={st.titleSerifGold}>{t("divers.mjmTitle")}</Text>
        <Text style={st.heroSubName}>Mr. Nsekwa Olivier</Text>
        <Text style={st.heroDescCenter}>
          {t("divers.mjmDesc")}
        </Text>
      </View>

      {/* Image */}
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80" }}
          style={{ width: SW - 40, height: 220 }}
          contentFit="cover"
        />
        <TouchableOpacity style={[st.ctaMaroon, { marginTop: 16 }]} onPress={() => open(t("divers.contactSubjectMJMQuote"))}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={st.ctaText}>{t("divers.requestQuote")}</Text>
        </TouchableOpacity>
      </View>

      {/* Services */}
      <View style={st.sectionLight}>
        <Text style={st.subLabel}>{t("divers.ourExpertise")}</Text>
        <Text style={st.titleSerif}>{t("divers.ourServices")}</Text>
        <View style={st.goldDivider} />
        <Text style={st.subtitle}>{t("divers.expertiseSubtitle")}</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={st.mjmCard}>
            <View style={st.mjmIcon}><Ionicons name="water-outline" size={20} color={colors.gold.DEFAULT} /></View>
            <Text style={st.mjmTitle}>{t("divers.waterDrilling")}</Text>
            <Text style={st.mjmDesc}>{t("divers.waterDrillingDesc")}</Text>
            <TouchableOpacity onPress={() => open(t("divers.contactSubjectMJMWater"))}>
              <Text style={st.linkGold}>{t("divers.contactUsLink")}</Text>
            </TouchableOpacity>
          </View>
          <View style={st.mjmCard}>
            <View style={st.mjmIcon}><Ionicons name="construct-outline" size={20} color={colors.gold.DEFAULT} /></View>
            <Text style={st.mjmTitle}>{t("divers.construction")}</Text>
            <Text style={st.mjmDesc}>{t("divers.constructionDesc")}</Text>
            <TouchableOpacity onPress={() => open(t("divers.contactSubjectMJMConstruction"))}>
              <Text style={st.linkGold}>{t("divers.contactUsLink")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 4 : MABUNDA TECH DRC
// ═══════════════════════════════════════════════════════════════════════
function MabundaTab() {
  const { open } = useContext(ContactContext);
  const { t } = useTranslation();
  return (
    <>
      {/* Hero dark */}
      <View style={st.sectionDark}>
        {/* Badge */}
        <View style={st.badge}>
          <Ionicons name="ribbon-outline" size={14} color={colors.gold.DEFAULT} />
          <Text style={st.badgeText}>{t("divers.certifiedExpert")}</Text>
        </View>
        <Text style={[st.subLabelGold, { marginTop: 16 }]}>{t("divers.mabundaLabel")}</Text>
        <Text style={st.titleSerifGold}>{t("divers.mabundaTitle")}</Text>
        <Text style={st.heroSubName}>Ingénieur Mabunda Lokosi Cedric</Text>
        <Text style={st.heroDescCenter}>
          {t("divers.mabundaDesc")}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20, justifyContent: "center" }}>
          {[
            { icon: "sunny-outline" as const, label: t("divers.solarPanels") },
            { icon: "snow-outline" as const, label: t("divers.airConditioning") },
            { icon: "flash-outline" as const, label: t("divers.engineering") },
          ].map((tagItem) => (
            <View key={tagItem.label} style={st.tagPill}>
              <Ionicons name={tagItem.icon} size={14} color={colors.gold.DEFAULT} />
              <Text style={st.tagPillText}>{tagItem.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[st.ctaMaroon, { marginTop: 24 }]} onPress={() => open(t("divers.contactSubjectMabunda"))}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={st.ctaText}>{t("divers.requestQuote")}</Text>
        </TouchableOpacity>
      </View>

      {/* Image carousel */}
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80" }}
          style={{ width: SW - 40, height: 240 }}
          contentFit="cover"
        />
      </View>

      {/* Services */}
      <View style={st.sectionLight}>
        <Text style={st.subLabel}>{t("divers.whatWeDo")}</Text>
        <Text style={st.titleSerif}>{t("divers.ourServices")}</Text>
        <View style={st.goldDivider} />
        <Text style={st.subtitle}>{t("divers.servicesSubtitle")}</Text>

        <View style={{ gap: 14 }}>
          <MabundaServiceRow icon="flash-outline" title={t("divers.electricity")} desc={t("divers.electricityDesc")} />
          <MabundaServiceRow icon="snow-outline" title={t("divers.cooling")} desc={t("divers.coolingDesc")} />
          <MabundaServiceRow icon="shield-checkmark-outline" title={t("divers.security")} desc={t("divers.securityDesc")} />
          <MabundaServiceRow icon="star-outline" title={t("divers.miscServices")} desc={t("divers.miscServicesDesc")} />
        </View>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function HeroBanner({ subLabel, title, desc, image, btnText, onPress }: { subLabel: string; title: string; desc: string; image: string; btnText: string; onPress?: () => void }) {
  return (
    <View style={{ height: 260, justifyContent: "flex-end" }}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient colors={["rgba(42,21,16,0.45)", "rgba(42,21,16,0.85)"]} style={StyleSheet.absoluteFillObject} />
      <View style={{ padding: 24 }}>
        <Text style={{ color: colors.gold.pale, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, marginBottom: 10 }}>{subLabel}</Text>
        <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 30, fontFamily: fonts.serif.italic, fontStyle: "italic", marginBottom: 8 }}>{title}</Text>
        <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 13, fontFamily: fonts.sans.regular, opacity: 0.85, marginBottom: 20 }}>{desc}</Text>
        <TouchableOpacity style={st.ctaMaroon} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.offwhite.DEFAULT} />
          <Text style={st.ctaText}>{btnText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ServiceCard({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
  return (
    <View style={st.serviceCard}>
      <View style={st.serviceIcon}><Ionicons name={icon} size={20} color={colors.gold.DEFAULT} /></View>
      <Text style={st.serviceTitle}>{title}</Text>
      <Text style={st.serviceDesc}>{desc}</Text>
    </View>
  );
}

function EngCard({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
  return (
    <View style={st.engCard}>
      <Ionicons name={icon} size={28} color={colors.gold.DEFAULT} />
      <Text style={st.engTitle}>{title}</Text>
      <Text style={st.engDesc}>{desc}</Text>
    </View>
  );
}

function MabundaServiceRow({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
  return (
    <View style={st.mabundaRow}>
      <View style={st.serviceIcon}><Ionicons name={icon} size={20} color={colors.offwhite.DEFAULT} /></View>
      <View style={{ flex: 1 }}>
        <Text style={st.mjmTitle}>{title}</Text>
        <Text style={st.mjmDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream.DEFAULT },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.dark.surface, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: colors.gold.DEFAULT + "40",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.gold.DEFAULT, fontSize: 18, fontFamily: fonts.serif.italic, fontStyle: "italic", letterSpacing: 1 },

  // Tabs
  tabBar: { backgroundColor: colors.dark.bg, paddingVertical: 12 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.gold.DEFAULT + "40",
    backgroundColor: colors.dark.surface,
  },
  tabBtnActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  tabText: { color: colors.gold.pale, fontSize: 13, fontFamily: fonts.sans.semiBold, letterSpacing: 0.5 },
  tabTextActive: { color: colors.offwhite.DEFAULT },

  // Sections
  sectionLight: { backgroundColor: colors.cream.light, paddingHorizontal: 20, paddingVertical: 36 },
  sectionDark: { backgroundColor: colors.dark.bg, paddingHorizontal: 20, paddingVertical: 36, alignItems: "center" },
  subLabel: { color: colors.gold.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  subLabelGold: { color: colors.gold.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 4, textAlign: "center", marginBottom: 8 },
  titleSerif: { fontSize: 28, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, textAlign: "center", marginBottom: 4 },
  titleSerifGold: { fontSize: 28, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.gold.DEFAULT, textAlign: "center", marginBottom: 4 },
  goldDivider: { width: 40, height: 2, backgroundColor: colors.gold.DEFAULT, alignSelf: "center", marginVertical: 12 },
  subtitle: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, textAlign: "center", marginBottom: 24 },

  heroSubName: { fontSize: 16, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.gold.pale, textAlign: "center", marginBottom: 12 },
  heroDescCenter: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.offwhite.DEFAULT, textAlign: "center", opacity: 0.85, lineHeight: 20 },

  // Service cards grid
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceCard: {
    width: (SW - 52) / 2, backgroundColor: colors.cream.DEFAULT, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  serviceIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: colors.dark.bg,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  serviceTitle: { fontSize: 15, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, marginBottom: 6 },
  serviceDesc: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.text.secondary, lineHeight: 18 },

  // Engagement cards (dark)
  engRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  engCard: {
    width: (SW - 64) / 3, alignItems: "center", gap: 8, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: colors.gold.DEFAULT + "20",
  },
  engTitle: { fontSize: 13, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.gold.DEFAULT, textAlign: "center" },
  engDesc: { fontSize: 11, fontFamily: fonts.sans.regular, color: colors.gold.pale, textAlign: "center" },

  // MJM cards
  mjmCard: {
    flex: 1, backgroundColor: colors.offwhite.pure, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  mjmIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: colors.cream.DEFAULT,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  mjmTitle: { fontSize: 15, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary, marginBottom: 6 },
  mjmDesc: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.text.secondary, lineHeight: 18, marginBottom: 12 },
  linkGold: { fontSize: 11, fontFamily: fonts.sans.semiBold, color: colors.gold.DEFAULT, letterSpacing: 1.5 },

  // Mabunda service rows
  mabundaRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.offwhite.pure, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },

  // Badge
  badge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: colors.gold.DEFAULT + "40",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  badgeText: { color: colors.gold.DEFAULT, fontSize: 11, fontFamily: fonts.sans.semiBold, letterSpacing: 2 },

  // Tag pills
  tagPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: colors.gold.DEFAULT + "40",
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
  },
  tagPillText: { color: colors.offwhite.DEFAULT, fontSize: 10, fontFamily: fonts.sans.semiBold, letterSpacing: 1.5 },

  // CTA
  ctaMaroon: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: colors.maroon, paddingHorizontal: 24, paddingVertical: 16, alignSelf: "center",
  },
  ctaText: { color: colors.offwhite.DEFAULT, fontSize: 11, fontFamily: fonts.sans.bold, letterSpacing: 2 },
});
