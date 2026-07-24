async function getHeaders() {
  const res = await fetch("https://api.valoranegocios.com.br/api/webhooks/cakto?secret=Diego14032010Diego14032010", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  console.log("Status:", res.status);
  console.log("Headers:");
  res.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));
}

getHeaders();
