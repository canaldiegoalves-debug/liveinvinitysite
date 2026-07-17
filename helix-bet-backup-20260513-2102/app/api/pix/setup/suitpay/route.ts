import { NextRequest, NextResponse } from 'next/server';
import { createSuitpayCharge } from '@/lib/suitpay';

/**
 * GET /api/pix/setup/suitpay
 * Rota auxiliar para testar a conexão com a Suitpay.
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[SETUP SUITPAY] Testando criação de cobrança mínima...');
    
    // Tenta criar uma cobrança de R$ 10 para teste
    const result = await createSuitpayCharge(10, 'teste@helix.com', 'Teste Setup');

    return NextResponse.json({
      success: true,
      message: 'Conexão com a Suitpay estabelecida!',
      testCharge: result,
      webhookUrl: process.env.SUITPAY_CALLBACK_URL || 'Não configurada (será usado o padrão da lib)'
    });
  } catch (err: any) {
    console.error('[SETUP SUITPAY ERROR]', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      instructions: 'Verifique se SUITPAY_CLIENT_ID e SUITPAY_CLIENT_SECRET estão corretos no .env ou Vercel.'
    }, { status: 500 });
  }
}
