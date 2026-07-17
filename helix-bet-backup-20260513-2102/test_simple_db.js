const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function simpleTest() {
  const testEmail = 'final_test@example.com';
  
  // Cleanup
  await supabase.from('profiles').delete().eq('email', testEmail);

  // Insert
  console.log('1. Inserting...');
  const { error: insErr } = await supabase.from('profiles').insert({
    email: testEmail,
    name: 'Test',
    balance: 100,
    total_bet: 50
  });
  if (insErr) {
    console.error('Insert error:', insErr);
    return;
  }

  // Select
  console.log('2. Selecting...');
  const { data: user, error: selErr } = await supabase.from('profiles').select('*').eq('email', testEmail).single();
  if (selErr) {
    console.error('Select error:', selErr);
    return;
  }
  console.log('User found:', user.email, 'Balance:', user.balance);

  // Update
  console.log('3. Updating balance...');
  const { error: updErr } = await supabase.from('profiles').update({ balance: 80 }).eq('email', testEmail);
  if (updErr) {
    console.error('Update error:', updErr);
    return;
  }

  // Final check
  const { data: finalUser } = await supabase.from('profiles').select('balance').eq('email', testEmail).single();
  console.log('Final balance:', finalUser.balance);
  
  if (finalUser.balance === 80) console.log('--- TEST PASSED ---');
  else console.log('--- TEST FAILED ---');

  // Cleanup
  await supabase.from('profiles').delete().eq('email', testEmail);
}

simpleTest();
