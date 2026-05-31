/**
 * SENZEDY AGENCY -- src/services/contactService.ts
 * Service de soumission des demandes de contact via Supabase
 */

import { supabase } from "../lib/supabase";

export interface ContactRequestData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  property_id?: string;
  source: string;
}

interface ContactRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Insere une demande de contact dans la table `contact_requests` de Supabase.
 * Le CRM admin recevra la demande en temps reel via Supabase Realtime.
 */
export async function submitContactRequest(
  data: ContactRequestData
): Promise<ContactRequestResult> {
  try {
    // Recuperer l'utilisateur connecte (optionnel)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("contact_requests").insert({
      user_id: user?.id ?? null,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
      property_id: data.property_id || null,
      source: data.source,
      status: "nouveau",
    });

    if (error) {
      console.warn("[contactService] Insert error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[contactService] Unexpected error:", err?.message);
    return {
      success: false,
      error: "Une erreur inattendue est survenue. Veuillez reessayer.",
    };
  }
}
