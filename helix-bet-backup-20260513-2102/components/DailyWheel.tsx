'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { getUserStats, claimDailyBonus } from '../lib/statsManager';

export default function DailyWheel({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const { deposit } = useGameStore();
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    getUserStats(user.email).then(myStats => {
      if (myStats?.lastBonusClaimed) {
        const last = new Date(myStats.lastBonusClaimed).getTime();
        const now = Date.now();
        const diff = now - last;
        if (diff < 24 * 60 * 60 * 1000) {
          const remaining = 24 * 60 * 60 * 1000 - diff;
          const hours = Math.floor(remaining / (3600 * 1000));
          const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
          setCooldown(`${hours}h ${mins}m`);
        }
      }
    });
  }, [user]);

  const spin = () => {
    if (spinning || cooldown || !user) return;
    setSpinning(true);

    // Simula giro de 3 segundos
    setTimeout(() => {
      const prizes = [0.5, 1.0, 1.5, 2.0, 5.0];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      
      claimDailyBonus(user.email, win);
      deposit(win); // Atualiza o store também
      
      setReward(win);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className="pix-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="pix-header">
          <div className="pix-icon">🎡</div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Roda da Sorte</h2>
            <p style={{ fontSize: '12px', color: '#888' }}>Ganhe bônus grátis a cada 24h</p>
          </div>
          <button className="pix-close" onClick={onClose}>&times;</button>
        </div>

        <div className="wheel-container" style={{ margin: '30px 0', position: 'relative' }}>
          <div className={`wheel-visual ${spinning ? 'spinning' : ''}`} style={{ 
            width: '200px', height: '200px', borderRadius: '50%', border: '8px solid #222',
            background: 'conic-gradient(#00ff88 0deg 72deg, #7c3aed 72deg 144deg, #ffcc00 144deg 216deg, #ff3b30 216deg 288deg, #3b82f6 288deg 360deg)',
            margin: '0 auto', boxShadow: '0 0 30px rgba(0,255,136,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', border: '4px solid #000', zIndex: 10 }}></div>
          </div>
          <div className="wheel-pointer" style={{ 
            position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
            width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
            borderTop: '25px solid #fff', zIndex: 20
          }}></div>
        </div>

        {reward ? (
          <div className="reward-msg" style={{ animation: 'bounce 0.5s infinite alternate' }}>
            <h3 style={{ color: '#00ff88', fontSize: '24px', fontWeight: 900 }}>PARABÉNS!</h3>
            <p style={{ fontWeight: 800 }}>Você ganhou R$ {reward.toFixed(2)}</p>
            <button className="btn-bet" style={{ marginTop: '20px' }} onClick={onClose}>OBRIGADO!</button>
          </div>
        ) : cooldown ? (
          <div className="cooldown-msg">
            <p style={{ color: '#666', fontSize: '14px' }}>Você já coletou seu bônus hoje.</p>
            <div style={{ fontSize: '20px', fontWeight: 900, margin: '10px 0' }}>⏳ {cooldown}</div>
            <button className="btn-bet" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>VOLTE AMANHÃ</button>
          </div>
        ) : (
          <button 
            className={`btn-bet ${spinning ? 'loading' : ''}`} 
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? 'GIRANDO...' : 'BOA SORTE! GIRAR AGORA 🚀'}
          </button>
        )}

        <style jsx>{`
          .wheel-visual.spinning {
            animation: spinAround 3s cubic-bezier(0.15, 0, 0.15, 1) forwards;
          }
          @keyframes spinAround {
            from { transform: rotate(0deg); }
            to { transform: rotate(3600deg); }
          }
          @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-5px); }
          }
        `}</style>
      </div>
    </div>
  );
}
