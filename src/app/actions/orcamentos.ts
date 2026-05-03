"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "./empresa";

export async function getOrcamentos() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.orcamento.findMany({
    where: { empresaId: empresa.id },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: {
            include: {
              materiais: { include: { material: true } }
            }
          }
        }
      },
      agendamento: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrcamento(data: {
  clienteId: string;
  servicoIds: string[]; // Agora aceita um array de IDs
  observacoes?: string;
}) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  // Busca todos os serviços selecionados
  const servicosData = await prisma.servico.findMany({
    where: { 
      id: { in: data.servicoIds },
      empresaId: empresa.id 
    },
    include: {
      materiais: { include: { material: true } }
    }
  });

  // Calcula os totais agregados
  let custoMateriais = 0;
  let valorMaoDeObra = 0;

  servicosData.forEach(servico => {
    const custoMatServico = servico.materiais.reduce(
      (acc, sm) => acc + sm.material.custoUnitario * sm.qtdUsada,
      0
    );
    custoMateriais += custoMatServico;
    valorMaoDeObra += custoMatServico * (servico.percentualMao / 100);
  });

  const valorFinal = custoMateriais + valorMaoDeObra;

  // Gera número do orçamento
  const count = await prisma.orcamento.count({ where: { empresaId: empresa.id } });
  const numero = `ORC-${(count + 1).toString().padStart(4, "0")}`;

  const orcamento = await prisma.orcamento.create({
    data: {
      numero,
      empresaId: empresa.id,
      clienteId: data.clienteId,
      observacoes: data.observacoes,
      custoMateriais,
      valorMaoDeObra,
      valorFinal,
      status: "Pendente",
      // Cria os vínculos com múltiplos serviços
      servicos: {
        create: data.servicoIds.map(id => ({
          servicoId: id
        }))
      }
    },
  });

  revalidatePath("/orcamentos");
  return orcamento;
}

export async function updateOrcamento(id: string, data: { observacoes?: string; status?: string }) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data,
  });
  revalidatePath("/orcamentos");
}

export async function updateStatusOrcamento(id: string, status: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data: { status },
  });
  revalidatePath("/orcamentos");
}

export async function agendarOrcamento(id: string, data: string, hora: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const orc = await prisma.orcamento.findUnique({ where: { id, empresaId: empresa.id } });
  if (!orc) throw new Error("Não encontrado");

  await prisma.agendamento.upsert({
    where: { orcamentoId: id },
    update: { data, hora },
    create: { orcamentoId: id, data, hora },
  });

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data: { status: "Agendado" },
  });

  revalidatePath("/orcamentos");
  revalidatePath("/agenda");
}

export async function deleteOrcamento(id: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.delete({
    where: { id, empresaId: empresa.id },
  });
  revalidatePath("/orcamentos");
}

export async function getAgendamentos() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.agendamento.findMany({
    where: {
      orcamento: { empresaId: empresa.id }
    },
    include: {
      orcamento: {
        include: {
          cliente: true,
          servicos: {
            include: { servico: true }
          }
        },
      },
    },
  });
}

export async function getFinanceiro(periodo: string) {
  const empresa = await getEmpresa();
  if (!empresa) return { receita: 0, custos: 0, lucro: 0, margem: 0, total: 0 };

  const agora = new Date();
  let dataInicio = new Date();

  if (periodo === "semana") dataInicio.setDate(agora.getDate() - 7);
  else if (periodo === "mes") dataInicio.setMonth(agora.getMonth() - 1);
  else if (periodo === "ano") dataInicio.setFullYear(agora.getFullYear() - 1);

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      empresaId: empresa.id,
      status: "Entregue",
      createdAt: { gte: dataInicio },
    },
  });

  const receita = orcamentos.reduce((acc, o) => acc + o.valorFinal, 0);
  const custos = orcamentos.reduce((acc, o) => acc + o.custoMateriais, 0);
  const lucro = receita - custos;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;

  return {
    receita,
    custos,
    lucro,
    margem,
    total: orcamentos.length,
  };
}
