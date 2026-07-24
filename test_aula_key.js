async function testAulaKey() {
  const email = "alunodemo@gmail.com";
  const key = "LIVEINF-PREMIUM-814E5-9367D-C8F2A-ED920";

  console.log("=== VALIDANDO CHAVE DE TESTE PARA AULA EM AMBAS AS EXTENSÕES ===");

  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        key: key,
        deviceId: "dv-aula-demo",
        deviceFingerprint: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      })
    });
    const data = await res.json();
    console.log("✅ Resultado da Validação na VPS:", data);
  } catch (e) {
    console.error("Erro ao validar:", e.message);
  }
}

testAulaKey();
