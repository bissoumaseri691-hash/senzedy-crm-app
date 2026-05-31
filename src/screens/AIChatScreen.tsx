/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — AIChatScreen.tsx
 *  Chatbot IA connecté au catalogue · Cartes biens
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Linking, Alert,
  ActivityIndicator, Dimensions, StatusBar, FlatList,
} from "react-native";
import { Image }             from "expo-image";
import { LinearGradient }    from "expo-linear-gradient";
import { Ionicons }          from "@expo/vector-icons";
import { useSafeAreaInsets }  from "react-native-safe-area-context";
import { useNavigation }     from "@react-navigation/native";
import { colors } from "../theme/colors";
import {
  sendChatMessage, ChatMessage, ApiMessage, QUICK_SUGGESTIONS,
  resetConversation,
} from "../services/aiService";
import { SearchResult }      from "../services/googleSearchService";
import type { Property }     from "../services/propertyService";
import { formatPrice }       from "../services/propertyService";
import type { MainStackNavProp } from "../navigation/AppNavigator";

const { width: SW, height: SH } = Dimensions.get("window");
const PROP_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

// ── Palette locale ─────────────────────────────────────────────────────
const C = {
  bg:          "#F5EFE6",
  bgDeep:      "#EDE4D6",
  surface:     "#FFFFFF",
  gold:        "#C9A87E",
  goldLight:   "#D4A85A",
  goldPale:    "#E8C97E",
  brown:       "#3B1F1A",
  brownDark:   "#2A1510",
  brownMed:    "#5C2E24",
  maroon:      "#8B3A3A",
  cream:       "#F2EBD9",
  muted:       "#9A7B6E",
  border:      "#E2D5C3",
  userBubble1: "#8B3A3A",
  userBubble2: "#3B1F1A",
  aiBubble:    "#FFFFFF",
  online:      "#34D399",
} as const;

