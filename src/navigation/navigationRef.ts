/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/navigation/navigationRef.ts
 *  Référence globale au NavigationContainer
 *  Utilisée pour naviguer hors d'un composant React
 *  (ex: depuis un listener de notification).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { createNavigationContainerRef } from "@react-navigation/native";
import type { MainStackParamList } from "./AppNavigator";

export const navigationRef = createNavigationContainerRef<MainStackParamList>();
