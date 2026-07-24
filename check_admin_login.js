async function checkAdminLogin() {
  console.log("=== TESTANDO LOGIN COM AS DUAS SENHAS ===");

  const p1 = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "Valora2024SaaS!" })
  }).then(r => r.json());

  console.log("Test Admin com Valora2024SaaS!:", p1);

  const p2 = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "moderador", password: "ValoraMod2024!" })
  }).then(r => r.json());

  console.log("Test Moderador com ValoraMod2024!:", p2);
}

checkAdminLogin();