// ═══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export default function AIChatScreen() {
  const insets     = useSafeAreaInsets();
  const scrollRef  = useRef<ScrollView>(null);
  const navigation = useNavigation<MainStackNavProp>();

  const { t } = useTranslation();
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const apiHistory = useRef<ApiMessage[]>([]);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  useEffect(() => { if (messages.length) scrollToBottom(); }, [messages]);

  // ── Envoi ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (preset?: string) => {
    const text = (preset ?? inputText).trim();
    if (!text || isLoading) return;
    setInputText("");
    setError(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user",
      content: text, timestamp: new Date(),
    };
    const placeholderId = (Date.now() + 1).toString();
    const placeholder: ChatMessage = {
      id: placeholderId, role: "assistant",
      content: "", timestamp: new Date(), isSearching: true,
    };

    setMessages(prev => [...prev, userMsg, placeholder]);
    setIsLoading(true);

    try {
      const { content, sources, properties } = await sendChatMessage(text, apiHistory.current);
      apiHistory.current = [
        ...apiHistory.current,
        { role: "user", content: text },
        { role: "assistant", content },
      ];
      animateText(placeholderId, content, sources, properties);
    } catch (e: any) {
      setMessages(prev => prev.map(m =>
        m.id === placeholderId
          ? { ...m, isSearching: false, content: t("aiChat.connectionError") }
          : m
      ));
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  // Ref pour cleanup du setInterval si le composant unmount
  const animTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (animTickRef.current) clearInterval(animTickRef.current);
    };
  }, []);

  const animateText = useCallback((
    id: string, full: string, sources?: SearchResult[], properties?: Property[]
  ) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, isSearching: false, content: "" } : m
    ));
    const words = full.split(" ");
    let i = 0, cur = "";
    if (animTickRef.current) clearInterval(animTickRef.current);
    const tick = setInterval(() => {
      if (i < words.length) {
        cur += (i > 0 ? " " : "") + words[i++];
        const snap = cur;
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: snap } : m));
      } else {
        clearInterval(tick);
        animTickRef.current = null;
        setMessages(prev => prev.map(m =>
          m.id === id
            ? { ...m, sources: sources?.length ? sources : m.sources, properties }
            : m
        ));
      }
    }, 28);
    animTickRef.current = tick;
  }, []);

  const handleReset = useCallback(() => {
    setMessages([]); apiHistory.current = []; setError(null);
    resetConversation();
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <Header
        insets={insets}
        isEmpty={isEmpty}
        onReset={handleReset}
      />

      {/* ── CORPS ────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEmpty
            ? <EmptyState onPress={text => handleSend(text)} />
            : messages.map(m => (
                <MessageBubble key={m.id} message={m} navigation={navigation} />
              ))
          }

          {error && (
            <View style={{
              margin: 8, padding: 12, borderRadius: 12,
              backgroundColor: "#FEE2E2", borderLeftWidth: 3, borderLeftColor: "#EF4444",
            }}>
              <Text style={{ color: "#B91C1C", fontSize: 12 }}>⚠ {error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ── INPUT ─────────────────────────────────────────────────── */}
        <InputBar
          value={inputText}
          onChange={setInputText}
          onSend={() => handleSend()}
          loading={isLoading}
          insetBottom={insets.bottom}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════════════════════════════

function Header({ insets, isEmpty, onReset }: {
  insets: { top: number }; isEmpty: boolean; onReset: () => void;
}) {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <LinearGradient
      colors={[C.brownDark, C.brown]}
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: C.gold + "22",
            borderWidth: 1.5, borderColor: C.gold + "60",
            alignItems: "center", justifyContent: "center",
            shadowColor: C.gold, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
          }}>
            <Text style={{ fontSize: 22 }}>✦</Text>
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <Text style={{ color: C.gold, fontSize: 15, fontWeight: "800", letterSpacing: 3 }}>
                {t("aiChat.title")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: C.online + "20", borderRadius: 8,
                paddingHorizontal: 6, paddingVertical: 2,
              }}>
                <Animated.View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: C.online, opacity: pulse,
                }} />
                <Text style={{ color: C.online, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 }}>
                  {t("aiChat.online")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.cream.dark, fontSize: 11, letterSpacing: 0.3 }}>
              {t("aiChat.catalogConnected")} · {new Date().toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR")}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Reset conversation */}
          {!isEmpty && (
            <TouchableOpacity
              onPress={onReset}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "#FFFFFF10",
                borderWidth: 1, borderColor: C.gold + "30",
                alignItems: "center", justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={C.gold} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{
        position: "absolute", bottom: 0, left: 20, right: 20,
        height: 1, backgroundColor: C.gold + "25",
      }} />
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════

function EmptyState({ onPress }: { onPress: (text: string) => void }) {
  const { t } = useTranslation();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <LinearGradient
        colors={[C.brownDark, C.brownMed]}
        style={{
          width: "100%", borderRadius: 28, padding: 28,
          alignItems: "center", marginBottom: 28,
          shadowColor: C.brown, shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35, shadowRadius: 24, elevation: 12,
        }}
      >
        <Animated.View style={{
          transform: [{ translateY: float }],
          width: 80, height: 80, borderRadius: 22,
          backgroundColor: C.gold + "20",
          borderWidth: 1.5, borderColor: C.gold + "50",
          alignItems: "center", justifyContent: "center",
          marginBottom: 18,
          shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
        }}>
          <Text style={{ fontSize: 36 }}>✦</Text>
        </Animated.View>

        <Text style={{
          color: C.gold, fontSize: 22, fontWeight: "800",
          letterSpacing: 4, marginBottom: 8,
        }}>
          {t("aiChat.title")}
        </Text>
        <Text style={{
          color: colors.cream.DEFAULT, fontSize: 13, textAlign: "center",
          lineHeight: 20, opacity: 0.85, letterSpacing: 0.3,
        }}>
          {t("aiChat.subtitle")}
        </Text>

        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20,
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.gold + "30" }} />
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: C.gold + "15", borderRadius: 14,
            paddingHorizontal: 12, paddingVertical: 5,
          }}>
            <Ionicons name="layers-outline" size={12} color={C.gold} />
            <Text style={{ color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>
              {t("aiChat.catalogLabel")}
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: C.gold + "30" }} />
        </View>
      </LinearGradient>

      <View style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        alignSelf: "flex-start", marginBottom: 14,
      }}>
        <View style={{ width: 3, height: 14, backgroundColor: C.gold, borderRadius: 2 }} />
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 2 }}>
          {t("aiChat.suggestions")}
        </Text>
      </View>

      <View style={{ width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {QUICK_SUGGESTIONS.map((s, i) => (
          <SuggestionChip key={i} item={s} onPress={() => onPress(s.text)} index={i} />
        ))}
      </View>
    </View>
  );
}

