import Link from "next/link";
import { Cover } from "@/components/BookCard";
import { requireAdmin } from "@/lib/auth";
import { listBooks } from "@/lib/catalog";
import { formatBRL, formatDuration } from "@/lib/config";
import { queryOne } from "@/lib/db";
import { storageUsage } from "@/lib/storage";

export const metadata = { title: "Admin" };

export default async function Admin() {
  await requireAdmin();
  const [books, stats, usage] = await Promise.all([
    listBooks({ includeUnpublished: true }),
    queryOne<{ users: number; active: number; revenue: string }>(
      `select (select count(*) from users where role = 'user')::int as users,
              (select count(*) from subscriptions where access_until > now())::int as active,
              (select coalesce(sum(value), 0) from payments
                where status in ('RECEIVED', 'CONFIRMED') and due_date >= date_trunc('month', now())) as revenue`,
    ),
    storageUsage(),
  ]);

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Painel</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/planos" className="btn-ghost">Planos</Link>
          <Link href="/admin/categorias" className="btn-ghost">Categorias</Link>
          <Link href="/admin/aparencia" className="btn-ghost">Aparência</Link>
          <Link href="/admin/diagnostico" className="btn-ghost">Diagnóstico</Link>
          <Link href="/admin/livros/novo" className="btn-primary">Novo livro</Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          ["Cadastros", String(stats?.users ?? 0)],
          ["Assinantes ativos", String(stats?.active ?? 0)],
          ["Recebido no mês", formatBRL(Number(stats?.revenue ?? 0))],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <StorageCard usage={usage} />

      {books.length === 0 ? (
        <p className="text-muted">Nenhum livro cadastrado. Comece por “Novo livro”.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/livros/${b.id}`} className="flex items-center gap-4 p-3 hover:bg-paper">
                <div className="w-12 shrink-0"><Cover book={b} className="!rounded-lg !text-[8px] !p-1" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.title}</p>
                  <p className="truncate text-sm text-muted">{b.author} · {b.chapter_count} faixas · {formatDuration(b.total_seconds)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.published ? "bg-accent-soft text-accent" : "border border-line text-muted"}`}>
                  {b.published ? "Publicado" : "Rascunho"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Limite de armazenamento a comparar (Supabase gratuito: 1 GB). Ajuste com STORAGE_LIMIT_GB.
const LIMIT_GB = Number(process.env.STORAGE_LIMIT_GB || "1");

function fmtSize(bytes: number) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2).replace(".", ",")} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

function StorageCard({ usage }: { usage: { bytes: number; files: number; audioBytes: number } | null }) {
  if (!usage) {
    return <p className="card mb-8 p-4 text-sm text-muted">Não foi possível medir o armazenamento agora.</p>;
  }
  const limit = LIMIT_GB * 1024 ** 3;
  const pct = Math.min(100, Math.round((usage.bytes / limit) * 100));
  const color = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warn" : "bg-accent";
  return (
    <div className="card mb-8 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-muted">Armazenamento usado</p>
        <p className="text-sm tabular-nums">
          <span className="text-lg font-semibold">{fmtSize(usage.bytes)}</span>
          <span className="text-muted"> de {LIMIT_GB.toString().replace(".", ",")} GB ({pct}%)</span>
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {usage.files} arquivos · áudios: {fmtSize(usage.audioBytes)}
        {pct >= 90 ? " · Perto do limite: novos envios podem falhar." : pct >= 70 ? " · Atenção: mais de 70% usado." : ""}
      </p>
    </div>
  );
}
