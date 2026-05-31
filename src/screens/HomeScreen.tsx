/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/HomeScreen.tsx
 *  Compatible Expo SDK 54 · NativeWind · expo-image
 *  expo-linear-gradient
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  FlatList,
  Animated,
  Pressable,
} from "react-native";
import { Image }           from "expo-image";
import { Image as RNImage } from "react-native";
import { LinearGradient }  from "expo-linear-gradient";
import { Ionicons }        from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import { LanguagePicker } from "../components/LanguagePicker";

import { colors }                       from "../theme/colors";
import { SkeletonHomeFeatured, SkeletonHomeRecent } from "../components/Skeleton";
import { useFeaturedProperties, useRecentProperties } from "../hooks/useProperties";
import type { Property }                from "../services/propertyService";
import { formatPrice }                  from "../services/propertyService";
import type { MainStackNavProp }        from "../navigation/AppNavigator";

// Blurhash générique (brun chaud) pendant le chargement des photos
const PROP_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

const { width: SW, height: SH } = Dimensions.get("window");
const HERO_HEIGHT = SH * 0.52;

// ─── Données de sélection ─────────────────────────────────────────────

const PROPERTY_TYPES = [
  { labelKey: "home.allTypes",    label: "Tous les types",  value: "" },
  { labelKey: "home.villa",       label: "Villa",           value: "villa" },
  { labelKey: "home.apartment",   label: "Appartement",     value: "appartement" },
  { labelKey: "home.house",       label: "Maison",          value: "maison" },
  { labelKey: "home.land",        label: "Terrain",         value: "terrain" },
  { labelKey: "home.office",      label: "Bureau",          value: "bureau" },
  { labelKey: "home.commercial",  label: "Local commercial",value: "local" },
];

const COMMUNES = [
  { labelKey: "home.allCommunes", label: "Toutes les communes", value: "" },
  { labelKey: "",                 label: "Ngaliema",            value: "ngaliema" },
  { labelKey: "",                 label: "Gombe",               value: "gombe" },
  { labelKey: "",                 label: "Limete",              value: "limete" },
  { labelKey: "",                 label: "Kintambo",            value: "kintambo" },
  { labelKey: "",                 label: "Lemba",               value: "lemba" },
  { labelKey: "",                 label: "Kalamu",              value: "kalamu" },
  { labelKey: "",                 label: "Bandalungwa",         value: "bandalungwa" },
  { labelKey: "",                 label: "Mont-Ngafula",        value: "mont-ngafula" },
  { labelKey: "",                 label: "N'sele",              value: "nsele" },
  { labelKey: "",                 label: "Masina",              value: "masina" },
];

