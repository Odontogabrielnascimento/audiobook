import { timingSafeEqual } from "node:crypto";
import { processAsaasEvent, type AsaasEvent } from "@/lib/billing";

// Configure no painel do Asaas: Integracoes > Webhooks
//   URL:   https://SEU-DOMINIO/api/webhooks/asaas
//   Token: o mesmo valor de ASAAS_WEBHOOK_TOKEN
// O Asaas envia o token no cabecalho "asaas-access-token".

function sameToken(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const got = req.headers.get("asaas-access-token") ?? "";
  if (!expected || !sameToken(got, expected)) return new Response("Não autorizado", { status: 401 });

  const evt = (await req.json().catch(() => null)) as AsaasEvent | null;
  if (!evt?.event) return new Response("Payload inválido", { status: 400 });

  try {
    await processAsaasEvent(evt);
    return Response.json({ received: true });
  } catch (err) {
    console.error("Erro ao processar webhook do Asaas", err);
    // Status 500 faz o Asaas tentar de novo depois
    return new Response("Erro", { status: 500 });
  }
}
