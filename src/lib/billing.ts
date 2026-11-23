import "server-only";
import { pool } from "./db";
import { config } from "./config";
import type { AsaasPayment } from "./asaas";

export type AsaasEvent = {
  id?: string;
  event: string;
  payment?: AsaasPayment;
  subscription?: { id: string; customer: string; status?: string };
};

const PAID = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const REVOKE = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"]);
const SUB_ENDED = new Set(["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"]);

// Processa um evento do Asaas. Idempotente: o mesmo evento nao e aplicado duas vezes.
export async function processAsaasEvent(evt: AsaasEvent) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    if (evt.id) {
      const ins = await client.query(
        "insert into webhook_events (id, event) values ($1, $2) on conflict do nothing returning id",
        [evt.id, evt.event],
      );
      if (ins.rowCount === 0) {
        await client.query("rollback");
        return { ok: true, duplicate: true };
      }
    }

    if (evt.payment) {
      const p = evt.payment;
      // Localiza o usuario pela assinatura; se nao houver, pelo cliente
      const found = await client.query<{ user_id: string }>(
        `select user_id from subscriptions where asaas_subscription_id = $1
         union all
         select id as user_id from users where asaas_customer_id = $2
         limit 1`,
        [p.subscription ?? "", p.customer ?? ""],
      );
      const userId = found.rows[0]?.user_id;
      if (!userId) {
        await client.query("commit");
        return { ok: true, ignored: "usuario nao encontrado" };
      }

      await client.query(
        `insert into payments (asaas_payment_id, user_id, status, billing_type, value, due_date, invoice_url, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, now())
         on conflict (asaas_payment_id) do update set
           status = excluded.status, billing_type = excluded.billing_type, value = excluded.value,
           due_date = excluded.due_date, invoice_url = coalesce(excluded.invoice_url, payments.invoice_url),
           updated_at = now()`,
        [p.id, userId, p.status, p.billingType, p.value, p.dueDate, p.invoiceUrl ?? null],
      );

      if (PAID.has(evt.event)) {
        // Libera ate o proximo vencimento + dias de tolerancia
        await client.query(
          `update subscriptions set
             access_until = greatest(coalesce(access_until, now()),
                                     ($2::date + interval '1 month' + make_interval(days => $3))::timestamptz),
             status = case when status = 'canceled' then status else 'active' end,
             updated_at = now()
           where user_id = $1`,
          [userId, p.dueDate, config.graceDays],
        );
      } else if (evt.event === "PAYMENT_OVERDUE") {
        await client.query(
          `update subscriptions set status = 'overdue', updated_at = now()
            where user_id = $1 and status <> 'canceled'`,
          [userId],
        );
      } else if (REVOKE.has(evt.event)) {
        await client.query(
          "update subscriptions set access_until = now(), updated_at = now() where user_id = $1",
          [userId],
        );
      }
    }

    if (evt.subscription && SUB_ENDED.has(evt.event)) {
      await client.query(
        `update subscriptions set status = 'canceled', updated_at = now()
          where asaas_subscription_id = $1`,
        [evt.subscription.id],
      );
    }

    await client.query("commit");
    return { ok: true };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

// Consulta o Asaas e aplica pagamentos ja confirmados que ainda nao chegaram por webhook
// (webhook atrasado, falho ou nao configurado). Seguro chamar varias vezes.
export async function syncSubscriptionFromAsaas(userId: string) {
  const { isMock, listSubscriptionPayments } = await import("./asaas");
  if (isMock) return;
  const sub = await pool.query<{ asaas_subscription_id: string | null; status: string; access_until: Date | null }>(
    "select asaas_subscription_id, status, access_until from subscriptions where user_id = $1",
    [userId],
  );
  const s = sub.rows[0];
  if (!s?.asaas_subscription_id) return;
  // So consulta quando ha algo pendente (sem acesso valido)
  if (s.access_until && s.access_until > new Date() && s.status === "active") return;
  try {
    const payments = await listSubscriptionPayments(s.asaas_subscription_id);
    for (const p of payments) {
      const event = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status)
        ? (p.status === "CONFIRMED" ? "PAYMENT_CONFIRMED" : "PAYMENT_RECEIVED")
        : p.status === "OVERDUE" ? "PAYMENT_OVERDUE" : null;
      if (event) await processAsaasEvent({ id: `sync_${p.id}_${p.status}`, event, payment: p });
    }
  } catch (err) {
    console.error("Falha ao sincronizar assinatura com o Asaas", err);
  }
}
