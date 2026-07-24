const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH CONNECTED TO VPS VIA ID_RSA KEY!');
  
  const serverJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\server.js');
  const appJs = fs.readFileSync('C:\\Users\\diegu\\.gemini\\antigravity\\scratch\\branding_source\\LIVE-INFINITY-v2-mysql\\license-server\\public\\app.js');

  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('✅ SFTP READY! Uploading server.js and app.js...');

    sftp.writeFile('/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js', serverJs, (err1) => {
      if (err1) console.error('Error server.js:', err1);
      else console.log('✅ server.js enviado com SUCESSO (100% original)!');

      sftp.writeFile('/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/app.js', appJs, (err2) => {
        if (err2) console.error('Error app.js:', err2);
        else console.log('✅ app.js enviado com SUCESSO (100% original)!');

        conn.exec('pm2 restart liveinfinity --update-env', (err3, stream) => {
          if (err3) console.error('PM2 error:', err3);
          stream.on('close', () => {
            console.log('✅ PM2 RESTARTED! RESTAURAÇÃO TOTAL COMPLETA!');
            conn.end();
          }).stdout.on('data', data => console.log('PM2 Out: ' + data));
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Error:', err.message);
}).connect({
  host: '179.197.74.225',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\diegu\\.ssh\\id_rsa')
});
