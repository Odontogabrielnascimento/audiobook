import "server-only";
import { headers } from "next/headers";
import { query, queryOne } from "./db";

// Limite simples guardado no banco (funciona com varias instancias na Vercel)
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "desconhecido").trim();
}

export async function tooMany(kind: string, key: string, max: number, minutes: number) {
  const row = await queryOne<{ n: number }>(
    `select count(*)::int as n from auth_attempts
      where kind = $1 and key = $2 and created_at > now() - make_interval(mins => $3)`,
    [kind, key, minutes],
  );
  return (row?.n ?? 0) >= max;
}

export async function recordAttempt(kind: string, key: string) {
  await query("insert into auth_attempts (kind, key) values ($1, $2)", [kind, key]);
  // Limpeza ocasional de registros antigos
  if (Math.random() < 0.02) await query("delete from auth_attempts where created_at < now() - interval '1 day'");
}

export async function clearAttempts(kind: string, key: string) {
  await query("delete from auth_attempts where kind = $1 and key = $2", [kind, key]);
}
