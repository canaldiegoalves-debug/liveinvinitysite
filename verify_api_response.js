async function verifyApi() {
  console.log("=== TESTANDO CONEXÃO DIRETA COM AS LICENÇAS NA VPS ===");

  const adminToken = Buffer.from("admin:Diego14032010").toString("base64");

  const urls = [
    "https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/admin/licenses",
    "https://api.valoranegocios.com.br/api/admin/licenses"
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching ${url}...`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`Status: ${res.status}`);
      const data = await res.json().catch(() => "NON_JSON");
      if (data.licenses) {
        console.log(`✅ SUCESSO! Encontradas ${data.licenses.length} licenças cadastradas no banco!`);
      } else {
        console.log("Response:", data);
      }
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}

verifyApi();
