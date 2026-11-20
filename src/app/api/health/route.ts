import { queryOne } from "@/lib/db";

// Verificacao de saude. A Vercel chama esta rota uma vez por dia (vercel.json),
// o que tambem mantem o banco ativo no plano gratuito do Supabase.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  try {
    await queryOne("select 1");
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    console.error("Banco indisponível", err);
    return Response.json({ ok: false }, { status: 503 });
  }
}
