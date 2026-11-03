import Link from "next/link";
import { config } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-line pb-44 pt-8 md:pb-28">
      <div className="container-page flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {config.legalName || config.appName}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/ajuda" className="hover:text-ink">Ajuda</Link>
          <Link href="/termos" className="hover:text-ink">Termos de uso</Link>
          <Link href="/privacidade" className="hover:text-ink">Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}

// Bloco de texto longo (paginas legais e ajuda)
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 leading-relaxed text-ink/85 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_a]:text-accent [&_a]:underline">
      {children}
    </div>
  );
}

export function DraftNotice() {
  return (
    <p className="rounded-2xl border border-warn/50 bg-warn/10 p-4 text-sm text-warn">
      Rascunho para revisão jurídica. Este texto ainda não foi revisado por um advogado e não deve ser publicado assim.
    </p>
  );
}

export function Fill({ value, label }: { value: string; label: string }) {
  return value ? <>{value}</> : <mark className="rounded bg-warn/20 px-1 text-warn">[{label}]</mark>;
}
