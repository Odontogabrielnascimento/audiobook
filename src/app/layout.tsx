import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
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
  themeColor: "#090d18",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh">
        <PlayerProvider>
          <Header />
          <main className="min-h-[70vh] pb-12">{children}</main>
          <Footer />
        </PlayerProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
