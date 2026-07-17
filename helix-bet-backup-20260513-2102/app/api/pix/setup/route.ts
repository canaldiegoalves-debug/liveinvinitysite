import { NextRequest, NextResponse } from 'next/server';
import { setupWebhook, getAccessToken } from '@/lib/efibank';

/**
 * GET /api/pix/setup
 * Rota auxiliar para configurar o webhook na Efí Bank.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Validar se temos acesso básico (token)
    console.log('[SETUP] Testando acesso à API Efí...');
    await getAccessToken();
    console.log('[SETUP] Token obtido com sucesso.');

    // 2. Determinar a URL do webhook
    // Em produção, deve ser o domínio real.
    const host = req.headers.get('host') || 'helix-bet.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/pix/webhook`;

    console.log(`[SETUP] Tentando registrar webhook: ${webhookUrl}`);

    // 3. Registrar o webhook
    const result = await setupWebhook(webhookUrl);

    return NextResponse.json({
      success: true,
      message: 'Webhook configurado com sucesso na Efí Bank!',
      url: webhookUrl,
      details: result
    });
  } catch (err: any) {
    console.error('[SETUP ERROR]', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      instructions: 'Certifique-se de que EFI_CERTIFICATE_BASE64, EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_PIX_KEY estão corretos no painel da Vercel.'
    }, { status: 500 });
  }
}
