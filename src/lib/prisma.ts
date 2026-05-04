import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = process.env.POOLER_URL || "postgresql://postgres.aoifhzglajhnifjqcfqt:Valora2024SaaS!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  console.log("PRISMA INITIALIZING WITH URL:", url ? url.split('@')[1] : "UNDEFINED");
  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
