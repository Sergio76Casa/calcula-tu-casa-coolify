import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CalculaTuCasa.com — Valoración Inmobiliaria con IA",
  description:
    "Descubre el valor real de tu casa en segundos. Valoración gratuita respaldada por inteligencia artificial y datos reales del mercado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
