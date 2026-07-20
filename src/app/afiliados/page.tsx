"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  BookOpen, 
  Check, 
  TrendingUp, 
  Download, 
  Send, 
  DollarSign, 
  Percent, 
  RefreshCw,
  Users,
  ShieldCheck,
  Zap
} from "lucide-react";
import styles from "./afiliados.module.css";

export default function AfiliadosPage() {
  const benefits = [
    {
      icon: <RefreshCw size={22} />,
      title: "Comissões Recorrentes",
      desc: "Ganhe 50% todo mês sobre a assinatura da extensão. Se o cliente continuar ativo, a sua comissão continua caindo na conta."
    },
    {
      icon: <TrendingUp size={22} />,
      title: "Funil de Alta Conversão",
      desc: "Nossa landing page é otimizada e testada diariamente com recursos dinâmicos, notificações de vendas reais e prova social acelerada."
    },
    {
      icon: <Users size={22} />,
      title: "Recuperação Ativa",
      desc: "Nossa equipe recupera Pix e Boletos abandonados diariamente através de WhatsApp e e-mail marketing personalizado."
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Menos de 1% de Reembolso",
      desc: "Nossos produtos possuem alta satisfação e suporte de setup dedicado, garantindo baixíssimos níveis de cancelamento."
    }
  ];

  const materials = [
    {
      title: "Criativos de Tráfego",
      desc: "Vídeos e criativos focados em dor e escala prontos para rodar no TikTok Ads, Facebook Ads ou tráfego orgânico.",
      link: "#"
    },
    {
      title: "Imagens & Mockups",
      desc: "Imagens de alta qualidade da extensão rodando, fotos da vitrine do TikTok Shop e criativos estáticos de alta conversão.",
      link: "#"
    },
    {
      title: "Scripts de Copys",
      desc: "Sequência completa de disparos para grupos de WhatsApp, roteiros de abordagem um a um e copys para stories persuasivos.",
      link: "#"
    }
  ];

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <Link href="/landing" className={styles.logo}>
          <img src="/logo.png" alt="Live Infinity" className={styles.logoImg} />
        </Link>
        <Link href="/landing" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar ao Site
        </Link>
      </nav>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.badge}>
          <Zap size={14} fill="currentColor" /> Programa de Parceiros
        </div>
        <h1 className={styles.title}>
          Recomende Soluções de Elite e Fature <span className={styles.highlightGold}>50% de Comissão</span>
        </h1>
        <p className={styles.subtitle}>
          Seja um parceiro oficial do ecossistema Live Infinity. Promova a melhor extensão de automação para TikTok Shop e o nosso treinamento passo a passo de escala rápida.
        </p>
      </header>

      {/* Products Selection */}
      <section className={styles.productsSection}>
        <div className={styles.grid}>
          {/* Card Produto 1: Extensão */}
          <div className={`${styles.card} ${styles.cardRed}`}>
            <div className={`${styles.cardBadge} ${styles.badgeRed}`}>RECORRÊNCIA MENSAL</div>
            <div className={`${styles.cardIcon} ${styles.iconRed}`}>
              <ShoppingBag size={26} />
            </div>
            <h2 className={styles.cardTitle}>Extensão Live Infinity</h2>
            <p className={styles.cardDesc}>
              A extensão profissional nº 1 do Brasil para automatizar transmissões ao vivo 24/7 com proteção anti-ban e vendedor virtual IA.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor dos Planos:</span>
                <span className={styles.metaValue}>R$ 97 a R$ 197 / mês</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Seu ganho mensal por cliente:</span>
                <span className={styles.metaValue}>Até R$ 98,50 / mês</span>
              </div>
            </div>

            <a 
              href="https://pay.cakto.com.br/3477jz3_976117" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnRed}`}
            >
              Me Afiliar à Extensão <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
            </a>
          </div>

          {/* Card Produto 2: Treinamento */}
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={`${styles.cardBadge} ${styles.badgeGold}`}>MÉTODO DE ESCALA</div>
            <div className={`${styles.cardIcon} ${styles.iconGold}`}>
              <BookOpen size={26} />
            </div>
            <h2 className={styles.cardTitle}>Treinamento Oficial</h2>
            <p className={styles.cardDesc}>
              O guia prático definitivo ensinando como subir produtos campeões, atrair audiência qualificada e faturar no TikTok Shop sem aparecer.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>50% Direta</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Produto:</span>
                <span className={styles.metaValue}>R$ 197,00</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Seu ganho por venda:</span>
                <span className={styles.metaValue}>R$ 98,50</span>
              </div>
            </div>

            <a 
              href="https://pay.cakto.com.br/3b3y7bp_982839" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnGold}`}
            >
              Me Afiliar ao Treinamento <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
            </a>
          </div>
        </div>
      </section>

      {/* Why Promote Section */}
      <section className={styles.whySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Por que Promover o Live Infinity?</h2>
          <p className={styles.sectionSubtitle}>
            Unimos produto físico e de alta demanda a um ecossistema completo de vendas para garantir o maior lucro possível no seu tráfego.
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          {benefits.map((benefit, idx) => (
            <div key={idx} className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                {benefit.icon}
              </div>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDesc}>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Materials Support Section */}
      <section className={styles.materialSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Materiais de Apoio Prontos</h2>
          <p className={styles.sectionSubtitle}>
            Tudo o que você precisa para começar a divulgar e vender nas suas redes hoje mesmo.
          </p>
        </div>

        <div className={styles.materialsGrid}>
          {materials.map((mat, idx) => (
            <div key={idx} className={styles.materialCard}>
              <div className={styles.materialHeader}>
                <Download size={22} className={styles.valueRed} />
                <h3 className={styles.materialTitle}>{mat.title}</h3>
              </div>
              <p className={styles.materialDesc}>{mat.desc}</p>
              <a href={mat.link} className={styles.materialBtn}>
                Baixar Material
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className={styles.finalCta}>
        <div className={styles.finalCard}>
          <Send size={48} className={styles.zapIcon} />
          <h2>Ficou com alguma dúvida?</h2>
          <p>
            Entre no nosso canal de afiliados exclusivo do Telegram para receber novidades, dicas de tráfego, criativos diários e suporte completo.
          </p>
          <a 
            href="https://t.me/+exemplo_canal_afiliados" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.telegramBtn}
          >
            Entrar no Grupo de Afiliados
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <img src="/logo.png" alt="Live Infinity" className={styles.logoImg} style={{ height: "30px" }} />
        <p>© 2026 Live Infinity. Todos os direitos reservados. Automação Infinita. Lucro Sem Limites.</p>
      </footer>
    </div>
  );
}
