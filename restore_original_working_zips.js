const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== RESTAURANDO AS VERSÕES ORIGINAIS 100% FUNCIONAIS (REVERTENDO MUDANÇAS DE LAYOUT) ===");

const infinityContentJs = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\infinity\\content.js";
const camInjectorJs = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\cam\\injector.js";

// 1. Restaura Live Infinity content.js
let infJs = fs.readFileSync(infinityContentJs, 'utf8');

infJs = infJs.replace(
  "background:rgba(10,12,18,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:#fff;border:1px solid rgba(255,215,0,0.4);border-radius:20px;font-family:\"Plus Jakarta Sans\",system-ui,sans-serif;font-size:13px;box-shadow:0 20px 60px rgba(0,0,0,0.95), 0 0 30px rgba(229,9,20,0.25);width:325px;max-height:85vh;overflow-y:auto;overflow-x:hidden",
  "background:#070a12;color:#fff;border:1px solid rgba(255,208,0,.35);border-radius:18px;font-family:sans-serif;font-size:13px;box-shadow:0 18px 50px rgba(0,0,0,.9);width:320px;max-height:84vh;overflow-y:auto;overflow-x:hidden"
);

infJs = infJs.replace(
  "background:rgba(18,20,29,0.95);backdrop-filter:blur(12px);border-radius:20px 20px 0 0;border-bottom:1px solid rgba(255,215,0,0.3)",
  "background:#0d111d;border-radius:18px 18px 0 0;border-bottom:1px solid rgba(255,208,0,0.2)"
);

infJs = infJs.replace(
  "background:linear-gradient(135deg,#ffd700,#ffa500);color:#000;font-weight:900;cursor:pointer;box-shadow:0 4px 15px rgba(255,215,0,0.4)",
  "background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;font-weight:900;cursor:pointer"
);

infJs = infJs.replace(
  "background:linear-gradient(135deg,#e50914,#ff4b2b);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 4px 15px rgba(229,9,20,0.4)",
  "background:linear-gradient(135deg,#ff1717,#e10000);color:#fff;font-weight:900;cursor:pointer"
);

fs.writeFileSync(infinityContentJs, infJs, 'utf8');
console.log("✅ Live Infinity content.js restaurado para a versão original!");

// 2. Restaura LiveCam injector.js
let camJs = fs.readFileSync(camInjectorJs, 'utf8');

camJs = camJs.replace(
  "background: rgba(10, 12, 18, 0.94);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      color: #fff;\n      border: 1px solid rgba(255, 215, 0, 0.4);\n      border-radius: 20px;\n      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 30px rgba(229,9,20,0.25);",
  "background: #070a12;\n      color: #fff;\n      border: 1px solid rgba(255, 208, 0, 0.35);\n      border-radius: 20px;\n      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.95);"
);

camJs = camJs.replace(
  "background:rgba(18,20,29,0.95);backdrop-filter:blur(12px);cursor:move;border-bottom:1px solid rgba(255,215,0,0.3)",
  "background:#0d111d;cursor:move;border-bottom:1px solid rgba(255,208,0,0.2)"
);

camJs = camJs.replace(
  "background:linear-gradient(135deg,#ffd700,#ffa500);color:#000;font-weight:900;cursor:pointer;font-size:14px;box-shadow:0 4px 15px rgba(255,215,0,0.4);",
  "background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;font-weight:900;cursor:pointer;font-size:14px;"
);

fs.writeFileSync(camInjectorJs, camJs, 'utf8');
console.log("✅ LiveCam injector.js restaurado para a versão original!");

// 3. Compacta os dois ZIPs com as versoes originais limpas
const infDir = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\infinity";
const camDir = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\user_official_zips\\cam";

const zipInfDownloads = "C:\\Users\\diegu\\Downloads\\LIVE-INFINITY-v10.1.0.zip";
const zipCamDownloads = "C:\\Users\\diegu\\Downloads\\LIVE-CAM-INFINITY-v1.5.0.zip";

execSync(`powershell -Command "Compress-Archive -Path '${infDir}\\*' -DestinationPath '${zipInfDownloads}' -Force"`);
execSync(`powershell -Command "Compress-Archive -Path '${camDir}\\*' -DestinationPath '${zipCamDownloads}' -Force"`);

// 4. Copia os ZIPs para todas as rotas publicas e Desktop
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

console.log("🚀 Restauração concluída! Os pacotes voltaram 100% para a versão funcional original!");
