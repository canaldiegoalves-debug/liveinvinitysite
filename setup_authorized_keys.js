const fs = require('fs');
const { spawn } = require('child_process');

const pubKey = fs.readFileSync('C:\\Users\\diegu\\.ssh\\id_rsa.pub', 'utf8').trim();
const password = "Diego14032010Diego14032010";

console.log("=== ADICIONANDO CHAVE SSH NA VPS PARA CONEXAO AUTOMATICA ===");

const cmd = `mkdir -p ~/.ssh && echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh`;

const child = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@179.197.74.225', cmd], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => console.log('STDOUT:', d.toString()));
child.stderr.on('data', d => {
  const err = d.toString();
  console.log('STDERR:', err);
  if (err.includes('password:')) {
    console.log('Enviando senha...');
    child.stdin.write(password + '\n');
  }
});

child.on('close', code => {
  console.log(`Processo finalizado com codigo ${code}`);
});
