/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/components/OfflineBanner.tsx
 *  Bannière discrète qui s'affiche en cas de perte
 *  de connexion réseau.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// ─── Constantes ────────────────────────────────────────────────────────

const BANNER_H = 40;

// ─── Composant ────────────────────────────────────────────────────────

interface OfflineBannerProps {
  isConnected: boolean;
}

export function OfflineBanner({ isConnected }: OfflineBannerProps) {
  const { t }    = useTranslation();
  const insets   = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-BANNER_H - insets.top)).current;
  const [visible, setVisible] = useState(!isConnected);

  useEffect(() => {
    if (!isConnected) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }).start();
    } else {
      // Attendre un instant pour montrer "Connexion rétablie", puis masquer
      Animated.timing(slideAnim, {
        toValue: -BANNER_H - insets.top,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isConnected, slideAnim, insets.top]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: insets.top,
          height:     BANNER_H + insets.top,
          transform:  [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={14} color="#FAF7F2" />
        <Text style={styles.text}>
          {t("offline.message")}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    position:        "absolute",
    top:             0,
    left:            0,
    right:           0,
    zIndex:          9999,
    backgroundColor: "#2A1510",
    borderBottomWidth: 1,
    borderBottomColor: "#C9A87E30",
  },
  inner: {
    flex:            1,
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             6,
    paddingHorizontal: 16,
  },
  text: {
    color:       "#D4C4A8",
    fontSize:    11,
    fontWeight:  "600",
    letterSpacing: 0.3,
  },
});

export default OfflineBanner;
