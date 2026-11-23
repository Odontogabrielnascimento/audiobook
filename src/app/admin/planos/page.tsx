import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { config, formatBRL, formatDay } from "@/lib/config";
import { query } from "@/lib/db";
import { getAnnualOffer } from "@/lib/plans";
import { OfferForm } from "./OfferForm";

export const metadata = { title: "Planos" };

export default async function Planos() {
  await requireAdmin();
  const offer = await getAnnualOffer();
  const counts = await query<{ plan: string; n: number }>(
    "select plan, count(*)::int as n from subscriptions where access_until > now() group by plan",
  );
  const n = (p: string) => counts.find((c) => c.plan === p)?.n ?? 0;

  return (
    <div className="container-page max-w-2xl py-8">
      <Link href="/admin" className="text-sm text-accent underline">← Painel</Link>
      <h1 className="mb-6 mt-4 text-3xl font-semibold">Planos</h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-muted">Mensal · {formatBRL(config.planPrice)}/mês</p>
          <p className="mt-1 text-2xl font-semibold">{n("monthly")} <span className="text-sm font-normal text-muted">ativos</span></p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Anual · {formatBRL(offer.price)}/ano</p>
          <p className="mt-1 text-2xl font-semibold">{n("yearly")} <span className="text-sm font-normal text-muted">ativos</span></p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Oferta do plano anual</h2>
        <p className="mt-1 text-sm text-muted">
          Situação agora:{" "}
          {offer.active ? (
            <span className="font-semibold text-accent">no ar{offer.until ? ` até ${formatDay(offer.until + "T00:00:00Z")}` : ""}</span>
          ) : offer.enabled ? (
            <span className="font-semibold text-danger">encerrada (passou da data)</span>
          ) : (
            <span className="font-semibold">desligada</span>
          )}
          {" · "}desconto de {offer.discountPct}% em relação a 12 mensalidades ({formatBRL(config.planPrice * 12)}).
        </p>
        <div className="mt-5">
          <OfferForm enabled={offer.enabled} price={offer.price.toFixed(2).replace(".", ",")} until={offer.until ?? ""} />
        </div>
        <p className="mt-5 text-xs text-muted">
          Quando a oferta termina ou é desligada, o plano anual some da tela de assinatura. Quem já assinou continua com
          o plano. A renovação anual usa o valor da assinatura no Asaas; mudanças de preço devem ser avisadas com 30 dias,
          como dizem os Termos.
        </p>
      </div>
    </div>
  );
}