function SuggestionChip({ item, onPress, index }: {
  item: typeof QUICK_SUGGESTIONS[0]; onPress: () => void; index: number;
}) {
  const isWide = QUICK_SUGGESTIONS.length % 2 !== 0 && index === QUICK_SUGGESTIONS.length - 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        width: isWide ? "100%" : (SW - 32 - 10) / 2,
        backgroundColor: C.surface,
        borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: C.border,
        shadowColor: C.brown, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: C.gold + "15",
        alignItems: "center", justifyContent: "center", marginBottom: 10,
      }}>
        <Ionicons name={item.icon as any} size={18} color={C.gold} />
      </View>
      <Text style={{ color: C.brown, fontSize: 12, fontWeight: "700", lineHeight: 17, marginBottom: 3 }}>
        {item.label}
      </Text>
      <Text style={{ color: C.muted, fontSize: 10, lineHeight: 14 }} numberOfLines={2}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════════════

function MessageBubble({ message, navigation }: {
  message: ChatMessage; navigation: MainStackNavProp;
}) {
  const isUser = message.role === "user";
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: fade, transform: [{ translateX: slide }],
      marginBottom: 16, alignItems: isUser ? "flex-end" : "flex-start",
    }}>
      <View style={{
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end", gap: 10, maxWidth: SW * 0.85,
      }}>
        {!isUser && (
          <View style={{
            width: 32, height: 32, borderRadius: 9,
            backgroundColor: C.brown,
            borderWidth: 1.5, borderColor: C.gold + "50",
            alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginBottom: 2,
          }}>
            <Text style={{ fontSize: 14 }}>✦</Text>
          </View>
        )}

        {isUser ? (
          <LinearGradient
            colors={[C.userBubble1, C.userBubble2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20, borderBottomRightRadius: 4,
              paddingHorizontal: 18, paddingVertical: 12,
              shadowColor: C.brown, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
            }}
          >
            <Text style={{ color: "#FFFBF5", fontSize: 14, lineHeight: 22, fontWeight: "400" }}>
              {message.content}
            </Text>
          </LinearGradient>
        ) : (
          <View style={{ maxWidth: SW * 0.78 }}>
            <View style={{
              backgroundColor: C.aiBubble,
              borderRadius: 20, borderBottomLeftRadius: 4,
              borderLeftWidth: 3, borderLeftColor: C.gold,
              paddingLeft: 15, paddingRight: 16, paddingVertical: 12,
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
              borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
              borderTopColor: C.border, borderRightColor: C.border, borderBottomColor: C.border,
            }}>
              {message.isSearching
                ? <TypingDots />
                : <RichText text={message.content} />
              }
            </View>

          </View>
        )}
      </View>

      <Text style={{
        color: C.muted, fontSize: 10, marginTop: 5,
        marginLeft: isUser ? 0 : 42, letterSpacing: 0.3,
      }}>
        {fmtTime(message.timestamp)}
      </Text>

      {/* ── Cartes propriétés ────────────────────────────────────── */}
      {!isUser && message.properties && message.properties.length > 0 && (
        <PropertyCards properties={message.properties} navigation={navigation} />
      )}

      {/* ── Sources ──────────────────────────────────────────────── */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <Sources sources={message.sources} />
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  PROPERTY CARDS (carousel horizontal)
// ═══════════════════════════════════════════════════════════════════════

function PropertyCards({ properties, navigation }: {
  properties: Property[]; navigation: MainStackNavProp;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 10, marginLeft: 42 }}>
      {/* Badge */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        marginBottom: 10,
      }}>
        <Ionicons name="images-outline" size={12} color={C.gold} />
        <Text style={{ color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>
          {t("propertyDetail.propertiesFound", { count: properties.length })}
        </Text>
      </View>

      {/* Carousel */}
      <FlatList
        data={properties}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <PropertyCard property={item} navigation={navigation} />
        )}
      />
    </View>
  );
}

