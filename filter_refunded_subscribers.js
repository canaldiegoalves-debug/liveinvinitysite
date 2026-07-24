const fs = require('fs');
const path = require('path');

const brainDir = "C:\\Users\\diegu\\.gemini\\antigravity\\brain";

function filterSubscribers() {
  const activeEmails = new Set();
  const refundedEmails = new Set();

  const dirs = fs.readdirSync(brainDir);
  for (const d of dirs) {
    const transcriptPath = path.join(brainDir, d, ".system_generated", "logs", "transcript.jsonl");
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      const lines = content.split('\n');
      for (const l of lines) {
        if (!l.trim()) continue;
        try {
          const obj = JSON.parse(l);
          const str = JSON.stringify(obj).toLowerCase();
          
          // Detecta cancelamento / reembolso
          if (str.includes('refund') || str.includes('reembolso') || str.includes('chargeback') || str.includes('canceled') || str.includes('cancelado')) {
            const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (matches) {
              matches.forEach(e => {
                const clean = e.toLowerCase().trim();
                if (!clean.includes('example') && !clean.includes('valora') && !clean.includes('admin') && !clean.includes('cakto')) {
                  refundedEmails.add(clean);
                }
              });
            }
          }

          // Detecta compra aprovada / paga
          if (str.includes('paid') || str.includes('approved') || str.includes('subscription_created') || str.includes('purchase_approved')) {
            const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (matches) {
              matches.forEach(e => {
                const clean = e.toLowerCase().trim();
                if (!clean.includes('example') && !clean.includes('valora') && !clean.includes('admin') && !clean.includes('cakto') && !clean.includes('bravobet') && !clean.includes('goldvip') && !clean.includes('tropasinais') && !clean.includes('schema') && !clean.includes('app.supabase') && !clean.includes('s.whatsapp.net') && !clean.includes('g.us')) {
                  activeEmails.add(clean);
                }
              });
            }
          }
        } catch (e) {}
      }
    }
  }

  console.log("=== E-MAILS CANCELADOS / REEMBOLSADOS ENCONTRADOS ===");
  console.log(Array.from(refundedEmails));

  // Filtra removendo os cancelados
  const finalActiveList = Array.from(activeEmails).filter(e => !refundedEmails.has(e));

  console.log(`\n=== TOTAL FINAL DE ASSINANTES ATIVOS (SEM CANCELADOS): ${finalActiveList.length} ===\n`);
  console.log(JSON.stringify(finalActiveList, null, 2));
}

filterSubscribers();
