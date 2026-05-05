"use client";

import { CheckCircle2, Zap, Clock, TrendingUp, ShieldCheck, Mail, ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.container} data-theme="light">
      {/* Navbar Minimalista */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>V</div>
          <span>VALORA</span>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>Entrar</Link>
          <Link href="/cadastro" className={styles.ctaBtn}>Começar Grátis</Link>
        </div>
      </nav>

      {/* Hero Section - Foco na Dor */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>SaaS para Prestadores de Serviço</div>
          <h1 className={styles.title}>
            Pare de perder dinheiro com <span className={styles.highlight}>orçamentos mal calculados</span>
          </h1>
          <p className={styles.subtitle}>
            Você sente que trabalha muito e não vê a cor do dinheiro? O problema pode estar na sua precificação. 
            O Valora calcula cada centavo de material e mão de obra para você nunca mais ter prejuízo.
          </p>
          <div className={styles.heroBtns}>
            <Link href="/cadastro" className={styles.mainCta}>
              Criar meu orçamento agora <ArrowRight size={18} />
            </Link>
            <button className={styles.secondaryBtn} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              <PlayCircle size={18} /> Ver como funciona
            </button>
          </div>
          <p className={styles.freeNotice}>✅ Teste grátis. Não precisa de cartão.</p>
        </div>
      </section>

      {/* Seção de Dores */}
      <section id="features" className={styles.painPoints}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>O caos termina aqui</h2>
          <p className={styles.sectionSubtitle}>Você se identifica com algum desses problemas?</p>
        </div>

        <div className={styles.painGrid}>
          {[
            {
              icon: <Clock color="#dc2626" />,
              title: "Horas perdidas no WhatsApp",
              desc: "Passar o dia respondendo preço sem saber se vai fechar ou se está cobrando o certo."
            },
            {
              icon: <TrendingUp color="#dc2626" />,
              title: "Prejuízo invisível",
              desc: "Esquecer de somar aquele material caro e acabar pagando para trabalhar."
            },
            {
              icon: <ShieldCheck color="#dc2626" />,
              title: "Falta de profissionalismo",
              desc: "Enviar mensagens bagunçadas ao invés de um PDF impecável com sua logo."
            }
          ].map((item, i) => (
            <div key={i} className={styles.painCard}>
              <div className={styles.painIcon}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios Reais */}
      <section className={styles.benefits}>
        <div className={styles.benefitsContainer}>
          <div className={styles.benefitImage}>
            {/* Aqui entraria um mockup do sistema */}
            <div className={styles.mockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.dot} /> <div className={styles.dot} /> <div className={styles.dot} />
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupLine} style={{ width: "60%" }} />
                <div className={styles.mockupLine} style={{ width: "40%" }} />
                <div className={styles.mockupPrice}>R$ 1.450,00</div>
                <div className={styles.mockupTag}>Orçamento Aprovado</div>
              </div>
            </div>
          </div>

          <div className={styles.benefitText}>
            <h2 className={styles.benefitTitle}>Sua gestão no <span className={styles.highlight}>piloto automático</span></h2>
            <ul className={styles.benefitList}>
              <li>
                <CheckCircle2 size={20} className={styles.check} />
                <div>
                  <strong>Cálculo exato por ml/grama:</strong>
                  Cadastre o galão e o sistema calcula o custo de cada gota usada no serviço.
                </div>
              </li>
              <li>
                <CheckCircle2 size={20} className={styles.check} />
                <div>
                  <strong>Agenda integrada:</strong>
                  Saiba exatamente o que precisa ser entregue hoje, amanhã e na próxima semana.
                </div>
              </li>
              <li>
                <CheckCircle2 size={20} className={styles.check} />
                <div>
                  <strong>Envio em 1 clique:</strong>
                  Gere o PDF ou envie direto no WhatsApp do cliente com mensagem formatada.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.finalCta}>
        <div className={styles.finalCard}>
          <Zap size={48} className={styles.zapIcon} />
          <h2>Pronto para profissionalizar seu negócio?</h2>
          <p>Junte-se a centenas de prestadores que pararam de chutar preços e começaram a lucrar de verdade.</p>
          <Link href="/cadastro" className={styles.mainCta}>
            Começar Agora Gratuitamente
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>V</div>
          <span>VALORA</span>
        </div>
        <p>© 2024 Valora SaaS - Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
