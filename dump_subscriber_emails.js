const fs = require('fs');
const path = require('path');

const brainDir = "C:\\Users\\diegu\\.gemini\\antigravity\\brain";

function dumpEmails() {
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
          if (!clean.includes('example.com') && !clean.includes('gemini') && !clean.includes('google') && !clean.includes('schema') && !clean.includes('cakto')) {
            emails.add(clean);
          }
        });
      }
    }
  }

  console.log("=== E-MAILS DE ASSINANTES REGISTRADOS NOS CAPTURADORES DE WEBHOOKS ===");
  const list = Array.from(emails);
  console.log(JSON.stringify(list, null, 2));
}

dumpEmails();
