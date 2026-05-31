/**
 * SENZEDY AGENCY — src/screens/ActualitesScreen.tsx
 * Reproduction fidèle de senzedyagency.com/Articles
 * Articles depuis Supabase + section "En Direct" Immobilier RDC
 */

import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Dimensions, ActivityIndicator, Linking, Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import i18n from "../i18n";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const { width: SW } = Dimensions.get("window");

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  author: string | null;
  created_at: string;
  tags: string[] | null;
}

// Fallback articles si pas de table articles
const FALLBACK_ARTICLES: Article[] = [
  {
    id: "1", title: "Senzedy Agency lance sa nouvelle plateforme digitale",
    excerpt: "Découvrez la nouvelle plateforme de Senzedy Agency, conçue pour simplifier votre recherche immobilière à Kinshasa.",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    category: "actualites", author: "Senzedy Agency", created_at: "2026-01-16", tags: ["plateforme", "digital"],
  },
  {
    id: "3", title: "Guide : Comment acheter un terrain à Kinshasa en toute sécurité",
    excerpt: "Tout ce qu'il faut savoir sur l'achat de terrain en RDC : vérification cadastrale, procédure notariale et conseils.",
    image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    category: "conseils", author: "Senzedy Agency", created_at: "2026-01-10", tags: ["terrain", "guide"],
  },
];

