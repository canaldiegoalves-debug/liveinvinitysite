import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Retorna um cliente "dummy" ou lida com o erro silenciosamente durante o build
    console.warn('⚠️ Supabase URL ou Key não definidos. Isso pode causar falha no build se for usado em prerendering.');
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key'
  )
}
