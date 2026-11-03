import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

const I = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  shelf: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m16 5 3.8-1 2.2 15.5-3.8 1z" /></>,
  admin: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function NavLink({ href, label, icon }: { href: string; label: string; icon: keyof typeof I }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 rounded-full p-2 hover:bg-surface sm:px-3 sm:py-1.5" aria-label={label}>
      <svg className="sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {I[icon]}
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-2">
        <Link href={user ? "/biblioteca" : "/"} className="font-serif text-lg font-semibold">
          {config.appName}
        </Link>
        <nav className="flex items-center text-sm sm:gap-1">
          <NavLink href="/biblioteca" label="Início" icon="home" />
          <NavLink href="/busca" label="Buscar" icon="search" />
          {user && <NavLink href="/estante" label="Estante" icon="shelf" />}
          {user?.role === "admin" && <NavLink href="/admin" label="Admin" icon="admin" />}
          {user ? (
            <NavLink href="/conta" label="Conta" icon="user" />
          ) : (
            <Link href="/entrar" className="btn-primary ml-1 !px-4 !py-1.5">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
