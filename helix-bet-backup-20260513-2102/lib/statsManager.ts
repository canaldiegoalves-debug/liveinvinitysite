import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGameSettings } from './gameConfig';

export interface UserStats {
  email:          string;
  name:           string;
  totalDeposited: number;   
  totalWithdrawn: number;   
  totalLost:      number;   
  totalBet:       number;   
  gamesPlayed:    number;
  gamesWon:       number;   
  gamesLost:      number;   
  currentBalance: number;   
  firstSeen:      string;   
  lastSeen:       string;   
  transactions:   Transaction[];
  isDemo?:        boolean;  
  isInfluencer?:  boolean;  
  referredBy?:    string;   
  affiliatePercent?: number; 
  totalAffiliateEarnings?: number; 
  lastBonusClaimed?: string; 
  bonusBalance?: number; 
  affiliateId?: string;
  serverSeed?: string;
  clientSeed?: string;
  xp?: number;
  level?: number;
  cashbackBalance?: number;
  cpf?: string;
}

export interface Transaction {
  id:        string;
  type:      'deposit' | 'cashout' | 'loss' | 'bet' | 'withdraw';
  amount:    number;
  createdAt: string;
  detail?:   string;
}

export interface WithdrawRequest {
  id:        string;
  email:     string;
  name:      string;
  amount:    number;
  pixKey?:   string;
  status:    'pending' | 'approved' | 'refused';
  createdAt: string;
}

export interface Message {
  role: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  messages: Message[];
  status: 'pending' | 'replied';
  lastActivity: string;
}

// ─── Cliente Supabase ────────────────────────────────────────────────────────
// Decide qual cliente usar com base no ambiente (servidor vs browser)
const getSupabase = () => {
  if (typeof window === 'undefined') {
    return createAdminClient();
  }
  return createClient();
};

// ─── Busca de Usuários Real ──────────────────────────────────────────────────
export async function getAllUsersArray(adminToken?: string): Promise<UserStats[]> {
  if (!adminToken) return [];
  
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .order('last_seen', { ascending: false });

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }

  return data.map(u => ({
    email: u.email,
    name: u.full_name || 'Usuário',
    totalDeposited: Number(u.total_deposited || 0),
    totalWithdrawn: Number(u.total_withdrawn || 0),
    totalLost: Number(u.total_lost || 0),
    totalBet: Number(u.total_bet || 0),
    gamesPlayed: u.games_played || 0,
    gamesWon: u.games_won || 0,
    gamesLost: u.games_lost || 0,
    currentBalance: Number(u.balance || 0),
    firstSeen: u.created_at,
    lastSeen: u.last_seen || u.created_at,
    transactions: [],
    isDemo: u.is_demo,
    isInfluencer: u.is_influencer,
    referredBy: u.referred_by,
    affiliatePercent: u.affiliate_percent,
    totalAffiliateEarnings: u.total_affiliate_earnings,
    lastBonusClaimed: u.last_bonus_claimed,
    bonusBalance: u.bonus_balance,
    affiliateId: u.affiliate_id,
    serverSeed: u.server_seed,
    clientSeed: u.client_seed,
    xp: u.xp,
    level: u.level,
    cashbackBalance: u.cashback_balance,
    cpf: u.cpf
  }));
}

