import type { ReactNode } from "react";
import "./globals.css";

const metadata = {
  title: "Finanzas",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="es">
    <body className="bg-neutral-50 text-neutral-900">{children}</body>
  </html>
);

export { metadata };
export default RootLayout;
