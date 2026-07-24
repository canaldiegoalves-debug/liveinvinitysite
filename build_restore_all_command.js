const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const sB64 = Buffer.from(serverJs).toString('base64');
const aB64 = Buffer.from(appJs).toString('base64');

console.log("Tamanho serverJs B64:", sB64.length);
console.log("Tamanho appJs B64:", aB64.length);

const restoreScript = `#!/bin/bash
cat << 'EOF' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js
${sB64}
EOF

cat << 'EOF' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js
${aB64}
EOF

pm2 restart liveinfinity --update-env
echo "✅ RESTAURAÇÃO COMPLETA EXECUTADA COM SUCESSO!"
`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\restore_full_vps.sh', restoreScript, 'utf8');
console.log("✅ restore_full_vps.sh gerado!");
