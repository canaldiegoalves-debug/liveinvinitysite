const fs = require('fs');

const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js', 'utf8');
const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const serverB64 = Buffer.from(serverJs).toString('base64');
const appB64 = Buffer.from(appJs).toString('base64');

// Cria o arquivo bash que pode ser executado diretamente na VPS
const bashScript = `#!/bin/bash
cat << 'EOF' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js
${serverB64}
EOF

cat << 'EOF' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js
${appB64}
EOF

pm2 restart liveinfinity --update-env
echo "✅ SERVIDOR LIVE INFINITY REINICIADO COM SUCESSO!"
`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\server_code\\install.sh', bashScript, 'utf8');
console.log("✅ Script de instalação limpa criado em install.sh!");
