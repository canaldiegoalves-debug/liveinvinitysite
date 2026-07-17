'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthScreen() {
  const { authMode, setAuthMode, login, register } = useAuthStore();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [isAdult,    setIsAdult]    = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [shake,      setShake]      = useState(false);

  // Limpa erro ao trocar de modo ou digitar
  useEffect(() => { setError(''); }, [authMode, email, password, name]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!validateEmail(email)) {
      setError('Digite um e-mail válido.'); triggerShake(); return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.'); triggerShake(); return;
    }
    if (authMode === 'register' && name.trim().length < 2) {
      setError('Digite seu nome completo.'); triggerShake(); return;
    }
    if (authMode === 'register' && !isAdult) {
      setError('Você precisa confirmar que tem 18 anos ou mais.'); triggerShake(); return;
    }

    setIsLoading(true);

    const result = authMode === 'login'
      ? await login(email, password)
      : await register(email, password, name);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Ocorreu um erro. Tente novamente.');
      triggerShake();
    }
  };

  const isRegister = authMode === 'register';

  return (
    <div className="auth-overlay">
      {/* Fundo animado */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb--1" />
        <div className="auth-bg-orb auth-bg-orb--2" />
        <div className="auth-bg-orb auth-bg-orb--3" />
      </div>

      {/* Card central */}
      <div className={`auth-card ${shake ? 'auth-card--shake' : ''}`}>
        {/* Logo / Cabeçalho */}
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-helix">⬡</span>
            <span className="auth-logo-text">HELIX</span>
            <span className="auth-logo-bet">BET</span>
          </div>
          <p className="auth-tagline">Jogo de habilidade com apostas reais</p>
        </div>

        {/* Abas Login / Cadastro */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? 'auth-tab--active' : ''}`}
            onClick={() => setAuthMode('login')}
          >
            Entrar
          </button>
          <button
            className={`auth-tab ${isRegister ? 'auth-tab--active' : ''}`}
            onClick={() => setAuthMode('register')}
          >
            Criar conta
          </button>
        </div>

        {/* Formulário */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Nome — só no cadastro */}
          {isRegister && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">
                SEU NOME
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="Como deseja ser chamado"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={60}
                />
              </div>
            </div>
          )}

          {/* E-mail */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              E-MAIL
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉️</span>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              SENHA {isRegister && <span style={{ color: '#666', fontWeight: 400 }}>(mín. 6 caracteres)</span>}
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                id="auth-password"
                type={showPass ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Checkbox 18+ — só no cadastro */}
          {isRegister && (
            <label className={`auth-checkbox-label ${!isAdult && error.includes('18') ? 'auth-checkbox-label--error' : ''}`}>
              <div className="auth-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="auth-adult"
                  checked={isAdult}
                  onChange={e => setIsAdult(e.target.checked)}
                  className="auth-checkbox-input"
                />
                <span className={`auth-checkbox-custom ${isAdult ? 'auth-checkbox-custom--checked' : ''}`}>
                  {isAdult && <span className="auth-checkbox-check">✓</span>}
                </span>
              </div>
              <span className="auth-checkbox-text">
                Confirmo que tenho{' '}
                <strong style={{ color: '#00ff88' }}>18 anos ou mais</strong>{' '}
                e concordo com os{' '}
                <span style={{ color: '#00ff88', textDecoration: 'underline', cursor: 'pointer' }}>
                  Termos de Uso
                </span>
              </span>
            </label>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Botão de submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
            id="auth-submit-btn"
          >
            {isLoading ? (
              <span className="auth-loading">
                <span className="auth-spinner" />
                {isRegister ? 'Criando conta...' : 'Entrando...'}
              </span>
            ) : (
              isRegister ? '🎮 Criar conta e jogar' : '🎯 Entrar e jogar'
            )}
          </button>

          {/* Troca de modo */}
          <p className="auth-switch">
            {isRegister ? (
              <>Já tem conta?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => setAuthMode('login')}>
                  Fazer login
                </button>
              </>
            ) : (
              <>Não tem conta?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => setAuthMode('register')}>
                  Cadastre-se grátis
                </button>
              </>
            )}
          </p>
        </form>

        {/* Aviso de jogo responsável */}
        <div className="auth-footer">
          <span className="auth-footer-icon">🛡️</span>
          <span>Jogo responsável · +18 · Apenas para entretenimento</span>
        </div>
      </div>
    </div>
  );
}
