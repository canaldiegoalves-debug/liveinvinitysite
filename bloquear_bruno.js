async function bloquearBruno() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const payload = {
    event: "subscription_canceled",
    status: "cancelled",
    email: "brunoemonynha@gmail.com",
    customer: {
      name: "FRAGONARD BRUNO ANDRADE MATOS",
      email: "brunoemonynha@gmail.com"
    },
    order: {
      id: "recup_cancel_bruno",
      status: "cancelled",
      customer: {
        email: "brunoemonynha@gmail.com"
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Resposta bloqueio Bruno:", text);
  } catch (e) {
    console.error("Erro:", e);
  }
}

bloquearBruno();
