async function reprocessar() {
  const payloads = [
    {
      event: "purchase_approved",
      status: "paid",
      data: {
        status: "paid",
        customer: {
          name: "Maria Ocampo",
          email: "mariaocampo7991@gmail.com"
        },
        offer: {
          id: "3477jz3_976117",
          name: "Plano Pro"
        }
      }
    },
    {
      event: "purchase_approved",
      status: "paid",
      data: {
        status: "paid",
        customer: {
          name: "Andre Jr",
          email: "andre.jr123567@gmail.com"
        },
        offer: {
          id: "3477jz3_976117",
          name: "Plano Pro"
        }
      }
    }
  ];

  for (const body of payloads) {
    console.log(`Enviando webhook para ${body.data.customer.email}...`);
    const res = await fetch("https://liveinfinitysite.vercel.app/api/webhook/cakto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log(`Status (${res.status}):`, text.substring(0, 300));
  }
}

reprocessar();
