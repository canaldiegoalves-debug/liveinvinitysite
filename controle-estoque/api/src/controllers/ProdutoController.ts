import { Response } from "express";
import { prisma } from "../lib/prisma";
import { CustomRequest } from "../middlewares/tenant";
import { Prisma } from "@prisma/client";

export class ProdutoController {
  // Criar Produto
  async create(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { codigoBarras, nome, precoCusto, precoVenda, lucroPercentual, estoqueAtual, estoqueMinimo, ncm, csosn } = req.body;

      if (!nome) {
        return res.status(400).json({ error: "Nome do produto é obrigatório" });
      }

      // Lógica de Precificação Dinâmica
      let custo = parseFloat(precoCusto) || 0;
      let venda = parseFloat(precoVenda) || 0;
      let lucro = parseFloat(lucroPercentual) || 0;

      if (custo > 0) {
        if (venda > 0 && lucroPercentual === undefined) {
          // Calcula a margem se custo e venda forem informados
          lucro = ((venda - custo) / custo) * 100;
        } else if (lucro > 0 && precoVenda === undefined) {
          // Calcula a venda se custo e lucro forem informados
          venda = custo * (1 + lucro / 100);
        } else if (lucro > 0 && venda > 0) {
          // Se todos os 3 forem enviados, prioriza o lucro e recalcula a venda ou vice-versa
          venda = custo * (1 + lucro / 100);
        }
      }

      // Validar código de barras duplicado para esta empresa
      if (codigoBarras) {
        const prodExists = await prisma.produto.findFirst({
          where: { codigoBarras, empresaId },
        });
        if (prodExists) {
          return res.status(400).json({ error: "Já existe um produto cadastrado com este código de barras nesta empresa" });
        }
      }

      const produto = await prisma.produto.create({
        data: {
          empresaId,
          codigoBarras: codigoBarras || null,
          nome,
          precoCusto: new Prisma.Decimal(custo.toFixed(2)),
          precoVenda: new Prisma.Decimal(venda.toFixed(2)),
          lucroPercentual: new Prisma.Decimal(lucro.toFixed(2)),
          estoqueAtual: new Prisma.Decimal((parseFloat(estoqueAtual) || 0).toFixed(3)),
          estoqueMinimo: estoqueMinimo ? new Prisma.Decimal(parseFloat(estoqueMinimo).toFixed(3)) : null,
          ncm: ncm || null,
          csosn: csosn || null,
        },
      });

      return res.status(201).json(produto);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Listar Produtos (com suporte a busca por código de barras e nome)
  async list(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { busca, codigoBarras } = req.query;

      const where: any = { empresaId };

      if (codigoBarras) {
        where.codigoBarras = String(codigoBarras);
      } else if (busca) {
        where.OR = [
          { nome: { contains: String(busca), mode: "insensitive" } },
          { codigoBarras: { contains: String(busca), mode: "insensitive" } },
        ];
      }

      const produtos = await prisma.produto.findMany({
        where,
        orderBy: { nome: "asc" },
      });

      return res.json(produtos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Buscar Produto específico por ID
  async getById(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const produto = await prisma.produto.findFirst({
        where: { id, empresaId },
      });

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.json(produto);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Buscar por Código de Barras
  async getByBarcode(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { barcode } = req.params;

      const produto = await prisma.produto.findFirst({
        where: { codigoBarras: barcode, empresaId },
      });

      if (!produto) {
        return res.status(404).json({ error: "Produto com código de barras não encontrado" });
      }

      return res.json(produto);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Atualizar Produto
  async update(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const { codigoBarras, nome, precoCusto, precoVenda, lucroPercentual, estoqueAtual, estoqueMinimo, ncm, csosn } = req.body;

      const produto = await prisma.produto.findFirst({
        where: { id, empresaId },
      });

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Validar código de barras duplicado
      if (codigoBarras && codigoBarras !== produto.codigoBarras) {
        const prodExists = await prisma.produto.findFirst({
          where: { codigoBarras, empresaId, id: { not: id } },
        });
        if (prodExists) {
          return res.status(400).json({ error: "Já existe um produto com este código de barras" });
        }
      }

      let custo = precoCusto !== undefined ? parseFloat(precoCusto) : Number(produto.precoCusto);
      let venda = precoVenda !== undefined ? parseFloat(precoVenda) : Number(produto.precoVenda);
      let lucro = lucroPercentual !== undefined ? parseFloat(lucroPercentual) : Number(produto.lucroPercentual);

      // Recalcular precificação
      if (custo > 0) {
        if (precoVenda !== undefined && lucroPercentual === undefined) {
          lucro = ((venda - custo) / custo) * 100;
        } else if (lucroPercentual !== undefined && precoVenda === undefined) {
          venda = custo * (1 + lucro / 100);
        } else if (precoCusto !== undefined && precoVenda === undefined && lucroPercentual === undefined) {
          // Se só o custo mudou, recalcula a venda baseada no lucro anterior
          venda = custo * (1 + lucro / 100);
        }
      }

      const updated = await prisma.produto.update({
        where: { id },
        data: {
          codigoBarras: codigoBarras !== undefined ? (codigoBarras || null) : undefined,
          nome: nome || undefined,
          precoCusto: new Prisma.Decimal(custo.toFixed(2)),
          precoVenda: new Prisma.Decimal(venda.toFixed(2)),
          lucroPercentual: new Prisma.Decimal(lucro.toFixed(2)),
          estoqueAtual: estoqueAtual !== undefined ? new Prisma.Decimal(parseFloat(estoqueAtual).toFixed(3)) : undefined,
          estoqueMinimo: estoqueMinimo !== undefined ? (estoqueMinimo ? new Prisma.Decimal(parseFloat(estoqueMinimo).toFixed(3)) : null) : undefined,
          ncm: ncm !== undefined ? (ncm || null) : undefined,
          csosn: csosn !== undefined ? (csosn || null) : undefined,
        },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Deletar Produto
  async delete(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const produto = await prisma.produto.findFirst({
        where: { id, empresaId },
      });

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      await prisma.produto.delete({
        where: { id },
      });

      return res.json({ message: "Produto deletado com sucesso" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
