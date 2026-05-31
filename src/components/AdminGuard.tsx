/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/components/AdminGuard.tsx
 *  Protection de route : alerte + écran Accès Restreint
 *  si l'utilisateur n'est pas admin.
 *
 *  NOTE : Le tab Admin est toujours enregistré dans le
 *  navigateur (tabBarButton: () => null pour les masquer)
 *  afin d'éviter des problèmes de re-registration React Navigation.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useAdmin } from "../hooks/useAdmin";

// ─── Composant ────────────────────────────────────────────────────────

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading } = useAdmin();
  const { t } = useTranslation();
  const alerted = useRef(false);

  useEffect(() => {
    if (!loading && !isAdmin && !alerted.current) {
      alerted.current = true;
      Alert.alert(
        t("adminGuard.title"),
        t("adminGuard.message"),
        [{ text: t("adminGuard.backBtn"), style: "cancel" }],
        { cancelable: true }
      );
    }
  // NOTE : on exclut 'isAdmin' et 'loading' des deps pour éviter
  // des re-déclenchements lors des transitions de navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Pendant le chargement → transparent
  if (loading) return null;

  // Accès refusé → écran sobre
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⊘</Text>
        <Text style={styles.title}>{t("adminGuard.title")}</Text>
        <Text style={styles.sub}>{t("adminGuard.subtitle")}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#060606",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             12,
    paddingHorizontal: 40,
  },
  icon: {
    color:    "#C9A87E",
    fontSize: 32,
  },
  title: {
    color:        "#F0F0F0",
    fontSize:     16,
    fontWeight:   "700",
    letterSpacing: 0.5,
  },
  sub: {
    color:     "#4A4A4A",
    fontSize:  13,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AdminGuard;
