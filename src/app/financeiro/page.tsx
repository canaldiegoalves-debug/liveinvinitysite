"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Percent, Briefcase } from "lucide-react";
import fStyles from "./page.module.css";
import { getFinanceiro } from "@/app/actions/orcamentos";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

type Dados = { receita: number; custos: number; lucro: number; margem: number; total: number };

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [dados, setDados] = useState<Dados>({ receita: 0, custos: 0, lucro: 0, margem: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFinanceiro(periodo).then((d) => { setDados(d); setLoading(false); });
  }, [periodo]);

  return (
    <div className={fStyles.container}>
      <header className={fStyles.header}>
        <div>
          <h1 className={fStyles.title}>Análise Financeira</h1>
          <p className={fStyles.subtitle}>Métricas reais baseadas em orçamentos com status "Entregue"</p>
        </div>
        <select className={fStyles.filterSelect} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="semana">Última Semana</option>
          <option value="mes">Este Mês</option>
          <option value="ano">Este Ano</option>
        </select>
      </header>

      <section className={fStyles.statsGrid}>
        {[
          { label: "Receita Total", value: fmt(dados.receita), sub: "Orçamentos entregues", icon: <DollarSign size={20} className={fStyles.statIcon} /> },
          { label: "Lucro Líquido", value: fmt(dados.lucro), sub: "Após custo de materiais", icon: <TrendingUp size={20} className={fStyles.statIcon} /> },
          { label: "Margem Média", value: fmtPct(dados.margem), sub: "Sobre a receita total", icon: <Percent size={20} className={fStyles.statIcon} /> },
          { label: "Serviços Realizados", value: dados.total.toString(), sub: "No período selecionado", icon: <Briefcase size={20} className={fStyles.statIcon} /> },
        ].map((card) => (
          <div key={card.label} className={`premium-card ${fStyles.statCard}`}>
            <div className={fStyles.statHeader}>
              <span className={fStyles.statTitle}>{card.label}</span>
              {card.icon}
            </div>
            <div className={fStyles.statValue}>{loading ? "—" : card.value}</div>
            <div className={fStyles.statSubtitle}>{card.sub}</div>
          </div>
        ))}
      </section>

      <div className={`premium-card ${fStyles.chartCard}`}>
        <h3 className={fStyles.chartTitle}>Resumo do Período</h3>
        <p className={fStyles.chartSubtitle}>{periodo === "semana" ? "Últimos 7 dias" : periodo === "mes" ? "Este mês" : "Este ano"}</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>Carregando...</div>
        ) : dados.total === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
            Nenhum orçamento entregue neste período.<br />
            Marque um orçamento como "Entregue" para ver as métricas.
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Receita</span><strong>{fmt(dados.receita)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: "100%", background: "var(--primary)" }}></div></div>
              </div>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Custo de Materiais</span><strong>{fmt(dados.custos)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: `${dados.receita > 0 ? (dados.custos / dados.receita) * 100 : 0}%`, background: "var(--warning)" }}></div></div>
              </div>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Lucro Líquido</span><strong>{fmt(dados.lucro)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: `${dados.receita > 0 ? (dados.lucro / dados.receita) * 100 : 0}%`, background: "var(--success)" }}></div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
