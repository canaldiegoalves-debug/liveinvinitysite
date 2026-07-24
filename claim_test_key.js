async function claimTestKey() {
  const testEmail = "alunodemo@gmail.com";
  console.log(`=== GERANDO E-MAIL E CHAVE DE TESTE PARA AULA: ${testEmail} ===`);

  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/public/claim-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    console.log("Resposta da VPS ao gerar chave:", data);
  } catch (e) {
    console.error(e.message);
  }
}

claimTestKey();
