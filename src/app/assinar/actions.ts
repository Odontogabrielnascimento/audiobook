"use server";

import { redirect } from "next/navigation";
import { requireUser, getSubscription } from "@/lib/auth";
import * as asaas from "@/lib/asaas";
import { config } from "@/lib/config";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { query } from "@/lib/db";

export type CheckoutState = { error?: string } | undefined;

export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await requireUser("/assinar");
  const cpf = onlyDigits(String(form.get("cpf") || ""));
  const method = form.get("method") === "CREDIT_CARD" ? "CREDIT_CARD" : "PIX";
  if (!isValidCPF(cpf)) return { error: "CPF inválido. Confira os números." };

  let invoiceUrl: string | null = null;
  try {
    // 1. Cliente no Asaas
    let customerId = user.asaas_customer_id;
    if (!customerId) {
      customerId = (await asaas.createCustomer({ name: user.name, email: user.email, cpf, userId: user.id })).id;
    } else if (user.cpf !== cpf) {
      await asaas.updateCustomerCpf(customerId, cpf);
    }
    await query("update users set cpf = $1, asaas_customer_id = $2 where id = $3", [cpf, customerId, user.id]);

    // 2. Se ja existe assinatura em aberto, reaproveita
    const existing = await getSubscription(user.id);
    if (existing?.asaas_subscription_id && existing.status !== "canceled") {
      if (existing.status === "active" && existing.access_until && existing.access_until > new Date()) redirect("/conta");
      const pays = await asaas.listSubscriptionPayments(existing.asaas_subscription_id);
      const open = pays.find((p) => ["PENDING", "OVERDUE"].includes(p.status));
      if (open?.invoiceUrl && existing.billing_type === method) {
        invoiceUrl = open.invoiceUrl;
      } else {
        // Mudou a forma de pagamento: cancela a anterior e cria outra
        await asaas.cancelSubscription(existing.asaas_subscription_id);
      }
    }

    // 3. Nova assinatura mensal com primeira cobranca para hoje
    if (!invoiceUrl) {
      const sub = await asaas.createSubscription({
        customerId,
        billingType: method,
        value: config.planPrice,
        nextDueDate: asaas.todayBR(),
        description: config.planDescription,
        userId: user.id,
      });
      await query(
        `insert into subscriptions (user_id, asaas_subscription_id, billing_type, status)
         values ($1, $2, $3, 'pending')
         on conflict (user_id) do update set asaas_subscription_id = excluded.asaas_subscription_id,
           billing_type = excluded.billing_type,
           status = case when subscriptions.access_until > now() then 'active' else 'pending' end,
           updated_at = now()`,
        [user.id, sub.id, method],
      );

      if (asaas.isMock) {
        const id = `mock_pay_${sub.id.slice(9)}`;
        await query(
          `insert into payments (asaas_payment_id, user_id, status, billing_type, value, due_date, invoice_url)
           values ($1, $2, 'PENDING', $3, $4, $5, $6)`,
          [id, user.id, method, config.planPrice, asaas.todayBR(), `/dev/fatura/${id}`],
        );
      }

      // A primeira cobranca e gerada pelo Asaas junto com a assinatura
      for (let i = 0; i < 5 && !invoiceUrl; i++) {
        const pays = await asaas.listSubscriptionPayments(sub.id);
        invoiceUrl = pays[0]?.invoiceUrl ?? null;
        if (!invoiceUrl) await new Promise((r) => setTimeout(r, 800));
      }
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    console.error(err);
    return { error: "Não foi possível iniciar o pagamento agora. Tente de novo em instantes." };
  }

  if (!invoiceUrl) return { error: "A cobrança foi criada, mas o link ainda não está disponível. Veja em Minha conta." };
  redirect(invoiceUrl);
}
