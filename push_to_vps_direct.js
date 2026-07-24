const fs = require('fs');
const { execSync } = require('child_process');

console.log("=== ENVIANDO SERVER.JS E APP.JS VIA BASE64 DIRETO PARA A VPS ===");

const serverPath = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appPath = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

const serverB64 = fs.readFileSync(serverPath).toString('base64');
const appB64 = fs.readFileSync(appPath).toString('base64');

try {
  console.log("1. Atualizando server.js na VPS...");
  const cmdServer = `ssh -o StrictHostKeyChecking=no root@179.197.74.225 "echo '${serverB64}' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js"`;
  execSync(cmdServer, { maxBuffer: 10 * 1024 * 1024 });

  console.log("2. Atualizando public/app.js na VPS...");
  const cmdApp = `ssh -o StrictHostKeyChecking=no root@179.197.74.225 "echo '${appB64}' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js"`;
  execSync(cmdApp, { maxBuffer: 10 * 1024 * 1024 });

  console.log("3. Reiniciando o processo no PM2...");
  execSync(`ssh -o StrictHostKeyChecking=no root@179.197.74.225 "pm2 restart liveinfinity --update-env"`);

  console.log("🚀 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!");
} catch (e) {
  console.error("Erro ao atualizar VPS:", e.message);
}
