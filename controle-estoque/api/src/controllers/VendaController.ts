import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class VendaController {
  /**
   * Checkout de Vendas com Múltiplas Formas de Pagamento
   *
   * Payload esperado:
   * {
   *   itens: [{ produtoId, quantidade }],
   *   desconto?: number,
   *   vendedorId?: string,
   *   clienteId?: string,            // obrigatório se houver valor em crediario
   *   pagamentos: {
   *     dinheiro: number,
   *     cartao: number,
   *     pix: number,
   *     crediario: number,
   *   }
   * }
   */
  async checkout(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { itens, pagamentos, clienteId, desconto, vendedorId, orcamentoId } = req.body;

      // --- Validações de entrada ---
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: "Itens da venda são obrigatórios." });
      }

      if (!pagamentos || typeof pagamentos !== "object") {
        return res.status(400).json({ error: "Objeto 'pagamentos' é obrigatório." });
      }

      const pagDinheiro  = parseFloat(pagamentos.dinheiro)  || 0;
      const pagCartao    = parseFloat(pagamentos.cartao)     || 0;
      const pagPix       = parseFloat(pagamentos.pix)        || 0;
      const pagCrediario = parseFloat(pagamentos.crediario)  || 0;
      const totalPago    = pagDinheiro + pagCartao + pagPix + pagCrediario;

      if (totalPago <= 0) {
        return res.status(400).json({ error: "É necessário informar ao menos uma forma de pagamento." });
      }

      // Crediário exige cliente selecionado
      if (pagCrediario > 0 && !clienteId) {
        return res.status(400).json({ error: "Cliente é obrigatório para vendas com crediário/a prazo." });
      }

      // Determinar a condição de pagamento para auditoria
      const formasAtivas = [
        pagDinheiro > 0 && "DINHEIRO",
        pagCartao   > 0 && "CARTAO",
        pagPix      > 0 && "PIX",
        pagCrediario > 0 && "CREDIARIO",
      ].filter(Boolean);

      let condicaoPagamento: string;
      if (formasAtivas.length === 1) {
        if (pagCrediario > 0) condicaoPagamento = "A_PRAZO";
        else condicaoPagamento = "A_VISTA";
      } else {
        condicaoPagamento = "MULTIPLO";
      }

      // Verificar se há turno de caixa aberto para o operador
      const turnoAberto = await prisma.caixaTurno.findFirst({
        where: { empresaId, usuarioId, status: "ABERTO" },
      });

      if (!turnoAberto) {
        return res.status(400).json({ error: "O caixa precisa estar aberto para registrar vendas." });
      }

      // --- Transação Atômica ---
      const result = await prisma.$transaction(async (tx) => {
        // Se houver orçamento vinculado, validá-lo e aprová-lo
        if (orcamentoId) {
          const orcamento = await tx.orcamento.findFirst({
            where: { id: orcamentoId, empresaId },
          });

          if (!orcamento) {
            throw new Error(`Orçamento com ID ${orcamentoId} não foi localizado.`);
          }

          if (orcamento.status !== "ABERTO") {
            throw new Error(`Este orçamento não está mais aberto (Status: ${orcamento.status}).`);
          }

          // Atualizar o status para APROVADO
          await tx.orcamento.update({
            where: { id: orcamentoId },
            data: { status: "APROVADO" },
          });
        }

        let subtotal = 0;
        const itensProcessados = [];

        // 1. Processar cada item e atualizar o estoque
        for (const item of itens) {
          const produto = await tx.produto.findFirst({
            where: { id: item.produtoId, empresaId },
          });

          if (!produto) {
            throw new Error(`Produto com ID ${item.produtoId} não foi localizado.`);
          }

          const precoVendaNum   = Number(produto.precoVenda);
          const quantidadeNum   = Number(item.quantidade);
          subtotal += precoVendaNum * quantidadeNum;

          // Subtrair do estoque físico
          const novoEstoque = Number(produto.estoqueAtual) - quantidadeNum;
          await tx.produto.update({
            where: { id: produto.id },
            data: { estoqueAtual: new Prisma.Decimal(novoEstoque.toFixed(3)) },
          });

          // Log de auditoria de movimentação de estoque
          const movimentacao = await tx.movimentacaoEstoque.create({
            data: {
              empresaId,
              produtoId: produto.id,
              usuarioId,
              tipo: "SAIDA",
              quantidade: new Prisma.Decimal(quantidadeNum.toFixed(3)),
              motivo: "Venda PDV",
            },
          });

          itensProcessados.push({
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: quantidadeNum,
            precoUnitario: precoVendaNum,
            movimentacaoId: movimentacao.id,
          });
        }

        const descNum    = parseFloat(desconto) || 0;
        const totalLiquido = Math.max(0, subtotal - descNum);

        // Validar que o total pago cobre (ou ultrapassa) o total líquido
        // Tolerância de R$ 0,01 para arredondamento
        if (totalPago < totalLiquido - 0.01) {
          throw new Error(
            `Pagamento insuficiente: total da venda é R$ ${totalLiquido.toFixed(2)} mas apenas R$ ${totalPago.toFixed(2)} foi informado.`
          );
        }

        // 2. Criar o cabeçalho da Venda
        const venda = await tx.venda.create({
          data: {
            empresaId,
            vendedorId: vendedorId || null,
            clienteId: clienteId || null,
            turnoId: turnoAberto.id,
            orcamentoId: orcamentoId || null,
            valorTotal:    new Prisma.Decimal(totalLiquido.toFixed(2)),
            desconto:      new Prisma.Decimal(descNum.toFixed(2)),
            condicaoPagamento,
            pagoDinheiro:  new Prisma.Decimal(pagDinheiro.toFixed(2)),
            pagoCartao:    new Prisma.Decimal(pagCartao.toFixed(2)),
            pagoPix:       new Prisma.Decimal(pagPix.toFixed(2)),
            pagoCrediario: new Prisma.Decimal(pagCrediario.toFixed(2)),
          },
        });

        // 3. Comissão do Vendedor (se houver)
        let comissaoInfo = null;
        if (vendedorId) {
          const vendedor = await tx.usuario.findFirst({
            where: { id: vendedorId, empresaId },
          });

          if (!vendedor) throw new Error("Vendedor selecionado não foi localizado.");

          const pct = Number(vendedor.percentualComissao) || 0;
          if (pct > 0) {
            const valorComissao = (totalLiquido * pct) / 100;
            const comissao = await tx.comissaoVenda.create({
              data: {
                empresaId,
                usuarioId: vendedorId,
                vendaId: venda.id,
                valorVenda:   new Prisma.Decimal(totalLiquido.toFixed(2)),
                valorComissao: new Prisma.Decimal(valorComissao.toFixed(2)),
                status: "PENDENTE",
                dataCompetencia: new Date(),
              },
            });

            comissaoInfo = { id: comissao.id, percentual: pct, valorComissao };
          }
        }

        // 4. Lançamento financeiro à vista (parte não crediário)
        const valorAVista = pagDinheiro + pagCartao + pagPix;
        if (valorAVista > 0) {
          await tx.lancamentoFinanceiro.create({
            data: {
              empresaId,
              tipo: "RECEITA",
              valor: new Prisma.Decimal(valorAVista.toFixed(2)),
              status: "PAGO",
              dataVencimento: new Date(),
              dataPagamento: new Date(),
              motivo: `Venda PDV (D:${pagDinheiro.toFixed(2)} C:${pagCartao.toFixed(2)} P:${pagPix.toFixed(2)}) - Ref: ${venda.id}`,
            },
          });
        }

        // 5. Crediário: atualizar saldo do cliente e gerar ContaReceber
        let contaReceberId: string | null = null;
        if (pagCrediario > 0 && clienteId) {
          const cliente = await tx.cliente.findFirst({
            where: { id: clienteId, empresaId },
          });

          if (!cliente) throw new Error("Cliente selecionado não foi localizado.");

          // Atualizar saldo devedor do cliente
          const novoSaldoDevedor = Number(cliente.saldoDevedor) + pagCrediario;
          await tx.cliente.update({
            where: { id: cliente.id },
            data: { saldoDevedor: new Prisma.Decimal(novoSaldoDevedor.toFixed(2)) },
          });

          // Gerar ContaReceber com vencimento em 30 dias
          const dataVencimento = new Date();
          dataVencimento.setDate(dataVencimento.getDate() + 30);

          const contaReceber = await tx.contaReceber.create({
            data: {
              empresaId,
              clienteId,
              vendaId: venda.id,
              valor: new Prisma.Decimal(pagCrediario.toFixed(2)),
              dataVencimento,
              status: "PENDENTE",
              valorPago: new Prisma.Decimal(0.00),
            },
          });

          contaReceberId = contaReceber.id;
        }

        return {
          vendaId: venda.id,
          condicaoPagamento,
          subtotal,
          desconto: descNum,
          total: totalLiquido,
          pagamentos: { dinheiro: pagDinheiro, cartao: pagCartao, pix: pagPix, crediario: pagCrediario },
          totalPago,
          troco: Math.max(0, pagDinheiro - Math.max(0, totalLiquido - pagCartao - pagPix - pagCrediario)),
          contaReceberId,
          comissao: comissaoInfo,
          itens: itensProcessados,
        };
      });

      return res.status(201).json({
        message: "Venda registrada com sucesso!",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Listar Contas a Receber (auditoria financeira)
  async listContasReceber(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const contas = await prisma.contaReceber.findMany({
        where: { empresaId },
        orderBy: { dataVencimento: "asc" },
        include: {
          cliente: {
            select: { nome: true, cpfCnpj: true },
          },
        },
      });

      return res.json(contas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Listar comissões de vendas
  async listComissoes(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const comissoes = await prisma.comissaoVenda.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: { nome: true, email: true }
          },
          venda: {
            select: { id: true, valorTotal: true }
          }
        }
      });
      return res.json(comissoes);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
