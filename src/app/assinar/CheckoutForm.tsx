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

export function CheckoutForm({ defaultCpf, price }: { defaultCpf: string; price: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, undefined);
  const [cpf, setCpf] = useState(maskCPF(defaultCpf));
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  const option = (value: "PIX" | "CREDIT_CARD", title: string, text: string) => (
    <label className={`card flex cursor-pointer gap-3 p-4 ${method === value ? "!border-accent ring-1 ring-accent" : ""}`}>
      <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="mt-1 accent-[var(--accent)]" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </label>
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label" htmlFor="cpf">CPF</label>
        <input id="cpf" name="cpf" className="input" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} required />
        <p className="mt-1 text-xs text-muted">Exigido pelo emissor da cobrança.</p>
      </div>
      <fieldset className="space-y-3">
        <legend className="label">Forma de pagamento</legend>
        {option("PIX", "Pix", "Todo mês você recebe uma nova cobrança por e-mail para pagar pelo Pix.")}
        {option("CREDIT_CARD", "Cartão de crédito", "Cobrança automática todo mês no mesmo cartão.")}
      </fieldset>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Gerando cobrança..." : `Ir para o pagamento · ${price}/mês`}
      </button>
      <p className="text-center text-xs text-muted">
        Você será levado à página segura de pagamento. O acesso é liberado assim que o pagamento for confirmado.
      </p>
    </form>
  );
}
