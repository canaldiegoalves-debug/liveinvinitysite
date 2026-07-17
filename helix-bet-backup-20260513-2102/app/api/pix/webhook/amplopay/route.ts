import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordPixDeposit } from '@/lib/statsManager';

/**
 * Endpoint para receber notificações da AmploPay
 * URL: https://SEU_DOMINIO.com/api/pix/webhook/amplopay
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[AMPLOPAY WEBHOOK RECEIVED]', JSON.stringify(body));

    /**
     * A AmploPay costuma enviar no formato:
     * { "event": "transaction.paid", "data": { "identifier": "...", "status": "paid", "amount": 10.00 } }
     * ou direto com os campos dependendo da versão.
     */
    const data = body.data || body;
    const identifier = data.identifier || data.reference;
    const status = data.status;
    const amount = data.amount;

    // Verificamos se o status é de sucesso/pago
    if (status === 'paid' || status === 'success' || status === 'approved' || body.event === 'transaction.paid') {
      const supabase = createAdminClient();

      // 1. Localizar o depósito pendente pelo identifier
      const { data: charge, error } = await supabase
        .from('pix_deposits')
        .select('email, amount, status')
        .eq('txid', identifier)
        .single();

      if (error || !charge) {
        console.warn(`[AMPLOPAY WEBHOOK] Transação ${identifier} não encontrada.`);
        return NextResponse.json({ success: false, message: 'Not found' });
      }

      // 2. Se ainda estiver pendente, credita o saldo
      if (charge.status === 'pending') {
        // A função recordPixDeposit já cuida de atualizar o saldo e registrar a transação
        await recordPixDeposit(identifier, charge.email, Number(amount));
        
        // Atualizamos o registro de PIX para completado
        await supabase
          .from('pix_deposits')
          .update({ status: 'completed' })
          .eq('txid', identifier);

        console.log(`[AMPLOPAY WEBHOOK] Saldo de R$ ${amount} creditado para ${charge.email}`);
      }
    }

    // Sempre retornar 200 para a AmploPay parar de reenviar o webhook
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[AMPLOPAY WEBHOOK ERROR]', err.message);
    // Retornamos 200 mesmo no erro para evitar loop de retentativas se o erro for de lógica
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
