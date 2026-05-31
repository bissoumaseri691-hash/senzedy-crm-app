/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/hooks/useNetInfo.ts
 *  Détection de la connectivité réseau
 *  Compatible web (dégradé gracieux).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useState, useEffect } from "react";
import { Platform } from "react-native";

// ─── Interface ─────────────────────────────────────────────────────────

interface NetInfoState {
  isConnected:   boolean;
  isInternetReachable: boolean | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useNetInfo(): NetInfoState {
  const [state, setState] = useState<NetInfoState>({
    isConnected:         true,
    isInternetReachable: true,
  });

  useEffect(() => {
    // Sur web, on utilise l'API navigator.onLine native
    if (Platform.OS === "web") {
      const handleOnline  = () => setState({ isConnected: true,  isInternetReachable: true  });
      const handleOffline = () => setState({ isConnected: false, isInternetReachable: false });

      window.addEventListener("online",  handleOnline);
      window.addEventListener("offline", handleOffline);

      // État initial
      setState({
        isConnected:         navigator.onLine,
        isInternetReachable: navigator.onLine,
      });

      return () => {
        window.removeEventListener("online",  handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    // Sur native (iOS / Android), on utilise NetInfo
    let unsubscribe: (() => void) | undefined;

    try {
      const NetInfo = require("@react-native-community/netinfo").default;

      // Lecture initiale
      NetInfo.fetch().then((s: any) => {
        setState({
          isConnected:         s.isConnected ?? true,
          isInternetReachable: s.isInternetReachable ?? null,
        });
      }).catch(() => {
        console.warn("[useNetInfo] NetInfo.fetch() a échoué — connexion supposée active.");
      });

      // Abonnement aux changements
      unsubscribe = NetInfo.addEventListener((s: any) => {
        setState({
          isConnected:         s.isConnected ?? true,
          isInternetReachable: s.isInternetReachable ?? null,
        });
      });
    } catch {
      // Package non installé → suppose que la connexion est active
      console.warn("[useNetInfo] @react-native-community/netinfo non disponible.");
    }

    return () => unsubscribe?.();
  }, []);

  return state;
}

export default useNetInfo;
