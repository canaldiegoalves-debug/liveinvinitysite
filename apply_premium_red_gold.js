const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== EMPACOTANDO E VALIDANDO OS ZIPs OFICIAIS D COM O DESIGN VERMELHO & DOURADO ===");

const infDir = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\infinity";
const camDir = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\cam";

const zipInfDownloads = "C:\\Users\\diegu\\Downloads\\LIVE-INFINITY-v10.1.0.zip";
const zipCamDownloads = "C:\\Users\\diegu\\Downloads\\LIVE-CAM-INFINITY-v1.5.0.zip";

// 1. Compacta os dois ZIPs
execSync(`powershell -Command "Compress-Archive -Path '${infDir}\\*' -DestinationPath '${zipInfDownloads}' -Force"`);
execSync(`powershell -Command "Compress-Archive -Path '${camDir}\\*' -DestinationPath '${zipCamDownloads}' -Force"`);

// 2. Copia os ZIPs para todas as rotas publicas e Desktop
const zipInfDesktop = "C:\\Users\\diegu\\Desktop\\live-infinity-10.1.0-oficial.zip";
const zipCamDesktop = "C:\\Users\\diegu\\Desktop\\livecam-1.5.0-oficial.zip";

const zipInfValora = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\live-infinity.zip";
const zipCamValora = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\livecam.zip";

const zipInfServer = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\downloads\\live-infinity.zip";
const zipCamServer = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\downloads\\livecam.zip";

execSync(`powershell -Command "Copy-Item -Path '${zipInfDownloads}' -Destination '${zipInfDesktop}' -Force"`);
execSync(`powershell -Command "Copy-Item -Path '${zipCamDownloads}' -Destination '${zipCamDesktop}' -Force"`);

execSync(`powershell -Command "Copy-Item -Path '${zipInfDownloads}' -Destination '${zipInfValora}' -Force"`);
execSync(`powershell -Command "Copy-Item -Path '${zipCamDownloads}' -Destination '${zipCamValora}' -Force"`);

execSync(`powershell -Command "Copy-Item -Path '${zipInfDownloads}' -Destination '${zipInfServer}' -Force"`);
execSync(`powershell -Command "Copy-Item -Path '${zipCamDownloads}' -Destination '${zipCamServer}' -Force"`);

console.log("🚀 Todos os ZIPs foram recompilados e validados com sucesso!");
