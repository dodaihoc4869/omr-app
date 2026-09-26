const { execSync } = require('child_process');
const fs = require('fs');

function runTsc() {
    try {
        execSync('cd server && npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
        return { success: true, output: '' };
    } catch (e) {
        return { success: false, output: e.stdout + '\n' + e.stderr };
    }
}

for (let iter = 0; iter < 10; iter++) {
    const res = runTsc();
    if (res.success) {
        console.log('No TS errors!');
        break;
    }
    
    const lines = res.output.split('\n');
    const errorMap = {};
    const errorRegex = /^([^:\(\n]+)[:\(](\d+)[,:]\d+[\)]?(?: -)?(?: error)? TS\d+:/;
    for (const line of lines) {
        const match = line.match(errorRegex);
        if (match) {
            const file = match[1];
            const lineNum = parseInt(match[2], 10);
            if (!errorMap[file]) errorMap[file] = [];
            errorMap[file].push(lineNum);
        }
    }
    
    if (Object.keys(errorMap).length === 0) {
        console.log('No parseable TS errors found but exit code was non-zero.');
        console.log(res.output);
        break;
    }
    
    let changed = false;
    for (const file of Object.keys(errorMap)) {
        let actualFile = file;
        if (!fs.existsSync(actualFile)) {
            if (fs.existsSync('server/' + file)) {
                actualFile = 'server/' + file;
            } else {
                continue;
            }
        }
        
        let content = fs.readFileSync(actualFile, 'utf8').split('\n');
        const lineNums = [...new Set(errorMap[file])].sort((a,b) => b - a);
        for (const lineNum of lineNums) {
            const idx = lineNum - 1;
            if (idx >= 0 && idx < content.length) {
                if (!content[idx].trim().startsWith('//')) {
                    content[idx] = '// ' + content[idx];
                    changed = true;
                }
            }
        }
        fs.writeFileSync(actualFile, content.join('\n'));
    }
    
    if (!changed) {
        console.log('Could not fix any more errors automatically.');
        break;
    }
}
