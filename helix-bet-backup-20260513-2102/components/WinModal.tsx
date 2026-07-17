'use client';

import React, { useEffect, useState } from 'react';

interface WinModalProps {
  amount: number;
  multiplier: number;
  onClose: () => void;
}

export default function WinModal({ amount, multiplier, onClose }: WinModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let interval: any;
    import('canvas-confetti').then(module => {
      const confetti = module.default;
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    });

    return () => { if (interval) clearInterval(interval); };
  }, []);

  if (!mounted) return null;

  return (
    <div className="pix-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div className="win-modal" style={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        padding: '40px 30px',
        borderRadius: '32px',
        textAlign: 'center',
        border: '2px solid #ffd700',
        boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)',
        maxWidth: '90%',
        width: '380px',
        position: 'relative',
        animation: 'modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ fontSize: '64px', marginBottom: '10px' }}>💰</div>
        
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 900, 
          color: '#fff', 
          margin: '0 0 5px 0',
          textTransform: 'uppercase'
        }}>VOCÊ GANHOU!</h2>
        
        <div style={{ 
          fontSize: '14px', 
          color: '#ffd700', 
          fontWeight: 700, 
          marginBottom: '30px',
          letterSpacing: '1px'
        }}>SAQUE REALIZADO COM SUCESSO</div>

        <div style={{ 
          background: 'rgba(255,215,0,0.1)', 
          padding: '20px', 
          borderRadius: '20px', 
          marginBottom: '30px',
          border: '1px solid rgba(255,215,0,0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: 800, marginBottom: '5px' }}>VALOR RECEBIDO</div>
          <div style={{ fontSize: '36px', fontWeight: 950, color: '#00ff88' }}>R$ {amount.toFixed(2)}</div>
          <div style={{ fontSize: '14px', color: '#fff', opacity: 0.6, marginTop: '5px' }}>Multiplicador: {multiplier.toFixed(2)}x</div>
        </div>

        <button 
          onClick={onClose}
          style={{ 
            width: '100%', 
            padding: '18px', 
            borderRadius: '16px', 
            border: 'none', 
            background: '#fff', 
            color: '#000', 
            fontWeight: 900, 
            fontSize: '16px', 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 10px 20px rgba(255,255,255,0.1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          CONTINUAR JOGANDO
        </button>

        <style jsx>{`
          @keyframes modalPop {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
