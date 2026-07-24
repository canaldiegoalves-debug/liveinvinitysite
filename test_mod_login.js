async function testModLogin() {
  console.log("=== TESTANDO LOGIN DO MODERADOR NA API DA VPS ===");
  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "moderador",
        password: "ValoraMod2024!"
      })
    });
    const data = await res.json();
    console.log("Response Moderador:", data);
  } catch (e) {
    console.error(e);
  }
}

testModLogin();
