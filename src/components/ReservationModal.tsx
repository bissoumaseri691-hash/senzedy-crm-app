/**
 * ReservationModal — réservation à la nuitée (app), style Booking, identité Senzedy.
 * Aucun paiement en ligne : collecte dates + voyageurs + coordonnées →
 * submitContactRequest → table contact_requests → CRM.
 */
import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { submitContactRequest } from "../services/contactService";

const GOLD = "#C9A87E";
const BRICK = "#8B3A3A";
const GREEN = "#2E7D32";

function parseDays(a: string, b: string): number {
  const pa = a.split(/[\/\-.]/), pb = b.split(/[\/\-.]/);
  if (pa.length < 3 || pb.length < 3) return 0;
  const da = new Date(+pa[2], +pa[1] - 1, +pa[0]);
  const db = new Date(+pb[2], +pb[1] - 1, +pb[0]);
  const n = Math.round((+db - +da) / 86400000);
  return isNaN(n) || n < 0 ? 0 : n;
}

export default function ReservationModal({
  visible, onClose, property,
}: { visible: boolean; onClose: () => void; property: any }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sym = property?.currency === "USD" ? "$" : property?.currency === "CDF" ? "FC " : "";
  const nights = parseDays(checkIn, checkOut);
  const total = nights * (property?.price || 0);

  const close = () => { onClose(); setTimeout(() => setDone(false), 300); };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    const msg =
      `[RÉSERVATION] ${property.title}\n` +
      `Arrivée: ${checkIn || "à préciser"} · Départ: ${checkOut || "à préciser"}\n` +
      `Voyageurs: ${guests} · ${sym}${property.price}/nuit` +
      (nights ? ` · ${nights} nuit(s) = ${sym}${total}` : "") +
      (notes ? `\nNote: ${notes}` : "");
    try {
      await submitContactRequest({ property_id: property.id, full_name: name, phone, email, message: msg } as any);
      setDone(true);
    } catch {
      // silencieux — on laisse l'utilisateur réessayer
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: colors.cream.dark, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.brown.dark,
    backgroundColor: "#fff",
  } as const;
  const label = { fontSize: 11, fontWeight: "700" as const, color: colors.text.secondary, marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" as const };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: "rgba(42,21,16,0.55)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ backgroundColor: colors.offwhite.DEFAULT, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "92%" }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: colors.cream.dark }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.text.secondary }}>{done ? " " : property?.title}</Text>
                {!done && (
                  <Text style={{ fontSize: 22, fontWeight: "800", color: BRICK }}>
                    {sym}{property?.price}<Text style={{ fontSize: 13, fontWeight: "400", color: colors.text.secondary }}> / nuit</Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={close} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {done ? (
              <View style={{ alignItems: "center", padding: 32 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN + "22", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Ionicons name="checkmark" size={32} color={GREEN} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.brown.dark, marginBottom: 8 }}>Demande envoyée !</Text>
                <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: "center", lineHeight: 21 }}>
                  Notre équipe vous recontacte très vite pour confirmer votre réservation. Aucun paiement en ligne.
                </Text>
                <TouchableOpacity onPress={close} style={{ marginTop: 22, backgroundColor: GOLD, paddingHorizontal: 30, paddingVertical: 13, borderRadius: 12 }}>
                  <Text style={{ color: colors.brown.dark, fontWeight: "800", fontSize: 15 }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }} keyboardShouldPersistTaps="handled">
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={label}>Arrivée</Text>
                    <TextInput value={checkIn} onChangeText={setCheckIn} placeholder="JJ/MM/AAAA" placeholderTextColor={colors.text.muted} style={inputStyle} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={label}>Départ</Text>
                    <TextInput value={checkOut} onChangeText={setCheckOut} placeholder="JJ/MM/AAAA" placeholderTextColor={colors.text.muted} style={inputStyle} />
                  </View>
                </View>
                <View>
                  <Text style={label}>Voyageurs</Text>
                  <TextInput value={guests} onChangeText={setGuests} keyboardType="number-pad" style={inputStyle} />
                </View>

                {nights > 0 && (
                  <View style={{ backgroundColor: colors.cream.DEFAULT, borderRadius: 12, padding: 14 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.brown.dark, fontSize: 14 }}>{nights} nuit(s) × {sym}{property.price}</Text>
                      <Text style={{ color: BRICK, fontWeight: "800", fontSize: 16 }}>{sym}{total}</Text>
                    </View>
                    <Text style={{ color: colors.text.secondary, fontSize: 11, marginTop: 5 }}>Total du séjour — aucun paiement en ligne</Text>
                  </View>
                )}

                <View><Text style={label}>Nom complet *</Text><TextInput value={name} onChangeText={setName} placeholder="Votre nom" placeholderTextColor={colors.text.muted} style={inputStyle} /></View>
                <View><Text style={label}>Téléphone *</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+243 ..." placeholderTextColor={colors.text.muted} style={inputStyle} /></View>
                <View><Text style={label}>Email</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="vous@email.com" placeholderTextColor={colors.text.muted} style={inputStyle} /></View>
                <View><Text style={label}>Demandes spéciales</Text><TextInput value={notes} onChangeText={setNotes} multiline placeholder="Optionnel" placeholderTextColor={colors.text.muted} style={[inputStyle, { height: 70, textAlignVertical: "top" }]} /></View>

                <TouchableOpacity
                  onPress={submit}
                  disabled={submitting || !name.trim() || !phone.trim()}
                  style={{ backgroundColor: BRICK, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, opacity: submitting || !name.trim() || !phone.trim() ? 0.5 : 1 }}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 }}>Confirmer la réservation</Text>}
                </TouchableOpacity>
                <Text style={{ textAlign: "center", fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                  Vous ne serez débité de rien — réservez, on vous confirme.
                </Text>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
