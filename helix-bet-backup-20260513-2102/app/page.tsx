'use client';
export const dynamic = 'force-dynamic';

import NextDynamic from 'next/dynamic';
const HelixGame    = NextDynamic(() => import('../components/HelixGame'), { ssr: false });
import AuthScreen   from '../components/AuthScreen';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import ProfileModal from '../components/ProfileModal';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore  } from '../store/useAuthStore';
import { recordBet, recordCashOut, recordLoss } from '../lib/statsManager';
import { useState, useEffect } from 'react';
import LiveFeed from '../components/LiveFeed';
import Leaderboard from '../components/Leaderboard';
import DailyWheel from '../components/DailyWheel';
import SupportModal from '../components/SupportModal';
import WinModal from '../components/WinModal';
import HistoryModal from '../components/HistoryModal';

export default function Home() {
  const {
    balance, currentBet, multiplier, isPlaying, isBetting, isGameOver,
    startGame, cashOut, resetGame, setCurrentBet, playerDifficulty,
    setPlayerDifficulty, revalidateHash,
  } = useGameStore();

  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [inputBet, setInputBet] = useState('10');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [lastWinMult, setLastWinMult] = useState(0);
  const [jackpot, setJackpot] = useState(12540.50); // Valor inicial fictício

  useEffect(() => { 
    setMounted(true); 
    revalidateHash();
    
    // Sincroniza saldo com Supabase ao carregar
    if (user?.email) {
      import('../lib/statsManager').then(({ getUserStats }) => {
        getUserStats(user.email).then(stats => {
          if (stats) {
            useGameStore.setState({ balance: stats.currentBalance });
            const updates: any = {};
            if (stats.isDemo !== user.is_demo) updates.is_demo = stats.isDemo;
            if (stats.affiliateId && stats.affiliateId !== user.affiliate_id) updates.affiliate_id = stats.affiliateId;
            if (stats.serverSeed && stats.serverSeed !== user.server_seed) updates.server_seed = stats.serverSeed;
            if (stats.clientSeed && stats.clientSeed !== user.client_seed) updates.client_seed = stats.clientSeed;
            
            if (Object.keys(updates).length > 0) {
              useAuthStore.getState().updateProfile(updates);
            }
          }
        });
      });
    }

    // Trava de Scroll Universal (Samsung/Xiaomi/iOS)
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Permite zoom se necessário (opcional)
      e.preventDefault();
    };
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [revalidateHash, user]);


  // Simula o Jackpot crescendo
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpot(prev => prev + (Math.random() * 0.05));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;
  if (!isAuthenticated) return <AuthScreen />;

  const currentProfit = Number((currentBet * multiplier).toFixed(2));

  const handleStart = async () => {
    const val = parseFloat(inputBet);
    if (isNaN(val) || val < 1) return alert('Mínimo R$ 1,00');
    if (val > balance) return alert('Saldo insuficiente!');
    setCurrentBet(val);
    startGame();
    if (user) await recordBet(user.email, val);
  };

  const handleCashOut = async () => {
    const profit = currentProfit;
    const mult = multiplier;
    setLastWinAmount(profit);
    setLastWinMult(mult);
    cashOut();
    
    setTimeout(() => {
      setShowWinModal(true);
    }, 100);

    if (user) await recordCashOut(user.email, profit);
  };

  const handleReset = async () => {
    if (isGameOver && user) await recordLoss(user.email, currentBet);
    resetGame();
  };


  return (
    <main style={{ 
      position: 'relative', width: '100vw', height: '100dvh', // Dynamic Viewport Height
      overflow: 'hidden', background: '#000',
      overscrollBehavior: 'none', touchAction: 'none'
    }}>
      <style jsx global>{`
        html, body { 
          overflow: hidden !important; 
          height: 100% !important; 
          width: 100% !important; 
          position: fixed !important;
          overscroll-behavior: none !important;
          touch-action: none !important;
        }
        @media (max-width: 450px) {
          .mobile-hide { display: none !important; }
          .top-bar { padding: 4px !important; gap: 4px !important; }
          .balance-card { padding: 6px 10px !important; min-width: 100px !important; }
          .balance-card span:last-child { font-size: 14px !important; }
          .action-btn { padding: 6px !important; font-size: 12px !important; width: 32px !important; height: 32px !important; }
          .profile-chip { padding: 4px 8px !important; }
          .jackpot-container { min-width: 110px !important; padding: 4px 8px !important; }
          .jackpot-container div:last-child { font-size: 13px !important; }
        }
        @media (max-width: 350px) {
          .top-bar { flex-direction: column; align-items: stretch !important; }
          .action-buttons-container { justify-content: center !important; }
        }
      `}</style>
      <HelixGame />
      <LiveFeed />

      {/* Camada de UI - Não bloqueia o fundo */}
      <div className="ui-layer" style={{ 
        position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', 
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))'
      }}>
        
        {/* Barra Superior */}
        <div className="top-bar" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          pointerEvents: 'none', flexWrap: 'wrap', gap: '8px', width: '100%'
        }}>
          <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="balance-card" style={{ background: 'rgba(20,20,20,0.95)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '120px' }}>
              <span style={{ display: 'block', fontSize: '8px', color: '#888', fontWeight: 800 }}>SALDO</span>
              <span style={{ fontSize: '15px', fontWeight: 950, color: '#00ff88' }}>R$ {balance.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setShowDeposit(true)} style={{ background: '#00ff88', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}>DEPÓSITO</button>
              <button onClick={() => setShowWithdraw(true)} style={{ background: '#FFD700', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}>SACAR</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
            <div className="jackpot-container" style={{ 
              background: 'rgba(255,204,0,0.1)', padding: '4px 12px', borderRadius: '15px', 
              border: '1px solid rgba(255,204,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
               <div style={{ fontSize: '7px', fontWeight: 900, color: '#ffcc00' }}>JACKPOT</div>
               <div style={{ fontSize: '13px', fontWeight: 950, color: '#fff' }}>R$ {jackpot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>

            {user && (
              <div className="mobile-hide" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginRight: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 950, color: '#00ff88', letterSpacing: '1px' }}>
                    {user.level && user.level >= 6 ? '💎 DIAMANTE' : user.level && user.level >= 3 ? '🥇 OURO' : '🥉 BRONZE'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#fff', background: '#333', padding: '2px 6px', borderRadius: '5px' }}>
                    Lvl {user.level || 1}
                  </span>
                </div>
                <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, ((user.xp || 0) - (Math.pow((user.level || 1)-1, 2) * 100)) / (Math.pow(user.level || 1, 2)*100 - Math.pow((user.level || 1)-1, 2)*100) * 100)}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #00ff88, #00ffcc)',
                    boxShadow: '0 0 10px rgba(0,255,136,0.5)'
                  }}></div>
                </div>
              </div>
             )}

            <div className="profile-chip" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer', background: 'rgba(20,20,20,0.8)', padding: '5px', borderRadius: '50%', border: '1px solid #00ff88' }}>
              <div style={{ width: '28px', height: '28px', background: '#00ff88', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px' }}>{user?.name?.[0]?.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Indicadores de Lucro - Posicionados estrategicamente no topo */}
        {isPlaying && !isGameOver && (
          <div style={{ width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', width: '90%', maxWidth: '350px' }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.2)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(5px)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '8px', color: '#aaa', fontWeight: 800 }}>GANHO ATUAL</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#00ff88' }}>R$ {(currentBet * multiplier).toFixed(2)}</span>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,204,0,0.2)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(5px)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '8px', color: '#aaa', fontWeight: 800 }}>GANHO FUTURO</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffcc00' }}>R$ {(currentBet * (multiplier + 0.05)).toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 15px', borderRadius: '50px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        )}

        {/* Painéis Inferiores */}
        <div style={{ marginTop: 'auto', pointerEvents: 'none', display: 'flex', justifyContent: 'center', width: '100%' }}>
          
          {/* Aposta */}
          {isBetting && !isGameOver && (
            <div className="control-panel" style={{ 
              pointerEvents: 'auto', background: 'rgba(15,15,15,0.98)', padding: '20px', 
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', // Suporte para iPhone Safe Area
              borderRadius: '25px 25px 0 0', width: '100%', maxWidth: '450px', 
              border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {(['EASY', 'MEDIUM', 'HARD'] as const).map(lv => {
                  const isActive = playerDifficulty === lv;
                  const colors = {
                    EASY:   { bg: '#00ff88', text: '#000', shadow: 'rgba(0,255,136,0.3)' },
                    MEDIUM: { bg: '#ffcc00', text: '#000', shadow: 'rgba(255,204,0,0.3)' },
                    HARD:   { bg: '#ff3b30', text: '#fff', shadow: 'rgba(255,59,48,0.3)' },
                  };
                  const current = colors[lv];
                  
                  return (
                    <button 
                      key={lv} 
                      onClick={() => setPlayerDifficulty(lv)} 
                      style={{ 
                        flex: 1, padding: '14px 8px', borderRadius: '14px', border: 'none', 
                        background: isActive ? current.bg : 'rgba(255,255,255,0.05)', 
                        color: isActive ? current.text : '#555', 
                        fontWeight: 900, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isActive ? `0 4px 15px ${current.shadow}` : 'none',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '11px' }}>
                        {lv === 'EASY' ? 'FÁCIL' : lv === 'MEDIUM' ? 'MÉDIO' : 'DIFÍCIL'}
                      </span>
                      <span style={{ 
                        fontSize: '9px', 
                        opacity: isActive ? 0.8 : 0.5,
                        background: isActive ? 'rgba(0,0,0,0.1)' : 'transparent',
                        padding: '2px 6px', borderRadius: '6px'
                      }}>
                        {lv === 'EASY' ? '+0.02x' : lv === 'MEDIUM' ? '+0.05x' : '+0.15x'}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '15px', marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', color: '#888', fontWeight: 800, display: 'block', marginBottom: '8px' }}>VALOR DA APOSTA</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setInputBet(String(Math.max(1, Math.floor(parseFloat(inputBet)/2))))} style={{ background: 'none', border: 'none', color: '#00ff88', fontWeight: 900, fontSize: '18px' }}>½</button>
                  <input type="number" value={inputBet} onChange={(e) => setInputBet(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', color: '#fff', textAlign: 'center', fontSize: '24px', fontWeight: 900, outline: 'none' }} />
                  <button onClick={() => setInputBet(String(Math.min(balance, parseFloat(inputBet)*2)))} style={{ background: 'none', border: 'none', color: '#00ff88', fontWeight: 900, fontSize: '18px' }}>2x</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn-main" onClick={handleStart} style={{ width: '100%', padding: '22px', borderRadius: '20px', border: 'none', background: '#fff', color: '#000', fontWeight: 900, fontSize: '20px', cursor: 'pointer', transition: '0.2s' }}>
                  🚀 COMEÇAR JOGO
                </button>
                
                <button onClick={() => setShowDeposit(true)} style={{ 
                  width: '100%', padding: '18px', borderRadius: '20px', border: 'none', 
                  background: 'linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)', 
                  color: '#000', fontWeight: 900, fontSize: '18px', 
                  boxShadow: '0 8px 25px rgba(0,255,136,0.4)', cursor: 'pointer',
                  textTransform: 'uppercase'
                }}>
                  💳 DEPOSITAR AGORA
                </button>
              </div>
            </div>
          )}

          {/* Cash Out */}
          {isPlaying && !isGameOver && (
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: '500px', padding: '20px' }}>
              <button className="btn-cashout" onClick={handleCashOut} style={{ 
                width: '100%', padding: '24px', borderRadius: '24px', border: 'none', 
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
                color: '#000', fontWeight: 900, fontSize: '20px', 
                boxShadow: '0 12px 32px rgba(255,165,0,0.4)', cursor: 'pointer'
              }}>
                💰 SACAR R$ {currentProfit.toFixed(2)}
              </button>
            </div>
          )}

          {/* Game Over */}
          {isGameOver && (
            <div style={{ pointerEvents: 'auto', background: 'rgba(255,59,48,0.1)', border: '2px solid #ff3b30', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '30px', width: '90%', maxWidth: '400px', textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💥</div>
              <h2 style={{ color: '#ff3b30', fontWeight: 900, fontSize: '28px', margin: 0 }}>PERDEU!</h2>
              <p style={{ color: '#fff', opacity: 0.8, margin: '8px 0 24px' }}>R$ {currentBet.toFixed(2)} se foram.</p>
              <button onClick={handleReset} style={{ width: '100%', padding: '18px', borderRadius: '15px', border: 'none', background: '#fff', color: '#000', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}>TENTAR DE NOVO</button>
              <button onClick={() => setShowWithdraw(true)} style={{ width: '100%', marginTop: '12px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>SACAR SALDO</button>
            </div>
          )}
        </div>
      </div>

      {showDeposit  && <DepositModal  onClose={() => setShowDeposit(false)}  />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showProfile  && <ProfileModal  onClose={() => setShowProfile(false)}  />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showWheel && <DailyWheel onClose={() => setShowWheel(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      
      {showWinModal && (
        <WinModal 
          amount={lastWinAmount} 
          multiplier={lastWinMult} 
          onClose={() => setShowWinModal(false)} 
        />
      )}
    </main>
  );
}
