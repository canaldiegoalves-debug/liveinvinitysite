import { createClient } from '@supabase/supabase-js'

// Este cliente deve ser usado APENAS no servidor (API Routes, Server Actions)
// Ele ignora as regras de RLS (Row Level Security)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
