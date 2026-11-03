export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Audiobook",
  appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  planPrice: Number(process.env.PLAN_PRICE || "19.90"),
  planDescription: process.env.PLAN_DESCRIPTION || "Assinatura mensal",
  graceDays: Number(process.env.GRACE_DAYS || "3"),
};

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m === 0) return s > 0 ? "menos de 1 min" : "0 min";
  return `${m} min`;
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
