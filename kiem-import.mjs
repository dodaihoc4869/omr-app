import { readFileSync, readdirSync } from 'node:fs';
const dir = process.env.KHO;
const { parseKhoDeJsonText, buildTeacherSourceFromKhoDe } = await import('./src/lib/exam-kho-de-import.ts');
let tongCau=0, tongLoi=0, tongCanh=0, tongCanXem=0, tongParseLoi=0;
for (const f of readdirSync(dir).filter(x=>x.endsWith('.json')).sort()) {
  const p = parseKhoDeJsonText(readFileSync(`${dir}/${f}`, 'utf8'));
  if (!p.ok) { console.log(`${f.padEnd(22)} PARSE LOI:`, p.errors.slice(0,3)); tongParseLoi++; continue; }
  const r = buildTeacherSourceFromKhoDe(p.json);
  const nCau = (r.source?.parts||[]).reduce((s,x)=>s+(x.questions?.length||0),0)
    || ((r.source?.phanI?.length||0)+(r.source?.phanII?.length||0)+(r.source?.phanIII?.length||0));
  tongCau += nCau; tongLoi += r.errors.length; tongCanh += r.warnings.length;
  tongCanXem += (r.canXemList||[]).length;
  console.log(`${f.padEnd(22)} cau=${String(nCau).padStart(4)}  loi=${r.errors.length}  canh_bao=${r.warnings.length}  can_xem=${(r.canXemList||[]).length}`);
  if (r.errors.length) console.log('   LOI:', r.errors.slice(0,3));
}
console.log('-'.repeat(62));
console.log(`TONG: ${tongCau} cau | ${tongParseLoi} de loi parse | ${tongLoi} loi | ${tongCanh} canh bao | ${tongCanXem} can xem`);
