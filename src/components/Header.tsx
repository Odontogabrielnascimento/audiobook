import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { BottomNav, TopLinks, type NavItem } from "./Nav";

export function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo-topo.svg" alt={config.appName} className="h-8 w-auto sm:h-9" />;
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
