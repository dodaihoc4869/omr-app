import re
import os

with open('server/src/index.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_import = False
for line in lines:
    if line.startswith('import ') and not line.strip().endswith('}') and '{' in line:
        # Multi-line import
        if 'btvn' in line or 'game' in line or 'parent' in line or 'gv' in line or 'su-kien' in line or 'ho-so' in line or 'nang-luc' in line or 'nhac-tu-dong' in line or 'exp' in line or 'thi-dua' in line or 'thu-thach' in line or 'mom' in line or 'ph-' in line or 'canh-bao' in line or 'on-lai' in line:
            skip_import = True
            continue
    if skip_import:
        if '}' in line:
            skip_import = False
        continue
    
    if line.startswith('import '):
        if any(x in line for x in ['btvn', 'game', 'parent', 'gv-', 'su-kien', 'ho-so', 'nang-luc', 'nhac-tu-dong', 'exp-', 'thi-dua', 'thu-thach', 'mom', 'ph-', 'canh-bao', 'on-lai']):
            continue
            
    new_lines.append(line)

code = "".join(new_lines)
code = re.sub(r'if \(p === \'[^\']+\'\) return [^\n]+(?:btvn|game|parent|gv|su-kien|ho-so|nang-luc|nhac-tu-dong|exp|thi-dua|thu-thach|mom|ph-|canh-bao|on-lai|VD)[^\n]+\n', '', code)

with open('server/src/index.ts', 'w') as f:
    f.write(code)
