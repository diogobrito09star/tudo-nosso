import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tudo Nosso — Treino de Calistenia",
  description: "Plataforma de gestão de treino de calistenia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