function PropertyCard({ property, navigation }: {
  property: Property; navigation: MainStackNavProp;
}) {
  const { t } = useTranslation();
  const mainImage = property.images?.[0];
  const hasVideo  = !!property.video_url;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("PropertyDetail", {
        propertyId: property.id,
        title: property.title,
      })}
      activeOpacity={0.88}
      style={{
        width: SW * 0.62,
        backgroundColor: C.surface,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.brown,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Image */}
      <View style={{ height: 130, backgroundColor: C.bgDeep }}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            placeholder={PROP_BLURHASH}
            transition={300}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={32} color={C.muted} />
          </View>
        )}

        {/* Badge vidéo */}
        {hasVideo && (
          <TouchableOpacity
            onPress={() => property.video_url && Linking.openURL(property.video_url)}
            style={{
              position: "absolute", top: 8, right: 8,
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
            }}
          >
            <Ionicons name="play-circle" size={14} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "700" }}>{t("common.video")}</Text>
          </TouchableOpacity>
        )}

        {/* Badge transaction */}
        <View style={{
          position: "absolute", top: 8, left: 8,
          backgroundColor: property.transaction === "vente" ? C.gold : C.maroon,
          borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
            {property.transaction === "vente" ? t("common.sale") : t("common.rental")}
          </Text>
        </View>

        {/* Compteur images */}
        {property.images?.length > 1 && (
          <View style={{
            position: "absolute", bottom: 8, right: 8,
            flexDirection: "row", alignItems: "center", gap: 3,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
          }}>
            <Ionicons name="camera-outline" size={10} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "600" }}>
              {property.images.length}
            </Text>
          </View>
        )}
      </View>

      {/* Infos */}
      <View style={{ padding: 12 }}>
        <Text style={{
          color: C.brownDark, fontSize: 13, fontWeight: "700",
          lineHeight: 18, marginBottom: 4,
        }} numberOfLines={2}>
          {property.title}
        </Text>

        {/* Localisation */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <Ionicons name="location-outline" size={11} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 10 }} numberOfLines={1}>
            {[property.commune, property.quartier].filter(Boolean).join(", ") || "Kinshasa"}
          </Text>
        </View>

        {/* Caractéristiques */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
          {property.surface_m2 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="resize-outline" size={10} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: 10 }}>{property.surface_m2} m²</Text>
            </View>
          )}
          {property.bedrooms && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="bed-outline" size={10} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: 10 }}>{property.bedrooms} {t("common.bedroomsAbbr")}</Text>
            </View>
          )}
          {property.bathrooms && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="water-outline" size={10} color={C.muted} />
              <Text style={{ color: C.muted, fontSize: 10 }}>{property.bathrooms} {t("common.bathroomsAbbr")}</Text>
            </View>
          )}
        </View>

        {/* Prix */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <Text style={{
            color: C.gold, fontSize: 15, fontWeight: "800", letterSpacing: 0.3,
          }}>
            {formatPrice(property.price, property.currency)}
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: C.gold + "15", borderRadius: 6,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ color: C.gold, fontSize: 9, fontWeight: "700" }}>{t("common.view")}</Text>
            <Ionicons name="arrow-forward" size={10} color={C.gold} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────
function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(480 - i * 160),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 2 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: C.gold, transform: [{ translateY: d }],
        }} />
      ))}
    </View>
  );
}

