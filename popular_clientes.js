process.env.DATABASE_URL = "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" }
  }
});

async function main() {
  const clientes = [
    {
      email: "andre.jr123567@gmail.com",
      nome: "André Jr",
      plano: "pro",
      chave: "LIVEINF-BASIC-89CDB-BFC67-13CD4-41807"
    },
    {
      email: "mariaocampo7991@gmail.com",
      nome: "Maria Ocampo",
      plano: "pro",
      chave: "LIVEINF-BASIC-B1509-30C68-27CF5-13532"
    }
  ];

  for (const c of clientes) {
    const email = c.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email },
      include: { empresa: true }
    });

    if (!user) {
      console.log(`Criando usuário ${email}...`);
      user = await prisma.user.create({
        data: {
          email,
          nome: c.nome,
          role: "user"
        },
        include: { empresa: true }
      });
    }

    const novaExpiracao = new Date();
    novaExpiracao.setDate(novaExpiracao.getDate() + 30);

    if (user.empresa) {
      await prisma.empresa.update({
        where: { id: user.empresa.id },
        data: {
          plano: c.plano,
          planoStatus: "active",
          planoExpiresAt: novaExpiracao,
          lastPaymentAt: new Date()
        }
      });
    } else {
      const novaEmp = await prisma.empresa.create({
        data: {
          userId: user.id,
          nome: `Empresa de ${c.nome}`,
          email: email,
          plano: c.plano,
          planoStatus: "active",
          planoExpiresAt: novaExpiracao,
          lastPaymentAt: new Date()
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { empresaId: novaEmp.id }
      });
    }

    console.log(`✅ ${c.nome} (${email}) adicionado e ativo com a chave ${c.chave}!`);
  }
}

main()
  .catch(e => console.error("ERRO ao popular banco:", e))
  .finally(async () => await prisma.$disconnect());
