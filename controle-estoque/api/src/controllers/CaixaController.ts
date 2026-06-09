import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class CaixaController {
  // Obter o turno atual aberto do operador
  async obterTurnoAtual(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const turno = await prisma.caixaTurno.findFirst({
        where: { empresaId, usuarioId, status: "ABERTO" },
        include: {
          movimentacoes: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!turno) {
        return res.json({ status: "FECHADO", turno: null });
      }

      // Buscar todas as vendas à vista realizadas neste turno para somar ao caixa
      const vendasTurno = await prisma.venda.findMany({
        where: {
          empresaId,
          turnoId: turno.id
        }
      });

      // Calcular o total de vendas em dinheiro físico (fração pagoDinheiro)
      const totalVendasDinheiro = vendasTurno
        .reduce((sum, v) => sum + Number(v.pagoDinheiro || 0), 0);

      // Calcular o total de suprimentos e sangrias
      const totalSuprimentos = turno.movimentacoes
        .filter(m => m.tipo === "SUPRIMENTO")
        .reduce((sum, m) => sum + Number(m.valor), 0);

      const totalSangrias = turno.movimentacoes
        .filter(m => m.tipo === "SANGRIA")
        .reduce((sum, m) => sum + Number(m.valor), 0);

      const valorAbertura = Number(turno.valorAbertura);
      const saldoEsperado = valorAbertura + totalVendasDinheiro + totalSuprimentos - totalSangrias;

      return res.json({
        status: "ABERTO",
        turno: {
          id: turno.id,
          valorAbertura,
          createdAt: turno.createdAt,
          movimentacoes: turno.movimentacoes
        },
        metricas: {
          valorAbertura,
          totalVendasDinheiro,
          totalSuprimentos,
          totalSangrias,
          saldoEsperado
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Abrir Turno de Caixa
  async abrirTurno(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { valorAbertura } = req.body;

      if (valorAbertura === undefined || isNaN(parseFloat(valorAbertura))) {
        return res.status(400).json({ error: "Valor de abertura inválido" });
      }

      // Verificar se já tem um turno aberto para este operador
      const turnoAberto = await prisma.caixaTurno.findFirst({
        where: { empresaId, usuarioId, status: "ABERTO" }
      });

      if (turnoAberto) {
        return res.status(400).json({ error: "Já existe um turno de caixa aberto para o seu usuário." });
      }

      const novoTurno = await prisma.caixaTurno.create({
        data: {
          empresaId,
          usuarioId,
          status: "ABERTO",
          valorAbertura: new Prisma.Decimal(parseFloat(valorAbertura).toFixed(2))
        }
      });

      return res.status(201).json(novoTurno);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Fechar Turno de Caixa
  async fecharTurno(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { valorFechamentoInformado } = req.body;

      if (valorFechamentoInformado === undefined || isNaN(parseFloat(valorFechamentoInformado))) {
        return res.status(400).json({ error: "Valor informado no fechamento é inválido." });
      }

      const turno = await prisma.caixaTurno.findFirst({
        where: { empresaId, usuarioId, status: "ABERTO" },
        include: { movimentacoes: true }
      });

      if (!turno) {
        return res.status(400).json({ error: "Nenhum turno aberto foi localizado para fechamento." });
      }

      // Calcular o saldo de fechamento esperado
      const vendasTurno = await prisma.venda.findMany({
        where: { empresaId, turnoId: turno.id }
      });

      const totalVendasDinheiro = vendasTurno
        .reduce((sum, v) => sum + Number(v.pagoDinheiro || 0), 0);

      const totalSuprimentos = turno.movimentacoes
        .filter(m => m.tipo === "SUPRIMENTO")
        .reduce((sum, m) => sum + Number(m.valor), 0);

      const totalSangrias = turno.movimentacoes
        .filter(m => m.tipo === "SANGRIA")
        .reduce((sum, m) => sum + Number(m.valor), 0);

      const valorAbertura = Number(turno.valorAbertura);
      const saldoEsperado = valorAbertura + totalVendasDinheiro + totalSuprimentos - totalSangrias;
      const valorFechadoNum = parseFloat(valorFechamentoInformado);

      const turnoEncerrado = await prisma.caixaTurno.update({
        where: { id: turno.id },
        data: {
          status: "FECHADO",
          valorFechamentoDinheiro: new Prisma.Decimal(saldoEsperado.toFixed(2)),
          valorFechamentoInformado: new Prisma.Decimal(valorFechadoNum.toFixed(2)),
          closedAt: new Date()
        }
      });

      return res.json({
        message: "Caixa fechado com sucesso!",
        turno: turnoEncerrado,
        esperado: saldoEsperado,
        informado: valorFechadoNum,
        diferenca: valorFechadoNum - saldoEsperado
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Registrar Sangria ou Suprimento
  async registrarMovimentacao(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { tipo, valor, motivo } = req.body;

      if (!tipo || (tipo !== "SUPRIMENTO" && tipo !== "SANGRIA")) {
        return res.status(400).json({ error: "Tipo de movimentação inválido. Deve ser SUPRIMENTO ou SANGRIA." });
      }

      if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
        return res.status(400).json({ error: "Valor da movimentação inválido." });
      }

      const turno = await prisma.caixaTurno.findFirst({
        where: { empresaId, usuarioId, status: "ABERTO" }
      });

      if (!turno) {
        return res.status(400).json({ error: "O caixa precisa estar aberto para registrar sangrias ou suprimentos." });
      }

      const novaMovimentacao = await prisma.caixaMovimentacao.create({
        data: {
          turnoId: turno.id,
          tipo,
          valor: new Prisma.Decimal(parseFloat(valor).toFixed(2)),
          motivo: motivo || null
        }
      });

      return res.status(201).json(novaMovimentacao);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Listar histórico de turnos de caixa
  async listarTurnos(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const turnos = await prisma.caixaTurno.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: { nome: true, email: true }
          },
          movimentacoes: true
        }
      });
      return res.json(turnos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
