'use client';

export default function PrivacyPage() {
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
      `}</style>
      
      <div className="legal-content">
        <a href="/" className="back-btn">← VOLTAR AO JOGO</a>
        <h1>Política de Privacidade</h1>
        
        <p>A sua privacidade é importante para nós. É política do Helix Bet respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Helix Bet, e outros sites que possuímos e operamos.</p>

        <h2>1. Coleta de Informações</h2>
        <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.</p>

        <h2>2. Uso de Dados</h2>
        <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>

        <h2>3. Compartilhamento de Informações</h2>
        <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</p>

        <h2>4. Cookies</h2>
        <p>Utilizamos cookies para coletar informações sobre sua atividade no site para melhorar sua experiência. Você pode desativar os cookies nas configurações do seu navegador.</p>

        <h2>5. Links de Terceiros</h2>
        <p>O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.</p>

        <h2>6. Consentimento</h2>
        <p>O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.</p>
      </div>
    </div>
  );
}
