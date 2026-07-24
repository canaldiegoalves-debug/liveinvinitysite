const { spawnSync } = require('child_process');

console.log("=== DESBLOQUEANDO E ATUALIZANDO SERVIDOR NA VPS ===");

const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

// 1. Upload server.js
console.log("1. Enviando server.js...");
const scp1 = spawnSync('scp', ['-o', 'StrictHostKeyChecking=no', serverFile, 'root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js'], { encoding: 'utf8' });
console.log("SCP 1:", scp1.stdout || 'ok', scp1.stderr || '');

// 2. Upload app.js
console.log("2. Enviando public/app.js...");
const scp2 = spawnSync('scp', ['-o', 'StrictHostKeyChecking=no', appFile, 'root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js'], { encoding: 'utf8' });
console.log("SCP 2:", scp2.stdout || 'ok', scp2.stderr || '');

// 3. Restart PM2
console.log("3. Reiniciando PM2...");
const pm2 = spawnSync('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@179.197.74.225', 'pm2 restart liveinfinity --update-env'], { encoding: 'utf8' });
console.log("PM2:", pm2.stdout || 'ok', pm2.stderr || '');

console.log("🚀 FINALIZADO!");
