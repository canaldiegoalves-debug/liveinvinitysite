'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { sendSupportMessage, getSupportMessages, SupportTicket } from '../lib/statsManager';

export default function SupportModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const msgs = await getSupportMessages(user.email);
      setMessages(msgs);
    };

    load();
    const timer = setInterval(load, 5000); 
    return () => clearInterval(timer);
  }, [user]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);
    
    await sendSupportMessage(user.email, user.name, message);
    setMessage('');
    const msgs = await getSupportMessages(user.email);
    setMessages(msgs);
    setLoading(false);
  };


  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className="pix-modal" style={{ maxWidth: '450px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="pix-header">
          <div className="pix-icon">💬</div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Suporte Helix</h2>
            <p style={{ fontSize: '10px', color: '#888' }}>
              {messages.length > 0 ? `Ticket: ${messages[0].id}` : 'Atendimento Online'}
            </p>
          </div>
          <button className="pix-close" onClick={onClose}>&times;</button>
        </div>

        <div ref={scrollRef} id="chat-scroll-area" className="chat-container" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', scrollBehavior: 'smooth' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', marginTop: '50px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
              <p>Olá! Como podemos ajudar você hoje?</p>
            </div>
          ) : (
            messages[0].messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#00ff88' : 'rgba(255,255,255,0.05)',
                color: m.role === 'user' ? '#000' : '#fff',
                padding: '10px 15px',
                borderRadius: m.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                border: m.role === 'admin' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                maxWidth: '85%',
                fontSize: '14px',
                fontWeight: m.role === 'user' ? 600 : 400,
                position: 'relative'
              }}>
                {m.role === 'admin' && <div style={{ fontSize: '9px', color: '#00ff88', fontWeight: 900, marginBottom: '2px' }}>SUPORTE</div>}
                {m.text}
              </div>
            ))
          )}
        </div>

        <div className="chat-input-area" style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Digite sua mensagem..." 
            className="bet-input"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button 
            className="btn-bet" 
            style={{ width: 'auto', padding: '0 20px' }}
            onClick={handleSend}
            disabled={loading || !message.trim()}
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
}
