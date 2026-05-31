/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/hooks/useNotifications.ts
 *  Gestion des permissions, push token et deep link
 *  via tap sur notification.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { navigationRef } from "../navigation/navigationRef";
import {
  configureNotificationHandler,
  createAndroidChannel,
} from "../services/notificationService";

// ─── Import conditionnel (web non supporté) ───────────────────────────

type NotifModule = typeof import("expo-notifications");
let N: NotifModule | null = null;
let Device: typeof import("expo-device") | null = null;

if (Platform.OS !== "web") {
  N      = require("expo-notifications");
  Device = require("expo-device");
}

// ─── Hook ─────────────────────────────────────────────────────────────

interface UseNotificationsResult {
  pushToken:   string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useNotifications(userId?: string): UseNotificationsResult {
  const [pushToken,     setPushToken]     = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notifListener    = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // ── Setup au montage ────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web" || !N) return;

    // Configure le handler global (affiché quand l'app est au premier plan)
    configureNotificationHandler();
    createAndroidChannel();

    // Tente d'obtenir le token si déjà accordé
    attemptGetToken(userId).then(({ token, granted }) => {
      if (token)   setPushToken(token);
      if (granted) setHasPermission(true);
    });

    // Listener : notification reçue en foreground
    notifListener.current = N.addNotificationReceivedListener((notif) => {
      console.warn("[Notifications] Reçue en foreground :", notif.request.content.title);
    });

    // Listener : tap sur une notification → navigation deep link
    responseListener.current = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;

      if (data?.propertyId && navigationRef.isReady()) {
        // Navigation vers PropertyDetail via la ref globale
        navigationRef.navigate("PropertyDetail", {
          propertyId: data.propertyId,
        });
      }

      if (data?.screen === "AIChat" && navigationRef.isReady()) {
        // Navigation vers l'onglet IA
        navigationRef.navigate("DrawerRoot", undefined);
      }
    });

    // Vérifier s'il y avait une notif en attente (app fermée)
    N.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as any;
      if (data?.propertyId && navigationRef.isReady()) {
        navigationRef.navigate("PropertyDetail", { propertyId: data.propertyId });
      }
    });

    return () => {
      if (notifListener.current)    N!.removeNotificationSubscription(notifListener.current);
      if (responseListener.current) N!.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);

  // ── Demande de permission manuelle ──────────────────────────────────
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web" || !N) return false;
    try {
      const { status } = await N.requestPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);
      if (granted) {
        const { token } = await getExpoPushToken();
        if (token) {
          setPushToken(token);
          if (userId) savePushToken(userId, token);
        }
      }
      return granted;
    } catch (err) {
      console.warn("[Notifications] Erreur lors de la demande de permission :", err);
      return false;
    }
  };

  return { pushToken, hasPermission, requestPermission };
}

// ─── Helpers internes ─────────────────────────────────────────────────

async function attemptGetToken(
  userId?: string
): Promise<{ token: string | null; granted: boolean }> {
  if (!N || !Device) return { token: null, granted: false };

  const { status } = await N.getPermissionsAsync();
  if (status !== "granted") return { token: null, granted: false };

  if (!Device.isDevice) {
    console.warn("[Notifications] Token push non disponible sur simulateur");
    return { token: null, granted: true };
  }

  const { token } = await getExpoPushToken();
  if (token && userId) savePushToken(userId, token);
  return { token, granted: true };
}

async function getExpoPushToken(): Promise<{ token: string | null }> {
  if (!N) return { token: null };
  try {
    const result = await N.getExpoPushTokenAsync({
      projectId: "0ef00e55-a1f1-4f1d-9305-23d679ed4696",
    });
    return { token: result.data };
  } catch {
    console.warn("[Notifications] Impossible d'obtenir le push token (projectId non configuré)");
    return { token: null };
  }
}

async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
  if (error) {
    console.warn("[Notifications] Impossible de sauvegarder le push token :", error.message);
  }
}
