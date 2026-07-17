import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter, TikTok_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

const inter = Inter({ subsets: ["latin"] });
const tiktokSans = TikTok_Sans({
  subsets: ["latin"],
  variable: "--font-tiktok-sans",
});

export const metadata: Metadata = {
  title: "Live Infinity - Automação de Lives no TikTok Shop",
  description: "A única extensão profissional para TikTok Shop que transforma vídeos pré-gravados em lives 24/7 com proteção anti-ban absoluta.",
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
      <body className={`${inter.className} ${tiktokSans.variable}`}>
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
