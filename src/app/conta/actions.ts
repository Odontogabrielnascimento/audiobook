"use server";

import { revalidatePath } from "next/cache";
import { requireUser, getSubscription } from "@/lib/auth";
import { cancelSubscription } from "@/lib/asaas";
import { query } from "@/lib/db";

export async function cancelMySubscription() {
  const user = await requireUser("/conta");
  const sub = await getSubscription(user.id);
  if (!sub?.asaas_subscription_id || sub.status === "canceled") return;
  await cancelSubscription(sub.asaas_subscription_id);
  // O acesso continua ate o fim do periodo ja pago
  await query("update subscriptions set status = 'canceled', updated_at = now() where id = $1", [sub.id]);
  revalidatePath("/conta");
}
