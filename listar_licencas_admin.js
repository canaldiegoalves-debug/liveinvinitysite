async function listarLicencasAdmin() {
  const token = Buffer.from("admin:").toString("base64");
  const emails = [
    "joaoluizneto90@gmail.com",
    "tulio8528@gmail.com",
    "thiagojsc@gmail.com",
    "brunoemonynha@gmail.com",
    "mariaocampo7991@gmail.com",
    "andre.jr123567@gmail.com",
    "gabrielsouzasp@hotmail.com"
  ];

  for (const email of emails) {
    try {
      const res = await fetch(`https://api.valoranegocios.com.br/api/admin/licenses?search=${encodeURIComponent(email)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log(`\nEmail: ${email}`);
      if (Array.isArray(data)) {
        data.forEach(l => console.log(`  🔑 Chave: ${l.key} | Status: ${l.status} | Plano: ${l.plan}`));
      } else if (data.licenses) {
        data.licenses.forEach(l => console.log(`  🔑 Chave: ${l.key} | Status: ${l.status} | Plano: ${l.plan}`));
      } else {
        console.log(`  Data:`, data);
      }
    } catch (e) {
      console.error(`Erro ao buscar ${email}:`, e.message);
    }
  }
}

listarLicencasAdmin();
