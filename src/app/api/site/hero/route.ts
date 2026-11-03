import { getSetting } from "@/lib/settings";
import { driver, serveLocal, signedReadUrl } from "@/lib/storage";

// Banner da pagina inicial enviado pelo Admin
export async function GET(req: Request) {
  const key = await getSetting("hero_key");
  if (!key) return new Response("Não encontrado", { status: 404 });
  if (driver === "s3") {
    const url = await signedReadUrl(key, 60 * 60 * 24);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "public, max-age=3600" } });
  }
  return serveLocal(key, req.headers.get("range"), "public, max-age=86400");
}
