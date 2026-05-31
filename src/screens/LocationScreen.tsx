/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — LocationScreen
 *  SearchScreen pré-filtré sur transaction "location"
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
import React from "react";
import SearchScreen from "./SearchScreen";

export default function LocationScreen() {
  return <SearchScreen initialTransaction="location" />;
}
