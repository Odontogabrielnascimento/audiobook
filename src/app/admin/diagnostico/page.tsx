import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checkStorage } from "@/lib/storage";

export const metadata = { title: "Diagnóstico" };

export default async function Diagnostico() {
  await requireAdmin();
  const result = await checkStorage();
  return (
    <div className="container-page max-w-2xl py-8">
      <Link href="/admin" className="text-sm text-accent underline">← Painel</Link>
      <h1 className="mb-2 mt-4 text-3xl font-semibold">Diagnóstico do armazenamento</h1>
      <p className={`mb-4 font-semibold ${result.ok ? "text-accent" : "text-danger"}`}>
        {result.ok ? "Tudo certo: o envio de arquivos funciona." : "Há um problema no envio de arquivos."}
      </p>
      <pre className="card overflow-x-auto whitespace-pre-wrap break-all p-4 text-sm">{JSON.stringify(result, null, 2)}</pre>
      <p className="mt-3 text-xs text-muted">As chaves não aparecem aqui, apenas o tamanho delas.</p>
    </div>
  );
}
