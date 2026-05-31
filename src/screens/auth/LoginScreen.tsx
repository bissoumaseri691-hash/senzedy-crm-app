/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/auth/LoginScreen.tsx
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
  onGoRegister: () => void;
}

export default function LoginScreen({ onGoRegister }: Props) {
  const { signIn } = useAuth();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [emailError,  setEmailError]  = useState("");
  const [passError,   setPassError]   = useState("");

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (): boolean => {
    let ok = true;
    setEmailError("");
    setPassError("");

    if (!email.trim()) {
      setEmailError("L'adresse email est requise.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Format d'email invalide.");
      ok = false;
    }
    if (!password) {
      setPassError("Le mot de passe est requis.");
      ok = false;
    } else if (password.length < 6) {
      setPassError("Minimum 6 caractères.");
      ok = false;
    }
    return ok;
  };

  // ── Connexion ───────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);
      if (error) {
        const msg =
          error.message.includes("Invalid login")
            ? "Email ou mot de passe incorrect."
            : error.message.includes("Email not confirmed")
            ? "Veuillez confirmer votre email avant de vous connecter."
            : "Une erreur est survenue. Réessayez.";
        Alert.alert("Connexion échouée", msg);
      }
      // Si succès → AuthContext met à jour user → RootNavigator switch auto
    } catch (e) {
      Alert.alert("Erreur", "Connexion impossible. Vérifiez votre réseau.");
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

          {/* ── Header marron avec logo ── */}
          <View
            style={{
              backgroundColor: colors.brown.DEFAULT,
              paddingTop: Platform.OS === "ios" ? 70 : 55,
              paddingBottom: 48,
              alignItems: "center",
              borderBottomLeftRadius: 36,
              borderBottomRightRadius: 36,
            }}
          >
            {/* Logo SA */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: colors.gold.DEFAULT,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.gold.DEFAULT,
                  fontSize: 28,
                  fontWeight: "700",
                  letterSpacing: 2,
                }}
              >
                SA
              </Text>
            </View>

            <Text
              style={{
                color: colors.gold.DEFAULT,
                fontSize: 22,
                fontWeight: "700",
                letterSpacing: 4,
              }}
            >
              SENZEDY
            </Text>
            <Text
              style={{
                color: colors.offwhite.DEFAULT,
                fontSize: 11,
                letterSpacing: 5,
                marginTop: 2,
                marginBottom: 12,
              }}
            >
              AGENCY
            </Text>

            {/* Séparateur doré */}
            <View
              style={{
                width: 48,
                height: 1.5,
                backgroundColor: colors.gold.DEFAULT,
                opacity: 0.6,
              }}
            />
          </View>

          {/* ── Formulaire ── */}
          <View style={{ padding: 28, paddingTop: 36 }}>

            <Text
              style={{
                color: colors.brown.DEFAULT,
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Bon retour 👋
            </Text>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 14,
                marginBottom: 32,
                lineHeight: 20,
              }}
            >
              Connectez-vous pour accéder à vos annonces et favoris.
            </Text>

            {/* Champ Email */}
            <FieldLabel label="Adresse email" />
            <InputField
              placeholder="vous@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={emailError}
            />

            {/* Champ Mot de passe */}
            <FieldLabel label="Mot de passe" style={{ marginTop: 16 }} />
            <InputField
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setPassError(""); }}
              secureTextEntry={!showPass}
              icon="lock-closed-outline"
              error={passError}
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

            {/* Mot de passe oublié */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginTop: 8, marginBottom: 28 }}
            >
              <Text style={{ color: colors.gold.DEFAULT, fontSize: 13, fontWeight: "500" }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            {/* Bouton Connexion */}
            <TouchableOpacity
              onPress={handleLogin}
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
                  <Ionicons name="log-in-outline" size={20} color={colors.gold.DEFAULT} />
                  <Text
                    style={{
                      color: colors.offwhite.DEFAULT,
                      fontSize: 16,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                    }}
                  >
                    Se connecter
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 28,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.cream.dark }} />
              <Text style={{ color: colors.text.muted, fontSize: 12 }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.cream.dark }} />
            </View>

            {/* Lien Inscription */}
            <TouchableOpacity
              onPress={onGoRegister}
              style={{
                borderWidth: 1.5,
                borderColor: colors.border.DEFAULT,
                borderRadius: 16,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.brown.DEFAULT,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Créer un compte
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                color: colors.text.muted,
                fontSize: 11,
                textAlign: "center",
                marginTop: 28,
                lineHeight: 16,
              }}
            >
              En vous connectant, vous acceptez nos{" "}
              <Text style={{ color: colors.gold.DEFAULT }}>Conditions d'utilisation</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  placeholder:    string;
  value:          string;
  onChangeText:   (v: string) => void;
  keyboardType?:  "default" | "email-address" | "phone-pad";
  autoCapitalize?:"none" | "sentences" | "words";
  secureTextEntry?: boolean;
  icon:           keyof typeof Ionicons.glyphMap;
  error?:         string;
  rightIcon?:     React.ReactNode;
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
          color={error ? "#C0392B" : focused ? colors.gold.DEFAULT : colors.text.secondary}
        />
        <TextInput
          style={{
            flex: 1,
            color: colors.brown.dark,
            fontSize: 15,
            height: "100%",
          }}
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
