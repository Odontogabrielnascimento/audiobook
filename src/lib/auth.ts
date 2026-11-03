import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { queryOne } from "./db";
import { getSession } from "./session";

export type User = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role: "user" | "admin";
  asaas_customer_id: string | null;
};

export type Subscription = {
  id: string;
  asaas_subscription_id: string | null;
  billing_type: "PIX" | "CREDIT_CARD";
  status: "pending" | "active" | "overdue" | "canceled";
  access_until: Date | null;
};

// E-mails listados em ADMIN_EMAILS (separados por virgula) sao sempre administradores
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;
  const user = await queryOne<User & { password_changed_at: Date | null }>(
    `select id, name, email, cpf, role, asaas_customer_id, password_changed_at
       from users where id = $1 and deleted_at is null`,
    [session.userId],
  );
  // Sessoes abertas antes da ultima troca de senha deixam de valer
  if (user?.password_changed_at && session.issuedAt * 1000 < user.password_changed_at.getTime() - 1000) return null;
  if (user && ADMIN_EMAILS.includes(user.email)) user.role = "admin";
  return user;
});

export async function getSubscription(userId: string) {
  return queryOne<Subscription>(
    `select id, asaas_subscription_id, billing_type, status, access_until
       from subscriptions where user_id = $1`,
    [userId],
  );
}

export async function hasAccess(user: User) {
  if (user.role === "admin") return true;
  const sub = await getSubscription(user.id);
  return !!sub?.access_until && sub.access_until.getTime() > Date.now();
}

export async function requireUser(next = "/biblioteca") {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/biblioteca");
  return user;
}
