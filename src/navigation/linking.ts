/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/navigation/linking.ts
 *  Configuration du deep linking
 *
 *  Exemples d'URL supportées :
 *    senzedy://bien/abc-123      → PropertyDetailScreen
 *    senzedy://accueil           → HomeScreen
 *    senzedy://recherche         → SearchScreen
 *    https://senzedy-agency.app/bien/abc-123
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import type { LinkingOptions } from "@react-navigation/native";
import type { MainStackParamList } from "./AppNavigator";

export const linking: LinkingOptions<MainStackParamList> = {
  prefixes: [
    "senzedy://",
    "https://senzedy-agency.app",
  ],

  config: {
    screens: {
      // ── DrawerRoot → Drawer → BottomTabs ──────────
      DrawerRoot: {
        screens: {
          MainTabs: {
            screens: {
              Home:       "accueil",
              Vente:      "vente",
              Location:   "location",
              ProjetsTab: "projets-tab",
            },
          },
        },
      },

      // ── Pages accessibles depuis le MainStack ──────
      Search:     "recherche",
      Favorites:  "favoris",
      AIChat:     "ia",
      Profile:    "profil",
      Admin:      "admin",
      Actualites: "actualites",
      Agence:     "agence",
      Association: "association",
      Divers:     "divers",
      Projets:    "projets",
      Contact:    "contact",
      Kinbnb:     "kinbnb",
      Settings:   "parametres",
      Documents:  "documents",
      AddProperty: "ajouter-bien",

      // ── Détail propriété (deep link principal) ────
      PropertyDetail: {
        path: "bien/:propertyId",
        parse: {
          propertyId: (id: string) => id,
        },
      },
    },
  },
};
