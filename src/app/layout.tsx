import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const metadata = {
  title: "Finanzas",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="es">
    <body className="bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <nav className="mx-auto flex max-w-3xl gap-6 px-4 py-3 text-sm font-medium">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <Link href="/settings" className="hover:underline">
            Configuración
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </body>
  </html>
);

export { metadata };
export default RootLayout;
