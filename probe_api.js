async function probe() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const fieldsToTest = [
    { key: "offer_id", val: "3477jz3_976117" },
    { key: "offer_name", val: "Live Infinity Pro" },
    { key: "product_id", val: "3477jz3_976117" },
    { key: "product_name", val: "Live Infinity Pro" },
    { key: "plan_id", val: "3477jz3_976117" },
    { key: "plan_name", val: "Live Infinity Pro" },
    { key: "checkout_id", val: "3477jz3_976117" },
    { key: "title", val: "Live Infinity Pro" },
    { key: "item_name", val: "Live Infinity Pro" },
    { key: "data", val: { offer_id: "3477jz3_976117" } },
    { key: "data", val: { product_name: "Live Infinity Pro" } },
    { key: "data", val: { offer: { id: "3477jz3_976117", name: "Live Infinity Pro" } } },
    { key: "data", val: { price: "67.00" } },
    { key: "data", val: { price: 67 } },
    { key: "data", val: { price: 97 } },
    { key: "data", val: { price: 147 } },
    { key: "data", val: { amount: 6700 } },
    { key: "data", val: { value: 67 } }
  ];

  for (const f of fieldsToTest) {
    const payload = {
      event: "subscription_created",
      status: "paid",
      email: "probe@example.com",
      [f.key]: f.val
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log(`Testando [${f.key}: ${JSON.stringify(f.val)}] ➔ mappedPlan:`, json.mappedPlan, "| error:", json.processingError ? "IGNORADO" : "PROCESSADO!");
  }
}

probe();
