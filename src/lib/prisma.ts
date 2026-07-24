import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POOLER_URL || "postgresql://postgres:Valora2024SaaS!@db.aoifhzglajhnifjqcfqt.supabase.co:5432/postgres";
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
