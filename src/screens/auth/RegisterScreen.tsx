/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/auth/RegisterScreen.tsx
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

interface Props {
  onGoLogin: () => void;
}

export default function RegisterScreen({ onGoLogin }: Props) {
  const { signUp } = useAuth();

  const [fullName,      setFullName]      = useState("");
  const [email,         setEmail]         = useState("");
  const [phone,         setPhone]         = useState("");
  const [password,      setPassword]      = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2)
      e.fullName = "Entrez votre nom complet (min. 2 caractères).";

    if (!email.trim())
      e.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Format d'email invalide.";

    if (phone && !/^[+\d\s]{7,15}$/.test(phone))
      e.phone = "Numéro de téléphone invalide.";

    if (!password)
      e.password = "Le mot de passe est requis.";
    else if (password.length < 8)
      e.password = "Minimum 8 caractères.";
    else if (!/[A-Z]/.test(password) && !/[0-9]/.test(password))
      e.password = "Ajoutez au moins une majuscule ou un chiffre.";

    if (!confirmPass)
      e.confirmPass = "Confirmez votre mot de passe.";
    else if (confirmPass !== password)
      e.confirmPass = "Les mots de passe ne correspondent pas.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field: string) =>
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  // ── Inscription ─────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        phone.trim() || undefined
      );

      if (error) {
        const msg =
          error.message.includes("already registered")
            ? "Cet email est déjà utilisé. Connectez-vous."
            : error.message.includes("weak_password")
            ? "Mot de passe trop faible. Ajoutez des chiffres ou majuscules."
            : "Inscription impossible. Réessayez.";
        Alert.alert("Erreur d'inscription", msg);
      } else {
        Alert.alert(
          "Compte créé ! ✅",
          "Vérifiez votre email pour confirmer votre compte, puis connectez-vous.",
          [{ text: "Se connecter", onPress: onGoLogin }]
        );
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer le compte. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brown.DEFAULT} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View
            style={{
              backgroundColor: colors.brown.DEFAULT,
              paddingTop: Platform.OS === "ios" ? 60 : 48,
              paddingBottom: 36,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              borderBottomLeftRadius: 36,
              borderBottomRightRadius: 36,
            }}
          >
            {/* Bouton retour */}
            <TouchableOpacity
              onPress={onGoLogin}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.brown.light + "50",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.offwhite.DEFAULT} />
            </TouchableOpacity>

            {/* Logo + Titre */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.gold.DEFAULT,
                  fontSize: 20,
                  fontWeight: "700",
                  letterSpacing: 3,
                }}
              >
                SENZEDY
              </Text>
              <Text
                style={{
                  color: colors.offwhite.DEFAULT,
                  fontSize: 10,
                  letterSpacing: 4,
                }}
              >
                AGENCY
              </Text>
            </View>

            {/* Badge SA */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: colors.gold.DEFAULT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.gold.DEFAULT, fontWeight: "700", fontSize: 15 }}>
                SA
              </Text>
            </View>
          </View>

          {/* ── Formulaire ── */}
          <View style={{ padding: 28, paddingTop: 32 }}>

            <Text
              style={{
                color: colors.brown.DEFAULT,
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Créer un compte
            </Text>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              Rejoignez Senzedy Agency et accédez aux meilleures propriétés.
            </Text>

            {/* Nom complet */}
            <FieldLabel label="Nom complet *" />
            <InputField
              placeholder="Jean Dupont"
              value={fullName}
              onChangeText={(v) => { setFullName(v); clearError("fullName"); }}
              icon="person-outline"
              autoCapitalize="words"
              error={errors.fullName}
            />

            {/* Email */}
            <FieldLabel label="Adresse email *" style={{ marginTop: 16 }} />
            <InputField
              placeholder="vous@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); clearError("email"); }}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errors.email}
            />

            {/* Téléphone */}
            <FieldLabel label="Téléphone (optionnel)" style={{ marginTop: 16 }} />
            <InputField
              placeholder="+243 997 628 617"
              value={phone}
              onChangeText={(v) => { setPhone(v); clearError("phone"); }}
              keyboardType="phone-pad"
              icon="call-outline"
              error={errors.phone}
            />

            {/* Mot de passe */}
            <FieldLabel label="Mot de passe *" style={{ marginTop: 16 }} />
            <InputField
              placeholder="Min. 8 caractères"
              value={password}
              onChangeText={(v) => { setPassword(v); clearError("password"); }}
              secureTextEntry={!showPass}
              icon="lock-closed-outline"
              error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Confirmer mot de passe */}
            <FieldLabel label="Confirmer le mot de passe *" style={{ marginTop: 16 }} />
            <InputField
              placeholder="••••••••"
              value={confirmPass}
              onChangeText={(v) => { setConfirmPass(v); clearError("confirmPass"); }}
              secureTextEntry={!showConfirm}
              icon="shield-checkmark-outline"
              error={errors.confirmPass}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Indicateur force du mot de passe */}
            {password.length > 0 && (
              <PasswordStrength password={password} />
            )}

            {/* Bouton S'inscrire */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.brown.DEFAULT,
                borderRadius: 16,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
                marginTop: 28,
                shadowColor: colors.brown.DEFAULT,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.gold.DEFAULT} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={colors.gold.DEFAULT} />
                  <Text
                    style={{
                      color: colors.offwhite.DEFAULT,
                      fontSize: 16,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                    }}
                  >
                    Créer mon compte
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Lien login */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 20,
                gap: 4,
              }}
            >
              <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
                Déjà inscrit ?
              </Text>
              <TouchableOpacity onPress={onGoLogin}>
                <Text style={{ color: colors.gold.DEFAULT, fontSize: 14, fontWeight: "600" }}>
                  Se connecter
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: colors.text.muted,
                fontSize: 11,
                textAlign: "center",
                marginTop: 20,
                marginBottom: 8,
                lineHeight: 16,
              }}
            >
              En créant un compte, vous acceptez nos{" "}
              <Text style={{ color: colors.gold.DEFAULT }}>
                Conditions d'utilisation
              </Text>{" "}
              et notre{" "}
              <Text style={{ color: colors.gold.DEFAULT }}>
                Politique de confidentialité
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Indicateur de force du mot de passe ─────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score  = checks.filter(Boolean).length;
  const labels = ["Trop faible", "Faible", "Moyen", "Fort", "Très fort"];
  const barClr = ["#C0392B", "#E67E22", "#F1C40F", "#27AE60", "#1E8449"];

  return (
    <View style={{ marginTop: 8, marginBottom: 4 }}>
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: i < score ? barClr[score] : colors.cream.dark,
            }}
          />
        ))}
      </View>
      <Text style={{ color: barClr[score], fontSize: 11, fontWeight: "500" }}>
        {labels[score]}
      </Text>
    </View>
  );
}

// ─── Composants locaux ────────────────────────────────────────────────

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return (
    <Text
      style={[
        {
          color: colors.brown.dark,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 0.3,
          marginBottom: 8,
        },
        style,
      ]}
    >
      {label}
    </Text>
  );
}

interface InputFieldProps {
  placeholder:     string;
  value:           string;
  onChangeText:    (v: string) => void;
  keyboardType?:   "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
  secureTextEntry?:boolean;
  icon:            keyof typeof Ionicons.glyphMap;
  error?:          string;
  rightIcon?:      React.ReactNode;
}

function InputField({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  icon,
  error,
  rightIcon,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.offwhite.DEFAULT,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: error
            ? "#C0392B"
            : focused
            ? colors.gold.DEFAULT
            : colors.cream.dark,
          paddingHorizontal: 16,
          height: 52,
          gap: 10,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            error ? "#C0392B" : focused ? colors.gold.DEFAULT : colors.text.secondary
          }
        />
        <TextInput
          style={{ flex: 1, color: colors.brown.dark, fontSize: 15, height: "100%" }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
        />
        {rightIcon}
      </View>
      {!!error && (
        <Text style={{ color: "#C0392B", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