// ─── Image hero (Tour de l'Échangeur, Kinshasa) ─────────────────────
const HERO_IMAGE = require("../../assets/hero.jpg");

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export default function HomeScreen() {
  const navigation  = useNavigation<MainStackNavProp>();
  const insets      = useSafeAreaInsets();
  const { t }       = useTranslation();
  const { language } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

  // ── Données réelles depuis TanStack Query (cache 5 min) ───────────
  const { data: featured, loading: loadingFeatured } = useFeaturedProperties(5);
  const { data: recent,   loading: loadingRecent   } = useRecentProperties(8);
  const contentLoading = loadingFeatured || loadingRecent;

  // État de la barre de recherche
  const [activeTab,     setActiveTab]     = useState<"vente" | "location">("vente");
  const [selectedType,  setSelectedType]  = useState<{label: string; value: string; labelKey?: string}>(PROPERTY_TYPES[0]);
  const [selectedCommune, setSelectedCommune] = useState<{label: string; value: string; labelKey?: string}>(COMMUNES[0]);
  const [showTypeModal,   setShowTypeModal]   = useState(false);
  const [showCommuneModal, setShowCommuneModal] = useState(false);

  // État des filtres avancés
  const [advMinPrice,   setAdvMinPrice]   = useState("");
  const [advMaxPrice,   setAdvMaxPrice]   = useState("");
  const [advMinSurface, setAdvMinSurface] = useState("");
  const [advBedrooms,   setAdvBedrooms]   = useState("");

  // Lancer la recherche
  const handleSearch = () => {
    const params: Record<string, any> = { transaction: activeTab };
    if (selectedType.value)    params.category  = selectedType.value;
    if (selectedCommune.value) params.commune   = selectedCommune.value;
    const minP = parseInt(advMinPrice, 10);
    const maxP = parseInt(advMaxPrice, 10);
    const minS = parseInt(advMinSurface, 10);
    const beds = parseInt(advBedrooms, 10);
    if (!isNaN(minP) && minP > 0) params.minPrice   = minP;
    if (!isNaN(maxP) && maxP > 0) params.maxPrice   = maxP;
    if (!isNaN(minS) && minS > 0) params.minSurface = minS;
    if (!isNaN(beds) && beds > 0) params.bedrooms   = beds;
    navigation.navigate("Search", params);
  };

  // Animation de l'indicateur de tab
  const tabAnim = useRef(new Animated.Value(0)).current;
  const switchTab = (tab: "vente" | "location") => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === "vente" ? 0 : 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  const indicatorTranslate = tabAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, (SW - 48) / 2],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.brown.DEFAULT,
          borderBottomWidth: 1,
          borderBottomColor: colors.gold.DEFAULT + "35",
        }}
      >
        {/* Logo + Nom */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <RNImage
            source={require("../../assets/logo.png")}
            style={{ width: 75, height: 75, tintColor: "#FFFFFF" }}
            resizeMode="contain"
          />
          <View>
            <Text
              style={{
                color: colors.gold.DEFAULT,
                fontSize: 22,
                fontWeight: "700",
                letterSpacing: 4,
                lineHeight: 26,
              }}
            >
              SENZEDY
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "500",
                letterSpacing: 6,
                lineHeight: 16,
              }}
            >
              AGENCY
            </Text>
          </View>
        </View>

        {/* Droite : langue + menu */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setShowLangPicker(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: colors.brown.light + "50",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: colors.brown.light,
            }}
          >
            <Ionicons name="globe-outline" size={12} color={colors.offwhite.DEFAULT} />
            <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 11, fontWeight: "600" }}>
              {language === "fr" ? "FR" : "EN"}
            </Text>
            <Text style={{ fontSize: 12 }}>{language === "fr" ? "\ud83c\uddeb\ud83c\uddf7" : "\ud83c\uddec\ud83c\udde7"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: colors.brown.light + "50",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="menu" size={20} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SCROLL PRINCIPAL ─────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        scrollEventThrottle={16}
      >
        {/* Espace header */}
        <View style={{ height: insets.top + 66 }} />

        {/* ── HERO BANNER ────────────────────────────────────────────── */}
        <View style={{ height: HERO_HEIGHT, position: "relative" }}>
          {/* Image de fond */}
          <Image
            source={HERO_IMAGE}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />

          {/* Dégradé sombre */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.08)",
              "rgba(20,8,5,0.45)",
              "rgba(30,10,5,0.82)",
            ]}
            locations={[0, 0.45, 1]}
            style={{
              position: "absolute",
              inset: 0,
            }}
          />

          {/* Ligne décorative dorée en haut */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: colors.gold.DEFAULT,
              opacity: 0.6,
            }}
          />

          {/* Texte centré sur le hero */}
          <View
            style={{
              position: "absolute",
              bottom: 64,
              left: 24,
              right: 24,
              alignItems: "center",
            }}
          >
            {/* Petite ligne décorative */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <View style={{ height: 1, width: 32, backgroundColor: colors.gold.DEFAULT, opacity: 0.7 }} />
              <Ionicons name="diamond-outline" size={10} color={colors.gold.DEFAULT} />
              <View style={{ height: 1, width: 32, backgroundColor: colors.gold.DEFAULT, opacity: 0.7 }} />
            </View>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={{
                color: colors.offwhite.pure,
                fontSize: SW < 400 ? 15 : 17,
                fontWeight: "800",
                textAlign: "center",
                lineHeight: 24,
                letterSpacing: 0.2,
                textShadowColor: "rgba(0,0,0,0.6)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              {t("home.heroTagline")}
            </Text>

            <Text
              style={{
                color: colors.cream.DEFAULT,
                fontSize: 13,
                fontWeight: "500",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 19,
                opacity: 0.9,
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {t("home.heroSubtitle")}
            </Text>
          </View>
        </View>

        {/* ── BARRE DE RECHERCHE FLOTTANTE ─────────────────────────── */}
        <View
          style={{
            marginTop: -32,
            marginHorizontal: 16,
            backgroundColor: colors.offwhite.DEFAULT,
            borderRadius: 24,
            padding: 20,
            shadowColor: colors.brown.DEFAULT,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 8,
            zIndex: 10,
          }}
        >
          {/* ─ Onglets Vendre / Louer ─ */}
          <View
            style={{
              flexDirection: "row",
              position: "relative",
              marginBottom: 18,
              backgroundColor: colors.cream.light,
              borderRadius: 14,
              padding: 4,
            }}
          >
            {/* Indicateur animé */}
            <Animated.View
              style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                left: 4,
                width: (SW - 80) / 2,
                backgroundColor: "#8B3A3A",
                borderRadius: 10,
                transform: [{ translateX: indicatorTranslate }],
                shadowColor: "#8B3A3A",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              }}
            />

            {(["vente", "location"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => switchTab(tab)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 11,
                  zIndex: 1,
                }}
              >
                <Text
                  style={{
                    color: activeTab === tab
                      ? colors.offwhite.pure
                      : colors.text.secondary,
                    fontSize: 14,
                    fontWeight: "700",
                    letterSpacing: 0.3,
                  }}
                >
                  {tab === "vente" ? t("home.tabSale") : t("home.tabRent")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─ Sélecteurs Type + Commune ─ */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            {/* Type de bien */}
            <TouchableOpacity
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.85}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.offwhite.DEFAULT,
                borderWidth: 1.5,
                borderColor: colors.cream.dark,
                borderRadius: 13,
                paddingHorizontal: 13,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: selectedType.value
                    ? colors.brown.dark
                    : colors.text.secondary,
                  fontSize: 13,
                  fontWeight: "500",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {selectedType.labelKey ? t(selectedType.labelKey) : selectedType.label}
              </Text>
              <Ionicons name="chevron-expand" size={14} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Commune */}
            <TouchableOpacity
              onPress={() => setShowCommuneModal(true)}
              activeOpacity={0.85}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.offwhite.DEFAULT,
                borderWidth: 1.5,
                borderColor: colors.cream.dark,
                borderRadius: 13,
                paddingHorizontal: 13,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: selectedCommune.value
                    ? colors.brown.dark
                    : colors.text.secondary,
                  fontSize: 13,
                  fontWeight: "500",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {selectedCommune.labelKey ? t(selectedCommune.labelKey) : selectedCommune.label}
              </Text>
              <Ionicons name="chevron-expand" size={14} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* ─ Filtres avancés (accordéon) ─ */}
          <AdvancedFilters
            minPrice={advMinPrice}
            maxPrice={advMaxPrice}
            minSurface={advMinSurface}
            bedrooms={advBedrooms}
            onMinPriceChange={setAdvMinPrice}
            onMaxPriceChange={setAdvMaxPrice}
            onMinSurfaceChange={setAdvMinSurface}
            onBedroomsChange={setAdvBedrooms}
          />

          {/* ─ Bouton Rechercher ─ */}
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.88}
            style={{
              backgroundColor: "#8B3A3A",
              borderRadius: 15,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              shadowColor: "#8B3A3A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 5,
              marginTop: 4,
            }}
          >
            <Ionicons name="search" size={18} color={colors.gold.pale} />
            <Text
              style={{
                color: colors.offwhite.pure,
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}
            >
              {t("home.searchButton")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION : Annonces en vedette ──────────────────────────── */}
        <View style={{ marginTop: 32 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <SectionHeader title={t("home.featuredTitle")} subtitle={t("home.featuredSubtitle")} onSeeAll={() => navigation.navigate("Search")} />
          </View>
          {contentLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
              <View style={{ flexDirection: "row", gap: 14, paddingRight: 20 }}>
                <SkeletonHomeFeatured />
              </View>
            </ScrollView>
          ) : (
            <FeaturedList
              items={featured}
              onPress={(id) => navigation.navigate("PropertyDetail", { propertyId: id })}
            />
          )}
        </View>

        {/* ── SECTION : Nouvelles annonces ───────────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <SectionHeader title={t("home.recentTitle")} subtitle={t("home.recentSubtitle")} onSeeAll={() => navigation.navigate("Search")} />
          {contentLoading ? (
            <SkeletonHomeRecent />
          ) : (
            <RecentList
              items={recent}
              onPress={(id) => navigation.navigate("PropertyDetail", { propertyId: id })}
            />
          )}
        </View>

        {/* ── SECTION : Pourquoi Senzedy ─────────────────────────────── */}
        <WhySenzedy />

      </ScrollView>

      {/* ── MODALS SÉLECTEURS ────────────────────────────────────────── */}
      <LanguagePicker visible={showLangPicker} onClose={() => setShowLangPicker(false)} />
      <SelectorModal
        visible={showTypeModal}
        title={t("home.propertyType")}
        options={PROPERTY_TYPES}
        selected={selectedType}
        onSelect={(opt) => { setSelectedType(opt); setShowTypeModal(false); }}
        onClose={() => setShowTypeModal(false)}
      />
      <SelectorModal
        visible={showCommuneModal}
        title={t("home.commune")}
        options={COMMUNES}
        selected={selectedCommune}
        onSelect={(opt) => { setSelectedCommune(opt); setShowCommuneModal(false); }}
        onClose={() => setShowCommuneModal(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  SUB-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════

// ── Filtres avancés (accordéon) ───────────────────────────────────────
function AdvancedFilters({
  minPrice, maxPrice, minSurface, bedrooms,
  onMinPriceChange, onMaxPriceChange, onMinSurfaceChange, onBedroomsChange,
}: {
  minPrice: string; maxPrice: string; minSurface: string; bedrooms: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  onMinSurfaceChange: (v: string) => void;
  onBedroomsChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: 14 }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 4,
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            color: "#8B3A3A",
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {t("home.advancedFilters")}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={14}
          color="#8B3A3A"
        />
      </TouchableOpacity>

      {open && (
        <View style={{ marginTop: 12, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <FilterInput placeholder={t("home.priceMin")} flex={1} keyboardType="numeric" value={minPrice} onChangeText={onMinPriceChange} />
            <FilterInput placeholder={t("home.priceMax")} flex={1} keyboardType="numeric" value={maxPrice} onChangeText={onMaxPriceChange} />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <FilterInput placeholder={t("home.surfaceMin")} flex={1} keyboardType="numeric" value={minSurface} onChangeText={onMinSurfaceChange} />
            <FilterInput placeholder={t("home.bedroomsMin")}    flex={1} keyboardType="numeric" value={bedrooms} onChangeText={onBedroomsChange} />
          </View>
        </View>
      )}
    </View>
  );
}

function FilterInput({
  placeholder,
  flex,
  keyboardType,
  value,
  onChangeText,
}: {
  placeholder: string;
  flex: number;
  keyboardType?: any;
  value?: string;
  onChangeText?: (text: string) => void;
}) {
  const { TextInput } = require("react-native");
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
      style={{
        flex,
        backgroundColor: colors.offwhite.DEFAULT,
        borderWidth: 1.5,
        borderColor: colors.cream.dark,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 12,
        color: colors.brown.dark,
      }}
    />
  );
}

// ── Section header ────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle: string; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
      <View>
        <Text
          style={{
            color: colors.brown.DEFAULT,
            fontSize: 19,
            fontWeight: "800",
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={{ color: "#8B3A3A", fontSize: 13, fontWeight: "600" }}>
          {t("common.seeAll")} →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Liste vedette (données réelles) ───────────────────────────────────

function FeaturedList({
  items, onPress,
}: {
  items:   Property[];
  onPress: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ height: 170, backgroundColor: colors.cream.light, borderRadius: 20,
          alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="home-outline" size={36} color={colors.cream.dark} />
          <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 8 }}>
            {t("home.noFeatured")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeaturedCard property={item} onPress={() => onPress(item.id)} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingRight: 8 }}
      initialNumToRender={3}
      maxToRenderPerBatch={2}
      windowSize={3}
    />
  );
}

function FeaturedCard({
  property, onPress,
}: {
  property: Property;
  onPress:  () => void;
}) {
  const { t } = useTranslation();
  const img     = property.images?.[0];
  const label   = property.category.charAt(0).toUpperCase() + property.category.slice(1);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        width: SW * 0.68,
        borderRadius: 20,
        backgroundColor: colors.surface,
        overflow: "hidden",
        shadowColor: colors.brown.DEFAULT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Image avec blurhash placeholder */}
      <View style={{ height: 170 }}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: "100%", height: 170 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
            placeholder={PROP_BLURHASH}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.brown.DEFAULT,
            alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={40} color={colors.gold.DEFAULT + "60"} />
          </View>
        )}

        {/* Badge vedette */}
        {property.is_featured && (
          <View style={{
            position: "absolute", top: 12, left: 12,
            backgroundColor: colors.gold.DEFAULT,
            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ color: colors.brown.DEFAULT, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
              ★ {t("common.featured")}
            </Text>
          </View>
        )}

        {/* Badge favori */}
        <View style={{
          position: "absolute", top: 10, right: 12,
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: "rgba(0,0,0,0.35)",
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name="heart-outline" size={17} color={colors.offwhite.pure} />
        </View>
      </View>

      {/* Infos */}
      <View style={{ padding: 14 }}>
        <Text style={{ color: colors.brown.dark, fontSize: 15, fontWeight: "700", marginBottom: 4 }}
          numberOfLines={1}>
          {property.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            {property.commune ?? "—"}
          </Text>
          <Text style={{ color: colors.cream.dark, fontSize: 12 }}>·</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>{label}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#8B3A3A", fontSize: 17, fontWeight: "800" }}>
            {formatPrice(property.price, property.currency)}
            {property.transaction === "location" && (
              <Text style={{ fontSize: 11, fontWeight: "400" }}>/{t("common.month")}</Text>
            )}
          </Text>
          {property.bedrooms ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="bed-outline" size={13} color={colors.text.secondary} />
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                {property.bedrooms} {t("home.rooms")}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Liste annonces récentes (données réelles) ─────────────────────────

function RecentList({
  items, onPress,
}: {
  items:   Property[];
  onPress: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      {items.map((item) => (
        <RecentCard key={item.id} property={item} onPress={() => onPress(item.id)} />
      ))}
    </View>
  );
}

function RecentCard({
  property, onPress,
}: {
  property: Property;
  onPress:  () => void;
}) {
  const { t } = useTranslation();
  const img   = property.images?.[0];
  const label = property.category.charAt(0).toUpperCase() + property.category.slice(1);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: colors.brown.DEFAULT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Miniature avec blurhash */}
      <View style={{ width: 100 }}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: 100, height: "100%", minHeight: 90 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            placeholder={PROP_BLURHASH}
          />
        ) : (
          <View style={{ flex: 1, minHeight: 90, backgroundColor: colors.brown.medium,
            alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="home-outline" size={28} color={colors.gold.DEFAULT + "80"} />
          </View>
        )}
      </View>

      {/* Infos */}
      <View style={{ flex: 1, padding: 13, justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: colors.brown.dark, fontSize: 14, fontWeight: "700" }}
            numberOfLines={1}>
            {property.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
            <Ionicons name="location-outline" size={11} color={colors.text.secondary} />
            <Text style={{ color: colors.text.secondary, fontSize: 11 }}>
              {property.commune ?? "—"} · {label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center",
          justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ color: "#8B3A3A", fontSize: 15, fontWeight: "800" }}>
            {formatPrice(property.price, property.currency)}
            {property.transaction === "location" && (
              <Text style={{ fontSize: 10, fontWeight: "400" }}>/{t("common.month")}</Text>
            )}
          </Text>
          {property.surface_m2 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="resize-outline" size={11} color={colors.text.secondary} />
              <Text style={{ color: colors.text.secondary, fontSize: 11 }}>
                {property.surface_m2} m²
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <View style={{ alignItems: "center", justifyContent: "center", paddingRight: 12 }}>
        <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ── Section "Pourquoi Senzedy" ────────────────────────────────────────
function WhySenzedy() {
  const { t } = useTranslation();
  const points = [
    { icon: "shield-checkmark-outline" as const, title: t("home.trustTitle"),         text: t("home.trustDesc") },
    { icon: "flash-outline"            as const, title: t("home.speedTitle"),         text: t("home.speedDesc") },
    { icon: "trending-up-outline"      as const, title: t("home.opportunitiesTitle"), text: t("home.opportunitiesDesc") },
    { icon: "diamond-outline"          as const, title: t("home.exclusivityTitle"),   text: t("home.exclusivityDesc") },
    { icon: "eye-outline"              as const, title: t("home.visionTitle"),        text: t("home.visionDesc") },
  ];

  return (
    <View
      style={{
        marginTop: 36,
        marginHorizontal: 16,
        backgroundColor: colors.brown.DEFAULT,
        borderRadius: 24,
        padding: 24,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <View style={{ width: 3, height: 20, backgroundColor: colors.gold.DEFAULT, borderRadius: 2 }} />
        <Text style={{ color: colors.gold.DEFAULT, fontSize: 16, fontWeight: "800", letterSpacing: 1 }}>
          {t("home.whySenzedy")}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        {points.map((p) => (
          <View key={p.title} style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: colors.brown.light + "60",
                borderWidth: 1,
                borderColor: colors.gold.DEFAULT + "40",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons name={p.icon} size={20} color={colors.gold.DEFAULT} />
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 14, fontWeight: "700", marginBottom: 2 }}>
                {p.title}
              </Text>
              <Text style={{ color: colors.text.muted, fontSize: 12, lineHeight: 17 }}>
                {p.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Modal sélecteur générique ─────────────────────────────────────────
interface Option { label: string; value: string; labelKey?: string }

function SelectorModal({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible:  boolean;
  title:    string;
  options:  Option[];
  selected: Option;
  onSelect: (opt: Option) => void;
  onClose:  () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.offwhite.DEFAULT,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "65%",
            overflow: "hidden",
          }}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cream.dark }} />
          </View>

          {/* Titre */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.cream.dark,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: colors.brown.DEFAULT, fontSize: 16, fontWeight: "700" }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Liste */}
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.cream.light,
                  backgroundColor:
                    selected.value === item.value
                      ? "#8B3A3A08"
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    color:
                      selected.value === item.value
                        ? "#8B3A3A"
                        : colors.brown.dark,
                    fontSize: 14,
                    fontWeight: selected.value === item.value ? "700" : "400",
                  }}
                >
                  {item.labelKey ? t(item.labelKey) : item.label}
                </Text>
                {selected.value === item.value && (
                  <Ionicons name="checkmark-circle" size={18} color="#8B3A3A" />
                )}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
