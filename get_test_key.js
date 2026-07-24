async function listAllLicenses() {
  const token = Buffer.from("admin:Valora2024SaaS!").toString("base64");
  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/admin/licenses", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Total Licenças:", (data.licenses || []).length);
    console.log("Últimas 5 Licenças:", JSON.stringify((data.licenses || []).slice(0, 5), null, 2));
  } catch (e) {
    console.error(e);
  }
}

listAllLicenses();
