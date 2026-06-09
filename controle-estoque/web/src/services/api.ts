import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@estoqueSaaS:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Database em LocalStorage para o Modo Demo (caso a API não esteja rodando)
const initMockDB = () => {
  const defaultClientes = [
    { id: "c-1", empresaId: "demo-tenant-id", nome: "João Silva", cpfCnpj: "123.456.789-00", telefone: "(11) 98888-7777", endereco: "Rua das Flores, 123", saldoDevedor: 0.00, createdAt: new Date().toISOString() },
    { id: "c-2", empresaId: "demo-tenant-id", nome: "Maria Souza", cpfCnpj: "987.654.321-11", telefone: "(21) 97777-6666", endereco: "Av. Principal, 456", saldoDevedor: 150.00, createdAt: new Date().toISOString() }
  ];

  const defaultContasReceber = [
    { id: "cr-1", empresaId: "demo-tenant-id", clienteId: "c-2", vendaId: "venda-demo-123", valor: 150.00, dataVencimento: new Date(Date.now() + 15*24*60*60*1000).toISOString(), status: "PENDENTE", valorPago: 0.00, createdAt: new Date().toISOString() }
  ];

  const defaultUsuarios = [
    { id: "demo-user-id", nome: "Operador Demonstrativo", email: "demo@estoque.com", role: "admin", empresaId: "demo-tenant-id", percentualComissao: 2.50 },
    { id: "vendedor-1", nome: "Carlos Vendedor", email: "carlos@valora.com", role: "operador", empresaId: "demo-tenant-id", percentualComissao: 5.00 },
    { id: "vendedor-2", nome: "Ana Santos (Vendas)", email: "ana@valora.com", role: "operador", empresaId: "demo-tenant-id", percentualComissao: 3.50 }
  ];

  const defaultComissoes = [
    {
      id: "comissao-1",
      empresaId: "demo-tenant-id",
      vendedorId: "vendedor-1",
      vendaId: "venda-demo-123",
      valorVenda: 150.00,
      valorComissao: 7.50,
      status: "PAGO",
      dataCompetencia: new Date(Date.now() - 24*60*60*1000).toISOString(),
      createdAt: new Date(Date.now() - 24*60*60*1000).toISOString()
    },
    {
      id: "comissao-2",
      empresaId: "demo-tenant-id",
      vendedorId: "vendedor-2",
      vendaId: "venda-demo-456",
      valorVenda: 300.00,
      valorComissao: 10.50,
      status: "PENDENTE",
      dataCompetencia: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  const defaultTurnos = [
    {
      id: "turno-1",
      empresaId: "demo-tenant-id",
      usuarioId: "demo-user-id",
      status: "FECHADO",
      valorAbertura: 100.00,
      valorFechamentoDinheiro: 450.00,
      valorFechamentoInformado: 450.00,
      createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      closedAt: new Date(Date.now() - 2*24*60*60*1000 + 8*60*60*1000).toISOString()
    },
    {
      id: "turno-2",
      empresaId: "demo-tenant-id",
      usuarioId: "vendedor-1",
      status: "FECHADO",
      valorAbertura: 50.00,
      valorFechamentoDinheiro: 250.00,
      valorFechamentoInformado: 245.00,
      createdAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
      closedAt: new Date(Date.now() - 24*60*60*1000 + 6*60*60*1000).toISOString()
    }
  ];

  const defaultLancamentos = [
    {
      id: "l-1",
      empresaId: "demo-tenant-id",
      tipo: "RECEITA",
      valor: 350.00,
      status: "PAGO",
      dataVencimento: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
      dataPagamento: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
      motivo: "Venda PDV #1002",
      createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString()
    },
    {
      id: "l-2",
      empresaId: "demo-tenant-id",
      tipo: "DESPESA",
      valor: 120.00,
      status: "PAGO",
      dataVencimento: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      dataPagamento: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      motivo: "Compra de Embalagens Plásticas",
      createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString()
    },
    {
      id: "l-3",
      empresaId: "demo-tenant-id",
      tipo: "RECEITA",
      valor: 1500.00,
      status: "PAGO",
      dataVencimento: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
      dataPagamento: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
      motivo: "Recebimento Parcela Crediário João Silva",
      createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString()
    },
    {
      id: "l-4",
      empresaId: "demo-tenant-id",
      tipo: "DESPESA",
      valor: 250.00,
      status: "PAGO",
      dataVencimento: new Date().toISOString(),
      dataPagamento: new Date().toISOString(),
      motivo: "Conta de Energia Elétrica (Copel)",
      createdAt: new Date().toISOString()
    }
  ];

  if (!localStorage.getItem("@estoqueSaaS:mockDB")) {
    const defaultData = {
      empresas: [
        { id: "demo-tenant-id", nomeFantasia: "Empresa de Demonstração", cnpj: "12.345.678/0001-90" }
      ],
      usuarios: defaultUsuarios,
      produtos: [
        {
          id: "1",
          empresaId: "demo-tenant-id",
          codigoBarras: "7891000100203",
          nome: "Detergente Líquido Limão 500ml",
          precoCusto: 2.20,
          precoVenda: 3.50,
          lucroPercentual: 59.09,
          estoqueAtual: 45,
          estoqueMinimo: 15,
        },
        {
          id: "2",
          empresaId: "demo-tenant-id",
          codigoBarras: "7892000200405",
          nome: "Arroz Agulhinha Tipo 1 5kg",
          precoCusto: 18.50,
          precoVenda: 24.90,
          lucroPercentual: 34.59,
          estoqueAtual: 8,
          estoqueMinimo: 10,
        },
        {
          id: "3",
          empresaId: "demo-tenant-id",
          codigoBarras: "7893000300607",
          nome: "Sabão em Pó Concentrado 1kg",
          precoCusto: 8.90,
          precoVenda: 14.99,
          lucroPercentual: 68.43,
          estoqueAtual: 22,
          estoqueMinimo: 5,
        }
      ],
      notasFiscais: [
        {
          id: "nf-1",
          empresaId: "demo-tenant-id",
          numero: "000.124.981",
          serie: "1",
          chaveAcesso: "35230912345678000190550010001249811002345678",
          emitenteNome: "Distribuidora de Alimentos S/A",
          emitenteCnpj: "00.111.222/0001-33",
          valorTotal: 462.50,
          dataEmissao: new Date().toISOString(),
          itensCount: 3
        }
      ],
      clientes: defaultClientes,
      contasReceber: defaultContasReceber,
      comissoes: defaultComissoes,
      turnos: defaultTurnos,
      caixaMovimentacoes: [],
      vendas: [],
      devolucoes: [],
      valesCredito: [],
      orcamentos: [],
      lancamentos: defaultLancamentos,
    };
    localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(defaultData));
  } else {
    // Se já houver mockDB, garantir que tenhamos as tabelas 'clientes', 'contasReceber', 'comissoes' e usuários migrados
    try {
      const data = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
      let updated = false;
      if (!data.clientes) {
        data.clientes = defaultClientes;
        updated = true;
      }
      if (!data.contasReceber) {
        data.contasReceber = defaultContasReceber;
        updated = true;
      }
      if (!data.comissoes || data.comissoes.length === 0) {
        data.comissoes = defaultComissoes;
        updated = true;
      }
      if (!data.turnos || data.turnos.length === 0) {
        data.turnos = defaultTurnos;
        updated = true;
      }
      if (!data.caixaMovimentacoes) {
        data.caixaMovimentacoes = [];
        updated = true;
      }
      if (!data.vendas) {
        data.vendas = [];
        updated = true;
      }
      if (!data.devolucoes) {
        data.devolucoes = [];
        updated = true;
      }
      if (!data.valesCredito) {
        data.valesCredito = [];
        updated = true;
      }
      if (!data.orcamentos) {
        data.orcamentos = [];
        updated = true;
      }
      if (!data.lancamentos || data.lancamentos.length === 0) {
        data.lancamentos = defaultLancamentos;
        updated = true;
      }
      // Garantir que todos os usuários tenham percentualComissao
      if (data.usuarios) {
        const hasPct = data.usuarios.every((u: any) => u.percentualComissao !== undefined);
        if (!hasPct || data.usuarios.length < 3) {
          data.usuarios = defaultUsuarios;
          updated = true;
        }
      } else {
        data.usuarios = defaultUsuarios;
        updated = true;
      }
      if (updated) {
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Erro ao migrar mockDB:", e);
    }
  }
};

initMockDB();

export const getMockDB = () => {
  return JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
};

export const saveMockDB = (data: any) => {
  localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(data));
};

export default api;
