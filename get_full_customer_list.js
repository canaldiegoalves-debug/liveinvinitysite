const fs = require('fs');
const path = require('path');

const brainDir = "C:\\Users\\diegu\\.gemini\\antigravity\\brain";

function getFullCustomerList() {
  const emails = new Set();
  const dirs = fs.readdirSync(brainDir);
  for (const d of dirs) {
    const transcriptPath = path.join(brainDir, d, ".system_generated", "logs", "transcript.jsonl");
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      const found = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (found) {
        found.forEach(e => {
          const clean = e.toLowerCase().trim();
          // Exclui apenas e-mails de desenvolvimento interno, bancos e placeholders obvios
          if (
            !clean.includes('example.com') &&
            !clean.includes('gemini') &&
            !clean.includes('google') &&
            !clean.includes('schema') &&
            !clean.includes('cakto') &&
            !clean.includes('supabase') &&
            !clean.includes('github') &&
            !clean.includes('whatsapp') &&
            !clean.includes('g.us') &&
            !clean.includes('bravobet') &&
            !clean.includes('goldvip') &&
            !clean.includes('troprasinais') &&
            !clean.includes('helixgamingon') &&
            !clean.includes('copahelix') &&
            !clean.includes('usuario@') &&
            !clean.includes('cliente@') &&
            !clean.includes('seu@') &&
            !clean.includes('teste@') &&
            !clean.includes('test@') &&
            !clean.includes('admin@')
          ) {
            emails.add(clean);
          }
        });
      }
    }
  }

  const list = Array.from(emails).sort();
  console.log(`=== TOTAL DE CLIENTES/ASSINANTES ENCONTRADOS: ${list.length} ===\n`);
  console.log(JSON.stringify(list, null, 2));
}

getFullCustomerList();
