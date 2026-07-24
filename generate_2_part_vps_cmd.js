const fs = require('fs');

const fullAppJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');
const b64 = Buffer.from(fullAppJs).toString('base64');

const half = Math.floor(b64.length / 2);
const b64Part1 = b64.substring(0, half);
const b64Part2 = b64.substring(half);

const script = `echo '${b64Part1}' > /tmp/app.b64 && echo '${b64Part2}' >> /tmp/app.b64 && base64 -d /tmp/app.b64 > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js && rm /tmp/app.b64 && pm2 restart liveinfinity --update-env`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\vps_2_step.txt', script, 'utf8');
console.log("✅ vps_2_step.txt gerado com sucesso!");
