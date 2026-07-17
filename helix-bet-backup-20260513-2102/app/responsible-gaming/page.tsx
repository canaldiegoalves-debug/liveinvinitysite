'use client';

export default function ResponsibleGamingPage() {
  return (
    <div className="legal-container">
      <style jsx>{`
        .legal-container {
          min-height: 100vh;
          background: #050508;
          color: #fff;
          padding: 60px 20px;
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
        }
        .legal-content {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { color: #00ff88; font-size: 32px; font-weight: 950; margin-bottom: 40px; }
        h2 { color: #00ff88; font-size: 20px; font-weight: 800; margin-top: 30px; margin-bottom: 15px; }
        p { color: #aaa; font-size: 14px; margin-bottom: 15px; }
        .back-btn {
          display: inline-block;
          margin-bottom: 30px;
          color: #00ff88;
          text-decoration: none;
          font-weight: 900;
          font-size: 12px;
          border: 1px solid #00ff88;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .warning-box {
          border: 1px solid #ff3b30;
          background: rgba(255, 59, 48, 0.05);
          padding: 20px;
          border-radius: 12px;
          margin-top: 40px;
        }
        .warning-box h3 { color: #ff3b30; margin-top: 0; }
      `}</style>
      
      <div className="legal-content">
        <a href="/" className="back-btn">← VOLTAR AO JOGO</a>
        <h1>Jogo Responsável</h1>
        
        <p>No Helix Bet, queremos que nossos usuários tenham uma experiência positiva e divertida. O jogo deve ser sempre uma forma de entretenimento, não uma forma de ganhar dinheiro ou escapar de problemas.</p>

        <h2>1. Mantenha o Controle</h2>
        <p>O jogo deve ser tratado como uma atividade de lazer e não como uma fonte de renda. Nunca aposte dinheiro que você não pode perder. Estabeleça limites para o seu tempo e dinheiro gastos no site.</p>

        <h2>2. Dicas para um Jogo Seguro</h2>
        <p>• Não tente recuperar perdas imediatamente.<br/>
           • Jogue apenas quando estiver lúcido e calmo.<br/>
           • Equilibre o jogo com outras atividades de lazer.<br/>
           • Faça pausas regulares.</p>

        <h2>3. Sinais de Problema</h2>
        <p>Se você sente que está gastando muito tempo ou dinheiro, ou se o jogo está afetando sua vida pessoal ou profissional, você pode estar desenvolvendo um vício em jogos.</p>

        <div className="warning-box">
          <h3>Ajuda e Suporte</h3>
          <p>Se você ou alguém que você conhece tem problemas com o jogo, procure ajuda profissional. Existem organizações dedicadas a ajudar jogadores compulsivos.</p>
          <p>Lembre-se: Jogo é para maiores de 18 anos.</p>
        </div>
      </div>
    </div>
  );
}
