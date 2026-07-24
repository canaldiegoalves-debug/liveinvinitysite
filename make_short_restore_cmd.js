const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

// Escreve server.js em 4 partes no terminal da VPS
const sLen = sB64.length;
const sP1 = sB64.slice(0, Math.floor(sLen / 3));
const sP2 = sB64.slice(Math.floor(sLen / 3), Math.floor(sLen * 2 / 3));
const sP3 = sB64.slice(Math.floor(sLen * 2 / 3));

// Escreve app.js em 3 partes no terminal da VPS
const aLen = aB64.length;
const aP1 = aB64.slice(0, Math.floor(aLen / 2));
const aP2 = aB64.slice(Math.floor(aLen / 2));

const cmd1 = `echo '${sP1}' > /tmp/s.b64 && echo '${sP2}' >> /tmp/s.b64 && echo '${sP3}' >> /tmp/s.b64 && base64 -d /tmp/s.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js && rm /tmp/s.b64`;

const cmd2 = `echo '${aP1}' > /tmp/a.b64 && echo '${aP2}' >> /tmp/a.b64 && base64 -d /tmp/a.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/a.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\step1_server.txt', cmd1, 'utf8');
fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\step2_app.txt', cmd2, 'utf8');

console.log("✅ Passo 1 e Passo 2 gerados!");
