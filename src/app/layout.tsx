import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Finanzas",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
