const { execSync } = require('child_process');

const sourceDir = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\LIVECAM-v1.0.0";
const targetDesktop = "C:\\Users\\diegu\\Desktop\\livecam-1.0.0-oficial.zip";
const targetValora = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\livecam.zip";
const targetServer = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\downloads\\livecam.zip";

console.log("=== GERAÇÃO EXCLUSIVA DO PACOTE LIVECAM 1.0.0 ===");

try {
  // 1. Gera ZIP no Desktop
  execSync(`powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${targetDesktop}' -Force"`);
  console.log(`✅ LiveCam ZIP criado no Desktop: ${targetDesktop}`);

  // 2. Copia para VALORA public
  execSync(`powershell -Command "Copy-Item -Path '${targetDesktop}' -Destination '${targetValora}' -Force"`);
  console.log(`✅ LiveCam ZIP atualizado na Vercel: ${targetValora}`);

  // 3. Copia para License Server public
  execSync(`powershell -Command "Copy-Item -Path '${targetDesktop}' -Destination '${targetServer}' -Force"`);
  console.log(`✅ LiveCam ZIP atualizado no Servidor: ${targetServer}`);
} catch (e) {
  console.error("Erro ao gerar LiveCam:", e.message);
}
