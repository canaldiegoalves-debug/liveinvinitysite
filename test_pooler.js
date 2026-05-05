const { PrismaClient } = require('@prisma/client');

async function testConnection(region) {
  const url = `postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    await prisma.$connect();
    console.log(`Successfully connected to ${region}`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(`Failed to connect to ${region}: ${error.message}`);
    return false;
  }
}

async function main() {
  const regions = ['sa-east-1', 'us-east-1', 'us-west-1', 'eu-west-1'];
  for (const region of regions) {
    const success = await testConnection(region);
    if (success) {
      console.log('SUCCESS_URL=' + `postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`);
      process.exit(0);
    }
  }
  process.exit(1);
}

main();
