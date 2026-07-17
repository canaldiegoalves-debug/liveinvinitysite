import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordPixDeposit } from '@/lib/statsManager';

/**
 * POST /api/pix/webhook/suitpay
 * Recebe notificações da Suitpay quando um PIX é pago.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('[WEBHOOK SUITPAY RECEIVED]', body);

    // Na Suitpay, o status de sucesso geralmente vem como 'PAID' ou 'CONCLUDED'
    // E o campo identificador costuma ser 'idTransaction' ou 'requestNumber'
    const { idTransaction, status, requestNumber, value } = body;

    if (status === 'PAID') {
      const supabase = createAdminClient();

      // 1. Buscar o depósito pelo txid (idTransaction na Suitpay) ou requestNumber
      // Note: No deposit/route.ts salvamos o txid que vem da Suitpay
      const { data: charge } = await supabase
        .from('pix_deposits')
        .select('email, amount')
        .eq('txid', String(idTransaction))
        .single();

      if (charge) {
        // 2. Creditar saldo via statsManager
        await recordPixDeposit(String(idTransaction), charge.email, Number(value || charge.amount));
        console.log(`[SUITPAY SUCCESS] Creditado R$ ${value} para ${charge.email}`);
      } else {
        console.warn(`[SUITPAY WARN] Transação ${idTransaction} não encontrada no banco.`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[SUITPAY WEBHOOK ERROR]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * A Suitpay pode fazer um GET para validar a URL (opcional)
 */
export async function GET() {
  return NextResponse.json({ status: 'active', gateway: 'suitpay' });
}
