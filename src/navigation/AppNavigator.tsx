/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/navigation/AppNavigator.tsx
 *  Navigation alignée avec senzedy-web :
 *    Accueil | Vente | Location | Projets | Menu (≡)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React from "react";
import { View, Text, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator }    from "@react-navigation/drawer";
import { Ionicons }                 from "@expo/vector-icons";

import { useTranslation }       from "react-i18next";
import { colors }               from "../theme/colors";
import { useAuth }              from "../context/AuthContext";
import CustomDrawerContent      from "../components/CustomDrawerContent";
import { AdminGuard }           from "../components/AdminGuard";
import HomeScreen               from "../screens/HomeScreen";
import VenteScreen              from "../screens/VenteScreen";
import LocationScreen           from "../screens/LocationScreen";
import SearchScreen             from "../screens/SearchScreen";
import FavoritesScreen          from "../screens/FavoritesScreen";
import AIChatScreen             from "../screens/AIChatScreen";
import ProfileScreen            from "../screens/ProfileScreen";
import AdminDashboard           from "../screens/AdminDashboard";
import PropertyDetailScreen     from "../screens/PropertyDetailScreen";
import AddPropertyScreen        from "../screens/admin/AddPropertyScreen";
import ActualitesScreen         from "../screens/ActualitesScreen";
import AgenceScreen             from "../screens/AgenceScreen";
import AssociationScreen        from "../screens/AssociationScreen";
import DiversScreen             from "../screens/DiversScreen";
import ProjetsScreen            from "../screens/ProjetsScreen";
import ContactScreen            from "../screens/ContactScreen";
import KinbnbScreen             from "../screens/KinbnbScreen";
import SettingsScreen           from "../screens/SettingsScreen";
import DocumentsScreen          from "../screens/DocumentsScreen";

// ─── Écran admin protégé ─────────────────────────────────────────────

function GuardedAdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

// ─── Types de navigation ─────────────────────────────────────────────

export type MainStackParamList = {
  DrawerRoot:     undefined;
  PropertyDetail: { propertyId: string; title?: string };
  AddProperty:    undefined;
  Actualites:     undefined;
  Agence:         undefined;
  Association:    undefined;
  Divers:         undefined;
  Kinbnb:         undefined;
  Projets:        undefined;
  Contact:        undefined;
  Search:         {
    transaction?: "vente" | "location";
    category?: string;
    commune?: string;
    minPrice?: number;
    maxPrice?: number;
    minSurface?: number;
    bedrooms?: number;
  } | undefined;
  Favorites:      undefined;
  AIChat:         undefined;
  Profile:        undefined;
  Settings:       undefined;
  Documents:      undefined;
  Admin:          undefined;
};

export type MainStackNavProp = NativeStackNavigationProp<MainStackParamList>;

// ─── Navigateurs ─────────────────────────────────────────────────────

const MainStack = createNativeStackNavigator<MainStackParamList>();
const BottomTab = createBottomTabNavigator();
const Drawer    = createDrawerNavigator();

// ─── Bottom Tab Navigator ────────────────────────────────────────────
// Aligné avec senzedy-web : Accueil | Vente | Location | Projets | Menu

