import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 30, 60000)) { // Limite de 30 ações por minuto
      return NextResponse.json({ error: 'Muitas solicitações. Tente novamente em um minuto.' }, { status: 429 });
    }

    const { action, email, amount, detail } = await req.json();

    if (!email || !action || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const userEmail = email.toLowerCase();

    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('balance, total_bet, games_played, games_won, games_lost, total_lost, xp, level, cashback_balance')
      .eq('email', userEmail)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const u = user as any;
    let newBalance = Number(u.balance || 0);
    const updates: any = {};

    // Validações e Atualizações
    if (action === 'bet') {
      if (newBalance < amount) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
      }
      newBalance -= amount;
      updates.balance = newBalance;
      updates.total_bet = Number(u.total_bet || 0) + amount;
      updates.games_played = (u.games_played || 0) + 1;
      
      // Ganho de XP (1 real = 10 XP)
      const currentXP = u.xp || 0;
      const newXP = currentXP + (amount * 10);
      updates.xp = newXP;
      
      // Atualização de Nível (1 + floor(sqrt(xp/100)))
      updates.level = Math.floor(1 + Math.sqrt(newXP / 100));
    } 
    else if (action === 'cashout') {
      if (amount > 10000) {
         console.warn(`[ALERTA DE SEGURANÇA] Ganho muito alto detectado: ${amount}`);
      }
      newBalance += amount;
      updates.balance = newBalance;
      updates.games_won = (u.games_won || 0) + 1;
    } 
    else if (action === 'loss') {
      updates.total_lost = Number(u.total_lost || 0) + amount;
      updates.games_lost = (u.games_lost || 0) + 1;

      // Cashback Progressivo baseado no nível
      const level = u.level || 1;
      let cashbackPercent = 0.02; // Bronze (2%)
      if (level >= 3 && level < 6) cashbackPercent = 0.05; // Prata (5%)
      if (level >= 6) cashbackPercent = 0.10; // Ouro+ (10%)

      const cashbackAmount = amount * cashbackPercent;
      updates.cashback_balance = Number(u.cashback_balance || 0) + cashbackAmount;
    }
    else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // 1. Atualizar Perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('email', userEmail);

    if (updateError) throw updateError;

    // 2. Registrar Transação no Histórico
    await supabase
      .from('transactions')
      .insert({
        email: userEmail,
        type: action,
        amount,
        detail: detail || `Ação: ${action}`,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true, newBalance });

  } catch (err: any) {
    console.error('[GAME ACTION ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
