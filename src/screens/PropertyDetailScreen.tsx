/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/PropertyDetailScreen.tsx
 *  Étape 14 — Fiche Détails de Luxe & Galerie Interactive
 *
 *  • Carousel plein écran + compteur + badge
 *  • Lightbox (zoom image) en modal
 *  • Header flottant qui apparaît au scroll
 *  • Prix visible, barre de caractéristiques icônes
 *  • Description expandable "Lire la suite"
 *  • Agent card + boutons Appeler / Contacter / Favoris
 *  • Sticky footer animé
 *  • Biens similaires horizontal
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  Animated,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image }             from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient }    from "expo-linear-gradient";
import { Ionicons }          from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";
import { colors }              from "../theme/colors";
import { SkeletonPropertyDetail } from "../components/Skeleton";
import { usePropertyDetail }   from "../hooks/useProperties";
import { useFavoriteToggle }   from "../hooks/useProperties";
import {
  fetchSimilarProperties,
  formatPrice,
  getMainImage,
  getDaysAgo,
  getFeaturesSummary,
} from "../services/propertyService";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type Property,
} from "../types/property";
import { useAuth } from "../context/AuthContext";
import ContactModal from "../components/ContactModal";

const { width: SW, height: SH } = Dimensions.get("window");
const GALLERY_H = SH * 0.48;
const GOLD      = "#C9A87E";
const MAROON    = "#8B3A3A";

