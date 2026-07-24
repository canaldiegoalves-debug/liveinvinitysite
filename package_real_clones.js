const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const liveInfinitySource = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\LIVE-INFINITY-v5.0.9";
const liveCamSource = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\live_infinity_cam";

const destInfinityDesktop = "C:\\Users\\diegu\\Desktop\\live-infinity-5.0.9-oficial.zip";
const destCamDesktop = "C:\\Users\\diegu\\Desktop\\livecam-1.5.0-oficial.zip";

const destInfinityValora = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\live-infinity.zip";
const destCamValora = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\livecam.zip";

const destInfinityServer = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\downloads\\live-infinity.zip";
const destCamServer = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\downloads\\livecam.zip";

console.log("=== EMPACOTANDO EXTENSÕES CLONADAS OFICIAIS (LIVE GO PRO + VIDCAM) ===");

try {
  // 1. Live Infinity (LiveGo Pro Clone)
  execSync(`powershell -Command "Compress-Archive -Path '${liveInfinitySource}\\*' -DestinationPath '${destInfinityDesktop}' -Force"`);
  console.log(`✅ Live Infinity (LiveGo Pro) ZIP criado no Desktop: ${destInfinityDesktop}`);

  // 2. LiveCam (VidCam HD Virtual Camera Clone)
  execSync(`powershell -Command "Compress-Archive -Path '${liveCamSource}\\*' -DestinationPath '${destCamDesktop}' -Force"`);
  console.log(`✅ LiveCam (VidCam Virtual HD) ZIP criado no Desktop: ${destCamDesktop}`);

  // 3. Copia para VALORA (Vercel)
  execSync(`powershell -Command "Copy-Item -Path '${destInfinityDesktop}' -Destination '${destInfinityValora}' -Force"`);
  execSync(`powershell -Command "Copy-Item -Path '${destCamDesktop}' -Destination '${destCamValora}' -Force"`);

  // 4. Copia para License Server (VPS)
  execSync(`powershell -Command "Copy-Item -Path '${destInfinityDesktop}' -Destination '${destInfinityServer}' -Force"`);
  execSync(`powershell -Command "Copy-Item -Path '${destCamDesktop}' -Destination '${destCamServer}' -Force"`);

  console.log("🚀 Todos os pacotes das duas extensões foram gerados e sincronizados!");
} catch (e) {
  console.error("Erro no empacotamento das extensoes:", e.message);
}
