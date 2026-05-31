/**
 * SENZEDY AGENCY — src/screens/DocumentsScreen.tsx
 * Mes Documents — Contrats, factures, documents du client
 */

import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import ContactModal from "../components/ContactModal";

const BG = colors.dark.bg;
const GOLD = colors.gold.DEFAULT;

interface Document {
  id: string;
  type: string;
  file_url: string | null;
  notes: string | null;
  status: string;
  updated_at: string;
}

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  contrat:  { icon: "document-text-outline", color: "#D4A85A" },
  facture:  { icon: "receipt-outline",       color: "#27AE60" },
  devis:    { icon: "calculator-outline",    color: "#3498DB" },
  autre:    { icon: "folder-outline",        color: colors.text.muted },
};

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("client_documents")
        .select("id, type, file_url, notes, status, updated_at")
        .eq("client_id", user.id)
        .or("type.like.contrat_%,type.like.facture_%,type.like.devis_%,type.like.autre_%")
        .order("updated_at", { ascending: false });

      if (!error && data) setDocuments(data as Document[]);
      setLoading(false);
    })();
  }, [user?.id]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("documents.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

        {/* Compteur */}
        <Text style={s.count}>{t("documents.count", { count: documents.length })}</Text>

        {loading ? (
          <View style={s.emptyState}>
            <ActivityIndicator color={GOLD} size="large" />
          </View>
        ) : documents.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="document-outline" size={56} color={colors.text.muted + "40"} />
            <Text style={s.emptyTitle}>{t("documents.empty")}</Text>
            <Text style={s.emptyDesc}>
              {t("documents.emptyDesc")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {documents.map((doc) => {
              const baseType = doc.type.split("_")[0];
              const typeInfo = TYPE_ICONS[baseType] ?? TYPE_ICONS.autre;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={s.docCard}
                  onPress={() => {
                    if (doc.file_url) Linking.openURL(doc.file_url);
                  }}
                >
                  <View style={[s.docIcon, { backgroundColor: typeInfo.color + "20" }]}>
                    <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docTitle}>{(doc.notes ?? doc.type).split(" | ")[0]}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Text style={s.docType}>{baseType.toUpperCase()}</Text>
                      <Text style={s.docDate}>{formatDate(doc.updated_at)}</Text>
                    </View>
                  </View>
                  {doc.file_url && (
                    <Ionicons name="download-outline" size={18} color={GOLD} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={GOLD} />
          <Text style={s.infoText}>
            {t("documents.infoText")}
          </Text>
        </View>

        {/* CTA Contact */}
        <TouchableOpacity style={s.ctaBtn} onPress={() => setContactOpen(true)}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.offwhite.DEFAULT} />
          <Text style={s.ctaText}>{t("documents.requestDocument")}</Text>
        </TouchableOpacity>

      </ScrollView>

      <ContactModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultSubject={t("documents.contactSubject")}
        defaultMessage={t("documents.contactMessage")}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.dark.surface, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: GOLD + "40",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: GOLD, fontSize: 18, fontFamily: fonts.serif.italic, fontStyle: "italic", letterSpacing: 1 },

  count: { color: colors.text.muted, fontSize: 13, fontFamily: fonts.sans.medium, letterSpacing: 1, marginBottom: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: fonts.serif.italic, fontStyle: "italic", color: colors.offwhite.DEFAULT },
  emptyDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.text.muted, textAlign: "center", lineHeight: 20, maxWidth: 280 },

  docCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.dark.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: GOLD + "15",
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  docTitle: { color: colors.offwhite.DEFAULT, fontSize: 14, fontFamily: fonts.sans.semiBold },
  docType: { color: GOLD, fontSize: 10, fontFamily: fonts.sans.bold, letterSpacing: 1.5 },
  docDate: { color: colors.text.muted, fontSize: 11, fontFamily: fonts.sans.regular },

  infoCard: {
    flexDirection: "row", gap: 10, backgroundColor: GOLD + "10",
    borderRadius: 12, padding: 16, marginTop: 24, alignItems: "flex-start",
  },
  infoText: { flex: 1, color: colors.gold.pale, fontSize: 12, fontFamily: fonts.sans.regular, lineHeight: 18 },

  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, marginTop: 16,
  },
  ctaText: { color: colors.offwhite.DEFAULT, fontSize: 14, fontFamily: fonts.sans.bold },
});
