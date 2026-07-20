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
  Zap,
  MessageCircle
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

      {/* 1. Método de Escala (Curso) */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader} style={{ marginBottom: "2rem" }}>
          <h2 className={styles.sectionTitle}>1. Método de Escala Rápida (Curso)</h2>
          <p className={styles.sectionSubtitle}>
            Promova o treinamento completo passo a passo e ganhe comissão direta em cada venda realizada.
          </p>
        </div>
        
        <div className={styles.featuredContainer}>
          <div className={`${styles.card} ${styles.cardGold} ${styles.cardFeatured}`}>
            <div className={`${styles.cardBadge} ${styles.badgeGold}`}>TREINAMENTO OFICIAL</div>
            <div className={`${styles.cardIcon} ${styles.iconGold}`}>
              <BookOpen size={26} />
            </div>
            <h2 className={styles.cardTitle}>Lives Automáticas</h2>
            <p className={styles.cardDesc}>
              O guia definitivo ensinando o método de escala acelerada no TikTok Shop. Como escolher produtos validados, atrair milhares de compradores e faturar 24/7 sem aparecer.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Sua Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>50% por Venda</span>
              </div>
            </div>

            <a 
              href="https://app.cakto.com.br/affiliate/invite/6bbdc0c1-5f68-4fba-810f-4f768f12f9fc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnGold}`}
            >
              Quero me Afiliar ao Lives Automáticas <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
            </a>
          </div>
        </div>
      </section>

      {/* 2. Planos da Extensão (Assinatura Recorrente) */}
      <section className={styles.productsSection}>
        <div className={styles.sectionHeader} style={{ marginBottom: "3rem" }}>
          <h2 className={styles.sectionTitle}>2. Planos de Assinatura (Extensão)</h2>
          <p className={styles.sectionSubtitle}>
            Promova a nossa extensão de automação profissional e fature comissões recorrentes todo mês que o cliente continuar ativo.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Plano Básico */}
          <div className={`${styles.card} ${styles.cardWhite}`}>
            <div className={`${styles.cardBadge} ${styles.badgeWhite}`}>PLANO INDIVIDUAL</div>
            <div className={`${styles.cardIcon} ${styles.iconWhite}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Infinity Básico</h2>
            <p className={styles.cardDesc}>
              Acesso individual para 1 conta TikTok Shop. Automação de lives, chat virtual IA e anti-ban.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Sua Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 97,00 / mês</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Seu ganho mensal:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>R$ 48,50 / mês</span>
              </div>
            </div>

            <a 
              href="https://app.cakto.com.br/affiliate/invite/e5505d59-fb55-492b-b877-4d675df3e3a5" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnWhite}`}
            >
              Afiliar-se ao Básico <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
            </a>
          </div>

          {/* Plano Pro */}
          <div className={`${styles.card} ${styles.cardRed}`}>
            <div className={`${styles.cardBadge} ${styles.badgeRed}`}>PLANO DUPLO</div>
            <div className={`${styles.cardIcon} ${styles.iconRed}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Infinity Pro</h2>
            <p className={styles.cardDesc}>
              Acesso para 2 contas TikTok Shop. Perfeito para quem está iniciando a escala e faturando mais.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Sua Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 147,00 / mês</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Seu ganho mensal:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>R$ 73,50 / mês</span>
              </div>
            </div>

            <a 
              href="https://app.cakto.com.br/affiliate/invite/ff1139b3-2a70-4e72-aeb6-8a17b3caa720" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnRed}`}
            >
              Afiliar-se ao Pro <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
            </a>
          </div>

          {/* Plano Premium */}
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={`${styles.cardBadge} ${styles.badgeGold}`}>AUTOMAÇÃO INFINITA</div>
            <div className={`${styles.cardIcon} ${styles.iconGold}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Infinity Premium</h2>
            <p className={styles.cardDesc}>
              Acesso para 3 contas ou mais. Suporte prioritário 1-on-1 e recursos de moderação anti-furto avançados.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Sua Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 197,00 / mês</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Seu ganho mensal:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>R$ 98,50 / mês</span>
              </div>
            </div>

            <a 
              href="https://app.cakto.com.br/affiliate/invite/f6467a03-fe9d-4cab-ae7a-01034717dbec" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnGold}`}
            >
              Afiliar-se ao Premium <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
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
          <MessageCircle size={48} className={styles.zapIcon} style={{ color: "#25d366", filter: "drop-shadow(0 0 10px rgba(37, 211, 102, 0.3))" }} />
          <h2>Participe do Grupo do WhatsApp</h2>
          <p>
            Entre no nosso grupo oficial de afiliados no WhatsApp para ter suporte exclusivo, networking, criativos validados e novidades em tempo real.
          </p>
          <a 
            href="https://chat.whatsapp.com/LwKKoV3LUZ81I22Nzo76eE" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.whatsappBtn}
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
