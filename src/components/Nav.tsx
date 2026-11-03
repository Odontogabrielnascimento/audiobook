"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  shelf: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m16 5 3.8-1 2.2 15.5-3.8 1z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  admin: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

function isActive(path: string, href: string) {
  return href === "/biblioteca" ? path === "/biblioteca" || path === "/" : path.startsWith(href);
}

function Icon({ name, active }: { name: keyof typeof ICONS; active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

// Links do topo (computador)
export function TopLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {items.map((it) => (
        <Link key={it.href} href={it.href}
          className={`rounded-full px-4 py-2 transition ${isActive(path, it.href) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

// Barra inferior (celular)
export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-4 pb-2 pt-2.5 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}>
                <Icon name={it.icon} active={active} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
