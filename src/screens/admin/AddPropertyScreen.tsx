/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/screens/admin/AddPropertyScreen.tsx
 *  Formulaire complet d'ajout d'un bien immobilier
 *  Admin seulement — insère directement dans Supabase
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useTranslation } from "react-i18next";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// ─── Palette ─────────────────────────────────────────────────────────

const BG      = "#060606";
const SURFACE = "#0F0F0F";
const BORDER  = "#1E1E1E";
const GOLD    = "#C9A87E";
const WHITE   = "#F0F0F0";
const MUTED   = "#4A4A4A";
const ERROR   = "#E53935";
const SUCCESS = "#27AE60";

// ─── Types ───────────────────────────────────────────────────────────

type Transaction = "vente" | "location";
type Category    = "appartement" | "villa" | "maison" | "terrain" | "bureau" | "local" | "entrepot" | "hotel";
type Status      = "disponible" | "reserve" | "vendu" | "loue";
type Currency    = "USD" | "CDF";

interface FormState {
  title:        string;
  description:  string;
  price:        string;
  currency:     Currency;
  transaction:  Transaction;
  category:     Category;
  status:       Status;
  commune:      string;
  quartier:     string;
  address:      string;
  surface_m2:   string;
  bedrooms:     string;
  bathrooms:    string;
  floors:       string;
  images:       string;   // URLs séparées par des virgules
  video_url:    string;
  is_featured:  boolean;
  is_published: boolean;
}

