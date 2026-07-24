const { PrismaClient } = require('@prisma/client');

async function testUrl(url, name) {
  console.log(`Testando ${name}...`);
  const client = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    const res = await client.user.findFirst();
    console.log(`✅ SUCESSO com ${name}! User sample:`, res ? res.email : "sem usuarios");
    return true;
  } catch (e) {
    console.error(`❌ FALHOU ${name}:`, e.message.split('\n')[0]);
    return false;
  } finally {
    await client.$disconnect();
  }
}

async function testAll() {
  await testUrl("postgresql://postgres:Valora2024SaaS!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres", "aws-0 6543 postgres");
  await testUrl("postgresql://postgres:Valora2024SaaS!@aws-0-sa-east-1.pooler.supabase.com:5432/postgres", "aws-0 5432 postgres");
  await testUrl("postgresql://postgres:Valora2024SaaS!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true", "aws-0 6543 pgbouncer");
}

testAll();
