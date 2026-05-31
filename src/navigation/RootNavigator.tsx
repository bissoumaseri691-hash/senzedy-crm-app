/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/navigation/RootNavigator.tsx
 *  Aiguillage auth + chargement polices
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Image as RNImage } from "react-native";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

import { useAuth }    from "../context/AuthContext";
import AppNavigator   from "./AppNavigator";
import AuthScreen     from "../screens/auth/AuthScreen";
import { colors }     from "../theme/colors";

// ─── Splash animé ─────────────────────────────────────────────────────

function SplashScreen() {
  const logoScale   = useRef(new Animated.Value(0.78)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth   = useRef(new Animated.Value(0)).current;
  const subOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 55,
          friction: 8,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        delay: 40,
      }),
      Animated.parallel([
        Animated.spring(lineWidth, {
          toValue: 48,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(subOpacity, {
          toValue: 0.65,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#2A1510",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          opacity:   logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: "center",
        }}
      >
        <RNImage
          source={require("../../assets/logo.png")}
          style={{ width: 120, height: 120, marginBottom: 20, tintColor: "#FFFFFF" }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text
        style={{
          opacity: titleOpacity,
          color: colors.gold.DEFAULT,
          fontSize: 26,
          fontWeight: "800",
          letterSpacing: 7,
        }}
      >
        SENZEDY
      </Animated.Text>

      <Animated.Text
        style={{
          opacity: titleOpacity,
          color: "#FFFFFF",
          fontSize: 10,
          letterSpacing: 6,
          marginTop: 4,
          marginBottom: 20,
        }}
      >
        AGENCY
      </Animated.Text>

      <Animated.View
        style={{
          width:           lineWidth,
          height:          1.5,
          backgroundColor: colors.gold.DEFAULT,
          marginVertical:  12,
        }}
      />

      <Animated.Text
        style={{
          opacity: subOpacity,
          color: colors.offwhite.DEFAULT,
          fontSize: 9,
          letterSpacing: 3.5,
          marginBottom: 32,
        }}
      >
        IMMOBILIER DE PRESTIGE · KINSHASA
      </Animated.Text>

      <ActivityIndicator color={colors.gold.DEFAULT + "80"} size="small" />
    </View>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Splash visible au moins 2.5 secondes pour que le texte soit lisible
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !fontsLoaded || !minSplashDone) return <SplashScreen />;

  return user ? <AppNavigator /> : <AuthScreen />;
}
