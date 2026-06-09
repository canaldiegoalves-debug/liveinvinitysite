import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class OrcamentoController {
  /**
   * Criar um Orçamento com status ABERTO
   */
  async create(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { clienteId, itens } = req.body;

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: "Itens do orçamento são obrigatórios." });
      }

      const result = await prisma.$transaction(async (tx) => {
        let valorTotal = 0;
        const itensParaCriar = [];

        // Validar e calcular os itens
        for (const item of itens) {
          const produto = await tx.produto.findFirst({
            where: { id: item.produtoId, empresaId },
          });

          if (!produto) {
            throw new Error(`Produto com ID ${item.produtoId} não foi localizado.`);
          }

          const precoVendaNum = Number(produto.precoVenda);
          const quantidadeNum = Number(item.quantidade);
          valorTotal += precoVendaNum * quantidadeNum;

          itensParaCriar.push({
            produtoId: produto.id,
            quantidade: new Prisma.Decimal(quantidadeNum.toFixed(3)),
            precoVenda: new Prisma.Decimal(precoVendaNum.toFixed(2)),
          });
        }

        // Criar cabeçalho do orçamento
        const orcamento = await tx.orcamento.create({
          data: {
            empresaId,
            clienteId: clienteId || null,
            valorTotal: new Prisma.Decimal(valorTotal.toFixed(2)),
            status: "ABERTO",
            itens: {
              create: itensParaCriar,
            },
          },
          include: {
            itens: {
              include: {
                produto: {
                  select: { nome: true, codigoBarras: true },
                },
              },
            },
            cliente: {
              select: { nome: true },
            },
          },
        });

        return orcamento;
      });

      return res.status(201).json({
        message: "Orçamento gerado com sucesso!",
        orcamento: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Listar todos os orçamentos da empresa
   */
  async list(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      
      const orcamentos = await prisma.orcamento.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          cliente: {
            select: { nome: true, cpfCnpj: true },
          },
          itens: {
            include: {
              produto: {
                select: { nome: true },
              },
            },
          },
        },
      });

      return res.json(orcamentos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Buscar orçamento aberto para carregar no PDV
   */
  async getById(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const orcamento = await prisma.orcamento.findFirst({
        where: { id, empresaId },
        include: {
          cliente: {
            select: { id: true, nome: true, cpfCnpj: true, telefone: true, saldoDevedor: true },
          },
          itens: {
            include: {
              produto: {
                select: { id: true, nome: true, codigoBarras: true, precoVenda: true, precoCusto: true, estoqueAtual: true },
              },
            },
          },
        },
      });

      if (!orcamento) {
        return res.status(444).json({ error: "Orçamento não localizado." });
      }

      if (orcamento.status !== "ABERTO") {
        return res.status(400).json({ error: `Este orçamento já está finalizado ou expirado (Status: ${orcamento.status}).` });
      }

      return res.json(orcamento);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cancelar ou expirar orçamento
   */
  async cancelar(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const orcamento = await prisma.orcamento.findFirst({
        where: { id, empresaId },
      });

      if (!orcamento) {
        return res.status(404).json({ error: "Orçamento não localizado." });
      }

      if (orcamento.status !== "ABERTO") {
        return res.status(400).json({ error: "Apenas orçamentos com status ABERTO podem ser expirados/cancelados." });
      }

      const updated = await prisma.orcamento.update({
        where: { id },
        data: { status: "EXPIRADO" },
      });

      return res.json({
        message: "Orçamento expirado com sucesso!",
        orcamento: updated,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
