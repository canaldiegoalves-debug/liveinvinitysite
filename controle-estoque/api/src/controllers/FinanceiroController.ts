import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";

export class FinanceiroController {
  // Listar lançamentos financeiros (movimentação de receitas e despesas)
  async listarLancamentos(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const lancamentos = await prisma.lancamentoFinanceiro.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" }
      });
      return res.json(lancamentos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
