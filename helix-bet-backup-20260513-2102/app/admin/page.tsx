'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { getAllUsersArray, getGlobalSummary, UserStats, getPendingWithdraws, getAllSupportTickets, replySupportTicket, addFakeBalance } from '../../lib/statsManager';
import { getGameSettings, saveGameSettings, GameDifficulty } from '../../lib/gameConfig';

const generateAdminToken = (pass: string) => Buffer.from(`admin-auth-${pass}-secure-2026`).toString('base64');

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPass] = useState('');
  const [passError, setPassErr] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sessionToken = sessionStorage.getItem('helix-admin-token');
    if (sessionToken === generateAdminToken('HELIX@ADMIN2026')) setAuthed(true);
  }, []);

  if (!mounted) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput.toUpperCase() === "HELIX@ADMIN2026") {
      sessionStorage.setItem('helix-admin-token', generateAdminToken("HELIX@ADMIN2026"));
      setAuthed(true);
    } else {
      setPassErr(true);
      setTimeout(() => setPassErr(false), 2000);
    }
  };

  if (!authed) return (
    <div className="adm-login-bg">
      <style>{`
        .adm-login-bg { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050508; font-family: sans-serif; }
        .adm-login-card { background: #0f0f15; padding: 40px; border-radius: 20px; text-align: center; border: 1px solid #1a1a2e; color: #fff; }
        .adm-login-input { background: #000; border: 1px solid #1a1a2e; color: #fff; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 20px; outline: none; }
        .adm-login-btn { background: #00ff88; color: #000; border: none; padding: 12px; border-radius: 8px; width: 100%; font-weight: 900; cursor: pointer; }
        .adm-shake { animation: shake 0.5s; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
      `}</style>
      <div className={`adm-login-card ${passError ? 'adm-shake' : ''}`}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛡️</div>
        <h1 style={{ marginBottom: '10px' }}>Área Restrita</h1>
        <p style={{ color: '#555', marginBottom: '30px' }}>Helix Bet Admin</p>
        <form onSubmit={handleLogin}>
          <input type="password" className="adm-login-input" placeholder="Senha Master" value={passInput} onChange={e => setPass(e.target.value)} />
          <button type="submit" className="adm-login-btn">ACESSAR PAINEL</button>
        </form>
      </div>
    </div>
  );

  return <AdminDashboard></AdminDashboard>;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<UserStats[]>([]);
  const [pendingW, setPendingW] = useState<any[]>([]);
  const [historyW, setHistoryW] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('MEDIUM');
  const [settings, setSettings] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem('helix-admin-token') || '';
    if (!token) return;

    try {
      const [statsRes, gameSettings] = await Promise.all([
        fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }).then(res => res.json()),
        getGameSettings()
      ]);

      if (statsRes.success) {
        setUsers(statsRes.users);
        setSummary(statsRes.summary);
        setPendingW(statsRes.withdraws.filter((w: any) => w.status === 'pending'));
        setHistoryW(statsRes.withdraws.filter((w: any) => w.status !== 'pending'));
      }
      
      setSettings(gameSettings);
      setDifficulty(gameSettings.difficulty);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const fetchUserDetails = async (email: string) => {
    setLoadingDetails(true);
    setSelectedUser(email);
    try {
      const res = await fetch('/api/admin/user/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          adminToken: sessionStorage.getItem('helix-admin-token')
        })
      });
      const data = await res.json();
      if (data.success) {
        setUserDetails(data);
      } else {
        alert('Erro ao buscar detalhes: ' + data.error);
        setSelectedUser(null);
      }
    } catch (e) {
      alert('Erro na conexão');
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    if (!confirm("Deseja marcar este saque como PAGO manualmente? \n\nUse isso APENAS se o valor já saiu da sua conta e o sistema não atualizou sozinho.")) return;
    
    try {
      const res = await fetch('/api/admin/withdraw/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminToken: sessionStorage.getItem('helix-admin-token')
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Saque marcado como pago com sucesso!');
        setRefreshKey(k => k + 1);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (e) {
      alert('Erro na conexão');
    }
  };

  const formatBRT = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  return (
    <div className="adm-root">
      <style>{`
        .adm-root { display: flex; height: 100vh; background: #050508; color: #fff; font-family: sans-serif; }
        .adm-sidebar { width: 250px; background: #0a0a0f; border-right: 1px solid #1a1a2e; padding: 20px; display: flex; flex-direction: column; }
        .adm-nav-item { padding: 12px; cursor: pointer; border-radius: 8px; color: #888; margin-bottom: 5px; font-size: 14px; }
        .adm-nav-item:hover { background: #1a1a2e; color: #fff; }
        .adm-nav-item--active { background: rgba(0,255,136,0.1); color: #00ff88; font-weight: 900; }
        .adm-main { flex: 1; padding: 40px; overflow-y: auto; }
        .adm-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .adm-card { background: #0f0f15; padding: 20px; border-radius: 15px; border: 1px solid #1a1a2e; }
        .adm-support-card { background: #0f0f15; padding: 20px; border-radius: 15px; margin-bottom: 15px; border: 1px solid #1a1a2e; }
        .adm-support-pending { border-left: 4px solid #ffcc00; }
        .adm-support-replied { border-left: 4px solid #00ff88; opacity: 0.6; }
        .adm-fake-btn { background: #00ff88; color: #000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 900; cursor: pointer; margin-top: 10px; }
      `}</style>
      
      <aside className="adm-sidebar">
        <h2 style={{ marginBottom: '30px', color: '#00ff88' }}>⬡ HELIX</h2>
        <nav>
          <div className={`adm-nav-item ${activeTab === 'dashboard' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div className={`adm-nav-item ${activeTab === 'players' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('players')}>👥 Jogadores</div>
          <div className={`adm-nav-item ${activeTab === 'withdrawals' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('withdrawals')}>💸 Saques Pendentes</div>
          <div className={`adm-nav-item ${activeTab === 'history_withdraw' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('history_withdraw')}>📜 Histórico de Saques</div>
          <div className={`adm-nav-item ${activeTab === 'demo' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('demo')}>🎥 Contas Demo</div>
          <div className={`adm-nav-item ${activeTab === 'support' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('support')}>💬 Suporte</div>
          <div className={`adm-nav-item ${activeTab === 'affiliates' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('affiliates')}>🤝 Afiliados</div>
          <div className={`adm-nav-item ${activeTab === 'config' ? 'adm-nav-item--active' : ''}`} onClick={() => setActiveTab('config')}>⚙️ Configurações</div>
        </nav>
      </aside>

      <main className="adm-main">
        {activeTab === 'dashboard' && summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="adm-cards">
              <div className="adm-card">
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 800 }}>JOGADORES REAIS</div>
                <div style={{ fontSize: '28px', fontWeight: 950 }}>{summary.totalPlayers}</div>
              </div>
              <div className="adm-card" style={{ borderLeft: '4px solid #00ff88' }}>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 800 }}>TOTAL DEPOSITADO</div>
                <div style={{ fontSize: '28px', fontWeight: 950, color: '#00ff88' }}>R$ {summary.totalDeposited.toFixed(2)}</div>
              </div>
              <div className="adm-card" style={{ borderLeft: '4px solid #ff3b30' }}>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 800 }}>TOTAL SACADO (GANHOS USER)</div>
                <div style={{ fontSize: '28px', fontWeight: 950, color: '#ff3b30' }}>R$ {summary.totalWithdrawn.toFixed(2)}</div>
              </div>
              <div className="adm-card" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid #00ff88' }}>
                <div style={{ color: '#00ff88', fontSize: '12px', fontWeight: 800 }}>LUCRO LÍQUIDO (GGR)</div>
                <div style={{ fontSize: '32px', fontWeight: 950, color: '#00ff88' }}>R$ {(summary.totalDeposited - summary.totalWithdrawn).toFixed(2)}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '5px' }}>Margem de Lucro: {(((summary.totalDeposited - summary.totalWithdrawn) / (summary.totalDeposited || 1)) * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="adm-card">
              <h3 style={{ marginBottom: '20px' }}>Atividade do Sistema</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#555' }}>SAQUES PENDENTES</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffcc00' }}>R$ {summary.pendingWithdraws.toFixed(2)}</div>
                </div>
                <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#555' }}>TOTAL DE APOSTAS</div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>{summary.totalGames}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="adm-card">
            <h2 style={{ marginBottom: '20px' }}>Lista de Jogadores</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a2e', textAlign: 'left', color: '#555' }}>
                    <th style={{ padding: '12px' }}>NOME / EMAIL</th>
                    <th style={{ padding: '12px' }}>SALDO ATUAL</th>
                    <th style={{ padding: '12px' }}>DEPÓSITOS</th>
                    <th style={{ padding: '12px' }}>SAQUES</th>
                    <th style={{ padding: '12px' }}>APOSTAS</th>
                    <th style={{ padding: '12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr 
                      key={u.email} 
                      onClick={() => fetchUserDetails(u.email)}
                      style={{ borderBottom: '1px solid #1a1a2e', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800 }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: '#555' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#00ff88', fontWeight: 900 }}>R$ {u.currentBalance.toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>R$ {u.totalDeposited.toFixed(2)}</td>
                      <td style={{ padding: '12px', color: '#ff3b30' }}>R$ {u.totalWithdrawn.toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>{u.gamesPlayed} jogos</td>
                      <td style={{ padding: '12px' }}>
                        {u.isDemo ? <span style={{ background: '#444', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>DEMO</span> : <span style={{ background: '#002200', color: '#00ff88', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>REAL</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <SupportManager onRefresh={() => setRefreshKey(k => k + 1)}></SupportManager>
        )}

        {activeTab === 'withdrawals' && (
          <div>
            <h2>Solicitações de Saque</h2>
            {pendingW.length === 0 ? <p>Nenhum saque pendente.</p> : pendingW.map(w => (
              <div key={w.id} className="adm-support-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{w.name}</strong> ({w.email})<br />
                  <span style={{ fontSize: '20px', color: '#00ff88', fontWeight: 900 }}>R$ {(w.amount * 0.95).toFixed(2)}</span>
                  <span style={{ fontSize: '12px', color: '#555', marginLeft: '10px' }}> (Solicitado: R$ {w.amount.toFixed(2)} | Taxa: R$ {(w.amount * 0.05).toFixed(2)})</span><br />
                  <small>PIX: {w.pixKey}</small>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={async () => { 
                    const netAmt = (w.amount * 0.95).toFixed(2);
                    if (!confirm(`Deseja aprovar o saque? \n\nValor Solicitado: R$ ${w.amount.toFixed(2)}\nTaxa (5%): R$ ${(w.amount * 0.05).toFixed(2)}\nVALOR LÍQUIDO A ENVIAR: R$ ${netAmt}`)) return;
                    
                    const res = await fetch('/api/admin/withdraw/approve', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        requestId: w.id,
                        adminToken: sessionStorage.getItem('helix-admin-token')
                      })
                    });
                    
                    const data = await res.json();
                    if (data.success) {
                      alert('Saque enviado com sucesso!');
                      setRefreshKey(k => k + 1);
                    } else {
                      alert('Erro: ' + (data.error || 'Falha ao processar saque'));
                    }
                  }} style={{ background: '#00ff88', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>APROVAR</button>
                  
                  <button 
                    onClick={() => handleMarkPaid(w.id)}
                    style={{ background: 'none', color: '#555', border: '1px solid #333', padding: '10px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
                  >MARCAR COMO PAGO</button>

                  <button onClick={async () => { 
                    if (!confirm(`Deseja realmente RECUSAR o saque de R$ ${w.amount.toFixed(2)} para ${w.name}? O saldo será devolvido ao jogador.`)) return;

                    const res = await fetch('/api/admin/withdraw/refuse', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        requestId: w.id,
                        adminToken: sessionStorage.getItem('helix-admin-token')
                      })
                    });
                    
                    const data = await res.json();
                    if (data.success) {
                      alert('Saque recusado e saldo devolvido com sucesso!');
                      setRefreshKey(k => k + 1);
                    } else {
                      alert('Erro ao recusar: ' + (data.error || 'Falha no processamento'));
                    }
                  }} style={{ background: '#ff3b30', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>RECUSAR</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history_withdraw' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Histórico de Processamento</h2>
            {historyW.length === 0 ? <p>Nenhum saque processado ainda.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a1a2e', textAlign: 'left', color: '#555' }}>
                      <th style={{ padding: '12px' }}>JOGADOR</th>
                      <th style={{ padding: '12px' }}>VALOR</th>
                      <th style={{ padding: '12px' }}>DATA</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px' }}>ID E2E / MOTIVO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyW.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800 }}>{w.name}</div>
                          <div style={{ fontSize: '11px', color: '#555' }}>{w.email}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 900, color: w.status === 'approved' ? '#00ff88' : '#ff3b30' }}>
                          R$ {w.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '11px' }}>{new Date(w.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900,
                            background: w.status === 'approved' ? 'rgba(0,255,136,0.1)' : 'rgba(255,59,48,0.1)',
                            color: w.status === 'approved' ? '#00ff88' : '#ff3b30'
                          }}>
                            {w.status === 'approved' ? 'PAGO / APROVADO' : 'RECUSADO'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '10px', color: '#555', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.e2e_id || '---'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'affiliates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="adm-card">
              <h2 style={{ marginBottom: '15px' }}>Comissão Global de Afiliados</h2>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
                Defina qual a porcentagem (%) que o afiliado ganha sobre o valor depositado pelos seus indicados.
              </p>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>PORCENTAGEM (%)</label>
                  <input 
                    type="number" 
                    className="adm-login-input" 
                    style={{ margin: 0 }}
                    value={settings?.affiliateCommission || 0}
                    onChange={(e) => setSettings({ ...settings, affiliateCommission: parseFloat(e.target.value) })}
                  />
                </div>
                <button 
                  className="adm-fake-btn" 
                  style={{ margin: 0, height: '45px', padding: '0 30px' }}
                  onClick={async () => {
                    const res = await saveGameSettings({ affiliateCommission: settings.affiliateCommission });
                    if (res.success) alert('Comissão atualizada para ' + settings.affiliateCommission + '%');
                    else alert('Erro ao salvar');
                  }}
                >SALVAR ALTERAÇÃO</button>
              </div>
            </div>

            <div className="adm-card">
              <h3 style={{ marginBottom: '20px' }}>Ranking de Afiliados</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a1a2e', textAlign: 'left', color: '#555' }}>
                      <th style={{ padding: '12px' }}>AFILIADO</th>
                      <th style={{ padding: '12px' }}>ID AFILIADO</th>
                      <th style={{ padding: '12px' }}>TOTAL GANHO</th>
                      <th style={{ padding: '12px' }}>SALDO DISPONÍVEL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => (u as any).totalAffiliateEarnings > 0 || (u as any).total_affiliate_earnings > 0).sort((a, b) => ((b as any).totalAffiliateEarnings || 0) - ((a as any).totalAffiliateEarnings || 0)).map(u => (
                      <tr key={u.email} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800 }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: '#555' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 900 }}>
                            {(u as any).affiliateId || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#00ff88', fontWeight: 900 }}>R$ {((u as any).totalAffiliateEarnings || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px' }}>R$ {u.currentBalance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="adm-card">
              <h2 style={{ marginBottom: '15px' }}>Adicionar/Converter Conta Demo</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="email" 
                  id="demo-email-input"
                  placeholder="Email do Jogador" 
                  className="adm-login-input" 
                  style={{ margin: 0, flex: 2 }} 
                />
                <input 
                  type="number" 
                  id="demo-amount-input"
                  placeholder="Valor" 
                  className="adm-login-input" 
                  style={{ margin: 0, flex: 1 }} 
                />
                <button className="adm-fake-btn" style={{ margin: 0 }} onClick={async () => {
                  const email = (document.getElementById('demo-email-input') as HTMLInputElement).value;
                  const amt = (document.getElementById('demo-amount-input') as HTMLInputElement).value;
                  if (email && amt) {
                    await addFakeBalance(email, parseFloat(amt), sessionStorage.getItem('helix-admin-token') || '');
                    alert('Saldo injetado e conta definida como DEMO!');
                    (document.getElementById('demo-email-input') as HTMLInputElement).value = '';
                    (document.getElementById('demo-amount-input') as HTMLInputElement).value = '';
                    setRefreshKey(k => k + 1);
                  }
                }}>INJETAR / CRIAR</button>
              </div>
            </div>

            <div>
              <h2>Contas Demo Ativas</h2>
            {users.filter(u => u.isDemo).map(u => (
              <div key={u.email} className="adm-support-card">
                <strong>{u.name}</strong> ({u.email})<br />
                Saldo: R$ {u.currentBalance.toFixed(2)}<br />
                <button className="adm-fake-btn" onClick={async () => {
                  const amt = prompt('Valor para injetar:');
                  if (amt) {
                    await addFakeBalance(u.email, parseFloat(amt), sessionStorage.getItem('helix-admin-token') || '');
                    setRefreshKey(k => k + 1);
                  }
                }}>INJETAR SALDO</button>
              </div>
            ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="adm-card">
              <h2 style={{ marginBottom: '20px' }}>Dificuldade Global</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['EASY', 'MEDIUM', 'HARD'].map(lv => (
                  <button key={lv} onClick={async () => {
                    await saveGameSettings({ difficulty: lv as GameDifficulty });
                    setDifficulty(lv as GameDifficulty);
                    setRefreshKey(k => k + 1);
                  }} style={{ 
                    flex: 1, padding: '15px', borderRadius: '10px', border: 'none',
                    background: difficulty === lv ? '#00ff88' : '#222',
                    color: difficulty === lv ? '#000' : '#888',
                    fontWeight: 900, cursor: 'pointer'
                  }}>{lv}</button>
                ))}
              </div>
            </div>

            <div className="adm-card">
              <h2 style={{ marginBottom: '20px' }}>Mecânicas do Jogo ({difficulty})</h2>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>Ajuste os parâmetros técnicos que influenciam o ganho do jogador.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>CHANCE DE BURACO (0.0 a 1.0)</label>
                  <input 
                    type="number" step="0.05"
                    className="adm-login-input" 
                    value={settings?.customParams?.[difficulty].gapChance || 0} 
                    onChange={async (e) => {
                      const params = { ...settings.customParams };
                      params[difficulty].gapChance = parseFloat(e.target.value);
                      await saveGameSettings({ customParams: params });
                      setRefreshKey(k => k + 1);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>FATOR DE PERIGO (VERMELHO)</label>
                  <input 
                    type="number" step="0.05"
                    className="adm-login-input" 
                    value={settings?.customParams?.[difficulty].dangerMaxFactor || 0} 
                    onChange={async (e) => {
                      const params = { ...settings.customParams };
                      params[difficulty].dangerMaxFactor = parseFloat(e.target.value);
                      await saveGameSettings({ customParams: params });
                      setRefreshKey(k => k + 1);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>VELOCIDADE DE ROTAÇÃO</label>
                  <input 
                    type="number" step="0.01"
                    className="adm-login-input" 
                    value={settings?.customParams?.[difficulty].rotationSpeed || 0} 
                    onChange={async (e) => {
                      const params = { ...settings.customParams };
                      params[difficulty].rotationSpeed = parseFloat(e.target.value);
                      await saveGameSettings({ customParams: params });
                      setRefreshKey(k => k + 1);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '8px' }}>MULTIPLICADOR POR NÍVEL</label>
                  <input 
                    type="number" step="0.01"
                    className="adm-login-input" 
                    value={settings?.customParams?.[difficulty].multiplierStep || 0} 
                    onChange={async (e) => {
                      const params = { ...settings.customParams };
                      params[difficulty].multiplierStep = parseFloat(e.target.value);
                      await saveGameSettings({ customParams: params });
                      setRefreshKey(k => k + 1);
                    }}
                  />
                </div>
              </div>
              
              <button 
                onClick={() => alert('Configurações aplicadas com sucesso para todos os jogadores!')}
                style={{ 
                  width: '100%', padding: '15px', borderRadius: '10px', border: 'none', 
                  background: '#00ff88', color: '#000', fontWeight: 900, marginTop: '20px', cursor: 'pointer' 
                }}
              >
                💾 SALVAR NÍVEL / CONFIGURAÇÃO
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE HISTÓRICO DO JOGADOR */}
      {selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="adm-card" style={{ 
            width: '100%', maxWidth: '900px', maxHeight: '90vh', 
            overflowY: 'auto', position: 'relative', border: '1px solid #1a1a2e',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '24px' }}
            >✕</button>

            {loadingDetails ? (
              <div style={{ padding: '100px', textAlign: 'center' }}>Carregando histórico detalhado...</div>
            ) : userDetails && (
              <div>
                <div style={{ borderBottom: '1px solid #1a1a2e', paddingBottom: '20px', marginBottom: '20px' }}>
                  <h2 style={{ color: '#00ff88' }}>{userDetails.profile.full_name || 'Jogador'}</h2>
                  <p style={{ color: '#555', fontSize: '14px' }}>{userDetails.profile.email} • ID: {userDetails.profile.id.split('-')[0]}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#555' }}>SALDO EM CONTA</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>R$ {userDetails.profile.balance.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#555' }}>TOTAL DEPOSITADO</div>
                      <div style={{ fontSize: '18px', fontWeight: 900 }}>R$ {userDetails.profile.total_deposited.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#555' }}>TOTAL SACADO</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#ff3b30' }}>R$ {userDetails.profile.total_withdrawn.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#000', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#555' }}>JOGOS / WIN RATE</div>
                      <div style={{ fontSize: '18px', fontWeight: 900 }}>{userDetails.profile.games_played} / {((userDetails.profile.games_won / (userDetails.profile.games_played || 1)) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* COLUNA: TRANSAÇÕES (DEPÓSITOS E APOSTAS) */}
                  <div>
                    <h3 style={{ marginBottom: '15px', fontSize: '14px', color: '#888' }}>💸 Fluxo de Caixa & Jogos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {userDetails.transactions.length === 0 ? <p style={{ fontSize: '12px', color: '#333' }}>Sem transações registradas.</p> : userDetails.transactions.map((tx: any) => (
                        <div key={tx.id} style={{ background: '#000', padding: '10px', borderRadius: '8px', borderLeft: `3px solid ${tx.type === 'deposit' || tx.type === 'cashout' ? '#00ff88' : '#ff3b30'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>
                              {tx.type === 'deposit' ? '💰 Depósito' : tx.type === 'bet' ? '🎮 Aposta' : tx.type === 'cashout' ? '🏆 Ganho' : '💀 Perda'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 900, color: tx.type === 'deposit' || tx.type === 'cashout' ? '#00ff88' : '#ff3b30' }}>
                              {tx.type === 'deposit' || tx.type === 'cashout' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#444' }}>{tx.detail}</div>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>🕒 {formatBRT(tx.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLUNA: SAQUES SOLICITADOS */}
                  <div>
                    <h3 style={{ marginBottom: '15px', fontSize: '14px', color: '#888' }}>🏦 Solicitações de Saque</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {userDetails.withdraws.length === 0 ? <p style={{ fontSize: '12px', color: '#333' }}>Sem saques solicitados.</p> : userDetails.withdraws.map((w: any) => (
                        <div key={w.id} style={{ background: '#000', padding: '10px', borderRadius: '8px', opacity: w.status === 'refused' ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900 }}>
                              {w.status === 'pending' ? '⏳ PENDENTE' : w.status === 'approved' ? '✅ APROVADO' : '❌ RECUSADO'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#ff3b30' }}>R$ {w.amount.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#444' }}>PIX: {w.pix_key}</div>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>🕒 {formatBRT(w.created_at)}</div>
                          {w.status === 'approved' && <div style={{ fontSize: '9px', color: '#00ff88', marginTop: '3px' }}>ID: {w.e2e_id}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SupportManager({ onRefresh }: { onRefresh: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setMessages(await getAllSupportTickets());
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000); 
    return () => clearInterval(timer);
  }, [load]);

  const handleReply = async (id: string) => {
    const text = replyTexts[id];
    if (!text || !text.trim()) return;
    
    await replySupportTicket(id, text);
    setReplyTexts(prev => ({ ...prev, [id]: '' }));
    await load();
    onRefresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '10px', height: '10px', background: '#ff3b30', borderRadius: '50%', boxShadow: '0 0 10px #ff3b30' }}></span>
        Suporte em Tempo Real
      </h2>
      
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#555', background: '#0f0f15', borderRadius: '20px' }}>
          Nenhuma mensagem de suporte pendente.
        </div>
      ) : (
        messages.map(msg => (
          <div key={msg.id} className="adm-support-card" style={{ 
            background: '#0f0f15', 
            padding: '20px', 
            borderRadius: '20px', 
            border: '1px solid #1a1a2e',
            borderLeft: msg.status === 'pending' ? '4px solid #ffcc00' : '4px solid #00ff88'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, border: '1px solid #00ff88' }}>{msg.id.split('-')[1]}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {msg.userName} 
                    <span style={{ fontSize: '10px', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{msg.id}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{msg.userEmail}</div>
                </div>
              </div>
              <small style={{ color: '#444', fontSize: '10px' }}>{new Date(msg.lastActivity).toLocaleString()}</small>
            </div>

            <div style={{ background: '#000', padding: '15px', borderRadius: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {msg.messages.map((m: any, i: number) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'admin' ? 'flex-end' : 'flex-start',
                  background: m.role === 'admin' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  maxWidth: '90%',
                  border: m.role === 'admin' ? '1px solid rgba(0,255,136,0.2)' : 'none'
                }}>
                  <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '2px' }}>{m.role === 'admin' ? 'VOCÊ' : 'JOGADOR'}</div>
                  {m.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="Digite sua resposta..."
                style={{ 
                  flex: 1, background: '#000', border: '1px solid #1a1a2e', color: '#fff', 
                  padding: '12px 15px', borderRadius: '12px', outline: 'none', fontSize: '13px'
                }}
                value={replyTexts[msg.id] || ''}
                onChange={e => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
              />
              <button 
                onClick={() => handleReply(msg.id)}
                style={{ 
                  background: '#00ff88', color: '#000', border: 'none', 
                  padding: '0 20px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' 
                }}
              >
                ENVIAR
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
