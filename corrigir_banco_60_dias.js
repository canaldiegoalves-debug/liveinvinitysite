async function corrigirBanco60Dias() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  // Lista de todos os clientes que acumularam 60/90/120 dias
  const clientes = [
    { email: "tulio8528@gmail.com", plano: "basic", valor: 67 },
    { email: "joaoluizneto90@gmail.com", plano: "basic", valor: 67 },
    { email: "gabrielsouzasp@hotmail.com", plano: "pro", valor: 97 },
    { email: "thiagojsc@gmail.com", plano: "basic", valor: 67 },
    { email: "brunoemonynha@gmail.com", plano: "basic", valor: 67 },
    { email: "mariaocampo7991@gmail.com", plano: "basic", valor: 67 },
    { email: "andre.jr123567@gmail.com", plano: "basic", valor: 67 }
  ];

  console.log("=== RESETANDO DURAÇÃO E E-MAILS DE COMPRA PARA EXATAMENTE 30 DIAS ===");
  for (const c of clientes) {
    const payload = {
      event: "purchase_approved",
      status: "paid",
      email: c.email,
      reset_strict_30: true,
      customer: { email: c.email },
      order: {
        id: `fix_strict_30_${Date.now()}_${Math.floor(Math.random()*100)}`,
        status: "paid",
        amount: c.valor,
        customer: { email: c.email }
      },
      offer: {
        id: c.plano === "pro" ? "3477jz3_976117" : "xd4yj7y",
        name: c.plano === "pro" ? "Live Infinity Pro" : "Live Infinit Básico"
      },
      amount: c.valor,
      price: c.valor
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`Reset 30 dias (${c.email}) ➔`, data);
    } catch (e) {
      console.error(`Erro em ${c.email}:`, e.message);
    }
  }
}

corrigirBanco60Dias();
