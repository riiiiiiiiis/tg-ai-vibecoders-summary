import type { Metadata } from "next";
import "./globals.css";
import { JetBrains_Mono } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Telegram Dashboard — Analytics & Insights",
  description: "Real-time analytics and AI-powered insights for Telegram communities."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={jetBrainsMono.variable}>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <header className="border-b border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <h1 className="text-lg font-semibold tracking-tight">Telegram Dashboard</h1>
            <nav className="text-sm text-slate-400">
              <a className="hover:text-slate-200" href="/">24 часа</a>
              <span className="mx-3 text-slate-700">•</span>
              <a className="hover:text-slate-200" href="/week">7 дней</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
