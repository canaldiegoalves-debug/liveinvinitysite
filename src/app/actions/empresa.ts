"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function getEmpresa() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email!,
      nome: user.user_metadata.full_name || "",
    },
    create: {
      id: user.id,
      email: user.email!,
      nome: user.user_metadata.full_name || "",
    },
  });

  let empresa = await prisma.empresa.findUnique({
    where: { userId: user.id },
  });

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        userId: user.id,
        nome: "Minha Empresa",
        nicho: "",
        plano: "free",
        planoStatus: "active",
      },
    });
  }

  // --- LÓGICA DE MONITORAMENTO FINANCEIRO ---
  if (empresa.plano !== "free" && empresa.planoExpiresAt) {
    const hoje = new Date();
    const expiracao = new Date(empresa.planoExpiresAt);

    // 1. Verificação de Bloqueio (Vencimento)
    if (hoje > expiracao && empresa.planoStatus !== "expired") {
      empresa = await prisma.empresa.update({
        where: { id: empresa.id },
        data: { planoStatus: "expired" }
      });
    }

    // 2. Verificação de Alerta (24h antes para PIX)
    const umDiaEmMs = 24 * 60 * 60 * 1000;
    const faltam24h = (expiracao.getTime() - hoje.getTime()) <= umDiaEmMs;

    if (faltam24h && empresa.metodoPagamento === "pix" && hoje < expiracao) {
      // Aqui o sistema sinaliza que precisa enviar o WhatsApp
      // Em um ambiente real, dispararíamos o Webhook do WhatsApp aqui
      console.log(`[ALERTA FINANCEIRO] Usuário ${dbUser.email} vence em 24h (PIX).`);
    }
  }

  return empresa;
}

export async function saveEmpresa(data: {
  nome?: string;
  nicho?: string;
  logo?: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  email?: string;
  plano?: string;
  planoStatus?: string;
  planoExpiresAt?: Date;
  metodoPagamento?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Não autorizado");

  await prisma.empresa.upsert({
    where: { userId: user.id },
    update: data,
    create: { 
      userId: user.id,
      nome: data.nome || "Minha Empresa",
      plano: data.plano || "free",
      planoStatus: "active",
      ...data, 
    },
  });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/admin");
}

// ... (getAllEmpresasAdmin continua igual)
