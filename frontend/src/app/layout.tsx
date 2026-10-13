import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { DemoProvider } from "@/providers/demo";
import "./globals.css";
export const metadata: Metadata = {
  title: "Mavric · Cobranzas",
  description:
    "Tu cartera, en orden. Presentación interactiva de cobranzas con datos ficticios.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={GeistSans.variable}>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
