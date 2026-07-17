const { createClient } = require('@supabase/supabase-js');

async function manualCredit() {
  const supabaseUrl = 'https://copoaparisrnfrnzvvfa.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcG9hcGFyaXNybmZybnp2dmZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MDI5MywiZXhwIjoyMDkzOTE2MjkzfQ.s44NGebzF-Oii3jKOmDrpmRcTO3lWMtcI1ewkD2ImzM';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = 'diegoalvesdealmeida14@gmail.com';
  const amount = 10;
  const txid = 'MANUAL-RECOVERY-' + Date.now();

  const { data: user } = await supabase
    .from('profiles')
    .select('balance, total_deposited, referred_by, bonus_balance')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    console.log('Usuário não encontrado!');
    return;
  }

  const isFirstDeposit = Number(user.total_deposited || 0) === 0;
  const bonusAmount = isFirstDeposit ? amount : 0;
  const newBalance = Number(user.balance || 0) + amount + bonusAmount;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      balance: newBalance,
      total_deposited: Number(user.total_deposited || 0) + amount,
      bonus_balance: Number(user.bonus_balance || 0) + bonusAmount
    })
    .eq('email', email.toLowerCase());

  if (profileError) {
    console.log('Erro ao atualizar perfil:', profileError);
    return;
  }

  // Lógica de afiliado (Padrão 30%)
  if (user.referred_by) {
    const commission = amount * 0.30;
    const { data: affiliate } = await supabase
      .from('profiles')
      .select('email, balance, total_affiliate_earnings')
      .eq('affiliate_id', user.referred_by.toUpperCase())
      .single();

    if (affiliate) {
      await supabase
        .from('profiles')
        .update({
          balance: Number(affiliate.balance || 0) + commission,
          total_affiliate_earnings: Number(affiliate.total_affiliate_earnings || 0) + commission
        })
        .eq('email', affiliate.email);
      
      await supabase.from('transactions').insert({
        email: affiliate.email, type: 'deposit', amount: commission, detail: `Comissão de indicação: ${email}`
      });
    }
  }

  // Salva no registro de PIX
  await supabase.from('pix_deposits').upsert({
    txid, email, amount, status: 'completed'
  });

  // Salva no extrato
  await supabase.from('transactions').insert({
    email, type: 'deposit', amount, detail: 'Recuperação PIX AmploPay'
  });
  
  if (bonusAmount > 0) {
    await supabase.from('transactions').insert({
      email, type: 'deposit', amount: bonusAmount, detail: 'Bônus de 1º Depósito (100%)'
    });
  }

  console.log('====================================');
  console.log('✅ SALDO RECUPERADO COM SUCESSO!');
  console.log(`Jogador: ${email}`);
  console.log(`Valor depositado: R$ ${amount}`);
  console.log(`Bônus aplicado: R$ ${bonusAmount}`);
  console.log(`Novo saldo total: R$ ${newBalance}`);
  console.log('====================================');
}

manualCredit();
