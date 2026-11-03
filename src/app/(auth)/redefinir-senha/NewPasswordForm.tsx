"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type FormState } from "../actions";

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">Nova senha</label>
        <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <p className="mt-1 text-xs text-muted">Mínimo de 8 caracteres.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repita a nova senha</label>
        <input className="input" id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error} {state.error.includes("expirou") && <Link href="/esqueci-senha" className="underline">Pedir novo link</Link>}
        </p>
      )}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Salvando..." : "Salvar nova senha"}</button>
    </form>
  );
}
