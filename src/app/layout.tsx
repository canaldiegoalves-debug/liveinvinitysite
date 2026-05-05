import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VALORA - Inteligência em Precificação",
  description: "Gestão inteligente de orçamentos e serviços profissionais",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "user";
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    role = dbUser?.role || "user";
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="app-container">
            <Sidebar userRole={role} isAuthenticated={!!user} />
            <main className="full-content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
