import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = "postgresql://postgres:Valora2024SaaS!@db.aoifhzglajhnifjqcfqt.supabase.co:5432/postgres";
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
