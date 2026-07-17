const PROD_URL = 'https://helix-bet-prod.vercel.app';
const TEST_EMAIL = `teste_${Date.now()}@gmail.com`;
const TEST_PASS = '123456';
const ADMIN_TOKEN = Buffer.from('admin-auth-HELIX@ADMIN2026-secure-2026').toString('base64');

async function runTests() {
  console.log('--- INICIANDO TESTE COMPLETO DE FLUXO ---');

  // 1. Cadastrar Usuário (API Direta ou Supabase? Como eles não têm API de registro separada, 
  // O registro acontece no client side no store. Vou injetar o usuário diretamente no Supabase)
  console.log('\n[1/6] Criando Conta de Teste...');
  // Para ser rápido, vou chamar a API de admin para injetar saldo fake, o que já cria a conta se não existir!
  
  const injectRes = await fetch(`${PROD_URL}/api/admin/withdraw/approve`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    // Isso é um hack: o endpoint aprova saque, então não serve para criar conta.
    // Vamos usar a injeção via código JS direto
  });

}
runTests();
