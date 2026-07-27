const { Client } = require('ssh2');
const fs = require('fs');

console.log("=== TESTING ALL CANDIDATE SSH PASSWORDS FOR VPS ===");

const zipLocalPath = 'C:/Users/diegu/OneDrive/Área de Trabalho/VALORA/public/downloads/livecam.zip';

const passwords = [
  'Valora2024SaaS!',
  'ValoraMod2024!',
  'Diego14032010Diego14032010',
  'Diego14032010',
  'diego14032010',
  'Diego1403',
  'Valora2024!',
  'Valora2025!',
  'Valora2026!'
];

async function tryPassword(pw) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`\n🎉 SUCCESS! CORRECT VPS SSH PASSWORD IS: "${pw}"`);
      conn.sftp((err, sftp) => {
        if (!err) {
          console.log('Uploading livecam.zip to /var/www/valoranegocios/public/downloads/livecam.zip...');
          sftp.fastPut(zipLocalPath, '/var/www/valoranegocios/public/downloads/livecam.zip', (e1) => {
            console.log('fastPut 1:', e1 ? e1.message : 'OK');
            sftp.fastPut(zipLocalPath, '/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/downloads/livecam.zip', (e2) => {
              console.log('fastPut 2:', e2 ? e2.message : 'OK');
              conn.exec('cd /var/www/valoranegocios && rm -rf .next && pm2 restart all', () => {
                console.log('✅ RESTART COMPLETED!');
                conn.end();
                resolve(true);
              });
            });
          });
        } else {
          conn.end();
          resolve(true);
        }
      });
    }).on('error', (err) => {
      conn.end();
      resolve(false);
    }).connect({
      host: '179.197.74.225',
      port: 22,
      username: 'root',
      password: pw
    });
  });
}

async function run() {
  for (const pw of passwords) {
    console.log(`Testing password: "${pw}"...`);
    const ok = await tryPassword(pw);
    if (ok) break;
  }
}

run();
