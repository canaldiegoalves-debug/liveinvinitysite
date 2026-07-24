async function testFormats() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  const testPayloads = [
    {
      name: "Formato 1: Price 67 (Básico)",
      payload: {
        event: "subscription_created",
        status: "paid",
        email: "test_67@example.com",
        price: 67,
        amount: 67,
        data: {
          status: "paid",
          price: 67,
          amount: 67,
          customer: { email: "test_67@example.com", name: "Teste 67" }
        }
      }
    },
    {
      name: "Formato 2: Price 97 (Pro)",
      payload: {
        event: "subscription_created",
        status: "paid",
        email: "test_97@example.com",
        price: 97,
        amount: 97,
        data: {
          status: "paid",
          price: 97,
          amount: 97,
          customer: { email: "test_97@example.com", name: "Teste 97" }
        }
      }
    },
    {
      name: "Formato 3: Price 147 (Premium)",
      payload: {
        event: "subscription_created",
        status: "paid",
        email: "test_147@example.com",
        price: 147,
        amount: 147,
        data: {
          status: "paid",
          price: 147,
          amount: 147,
          customer: { email: "test_147@example.com", name: "Teste 147" }
        }
      }
    },
    {
      name: "Formato 4: event_type / purchase_approved",
      payload: {
        event_type: "purchase_approved",
        status: "paid",
        email: "test_approved@example.com",
        price: 97
      }
    }
  ];

  for (const item of testPayloads) {
    console.log(`\nTesting: ${item.name}...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload)
      });
      const text = await res.text();
      console.log(`Response (${res.status}):`, text);
    } catch (e) {
      console.error("Error:", e);
    }
  }
}

testFormats();
