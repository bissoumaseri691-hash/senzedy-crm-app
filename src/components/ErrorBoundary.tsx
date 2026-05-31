/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/components/ErrorBoundary.tsx
 *  Error Boundary global — affiche un écran de
 *  secours élégant au lieu d'un écran blanc.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../i18n";

// ─── Constantes ────────────────────────────────────────────────────────

const BG   = "#2A1510";
const GOLD = "#C9A87E";
const RED  = "#C0392B";

// ─── Types ─────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError:  boolean;
  error:     Error | null;
  errorInfo: string | null;
}

// ─── Classe ErrorBoundary ──────────────────────────────────────────────

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn("[ErrorBoundary] Crash intercepté :", error.message);
    console.warn("[ErrorBoundary] Stack :", info.componentStack);
    this.setState({ errorInfo: info.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <FallbackScreen
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

// ─── Écran de secours ──────────────────────────────────────────────────

function FallbackScreen({
  error,
  onReset,
}: {
  error:   Error | null;
  onReset: () => void;
}) {
  return (
    <View style={styles.container}>

      {/* Orbe d'ambiance */}
      <View style={styles.orb} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>SA</Text>
      </View>

      {/* Séparateur doré */}
      <View style={styles.divider} />

      {/* Icône erreur */}
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={32} color={RED} />
      </View>

      {/* Message principal */}
      <Text style={styles.title}>{i18n.t("errorBoundary.title")}</Text>
      <Text style={styles.subtitle}>
        {i18n.t("errorBoundary.subtitle")}
      </Text>

      {/* Détail technique (discret) */}
      {error && (
        <View style={styles.errorDetail}>
          <Text style={styles.errorDetailText} numberOfLines={3}>
            {error.message}
          </Text>
        </View>
      )}

      {/* Bouton réessayer */}
      <TouchableOpacity onPress={onReset} style={styles.retryBtn} activeOpacity={0.85}>
        <Ionicons name="refresh" size={16} color={BG} />
        <Text style={styles.retryText}>{i18n.t("errorBoundary.retry")}</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>{i18n.t("errorBoundary.footer")}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    gap: 16,
  },
  orb: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: GOLD,
    opacity: 0.08,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: GOLD + "60",
    backgroundColor: "#1A0F0A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoText: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.4,
    marginBottom: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: RED + "15",
    borderWidth: 1,
    borderColor: RED + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FAF7F2",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#7A6050",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  errorDetail: {
    backgroundColor: "#1A0F0A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A1810",
    width: "100%",
  },
  errorDetailText: {
    color: "#4A3020",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 15,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  retryText: {
    color: "#2A1510",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    color: "#2A1810",
    fontSize: 10,
    marginTop: 16,
    letterSpacing: 1,
  },
});

export default ErrorBoundary;