export async function getUserStats(email: string): Promise<UserStats | null> {
  const userEmail = email.toLowerCase().trim();

  // Se estiver no cliente, usa a API Segura para bypassar RLS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const result = await res.json();
      if (!result.success || !result.profile) return null;
      
      const p = result.profile;
      return {
        email: userEmail,
        name: p.full_name || 'Usuário',
        currentBalance: Number(p.balance || 0),
        xp: p.xp || 0,
        level: p.level || 1,
        isDemo: p.is_demo,
        affiliateId: p.affiliate_id,
        // Preenche o resto com valores padrão ou da resposta se necessário
        totalDeposited: 0, totalWithdrawn: 0, totalLost: 0, totalBet: 0, gamesPlayed: 0, gamesWon: 0, gamesLost: 0,
        firstSeen: '', lastSeen: '', transactions: []
      } as any;
    } catch (err) {
      console.error('Erro ao buscar stats via API:', err);
      return null;
    }
  }

  // Lógica original para o servidor (Admin Client)
  const { data: data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (error || !data) return null;

  // Buscar transações recentes
  const { data: txs } = await getSupabase()
    .from('transactions')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    email: data.email,
    name: data.full_name || 'Usuário',
    totalDeposited: Number(data.total_deposited || 0),
    totalWithdrawn: Number(data.total_withdrawn || 0),
    totalLost: Number(data.total_lost || 0),
    totalBet: Number(data.total_bet || 0),
    gamesPlayed: data.games_played || 0,
    gamesWon: data.games_won || 0,
    gamesLost: data.games_lost || 0,
    currentBalance: Number(data.balance || 0),
    firstSeen: data.created_at,
    lastSeen: data.last_seen || data.created_at,
    transactions: (txs || []).map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      createdAt: t.created_at,
      detail: t.detail
    })),
    isDemo: data.is_demo,
    isInfluencer: data.is_influencer,
    referredBy: data.referred_by,
    affiliatePercent: data.affiliate_percent,
    totalAffiliateEarnings: data.total_affiliate_earnings,
    lastBonusClaimed: data.last_bonus_claimed,
    bonusBalance: data.bonus_balance,
    affiliateId: data.affiliate_id,
    serverSeed: data.server_seed,
    clientSeed: data.client_seed,
    xp: data.xp,
    level: data.level,
    cashbackBalance: data.cashback_balance,
    cpf: data.cpf
  };
}

// ── Resumo Global para o Admin ────────────────────────────────────────────────
export async function getGlobalSummary(adminToken?: string) {
  if (!adminToken) return null;

  const { data: users, error: userError } = await getSupabase()
    .from('profiles')
    .select('total_deposited, total_withdrawn, total_lost, games_played')
    .eq('is_demo', false);

  const { data: pending, error: withdrawError } = await getSupabase()
    .from('withdraw_requests')
    .select('amount')
    .eq('status', 'pending');

  if (userError || withdrawError) {
    console.error('Erro no resumo global:', userError || withdrawError);
    return null;
  }

  return {
    totalPlayers:    users?.length || 0,
    totalDeposited:  users?.reduce((a, u) => a + Number(u.total_deposited || 0), 0) || 0,
    totalWithdrawn:  users?.reduce((a, u) => a + Number(u.total_withdrawn || 0), 0) || 0,
    totalLost:       users?.reduce((a, u) => a + Number(u.total_lost || 0), 0) || 0,
    totalGames:      users?.reduce((a, u) => a + (u.games_played || 0), 0) || 0,
    pendingWithdraws: pending?.reduce((a, r) => a + Number(r.amount || 0), 0) || 0
  };
}

// ── Gestão de Saques ─────────────────────────────────────────────────────────
export async function getPendingWithdraws(adminToken?: string): Promise<WithdrawRequest[]> {
  if (!adminToken) return [];
  
  const { data, error } = await getSupabase()
    .from('withdraw_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map(r => ({
    id: r.id,
    email: r.email,
    name: r.name,
    amount: Number(r.amount),
    pixKey: r.pix_key,
    status: r.status,
    createdAt: r.created_at
  }));
}

export async function approveWithdraw(requestId: string, adminToken: string) {
  if (!adminToken) return;
  const { error } = await getSupabase()
    .from('withdraw_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);
  return !error;
}


// ── Sistema de Suporte ───────────────────────────────────────────────────────
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  const { data: tickets, error } = await getSupabase()
    .from('support_tickets')
    .select(`
      *,
      support_messages (*)
    `)
    .order('last_activity', { ascending: false });

  if (error) return [];

  return tickets.map(t => ({
    id: t.id,
    userEmail: t.user_email,
    userName: t.user_name,
    status: t.status,
    lastActivity: t.last_activity,
    messages: t.support_messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ).map((m: any) => ({
      role: m.role,
      text: m.text,
      createdAt: m.created_at
    }))
  }));
}

