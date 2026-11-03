import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { BottomNav, TopLinks, type NavItem } from "./Nav";

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-xl text-accent-ink" style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent))" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M5 14v-2a7 7 0 0 1 14 0v2" /><rect x="3.5" y="13.5" width="4" height="6" rx="1.5" fill="currentColor" /><rect x="16.5" y="13.5" width="4" height="6" rx="1.5" fill="currentColor" />
        </svg>
      </span>
      {config.appName}
    </span>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const items: NavItem[] = [
    { href: "/biblioteca", label: "Início", icon: "home" },
    { href: "/busca", label: "Buscar", icon: "search" },
    ...(user ? [{ href: "/estante", label: "Estante", icon: "shelf" } as NavItem] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: "admin" } as NavItem] : []),
    ...(user ? [{ href: "/conta", label: "Conta", icon: "user" } as NavItem] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-paper/70 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href={user ? "/biblioteca" : "/"}><Logo /></Link>
          <TopLinks items={items} />
          {!user && <Link href="/entrar" className="btn-primary !px-5 !py-2">Entrar</Link>}
        </div>
      </header>
      {user && <BottomNav items={items} />}
    </>
  );
}
