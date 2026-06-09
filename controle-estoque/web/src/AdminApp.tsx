import { useState, useEffect } from "react";
import { Building2, Users, DollarSign, ShieldAlert, Plus, Search, CheckCircle, Ban, RefreshCw, LogOut } from "lucide-react";
import api from "./services/api";

type Empresa = {
  id: string;
  nomeFantasia: string;
  razaoSocial: string | null;
  cnpj: string | null;
  status: "ATIVO" | "BLOQUEADO";
  createdAt: string;
  _count?: {
    usuarios: number;
    produtos: number;
  };
};

type Metricas = {
  totalEmpresas: number;
  totalUsuarios: number;
  mrrEstimado: number;
};

export default function AdminApp() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [metricas, setMetricas] = useState<Metricas>({ totalEmpresas: 0, totalUsuarios: 0, mrrEstimado: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    if (isDemoMode) {
      // Carregar dados locais do LocalStorage para modo Demo
      const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
      
      const list: Empresa[] = (localDB.empresas || []).map((emp: any) => ({
        id: emp.id,
        nomeFantasia: emp.nomeFantasia,
        razaoSocial: emp.razaoSocial || "",
        cnpj: emp.cnpj || "",
        status: emp.status || "ATIVO",
        createdAt: emp.createdAt || new Date().toISOString(),
        _count: {
          usuarios: (localDB.usuarios || []).filter((u: any) => u.empresaId === emp.id).length,
          produtos: (localDB.produtos || []).filter((p: any) => p.empresaId === emp.id).length
        }
      }));

      setEmpresas(list);

      // Calcular métricas SaaS
      setMetricas({
        totalEmpresas: list.length,
        totalUsuarios: localDB.usuarios?.length || 0,
        mrrEstimado: list.length * 199.90 // MRR baseado no valor do plano por CNPJ
      });
    } else {
      try {
        const [empRes, metRes] = await Promise.all([
          api.get("/super/empresas"),
          api.get("/super/metricas")
        ]);
        setEmpresas(empRes.data);
        setMetricas(metRes.data);
      } catch (err) {
        console.warn("Erro ao carregar dados da API SuperAdmin. Retornando ao Modo Demo.");
        setIsDemoMode(true);
        loadData();
      }
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: "ATIVO" | "BLOQUEADO") => {
    const newStatus = currentStatus === "ATIVO" ? "BLOQUEADO" : "ATIVO";
    
    if (isDemoMode) {
      const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
      localDB.empresas = (localDB.empresas || []).map((emp: any) => {
        if (emp.id === id) {
          return { ...emp, status: newStatus };
        }
        return emp;
      });
      localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(localDB));
      loadData();
    } else {
      try {
        await api.put(`/super/empresas/${id}/status`, { status: newStatus });
        loadData();
      } catch (err) {
        alert("Erro ao alterar o status do CNPJ no Supabase");
      }
    }
  };

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!nomeFantasia || !cnpj) {
      setModalError("Nome Fantasia e CNPJ são obrigatórios.");
      return;
    }

    if (isDemoMode) {
      const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
      
      const novaEmpresa = {
        id: "emp-" + Math.random().toString(36).substr(2, 9),
        nomeFantasia,
        razaoSocial,
        cnpj,
        status: "ATIVO",
        createdAt: new Date().toISOString()
      };

      localDB.empresas = [...(localDB.empresas || []), novaEmpresa];
      localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(localDB));

      // Limpar campos e fechar modal
      setNomeFantasia("");
      setRazaoSocial("");
      setCnpj("");
      setIsModalOpen(false);
      loadData();
    } else {
      try {
        await api.post("/super/empresas", { nomeFantasia, razaoSocial, cnpj });
        setNomeFantasia("");
        setRazaoSocial("");
        setCnpj("");
        setIsModalOpen(false);
        loadData();
      } catch (err: any) {
        setModalError(err.response?.data?.error || "Erro ao registrar nova empresa lojista.");
      }
    }
  };

  const filteredEmpresas = empresas.filter((emp) =>
    emp.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.cnpj && emp.cnpj.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Header Centralizado */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Valora SaaS</h1>
            <span className="text-xs text-indigo-650 font-bold uppercase tracking-wider">Console do Administrador Global 🛡️</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor do Modo de Conexao */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setIsDemoMode(true);
                setTimeout(loadData, 50);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                isDemoMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Modo Demo (Local)
            </button>
            <button
              onClick={() => {
                setIsDemoMode(false);
                setTimeout(loadData, 50);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                !isDemoMode ? "bg-indigo-650 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Supabase (Nuvem)
            </button>
          </div>

          <button onClick={loadData} className="flex items-center gap-2 p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition shadow-sm" title="Recarregar dados">
            <RefreshCw size={16} className={isLoading ? "animate-spin text-indigo-600" : ""} />
          </button>

          <a href="/index.html" className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition shadow-sm">
            <LogOut size={14} /> Ir para o ERP
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Inquilinos Cadastrados</span>
              <p className="text-3xl font-black text-slate-900">{metricas.totalEmpresas}</p>
              <span className="text-[10px] text-emerald-600 font-bold">CNPJs Integrados ao SaaS</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 size={24} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Usuários Totais</span>
              <p className="text-3xl font-black text-slate-900">{metricas.totalUsuarios}</p>
              <span className="text-[10px] text-indigo-600 font-bold">Operadores & Lojistas cadastrados</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">MRR Mensal Estimado</span>
              <p className="text-3xl font-black text-slate-900">R$ {metricas.mrrEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-emerald-600 font-bold">Preço Base: R$ 199.90 / CNPJ</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign size={24} />
            </div>
          </div>
        </section>

        {/* Gerenciamento de Lojistas */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Empresas e Licenciamento</h2>
              <p className="text-xs text-slate-500">Bloqueie o acesso de inadimplentes ou gerencie novos inquilinos do SaaS</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por CNPJ ou Fantasia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100/50 rounded-xl text-xs focus:bg-white focus:outline-none transition w-64"
                />
              </div>

              {/* Botao de Cadastro */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
              >
                <Plus size={16} /> Cadastrar Empresa
              </button>
            </div>
          </div>

          {/* Tabela de Empresas */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nome Fantasia / Razão Social</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4">Data Cadastro</th>
                  <th className="px-6 py-4 text-center">Usuários / Produtos</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                      Nenhuma empresa encontrada para a sua busca.
                    </td>
                  </tr>
                ) : (
                  filteredEmpresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{emp.nomeFantasia}</p>
                        <span className="text-[10px] text-slate-400">{emp.razaoSocial || "Razão Social não informada"}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{emp.cnpj || "Sem CNPJ"}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(emp.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-4 text-center text-slate-600 font-semibold">
                        {emp._count?.usuarios || 0} U / {emp._count?.produtos || 0} P
                      </td>
                      <td className="px-6 py-4">
                        {emp.status === "ATIVO" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert size={10} /> Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm ${
                            emp.status === "ATIVO"
                              ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                              : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {emp.status === "ATIVO" ? (
                            <>
                              <Ban size={12} /> Bloquear
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} /> Desbloquear
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal de Cadastro de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-md font-extrabold text-slate-900">Cadastrar Nova Empresa (Inquilino)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-950 transition">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <ShieldAlert size={14} />
                <p>{modalError}</p>
              </div>
            )}

            <form onSubmit={handleCreateEmpresa} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado do João"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-650 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Razão Social</label>
                <input
                  type="text"
                  placeholder="Ex: João Distribuidora Ltda"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-650 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">CNPJ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 12.345.678/0001-90"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-650 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
