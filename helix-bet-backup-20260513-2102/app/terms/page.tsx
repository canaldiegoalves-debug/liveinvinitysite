'use client';

export default function TermsPage() {
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
        <h1>Termos de Uso</h1>
        
        <p>Ao acessar o site Helix Bet, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>

        <h2>1. Elegibilidade</h2>
        <p>Você deve ter pelo menos 18 anos de idade para usar este site. Ao usar o Helix Bet, você declara e garante que tem pelo menos 18 anos.</p>

        <h2>2. Uso de Licença</h2>
        <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Helix Bet, apenas para visualização transitória pessoal e não comercial.</p>

        <h2>3. Isenção de Responsabilidade</h2>
        <p>Os materiais no site da Helix Bet são fornecidos 'como estão'. Helix Bet não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</p>

        <h2>4. Limitações</h2>
        <p>Em nenhum caso o Helix Bet ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Helix Bet.</p>

        <h2>5. Precisão dos Materiais</h2>
        <p>Os materiais exibidos no site da Helix Bet podem incluir erros técnicos, tipográficos ou fotográficos. Helix Bet não garante que qualquer material em seu site seja preciso, completo ou atual.</p>

        <h2>6. Links</h2>
        <p>O Helix Bet não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Helix Bet do site.</p>
      </div>
    </div>
  );
}
