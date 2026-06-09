import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";
import { EmpresaStatus } from "@prisma/client";

export class SuperAdminController {
  // GET /super/empresas - Listagem de CNPJs cadastrados com contagem agregada de usuários e produtos
  async listEmpresas(req: CustomRequest, res: Response) {
    try {
      const empresas = await prisma.empresa.findMany({
        include: {
          _count: {
            select: {
              usuarios: true,
              produtos: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Mapeia para garantir o formato correto de resposta para o frontend
      const formatado = empresas.map((emp) => ({
        id: emp.id,
        nomeFantasia: emp.nomeFantasia,
        razaoSocial: emp.razaoSocial,
        cnpj: emp.cnpj,
        status: emp.status,
        createdAt: emp.createdAt,
        _count: {
          usuarios: emp._count.usuarios,
          produtos: emp._count.produtos,
        },
      }));

      return res.json(formatado);
    } catch (error: any) {
      console.error("Erro ao listar empresas (Super Admin):", error);
      return res.status(500).json({ error: "Erro interno ao listar empresas." });
    }
  }

  // POST /super/empresas - Cadastro de nova empresa de forma isolada
  async createEmpresa(req: CustomRequest, res: Response) {
    try {
      const { nomeFantasia, razaoSocial, cnpj } = req.body;

      if (!nomeFantasia) {
        return res.status(400).json({ error: "O Nome Fantasia é obrigatório." });
      }

      if (cnpj) {
        // Remover formatação antes de checar e salvar
        const cnpjLimpo = cnpj.replace(/[^\d]/g, "");

        const empresaExistente = await prisma.empresa.findFirst({
          where: { cnpj: cnpjLimpo },
        });

        if (empresaExistente) {
          return res.status(400).json({ error: "Já existe uma empresa cadastrada com este CNPJ." });
        }
      }

      const cnpjSalvar = cnpj ? cnpj.replace(/[^\d]/g, "") : null;

      const novaEmpresa = await prisma.empresa.create({
        data: {
          nomeFantasia,
          razaoSocial: razaoSocial || null,
          cnpj: cnpjSalvar,
          status: EmpresaStatus.ATIVO,
        },
      });

      return res.status(201).json(novaEmpresa);
    } catch (error: any) {
      console.error("Erro ao criar empresa (Super Admin):", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar empresa." });
    }
  }

  // PUT /super/empresas/:id/status - Alteração de status da empresa (ATIVO / BLOQUEADO)
  async updateEmpresaStatus(req: CustomRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || (status !== EmpresaStatus.ATIVO && status !== EmpresaStatus.BLOQUEADO)) {
        return res.status(400).json({ error: "Status inválido. Deve ser ATIVO ou BLOQUEADO." });
      }

      const empresa = await prisma.empresa.findUnique({
        where: { id },
      });

      if (!empresa) {
        return res.status(404).json({ error: "Empresa não encontrada." });
      }

      const empresaAtualizada = await prisma.empresa.update({
        where: { id },
        data: {
          status: status as EmpresaStatus,
        },
      });

      return res.json(empresaAtualizada);
    } catch (error: any) {
      console.error("Erro ao atualizar status da empresa (Super Admin):", error);
      return res.status(500).json({ error: "Erro interno ao atualizar status da empresa." });
    }
  }

  // GET /super/metricas - Métricas agregadas do SaaS
  async getMetricas(req: CustomRequest, res: Response) {
    try {
      const totalEmpresas = await prisma.empresa.count();
      const totalUsuarios = await prisma.usuario.count();
      
      // MRR Estimado baseado no valor do plano por empresa cadastrada
      const mrrEstimado = totalEmpresas * 199.90;

      return res.json({
        totalEmpresas,
        totalUsuarios,
        mrrEstimado,
      });
    } catch (error: any) {
      console.error("Erro ao obter métricas SaaS (Super Admin):", error);
      return res.status(500).json({ error: "Erro interno ao obter métricas." });
    }
  }
}
