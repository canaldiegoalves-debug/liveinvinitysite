import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, name, amount, pixKey } = await req.json();

    if (!email || !amount || !pixKey) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Buscar o perfil do usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('balance, total_bet, bonus_balance, total_deposited, id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const balance = Number(user.balance || 0);
    const totalBet = Number(user.total_bet || 0);
    const bonusBalance = Number(user.bonus_balance || 0);
    const val = Number(amount);

    // Validações
    if (balance < val) {
      return NextResponse.json({ error: `Saldo insuficiente (R$ ${balance.toFixed(2)})` }, { status: 400 });
    }

    // Regra de Rollover Global (3x o valor total depositado)
    const requiredRollover = Number(user.total_deposited || 0) * 3;
    if (totalBet < requiredRollover) {
      return NextResponse.json({ 
        error: `Rollover pendente: você apostou R$ ${totalBet.toFixed(2)} e precisa apostar pelo menos R$ ${requiredRollover.toFixed(2)} (3x seus depósitos) para liberar o saque.` 
      }, { status: 400 });
    }
    
    // Regra de Rollover do Bônus: Apostar 20x o valor do bônus
    const isBonusUnlocked = bonusBalance === 0 || totalBet >= (bonusBalance * 20);
    const withdrawable = isBonusUnlocked ? balance : Math.max(0, balance - bonusBalance);
    
    if (val > withdrawable) {
      return NextResponse.json({ error: `Você possui bônus travado. Valor sacável: R$ ${withdrawable.toFixed(2)}` }, { status: 400 });
    }

    // 2. Criar a solicitação
    const { error: insertError } = await supabase
      .from('withdraw_requests')
      .insert({
        email: email.toLowerCase(),
        name: name || 'Usuário',
        amount: val,
        pix_key: pixKey,
        status: 'pending'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: `Erro ao salvar pedido: ${insertError.message}` }, { status: 500 });
    }

    // 3. Deduzir saldo
    const newBalance = balance - val;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('Update balance error:', updateError);
      return NextResponse.json({ error: `Erro ao atualizar saldo: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[WITHDRAW REQUEST API ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
