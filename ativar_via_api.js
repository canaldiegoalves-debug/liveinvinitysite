async function ativarClientes() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const clientes = [
    { name: "Maria Ocampo", email: "mariaocampo7991@gmail.com", offerId: "3477jz3_976117", planName: "Plano Pro" },
    { name: "Andre Jr", email: "andre.jr123567@gmail.com", offerId: "3477jz3_976117", planName: "Plano Pro" }
  ];

  for (const c of clientes) {
    console.log(`\n----------------------------------------`);
    console.log(`Enviando ativação para: ${c.email}`);

    // Testamos envios com os formatos que a Cakto dispara
    const payload = {
      event: "purchase_approved",
      status: "paid",
      email: c.email,
      customer: {
        name: c.name,
        email: c.email
      },
      offer: {
        id: c.offerId,
        name: c.planName
      },
      plan_id: c.offerId,
      plan_name: c.planName
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`✅ Resposta para ${c.email} (${res.status}):`, data);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${c.email}:`, err);
    }
  }
}

ativarClientes();