function BottomTabNavigator() {
  const { t } = useTranslation();
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopWidth: 2,
          borderTopColor: colors.gold.DEFAULT + "50",
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor:   colors.gold.DEFAULT,
        tabBarInactiveTintColor: colors.cream.light,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarShowLabel: true,
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && <View style={{ width: 24, height: 2.5, backgroundColor: colors.gold.DEFAULT, borderRadius: 2, marginBottom: 3 }} />}
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <BottomTab.Screen
        name="Vente"
        component={VenteScreen}
        options={{
          title: t("nav.sell"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && <View style={{ width: 24, height: 2.5, backgroundColor: colors.gold.DEFAULT, borderRadius: 2, marginBottom: 3 }} />}
              <Ionicons name={focused ? "pricetag" : "pricetag-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <BottomTab.Screen
        name="Location"
        component={LocationScreen}
        options={{
          title: t("nav.rent"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && <View style={{ width: 24, height: 2.5, backgroundColor: colors.gold.DEFAULT, borderRadius: 2, marginBottom: 3 }} />}
              <Ionicons name={focused ? "key" : "key-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <BottomTab.Screen
        name="ProjetsTab"
        component={ProjetsScreen}
        options={{
          title: t("nav.projects"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && <View style={{ width: 24, height: 2.5, backgroundColor: colors.gold.DEFAULT, borderRadius: 2, marginBottom: 3 }} />}
              <Ionicons name={focused ? "construct" : "construct-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <BottomTab.Screen
        name="Menu"
        component={View}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.openDrawer();
          },
        })}
        options={{
          title: t("nav.menu"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              {focused && <View style={{ width: 24, height: 2.5, backgroundColor: colors.gold.DEFAULT, borderRadius: 2, marginBottom: 3 }} />}
              <Ionicons name="menu" size={28} color={color} />
            </View>
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

// ─── Bulle IA flottante ──────────────────────────────────────────────

function FloatingChatBubble() {
  const navigation = useNavigation<MainStackNavProp>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("AIChat")}
      activeOpacity={0.85}
      style={fab.container}
    >
      <View style={fab.bubble}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </View>
      <Text style={fab.label}>IA</Text>
    </TouchableOpacity>
  );
}

const fab = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    right: 16,
    zIndex: 50,
    alignItems: "center",
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.gold.light,
  },
  label: {
    color: colors.gold.DEFAULT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 3,
  },
});

// ─── Drawer Navigator ────────────────────────────────────────────────

function DrawerNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown:      false,
          drawerPosition:   "right",
          drawerType:       Platform.OS === "web" ? "back" : "front",
          gestureEnabled:   Platform.OS !== "web",
          overlayColor:     "rgba(0,0,0,0.55)",
          drawerStyle: {
            backgroundColor: colors.brown.dark,
            width:           "82%",
          },
        }}
      >
        <Drawer.Screen name="MainTabs" component={BottomTabNavigator} />
      </Drawer.Navigator>
      <FloatingChatBubble />
    </View>
  );
}

// ─── Main Stack (root) ───────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="DrawerRoot" component={DrawerNavigator} />

      {/* Pages du menu drawer */}
      <MainStack.Screen name="Actualites" component={ActualitesScreen} options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Agence"     component={AgenceScreen}     options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Association" component={AssociationScreen} options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Divers"     component={DiversScreen}     options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Kinbnb"     component={KinbnbScreen}     options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Projets"    component={ProjetsScreen}    options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Contact"    component={ContactScreen}    options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Search"     component={SearchScreen}     options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Favorites"  component={FavoritesScreen}  options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="AIChat"     component={AIChatScreen}     options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Profile"    component={ProfileScreen}    options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Settings"  component={SettingsScreen}   options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Documents" component={DocumentsScreen}  options={{ animation: "slide_from_right" }} />
      <MainStack.Screen name="Admin"      component={GuardedAdminDashboard} options={{ animation: "slide_from_right" }} />

      {/* Ajout d'un bien — modal */}
      <MainStack.Screen
        name="AddProperty"
        component={AddPropertyScreen}
        options={{
          presentation:   "modal",
          animation:      "slide_from_bottom",
          gestureEnabled: true,
        }}
      />

      {/* Détail propriété */}
      <MainStack.Screen
        name="PropertyDetail"
        options={{
          presentation:     "card",
          animation:        "slide_from_right",
          gestureEnabled:   true,
          gestureDirection: "horizontal",
        }}
      >
        {({ route, navigation }) => (
          <PropertyDetailScreen
            propertyId={route.params?.propertyId ?? ''}
            onBack={() => navigation.goBack()}
            onSimilarPress={(id: string, title: string) => navigation.push("PropertyDetail", { propertyId: id, title })}
          />
        )}
      </MainStack.Screen>
    </MainStack.Navigator>
  );
}
