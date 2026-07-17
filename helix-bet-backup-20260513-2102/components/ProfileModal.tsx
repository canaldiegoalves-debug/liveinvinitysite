'use client';

import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateProfile, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'data' | 'history'>('data');

  const handleRedeemCashback = async () => {
    if (!user?.email || !user?.cashback_balance || user.cashback_balance < 0.01) return;
    
    setLoading(true);
    try {
      const { createClient } = await import('../lib/supabase/client');
      const supabase = createClient();
      
      const amount = user.cashback_balance;
      const newBalance = ((user as any).balance || 0) + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          cashback_balance: 0 
        })
        .eq('email', user.email);
        
      if (error) throw error;
      
      await supabase.from('transactions').insert({
        email: user.email,
        type: 'cashback_redeem',
        amount: amount,
        detail: 'Resgate de Cashback acumulado'
      });
      
      updateProfile({ balance: newBalance, cashback_balance: 0 });
      alert(`Parabéns! R$ ${amount.toFixed(2)} foram adicionados ao seu saldo.`);
    } catch (err: any) {
      alert('Erro ao resgatar cashback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    updateProfile({ name, email }, password || undefined);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className="pix-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="pix-header">
          <div className="pix-icon">👤</div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{tab === 'data' ? 'Meu Perfil' : 'Extrato Detalhado'}</h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={() => setTab('data')}
                style={{ 
                  background: 'none', border: 'none', color: tab === 'data' ? '#00ff88' : '#555', 
                  fontSize: '11px', fontWeight: 900, cursor: 'pointer', borderBottom: tab === 'data' ? '2px solid #00ff88' : 'none',
                  paddingBottom: '4px'
                }}
              >MEUS DADOS</button>
              <button 
                onClick={() => setTab('history')}
                style={{ 
                  background: 'none', border: 'none', color: tab === 'history' ? '#00ff88' : '#555', 
                  fontSize: '11px', fontWeight: 900, cursor: 'pointer', borderBottom: tab === 'history' ? '2px solid #00ff88' : 'none',
                  paddingBottom: '4px'
                }}
              >HISTÓRICO</button>
            </div>
          </div>
          <button className="pix-close" onClick={onClose}>&times;</button>
        </div>

        <div className="pix-body" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
          {tab === 'data' ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">NOME COMPLETO</label>
                <input type="text" className="bet-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">E-MAIL</label>
                <input type="email" className="bet-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">NOVA SENHA (OPCIONAL)</label>
                <input type="password" className="bet-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="input-group">
                <label className="input-label">CPF / PIX (BLOQUEADO 🔒)</label>
                <input type="text" className="bet-input" value={user?.cpf || 'Não cadastrado'} disabled style={{ opacity: 0.5, cursor: 'not-allowed', background: 'rgba(0,0,0,0.2)' }} />
              </div>
              <div className="input-group" style={{ marginTop: '10px', padding: '15px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '15px' }}>
                <label className="input-label" style={{ color: '#00ff88' }}>🚀 INDIQUE E GANHE (30%+)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user?.affiliate_id || ''}`} className="bet-input" style={{ fontSize: '11px', flex: 1, background: 'rgba(0,0,0,0.3)' }} id="ref-link-input" />
                  <button type="button" onClick={() => {
                    const input = document.getElementById('ref-link-input') as HTMLInputElement;
                    input.select();
                    navigator.clipboard.writeText(input.value);
                    alert('Link copiado!');
                  }} style={{ background: '#00ff88', border: 'none', color: '#000', padding: '0 15px', borderRadius: '10px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>COPIAR</button>
                </div>
              </div>

              {/* Sistema de Cashback */}
              <div className="input-group" style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.1)', borderRadius: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ color: '#ffcc00' }}>💰 MEU CASHBACK</label>
                  <span style={{ fontSize: '10px', color: '#ffcc00', fontWeight: 900 }}>
                    {user?.level && user.level >= 6 ? '10% BACK' : user?.level && user.level >= 3 ? '5% BACK' : '2% BACK'}
                  </span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 950, color: '#fff' }}>R$ {(user?.cashback_balance || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '9px', color: '#888' }}>Acumulado de suas perdas</div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRedeemCashback}
                    disabled={loading || !user?.cashback_balance || user.cashback_balance < 1}
                    style={{ 
                      background: '#ffcc00', color: '#000', border: 'none', 
                      padding: '8px 16px', borderRadius: '10px', fontWeight: 950, fontSize: '11px',
                      cursor: (user?.cashback_balance || 0) >= 1 ? 'pointer' : 'not-allowed',
                      opacity: (user?.cashback_balance || 0) >= 1 ? 1 : 0.5
                    }}
                  >
                    RESGATAR
                  </button>
                </div>
              </div>

              {/* Sistema Provably Fair */}
              <div className="input-group" style={{ marginTop: '10px', padding: '15px', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: '15px' }}>
                <label className="input-label" style={{ color: '#7c3aed' }}>⚖️ JUSTIÇA COMPROVÁVEL (PROVABLY FAIR)</label>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#888' }}>HASH DA SEMENTE DO SERVIDOR (PRÓXIMO JOGO)</label>
                    <div style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', wordBreak: 'break-all', color: '#7c3aed', fontFamily: 'monospace' }}>
                      {user?.server_seed ? 'Gerado e Verificável' : 'Carregando...'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#888' }}>SUA SEMENTE (CLIENT SEED)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                      <input 
                        type="text" 
                        value={user?.client_seed || 'helix-default'} 
                        className="bet-input" 
                        style={{ fontSize: '11px', flex: 1, background: 'rgba(0,0,0,0.3)' }}
                        onChange={(e) => useAuthStore.getState().updateProfile({ client_seed: e.target.value })}
                        onBlur={async () => {
                          if (user?.email) {
                            const { createClient } = await import('../lib/supabase/client');
                            await createClient().from('profiles').update({ client_seed: user.client_seed }).eq('email', user.email);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-bet" disabled={loading || success} style={{ background: success ? '#00ff88' : 'var(--primary)', marginTop: '10px' }}>
                {loading ? 'SALVANDO...' : success ? 'ATUALIZADO! ✓' : 'SALVAR ALTERAÇÕES'}
              </button>
              <button 
                type="button" 
                onClick={() => { logout(); onClose(); window.location.reload(); }} 
                style={{ 
                  background: 'transparent', border: '1px solid rgba(255,59,48,0.5)', color: '#ff3b30', 
                  padding: '12px', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', marginTop: '10px' 
                }}
              >
                SAIR DA CONTA
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(user?.transactions || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#555', marginTop: '50px' }}>Nenhuma transação.</div>
              ) : (
                [...(user?.transactions || [])].reverse().map(tx => (
                  <div key={tx.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.type === 'deposit' ? '💰' : tx.type === 'cashout' ? '✅' : tx.type === 'loss' ? '❌' : '🎲'}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>{tx.detail}</div>
                        <div style={{ fontSize: '10px', color: '#555' }}>{fmtDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '14px', color: tx.type === 'cashout' || (tx.type === 'deposit' && tx.amount > 0) ? '#00ff88' : '#ff3b30' }}>
                      {tx.type === 'cashout' || (tx.type === 'deposit' && tx.amount > 0) ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
