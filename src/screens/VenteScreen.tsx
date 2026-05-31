/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — VenteScreen
 *  SearchScreen pré-filtré sur transaction "vente"
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
import React from "react";
import SearchScreen from "./SearchScreen";

export default function VenteScreen() {
  return <SearchScreen initialTransaction="vente" />;
}
