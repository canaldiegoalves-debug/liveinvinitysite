const fs = require('fs');

console.log("Checking dev.db in VALORA...");
if (fs.existsSync('./dev.db')) {
  const stat = fs.statSync('./dev.db');
  console.log("dev.db tamanho:", stat.size, "bytes");
} else {
  console.log("dev.db não existe em VALORA");
}
