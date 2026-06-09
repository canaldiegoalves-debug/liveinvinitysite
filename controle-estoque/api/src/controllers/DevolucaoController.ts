import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Gera código único de vale-crédito no formato VALE-XXXXX
 */
function gerarCodigoVale(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem ambíguos (0/O, 1/I)
  let codigo = "VALE-";
  for (let i = 0; i < 8; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

export class DevolucaoController {
  /**
   * POST /api/estoque/devolucao
   *
   * Payload:
   * {
   *   itens: [{ produtoId, quantidade }],
   *   motivo: "DEFEITO" | "TAMANHO_ERRADO" | "TROCA" | "OUTRO",
   *   observacao?: string,
   *   clienteId?: string,        // se informado, gera vale-crédito
   *   gerarVale?: boolean,       // default: true se clienteId informado
   * }
   */
  async registrarDevolucao(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { itens, motivo, observacao, clienteId, gerarVale } = req.body;

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: "Itens da devolução são obrigatórios." });
      }

      if (!motivo) {
        return res.status(400).json({ error: "Motivo da devolução é obrigatório." });
      }

      const motivosValidos = ["DEFEITO", "TAMANHO_ERRADO", "TROCA", "OUTRO"];
      if (!motivosValidos.includes(motivo)) {
        return res.status(400).json({ error: `Motivo inválido. Use: ${motivosValidos.join(", ")}.` });
      }

      const result = await prisma.$transaction(async (tx) => {
        let valorTotal = 0;
        const itensProcessados = [];

        // 1. Processar cada item: validar produto e devolver ao estoque
        for (const item of itens) {
          const produto = await tx.produto.findFirst({
            where: { id: item.produtoId, empresaId },
          });

          if (!produto) {
            throw new Error(`Produto ${item.produtoId} não localizado.`);
          }

          const qtd = Number(item.quantidade);
          if (qtd <= 0) throw new Error("Quantidade inválida.");

          // Devolver ao estoque (entrada)
          const novoEstoque = Number(produto.estoqueAtual) + qtd;
          await tx.produto.update({
            where: { id: produto.id },
            data: { estoqueAtual: new Prisma.Decimal(novoEstoque.toFixed(3)) },
          });

          // Log de auditoria de estoque
          await tx.movimentacaoEstoque.create({
            data: {
              empresaId,
              produtoId: produto.id,
              tipo: "ENTRADA",
              quantidade: new Prisma.Decimal(qtd.toFixed(3)),
              motivo: `Devolução — ${motivo}`,
            },
          });

          const precoVenda = Number(produto.precoVenda);
          const precoCusto = Number(produto.precoCusto);
          valorTotal += precoVenda * qtd;

          itensProcessados.push({
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: qtd,
            precoCusto,
            precoVenda,
          });
        }

        // 2. Criar registro de Devolucao (cabeçalho + itens)
        const devolucao = await tx.devolucao.create({
          data: {
            empresaId,
            clienteId: clienteId || null,
            valorTotal: new Prisma.Decimal(valorTotal.toFixed(2)),
            motivo,
            observacao: observacao || null,
            itens: {
              create: itensProcessados.map((it) => ({
                produtoId: it.produtoId,
                quantidade: new Prisma.Decimal(it.quantidade.toFixed(3)),
                precoCusto: new Prisma.Decimal(it.precoCusto.toFixed(2)),
                precoVenda: new Prisma.Decimal(it.precoVenda.toFixed(2)),
              })),
            },
          },
          include: { itens: true },
        });

        // 3. Gerar Vale-Crédito se houver cliente e gerarVale !== false
        let valeCredito = null;
        if (clienteId && gerarVale !== false) {
          // Garantir código único (retry até 3 vezes)
          let codigoUnico = "";
          for (let tentativa = 0; tentativa < 3; tentativa++) {
            codigoUnico = gerarCodigoVale();
            const existe = await tx.valeCredito.findUnique({ where: { codigoUnico } });
            if (!existe) break;
          }

          valeCredito = await tx.valeCredito.create({
            data: {
              empresaId,
              clienteId,
              devolucaoId: devolucao.id,
              codigoUnico,
              valorInicial: new Prisma.Decimal(valorTotal.toFixed(2)),
              valorAtual: new Prisma.Decimal(valorTotal.toFixed(2)),
              status: "ATIVO",
            },
          });
        }

        return {
          devolucaoId: devolucao.id,
          valorTotal,
          motivo,
          itens: itensProcessados,
          valeCredito: valeCredito
            ? {
                id: valeCredito.id,
                codigoUnico: valeCredito.codigoUnico,
                valorInicial: Number(valeCredito.valorInicial),
                valorAtual: Number(valeCredito.valorAtual),
                status: valeCredito.status,
              }
            : null,
        };
      });

      return res.status(201).json({
        message: "Devolução registrada com sucesso! Estoque reabastecido.",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/vale-credito/:codigo
   * Valida e retorna os dados do vale-crédito para o PDV
   */
  async consultarVale(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { codigo } = req.params;

      const vale = await prisma.valeCredito.findFirst({
        where: {
          codigoUnico: codigo.toUpperCase().trim(),
          empresaId,
        },
        include: {
          cliente: { select: { nome: true, cpfCnpj: true } },
        },
      });

      if (!vale) {
        return res.status(404).json({ error: "Vale-crédito não encontrado." });
      }

      if (vale.status === "UTILIZADO") {
        return res.status(400).json({ error: "Este vale-crédito já foi totalmente utilizado." });
      }

      return res.json({
        id: vale.id,
        codigoUnico: vale.codigoUnico,
        valorInicial: Number(vale.valorInicial),
        valorAtual: Number(vale.valorAtual),
        status: vale.status,
        cliente: vale.cliente,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/estoque/devolucoes
   * Lista devoluções da empresa para o módulo de gestão
   */
  async listarDevolucoes(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const devolucoes = await prisma.devolucao.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          cliente: { select: { nome: true, cpfCnpj: true } },
          itens: {
            include: { produto: { select: { nome: true, codigoBarras: true } } },
          },
          valeCredito: { select: { codigoUnico: true, valorAtual: true, status: true } },
        },
      });

      return res.json(devolucoes);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