export async function replySupportTicket(ticketId: string, reply: string) {
  const { error: msgError } = await getSupabase()
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      role: 'admin',
      text: reply
    });

  if (msgError) return false;

  await getSupabase()
    .from('support_tickets')
    .update({ 
      status: 'replied',
      last_activity: new Date().toISOString()
    })
    .eq('id', ticketId);

  return true;
}

export async function sendSupportMessage(userEmail: string, userName: string, text: string) {
  let { data: ticket, error: ticketError } = await getSupabase()
    .from('support_tickets')
    .select('id')
    .eq('user_email', userEmail.toLowerCase())
    .single();

  if (ticketError || !ticket) {
    const { data: newTicket, error: createError } = await getSupabase()
      .from('support_tickets')
      .insert({
        user_email: userEmail.toLowerCase(),
        user_name: userName,
        status: 'pending'
      })
      .select()
      .single();
    
    if (createError) return false;
    ticket = newTicket;
  } else {
    await getSupabase()
      .from('support_tickets')
      .update({ status: 'pending', last_activity: new Date().toISOString() })
      .eq('id', ticket.id);
  }

  const { error: msgError } = await getSupabase()
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      role: 'user',
      text: text
    });

  return !msgError;
}

export async function getSupportMessages(userEmail: string): Promise<SupportTicket[]> {
  const { data: tickets, error } = await getSupabase()
    .from('support_tickets')
    .select(`
      *,
      support_messages (*)
    `)
    .eq('user_email', userEmail.toLowerCase())
    .order('last_activity', { ascending: false });

  if (error || !tickets) return [];

  return tickets.map(t => ({
    id: t.id,
    userEmail: t.user_email,
    userName: t.user_name,
    status: t.status,
    lastActivity: t.last_activity,
    messages: (t.support_messages || []).sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ).map((m: any) => ({
      role: m.role,
      text: m.text,
      createdAt: m.created_at
    }))
  }));
}

export async function addFakeBalance(email: string, amount: number, adminToken: string) {
  if (!adminToken) return;
  const supabase = getSupabase();
  const { data: user } = await supabase.from('profiles').select('balance').eq('email', email.toLowerCase()).single();
  
  if (!user) {
    const { error: insertError } = await supabase.from('profiles').insert({
      email: email.toLowerCase(),
      full_name: 'Demo ' + email.split('@')[0],
      balance: amount,
      is_demo: true,
      last_seen: new Date().toISOString()
    });
    return !insertError;
  }

  const newBalance = Number(user.balance || 0) + amount;
  const { error } = await supabase
    .from('profiles')
    .update({ balance: newBalance, is_demo: true })
    .eq('email', email.toLowerCase());
  
  return !error;
}

export async function claimDailyBonus(email: string, amount: number) {
  const { data: user } = await getSupabase().from('profiles').select('balance, bonus_balance').eq('email', email.toLowerCase()).single();
  if (!user) return { success: false };

  const { error } = await getSupabase()
    .from('profiles')
    .update({ 
      balance: Number(user.balance || 0) + amount,
      bonus_balance: Number(user.bonus_balance || 0) + amount,
      last_bonus_claimed: new Date().toISOString()
    })
    .eq('email', email.toLowerCase());

  if (!error) {
    await recordTransaction(email, 'deposit', amount, 'Bônus Diário Coletado');
  }

  return { success: !error };
}

