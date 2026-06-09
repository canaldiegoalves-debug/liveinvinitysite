import { useState, useEffect, useRef } from "react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { ScanBarcode, Trash2, ShoppingCart, CheckCircle, Package, Search, X, FileText } from "lucide-react";
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

type Cliente = {
  id: string;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  saldoDevedor: number;
};

type Vendedor = {
  id: string;
  nome: string;
  email: string;
  role: string;
  percentualComissao: number;
};

type ItemVenda = {
  produto: Produto;
  quantidade: number;
};

interface VendaRapidaProps {
  loadData: () => Promise<void>;
  isDemoMode: boolean;
}

export function VendaRapida({ loadData, isDemoMode }: VendaRapidaProps) {
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [ultimoProduto, setUltimoProduto] = useState<Produto | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [caixaAberto, setCaixaAberto] = useState(true);

  const verificarCaixa = async () => {
    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const turnoAberto = localDB.turnos?.find((t: any) => t.status === "ABERTO");
        setCaixaAberto(!!turnoAberto);
      } else {
        const res = await api.get("/caixa/turno-atual");
        setCaixaAberto(res.data.status === "ABERTO");
      }
    } catch (err) {
      console.error("Erro ao verificar status do caixa:", err);
      setCaixaAberto(false);
    }
  };
  const [manualEan, setManualEan] = useState("");
  const [desconto, setDesconto] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Pagamentos Múltiplos
  const [pagDinheiro,  setPagDinheiro]  = useState<string>("");
  const [pagCartao,    setPagCartao]    = useState<string>("");
  const [pagPix,       setPagPix]       = useState<string>("");
  const [pagCrediario, setPagCrediario] = useState<string>("");

  // Estados do Vale-Crédito
  const [pagValeCodigo, setPagValeCodigo]   = useState<string>("");
  const [valeInfo, setValeInfo]             = useState<{ id: string; valorAtual: number; cliente?: { nome: string } | null } | null>(null);
  const [valeStatus, setValeStatus]         = useState<"idle" | "loading" | "valid" | "error">("idle");
  const [valeErro, setValeErro]             = useState<string>("");
  const [pagVale, setPagVale]               = useState<string>("");

  // Estados de Cliente e Vendedor
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);

  // Estados do Orçamento (F8)
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [orcamentoQueryId, setOrcamentoQueryId] = useState("");
  const [orcamentoError, setOrcamentoError] = useState("");
  const orcamentoInputRef = useRef<HTMLInputElement>(null);

  // Estados do Modal de Busca Manual (F1)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados do Modal de Seleção de Cliente (F5)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [clienteSearchQuery, setClienteSearchQuery] = useState("");

  // Lista de Vendedores
  const [vendedoresList, setVendedoresList] = useState<Vendedor[]>([]);

  // Cadastro Rápido de Cliente
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");
  const [novoClienteEndereco, setNovoClienteEndereco] = useState("");

  // Referências para foco dinâmico
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const modalSearchInputRef = useRef<HTMLInputElement>(null);
  const modalClienteSearchInputRef = useRef<HTMLInputElement>(null);

  // Cálculos de Totais e Valores Derivados
  const subtotal = carrinho.reduce((acc, item) => acc + (item.quantidade * item.produto.precoVenda), 0);
  const totalVenda = Math.max(0, subtotal - desconto);

  // Valores numéricos dos pagamentos
  const numDinheiro  = parseFloat(pagDinheiro)  || 0;
  const numCartao    = parseFloat(pagCartao)    || 0;
  const numPix       = parseFloat(pagPix)       || 0;
  const numCrediario = parseFloat(pagCrediario) || 0;
  const numVale      = Math.min(parseFloat(pagVale) || 0, valeInfo?.valorAtual || 0);
  const totalPago    = numDinheiro + numCartao + numPix + numCrediario + numVale;

  // Função para obter o saldo restante para um método de pagamento específico
  const obterRestantePara = (metodo: "dinheiro" | "cartao" | "pix" | "crediario") => {
    let somaOutros = 0;
    if (metodo !== "dinheiro")  somaOutros += numDinheiro;
    if (metodo !== "cartao")    somaOutros += numCartao;
    if (metodo !== "pix")       somaOutros += numPix;
    if (metodo !== "crediario") somaOutros += numCrediario;
    somaOutros += numVale;
    return Math.max(0, totalVenda - somaOutros);
  };

  // Função para injetar o saldo restante
  const injetarSaldoRestante = (metodo: "dinheiro" | "cartao" | "pix" | "crediario") => {
    if (carrinho.length === 0) return;
    
    const restante = obterRestantePara(metodo);
    const restanteStr = restante > 0 ? restante.toFixed(2) : "";

    if (metodo === "dinheiro") {
      setPagDinheiro(restanteStr);
    } else if (metodo === "cartao") {
      setPagCartao(restanteStr);
    } else if (metodo === "pix") {
      setPagPix(restanteStr);
    } else if (metodo === "crediario") {
      setPagCrediario(restanteStr);
      if (restante > 0 && !clienteSelecionado) {
        carregarClientes();
        setIsClienteModalOpen(true);
        setTimeout(() => modalClienteSearchInputRef.current?.focus(), 150);
      }
    }
  };

  // Foco automático inicial no campo de código de barras
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Carrega vendedores na inicialização do componente
  useEffect(() => {
    carregarVendedores();
    verificarCaixa();
  }, [isDemoMode]);

  // Efeito Sonoro de Bip do Leitor de Código de Barras (Nativo via AudioContext)
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(950, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("AudioContext não pôde ser iniciado:", e);
    }
  };

  // Carrega produtos para a busca manual (F1)
  const carregarProdutosParaBusca = async () => {
    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setTodosProdutos(localDB.produtos || []);
      } else {
        const res = await api.get("/produtos");
        setTodosProdutos(res.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de produtos:", err);
    }
  };

  // Carrega clientes para seleção (F5)
  const carregarClientes = async () => {
    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setClientesList(localDB.clientes || []);
      } else {
        const res = await api.get("/clientes");
        setClientesList(res.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de clientes:", err);
    }
  };

  // Carrega a lista de vendedores (usuários)
  const carregarVendedores = async () => {
    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        setVendedoresList(localDB.usuarios || []);
      } else {
        const res = await api.get("/vendedores");
        setVendedoresList(res.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de vendedores:", err);
    }
  };

  // Gerenciamento global de atalhos de teclado (F1, F2, F5, F7, F8, F9, F10, F11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Busca Manual
      if (e.key === "F1") {
        e.preventDefault();
        carregarProdutosParaBusca();
        setIsSearchModalOpen(true);
        setTimeout(() => modalSearchInputRef.current?.focus(), 150);
      }
      
      // F2: Finalizar Venda
      if (e.key === "F2") {
        e.preventDefault();
        if (caixaAberto && carrinho.length > 0) {
          finalizarVenda();
        }
      }

      // F5: Selecionar Cliente
      if (e.key === "F5") {
        e.preventDefault();
        carregarClientes();
        setIsClienteModalOpen(true);
        setTimeout(() => modalClienteSearchInputRef.current?.focus(), 150);
      }
      
      // F7: Focar no Desconto
      if (e.key === "F7") {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      }

      // F8: Puxar Orçamento
      if (e.key === "F8") {
        e.preventDefault();
        if (caixaAberto) {
          setOrcamentoError("");
          setOrcamentoQueryId("");
          setIsOrcamentoModalOpen(true);
          setTimeout(() => orcamentoInputRef.current?.focus(), 150);
        }
      }

      // F9: Injetar Saldo Restante em Dinheiro
      if (e.key === "F9") {
        e.preventDefault();
        injetarSaldoRestante("dinheiro");
      }

      // F10: Injetar Saldo Restante em Cartão
      if (e.key === "F10") {
        e.preventDefault();
        injetarSaldoRestante("cartao");
      }

      // F11: Injetar Saldo Restante em Pix
      if (e.key === "F11") {
        e.preventDefault();
        injetarSaldoRestante("pix");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carrinho, desconto, clienteSelecionado, vendedorSelecionado, isDemoMode, caixaAberto, pagDinheiro, pagCartao, pagPix, pagCrediario, pagVale, valeInfo, totalVenda]);

  // Captura global de código de barras
  useBarcodeScanner((barcode) => {
    // Se algum modal ou input de desconto/cliente estiver ativo, ignora a interceptação global
    if (
      isSearchModalOpen || 
      isClienteModalOpen || 
      document.activeElement === discountInputRef.current
    ) return;
    handleBiparProduto(barcode);
  });

  const handlePuxarOrcamento = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orcamentoQueryId.trim()) return;
    setOrcamentoError("");
    setIsLoading(true);
    try {
      let orcamentoData = null;
      if (isDemoMode) {
        const db = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        orcamentoData = db.orcamentos?.find((o: any) => o.id === orcamentoQueryId.trim()) || null;
      } else {
        const res = await api.get(`/orcamentos/${orcamentoQueryId.trim()}`);
        orcamentoData = res.data;
      }

      if (!orcamentoData) {
        setOrcamentoError("Orçamento não localizado ou já expirado.");
        setIsLoading(false);
        return;
      }

      if (orcamentoData.status !== "ABERTO") {
        setOrcamentoError(`Este orçamento já está ${orcamentoData.status}.`);
        setIsLoading(false);
        return;
      }

      // Carregar itens para o carrinho
      const novosItens = orcamentoData.itens.map((i: any) => ({
        produto: {
          id: i.produto.id,
          nome: i.produto.nome,
          codigoBarras: i.produto.codigoBarras,
          precoVenda: Number(i.precoVenda || i.produto.precoVenda),
          precoCusto: Number(i.produto.precoCusto || 0),
          estoqueAtual: Number(i.produto.estoqueAtual || 0),
          lucroPercentual: Number(i.produto.lucroPercentual || 0),
          estoqueMinimo: i.produto.estoqueMinimo || null,
        },
        quantidade: Number(i.quantidade),
      }));

      setCarrinho(novosItens);
      setOrcamentoId(orcamentoData.id);

      // Carregar cliente
      if (orcamentoData.cliente) {
        setClienteSelecionado({
          id: orcamentoData.cliente.id || "c-demo",
          nome: orcamentoData.cliente.nome,
          cpfCnpj: orcamentoData.cliente.cpfCnpj || null,
          telefone: orcamentoData.cliente.telefone || null,
          endereco: orcamentoData.cliente.endereco || null,
          saldoDevedor: Number(orcamentoData.cliente.saldoDevedor || 0),
        });
      } else {
        setClienteSelecionado(null);
      }

      setSuccessMsg(`Orçamento #${orcamentoData.id.replace("orc-", "")} carregado com sucesso!`);
      setIsOrcamentoModalOpen(false);
      setOrcamentoQueryId("");
    } catch (err: any) {
      setOrcamentoError(err.response?.data?.error || err.message || "Erro ao buscar orçamento.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiparProduto = async (barcode: string) => {
    if (!caixaAberto) {
      alert("O caixa está FECHADO. Abra o caixa na aba 'Controle de Caixa' antes de realizar vendas.");
      return;
    }
    setIsLoading(true);
    try {
      let produto: Produto | null = null;

      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const encontrado = localDB.produtos?.find((p: any) => p.codigoBarras === barcode);
        if (encontrado) {
          produto = encontrado;
        }
      } else {
        const res = await api.get(`/produtos/barcode/${barcode}`);
        if (res.data) {
          produto = res.data;
        }
      }

      if (!produto) {
        alert(`Produto com código EAN ${barcode} não foi localizado no cadastro.`);
        barcodeInputRef.current?.focus();
        return;
      }

      adicionarAoCarrinho(produto);
    } catch (err: any) {
      alert("Erro ao buscar produto: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    if (!caixaAberto) {
      alert("O caixa está FECHADO. Abra o caixa na aba 'Controle de Caixa' antes de adicionar itens.");
      return;
    }
    playBeepSound();
    setUltimoProduto(produto);

    setCarrinho(prev => {
      const index = prev.findIndex(item => item.produto.codigoBarras === produto.codigoBarras);
      if (index !== -1) {
        return prev.map((item, idx) => 
          idx === index 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prev, { produto, quantidade: 1 }];
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEan) return;
    handleBiparProduto(manualEan);
    setManualEan("");
  };

  const removerItem = (barcode: string) => {
    const novoCarrinho = carrinho.filter(i => i.produto.codigoBarras !== barcode);
    setCarrinho(novoCarrinho);
    if (ultimoProduto?.codigoBarras === barcode) {
      setUltimoProduto(novoCarrinho.length > 0 ? novoCarrinho[novoCarrinho.length - 1].produto : null);
    }
  };

  const cadastrarClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClienteNome) return;

    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const novo: Cliente = {
          id: "c-" + Date.now(),
          nome: novoClienteNome,
          cpfCnpj: novoClienteCpfCnpj || null,
          telefone: novoClienteTelefone || null,
          endereco: novoClienteEndereco || null,
          saldoDevedor: 0.00
        };
        localDB.clientes = [novo, ...(localDB.clientes || [])];
        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(localDB));
        setClientesList(localDB.clientes);
        setClienteSelecionado(novo);
      } else {
        const res = await api.post("/clientes", {
          nome: novoClienteNome,
          cpfCnpj: novoClienteCpfCnpj,
          telefone: novoClienteTelefone,
          endereco: novoClienteEndereco
        });
        setClienteSelecionado(res.data);
        carregarClientes();
      }

      setIsNovoClienteOpen(false);
      setIsClienteModalOpen(false);
      setNovoClienteNome("");
      setNovoClienteCpfCnpj("");
      setNovoClienteTelefone("");
      setNovoClienteEndereco("");
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      alert("Erro ao cadastrar cliente: " + (err.response?.data?.error || err.message));
    }
  };

  // Consulta vale-crédito quando o código é digitado
  const consultarVale = async (codigo: string) => {
    const codigoLimpo = codigo.toUpperCase().trim();
    if (codigoLimpo.length < 5) {
      setValeInfo(null);
      setValeStatus("idle");
      setPagVale("");
      return;
    }
    setValeStatus("loading");
    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const vale = localDB.valesCredito?.find((v: any) =>
          v.codigoUnico === codigoLimpo && v.status !== "UTILIZADO"
        );
        if (vale && vale.valorAtual > 0) {
          setValeInfo({ id: vale.id, valorAtual: vale.valorAtual, cliente: vale.clienteNome ? { nome: vale.clienteNome } : null });
          setValeStatus("valid");
          setValeErro("");
        } else {
          setValeInfo(null);
          setValeStatus("error");
          setValeErro(vale ? "Vale já utilizado ou sem saldo." : "Vale não encontrado.");
          setPagVale("");
        }
      } else {
        const res = await api.get(`/vale-credito/${codigoLimpo}`);
        setValeInfo({ id: res.data.id, valorAtual: res.data.valorAtual, cliente: res.data.cliente });
        setValeStatus("valid");
        setValeErro("");
      }
    } catch (err: any) {
      setValeInfo(null);
      setValeStatus("error");
      setValeErro(err.response?.data?.error || "Vale não encontrado.");
      setPagVale("");
    }
  };

  const finalizarVenda = async () => {
    if (!caixaAberto) {
      alert("O caixa está FECHADO. Abra o caixa na aba 'Controle de Caixa' antes de finalizar vendas.");
      return;
    }
    if (carrinho.length === 0) return;
    if (numCrediario > 0 && !clienteSelecionado) {
      alert("Selecione um cliente (F5) para realizar a venda com crediário.");
      return;
    }
    if (totalPago < totalVenda - 0.01) {
      alert(`O valor informado (R$ ${totalPago.toFixed(2)}) é menor que o total da venda (R$ ${totalVenda.toFixed(2)}).`);
      return;
    }
    setIsLoading(true);

    const pagamentosPayload = {
      dinheiro:  numDinheiro,
      cartao:    numCartao,
      pix:       numPix,
      crediario: numCrediario,
      vale:      numVale,
      valeId:    valeInfo?.id || null,
    };

    try {
      if (isDemoMode) {
        const localDB = JSON.parse(localStorage.getItem("@estoqueSaaS:mockDB") || "{}");
        const turnoAtivo = localDB.turnos?.find((t: any) => t.status === "ABERTO");
        const prodsAtualizados = localDB.produtos.map((p: any) => {
          const itemCarrinho = carrinho.find(item => item.produto.id === p.id);
          if (itemCarrinho) {
            return { ...p, estoqueAtual: Math.max(0, p.estoqueAtual - itemCarrinho.quantidade) };
          }
          return p;
        });

        const novasMovimentacoes = carrinho.map(item => ({
          id: "m-" + Date.now() + Math.random(),
          tipo: "SAIDA",
          quantidade: item.quantidade,
          motivo: "Venda PDV",
          createdAt: new Date().toISOString(),
          produto: { nome: item.produto.nome, codigoBarras: item.produto.codigoBarras }
        }));

        localDB.produtos = prodsAtualizados;
        localDB.movimentacoes = [...novasMovimentacoes, ...(localDB.movimentacoes || [])];

        const vendaId = "venda-" + Date.now();

        // Comissão do vendedor no modo Demo
        if (vendedorSelecionado) {
          const pct = Number(vendedorSelecionado.percentualComissao) || 0;
          if (pct > 0) {
            const valorComissao = (totalVenda * pct) / 100;
            localDB.comissoes = [{
              id: "com-" + Date.now(),
              empresaId: "demo-tenant-id",
              usuarioId: vendedorSelecionado.id,
              vendaId,
              valorVenda: Number(totalVenda.toFixed(2)),
              valorComissao: Number(valorComissao.toFixed(2)),
              status: "PENDENTE",
              dataCompetencia: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }, ...(localDB.comissoes || [])];
          }
        }

        // Crediário no modo Demo: atualiza cliente e gera ContaReceber
        if (numCrediario > 0 && clienteSelecionado) {
          localDB.clientes = localDB.clientes.map((c: any) => {
            if (c.id === clienteSelecionado.id) {
              return { ...c, saldoDevedor: Number((Number(c.saldoDevedor) + numCrediario).toFixed(2)) };
            }
            return c;
          });

          const dataVencimento = new Date();
          dataVencimento.setDate(dataVencimento.getDate() + 30);
          localDB.contasReceber = [{
            id: "cr-" + Date.now(),
            empresaId: "demo-tenant-id",
            clienteId: clienteSelecionado.id,
            vendaId,
            valor: Number(numCrediario.toFixed(2)),
            dataVencimento: dataVencimento.toISOString(),
            status: "PENDENTE",
            valorPago: 0.00,
            createdAt: new Date().toISOString()
          }, ...(localDB.contasReceber || [])];
        }

        // Lançamento financeiro à vista
        const valorAVista = numDinheiro + numCartao + numPix + numVale;
        if (valorAVista > 0) {
          localDB.lancamentos = [{
            id: "lf-" + Date.now(),
            empresaId: "demo-tenant-id",
            tipo: "RECEITA",
            valor: Number(valorAVista.toFixed(2)),
            status: "PAGO",
            dataVencimento: new Date().toISOString(),
            dataPagamento: new Date().toISOString(),
            motivo: `Venda PDV - Ref: ${vendaId}`,
            createdAt: new Date().toISOString()
          }, ...(localDB.lancamentos || [])];
        }

        // Abater vale-crédito no modo demo
        if (numVale > 0 && valeInfo) {
          localDB.valesCredito = (localDB.valesCredito || []).map((v: any) => {
            if (v.id === valeInfo.id) {
              const novoValor = Math.max(0, Number(v.valorAtual) - numVale);
              return { ...v, valorAtual: Number(novoValor.toFixed(2)), status: novoValor <= 0.01 ? "UTILIZADO" : "PARCIAL" };
            }
            return v;
          });
        }

        // Marcar orçamento como APROVADO no modo demo
        if (orcamentoId) {
          localDB.orcamentos = (localDB.orcamentos || []).map((o: any) =>
            o.id === orcamentoId ? { ...o, status: "APROVADO" } : o
          );
        }

        // Salvar cabeçalho da venda
        const condicaoPagamento = numCrediario > 0 && (numDinheiro + numCartao + numPix) > 0
          ? "MULTIPLO"
          : numCrediario > 0 ? "A_PRAZO" : "A_VISTA";

        localDB.vendas = [{
          id: vendaId,
          empresaId: "demo-tenant-id",
          vendedorId: vendedorSelecionado?.id || null,
          clienteId: clienteSelecionado?.id || null,
          turnoId: turnoAtivo?.id || null,
          orcamentoId: orcamentoId || null,
          valorTotal: totalVenda,
          desconto: desconto,
          condicaoPagamento,
          pagoDinheiro: numDinheiro,
          pagoCartao: numCartao,
          pagoPix: numPix,
          pagoCrediario: numCrediario,
          createdAt: new Date().toISOString()
        }, ...(localDB.vendas || [])];

        localStorage.setItem("@estoqueSaaS:mockDB", JSON.stringify(localDB));
        await loadData();
      } else {
        // API real: Rota transacional de checkout com múltiplos pagamentos
        await api.post("/vendas/checkout", {
          itens: carrinho.map(item => ({ produtoId: item.produto.id, quantidade: item.quantidade })),
          pagamentos: pagamentosPayload,
          clienteId: clienteSelecionado?.id || null,
          desconto: desconto,
          vendedorId: vendedorSelecionado?.id || null,
          orcamentoId: orcamentoId || null,
        });
        await loadData();
      }

      setSuccessMsg("Venda finalizada! Estoque e financeiro atualizados.");
      setCarrinho([]);
      setUltimoProduto(null);
      setDesconto(0);
      setClienteSelecionado(null);
      setVendedorSelecionado(null);
      setOrcamentoId(null);
      setPagDinheiro("");
      setPagCartao("");
      setPagPix("");
      setPagCrediario("");
      setPagValeCodigo("");
      setPagVale("");
      setValeInfo(null);
      setValeStatus("idle");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert("Erro ao fechar venda: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  // Filtragem dos produtos no modal F1
  const produtosFiltrados = todosProdutos.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(searchQuery))
  );

  // Filtragem dos clientes no modal F5
  const clientesFiltrados = clientesList.filter(c => 
    c.nome.toLowerCase().includes(clienteSearchQuery.toLowerCase()) || 
    (c.cpfCnpj && c.cpfCnpj.includes(clienteSearchQuery))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-zinc-100">
      
      {!caixaAberto && (
        <div className="lg:col-span-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center font-bold text-lg animate-pulse">
              ⚠️
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white uppercase tracking-wide">CAIXA FECHADO</h4>
              <p className="text-xs text-zinc-400">Você deve realizar a abertura do caixa antes de registrar vendas. Vá até a aba "Controle de Caixa".</p>
            </div>
          </div>
        </div>
      )}

      {/* Lado Esquerdo (60% / Col-span 7): Tabela de Itens (Cupom Virtual) */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-[650px] shadow-2xl relative">
        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          
          {/* Header do Cupom */}
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h4 className="font-extrabold text-white flex items-center gap-2 text-md tracking-wide">
                <ShoppingCart size={18} className="text-indigo-400" /> CUPOM FISCAL VIRTUAL
              </h4>
              {orcamentoId && (
                <div className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                  <span>🎟️ ORÇAMENTO: #{orcamentoId.replace("orc-", "")}</span>
                  <button
                    onClick={() => { setOrcamentoId(null); setCarrinho([]); setClienteSelecionado(null); }}
                    className="hover:text-red-400 text-sky-500 transition font-black"
                    title="Desvincular Orçamento"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrcamentoError("");
                  setOrcamentoQueryId("");
                  setIsOrcamentoModalOpen(true);
                  setTimeout(() => orcamentoInputRef.current?.focus(), 150);
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-sky-450 rounded-lg text-[10px] font-bold transition uppercase"
              >
                Puxar Orçamento (F8)
              </button>
              <span className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                Balcão NFC-e
              </span>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-y-auto flex-1 pr-1">
            {carrinho.length === 0 ? (
              <div className="text-center py-32 text-zinc-550 flex flex-col items-center gap-3">
                <Package size={42} className="text-zinc-650 animate-pulse" />
                <span className="text-sm font-semibold tracking-wide">FRENTE DE CAIXA LIVRE - AGUARDANDO BIPAGEM</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">Cód/EAN</th>
                    <th className="py-2.5 font-semibold">Descrição</th>
                    <th className="py-2.5 font-semibold text-center">Qtd</th>
                    <th className="py-2.5 font-semibold text-right">Unitário</th>
                    <th className="py-2.5 font-semibold text-right">Total</th>
                    <th className="py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/50 text-sm">
                  {carrinho.map((item) => (
                    <tr key={item.produto.id} className="hover:bg-zinc-850/20 group transition-colors duration-150">
                      <td className="py-3 font-mono text-xs text-zinc-400">
                        {item.produto.codigoBarras}
                      </td>
                      <td className="py-3 font-bold text-white max-w-[200px] truncate">
                        {item.produto.nome}
                      </td>
                      <td className="py-3 text-center font-bold text-zinc-350">
                        {item.quantidade}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-350">
                        R$ {Number(item.produto.precoVenda).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        R$ {(item.quantidade * item.produto.precoVenda).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => removerItem(item.produto.codigoBarras || "")}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition duration-150 opacity-0 group-hover:opacity-100"
                          title="Remover Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Status de Venda com feedback visual */}
        {successMsg && (
          <div className="absolute bottom-6 left-6 right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs flex items-center gap-2 font-bold animate-pulse shadow-md">
            <CheckCircle size={16} className="shrink-0" /> {successMsg}
          </div>
        )}
      </div>

      {/* Lado Direito (40% / Col-span 5): Painel de Leitura e Fechamento */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Painel do Código de Barras (Foco) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-650 to-indigo-700"></div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ScanBarcode size={16} className="text-indigo-400 animate-pulse" /> LEITOR CÓDIGO BARRAS
            </span>
            <span className="text-[10px] bg-zinc-800 text-zinc-450 border border-zinc-700 px-1.5 py-0.5 rounded font-mono font-bold">
              SCANNER ATIVO
            </span>
          </div>

          <form onSubmit={handleManualSubmit}>
            <input 
              ref={barcodeInputRef}
              type="text" 
              placeholder={caixaAberto ? "Aponte o leitor ou bipe aqui..." : "Abra o caixa para habilitar as vendas"} 
              value={manualEan}
              onChange={(e) => setManualEan(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-center text-lg tracking-widest placeholder-zinc-700 shadow-inner disabled:opacity-50"
              disabled={isLoading || !caixaAberto}
            />
          </form>
        </div>

        {/* Detalhes do Último Item Bipado */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 flex-1 flex flex-col justify-center min-h-[160px]">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-850 pb-2">
            ÚLTIMO PRODUTO BIPADO
          </span>
          {ultimoProduto ? (
            <div className="space-y-2.5 py-1 animate-fade-in">
              <h3 className="text-lg font-bold text-white truncate">{ultimoProduto.nome}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400">
                <div>
                  <span className="text-zinc-500 block text-[10px]">CÓDIGO DE BARRAS</span>
                  <span>{ultimoProduto.codigoBarras}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">SALDO ESTOQUE</span>
                  <span className={ultimoProduto.estoqueAtual <= (ultimoProduto.estoqueMinimo ?? 0) ? "text-red-400 font-bold" : ""}>
                    {ultimoProduto.estoqueAtual} un
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">PREÇO UNITÁRIO</span>
                  <span className="text-emerald-400 font-bold text-sm">R$ {Number(ultimoProduto.precoVenda).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-600 text-xs font-semibold uppercase tracking-wider">
              Nenhum item lido no momento
            </div>
          )}
        </div>

        {/* Bloco de Totais, Pagamento e Fechamento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          {/* Vendedor e Seleção de Cliente */}
          <div className="space-y-3 pb-3 border-b border-zinc-850">
            
            {/* Seletor de Vendedor Responsável */}
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Vendedor Responsável
              </span>
              <select
                value={vendedorSelecionado?.id || ""}
                onChange={(e) => {
                  const vend = vendedoresList.find(v => v.id === e.target.value);
                  setVendedorSelecionado(vend || null);
                }}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold transition cursor-pointer"
              >
                <option value="" className="bg-zinc-900 text-zinc-500 font-bold">Sem Vendedor (Venda Direta)</option>
                {vendedoresList.map(v => (
                  <option key={v.id} value={v.id} className="bg-zinc-900 text-zinc-100 font-bold">
                    {v.nome} ({Number(v.percentualComissao).toFixed(1)}% comissão)
                  </option>
                ))}
              </select>
              {vendedorSelecionado && (
                <div className="text-[10px] text-emerald-400 font-bold flex justify-between px-1">
                  <span>Comissão Estimada:</span>
                  <span>R$ {((totalVenda * (Number(vendedorSelecionado.percentualComissao) || 0)) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Cliente Selecionado (obrigatório para crediário) */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex items-center justify-between gap-2 transition duration-150">
              {clienteSelecionado ? (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[10px] text-zinc-550 font-bold uppercase">Cliente (F5)</span>
                    {numCrediario > 0 && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded uppercase font-bold">
                        Crediário
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs truncate mt-0.5">{clienteSelecionado.nome}</h4>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex justify-between">
                    <span>CPF/CNPJ: {clienteSelecionado.cpfCnpj || "Não informado"}</span>
                    <span className="text-red-400 font-bold">Débito: R$ {Number(clienteSelecionado.saldoDevedor).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-center py-1">
                  <p className="text-zinc-500 text-[11px] font-bold">Nenhum cliente selecionado</p>
                  <p className="text-[9px] text-zinc-650 mt-0.5">Pressione F5 — obrigatório para crediário</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  carregarClientes();
                  setIsClienteModalOpen(true);
                  setTimeout(() => modalClienteSearchInputRef.current?.focus(), 150);
                }}
                className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-850 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] transition shrink-0 uppercase"
              >
                {clienteSelecionado ? "Alterar" : "Selecionar"}
              </button>
            </div>
          </div>

          {/* Subtotal e Desconto */}
          <div className="space-y-2 pb-3 border-b border-zinc-850">
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Subtotal</span>
              <span className="font-bold text-white font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-zinc-400 text-sm py-1">
              <span>Desconto (F7)</span>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-550 font-mono text-xs">R$</span>
                <input 
                  ref={discountInputRef}
                  type="number" 
                  step="0.01" min="0" max={subtotal}
                  value={desconto || ""}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2 py-1.5 text-right font-mono font-bold text-white focus:outline-none focus:border-indigo-500 w-32 shadow-inner"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Total da Venda */}
          <div className="flex justify-between items-baseline py-1">
            <span className="text-xs text-zinc-450 font-extrabold uppercase tracking-wider">Valor Final</span>
            <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
              R$ {totalVenda.toFixed(2)}
            </span>
          </div>

          {/* ===== GRADE DE FORMAS DE PAGAMENTO ===== */}
          <div className="space-y-2.5">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block border-t border-zinc-850 pt-3">
              Formas de Pagamento
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Dinheiro */}
              <div className="bg-zinc-900 border border-zinc-800/60 p-2.5 rounded-xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>💵</span> Dinheiro
                  </label>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">F9</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550 font-mono text-xs">R$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={pagDinheiro}
                    onChange={(e) => setPagDinheiro(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-7 pr-2 py-1.5 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => injetarSaldoRestante("dinheiro")}
                  disabled={carrinho.length === 0}
                  className="w-full py-1.5 bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 disabled:opacity-40 rounded-lg text-[9px] font-extrabold uppercase transition tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                >
                  <span>Saldo Restante</span>
                  <span className="font-mono text-[8px] opacity-85">R$ {obterRestantePara("dinheiro").toFixed(2)}</span>
                </button>
              </div>

              {/* Cartão */}
              <div className="bg-zinc-900 border border-zinc-800/60 p-2.5 rounded-xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>💳</span> Cartão
                  </label>
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">F10</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550 font-mono text-xs">R$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={pagCartao}
                    onChange={(e) => setPagCartao(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-7 pr-2 py-1.5 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => injetarSaldoRestante("cartao")}
                  disabled={carrinho.length === 0}
                  className="w-full py-1.5 bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 disabled:opacity-40 rounded-lg text-[9px] font-extrabold uppercase transition tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                >
                  <span>Saldo Restante</span>
                  <span className="font-mono text-[8px] opacity-85">R$ {obterRestantePara("cartao").toFixed(2)}</span>
                </button>
              </div>

              {/* Pix */}
              <div className="bg-zinc-900 border border-zinc-800/60 p-2.5 rounded-xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>⚡</span> Pix
                  </label>
                  <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono font-bold">F11</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550 font-mono text-xs">R$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={pagPix}
                    onChange={(e) => setPagPix(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-7 pr-2 py-1.5 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-sky-500 shadow-inner"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => injetarSaldoRestante("pix")}
                  disabled={carrinho.length === 0}
                  className="w-full py-1.5 bg-sky-600/10 hover:bg-sky-600/25 text-sky-400 border border-sky-500/20 disabled:opacity-40 rounded-lg text-[9px] font-extrabold uppercase transition tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                >
                  <span>Saldo Restante</span>
                  <span className="font-mono text-[8px] opacity-85">R$ {obterRestantePara("pix").toFixed(2)}</span>
                </button>
              </div>

              {/* Crediário */}
              <div className="bg-zinc-900 border border-zinc-800/60 p-2.5 rounded-xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    numCrediario > 0 && !clienteSelecionado ? "text-red-400" : "text-amber-400"
                  }`}>
                    <span>📋</span> Crediário
                    {numCrediario > 0 && !clienteSelecionado && (
                      <span className="text-red-400 ml-1">⚠ Cliente!</span>
                    )}
                  </label>
                  <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">Rest.</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550 font-mono text-xs">R$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={pagCrediario}
                    onChange={(e) => {
                      setPagCrediario(e.target.value);
                      if (parseFloat(e.target.value) > 0 && !clienteSelecionado) {
                        carregarClientes();
                        setIsClienteModalOpen(true);
                        setTimeout(() => modalClienteSearchInputRef.current?.focus(), 150);
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full bg-zinc-950 border rounded-lg pl-7 pr-2 py-1.5 text-right font-mono font-bold text-white text-xs focus:outline-none shadow-inner ${
                      numCrediario > 0 && !clienteSelecionado
                        ? "border-red-500/60 focus:border-red-400"
                        : "border-zinc-850 focus:border-amber-500"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => injetarSaldoRestante("crediario")}
                  disabled={carrinho.length === 0}
                  className="w-full py-1.5 bg-amber-600/10 hover:bg-amber-600/25 text-amber-400 border border-amber-500/20 disabled:opacity-40 rounded-lg text-[9px] font-extrabold uppercase transition tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                >
                  <span>Saldo Restante</span>
                  <span className="font-mono text-[8px] opacity-85">R$ {obterRestantePara("crediario").toFixed(2)}</span>
                </button>
              </div>
            </div>

            {/* Vale-Crédito (linha extra, largura total) */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-850">
              <label className="text-[10px] text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>🎟️</span> Vale-Crédito
                {valeStatus === "valid" && valeInfo && (
                  <span className="ml-auto text-emerald-400 font-mono text-[10px]">
                    Saldo: R$ {valeInfo.valorAtual.toFixed(2)}
                  </span>
                )}
              </label>

              {/* Campo de código do vale */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pagValeCodigo}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setPagValeCodigo(val);
                    setPagVale("");
                    if (val.length >= 8) consultarVale(val);
                    else { setValeInfo(null); setValeStatus("idle"); }
                  }}
                  placeholder="Ex: VALE-AB12CD34"
                  maxLength={13}
                  className={`flex-1 bg-zinc-950 border rounded-lg px-3 py-2 font-mono text-white text-xs font-bold focus:outline-none shadow-inner tracking-widest uppercase placeholder-zinc-700 ${
                    valeStatus === "valid" ? "border-violet-500/60 focus:border-violet-400" :
                    valeStatus === "error" ? "border-red-500/50 focus:border-red-400" :
                    "border-zinc-800 focus:border-violet-500"
                  }`}
                />
                {valeStatus === "loading" && (
                  <div className="flex items-center px-3 text-zinc-400 text-xs animate-pulse font-bold">
                    Validando...
                  </div>
                )}
              </div>

              {/* Feedback do vale */}
              {valeStatus === "error" && (
                <p className="text-[10px] text-red-400 font-bold">⛔ {valeErro}</p>
              )}
              {valeStatus === "valid" && valeInfo && (
                <div className="space-y-1">
                  <p className="text-[10px] text-emerald-400 font-bold">
                    ✅ Vale válido{valeInfo.cliente ? ` — ${valeInfo.cliente.nome}` : ""}
                  </p>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">R$</span>
                    <input
                      type="number" step="0.01" min="0"
                      max={valeInfo.valorAtual}
                      value={pagVale}
                      onChange={(e) => {
                        const val = Math.min(parseFloat(e.target.value) || 0, valeInfo.valorAtual);
                        setPagVale(val > 0 ? val.toFixed(2) : e.target.value);
                      }}
                      placeholder={`Até R$ ${valeInfo.valorAtual.toFixed(2)}`}
                      className="w-full bg-zinc-950 border border-violet-500/40 rounded-lg pl-8 pr-2 py-2 text-right font-mono font-bold text-violet-300 text-sm focus:outline-none focus:border-violet-400 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>


            {/* Indicador Reativo: Falta Pagar / Troco */}
            {carrinho.length > 0 && (() => {
              const falta = totalVenda - totalPago;
              // Troco: apenas sobre o excesso em dinheiro além do necessário
              const restanteParaDinheiro = Math.max(0, totalVenda - numCartao - numPix - numCrediario - numVale);
              const troco = Math.max(0, numDinheiro - restanteParaDinheiro);


              if (falta > 0.01) {
                return (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">⛔ Falta Pagar</span>
                    <span className="font-black text-red-400 font-mono text-lg">R$ {falta.toFixed(2)}</span>
                  </div>
                );
              } else if (troco > 0.01) {
                return (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">💚 Troco</span>
                    <span className="font-black text-emerald-400 font-mono text-lg">R$ {troco.toFixed(2)}</span>
                  </div>
                );
              } else if (totalPago > 0) {
                return (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-2.5 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">✅ Valor OK</span>
                    <span className="font-bold text-zinc-300 font-mono text-sm">R$ {totalPago.toFixed(2)} recebido</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Botão Fechar Venda */}
          <div className="pt-1">
            {(() => {
              const falta = totalVenda - totalPago;
              const crediarioSemCliente = numCrediario > 0 && !clienteSelecionado;
              const isDisabled = !caixaAberto || carrinho.length === 0 || isLoading || falta > 0.01 || crediarioSemCliente || totalPago <= 0;
              return (
                <button
                  onClick={finalizarVenda}
                  disabled={isDisabled}
                  className={`w-full py-4 disabled:opacity-40 text-white rounded-xl font-extrabold text-md transition duration-200 shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${
                    !caixaAberto
                      ? "bg-zinc-800 cursor-not-allowed shadow-none"
                      : crediarioSemCliente
                        ? "bg-red-700 cursor-not-allowed"
                        : numCrediario > 0
                          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10"
                          : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10"
                  }`}
                >
                  {!caixaAberto ? "CAIXA FECHADO" : crediarioSemCliente ? "SELECIONE CLIENTE (F5)" : "FECHAR VENDA (F2)"}
                </button>
              );
            })()}
          </div>

          {/* Guia de atalhos geral */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-zinc-850 text-[9px] text-zinc-550 font-bold text-center">
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-indigo-400 font-mono">F1</kbd>
              <span>Pesquisar</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-emerald-400 font-mono">F2</kbd>
              <span>Finalizar</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-amber-400 font-mono">F5</kbd>
              <span>Cliente</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-indigo-400 font-mono">F7</kbd>
              <span>Desconto</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-sky-400 font-mono">F8</kbd>
              <span>Orçamento</span>
            </div>
          </div>

          {/* Guia de atalhos de injeção de saldo */}
          <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-[9px] text-zinc-550 font-bold text-center">
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-emerald-400 font-mono">F9</kbd>
              <span>Saldo Dinheiro</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-indigo-400 font-mono">F10</kbd>
              <span>Saldo Cartão</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 flex flex-col gap-0.5">
              <kbd className="text-sky-400 font-mono">F11</kbd>
              <span>Saldo Pix</span>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Busca Manual de Produtos (F1) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Header do Modal */}
            <div className="bg-zinc-955 p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white flex items-center gap-2 tracking-wide uppercase text-sm">
                <Search size={18} className="text-indigo-400" /> PESQUISA MANUAL DE CADASTRO
              </h3>
              <button 
                onClick={() => {
                  setIsSearchModalOpen(false);
                  barcodeInputRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Input de Pesquisa */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
              <input 
                ref={modalSearchInputRef}
                type="text"
                placeholder="Digite o nome do produto ou EAN para pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-medium placeholder-zinc-650"
              />
            </div>

            {/* Tabela de Produtos */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800/60 p-2">
              {produtosFiltrados.length === 0 ? (
                <div className="text-center py-10 text-zinc-550 text-xs font-bold uppercase">
                  Nenhum produto cadastrado corresponde à busca
                </div>
              ) : (
                produtosFiltrados.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      adicionarAoCarrinho(prod);
                      setIsSearchModalOpen(false);
                      setSearchQuery("");
                      barcodeInputRef.current?.focus();
                    }}
                    className="w-full text-left p-3 hover:bg-indigo-650/15 rounded-xl transition flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">{prod.nome}</p>
                      <p className="text-[10px] font-mono text-zinc-550">EAN: {prod.codigoBarras}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400 font-mono text-sm">R$ {Number(prod.precoVenda).toFixed(2)}</p>
                      <p className="text-[10px] text-zinc-500">Estoque: {prod.estoqueAtual} un</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer do Modal */}
            <div className="bg-zinc-950 p-4 border-t border-zinc-800 text-[10px] text-zinc-550 font-bold flex justify-between">
              <span>Selecione um produto clicando para inseri-lo no caixa</span>
              <span>Pressione ESC para fechar</span>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Busca / Cadastro Rápido de Cliente (F5) */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Header do Modal */}
            <div className="bg-zinc-955 p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white flex items-center gap-2 tracking-wide uppercase text-sm">
                <Search size={18} className="text-indigo-400" /> SELECIONAR CLIENTE (F5)
              </h3>
              <button 
                onClick={() => {
                  setIsClienteModalOpen(false);
                  setIsNovoClienteOpen(false);
                  barcodeInputRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {!isNovoClienteOpen ? (
              <>
                {/* Input de Pesquisa */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex gap-3">
                  <input 
                    ref={modalClienteSearchInputRef}
                    type="text"
                    placeholder="Nome do cliente ou CPF/CNPJ..."
                    value={clienteSearchQuery}
                    onChange={(e) => setClienteSearchQuery(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-medium placeholder-zinc-650"
                  />
                  <button
                    type="button"
                    onClick={() => setIsNovoClienteOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 font-bold text-xs transition duration-150 shrink-0 uppercase tracking-wider"
                  >
                    + Novo
                  </button>
                </div>

                {/* Lista de Clientes */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800/60 p-2">
                  {clientesFiltrados.length === 0 ? (
                    <div className="text-center py-10 text-zinc-550 text-xs font-bold uppercase space-y-3">
                      <p>Nenhum cliente correspondente</p>
                      <button
                        type="button"
                        onClick={() => setIsNovoClienteOpen(true)}
                        className="text-indigo-455 hover:text-indigo-350 underline"
                      >
                        Cadastrar novo cliente agora
                      </button>
                    </div>
                  ) : (
                    clientesFiltrados.map(cli => (
                      <button
                        key={cli.id}
                        onClick={() => {
                          setClienteSelecionado(cli);
                          setIsClienteModalOpen(false);
                          setClienteSearchQuery("");
                          barcodeInputRef.current?.focus();
                        }}
                        className="w-full text-left p-3 hover:bg-indigo-650/15 rounded-xl transition flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">{cli.nome}</p>
                          <p className="text-[10px] font-mono text-zinc-500">
                            CPF/CNPJ: {cli.cpfCnpj || "Não informado"} | Tel: {cli.telefone || "N/A"}
                          </p>
                          {cli.endereco && <p className="text-[10px] text-zinc-550 truncate max-w-[320px]">{cli.endereco}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`font-mono text-xs font-bold ${cli.saldoDevedor > 0 ? "text-red-400" : "text-zinc-500"}`}>
                            Saldo: R$ {Number(cli.saldoDevedor).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer do Modal */}
                <div className="bg-zinc-950 p-4 border-t border-zinc-800 text-[10px] text-zinc-550 font-bold flex justify-between">
                  <span>Clique para selecionar o cliente para a venda</span>
                  <span>ESC para fechar</span>
                </div>
              </>
            ) : (
              /* Cadastro Rápido de Cliente */
              <form onSubmit={cadastrarClienteRapido} className="p-5 space-y-4">
                <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Cadastro Rápido de Cliente
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nome do cliente"
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">CPF ou CNPJ</label>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        value={novoClienteCpfCnpj}
                        onChange={(e) => setNovoClienteCpfCnpj(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Telefone</label>
                      <input 
                        type="text" 
                        placeholder="(00) 00000-0000"
                        value={novoClienteTelefone}
                        onChange={(e) => setNovoClienteTelefone(e.target.value)}
                        className="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Endereço Residencial</label>
                    <input 
                      type="text" 
                      placeholder="Rua, número, bairro..."
                      value={novoClienteEndereco}
                      onChange={(e) => setNovoClienteEndereco(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNovoClienteOpen(false)}
                    className="bg-zinc-950 hover:bg-zinc-850 text-zinc-450 border border-zinc-800 rounded-xl px-4 py-2 font-bold text-xs uppercase"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-bold text-xs uppercase shadow-md shadow-indigo-600/10"
                  >
                    Salvar e Selecionar
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal de Puxar Orçamento (F8) */}
      {isOrcamentoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="bg-zinc-955 p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white flex items-center gap-2 tracking-wide uppercase text-sm">
                <FileText size={18} className="text-sky-400" /> Importar Orçamento (F8)
              </h3>
              <button 
                onClick={() => {
                  setIsOrcamentoModalOpen(false);
                  barcodeInputRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePuxarOrcamento} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Código do Orçamento</label>
                <input 
                  ref={orcamentoInputRef}
                  type="text" 
                  placeholder="Ex: orc-123456"
                  value={orcamentoQueryId}
                  onChange={(e) => setOrcamentoQueryId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 font-mono text-center text-lg tracking-wider placeholder-zinc-700"
                />
              </div>

              {orcamentoError && (
                <p className="text-[11px] text-red-400 font-bold text-center">{orcamentoError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrcamentoModalOpen(false)}
                  className="w-1/2 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded-xl py-3 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !orcamentoQueryId.trim()}
                  className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-3 font-bold text-xs uppercase shadow-md shadow-sky-650/10 disabled:opacity-40"
                >
                  {isLoading ? "Buscando..." : "Importar"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