export default function ActualitesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(true);

  const CATEGORIES = [
    { key: "all",            label: t("actualites.catAll") },
    { key: "actualites",     label: t("actualites.catNews") },
    { key: "investissement", label: t("actualites.catInvestment") },
    { key: "marche",         label: t("actualites.catMarket") },
    { key: "conseils",       label: t("actualites.catAdvice") },
    { key: "culture",        label: t("actualites.catCulture") },
  ];

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("id, title, excerpt, image_url, category, author, created_at, tags")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) setArticles(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = activeCategory === "all"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark.surface} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("actualites.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <View style={s.heroSection}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1504711434969-e33886168d4c?w=900&q=80" }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(42,21,16,0.5)", "rgba(42,21,16,0.85)"]} style={StyleSheet.absoluteFillObject} />
          <View style={s.heroContent}>
            {/* Decorative line — BLOG — line */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View style={{ width: 30, height: 1.5, backgroundColor: colors.gold.DEFAULT }} />
              <Text style={s.heroLabel}>{t("actualites.blogLabel")}</Text>
              <View style={{ width: 30, height: 1.5, backgroundColor: colors.gold.DEFAULT }} />
            </View>
            <Text style={s.heroTitle}>{t("actualites.heroTitle")}</Text>
            <Text style={s.heroDesc}>
              {t("actualites.heroDesc")}
            </Text>
          </View>
        </View>

        {/* ══ CATEGORY PILLS ════════════════════════════════════ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 10 }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={[s.pill, active && s.pillActive]}
              >
                <Text style={[s.pillText, active && s.pillTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: 1, backgroundColor: colors.border.DEFAULT, marginHorizontal: 16 }} />

        {/* ══ FEATURED ARTICLE ══════════════════════════════════ */}
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.gold.DEFAULT} size="large" />
          </View>
        ) : featured ? (
          <View style={s.featuredWrap}>
            {/* Image left */}
            <Image
              source={{ uri: featured.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" }}
              style={s.featuredImage}
              contentFit="cover"
            />
            {/* Category badge on image */}
            <View style={s.featuredBadge}>
              <Text style={s.featuredBadgeText}>
                {CATEGORIES.find((c) => c.key === featured.category)?.label || t("actualites.catNews")}
              </Text>
            </View>

            {/* Text right */}
            <View style={s.featuredText}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={12} color={colors.text.muted} />
                <Text style={s.featuredDate}>{formatDate(featured.created_at)}</Text>
                <Text style={s.featuredAuthor}>| {featured.author || "SENZEDY AGENCY"}</Text>
              </View>
              <Text style={s.featuredTitle}>{featured.title}</Text>
              <Text style={s.featuredExcerpt} numberOfLines={3}>{featured.excerpt}</Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}
                onPress={() => Alert.alert(t("actualites.readArticle"), featured.excerpt ?? "")}
              >
                <Text style={s.readLink}>{t("actualites.readArticle")}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.gold.DEFAULT} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ══ MORE ARTICLES ═════════════════════════════════════ */}
        {rest.length > 0 && (
          <View style={s.sectionLight}>
            {/* Divider "Plus d'articles" */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.DEFAULT }} />
              <Text style={{ fontSize: 11, fontFamily: fonts.sans.semiBold, color: colors.text.muted, letterSpacing: 2 }}>{t("actualites.moreArticles")}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.DEFAULT }} />
            </View>

            {rest.map((article) => (
              <View key={article.id} style={s.articleCard}>
                <Image
                  source={{ uri: article.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" }}
                  style={s.articleImage}
                  contentFit="cover"
                />
                <View style={s.articleCardBadge}>
                  <Text style={s.articleCardBadgeText}>
                    {CATEGORIES.find((c) => c.key === article.category)?.label || t("actualites.catNews")}
                  </Text>
                </View>
                <View style={s.articleCardBody}>
                  <Text style={s.articleDate}>{formatDate(article.created_at)} | {article.author || "SENZEDY AGENCY"}</Text>
                  <Text style={s.articleTitle} numberOfLines={2}>{article.title}</Text>
                  <Text style={s.articleExcerpt} numberOfLines={2}>{article.excerpt}</Text>
                  {article.tags && article.tags.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                      {article.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={s.tag}>
                          <Text style={s.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ══ EN DIRECT — IMMOBILIER RDC (dark section) ═════════ */}
        <View style={s.sectionDark}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            <Ionicons name="radio-outline" size={16} color="#EF4444" />
            <Text style={{ fontSize: 10, fontFamily: fonts.sans.bold, color: "#EF4444", letterSpacing: 3 }}>{t("actualites.liveLabel")}</Text>
          </View>
          <Text style={s.liveTitle}>{t("actualites.liveTitle")}</Text>
          <View style={s.goldDivider} />
          <Text style={s.liveDesc}>
            {t("actualites.liveDesc")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.gold.pale, textAlign: "center", marginTop: 20 }}>
            {t("actualites.noLiveNews")}
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
  headerTitle: { color: colors.gold.DEFAULT, fontSize: 18, fontFamily: fonts.sans.bold, letterSpacing: 1 },

  // Hero
  heroSection: { height: 260, justifyContent: "flex-end" },
  heroContent: { padding: 24 },
  heroLabel: { color: colors.gold.DEFAULT, fontSize: 11, fontFamily: fonts.sans.bold, letterSpacing: 4 },
  heroTitle: { color: colors.offwhite.DEFAULT, fontSize: 30, fontFamily: fonts.sans.bold, marginBottom: 10 },
  heroDesc: { color: colors.offwhite.DEFAULT, fontSize: 13, fontFamily: fonts.sans.regular, opacity: 0.85, lineHeight: 20 },

  // Pills
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border.DEFAULT, backgroundColor: colors.offwhite.pure },
  pillActive: { backgroundColor: colors.dark.bg, borderColor: colors.dark.bg },
  pillText: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.text.secondary, letterSpacing: 1.5 },
  pillTextActive: { color: colors.offwhite.DEFAULT },

  // Featured article
  featuredWrap: { padding: 20, position: "relative" },
  featuredImage: { width: "100%", height: 220, borderRadius: 0 },
  featuredBadge: { position: "absolute", top: 28, left: 28, backgroundColor: colors.gold.DEFAULT, paddingHorizontal: 10, paddingVertical: 5 },
  featuredBadgeText: { color: colors.offwhite.DEFAULT, fontSize: 9, fontFamily: fonts.sans.bold, letterSpacing: 1.5 },
  featuredText: { paddingTop: 16 },
  featuredDate: { fontSize: 10, fontFamily: fonts.sans.semiBold, color: colors.text.muted, letterSpacing: 1 },
  featuredAuthor: { fontSize: 10, fontFamily: fonts.sans.semiBold, color: colors.text.muted, letterSpacing: 1 },
  featuredTitle: { fontSize: 24, fontFamily: fonts.sans.bold, color: colors.text.primary, marginBottom: 8 },
  featuredExcerpt: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, lineHeight: 20 },
  readLink: { fontSize: 11, fontFamily: fonts.sans.bold, color: colors.gold.DEFAULT, letterSpacing: 2 },

  // More articles
  sectionLight: { paddingHorizontal: 20, paddingVertical: 24 },
  articleCard: { backgroundColor: colors.offwhite.pure, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: 16, position: "relative" },
  articleImage: { width: "100%", height: 160 },
  articleCardBadge: { position: "absolute", top: 12, left: 12, backgroundColor: colors.dark.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  articleCardBadgeText: { color: colors.offwhite.DEFAULT, fontSize: 9, fontFamily: fonts.sans.bold, letterSpacing: 1.5 },
  articleCardBody: { padding: 16 },
  articleDate: { fontSize: 10, fontFamily: fonts.sans.medium, color: colors.text.muted, letterSpacing: 0.5, marginBottom: 6 },
  articleTitle: { fontSize: 17, fontFamily: fonts.sans.bold, color: colors.text.primary, marginBottom: 6, lineHeight: 24 },
  articleExcerpt: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.secondary, lineHeight: 20 },
  tag: { borderWidth: 1, borderColor: colors.border.DEFAULT, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontFamily: fonts.sans.medium, color: colors.text.secondary },

  // Live section
  sectionDark: { backgroundColor: colors.dark.bg, paddingHorizontal: 20, paddingVertical: 40 },
  goldDivider: { width: 40, height: 2, backgroundColor: colors.gold.DEFAULT, alignSelf: "center", marginVertical: 12 },
  liveTitle: { fontSize: 28, fontFamily: fonts.sans.bold, color: colors.offwhite.DEFAULT, textAlign: "center" },
  liveDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.gold.pale, textAlign: "center", lineHeight: 20 },
});
