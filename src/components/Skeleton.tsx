/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/components/Skeleton.tsx
 *  Composants skeleton (chargement animé)
 *  Remplace les ActivityIndicator pour un effet
 *  plus moderne et premium.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const GOLD  = "#C9A87E";
const DARK  = "#1A0F0A";
const SURF  = "#221510";

// ─── Animation partagée ────────────────────────────────────────────────

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
}

// ─── Brique de base ────────────────────────────────────────────────────

interface BoxProps {
  width?:        number | string;
  height?:       number;
  borderRadius?: number;
  style?:        any;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }: BoxProps) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: GOLD + "30",
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Ligne de texte ────────────────────────────────────────────────────

export function SkeletonText({
  width = "80%",
  height = 12,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: any;
}) {
  return <SkeletonBox width={width} height={height} borderRadius={6} style={style} />;
}

// ─── Carte EN VEDETTE (HomeScreen) ────────────────────────────────────

export function SkeletonFeaturedCard() {
  return (
    <View style={styles.featuredCard}>
      {/* Image */}
      <SkeletonBox width="100%" height={170} borderRadius={0} />
      {/* Badge */}
      <View style={styles.featuredBadge}>
        <SkeletonBox width={80} height={20} borderRadius={6} />
      </View>
      {/* Infos */}
      <View style={{ padding: 14, gap: 10 }}>
        <SkeletonText width="70%" height={14} />
        <SkeletonText width="50%" height={11} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <SkeletonText width="35%" height={16} />
          <SkeletonText width="20%" height={11} />
        </View>
      </View>
    </View>
  );
}

// ─── Carte RÉCENTE (HomeScreen) ───────────────────────────────────────

export function SkeletonRecentCard() {
  return (
    <View style={styles.recentCard}>
      {/* Miniature */}
      <SkeletonBox width={100} height={90} borderRadius={0} />
      {/* Infos */}
      <View style={{ flex: 1, padding: 13, gap: 8, justifyContent: "center" }}>
        <SkeletonText width="65%" height={13} />
        <SkeletonText width="48%" height={11} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <SkeletonText width="30%" height={14} />
          <SkeletonText width="20%" height={11} />
        </View>
      </View>
    </View>
  );
}

// ─── Loading HomeScreen complet ────────────────────────────────────────

export function SkeletonHomeFeatured() {
  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      <SkeletonFeaturedCard />
      <SkeletonFeaturedCard />
    </View>
  );
}

export function SkeletonHomeRecent() {
  return (
    <View style={{ gap: 12 }}>
      <SkeletonRecentCard />
      <SkeletonRecentCard />
      <SkeletonRecentCard />
    </View>
  );
}

// ─── Skeleton PropertyDetailScreen ────────────────────────────────────

export function SkeletonPropertyDetail({ insets }: { insets: { top: number } }) {
  const opacity = useShimmer();

  return (
    <View style={styles.detailContainer}>
      {/* Galerie */}
      <Animated.View style={[styles.detailGallery, { opacity }]} />

      {/* Bouton retour */}
      <View style={[styles.detailBack, { top: insets.top + 12 }]}>
        <SkeletonBox width={36} height={36} borderRadius={9} />
      </View>

      {/* Contenu */}
      <View style={styles.detailContent}>
        {/* Badge statut */}
        <SkeletonBox width={90} height={24} borderRadius={12} />
        <View style={{ height: 8 }} />

        {/* Titre */}
        <SkeletonText width="85%" height={20} />
        <View style={{ height: 6 }} />
        <SkeletonText width="60%" height={14} />
        <View style={{ height: 20 }} />

        {/* Prix */}
        <SkeletonText width="45%" height={26} />
        <View style={{ height: 20 }} />

        {/* Features row */}
        <View style={styles.detailFeaturesRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.detailFeature}>
              <SkeletonBox width={32} height={32} borderRadius={10} />
              <SkeletonText width={40} height={11} />
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />

        {/* Description — 4 lignes */}
        <SkeletonText width="100%" height={12} />
        <View style={{ height: 6 }} />
        <SkeletonText width="95%" height={12} />
        <View style={{ height: 6 }} />
        <SkeletonText width="88%" height={12} />
        <View style={{ height: 6 }} />
        <SkeletonText width="70%" height={12} />
        <View style={{ height: 24 }} />

        {/* Agent card */}
        <View style={styles.detailAgentCard}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonText width="55%" height={13} />
            <SkeletonText width="70%" height={11} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Featured card */
  featuredCard: {
    width: SW * 0.68,
    borderRadius: 20,
    backgroundColor: SURF,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A1810",
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
  },

  /* Recent card */
  recentCard: {
    flexDirection: "row",
    backgroundColor: SURF,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A1810",
    height: 90,
  },

  /* Property detail */
  detailContainer: {
    flex: 1,
    backgroundColor: "#2A1510",
  },
  detailGallery: {
    width: "100%",
    height: SH * 0.48,
    backgroundColor: DARK,
  },
  detailBack: {
    position: "absolute",
    left: 16,
  },
  detailContent: {
    padding: 20,
  },
  detailFeaturesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: SURF,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  detailFeature: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailAgentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SURF,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A1810",
  },
});
