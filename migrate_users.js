const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function main() {
  console.log("Iniciando migração de empresaId...");
  
  const users = await prisma.user.findMany({
    include: {
      ownedEmpresa: true
    }
  });

  for (const user of users) {
    if (user.ownedEmpresa && !user.empresaId) {
      console.log(`Linkando usuário ${user.email} à sua empresa ${user.ownedEmpresa.id}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { empresaId: user.ownedEmpresa.id }
      });
    }
  }

  console.log("Migração concluída!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
