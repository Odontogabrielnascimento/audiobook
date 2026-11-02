import { getCurrentUser } from "@/lib/auth";
import { checkStorage } from "@/lib/storage";

// Diagnostico do armazenamento (somente admin): /api/admin/storage-check
export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("Proibido", { status: 403 });
  return Response.json(await checkStorage());
}
