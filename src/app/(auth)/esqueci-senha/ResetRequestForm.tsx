"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "../actions";

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, undefined);
  if (state?.ok) {
    return (
      <div className="card space-y-4 p-6">
        <p>{state.ok}</p>
        <Link href="/entrar" className="btn-ghost">Voltar para entrar</Link>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Enviando..." : "Enviar link"}</button>
    </form>
  );
}
