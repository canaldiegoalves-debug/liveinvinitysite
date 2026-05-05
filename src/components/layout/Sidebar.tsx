"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Package, Settings, LogOut, ArrowLeft, Calendar, TrendingUp, CreditCard, ShieldCheck, Sun, Moon } from "lucide-react";
import styles from "./Sidebar.module.css";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const hiddenRoutes = ["/landing", "/login", "/cadastro", "/onboarding", "/bloqueado"];

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/landing";
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>V</div>
        <span className={styles.logoText}>VALORA</span>
      </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}>
          <LayoutDashboard size={20} />
          <span>Painel</span>
        </Link>
        <Link href="/clientes" className={`${styles.navItem} ${pathname.startsWith("/clientes") ? styles.active : ""}`}>
          <Users size={20} />
          <span>Clientes</span>
        </Link>
        <Link href="/materiais" className={`${styles.navItem} ${pathname.startsWith("/materiais") ? styles.active : ""}`}>
          <Package size={20} />
          <span>Materiais</span>
        </Link>
        <Link href="/servicos" className={`${styles.navItem} ${pathname.startsWith("/servicos") ? styles.active : ""}`}>
          <FileText size={20} />
          <span>Serviços</span>
        </Link>
        <Link href="/orcamentos" className={`${styles.navItem} ${pathname.startsWith("/orcamentos") ? styles.active : ""}`}>
          <FileText size={20} />
          <span>Orçamentos</span>
        </Link>
        <Link href="/agenda" className={`${styles.navItem} ${pathname.startsWith("/agenda") ? styles.active : ""}`}>
          <Calendar size={20} />
          <span>Agenda</span>
        </Link>
        <Link href="/financeiro" className={`${styles.navItem} ${pathname.startsWith("/financeiro") ? styles.active : ""}`}>
          <TrendingUp size={20} />
          <span>Financeiro</span>
        </Link>
        <Link href="/planos" className={`${styles.navItem} ${pathname.startsWith("/planos") ? styles.active : ""}`}>
          <CreditCard size={20} />
          <span>Meu Plano</span>
        </Link>
        {userRole === "admin" && (
          <Link href="/admin" className={`${styles.navItem} ${pathname.startsWith("/admin") ? styles.active : ""}`} style={{ color: "#a78bfa" }}>
            <ShieldCheck size={20} />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      <div className={styles.footer}>
        <button onClick={toggleTheme} className={styles.navItem} style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
        </button>
        <Link href="/configuracoes" className={`${styles.navItem} ${pathname.startsWith("/configuracoes") ? styles.active : ""}`}>
          <Settings size={20} />
          <span>Configurações</span>
        </Link>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
