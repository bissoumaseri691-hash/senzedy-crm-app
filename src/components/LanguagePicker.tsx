/**
 * SENZEDY AGENCY — src/components/LanguagePicker.tsx
 * Modal language picker — Francais / English
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme/colors";

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguagePicker({ visible, onClose }: LanguagePickerProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const options = [
    { code: "fr" as const, label: t("language.french"), flag: "\ud83c\uddeb\ud83c\uddf7" },
    { code: "en" as const, label: t("language.english"), flag: "\ud83c\uddec\ud83c\udde7" },
  ];

  const handleSelect = (code: "fr" | "en") => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.offwhite.DEFAULT,
            borderRadius: 20,
            padding: 24,
            width: 280,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
          onPress={() => {}}
        >
          <Text
            style={{
              color: colors.brown.DEFAULT,
              fontSize: 16,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 20,
              letterSpacing: 0.5,
            }}
          >
            {t("language.title")}
          </Text>

          {options.map((opt) => {
            const isActive = language === opt.code;
            return (
              <TouchableOpacity
                key={opt.code}
                onPress={() => handleSelect(opt.code)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: isActive ? "#8B3A3A10" : "transparent",
                  borderWidth: 1.5,
                  borderColor: isActive ? "#8B3A3A" : colors.cream.dark,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>{opt.flag}</Text>
                  <Text
                    style={{
                      color: isActive ? "#8B3A3A" : colors.brown.dark,
                      fontSize: 15,
                      fontWeight: isActive ? "700" : "400",
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={20} color="#8B3A3A" />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onClose}
            style={{
              alignItems: "center",
              paddingVertical: 10,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default LanguagePicker;
