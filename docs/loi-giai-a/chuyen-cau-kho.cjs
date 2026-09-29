// Chuyển câu kho (cau[] shape) → đầu vào máy soạn (khuôn v1.1). Chỉ phần I/II/III, bỏ tự luận.
const fs = require('fs'), path = require('path');
const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function deHTML(c, qid, imgDir) {
  let h = '<p>' + esc(c.de).replace(/\n/g, '<br>') + '</p>';
  if (c.bang) h += '<div class="tbl"><table>' + c.bang.map((r, i) => '<tr>' + r.map(x => i ? `<td>${esc(x)}</td>` : `<th>${esc(x)}</th>`).join('') + '</tr>').join('') + '</table></div>';
  const imgs = [];
  (c.hinh || []).forEach((g, i) => { const f = `${qid}-${i}.png`; fs.writeFileSync(path.join(imgDir, f), Buffer.from(g.du_lieu.split(',')[1], 'base64')); imgs.push({ tep: 'img/' + f, vi_tri: g.vi_tri }); if (g.vi_tri === 'sau_de') h += `<p><img alt="Hình trong đề" src="${g.du_lieu}"></p>`; });
  return { h, imgs };
}
function chuyen(qid, rec, imgDir) {
  const c = rec.cau || rec, lg = c.loi_giai || {};
  const { h, imgs } = deHTML(c, qid, imgDir);
  const base = { qid, so: `Câu ${c.so}`, nguon: rec.maDe, chuong: c.chuyen_de, mucDo: c.muc_do, dangBai: c.dang && c.dang.ma, de: h, hinh: imgs,
    loiGiaiCo: { chot: lg.chot || '', tung: lg.tung_pa || lg.tung_y || null, buoc: lg.buoc || [], ket_qua: lg.ket_qua || '', trang_thai: lg.trang_thai || '' } };
  if (c.phan === 'I') { const pa = c.pa || {}; return { ...base, dang: 'tn', y: Object.keys(pa).map(k => ({ id: k, t: pa[k] })), dapAn: Object.fromEntries(Object.keys(pa).map(k => [k, k === c.dap_an ? 'D' : 'S'])), mc: { hoi: 'Chọn đáp án', o: Object.keys(pa).map(k => [k, pa[k]]), dapAn: c.dap_an } }; }
  if (c.phan === 'II') { const y = c.y || {}, da = typeof c.dap_an === 'string' ? Object.fromEntries(Object.keys(y).map((k, i) => [k, c.dap_an[i] === 'D' || c.dap_an[i] === 'Đ' ? 'D' : 'S'])) : c.dap_an; return { ...base, dang: 'ds', y: Object.keys(y).map(k => ({ id: k, t: y[k] })), dapAn: da }; }
  if (c.phan === 'III') return { ...base, dang: 'tln', y: [], dapAn: { kq: String(c.dap_an) } };
  return null; // tự luận hoặc phần lạ: bỏ
}
module.exports = { chuyen };
if (require.main === module) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8'));
  const PICK = ['12-KT-C1-D3-I-4', '12-KT-C1-D4-I-6', '12-KT-C1-D4-I-16', '12-KT-C1-D4-II-4', '12-KT-C1-D5-II-4', '12-KT-C1-D2-III-6', 'DB-12-B1-P1-D2-III-108'];
  PICK.forEach((q, i) => { const inp = chuyen(q, d[q], path.join(__dirname, 'chay-thu-2/vao/img')); fs.writeFileSync(path.join(__dirname, 'chay-thu-2/vao', `${String(i + 1).padStart(2, '0')}-${q}.json`), JSON.stringify(inp, null, 1)); console.log(q, inp.dang, 'hinh', inp.hinh.length, 'dapAn', JSON.stringify(inp.dapAn)); });
}
