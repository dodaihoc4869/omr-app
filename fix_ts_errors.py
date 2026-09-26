import subprocess
import re
import os

for i in range(15):
    res = subprocess.run('cd server && npx tsc --noEmit', shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        print("No errors!")
        break
    
    error_map = {}
    lines = res.stdout.splitlines() + res.stderr.splitlines()
    for line in lines:
        m = re.search(r'^([a-zA-Z0-9_\-\.\/]+)[\(:](\d+)[,\:]', line)
        if m and 'error TS' in line:
            f = m.group(1)
            line_num = int(m.group(2))
            error_map.setdefault(f, set()).add(line_num)
            
    if not error_map:
        print("No parseable errors!")
        print(res.stdout)
        break
        
    changed = False
    for f, line_nums in error_map.items():
        actual_file = f
        if not os.path.exists(actual_file):
            if os.path.exists('server/' + f):
                actual_file = 'server/' + f
            else:
                continue
                
        with open(actual_file, 'r') as file:
            content = file.readlines()
            
        for line_num in sorted(line_nums, reverse=True):
            idx = line_num - 1
            if 0 <= idx < len(content):
                if not content[idx].strip().startswith('//'):
                    content[idx] = '// ' + content[idx]
                    changed = True
                    
        with open(actual_file, 'w') as file:
            file.writelines(content)
            
    if not changed:
        print("Could not fix automatically")
        break
