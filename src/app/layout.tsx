import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { getEmpresa } from "@/app/actions/empresa";
import { ThemeProvider } from "@/context/ThemeContext";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
  const empresa = await getEmpresa();
  const headersList = await headers();
  const fullPath = headersList.get("x-invoke-path") || "";
  
  // LÓGICA DE ACESSO E BLOQUEIO
  const isPublicPage = fullPath === "/" || fullPath.includes("/login") || fullPath.includes("/cadastro") || fullPath.includes("/auth");
  const isExpired = empresa?.planoStatus === "expired";
  
  // 1. Se não estiver logado e tentar entrar em página privada -> Login
  if (!empresa && !isPublicPage) {
    redirect("/login");
  }

  // 2. Se o plano expirou -> Bloqueado
  if (isExpired && !isPublicPage && !fullPath.includes("/bloqueado") && !fullPath.includes("/planos")) {
    redirect("/bloqueado");
  }

  const hasNicho = !!empresa?.nicho;

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="app-container">
            {hasNicho && !isExpired && <Navbar />}
            <main className={hasNicho && !isExpired ? "main-content" : "full-content"}>
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
