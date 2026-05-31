/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — App.tsx
 *  ⚠️  "react-native-gesture-handler" DOIT être
 *      le tout premier import.
 *
 *  Étape 15 : PersistQueryClientProvider
 *  → Cache persisté dans AsyncStorage (24 h)
 *  → Données disponibles hors-ligne au redémarrage
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
import "react-native-gesture-handler";
import "./global.css";
import "./src/i18n"; // Initialize i18next

import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider }    from "react-native-safe-area-context";

// ─── TanStack Query + Persistance ─────────────────────────────────────
import { PersistQueryClientProvider }    from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister }   from "@tanstack/query-async-storage-persister";
import AsyncStorage                       from "@react-native-async-storage/async-storage";
import { queryClient }                   from "./src/lib/queryClient";

// ─── App ──────────────────────────────────────────────────────────────
import { AuthProvider }    from "./src/context/AuthContext";
import RootNavigator       from "./src/navigation/RootNavigator";
import { navigationRef }   from "./src/navigation/navigationRef";
import { linking }         from "./src/navigation/linking";
import { ErrorBoundary }   from "./src/components/ErrorBoundary";
import { OfflineBanner }   from "./src/components/OfflineBanner";
import { useNetInfo }      from "./src/hooks/useNetInfo";
import { LanguageProvider } from "./src/context/LanguageContext";

// ─── Persister AsyncStorage ───────────────────────────────────────────

const persister = createAsyncStoragePersister({
  storage:      AsyncStorage,
  key:          "senzedy-rq-v1",   // changer la clé = vider le cache
  throttleTime: 1000,              // écriture max 1x/s
});

// ─── Wrapper avec bannière hors-ligne ─────────────────────────────────

function AppWithBanner() {
  const { isConnected } = useNetInfo();

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <RootNavigator />
      </NavigationContainer>
      <OfflineBanner isConnected={isConnected} />
    </View>
  );
}

// ─── Composant racine ─────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* PersistQueryClientProvider doit englober tout ce qui utilise useQuery */}
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge:       24 * 60 * 60 * 1000, // 24 heures
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.state.status === "success",
            },
          }}
        >
          <LanguageProvider>
            <AuthProvider>
              <AppWithBanner />
            </AuthProvider>
          </LanguageProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
