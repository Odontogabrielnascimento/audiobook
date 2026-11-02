"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type FormState } from "./actions";

export function AuthForm({ mode, next }: { mode: "entrar" | "cadastro"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "entrar" ? signIn : signUp, undefined);
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "cadastro" && (
        <div>
          <label className="label" htmlFor="name">Nome</label>
          <input className="input" id="name" name="name" autoComplete="name" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          minLength={mode === "cadastro" ? 8 : undefined}
          autoComplete={mode === "cadastro" ? "new-password" : "current-password"}
          required
        />
        {mode === "cadastro" && <p className="mt-1 text-xs text-muted">Mínimo de 8 caracteres.</p>}
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "entrar" ? (
          <>Ainda não tem conta? <Link className="text-accent underline" href={`/cadastro${q}`}>Cadastre-se</Link></>
        ) : (
          <>Já tem conta? <Link className="text-accent underline" href={`/entrar${q}`}>Entrar</Link></>
        )}
      </p>
    </form>
  );
}
