const fs = require('fs');
const path = require('path');

const brainDir = "C:\\Users\\diegu\\.gemini\\antigravity\\brain";

function scanTranscripts() {
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
          if (obj.type === 'USER_INPUT') {
            const txt = JSON.stringify(obj.content || '');
            if (txt.includes('10.1') || txt.includes('1.5') || txt.includes('livego') || txt.includes('vidcam')) {
              console.log(`[${d}] USER:`, obj.content);
            }
          }
        } catch (e) {}
      }
    }
  }
}

scanTranscripts();
