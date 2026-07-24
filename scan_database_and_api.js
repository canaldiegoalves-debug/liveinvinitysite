async function scanSystem() {
  console.log("=== VARREDURA COMPLETA DO SISTEMA DE BANCO E API ===");

  const adminToken = Buffer.from("admin:Valora2024SaaS!").toString("base64");
  const modToken = Buffer.from("moderador:ValoraMod2024!").toString("base64");

  // 1. Testando API /api/admin/licenses com token Admin
  try {
    const res1 = await fetch("https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/licenses", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("1. /painel-seguro-liveinfinity/api/admin/licenses (Admin Token):", res1.status);
    const body1 = await res1.json().catch(() => "non-json");
    console.log("-> Resposta Licenças (Admin):", Array.isArray(body1.licenses) ? `Encontradas ${body1.licenses.length} licenças` : body1);
  } catch (e) {
    console.error("1. Erro:", e.message);
  }

  // 2. Testando API /api/admin/licenses sem o prefixo
  try {
    const res2 = await fetch("https://api.valoranegocios.com.br/api/admin/licenses", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("2. /api/admin/licenses (Admin Token direto na API):", res2.status);
    const body2 = await res2.json().catch(() => "non-json");
    console.log("-> Resposta Licenças Direto:", Array.isArray(body2.licenses) ? `Encontradas ${body2.licenses.length} licenças` : body2);
  } catch (e) {
    console.error("2. Erro:", e.message);
  }

  // 3. Testando API /api/admin/licenses com token Moderador
  try {
    const res3 = await fetch("https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/licenses", {
      headers: { Authorization: `Bearer ${modToken}` }
    });
    console.log("3. /painel-seguro-liveinfinity/api/admin/licenses (Moderador Token):", res3.status);
    const body3 = await res3.json().catch(() => "non-json");
    console.log("-> Resposta Licenças (Moderador):", Array.isArray(body3.licenses) ? `Encontradas ${body3.licenses.length} licenças` : body3);
  } catch (e) {
    console.error("3. Erro:", e.message);
  }

  // 4. Testando API /api/admin/accounts (Clientes)
  try {
    const res4 = await fetch("https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/accounts", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("4. /painel-seguro-liveinfinity/api/admin/accounts:", res4.status);
    const body4 = await res4.json().catch(() => "non-json");
    console.log("-> Resposta Clientes:", Array.isArray(body4.accounts) ? `Encontradas ${body4.accounts.length} contas` : body4);
  } catch (e) {
    console.error("4. Erro:", e.message);
  }
}

scanSystem();
