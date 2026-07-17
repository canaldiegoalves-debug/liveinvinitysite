import { NextRequest, NextResponse } from 'next/server';
import { createSuitpayCharge } from '@/lib/suitpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, userName } = await req.json();

    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Valor mínimo de depósito é R$ 10,00' }, { status: 400 });
    }
    if (amount > 10000) {
      return NextResponse.json({ error: 'Valor máximo de depósito é R$ 10.000,00' }, { status: 400 });
    }
    if (!userId || !userName) {
      return NextResponse.json({ error: 'Usuário não identificado' }, { status: 400 });
    }

    // Agora usamos Suitpay para ocultar o CNPJ da empresa
    const result = await createSuitpayCharge(Number(amount), userId, userName);

    // Salva no banco para o webhook processar depois
    const supabase = createAdminClient();
    await supabase.from('pix_deposits').insert({
      txid: String(result.txid),
      email: userId.toLowerCase(), // userId aqui é o email
      amount: Number(amount),
      status: 'pending'
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[PIX DEPOSIT]', err);
    const msg = err instanceof Error ? err.message : 'Erro ao criar cobrança PIX';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
