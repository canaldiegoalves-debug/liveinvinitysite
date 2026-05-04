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
  
  const isExpired = empresa?.planoStatus === "expired";
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