// ─── Props ────────────────────────────────────────────────────────────
interface Props {
  propertyId: string;
  onBack?:    () => void;
  onSimilarPress?: (id: string, title: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

function VideoSection({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = false; });
  return (
    <View style={{ paddingHorizontal: 22, marginTop: 18 }}>
      <Text style={{ color: GOLD, fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        Visite en video
      </Text>
      <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}>
        <VideoView
          player={player}
          style={{ width: "100%", height: 220 }}
          contentFit="contain"
          nativeControls
          allowsFullscreen
        />
      </View>
    </View>
  );
}

export default function PropertyDetailScreen({ propertyId, onBack, onSimilarPress }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();
  const { t }    = useTranslation();

  const { data: property, loading, error, refetch } = usePropertyDetail(
    propertyId,
    user?.id,
    "USD"
  );

  const [currentImg,   setCurrentImg]   = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [similar,      setSimilar]      = useState<Property[]>([]);
  const [contactOpen,  setContactOpen]  = useState(false);

  // Favori avec animation
  const { isFav, loading: favLoading, toggle: toggleFav } = useFavoriteToggle(
    user?.id,
    propertyId
  );
  const heartScale = useRef(new Animated.Value(1)).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, bounciness: 20 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, bounciness: 8  }),
    ]).start();
  };

  const handleFav = useCallback(() => {
    animateHeart();
    toggleFav();
  }, [toggleFav]);

  // Header opacity au scroll
  const scrollY       = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange:  [GALLERY_H - 90, GALLERY_H - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const headerBg = scrollY.interpolate({
    inputRange:  [GALLERY_H - 90, GALLERY_H],
    outputRange: ["rgba(59,31,26,0)", "rgba(59,31,26,1)"],
    extrapolate: "clamp",
  });

  // Biens similaires
  useEffect(() => {
    if (!property) return;
    fetchSimilarProperties(property.id, property.category, property.commune, 4, "USD")
      .then(setSimilar);
  }, [property]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleCall = useCallback(() => {
    setContactOpen(true);
  }, []);

  const handleContact = useCallback(() => {
    setContactOpen(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (!property) return;
    await Share.share({
      title:   property.title,
      message: `${property.title} — ${formatPrice(property.price, property.currency)}\nSenzedy Agency`,
    });
  }, [property]);

  // ── Etats chargement / erreur ─────────────────────────────────────
  if (loading) {
    return <SkeletonPropertyDetail insets={insets} />;
  }

  if (error || !property) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.cream.dark} />
        <Text style={{ color: colors.brown.DEFAULT, fontSize: 16, fontWeight: "700", textAlign: "center" }}>
          {error ?? t("propertyDetail.unavailable")}
        </Text>
        <TouchableOpacity onPress={refetch} style={{ backgroundColor: MAROON, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Ionicons name="refresh-outline" size={15} color={GOLD} />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{t("common.retry")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: MAROON, fontSize: 13, fontWeight: "600" }}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images    = property.images?.length ? property.images : [];
  const hasImages = images.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>

      {/* ── HEADER FLOTTANT ────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 16,
          flexDirection: "row", alignItems: "center", gap: 12,
          backgroundColor: headerBg,
        }}
      >
        <TouchableOpacity onPress={onBack} style={topBtnStyle}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Animated.Text
          numberOfLines={1}
          style={{ flex: 1, color: "#fff", fontSize: 15, fontWeight: "700", opacity: headerOpacity }}
        >
          {property.title}
        </Animated.Text>
        <TouchableOpacity onPress={handleShare} style={topBtnStyle}>
          <Ionicons name="share-outline" size={19} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── SCROLL ─────────────────────────────────────────────────── */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

        {/* ── GALERIE ─────────────────────────────────────────────── */}
        <View style={{ height: GALLERY_H }}>
          {hasImages ? (
            <ScrollView
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setCurrentImg(Math.round(e.nativeEvent.contentOffset.x / SW))
              }
            >
              {images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.95}
                  onPress={() => { setLightboxIdx(i); setLightboxOpen(true); }}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: SW, height: GALLERY_H }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={300}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={{ width: SW, height: GALLERY_H, backgroundColor: colors.brown.DEFAULT, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={56} color={GOLD + "40"} />
              <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 10 }}>{t("propertyDetail.noPhoto")}</Text>
            </View>
          )}

          {/* Dégradé haut */}
          <LinearGradient
            colors={["rgba(30,10,5,0.6)", "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 130 }}
            pointerEvents="none"
          />

          {/* Dégradé bas */}
          <LinearGradient
            colors={["transparent", "rgba(242,235,217,0.92)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 70 }}
            pointerEvents="none"
          />

          {/* Boutons haut (toujours visibles) */}
          <View style={{ position: "absolute", top: insets.top + 10, left: 0, right: 0, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onBack} style={topBtnStyle}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={handleShare} style={topBtnStyle}>
                <Ionicons name="share-outline" size={19} color="#fff" />
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <TouchableOpacity
                  onPress={handleFav}
                  disabled={favLoading}
                  style={[topBtnStyle, isFav && { backgroundColor: GOLD + "CC" }]}
                >
                  {favLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name={isFav ? "heart" : "heart-outline"} size={19} color="#fff" />
                  }
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Badge transaction */}
          <View style={{
            position: "absolute", bottom: 24, left: 16,
            backgroundColor: property.transaction === "vente" ? colors.brown.DEFAULT : "#1A6E9E",
            borderRadius: 9, paddingHorizontal: 13, paddingVertical: 6,
          }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>
              {property.transaction === "vente" ? t("common.sale") : t("common.rental")}
            </Text>
          </View>

          {/* Badge vedette */}
          {property.is_featured && (
            <View style={{
              position: "absolute", bottom: 24, left: property.transaction === "vente" ? 110 : 120,
              backgroundColor: GOLD, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6,
            }}>
              <Text style={{ color: colors.brown.DEFAULT, fontSize: 11, fontWeight: "800" }}>★ {t("propertyDetail.vedette")}</Text>
            </View>
          )}

          {/* Compteur + icône galerie */}
          {images.length > 1 && (
            <TouchableOpacity
              onPress={() => { setLightboxIdx(currentImg); setLightboxOpen(true); }}
              style={{
                position: "absolute", bottom: 24, right: 16,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6,
              }}
            >
              <Ionicons name="images-outline" size={13} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {currentImg + 1} / {images.length}
              </Text>
            </TouchableOpacity>
          )}

          {/* Indicateurs dots */}
          {images.length > 1 && images.length <= 10 && (
            <View style={{ position: "absolute", bottom: 68, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: i === currentImg ? 20 : 5, height: 5, borderRadius: 3, backgroundColor: i === currentImg ? GOLD : "rgba(255,255,255,0.45)" }} />
              ))}
            </View>
          )}
        </View>

        {/* ── CONTENU ─────────────────────────────────────────────── */}
        {(property as any).video_url ? <VideoSection url={(property as any).video_url} /> : null}

        <View style={{ paddingHorizontal: 22, paddingTop: 6 }}>

          {/* Titre + statut */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
            <Text style={{ flex: 1, color: colors.brown.dark, fontSize: 23, fontWeight: "800", lineHeight: 30, letterSpacing: 0.1 }}>
              {property.title}
            </Text>
            <View style={{
              backgroundColor: (STATUS_COLORS[property.status] ?? "#27AE60") + "18",
              borderRadius: 9, paddingHorizontal: 11, paddingVertical: 5, flexShrink: 0,
              borderWidth: 1, borderColor: (STATUS_COLORS[property.status] ?? "#27AE60") + "40",
            }}>
              <Text style={{ color: STATUS_COLORS[property.status] ?? "#27AE60", fontSize: 11, fontWeight: "700" }}>
                {STATUS_LABELS[property.status] ?? property.status}
              </Text>
            </View>
          </View>

          {/* Localisation */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 18 }}>
            <Ionicons name="location" size={14} color={GOLD} />
            <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
              {[property.quartier, property.commune, "Kinshasa"].filter(Boolean).join(", ")}
            </Text>
          </View>

          {/* ── PRIX ── */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: colors.offwhite.DEFAULT, borderRadius: 18,
            padding: 18, marginBottom: 22,
            borderWidth: 1, borderColor: GOLD + "25",
            shadowColor: colors.brown.DEFAULT, shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          }}>
            <View>
              <Text style={{ color: colors.text.muted, fontSize: 11, marginBottom: 3, letterSpacing: 0.3 }}>
                {property.transaction === "vente" ? t("propertyDetail.salePrice") : t("propertyDetail.monthlyRent")}
              </Text>
              <Text style={{ color: MAROON, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 }}>
                {formatPrice(property.price, property.currency)}
              </Text>
              {property.transaction === "location" && (
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>{t("common.perMonth")}</Text>
              )}
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.text.muted} />
                <Text style={{ color: colors.text.muted, fontSize: 11 }}>{getDaysAgo(property.created_at, t)}</Text>
              </View>
              <View style={{ backgroundColor: colors.cream.light, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: "600" }}>
                  {CATEGORY_LABELS[property.category] ?? property.category}
                </Text>
              </View>
            </View>
          </View>

          {/* ── BARRE DE CARACTÉRISTIQUES ── */}
          {(property.surface_m2 || property.bedrooms || property.bathrooms || property.floors) && (
            <View style={{ marginBottom: 22 }}>
              <GoldDivider />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                {property.surface_m2  && <FeatureChip icon="resize-outline"    value={`${property.surface_m2} m²`}  label={t("propertyDetail.surface")}    />}
                {property.bedrooms    && <FeatureChip icon="bed-outline"        value={String(property.bedrooms)}    label={t("propertyDetail.bedrooms")}   />}
                {property.bathrooms   && <FeatureChip icon="water-outline"      value={String(property.bathrooms)}   label={t("propertyDetail.bathrooms")}        />}
                {property.floors      && <FeatureChip icon="business-outline"   value={String(property.floors)}      label={t("propertyDetail.floors")}     />}
              </View>
            </View>
          )}

          <GoldDivider />

          {/* ── DESCRIPTION ── */}
          <View style={{ marginVertical: 22 }}>
            <SectionTitle title={t("propertyDetail.description")} />
            <Text
              style={{ color: colors.text.secondary, fontSize: 14, lineHeight: 23, marginTop: 12 }}
              numberOfLines={descExpanded ? undefined : 4}
            >
              {property.description ?? t("propertyDetail.noDescription")}
            </Text>
            {(property.description?.length ?? 0) > 200 && (
              <TouchableOpacity
                onPress={() => setDescExpanded(!descExpanded)}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 }}
              >
                <Text style={{ color: MAROON, fontSize: 13, fontWeight: "700" }}>
                  {descExpanded ? t("propertyDetail.readLess") : t("propertyDetail.readMore")}
                </Text>
                <Ionicons name={descExpanded ? "chevron-up" : "chevron-down"} size={14} color={MAROON} />
              </TouchableOpacity>
            )}
          </View>

          <GoldDivider />

          {/* ── LOCALISATION ── */}
          {(property.address || property.commune) && (
            <View style={{ marginVertical: 22 }}>
              <SectionTitle title={t("propertyDetail.location")} />
              <View style={{
                backgroundColor: colors.offwhite.DEFAULT, borderRadius: 16,
                padding: 16, marginTop: 14, flexDirection: "row", gap: 12, alignItems: "center",
                borderWidth: 1, borderColor: colors.cream.dark,
              }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brown.DEFAULT, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="map-outline" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.brown.dark, fontSize: 14, fontWeight: "600" }}>
                    {property.address ?? `${property.commune}, Kinshasa`}
                  </Text>
                  {property.quartier && (
                    <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>{t("propertyDetail.neighborhood", { name: property.quartier })}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const q = encodeURIComponent(`${property.address ?? property.commune}, Kinshasa`);
                    Linking.openURL(`https://maps.google.com/?q=${q}`);
                  }}
                  style={{ backgroundColor: MAROON, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{t("common.map")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <GoldDivider />

          {/* ── AGENT ── */}
          <View style={{ marginVertical: 22 }}>
            <SectionTitle title={t("propertyDetail.yourAgent")} />
            <View style={{
              backgroundColor: colors.offwhite.DEFAULT, borderRadius: 20,
              padding: 18, marginTop: 14,
              borderWidth: 1, borderColor: GOLD + "25",
              shadowColor: colors.brown.DEFAULT, shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                {/* Avatar */}
                <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brown.DEFAULT, borderWidth: 2.5, borderColor: GOLD, alignItems: "center", justifyContent: "center" }}>
                  {property.agent_avatar ? (
                    <Image source={{ uri: property.agent_avatar }} style={{ width: 58, height: 58, borderRadius: 29 }} contentFit="cover" />
                  ) : (
                    <Text style={{ color: GOLD, fontSize: 18, fontWeight: "700" }}>
                      {(property.agent_name ?? "A").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.brown.dark, fontSize: 16, fontWeight: "700" }}>
                    {property.agent_name ?? "Agent Senzedy Agency"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#27AE60" }} />
                    <Text style={{ color: colors.text.secondary, fontSize: 12 }}>{t("propertyDetail.certifiedAgent")}</Text>
                  </View>
                </View>
              </View>

              {/* Actions agent */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 7, backgroundColor: colors.brown.DEFAULT, borderRadius: 13, paddingVertical: 12,
                  }}
                >
                  <Ionicons name="call-outline" size={16} color={GOLD} />
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{t("common.call")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContact}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 7, backgroundColor: GOLD, borderRadius: 13, paddingVertical: 12,
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.brown.dark} />
                  <Text style={{ color: colors.brown.dark, fontSize: 13, fontWeight: "700" }}>{t("common.contact")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── BIENS SIMILAIRES ── */}
          {similar.length > 0 && (
            <>
              <GoldDivider />
              <View style={{ marginVertical: 22 }}>
                <SectionTitle title={t("propertyDetail.similarProperties")} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -22, marginTop: 14 }}
                  contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
                >
                  {similar.map((p) => <SimilarCard key={p.id} property={p} onPress={() => onSimilarPress?.(p.id, p.title)} />)}
                </ScrollView>
              </View>
            </>
          )}

        </View>
      </Animated.ScrollView>

      {/* ── STICKY FOOTER ─────────────────────────────────────────── */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: colors.offwhite.DEFAULT,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: insets.bottom + 10,
        flexDirection: "row",
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: colors.cream.dark,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}>
        {/* Bouton favori animé */}
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <TouchableOpacity
            onPress={handleFav}
            disabled={favLoading}
            style={{
              width: 52, height: 52, borderRadius: 15,
              borderWidth: 1.5,
              borderColor: isFav ? GOLD : colors.cream.dark,
              backgroundColor: isFav ? GOLD + "18" : colors.offwhite.DEFAULT,
              alignItems: "center", justifyContent: "center",
            }}
          >
            {favLoading
              ? <ActivityIndicator size="small" color={GOLD} />
              : <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? GOLD : colors.text.secondary} />
            }
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton Appeler */}
        <TouchableOpacity
          onPress={handleCall}
          style={{
            width: 52, height: 52, borderRadius: 15,
            backgroundColor: colors.brown.DEFAULT,
            alignItems: "center", justifyContent: "center",
            shadowColor: colors.brown.DEFAULT, shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
          }}
        >
          <Ionicons name="call-outline" size={22} color={GOLD} />
        </TouchableOpacity>

        {/* Bouton Contacter principal */}
        <TouchableOpacity
          onPress={handleContact}
          style={{
            flex: 1, height: 52, borderRadius: 15,
            backgroundColor: GOLD,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
            shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.38, shadowRadius: 10, elevation: 5,
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.brown.dark} />
          <Text style={{ color: colors.brown.dark, fontSize: 15, fontWeight: "800", letterSpacing: 0.3 }}>
            {t("propertyDetail.callAgent")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIGHTBOX ──────────────────────────────────────────────── */}
      <LightboxModal
        visible={lightboxOpen}
        images={images}
        initialIndex={lightboxIdx}
        onClose={() => setLightboxOpen(false)}
      />

      {/* ── CONTACT MODAL ──────────────────────────────────────── */}
      <ContactModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        propertyId={propertyId}
        defaultSubject={`${property.title}`}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════

const topBtnStyle = {
  width: 38, height: 38, borderRadius: 10,
  backgroundColor: "rgba(0,0,0,0.42)",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

function GoldDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.cream.dark }} />
      <Ionicons name="diamond-outline" size={9} color={GOLD} />
      <View style={{ flex: 1, height: 1, backgroundColor: colors.cream.dark }} />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 3, height: 20, backgroundColor: GOLD, borderRadius: 2 }} />
      <Text style={{ color: colors.brown.DEFAULT, fontSize: 17, fontWeight: "800", letterSpacing: 0.2 }}>{title}</Text>
    </View>
  );
}

