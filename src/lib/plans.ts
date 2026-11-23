import "server-only";
import { config } from "./config";
import { getSetting } from "./settings";

// Ultimo dia padrao da oferta de lancamento, enquanto nao for definido em Admin > Planos
const DEFAULT_OFFER_UNTIL = "2026-12-31";

export type PlanId = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  price: number;
  cycle: "MONTHLY" | "YEARLY";
  label: string;
};

export type AnnualOffer = {
  active: boolean; // ligada no Admin e dentro do prazo
  enabled: boolean; // ligada no Admin
  price: number;
  until: string | null; // AAAA-MM-DD, ultimo dia da oferta
  discountPct: number; // em relacao a 12 mensalidades
  perMonth: number;
};

function todayBR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Oferta do plano anual (configurada em Admin > Planos)
export async function getAnnualOffer(): Promise<AnnualOffer> {
  const [enabledRaw, priceRaw, until] = await Promise.all([
    getSetting("annual_offer_enabled"),
    getSetting("annual_price"),
    getSetting("annual_offer_until"),
  ]);
  const enabled = enabledRaw === null ? true : enabledRaw === "1";
  const price = Number(priceRaw ?? "69.90");
  const end = until ?? DEFAULT_OFFER_UNTIL;
  const expired = todayBR() > end;
  const full = config.planPrice * 12;
  return {
    enabled,
    active: enabled && !expired && price > 0,
    price,
    until: end,
    discountPct: Math.round((1 - price / full) * 100),
    perMonth: Math.round((price / 12) * 100) / 100,
  };
}

export async function getPlan(id: PlanId): Promise<Plan | null> {
  if (id === "monthly") return { id, price: config.planPrice, cycle: "MONTHLY", label: "Mensal" };
  const offer = await getAnnualOffer();
  return offer.active ? { id, price: offer.price, cycle: "YEARLY", label: "Anual" } : null;
}
