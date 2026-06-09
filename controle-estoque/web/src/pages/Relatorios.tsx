import { useState, useEffect } from "react";
import { 
  Calendar, Download, RefreshCw, BarChart2, 
  TrendingUp, Award, CalendarRange, Filter
} from "lucide-react";
import api from "../services/api";

type TipoRelatorio = "financeiro" | "caixas" | "comissoes";

// ── Tipos de Dados ─────────────────────────────────────────────────────────────

type Lancamento = {
  id: string;
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  status: string;
  dataVencimento: string;
  dataPagamento: string | null;
  motivo: string;
  createdAt: string;
};

type TurnoCaixa = {
  id: string;
  status: string;
  valorAbertura: number;
  valorFechamentoDinheiro: number | null;
  valorFechamentoInformado: number | null;
  createdAt: string;
  closedAt: string | null;
  usuario: {
    nome: string;
    email: string;
  };
};

type Comissao = {
  id: string;
  valorVenda: number;
  valorComissao: number;
  status: string;
  dataCompetencia: string;
  createdAt: string;
  usuario: {
    nome: string;
  };
  venda: {
    id: string;
  };
};

interface RelatoriosProps {
  isDemoMode: boolean;
}

export function Relatorios({ isDemoMode }: RelatoriosProps) {
  const [tipo, setTipo] = useState<TipoRelatorio>("financeiro");
  
  // Datas padrões: início do mês atual até hoje
  const getInicioMes = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };
  const getHoje = () => new Date().toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(getInicioMes());
  const [dataFim, setDataFim] = useState(getHoje());

  // Estados dos dados carregados
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [turnos, setTurnos] = useState<TurnoCaixa[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [tipo, isDemoMode]);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        
        // Simulação do Financeiro
        if (tipo === "financeiro") {
          setLancamentos(db.lancamentos || []);
        } 
        // Simulação dos Caixas
        else if (tipo === "caixas") {
          const mockTurnos = (db.turnos || []).map((t: any) => ({
            ...t,
            usuario: { nome: "Diego Alves", email: "diego@valora.com.br" }
          }));
          setTurnos(mockTurnos);
        } 
        // Simulação das Comissões
        else if (tipo === "comissoes") {
          const mockComissoes = (db.comissoes || []).map((c: any) => ({
            ...c,
            usuario: { nome: "Diego Alves" },
            venda: { id: c.vendaId }
          }));
          setComissoes(mockComissoes);
        }
      } else {
        if (tipo === "financeiro") {
          const res = await api.get("/financeiro/lancamentos");
          setLancamentos(res.data || []);
        } else if (tipo === "caixas") {
          const res = await api.get("/caixa/turnos");
          setTurnos(res.data || []);
        } else if (tipo === "comissoes") {
          const res = await api.get("/financeiro/comissoes");
          setComissoes(res.data || []);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados do relatório:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtragem local pelo período de datas selecionado
  const filtrarPorData = (dataCriacao: string) => {
    const d = new Date(dataCriacao);
    const inicio = new Date(dataInicio + "T00:00:00");
    const fim = new Date(dataFim + "T23:59:59");
    return d >= inicio && d <= fim;
  };

  const lancamentosFiltrados = lancamentos.filter(l => filtrarPorData(l.createdAt));
  const turnosFiltrados = turnos.filter(t => filtrarPorData(t.createdAt));
  const comissoesFiltradas = comissoes.filter(c => filtrarPorData(c.createdAt));

  // ── Rotina Nativa de Exportação CSV ──────────────────────────────────────────
  
  const exportarCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (tipo === "financeiro") {
      filename = `Relatorio_Financeiro_${dataInicio}_a_${dataFim}.csv`;
      headers = ["Data Lançamento", "Tipo", "Valor (R$)", "Motivo/Justificativa", "Status"];
      rows = lancamentosFiltrados.map(l => [
        new Date(l.createdAt).toLocaleString("pt-BR"),
        l.tipo === "RECEITA" ? "RECEITA" : "DESPESA",
        Number(l.valor).toFixed(2),
        l.motivo.replace(/;/g, ","), // evita quebrar o CSV
        l.status
      ]);
    } else if (tipo === "caixas") {
      filename = `Relatorio_Caixas_${dataInicio}_a_${dataFim}.csv`;
      headers = ["Operador", "Abertura", "Fechamento", "Vl. Abertura (R$)", "Vl. Esperado (R$)", "Vl. Informado (R$)", "Diferença (R$)", "Status"];
      rows = turnosFiltrados.map(t => {
        const esperado = Number(t.valorFechamentoDinheiro || 0);
        const informado = Number(t.valorFechamentoInformado || 0);
        const dif = informado - esperado;
        return [
          t.usuario?.nome || "Operador",
          new Date(t.createdAt).toLocaleString("pt-BR"),
          t.closedAt ? new Date(t.closedAt).toLocaleString("pt-BR") : "ABERTO",
          Number(t.valorAbertura).toFixed(2),
          t.closedAt ? esperado.toFixed(2) : "—",
          t.closedAt ? informado.toFixed(2) : "—",
          t.closedAt ? dif.toFixed(2) : "—",
          t.status
        ];
      });
    } else if (tipo === "comissoes") {
      filename = `Relatorio_Comissoes_${dataInicio}_a_${dataFim}.csv`;
      headers = ["Vendedor", "Data Competência", "Ref. Venda", "Valor Venda (R$)", "Comissão (R$)", "Status"];
      rows = comissoesFiltradas.map(c => [
        c.usuario?.nome || "Vendedor",
        new Date(c.dataCompetencia).toLocaleDateString("pt-BR"),
        c.venda?.id || "N/A",
        Number(c.valorVenda).toFixed(2),
        Number(c.valorComissao).toFixed(2),
        c.status
      ]);
    }

    if (rows.length === 0) {
      alert("Nenhum dado localizado no período filtrado para exportação.");
      return;
    }

    // Gerar conteúdo com ponto e vírgula como delimitador
    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    // Adiciona o caractere BOM (\uFEFF) para forçar o Excel do Windows a abrir com codificação UTF-8
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-zinc-100 animate-fade-in">

      {/* ===== HEADER E BARRA DE FILTROS ===== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="text-teal-400" size={20} />
            <div>
              <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">
                Parâmetros do Relatório
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Defina o período e o tipo de auditoria</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              onClick={carregarDados}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Atualizar
            </button>
            <button 
              onClick={exportarCSV}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/10"
            >
              <Download size={13} /> Exportar para Excel (CSV)
            </button>
          </div>
        </div>

        {/* Grade de Controles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/45 p-4 rounded-xl border border-zinc-850">
          
          {/* Tipo de Relatório */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Filter size={10} /> Visão Selecionada
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoRelatorio)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold transition cursor-pointer"
            >
              <option value="financeiro">Movimentação Financeira por Período</option>
              <option value="caixas">Resumo de Fechamento de Caixas</option>
              <option value="comissoes">Extrato de Comissões por Vendedor</option>
            </select>
          </div>

          {/* Data Inicial */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Calendar size={10} /> Data Inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold font-mono"
            />
          </div>

          {/* Data Final */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block flex items-center gap-1">
              <CalendarRange size={10} /> Data Final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold font-mono"
            />
          </div>

        </div>
      </div>

      {/* ===== TABELA GERENCIAL DINÂMICA ===== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Tabela de Lançamentos Financeiros */}
        {tipo === "financeiro" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Data Lançamento</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Motivo / Origem</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500 font-bold">Carregando dados...</td>
                  </tr>
                ) : lancamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500 font-bold">Nenhum lançamento no período filtrado.</td>
                  </tr>
                ) : (
                  lancamentosFiltrados.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-mono">{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                      <td className="p-4">
                        <span className={`font-bold flex items-center gap-1.5 ${l.tipo === "RECEITA" ? "text-emerald-400" : "text-red-400"}`}>
                          <TrendingUp size={12} /> {l.tipo}
                        </span>
                      </td>
                      <td className="p-4 max-w-[280px] truncate">{l.motivo}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">
                        R$ {Number(l.valor).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Fechamento de Caixas */}
        {tipo === "caixas" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Operador</th>
                  <th className="p-4">Abertura</th>
                  <th className="p-4">Fechamento</th>
                  <th className="p-4 text-right">Abertura</th>
                  <th className="p-4 text-right">Esperado</th>
                  <th className="p-4 text-right">Informado</th>
                  <th className="p-4 text-right">Diferença</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-bold">Carregando dados...</td>
                  </tr>
                ) : turnosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-bold">Nenhum caixa fechado no período.</td>
                  </tr>
                ) : (
                  turnosFiltrados.map((t) => {
                    const esperado = Number(t.valorFechamentoDinheiro || 0);
                    const informado = Number(t.valorFechamentoInformado || 0);
                    const dif = informado - esperado;
                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 font-bold text-white">{t.usuario?.nome || "Operador"}</td>
                        <td className="p-4 font-mono">{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                        <td className="p-4 font-mono">{t.closedAt ? new Date(t.closedAt).toLocaleString("pt-BR") : <span className="text-amber-400 font-bold">ABERTO</span>}</td>
                        <td className="p-4 text-right font-mono">R$ {Number(t.valorAbertura).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-zinc-400">{t.closedAt ? `R$ ${esperado.toFixed(2)}` : "—"}</td>
                        <td className="p-4 text-right font-mono text-zinc-400">{t.closedAt ? `R$ ${informado.toFixed(2)}` : "—"}</td>
                        <td className="p-4 text-right font-mono font-bold">
                          {t.closedAt ? (
                            <span className={dif >= 0 ? "text-emerald-400" : "text-red-400"}>
                              R$ {dif.toFixed(2)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === "ABERTO" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-500"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Comissões por Vendedor */}
        {tipo === "comissoes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Data Competência</th>
                  <th className="p-4">ID Venda</th>
                  <th className="p-4 text-right">Valor Venda</th>
                  <th className="p-4 text-right">Valor Comissão</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-bold">Carregando dados...</td>
                  </tr>
                ) : comissoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-bold">Nenhuma comissão no período.</td>
                  </tr>
                ) : (
                  comissoesFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-1.5">
                        <Award size={13} className="text-amber-400" /> {c.usuario?.nome}
                      </td>
                      <td className="p-4 font-mono">{new Date(c.dataCompetencia).toLocaleDateString("pt-BR")}</td>
                      <td className="p-4 font-mono text-zinc-500 truncate max-w-[120px]" title={c.venda?.id}>#{c.venda?.id.replace("venda-", "")}</td>
                      <td className="p-4 text-right font-mono">R$ {Number(c.valorVenda).toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        R$ {Number(c.valorComissao).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
