async function exportAllSubscribers() {
  const token = Buffer.from("admin:Valora2024SaaS!").toString("base64");
  try {
    const res = await fetch("https://api.valoranegocios.com.br/api/admin/licenses", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const licenses = data.licenses || [];

    const uniqueEmails = new Map();
    licenses.forEach(l => {
      const email = (l.accountEmail || l.email || '').trim().toLowerCase();
      if (email && email.includes('@')) {
        if (!uniqueEmails.has(email)) {
          uniqueEmails.set(email, {
            email: email,
            plan: l.planName || l.plan || 'N/A',
            status: l.status || 'active',
            phone: l.phone || 'N/A',
            key: l.key || 'N/A',
            createdAt: l.createdAt ? l.createdAt.substring(0, 10) : 'N/A'
          });
        }
      }
    });

    const list = Array.from(uniqueEmails.values());
    console.log(`=== TOTAL DE ASSINANTES ÚNICOS ENCONTRADOS: ${list.length} ===\n`);
    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error("Erro ao buscar assinantes:", e.message);
  }
}

exportAllSubscribers();
