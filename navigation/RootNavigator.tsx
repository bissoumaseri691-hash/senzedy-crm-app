/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/navigation/RootNavigator.tsx
 *
 *  Gère l'aiguillage :
 *    • Chargement  → SplashScreen
 *    • Non connecté → AuthStack  (Login / Register)
 *    • Connecté    → AppNavigator (Bottom Tabs + Drawer)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth }        from "../context/AuthContext";
import AppNavigator       from "./AppNavigator";
import LoginScreen        from "../screens/auth/LoginScreen";
import RegisterScreen     from "../screens/auth/RegisterScreen";
import { colors }         from "../theme/colors";

// ─── Types ────────────────────────────────────────────────────────────
type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// ─── Splash de chargement ─────────────────────────────────────────────
function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.brown.DEFAULT,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {/* Logo */}
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 22,
          borderWidth: 2,
          borderColor: colors.gold.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            color: colors.gold.DEFAULT,
            fontSize: 30,
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
          marginTop: -8,
        }}
      >
        AGENCY
      </Text>

      {/* Séparateur */}
      <View
        style={{
          width: 48,
          height: 1.5,
          backgroundColor: colors.gold.DEFAULT,
          opacity: 0.5,
          marginVertical: 8,
        }}
      />

      <ActivityIndicator color={colors.gold.DEFAULT} size="small" />
    </View>
  );
}

// ─── Auth Stack (Login / Register) ───────────────────────────────────
function AuthNavigator() {
  // On gère localement quelle vue auth afficher
  const [screen, setScreen] = useState<"login" | "register">("login");

  if (screen === "login") {
    return <LoginScreen onGoRegister={() => setScreen("register")} />;
  }
  return <RegisterScreen onGoLogin={() => setScreen("login")} />;
}

// ─── Root Navigator ───────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return user ? <AppNavigator /> : <AuthNavigator />;
}
