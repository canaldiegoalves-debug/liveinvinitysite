const fs = require('fs');

const fullAppJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const b64 = Buffer.from(fullAppJs).toString('base64');
const part1 = b64.substring(0, Math.floor(b64.length / 2));
const part2 = b64.substring(Math.floor(b64.length / 2));

const bashCmd = `echo '${part1}' > /tmp/app_full.b64 && echo '${part2}' >> /tmp/app_full.b64 && base64 -d /tmp/app_full.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/app_full.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\vps_render_fix.txt', bashCmd, 'utf8');
console.log("✅ vps_render_fix.txt criado com sucesso!");
