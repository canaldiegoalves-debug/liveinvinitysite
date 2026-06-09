import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import api, { getMockDB } from "./services/api";
import { Dashboard } from "./pages/Dashboard";
import { Produtos } from "./pages/Produtos";
import { VendaRapida } from "./pages/VendaRapida";
import { ImportarNota } from "./pages/ImportarNota";
import { Sidebar } from "./components/Sidebar";
import { ControleCaixa } from "./pages/ControleCaixa";
import { Devolucoes } from "./pages/Devolucoes";
import { Etiquetas } from "./pages/Etiquetas";
import { Orcamentos } from "./pages/Orcamentos";
import { Relatorios } from "./pages/Relatorios";

type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "OPERADOR";

type Usuario = {
  nome: string;
  email: string;
  role: UserRole;
};

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

type ActiveTab = "dashboard" | "produtos" | "venda" | "importar" | "caixa" | "devolucoes" | "etiquetas" | "orcamentos" | "relatorios";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  // Estado do Usuário Logado
  const [usuario, setUsuario] = useState<Usuario>({
    nome: "Diego Alves",
    email: "diego@valora.com.br",
    role: "COMPANY_ADMIN"
  });

  useEffect(() => {
    loadData();
  }, []);

  // Monitor e Protetor de Rotas (RBAC)
  useEffect(() => {
    const tabsPermitidas: ActiveTab[] = ["venda", "caixa", "devolucoes", "orcamentos"];
    if (usuario.role === "OPERADOR" && !tabsPermitidas.includes(activeTab)) {
      alert("Acesso Negado: Operadores de caixa têm permissão de acesso apenas à Venda Rápida, Controle de Caixa, Devoluções e Orçamentos.");
      setActiveTab("venda");
    }
  }, [usuario.role, activeTab]);

  const loadData = async () => {
    if (isDemoMode) {
      const db = getMockDB();
      setProdutos(db.produtos || []);
    } else {
      try {
        const prodRes = await api.get("/produtos");
        setProdutos(prodRes.data);
      } catch (err) {
        console.warn("API offline. Mantendo Modo Demo.");
        setIsDemoMode(true);
        const db = getMockDB();
        setProdutos(db.produtos || []);
      }
    }
  };

  const tituloTab: Record<ActiveTab, string> = {
    dashboard: "Dashboard Geral",
    produtos: "Produtos e Estoque",
    venda: "Caixa e PDV",
    importar: "Importar XML de NF-e",
    caixa: "Controle de Caixa",
    devolucoes: "Trocas e Devoluções",
    etiquetas: "Gerador de Etiquetas",
    orcamentos: "Orçamentos e Condicionais",
    relatorios: "Relatórios e Auditoria",
  };

  return (
    <div className="flex min-h-screen bg-zinc-955 text-zinc-100">
      
      {/* Sidebar Modular Dinâmica (RBAC) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        usuario={usuario}
        onChangeRole={(role) => setUsuario(prev => ({ ...prev, role }))}
      />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Painel SaaS</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {tituloTab[activeTab]}
            </h1>
          </div>

          <button onClick={loadData} className="flex items-center gap-2 px-3.5 py-1.5 border border-zinc-800 bg-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-800 transition">
            <RefreshCw size={14} /> Sincronizar
          </button>
        </header>

        {/* Renderização condicional das telas */}
        {activeTab === "dashboard"   && <Dashboard produtos={produtos} isDemoMode={isDemoMode} />}
        {activeTab === "produtos"    && (
          <Produtos 
            produtos={produtos} 
            loadData={loadData} 
            isDemoMode={isDemoMode} 
            setProdutos={setProdutos} 
          />
        )}
        {activeTab === "venda"       && <VendaRapida loadData={loadData} isDemoMode={isDemoMode} />}
        {activeTab === "importar"    && <ImportarNota loadData={loadData} isDemoMode={isDemoMode} />}
        {activeTab === "caixa"       && <ControleCaixa isDemoMode={isDemoMode} />}
        {activeTab === "devolucoes"  && <Devolucoes isDemoMode={isDemoMode} />}
        {activeTab === "etiquetas"   && <Etiquetas isDemoMode={isDemoMode} />}
        {activeTab === "orcamentos"  && <Orcamentos isDemoMode={isDemoMode} />}
        {activeTab === "relatorios"  && <Relatorios isDemoMode={isDemoMode} />}

      </main>
    </div>
  );
}
