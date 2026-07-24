const { spawnSync } = require('child_process');

console.log("=== ENVIANDO SERVER.JS E APP.JS VIA SCP DIRETO ===");

const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

// 1. Upload server.js
console.log("1. Uploading server.js...");
const scp1 = spawnSync('scp', ['-o', 'StrictHostKeyChecking=no', serverFile, 'root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js'], { encoding: 'utf8' });
console.log("SCP 1 output:", scp1.stdout, scp1.stderr);

// 2. Upload app.js
console.log("2. Uploading app.js...");
const scp2 = spawnSync('scp', ['-o', 'StrictHostKeyChecking=no', appFile, 'root@179.197.74.225:/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js'], { encoding: 'utf8' });
console.log("SCP 2 output:", scp2.stdout, scp2.stderr);

// 3. Restart PM2
console.log("3. Restarting PM2...");
const pm2 = spawnSync('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@179.197.74.225', 'pm2 restart liveinfinity --update-env'], { encoding: 'utf8' });
console.log("PM2 restart output:", pm2.stdout, pm2.stderr);

console.log("🚀 CONCLUÍDO!");
