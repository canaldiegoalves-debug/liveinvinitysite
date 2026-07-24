async function recuperarVendas() {
  const vpsUrl = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";
  const vercelUrl = "https://liveinfinitysite.vercel.app/api/webhook/cakto";

  const vendas = [
    {
      nome: "Joao Neto Luiz",
      email: "joaoluizneto90@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 58.49,
      data: "24/07/2026 07:53"
    },
    {
      nome: "TULIO GUSTAVO GARCIA",
      email: "tulio8528@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 32.26,
      data: "24/07/2026 07:25"
    },
    {
      nome: "Thiago Custodio",
      email: "thiagojsc@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 58.49,
      data: "23/07/2026 22:16"
    },
    {
      nome: "FRAGONARD BRUNO ANDRADE MATOS",
      email: "brunoemonynha@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 58.49,
      data: "23/07/2026 21:46"
    },
    {
      nome: "Maria Aparecida",
      email: "mariaocampo7991@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 59.74,
      data: "23/07/2026 21:07"
    },
    {
      nome: "andre luis",
      email: "andre.jr123567@gmail.com",
      plano: "basic",
      valor: 67,
      netValue: 61.17,
      data: "23/07/2026 20:52"
    },
    {
      nome: "GABRIEL APARECIDO DE SOUZA",
      email: "gabrielsouzasp@hotmail.com",
      plano: "pro",
      valor: 97,
      netValue: 85.79,
      data: "23/07/2026 12:09"
    }
  ];

  for (const v of vendas) {
    console.log(`\n==========================================`);
    console.log(`🔄 Recuperando venda: ${v.nome} (${v.email}) | Plano: ${v.plano}`);

    const payload = {
      event: "purchase_approved",
      status: "paid",
      email: v.email,
      customer: {
        name: v.nome,
        email: v.email
      },
      order: {
        id: `recup_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        status: "paid",
        amount: v.valor,
        net_value: v.netValue,
        customer: {
          name: v.nome,
          email: v.email
        }
      },
      offer: {
        id: v.plano === "pro" ? "3477jz3_976117" : "xd4yj7y",
        name: v.plano === "pro" ? "Live Infinity Pro" : "Live Infinit Básico"
      },
      amount: v.valor,
      price: v.valor
    };

    // 1. Envia para a VPS
    try {
      const resVps = await fetch(vpsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const dataVps = await resVps.text();
      console.log(`VPS Response (${resVps.status}):`, dataVps);
    } catch (e) {
      console.error(`Erro VPS:`, e.message);
    }

    // 2. Envia para a Vercel
    try {
      const resVercel = await fetch(vercelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const dataVercel = await resVercel.text();
      console.log(`Vercel Response (${resVercel.status}):`, dataVercel);
    } catch (e) {
      console.error(`Erro Vercel:`, e.message);
    }
  }
}

recuperarVendas();
