async function corrigir30Dias() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const vendas = [
    { nome: "Joao Neto Luiz", email: "joaoluizneto90@gmail.com", plano: "basic", valor: 67 },
    { nome: "TULIO GUSTAVO GARCIA", email: "tulio8528@gmail.com", plano: "basic", valor: 67 },
    { nome: "Thiago Custodio", email: "thiagojsc@gmail.com", plano: "basic", valor: 67 },
    { nome: "FRAGONARD BRUNO ANDRADE MATOS", email: "brunoemonynha@gmail.com", plano: "basic", valor: 67 },
    { nome: "Maria Aparecida", email: "mariaocampo7991@gmail.com", plano: "basic", valor: 67 },
    { nome: "andre luis", email: "andre.jr123567@gmail.com", plano: "basic", valor: 67 },
    { nome: "GABRIEL APARECIDO DE SOUZA", email: "gabrielsouzasp@hotmail.com", plano: "pro", valor: 97 }
  ];

  for (const v of vendas) {
    console.log(`Resetando validade para 30 dias: ${v.nome} (${v.email})...`);
    const payload = {
      event: "purchase_approved",
      status: "paid",
      email: v.email,
      customer: { name: v.nome, email: v.email },
      order: {
        id: `fix30days_${Date.now()}`,
        status: "paid",
        amount: v.valor,
        customer: { name: v.nome, email: v.email }
      },
      offer: {
        id: v.plano === "pro" ? "3477jz3_976117" : "xd4yj7y",
        name: v.plano === "pro" ? "Live Infinity Pro" : "Live Infinit Básico"
      },
      amount: v.valor,
      price: v.valor
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`✅ ${v.email} ➔`, data);
    } catch (e) {
      console.error(`❌ Erro em ${v.email}:`, e.message);
    }
  }
}

corrigir30Dias();
