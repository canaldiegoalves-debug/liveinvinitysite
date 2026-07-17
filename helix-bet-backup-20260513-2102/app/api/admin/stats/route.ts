import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * API Segura para o Painel Admin buscar estatísticas e jogadores
 * Bypass RLS usando Admin Client
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    // Validação de Token Admin
    const validToken = Buffer.from(`admin-auth-HELIX@ADMIN2026-secure-2026`).toString('base64');

    if (!token || token !== validToken) {
      console.warn('[ADMIN API] Tentativa de acesso negada: Token inválido');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Buscar todos os jogadores
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (userError) throw userError;

    // 2. Buscar pedidos de saque pendentes
    const { data: withdraws, error: withdrawError } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (withdrawError) throw withdrawError;

    // 3. Resumo financeiro robusto (Source of Truth: Tabelas de Transação)
    const { data: approvedWithdraws } = await supabase.from('withdraw_requests').select('amount').eq('status', 'approved');
    const { data: completedDeposits } = await supabase.from('pix_deposits').select('amount').eq('status', 'completed');

    const totalWithdrawn = (approvedWithdraws || []).reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const totalDeposited = (completedDeposits || []).reduce((acc, d) => acc + Number(d.amount || 0), 0);
    
    // Outros dados do resumo (apenas usuários reais para lucro líquido)
    const realUsers = (users || []).filter(u => !u.is_demo);
    const totalBalance = realUsers.reduce((acc, u) => acc + Number(u.balance || 0), 0);
    const totalGames = realUsers.reduce((acc, u) => acc + (u.games_played || 0), 0);
    const pendingWithdraws = (withdraws || []).reduce((acc, w) => acc + Number(w.amount || 0), 0);

    return NextResponse.json({
      success: true,
      users: (users || []).map(u => ({
        email: u.email,
        name: u.full_name || 'Usuário',
        totalDeposited: Number(u.total_deposited || 0),
        totalWithdrawn: Number(u.total_withdrawn || 0),
        gamesPlayed: u.games_played || 0,
        currentBalance: Number(u.balance || 0),
        isDemo: u.is_demo,
        created_at: u.created_at
      })),
      withdraws: withdraws || [],
      summary: {
        totalDeposited,
        totalWithdrawn,
        totalBalance,
        totalPlayers: realUsers.length,
        totalGames,
        pendingWithdraws
      }
    });

  } catch (err: any) {
    console.error('[ADMIN STATS API ERROR]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados do admin' }, { status: 500 });
  }
}
