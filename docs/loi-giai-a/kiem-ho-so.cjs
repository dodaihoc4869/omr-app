// Bộ kiểm hồ sơ lời giải (khuôn v1.1). Chạy: node kiem-ho-so.cjs <thư-mục-ra> <thư-mục-vào>
// Ví dụ: node docs/loi-giai-a/kiem-ho-so.cjs docs/loi-giai-a/chay-thu-1/ra docs/loi-giai-a/chay-thu-1/vao
// Khoá 3 (đáp án), khoá 4 (con số), khuôn, an toàn nội dung, giọng văn.
const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = process.argv[2] || path.join(DIR, 'out');
const CTX = JSON.parse(fs.readFileSync(path.join(DIR, 'bo-chia-khoa-ester.json'), 'utf8'));
const KEYS = Object.keys(CTX.KEYS), TRAPS = Object.keys(CTX.TRAPS), ICONS = CTX.ICONS;
const PRESET = Object.fromEntries(Object.entries(CTX.LAB_PRESETS).map(([k, a]) => [k, a.map(s => s.split(' ')[0])]));
const HTML_OK = new Set(['b', 'i', 'sub', 'sup', 'br']);

function evalExpr(e) {
  if (!/^[0-9.+\-*/() \t]+$/.test(e)) throw new Error('biểu thức có kí tự lạ: ' + e);
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return (' + e + ')')();
}
function checkCalc(list, where, errs) {
  if (!Array.isArray(list)) { errs.push(`${where}: phepTinh không phải mảng`); return 0; }
  let n = 0;
  for (const p of list) {
    n++;
    try {
      const v = evalExpr(String(p.bieuThuc)), d = Number(p.lamTron ?? 2), tol = 0.5 * Math.pow(10, -d) + 1e-9;
      if (typeof p.ketQua !== 'number') errs.push(`${where}: "${p.ten}" ketQua không phải số`);
      else if (Math.abs(v - p.ketQua) > tol) errs.push(`${where}: "${p.ten}" máy tính ${v.toFixed(d + 2)} ≠ ghi ${p.ketQua}`);
    } catch (e) { errs.push(`${where}: "${p.ten}" ${e.message}`); }
  }
  return n;
}
function textFields(h) {
  const out = [h.ten, h.nho, h.ket];
  (h.dung || []).forEach(s => { out.push(s.t, s.p); (s.io || []).forEach(x => out.push(x[1])); });
  (h.y || []).forEach(y => { out.push(y.soi, y.giai, ...(y.g || [])); });
  (h.tuongTu || []).forEach(t => out.push(t.t, t.giai));
  if (h.tl) out.push(h.tl.soi, h.tl.giai, ...(h.tl.g || []));
  (h.canThayChot || []).forEach(t => out.push(t));
  return out.filter(x => typeof x === 'string');
}
function kiem(inp, h) {
  const errs = [], warn = [];
  const req = ['qid', 'so', 'dang', 'de', 'ten', 'keys', 'dung', 'y', 'ket', 'nho', 'phepTinh', 'tuongTu', 'canThayChot'];
  req.forEach(k => { if (h[k] === undefined) errs.push('thiếu trường ' + k); });
  if (errs.length) return { errs, warn };
  if (h.qid !== inp.qid) errs.push('qid bị đổi');
  if (h.de !== inp.de) errs.push('đề bị sửa (phải chép nguyên)');
  if (inp.dang === 'tn' && !/^Đáp án [A-D]$/.test((h.ket || '').trim())) errs.push('tn: ket phải là "Đáp án X"');
  if (h.ten.length > 70) warn.push(`ten dài ${h.ten.length} > 70`);
  if (h.nho.length > 120) warn.push(`nho dài ${h.nho.length} > 120`);
  h.keys.forEach(k => { if (!KEYS.includes(k)) errs.push('chìa khoá lạ ' + k); });
  if (h.dung.length < 2 || h.dung.length > 5) errs.push(`dung có ${h.dung.length} bước (cần 2–5)`);
  h.dung.forEach((s, i) => { if (!ICONS.includes(s.ic)) errs.push(`dung[${i}] biểu tượng lạ ${s.ic}`); if ((s.t || '').length > 40) warn.push(`dung[${i}] tiêu đề dài`); if (!Array.isArray(s.io)) errs.push(`dung[${i}] io không phải mảng`); });
  // dạng trả lời ngắn
  if (inp.dang === 'tln') {
    const tl = h.tl || {};
    if (h.y.length) errs.push('tln: y phải rỗng');
    if (String(tl.dapAn) !== String(inp.dapAn.kq)) errs.push(`KHOÁ ĐÁP ÁN: đáp số ${tl.dapAn} ≠ ${inp.dapAn.kq}`);
    if (!Array.isArray(tl.g) || tl.g.length !== 3) errs.push('tln: cần đúng 3 gợi ý');
    if (!/^Đáp số/.test((tl.giai || '').trim())) errs.push('tln: lời giải phải mở đầu "Đáp số"');
    if (!KEYS.includes(tl.k)) errs.push('tln: chìa khoá lạ ' + tl.k);
    if (tl.bay != null && !TRAPS.includes(tl.bay)) errs.push('tln: bẫy lạ ' + tl.bay);
    const last = (h.phepTinh || []).filter(p => p.laDapSo).pop();
    if (!last) errs.push('tln: thiếu phép tính laDapSo');
    else if (Math.abs(Number(String(inp.dapAn.kq).replace(',', '.')) - last.ketQua) > 1e-9) errs.push(`KHOÁ SỐ: phép tính cuối ra ${last.ketQua} ≠ đáp số ${inp.dapAn.kq}`);
  }
  // khoá 3: đáp án + ý nguyên văn
  if (h.y.length !== inp.y.length) errs.push('số ý khác đầu vào');
  h.y.forEach((y, i) => {
    const iy = inp.y[i] || {};
    if (y.id !== iy.id || y.t !== iy.t) errs.push(`ý ${y.id}: id/nội dung bị sửa`);
    if (y.d !== inp.dapAn[y.id]) errs.push(`KHOÁ ĐÁP ÁN: ý ${y.id} ghi ${y.d}, đáp án chính thức ${inp.dapAn[y.id]}`);
    if (!KEYS.includes(y.k)) errs.push(`ý ${y.id}: chìa khoá lạ ${y.k}`);
    if (y.bay !== null && !TRAPS.includes(y.bay)) errs.push(`ý ${y.id}: bẫy lạ ${y.bay}`);
    if (y.d === 'D' && y.bay && inp.dang !== 'tn') warn.push(`ý ${y.id}: ý ĐÚNG mà có bẫy ${y.bay}`);
    if (y.d === 'S' && !y.bay && inp.dang !== 'tn') warn.push(`ý ${y.id}: ý SAI mà không gắn bẫy`);
    const tn = inp.dang === 'tn', nG = (y.g || []).length;
    if (!Array.isArray(y.g) || (tn ? (y.d === 'D' ? nG !== 3 : nG < 1 || nG > 3) : nG !== 3)) errs.push(`ý ${y.id}: số gợi ý sai (${nG})`);
    else if (!/^Chìa khoá/.test(y.g[0])) warn.push(`ý ${y.id}: gợi ý 1 không mở đầu bằng "Chìa khoá"`);
    const mo = (y.giai || '').trim().split(/[.\s]/)[0], can = tn ? (y.d === 'D' ? 'Chọn' : 'Loại') : (y.d === 'D' ? 'Đúng' : 'Sai');
    if (mo !== can) errs.push(`ý ${y.id}: lời giải mở đầu "${mo}", cần "${can}"`);
    if (y.lab !== null) { if (!Array.isArray(y.lab) || !PRESET[y.lab[0]] || !PRESET[y.lab[0]].includes(y.lab[1])) errs.push(`ý ${y.id}: phòng thí nghiệm lạ ${JSON.stringify(y.lab)}`); }
  });
  if (inp.mc) { if (!h.mc || h.mc.d !== inp.mc.dapAn) errs.push(`KHOÁ ĐÁP ÁN: lựa chọn chốt ${h.mc && h.mc.d} ≠ ${inp.mc.dapAn}`); }
  if (inp.dang === 'ds') {
    const exp = h.y.map(y => `${y.id} ${y.d === 'D' ? 'Đ' : 'S'}`).join(' – '), norm = s => s.replace(/\s+/g, ' ').replace(/[-—]/g, '–').trim();
    if (norm(h.ket) !== norm(exp)) errs.push(`ket "${h.ket}" ≠ "${exp}"`);
  }
  // khoá 4: con số
  const nCalc = checkCalc(h.phepTinh, 'phepTinh', errs);
  if (!Array.isArray(h.tuongTu) || h.tuongTu.length < 1 || h.tuongTu.length > 2) errs.push('tuongTu cần 1–2 ý');
  else h.tuongTu.forEach((t, i) => { if (!['D', 'S'].includes(t.d)) errs.push(`tuongTu[${i}] d lạ`); checkCalc(t.phepTinh || [], `tuongTu[${i}]`, errs); const mo = (t.giai || '').trim().split(/[.\s]/)[0]; if ((t.d === 'D' && mo !== 'Đúng') || (t.d === 'S' && mo !== 'Sai')) warn.push(`tuongTu[${i}] lời giải mở đầu "${mo}" không khớp ${t.d}`); });
  const hasDigitCalc = h.y.some(y => /=\s*\d/.test(y.giai + (y.g || []).join(' '))) || (h.tl && /=\s*\d/.test(h.tl.giai || ''));
  if (hasDigitCalc && nCalc === 0) errs.push('lời giải có phép tính nhưng phepTinh rỗng');
  // an toàn nội dung + giọng văn
  textFields(h).forEach(s => {
    for (const m of s.matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) { if (!HTML_OK.has(m[1].toLowerCase())) errs.push(`thẻ HTML cấm <${m[1]}>`); if (/on\w+\s*=|javascript:|style\s*=/i.test(m[2])) errs.push('thuộc tính HTML cấm'); }
    let depth = 0; for (const c of s) { if (c === '{') depth++; if (c === '}') depth--; if (depth < 0 || depth > 1) { errs.push('ngoặc nhọn công thức lệch: ' + s.slice(0, 40)); break; } } if (depth) errs.push('ngoặc nhọn công thức lệch: ' + s.slice(0, 40));
    if (/(^|[^\p{L}])AI([^\p{L}]|$)/u.test(s)) warn.push('có chữ "AI"');
  });
  return { errs, warn };
}
const IN = process.argv[3] || path.join(DIR, 'in');
const files = fs.readdirSync(OUT).filter(f => f.endsWith('.json')).sort();
let pass = 0, totBytes = 0;
const rows = [];
for (const f of files) {
  const inp = JSON.parse(fs.readFileSync(path.join(IN, f), 'utf8'));
  let h; try { h = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { rows.push(`${f}: JSON HỎNG ${e.message}`); continue; }
  const { errs, warn } = kiem(inp, h), bytes = fs.statSync(path.join(OUT, f)).size; totBytes += bytes;
  if (!errs.length) pass++;
  rows.push(`${f}: ${errs.length ? 'TRƯỢT' : 'ĐẠT'} · ${bytes} B · phép tính ${h.phepTinh.length} · tương tự ${h.tuongTu.length} · cần thầy chốt ${h.canThayChot.length}` +
    (errs.length ? '\n   ✕ ' + errs.join('\n   ✕ ') : '') + (warn.length ? '\n   ! ' + warn.join('\n   ! ') : '') +
    (h.canThayChot.length ? '\n   ? ' + h.canThayChot.join('\n   ? ') : ''));
}
console.log(rows.join('\n'));
console.log(`\nTỔNG: ${pass}/${files.length} đạt · TB ${Math.round(totBytes / Math.max(1, files.length))} B/hồ sơ`);
if (require.main === module) process.exitCode = pass === files.length ? 0 : 1;
module.exports = { kiem };
