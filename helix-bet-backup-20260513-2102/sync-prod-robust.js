const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local não encontrado');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const vars = {};
lines.forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const idx = t.indexOf('=');
    if (idx > 0) {
      const key = t.substring(0, idx);
      const val = t.substring(idx + 1);
      vars[key] = val;
    }
  }
});

const keysToSync = [
  'EFI_CLIENT_ID',
  'EFI_CLIENT_SECRET',
  'EFI_CERTIFICATE_BASE64',
  'EFI_PIX_KEY',
  'EFI_SANDBOX',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🚀 Iniciando Sincronização Robusta...');

keysToSync.forEach(key => {
  const value = vars[key];
  if (!value) return;

  console.log(`📡 Sincronizando ${key}...`);
  
  // Remove se já existir para evitar prompt de confirmação
  try {
    execSync(`npx.cmd vercel env rm ${key} production -y`, { stdio: 'ignore' });
  } catch (e) {}

  // Cria um arquivo temporário para o valor (evita problemas de escape no shell e limite de caracteres)
  const tmpFile = path.join(__dirname, `tmp_${key}.txt`);
  fs.writeFileSync(tmpFile, value);

  try {
    // npx vercel env add [name] [environment] < [file]
    execSync(`npx.cmd vercel env add ${key} production < "${tmpFile}"`, { stdio: 'inherit' });
    console.log(`✅ ${key} sincronizada com sucesso!`);
  } catch (err) {
    console.error(`❌ Erro ao sincronizar ${key}`);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

console.log('✨ Sincronização Finalizada!');
