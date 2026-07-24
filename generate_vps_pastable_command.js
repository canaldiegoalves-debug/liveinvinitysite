const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

// Cria comandos em partes para nao estourar o limite de linha do bash
const cmd1 = `echo '${sB64.substring(0, Math.floor(sB64.length / 2))}' > /tmp/s1.b64`;
const cmd2 = `echo '${sB64.substring(Math.floor(sB64.length / 2))}' >> /tmp/s1.b64`;
const cmd3 = `base64 -d /tmp/s1.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js`;

const cmd4 = `echo '${aB64}' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js`;
const cmd5 = `pm2 restart liveinfinity --update-env`;

console.log("=== COMANDO 1 PARA COLAR NO TERMINAL DA VPS ===");
console.log(`${cmd1} && ${cmd2} && ${cmd3} && ${cmd4} && ${cmd5}`);
