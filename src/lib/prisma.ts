import { PrismaClient } from '@prisma/client';

const OFFICIAL_DB_URL = "postgresql://postgres:Valora2024SaaS!@db.aoifhzglajhnifjqcfqt.supabase.co:5432/postgres";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: OFFICIAL_DB_URL,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
