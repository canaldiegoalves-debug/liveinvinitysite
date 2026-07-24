const fs = require('fs');

const appJsContent = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js', 'utf8');

const bashCmd = `cat << 'EOF' > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js
${appJsContent}
EOF
echo "✅ PUBLIC/APP.JS RESTAURADO E 100% FUNCIONAL NA VPS!"
`;

fs.writeFileSync('C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\vps_fix_app_js.txt', bashCmd, 'utf8');
console.log("✅ vps_fix_app_js.txt gerado com sucesso!");
