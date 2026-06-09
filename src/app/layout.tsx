import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pro-Personal — Plataforma para Personal Trainers",
  description:
    "Gerencie alunos, treinos, agenda e comunicação. A plataforma completa para personal trainers presenciais.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
