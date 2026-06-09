import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class EstoqueService {
  /**
   * Registra uma movimentação física no estoque (ENTRADA ou SAIDA) e ajusta o saldo do produto.
   * Executado de forma isolada dentro de uma Transação do Prisma ($transaction).
   */
  static async registrarMovimentacao(params: {
    empresaId: string;
    produtoId: string;
    usuarioId?: string;
    tipo: "ENTRADA" | "SAIDA";
    quantidade: number;
    motivo: string;
  }) {
    const { empresaId, produtoId, usuarioId, tipo, quantidade, motivo } = params;

    if (quantidade <= 0) {
      throw new Error("A quantidade de movimentação deve ser maior que zero.");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Localizar o produto na empresa para checar saldo
      const produto = await tx.produto.findFirst({
        where: { id: produtoId, empresaId },
      });

      if (!produto) {
        throw new Error("Produto não encontrado para esta empresa.");
      }

      const estoqueAtualNum = Number(produto.estoqueAtual);
      let novoEstoque = estoqueAtualNum;

      if (tipo === "ENTRADA") {
        novoEstoque += quantidade;
      } else if (tipo === "SAIDA") {
        if (estoqueAtualNum < quantidade) {
          throw new Error(`Saldo de estoque insuficiente. Estoque disponível: ${estoqueAtualNum} un. Solicitado: ${quantidade} un.`);
        }
        novoEstoque -= quantidade;
      } else {
        throw new Error("Tipo de movimentação inválido. Use 'ENTRADA' ou 'SAIDA'.");
      }

      // 2. Atualizar o saldo de estoque atual do produto
      const produtoAtualizado = await tx.produto.update({
        where: { id: produtoId },
        data: {
          estoqueAtual: new Prisma.Decimal(novoEstoque.toFixed(3)),
        },
      });

      // 3. Salvar o log histórico da movimentação para auditoria
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          empresaId,
          produtoId,
          usuarioId: usuarioId || null,
          tipo,
          quantidade: new Prisma.Decimal(quantidade.toFixed(3)),
          motivo,
        },
      });

      return { produto: produtoAtualizado, movimentacao };
    });
  }

  /**
   * Retorna os produtos que estão com estoque atual menor ou igual ao estoque mínimo.
   */
  static async buscarEstoqueCritico(empresaId: string) {
    const produtos = await prisma.produto.findMany({
      where: { empresaId },
    });

    // Filtra na memória para evitar problemas de conversão de Decimal no SQLite
    return produtos.filter(p => {
      if (p.estoqueMinimo === null) return false;
      return Number(p.estoqueAtual) <= Number(p.estoqueMinimo);
    });
  }
}
