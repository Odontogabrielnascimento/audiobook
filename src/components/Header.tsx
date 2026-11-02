import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-lg font-semibold">
          {config.appName}
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
          <Link href="/biblioteca" className="rounded-full px-2.5 py-1.5 hover:bg-surface sm:px-3">
            Biblioteca
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-full px-2.5 py-1.5 hover:bg-surface sm:px-3">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/conta" className="rounded-full px-2.5 py-1.5 hover:bg-surface sm:px-3">
              <span className="sm:hidden">Conta</span>
              <span className="hidden sm:inline">Minha conta</span>
            </Link>
          ) : (
            <Link href="/entrar" className="btn-primary !px-4 !py-1.5">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
