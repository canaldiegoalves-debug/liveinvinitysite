const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function main() {
  const email = "afiliadodiegoalves@gmail.com";
  console.log(`Buscando usuário com email: ${email}`);
  
  const user = await prisma.user.findFirst({
    where: { email: email }
  });

  if (!user) {
    console.error("Usuário não encontrado!");
    return;
  }

  console.log(`Usuário encontrado: ${user.nome} (ID: ${user.id}). Role atual: ${user.role}`);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" }
  });

  console.log(`Usuário promovido! Novo role: ${updatedUser.role}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
