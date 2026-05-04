"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function getEmpresa() {
  try {
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

      if (hoje > expiracao && empresa.planoStatus !== "expired") {
        empresa = await prisma.empresa.update({
          where: { id: empresa.id },
          data: { planoStatus: "expired" }
        });
      }
    }

    return empresa;
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return null;
  }
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

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email!,
      nome: user.user_metadata?.full_name || "",
    },
    create: {
      id: user.id,
      email: user.email!,
      nome: user.user_metadata?.full_name || "",
    },
  });

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
