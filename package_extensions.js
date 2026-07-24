const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\LIVE-INFINITY-v5.0.9";
const destZipInfinity = "C:\\Users\\diegu\\Desktop\\live-infinity-5.0.9-oficial.zip";
const destZipLiveCam = "C:\\Users\\diegu\\Desktop\\livecam-1.0.0-oficial.zip";

console.log("=== COMPACTANDO PACOTES DE EXTENSÃO NA IDENTIDADE VERMELHO E DOURADO ===");

try {
  // 1. Gera ZIP do Live Infinity
  const psCmdInfinity = `Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${destZipInfinity}' -Force`;
  execSync(`powershell -Command "${psCmdInfinity}"`);
  console.log(`✅ Pacote Live Infinity criado no Desktop: ${destZipInfinity}`);

  // 2. Gera ZIP do LiveCam
  const psCmdLiveCam = `Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${destZipLiveCam}' -Force`;
  execSync(`powershell -Command "${psCmdLiveCam}"`);
  console.log(`✅ Pacote LiveCam criado no Desktop: ${destZipLiveCam}`);
} catch (e) {
  console.error("Erro na compactação:", e.message);
}
