import { useState } from "react";
import { Search, Trash2, Plus, Edit2, Sliders, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  ncm?: string | null;
  csosn?: string | null;
};

interface ProdutosProps {
  produtos: Produto[];
  loadData: () => Promise<void>;
  isDemoMode: boolean;
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
}

type TipoAba = "todos" | "critico" | "zerados" | "positivo";

export function Produtos({ produtos, loadData, isDemoMode, setProdutos }: ProdutosProps) {
  const [busca, setBusca] = useState("");
  const [filtroAba, setFiltroAba] = useState<TipoAba>("todos");
  
  // Estados de Cadastro/Edição
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [prodNome, setProdNome] = useState("");
  const [prodEan, setProdEan] = useState("");
  const [prodCusto, setProdCusto] = useState("");
  const [prodVenda, setProdVenda] = useState("");
  const [prodLucro, setProdLucro] = useState("");
  const [prodEstoque, setProdEstoque] = useState("");
  const [prodMinimo, setProdMinimo] = useState("");
  const [prodNcm, setProdNcm] = useState("");
  const [prodCsosn, setProdCsosn] = useState("");

  // Estados de Ajuste Rápido de Inventário
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [produtoAjustando, setProdutoAjustando] = useState<Produto | null>(null);
  const [ajusteTipo, setAjusteTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [ajusteQtd, setAjusteQtd] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Limpeza de formulário de cadastro/edição
  const clearForm = () => {
    setProdutoEditando(null);
    setProdNome("");
    setProdEan("");
    setProdCusto("");
    setProdVenda("");
    setProdLucro("");
    setProdEstoque("");
    setProdMinimo("");
    setProdNcm("");
    setProdCsosn("");
  };

  // Abre formulário para criação
  const handleNovoProdutoClick = () => {
    clearForm();
    setIsFormModalOpen(true);
  };

  // Abre formulário para edição de produto
  const handleEditarClick = (p: Produto) => {
    setProdutoEditando(p);
    setProdNome(p.nome);
    setProdEan(p.codigoBarras || "");
    setProdCusto(Number(p.precoCusto).toFixed(2));
    setProdVenda(Number(p.precoVenda).toFixed(2));
    setProdLucro(Number(p.lucroPercentual).toFixed(2));
    setProdEstoque(Number(p.estoqueAtual).toString());
    setProdMinimo(p.estoqueMinimo ? Number(p.estoqueMinimo).toString() : "");
    setProdNcm(p.ncm || "");
    setProdCsosn(p.csosn || "");
    setIsFormModalOpen(true);
  };

  // Abre modal de ajuste rápido de estoque
  const handleAjusteClick = (p: Produto) => {
    setProdutoAjustando(p);
    setAjusteTipo("ENTRADA");
    setAjusteQtd("");
    setIsAjusteModalOpen(true);
  };

  // Salvar produto (Criar ou Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = {
      nome: prodNome,
      codigoBarras: prodEan || null,
      precoCusto: parseFloat(prodCusto) || 0,
      precoVenda: parseFloat(prodVenda) || 0,
      lucroPercentual: parseFloat(prodLucro) || 0,
      estoqueAtual: parseFloat(prodEstoque) || 0,
      estoqueMinimo: prodMinimo ? parseFloat(prodMinimo) : null,
      ncm: prodNcm || null,
      csosn: prodCsosn || null
    };

    try {
      if (isDemoMode) {
        if (produtoEditando) {
          // Edição local no modo demo
          const updated = produtos.map(p => p.id === produtoEditando.id ? { ...p, ...data } : p);
          setProdutos(updated);
          localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify({
            ...JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}"),
            produtos: updated
          }));
        } else {
          // Criação local no modo demo
          const novo = { id: String(Date.now()), ...data };
          const updated = [novo, ...produtos];
          setProdutos(updated);
          localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify({
            ...JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}"),
            produtos: updated
          }));
        }
      } else {
        if (produtoEditando) {
          await api.put(`/produtos/${produtoEditando.id}`, data);
        } else {
          await api.post("/produtos", data);
        }
        await loadData();
      }
      setIsFormModalOpen(false);
      clearForm();
    } catch (err: any) {
      alert("Erro ao salvar produto: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Processar ajuste rápido de estoque
  const handleSaveAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoAjustando || !ajusteQtd) return;
    setIsLoading(true);

    const quantidade = parseFloat(ajusteQtd);
    if (isNaN(quantidade) || quantidade <= 0) {
      alert("Informe uma quantidade válida e maior que zero.");
      setIsLoading(false);
      return;
    }

    try {
      if (isDemoMode) {
        // Ajuste simulado no modo Demo
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const fator = ajusteTipo === "ENTRADA" ? 1 : -1;
        
        const prodsAtualizados = localDB.produtos.map((p: any) => {
          if (p.id === produtoAjustando.id) {
            const novoEstoque = Math.max(0, Number(p.estoqueAtual) + (quantidade * fator));
            return { ...p, estoqueAtual: novoEstoque };
          }
          return p;
        });

        const novaMovimentacao = {
          id: "m-" + Date.now() + Math.random(),
          tipo: ajusteTipo,
          quantidade,
          motivo: "Ajuste Manual",
          createdAt: new Date().toISOString(),
          produto: { nome: produtoAjustando.nome, codigoBarras: produtoAjustando.codigoBarras }
        };

        localDB.produtos = prodsAtualizados;
        localDB.movimentacoes = [novaMovimentacao, ...(localDB.movimentacoes || [])];
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(localDB));
        await loadData();
      } else {
        // Envio da movimentação real para a API
        await api.post("/estoque/ajuste", {
          produtoId: produtoAjustando.id,
          tipo: ajusteTipo,
          quantidade,
          motivo: "Ajuste Manual"
        });
        await loadData();
      }
      setIsAjusteModalOpen(false);
      setProdutoAjustando(null);
    } catch (err: any) {
      alert("Erro ao ajustar estoque: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir produto
  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este produto? Isso removerá o item do catálogo.")) {
      try {
        if (isDemoMode) {
          const updated = produtos.filter(p => p.id !== id);
          setProdutos(updated);
          localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify({
            ...JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}"),
            produtos: updated
          }));
        } else {
          await api.delete(`/produtos/${id}`);
          await loadData();
        }
      } catch (err: any) {
        alert("Erro ao excluir produto: " + (err.response?.data?.error || err.message));
      }
    }
  };

  // Cálculos markup para precificação dinâmica no formulário
  const calcPrecoVenda = (custo: string, lucro: string) => {
    const c = parseFloat(custo) || 0;
    const l = parseFloat(lucro) || 0;
    if (c > 0) setProdVenda((c * (1 + l / 100)).toFixed(2));
  };

  const calcLucro = (custo: string, venda: string) => {
    const c = parseFloat(custo) || 0;
    const v = parseFloat(venda) || 0;
    if (c > 0 && v >= c) setProdLucro((((v - c) / c) * 100).toFixed(2));
  };

  // Contadores para as abas
  const countTodos = produtos.length;
  const countCritico = produtos.filter(p => {
    const estoqueMin = p.estoqueMinimo ? Number(p.estoqueMinimo) : 0;
    return Number(p.estoqueAtual) <= estoqueMin;
  }).length;
  const countZerados = produtos.filter(p => Number(p.estoqueAtual) === 0).length;
  const countPositivos = produtos.filter(p => Number(p.estoqueAtual) > 0).length;

  // Filtragem dos produtos por aba e busca por texto
  const produtosFiltradosPorAba = produtos.filter(p => {
    const estoqueMin = p.estoqueMinimo ? Number(p.estoqueMinimo) : 0;
    if (filtroAba === "critico") return Number(p.estoqueAtual) <= estoqueMin;
    if (filtroAba === "zerados") return Number(p.estoqueAtual) === 0;
    if (filtroAba === "positivo") return Number(p.estoqueAtual) > 0;
    return true; // "todos"
  });

  const filtrados = produtosFiltradosPorAba.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(busca))
  );

  return (
    <div className="space-y-6 text-zinc-100 animate-fade-in">
      
      {/* Barra superior de Filtro e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Abas de Filtros Operacionais */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-bold gap-1 shadow-inner">
          <button
            onClick={() => setFiltroAba("todos")}
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 ${
              filtroAba === "todos" 
                ? "bg-indigo-600 text-white shadow" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todos <span className={`px-1.5 py-0.5 rounded text-[10px] ${filtroAba === "todos" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>{countTodos}</span>
          </button>
          
          <button
            onClick={() => setFiltroAba("critico")}
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 ${
              filtroAba === "critico" 
                ? "bg-amber-600 text-white shadow" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Abaixo do Mínimo <span className={`px-1.5 py-0.5 rounded text-[10px] ${filtroAba === "critico" ? "bg-amber-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>{countCritico}</span>
          </button>

          <button
            onClick={() => setFiltroAba("zerados")}
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 ${
              filtroAba === "zerados" 
                ? "bg-red-600 text-white shadow" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Zerados <span className={`px-1.5 py-0.5 rounded text-[10px] ${filtroAba === "zerados" ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>{countZerados}</span>
          </button>

          <button
            onClick={() => setFiltroAba("positivo")}
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 ${
              filtroAba === "positivo" 
                ? "bg-emerald-600 text-white shadow" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Estoque Positivo <span className={`px-1.5 py-0.5 rounded text-[10px] ${filtroAba === "positivo" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>{countPositivos}</span>
          </button>
        </div>

        {/* Input de Busca e Botão de Cadastro */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl w-full md:w-80 text-sm shadow-inner">
            <Search size={18} className="text-zinc-550 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou EAN..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-650"
            />
          </div>

          <button 
            onClick={handleNovoProdutoClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 rounded-xl text-white font-bold transition text-sm shrink-0 shadow-lg shadow-indigo-655/10"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>

      </div>

      {/* Tabela do Inventário Geral */}
      <div className="overflow-hidden border border-zinc-800 bg-zinc-900/40 backdrop-blur rounded-2xl shadow-xl">
        <table className="min-w-full divide-y divide-zinc-800/80 text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4.5 font-semibold">EAN-13</th>
              <th className="px-6 py-4.5 font-semibold">Nome do Produto</th>
              <th className="px-6 py-4.5 font-semibold text-right">Preço Custo</th>
              <th className="px-6 py-4.5 font-semibold text-right">% Margem</th>
              <th className="px-6 py-4.5 font-semibold text-right">Preço Venda</th>
              <th className="px-6 py-4.5 font-semibold text-center">Estoque</th>
              <th className="px-6 py-4.5 font-semibold text-center">Mínimo</th>
              <th className="px-6 py-4.5 text-center">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/60 font-medium text-zinc-300">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-zinc-550 font-semibold uppercase tracking-wider text-xs">
                  Nenhum produto atende a este filtro no estoque
                </td>
              </tr>
            ) : (
              filtrados.map(p => {
                const estoqueAtual = Number(p.estoqueAtual);
                const estoqueMinimo = p.estoqueMinimo ? Number(p.estoqueMinimo) : 0;
                const isCritico = estoqueAtual <= estoqueMinimo;
                const isZerado = estoqueAtual === 0;

                return (
                  <tr 
                    key={p.id} 
                    className={`transition duration-150 ${
                      isZerado 
                        ? "bg-red-500/5 hover:bg-red-500/10" 
                        : isCritico 
                          ? "bg-amber-500/5 hover:bg-amber-500/10" 
                          : "hover:bg-zinc-850/20"
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                      {p.codigoBarras || <span className="text-zinc-650 italic">Sem Código</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-white max-w-[240px] truncate">
                      {p.nome}
                      {isZerado ? (
                        <span className="ml-2.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/15">
                          Esgotado
                        </span>
                      ) : isCritico ? (
                        <span className="ml-2.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/15">
                          Crítico
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      R$ {Number(p.precoCusto).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-indigo-400 font-semibold">
                      {Number(p.lucroPercentual).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                      R$ {Number(p.precoVenda).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      <span className={isZerado ? "text-red-400" : isCritico ? "text-amber-400" : "text-white"}>
                        {estoqueAtual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-zinc-550">
                      {p.estoqueMinimo ? `${estoqueMinimo} un` : <span className="text-zinc-650">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* Ajuste Rápido de Inventário */}
                        <button 
                          onClick={() => handleAjusteClick(p)}
                          className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-emerald-500/10 transition"
                          title="Ajustar Estoque Manualmente"
                        >
                          <Sliders size={15} />
                        </button>

                        {/* Editar Produto */}
                        <button 
                          onClick={() => handleEditarClick(p)}
                          className="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-500/10 transition"
                          title="Editar Cadastro"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Excluir Produto */}
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition"
                          title="Excluir Produto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro / Edição de Produto */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-zinc-800 bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="bg-zinc-950 p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                {produtoEditando ? "Editar Produto" : "Cadastrar Novo Produto"}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase">Nome do Produto *</label>
                <input 
                  type="text" 
                  required 
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm shadow-inner"
                  placeholder="Ex: Coca-Cola Lata 350ml"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase">Código de Barras (EAN-13)</label>
                <input 
                  type="text" 
                  value={prodEan}
                  onChange={(e) => setProdEan(e.target.value)}
                  className="bg-zinc-955 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm shadow-inner"
                  placeholder="Ex: 7891234567890"
                />
              </div>

              {/* Bloco de Precificação Markup */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-650/5 border border-indigo-650/10 p-3 rounded-xl">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={prodCusto}
                    onChange={(e) => { setProdCusto(e.target.value); calcPrecoVenda(e.target.value, prodLucro); }}
                    className="bg-zinc-955 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none text-xs text-right font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">% Margem</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={prodLucro}
                    onChange={(e) => { setProdLucro(e.target.value); calcPrecoVenda(prodCusto, e.target.value); }}
                    className="bg-zinc-955 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none text-xs text-right font-mono"
                    placeholder="0.0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={prodVenda}
                    onChange={(e) => { setProdVenda(e.target.value); calcLucro(prodCusto, e.target.value); }}
                    className="bg-zinc-955 border border-zinc-800 rounded-lg p-2 text-emerald-400 font-bold focus:outline-none text-xs text-right font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-semibold uppercase">Estoque Atual</label>
                  <input 
                    type="number" 
                    required 
                    value={prodEstoque}
                    onChange={(e) => setProdEstoque(e.target.value)}
                    className="bg-zinc-955 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm shadow-inner font-mono text-center"
                    disabled={!!produtoEditando} // Bloqueado na edição (usa-se o Ajuste Rápido)
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-semibold uppercase">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    value={prodMinimo}
                    onChange={(e) => setProdMinimo(e.target.value)}
                    className="bg-zinc-955 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm shadow-inner font-mono text-center"
                    placeholder="Ex: 5"
                  />
                </div>
              </div>

              {/* Seção Dados Fiscais */}
              <div className="border-t border-zinc-800/80 pt-3 space-y-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Dados Fiscais (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">NCM (8 dígitos)</label>
                    <input 
                      type="text" 
                      maxLength={8}
                      value={prodNcm}
                      onChange={(e) => setProdNcm(e.target.value.replace(/\D/g, ""))}
                      className="bg-zinc-955 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      placeholder="Ex: 22029000"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">CSOSN / CST (4 dígitos)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={prodCsosn}
                      onChange={(e) => setProdCsosn(e.target.value.replace(/\D/g, ""))}
                      className="bg-zinc-955 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      placeholder="Ex: 0102"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-850">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg text-white hover:bg-zinc-750 transition text-xs font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-650 rounded-lg text-white font-extrabold transition text-xs uppercase"
                >
                  {isLoading ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste Rápido de Inventário */}
      {isAjusteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-zinc-800 bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="bg-zinc-955 p-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Ajuste Rápido de Inventário
                </h3>
                <span className="text-[10px] text-zinc-455 font-bold block mt-0.5">
                  PRODUTO: {produtoAjustando?.nome}
                </span>
              </div>
              <button 
                onClick={() => setIsAjusteModalOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAjuste} className="p-5 space-y-4">
              
              {/* Seleção do Tipo de Ajuste */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAjusteTipo("ENTRADA")}
                    className={`py-3 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-1 transition ${
                      ajusteTipo === "ENTRADA"
                        ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                        : "bg-zinc-955 border border-zinc-800 text-zinc-550 hover:text-zinc-350"
                    }`}
                  >
                    <ArrowUpRight size={16} /> Entrada (Somar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAjusteTipo("SAIDA")}
                    className={`py-3 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-1 transition ${
                      ajusteTipo === "SAIDA"
                        ? "bg-red-600/10 border-red-500 text-red-400"
                        : "bg-zinc-955 border-zinc-800 text-zinc-555 hover:text-zinc-350"
                    }`}
                  >
                    <ArrowDownRight size={16} /> Saída (Subtrair)
                  </button>
                </div>
              </div>

              {/* Quantidade do Ajuste */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase">Quantidade a Ajustar</label>
                <input 
                  type="number" 
                  required
                  min="0.001"
                  step="any"
                  placeholder="Digite o número de unidades..."
                  value={ajusteQtd}
                  onChange={(e) => setAjusteQtd(e.target.value)}
                  className="bg-zinc-955 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-center text-lg shadow-inner"
                  autoFocus
                />
              </div>

              {/* Motivo Informativo Exibido */}
              <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase">Motivo Oficial</span>
                <span className="text-xs font-mono font-bold text-indigo-400">Ajuste Manual</span>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-850">
                <button 
                  type="button" 
                  onClick={() => setIsAjusteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg text-white hover:bg-zinc-750 transition text-xs font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`px-5 py-2 rounded-lg text-white font-extrabold transition text-xs uppercase ${
                    ajusteTipo === "ENTRADA" ? "bg-emerald-600 hover:bg-emerald-555" : "bg-red-650 hover:bg-red-600"
                  }`}
                >
                  {isLoading ? "Processando..." : "Confirmar Movimentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
