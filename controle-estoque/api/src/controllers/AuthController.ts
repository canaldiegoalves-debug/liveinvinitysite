import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secreto_default_para_estoque_saas";

export class AuthController {
  // Registrar uma nova empresa e o seu primeiro usuário administrador
  async register(req: Request, res: Response) {
    try {
      const { nomeFantasia, razaoSocial, cnpj, nomeUsuario, email, senha } = req.body;

      if (!nomeFantasia || !nomeUsuario || !email || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes" });
      }

      // Verificar se o email já existe
      const userExists = await prisma.usuario.findFirst({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }

      const senhaHash = await bcrypt.hash(senha, 8);

      // Criar a empresa e o usuário dentro de uma transação
      const result = await prisma.$transaction(async (tx) => {
        const empresa = await tx.empresa.create({
          data: {
            nomeFantasia,
            razaoSocial,
            cnpj,
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            nome: nomeUsuario,
            email,
            senhaHash,
            role: "admin",
            empresaId: empresa.id,
          },
        });

        return { empresa, usuario };
      });

      return res.status(201).json({
        message: "Empresa e usuário registrados com sucesso",
        empresa: {
          id: result.empresa.id,
          nomeFantasia: result.empresa.nomeFantasia,
        },
        usuario: {
          id: result.usuario.id,
          nome: result.usuario.nome,
          email: result.usuario.email,
          role: result.usuario.role,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Realizar login do usuário
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: "E-mail e senha são necessários" });
      }

      const usuario = await prisma.usuario.findFirst({
        where: { email },
        include: { empresa: true },
      });

      if (!usuario) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

      if (!senhaValida) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          empresaId: usuario.empresaId,
          role: usuario.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        },
        empresa: {
          id: usuario.empresa.id,
          nomeFantasia: usuario.empresa.nomeFantasia,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
