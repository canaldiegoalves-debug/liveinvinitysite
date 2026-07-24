const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

console.log("server.js length:", sB64.length);
console.log("app.js length:", aB64.length);

// Server partes
const sP1 = sB64.substring(0, 30000);
const sP2 = sB64.substring(30000, 60000);
const sP3 = sB64.substring(60000, 90000);
const sP4 = sB64.substring(90000);

const sCmd = `echo '${sP1}' > /tmp/s.b64 && echo '${sP2}' >> /tmp/s.b64 && echo '${sP3}' >> /tmp/s.b64 && echo '${sP4}' >> /tmp/s.b64 && base64 -d /tmp/s.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js && rm /tmp/s.b64`;

// App partes
const aP1 = aB64.substring(0, 30000);
const aP2 = aB64.substring(30000, 60000);
const aP3 = aB64.substring(60000);

const aCmd = `echo '${aP1}' > /tmp/a.b64 && echo '${aP2}' >> /tmp/a.b64 && echo '${aP3}' >> /tmp/a.b64 && base64 -d /tmp/a.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/a.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\clean_cmd_server.txt', sCmd, 'utf8');
fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\clean_cmd_app.txt', aCmd, 'utf8');

console.log("✅ Criado clean_cmd_server.txt e clean_cmd_app.txt!");
