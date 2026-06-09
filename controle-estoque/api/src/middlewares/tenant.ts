import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secreto_default_para_estoque_saas";

export interface CustomRequest extends Request {
  userId?: string;
  empresaId?: string;
  userRole?: string;
}

export function authMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no token" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    req.userId = decoded.id;
    req.empresaId = decoded.empresaId;
    req.userRole = decoded.role;

    return next();
  });
}

// Middleware para validar se a requisição tem empresaId vinculada (Super Admin pula o filtro de empresa)
export function tenantMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.userRole === "SUPER_ADMIN") {
    return next();
  }

  if (!req.empresaId) {
    return res.status(400).json({ error: "Tenant/Empresa não identificado na sessão" });
  }
  next();
}

// Middleware para autorizar acesso com base nas Roles do usuário (RBAC)
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({ error: "Papel de acesso (Role) não identificado na sessão" });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: "Acesso negado: privilégios insuficientes para esta operação" });
    }

    next();
  };
}
