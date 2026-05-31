/**
 * SENZEDY AGENCY — src/screens/FavoritesScreen.tsx
 * Mes biens favoris — depuis Supabase
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { formatPrice } from "../services/propertyService";
import type { MainStackNavProp } from "../navigation/AppNavigator";
import type { Currency } from "../types/database";

interface FavProperty {
  id: string;
  title: string;
  price: number;
  currency: Currency;
  commune: string | null;
  images: string[];
  bedrooms: number | null;
  surface_m2: number | null;
  transaction: string;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<MainStackNavProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: favs, error: favErr } = await supabase
          .from("favorites")
          .select("property_id")
          .eq("user_id", user.id);

        if (favErr) throw favErr;
        if (!favs || favs.length === 0) { if (mounted) setLoading(false); return; }

        const ids = favs.map((f: { property_id: string }) => f.property_id);
        const { data: props, error: propsErr } = await supabase
          .from("properties")
          .select("id, title, price, currency, commune, images, bedrooms, surface_m2, transaction")
          .in("id", ids);

        if (propsErr) throw propsErr;
        if (mounted && props) setFavorites(props as FavProperty[]);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("favorites.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={s.count}>{t("favorites.count", { count: favorites.length })}</Text>

        {loading ? (
          <View style={s.emptyState}>
            <ActivityIndicator color={colors.gold.DEFAULT} size="large" />
          </View>
        ) : favorites.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="heart-outline" size={56} color={colors.gold.DEFAULT + "40"} />
            <Text style={s.emptyTitle}>{t("favorites.empty")}</Text>
            <Text style={s.emptyDesc}>
              {t("favorites.emptyDesc")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {favorites.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={s.card}
                onPress={() => navigation.navigate("PropertyDetail", { propertyId: p.id })}
              >
                <Image
                  source={{ uri: p.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80" }}
                  style={s.cardImage}
                  contentFit="cover"
                  placeholder="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
                  transition={300}
                />
                <View style={s.cardBody}>
                  <Text style={s.cardTitle} numberOfLines={1}>{p.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Ionicons name="location-outline" size={12} color={colors.text.muted} />
                    <Text style={s.cardLocation}>{p.commune || "Kinshasa"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {p.bedrooms && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Ionicons name="bed-outline" size={12} color={colors.gold.DEFAULT} />
                        <Text style={s.cardSpec}>{p.bedrooms}</Text>
                      </View>
                    )}
                    {p.surface_m2 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Ionicons name="resize-outline" size={12} color={colors.gold.DEFAULT} />
                        <Text style={s.cardSpec}>{p.surface_m2} m²</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardPrice}>{formatPrice(p.price, p.currency)}</Text>
                </View>
                <Ionicons name="heart" size={20} color={colors.maroon} style={{ position: "absolute", top: 12, right: 12 }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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

  count: { color: colors.text.muted, fontSize: 13, fontFamily: fonts.sans.medium, letterSpacing: 1, marginBottom: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, textAlign: "center", maxWidth: 260, lineHeight: 20 },

  card: {
    flexDirection: "row", backgroundColor: colors.offwhite.pure, borderRadius: 12,
    overflow: "hidden", borderWidth: 1, borderColor: colors.border.DEFAULT, position: "relative",
  },
  cardImage: { width: 110, height: 110 },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: fonts.sans.semiBold, color: colors.text.primary, marginBottom: 4 },
  cardLocation: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.text.muted },
  cardSpec: { fontSize: 11, fontFamily: fonts.sans.medium, color: colors.text.secondary },
  cardPrice: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.gold.DEFAULT, marginTop: 6 },
});
