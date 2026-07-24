const fs = require('fs');
const path = require('path');

const transcriptPath = "C:\\Users\\diegu\\.gemini\\antigravity\\brain\\3890a05d-1f7c-42a4-91bf-1fe08ef469cd\\.system_generated\\logs\\transcript.jsonl";

if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n');
  for (const l of lines) {
    if (!l.trim()) continue;
    try {
      const obj = JSON.parse(l);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'run_command') {
            console.log(`[Step ${obj.step_index}] ${tc.name}:`, JSON.stringify(tc.args).substring(0, 150));
          }
        }
      }
    } catch (e) {}
  }
}
