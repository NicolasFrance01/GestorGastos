import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SpaceProvider } from "@/context/SpaceContext";

export const metadata: Metadata = {
  title: "Gestor de Gastos - Premium",
  description: "Control exhaustivo de tus finanzas personales y compartidas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SpaceProvider>{children}</SpaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
