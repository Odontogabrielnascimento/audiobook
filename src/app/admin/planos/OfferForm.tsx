"use client";

import { useActionState } from "react";
import { saveAnnualOffer, type OfferFormState } from "../actions";

export function OfferForm({ enabled, price, until }: { enabled: boolean; price: string; until: string }) {
  const [state, action, pending] = useActionState<OfferFormState, FormData>(saveAnnualOffer, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4 accent-[var(--accent)]" />
        <span className="font-semibold">Oferta ligada</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="price">Valor anual (R$)</label>
          <input id="price" name="price" className="input" inputMode="decimal" defaultValue={price} required />
        </div>
        <div>
          <label className="label" htmlFor="until">Último dia da oferta</label>
          <input id="until" name="until" type="date" className="input" defaultValue={until} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-accent">Salvo.</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</button>
    </form>
  );
}
