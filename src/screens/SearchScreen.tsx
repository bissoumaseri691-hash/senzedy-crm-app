/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/SearchScreen.tsx
 *  Étape 13 — Recherche & Filtrage dynamique
 *
 *  • SearchBar avec debounce 400ms
 *  • FilterBar chips horizontaux (transaction + catégorie)
 *  • AdvancedFilters Bottom Sheet (budget + chambres)
 *  • Résultats temps réel depuis Supabase
 *  • Compteur "N biens trouvés"
 *  • État vide élégant avec reset
 *  • Filtres actifs mis en avant avec fond/bordure dorée
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { SkeletonRecentCard } from "../components/Skeleton";
import { Image }          from "expo-image";
import { Ionicons }       from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";

import { useTranslation } from "react-i18next";
import { colors }          from "../theme/colors";
import { searchProperties } from "../services/propertyService";
import {
  formatPrice,
  getMainImage,
  getDaysAgo,
  getFeaturesSummary,
} from "../services/propertyService";
import type {
  Property,
  PropertyFilters,
  PropertyCategory,
  TransactionType,
} from "../types/property";
import type { MainStackNavProp, MainStackParamList } from "../navigation/AppNavigator";

const { width: SW, height: SH } = Dimensions.get("window");
const GOLD   = "#C9A87E";
const MAROON = "#8B3A3A";
const DEBOUNCE_MS = 400;

// ─── Constante pour getItemLayout ─────────────────────────────────────
// Chaque ResultCard a une hauteur fixe + marge basse
const CARD_HEIGHT    = 110;   // hauteur de la carte
const CARD_MARGIN    = 10;    // marginBottom dans le style
const CARD_ITEM_SIZE = CARD_HEIGHT + CARD_MARGIN;

// Blurhash générique pendant le chargement des photos
const PROP_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

// ─── Catégories ───────────────────────────────────────────────────────
const CATEGORIES: { labelKey: string; value: PropertyCategory | "all"; icon: keyof typeof Ionicons.glyphMap }[] = [
  { labelKey: "search.allCategories",  value: "all",        icon: "grid-outline"        },
  { labelKey: "search.villas",         value: "villa",       icon: "business-outline"    },
  { labelKey: "search.apartments",     value: "appartement", icon: "layers-outline"      },
  { labelKey: "search.houses",         value: "maison",      icon: "home-outline"        },
  { labelKey: "search.lands",          value: "terrain",     icon: "map-outline"         },
  { labelKey: "search.offices",        value: "bureau",      icon: "briefcase-outline"   },
];

// ─── Plages de budget ─────────────────────────────────────────────────
const PRICE_PRESETS = [
  { labelKey: "search.allBudgets", label: "Tous budgets", min: 0,       max: 0 },
  { labelKey: "",                  label: "< $50k",       min: 0,       max: 50_000 },
  { labelKey: "",                  label: "$50k – $100k", min: 50_000,  max: 100_000 },
  { labelKey: "",                  label: "$100k – $250k",min: 100_000, max: 250_000 },
  { labelKey: "",                  label: "$250k – $500k",min: 250_000, max: 500_000 },
  { labelKey: "",                  label: "> $500k",      min: 500_000, max: 0 },
];

// ─── Chambres ─────────────────────────────────────────────────────────
const BEDROOM_OPTIONS = [
  { labelKey: "search.bedroomAll", label: "Tout", value: 0 },
  { labelKey: "",                  label: "1+",   value: 1 },
  { labelKey: "", label: "2+",   value: 2 },
  { labelKey: "", label: "3+",   value: 3 },
  { labelKey: "", label: "4+",   value: 4 },
  { labelKey: "", label: "5+",   value: 5 },
];

// ═══════════════════════════════════════════════════════════════════════
//  ÉTAT DES FILTRES
// ═══════════════════════════════════════════════════════════════════════

interface ActiveFilters {
  transaction: TransactionType | "all";
  category:    PropertyCategory | "all";
  pricePreset: number;   // index dans PRICE_PRESETS
  minPrice:    number;
  maxPrice:    number;
  bedrooms:    number;   // 0 = pas de filtre
}

