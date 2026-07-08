// Calculs & formatage du devis — SANS dépendance serveur (importable client).
import type { QuoteItem } from "@/lib/pro-types";

export function euro(n: number): string {
  return (
    (Number.isFinite(n) ? n : 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export type QuoteTotals = {
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
};

/** Sous-total (lignes), frais de service, TVA (% sur sous-total + frais), total. */
export function quoteTotals(
  items: QuoteItem[],
  serviceFee: number,
  taxRate: number
): QuoteTotals {
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const fee = Number(serviceFee) || 0;
  const base = subtotal + fee;
  const tax = base * ((Number(taxRate) || 0) / 100);
  return { subtotal, fee, tax, total: base + tax };
}
