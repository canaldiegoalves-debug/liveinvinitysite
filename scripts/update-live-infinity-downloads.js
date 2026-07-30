const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 1. CONFIGURAÇÃO DE CAMINHOS AUTORIZADOS
const SOURCE_DIR = 'C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\ARQUIVOS NAVEGADORES LIVE INFINITY';
const PROJECT_ROOT = 'C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA';
const PUBLIC_DOWNLOADS = path.join(PROJECT_ROOT, 'public', 'downloads');
const TARGET_LIVE_INFINITY_DIR = path.join(PUBLIC_DOWNLOADS, 'live-infinity');
const TEMP_DIR = path.join(PROJECT_ROOT, 'tmp', 'live-infinity-update');

// 2. Mapeamento de Navegadores
const BROWSER_MAP = {
  'GOOGLE_CHROME.zip': { key: 'chrome', publicName: 'live-infinity-chrome.zip', title: 'Google Chrome' },
  'MICROSOFT_EDGE.zip': { key: 'edge', publicName: 'live-infinity-edge.zip', title: 'Microsoft Edge' },
  'OPERA.zip': { key: 'opera', publicName: 'live-infinity-opera.zip', title: 'Opera' },
  'OPERA_GX.zip': { key: 'opera-gx', publicName: 'live-infinity-opera-gx.zip', title: 'Opera GX' },
  'BRAVE.zip': { key: 'brave', publicName: 'live-infinity-brave.zip', title: 'Brave' },
  'VIVALDI.zip': { key: 'vivaldi', publicName: 'live-infinity-vivaldi.zip', title: 'Vivaldi' },
  'ARC_BROWSER.zip': { key: 'arc', publicName: 'live-infinity-arc.zip', title: 'Arc Browser' },
  'CHROMIUM.zip': { key: 'chromium', publicName: 'live-infinity-chromium.zip', title: 'Chromium' },
  'THORIUM.zip': { key: 'thorium', publicName: 'live-infinity-thorium.zip', title: 'Thorium' }
};

function getSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function runUpdate() {
  console.log('=== INICIANDO PROCESSO INTELIGENTE DE ATUALIZAÇÃO DA LIVE INFINITY ===');
  console.log(`Origem: ${SOURCE_DIR}`);
  console.log(`Destino Público: ${TARGET_LIVE_INFINITY_DIR}`);

  // Validação preliminar da pasta de origem
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Diretório de origem não existe: ${SOURCE_DIR}`);
  }

  // ETAPA 1 — INVENTÁRIO
  const files = fs.readdirSync(SOURCE_DIR);
  console.log(`\n[ETAPA 1] Inventário de arquivos (.zip): ${files.length} encontrados`);
  
  const validPackages = {};
  const pendingFiles = [];

  for (const f of files) {
    if (!f.endsWith('.zip')) continue;
    const srcFile = path.join(SOURCE_DIR, f);
    const stat = fs.statSync(srcFile);

    if (f === 'FIREFOX.zip') {
      console.log(`- ${f}: Identificado status Firefox (não comercializado/pendente).`);
      pendingFiles.push({ file: f, reason: 'Firefox não possui pacote validado para comercialização (STATUS_FIREFOX.txt)' });
      continue;
    }

    let config = BROWSER_MAP[f];
    if (!config && f === 'OPERA.zip') {
      // Opera e Opera GX utilizam o mesmo pacote validado
      config = BROWSER_MAP['OPERA.zip'];
    }

    if (!config) {
      console.log(`- ${f}: Arquivo não mapeado ou extra.`);
      continue;
    }

    // ETAPA 2 — PREPARAÇÃO TEMPORÁRIA
    const tempExtract = path.join(TEMP_DIR, 'inspect', f.replace('.zip', ''));
    if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true });
    fs.mkdirSync(tempExtract, { recursive: true });

    try {
      execSync(`powershell -Command "Expand-Archive -Path '${srcFile}' -DestinationPath '${tempExtract}' -Force"`, { stdio: 'pipe' });

      // Verificar manifest no pacote interno se houver wrapper
      let manifestPath = path.join(tempExtract, 'manifest.json');
      let targetZipToDeploy = srcFile;

      if (!fs.existsSync(manifestPath)) {
        const innerZip = path.join(tempExtract, 'LIVE_INFINITY_v11.0.4_OFFICIAL.zip');
        if (fs.existsSync(innerZip)) {
          const innerExtract = path.join(tempExtract, 'inner');
          fs.mkdirSync(innerExtract, { recursive: true });
          execSync(`powershell -Command "Expand-Archive -Path '${innerZip}' -DestinationPath '${innerExtract}' -Force"`, { stdio: 'pipe' });
          manifestPath = path.join(innerExtract, 'manifest.json');
        }
      }

      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const sha256 = getSha256(srcFile);
        
        validPackages[config.key] = {
          file: config.publicName,
          title: config.title,
          sourcePath: srcFile,
          version: manifest.version,
          manifest_version: manifest.manifest_version,
          size: stat.size,
          sha256: sha256,
          updatedAt: new Date().toISOString()
        };

        // Se for Opera, criar também entrada para Opera GX se não existir arquivo separado
        if (f === 'OPERA.zip' && !files.includes('OPERA_GX.zip')) {
          validPackages['opera-gx'] = {
            file: 'live-infinity-opera-gx.zip',
            title: 'Opera GX',
            sourcePath: srcFile,
            version: manifest.version,
            manifest_version: manifest.manifest_version,
            size: stat.size,
            sha256: sha256,
            updatedAt: new Date().toISOString()
          };
        }

        console.log(`✓ ${config.title}: Pacote v${manifest.version} validado com sucesso (SHA256: ${sha256.substring(0, 10)}...)`);
      } else {
        pendingFiles.push({ file: f, reason: 'Manifest.json não encontrado ou inválido' });
      }
    } catch (err) {
      pendingFiles.push({ file: f, reason: `Erro ao descompactar/validar: ${err.message}` });
    }
  }

  // ETAPA 3 — VALIDAÇÃO RIGOROSA ANTES DA TROCA
  const validKeys = Object.keys(validPackages);
  if (validKeys.length === 0) {
    throw new Error('Nenhum pacote válido foi encontrado para publicação. Abortando!');
  }
  console.log(`\n[ETAPA 3] Validação concluída: ${validKeys.length} pacotes prontos para publicação.`);

  // ETAPA 4 — REMOÇÃO DA VERSÃO ANTERIOR (SEGURANÇA ESTRITA)
  console.log('\n[ETAPA 4] Limpeza e remoção segura das versões anteriores da Live Infinity...');
  
  // Garantir diretório público exclusivo
  if (!fs.existsSync(TARGET_LIVE_INFINITY_DIR)) {
    fs.mkdirSync(TARGET_LIVE_INFINITY_DIR, { recursive: true });
  }

  // Verificação estrita do caminho antes de qualquer exclusão
  const resolvedTarget = path.resolve(TARGET_LIVE_INFINITY_DIR);
  if (!resolvedTarget.includes('live-infinity') || !resolvedTarget.includes('public')) {
    throw new Error(`Caminho de destino não seguro para exclusão: ${resolvedTarget}`);
  }

  // Excluir arquivos antigos da Live Infinity no diretório /live-infinity/
  const existingFiles = fs.readdirSync(TARGET_LIVE_INFINITY_DIR);
  for (const ef of existingFiles) {
    const efPath = path.join(TARGET_LIVE_INFINITY_DIR, ef);
    // NUNCA apagar nada que contenha livecam
    if (ef.toLowerCase().includes('livecam')) continue;
    fs.rmSync(efPath, { recursive: true, force: true });
    console.log(`  - Excluído arquivo público antigo: ${ef}`);
  }

  // Excluir ZIP antigo solto em /public/downloads/live-infinity.zip e live-infinity-firefox.zip
  const legacyZip = path.join(PUBLIC_DOWNLOADS, 'live-infinity.zip');
  if (fs.existsSync(legacyZip)) {
    fs.unlinkSync(legacyZip);
    console.log('  - Excluído arquivo legado em /public/downloads/live-infinity.zip');
  }

  const legacyFirefoxZip = path.join(PUBLIC_DOWNLOADS, 'live-infinity-firefox.zip');
  if (fs.existsSync(legacyFirefoxZip)) {
    fs.unlinkSync(legacyFirefoxZip);
    console.log('  - Excluído arquivo legado em /public/downloads/live-infinity-firefox.zip');
  }

  // ETAPA 5 — PUBLICAÇÃO ATÔMICA E METADADOS
  console.log('\n[ETAPA 5] Publicação atômica dos novos arquivos e metadados...');
  const metadata = {
    version: validPackages.chrome ? validPackages.chrome.version : validPackages[validKeys[0]].version,
    updatedAt: new Date().toISOString(),
    browsers: validPackages,
    pending: pendingFiles
  };

  for (const key of Object.keys(validPackages)) {
    const pkg = validPackages[key];
    const tempTarget = path.join(TARGET_LIVE_INFINITY_DIR, `${pkg.file}.tmp`);
    const finalTarget = path.join(TARGET_LIVE_INFINITY_DIR, pkg.file);

    // Copiar para .tmp primeiro
    fs.copyFileSync(pkg.sourcePath, tempTarget);
    // Validar hash do .tmp
    const tmpHash = getSha256(tempTarget);
    if (tmpHash !== pkg.sha256) {
      throw new Error(`Falha na validação do upload atômico para ${pkg.file}`);
    }
    // Renomear atomicamente para nome final
    fs.renameSync(tempTarget, finalTarget);
    console.log(`  ✓ Publicado: ${pkg.file} (${pkg.size} bytes)`);
  }

  // Criar arquivo metadata.json
  const metadataPath = path.join(TARGET_LIVE_INFINITY_DIR, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log('  ✓ Metadados atualizados em metadata.json');

  // Criar alias legado para /downloads/live-infinity.zip (copia do chrome) para compatibilidade sem erros 404
  if (validPackages.chrome) {
    fs.copyFileSync(validPackages.chrome.sourcePath, legacyZip);
    console.log('  ✓ Fallback de compatibilidade gerado em /public/downloads/live-infinity.zip');
  }

  // ETAPA 6 — LIMPEZA FINAL
  console.log('\n[ETAPA 6] Limpeza final de arquivos temporários...');
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n=== PROCESSO DE ATUALIZAÇÃO CONCLUÍDO COM SUCESSO ===');
  return metadata;
}

if (require.main === module) {
  try {
    runUpdate();
  } catch (err) {
    console.error('ERRO NO PROCESSO DE ATUALIZAÇÃO:', err.message);
    process.exit(1);
  }
}

module.exports = { runUpdate };