const DEFAULT_FILTERS: ActiveFilters = {
  transaction: "all",
  category:    "all",
  pricePreset: 0,
  minPrice:    0,
  maxPrice:    0,
  bedrooms:    0,
};

function countActiveFilters(f: ActiveFilters): number {
  let n = 0;
  if (f.transaction !== "all") n++;
  if (f.category    !== "all") n++;
  if (f.pricePreset !== 0)     n++;
  if (f.bedrooms    !== 0)     n++;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export default function SearchScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<MainStackNavProp>();
  const route      = useRoute<RouteProp<MainStackParamList, "Search">>();
  const { t }      = useTranslation();

  // Lire les filtres envoyés depuis HomeScreen via route.params
  const routeParams = route.params;

  // Construire les filtres initiaux à partir des route params
  const initialFilters = useMemo((): ActiveFilters => {
    const f = { ...DEFAULT_FILTERS };
    if (routeParams?.transaction) f.transaction = routeParams.transaction;
    if (routeParams?.category)    f.category    = routeParams.category as PropertyCategory | "all";
    if (routeParams?.minPrice || routeParams?.maxPrice) {
      // Chercher un preset correspondant, sinon utiliser custom (preset index -1)
      const min = routeParams.minPrice ?? 0;
      const max = routeParams.maxPrice ?? 0;
      const matchIdx = PRICE_PRESETS.findIndex(p => p.min === min && p.max === max);
      f.pricePreset = matchIdx >= 0 ? matchIdx : 0;
      f.minPrice    = min;
      f.maxPrice    = max;
    }
    if (routeParams?.bedrooms) f.bedrooms = routeParams.bedrooms;
    return f;
  }, [routeParams?.transaction, routeParams?.category, routeParams?.minPrice, routeParams?.maxPrice, routeParams?.bedrooms]);

  // ── États ────────────────────────────────────────────────────────
  const [searchText,    setSearchText]    = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [filters,       setFilters]       = useState<ActiveFilters>(initialFilters);

  // Sync filters when route params change (e.g. navigating from HomeScreen again)
  const prevParamsRef = useRef(routeParams);
  useEffect(() => {
    if (routeParams !== prevParamsRef.current) {
      prevParamsRef.current = routeParams;
      setFilters(initialFilters);
    }
  }, [routeParams, initialFilters]);
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [results,       setResults]       = useState<Property[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [sortMode,      setSortMode]      = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [page,          setPage]          = useState(0);
  const [hasMore,       setHasMore]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCount = countActiveFilters(filters);

  // ── Validation de la saisie ───────────────────────────────────────
  const searchTooShort = searchText.length === 1; // 1 car = trop court

  // ── Debounce de la saisie ─────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Ne déclenche pas la recherche si le texte est trop court
    debounceRef.current = setTimeout(() => {
      const trimmed = searchText.trim();
      setDebouncedText(trimmed.length >= 2 || trimmed.length === 0 ? trimmed : "");
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText]);

  // ── Construction des filtres Supabase ─────────────────────────────
  const supabaseFilters = useMemo((): PropertyFilters => {
    const f: PropertyFilters = {};
    if (filters.transaction !== "all") f.transaction = filters.transaction;
    if (filters.category    !== "all") f.category    = filters.category;
    if (filters.bedrooms    > 0)       f.bedrooms    = filters.bedrooms;
    // Price: use preset if selected, otherwise use custom min/max from route params
    const preset = PRICE_PRESETS[filters.pricePreset];
    if (filters.pricePreset > 0 && preset) {
      if (preset.min > 0) f.minPrice = preset.min;
      if (preset.max > 0) f.maxPrice = preset.max;
    } else {
      if (filters.minPrice > 0) f.minPrice = filters.minPrice;
      if (filters.maxPrice > 0) f.maxPrice = filters.maxPrice;
    }
    // Commune from route params
    if (routeParams?.commune) f.commune = routeParams.commune;
    // Surface from route params
    if (routeParams?.minSurface && routeParams.minSurface > 0) f.minSurface = routeParams.minSurface;
    if (debouncedText)  f.searchQuery = debouncedText;
    return f;
  }, [filters, debouncedText, routeParams?.commune, routeParams?.minSurface]);

  // ── Chargement page 0 quand les filtres changent ─────────────────
  useEffect(() => {
    setPage(0);
    setResults([]);
    setHasMore(true);
    loadResults(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseFilters, sortMode]);

  const loadResults = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 0) setLoading(true);
    else               setLoadingMore(true);
    setError(null);

    try {
      const result = await searchProperties({
        ...supabaseFilters,
        page:     pageNum,
        pageSize: 20,
        orderBy:  sortMode,
      });
      setResults(prev => append ? [...prev, ...result.data] : result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [supabaseFilters, sortMode]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    loadResults(page + 1, true);
  }, [hasMore, loadingMore, loading, page, loadResults]);

  const handleReset = useCallback(() => {
    setSearchText("");
    setDebouncedText("");
    setFilters(DEFAULT_FILTERS);
  }, []);

  const goToDetail = useCallback((id: string) => {
    navigation.navigate("PropertyDetail", { propertyId: id });
  }, [navigation]);

  // ── Résumé du compteur ────────────────────────────────────────────
  const counterLabel = useMemo(() => {
    if (loading)    return t("search.searching");
    if (total === 0) return null;
    return t("search.resultsCount", { count: total });
  }, [loading, total, t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: colors.brown.DEFAULT,
        paddingTop:    insets.top + 10,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: GOLD + "30",
      }}>
        <Text style={{ color: GOLD, fontSize: 18, fontWeight: "800", letterSpacing: 1, marginBottom: 12 }}>
          {t("search.title")}
        </Text>

        {/* SearchBar */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
        }}>
          <Ionicons name="search-outline" size={18} color={colors.cream.dark} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.cream.dark + "80"}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            style={{
              flex: 1, color: "#fff", fontSize: 14,
              fontFamily: "System", paddingVertical: 0,
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={colors.cream.dark} />
            </TouchableOpacity>
          )}
          {loading && !searchTooShort && (
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: GOLD, borderTopColor: "transparent", opacity: 0.8 }} />
          )}
        </View>

        {/* Validation : texte trop court */}
        {searchTooShort && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 4 }}>
            <Ionicons name="information-circle-outline" size={13} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 11, fontWeight: "500", opacity: 0.85 }}>
              {t("search.minChars")}
            </Text>
          </View>
        )}
      </View>

      {/* ── FILTER BAR ─────────────────────────────────────────────── */}
      <View style={{ backgroundColor: colors.offwhite.DEFAULT, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cream.dark }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8, alignItems: "center" }}
        >
          {/* Bouton Filtres avancés */}
          <TouchableOpacity
            onPress={() => setShowAdvanced(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 9,
              borderRadius: 20, borderWidth: 1.5,
              borderColor:     activeCount > 0 ? GOLD : colors.cream.dark,
              backgroundColor: activeCount > 0 ? GOLD + "15" : "transparent",
            }}
          >
            <Ionicons name="options-outline" size={15} color={activeCount > 0 ? GOLD : colors.brown.DEFAULT} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: activeCount > 0 ? GOLD : colors.brown.DEFAULT }}>
              {t("search.filtersLabel")}
            </Text>
            {activeCount > 0 && (
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.brown.DEFAULT, fontSize: 10, fontWeight: "800" }}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={{ width: 1, height: 22, backgroundColor: colors.cream.dark, marginHorizontal: 2 }} />

          {/* Transaction : Vente / Location */}
          {(["all", "vente", "location"] as const).map((tr) => {
            const active = filters.transaction === tr;
            const label  = tr === "all" ? t("search.allTransaction") : tr === "vente" ? t("search.sale") : t("search.rental");
            return (
              <TouchableOpacity
                key={tr}
                onPress={() => setFilters(prev => ({ ...prev, transaction: tr }))}
                style={{
                  paddingHorizontal: 14, paddingVertical: 9,
                  borderRadius: 20, borderWidth: 1.5,
                  borderColor:     active ? GOLD : colors.cream.dark,
                  backgroundColor: active ? GOLD + "15" : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? GOLD : colors.text.secondary }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Séparateur */}
          <View style={{ width: 1, height: 22, backgroundColor: colors.cream.dark, marginHorizontal: 2 }} />

          {/* Catégories */}
          {CATEGORIES.map((cat) => {
            const active = filters.category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setFilters(prev => ({ ...prev, category: cat.value }))}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  paddingHorizontal: 14, paddingVertical: 9,
                  borderRadius: 20, borderWidth: 1.5,
                  borderColor:     active ? colors.brown.DEFAULT : colors.cream.dark,
                  backgroundColor: active ? colors.brown.DEFAULT : "transparent",
                }}
              >
                <Ionicons name={cat.icon} size={13} color={active ? GOLD : colors.text.secondary} />
                <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? GOLD : colors.text.secondary }}>
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── COMPTEUR + TRI ─────────────────────────────────────────── */}
      {!loading && counterLabel && (
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 16, paddingVertical: 10,
          borderBottomWidth: 1, borderBottomColor: colors.cream.dark,
          backgroundColor: colors.offwhite.DEFAULT,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 3, height: 16, backgroundColor: GOLD, borderRadius: 2 }} />
            <Text style={{ color: colors.brown.DEFAULT, fontSize: 13, fontWeight: "700" }}>
              {counterLabel}
            </Text>
          </View>

          {/* Tri */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {([
                { label: t("search.sortRecent"),    value: "newest"     },
                { label: t("search.sortPriceAsc"),  value: "price_asc"  },
                { label: t("search.sortPriceDesc"), value: "price_desc" },
              ] as { label: string; value: typeof sortMode }[]).map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSortMode(s.value)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderRadius: 8, borderWidth: 1,
                    borderColor:     sortMode === s.value ? GOLD : colors.cream.dark,
                    backgroundColor: sortMode === s.value ? GOLD + "15" : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: sortMode === s.value ? "700" : "400", color: sortMode === s.value ? GOLD : colors.text.secondary }}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── LISTE RÉSULTATS ─────────────────────────────────────────── */}
      {loading ? (
        <LoadingList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadResults(0, false)} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResultCard property={item} onPress={() => goToDetail(item.id)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: insets.bottom + 20,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              onReset={handleReset}
              activeCount={activeCount}
              searchText={debouncedText}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 14, gap: 10 }}>
                <SkeletonRecentCard />
                <SkeletonRecentCard />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // ── Optimisations FlatList ────────────────────────────────
          getItemLayout={(_data, index) => ({
            length: CARD_ITEM_SIZE,
            offset: CARD_ITEM_SIZE * index,
            index,
          })}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          updateCellsBatchingPeriod={50}
        />
      )}

      {/* ── MODAL FILTRES AVANCÉS ────────────────────────────────────── */}
      <AdvancedFiltersModal
        visible={showAdvanced}
        filters={filters}
        onUpdate={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onClose={() => setShowAdvanced(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  CARTE RÉSULTAT
// ═══════════════════════════════════════════════════════════════════════

function ResultCard({ property, onPress }: { property: Property; onPress: () => void }) {
  const { t } = useTranslation();
  const img      = getMainImage(property);
  const features = getFeaturesSummary(property, t);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: CARD_MARGIN,
        height: CARD_HEIGHT,
        shadowColor: colors.brown.DEFAULT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Image avec blurhash placeholder */}
      <View style={{ width: 110 }}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: 110, height: CARD_HEIGHT }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            placeholder={PROP_BLURHASH}
          />
        ) : (
          <View style={{ width: 110, height: CARD_HEIGHT, backgroundColor: colors.brown.medium,
            alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="home-outline" size={28} color={GOLD + "50"} />
          </View>
        )}
        {/* Badge transaction */}
        <View style={{
          position: "absolute", bottom: 8, left: 8,
          backgroundColor: property.transaction === "vente" ? colors.brown.DEFAULT : "#1A6E9E",
          borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
        }}>
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800" }}>
            {property.transaction === "vente" ? t("common.sale") : t("common.rental")}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={{ color: colors.brown.dark, fontSize: 14, fontWeight: "700", marginBottom: 3 }} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 }}>
          <Ionicons name="location-outline" size={11} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: 11 }} numberOfLines={1}>
            {property.commune ?? "—"}
          </Text>
        </View>
        {features ? (
          <Text style={{ color: colors.text.muted, fontSize: 10, marginBottom: 6 }}>{features}</Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" as any }}>
          <Text style={{ color: MAROON, fontSize: 16, fontWeight: "800" }}>
            {formatPrice(property.price, property.currency)}
            {property.transaction === "location" && (
              <Text style={{ fontSize: 10, fontWeight: "400", color: colors.text.secondary }}> /{t("common.month")}</Text>
            )}
          </Text>
          <Text style={{ color: colors.text.muted, fontSize: 10 }}>
            {getDaysAgo(property.created_at, t)}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "center", justifyContent: "center", paddingRight: 10 }}>
        <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  ÉTATS : CHARGEMENT / ERREUR / VIDE
