const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

const sHalf = Math.floor(sB64.length / 2);
const aHalf = Math.floor(aB64.length / 2);

const script = `echo '${sB64.substring(0, sHalf)}' > /tmp/s.b64 && echo '${sB64.substring(sHalf)}' >> /tmp/s.b64 && base64 -d /tmp/s.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js && rm /tmp/s.b64 && echo '${aB64.substring(0, aHalf)}' > /tmp/a.b64 && echo '${aB64.substring(aHalf)}' >> /tmp/a.b64 && base64 -d /tmp/a.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/a.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\rollback_vps.txt', script, 'utf8');
console.log("✅ rollback_vps.txt criado com sucesso!");
