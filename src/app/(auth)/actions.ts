"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { query, queryOne } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { clearAttempts, clientIp, recordAttempt, tooMany } from "@/lib/ratelimit";
import { createSession, destroySession } from "@/lib/session";

// Hash ficticio para manter o mesmo tempo de resposta quando o e-mail nao existe
const DUMMY_HASH = bcrypt.hashSync("senha-ficticia", 12);

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/biblioteca";
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (name.length < 2) return { error: "Informe seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (form.get("terms") !== "on") return { error: "Para criar a conta, aceite os Termos de uso e a Política de privacidade." };

  const ip = await clientIp();
  if (await tooMany("signup", ip, 10, 60)) return { error: "Muitas contas criadas a partir desta rede. Tente mais tarde." };
  await recordAttempt("signup", ip);

  const exists = await queryOne("select 1 from users where email = $1", [email]);
  if (exists) return { error: "Já existe uma conta com este e-mail. Tente entrar." };

  const hash = await bcrypt.hash(password, 12);
  const [user] = await query<{ id: string }>(
    "insert into users (name, email, password_hash, terms_accepted_at) values ($1, $2, $3, now()) returning id",
    [name, email, hash],
  );
  await createSession(user.id);
  redirect(safeNext(form.get("next")) === "/biblioteca" ? "/assinar" : safeNext(form.get("next")));
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = await clientIp();

  // Ate 5 erros por e-mail e 30 por rede a cada 15 minutos
  if ((await tooMany("login-email", email, 5, 15)) || (await tooMany("login-ip", ip, 30, 15))) {
    return { error: "Muitas tentativas. Aguarde 15 minutos ou use “Esqueci minha senha”." };
  }

  const user = await queryOne<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1 and deleted_at is null",
    [email],
  );
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    await recordAttempt("login-email", email);
    await recordAttempt("login-ip", ip);
    return { error: "E-mail ou senha incorretos." };
  }
  await clearAttempts("login-email", email);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const done = { ok: "Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };

  const ip = await clientIp();
  if ((await tooMany("reset-email", email, 3, 60)) || (await tooMany("reset-ip", ip, 10, 60))) return done;
  await recordAttempt("reset-email", email);
  await recordAttempt("reset-ip", ip);

  const user = await queryOne<{ id: string; name: string }>(
    "select id, name from users where email = $1 and deleted_at is null",
    [email],
  );
  // A resposta e a mesma exista ou nao a conta, para nao revelar quais e-mails estao cadastrados
  if (!user) return done;

  const token = randomBytes(32).toString("base64url");
  await query(
    "insert into password_resets (token_hash, user_id, expires_at) values ($1, $2, now() + interval '1 hour')",
    [sha256(token), user.id],
  );
  const url = `${config.appUrl}/redefinir-senha?token=${token}`;
  const first = user.name.split(" ")[0];
  await sendEmail(
    email,
    `Criar nova senha · ${config.appName}`,
    emailLayout(
      "Criar nova senha",
      `<p>Olá, ${first}. Recebemos um pedido para criar uma nova senha para a sua conta.</p>
       <p>O link vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>`,
      { label: "Criar nova senha", url },
    ),
    `Olá, ${first}. Para criar uma nova senha, abra este link (vale por 1 hora): ${url}\nSe não foi você, ignore este e-mail.`,
  );
  return done;
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== String(form.get("confirm") || "")) return { error: "As senhas não conferem." };

  const row = await queryOne<{ user_id: string }>(
    `update password_resets set used_at = now()
      where token_hash = $1 and used_at is null and expires_at > now()
      returning user_id`,
    [sha256(token)],
  );
  if (!row) return { error: "Este link expirou ou já foi usado. Peça um novo." };

  const hash = await bcrypt.hash(password, 12);
  await query("update users set password_hash = $2, password_changed_at = now() where id = $1", [row.user_id, hash]);
  await query("delete from password_resets where user_id = $1", [row.user_id]);
  await clearAttempts("login-email", (await queryOne<{ email: string }>("select email from users where id = $1", [row.user_id]))!.email);
  await createSession(row.user_id);
  redirect("/biblioteca");
}
