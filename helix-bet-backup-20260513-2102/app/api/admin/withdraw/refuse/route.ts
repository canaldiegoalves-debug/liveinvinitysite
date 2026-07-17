import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { requestId, adminToken } = await req.json();

    // Validação básica de admin
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

    // 2. Devolver o saldo ao jogador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('email', request.email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do jogador não encontrado' }, { status: 404 });
    }

    const newBalance = Number(profile.balance || 0) + Number(request.amount);

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('email', request.email);

    if (updateProfileError) {
      return NextResponse.json({ error: 'Erro ao devolver saldo ao jogador' }, { status: 500 });
    }

    // 3. Atualizar status da solicitação para 'refused'
    const { error: updateRequestError } = await supabase
      .from('withdraw_requests')
      .update({ 
        status: 'refused'
      })
      .eq('id', requestId);

    if (updateRequestError) {
      // Nota: Idealmente isso seria uma transação atômica
      return NextResponse.json({ error: 'Erro ao atualizar status da solicitação' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[ADMIN REFUSE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
