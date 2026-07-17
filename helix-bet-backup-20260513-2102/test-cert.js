const https = require('https');
const fs = require('fs');

const certPath = 'C:\\Users\\diegu\\Downloads\\producao-680164-helix-bet.p12';
const pfx = fs.readFileSync(certPath);

console.log('--- TESTANDO CERTIFICADO LOCALMENTE ---');

try {
  const agent = new https.Agent({ pfx, passphrase: '' });
  console.log('✅ Agente criado com sucesso (sem senha).');
} catch (err) {
  console.error('❌ Erro com senha vazia:', err.message);
  
  // Tenta com o Client ID se soubermos qual é
  const clientId = 'Client_Id_61bfe63e6885d9f5eb8883bf0e6f78478aee9f72';
  try {
    const agent2 = new https.Agent({ pfx, passphrase: clientId });
    console.log('✅ Agente criado com sucesso usando Client ID como senha.');
  } catch (err2) {
    console.error('❌ Erro com Client ID:', err2.message);
  }
}
