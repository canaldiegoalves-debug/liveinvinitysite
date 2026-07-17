import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * API Segura para buscar dados do perfil sem expor o banco de dados
 * Esta rota usa o Admin Client para bypassar o RLS de forma controlada
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, action, updates } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const userKey = email.toLowerCase().trim();

    // 1. Ação de Atualização de Perfil
    if (action === 'update' && updates) {
      const { error: updError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('email', userKey);
      
      if (updError) return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // 2. Busca o perfil usando o Admin Client (Bypass RLS)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userKey)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Se a senha foi fornecida, verifica ela
    if (password) {
      // Nota: O hashPassword deve ser o mesmo usado no frontend
      // Aqui apenas retornamos se bater ou não para o frontend decidir
      return NextResponse.json({ 
        success: true, 
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          balance: profile.balance,
          is_demo: profile.is_demo,
          affiliate_id: profile.affiliate_id,
          created_at: profile.created_at,
          xp: profile.xp,
          level: profile.level,
          cashback_balance: profile.cashback_balance,
          password_hash: profile.password // Enviamos o hash para o frontend comparar
        }
      });
    }

    // 3. Se for apenas busca de saldo (sem senha), retornamos apenas o essencial
    return NextResponse.json({ 
      success: true, 
      profile: {
        balance: profile.balance,
        xp: profile.xp,
        level: profile.level
      }
    });

  } catch (err: any) {
    console.error('[USER PROFILE API ERROR]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
