async function diagnose() {
  console.log("=== DIAGNÓSTICO DO LOGIN NA VPS ===");

  const urls = [
    "https://api.valoranegocios.com.br/api/admin/login",
    "https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/login",
    "http://179.197.74.225:8787/api/admin/login"
  ];

  for (const url of urls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "Valora2024SaaS!" })
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response text:`, text);
    } catch (e) {
      console.error(`Error for ${url}:`, e.message);
    }
  }
}

diagnose();
