const fs = require('fs');

const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const bashCmd = `cat << 'EOF' > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js
${appJs}
EOF
echo "✅ APP.JS ATUALIZADO COM SUCESSO!"
`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\update_app_js.txt', bashCmd, 'utf8');
console.log("✅ update_app_js.txt gerado com sucesso!");
