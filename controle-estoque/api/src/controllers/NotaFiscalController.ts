import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { NotaFiscalService } from "../services/NotaFiscalService";
import { prisma } from "../lib/prisma";

export class NotaFiscalController {
  // Processar o upload de XML da Nota Fiscal
  async uploadXml(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId; // ID do usuário autenticado
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo XML foi enviado." });
      }

      // 1. Fazer o parse do XML
      const nfParsed = await NotaFiscalService.parseXml(file.buffer);

      // 2. Gravar no banco de dados e dar entrada no estoque passando o usuarioId
      const nfProcessada = await NotaFiscalService.processarEntradaNota(empresaId, nfParsed, usuarioId);

      // 3. Buscar nota completa com itens para retornar
      const notaCompleta = await prisma.notaFiscal.findUnique({
        where: { id: nfProcessada.id },
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Nota Fiscal processada e estoque atualizado com sucesso!",
        nota: notaCompleta,
      });
    } catch (error: any) {
      console.error("Erro no processamento da NF:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Listar notas fiscais da empresa
  async list(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const notas = await prisma.notaFiscal.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { itens: true },
          },
        },
      });
      return res.json(notas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Obter detalhes de uma Nota Fiscal específica
  async getById(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const nota = await prisma.notaFiscal.findFirst({
        where: { id, empresaId },
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
        },
      });

      if (!nota) {
        return res.status(404).json({ error: "Nota Fiscal não encontrada" });
      }
      return res.json(nota);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
