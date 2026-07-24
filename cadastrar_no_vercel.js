async function cadastrarNoVercel() {
  const url = "https://liveinfinitysite.vercel.app/api/webhook/cakto";

  const clientes = [
    {
      name: "André Jr",
      email: "andre.jr123567@gmail.com",
      offer: { id: "3477jz3_976117", name: "Live Infinity Pro" },
      price: 97
    },
    {
      name: "Maria Ocampo",
      email: "mariaocampo7991@gmail.com",
      offer: { id: "3477jz3_976117", name: "Live Infinity Pro" },
      price: 97
    }
  ];

  for (const c of clientes) {
    console.log(`Enviando ${c.name} (${c.email}) para Vercel Admin...`);
    const payload = {
      event: "purchase_approved",
      status: "paid",
      data: {
        status: "paid",
        customer: { name: c.name, email: c.email },
        offer: c.offer,
        price: c.price,
        amount: c.price
      }
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`✅ Resposta (${res.status}):`, data);
    } catch (e) {
      console.error(`❌ Erro:`, e);
    }
  }
}

cadastrarNoVercel();
