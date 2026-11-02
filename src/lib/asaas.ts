import "server-only";
import { randomUUID } from "node:crypto";
import { query } from "./db";

// Cliente minimo da API do Asaas (v3).
// Sem ASAAS_API_KEY, entra em MODO SIMULADO: nenhuma chamada externa e feita e a
// "fatura" e uma pagina local (/dev/fatura/...) onde o pagamento pode ser simulado.

export const isMock = !process.env.ASAAS_API_KEY;

const API_URL = (process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");

export type AsaasPayment = {
  id: string;
  customer: string;
  subscription?: string | null;
  value: number;
  dueDate: string; // AAAA-MM-DD
  status: string;
  billingType: string;
  invoiceUrl?: string | null;
};

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "audiobook-app",
      access_token: process.env.ASAAS_API_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.map((e: { description: string }) => e.description).join("; ");
    throw new Error(`Asaas ${method} ${path} falhou (${res.status}): ${msg || res.statusText}`);
  }
  return data as T;
}

export async function createCustomer(input: { name: string; email: string; cpf: string; userId: string }) {
  if (isMock) return { id: `mock_cus_${randomUUID().slice(0, 8)}` };
  return call<{ id: string }>("POST", "/customers", {
    name: input.name,
    email: input.email,
    cpfCnpj: input.cpf,
    externalReference: input.userId,
  });
}

export async function updateCustomerCpf(customerId: string, cpf: string) {
  if (isMock) return;
  await call("POST", `/customers/${customerId}`, { cpfCnpj: cpf });
}

export async function createSubscription(input: {
  customerId: string;
  billingType: "PIX" | "CREDIT_CARD";
  value: number;
  nextDueDate: string;
  description: string;
  userId: string;
}) {
  if (isMock) return { id: `mock_sub_${randomUUID().slice(0, 8)}` };
  return call<{ id: string }>("POST", "/subscriptions", {
    customer: input.customerId,
    billingType: input.billingType,
    value: input.value,
    nextDueDate: input.nextDueDate,
    cycle: "MONTHLY",
    description: input.description,
    externalReference: input.userId,
  });
}

export async function listSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  if (isMock) {
    const rows = await query<{ asaas_payment_id: string; status: string; billing_type: string; value: string; due_date: Date; invoice_url: string }>(
      `select p.* from payments p join subscriptions s on s.user_id = p.user_id
        where s.asaas_subscription_id = $1 order by p.due_date`,
      [subscriptionId],
    );
    return rows.map((r) => ({
      id: r.asaas_payment_id,
      customer: "",
      subscription: subscriptionId,
      value: Number(r.value),
      dueDate: r.due_date.toISOString().slice(0, 10),
      status: r.status,
      billingType: r.billing_type,
      invoiceUrl: r.invoice_url,
    }));
  }
  const res = await call<{ data: AsaasPayment[] }>("GET", `/subscriptions/${subscriptionId}/payments`);
  return res.data;
}

export async function cancelSubscription(subscriptionId: string) {
  if (isMock) return;
  await call("DELETE", `/subscriptions/${subscriptionId}`);
}

// Data de hoje no fuso de Sao Paulo, no formato AAAA-MM-DD
export function todayBR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
