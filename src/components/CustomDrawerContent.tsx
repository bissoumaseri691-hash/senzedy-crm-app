/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — CustomDrawerContent
 *  Menu latéral aligné avec senzedy-web
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as RNImage } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguagePicker } from "./LanguagePicker";

// ─── Mapping sous-items → catégorie Search ────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  "Maison": "maison",
  "Villa": "villa",
  "Appartement": "appartement",
  "Terrain": "terrain",
  "Commercial": "local",
  "Bureau": "bureau",
  "Entrepôt": "entrepot",
  "Courte durée": "courte_duree",
  "Longue durée": "longue_duree",
  "Chambres d'hôtes": "chambres_hotes",
};

// ─── Menu data builders (use t() inside component) ─────────────────

// ─── Composant principal ──────────────────────────────────────────────
export default function CustomDrawerContent(props: any) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current); }, []);

  const MENU_TOP = [
    { key: "accueil", label: t("drawer.home", { defaultValue: "Accueil" }), emoji: "\ud83c\udfe1", tab: "Home" },
  ];

  const MENU_GROUPS = [
    { key: "vendre", label: t("drawer.sale"), emoji: "\ud83c\udfe0", tab: "Vente", subItems: [t("drawer.subSaleApts"), t("drawer.subSaleVillas"), t("drawer.subSaleHouses"), t("drawer.subSaleLands")] },
    { key: "louer", label: t("drawer.rent"), emoji: "\ud83d\udd11", tab: "Location", subItems: [t("drawer.subRentApts"), t("drawer.subRentVillas"), t("drawer.subRentOffices"), t("drawer.subRentCommercial")] },
    { key: "kinbnb", label: t("drawer.kinbnb"), emoji: "\ud83d\udecf\ufe0f", screen: "Kinbnb", subItems: [t("drawer.subKinbnbNightly"), t("drawer.subKinbnbManagement")] },
    { key: "divers", label: t("drawer.divers"), emoji: "\u2699\ufe0f", screen: "Divers", subItems: [t("drawer.subDiversVehicles"), t("drawer.subDiversDrilling"), t("drawer.subDiversTaxi"), t("drawer.subDiversTech")] },
  ];

  const MENU_PAGES = [
    { key: "projets", label: t("drawer.projects"), emoji: "\ud83c\udfd7\ufe0f", screen: "Projets" },
    { key: "actu", label: t("drawer.articles"), emoji: "\ud83d\udcf0", screen: "Actualites" },
    { key: "agence", label: t("drawer.agency"), emoji: "\ud83c\udfdb\ufe0f", screen: "Agence" },
    { key: "association", label: t("drawer.association", { defaultValue: "Association" }), emoji: "\u2764\ufe0f\u200d\ud83e\ude79", screen: "Association" },
    { key: "contact", label: t("drawer.contact"), emoji: "\ud83d\udcde", screen: "Contact" },
    { key: "documents", label: t("drawer.documents", { defaultValue: "Documents" }), emoji: "\ud83d\udcc4", screen: "Documents" },
  ];

  const MENU_USER = [
    { key: "search", label: t("drawer.search"), emoji: "\ud83d\udd0d", screen: "Search" },
    { key: "favorites", label: t("drawer.favorites"), emoji: "\u2764\ufe0f", screen: "Favorites" },
    { key: "aichat", label: t("drawer.aiAssistant"), emoji: "", screen: "AIChat" },
    { key: "profile", label: t("drawer.myProfile"), emoji: "\ud83d\udc64", screen: "Profile" },
    { key: "settings", label: t("drawer.settings", { defaultValue: "Paramètres" }), emoji: "\u2699\ufe0f", screen: "Settings" },
  ];

  const navigateToScreen = (screen: string) => {
    props.navigation.closeDrawer();
    navTimeoutRef.current = setTimeout(() => {
      props.navigation.getParent()?.navigate(screen);
    }, 150);
  };

  const navigateToTab = (tabName: string) => {
    props.navigation.closeDrawer();
    navTimeoutRef.current = setTimeout(() => {
      props.navigation.navigate("MainTabs", { screen: tabName });
    }, 150);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroup(expandedGroup === key ? null : key);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brown.dark }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: colors.dark.surface,
          paddingTop: 56,
          paddingBottom: 20,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 2,
          borderBottomColor: colors.gold.DEFAULT + "40",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <RNImage
            source={require("../../assets/logo.png")}
            style={{ width: 65, height: 65, tintColor: "#FFFFFF" }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ color: colors.gold.DEFAULT, fontWeight: "700", fontSize: 17, letterSpacing: 2 }}>
              SENZEDY
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, letterSpacing: 3 }}>
              AGENCY
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setShowLangPicker(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.brown.light + "80",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="globe-outline" size={14} color={colors.offwhite.DEFAULT} />
            <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 12, fontWeight: "600" }}>
              {language === "fr" ? "FR" : "EN"}
            </Text>
            <Text style={{ fontSize: 12 }}>{language === "fr" ? "\ud83c\uddeb\ud83c\uddf7" : "\ud83c\uddec\ud83c\udde7"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
            <Ionicons name="close" size={22} color={colors.offwhite.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Menu scrollable ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Accueil (retour Home) */}
        {MENU_TOP.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => navigateToTab(item.tab)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 20,
              paddingVertical: 18,
            }}
          >
            <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            <Text
              style={{
                color: colors.offwhite.DEFAULT,
                fontSize: 16,
                fontWeight: "500",
                letterSpacing: 0.3,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: colors.gold.DEFAULT + "25", marginHorizontal: 20, marginVertical: 4 }} />

        {/* Groupes avec sous-menus (Vente, Location, Kinbnb, Divers) */}
        {MENU_GROUPS.map((group, index) => (
          <View key={group.key}>
            {index > 0 && (
              <View style={{ height: 1, backgroundColor: colors.gold.DEFAULT + "15", marginHorizontal: 20 }} />
            )}

            <TouchableOpacity
              onPress={() => toggleGroup(group.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 18,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ fontSize: 20 }}>{group.emoji}</Text>
                <Text
                  style={{
                    color: colors.offwhite.DEFAULT,
                    fontSize: 16,
                    fontWeight: "500",
                    letterSpacing: 0.3,
                  }}
                >
                  {group.label}
                </Text>
              </View>
              <Ionicons
                name={expandedGroup === group.key ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.gold.pale}
              />
            </TouchableOpacity>

            {expandedGroup === group.key && (
              <View style={{ backgroundColor: colors.dark.surface + "80", paddingBottom: 8 }}>
                {group.subItems.map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => {
                      if (group.screen) {
                        navigateToScreen(group.screen);
                      } else if ((group as any).tab) {
                        navigateToTab((group as any).tab);
                      }
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingHorizontal: 54,
                      paddingVertical: 11,
                    }}
                  >
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: colors.gold.DEFAULT,
                      }}
                    />
                    <Text style={{ color: colors.gold.pale, fontSize: 14 }}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: colors.gold.DEFAULT + "25", marginHorizontal: 20, marginVertical: 4 }} />

        {/* Liens pages (Projets, Articles, Agence, Contact) */}
        {MENU_PAGES.map((link, index) => (
          <View key={link.key}>
            {index > 0 && (
              <View style={{ height: 1, backgroundColor: colors.gold.DEFAULT + "15", marginHorizontal: 20 }} />
            )}
            <TouchableOpacity
              onPress={() => navigateToScreen(link.screen)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 18,
              }}
            >
              <Text style={{ fontSize: 20 }}>{link.emoji}</Text>
              <Text
                style={{
                  color: colors.offwhite.DEFAULT,
                  fontSize: 16,
                  fontWeight: "500",
                  letterSpacing: 0.3,
                }}
              >
                {link.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: colors.gold.DEFAULT + "25", marginHorizontal: 20, marginVertical: 4 }} />

        {/* Section utilisateur (Recherche, Favoris, IA, Profil) */}
        <View style={{ paddingTop: 4 }}>
          <Text style={{
            color: colors.gold.DEFAULT,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 3,
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}>
            {t("drawer.mySpace")}
          </Text>
          {MENU_USER.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigateToScreen(item.screen)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
              }}
            >
              {item.emoji ? (
                <Text style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.emoji}</Text>
              ) : (
                <View style={{ width: 24, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, color: colors.gold.DEFAULT }}>✦</Text>
                </View>
              )}
              <Text
                style={{
                  color: colors.offwhite.DEFAULT,
                  fontSize: 15,
                  fontWeight: "400",
                  letterSpacing: 0.3,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Admin (si admin) */}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => navigateToScreen("Admin")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
              }}
            >
              <View style={{ width: 24, alignItems: "center" }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.maroon} />
              </View>
              <Text
                style={{
                  color: colors.maroon,
                  fontSize: 15,
                  fontWeight: "600",
                  letterSpacing: 0.3,
                }}
              >
                {t("drawer.administration")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card Contact */}
        <View style={{ margin: 16, marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => navigateToScreen("Contact")}
            style={{
              backgroundColor: colors.dark.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.gold.DEFAULT + "30",
            }}
          >
            <Text
              style={{
                color: colors.gold.DEFAULT,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              {t("drawer.contactLabel")}
            </Text>
            {[
              { icon: "location-outline" as const, text: t("drawer.locationAddress") },
              { icon: "call-outline"     as const, text: "07 59 63 58 34"           },
              { icon: "call-outline"     as const, text: "+243 997 628 617"         },
              { icon: "mail-outline"     as const, text: "agency.senzedy@yahoo.com" },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Ionicons name={item.icon} size={15} color={colors.gold.pale} />
                <Text style={{ color: colors.offwhite.DEFAULT, fontSize: 13 }}>{item.text}</Text>
              </View>
            ))}
          </TouchableOpacity>
        </View>

        {/* Social Links */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://wa.me/243997628617")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 16,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: "#25D366" + "40",
              backgroundColor: "#25D366" + "15",
            }}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={{ color: colors.offwhite.DEFAULT, fontWeight: "600", fontSize: 14 }}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://instagram.com/senzedy_agency")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 16,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: colors.gold.DEFAULT + "30",
            }}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.gold.DEFAULT} />
            <Text style={{ color: colors.offwhite.DEFAULT, fontWeight: "600", fontSize: 14 }}>
              @senzedy_agency
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <LanguagePicker visible={showLangPicker} onClose={() => setShowLangPicker(false)} />
    </View>
  );
}
