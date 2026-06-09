import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";

export class ClienteController {
  // Listar Clientes (com suporte a busca por nome ou CPF/CNPJ)
  async list(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { busca } = req.query;

      const where: any = { empresaId };

      if (busca) {
        where.OR = [
          { nome: { contains: String(busca) } },
          { cpfCnpj: { contains: String(busca) } },
        ];
      }

      const clientes = await prisma.cliente.findMany({
        where,
        orderBy: { nome: "asc" },
      });

      return res.json(clientes);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Criar Cliente
  async create(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { nome, cpfCnpj, telefone, endereco } = req.body;

      if (!nome) {
        return res.status(400).json({ error: "Nome do cliente é obrigatório." });
      }

      if (cpfCnpj) {
        const clienteExists = await prisma.cliente.findFirst({
          where: { cpfCnpj, empresaId },
        });
        if (clienteExists) {
          return res.status(400).json({ error: "Já existe um cliente cadastrado com este CPF/CNPJ." });
        }
      }

      const cliente = await prisma.cliente.create({
        data: {
          empresaId,
          nome,
          cpfCnpj: cpfCnpj || null,
          telefone: telefone || null,
          endereco: endereco || null,
          saldoDevedor: 0.00,
        },
      });

      return res.status(201).json(cliente);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
