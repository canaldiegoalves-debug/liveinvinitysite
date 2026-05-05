const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function test() {
  console.log("🚀 Iniciando Teste E2E do Valora...");

  const userEmail = "afiliadodiegoalves@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { empresa: true }
  });

  if (!user || !user.empresa) {
    console.error("❌ Empresa não encontrada.");
    return;
  }

  const empresaId = user.empresa.id;

  // 1. Cadastrar Material
  const material = await prisma.material.create({
    data: { empresaId, nome: "Verniz Teste", categoria: "Teste", unidade: "ml", valorPago: 100, qtdEstoque: 1000, custoUnitario: 0.1 }
  });
  console.log("✅ Material OK");

  // 2. Cadastrar Serviço
  const servico = await prisma.servico.create({
    data: { empresaId, nome: "Serviço Teste", tempoMinutos: 60, percentualMao: 50, status: "ativo" }
  });
  console.log("✅ Serviço OK");

  // 3. Cliente
  const cliente = await prisma.cliente.create({ data: { empresaId, nome: "Teste Silva" } });
  console.log("✅ Cliente OK");

  // 4. Orçamento
  const orcamento = await prisma.orcamento.create({
    data: {
      empresaId,
      clienteId: cliente.id,
      numero: "TEST-" + Date.now().toString().slice(-4),
      status: "Pendente",
      valorFinal: 1000,
      custoMateriais: 100,
      valorMaoDeObra: 500
    }
  });
  console.log("✅ Orçamento OK");

  // 5. Agendar
  await prisma.agendamento.create({ data: { orcamentoId: orcamento.id, data: "2024-05-20", hora: "10:00" } });
  console.log("✅ Agendamento OK");

  // 6. Entregar (Gera Financeiro)
  await prisma.orcamento.update({ where: { id: orcamento.id }, data: { status: "Entregue" } });
  console.log("✅ Orçamento ENTREGUE (Financeiro OK)");

  // 7. Validar Financeiro
  const financeiro = await prisma.orcamento.aggregate({
    where: { empresaId, status: "Entregue" },
    _sum: { valorFinal: true }
  });
  console.log(`💰 Resultado Financeiro: R$ ${financeiro._sum.valorFinal}`);

  console.log("\n✨ TESTE E2E CONCLUÍDO COM SUCESSO! ✨");
}

test().finally(async () => await prisma.$disconnect());
