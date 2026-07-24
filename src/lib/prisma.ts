import { PrismaClient } from '@prisma/client';

const OFFICIAL_URL = "postgresql://postgres:Valora2024SaaS!@db.aoifhzglajhnifjqcfqt.supabase.co:5432/postgres";

// Garante que o Prisma utilize sempre a URL correta do banco do Supabase
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: OFFICIAL_URL
    }
  }
});
