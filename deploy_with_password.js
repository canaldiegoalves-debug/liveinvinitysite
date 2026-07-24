const { execSync } = require('child_process');

console.log("=== ENVIANDO ARQUIVOS DE MODERADOR PARA A VPS ===");

const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

// Tenta via plink, pscp ou ssh com BatchMode=yes
try {
  console.log("Upload via pscp / scp...");
  execSync(`powershell -Command "scp -o BatchMode=yes -o StrictHostKeyChecking=no '${serverFile}' root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js"`, { stdio: 'inherit' });
  execSync(`powershell -Command "scp -o BatchMode=yes -o StrictHostKeyChecking=no '${appFile}' root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js"`, { stdio: 'inherit' });
  execSync(`powershell -Command "ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@179.197.74.225 'pm2 restart liveinfinity --update-env'"`, { stdio: 'inherit' });
  console.log("✅ DEPLOY SUCESSO!");
} catch (e) {
  console.log("Tentativa 1 falhou, tentando plink/pscp com senha...");
  try {
    const pw = "Diego14032010Diego14032010";
    execSync(`pscp -pw "${pw}" "${serverFile}" root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js`, { stdio: 'inherit' });
    execSync(`pscp -pw "${pw}" "${appFile}" root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js`, { stdio: 'inherit' });
    execSync(`plink -pw "${pw}" root@179.197.74.225 "pm2 restart liveinfinity --update-env"`, { stdio: 'inherit' });
    console.log("✅ DEPLOY VIA PLINK/PSCP SUCESSO!");
  } catch (err) {
    console.error("Erro final deploy:", err.message);
  }
}
