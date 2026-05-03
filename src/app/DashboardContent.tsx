"use client";

import { LayoutDashboard, Users, FileText, Package, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";

export default function DashboardContent({ empresa }: { empresa: any }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel de Controle</h1>
          <p className={styles.subtitle}>Bem-vindo de volta, {empresa.nome}!</p>
        </div>
        <div className={styles.nichoBadge}>
          {empresa.nicho.replace("_", " ")}
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span>Orçamentos Pendentes</span>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div className={styles.statValue}>—</div>
          <Link href="/orcamentos" className={styles.statLink}>Ver todos <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span>Serviços na Agenda</span>
            <Calendar size={18} color="var(--success)" />
          </div>
          <div className={styles.statValue}>—</div>
          <Link href="/agenda" className={styles.statLink}>Ver agenda <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span>Receita do Mês</span>
            <TrendingUp size={18} color="var(--primary)" />
          </div>
          <div className={styles.statValue}>R$ 0,00</div>
          <Link href="/financeiro" className={styles.statLink}>Análise detalhada <ArrowUpRight size={14} /></Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`premium-card ${styles.welcomeCard}`}>
          <div className={styles.welcomeInfo}>
            <h2>Comece por aqui</h2>
            <p>Seu sistema está pronto para o nicho de <strong>{empresa.nicho.replace("_", " ")}</strong>. O próximo passo é cadastrar seus primeiros materiais e serviços.</p>
            <div className={styles.welcomeBtns}>
              <Link href="/materiais" className="premium-button">Cadastrar Materiais</Link>
              <Link href="/servicos" className="premium-button" style={{ background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)" }}>Configurar Serviços</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
