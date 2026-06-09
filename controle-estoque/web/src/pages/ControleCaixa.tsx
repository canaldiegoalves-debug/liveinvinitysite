import { useState, useEffect } from "react";
import { 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  PlusCircle, 
  MinusCircle, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Unlock
} from "lucide-react";
import api, { getMockDB, saveMockDB } from "../services/api";

type Movimentacao = {
  id: string;
  tipo: "SUPRIMENTO" | "SANGRIA" | "VENDA";
  valor: number;
  motivo?: string;
  createdAt: string;
};

type Turno = {
  id: string;
  valorAbertura: number;
  createdAt: string;
  movimentacoes: Movimentacao[];
};

type Metricas = {
  valorAbertura: number;
  totalVendasDinheiro: number;
  totalSuprimentos: number;
  totalSangrias: number;
  saldoEsperado: number;
};

interface ControleCaixaProps {
  isDemoMode: boolean;
}

export function ControleCaixa({ isDemoMode }: ControleCaixaProps) {
  const [caixaStatus, setCaixaStatus] = useState<"CARREGANDO" | "ABERTO" | "FECHADO">("CARREGANDO");
  const [turnoAtivo, setTurnoAtivo] = useState<Turno | null>(null);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos Modais e Lançamentos
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [tipoMovimentacaoModal, setTipoMovimentacaoModal] = useState<"SUPRIMENTO" | "SANGRIA">("SUPRIMENTO");
  const [valorMovimentacao, setValorMovimentacao] = useState("");
  const [motivoMovimentacao, setMotivoMovimentacao] = useState("");

  // Estados dos Formulários Fixo (Abertura / Fechamento)
  const [valorAbertura, setValorAbertura] = useState("");
  const [valorFechamentoInformado, setValorFechamentoInformado] = useState("");

  // Estado do Relatório de Fechamento Concluído
  const [resumoFechamento, setResumoFechamento] = useState<{
    esperado: number;
    informado: number;
    diferenca: number;
  } | null>(null);

  useEffect(() => {
    carregarDadosCaixa();
  }, [isDemoMode]);

  const carregarDadosCaixa = async () => {
    setCaixaStatus("CARREGANDO");
    try {
      if (isDemoMode) {
        const localDB = getMockDB();
        const turno = localDB.turnos?.find((t: any) => t.status === "ABERTO");
        
        if (!turno) {
          setCaixaStatus("FECHADO");
          setTurnoAtivo(null);
          setMetricas(null);
          return;
        }

        // Recuperar movimentações
        const movimentacoes = localDB.caixaMovimentacoes?.filter((m: any) => m.turnoId === turno.id) || [];
        
        // Recuperar vendas em dinheiro deste turno
        const vendasTurno = localDB.vendas?.filter((v: any) => v.turnoId === turno.id) || [];
        const totalVendasDinheiro = vendasTurno
          .filter((v: any) => v.condicaoPagamento === "A_VISTA")
          .reduce((sum: number, v: any) => sum + Number(v.valorTotal), 0);

        const totalSuprimentos = movimentacoes
          .filter((m: any) => m.tipo === "SUPRIMENTO")
          .reduce((sum: number, m: any) => sum + Number(m.valor), 0);

        const totalSangrias = movimentacoes
          .filter((m: any) => m.tipo === "SANGRIA")
          .reduce((sum: number, m: any) => sum + Number(m.valor), 0);

        const valAbertura = Number(turno.valorAbertura);
        const saldoEsperado = valAbertura + totalVendasDinheiro + totalSuprimentos - totalSangrias;

        // Combinar vendas à vista e movimentações em um histórico cronológico
        const historicoVendas: Movimentacao[] = vendasTurno
          .filter((v: any) => v.condicaoPagamento === "A_VISTA")
          .map((v: any) => ({
            id: v.id,
            tipo: "VENDA" as const,
            valor: Number(v.valorTotal),
            motivo: `Venda realizada no PDV (Ref: ${v.id.substring(0, 8)})`,
            createdAt: v.createdAt
          }));

        const historicoCompleto: Movimentacao[] = [
          ...movimentacoes.map((m: any) => ({
            id: m.id,
            tipo: m.tipo as "SUPRIMENTO" | "SANGRIA",
            valor: Number(m.valor),
            motivo: m.motivo,
            createdAt: m.createdAt
          })),
          ...historicoVendas
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setTurnoAtivo({
          id: turno.id,
          valorAbertura: valAbertura,
          createdAt: turno.createdAt,
          movimentacoes: historicoCompleto
        });

        setMetricas({
          valorAbertura: valAbertura,
          totalVendasDinheiro,
          totalSuprimentos,
          totalSangrias,
          saldoEsperado
        });
        setCaixaStatus("ABERTO");
      } else {
        const res = await api.get("/caixa/turno-atual");
        if (res.data.status === "ABERTO") {
          setCaixaStatus("ABERTO");
          setTurnoAtivo(res.data.turno);
          setMetricas(res.data.metricas);
        } else {
          setCaixaStatus("FECHADO");
          setTurnoAtivo(null);
          setMetricas(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados do caixa:", err);
      setCaixaStatus("FECHADO");
    }
  };

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorAbertura || isNaN(parseFloat(valorAbertura)) || parseFloat(valorAbertura) < 0) {
      alert("Informe um valor de abertura válido.");
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode) {
        const localDB = getMockDB();
        const novoTurno = {
          id: "turno-" + Date.now(),
          empresaId: "demo-tenant-id",
          usuarioId: "demo-user-id",
          status: "ABERTO",
          valorAbertura: Number(parseFloat(valorAbertura).toFixed(2)),
          createdAt: new Date().toISOString()
        };

        localDB.turnos = [novoTurno, ...(localDB.turnos || [])];
        saveMockDB(localDB);
        
        setResumoFechamento(null);
        setValorAbertura("");
        await carregarDadosCaixa();
      } else {
        await api.post("/caixa/abrir", { valorAbertura: parseFloat(valorAbertura) });
        setResumoFechamento(null);
        setValorAbertura("");
        await carregarDadosCaixa();
      }
    } catch (err: any) {
      alert("Erro ao abrir caixa: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLancarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorMovimentacao || isNaN(parseFloat(valorMovimentacao)) || parseFloat(valorMovimentacao) <= 0) {
      alert("Informe um valor válido para lançamento.");
      return;
    }

    if (!motivoMovimentacao.trim()) {
      alert("Escreva uma breve justificativa para esta movimentação.");
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode) {
        const localDB = getMockDB();
        const novaMov = {
          id: "mov-" + Date.now(),
          turnoId: turnoAtivo!.id,
          tipo: tipoMovimentacaoModal,
          valor: Number(parseFloat(valorMovimentacao).toFixed(2)),
          motivo: motivoMovimentacao,
          createdAt: new Date().toISOString()
        };

        localDB.caixaMovimentacoes = [novaMov, ...(localDB.caixaMovimentacoes || [])];
        saveMockDB(localDB);

        setValorMovimentacao("");
        setMotivoMovimentacao("");
        setIsMovimentacaoModalOpen(false);
        await carregarDadosCaixa();
      } else {
        await api.post("/caixa/movimentacao", {
          tipo: tipoMovimentacaoModal,
          valor: parseFloat(valorMovimentacao),
          motivo: motivoMovimentacao
        });
        setValorMovimentacao("");
        setMotivoMovimentacao("");
        setIsMovimentacaoModalOpen(false);
        await carregarDadosCaixa();
      }
    } catch (err: any) {
      alert("Erro ao registrar movimentação: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorFechamentoInformado || isNaN(parseFloat(valorFechamentoInformado)) || parseFloat(valorFechamentoInformado) < 0) {
      alert("Informe o valor total contado em dinheiro fisicamente.");
      return;
    }

    if (!window.confirm("Deseja realmente fechar o turno do caixa agora?")) {
      return;
    }

    setIsLoading(true);
    try {
      const valorFechadoNum = parseFloat(valorFechamentoInformado);
      
      if (isDemoMode) {
        const localDB = getMockDB();
        
        // Atualiza status do turno ativo para FECHADO
        localDB.turnos = localDB.turnos.map((t: any) => {
          if (t.id === turnoAtivo!.id) {
            return {
              ...t,
              status: "FECHADO",
              valorFechamentoDinheiro: metricas!.saldoEsperado,
              valorFechamentoInformado: valorFechadoNum,
              closedAt: new Date().toISOString()
            };
          }
          return t;
        });

        saveMockDB(localDB);

        setResumoFechamento({
          esperado: metricas!.saldoEsperado,
          informado: valorFechadoNum,
          diferenca: valorFechadoNum - metricas!.saldoEsperado
        });
        
        setValorFechamentoInformado("");
        setTurnoAtivo(null);
        setMetricas(null);
        setCaixaStatus("FECHADO");
      } else {
        const res = await api.post("/caixa/fechar", {
          valorFechamentoInformado: valorFechadoNum
        });

        setResumoFechamento({
          esperado: res.data.esperado,
          informado: res.data.informado,
          diferenca: res.data.diferenca
        });

        setValorFechamentoInformado("");
        await carregarDadosCaixa();
      }
    } catch (err: any) {
      alert("Erro ao fechar caixa: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  if (caixaStatus === "CARREGANDO") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-555">
        <div className="w-12 h-12 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-xs uppercase tracking-wider text-zinc-400">Aguarde, carregando o fluxo do caixa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. SE CAIXA ESTIVER FECHADO */}
      {caixaStatus === "FECHADO" && (
        <div className="max-w-xl mx-auto mt-8">
          
          {/* Alerta de Fechamento Concluído */}
          {resumoFechamento && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4 animate-scale-up text-zinc-100">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={22} />
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-white">Turno Encerrado com Sucesso!</h3>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                O caixa foi fechado. Confira abaixo o relatório de conciliação de caixa e diferenças.
              </p>
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 grid grid-cols-3 gap-4 text-xs font-mono text-center">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Saldo Esperado</span>
                  <span className="text-white font-bold">R$ {resumoFechamento.esperado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Valor Informado</span>
                  <span className="text-indigo-400 font-bold">R$ {resumoFechamento.informado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Diferença</span>
                  <span className={`font-bold ${resumoFechamento.diferenca === 0 ? "text-emerald-400" : resumoFechamento.diferenca > 0 ? "text-indigo-400" : "text-red-400"}`}>
                    {resumoFechamento.diferenca >= 0 ? "+" : ""}R$ {resumoFechamento.diferenca.toFixed(2)}
                  </span>
                </div>
              </div>

              {resumoFechamento.diferenca !== 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] p-3 rounded-xl flex gap-2 font-bold leading-normal">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Atenção: Houve {resumoFechamento.diferenca > 0 ? "sobra" : "quebra"} de caixa de R$ {Math.abs(resumoFechamento.diferenca).toFixed(2)}. O lançamento foi registrado para fins de auditoria de caixa.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Card de Abertura */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-750 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Abertura de Caixa</h3>
                  <p className="text-indigo-200 text-xs">Inicie um novo turno para registrar operações.</p>
                </div>
              </div>
              <Unlock size={20} className="text-indigo-200 animate-pulse" />
            </div>

            <form onSubmit={handleAbrirCaixa} className="p-6 space-y-4 bg-zinc-900">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                  Valor de Troco Inicial (Dinheiro)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={valorAbertura}
                    onChange={(e) => setValorAbertura(e.target.value)}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-lg font-bold"
                    disabled={isLoading}
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-550 leading-relaxed block">
                  Este valor será computado como troco de abertura e somado no saldo total estimado do dia.
                </span>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm transition duration-150 uppercase tracking-wider shadow-lg shadow-indigo-600/20"
              >
                {isLoading ? "Abrindo Turno..." : "Abrir Caixa / Iniciar Turno"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. SE CAIXA ESTIVER ABERTO */}
      {caixaStatus === "ABERTO" && turnoAtivo && metricas && (
        <div className="space-y-6">
          
          {/* Turno Info Banner com Ações Rápidas em Modal */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                  TURNO EM ANDAMENTO
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Iniciado em: <span className="font-mono text-white font-semibold">{new Date(turnoAtivo.createdAt).toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Ações Rápidas (Sangria e Suprimento em Modais) */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setTipoMovimentacaoModal("SUPRIMENTO");
                  setIsMovimentacaoModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition shadow shadow-indigo-600/20"
              >
                <PlusCircle size={15} /> Suprimento (Fundo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoMovimentacaoModal("SANGRIA");
                  setIsMovimentacaoModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl transition shadow shadow-amber-605/20"
              >
                <MinusCircle size={15} /> Sangria (Retirada)
              </button>
            </div>
          </div>

          {/* Grade de Métricas (5 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-zinc-100">
            
            {/* Card 1: Valor Abertura */}
            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">Troco Inicial</span>
              <h2 className="text-2xl font-black text-white font-mono mt-2">
                R$ {metricas.valorAbertura.toFixed(2)}
              </h2>
              <span className="text-[10px] text-zinc-555 flex items-center gap-1 mt-1 font-semibold">
                <Calendar size={12} /> Saldo de Abertura
              </span>
            </div>

            {/* Card 2: Entradas de Venda */}
            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">Vendas em Dinheiro</span>
              <h2 className="text-2xl font-black text-emerald-400 font-mono mt-2">
                R$ {metricas.totalVendasDinheiro.toFixed(2)}
              </h2>
              <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-1 font-bold">
                <TrendingUp size={12} /> + Entradas PDV
              </span>
            </div>

            {/* Card 3: Suprimentos */}
            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">Suprimentos (Reforço)</span>
              <h2 className="text-2xl font-black text-indigo-400 font-mono mt-2">
                R$ {metricas.totalSuprimentos.toFixed(2)}
              </h2>
              <span className="text-[10px] text-indigo-500 flex items-center gap-0.5 mt-1 font-bold">
                <PlusCircle size={12} /> + Entradas Avulsas
              </span>
            </div>

            {/* Card 4: Sangrias */}
            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">Sangrias (Retiradas)</span>
              <h2 className="text-2xl font-black text-amber-500 font-mono mt-2">
                R$ {metricas.totalSangrias.toFixed(2)}
              </h2>
              <span className="text-[10px] text-amber-500 flex items-center gap-0.5 mt-1 font-bold">
                <MinusCircle size={12} /> - Saídas de Caixa
              </span>
            </div>

            {/* Card 5: Saldo Estimado */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow bg-gradient-to-b from-zinc-900 to-indigo-950/20 border-indigo-900/30">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Saldo Esperado</span>
              <h2 className="text-2xl font-black text-white font-mono mt-2">
                R$ {metricas.saldoEsperado.toFixed(2)}
              </h2>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1 mt-1 font-bold">
                <DollarSign size={12} /> Caixa Físico
              </span>
            </div>
          </div>

          {/* Grid de Fechamento e Histórico de Lançamentos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-zinc-100">
            
            {/* Lado Esquerdo (Col-span 4): Fechamento de Caixa */}
            <div className="lg:col-span-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h4 className="font-extrabold text-white uppercase text-xs tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-850 text-red-400">
                  <MinusCircle size={16} /> Fechamento e Conferência
                </h4>

                <form onSubmit={handleFecharCaixa} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                      Dinheiro Contado no Caixa (Físico)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-xs">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Realize a contagem física do caixa..."
                        value={valorFechamentoInformado}
                        onChange={(e) => setValorFechamentoInformado(e.target.value)}
                        className="w-full bg-zinc-955 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-red-500 font-mono text-sm font-bold shadow-inner"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <span className="text-[10px] text-zinc-550 leading-relaxed block">
                      O sistema fará o cálculo comparando este valor com o saldo estimado de R$ {metricas.saldoEsperado.toFixed(2)}. Diferenças serão auditadas.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-900/10"
                  >
                    {isLoading ? "Fechando Turno..." : "Encerrar Caixa (Fechar Turno)"}
                  </button>
                </form>
              </div>
            </div>

            {/* Lado Direito (Col-span 8): Histórico de Lançamentos */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[480px]">
              
              <h4 className="font-extrabold text-white uppercase text-xs tracking-wider flex items-center gap-1.5 pb-3 border-b border-zinc-850 shrink-0">
                <History size={16} className="text-indigo-400 animate-pulse" /> Histórico de Lançamentos do Turno
              </h4>

              <div className="overflow-y-auto flex-1 pr-1 mt-4">
                {turnoAtivo.movimentacoes.length === 0 ? (
                  <div className="text-center py-28 text-zinc-555 flex flex-col items-center gap-3">
                    <History size={36} className="text-zinc-650" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nenhum lançamento no turno atual.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-855 text-zinc-450 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2 font-semibold">Hora</th>
                        <th className="py-2 font-semibold">Operação</th>
                        <th className="py-2 font-semibold">Justificativa</th>
                        <th className="py-2 font-semibold text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/50 text-xs">
                      {turnoAtivo.movimentacoes.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-850/10 transition-colors">
                          <td className="py-3 font-mono text-[10px] text-zinc-555">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3 font-bold">
                            {m.tipo === "SUPRIMENTO" && (
                              <span className="text-indigo-400 flex items-center gap-1">
                                <ArrowUpRight size={14} /> SUPRIMENTO
                              </span>
                            )}
                            {m.tipo === "SANGRIA" && (
                              <span className="text-amber-500 flex items-center gap-1">
                                <ArrowDownRight size={14} /> SANGRIA
                              </span>
                            )}
                            {m.tipo === "VENDA" && (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <TrendingUp size={14} /> VENDA PDV
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-zinc-455 max-w-[280px] truncate" title={m.motivo}>
                            {m.motivo || "Sem observação"}
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${
                            m.tipo === "SANGRIA" ? "text-amber-500" : "text-white"
                          }`}>
                            {m.tipo === "SANGRIA" ? "-" : "+"}R$ {m.valor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL FLUTUANTE DE SANGRIA E SUPRIMENTO (DESIGN PREMIUM) */}
      {isMovimentacaoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up text-zinc-100">
            
            {/* Header do Modal */}
            <div className={`p-5 border-b border-zinc-800 flex justify-between items-center text-white ${
              tipoMovimentacaoModal === "SUPRIMENTO" 
                ? "bg-gradient-to-r from-indigo-600 to-indigo-750" 
                : "bg-gradient-to-r from-amber-600 to-amber-750"
            }`}>
              <h3 className="font-extrabold flex items-center gap-2 tracking-wide uppercase text-sm">
                {tipoMovimentacaoModal === "SUPRIMENTO" ? (
                  <>
                    <PlusCircle size={18} /> REGISTRAR SUPRIMENTO (ENTRADA)
                  </>
                ) : (
                  <>
                    <MinusCircle size={18} /> REGISTRAR SANGRIA (RETIRADA)
                  </>
                )}
              </h3>
              <button 
                onClick={() => {
                  setIsMovimentacaoModalOpen(false);
                  setValorMovimentacao("");
                  setMotivoMovimentacao("");
                }}
                className="text-white/80 hover:text-white font-extrabold text-sm bg-black/15 hover:bg-black/25 px-2.5 py-1 rounded-lg transition"
              >
                Fechar
              </button>
            </div>

            {/* Form do Modal */}
            <form onSubmit={handleLancarMovimentacao} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                  Valor do Lançamento
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-555 text-xs">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={valorMovimentacao}
                    onChange={(e) => setValorMovimentacao(e.target.value)}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-xl pl-9 pr-3 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-lg font-bold shadow-inner"
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                  Motivo / Justificativa
                </label>
                <textarea 
                  placeholder={
                    tipoMovimentacaoModal === "SUPRIMENTO"
                      ? "Ex: Aporte de troco inicial em moedas, reforço de caixa..."
                      : "Ex: Retirada de sangria de segurança para o cofre principal..."
                  }
                  value={motivoMovimentacao}
                  onChange={(e) => setMotivoMovimentacao(e.target.value)}
                  className="w-full bg-zinc-955 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 h-20 resize-none shadow-inner"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMovimentacaoModalOpen(false);
                    setValorMovimentacao("");
                    setMotivoMovimentacao("");
                  }}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-355 font-bold text-xs rounded-xl hover:bg-zinc-850 transition uppercase"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-5 py-2 text-white font-bold text-xs rounded-xl transition shadow uppercase tracking-wider ${
                    tipoMovimentacaoModal === "SUPRIMENTO"
                      ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10"
                      : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10"
                  }`}
                >
                  {isLoading ? "Processando..." : `Confirmar ${tipoMovimentacaoModal === "SUPRIMENTO" ? "Suprimento" : "Sangria"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
