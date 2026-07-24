async function ativarPaula() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const payload = {
    event: "subscription_created",
    status: "paid",
    email: "paulawcv@gmail.com",
    customer: {
      email: "paulawcv@gmail.com",
      name: "Paula michele Koch"
    },
    order: {
      id: "ord_paula_1015",
      status: "paid",
      amount: 147.00,
      customer: { email: "paulawcv@gmail.com", name: "Paula michele Koch" }
    },
    offer: {
      id: "mdz39dg",
      name: "Live Infinity Premium"
    },
    amount: 147.00,
    price: 147.00
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("✅ Venda da Paula Koch ativada na VPS:", data);
  } catch (e) {
    console.error("Erro ao ativar Paula:", e.message);
  }
}

ativarPaula();