// ── Texte enrichi (bold **…** et listes) ────────────────────────────
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <View style={{ gap: 3 }}>
      {lines.map((line, li) => {
        const isBullet = /^[•\-\*]\s/.test(line) || /^\d+\.\s/.test(line);
        const segs = parseBold(line.replace(/^[•\-\*]\s|^\d+\.\s/, ""));
        return (
          <View key={li} style={isBullet ? {
            flexDirection: "row", gap: 8, alignItems: "flex-start",
          } : undefined}>
            {isBullet && (
              <View style={{
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: C.gold, marginTop: 8, flexShrink: 0,
              }} />
            )}
            <Text style={{
              color: C.brownDark, fontSize: 14, lineHeight: 22,
              flex: isBullet ? 1 : undefined,
            }}>
              {segs.map((s, si) =>
                s.bold
                  ? <Text key={si} style={{ fontWeight: "700", color: C.brown }}>{s.t}</Text>
                  : <Text key={si}>{s.t}</Text>
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function parseBold(t: string) {
  return t.split(/\*\*(.*?)\*\*/g).map((p, i) => ({ t: p, bold: i % 2 === 1 }));
}

// ── Sources Google ────────────────────────────────────────────────────
function Sources({ sources }: { sources: SearchResult[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: 6, marginLeft: 42, maxWidth: SW * 0.7 }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: "row", alignItems: "center", gap: 6,
          backgroundColor: C.gold + "18",
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: C.gold + "35",
          alignSelf: "flex-start",
        }}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 11 }}>🔍</Text>
        <Text style={{ color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
          {sources.length} {sources.length > 1 ? t("aiChat.sources") : t("aiChat.source")}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={10} color={C.gold} />
      </TouchableOpacity>

      {open && (
        <View style={{
          marginTop: 6, backgroundColor: C.surface,
          borderRadius: 12, borderWidth: 1, borderColor: C.border,
          overflow: "hidden",
        }}>
          {sources.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(s.link)}
              activeOpacity={0.75}
              style={{
                padding: 10,
                borderBottomWidth: i < sources.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              <Text style={{
                color: "#1D4ED8", fontSize: 11, fontWeight: "600",
                textDecorationLine: "underline",
              }} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={{ color: C.muted, fontSize: 9, marginTop: 1 }} numberOfLines={1}>
                {s.source}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  INPUT BAR
// ═══════════════════════════════════════════════════════════════════════

function InputBar({ value, onChange, onSend, loading, insetBottom }: {
  value: string; onChange: (t: string) => void;
  onSend: () => void; loading: boolean; insetBottom: number;
}) {
  const { t } = useTranslation();
  const canSend = value.trim().length > 0 && !loading;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.gold + "80"],
  });

  // ── Reconnaissance vocale (Web Speech API) ──────────────────────
  const toggleVoice = useCallback(() => {
    if (Platform.OS !== "web") {
      Alert.alert(
        t("aiChat.voiceTitle"),
        t("aiChat.voiceMessage"),
        [{ text: t("aiChat.voiceOk"), style: "default" }]
      );
      return;
    }

    const W = window as any;
    const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert(t("aiChat.voiceTitle"), "Navigateur non supporté. Utilisez Chrome.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange(value + (value ? " " : "") + transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, value, onChange, t]);

  return (
    <View style={{
      backgroundColor: C.surface,
      paddingHorizontal: 16, paddingTop: 12,
      paddingBottom: Math.max(insetBottom + 4, 14),
      borderTopWidth: 1, borderTopColor: C.border,
      shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
    }}>
      <Animated.View style={{
        flexDirection: "row", alignItems: "flex-end", gap: 10,
        backgroundColor: C.bg,
        borderRadius: 24, borderWidth: 1.5, borderColor,
        paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
        minHeight: 52,
      }}>
        {/* Mic button — Web Speech API on web, alert on native */}
        <TouchableOpacity
          onPress={toggleVoice}
          activeOpacity={0.7}
          style={{ paddingBottom: 5 }}
        >
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={20}
            color={isListening ? "#EF4444" : C.gold}
          />
        </TouchableOpacity>

        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSend}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={t("aiChat.placeholder")}
          placeholderTextColor={C.muted}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          style={{
            flex: 1, color: C.brownDark, fontSize: 14,
            lineHeight: 21, paddingVertical: 4, maxHeight: 110,
          }}
        />

        <TouchableOpacity onPress={onSend} disabled={!canSend} activeOpacity={0.85}>
          {loading ? (
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: C.border,
              alignItems: "center", justifyContent: "center",
            }}>
              <ActivityIndicator size="small" color={C.gold} />
            </View>
          ) : (
            <LinearGradient
              colors={canSend ? [C.goldLight, C.gold] : [C.border, C.border]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 44, height: 44, borderRadius: 14,
                alignItems: "center", justifyContent: "center",
                shadowColor: canSend ? C.gold : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 8, elevation: canSend ? 4 : 0,
              }}
            >
              <Ionicons name="arrow-up" size={20} color={canSend ? C.brownDark : C.muted} />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, marginTop: 8,
      }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold + "60" }} />
        <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 0.5 }}>
          {t("aiChat.footer")}
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold + "60" }} />
      </View>
    </View>
  );
}

// ── Utilitaire ────────────────────────────────────────────────────────
function fmtTime(d: Date) {
  const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
