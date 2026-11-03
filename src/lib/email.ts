import "server-only";
import { config } from "./config";

// Envio de e-mail pelo Resend (https://resend.com).
// Variaveis: RESEND_API_KEY e EMAIL_FROM (ex.: "Nome do App <nao-responda@seudominio.com.br>").
// Sem RESEND_API_KEY: em desenvolvimento o conteudo vai para o log; em producao o envio falha.

export const emailConfigured = !!process.env.RESEND_API_KEY;

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!emailConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[e-mail simulado] Para: ${to}\nAssunto: ${subject}\n${text}\n`);
      return true;
    }
    console.error("RESEND_API_KEY não configurada: e-mail não enviado.");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${config.appName} <onboarding@resend.dev>`,
      to: [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) console.error("Falha no envio de e-mail", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export function emailLayout(title: string, body: string, button?: { label: string; url: string }) {
  const btn = button
    ? `<p style="margin:28px 0"><a href="${button.url}" style="background:#e8b84a;color:#1b1405;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${button.label}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Arial,sans-serif;color:#1d1914">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-size:20px;font-weight:700;margin:0 0 24px">${config.appName}</p>
<div style="background:#fff;border-radius:16px;padding:28px">
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
${body}${btn}
</div>
<p style="font-size:12px;color:#6b6257;margin-top:20px">Você recebeu este e-mail porque há uma conta com este endereço em ${config.appName}.</p>
</div></body></html>`;
}
