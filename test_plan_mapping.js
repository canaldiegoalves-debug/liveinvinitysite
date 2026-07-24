async function testPlans() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const offers = ["xd4yj7y", "3477jz3_976117", "3477jz3", "mdz39dg", "starter", "pro", "infinity"];

  for (const o of offers) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase_approved",
        status: "paid",
        email: "test@example.com",
        offer_id: o,
        plan_id: o,
        offer: { id: o, name: o },
        plan_name: o
      })
    });
    const json = await res.json();
    console.log(`Oferta '${o}' ➔ Mapeado como:`, json.mappedPlan);
  }
}

testPlans();
