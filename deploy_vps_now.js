const fs = require('fs');
const { spawn } = require('child_process');

const password = "Diego14032010Diego14032010";
const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

const serverContent = fs.readFileSync(serverFile, 'utf8');
const appContent = fs.readFileSync(appFile, 'utf8');

// Monta um script bash para rodar na VPS
const b64Server = Buffer.from(serverContent).toString('base64');
const b64App = Buffer.from(appContent).toString('base64');

const remoteCmd = `
echo '${b64Server}' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js
echo '${b64App}' | base64 -d > /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js
pm2 restart liveinfinity --update-env
echo "DEPLOY_COMPLETE_SUCCESS"
`;

console.log("=== EXECUTANDO ATUALIZAÇÃO DA VPS COM SENHA ===");

const child = spawn('ssh', ['-t', '-o', 'StrictHostKeyChecking=no', 'root@179.197.74.225', 'bash'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => console.log('STDOUT:', d.toString()));
child.stderr.on('data', d => {
  const err = d.toString();
  console.log('STDERR:', err);
  if (err.toLowerCase().includes('password')) {
    console.log('Enviando senha para SSH...');
    child.stdin.write(password + '\r\n');
  }
});

child.stdin.write(password + '\r\n');
setTimeout(() => {
  child.stdin.write(remoteCmd + '\r\nexit\r\n');
}, 1000);

child.on('close', code => {
  console.log(`Processo finalizado com código ${code}`);
});
