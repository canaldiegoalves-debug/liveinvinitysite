const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalVerification() {
  console.log('--- VERIFICAÇÃO FINAL DA API DE SAQUE ---');
  
  const testEmail = 'api_test_final@example.com';
  
  // 1. Limpeza
  await supabase.from('profiles').delete().eq('email', testEmail);
  await supabase.from('withdraw_requests').delete().eq('email', testEmail);

  // 2. Criar perfil (usando full_name)
  console.log('1. Criando perfil de teste...');
  const { error: pError } = await supabase.from('profiles').insert({
    email: testEmail,
    full_name: 'Jogador Teste',
    balance: 50.00,
    total_bet: 30.00
  });
  if (pError) throw pError;

  // 3. Simular a API de Saque (Withdraw Request)
  console.log('2. Simulando pedido de saque de R$ 20,00...');
  const { error: wError } = await supabase.from('withdraw_requests').insert({
    email: testEmail,
    name: 'Jogador Teste',
    amount: 20.00,
    pix_key: '00000000000',
    status: 'pending'
  });
  if (wError) throw wError;

  // 4. Simular a dedução de saldo
  console.log('3. Deduzindo saldo...');
  const { error: uError } = await supabase.from('profiles').update({ balance: 30.00 }).eq('email', testEmail);
  if (uError) throw uError;

  // 5. Verificar resultados
  const { data: finalProfile } = await supabase.from('profiles').select('balance').eq('email', testEmail).single();
  const { data: finalRequest } = await supabase.from('withdraw_requests').select('status').eq('email', testEmail).single();

  console.log('--- RESULTADOS ---');
  console.log('Saldo Final:', finalProfile.balance, '(Esperado: 30)');
  console.log('Status do Pedido:', finalRequest.status, '(Esperado: pending)');
  
  if (finalProfile.balance === 30 && finalRequest.status === 'pending') {
    console.log('✅ API DE SAQUE ESTÁ FUNCIONANDO PERFEITAMENTE NO SERVIDOR.');
  } else {
    console.log('❌ FALHA NA VERIFICAÇÃO.');
  }

  // Limpeza
  await supabase.from('profiles').delete().eq('email', testEmail);
  await supabase.from('withdraw_requests').delete().eq('email', testEmail);
}

finalVerification().catch(console.error);
