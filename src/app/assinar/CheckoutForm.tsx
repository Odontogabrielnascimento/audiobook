"use client";

import { useActionState, useState } from "react";
import { startCheckout, type CheckoutState } from "./actions";

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export type OfferView = {
  price: string; // ex.: R$ 69,90
  perMonth: string; // ex.: R$ 5,83
  discountPct: number; // ex.: 71
  until: string | null; // ex.: 31/12/2026
  fullYear: string; // ex.: R$ 238,80
} | null;

export function CheckoutForm({ defaultCpf, monthly, offer }: { defaultCpf: string; monthly: string; offer: OfferView }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, undefined);
  const [cpf, setCpf] = useState(maskCPF(defaultCpf));
  const [plan, setPlan] = useState<"yearly" | "monthly">(offer ? "yearly" : "monthly");
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  const radio = "mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]";
  const box = (on: boolean) => `card flex cursor-pointer gap-3 p-4 transition ${on ? "!border-accent ring-1 ring-accent" : ""}`;

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="label">Plano</legend>
        {offer && (
          <label className={`${box(plan === "yearly")} relative overflow-hidden`}>
            <input type="radio" name="plan" value="yearly" checked={plan === "yearly"} onChange={() => setPlan("yearly")} className={radio} />
            <span className="min-w-0 flex-1">
              <span className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">
                  Oferta de lançamento
                </span>
                <span className="rounded-full bg-flame/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                  {offer.discountPct}% de desconto
                </span>
              </span>
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">Anual</span>
                <span className="text-right">
                  <span className="text-2xl font-bold">{offer.price}</span>
                  <span className="text-sm text-muted">/ano</span>
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted">
                Equivale a {offer.perMonth} por mês. No plano mensal, 12 meses custam <s>{offer.fullYear}</s>.
              </span>
              <span className="mt-2 block text-xs font-semibold text-accent">
                Oferta por tempo limitado{offer.until ? `: válida para assinaturas feitas até ${offer.until}` : ""}.
              </span>
            </span>
          </label>
        )}
        <label className={box(plan === "monthly")}>
          <input type="radio" name="plan" value="monthly" checked={plan === "monthly"} onChange={() => setPlan("monthly")} className={radio} />
          <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
            <span>
              <span className="block text-lg font-semibold">Mensal</span>
              <span className="block text-sm text-muted">Renova todo mês. Cancele quando quiser.</span>
            </span>
            <span><span className="text-2xl font-bold">{monthly}</span><span className="text-sm text-muted">/mês</span></span>
          </span>
        </label>
      </fieldset>

      <div>
        <label className="label" htmlFor="cpf">CPF</label>
        <input id="cpf" name="cpf" className="input" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} required />
        <p className="mt-1 text-xs text-muted">Exigido pelo emissor da cobrança.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="label">Forma de pagamento</legend>
        <label className={box(method === "PIX")}>
          <input type="radio" name="method" value="PIX" checked={method === "PIX"} onChange={() => setMethod("PIX")} className={radio} />
          <span>
            <span className="block font-semibold">Pix</span>
            <span className="block text-sm text-muted">
              {plan === "yearly" ? "Pagamento único do ano. A renovação chega por e-mail." : "Todo mês você recebe uma nova cobrança por e-mail para pagar pelo Pix."}
            </span>
          </span>
        </label>
        <label className={box(method === "CREDIT_CARD")}>
          <input type="radio" name="method" value="CREDIT_CARD" checked={method === "CREDIT_CARD"} onChange={() => setMethod("CREDIT_CARD")} className={radio} />
          <span>
            <span className="block font-semibold">Cartão de crédito</span>
            <span className="block text-sm text-muted">
              {plan === "yearly" ? "Cobrança única do ano, renovada automaticamente no mesmo cartão." : "Cobrança automática todo mês no mesmo cartão."}
            </span>
          </span>
        </label>
      </fieldset>

      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn-primary w-full !py-3.5 !text-base" disabled={pending}>
        {pending ? "Gerando cobrança..." : plan === "yearly" && offer ? `Assinar o anual por ${offer.price}` : `Assinar o mensal por ${monthly}/mês`}
      </button>
      <p className="text-center text-xs text-muted">
        Você será levado à página segura de pagamento. O acesso é liberado assim que o pagamento for confirmado.
      </p>
    </form>
  );
}
