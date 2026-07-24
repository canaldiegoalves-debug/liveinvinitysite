async function testCaktoWebhook() {
  console.log("=== CONFERÊNCIA DO WEBHOOK DA CAKTO ===");

  const webhookUrl = "https://api.valoranegocios.com.br/api/webhooks/cakto";

  // Testar envio de evento simulado de reembolso
  const payloadTest = {
    event: "charge.refunded",
    status: "refunded",
    customer: {
      email: "teste_conferencia_reembolso@valoranegocios.com.br"
    },
    order_id: "TEST_ORDER_9999"
  };

  try {
    console.log(`Enviando requisição de teste para ${webhookUrl}...`);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadTest)
    });

    console.log(`HTTP Status do Webhook: ${res.status}`);
    const data = await res.json().catch(() => "NON_JSON");
    console.log("Resposta do Webhook Cakto:", data);

    if (res.status === 200 && data.ok) {
      console.log("✅ WEBHOOK DA CAKTO ESTÁ 100% OPERACIONAL E OUVINDO!");
    } else {
      console.log("⚠️ Webhook respondeu com erro ou status inesperado.");
    }
  } catch (e) {
    console.error("Erro ao testar Webhook:", e.message);
  }
}

testCaktoWebhook();
