async function testPasswords() {
  const passwords = [
    "Diego14032010",
    "Diego14032010Diego14032010",
    "Valora2024!",
    "Valora2024SaaS!",
    "admin",
    "Diego14032010!",
    "Valora2024",
    "123456"
  ];

  console.log("=== ENCONTRANDO A SENHA CORRETA DE ADMIN NA VPS ===");

  for (const pw of passwords) {
    try {
      const res = await fetch("https://api.valoranegocios.com.br/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: pw })
      });
      const data = await res.json();
      console.log(`Senha '${pw}':`, data);
      if (data.ok) {
        console.log(`🎉 SENHA ENCONTRADA! A senha de Admin na VPS é: '${pw}'`);
        break;
      }
    } catch (e) {}
  }
}

testPasswords();
