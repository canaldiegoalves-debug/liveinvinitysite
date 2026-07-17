'use client';

import { useState, useEffect } from 'react';
import { getRecentWins } from '../lib/statsManager';

export default function LiveFeed() {
  const [wins, setWins] = useState<any[]>([]);

  useEffect(() => {
    const update = async () => {
      const data = await getRecentWins(5);
      setWins(data);
    };
    update();
    const timer = setInterval(update, 5000); 
    return () => clearInterval(timer);
  }, []);


  if (wins.length === 0) return null;

  return (
    <div className="live-feed-container">
      <div className="live-feed-header">
        <span className="live-feed-dot"></span>
        GANHOS RECENTES
      </div>
      <div className="live-feed-list">
        {wins.map((win, i) => (
          <div key={i} className="live-feed-item">
            <div className="live-feed-user">
              <span className="live-feed-avatar">{win.name[0].toUpperCase()}</span>
              <span className="live-feed-name">{win.name.split(' ')[0]}</span>
            </div>
            <div className="live-feed-details">
              <span className="live-feed-mult">{win.multiplier.toFixed(2)}x</span>
              <span className="live-feed-amount">R$ {win.amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .live-feed-container {
          position: fixed;
          left: 16px;
          top: 100px;
          width: 200px;
          z-index: 100;
          pointer-events: none;
        }
        .live-feed-header {
          font-size: 10px;
          font-weight: 900;
          color: #888;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .live-feed-dot {
          width: 6px;
          height: 6px;
          background: #ff3b30;
          border-radius: 50%;
          box-shadow: 0 0 8px #ff3b30;
          animation: pulse 1.5s infinite;
        }
        .live-feed-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .live-feed-item {
          background: rgba(15, 15, 15, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideIn 0.5s ease-out;
        }
        .live-feed-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .live-feed-avatar {
          width: 18px;
          height: 18px;
          background: #7c3aed;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          color: #fff;
        }
        .live-feed-name {
          font-size: 11px;
          font-weight: 700;
          color: #eee;
        }
        .live-feed-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .live-feed-mult {
          font-size: 10px;
          font-weight: 900;
          color: #ffcc00;
          background: rgba(255, 204, 0, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .live-feed-amount {
          font-size: 12px;
          font-weight: 900;
          color: #00ff88;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 800px) {
          .live-feed-container { display: none; }
        }
      `}</style>
    </div>
  );
}
