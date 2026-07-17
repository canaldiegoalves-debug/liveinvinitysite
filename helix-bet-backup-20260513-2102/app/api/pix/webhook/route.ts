import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/pix/webhook
 * Recebe notificações da EFÍ Bank quando um PIX é recebido.
 * A EFÍ envia um POST com o corpo: { "pix": [...] }
 * 
 * IMPORTANTE: Configure o webhook na EFÍ em:
 * app.sejaefi.com.br → API → Webhooks
 * URL: https://SEU_DOMINIO.com.br/api/pix/webhook
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ ok: true });
    }

    // A EFÍ envia um array de transações PIX recebidas
    const { createAdminClient } = require('@/lib/supabase/admin');
    const { recordPixDeposit } = require('@/lib/statsManager');
    const supabase = createAdminClient();

    const pixList = body?.pix ?? [];

    for (const pix of pixList) {
      console.log('[WEBHOOK PIX RECEBIDO]', {
        txid:      pix.txid,
        valor:     pix.valor,
        pagador:   pix.pagador?.nome,
      });

      // 1. Buscar quem é o dono desse txid
      const { data: charge } = await supabase
        .from('pix_deposits')
        .select('email, amount')
        .eq('txid', pix.txid)
        .single();

      if (charge) {
        // 2. Creditar saldo
        await recordPixDeposit(pix.txid, charge.email, Number(pix.valor));
        console.log(`[WEBHOOK SUCCESS] Creditado R$ ${pix.valor} para ${charge.email}`);
      } else {
        console.warn(`[WEBHOOK WARN] TXID ${pix.txid} não encontrado no banco.`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

// A EFÍ também faz um GET para validar a URL do webhook
export async function GET() {
  return NextResponse.json({ status: 'webhook-active', service: 'helix-bet' });
}
