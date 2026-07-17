import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await params;
    if (!txid) return NextResponse.json({ error: 'txid obrigatório' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: charge, error } = await supabase
      .from('pix_deposits')
      .select('status, amount')
      .eq('txid', txid)
      .single();

    if (error || !charge) {
       return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (charge.status === 'completed') {
       return NextResponse.json({ pago: true, valor: charge.amount });
    }

    // Se quisermos consultar a AmploPay diretamente como fallback, 
    // poderíamos fazer aqui. Por enquanto, confiamos no webhook.

    return NextResponse.json({ pago: false, status: charge.status, valor: charge.amount });

  } catch (err: unknown) {
    console.error('[PIX STATUS]', err);
    const msg = err instanceof Error ? err.message : 'Erro ao verificar cobrança';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
