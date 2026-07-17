import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';


export async function POST(req: NextRequest) {
  try {
    const { requestId, adminToken } = await req.json();

    // Validação básica de admin (conforme o padrão atual do projeto)
    const expectedToken = Buffer.from(`admin-auth-HELIX@ADMIN2026-secure-2026`).toString('base64');
    if (adminToken !== expectedToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Buscar a solicitação
    const { data: request, error: fetchError } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitação já foi processada' }, { status: 400 });
    }

    // 2. Buscar o CPF do usuário no perfil
    const { data: userProfileData } = await supabase
      .from('profiles')
      .select('cpf')
      .eq('email', request.email)
      .single();

    // Detecta o tipo de chave PIX de forma simples
    let pixType: 'cpf' | 'email' | 'phone' | 'evp' = 'evp';
    const cleanKey = request.pix_key.replace(/\s/g, '');
    
    if (/^\d{11}$/.test(cleanKey.replace(/\D/g, ''))) pixType = 'cpf';
    else if (cleanKey.includes('@')) pixType = 'email';
    else if (/^\+?\d{10,14}$/.test(cleanKey.replace(/\D/g, ''))) pixType = 'phone';

    const userCpf = userProfileData?.cpf || (pixType === 'cpf' ? request.pix_key : '');

    // 3. Realizar o envio do PIX via AmploPay
    const rawAmount = Number(request.amount);
    const fee = rawAmount * 0.05;
    const netAmount = Number((rawAmount - fee).toFixed(2));

    console.log(`[ADMIN WITHDRAW] Solicitado: R$ ${rawAmount} | Taxa (5%): R$ ${fee.toFixed(2)} | Enviando Líquido: R$ ${netAmount} para ${request.name}`);
    
    try {
      const { AmploPayClient } = require('@/lib/amplopay');
      const client = new AmploPayClient();
      
      const identifier = `WD-${requestId.split('-')[0]}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'https://helix-bet-prod.vercel.app';
      const callbackUrl = `${appUrl}/api/pix/webhook/amplopay`;
      
      const userIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

      const pixResult = await client.createTransfer({
        amount: netAmount,
        identifier: identifier,
        callbackUrl: callbackUrl,
        pix: {
          type: pixType,
          key: request.pix_key
        },
        owner: {
          name: request.name,
          document: {
            number: String(userCpf || '00000000000').replace(/\D/g, ''),
            type: 'cpf'
          },
          ip: userIp
        }
      });
      
      // Mapeia o retorno da AmploPay
      const externalId = pixResult.data?.id || pixResult.id || identifier;

      // 3. Atualizar status no banco
      const { error: updateError } = await supabase
        .from('withdraw_requests')
        .update({ 
          status: 'approved'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 4. Registrar na tabela de perfis (total_withdrawn) - Normalizado para evitar erro de Case Sensitivity
      const normalizedEmail = request.email.toLowerCase().trim();
      const { data: userProfile } = await supabase.from('profiles').select('total_withdrawn').eq('email', normalizedEmail).single();
      
      const { error: profileUpdateError } = await supabase.from('profiles').update({
        total_withdrawn: Number(userProfile?.total_withdrawn || 0) + Number(request.amount)
      }).eq('email', normalizedEmail);

      if (profileUpdateError) {
        console.error(`[ADMIN WITHDRAW] Erro ao atualizar total_withdrawn do perfil ${normalizedEmail}:`, profileUpdateError);
      }

      console.log(`[ADMIN WITHDRAW] Saque aprovado com sucesso para ${normalizedEmail}: R$ ${request.amount}`);
      return NextResponse.json({ success: true, e2eId: externalId });

    } catch (pixErr: any) {
      const apiError = pixErr.response?.data;
      const errorMsg = apiError?.message || pixErr.message || 'Falha ao enviar PIX';
      const details = apiError?.errors ? JSON.stringify(apiError.errors) : (apiError?.details ? JSON.stringify(apiError.details) : '');

      console.error('[AMPLOPAY WITHDRAW ERROR]', {
        message: errorMsg,
        data: apiError,
        stack: pixErr.stack
      });

      return NextResponse.json({ 
        error: `Erro na AmploPay: ${errorMsg} ${details}` 
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('[ADMIN APPROVE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
