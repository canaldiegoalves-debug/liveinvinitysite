"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

// Função de segurança para verificar se é ADMIN ou MODERADOR
async function checkAdminOrModerator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== "admin" && dbUser?.role !== "moderator") {
    throw new Error("Acesso negado");
  }
  return dbUser;
}

export async function getDashboardStats() {
  await checkAdminOrModerator();

  const [totalUsers, totalOrcamentos, totalEmpresas] = await Promise.all([
    prisma.user.count(),
    prisma.orcamento.count(),
    prisma.empresa.count(),
  ]);

  return { totalUsers, totalOrcamentos, totalEmpresas };
}

export async function getAllUsersAdmin() {
  await checkAdminOrModerator();

  return prisma.user.findMany({
    include: {
      empresa: {
        include: {
          _count: {
            select: {
              clientes: true,
              orcamentos: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateUserDetails(userId: string, data: {
  role?: string;
  nome?: string;
  empresa?: {
    plano?: string;
    nicho?: string;
    nome?: string;
  }
}) {
  const caller = await checkAdminOrModerator();
  
  // Apenas ADMIN pode mudar cargo (role) ou plano
  if (caller.role !== "admin") {
    if (data.role || data.empresa?.plano) {
      throw new Error("Apenas administradores podem alterar cargos ou planos.");
    }
  }

  // Se o admin está mudando para um plano pago, ativa e estende a expiração
  const isPlanoAtivacao = data.empresa?.plano === "premium" || data.empresa?.plano === "pro";
  const novaExpiracao = isPlanoAtivacao ? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d;
  })() : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      nome: data.nome,
      role: data.role,
      empresa: data.empresa ? {
        update: {
          plano: data.empresa.plano,
          nicho: data.empresa.nicho,
          nome: data.empresa.nome,
          ...(isPlanoAtivacao && {
            planoStatus: "active",
            planoExpiresAt: novaExpiracao,
            lastPaymentAt: new Date(),
          }),
        }
      } : undefined
    }
  });

  revalidatePath("/admin");
}

export async function deleteUserAdmin(userId: string) {
  const caller = await checkAdminOrModerator();
  if (caller.role !== "admin") throw new Error("Apenas administradores podem deletar usuários.");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}
