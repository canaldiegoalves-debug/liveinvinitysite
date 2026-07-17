'use client';

import { useState, useEffect } from 'react';
import { getAllUsersArray, UserStats } from '../lib/statsManager';

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      const users = await getAllUsersArray('HELIX@ADMIN2026'); 
      const realUsers = users.filter(u => !u.isDemo);
      const sorted = [...realUsers].sort((a, b) => (b.gamesWon || 0) - (a.gamesWon || 0)).slice(0, 10);
      setTopUsers(sorted);
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className="pix-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
        <div className="pix-header">
          <div className="pix-icon">🏆</div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Ranking Global</h2>
            <p style={{ fontSize: '12px', color: '#888' }}>Os maiores vencedores da plataforma</p>
          </div>
          <button className="pix-close" onClick={onClose}>&times;</button>
        </div>

        <div className="leaderboard-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {topUsers.map((user, i) => (
            <div key={user.email} className="leaderboard-item" style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', 
              background: i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px', border: '1px solid',
              borderColor: i === 0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                width: '30px', fontWeight: 900, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555',
                fontSize: '18px'
              }}>
                #{i + 1}
              </div>
              <div style={{ 
                width: '40px', height: '40px', background: '#222', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
                color: i === 0 ? '#ffd700' : '#00ff88', border: '2px solid',
                borderColor: i === 0 ? '#ffd700' : 'rgba(255,255,255,0.1)',
                fontSize: '16px'
              }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{user.gamesPlayed} partidas jogadas</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '16px' }}>{user.gamesWon}🏆</div>
                <div style={{ fontSize: '10px', color: '#444' }}>VITÓRIAS</div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
          ✨ Continue jogando para subir no ranking!
        </div>
      </div>
    </div>
  );
}
