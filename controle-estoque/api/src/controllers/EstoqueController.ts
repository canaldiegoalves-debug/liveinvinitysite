import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { EstoqueService } from "../services/EstoqueService";
import { prisma } from "../lib/prisma";

export class EstoqueController {
  // Ajustar o estoque manualmente (Entrada ou Saída para Auditoria/Ajuste Físico)
  async ajustarEstoque(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { produtoId, tipo, quantidade, motivo } = req.body;

      if (!produtoId || !tipo || !quantidade || !motivo) {
        return res.status(400).json({ error: "Parâmetros de ajuste incompletos." });
      }

      const result = await EstoqueService.registrarMovimentacao({
        empresaId,
        produtoId,
        usuarioId,
        tipo,
        quantidade: parseFloat(quantidade),
        motivo,
      });

      return res.status(200).json({
        message: "Estoque ajustado com sucesso!",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Listar produtos em estado crítico de estoque
  async getEstoqueCritico(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const criticos = await EstoqueService.buscarEstoqueCritico(empresaId);
      return res.json(criticos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Consultar histórico de movimentações da empresa (Log de Auditoria completo)
  async listMovimentacoes(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { produtoId } = req.query;

      const where: any = { empresaId };
      if (produtoId) {
        where.produtoId = String(produtoId);
      }

      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          produto: {
            select: { nome: true, codigoBarras: true },
          },
          usuario: {
            select: { nome: true, email: true },
          },
        },
      });

      return res.json(movimentacoes);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
