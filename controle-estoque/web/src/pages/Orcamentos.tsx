import { useState, useRef, useEffect } from "react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import {
  FileText, Search, Trash2, CheckCircle, X, ShoppingCart, UserPlus, Ban
} from "lucide-react";
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

type ItemOrcamento = {
  produto: Produto;
  quantidade: number;
};

type Orcamento = {
  id: string;
  valorTotal: number;
  status: "ABERTO" | "APROVADO" | "EXPIRADO";
  createdAt: string;
  cliente?: { nome: string } | null;
  itens: Array<{
    quantidade: number;
    precoVenda: number;
    produto: { nome: string };
  }>;
};

interface OrcamentosProps {
  isDemoMode: boolean;
}

export function Orcamentos({ isDemoMode }: OrcamentosProps) {
  const [carrinho, setCarrinho] = useState<ItemOrcamento[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [desconto, setDesconto] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resultadoOrcamento, setResultadoOrcamento] = useState<{
    id: string; valorTotal: number; clienteNome?: string
  } | null>(null);

  // Modais de Busca
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const clienteInputRef = useRef<HTMLInputElement>(null);

  const [manualEan, setManualEan] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Histórico
  const [historico, setHistorico] = useState<Orcamento[]>([]);

  useEffect(() => {
    barcodeRef.current?.focus();
    carregarHistorico();
  }, [isDemoMode]);

  // Teclas de atalho globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        abrirBuscaCliente();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const carregarHistorico = async () => {
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setHistorico((db.orcamentos || []).slice(0, 10));
      } else {
        const res = await api.get("/orcamentos");
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
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.produto.id === produto.id);
      if (idx !== -1) {
        return prev.map((i, n) => n === idx ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removerItem = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((i) => i.produto.id !== produtoId));
  };

  const subtotal = carrinho.reduce((s, i) => s + i.produto.precoVenda * i.quantidade, 0);
  const totalOrcamento = Math.max(0, subtotal - desconto);

  const salvarOrcamento = async () => {
    if (carrinho.length === 0) {
      alert("Adicione ao menos um produto para o orçamento.");
      return;
    }
    setIsLoading(true);

    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const orcamentoId = "orc-" + Math.floor(100000 + Math.random() * 900000);

        const novoOrc = {
          id: orcamentoId,
          empresaId: "demo-tenant-id",
          clienteId: clienteSelecionado?.id || null,
          valorTotal: Number(totalOrcamento.toFixed(2)),
          status: "ABERTO" as const,
          createdAt: new Date().toISOString(),
          cliente: clienteSelecionado ? { nome: clienteSelecionado.nome } : null,
          itens: carrinho.map((i) => ({
            quantidade: i.quantidade,
            precoVenda: i.produto.precoVenda,
            produto: { id: i.produto.id, nome: i.produto.nome, codigoBarras: i.produto.codigoBarras, precoVenda: i.produto.precoVenda }
          }))
        };

        db.orcamentos = [novoOrc, ...(db.orcamentos || [])];
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(db));

        setResultadoOrcamento({
          id: orcamentoId,
          valorTotal: Number(totalOrcamento.toFixed(2)),
          clienteNome: clienteSelecionado?.nome
        });
      } else {
        const res = await api.post("/orcamentos", {
          clienteId: clienteSelecionado?.id || undefined,
          itens: carrinho.map((i) => ({
            produtoId: i.produto.id,
            quantidade: i.quantidade
          }))
        });

        setResultadoOrcamento({
          id: res.data.orcamento.id,
          valorTotal: Number(res.data.orcamento.valorTotal),
          clienteNome: clienteSelecionado?.nome
        });
      }

      setCarrinho([]);
      setDesconto(0);
      setClienteSelecionado(null);
      await carregarHistorico();
    } catch (err: any) {
      alert("Erro ao registrar orçamento: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      barcodeRef.current?.focus();
    }
  };

  const cancelarOrcamento = async (id: string) => {
    if (!confirm("Deseja realmente cancelar/expirar este orçamento? Ele não poderá ser puxado no caixa.")) return;
    try {
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        db.orcamentos = (db.orcamentos || []).map((o: any) =>
          o.id === id ? { ...o, status: "EXPIRADO" } : o
        );
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(db));
      } else {
        await api.put(`/orcamentos/${id}/cancelar`);
      }
      alert("Orçamento cancelado!");
      await carregarHistorico();
    } catch (err: any) {
      alert("Erro ao cancelar orçamento: " + (err.response?.data?.error || err.message));
    }
  };

  const abrirBuscaCliente = () => {
    carregarClientes();
    setIsClienteModalOpen(true);
    setTimeout(() => clienteInputRef.current?.focus(), 150);
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

      {/* ===== COLUNA ESQUERDA: CARRINHO DE ORÇAMENTO ===== */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[680px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

        {/* Header */}
        <div className="border-b border-zinc-800 pb-3 flex items-center justify-between shrink-0">
          <h4 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-wide">
            <FileText size={16} className="text-sky-400" /> NOVO ORÇAMENTO / CONDICIONAL
          </h4>
          <span className="text-xs text-sky-400 font-mono font-bold uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded">
            Vendas em Andamento
          </span>
        </div>

        {/* Campo de Código de Barras */}
        <div className="py-3 border-b border-zinc-800 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleBipar(manualEan); setManualEan(""); }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Bipe ou digite o EAN para orçar..."
                value={manualEan}
                onChange={(e) => setManualEan(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 font-mono text-sm tracking-wider placeholder-zinc-700"
              />
              <button
                type="button"
                onClick={() => { carregarProdutos(); setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 150); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                title="Pesquisar Produto"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de Itens */}
        <div className="overflow-y-auto flex-1 pr-1 mt-2">
          {carrinho.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center gap-3 text-zinc-600">
              <ShoppingCart size={40} className="animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">CARRINHO DE ORÇAMENTO VAZIO</span>
              <p className="text-xs text-zinc-700">Bipe o código de barras ou use a busca manual</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-2.5">Produto</th>
                  <th className="py-2.5 text-center">Qtd</th>
                  <th className="py-2.5 text-right">Unitário</th>
                  <th className="py-2.5 text-right">Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm">
                {carrinho.map((item) => (
                  <tr key={item.produto.id} className="hover:bg-zinc-800/20 group transition-colors">
                    <td className="py-3">
                      <p className="font-bold text-white truncate max-w-[240px]">{item.produto.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{item.produto.codigoBarras || "Sem EAN"}</p>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setCarrinho((prev) => prev.map((i) => i.produto.id === item.produto.id ? { ...i, quantidade: Math.max(1, i.quantidade - 1) } : i))}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                        >−</button>
                        <span className="w-8 text-center font-bold text-white">{item.quantidade}</span>
                        <button
                          onClick={() => setCarrinho((prev) => prev.map((i) => i.produto.id === item.produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                        >+</button>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-400 text-xs">
                      R$ {Number(item.produto.precoVenda).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-sky-400">
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

        {/* Resumo do Subtotal */}
        {carrinho.length > 0 && (
          <div className="shrink-0 border-t border-zinc-800 pt-3 flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-bold uppercase">Subtotal</span>
            <span className="text-lg font-bold text-zinc-300 font-mono">R$ {subtotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* ===== COLUNA DIREITA: CONFIGURAÇÕES E HISTÓRICO ===== */}
      <div className="lg:col-span-5 flex flex-col gap-4">

        {/* Cliente e Orçamento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Cliente do Orçamento
            </span>
            <div className="bg-zinc-950 border border-zinc-855 rounded-xl p-3 flex items-center justify-between gap-2">
              {clienteSelecionado ? (
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Nome</span>
                  <h4 className="font-bold text-white text-xs truncate mt-0.5">{clienteSelecionado.nome}</h4>
                  <p className="text-[10px] font-mono text-zinc-500">Tel: {clienteSelecionado.telefone || "Não cadastrado"}</p>
                </div>
              ) : (
                <div className="flex-1 py-1">
                  <p className="text-zinc-500 text-xs font-bold">Cliente Geral / Não Selecionado</p>
                  <p className="text-[9px] text-zinc-650">Pressione F5 para buscar cliente</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={abrirBuscaCliente}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-750 text-sky-400 hover:text-sky-300 font-bold text-[10px] transition uppercase flex items-center gap-1"
                >
                  <UserPlus size={10} /> {clienteSelecionado ? "Trocar" : "Buscar (F5)"}
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
          </div>

          {/* Desconto */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Desconto Comercial (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-bold">R$</span>
              <input
                type="number"
                min={0}
                value={desconto || ""}
                onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0,00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-sky-500 font-bold"
              />
            </div>
          </div>

          {/* Totalizador */}
          <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total do Orçamento</span>
            <span className="text-2xl font-black text-sky-400 font-mono">R$ {totalOrcamento.toFixed(2)}</span>
          </div>

          {/* Botão de Salvar */}
          <button
            onClick={salvarOrcamento}
            disabled={isLoading || carrinho.length === 0}
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition duration-200 shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            {isLoading ? "Processando..." : "Salvar Orçamento"}
          </button>
        </div>

        {/* Histórico Compacto de Orçamentos */}
        {historico.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Últimos Orçamentos
            </span>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {historico.map((orc) => (
                <div key={orc.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      #{orc.id.replace("orc-", "")}
                    </span>
                    <span className="font-mono text-sky-400 font-bold text-xs">
                      R$ {Number(orc.valorTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                      👤 {orc.cliente?.nome || "Consumidor Geral"}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                      orc.status === "ABERTO" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      orc.status === "APROVADO" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {orc.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-zinc-600">
                    <span>{new Date(orc.createdAt).toLocaleString("pt-BR")}</span>
                    {orc.status === "ABERTO" && (
                      <button
                        onClick={() => cancelarOrcamento(orc.id)}
                        className="text-red-400 hover:text-red-350 font-bold flex items-center gap-0.5"
                        title="Cancelar Orçamento"
                      >
                        <Ban size={9} /> Expirar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL DE ORÇAMENTO GERADO ===== */}
      {resultadoOrcamento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-650 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Orçamento Salvo!</h3>
              <p className="text-sky-200 text-sm mt-1">Status: ABERTO (Condicional)</p>
            </div>

            <div className="p-6 space-y-5">
              {resultadoOrcamento.clienteNome && (
                <p className="text-center text-zinc-400 text-sm">
                  Orçado para: <span className="text-white font-bold">{resultadoOrcamento.clienteNome}</span>
                </p>
              )}

              {/* ID do Orçamento em destaque */}
              <div className="bg-zinc-950 border-2 border-sky-500/40 rounded-2xl p-5 text-center space-y-3">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Código do Orçamento</div>
                <div className="font-mono text-2xl font-black text-sky-300 tracking-wider py-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  {resultadoOrcamento.id}
                </div>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  R$ {resultadoOrcamento.valorTotal.toFixed(2)}
                </div>
                <p className="text-[10px] text-zinc-650">Puxe este código na tela do caixa (F7) para concluir a venda</p>
              </div>

              <button
                onClick={() => setResultadoOrcamento(null)}
                className="w-full py-3 bg-sky-650 hover:bg-sky-600 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition"
              >
                ✓ Entendi — Novo Orçamento
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
                <Search size={16} className="text-sky-400" /> Buscar Produto para Orçamento
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 placeholder-zinc-700 text-sm"
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
                    className="w-full text-left p-3 hover:bg-sky-500/10 rounded-xl transition flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-sky-300 text-sm">{p.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">EAN: {p.codigoBarras}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sky-400 font-mono text-sm">R$ {Number(p.precoVenda).toFixed(2)}</p>
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
                <Search size={16} className="text-sky-400" /> Selecionar Cliente do Orçamento
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 placeholder-zinc-700 text-sm"
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
                    className="w-full text-left p-3 hover:bg-sky-500/10 rounded-xl transition flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-sky-300 text-sm">{c.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-500">CPF/CNPJ: {c.cpfCnpj || "N/A"}</p>
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