const INITIAL: FormState = {
  title:        "",
  description:  "",
  price:        "",
  currency:     "USD",
  transaction:  "vente",
  category:     "villa",
  status:       "disponible",
  commune:      "",
  quartier:     "",
  address:      "",
  surface_m2:   "",
  bedrooms:     "",
  bathrooms:    "",
  floors:       "",
  images:       "",
  video_url:    "",
  is_featured:  false,
  is_published: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────

function parseImages(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    + "-" + Date.now().toString(36);
}

// ─── Composants internes ─────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, keyboardType, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "url";
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function ChoiceRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.choiceChip,
              value === opt.value && styles.choiceChipActive,
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[
              styles.choiceChipText,
              value === opt.value && styles.choiceChipTextActive,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Toggle({
  label, value, onChange, description,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={styles.toggleLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {description && <Text style={styles.fieldHint}>{description}</Text>}
      </View>
      <View style={[styles.toggleBox, value && styles.toggleBoxOn]}>
        {value && <Ionicons name="checkmark" size={14} color={BG} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────

export default function AddPropertyScreen() {
  const navigation = useNavigation();
  const { user }   = useAuth();

  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Validation ──────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.title.trim())   return t("addProperty.titleRequired");
    if (!form.price.trim())   return t("addProperty.priceRequired");
    if (isNaN(Number(form.price))) return t("addProperty.priceInvalid");
    if (!form.commune.trim()) return t("addProperty.communeRequired");
    return null;
  }

  // ─── Soumission ──────────────────────────────────────────────────

  async function handleSubmit() {
    const err = validate();
    if (err) {
      Alert.alert(t("addProperty.fieldRequired"), err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim() || null,
        price:        Number(form.price),
        currency:     form.currency,
        transaction:  form.transaction,
        category:     form.category,
        status:       form.status,
        slug:         slugify(form.title),
        commune:      form.commune.trim() || null,
        quartier:     form.quartier.trim() || null,
        address:      form.address.trim() || null,
        surface_m2:   form.surface_m2  ? Number(form.surface_m2)  : null,
        bedrooms:     form.bedrooms    ? Number(form.bedrooms)    : null,
        bathrooms:    form.bathrooms   ? Number(form.bathrooms)   : null,
        floors:       form.floors      ? Number(form.floors)      : null,
        images:       parseImages(form.images),
        video_url:    form.video_url.trim() || null,
        is_featured:  form.is_featured,
        is_published: form.is_published,
        agent_id:     user?.id ?? null,
        views_count:  0,
      };

      const { error } = await supabase.from("properties").insert(payload);

      if (error) throw error;

      Alert.alert(
        t("addProperty.successTitle"),
        t("addProperty.successMessage", { title: form.title }),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("addProperty.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  // ─── Rendu ───────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("addProperty.title")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Informations principales ────────────────────── */}
        <SectionTitle label={t("addProperty.mainInfo")} />

        <Field
          label={t("addProperty.titleField")}
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder={t("addProperty.titlePlaceholder")}
        />

        <Field
          label={t("addProperty.descriptionField")}
          value={form.description}
          onChange={(v) => set("description", v)}
          placeholder={t("addProperty.descriptionPlaceholder")}
          multiline
        />

        {/* ── Transaction & Catégorie ─────────────────────── */}
        <SectionTitle label={t("addProperty.typeCategory")} />

        <ChoiceRow<Transaction>
          label={t("addProperty.transaction")}
          value={form.transaction}
          onChange={(v) => set("transaction", v)}
          options={[
            { value: "vente",    label: t("addProperty.sale") },
            { value: "location", label: t("addProperty.rental") },
          ]}
        />

        <ChoiceRow<Category>
          label={t("addProperty.category")}
          value={form.category}
          onChange={(v) => set("category", v)}
          options={[
            { value: "villa",       label: t("addProperty.villaLabel") },
            { value: "appartement", label: t("addProperty.apartmentLabel") },
            { value: "maison",      label: t("addProperty.houseLabel") },
            { value: "terrain",     label: t("addProperty.landLabel") },
            { value: "bureau",      label: t("addProperty.officeLabel") },
            { value: "local",       label: t("addProperty.localLabel") },
            { value: "entrepot",    label: t("addProperty.warehouseLabel") },
            { value: "hotel",       label: t("addProperty.hotelLabel") },
          ]}
        />

        <ChoiceRow<Status>
          label={t("addProperty.statusField")}
          value={form.status}
          onChange={(v) => set("status", v)}
          options={[
            { value: "disponible", label: t("addProperty.availableLabel") },
            { value: "reserve",    label: t("addProperty.reservedLabel") },
            { value: "vendu",      label: t("addProperty.soldLabel") },
            { value: "loue",       label: t("addProperty.rentedLabel") },
          ]}
        />

        {/* ── Prix ────────────────────────────────────────── */}
        <SectionTitle label={t("addProperty.priceSection")} />

        <ChoiceRow<Currency>
          label={t("addProperty.currency")}
          value={form.currency}
          onChange={(v) => set("currency", v)}
          options={[
            { value: "USD", label: "USD ($)" },
            { value: "CDF", label: "CDF (FC)" },
          ]}
        />

        <Field
          label={t("addProperty.priceField")}
          value={form.price}
          onChange={(v) => set("price", v)}
          placeholder={t("addProperty.pricePlaceholder")}
          keyboardType="numeric"
        />

        {/* ── Localisation ─────────────────────────────────── */}
        <SectionTitle label={t("addProperty.locationSection")} />

        <Field
          label={t("addProperty.communeField")}
          value={form.commune}
          onChange={(v) => set("commune", v)}
          placeholder={t("addProperty.communePlaceholder")}
        />

        <Field
          label={t("addProperty.neighborhoodField")}
          value={form.quartier}
          onChange={(v) => set("quartier", v)}
          placeholder={t("addProperty.neighborhoodPlaceholder")}
        />

        <Field
          label={t("addProperty.addressField")}
          value={form.address}
          onChange={(v) => set("address", v)}
          placeholder={t("addProperty.addressPlaceholder")}
        />

        {/* ── Caractéristiques ─────────────────────────────── */}
        <SectionTitle label={t("addProperty.features")} />

        <View style={styles.row4}>
          <View style={{ flex: 1 }}>
            <Field
              label={t("addProperty.surfaceField")}
              value={form.surface_m2}
              onChange={(v) => set("surface_m2", v)}
              placeholder="350"
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label={t("addProperty.bedroomsField")}
              value={form.bedrooms}
              onChange={(v) => set("bedrooms", v)}
              placeholder="4"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row4}>
          <View style={{ flex: 1 }}>
            <Field
              label={t("addProperty.bathroomsField")}
              value={form.bathrooms}
              onChange={(v) => set("bathrooms", v)}
              placeholder="2"
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label={t("addProperty.floorsField")}
              value={form.floors}
              onChange={(v) => set("floors", v)}
              placeholder="2"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ── Médias ───────────────────────────────────────── */}
        <SectionTitle label={t("addProperty.mediaSection")} />

        <Field
          label={t("addProperty.photosField")}
          value={form.images}
          onChange={(v) => set("images", v)}
          placeholder={t("addProperty.photosPlaceholder")}
          multiline
          hint={t("addProperty.photosHint")}
          keyboardType="url"
        />

        <Field
          label={t("addProperty.videoField")}
          value={form.video_url}
          onChange={(v) => set("video_url", v)}
          placeholder={t("addProperty.videoPlaceholder")}
          keyboardType="url"
        />

        {/* ── Options ──────────────────────────────────────── */}
        <SectionTitle label={t("addProperty.optionsSection")} />

        <Toggle
          label={t("addProperty.featuredToggle")}
          description={t("addProperty.featuredDesc")}
          value={form.is_featured}
          onChange={(v) => set("is_featured", v)}
        />

        <Toggle
          label={t("addProperty.publishedToggle")}
          description={t("addProperty.publishedDesc")}
          value={form.is_published}
          onChange={(v) => set("is_published", v)}
        />

        {/* ── Bouton Enregistrer ───────────────────────────── */}
        <View style={{ height: 32 }} />

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={BG} size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color={BG} style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>{t("addProperty.submitBtn")}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection:    "row",
    alignItems:       "center",
    justifyContent:   "space-between",
    paddingHorizontal: 20,
    paddingTop:       Platform.OS === "ios" ? 56 : 20,
    paddingBottom:    16,
    backgroundColor:  BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width:            36,
    height:           36,
    alignItems:       "center",
    justifyContent:   "center",
    borderRadius:     18,
    backgroundColor:  SURFACE,
  },
  headerTitle: {
    color:        WHITE,
    fontSize:     16,
    fontWeight:   "700",
    letterSpacing: 0.5,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop:        24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems:    "center",
    marginBottom:  16,
    marginTop:     8,
  },
  sectionLine: {
    flex:            1,
    height:          1,
    backgroundColor: BORDER,
  },
  sectionLabel: {
    color:         GOLD,
    fontSize:      10,
    fontWeight:    "700",
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },

  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color:         WHITE,
    fontSize:      12,
    fontWeight:    "600",
    letterSpacing: 0.3,
    marginBottom:  6,
  },
  fieldHint: {
    color:        MUTED,
    fontSize:     11,
    marginBottom: 6,
    lineHeight:   16,
  },
  input: {
    backgroundColor:  SURFACE,
    borderWidth:      1,
    borderColor:      BORDER,
    borderRadius:     10,
    color:            WHITE,
    fontSize:         14,
    paddingHorizontal: 14,
    paddingVertical:  12,
  },
  inputMulti: {
    height:      100,
    textAlignVertical: "top",
    paddingTop:  12,
  },

  choiceRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       BORDER,
    backgroundColor:   SURFACE,
  },
  choiceChipActive: {
    borderColor:     GOLD,
    backgroundColor: GOLD + "20",
  },
  choiceChipText: {
    color:     MUTED,
    fontSize:  12,
    fontWeight: "600",
  },
  choiceChipTextActive: {
    color: GOLD,
  },

  toggleRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    borderRadius:   10,
    borderWidth:    1,
    borderColor:    BORDER,
    padding:        14,
    marginBottom:   12,
  },
  toggleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  toggleBox: {
    width:           28,
    height:          28,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     BORDER,
    backgroundColor: BG,
    alignItems:      "center",
    justifyContent:  "center",
  },
  toggleBoxOn: {
    backgroundColor: GOLD,
    borderColor:     GOLD,
  },

  row4: {
    flexDirection: "row",
  },

  submitBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    borderRadius:   14,
    paddingVertical: 16,
    marginTop:      8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color:      BG,
    fontSize:   15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
