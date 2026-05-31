/**
 * SENZEDY AGENCY -- src/screens/ContactScreen.tsx
 * Page Contact -- Coordonnees & formulaire (Supabase)
 */

import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { submitContactRequest } from "../services/contactService";

// -- Coordonnees (tappable links) ---------------
const COORDONNEES_KEYS = [
  { icon: "location-outline" as const, labelKey: "contact.address", value: "Quartier Domaine, Commune N\u2019sele Dajin,\nKinshasa, RDC", link: undefined },
  { icon: "logo-whatsapp" as const, labelKey: "contact.whatsapp", value: "+243 997 628 617", link: "https://wa.me/243997628617" },
  { icon: "call-outline" as const, labelKey: "contact.phone", value: "+243 997 628 617", link: "tel:+243997628617" },
  { icon: "call-outline" as const, labelKey: "contact.phone2", value: "07 59 63 58 34", link: "tel:+33759635834" },
  { icon: "mail-outline" as const, labelKey: "contact.email", value: "agency.senzedy@yahoo.com", link: "mailto:agency.senzedy@yahoo.com" },
];

const HORAIRES_KEYS = [
  { jourKey: "contact.mondayFriday", heure: "08h00 - 18h00" },
  { jourKey: "contact.saturday", heure: "09h00 - 14h00" },
  { jourKey: "contact.sunday", heureKey: "contact.closed" },
];

// ==========================================================================
export default function ContactScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim() || !email.trim() || !message.trim()) {
      Alert.alert(t("contact.requiredFields"), t("contact.fillRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(t("contact.invalidEmail"), t("contact.invalidEmailMessage"));
      return;
    }

    setLoading(true);
    const result = await submitContactRequest({
      name: nom,
      email,
      phone: telephone || undefined,
      subject: sujet || undefined,
      message,
      source: "ContactScreen",
    });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      // Reset form
      setNom("");
      setEmail("");
      setTelephone("");
      setSujet("");
      setMessage("");
    } else {
      Alert.alert(
        t("contact.sendError"),
        result.error ?? t("contact.sendErrorMessage")
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brown.DEFAULT} />

      {/* -- Header -- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("contact.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* -- Hero -- */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.brown.DEFAULT, colors.brown.dark]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.gold.DEFAULT} />
              <Text style={styles.heroTitle}>{t("contact.heroTitle")}</Text>
              <Text style={styles.heroDesc}>
                {t("contact.heroDesc")}
              </Text>
            </View>
          </View>

          {/* -- Coordonnees -- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contact.coordinates")}</Text>
            <View style={{ gap: 12 }}>
              {COORDONNEES_KEYS.map((c) => (
                <TouchableOpacity
                  key={c.labelKey}
                  style={styles.coordCard}
                  onPress={() => c.link && Linking.openURL(c.link)}
                  activeOpacity={c.link ? 0.7 : 1}
                >
                  <View style={[styles.coordIcon, c.icon === "logo-whatsapp" && { backgroundColor: "#25D366" + "20" }]}>
                    <Ionicons name={c.icon} size={20} color={c.icon === "logo-whatsapp" ? "#25D366" : colors.gold.DEFAULT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.coordLabel}>{t(c.labelKey)}</Text>
                    <Text style={styles.coordValue}>{c.value}</Text>
                  </View>
                  {c.link && (
                    <Ionicons name="open-outline" size={16} color={colors.text.muted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* -- Horaires -- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contact.hours")}</Text>
            <View style={styles.horairesCard}>
              {HORAIRES_KEYS.map((h) => (
                <View key={h.jourKey} style={styles.horaireRow}>
                  <Text style={styles.horaireJour}>{t(h.jourKey)}</Text>
                  <Text style={[styles.horaireHeure, h.heureKey && { color: colors.brown.light }]}>
                    {h.heureKey ? t(h.heureKey) : h.heure}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* -- Formulaire -- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contact.formTitle")}</Text>
            <Text style={styles.sectionSubtitle}>
              {t("contact.formSubtitle")}
            </Text>

            {submitted ? (
              <View style={styles.successCard}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={28} color={colors.offwhite.DEFAULT} />
                </View>
                <Text style={styles.successTitle}>{t("contact.successTitle")}</Text>
                <Text style={styles.successDesc}>
                  {t("contact.successDesc")}
                </Text>
                <TouchableOpacity
                  style={styles.newMsgBtn}
                  onPress={() => setSubmitted(false)}
                >
                  <Text style={styles.newMsgBtnText}>{t("contact.newMessage")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("contact.fullName")}</Text>
                  <TextInput
                    style={styles.input}
                    value={nom}
                    onChangeText={setNom}
                    placeholder={t("contact.yourName")}
                    placeholderTextColor={colors.text.muted}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("contact.emailLabel")}</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("contact.phoneLabel")}</Text>
                  <TextInput
                    style={styles.input}
                    value={telephone}
                    onChangeText={setTelephone}
                    placeholder="+243 ..."
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("contact.subject")}</Text>
                  <TextInput
                    style={styles.input}
                    value={sujet}
                    onChangeText={setSujet}
                    placeholder={t("contact.subjectPlaceholder")}
                    placeholderTextColor={colors.text.muted}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("contact.message")}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={t("contact.messagePlaceholder")}
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.offwhite.DEFAULT} />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={18} color={colors.offwhite.DEFAULT} />
                      <Text style={styles.submitBtnText}>{t("common.send")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* -- Reseaux sociaux -- */}
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>{t("contact.followUs")}</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: "#25D366" }]}
                onPress={() => Linking.openURL("https://wa.me/243997628617")}
              >
                <Ionicons name="logo-whatsapp" size={22} color={colors.offwhite.DEFAULT} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => Linking.openURL("https://instagram.com/senzedy_agency")}
              >
                <Ionicons name="logo-instagram" size={22} color={colors.offwhite.DEFAULT} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// -- Styles ----------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brown.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.gold.DEFAULT,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Hero
  heroSection: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    color: colors.gold.DEFAULT,
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
  },
  heroDesc: {
    color: colors.offwhite.DEFAULT,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    opacity: 0.85,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 16,
  },

  // Coordonnees
  coordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.offwhite.DEFAULT,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  coordIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cream.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },

  // Horaires
  horairesCard: {
    backgroundColor: colors.offwhite.DEFAULT,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  horaireRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horaireJour: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  horaireHeure: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },

  // Form
  formCard: {
    backgroundColor: colors.offwhite.DEFAULT,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: {
    color: colors.offwhite.DEFAULT,
    fontSize: 15,
    fontWeight: "700",
  },

  // Success
  successCard: {
    backgroundColor: colors.offwhite.DEFAULT,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gold.DEFAULT + "30",
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text.primary,
  },
  successDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  newMsgBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gold.DEFAULT,
  },
  newMsgBtnText: {
    color: colors.gold.DEFAULT,
    fontSize: 13,
    fontWeight: "600",
  },

  // Social
  socialSection: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: "row",
    gap: 14,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brown.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
});
