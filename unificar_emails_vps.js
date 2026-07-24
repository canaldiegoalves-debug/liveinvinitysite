async function unificarEmailsVPS() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";

  console.log("=== UNIFICANDO E-MAILS DE ACESSO PARA O E-MAIL DE COMPRA ORIGINAL ===");
  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/admin/licenses", {
      headers: { "Authorization": "Bearer admin:Valora2024SaaS!" }
    });
    console.log("Status API Admin:", res.status);
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

unificarEmailsVPS();
