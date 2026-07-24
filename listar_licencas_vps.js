async function listarLicencas() {
  const emails = [
    "joaoluizneto90@gmail.com",
    "tulio8528@gmail.com",
    "thiagojsc@gmail.com",
    "brunoemonynha@gmail.com",
    "mariaocampo7991@gmail.com",
    "andre.jr123567@gmail.com",
    "gabrielsouzasp@hotmail.com"
  ];

  console.log("=== VENDAS RECUPERADAS COM SUCESSO NO PAINEL ===");
  for (const email of emails) {
    try {
      const res = await fetch(`https://api.valoranegocios.com.br/api/licenses?search=${encodeURIComponent(email)}`, {
        headers: {
          "Authorization": "Bearer admin:"
        }
      });
      const data = await res.json();
      console.log(`Email: ${email} ->`, data);
    } catch (e) {
      console.error(`Erro ao buscar ${email}:`, e.message);
    }
  }
}

listarLicencas();
