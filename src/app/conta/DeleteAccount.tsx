"use client";

import { useActionState, useState } from "react";
import { deleteMyAccount, type DeleteState } from "./actions";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteMyAccount, undefined);
  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-sm text-muted underline hover:text-danger">Excluir minha conta</button>;
  }
  return (
    <form action={action} className="card space-y-3 border-danger/40 p-5">
      <p className="font-semibold">Excluir conta</p>
      <p className="text-sm text-muted">
        Sua assinatura será cancelada e o acesso termina na hora, sem reembolso proporcional automático.
        Seus dados pessoais, histórico de escuta, estante e avaliações serão apagados. Os registros de pagamento
        ficam guardados sem seu nome, por obrigação fiscal. Esta ação não pode ser desfeita.
      </p>
      <div>
        <label className="label" htmlFor="del-password">Confirme sua senha</label>
        <input id="del-password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn-danger" disabled={pending}>{pending ? "Excluindo..." : "Excluir definitivamente"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}
