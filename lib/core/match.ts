import type { BuyerNeed, Product } from "../types";

/** Tag overlap between a buyer's need and a product. Strong = half or more of the need's tags. */
export function matchScore(need: BuyerNeed, p: Product) {
  const hits = need.tags.filter((t) => p.tags.includes(t)).length;
  const ratio = need.tags.length ? hits / need.tags.length : 0;
  return { hits, ratio, fit: ratio >= 0.5 ? "Strong" : hits > 0 ? "Partial" : "None" } as const;
}

export function matchesFor(need: BuyerNeed, products: Product[]) {
  return products
    .map((p) => ({ product: p, ...matchScore(need, p) }))
    .filter((m) => m.hits > 0)
    .sort((a, b) => b.ratio - a.ratio || b.product.stage - a.product.stage);
}
