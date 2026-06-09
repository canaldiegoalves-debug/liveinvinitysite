import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { ProdutoController } from "../controllers/ProdutoController";
import { NotaFiscalController } from "../controllers/NotaFiscalController";
import { EstoqueController } from "../controllers/EstoqueController";
import { ClienteController } from "../controllers/ClienteController";
import { VendaController } from "../controllers/VendaController";
import { UsuarioController } from "../controllers/UsuarioController";
import { CaixaController } from "../controllers/CaixaController";
import { DevolucaoController } from "../controllers/DevolucaoController";
import { OrcamentoController } from "../controllers/OrcamentoController";
import { FinanceiroController } from "../controllers/FinanceiroController";
import { SuperAdminController } from "../controllers/SuperAdminController";
import { authMiddleware, tenantMiddleware, authorizeRoles } from "../middlewares/tenant";
import multer from "multer";


const routes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const authController = new AuthController();
const produtoController = new ProdutoController();
const notaFiscalController = new NotaFiscalController();
const estoqueController = new EstoqueController();
const clienteController = new ClienteController();
const vendaController = new VendaController();
const usuarioController = new UsuarioController();
const caixaController = new CaixaController();
const devolucaoController = new DevolucaoController();
const orcamentoController = new OrcamentoController();
const financeiroController = new FinanceiroController();
const superAdminController = new SuperAdminController();


// Rotas de Autenticação
routes.post("/auth/register", authController.register);
routes.post("/auth/login", authController.login);

// Rotas de Produtos
routes.post("/produtos", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), produtoController.create);
routes.get("/produtos", authMiddleware, tenantMiddleware, produtoController.list);
routes.get("/produtos/:id", authMiddleware, tenantMiddleware, produtoController.getById);
routes.get("/produtos/barcode/:barcode", authMiddleware, tenantMiddleware, produtoController.getByBarcode);
routes.put("/produtos/:id", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), produtoController.update);
routes.delete("/produtos/:id", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), produtoController.delete);

// Rotas de Notas Fiscais
routes.post("/notas-fiscais/upload", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), upload.single("xml"), notaFiscalController.uploadXml);
routes.get("/notas-fiscais", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), notaFiscalController.list);
routes.get("/notas-fiscais/:id", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), notaFiscalController.getById);

// Rotas de Histórico e Auditoria de Estoque
routes.post("/estoque/ajuste", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), estoqueController.ajustarEstoque);
routes.get("/estoque/movimentacoes", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), estoqueController.listMovimentacoes);
routes.get("/estoque/critico", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), estoqueController.getEstoqueCritico);

// Rotas de Clientes
routes.get("/clientes", authMiddleware, tenantMiddleware, clienteController.list);
routes.post("/clientes", authMiddleware, tenantMiddleware, clienteController.create);

// Rotas de Vendas e Crediário
routes.post("/vendas/checkout", authMiddleware, tenantMiddleware, vendaController.checkout);
routes.get("/financeiro/contas-receber", authMiddleware, tenantMiddleware, vendaController.listContasReceber);

// Rotas de Vendedores
routes.get("/vendedores", authMiddleware, tenantMiddleware, usuarioController.listVendedores);

// Rotas de Controle de Caixa
routes.get("/caixa/turno-atual", authMiddleware, tenantMiddleware, caixaController.obterTurnoAtual);
routes.get("/caixa/turnos", authMiddleware, tenantMiddleware, caixaController.listarTurnos);
routes.post("/caixa/abrir", authMiddleware, tenantMiddleware, caixaController.abrirTurno);
routes.post("/caixa/fechar", authMiddleware, tenantMiddleware, caixaController.fecharTurno);
routes.post("/caixa/movimentacao", authMiddleware, tenantMiddleware, caixaController.registrarMovimentacao);

// Rotas de Devoluções, Trocas e Vale-Crédito
routes.post("/estoque/devolucao", authMiddleware, tenantMiddleware, devolucaoController.registrarDevolucao);
routes.get("/estoque/devolucoes", authMiddleware, tenantMiddleware, devolucaoController.listarDevolucoes);
routes.get("/vale-credito/:codigo", authMiddleware, tenantMiddleware, devolucaoController.consultarVale);

// Rotas de Orçamentos e Condicionais
routes.post("/orcamentos", authMiddleware, tenantMiddleware, orcamentoController.create);
routes.get("/orcamentos", authMiddleware, tenantMiddleware, orcamentoController.list);
routes.get("/orcamentos/:id", authMiddleware, tenantMiddleware, orcamentoController.getById);
routes.put("/orcamentos/:id/cancelar", authMiddleware, tenantMiddleware, orcamentoController.cancelar);

// Rotas de Relatórios Financeiros e Auditoria
routes.get("/financeiro/comissoes", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), vendaController.listComissoes);
routes.get("/financeiro/lancamentos", authMiddleware, tenantMiddleware, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), financeiroController.listarLancamentos);

// Rotas do Super Admin
routes.get("/super/empresas", authMiddleware, authorizeRoles("SUPER_ADMIN"), superAdminController.listEmpresas);
routes.post("/super/empresas", authMiddleware, authorizeRoles("SUPER_ADMIN"), superAdminController.createEmpresa);
routes.put("/super/empresas/:id/status", authMiddleware, authorizeRoles("SUPER_ADMIN"), superAdminController.updateEmpresaStatus);
routes.get("/super/metricas", authMiddleware, authorizeRoles("SUPER_ADMIN"), superAdminController.getMetricas);

export default routes;

