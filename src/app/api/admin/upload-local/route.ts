import { getCurrentUser } from "@/lib/auth";
import { driver, isSafeKey, saveLocal } from "@/lib/storage";

// Recebe o envio de arquivos no modo de armazenamento local (desenvolvimento)
export async function PUT(req: Request) {
  if (driver !== "local") return new Response("Indisponível", { status: 404 });
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("Proibido", { status: 403 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!isSafeKey(key) || !req.body) return new Response("Requisição inválida", { status: 400 });
  await saveLocal(key, req.body);
  return new Response(null, { status: 204 });
}
