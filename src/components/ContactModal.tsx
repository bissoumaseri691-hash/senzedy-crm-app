/**
 * SENZEDY AGENCY -- src/components/ContactModal.tsx
 * Modal de contact reutilisable -- design luxury dark
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { submitContactRequest } from "../services/contactService";

const { height: SH } = Dimensions.get("window");
const BG = "#0E0705";
const GOLD = colors.gold.DEFAULT;

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId?: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

type ModalState = "form" | "loading" | "success" | "error";

export default function ContactModal({
  visible,
  onClose,
  propertyId,
  defaultSubject,
  defaultMessage,
}: ContactModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState(defaultSubject ?? "");
  const [message, setMessage] = useState(defaultMessage ?? "");
  const [state, setState] = useState<ModalState>("form");
  const [errorMsg, setErrorMsg] = useState("");

  // Animations
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); }, []);

  useEffect(() => {
    if (visible) {
      // Reset form state when opening
      setState("form");
      setErrorMsg("");
      setSujet(defaultSubject ?? "");
      setMessage(defaultMessage ?? "");
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 120,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SH);
      fadeAnim.setValue(0);
      checkScale.setValue(0);
    }
  }, [visible, defaultSubject, defaultMessage]);

  const handleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset form after close animation
      setNom("");
      setEmail("");
      setTelephone("");
      setSujet("");
      setMessage("");
      setState("form");
      onClose();
    });
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    // Validation
    if (!nom.trim()) {
      setErrorMsg(t("contactModal.nameRequired"));
      setState("error");
      return;
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      setErrorMsg(t("contactModal.emailInvalid"));
      setState("error");
      return;
    }
    if (!message.trim()) {
      setErrorMsg(t("contactModal.messageRequired"));
      setState("error");
      return;
    }

    setState("loading");

    const result = await submitContactRequest({
      name: nom,
      email,
      phone: telephone || undefined,
      subject: sujet || undefined,
      message,
      property_id: propertyId,
      source: propertyId
        ? `PropertyDetail:${propertyId}`
        : sujet
        ? `ContactModal:${sujet}`
        : "ContactModal",
    });

    if (result.success) {
      setState("success");
      // Animate checkmark
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 150,
      }).start();
      // Auto close after 2.5s
      closeTimeoutRef.current = setTimeout(() => handleClose(), 2500);
    } else {
      setErrorMsg(
        result.error ?? t("contactModal.genericError")
      );
      setState("error");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[st.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          st.sheet,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Handle bar */}
          <View style={st.handleBar}>
            <View style={st.handle} />
          </View>

          {/* Header */}
          <View style={st.header}>
            <View>
              <Text style={st.headerTitle}>{t("contactModal.title")}</Text>
              <Text style={st.headerSubtitle}>
                {t("contactModal.subtitle")}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={st.closeBtn}>
              <Ionicons
                name="close"
                size={20}
                color={colors.offwhite.DEFAULT}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {state === "success" ? (
            <View style={st.successContainer}>
              <Animated.View
                style={[
                  st.checkCircle,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                <Ionicons name="checkmark" size={40} color={BG} />
              </Animated.View>
              <Text style={st.successTitle}>{t("contactModal.successTitle")}</Text>
              <Text style={st.successDesc}>
                {t("contactModal.successDesc")}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={st.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Error banner */}
              {state === "error" && errorMsg ? (
                <TouchableOpacity
                  style={st.errorBanner}
                  onPress={() => setState("form")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#E74C3C"
                  />
                  <Text style={st.errorText}>{errorMsg}</Text>
                  <Ionicons name="close" size={14} color="#E74C3C" />
                </TouchableOpacity>
              ) : null}

              {/* Nom */}
              <View style={st.inputGroup}>
                <Text style={st.label}>{t("contactModal.fullName")}</Text>
                <View style={st.inputWrap}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={GOLD}
                    style={st.inputIcon}
                  />
                  <TextInput
                    style={st.input}
                    value={nom}
                    onChangeText={setNom}
                    placeholder={t("contactModal.yourName")}
                    placeholderTextColor={colors.text.muted}
                    editable={state !== "loading"}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={st.inputGroup}>
                <Text style={st.label}>{t("contactModal.email")}</Text>
                <View style={st.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={GOLD}
                    style={st.inputIcon}
                  />
                  <TextInput
                    style={st.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={state !== "loading"}
                  />
                </View>
              </View>

              {/* Telephone */}
              <View style={st.inputGroup}>
                <Text style={st.label}>{t("contactModal.phone")}</Text>
                <View style={st.inputWrap}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={GOLD}
                    style={st.inputIcon}
                  />
                  <TextInput
                    style={st.input}
                    value={telephone}
                    onChangeText={setTelephone}
                    placeholder="+243 ..."
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    editable={state !== "loading"}
                  />
                </View>
              </View>

              {/* Sujet */}
              <View style={st.inputGroup}>
                <Text style={st.label}>{t("contactModal.subject")}</Text>
                <View style={st.inputWrap}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={GOLD}
                    style={st.inputIcon}
                  />
                  <TextInput
                    style={st.input}
                    value={sujet}
                    onChangeText={setSujet}
                    placeholder={t("contactModal.subjectPlaceholder")}
                    placeholderTextColor={colors.text.muted}
                    editable={state !== "loading"}
                  />
                </View>
              </View>

              {/* Message */}
              <View style={st.inputGroup}>
                <Text style={st.label}>{t("contactModal.message")}</Text>
                <TextInput
                  style={st.textArea}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t("contactModal.messagePlaceholder")}
                  placeholderTextColor={colors.text.muted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={state !== "loading"}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[st.submitBtn, state === "loading" && st.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={state === "loading"}
                activeOpacity={0.8}
              >
                {state === "loading" ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color={BG} />
                    <Text style={st.submitText}>{t("contactModal.send")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SH * 0.88,
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: GOLD + "30",
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD + "50",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GOLD + "15",
  },
  headerTitle: {
    color: GOLD,
    fontSize: 20,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
  },
  headerSubtitle: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  // Form
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.gold.pale,
    fontSize: 11,
    fontFamily: fonts.sans.semiBold,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD + "20",
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    color: colors.offwhite.DEFAULT,
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  textArea: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD + "20",
    color: colors.offwhite.DEFAULT,
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 100,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: BG,
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    letterSpacing: 0.5,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E74C3C15",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E74C3C30",
  },
  errorText: {
    flex: 1,
    color: "#E74C3C",
    fontSize: 12,
    fontFamily: fonts.sans.medium,
  },

  // Success
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 16,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    color: GOLD,
    fontSize: 22,
    fontFamily: fonts.serif.italic,
    fontStyle: "italic",
  },
  successDesc: {
    color: colors.gold.pale,
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    textAlign: "center",
    lineHeight: 20,
  },
});
