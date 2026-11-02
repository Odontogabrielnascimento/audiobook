import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { RegisterSW } from "@/components/RegisterSW";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: config.appName, template: `%s · ${config.appName}` },
  description: "Audiobooks por assinatura. Ouça no celular ou no computador.",
  appleWebApp: { capable: true, title: config.appName, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#15130f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <PlayerProvider>
          <Header />
          <main className="pb-40">{children}</main>
        </PlayerProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
