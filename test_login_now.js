async function checkLoginStatus() {
  console.log("=== TESTANDO SE A TRAVA DE 15 MINUTOS JÁ EXPIROU NA VPS ===");

  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "Valora2024SaaS!"
      })
    });

    const data = await res.json();
    console.log("Status do Login Master Admin (admin):", data);

    const resMod = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "moderador",
        password: "ValoraMod2024!"
      })
    });

    const dataMod = await resMod.json();
    console.log("Status do Login Moderador (moderador):", dataMod);

  } catch (e) {
    console.error("Erro na requisição:", e.message);
  }
}

checkLoginStatus();
