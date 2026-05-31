/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/auth/AuthScreen.tsx
 *  Écran connexion ultra-premium — Magic Link OTP
 *  Design : fond très sombre, logo centré, or subtil
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated,
  ScrollView, Dimensions, StatusBar, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image as RNImage } from "react-native";
import { Ionicons }        from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const { width: SW, height: SH } = Dimensions.get("window");

// ── Palette (alignée senzedy-web) ────────────────────────────────────
const BG     = "#2A1510";
const BG2    = "#3B2F2F";
const GOLD   = "#C9A87E";
const GOLDL  = "#D4A85A";
const CREAM  = "#F5F0E8";
const MUTED  = "#8B7355";
const BORDER = "#4A3427";

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

type Step = "email" | "otp" | "password" | "register";

export default function AuthScreen() {
  const insets       = useSafeAreaInsets();
  const { t }        = useTranslation();
  const { sendOtp, verifyOtp, signIn, signUp } = useAuth();

  const [step,     setStep]     = useState<Step>("email");
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState(["","","","","",""]);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [message,  setMessage]  = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs pour les 6 champs OTP
  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glow      = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    glowAnim.start();
    return () => glowAnim.stop();
  }, []);

  const transitionStep = useCallback((next: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      setMessage("");
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // ── Cooldown timer pour resend OTP ──────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Envoyer OTP ─────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage(t("auth.invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await sendOtp(trimmed);
      if (error) {
        setMessage(t("auth.otpSendError"));
      } else {
        setResendCooldown(60);
        transitionStep("otp");
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : t("auth.otpSendError"));
    } finally {
      setLoading(false);
    }
  }, [email, sendOtp, transitionStep, resendCooldown]);

  // ── Vérifier OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length < 6) { setMessage(t("auth.otpDigits")); return; }
    setLoading(true);
    try {
      const { error } = await verifyOtp(email.trim().toLowerCase(), code);
      if (error) {
        setMessage(t("auth.otpInvalid"));
        setOtp(["","","","","",""]);
        otpRefs[0].current?.focus();
      }
      // Si ok → AuthContext déclenche onAuthStateChange → navigation automatique
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : t("auth.otpInvalid"));
    } finally {
      setLoading(false);
    }
  }, [otp, email, verifyOtp]);

  // ── Connexion classique ──────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    if (!password || password.length < 6) {
      setMessage(t("auth.passwordTooShort"));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) setMessage(t("auth.wrongCredentials"));
  }, [email, password, signIn]);

  // ── Inscription ────────────────────────────────────────────────────
  const handleSignUp = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setMessage(t("auth.enterFullName"));
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMessage(t("auth.invalidEmail"));
      return;
    }
    if (!password || password.length < 6) {
      setMessage(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setMessage(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    const { error } = await signUp(trimmedEmail, password, trimmedName, phone.trim() || undefined);
    setLoading(false);
    if (error) {
      setMessage(error.message || t("auth.accountCreateError"));
    } else {
      setMessage("");
      Alert.alert(
        t("auth.accountCreated"),
        t("auth.accountCreatedMessage"),
        [{ text: t("common.ok"), onPress: () => transitionStep("password") }]
      );
    }
  }, [email, password, confirmPassword, fullName, phone, signUp, transitionStep]);

  // ── Gestion OTP input ────────────────────────────────────────────────
  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!digit && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleOtpKeyPress = (key: string, idx: number) => {
    if (key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" />

      {/* Fond avec particules dorées subtiles */}
      <View style={{
        position: "absolute", inset: 0,
        overflow: "hidden",
      }}>
        {/* Cercle de lumière en haut */}
        <Animated.View style={{
          position: "absolute", top: -80, alignSelf: "center",
          width: 300, height: 300, borderRadius: 150,
          backgroundColor: GOLD + "08",
          opacity: glow,
        }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1, justifyContent: "center",
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>

            {/* ── LOGO ────────────────────────────────────────────── */}
            <View style={{ alignItems: "center", marginBottom: 52 }}>
              {/* Badge logo */}
              <Animated.View style={{
                shadowColor: GOLD,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: glow,
                shadowRadius: 20,
                elevation: 10,
                marginBottom: 24,
              }}>
                <RNImage
                  source={require("../../../assets/logo.png")}
                  style={{ width: 100, height: 100, tintColor: "#FFFFFF" }}
                  resizeMode="contain"
                />
              </Animated.View>

              <Text style={{
                color: GOLD, fontSize: 20, fontWeight: "800",
                letterSpacing: 6, marginBottom: 6,
              }}>
                SENZEDY
              </Text>
              <Text style={{
                color: MUTED, fontSize: 10,
                letterSpacing: 6, marginBottom: 4,
              }}>
                AGENCY
              </Text>

              {/* Ligne déco */}
              <View style={{
                flexDirection: "row", alignItems: "center",
                gap: 10, marginTop: 16,
              }}>
                <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: GOLD + "60",
                }} />
                <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
              </View>
            </View>

            {/* ── ÉTAPE 1 : EMAIL ─────────────────────────────────── */}
            {step === "email" && (
              <EmailStep
                email={email}
                onEmailChange={setEmail}
                onSend={handleSendOtp}
                onUsePassword={() => transitionStep("password")}
                onRegister={() => transitionStep("register")}
                loading={loading}
                message={message}
              />
            )}

            {/* ── ÉTAPE 2 : OTP ────────────────────────────────────── */}
            {step === "otp" && (
              <OtpStep
                email={email}
                otp={otp}
                otpRefs={otpRefs}
                onOtpChange={handleOtpChange}
                onKeyPress={handleOtpKeyPress}
                onVerify={handleVerifyOtp}
                onResend={handleSendOtp}
              resendCooldown={resendCooldown}
                onBack={() => transitionStep("email")}
                loading={loading}
                message={message}
              />
            )}

            {/* ── ÉTAPE 3 : MOT DE PASSE ───────────────────────────── */}
            {step === "password" && (
              <PasswordStep
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                showPass={showPass}
                onTogglePass={() => setShowPass(!showPass)}
                onSignIn={handleSignIn}
                onUseMagicLink={() => transitionStep("email")}
                onRegister={() => transitionStep("register")}
                loading={loading}
                message={message}
              />
            )}

            {/* ── ÉTAPE 4 : INSCRIPTION ──────────────────────────── */}
            {step === "register" && (
              <RegisterStep
                fullName={fullName}
                onFullNameChange={setFullName}
                email={email}
                onEmailChange={setEmail}
                phone={phone}
                onPhoneChange={setPhone}
                password={password}
                onPasswordChange={setPassword}
                confirmPassword={confirmPassword}
                onConfirmPasswordChange={setConfirmPassword}
                showPass={showPass}
                onTogglePass={() => setShowPass(!showPass)}
                onSignUp={handleSignUp}
                onBack={() => transitionStep("password")}
                loading={loading}
                message={message}
              />
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  ÉTAPES
// ═══════════════════════════════════════════════════════════════════════

// ── Étape email ───────────────────────────────────────────────────────
function EmailStep({ email, onEmailChange, onSend, onUsePassword, onRegister, loading, message }: {
  email: string; onEmailChange: (t: string) => void;
  onSend: () => void; onUsePassword: () => void; onRegister: () => void;
  loading: boolean; message: string;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={{
        color: CREAM, fontSize: 22, fontWeight: "700",
        letterSpacing: 0.5, marginBottom: 8,
      }}>
        {t("auth.privateMemberAccess")}
      </Text>
      <Text style={{
        color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 36,
      }}>
        {t("auth.emailPrompt")}
      </Text>

      <Label text={t("auth.emailLabel")} />
      <PremiumInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="send"
        onSubmitEditing={onSend}
        icon="mail-outline"
      />

      {!!message && <ErrorMsg text={message} />}

      <GoldButton
        label={t("auth.sendCode")}
        onPress={onSend}
        loading={loading}
        icon="send-outline"
      />

      {/* Créer un compte */}
      <TouchableOpacity onPress={onRegister} style={{ alignItems: "center", marginTop: 24 }}>
        <Text style={{ color: GOLDL, fontSize: 13, fontWeight: "600", letterSpacing: 0.3 }}>
          {t("auth.noAccountYet")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onUsePassword} style={{ alignItems: "center", marginTop: 14 }}>
        <Text style={{ color: MUTED, fontSize: 12, letterSpacing: 0.3 }}>
          {t("auth.passwordLogin")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Étape OTP ─────────────────────────────────────────────────────────
function OtpStep({ email, otp, otpRefs, onOtpChange, onKeyPress, onVerify, onResend, onBack, loading, message, resendCooldown = 0 }: {
  email: string; otp: string[];
  otpRefs: React.RefObject<TextInput | null>[];
  onOtpChange: (v: string, i: number) => void;
  onKeyPress: (k: string, i: number) => void;
  onVerify: () => void; onResend: () => void; onBack: () => void;
  loading: boolean; message: string; resendCooldown?: number;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <Ionicons name="arrow-back" size={16} color={MUTED} />
        <Text style={{ color: MUTED, fontSize: 12 }}>{t("common.back")}</Text>
      </TouchableOpacity>

      <Text style={{
        color: CREAM, fontSize: 22, fontWeight: "700",
        letterSpacing: 0.5, marginBottom: 8,
      }}>
        {t("auth.verification")}
      </Text>
      <Text style={{ color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
        {t("auth.codeSentTo")}
      </Text>
      <Text style={{
        color: GOLDL, fontSize: 14, fontWeight: "600",
        marginBottom: 36,
      }}>
        {email}
      </Text>

      {/* 6 champs OTP */}
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 32 }}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={otpRefs[i]}
            value={digit}
            onChangeText={(v) => onOtpChange(v, i)}
            onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={{
              width: 46, height: 58,
              backgroundColor: digit ? BG2 : "#0A0503",
              borderWidth: 1.5,
              borderColor: digit ? GOLD : BORDER,
              borderRadius: 12,
              textAlign: "center",
              fontSize: 24, fontWeight: "700",
              color: GOLD,
            }}
            autoFocus={i === 0}
          />
        ))}
      </View>

      {!!message && <ErrorMsg text={message} />}

      <GoldButton
        label={t("auth.validateCode")}
        onPress={onVerify}
        loading={loading}
        icon="checkmark-circle-outline"
      />

      <TouchableOpacity
        onPress={onResend}
        disabled={resendCooldown > 0}
        style={{ alignItems: "center", marginTop: 20, opacity: resendCooldown > 0 ? 0.5 : 1 }}
      >
        <Text style={{ color: MUTED, fontSize: 12 }}>
          {resendCooldown > 0
            ? `${t("auth.notReceived")} (${resendCooldown}s)`
            : t("auth.notReceived")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Étape mot de passe ────────────────────────────────────────────────
function PasswordStep({ email, onEmailChange, password, onPasswordChange, showPass, onTogglePass, onSignIn, onUseMagicLink, onRegister, loading, message }: {
  email: string; onEmailChange: (t: string) => void;
  password: string; onPasswordChange: (t: string) => void;
  showPass: boolean; onTogglePass: () => void;
  onSignIn: () => void; onUseMagicLink: () => void; onRegister: () => void;
  loading: boolean; message: string;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={{
        color: CREAM, fontSize: 22, fontWeight: "700",
        letterSpacing: 0.5, marginBottom: 8,
      }}>
        {t("auth.login")}
      </Text>
      <Text style={{
        color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 36,
      }}>
        {t("auth.loginWithPassword")}
      </Text>

      <Label text={t("auth.emailLabel")} />
      <PremiumInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
      />

      <Label text={t("auth.passwordLabel")} />
      <View style={{ position: "relative" }}>
        <PremiumInput
          value={password}
          onChangeText={onPasswordChange}
          placeholder="••••••••"
          secureTextEntry={!showPass}
          returnKeyType="done"
          onSubmitEditing={onSignIn}
          icon="lock-closed-outline"
        />
        <TouchableOpacity
          onPress={onTogglePass}
          style={{ position: "absolute", right: 16, top: 16 }}
        >
          <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
        </TouchableOpacity>
      </View>

      {!!message && <ErrorMsg text={message} />}

      <GoldButton
        label={t("auth.signIn")}
        onPress={onSignIn}
        loading={loading}
        icon="log-in-outline"
      />

      {/* Créer un compte */}
      <TouchableOpacity onPress={onRegister} style={{ alignItems: "center", marginTop: 24 }}>
        <Text style={{ color: GOLDL, fontSize: 13, fontWeight: "600", letterSpacing: 0.3 }}>
          {t("auth.noAccountYet")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onUseMagicLink} style={{ alignItems: "center", marginTop: 14 }}>
        <Text style={{ color: MUTED, fontSize: 12, letterSpacing: 0.3 }}>
          {t("auth.passwordlessLogin")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Étape inscription ─────────────────────────────────────────────────
function RegisterStep({ fullName, onFullNameChange, email, onEmailChange, phone, onPhoneChange, password, onPasswordChange, confirmPassword, onConfirmPasswordChange, showPass, onTogglePass, onSignUp, onBack, loading, message }: {
  fullName: string; onFullNameChange: (t: string) => void;
  email: string; onEmailChange: (t: string) => void;
  phone: string; onPhoneChange: (t: string) => void;
  password: string; onPasswordChange: (t: string) => void;
  confirmPassword: string; onConfirmPasswordChange: (t: string) => void;
  showPass: boolean; onTogglePass: () => void;
  onSignUp: () => void; onBack: () => void;
  loading: boolean; message: string;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <Ionicons name="arrow-back" size={16} color={MUTED} />
        <Text style={{ color: MUTED, fontSize: 12 }}>{t("common.back")}</Text>
      </TouchableOpacity>

      <Text style={{
        color: CREAM, fontSize: 22, fontWeight: "700",
        letterSpacing: 0.5, marginBottom: 8,
      }}>
        {t("auth.createAccount")}
      </Text>
      <Text style={{
        color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 36,
      }}>
        {t("auth.joinSenzedy")}
      </Text>

      <Label text={t("auth.fullName")} />
      <PremiumInput
        value={fullName}
        onChangeText={onFullNameChange}
        placeholder="John Doe"
        autoCapitalize="words"
        icon="person-outline"
      />

      <Label text={t("auth.emailLabel")} />
      <PremiumInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
      />

      <Label text={t("auth.phoneOptional")} />
      <PremiumInput
        value={phone}
        onChangeText={onPhoneChange}
        placeholder="+243 XXX XXX XXX"
        keyboardType="phone-pad"
        icon="call-outline"
      />

      <Label text={t("auth.passwordLabel")} />
      <View style={{ position: "relative" }}>
        <PremiumInput
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t("auth.minChars")}
          secureTextEntry={!showPass}
          icon="lock-closed-outline"
        />
        <TouchableOpacity
          onPress={onTogglePass}
          style={{ position: "absolute", right: 16, top: 16 }}
        >
          <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
        </TouchableOpacity>
      </View>

      <Label text={t("auth.confirmPassword")} />
      <PremiumInput
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder={t("auth.retypePassword")}
        secureTextEntry={!showPass}
        returnKeyType="done"
        onSubmitEditing={onSignUp}
        icon="shield-checkmark-outline"
      />

      {!!message && <ErrorMsg text={message} />}

      <GoldButton
        label={t("auth.createMyAccount")}
        onPress={onSignUp}
        loading={loading}
        icon="person-add-outline"
      />

      <TouchableOpacity onPress={onBack} style={{ alignItems: "center", marginTop: 20 }}>
        <Text style={{ color: MUTED, fontSize: 12, letterSpacing: 0.3 }}>
          {t("auth.alreadyHaveAccount")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANTS UI PARTAGÉS
// ═══════════════════════════════════════════════════════════════════════

function Label({ text }: { text: string }) {
  return (
    <Text style={{
      color: MUTED, fontSize: 10, fontWeight: "700",
      letterSpacing: 2, marginBottom: 8,
    }}>
      {text.toUpperCase()}
    </Text>
  );
}

function PremiumInput({
  value, onChangeText, placeholder, icon, secureTextEntry,
  keyboardType, autoCapitalize, returnKeyType, onSubmitEditing, autoFocus,
}: any) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      backgroundColor: "#0A0503",
      borderWidth: 1.5,
      borderColor: focused ? GOLD + "80" : BORDER,
      borderRadius: 14, paddingHorizontal: 16,
      marginBottom: 20, height: 54,
    }}>
      <Ionicons name={icon} size={16} color={focused ? GOLDL : MUTED} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, color: CREAM, fontSize: 15,
        }}
      />
    </View>
  );
}

function GoldButton({ label, onPress, loading, icon }: {
  label: string; onPress: () => void; loading: boolean; icon?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.82}>
      <LinearGradient
        colors={[GOLDL, GOLD, "#A0732A"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{
          height: 56, borderRadius: 16,
          flexDirection: "row", alignItems: "center",
          justifyContent: "center", gap: 10,
          shadowColor: GOLD,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Text style={{ color: "#1A0D0A", fontSize: 15, fontWeight: "700" }}>
            {label}…
          </Text>
        ) : (
          <>
            {icon && <Ionicons name={icon as any} size={18} color="#1A0D0A" />}
            <Text style={{
              color: "#1A0D0A", fontSize: 14, fontWeight: "800",
              letterSpacing: 0.5,
            }}>
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <View style={{
      backgroundColor: "#FF444415",
      borderRadius: 10, padding: 10,
      borderLeftWidth: 3, borderLeftColor: "#FF4444",
      marginBottom: 16,
    }}>
      <Text style={{ color: "#FF6666", fontSize: 12, lineHeight: 18 }}>
        {text}
      </Text>
    </View>
  );
}
