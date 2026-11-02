import Link from "next/link";
import { requireUser, getSubscription } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/config";
import { signOut } from "../(auth)/actions";
import { cancelMySubscription } from "./actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Minha conta" };

const PAY_STATUS: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  RECEIVED: "Pago",
  CONFIRMED: "Pago",
  RECEIVED_IN_CASH: "Pago",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
};

export default async function Conta() {
  const user = await requireUser("/conta");
  const sub = await getSubscription(user.id);
  const payments = await query<{ asaas_payment_id: string; status: string; value: string; due_date: Date; invoice_url: string | null; billing_type: string | null }>(
    "select * from payments where user_id = $1 order by due_date desc limit 12",
    [user.id],
  );
  const accessOk = !!sub?.access_until && sub.access_until > new Date();
  const pending = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");

  let statusText = "Sem assinatura";
  if (user.role === "admin") statusText = "Administrador (acesso completo)";
  else if (sub?.status === "canceled") statusText = accessOk ? `Cancelada · acesso até ${formatDate(sub.access_until!)}` : "Cancelada";
  else if (accessOk) statusText = `Ativa · acesso garantido até ${formatDate(sub!.access_until!)}`;
  else if (sub?.status === "overdue") statusText = "Pagamento em atraso";
  else if (sub) statusText = "Aguardando o primeiro pagamento";

  return (
    <div className="container-page max-w-2xl space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Minha conta</h1>

      <section className="card p-5">
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold">Assinatura</h2>
          <p className="mt-1">{statusText}</p>
          {sub && <p className="text-sm text-muted">Forma de pagamento: {sub.billing_type === "PIX" ? "Pix" : "Cartão de crédito"}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {pending?.invoice_url && (
            <a href={pending.invoice_url} className="btn-primary">Pagar cobrança em aberto</a>
          )}
          {(!sub || sub.status === "canceled") && !accessOk && user.role !== "admin" && (
            <Link href="/assinar" className="btn-primary">Assinar</Link>
          )}
          {sub && sub.status !== "canceled" && sub.asaas_subscription_id && (
            <form action={cancelMySubscription}>
              <ConfirmButton className="btn-danger" message="Cancelar a assinatura? Você mantém o acesso até o fim do período já pago.">
                Cancelar assinatura
              </ConfirmButton>
            </form>
          )}
        </div>
      </section>

      {payments.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-xl font-semibold">Pagamentos</h2>
          <ul className="divide-y divide-line text-sm">
            {payments.map((p) => (
              <li key={p.asaas_payment_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{formatDate(p.due_date)} · {formatBRL(Number(p.value))}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted">{PAY_STATUS[p.status] ?? p.status}</span>
                  {p.invoice_url && <a className="text-accent underline" href={p.invoice_url}>Fatura</a>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={signOut}>
        <button className="btn-ghost">Sair</button>
      </form>
    </div>
  );
}
