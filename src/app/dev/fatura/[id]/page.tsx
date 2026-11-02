import { notFound, redirect } from "next/navigation";
import { isMock } from "@/lib/asaas";
import { processAsaasEvent } from "@/lib/billing";
import { formatBRL, formatDate } from "@/lib/config";
import { queryOne } from "@/lib/db";

// Fatura ficticia usada apenas no MODO SIMULADO (sem ASAAS_API_KEY).
type Pay = { asaas_payment_id: string; user_id: string; status: string; billing_type: string; value: string; due_date: Date };

async function getPay(id: string) {
  return queryOne<Pay & { subscription_id: string; customer: string }>(
    `select p.*, s.asaas_subscription_id as subscription_id, u.asaas_customer_id as customer
       from payments p join subscriptions s on s.user_id = p.user_id join users u on u.id = p.user_id
      where p.asaas_payment_id = $1`,
    [id],
  );
}

export default async function FakeInvoice({ params }: { params: Promise<{ id: string }> }) {
  if (!isMock) notFound();
  const { id } = await params;
  const pay = await getPay(id);
  if (!pay) notFound();

  async function simulate(formData: FormData) {
    "use server";
    if (!isMock) return;
    const p = await getPay(id);
    if (!p) return;
    const event = String(formData.get("event"));
    const status = event === "PAYMENT_OVERDUE" ? "OVERDUE" : p.billing_type === "PIX" ? "RECEIVED" : "CONFIRMED";
    await processAsaasEvent({
      id: `mock_evt_${Date.now()}`,
      event,
      payment: {
        id: p.asaas_payment_id,
        customer: p.customer,
        subscription: p.subscription_id,
        value: Number(p.value),
        dueDate: p.due_date.toISOString().slice(0, 10),
        status,
        billingType: p.billing_type,
        invoiceUrl: `/dev/fatura/${p.asaas_payment_id}`,
      },
    });
    redirect(event === "PAYMENT_OVERDUE" ? "/conta" : "/biblioteca");
  }

  const paid = ["RECEIVED", "CONFIRMED"].includes(pay.status);
  return (
    <div className="container-page max-w-md py-12">
      <p className="mb-4 rounded-xl border border-warn p-3 text-sm text-warn">Fatura simulada · modo de desenvolvimento</p>
      <div className="card space-y-2 p-6">
        <h1 className="text-2xl font-semibold">{formatBRL(Number(pay.value))}</h1>
        <p className="text-sm text-muted">Vencimento {formatDate(pay.due_date)} · {pay.billing_type === "PIX" ? "Pix" : "Cartão"}</p>
        <p className="text-sm">Situação: {pay.status}</p>
        {!paid && (
          <form action={simulate} className="flex flex-wrap gap-3 pt-4">
            <button name="event" value={pay.billing_type === "PIX" ? "PAYMENT_RECEIVED" : "PAYMENT_CONFIRMED"} className="btn-primary">Simular pagamento</button>
            <button name="event" value="PAYMENT_OVERDUE" className="btn-ghost">Simular atraso</button>
          </form>
        )}
      </div>
    </div>
  );
}
