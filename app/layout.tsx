import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru">
      <body>
        <header>
          <div className="header-container">
            <h1>Telegram Dashboard</h1>
            <nav>
              <a href="/">24 часа</a>
              <span> • </span>
              <a href="/week">7 дней</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
