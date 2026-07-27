const { Client } = require('ssh2');
const fs = require('fs');

console.log("=== EXECUTING DIRECT SSH2 VPS OVERWRITE DEPLOYMENT ===");

const zipLocalPath = 'C:/Users/diegu/OneDrive/Área de Trabalho/VALORA/public/downloads/livecam.zip';
const zipInfLocalPath = 'C:/Users/diegu/OneDrive/Área de Trabalho/VALORA/public/downloads/live-infinity.zip';

if (!fs.existsSync(zipLocalPath)) {
  console.error("❌ Zip file not found at:", zipLocalPath);
  process.exit(1);
}

const stats = fs.statSync(zipLocalPath);
console.log(`Local livecam.zip size: ${stats.size} bytes`);

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH2 Connected to VPS 179.197.74.225!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    console.log('1. Uploading livecam.zip to /var/www/valoranegocios/public/downloads/livecam.zip...');
    sftp.fastPut(zipLocalPath, '/var/www/valoranegocios/public/downloads/livecam.zip', (err1) => {
      if (err1) console.error('fastPut 1 error:', err1);
      else console.log('✅ livecam.zip uploaded to /var/www/valoranegocios!');

      console.log('2. Uploading live-infinity.zip to /var/www/valoranegocios/public/downloads/live-infinity.zip...');
      sftp.fastPut(zipInfLocalPath, '/var/www/valoranegocios/public/downloads/live-infinity.zip', (err2) => {
        if (err2) console.error('fastPut 2 error:', err2);
        else console.log('✅ live-infinity.zip uploaded to /var/www/valoranegocios!');

        console.log('3. Uploading livecam.zip to /var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/downloads/livecam.zip...');
        sftp.fastPut(zipLocalPath, '/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/public/downloads/livecam.zip', (err3) => {
          if (err3) console.error('fastPut 3 error:', err3);
          else console.log('✅ livecam.zip uploaded to /var/www/liveinfinity!');

          console.log('4. Executing remote build, wiping cache & PM2 restart...');
          conn.exec('cd /var/www/valoranegocios && rm -rf .next && (npm run build || true) && pm2 restart all', (err4, stream) => {
            if (err4) console.error('exec error:', err4);
            else {
              stream.on('close', (code) => {
                console.log(`✅ Remote commands finished with exit code ${code}!`);
                conn.end();
              }).on('data', (data) => {
                console.log('SSH stdout: ' + data);
              }).stderr.on('data', (data) => {
                console.log('SSH stderr: ' + data);
              });
            }
          });
        });
      });
    });
  });
}).connect({
  host: '179.197.74.225',
  port: 22,
  username: 'root',
  password: 'Diego14032010Diego14032010'
});