// ═══════════════════════════════════════════════════════════════════════

function LoadingList() {
  return (
    <View style={{ padding: 14, gap: 10 }}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonRecentCard key={i} />
      ))}
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
      <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.cream.light, borderWidth: 1, borderColor: colors.cream.dark, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="wifi-outline" size={30} color={colors.text.muted} />
      </View>
      <Text style={{ color: colors.brown.DEFAULT, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
        {t("search.connectionError")}
      </Text>
      <Text style={{ color: colors.text.secondary, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.brown.DEFAULT, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 }}
      >
        <Ionicons name="refresh-outline" size={15} color={GOLD} />
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{t("common.retry")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ onReset, activeCount, searchText }: {
  onReset: () => void; activeCount: number; searchText: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 }}>
      {/* Ornement */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <View style={{ height: 1, width: 40, backgroundColor: colors.cream.dark }} />
        <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.cream.light, borderWidth: 1.5, borderColor: colors.cream.dark, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="home-outline" size={28} color={colors.cream.dark} />
        </View>
        <View style={{ height: 1, width: 40, backgroundColor: colors.cream.dark }} />
      </View>

      <Text style={{ color: colors.brown.DEFAULT, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 10, letterSpacing: 0.2 }}>
        {t("search.noResults")}
      </Text>
      <Text style={{ color: colors.text.secondary, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 }}>
        {searchText
          ? t("search.noResultsFor", { query: searchText })
          : t("search.noResultsCriteria")
        }
        {"\n"}{t("search.broaderSearch")}
      </Text>

      {(activeCount > 0 || searchText) && (
        <TouchableOpacity
          onPress={onReset}
          style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: colors.brown.DEFAULT, borderRadius: 14,
            paddingHorizontal: 24, paddingVertical: 13,
            shadowColor: colors.brown.DEFAULT, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
          }}
        >
          <Ionicons name="refresh-outline" size={16} color={GOLD} />
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
            {t("search.resetFilters")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MODAL FILTRES AVANCÉS
// ═══════════════════════════════════════════════════════════════════════

interface AdvancedFiltersModalProps {
  visible:  boolean;
  filters:  ActiveFilters;
  onUpdate: (f: ActiveFilters) => void;
  onReset:  () => void;
  onClose:  () => void;
}

function AdvancedFiltersModal({ visible, filters, onUpdate, onReset, onClose }: AdvancedFiltersModalProps) {
  const { t } = useTranslation();
  const insets  = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }, [visible]);

  const activeCount = countActiveFilters(filters);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Pressable
            style={{ backgroundColor: colors.offwhite.DEFAULT, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: SH * 0.85 }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cream.dark }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cream.dark }}>
              <View>
                <Text style={{ color: colors.brown.DEFAULT, fontSize: 17, fontWeight: "800" }}>{t("search.advancedFilters")}</Text>
                {activeCount > 0 && (
                  <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                    {t("search.activeFilters", { count: activeCount })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle-outline" size={26} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* ── TRANSACTION ─────────────────────────────────── */}
              <FilterSection title={t("search.transactionSection")} icon="swap-horizontal-outline">
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {([
                    { label: t("common.allFem"),   value: "all"      },
                    { label: t("search.sale"),     value: "vente"    },
                    { label: t("search.rental"),   value: "location" },
                  ] as { label: string; value: ActiveFilters["transaction"] }[]).map((tr) => {
                    const active = filters.transaction === tr.value;
                    return (
                      <TouchableOpacity
                        key={tr.value}
                        onPress={() => onUpdate({ ...filters, transaction: tr.value })}
                        style={{
                          flex: 1, alignItems: "center", paddingVertical: 12,
                          borderRadius: 13, borderWidth: 1.5,
                          borderColor:     active ? GOLD : colors.cream.dark,
                          backgroundColor: active ? GOLD + "15" : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: active ? "700" : "400", color: active ? GOLD : colors.text.secondary }}>
                          {tr.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              {/* ── CATÉGORIE ────────────────────────────────────── */}
              <FilterSection title={t("search.propertyTypeSection")} icon="home-outline">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORIES.map((cat) => {
                    const active = filters.category === cat.value;
                    return (
                      <TouchableOpacity
                        key={cat.value}
                        onPress={() => onUpdate({ ...filters, category: cat.value })}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          paddingHorizontal: 13, paddingVertical: 9,
                          borderRadius: 20, borderWidth: 1.5,
                          borderColor:     active ? GOLD : colors.cream.dark,
                          backgroundColor: active ? GOLD + "15" : "transparent",
                        }}
                      >
                        <Ionicons name={cat.icon} size={13} color={active ? GOLD : colors.text.secondary} />
                        <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? GOLD : colors.text.secondary }}>
                          {t(cat.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              {/* ── BUDGET ───────────────────────────────────────── */}
              <FilterSection title={t("search.budgetSection")} icon="wallet-outline">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {PRICE_PRESETS.map((preset, idx) => {
                    const active = filters.pricePreset === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => onUpdate({ ...filters, pricePreset: idx, minPrice: preset.min, maxPrice: preset.max })}
                        style={{
                          paddingHorizontal: 13, paddingVertical: 9,
                          borderRadius: 20, borderWidth: 1.5,
                          borderColor:     active ? GOLD : colors.cream.dark,
                          backgroundColor: active ? GOLD + "15" : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: active ? "700" : "400", color: active ? GOLD : colors.text.secondary }}>
                          {preset.labelKey ? t(preset.labelKey) : preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              {/* ── CHAMBRES ─────────────────────────────────────── */}
              <FilterSection title={t("search.bedroomsSection")} icon="bed-outline">
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {BEDROOM_OPTIONS.map((opt) => {
                    const active = filters.bedrooms === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => onUpdate({ ...filters, bedrooms: opt.value })}
                        style={{
                          flex: 1, alignItems: "center", paddingVertical: 11,
                          borderRadius: 12, borderWidth: 1.5,
                          borderColor:     active ? GOLD : colors.cream.dark,
                          backgroundColor: active ? GOLD + "15" : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: active ? "800" : "500", color: active ? GOLD : colors.text.secondary }}>
                          {opt.labelKey ? t(opt.labelKey) : opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

            </ScrollView>

            {/* Footer */}
            <View style={{
              flexDirection: "row", gap: 12,
              paddingHorizontal: 20, paddingVertical: 16,
              paddingBottom: insets.bottom + 12,
              borderTopWidth: 1, borderTopColor: colors.cream.dark,
              backgroundColor: colors.offwhite.DEFAULT,
            }}>
              <TouchableOpacity
                onPress={onReset}
                style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.cream.dark, flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="refresh-outline" size={15} color={colors.brown.DEFAULT} />
                <Text style={{ color: colors.brown.DEFAULT, fontSize: 13, fontWeight: "600" }}>{t("search.clear")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{ flex: 1, backgroundColor: MAROON, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: MAROON, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }}
              >
                <Ionicons name="search-outline" size={16} color={GOLD} />
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 }}>
                  {t("search.viewResults")}{activeCount > 0 ? ` (${activeCount})` : ""}
                </Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Section de filtre avec icône ──────────────────────────────────────
function FilterSection({ title, icon, children }: {
  title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.cream.light }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.brown.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={icon} size={15} color={GOLD} />
        </View>
        <Text style={{ color: colors.brown.DEFAULT, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
