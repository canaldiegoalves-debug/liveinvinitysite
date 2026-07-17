import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { createWithdrawRequest, getUserStats, UserStats } from '../lib/statsManager';

interface WithdrawModalProps {
  onClose: () => void;
}

export default function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { user, updateProfile } = useAuthStore();
  const { balance, withdraw } = useGameStore();

  const [cpf,         setCpf]         = useState(user?.cpf || '');
  const [amount,      setAmount]      = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [e2eId,       setE2eId]       = useState('');
  const [dbUser,      setDbUser]      = useState<UserStats | null>(null);

  useEffect(() => {
    if (user?.email) {
      getUserStats(user.email).then(setDbUser);
    }
  }, [user]);

  const totalBonus = dbUser?.bonusBalance || 0;
  const totalDep   = dbUser?.totalDeposited || 0;
  const totalBet   = dbUser?.totalBet || 0;
  
  // Regra de Rollover do Bônus: Apostar 20x o valor do bônus
  const isBonusUnlocked = totalBonus === 0 || totalBet >= (totalBonus * 20);
  const withdrawableBalance = isBonusUnlocked ? balance : Math.max(0, balance - totalBonus);

  const PRESETS = [20, 50, 100, 200, 500];

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    
    if (!cpf || cpf.length < 11) {
      setError('Informe um CPF válido para continuar');
      return;
    }

    if (isNaN(val) || val < 20){ setError('Valor mínimo: R$ 20,00'); return; }
    
    if (val > withdrawableBalance) { 
      if (totalBonus > 0 && !isBonusUnlocked) {
        setError(`Você possui R$ ${totalBonus.toFixed(2)} em bônus travado. Aposte R$ ${Math.max(0, totalBonus * 20 - totalBet).toFixed(2)} para liberar.`);
      } else {
        setError('Saldo insuficiente');
      }
      return; 
    }

    // Regra de Rollover: 3x o valor depositado
    const requiredRollover = totalDep * 3;
    if (totalBet < requiredRollover) {
      setError(`Rollover pendente: você precisa apostar mais R$ ${(requiredRollover - totalBet).toFixed(2)} para liberar o saque.`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (!user?.cpf && cpf) {
        updateProfile({ cpf });
      }

      const res = await fetch('/api/pix/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user!.email,
          name: user!.name,
          amount: val,
          pixKey: cpf
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        withdraw(val); // Atualiza localmente também
        setE2eId(`REQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setSuccess(true);
      } else {
        setError(data.error || 'Erro ao processar saque. Verifique seu saldo no banco.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className={`pix-modal ${success ? 'pix-modal--success' : ''}`} onClick={e => e.stopPropagation()}>

        <div className="pix-header">
          <div className="pix-header-icon">🏦</div>
          <div>
            <div className="pix-header-title">Solicitar Saque PIX (v2)</div>
            <div className="pix-header-sub">
              Disponível: <span style={{ color: '#00ff88' }}>R$ {withdrawableBalance.toFixed(2)}</span>
              {totalBonus > 0 && !isBonusUnlocked && (
                <span style={{ fontSize: '9px', color: '#888', marginLeft: '8px' }}>
                  (R$ {totalBonus.toFixed(2)} em bônus 🔒)
                </span>
              )}
            </div>
          </div>
          <button className="pix-close" onClick={onClose}>✕</button>
        </div>

        {!success ? (
          <div className="pix-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            
            <div className="pix-field">
              <label className="pix-label">CPF DO TITULAR (CHAVE PIX)</label>
              <div className="pix-input-wrap">
                <input
                  type="text"
                  className="pix-input pix-input--full"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => { setCpf(e.target.value); setError(''); }}
                  disabled={!!user?.cpf} 
                  maxLength={14}
                />
                {user?.cpf && <span style={{ position: 'absolute', right: 14, fontSize: 12, color: '#00ff88' }}>🔒 Travado</span>}
              </div>
              <p className="pix-info" style={{ marginTop: 4, color: user?.cpf ? '#555' : '#ffcc00' }}>
                {user?.cpf 
                  ? 'O saque será enviado para este CPF cadastrado.' 
                  : '⚠️ O CPF deve ser o mesmo do titular da conta bancária.'}
              </p>
            </div>

            <div className="pix-field">
              <label className="pix-label">VALOR DO SAQUE</label>
              <div className="pix-presets" style={{ marginBottom: 10 }}>
                {PRESETS.filter(p => p <= balance).map(p => (
                  <button key={p}
                    className={`pix-preset ${amount === String(p) ? 'pix-preset--active' : ''}`}
                    onClick={() => setAmount(String(p))}>
                    R$ {p}
                  </button>
                ))}
                <button
                  className={`pix-preset ${amount === String(Math.floor(balance)) ? 'pix-preset--active' : ''}`}
                  onClick={() => setAmount(String(Math.floor(balance)))}>
                  Tudo
                </button>
              </div>
              <div className="pix-input-wrap">
                <span className="pix-input-prefix">R$</span>
                <input
                  type="number"
                  className="pix-input"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  min={20} max={balance}
                />
              </div>
              {amount && parseFloat(amount) >= 20 && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                    <span>Taxa de saque (5%):</span>
                    <span style={{ color: '#ff3b30' }}>- R$ {(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    <span>Você recebe:</span>
                    <span style={{ color: '#00ff88' }}>R$ {(parseFloat(amount) * 0.95).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="pix-error">⚠️ {error}</div>}

            {/* Barra de Rollover do Bônus */}
            {totalBonus > 0 && !isBonusUnlocked && (
              <div style={{ marginBottom: '16px', background: 'rgba(255,0,0,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#ff4444', fontWeight: 900, marginBottom: '6px' }}>
                  <span>ROLLOVER DO BÔNUS (APOSTAS)</span>
                  <span>R$ {totalBet.toFixed(2)} / R$ {(totalBonus * 20).toFixed(2)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (totalBet / (totalBonus * 20)) * 100)}%`, height: '100%', background: '#ff4444', boxShadow: '0 0 10px rgba(255,0,0,0.4)', transition: 'width 0.3s ease' }}></div>
                </div>
                <p style={{ fontSize: '9px', color: '#666', marginTop: '6px' }}>
                  Aposte mais R$ {Math.max(0, (totalBonus * 20) - totalBet).toFixed(2)} para desbloquear seu bônus.
                </p>
              </div>
            )}

            {/* Barra de Rollover Global (3x Depósitos) */}
            {totalBet < (totalDep * 3) && (
              <div style={{ marginBottom: '16px', background: 'rgba(255,204,0,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,204,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#ffcc00', fontWeight: 900, marginBottom: '6px' }}>
                   <span>ROLLOVER (APOSTAS MÍNIMAS 3X)</span>
                   <span>R$ {totalBet.toFixed(2)} / R$ {(totalDep * 3).toFixed(2)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (totalBet / (totalDep * 3 || 1)) * 100)}%`, height: '100%', background: '#ffcc00', boxShadow: '0 0 10px rgba(255,204,0,0.4)', transition: 'width 0.3s ease' }}></div>
                </div>
                <p style={{ fontSize: '9px', color: '#666', marginTop: '6px' }}>Você precisa apostar 3x o valor dos seus depósitos para sacar.</p>
              </div>
            )}

            <button
              className="pix-btn pix-btn--blue"
              onClick={handleWithdraw}
              disabled={isLoading || !cpf || !amount}
            >
              {isLoading ? <span className="pix-spinner" /> : '🏦 Solicitar saque'}
            </button>

            <p className="pix-info">Mín: R$ 20,00 · Prazo: até 30 min · Taxa: 5%</p>
          </div>
        ) : (
          <div className="pix-body pix-body--center">
            <div className="pix-success-icon">✅</div>
            <div className="pix-success-title">Saque solicitado!</div>
            <div className="pix-success-amount" style={{ color: '#3b82f6' }}>
              R$ {parseFloat(amount).toFixed(2)}
            </div>
            <div className="pix-success-balance">
              Saldo restante: R$ {balance.toFixed(2)}
            </div>
            <p className="pix-info" style={{ textAlign: 'center', marginTop: 8 }}>
              O valor será enviado para o CPF {cpf} em até 30 minutos.
            </p>
            {e2eId && (
              <p className="pix-info" style={{ color: '#333', fontSize: 11, wordBreak: 'break-all' }}>
                ID: {e2eId}
              </p>
            )}
            <button className="pix-btn pix-btn--ghost" onClick={onClose} style={{ marginTop: 20 }}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}

