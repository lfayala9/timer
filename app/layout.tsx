import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control de Horario | Fichaje de Trabajo",
  description: "App sencilla y eficiente para fichar tus horas de trabajo desde la oficina o en casa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

