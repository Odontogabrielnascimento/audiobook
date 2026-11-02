"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

// Hash ficticio para manter o mesmo tempo de resposta quando o e-mail nao existe
const DUMMY_HASH = bcrypt.hashSync("senha-ficticia", 12);

export type FormState = { error?: string } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/biblioteca";
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (name.length < 2) return { error: "Informe seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  const exists = await queryOne("select 1 from users where email = $1", [email]);
  if (exists) return { error: "Já existe uma conta com este e-mail. Tente entrar." };

  const hash = await bcrypt.hash(password, 12);
  const [user] = await query<{ id: string }>(
    "insert into users (name, email, password_hash) values ($1, $2, $3) returning id",
    [name, email, hash],
  );
  await createSession(user.id);
  redirect(safeNext(form.get("next")) === "/biblioteca" ? "/assinar" : safeNext(form.get("next")));
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await queryOne<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1",
    [email],
  );
  // Compara mesmo sem usuario para nao revelar quais e-mails existem
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "E-mail ou senha incorretos." };
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
