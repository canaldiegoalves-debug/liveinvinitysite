"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Package, Settings, LogOut, ArrowLeft } from "lucide-react";
import styles from "./Sidebar.module.css";
import { createClient } from "@/lib/supabase-client";

const hiddenRoutes = ["/landing", "/login", "/cadastro", "/onboarding", "/bloqueado"];

export default function Sidebar() {
  const pathname = usePathname();

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
      </nav>

      <div className={styles.footer}>
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
