import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getUserTransactions } from '../lib/statsManager';

interface HistoryModalProps {
  onClose: () => void;
}

export default function HistoryModal({ onClose }: HistoryModalProps) {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      getUserTransactions(user.email).then(data => {
        setTransactions(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  // Tipos: 'deposit', 'withdraw', 'bet', 'cashout', 'loss'
  const filtered = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'finances') return t.type === 'deposit' || t.type === 'withdraw';
    if (filter === 'games') return t.type === 'bet' || t.type === 'cashout' || t.type === 'loss';
    return t.type === filter;
  });

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'deposit': return { text: 'DEPÓSITO', color: '#00ff88', icon: '💳' };
      case 'withdraw': return { text: 'SAQUE', color: '#ffcc00', icon: '🏦' };
      case 'bet': return { text: 'APOSTA', color: '#888', icon: '🎲' };
      case 'loss': return { text: 'PERDA', color: '#ff3b30', icon: '💥' };
      case 'cashout': return { text: 'GANHO', color: '#00cc6a', icon: '💰' };
      default: return { text: 'OUTRO', color: '#fff', icon: '📄' };
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pix-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="pix-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div className="pix-header" style={{ paddingBottom: '10px' }}>
          <div className="pix-header-icon" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}>📜</div>
          <div>
            <div className="pix-header-title">Histórico da Conta</div>
            <div className="pix-header-sub">Veja suas movimentações</div>
          </div>
          <button className="pix-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '0 24px', overflowX: 'auto', flexShrink: 0, paddingBottom: '10px' }}>
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'finances', label: 'Financeiro' },
            { id: 'games', label: 'Jogos' },
            { id: 'deposit', label: 'Depósitos' },
            { id: 'withdraw', label: 'Saques' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                background: filter === f.id ? '#00ff88' : 'rgba(255,255,255,0.05)',
                color: filter === f.id ? '#000' : '#888',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="pix-body" style={{ flex: 1, overflowY: 'auto', padding: '10px 24px 24px', background: 'transparent' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Carregando histórico...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>📭</div>
              Nenhum registro encontrado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(t => {
                const conf = getTypeLabel(t.type);
                const isNegative = t.type === 'bet' || t.type === 'loss' || t.type === 'withdraw';
                return (
                  <div key={t.id} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '15px',
                    borderLeft: `3px solid ${conf.color}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px' }}>{conf.icon}</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{conf.text}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>{formatDate(t.created_at)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: isNegative ? '#ff3b30' : conf.color }}>
                        {isNegative ? '-' : '+'} R$ {Number(t.amount).toFixed(2)}
                      </div>
                      {t.detail && <div style={{ fontSize: '9px', color: '#555', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
