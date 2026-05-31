/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/services/notificationService.ts
 *  Notifications locales + logique d'alertes immobilières
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Platform } from "react-native";

// Import conditionnel — pas disponible sur web
let Notifications: typeof import("expo-notifications") | null = null;
if (Platform.OS !== "web") {
  Notifications = require("expo-notifications");
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface PropertyAlert {
  id:      string;
  label:   string;
  active:  boolean;
  filters: {
    category?:       string;
    commune?:        string;
    maxPrice?:       number;
    transactionType?: "vente" | "location";
  };
}

export interface NotificationPayload {
  propertyId: string;
  title:      string;
  commune:    string;
  price:      number;
  currency:   string;
}

// ─── Configuration du handler (appelée une seule fois au démarrage) ───

export function configureNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

// ─── Canal Android ────────────────────────────────────────────────────

export async function createAndroidChannel() {
  if (Platform.OS !== "android" || !Notifications) return;
  await Notifications.setNotificationChannelAsync("senzedy-default", {
    name:              "Senzedy Agency",
    importance:        Notifications.AndroidImportance.MAX,
    vibrationPattern:  [0, 250, 250, 250],
    lightColor:        "#C9A87E",
    sound:             "default",
  });
}

// ─── Notification locale (test + alertes) ─────────────────────────────

export async function sendLocalPropertyNotification(
  payload: NotificationPayload
) {
  if (!Notifications) return;

  const priceFormatted = new Intl.NumberFormat("fr-FR").format(payload.price);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✦ Nouveau bien correspondant",
      body:  `${payload.title} — ${payload.commune}\n${priceFormatted} ${payload.currency}`,
      data:  { propertyId: payload.propertyId },
      sound: "default",
    },
    trigger: { seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

// ─── Notification IA ──────────────────────────────────────────────────

export async function sendAIMessageNotification(preview: string) {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✦ Votre conseiller IA",
      body:  preview,
      data:  { screen: "AIChat" },
      sound: "default",
    },
    trigger: { seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

// ─── Matching d'alerte ────────────────────────────────────────────────

export function propertyMatchesAlert(
  property: Record<string, any>,
  alert:    PropertyAlert
): boolean {
  const f = alert.filters;
  if (f.category && property.category !== f.category) return false;
  if (f.commune  && property.commune?.toLowerCase() !== f.commune.toLowerCase()) return false;
  if (f.maxPrice && property.price > f.maxPrice) return false;
  if (f.transactionType && property.transaction_type !== f.transactionType) return false;
  return true;
}

// ─── Vérification et envoi pour un nouveau bien ───────────────────────

export async function checkAndNotifyAlerts(
  newProperty: Record<string, any>,
  alerts:      PropertyAlert[]
) {
  for (const alert of alerts) {
    if (alert.active && propertyMatchesAlert(newProperty, alert)) {
      await sendLocalPropertyNotification({
        propertyId: newProperty.id,
        title:      newProperty.title,
        commune:    newProperty.commune ?? "",
        price:      newProperty.price,
        currency:   newProperty.currency ?? "USD",
      });
      return; // Une seule notification par bien
    }
  }
}

// ─── Alertes de recherche mock (pour démonstration) ───────────────────

export const DEMO_ALERTS: PropertyAlert[] = [
  {
    id:     "alert-1",
    label:  "Appartement Gombe < 100k$",
    active: true,
    filters: { category: "appartement", commune: "Gombe", maxPrice: 100_000 },
  },
  {
    id:     "alert-2",
    label:  "Villa à louer — Ngaliema",
    active: false,
    filters: { category: "villa", commune: "Ngaliema", transactionType: "location" },
  },
];
