import Link from "next/link";
import { config, formatBRL, formatDay } from "@/lib/config";
import { getAnnualOffer } from "@/lib/plans";

// Chamada da oferta de lancamento do plano anual (some quando a oferta acaba)
export async function OfferBanner({ href, compact = false }: { href: string; compact?: boolean }) {
  const offer = await getAnnualOffer();
  if (!offer.active) return null;
  const until = offer.until ? formatDay(offer.until + "T00:00:00Z") : null;
  return (
    <Link href={href} className={`group block overflow-hidden rounded-3xl border border-accent/30 ${compact ? "p-4" : "p-5 sm:p-6"}`}
      style={{ background: "linear-gradient(120deg, rgba(244,163,64,0.18), rgba(228,87,46,0.14) 60%, rgba(28,21,18,0.6))" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">Oferta de lançamento</span>
        <span className="rounded-full bg-flame px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{offer.discountPct}% de desconto</span>
        <span className="text-xs font-semibold text-accent">Por tempo limitado{until ? ` · até ${until}` : ""}</span>
      </div>
      <p className={`mt-3 font-semibold ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
        Plano anual por <span className="text-accent">{formatBRL(offer.price)}</span>{" "}
        <span className="text-base font-normal text-muted">(equivale a {formatBRL(offer.perMonth)}/mês)</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        No mensal, 12 meses custam {formatBRL(config.planPrice * 12)}. <span className="text-ink underline group-hover:text-accent">Garantir a oferta →</span>
      </p>
    </Link>
  );
}
