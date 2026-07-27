const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const zipPath = "C:\\Users\\diegu\\OneDrive\\Área de Trabalho\\VALORA\\public\\downloads\\livecam.zip";

console.log("=== ENVIANDO LIVECAM.ZIP PARA A VPS VIA SFTP ===");

if (!fs.existsSync(zipPath)) {
  console.error("Arquivo zip não encontrado:", zipPath);
  process.exit(1);
}

const zipBuffer = fs.readFileSync(zipPath);

conn.on('ready', () => {
  console.log('✅ SSH CONNECTED TO VPS!');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('Erro SFTP:', err);
      conn.end();
      return;
    }
    
    console.log('✅ SFTP pronto. Enviando livecam.zip...');
    
    sftp.writeFile('/var/www/valoranegocios/public/downloads/livecam.zip', zipBuffer, (err1) => {
      if (err1) {
        console.error('Erro valoranegocios:', err1.message);
      } else {
        console.log('✅ /var/www/valoranegocios/public/downloads/livecam.zip ATUALIZADO!');
      }

      sftp.writeFile('/var/www/html/downloads/livecam.zip', zipBuffer, (err2) => {
        if (err2) {
          console.log('Fallback html downloads:', err2.message);
        } else {
          console.log('✅ /var/www/html/downloads/livecam.zip ATUALIZADO!');
        }

        conn.exec('nginx -t && systemctl reload nginx', (err3, stream) => {
          if (!err3 && stream) {
            stream.on('close', () => {
              console.log('🚀 DEPLOY NA VPS E RELOAD DO NGINX CONCLUÍDOS COM SUCESSO!');
              conn.end();
            });
          } else {
            console.log('🚀 DEPLOY NA VPS CONCLUÍDO!');
            conn.end();
          }
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Error:', err.message);
});

// Tenta com password primeiro, e se falhar tenta com privateKey + passphrase
try {
  conn.connect({
    host: '179.197.74.225',
    port: 22,
    username: 'root',
    password: 'Diego14032010Diego14032010',
    privateKey: fs.readFileSync('C:\\Users\\diegu\\.ssh\\id_rsa'),
    passphrase: 'Diego14032010Diego14032010'
  });
} catch (e) {
  conn.connect({
    host: '179.197.74.225',
    port: 22,
    username: 'root',
    password: 'Diego14032010Diego14032010'
  });
}
