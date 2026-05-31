// ─── Types globaux Senzedy Agency ────────────────────────────────────

export type PropertyType = "villa" | "appartement" | "maison" | "terrain" | "commercial";
export type TransactionType = "vente" | "location";
export type PropertyStatus = "disponible" | "vendu" | "loue" | "reserve";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: "CDF" | "USD";
  type: PropertyType;
  transaction: TransactionType;
  status: PropertyStatus;
  commune: string;
  quartier: string;
  surface: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  favorites: string[];
  createdAt: string;
}
