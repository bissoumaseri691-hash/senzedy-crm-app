/**
 * SENZEDY AGENCY -- src/screens/MessagesScreen.tsx
 * Messages -- Hub de communication avec l'agence
 * Canaux rapides (WhatsApp, telephone, email) + historique demandes
 */

import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  ActivityIndicator,
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

interface ContactRequest {
  id: string;
  name: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default function MessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("contact_requests")
          .select("id, name, subject, message, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) setRequests(data as ContactRequest[]);
      } catch {
        // Table may not exist, graceful fallback
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const openContact = (subject: string) => {
    setContactSubject(subject);
    setContactOpen(true);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const QUICK_ACTIONS = [
    {
      icon: "home-outline" as const,
      label: t("messages.visitRequest"),
      subject: t("messages.visitRequest"),
    },
    {
      icon: "cash-outline" as const,
      label: t("messages.priceInfo"),
      subject: t("messages.priceInfo"),
    },
    {
      icon: "document-text-outline" as const,
      label: t("messages.documentRequest"),
      subject: t("messages.documentRequest"),
    },
    {
      icon: "chatbubble-outline" as const,
      label: t("messages.otherRequest"),
      subject: t("messages.otherRequest"),
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.offwhite.DEFAULT}
          />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("messages.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Contact Channels */}
        <Text style={s.sectionLabel}>{t("messages.contactChannels")}</Text>

        <View style={s.channelsRow}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={s.channelCard}
            onPress={() =>
              Linking.openURL("https://wa.me/243997628617")
            }
          >
            <View style={[s.channelIcon, { backgroundColor: "#25D366" + "25" }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <Text style={s.channelTitle}>{t("messages.whatsapp")}</Text>
            <Text style={s.channelDesc}>{t("messages.whatsappDesc")}</Text>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            style={s.channelCard}
            onPress={() => Linking.openURL("tel:+243997628617")}
          >
            <View style={[s.channelIcon, { backgroundColor: GOLD + "25" }]}>
              <Ionicons name="call-outline" size={24} color={GOLD} />
            </View>
            <Text style={s.channelTitle}>{t("messages.call")}</Text>
            <Text style={s.channelDesc}>{t("messages.callDesc")}</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={s.channelCard}
            onPress={() =>
              Linking.openURL("mailto:agency.senzedy@yahoo.com")
            }
          >
            <View
              style={[s.channelIcon, { backgroundColor: "#3498DB" + "25" }]}
            >
              <Ionicons name="mail-outline" size={24} color="#3498DB" />
            </View>
            <Text style={s.channelTitle}>{t("messages.email")}</Text>
            <Text style={s.channelDesc}>{t("messages.emailDesc")}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>
          {t("messages.quickActions")}
        </Text>

        <View style={{ gap: 10 }}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={s.actionCard}
              onPress={() => openContact(action.subject)}
            >
              <View style={s.actionIcon}>
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={GOLD}
                />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Requests */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>
          {t("messages.recentRequests")}
        </Text>

        {loading ? (
          <View style={s.emptyState}>
            <ActivityIndicator color={GOLD} size="large" />
            <Text style={s.emptyDesc}>{t("messages.loading")}</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.text.muted + "40"}
            />
            <Text style={s.emptyTitle}>{t("messages.noRequests")}</Text>
            <Text style={s.emptyDesc}>{t("messages.noRequestsDesc")}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {requests.map((req) => {
              const isPending = req.status === "pending" || req.status === "new";
              return (
                <View key={req.id} style={s.requestCard}>
                  <View style={s.requestHeader}>
                    <Text style={s.requestSubject} numberOfLines={1}>
                      {req.subject || req.message.slice(0, 40)}
                    </Text>
                    <View
                      style={[
                        s.statusBadge,
                        {
                          backgroundColor: isPending
                            ? GOLD + "20"
                            : "#25D366" + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.statusText,
                          {
                            color: isPending ? GOLD : "#25D366",
                          },
                        ]}
                      >
                        {isPending
                          ? t("messages.pending")
                          : t("messages.replied")}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.requestMessage} numberOfLines={2}>
                    {req.message}
                  </Text>
                  <Text style={s.requestDate}>
                    {t("messages.sentOn")} {formatDate(req.created_at)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Main CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => openContact(t("messages.contactSubject"))}
        >
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={colors.offwhite.DEFAULT}
          />
          <Text style={s.ctaText}>{t("messages.contactAgency")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ContactModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultSubject={contactSubject}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: GOLD + "40",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: GOLD,
    fontSize: 18,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    letterSpacing: 1,
  },

  sectionLabel: {
    color: GOLD,
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    letterSpacing: 3,
    marginBottom: 14,
  },

  // Channels
  channelsRow: {
    flexDirection: "row",
    gap: 10,
  },
  channelCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: GOLD + "15",
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  channelTitle: {
    color: colors.offwhite.DEFAULT,
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    marginBottom: 4,
  },
  channelDesc: {
    color: colors.text.muted,
    fontSize: 9,
    fontFamily: fonts.sans.regular,
    textAlign: "center",
    lineHeight: 13,
  },

  // Quick actions
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD + "15",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GOLD + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    color: colors.offwhite.DEFAULT,
    fontSize: 14,
    fontFamily: fonts.sans.medium,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
    color: colors.offwhite.DEFAULT,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Request cards
  requestCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD + "15",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestSubject: {
    flex: 1,
    color: colors.offwhite.DEFAULT,
    fontSize: 14,
    fontFamily: fonts.sans.semiBold,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.sans.bold,
    letterSpacing: 1,
  },
  requestMessage: {
    color: colors.text.muted,
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    lineHeight: 18,
    marginBottom: 8,
  },
  requestDate: {
    color: colors.text.muted,
    fontSize: 11,
    fontFamily: fonts.sans.regular,
    opacity: 0.7,
  },

  // CTA
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
  },
  ctaText: {
    color: colors.offwhite.DEFAULT,
    fontSize: 14,
    fontFamily: fonts.sans.bold,
  },
});
