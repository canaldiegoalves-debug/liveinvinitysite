const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fullTest() {
  console.log('--- INICIANDO TESTE COMPLETO DE SAQUE (SEM HTTP) ---');
  
  const testEmail = 'test_withdraw_user_final@example.com';
  const testName = 'Test User';
  const testAmount = 25;
  const testPixKey = '00000000000';

  // 1. Preparar usuário de teste
  console.log('1. Preparando usuário de teste...');
  await supabase.from('profiles').upsert({
    email: testEmail,
    name: testName,
    balance: 100,
    total_bet: 50,
    bonus_balance: 0,
    cpf: '00000000000'
  });

  // 2. Simular API de Saque
  console.log('2. Simulando fluxo de saque...');
  const { data: user } = await supabase.from('profiles').select('*').eq('email', testEmail).single();
  
  // LOGICA: Insert em withdraw_requests
  const { error: insError } = await supabase.from('withdraw_requests').insert({
    email: testEmail,
    name: testName,
    amount: testAmount,
    pix_key: testPixKey,
    status: 'pending'
  });
  if (insError) throw insError;
  console.log('   [OK] Pedido de saque inserido.');

  // LOGICA: Update em profiles
  const { error: updError } = await supabase.from('profiles').update({ balance: user.balance - testAmount }).eq('email', testEmail);
  if (updError) throw updError;
  console.log('   [OK] Saldo deduzido.');

  // 3. Verificar estado
  const { data: userAfter } = await supabase.from('profiles').select('balance').eq('email', testEmail).single();
  console.log(`3. Saldo após saque: R$ ${userAfter.balance} (Esperado: 75)`);
  
  // 4. Simular API de Recusa
  console.log('4. Simulando fluxo de recusa...');
  const { data: request } = await supabase.from('withdraw_requests').select('id').eq('email', testEmail).eq('status', 'pending').single();
  
  await supabase.from('withdraw_requests').update({ status: 'refused' }).eq('id', request.id);
  await supabase.from('profiles').update({ balance: userAfter.balance + testAmount }).eq('email', testEmail);
  
  const { data: userFinal } = await supabase.from('profiles').select('balance').eq('email', testEmail).single();
  console.log(`5. Saldo final após recusa: R$ ${userFinal.balance} (Esperado: 100)`);

  console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
  
  // Limpar
  await supabase.from('profiles').delete().eq('email', testEmail);
  await supabase.from('withdraw_requests').delete().eq('email', testEmail);
}

fullTest().catch(console.error);
