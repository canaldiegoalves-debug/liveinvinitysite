
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('Arquivo .env.local não encontrado em helix-bet/');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const vars = {};
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      vars[key] = value;
    }
  }
});

const efiVars = [
  'EFI_CLIENT_ID',
  'EFI_CLIENT_SECRET',
  'EFI_CERTIFICATE_BASE64',
  'EFI_PIX_KEY',
  'EFI_SANDBOX'
];

console.log('--- Sincronizando Variáveis com a Vercel ---');

efiVars.forEach(v => {
  if (vars[v]) {
    console.log(`Adicionando ${v}...`);
    try {
      // Usamos npx.cmd vercel env add [key] [environment] [value]
      // Nota: o valor deve ser passado via stdin para evitar problemas com caracteres especiais
      execSync(`echo ${vars[v]} | npx.cmd vercel env add ${v} production`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`Erro ao adicionar ${v}: Certifique-se de estar logado na Vercel (npx vercel login)`);
    }
  }
});

console.log('--- Concluído ---');
