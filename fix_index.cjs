const fs = require('fs');
let code = fs.readFileSync('server/src/index.ts', 'utf8');
code = code.replace(/if \(p\.startsWith\('\/mom\/'\)\) \{[\s\S]*?throw e\n\s*\}\n\s*\}/g, '// mom');
fs.writeFileSync('server/src/index.ts', code);
