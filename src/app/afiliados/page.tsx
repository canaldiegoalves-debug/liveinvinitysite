"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  Zap, 
  Rocket, 
  Megaphone, 
  Headphones, 
  Target, 
  CreditCard,
  ArrowRight,
  Flame
} from "lucide-react";
import styles from "./afiliados.module.css";

export default function AfiliadosPage() {
  const AFFILIATE_LINK = "https://app.cakto.com.br/affiliate/invite/e5505d59-fb55-492b-b877-4d675df3e3a5";

  const benefits = [
    {
      icon: <DollarSign size={24} />,
      title: "50% de comissão recorrente",
      desc: "Receba metade do valor da assinatura todos os meses enquanto o cliente mantiver a conta ativa."
    },
    {
      icon: <Rocket size={24} />,
      title: "Produto em crescimento",
      desc: "Promova a solução de automação líder do mercado para TikTok Shop em fase de forte expansão."
    },
    {
      icon: <Megaphone size={24} />,
      title: "Material pronto para divulgação",
      desc: "Acesse vídeos de alta conversão, banners, mockups e scripts prontos para impulsionar suas vendas."
    },
    {
      icon: <Headphones size={24} />,
      title: "Suporte rápido aos afiliados",
      desc: "Conte com uma equipe dedicada para ajudar você com estratégias de tráfego, dúvidas e otimização."
    },
    {
      icon: <Target size={24} />,
      title: "Cookie de rastreamento",
      desc: "Rastreamento avançado e seguro de indicações garantindo que sua comissão seja atribuída corretamente."
    },
    {
      icon: <CreditCard size={24} />,
      title: "Pagamentos automáticos pela Cakto",
      desc: "Receba seus ganhos com total transparência e pontualidade diretamente na sua conta Cakto."
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

      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.badge}>
          <Zap size={14} fill="currentColor" /> Programa Oficial de Afiliados
        </div>
        <h1 className={styles.title}>
          Recomende Soluções de Elite e Fature <span className={styles.highlightGold}>50% de Comissão Recorrente</span>
        </h1>
        <p className={styles.subtitle}>
          Indique a Live Infinity e receba 50% de comissão recorrente em todas as renovações dos seus clientes.
        </p>
        <p className={styles.copyStrength}>
          Construa uma renda mensal promovendo a principal automação para TikTok Shop do Brasil.
        </p>
      </header>

      {/* 2. Planos da Extensão (Assinatura Recorrente) */}
      <section className={styles.productsSection}>
        
        {/* ITEM 6: FAIXA DESTACADA ACIMA DOS PLANOS */}
        <div className={styles.highlightBanner}>
          <h3 className={styles.bannerTitle}>
            <Flame size={24} style={{ color: "#ffcf00" }} /> 🔥 50% DE COMISSÃO RECORRENTE
          </h3>
          <p className={styles.bannerDesc}>
            Você vende uma única vez e continua recebendo enquanto o cliente permanecer ativo.
          </p>
        </div>

        <div className={styles.grid}>
          
          {/* Plano Básico (Branco) */}
          <div className={`${styles.card} ${styles.cardWhite}`}>
            <div className={`${styles.cardBadge} ${styles.badgeWhite}`}>PLANO INDIVIDUAL</div>
            <div className={`${styles.cardIcon} ${styles.iconWhite}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Infinity Básico</h2>
            <p className={styles.cardDesc}>
              Acesso individual para 1 conta TikTok Shop. Automação de lives, chat IA e proteção anti-ban.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão Recorrente:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>50%</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 67,00</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Você recebe por venda:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>R$ 33,50 por venda</span>
              </div>
            </div>

            <a 
              href={AFFILIATE_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnWhite}`}
            >
              <span>Quero me Afiliar</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Plano Pro (Vermelho) */}
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
                <span className={styles.metaLabel}>Comissão Recorrente:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>50%</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 97,00</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Você recebe por venda:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>R$ 48,50 por venda</span>
              </div>
            </div>

            <a 
              href={AFFILIATE_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnRed}`}
            >
              <span>Quero me Afiliar</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Plano Premium (Amarelo/Dourado) ITEM 7 BADGE PULSANTE */}
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={`${styles.cardBadge} ${styles.badgeGoldPulsing}`}>MAIOR COMISSÃO</div>
            <div className={`${styles.cardIcon} ${styles.iconGold}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Infinity Premium</h2>
            <p className={styles.cardDesc}>
              Acesso para 3 contas ou mais. Suporte prioritário 1-on-1 e recursos avançados.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão Recorrente:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>50%</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Plano:</span>
                <span className={styles.metaValue}>R$ 147,00</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Você recebe por venda:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>R$ 73,50 por venda</span>
              </div>
            </div>

            <a 
              href={AFFILIATE_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnGold}`}
            >
              <span>Quero me Afiliar</span>
              <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </section>

      {/* ITEM 9: SEÇÃO ABAIXO DOS PLANOS (6 CARDS) */}
      <section className={styles.whySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Por que promover a Live Infinity?</h2>
          <p className={styles.sectionSubtitle}>
            Um ecossistema completo desenvolvido para garantir máxima conversão de vendas e receita contínua no seu tráfego.
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

      {/* ITEM 10: SEÇÃO DE RESULTADOS (FAIXA ESCURA COM NÚMEROS GRANDES) */}
      <section className={styles.resultsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50%</div>
            <div className={styles.statLabel}>Comissão Recorrente</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>R$ 73,50</div>
            <div className={styles.statLabel}>Maior comissão por venda</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>∞</div>
            <div className={styles.statLabel}>Receba enquanto o cliente renovar</div>
          </div>
        </div>
      </section>

      {/* ITEM 11: CTA GIGANTE */}
      <section className={styles.bigCtaSection}>
        <div className={styles.bigCtaCard}>
          <h2 className={styles.bigCtaTitle}>Comece agora mesmo a construir sua renda recorrente.</h2>
          <p className={styles.bigCtaSubtitle}>
            Cadastre-se gratuitamente como afiliado e receba seu link exclusivo em poucos minutos.
          </p>
          <a 
            href={AFFILIATE_LINK} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.bigCtaBtn}
          >
            <span>QUERO SER AFILIADO</span>
            <ArrowRight size={22} />
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
