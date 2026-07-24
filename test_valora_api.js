async function testValora() {
  const url = "https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010";
  console.log("Enviando GET para:", url);
  try {
    const resGet = await fetch(url);
    console.log("GET status:", resGet.status);
    const textGet = await resGet.text();
    console.log("GET body:", textGet.substring(0, 300));
  } catch (e) {
    console.error("Erro GET:", e);
  }

  console.log("\nEnviando POST de teste...");
  try {
    const resPost = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase_approved",
        status: "paid",
        data: {
          status: "paid",
          customer: { name: "Maria Ocampo", email: "mariaocampo7991@gmail.com" },
          offer: { id: "3477jz3_976117", name: "Plano Pro" }
        }
      })
    });
    console.log("POST status:", resPost.status);
    const textPost = await resPost.text();
    console.log("POST body:", textPost);
  } catch (e) {
    console.error("Erro POST:", e);
  }
}

testValora();
