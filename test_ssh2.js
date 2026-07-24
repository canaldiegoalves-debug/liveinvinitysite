const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();

const serverFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js";
const appFile = "C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js";

const serverContent = fs.readFileSync(serverFile);
const appContent = fs.readFileSync(appFile);

console.log("=== CONECTANDO VIA SSH2 DIRETO NA VPS ===");

conn.on('ready', () => {
  console.log('✅ Conexão SSH2 estabelecida com a VPS!');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    console.log('1. Uploading server.js...');
    sftp.writeFile('/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js', serverContent, err => {
      if (err) throw err;
      console.log('✅ server.js atualizado na VPS!');

      console.log('2. Uploading public/app.js...');
      sftp.writeFile('/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js', appContent, err => {
        if (err) throw err;
        console.log('✅ public/app.js atualizado na VPS!');

        console.log('3. Reiniciando PM2...');
        conn.exec('pm2 restart liveinfinity --update-env', (err, stream) => {
          if (err) throw err;
          stream.on('close', () => {
            console.log('🚀 PM2 REINICIADO COM SUCESSO! DEPLOY 100% FINALIZADO!');
            conn.end();
          }).stdout.on('data', data => console.log('PM2:', data.toString()));
        });
      });
    });
  });
});

conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  finish(['Diego14032010Diego14032010']);
});

conn.on('error', err => {
  console.error("SSH Error:", err.message);
});

conn.connect({
  host: '179.197.74.225',
  port: 22,
  username: 'root',
  password: 'Diego14032010Diego14032010',
  tryKeyboard: true
});
