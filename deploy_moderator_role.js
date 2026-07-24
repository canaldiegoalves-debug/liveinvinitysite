const { execSync } = require('child_process');

console.log("=== ENVIANDO SISTEMA DE MODERADOR PARA A VPS ===");

const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

try {
  console.log("1. Enviando server.js...");
  execSync(`scp "${serverFile}" root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js`);

  console.log("2. Enviando public/app.js...");
  execSync(`scp "${appFile}" root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js`);

  console.log("3. Reiniciando servidor PM2...");
  execSync(`ssh root@179.197.74.225 "pm2 restart liveinfinity --update-env"`);

  console.log("🚀 Sistema de Moderador publicado com sucesso no servidor VPS!");
} catch (e) {
  console.error("Erro ao enviar para VPS:", e.message);
}
