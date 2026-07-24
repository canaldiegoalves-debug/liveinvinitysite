const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://aoifhzglajhnifjqcfqt.supabase.co",
  "sb_publishable_ldDHg7VhrsUPZ9k4zqC0eA_8fFi9_R1"
);

async function test() {
  console.log("Testando Supabase REST Client...");
  const { data, error } = await supabase.from('User').select('*').limit(5);
  if (error) {
    console.error("❌ ERRO SUPABASE:", error);
  } else {
    console.log("✅ SUCESSO SUPABASE REST! Usuários no banco:", data);
  }
}

test();
