async function criarEmailTesteAula() {
  const testEmail = "alunodemo@gmail.com";
  const plan = "premium";
  const duration = 30;
  const note = "Conta de Teste para Aula / Demonstração";

  console.log(`=== CRIANDO E-MAIL DE TESTE PARA AULA: ${testEmail} ===`);

  try {
    // 1. Envia via API de Webhook (simulando compra aprovada na Cakto)
    const webhookPayload = {
      event: "subscription_created",
      status: "paid",
      email: testEmail,
      customer: {
        email: testEmail,
        name: "Aluno Demonstração Aula"
      },
      order: {
        id: "ord_aula_demo_100",
        status: "paid",
        amount: 147.00,
        customer: { email: testEmail, name: "Aluno Demonstração Aula" }
      },
      offer: {
        id: "mdz39dg",
        name: "Live Infinity Premium (Aula)"
      },
      amount: 147.00,
      price: 147.00
    };

    const res = await fetch("https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload)
    });

    const data = await res.json();
    console.log("✅ Webhook da conta de teste enviado com sucesso:", data);

    // 2. Busca as licenças geradas para o e-mail de teste
    const resAdmin = await fetch(`https://api.valoranegocios.com.br/api/admin/licenses?search=${encodeURIComponent(testEmail)}`, {
      headers: {
        "Authorization": "Bearer admin:Valora2024SaaS!"
      }
    });

    const dataAdmin = await resAdmin.json();
    console.log("📌 Licenças no Painel para o e-mail de teste:", JSON.stringify(dataAdmin, null, 2));

  } catch (e) {
    console.error("Erro ao criar e-mail de teste:", e.message);
  }
}

criarEmailTesteAula();