function FeatureChip({ icon, value, label }: {
  icon:  keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.offwhite.DEFAULT, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 11,
      borderWidth: 1, borderColor: colors.cream.dark,
      minWidth: 90, flex: 1,
    }}>
      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: colors.brown.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={16} color={GOLD} />
      </View>
      <View>
        <Text style={{ color: colors.brown.dark, fontSize: 15, fontWeight: "800" }}>{value}</Text>
        <Text style={{ color: colors.text.muted, fontSize: 10 }}>{label}</Text>
      </View>
    </View>
  );
}

function SimilarCard({ property, onPress }: { property: Property; onPress?: () => void }) {
  const { t } = useTranslation();
  const img = getMainImage(property);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ width: 195, borderRadius: 16, backgroundColor: colors.surface, overflow: "hidden", shadowColor: colors.brown.DEFAULT, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
    >
      <View style={{ height: 115 }}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.brown.medium, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="home-outline" size={28} color={GOLD + "60"} />
          </View>
        )}
        <View style={{ position: "absolute", top: 9, left: 9, backgroundColor: property.transaction === "vente" ? colors.brown.DEFAULT : "#1A6E9E", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
            {property.transaction === "vente" ? t("common.sale") : t("common.rental")}
          </Text>
        </View>
      </View>
      <View style={{ padding: 11 }}>
        <Text style={{ color: colors.brown.dark, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>{property.title}</Text>
        <Text style={{ color: colors.text.secondary, fontSize: 10, marginTop: 2 }} numberOfLines={1}>{property.commune ?? "—"}</Text>
        <Text style={{ color: MAROON, fontSize: 14, fontWeight: "800", marginTop: 5 }}>
          {formatPrice(property.price, property.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────
function LightboxModal({ visible, images, initialIndex, onClose }: {
  visible: boolean; images: string[]; initialIndex: number; onClose: () => void;
}) {
  const insets  = useSafeAreaInsets();
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => { if (visible) setCurrent(initialIndex); }, [visible, initialIndex]);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>

        {/* Fermer */}
        <TouchableOpacity
          onPress={onClose}
          style={{ position: "absolute", top: insets.top + 12, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Compteur */}
        <View style={{ position: "absolute", top: insets.top + 18, left: 0, right: 0, zIndex: 10, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
            {current + 1} / {images.length}
          </Text>
        </View>

        {/* Images plein écran */}
        <ScrollView
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentOffset={{ x: initialIndex * SW, y: 0 }}
          onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / SW))}
        >
          {images.map((uri, i) => (
            <View key={i} style={{ width: SW, height: SH, alignItems: "center", justifyContent: "center" }}>
              <Image
                source={{ uri }}
                style={{ width: SW, height: SH * 0.8 }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
          ))}
        </ScrollView>

        {/* Thumbnails bas */}
        <View style={{ paddingBottom: insets.bottom + 14, paddingTop: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {images.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 56, height: 56, borderRadius: 10,
                    borderWidth: i === current ? 2 : 0,
                    borderColor: GOLD,
                    opacity: i === current ? 1 : 0.45,
                  }}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
