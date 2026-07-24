const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

// Divide server.js em 2 comandos curtos
const sMid = Math.floor(sB64.length / 2);
const sCmd1 = `echo '${sB64.substring(0, sMid)}' > /tmp/s.b64`;
const sCmd2 = `echo '${sB64.substring(sMid)}' >> /tmp/s.b64 && base64 -d /tmp/s.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js && rm /tmp/s.b64`;

// Divide app.js em 2 comandos curtos
const aMid = Math.floor(aB64.length / 2);
const aCmd1 = `echo '${aB64.substring(0, aMid)}' > /tmp/a.b64`;
const aCmd2 = `echo '${aB64.substring(aMid)}' >> /tmp/a.b64 && base64 -d /tmp/a.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/a.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\p1.txt', sCmd1, 'utf8');
fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\p2.txt', sCmd2, 'utf8');
fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\p3.txt', aCmd1, 'utf8');
fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\p4.txt', aCmd2, 'utf8');

console.log("✅ 4 comandos ultra-curtos criados com sucesso!");
