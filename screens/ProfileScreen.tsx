/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/ProfileScreen.tsx
 *  Affiche le profil connecté + bouton de déconnexion
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth }  from "../context/AuthContext";
import { colors }   from "../theme/colors";

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  agent:  "Agent immobilier",
  admin:  "Administrateur",
};

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vous déconnecter ?",
      [
        { text: "Annuler",       style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: signOut },
      ]
    );
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.brown.DEFAULT,
          paddingTop: Platform.OS === "ios" ? 56 : 44,
          paddingBottom: 36,
          alignItems: "center",
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        {/* Avatar initiales */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.brown.medium,
            borderWidth: 2.5,
            borderColor: colors.gold.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ color: colors.gold.DEFAULT, fontSize: 28, fontWeight: "700" }}>
            {initials}
          </Text>
        </View>

        <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 18, fontWeight: "700" }}>
          {profile?.full_name || "Utilisateur"}
        </Text>
        <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 2 }}>
          {user?.email}
        </Text>

        {/* Badge rôle */}
        <View
          style={{
            backgroundColor: colors.gold.DEFAULT + "25",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 4,
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.gold.DEFAULT + "60",
          }}
        >
          <Text style={{ color: colors.gold.DEFAULT, fontSize: 12, fontWeight: "600" }}>
            {ROLE_LABELS[profile?.role ?? "client"]}
          </Text>
        </View>
      </View>

      {/* Infos */}
      <View style={{ padding: 24, gap: 12 }}>

        <InfoRow icon="call-outline"   label="Téléphone"  value={profile?.phone || "Non renseigné"} />
        <InfoRow icon="mail-outline"   label="Email"      value={user?.email || ""} />
        <InfoRow icon="shield-outline" label="Rôle"       value={ROLE_LABELS[profile?.role ?? "client"]} />

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: colors.cream.dark, marginVertical: 8 }} />

        {/* Menu rapide */}
        <MenuRow icon="heart-outline"        label="Mes favoris"          />
        <MenuRow icon="document-text-outline" label="Mes demandes"        />
        <MenuRow icon="settings-outline"     label="Paramètres du compte" />

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: colors.cream.dark, marginVertical: 8 }} />

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#C0392B10",
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: "#C0392B30",
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#C0392B" />
          <Text style={{ color: "#C0392B", fontWeight: "600", fontSize: 15 }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: colors.text.muted,
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          Senzedy Agency © 2025 — v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: {
  icon:  keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.brown.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={colors.gold.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 11, marginBottom: 1 }}>
          {label}
        </Text>
        <Text style={{ color: colors.brown.dark, fontSize: 14, fontWeight: "500" }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label }: {
  icon:  keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.brown.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={colors.gold.DEFAULT} />
      </View>
      <Text style={{ flex: 1, color: colors.brown.dark, fontSize: 14, fontWeight: "500" }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
    </TouchableOpacity>
  );
}
