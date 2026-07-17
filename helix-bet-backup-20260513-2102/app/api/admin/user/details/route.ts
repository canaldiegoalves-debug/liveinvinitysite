import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, adminToken } = await req.json();

    // Validação de admin
    const expectedToken = Buffer.from(`admin-auth-HELIX@ADMIN2026-secure-2026`).toString('base64');
    if (adminToken !== expectedToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const userEmail = email.toLowerCase().trim();

    // 1. Buscar Perfil Detalhado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // 2. Buscar Transações (Depósitos, Apostas, Ganhos, Perdas)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    // 3. Buscar Solicitações de Saque (Pendente, Aprovado, Recusado)
    const { data: withdraws, error: wError } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      profile,
      transactions: transactions || [],
      withdraws: withdraws || []
    });

  } catch (err: any) {
    console.error('[ADMIN USER DETAILS ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
