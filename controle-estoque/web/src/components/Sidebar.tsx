import { LayoutDashboard, Package, ScanBarcode, Upload, Building2, UserCheck, Banknote, RotateCcw, Tag, FileText, BarChart2 } from "lucide-react";

type UserRole = "admin" | "operador";

type Usuario = {
  nome: string;
  email: string;
  role: UserRole;
};

type ActiveTab = "dashboard" | "produtos" | "venda" | "importar" | "caixa" | "devolucoes" | "etiquetas" | "orcamentos" | "relatorios";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  usuario: Usuario;
  onChangeRole: (role: UserRole) => void;
}

const navItem = (
  tab: ActiveTab,
  activeTab: ActiveTab,
  setActiveTab: (t: ActiveTab) => void,
  icon: React.ReactNode,
  label: string,
  accentColor = "text-indigo-400",
  bgColor = "bg-indigo-600/10"
) => (
  <button
    onClick={() => setActiveTab(tab)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
      activeTab === tab
        ? `${bgColor} ${accentColor}`
        : "text-zinc-400 hover:text-zinc-100"
    }`}
  >
    {icon} {label}
  </button>
);

export function Sidebar({ activeTab, setActiveTab, usuario, onChangeRole }: SidebarProps) {
  return (
    <aside className="w-72 bg-zinc-900/60 border-r border-zinc-800 p-6 flex flex-col justify-between backdrop-blur-md">
      <div className="space-y-8">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Package className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-md font-extrabold tracking-tight text-white">VALORA</h2>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Estoque SaaS</span>
          </div>
        </div>

        {/* Menu Dinâmico base do Cargo (RBAC) */}
        <nav className="space-y-1.5">
          {usuario.role === "admin" && (
            <>
              {navItem("dashboard", activeTab, setActiveTab, <LayoutDashboard size={18} />, "Dashboard")}
              {navItem("produtos",  activeTab, setActiveTab, <Package size={18} />, "Produtos e Estoque")}
            </>
          )}

          {navItem("venda",  activeTab, setActiveTab, <ScanBarcode size={18} />, "Venda Rápida (Caixa)")}
          {navItem("caixa",  activeTab, setActiveTab, <Banknote size={18} />, "Controle de Caixa")}
          {navItem(
            "devolucoes",
            activeTab,
            setActiveTab,
            <RotateCcw size={18} />,
            "Trocas e Devoluções",
            "text-violet-400",
            "bg-violet-600/10"
          )}
          {navItem(
            "orcamentos",
            activeTab,
            setActiveTab,
            <FileText size={18} />,
            "Orçamentos e Condicionais",
            "text-sky-400",
            "bg-sky-600/10"
          )}

          {usuario.role === "admin" && (
            <>
              {navItem(
                "etiquetas",
                activeTab,
                setActiveTab,
                <Tag size={18} />,
                "Gerador de Etiquetas",
                "text-amber-400",
                "bg-amber-600/10"
              )}
              {navItem("importar", activeTab, setActiveTab, <Upload size={18} />, "Importar Nota (XML)")}
              {navItem(
                "relatorios",
                activeTab,
                setActiveTab,
                <BarChart2 size={18} />,
                "Relatórios e Auditoria",
                "text-teal-400",
                "bg-teal-600/10"
              )}
            </>
          )}
        </nav>
      </div>

      {/* Seletor de Perfil Dinâmico no Rodapé */}
      <div className="border-t border-zinc-800 pt-6 space-y-4">
        
        {/* Toggle para testar RBAC */}
        <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl space-y-2">
          <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Perfil de Acesso (Teste RBAC)</span>
          <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => onChangeRole("admin")}
              className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition ${
                usuario.role === "admin" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-zinc-550 hover:text-zinc-300"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onChangeRole("operador")}
              className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition ${
                usuario.role === "operador" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-zinc-550 hover:text-zinc-300"
              }`}
            >
              Caixa
            </button>
          </div>
        </div>

        {/* Status de Login */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
            {usuario.role === "admin" ? <Building2 size={16} /> : <UserCheck size={16} className="text-emerald-400" />}
          </div>
          <div>
            <p className="text-xs font-bold text-white truncate max-w-[150px]">{usuario.nome}</p>
            <span className="text-[10px] font-mono text-zinc-550 font-bold uppercase">
              {usuario.role === "admin" ? "Administrador" : "Operador Caixa"}
            </span>
          </div>
        </div>

      </div>
    </aside>
  );
}
