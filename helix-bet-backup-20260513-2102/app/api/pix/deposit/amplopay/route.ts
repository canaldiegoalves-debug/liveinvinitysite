import { NextRequest, NextResponse } from 'next/server';
import { AmploPayClient } from '@/lib/amplopay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, userName, userCpf } = await req.json();

    // Validações básicas
    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Valor mínimo de depósito é R$ 10,00' }, { status: 400 });
    }
    if (!userId || !userName) {
      return NextResponse.json({ error: 'Usuário não identificado' }, { status: 400 });
    }

    const client = new AmploPayClient();
    
    // Limpeza rigorosa do CPF
    const cleanCpf = (userCpf || '').replace(/\D/g, '');

    // Identificador único curto e apenas números/letras (AmploPay prefere assim)
    const identifier = `H${Date.now()}`;
    
    // Forçando a URL de produção para evitar erro de 'Invalid URL' na AmploPay
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helix-bet-prod.vercel.app';
    const callbackUrl = `${baseUrl}/api/pix/webhook/amplopay`;

    console.log('[AMPLOPAY DEBUG] Request:', {
      amount: Number(amount),
      identifier,
      callbackUrl
    });

    const result = await client.createPixCharge({
      amount: Number(amount), // Decimal conforme docs oficiais
      identifier: identifier,
      callbackUrl: callbackUrl,
      client: {
        name: userName.substring(0, 50),
        email: userId.toLowerCase().trim(),
        phone: '11999999999', // Campo obrigatório pela AmploPay
        document: cleanCpf || '00000000000'
      }
    });

    /**
     * De acordo com a documentação AmploPay, o retorno costuma ser:
     * { status: "success", data: { qrcode: "...", payload: "...", id: "..." } }
     * Vamos adaptar conforme o retorno real.
     */
    const responseData = result.data || result;

    // Salva a transação pendente no banco de dados
    const supabase = createAdminClient();
    
    // Aproveita para salvar o CPF no perfil se o usuário não tiver
    if (cleanCpf && cleanCpf.length === 11) {
      await supabase.from('profiles')
        .update({ cpf: cleanCpf })
        .eq('email', userId.toLowerCase().trim())
        .is('cpf', null); // Só atualiza se estiver nulo
    }

    const { error: dbError } = await supabase.from('pix_deposits').insert({
      txid: identifier, // Usamos o nosso identifier para buscar no webhook
      email: userId.toLowerCase().trim(),
      amount: Number(amount),
      status: 'pending'
    });

    if (dbError) {
      console.error('[DB ERROR]', dbError.message);
    }

    // Retorna os dados para o modal exibir o QR Code cobrindo a estrutura exata da AmploPay
    return NextResponse.json({
      success: true,
      qrCode: responseData.pix?.base64 || responseData.qrcode || responseData.qrCode || responseData.qr_code || responseData.qrCodeBase64 || responseData.qr_code_base64 || '',
      payload: responseData.pix?.code || responseData.payload || responseData.copyPaste || responseData.pix_link || responseData.copiaECola || responseData.pixCopiaECola || responseData.paymentCode || responseData.emv || '',
      txid: identifier,
      debug: responseData // Enviando o objeto bruto para depuração
    });

  } catch (err: any) {
    console.error('[AMPLOPAY DEPOSIT]', err.response?.data || err.message);
    const msg = err.response?.data?.message || 'Erro ao gerar pagamento AmploPay';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
