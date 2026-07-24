const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');

const b64 = Buffer.from(serverJs).toString('base64');
const half = Math.floor(b64.length / 2);
const p1 = b64.substring(0, half);
const p2 = b64.substring(half);

const bashCmd = `echo '${p1}' > /tmp/srv.b64 && echo '${p2}' >> /tmp/srv.b64 && base64 -d /tmp/srv.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js && rm /tmp/srv.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\vps_fix_server_js.txt', bashCmd, 'utf8');
console.log("✅ vps_fix_server_js.txt criado com sucesso!");
