async function probePlans() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const offersToTest = [
    "xd4yj7y",
    "3477jz3_976117",
    "mdz39dg",
    "67",
    "97",
    "147",
    "67.00",
    "97.00",
    "147.00",
    "6700",
    "9700",
    "14700",
    "basico",
    "basic",
    "pro",
    "premium",
    "Live Infinit Básico",
    "Live Infinity Pro",
    "Live Infinity Premium"
  ];

  for (const o of offersToTest) {
    const payload = {
      event: "subscription_created",
      status: "paid",
      email: `test_${o}@example.com`,
      offer_id: o,
      offer: { id: o, name: o }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.mappedPlan) {
      console.log(`✅ OFERTA ENCONTRADA! '${o}' ➔ mappedPlan: ${json.mappedPlan} | Status: ${json.processingError ? "IGNORADO" : "PROCESSADO"}`);
    } else {
      console.log(`❌ '${o}' ➔ mappedPlan: null`);
    }
  }
}

probePlans();
