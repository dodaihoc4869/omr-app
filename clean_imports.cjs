const fs = require('fs');
let content = fs.readFileSync('server/src/index.ts', 'utf8');
const lines = content.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
        const p = match[1];
        if (p.startsWith('.')) {
            const p1 = 'server/src/' + p.replace('./', '') + '.ts';
            const p2 = 'server/src/' + p.replace('./', '') + '/index.ts';
            if (!fs.existsSync(p1) && !fs.existsSync(p2) && !p.includes('../../')) {
                console.log('Removing import:', lines[i]);
                continue;
            }
        }
    }
    newLines.push(lines[i]);
}
fs.writeFileSync('server/src/index.ts', newLines.join('\n'));
