import { useState, useEffect } from "react";
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Flame,
  Snowflake,
  Activity
} from "lucide-react";
import api from "../services/api";

type Produto = {
  id: string;
  codigoBarras: string | null;
  nome: string;
  precoCusto: number;
  precoVenda: number;
  lucroPercentual: number;
  estoqueAtual: number;
  estoqueMinimo: number | null;
};

type Movimentacao = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  motivo: string;
  createdAt: string;
  produto: {
    nome: string;
    codigoBarras: string | null;
  };
  usuario?: {
    nome: string;
    email: string;
  };
};

interface DashboardProps {
  produtos: Produto[];
  isDemoMode: boolean;
}

export function Dashboard({ produtos, isDemoMode }: DashboardProps) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);

  useEffect(() => {
    loadMovimentacoes();
  }, [produtos]);

  const loadMovimentacoes = async () => {
    if (isDemoMode) {
      const d = (diasAtras: number) => {
        const date = new Date();
        date.setDate(date.getDate() - diasAtras);
        return date.toISOString();
      };

      // Simulação enriquecida de vendas e entradas retroativas de 7 dias
      setMovimentacoes([
        {
          id: "m-demo-in-1",
          tipo: "ENTRADA",
          quantidade: 150,
          motivo: "NF-e Entrada nº 000.124.981",
          createdAt: d(6),
          produto: { nome: produtos[0]?.nome || "Arroz Integral Camil 1kg", codigoBarras: "7892000200405" }
        },
        // Hoje (Vendas)
        {
          id: "m-1",
          tipo: "SAIDA",
          quantidade: 12,
          motivo: "Venda PDV",
          createdAt: d(0),
          produto: { nome: produtos[0]?.nome || "Arroz Integral Camil 1kg", codigoBarras: "7892000200405" }
        },
        {
          id: "m-2",
          tipo: "SAIDA",
          quantidade: 5,
          motivo: "Venda PDV",
          createdAt: d(0),
          produto: { nome: produtos[1]?.nome || "Detergente Líquido Limão 500ml", codigoBarras: "7891000100203" }
        },
        // Ontem (Vendas)
        {
          id: "m-3",
          tipo: "SAIDA",
          quantidade: 18,
          motivo: "Venda PDV",
          createdAt: d(1),
          produto: { nome: produtos[1]?.nome || "Detergente Líquido Limão 500ml", codigoBarras: "7891000100203" }
        },
        {
          id: "m-4",
          tipo: "SAIDA",
          quantidade: 6,
          motivo: "Venda PDV",
          createdAt: d(1),
          produto: { nome: produtos[2]?.nome || "Sabão em Pó Concentrado 1kg", codigoBarras: "7893000300607" }
        },
        // 2 dias atrás
        {
          id: "m-5",
          tipo: "SAIDA",
          quantidade: 22,
          motivo: "Venda PDV",
          createdAt: d(2),
          produto: { nome: produtos[0]?.nome || "Arroz Integral Camil 1kg", codigoBarras: "7892000200405" }
        },
        // 3 dias atrás
        {
          id: "m-6",
          tipo: "SAIDA",
          quantidade: 14,
          motivo: "Venda PDV",
          createdAt: d(3),
          produto: { nome: produtos[2]?.nome || "Sabão em Pó Concentrado 1kg", codigoBarras: "7893000300607" }
        },
        // 4 dias atrás
        {
          id: "m-7",
          tipo: "SAIDA",
          quantidade: 35,
          motivo: "Venda PDV",
          createdAt: d(4),
          produto: { nome: produtos[1]?.nome || "Detergente Líquido Limão 500ml", codigoBarras: "7891000100203" }
        },
        // 5 dias atrás
        {
          id: "m-8",
          tipo: "SAIDA",
          quantidade: 9,
          motivo: "Venda PDV",
          createdAt: d(5),
          produto: { nome: produtos[0]?.nome || "Arroz Integral Camil 1kg", codigoBarras: "7892000200405" }
        },
        // 6 dias atrás
        {
          id: "m-9",
          tipo: "SAIDA",
          quantidade: 25,
          motivo: "Venda PDV",
          createdAt: d(6),
          produto: { nome: produtos[1]?.nome || "Detergente Líquido Limão 500ml", codigoBarras: "7891000100203" }
        }
      ]);
    } else {
      try {
        const res = await api.get("/estoque/movimentacoes");
        setMovimentacoes(res.data || []);
      } catch (err) {
        console.error("Erro ao carregar movimentações:", err);
      }
    }
  };

  // --- 1. Cálculos de Métricas Financeiras ---
  
  // Faturamento Mensal Bruto
  const faturamentoMensal = movimentacoes
    .filter(m => {
      const dataMov = new Date(m.createdAt);
      const dataAtual = new Date();
      const mesmoMes = dataMov.getMonth() === dataAtual.getMonth() && dataMov.getFullYear() === dataAtual.getFullYear();
      return m.tipo === "SAIDA" && mesmoMes;
    })
    .reduce((acc, m) => {
      const prodCatalogo = produtos.find(p => p.nome === m.produto.nome);
      const precoVenda = prodCatalogo ? Number(prodCatalogo.precoVenda) : 0;
      return acc + (Number(m.quantidade) * precoVenda);
    }, 0);

  // Custos e Lucro do Inventário Atual
  const valorEstoqueCusto = produtos.reduce((acc, p) => acc + (Number(p.estoqueAtual) * Number(p.precoCusto)), 0);
  const lucroFlutuanteEstimado = produtos.reduce((acc, p) => {
    const margem = Number(p.precoVenda) - Number(p.precoCusto);
    return acc + (Number(p.estoqueAtual) * margem);
  }, 0);

  // Alertas Críticos (Abaixo ou igual ao mínimo)
  const alertaEstoque = produtos.filter(p => {
    const min = p.estoqueMinimo ? Number(p.estoqueMinimo) : 0;
    return Number(p.estoqueAtual) <= min;
  }).length;

  // --- 1.5. Agrupamento Dinâmico de Desempenho Comercial (Últimos 7 dias) ---
  const obterUltimos7Dias = () => {
    const datas = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      datas.push(d);
    }
    return datas;
  };

  const dadosDesempenho = obterUltimos7Dias().map(data => {
    const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    
    // Filtra movimentações de saída no dia correspondente
    const faturamentoDia = movimentacoes
      .filter(m => {
        if (m.tipo !== "SAIDA") return false;
        const dataMov = new Date(m.createdAt);
        return (
          dataMov.getDate() === data.getDate() &&
          dataMov.getMonth() === data.getMonth() &&
          dataMov.getFullYear() === data.getFullYear()
        );
      })
      .reduce((acc, m) => {
        const prod = produtos.find(p => p.nome === m.produto.nome);
        const precoVenda = prod ? Number(prod.precoVenda) : 0;
        return acc + (Number(m.quantidade) * precoVenda);
      }, 0);

    return {
      label: diaMes,
      valor: faturamentoDia,
      diaSemana: data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase()
    };
  });

  const maiorFaturamentoDia = Math.max(...dadosDesempenho.map(d => d.valor), 1);

  // --- 2. Curva ABC (Análise de Giro de Estoque) ---

  // Top 5 Mais Vendidos (Baseado nas quantidades de SAIDA)
  const vendasPorProduto: { [key: string]: { nome: string; total: number; precoVenda: number } } = {};
  movimentacoes
    .filter(m => m.tipo === "SAIDA")
    .forEach(m => {
      const prod = produtos.find(p => p.nome === m.produto.nome);
      const precoVenda = prod ? Number(prod.precoVenda) : 0;
      if (!vendasPorProduto[m.produto.nome]) {
        vendasPorProduto[m.produto.nome] = { nome: m.produto.nome, total: 0, precoVenda };
      }
      vendasPorProduto[m.produto.nome].total += Number(m.quantidade);
    });

  const maisVendidos = Object.values(vendasPorProduto)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top 5 Encalhados (Estoque positivo com zero ou menor quantidade de saídas)
  const encalhados = produtos
    .filter(p => Number(p.estoqueAtual) > 0)
    .map(p => ({
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      estoque: Number(p.estoqueAtual),
      precoVenda: Number(p.precoVenda),
      vendas: vendasPorProduto[p.nome]?.total || 0
    }))
    .sort((a, b) => {
      if (a.vendas !== b.vendas) {
        return a.vendas - b.vendas; // Menos vendidos primeiro
      }
      return b.estoque - a.estoque; // Maior estoque primeiro
    })
    .slice(0, 5);

  // Últimos 5 Logs para Auditoria em Tempo Real
  const logsRecentes = movimentacoes.slice(0, 5);

  return (
    <div className="space-y-6 text-zinc-100 animate-fade-in">
      
      {/* 1. CARDS DE MÉTRICAS FINANCEIRAS AVANÇADAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Faturamento Bruto (Mês) */}
        <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-455 font-extrabold uppercase tracking-wider block">Faturamento Bruto (Mês)</span>
            <h3 className="text-3xl font-black text-white font-mono">R$ {faturamentoMensal.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-650/15 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Custo Total em Estoque */}
        <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-455 font-extrabold uppercase tracking-wider block">Custo Total em Estoque</span>
            <h3 className="text-3xl font-black text-white font-mono">R$ {valorEstoqueCusto.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-600/15 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Lucro Estimado Flutuante */}
        <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-455 font-extrabold uppercase tracking-wider block">Lucro Flutuante Est.</span>
            <h3 className="text-3xl font-black text-emerald-400 font-mono">R$ {lucroFlutuanteEstimado.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-600/15 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
            <Package size={22} />
          </div>
        </div>

        {/* Alertas Críticos de Estoque */}
        <div className={`border p-6 rounded-2xl flex items-center justify-between transition relative overflow-hidden shadow-lg ${
          alertaEstoque > 0 
            ? "border-red-500/20 bg-red-500/5 animate-pulse" 
            : "border-zinc-850 bg-zinc-900/40"
        }`}>
          {alertaEstoque > 0 && <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500"></div>}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-455 font-extrabold uppercase tracking-wider block">Reposições Críticas</span>
            <h3 className={`text-3xl font-black font-mono ${alertaEstoque > 0 ? "text-red-400" : "text-white"}`}>
              {alertaEstoque}
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
            alertaEstoque > 0 ? "bg-red-600/20 text-red-400" : "bg-zinc-800 text-zinc-500"
          }`}>
            <AlertTriangle size={22} />
          </div>
        </div>

      </div>

      {/* 1.8. GRÁFICO DE EVOLUÇÃO DE VENDAS (ÚLTIMOS 7 DIAS) */}
      <div className="border border-zinc-850 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-650"></div>
        
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Desempenho Comercial (Últimos 7 dias)
            </h4>
            <p className="text-[10px] text-zinc-550 mt-0.5">Faturamento de vendas PDV consolidado diariamente</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Total do Período</span>
            <span className="font-mono font-black text-indigo-400 text-sm">
              R$ {dadosDesempenho.reduce((s, d) => s + d.valor, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Gráfico de Barras Estilizado Premium */}
        <div className="h-[220px] flex items-end justify-between gap-3 md:gap-6 pt-6 px-2 md:px-6 relative">
          
          {/* Gridlines de Fundo */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-6">
            <div className="border-t border-zinc-800/40 w-full"></div>
            <div className="border-t border-zinc-800/40 w-full"></div>
            <div className="border-t border-zinc-800/40 w-full"></div>
            <div className="border-t border-zinc-800/40 w-full"></div>
          </div>

          {/* Barras Horizontais do Gráfico */}
          {dadosDesempenho.map((d) => {
            const alturaPct = (d.valor / maiorFaturamentoDia) * 100;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center group relative z-10">
                
                {/* Tooltip Hover Premium */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div className="bg-zinc-950 border border-zinc-800 text-white text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg shadow-2xl flex flex-col items-center">
                    <span className="text-zinc-500 font-sans font-semibold mb-0.5">{d.diaSemana} - {d.label}</span>
                    <span className="text-indigo-400">R$ {d.valor.toFixed(2)}</span>
                  </div>
                  {/* Pequena flecha do tooltip */}
                  <div className="w-1.5 h-1.5 bg-zinc-950 border-r border-b border-zinc-800 rotate-45 mx-auto -mt-1"></div>
                </div>

                {/* Exibição do Valor no topo da barra */}
                <span className="text-[9px] font-mono text-zinc-400 font-bold mb-1 opacity-80 group-hover:text-white group-hover:scale-105 transition-all">
                  R$ {d.valor.toFixed(0)}
                </span>

                {/* Barra Física com Gradiente e Hover */}
                <div className="w-full max-w-[48px] bg-zinc-850/65 rounded-t-lg overflow-hidden h-[130px] flex items-end">
                  <div 
                    style={{ height: `${Math.max(4, alturaPct)}%` }}
                    className="w-full bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400 group-hover:from-indigo-650 group-hover:via-indigo-400 group-hover:to-indigo-350 transition-all duration-300 rounded-t-md cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30"
                  />
                </div>

                {/* Legendas Inferiores */}
                <div className="mt-2 text-center space-y-0.5">
                  <span className="text-[9px] font-mono text-zinc-550 font-bold block">{d.diaSemana}</span>
                  <span className="text-[10px] text-zinc-450 font-extrabold block">{d.label}</span>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* 2. GRID PRINCIPAL: CURVA ABC (GIRO) & AUDITORIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lado Esquerdo (2 colunas): Curva ABC (Análise de Giro) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top 5 Mais Vendidos */}
            <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl shadow-xl space-y-4">
              <h4 className="font-extrabold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Flame size={16} className="text-orange-500 animate-bounce" /> TOP 5 - MAIS VENDIDOS
              </h4>
              
              <div className="divide-y divide-zinc-850/60">
                {maisVendidos.length === 0 ? (
                  <p className="text-zinc-550 text-xs font-semibold uppercase tracking-wider py-8 text-center">Aguardando vendas no caixa...</p>
                ) : (
                  maisVendidos.map((item, idx) => (
                    <div key={item.nome} className="flex justify-between items-center py-3.5">
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-bold text-sm text-white truncate">
                          <span className="text-orange-500/80 mr-2 font-mono text-xs">#{idx + 1}</span>
                          {item.nome}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">Valor Unitário: R$ {item.precoVenda.toFixed(2)}</p>
                      </div>
                      <div className="text-right shrink-0 bg-orange-500/10 border border-orange-500/10 px-2.5 py-1 rounded-lg">
                        <span className="font-mono font-bold text-orange-400 text-xs">{item.total} un</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top 5 Encalhados */}
            <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl shadow-xl space-y-4">
              <h4 className="font-extrabold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Snowflake size={16} className="text-blue-400" /> TOP 5 - ENCALHADOS (SEM GIRO)
              </h4>
              
              <div className="divide-y divide-zinc-850/60">
                {encalhados.length === 0 ? (
                  <p className="text-zinc-550 text-xs font-semibold uppercase tracking-wider py-8 text-center">Estoque livre de itens parados.</p>
                ) : (
                  encalhados.map((item, idx) => (
                    <div key={item.nome} className="flex justify-between items-center py-3.5">
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-bold text-sm text-white truncate">
                          <span className="text-blue-400/80 mr-2 font-mono text-xs">#{idx + 1}</span>
                          {item.nome}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">Valor Unitário: R$ {item.precoVenda.toFixed(2)}</p>
                      </div>
                      <div className="text-right shrink-0 bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-lg">
                        <span className="font-mono font-bold text-blue-400 text-xs">{item.estoque} un em estoque</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Lado Direito (1 coluna): Feed de Auditoria em Tempo Real */}
        <div className="border border-zinc-850 bg-zinc-900/40 p-6 rounded-2xl shadow-xl space-y-4">
          <h4 className="font-extrabold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
            <Activity size={16} className="text-indigo-400 animate-pulse" /> AUDITORIA EM TEMPO REAL
          </h4>
          
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {logsRecentes.length === 0 ? (
              <p className="text-zinc-550 text-xs font-semibold uppercase tracking-wider py-12 text-center">Nenhum log registrado.</p>
            ) : (
              logsRecentes.map(log => (
                <div key={log.id} className="relative pl-6 pb-1 border-l border-zinc-800 last:border-0 last:pb-0">
                  {/* Marcador na Linha do Tempo */}
                  <div className={`absolute -left-[6px] top-1.5 w-3 h-3 rounded-full border border-zinc-900 shadow-sm ${
                    log.tipo === "ENTRADA" ? "bg-emerald-500" : "bg-red-500"
                  }`}></div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase">
                      <span>{log.motivo}</span>
                      <span className="font-mono">{new Date(log.createdAt).toLocaleTimeString("pt-BR")}</span>
                    </div>
                    <p className="font-bold text-white text-xs leading-relaxed">{log.produto.nome}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-455 font-semibold">
                        Autor: {log.usuario?.nome || "Operador Caixa"}
                      </span>
                      <span className={`font-extrabold ${log.tipo === "ENTRADA" ? "text-emerald-400" : "text-red-400"}`}>
                        {log.tipo === "ENTRADA" ? "+" : "-"}{log.quantidade} un
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
