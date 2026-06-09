import { useState, useRef, useEffect } from "react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { ScanBarcode, Trash2, RotateCcw, CheckCircle, Search, X, Tag, AlertTriangle, Package } from "lucide-react";
import api from "../services/api";

type Produto = {
  id: string;
  codigoBarras: string | null;
  nome: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
};

type Cliente = {
  id: string;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  saldoDevedor: number;
};

type ItemDevolucao = {
  produto: Produto;
  quantidade: number;
};

type Devolucao = {
  id: string;
  valorTotal: number;
  motivo: string;
  createdAt: string;
  cliente?: { nome: string; cpfCnpj: string | null } | null;
  itens: Array<{
    quantidade: number;
    precoVenda: number;
    produto: { nome: string; codigoBarras: string | null };
  }>;
  valeCredito?: { codigoUnico: string; valorAtual: number; status: string } | null;
};

type MOTIVO = "DEFEITO" | "TAMANHO_ERRADO" | "TROCA" | "OUTRO";

const MOTIVOS: { value: MOTIVO; label: string; icon: string; color: string }[] = [
  { value: "DEFEITO",        label: "Produto com Defeito",    icon: "⚠️",  color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { value: "TAMANHO_ERRADO", label: "Tamanho / Modelo Errado",icon: "📐", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "TROCA",          label: "Troca por Outro Item",   icon: "🔄",  color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { value: "OUTRO",          label: "Outro Motivo",           icon: "💬",  color: "text-zinc-400 border-zinc-600 bg-zinc-800/60" },
];

interface DevolucoesProps {
  isDemoMode: boolean;
}

export function Devolucoes({ isDemoMode }: DevolucoesProps) {
  const [itens, setItens] = useState<ItemDevolucao[]>([]);
  const [motivo, setMotivo] = useState<MOTIVO>("DEFEITO");
  const [observacao, setObservacao] = useState("");
  const [gerarVale, setGerarVale] = useState(true);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resultado do registro
  const [resultadoVale, setResultadoVale] = useState<{
    codigoUnico: string; valorInicial: number; clienteNome?: string
  } | null>(null);

  // Modal de busca de produto
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal de busca de cliente
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const clienteInputRef = useRef<HTMLInputElement>(null);

  // Campo de EAN manual
  const [manualEan, setManualEan] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Histórico de devoluções
  const [historico, setHistorico] = useState<Devolucao[]>([]);

  useEffect(() => {
    barcodeRef.current?.focus();
    carregarHistorico();
  }, [isDemoMode]);

  const carregarHistorico = async () => {
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setHistorico((db.devolucoes || []).slice(0, 10));
      } else {
        const res = await api.get("/estoque/devolucoes");
        setHistorico(res.data.slice(0, 10));
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    }
  };

  const carregarProdutos = async () => {
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setTodosProdutos(db.produtos || []);
      } else {
        const res = await api.get("/produtos");
        setTodosProdutos(res.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    }
  };

  const carregarClientes = async () => {
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setClientesList(db.clientes || []);
      } else {
        const res = await api.get("/clientes");
        setClientesList(res.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  // Captura global de código de barras
  useBarcodeScanner((barcode) => {
    if (isSearchOpen || isClienteModalOpen) return;
    handleBipar(barcode);
  });

  const handleBipar = async (barcode: string) => {
    if (!barcode.trim()) return;
    try {
      let produto: Produto | null = null;
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        produto = db.produtos?.find((p: any) => p.codigoBarras === barcode) || null;
      } else {
        const res = await api.get(`/produtos/barcode/${barcode}`);
        produto = res.data;
      }
      if (!produto) {
        alert(`Produto com EAN ${barcode} não encontrado.`);
        return;
      }
      adicionarItem(produto);
    } catch (err: any) {
      alert("Produto não localizado: " + barcode);
    }
    barcodeRef.current?.focus();
  };

  const adicionarItem = (produto: Produto) => {
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.produto.id === produto.id);
      if (idx !== -1) {
        return prev.map((i, n) => n === idx ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removerItem = (produtoId: string) => {
    setItens((prev) => prev.filter((i) => i.produto.id !== produtoId));
  };

  const totalDevolucao = itens.reduce((s, i) => s + i.produto.precoVenda * i.quantidade, 0);

  const registrarDevolucao = async () => {
    if (itens.length === 0) {
      alert("Adicione ao menos um produto para devolver.");
      return;
    }
    if (!motivo) {
      alert("Selecione o motivo da devolução.");
      return;
    }
    setIsLoading(true);

    try {
      if (isDemoMode) {
        // MODO DEMO: simular operação localmente
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");

        // Devolver ao estoque
        db.produtos = (db.produtos || []).map((p: any) => {
          const item = itens.find((i) => i.produto.id === p.id);
          if (item) return { ...p, estoqueAtual: p.estoqueAtual + item.quantidade };
          return p;
        });

        // Movimentações de auditoria
        const novasMovs = itens.map((i) => ({
          id: "m-" + Date.now() + Math.random(),
          tipo: "ENTRADA",
          quantidade: i.quantidade,
          motivo: `Devolução — ${motivo}`,
          createdAt: new Date().toISOString(),
          produto: { nome: i.produto.nome, codigoBarras: i.produto.codigoBarras },
        }));
        db.movimentacoes = [...novasMovs, ...(db.movimentacoes || [])];

        const devolucaoId = "dev-" + Date.now();
        let vale = null;

        // Gerar vale-crédito
        if (clienteSelecionado && gerarVale) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let codigoUnico = "VALE-";
          for (let i = 0; i < 8; i++) codigoUnico += chars[Math.floor(Math.random() * chars.length)];

          vale = {
            id: "vale-" + Date.now(),
            empresaId: "demo-tenant-id",
            clienteId: clienteSelecionado.id,
            clienteNome: clienteSelecionado.nome,
            devolucaoId,
            codigoUnico,
            valorInicial: Number(totalDevolucao.toFixed(2)),
            valorAtual: Number(totalDevolucao.toFixed(2)),
            status: "ATIVO",
            createdAt: new Date().toISOString(),
          };
          db.valesCredito = [vale, ...(db.valesCredito || [])];
        }

        // Registro da devolução
        const novaDev = {
          id: devolucaoId,
          empresaId: "demo-tenant-id",
          clienteId: clienteSelecionado?.id || null,
          valorTotal: Number(totalDevolucao.toFixed(2)),
          motivo,
          observacao: observacao || null,
          createdAt: new Date().toISOString(),
          cliente: clienteSelecionado ? { nome: clienteSelecionado.nome, cpfCnpj: clienteSelecionado.cpfCnpj } : null,
          itens: itens.map((i) => ({
            quantidade: i.quantidade,
            precoVenda: i.produto.precoVenda,
            produto: { nome: i.produto.nome, codigoBarras: i.produto.codigoBarras },
          })),
          valeCredito: vale ? { codigoUnico: vale.codigoUnico, valorAtual: vale.valorAtual, status: vale.status } : null,
        };
        db.devolucoes = [novaDev, ...(db.devolucoes || [])];
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(db));

        if (vale) {
          setResultadoVale({ codigoUnico: vale.codigoUnico, valorInicial: vale.valorInicial, clienteNome: clienteSelecionado?.nome });
        } else {
          setResultadoVale(null);
          alert(`✅ Devolução registrada! Estoque atualizado.\nTotal devolvido: R$ ${totalDevolucao.toFixed(2)}`);
        }
      } else {
        // API REAL
        const res = await api.post("/estoque/devolucao", {
          itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
          motivo,
          observacao: observacao || undefined,
          clienteId: clienteSelecionado?.id || undefined,
          gerarVale,
        });

        if (res.data.valeCredito) {
          setResultadoVale({
            codigoUnico: res.data.valeCredito.codigoUnico,
            valorInicial: res.data.valeCredito.valorInicial,
            clienteNome: clienteSelecionado?.nome,
          });
        } else {
          alert(`✅ Devolução registrada! Estoque atualizado.\nTotal: R$ ${totalDevolucao.toFixed(2)}`);
        }
      }

      // Resetar estado
      setItens([]);
      setObservacao("");
      setClienteSelecionado(null);
      setGerarVale(true);
      await carregarHistorico();
    } catch (err: any) {
      alert("Erro ao registrar devolução: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      barcodeRef.current?.focus();
    }
  };

  const produtosFiltrados = todosProdutos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(searchQuery))
  );

  const clientesFiltrados = clientesList.filter(
    (c) =>
      c.nome.toLowerCase().includes(clienteQuery.toLowerCase()) ||
      (c.cpfCnpj && c.cpfCnpj.includes(clienteQuery))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-zinc-100">

      {/* ===== COLUNA ESQUERDA: ITENS DA DEVOLUÇÃO ===== */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[680px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-rose-500 to-orange-500" />

        {/* Header */}
        <div className="border-b border-zinc-800 pb-3 flex items-center justify-between shrink-0">
          <h4 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-wide">
            <RotateCcw size={16} className="text-violet-400" /> MÓDULO DE DEVOLUÇÕES E TROCAS
          </h4>
          <span className="text-xs text-violet-400 font-mono font-bold uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded">
            Retorno de Mercadoria
          </span>
        </div>

        {/* Campo de EAN */}
        <div className="py-3 border-b border-zinc-800 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleBipar(manualEan); setManualEan(""); }}>
            <div className="relative">
              <ScanBarcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 animate-pulse" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Bipe ou digite o EAN do produto a devolver..."
                value={manualEan}
                onChange={(e) => setManualEan(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 font-mono text-sm tracking-wider placeholder-zinc-700"
              />
              <button
                type="button"
                onClick={() => { carregarProdutos(); setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 150); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                title="Pesquisar Produto (F1)"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de Itens */}
        <div className="overflow-y-auto flex-1 pr-1 mt-2">
          {itens.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center gap-3 text-zinc-600">
              <Package size={40} className="animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">AGUARDANDO BIPAGEM DOS PRODUTOS A DEVOLVER</span>
              <p className="text-xs text-zinc-700">Bipe o código de barras ou use a busca manual</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-2.5">Produto</th>
                  <th className="py-2.5 text-center">Qtd</th>
                  <th className="py-2.5 text-right">Vl. Unit.</th>
                  <th className="py-2.5 text-right">Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm">
                {itens.map((item) => (
                  <tr key={item.produto.id} className="hover:bg-zinc-800/20 group transition-colors">
                    <td className="py-3">
                      <p className="font-bold text-white truncate max-w-[240px]">{item.produto.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{item.produto.codigoBarras}</p>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setItens((prev) => prev.map((i) => i.produto.id === item.produto.id ? { ...i, quantidade: Math.max(1, i.quantidade - 1) } : i))}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                        >−</button>
                        <span className="w-8 text-center font-bold text-white">{item.quantidade}</span>
                        <button
                          onClick={() => setItens((prev) => prev.map((i) => i.produto.id === item.produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                        >+</button>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-400 text-xs">
                      R$ {Number(item.produto.precoVenda).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-violet-400">
                      R$ {(item.produto.precoVenda * item.quantidade).toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => removerItem(item.produto.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total */}
        {itens.length > 0 && (
          <div className="shrink-0 border-t border-zinc-800 pt-3 flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-bold uppercase">Total a Creditar</span>
            <span className="text-2xl font-black text-violet-400 font-mono">R$ {totalDevolucao.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* ===== COLUNA DIREITA: CONFIGURAÇÃO DA DEVOLUÇÃO ===== */}
      <div className="lg:col-span-5 flex flex-col gap-4">

        {/* Motivo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
            Motivo da Devolução *
          </span>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMotivo(m.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold text-xs transition ${
                  motivo === m.value
                    ? m.color + " border-opacity-100"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className="text-base">{m.icon}</span>
                <span className="leading-tight">{m.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
              Observação (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o problema ou detalhes da devolução..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500 resize-none placeholder-zinc-700"
            />
          </div>
        </div>

        {/* Cliente e Vale-Crédito */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
            Cliente e Vale-Crédito
          </span>

          {/* Seleção de cliente */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex items-center justify-between gap-2">
            {clienteSelecionado ? (
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Cliente Selecionado</span>
                <h4 className="font-bold text-white text-xs truncate mt-0.5">{clienteSelecionado.nome}</h4>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">CPF/CNPJ: {clienteSelecionado.cpfCnpj || "N/A"}</p>
              </div>
            ) : (
              <div className="flex-1 text-center py-1">
                <p className="text-zinc-500 text-[11px] font-bold">Nenhum cliente selecionado</p>
                <p className="text-[9px] text-zinc-600">Obrigatório para gerar vale-crédito</p>
              </div>
            )}
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => { carregarClientes(); setIsClienteModalOpen(true); setTimeout(() => clienteInputRef.current?.focus(), 150); }}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-750 text-violet-400 hover:text-violet-300 font-bold text-[10px] transition uppercase"
              >
                {clienteSelecionado ? "Alterar" : "Selecionar"}
              </button>
              {clienteSelecionado && (
                <button
                  onClick={() => setClienteSelecionado(null)}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500 hover:text-red-400 font-bold text-[10px] transition uppercase"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Toggle gerar vale */}
          {clienteSelecionado && (
            <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
              <div>
                <p className="text-xs font-bold text-violet-300">🎟️ Gerar Vale-Crédito</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">O cliente recebe um código para usar em compras futuras</p>
              </div>
              <button
                onClick={() => setGerarVale(!gerarVale)}
                className={`w-11 h-6 rounded-full transition-colors relative ${gerarVale ? "bg-violet-600" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${gerarVale ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}
        </div>

        {/* Botão registrar */}
        <button
          onClick={registrarDevolucao}
          disabled={isLoading || itens.length === 0}
          className="w-full py-4 bg-gradient-to-r from-violet-700 to-rose-600 hover:from-violet-600 hover:to-rose-500 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition duration-200 shadow-lg shadow-violet-700/20 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          {isLoading ? "Processando..." : "Registrar Devolução"}
        </button>

        {/* Histórico Compacto */}
        {historico.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Últimas Devoluções
            </span>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {historico.map((dev) => (
                <div key={dev.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">
                      {MOTIVOS.find((m) => m.value === dev.motivo)?.icon} {MOTIVOS.find((m) => m.value === dev.motivo)?.label || dev.motivo}
                    </span>
                    <span className="font-mono text-violet-400 font-bold text-xs">
                      R$ {Number(dev.valorTotal).toFixed(2)}
                    </span>
                  </div>
                  {dev.cliente && (
                    <p className="text-[10px] text-zinc-500">👤 {dev.cliente.nome}</p>
                  )}
                  {dev.valeCredito && (
                    <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg px-2 py-1">
                      <Tag size={10} className="text-violet-400" />
                      <span className="font-mono text-[10px] text-violet-300 font-bold tracking-widest">{dev.valeCredito.codigoUnico}</span>
                      <span className="ml-auto text-[10px] text-emerald-400 font-bold">R$ {Number(dev.valeCredito.valorAtual).toFixed(2)}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600">
                    {new Date(dev.createdAt).toLocaleString("pt-BR")} — {dev.itens.length} item(ns)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL DE SUCESSO COM VALE-CRÉDITO ===== */}
      {resultadoVale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-gradient-to-r from-violet-700 to-rose-600 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Devolução Registrada!</h3>
              <p className="text-violet-200 text-sm mt-1">Vale-crédito gerado com sucesso</p>
            </div>

            <div className="p-6 space-y-5">
              {resultadoVale.clienteNome && (
                <p className="text-center text-zinc-400 text-sm">
                  Emitido para: <span className="text-white font-bold">{resultadoVale.clienteNome}</span>
                </p>
              )}

              {/* Código do Vale em destaque */}
              <div className="bg-zinc-950 border-2 border-violet-500/40 rounded-2xl p-5 text-center space-y-3">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Código do Vale-Crédito</div>
                <div className="font-mono text-3xl font-black text-violet-300 tracking-[0.25em] py-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  {resultadoVale.codigoUnico}
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {resultadoVale.valorInicial.toFixed(2)}
                </div>
                <p className="text-[10px] text-zinc-600">Use este código no campo Vale-Crédito na tela de Venda Rápida</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300">Anote ou imprima o código e entregue ao cliente. O vale pode ser utilizado parcialmente em múltiplas compras.</p>
              </div>

              <button
                onClick={() => setResultadoVale(null)}
                className="w-full py-3 bg-violet-700 hover:bg-violet-600 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition"
              >
                ✓ Concluído — Nova Devolução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DE BUSCA DE PRODUTO ===== */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white flex items-center gap-2 text-sm uppercase">
                <Search size={16} className="text-violet-400" /> Buscar Produto para Devolução
              </h3>
              <button onClick={() => { setIsSearchOpen(false); barcodeRef.current?.focus(); }} className="text-zinc-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Nome do produto ou código EAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 placeholder-zinc-700 text-sm"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800/50 p-2">
              {produtosFiltrados.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-xs font-bold uppercase">Nenhum produto encontrado</div>
              ) : (
                produtosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { adicionarItem(p); setIsSearchOpen(false); setSearchQuery(""); barcodeRef.current?.focus(); }}
                    className="w-full text-left p-3 hover:bg-violet-500/10 rounded-xl transition flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-violet-300 text-sm">{p.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">EAN: {p.codigoBarras}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-violet-400 font-mono text-sm">R$ {Number(p.precoVenda).toFixed(2)}</p>
                      <p className="text-[10px] text-zinc-500">Estoque: {p.estoqueAtual}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DE SELEÇÃO DE CLIENTE ===== */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white flex items-center gap-2 text-sm uppercase">
                <Search size={16} className="text-violet-400" /> Selecionar Cliente
              </h3>
              <button onClick={() => { setIsClienteModalOpen(false); barcodeRef.current?.focus(); }} className="text-zinc-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <input
                ref={clienteInputRef}
                type="text"
                placeholder="Nome ou CPF/CNPJ..."
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 placeholder-zinc-700 text-sm"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800/50 p-2">
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-xs font-bold uppercase">Nenhum cliente encontrado</div>
              ) : (
                clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setClienteSelecionado(c); setIsClienteModalOpen(false); setClienteQuery(""); }}
                    className="w-full text-left p-3 hover:bg-violet-500/10 rounded-xl transition flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-violet-300 text-sm">{c.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">CPF/CNPJ: {c.cpfCnpj || "N/A"} | Tel: {c.telefone || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-xs font-bold ${c.saldoDevedor > 0 ? "text-red-400" : "text-zinc-500"}`}>
                        Débito: R$ {Number(c.saldoDevedor).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
