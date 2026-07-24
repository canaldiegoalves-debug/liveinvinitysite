async function diagnose() {
  console.log("=== DIAGNOSTICANDO O PAINEL E API ===");

  try {
    // 1. Testa API de Login Admin
    const resAdmin = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "Valora2024SaaS!" })
    });
    console.log("1. Admin Login Response:", resAdmin.status, await resAdmin.json().catch(() => "non-json"));

    // 2. Testa API de Login Moderador
    const resMod = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "moderador", password: "ValoraMod2024!" })
    });
    console.log("2. Moderador Login Response:", resMod.status, await resMod.json().catch(() => "non-json"));

    // 3. Busca HTML do painel
    const resHtml = await fetch("https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/");
    console.log("3. Admin Panel HTML Status:", resHtml.status);

    // 4. Busca app.js
    const resApp = await fetch("https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/app.js");
    const appText = await resApp.text();
    console.log("4. app.js Status:", resApp.status, "Tamanho:", appText.length, "Começo:", appText.substring(0, 80));

  } catch (e) {
    console.error("Erro no diagnóstico:", e.message);
  }
}

diagnose();
