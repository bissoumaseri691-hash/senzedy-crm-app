/**
 * SENZEDY AGENCY — src/screens/SettingsScreen.tsx
 * Paramètres — Modifier profil, changer mot de passe
 */

import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Platform, Alert, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const BG = colors.dark.bg;
const GOLD = colors.gold.DEFAULT;

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const { t } = useTranslation();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { showAlert(t("common.error"), t("settings.nameRequired")); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    }).eq("id", user?.id);
    setSaving(false);
    if (error) {
      showAlert(t("common.error"), error.message);
    } else {
      await refreshProfile();
      showAlert(t("common.success"), t("settings.profileUpdated"));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { showAlert(t("common.error"), t("settings.pwTooShort")); return; }
    if (newPassword !== confirmPassword) { showAlert(t("common.error"), t("settings.pwMismatch")); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      showAlert(t("common.error"), error.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      showAlert(t("common.success"), t("settings.pwChanged"));
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.offwhite.DEFAULT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("settings.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>

          {/* ── Modifier le profil ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{t("settings.editProfile")}</Text>

            <Text style={s.label}>{t("settings.fullName")}</Text>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("settings.yourName")}
              placeholderTextColor={colors.text.muted}
            />

            <Text style={s.label}>{t("settings.phone")}</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+243 XXX XXX XXX"
              placeholderTextColor={colors.text.muted}
              keyboardType="phone-pad"
            />

            <Text style={s.label}>{t("settings.email")}</Text>
            <View style={[s.input, { backgroundColor: "#1A0F0A" }]}>
              <Text style={{ color: colors.text.muted, fontSize: 14 }}>{user?.email}</Text>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? t("settings.saving") : t("settings.saveBtn")}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Changer mot de passe ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{t("settings.changePassword")}</Text>

            <Text style={s.label}>{t("settings.newPassword")}</Text>
            <TextInput
              style={s.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t("settings.minChars")}
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />

            <Text style={s.label}>{t("settings.confirmPassword")}</Text>
            <TextInput
              style={s.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("settings.retypePassword")}
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleChangePassword} disabled={changingPw}>
              <Text style={s.saveBtnText}>{changingPw ? t("settings.changingPw") : t("settings.changePwBtn")}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Infos app ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{t("settings.about")}</Text>
            <InfoLine label={t("settings.version")} value="1.0.0" />
            <InfoLine label={t("settings.platform")} value={Platform.OS} />
            <InfoLine label={t("settings.userId")} value={user?.id?.slice(0, 8) + "..."} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
      <Text style={{ color: colors.text.muted, fontSize: 13, fontFamily: fonts.sans.regular }}>{label}</Text>
      <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 13, fontFamily: fonts.sans.medium }}>{value}</Text>
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

  card: {
    backgroundColor: colors.dark.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: GOLD + "20",
  },
  cardTitle: { color: GOLD, fontSize: 11, fontFamily: fonts.sans.bold, letterSpacing: 3, marginBottom: 18 },

  label: { color: colors.text.muted, fontSize: 11, fontFamily: fonts.sans.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#221510", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.offwhite.DEFAULT, borderWidth: 1, borderColor: GOLD + "25",
  },

  saveBtn: {
    backgroundColor: colors.maroon, borderRadius: 0, paddingVertical: 14,
    alignItems: "center", marginTop: 20,
  },
  saveBtnText: { color: colors.offwhite.DEFAULT, fontSize: 12, fontFamily: fonts.sans.bold, letterSpacing: 2 },
});