export async function recordBet(email: string, amount: number) {
  try {
    const res = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bet', email, amount, detail: 'Aposta Helix Jump' })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function recordCashOut(email: string, amount: number) {
  try {
    const res = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cashout', email, amount, detail: 'Ganho Helix Jump' })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function createWithdrawRequest(email: string, name: string, amount: number, pixKey: string) {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
    const res = await fetch(`${baseUrl}/api/pix/withdraw/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, amount, pixKey })
    });
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Withdraw request error:', error);
    return false;
  }
}

export async function recordPixDeposit(txid: string, email: string, amount: number) {
  const { data: existing } = await getSupabase()
    .from('pix_deposits')
    .select('status')
    .eq('txid', txid)
    .single();

  if (existing && existing.status === 'completed') {
    return { success: true, alreadyProcessed: true };
  }

  const { data: user } = await getSupabase()
    .from('profiles')
    .select('balance, total_deposited, referred_by, bonus_balance')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) return { success: false, error: 'User not found' };

  const isFirstDeposit = Number(user.total_deposited || 0) === 0;
  const bonusAmount = isFirstDeposit ? amount : 0;
  const newBalance = Number(user.balance || 0) + amount + bonusAmount;

  const { error: profileError } = await getSupabase()
    .from('profiles')
    .update({ 
      balance: newBalance,
      total_deposited: Number(user.total_deposited || 0) + amount,
      bonus_balance: Number(user.bonus_balance || 0) + bonusAmount
    })
    .eq('email', email.toLowerCase());

  if (profileError) return { success: false, error: profileError.message };

  if (user.referred_by) {
    const gameSettings = await getGameSettings();
    const commissionPercent = gameSettings.affiliateCommission || 30;
    const commission = amount * (commissionPercent / 100);
    const { data: affiliate } = await getSupabase()
      .from('profiles')
      .select('email, balance, total_affiliate_earnings')
      .eq('affiliate_id', user.referred_by.toUpperCase())
      .single();

    if (affiliate) {
      await getSupabase()
        .from('profiles')
        .update({
          balance: Number(affiliate.balance || 0) + commission,
          total_affiliate_earnings: Number(affiliate.total_affiliate_earnings || 0) + commission
        })
        .eq('email', affiliate.email);
      
      await recordTransaction(affiliate.email, 'deposit', commission, `Comissão de indicação: ${email}`);
    }
  }

  await getSupabase()
    .from('pix_deposits')
    .upsert({
      txid,
      email: email.toLowerCase(),
      amount,
      status: 'completed',
      updated_at: new Date().toISOString()
    });

  await recordTransaction(email, 'deposit', amount, 'Depósito via PIX');
  if (bonusAmount > 0) {
    await recordTransaction(email, 'deposit', bonusAmount, 'Bônus de 1º Depósito (100%)');
  }

  return { success: true };
}

async function recordTransaction(email: string, type: Transaction['type'], amount: number, detail: string) {
  await getSupabase()
    .from('transactions')
    .insert({
      email: email.toLowerCase(),
      type,
      amount,
      detail,
      created_at: new Date().toISOString()
    });
}

export async function recordLoss(email: string, amount: number) {
  try {
    const res = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'loss', email, amount, detail: 'Perda Helix Jump' })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getUserTransactions(email: string) {
  const { data, error } = await getSupabase()
    .from('transactions')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return [];
  return data;
}

export async function registerUser(email: string, name: string) {
  const { error } = await getSupabase()
    .from('profiles')
    .insert({
      email: email.toLowerCase(),
      full_name: name,
      balance: 0,
      is_demo: false
    });
  return !error;
}

export async function recordDeposit(email: string, amount: number) {
  const { data: user } = await getSupabase().from('profiles').select('balance, total_deposited').eq('email', email.toLowerCase()).single();
  if (!user) return false;

  const { error } = await getSupabase()
    .from('profiles')
    .update({ 
      balance: Number(user.balance || 0) + amount,
      total_deposited: Number(user.total_deposited || 0) + amount
    })
    .eq('email', email.toLowerCase());

  return !error;
}

export async function getRecentWins(limit = 10) {
  const { data: users } = await getSupabase()
    .from('profiles')
    .select('full_name, games_won, balance')
    .gt('games_won', 0)
    .order('last_seen', { ascending: false })
    .limit(limit);

  if (!users) return [];

  return users.map(u => ({
    name: u.full_name || 'Jogador',
    amount: (Math.random() * 50) + 10,
    multiplier: (Math.random() * 5) + 1.2
  }));
}
