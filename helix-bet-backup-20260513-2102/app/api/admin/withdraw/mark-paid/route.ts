import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { requestId, adminToken } = await req.json();

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

    // 2. Atualizar status no banco para 'approved'
    const { error: updateError } = await supabase
      .from('withdraw_requests')
      .update({ 
        status: 'approved'
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 3. Atualizar total_withdrawn no perfil
    const normalizedEmail = request.email.toLowerCase().trim();
    const { data: userProfile } = await supabase.from('profiles').select('total_withdrawn').eq('email', normalizedEmail).single();
    
    await supabase.from('profiles').update({
      total_withdrawn: Number(userProfile?.total_withdrawn || 0) + Number(request.amount)
    }).eq('email', normalizedEmail);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[ADMIN MARK PAID ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
