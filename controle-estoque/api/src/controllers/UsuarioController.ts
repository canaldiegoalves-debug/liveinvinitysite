import { Response } from "express";
import { CustomRequest } from "../middlewares/tenant";
import { prisma } from "../lib/prisma";

export class UsuarioController {
  // Listar todos os usuários da empresa que podem atuar como vendedores
  async listVendedores(req: CustomRequest, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const vendedores = await prisma.usuario.findMany({
        where: { empresaId },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          percentualComissao: true,
          createdAt: true
        },
        orderBy: { nome: "asc" }
      });
      return res.json(vendedores);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
