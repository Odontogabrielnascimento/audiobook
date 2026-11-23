import Link from "next/link";
import { config, formatBRL, formatDay } from "@/lib/config";
import { getAnnualOffer } from "@/lib/plans";

// Comparativo dos planos com a oferta de lancamento do anual (some quando a oferta acaba)
export async function OfferBanner({ href, compact = false }: { href: string; compact?: boolean }) {
  const offer = await getAnnualOffer();
  if (!offer.active) return null;
  const until = offer.until ? formatDay(offer.until + "T00:00:00Z") : null;
  const fullYear = config.planPrice * 12;
  const savings = fullYear - offer.price;

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-accent/30 ${compact ? "p-4" : "p-5 sm:p-6"}`}
      style={{ background: "linear-gradient(120deg, rgba(244,163,64,0.14), rgba(228,87,46,0.10) 60%, rgba(28,21,18,0.6))" }}
      aria-label="Planos de assinatura"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">Oferta de lançamento</span>
        <span className="text-xs font-semibold text-accent">Por tempo limitado{until ? ` · até ${until}` : ""}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Mensal */}
        <Link href={href} className="order-2 rounded-2xl border border-line bg-surface/70 p-4 transition hover:border-ink/30 sm:order-1">
          <p className="text-sm font-semibold text-muted">Mensal</p>
          <p className="mt-1">
            <span className="text-2xl font-bold">{formatBRL(config.planPrice)}</span>
            <span className="text-sm text-muted">/mês</span>
          </p>
          <p className="mt-1 text-xs text-muted">12 meses = {formatBRL(fullYear)}</p>
        </Link>

        {/* Anual em oferta */}
        <Link href={href} className="group relative order-1 rounded-2xl border-2 border-accent bg-surface p-4 shadow-[0_10px_30px_-12px_rgba(228,87,46,0.6)] transition hover:brightness-110 sm:order-2">
          <span className="absolute -top-3 right-4 rounded-full bg-flame px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow">
            {offer.discountPct}% de desconto
          </span>
          <p className="text-sm font-semibold text-accent">Anual · melhor escolha</p>
          <p className="mt-1">
            <span className="text-2xl font-bold">{formatBRL(offer.price)}</span>
            <span className="text-sm text-muted">/ano</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Equivale a {formatBRL(offer.perMonth)}/mês · <span className="font-semibold text-ink">economize {formatBRL(savings)}</span>
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-accent group-hover:underline">Garantir a oferta →</span>
        </Link>
      </div>
    </section>
  );
}
