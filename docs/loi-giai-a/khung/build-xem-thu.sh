#!/bin/bash
# Trang xem thử: khung cố định + hồ sơ do máy soạn (trial/out + trial2/out)
set -e
D=$(dirname "$0"); S="$D/.."
node -e "
const fs=require('fs'),p=require('path');
const L=[];
for(const dir of ['$S/trial/out','$S/trial2/out']){ if(!fs.existsSync(dir)) continue; for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){ const h=JSON.parse(fs.readFileSync(p.join(dir,f),'utf8')); h.id=h.qid; L.push(h);} }
fs.writeFileSync('$D/p3b-ho-so.js','window.XEM_THU=true;\nconst HO_SO='+JSON.stringify(L)+';\nQUESTIONS.splice(0,QUESTIONS.length,...HO_SO);\n');
console.error('ho so:',L.length);
"
{ cat "$D/p1-head.html" | sed 's#<title>Phòng thí nghiệm Ester</title>#<title>Lời giải từng câu</title>#'; cat "$D/p2-xem-thu.html"; echo "<script>"; cat "$D/p3-data.js" "$D/p3b-ho-so.js" "$D/p4-core.js" "$D/p5-labs.js" "$D/p6-quiz.js"; echo "</script>"; } > "$D/xem-thu-loi-giai.html"
wc -c "$D/xem-thu-loi-giai.html"
