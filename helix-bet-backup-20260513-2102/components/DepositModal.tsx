'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';

interface DepositModalProps {
  onClose: () => void;
}

type Step = 'input' | 'qrcode' | 'success' | 'error';

export default function DepositModal({ onClose }: DepositModalProps) {
  const { user } = useAuthStore();
  const { balance, deposit } = useGameStore();

  const [step,         setStep]         = useState<Step>('input');
  const [amount,       setAmount]       = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [qrcode,       setQrcode]       = useState('');
  const [qrcodeImage,  setQrcodeImage]  = useState('');
  const [txid,         setTxid]         = useState('');
  const [copied,       setCopied]       = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(300);
  const [polling,      setPolling]      = useState(false);

  const PRESETS = [10, 25, 50, 100, 250, 500];

  // Polling de status do PIX (checa a cada 4s)
  const checkStatus = useCallback(async () => {
    if (!txid || !user) return;
    try {
      const res  = await fetch(
        `/api/pix/deposit/status/${txid}?userId=${encodeURIComponent(user.email)}&userName=${encodeURIComponent(user.name)}&balance=${balance}`
      );
      const data = await res.json();
      if (data.pago) {
        setPolling(false);
        deposit(parseFloat(data.valor));
        setStep('success');
      }
    } catch {
      // silencioso — continua tentando
    }
  }, [txid, user, balance, deposit]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  // Contador regressivo do QR code
  useEffect(() => {
    if (step !== 'qrcode') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setStep('error'); setError('QR Code expirado. Crie um novo.'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleCreateCharge = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10) { setError('Valor mínimo: R$ 10,00'); return; }
    if (val > 10000)            { setError('Valor máximo: R$ 10.000,00'); return; }

    setError('');
    setIsLoading(true);

    try {
      const currentCpf = (user as any).cpf || (user as any).tempCpf;
      
      if (!currentCpf) {
        setError('CPF obrigatório para gerar o PIX.');
        setIsLoading(false);
        return;
      }

      const res  = await fetch('/api/pix/deposit/amplopay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ 
          amount: val, 
          userId: user!.email, 
          userName: user!.name,
          userCpf: currentCpf
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');

      const qrcodeFinal = data.payload || data.qrcode || '';
      const qrcodeImgFinal = data.qrCode || data.qrcode || '';

      if (!qrcodeFinal || !qrcodeImgFinal) {
        console.error('[AMPLOPAY RAW RESPONSE]', data.debug);
      }

      setQrcode(qrcodeFinal);
      setQrcodeImage(qrcodeImgFinal);
      setTxid(data.txid);
      setTimeLeft(300);
      setStep('qrcode');
      setPolling(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const copyQrcode = async () => {
    await navigator.clipboard.writeText(qrcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="pix-overlay" onClick={onClose}>
      <div className="pix-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pix-header">
          <div className="pix-header-icon">💰</div>
          <div>
            <div className="pix-header-title">Depositar via PIX</div>
            <div className="pix-header-sub">Saldo atual: R$ {balance.toFixed(2)}</div>
          </div>
          <button className="pix-close" onClick={onClose}>✕</button>
        </div>

        {/* Step: input */}
        {step === 'input' && (
          <div className="pix-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="pix-presets">
              {PRESETS.map(p => (
                <button key={p} className={`pix-preset ${amount === String(p) ? 'pix-preset--active' : ''}`}
                  onClick={() => setAmount(String(p))}>
                  R$ {p}
                </button>
              ))}
            </div>

            <div className="pix-field">
              <label className="pix-label">OUTRO VALOR</label>
              <div className="pix-input-wrap">
                <span className="pix-input-prefix">R$</span>
                <input
                  type="number"
                  className="pix-input"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  min={10} max={10000}
                />
              </div>
            </div>

            {/* Pedir CPF se não tiver no perfil */}
            {!(user as any)?.cpf && (
              <div className="pix-field" style={{ marginTop: '16px' }}>
                <label className="pix-label">SEU CPF (OBRIGATÓRIO PARA PIX)</label>
                <div className="pix-input-wrap">
                  <span className="pix-input-prefix">🆔</span>
                  <input
                    type="text"
                    className="pix-input"
                    placeholder="000.000.000-00"
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 11);
                      (user as any).tempCpf = val; // Guardamos temporariamente
                      setError('');
                    }}
                    maxLength={14}
                  />
                </div>
                <p className="pix-info" style={{ color: '#ffcc00', marginTop: '4px' }}>
                  A AmploPay exige um CPF real para gerar o seu PIX com segurança.
                </p>
              </div>
            )}

            {error && <div className="pix-error">⚠️ {error}</div>}

            <button className="pix-btn pix-btn--green" onClick={handleCreateCharge} disabled={isLoading || !amount}>
              {isLoading ? <span className="pix-spinner" /> : '⚡ Gerar QR Code PIX'}
            </button>

            <p className="pix-info">Mín: R$ 10,00 · Máx: R$ 10.000,00 · Aprovação imediata</p>
          </div>
        )}

        {/* Step: qrcode */}
        {step === 'qrcode' && (
          <div className="pix-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="pix-qr-timer">
              <span className="pix-qr-timer-dot" />
              Aguardando pagamento · expira em {fmtTime(timeLeft)}
            </div>

            {qrcodeImage ? (
              <div className="pix-qr-img-wrap">
                <img
                  src={qrcodeImage.startsWith('data:') ? qrcodeImage : `data:image/png;base64,${qrcodeImage}`}
                  alt="QR Code PIX"
                  className="pix-qr-img"
                />
              </div>
            ) : (
              <div className="pix-qr-placeholder">🔲 QR Code</div>
            )}

            <div className="pix-qr-copy-wrap">
              <input className="pix-qr-code" value={qrcode} readOnly />
              <button className={`pix-copy-btn ${copied ? 'pix-copy-btn--ok' : ''}`} onClick={copyQrcode}>
                {copied ? '✓' : '📋'}
              </button>
            </div>

            <p className="pix-info" style={{ textAlign: 'center' }}>
              {copied ? '✅ Código copiado!' : 'Copie o código Pix copia-e-cola acima'}
            </p>
            <p className="pix-info" style={{ color: '#555' }}>
              Após o pagamento, seu saldo é atualizado automaticamente em até 30 segundos
            </p>

            <button className="pix-btn pix-btn--ghost" onClick={() => { setPolling(false); setStep('input'); }}>
              ← Voltar
            </button>
          </div>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <div className="pix-body pix-body--center" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="pix-success-icon">✅</div>
            <div className="pix-success-title">Depósito confirmado!</div>
            <div className="pix-success-amount">+R$ {parseFloat(amount).toFixed(2)}</div>
            <div className="pix-success-balance">Novo saldo: R$ {balance.toFixed(2)}</div>
            <button className="pix-btn pix-btn--green" onClick={onClose}>Jogar agora →</button>
          </div>
        )}

        {/* Step: error */}
        {step === 'error' && (
          <div className="pix-body pix-body--center" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 48 }}>⏰</div>
            <div className="pix-success-title" style={{ color: '#ff3b30' }}>Tempo expirado</div>
            <p className="pix-info">{error}</p>
            <button className="pix-btn pix-btn--green" onClick={() => { setStep('input'); setError(''); }}>
              Criar novo QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
