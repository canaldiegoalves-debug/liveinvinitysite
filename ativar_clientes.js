process.env.DATABASE_URL = "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clientes = [
    { email: 'mariaocampo7991@gmail.com', plano: 'pro' },
    { email: 'andre.jr123567@gmail.com', plano: 'pro' }
  ];

  for (const c of clientes) {
    const email = c.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email },
      include: { empresa: true }
    });

    if (!user) {
      console.log(`Criando usuário para ${email}...`);
      user = await prisma.user.create({
        data: {
          email,
          nome: email.split('@')[0],
          role: 'user'
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
          planoStatus: 'active',
          planoExpiresAt: novaExpiracao,
          lastPaymentAt: new Date()
        }
      });
    } else {
      const novaEmp = await prisma.empresa.create({
        data: {
          userId: user.id,
          nome: `Empresa de ${email.split('@')[0]}`,
          email: email,
          plano: c.plano,
          planoStatus: 'active',
          planoExpiresAt: novaExpiracao,
          lastPaymentAt: new Date()
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { empresaId: novaEmp.id }
      });
    }

    const userChave = `LIVEINF-${c.plano.toUpperCase()}-${user.id.substring(0, 5).toUpperCase()}-${user.id.substring(5, 10).toUpperCase()}`;
    console.log(`\n========================================`);
    console.log(`✅ CLIENTE ATIVADO COM SUCESSO: ${email}`);
    console.log(`🔑 CHAVE DE LICENÇA GERADA: ${userChave}`);
    console.log(`========================================\n`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
