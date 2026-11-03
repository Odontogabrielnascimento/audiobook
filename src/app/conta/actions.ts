"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, getSubscription } from "@/lib/auth";
import { cancelSubscription } from "@/lib/asaas";
import { query, queryOne } from "@/lib/db";
import { destroySession } from "@/lib/session";

export async function cancelMySubscription() {
  const user = await requireUser("/conta");
  const sub = await getSubscription(user.id);
  if (!sub?.asaas_subscription_id || sub.status === "canceled") return;
  await cancelSubscription(sub.asaas_subscription_id);
  // O acesso continua ate o fim do periodo ja pago
  await query("update subscriptions set status = 'canceled', updated_at = now() where id = $1", [sub.id]);
  revalidatePath("/conta");
}

export type DeleteState = { error?: string } | undefined;

// Exclusao de conta (LGPD): cancela a cobranca, apaga dados pessoais e de uso.
// O historico de pagamentos e mantido sem identificacao pessoal, por obrigacao fiscal.
export async function deleteMyAccount(_: DeleteState, form: FormData): Promise<DeleteState> {
  const user = await requireUser("/conta");
  if (user.role === "admin") return { error: "Contas de administrador não podem ser excluídas por aqui." };
  const row = await queryOne<{ password_hash: string }>("select password_hash from users where id = $1", [user.id]);
  if (!row || !(await bcrypt.compare(String(form.get("password") || ""), row.password_hash))) {
    return { error: "Senha incorreta." };
  }

  const sub = await getSubscription(user.id);
  if (sub?.asaas_subscription_id && sub.status !== "canceled") {
    try {
      await cancelSubscription(sub.asaas_subscription_id);
    } catch (e) {
      console.error(e);
      return { error: "Não foi possível cancelar a assinatura agora. Tente de novo em instantes." };
    }
  }

  await query("delete from progress where user_id = $1", [user.id]);
  await query("delete from shelf where user_id = $1", [user.id]);
  await query("delete from ratings where user_id = $1", [user.id]);
  await query("delete from password_resets where user_id = $1", [user.id]);
  await query("update subscriptions set status = 'canceled', access_until = now(), updated_at = now() where user_id = $1", [user.id]);
  await query(
    `update users set name = 'Conta excluída', email = 'excluida-' || id || '@removido.invalid', cpf = null,
       password_hash = $2, deleted_at = now(), password_changed_at = now()
     where id = $1`,
    [user.id, await bcrypt.hash(randomBytes(32).toString("hex"), 10)],
  );
  await destroySession();
  redirect("/?conta=excluida");
}
