
const fs = require('fs');
const path = require('path');

const certPath = 'C:\\Users\\diegu\\Downloads\\producao-680164-helix-bet.p12';
const envPath = 'c:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\helix-bet\\.env.local';

try {
  const certBuffer = fs.readFileSync(certPath);
  const base64 = certBuffer.toString('base64');
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Substituir o EFI_CERTIFICATE_BASE64
  envContent = envContent.replace(/EFI_CERTIFICATE_BASE64=.*/, `EFI_CERTIFICATE_BASE64=${base64}`);
  
  // Mudar para Produção
  envContent = envContent.replace(/EFI_SANDBOX=true/, 'EFI_SANDBOX=false');
  
  // Garantir que as credenciais de produção estão desativadas (comentadas) e ativadas conforme necessário
  // Na verdade, o usuário quer PRODUÇÃO agora.
  // Vou descomentar as de produção e comentar as de homologação.
  
  envContent = envContent.replace(/EFI_CLIENT_ID=Client_Id_6a1f70669659b083413d0f9f5b41fa776351e1d8/, '# EFI_CLIENT_ID=Client_Id_6a1f70669659b083413d0f9f5b41fa776351e1d8');
  envContent = envContent.replace(/EFI_CLIENT_SECRET=Client_Secret_cff345a9ea898aaf205638f8d02b8c115782ea0e/, '# EFI_CLIENT_SECRET=Client_Secret_cff345a9ea898aaf205638f8d02b8c115782ea0e');
  
  envContent = envContent.replace(/# EFI_CLIENT_ID=Client_Id_61bfe63e6885d9f5eb8883bf0e6f78478aee9f72/, 'EFI_CLIENT_ID=Client_Id_61bfe63e6885d9f5eb8883bf0e6f78478aee9f72');
  envContent = envContent.replace(/# EFI_CLIENT_SECRET=Client_Secret_a18fb72734b68cfd939d0a29e7747c6d7eecfe0e/, 'EFI_CLIENT_SECRET=Client_Secret_a18fb72734b68cfd939d0a29e7747c6d7eecfe0e');

  fs.writeFileSync(envPath, envContent);
  console.log('Sucesso: Certificado convertido e .env.local atualizado para PRODUÇÃO!');
} catch (err) {
  console.error('Erro ao processar certificado:', err);
}
