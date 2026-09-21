#!/usr/bin/env node
// SINH BẢN VẼ "XEM ĐIỂM + BÁO CÁO CHI TIẾT" bản 2 (Code 2, 21/09/2026) — đề bài `prompt-xem-diem-bao-cao-v2.md`.
//   node docs/ban-ve-xem-diem-2109/sinh-ban-ve.mjs            ghi các trang HTML tĩnh tự chứa (CSS nhúng sẵn) vào thư mục này
//   node docs/ban-ve-xem-diem-2109/sinh-ban-ve.mjs --anh      thêm: chụp Chromium 390 + 1440, sáng + tối, JPG ≤ 150 KB vào ./anh/
// Chỉ dữ liệu GIẢ (tên giả). Màu đọc từ tokens.css + m3-theme.css của app (không màu riêng); sáng/tối theo prefers-color-scheme.
// Một bộ thành phần (hàm bên dưới) dùng cho mọi trang — Code 4 dựng bản Giáo viên dùng lại đúng bộ này.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const CSS = [doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'xem-diem.css'), 'utf8')].join('\n')

// ───────────────────────────── dữ liệu giả ─────────────────────────────
const so = (n, d = 2) => Number(n).toFixed(d).replace(/\.?0+$/, '').replace('.', ',')
const D = {
  em: { ten: 'Nguyễn Minh Anh', lop: '12A1' },
  ca: { ten: 'Kiểm tra 45 phút · Este – lipid', ngay: 'Thứ Bảy 19/09/2026', nop: '09:12', lam: '32 phút 10 giây', de: '45 phút', diem: 7.5, truoc: 6.75, dung: 21, tong: 28, exp: 18 },
  phan: [
    { ma: 'I', ten: 'Phần I · Trắc nghiệm', dung: 15, tong: 18, diem: 3.75, toiDa: 4.5, o: 'dddsddddsdddddsddd'.split('').map((c, i) => [i + 1, c]) },
    { ma: 'II', ten: 'Phần II · Đúng–sai', dung: 2, tong: 4, diem: 2.75, toiDa: 4, o: [[1, 'd'], [2, 'm'], [3, 'd'], [4, 'm']] },
    { ma: 'III', ten: 'Phần III · Trả lời ngắn', dung: 4, tong: 6, diem: 1, toiDa: 1.5, o: [[1, 'd'], [2, 'd'], [3, 's'], [4, 'd'], [5, 'd'], [6, 's']] },
  ],
  dang: [
    { ten: 'Xà phòng hoá chất béo', dung: 1, tong: 3, bac: 0, truoc: 0, vap: true },
    { ten: 'Bài toán hỗn hợp ester', dung: 1, tong: 2, bac: 0, truoc: 0, vap: true },
    { ten: 'Phản ứng thuỷ phân ester', dung: 3, tong: 4, bac: 1, truoc: 1 },
    { ten: 'Danh pháp ester', dung: 2, tong: 2, bac: 2, truoc: 1 },
    { ten: 'Tính chất vật lí của lipid', dung: 3, tong: 3, bac: 1, truoc: 1 },
    { ten: 'Phản ứng ester hoá (điều chế ester)', dung: 4, tong: 5, bac: 1, truoc: 1 },
    { ten: 'Chỉ số chất béo', dung: 3, tong: 4, bac: 1, truoc: 1 },
    { ten: 'Nhận biết ester, axit và ancol', dung: 4, tong: 5, bac: 1, truoc: 1 },
  ],
  ds: [
    { ten: 'Kiểm tra 45 phút · Este – lipid', ngay: 'Thứ Bảy 19/09/2026', tt: 'ok', diem: 7.5, dung: 21, tong: 28, ss: 0.75 },
    { ten: 'Kiểm tra 60 phút · Ancol – phenol', ngay: 'Thứ Bảy 12/09/2026', tt: 'ok', diem: 6.75, dung: 27, tong: 40, ss: 0.5 },
    { ten: 'Kiểm tra 60 phút · Hiđrocacbon', ngay: 'Thứ Bảy 05/09/2026', tt: 'ok', diem: 6.25, dung: 25, tong: 40, ss: 0.75 },
    { ten: 'Kiểm tra 60 phút · Đại cương hữu cơ', ngay: 'Thứ Bảy 29/08/2026', tt: 'ok', diem: 5.5, dung: 22, tong: 40, ss: 0.5 },
    { ten: 'Kiểm tra 60 phút · Đại cương hữu cơ (ca đầu)', ngay: 'Thứ Bảy 22/08/2026', tt: 'ok', diem: 5, dung: 20, tong: 40, ss: null },
  ],
  cho: [
    { ten: 'Kiểm tra 20 phút · Amin – amino axit', ngay: 'Thứ Sáu 18/09/2026', tt: 'lop', nop: 27, si: 32 },
    { ten: 'Kiểm tra 10 phút · Polime', ngay: 'Thứ Năm 17/09/2026', tt: 'khong' },
  ],
  tienBo: [['22/08', 5], ['29/08', 5.5], ['05/09', 6.25], ['12/09', 6.75], ['19/09', 7.5]],
}
const BAC = ['Biết', 'Hiểu', 'Vận dụng']

// ───────────────────────────── biểu tượng (nét, kế thừa màu chữ) ─────────────────────────────
const IC = {
  'mui-ten-trai': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'phai': '<path d="m9 18 6-6-6-6"/>',
  'xuong': '<path d="m6 9 6 6 6-6"/>',
  'dung': '<path d="M20 6 9 17l-5-5"/>',
  'sai': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'dong-ho': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'khoa': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'tang': '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  'giam': '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
  'bang': '<path d="M5 12h14"/>',
  'sach': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'lich': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  'on-lai': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'sao': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'nguoi': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'den': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'in': '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  'mat-mang': '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  'thong-tin': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'muc-tieu': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'tai-lieu': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'lam-lai': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
}
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(IC).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</defs></svg>`
const ic = (ten, lon = false) => `<svg class="xd-i${lon ? ' xd-i--l' : ''}" aria-hidden="true" focusable="false"><use href="#i-${ten}"/></svg>`

// ───────────────────────────── BỘ THÀNH PHẦN CHUNG ─────────────────────────────
const C = {}

/** Chip so sánh với LẦN TRƯỚC CỦA CHÍNH EM (mũi tên + dấu + số; không xếp hạng, không so với bạn). */
C.soSanh = (hieu, truoc, ai = 'em') => {
  if (hieu === null) return `<span class="xd-ss xd-ss--bang">${ic('thong-tin')}<span>Đây là ca đầu tiên của ${ai} nên chưa có lần trước để so</span></span>`
  const [lop, bieu, dau] = hieu > 0 ? ['len', 'tang', '+'] : hieu < 0 ? ['xuong', 'giam', '−'] : ['bang', 'bang', '']
  const goc = truoc !== undefined ? ` (${so(truoc)})` : ''
  return `<span class="xd-ss xd-ss--${lop}">${ic(bieu)}<span class="xd-so">${dau}${so(Math.abs(hieu))} điểm so với lần trước của ${ai}${goc}</span></span>`
}

/** Số lớn + vòng: điểm/10, đúng x/y câu, thời gian, so với lần trước. */
C.ketQua = ({ diem, dung, tong, lam, de, ss, truoc, ai = 'em', giong = 'em', nop = '' }) => {
  const r = 52, cv = 2 * Math.PI * r, dat = (diem / 10) * cv
  return `<section class="xd-the xd-kq" aria-labelledby="t-kq">
  <div class="xd-vong" role="img" aria-label="Điểm ${so(diem)} trên 10">
    <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="nen" cx="60" cy="60" r="${r}"/><circle class="dat" cx="60" cy="60" r="${r}" stroke-dasharray="${dat.toFixed(1)} ${cv.toFixed(1)}"/></svg>
    <div class="xd-vong__so"><b>${so(diem)}</b><span>trên 10 điểm</span></div>
  </div>
  <div class="xd-kq__chi-tiet">
    <h2 id="t-kq" class="xd-sr">Kết quả</h2>
    <p class="xd-kq__dong xd-so">${giong === 'con' ? 'Con' : 'Em'} làm đúng ${dung}/${tong} câu</p>
    <p class="xd-kq__phu xd-so">Thời gian làm ${lam} (đề cho ${de})</p>${nop ? `
    <p class="xd-kq__phu xd-so">${nop}</p>` : ''}
    ${C.soSanh(ss, truoc, ai)}
  </div>
</section>`
}

/** Chip trạng thái công bố. */
C.chipCongBo = (tt) => ({
  ok: `<span class="xd-chip xd-chip--ok">${ic('dung')}Đã có điểm</span>`,
  lop: `<span class="xd-chip xd-chip--cho">${ic('nguoi')}Chờ cả lớp nộp</span>`,
  khong: `<span class="xd-chip xd-chip--khoa">${ic('khoa')}Thầy chưa công bố điểm</span>`,
})[tt]

/** Ba trạng thái công bố (luật `CongBoDiem`): khong · ca_lop_xong · da công bố. */
C.trangThai = (kieu, { nop = 27, si = 32, luc = '09:12' } = {}) => {
  if (kieu === 'lop') {
    return `<section class="xd-the" aria-labelledby="t-tt"><div class="xd-tt"><span class="xd-tt__o">${ic('nguoi', true)}</span><div><h2 id="t-tt">Điểm hiện khi cả lớp nộp xong</h2><p>Bài của em đã được ghi nhận lúc ${luc}. Em không cần làm gì thêm — khi lớp nộp xong, điểm hiện ở đây và em nhận thông báo.</p></div></div>
    <div class="xd-tien-do"><div class="xd-tien-do__thanh" role="progressbar" aria-label="Số em đã nộp" aria-valuemin="0" aria-valuemax="${si}" aria-valuenow="${nop}"><i style="width:${(nop / si) * 100}%"></i></div><div class="xd-tien-do__nhan xd-so"><span>Đã nộp ${nop}/${si} em</span><span>Còn ${si - nop} em</span></div></div></section>`
  }
  return `<section class="xd-the" aria-labelledby="t-tt"><div class="xd-tt"><span class="xd-tt__o">${ic('khoa', true)}</span><div><h2 id="t-tt">Thầy chưa công bố điểm</h2><p>Bài của em đã nộp lúc ${luc}. Khi thầy công bố, em thấy điểm ở Bảng nhiệm vụ và trong mục Xem điểm. Đáp án và lời giải cũng hiện lúc đó.</p></div></div></section>`
}

/** Một phần (I/II/III): thanh + điểm; mở ra thì hiện lưới câu. */
C.phan = (p, { mo = false, chiTiet = true } = {}) => {
  const ten = { d: 'đúng', s: 'sai', m: 'đúng một phần' }
  const ico = { d: 'dung', s: 'sai', m: 'bang' }
  const luoi = chiTiet
    ? `<div class="xd-phan__cau"><p class="xd-phan__cau-nhan">Chạm một câu để xem lại câu đó</p><div class="xd-luoi">${p.o.map(([n, c]) => `<a class="xd-o xd-o--${{ d: 'dung', s: 'sai', m: 'mot-phan' }[c]}" href="#cau-${p.ma}-${n}" aria-label="Câu ${n}, ${ten[c]}">${n}${ic(ico[c])}</a>`).join('')}</div>${C.chuGiai(p.ma === 'II')}</div>`
    : ''
  const dem = p.ma === 'II' ? `đúng trọn ${p.dung}/${p.tong} câu` : `đúng ${p.dung}/${p.tong} câu`
  return `<div class="xd-phan"><button class="xd-phan__nut" type="button" aria-expanded="${mo}" ${chiTiet ? '' : 'disabled'}>
    <span class="xd-phan__ten">${p.ten}</span><span class="xd-phan__diem xd-so">${so(p.diem)}<small>/${so(p.toiDa)} điểm</small></span>
    <span class="xd-phan__thanh" role="img" aria-label="${dem}"><i style="width:${(p.diem / p.toiDa) * 100}%"></i></span><span class="xd-phan__dem xd-so">${dem}${chiTiet ? ic(mo ? 'xuong' : 'phai') : ''}</span></button>${mo ? luoi : ''}</div>`
}
C.chuGiai = (ii = false) => `<p class="xd-chu-giai"><span><i class="d"></i>Đúng${ii ? ' trọn cả 4 ý' : ''}</span><span><i class="s"></i>Sai</span>${ii ? '<span><i class="m"></i>Đúng một phần (một vài ý)</span>' : ''}</p>`

/** Dòng dạng bài + huy hiệu bậc (Biết · Hiểu · Vận dụng) + đổi bậc sau ca. */
C.dang = (d, { doc = 'em' } = {}) => {
  const len = d.bac > d.truoc
  const bac = BAC.map((t, i) => `<span data-da="${i === d.bac ? (len ? 'moi' : 'dang') : i === d.truoc && len ? 'qua' : ''}"${i === d.bac ? ' aria-current="true"' : ''}>${t}</span>`).join('')
  const doi = len
    ? `<span class="xd-dang__doi xd-dang__doi--len">${ic('tang')}${doc === 'em' ? 'Em' : 'Con'} vừa lên bậc ${BAC[d.bac]}</span>`
    : `<span class="xd-dang__doi xd-dang__doi--giu">${ic('bang')}Giữ bậc ${BAC[d.bac]}</span>`
  return `<li class="xd-dang${d.vap ? ' xd-dang--vap' : ''}"><div class="xd-dang__ten"><span>${d.ten}</span>${d.vap ? `<span class="xd-chip xd-chip--cho">Cần ôn thêm</span>` : ''}</div>
    <div class="xd-dang__hang"><span class="xd-dang__dem">Trong ca này đúng <b>${d.dung}/${d.tong}</b> câu</span><span class="xd-bac" role="img" aria-label="Bậc hiện tại: ${BAC[d.bac]}. Ba bậc: Biết, Hiểu, Vận dụng">${bac}</span></div>${doi}</li>`
}

/** Thẻ câu cần xem lại. `cb` = luật công bố: khi chưa công bố thì KHÔNG có đáp án/lời giải (khoá). */
C.cau = (c, { cb = true } = {}) => {
  const tag = c.loai === 'sai' ? `<span class="xd-chip xd-chip--luu-y">${ic('sai')}Sai</span>` : `<span class="xd-chip xd-chip--cho">${ic('dong-ho')}Đúng nhưng làm lâu</span>`
  const emClass = c.loai === 'sai' ? 'xd-tl--em' : 'xd-tl--em-dung'
  const dapAn = cb
    ? (c.loai === 'sai' ? `<div class="xd-tl xd-tl--dung"><b>Đáp án</b><span>${c.dapAn}</span></div>` : '')
    : `<div class="xd-tl xd-tl--khoa">${ic('khoa')}<span>Đáp án và lời giải hiện khi thầy công bố điểm</span></div>`
  const giai = cb ? `<details class="xd-giai"><summary>Xem lời giải ${ic('xuong')}</summary><div class="xd-giai__noi-dung">${c.giai}</div></details>` : ''
  return `<article class="xd-cau" id="cau-${c.id}"><div class="xd-cau__dau"><h3 class="xd-cau__ten">Câu ${c.so} · ${c.phan}<small>${c.dang}</small></h3>${tag}</div>
    <p class="xd-cau__de">${c.de}</p>
    <div class="xd-cau__tra-loi"><div class="xd-tl ${emClass}"><b>Em chọn</b><span>${c.em}</span></div>${dapAn}</div>
    ${giai}
    <div class="xd-cau__meta xd-so"><span>${ic('dong-ho')}Em làm ${c.giay}</span><span>${ic('thong-tin')}Trung bình cả bài ${c.tb}</span></div>
    <p class="xd-cau__on">${ic('on-lai')}Máy đã xếp câu này vào lịch ôn ngày ${c.on}</p></article>`
}
const CAU_MAU = [
  { id: 'I-9', so: 9, phan: 'Phần I · Trắc nghiệm', dang: 'Bài toán thuỷ phân ester', loai: 'sai', de: 'Thuỷ phân hoàn toàn 8,8 g ethyl acetate bằng dung dịch NaOH dư, khối lượng sodium acetate thu được là bao nhiêu?', em: 'C · 6,8 g', dapAn: 'B · 8,2 g',
    giai: '<ol><li>n(ethyl acetate) = 8,8 : 88 = 0,1 mol.</li><li>CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> + NaOH → CH<sub>3</sub>COONa + C<sub>2</sub>H<sub>5</sub>OH, nên n(CH<sub>3</sub>COONa) = 0,1 mol.</li><li>m = 0,1 × 82 = 8,2 g.</li></ol>', giay: '1 phút 48 giây', tb: '1 phút 09 giây', on: 'Chủ Nhật 20/09' },
  { id: 'III-3', so: 3, phan: 'Phần III · Trả lời ngắn', dang: 'Xà phòng hoá chất béo', loai: 'sai', de: 'Đun nóng 17,8 g tristearin với dung dịch NaOH dư. Khối lượng glixerol thu được là bao nhiêu gam? (làm tròn đến một chữ số thập phân)', em: '3,6', dapAn: '1,8',
    giai: '<ol><li>n(tristearin) = 17,8 : 890 = 0,02 mol.</li><li>Một phân tử chất béo cho một phân tử glixerol, nên n(glixerol) = 0,02 mol.</li><li>m = 0,02 × 92 = 1,84 g, làm tròn được 1,8 g.</li></ol>', giay: '2 phút 05 giây', tb: '1 phút 40 giây', on: 'Chủ Nhật 20/09' },
  { id: 'I-12', so: 12, phan: 'Phần I · Trắc nghiệm', dang: 'Nhận biết ester, axit và ancol', loai: 'lau', de: 'Trong các chất sau, chất nào là ester? (A) CH₃COOH  (B) CH₃COOCH₃  (C) CH₃CH₂OH  (D) CH₃CHO', em: 'B · CH₃COOCH₃', dapAn: 'B · CH₃COOCH₃',
    giai: '<ol><li>Ester có nhóm –COO– nối hai gốc hiđrocacbon.</li><li>CH<sub>3</sub>COOCH<sub>3</sub> có nhóm –COO– giữa hai gốc CH<sub>3</sub>, nên là ester.</li></ol>', giay: '2 phút 20 giây', tb: '1 phút 09 giây', on: 'Thứ Ba 22/09' },
]

/** Thẻ "máy đã lo" — chỉ nói điều CHẮC CHẮN xảy ra (luật Bộ não). */
C.mayDaLo = ({ doc = 'em', muc } = {}) => {
  const ds = muc || (doc === 'em'
    ? [['lich', 'Bài tập về nhà tới ưu tiên dạng Xà phòng hoá chất béo', 'Vì em đúng 1/3 câu ở dạng này'], ['on-lai', 'Ngày mai (Chủ Nhật 20/09) em ôn lại 5 câu đã làm sai', 'Lịch ôn lại sau 1 ngày, 3 ngày và 7 ngày'], ['sao', 'Đã cộng +18 EXP cho ca này', 'EXP học tập hôm nay tăng thêm 18']]
    : [['lich', 'Bài tập về nhà tới sẽ ưu tiên phần Xà phòng hoá chất béo', 'Vì con đúng 1/3 câu ở phần này'], ['on-lai', 'Ngày mai con sẽ ôn lại 5 câu đã làm sai (khoảng 10 phút)', 'Máy nhắc con ôn lại sau 1 ngày, 3 ngày và 7 ngày'], ['sao', 'Con được cộng +18 EXP cho ca này', 'EXP là điểm tích luỹ khi học, không phải điểm kiểm tra']])
  return `<section class="xd-the xd-lo" aria-labelledby="t-lo"><h2 id="t-lo">${doc === 'em' ? 'Máy đã lo giúp em bước tiếp theo' : 'Máy đã lo giúp con bước tiếp theo'}</h2>
  <ul class="xd-lo__ds">${ds.map(([i, t, s]) => `<li class="xd-lo__muc"><span class="xd-lo__o">${ic(i)}</span><p>${t}<small>${s}</small></p></li>`).join('')}</ul></section>`
}

/** Biểu đồ đường điểm của CHÍNH em (SVG tự vẽ, không thư viện; mọi điểm có nhãn số). */
C.bieuDo = (dl, ten = 'Điểm các ca gần đây của em') => {
  const W = 340, H = 220, L = 30, R = 14, T = 28, B = 32
  const x = (i) => L + (i * (W - L - R)) / (dl.length - 1), y = (v) => T + (1 - v / 10) * (H - T - B)
  const pts = dl.map(([, v], i) => [x(i), y(v)])
  const duong = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const vung = `${duong} L${pts[pts.length - 1][0].toFixed(1)} ${y(0)} L${pts[0][0].toFixed(1)} ${y(0)} Z`
  return `<svg class="xd-bieu-do" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ten}: ${dl.map(([n, v]) => `${n} được ${so(v)}`).join(', ')}">
    ${[0, 5, 10].map((v) => `<line class="luoi" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <path class="vung" d="${vung}"/><path class="duong" d="${duong}"/>
    ${pts.map((p, i) => `<circle class="diem${i === pts.length - 1 ? ' diem--nay' : ''}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"/><text class="so" x="${p[0].toFixed(1)}" y="${(p[1] - 11).toFixed(1)}" text-anchor="middle">${so(dl[i][1])}</text><text x="${p[0].toFixed(1)}" y="${H - 10}" text-anchor="middle">${dl[i][0]}</text>`).join('')}</svg>`
}
C.tienBo = ({ doc = 'em' } = {}) => `<section class="xd-muc" id="tien-bo" aria-labelledby="h-tb"><div class="xd-muc__dau"><h2 id="h-tb">Tiến bộ qua các ca</h2><p>5 ca gần nhất</p></div>
  <div class="xd-the">${C.bieuDo(D.tienBo, doc === 'em' ? 'Điểm các ca gần đây của em' : 'Điểm các ca gần đây của con')}
  <p class="xd-muc__mo-ta" style="margin-top:8px">Điểm trên 10, ${doc === 'em' ? 'chỉ so với chính em' : 'chỉ so với chính con'} qua từng ca.</p></div>
  <div class="xd-the"><h3 style="font-size:var(--bnv-cx-3);font-weight:700;margin-bottom:8px">3 dạng bài ${doc === 'em' ? 'em' : 'con'} tiến bộ nhất</h3><ul class="xd-tb-ds">
  ${[['Danh pháp ester', 'Hiểu', 'Vận dụng'], ['Tính chất vật lí của lipid', 'Biết', 'Hiểu'], ['Phản ứng ester hoá', 'Biết', 'Hiểu']].map(([t, a, b]) => `<li class="xd-tb"><span>${t}</span><small>${ic('tang')}${a} → ${b}</small></li>`).join('')}</ul></div></section>`

/** Thanh trên + mục lục dính. */
C.thanhTren = (ten, phu, { quayLai = 'Quay lại', phai = '' } = {}) => `<header class="xd-tren"><a class="xd-nut-tron" href="#" aria-label="${quayLai}">${ic('mui-ten-trai', true)}</a><div class="xd-tren-ten"><h1>${ten}</h1><p>${phu}</p></div>${phai}</header>`
C.mucLuc = (ds, hienTai = 0) => `<nav class="xd-muc-luc" aria-label="Các mục của báo cáo"><span class="xd-muc-luc__tieu">TRONG BÁO CÁO NÀY</span><ul>${ds.map(([id, t], i) => `<li><a href="#${id}"${i === hienTai ? ' aria-current="true"' : ''}>${t}</a></li>`).join('')}</ul></nav>`
C.mucLucHS = (i = 0) => C.mucLuc([['ket-qua', 'Kết quả'], ['ba-phan', 'Ba phần'], ['theo-dang', 'Theo dạng bài'], ['cau-xem-lai', 'Câu cần xem lại'], ['buoc-tiep', 'Bước tiếp theo'], ['tien-bo', 'Tiến bộ']], i)

/** Một dòng ca trong danh sách. */
C.ca = (c, { doc = 'em' } = {}) => {
  if (c.tt === 'ok') return `<li><a class="xd-ca" href="#"><div class="xd-ca__ten-o"><h3 class="xd-ca__ten">${c.ten}</h3><p class="xd-ca__ngay">${c.ngay}</p></div><div class="xd-ca__diem"><div><b>${so(c.diem)}</b><small>trên 10 điểm</small></div>${ic('phai', true)}</div><div class="xd-ca__chi">${C.chipCongBo('ok')}<span class="xd-chip xd-so">Đúng ${c.dung}/${c.tong} câu</span>${c.ss === null ? '<span class="xd-chip">Ca đầu tiên</span>' : `<span class="xd-chip xd-chip--ok xd-so">${ic('tang')}+${so(c.ss)} điểm</span>`}</div></a></li>`
  const nhan = c.tt === 'lop' ? `Đã nộp ${c.nop}/${c.si} em — điểm hiện khi cả lớp nộp` : 'Thầy sẽ công bố sau'
  return `<li><a class="xd-ca xd-ca--khoa" href="#"><div class="xd-ca__ten-o"><h3 class="xd-ca__ten">${c.ten}</h3><p class="xd-ca__ngay">${c.ngay}</p></div><div class="xd-ca__diem"><div><b>Chưa có</b><small>điểm</small></div>${ic('phai', true)}</div><div class="xd-ca__chi">${C.chipCongBo(c.tt)}<span class="xd-chip xd-so">${nhan}</span></div></a></li>`
}
C.tongCa = (doc = 'em') => `<section class="xd-the xd-tong" aria-labelledby="t-tong"><div><h2 id="t-tong" style="font-size:var(--bnv-cx-3);font-weight:700">Điểm 5 ca gần nhất</h2><p class="xd-tong__so"><b>${so(D.tienBo.reduce((s, [, v]) => s + v, 0) / D.tienBo.length)}</b><span>điểm trung bình trên 10${doc === 'em' ? ' của em' : ' của con'}</span></p></div>
  <div class="xd-cot" role="img" aria-label="Điểm 5 ca gần nhất: ${D.tienBo.map(([n, v]) => `${n} được ${so(v)}`).join(', ')}">${D.tienBo.map(([n, v]) => `<div><small>${so(v)}</small><i style="height:${v * 10}px"></i><small style="color:var(--m3-on-surface-variant);font-weight:600">${n}</small></div>`).join('')}</div></section>`

/** Hộp trạng thái: chờ (khung xương) / rỗng / lỗi / mất mạng. */
C.hop = (kieu) => ({
  xuong: `<div class="xd-xuong" role="status" aria-label="Đang tải kết quả"><i style="height:168px"></i><i style="height:72px"></i><i style="height:72px"></i></div>`,
  rong: `<div class="xd-hop"><span class="xd-hop__o">${ic('tai-lieu', true)}</span><h3>Em chưa có ca kiểm tra nào ở đây</h3><p>Khi em nộp bài kiểm tra, điểm và báo cáo hiện ở mục này. Ca đang mở nằm ở Bảng nhiệm vụ.</p><a class="xd-nut xd-nut--tonal" href="#">Về bảng nhiệm vụ</a></div>`,
  loi: `<div class="xd-hop xd-hop--loi" role="alert"><span class="xd-hop__o">${ic('thong-tin', true)}</span><h3>Chưa tải được kết quả</h3><p>Máy chủ chưa trả lời. Bài của em vẫn an toàn — em thử lại sau ít giây nhé.</p><button class="xd-nut xd-nut--chinh" type="button">Thử lại</button></div>`,
  matmang: `<div class="xd-hop"><span class="xd-hop__o">${ic('mat-mang', true)}</span><h3>Máy đang không có mạng</h3><p>Em vẫn xem được các ca đã tải trước đó. Khi có mạng lại, danh sách tự cập nhật.</p></div>`,
})[kieu]

// ───────────────────────────── KHUNG TRANG ─────────────────────────────
const trang = ({ tieuDe, body, mau = 'xd', them = '', vaiTro = '' }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}${them}</style></head>
<body class="m3 ${mau}"${vaiTro}>${SPRITE}${body}</body></html>`

const P = {}

// HS-1 · kết quả ngay sau nộp — ba trạng thái công bố
P['hs-1a-da-cong-bo'] = () => trang({ tieuDe: 'HS-1a · Kết quả sau nộp · đã công bố', body: `${C.thanhTren('Kết quả kiểm tra', D.ca.ten, { quayLai: 'Về bảng nhiệm vụ' })}
<main class="xd-khung">
  <p class="xd-muc__mo-ta">Em đã nộp bài lúc ${D.ca.nop} · ${D.ca.ngay}</p>
  ${C.ketQua({ ...D.ca, ss: D.ca.diem - D.ca.truoc })}
  <section class="xd-muc" aria-labelledby="h-3p"><div class="xd-muc__dau"><h2 id="h-3p">Ba phần của bài</h2></div><div class="xd-phan-ds">${D.phan.map((p) => C.phan(p, { chiTiet: false })).join('')}</div></section>
  ${C.mayDaLo()}
  <div style="display:grid;gap:8px;justify-items:stretch"><a class="xd-nut xd-nut--chinh xd-nut--rong" href="hs-2-bao-cao-chi-tiet.html">${ic('tai-lieu')}Xem báo cáo chi tiết</a><a class="xd-nut xd-nut--chu xd-nut--rong" href="#">Về bảng nhiệm vụ</a></div>
</main>` })
P['hs-1b-cho-ca-lop'] = () => trang({ tieuDe: 'HS-1b · Kết quả sau nộp · chờ cả lớp nộp', body: `${C.thanhTren('Kết quả kiểm tra', D.ca.ten, { quayLai: 'Về bảng nhiệm vụ' })}
<main class="xd-khung">
  ${C.trangThai('lop')}
  <div style="display:grid;gap:8px"><a class="xd-nut xd-nut--chinh xd-nut--rong" href="#">Về bảng nhiệm vụ</a></div>
</main>` })
P['hs-1c-chua-cong-bo'] = () => trang({ tieuDe: 'HS-1c · Kết quả sau nộp · thầy chưa công bố', body: `${C.thanhTren('Kết quả kiểm tra', D.ca.ten, { quayLai: 'Về bảng nhiệm vụ' })}
<main class="xd-khung">
  ${C.trangThai('khong')}
  <div style="display:grid;gap:8px"><a class="xd-nut xd-nut--chinh xd-nut--rong" href="#">Về bảng nhiệm vụ</a></div>
</main>` })

// HS-2 · báo cáo chi tiết: một trang cuộn dọc + mục lục dính
P['hs-2-bao-cao-chi-tiet'] = () => trang({ tieuDe: 'HS-2 · Báo cáo chi tiết', body: `${C.thanhTren('Báo cáo chi tiết', D.ca.ten, { phai: `<a class="xd-nut-tron" href="ban-in-a4.html" aria-label="In báo cáo">${ic('in', true)}</a>` })}
<main class="xd-khung xd-khung--rong"><div class="xd-bao-cao">
  ${C.mucLucHS(0)}
  <div class="xd-bao-cao__noi-dung">
    <section class="xd-muc" id="ket-qua" aria-label="Kết quả">${C.ketQua({ ...D.ca, ss: D.ca.diem - D.ca.truoc, truoc: D.ca.truoc, nop: `Nộp lúc ${D.ca.nop} · ${D.ca.ngay}` })}</section>
    <section class="xd-muc" id="ba-phan" aria-labelledby="h-3p"><div class="xd-muc__dau"><h2 id="h-3p">Ba phần của bài</h2><p>Chạm một phần để xem từng câu</p></div><div class="xd-phan-ds">${D.phan.map((p, i) => C.phan(p, { mo: i === 0 })).join('')}</div></section>
    <section class="xd-muc" id="theo-dang" aria-labelledby="h-dang"><div class="xd-muc__dau"><h2 id="h-dang">Theo dạng bài</h2><p>8 dạng trong ca này</p></div>
      <p class="xd-muc__mo-ta">Bậc của em ở mỗi dạng đi từ Biết, đến Hiểu, đến Vận dụng. Dạng em còn vấp được xếp lên trên.</p>
      <ul class="xd-dang-ds">${D.dang.slice(0, 6).map((d) => C.dang(d)).join('')}</ul><button class="xd-nut xd-nut--chu" type="button" style="align-self:flex-start">Xem cả 8 dạng${ic('xuong')}</button></section>
    <section class="xd-muc" id="cau-xem-lai" aria-labelledby="h-cau"><div class="xd-muc__dau"><h2 id="h-cau">Câu cần xem lại</h2><p>3 trong 7 câu</p></div>
      <p class="xd-muc__mo-ta">Gồm câu em làm sai và câu em làm đúng nhưng mất nhiều thời gian.</p>
      <div class="xd-cau-ds">${CAU_MAU.map((c) => C.cau(c)).join('')}</div><button class="xd-nut xd-nut--tonal" type="button" style="align-self:flex-start">Xem cả 7 câu cần xem lại</button></section>
    <section class="xd-muc" id="buoc-tiep" aria-label="Bước tiếp theo">${C.mayDaLo()}</section>
    ${C.tienBo()}
  </div></div></main>` })

// HS-3 · danh sách ca ở tab Xem điểm
P['hs-3-danh-sach-ca'] = () => trang({ tieuDe: 'HS-3 · Danh sách ca (tab Xem điểm)', body: `${C.thanhTren('Xem điểm', 'Các ca kiểm tra của em', { quayLai: 'Về bảng nhiệm vụ' })}
<main class="xd-khung">
  ${C.tongCa('em')}
  <p class="xd-nhom-ten">CHƯA CÓ ĐIỂM · 2 ca</p>
  <ul class="xd-ca-ds">${D.cho.map((c) => C.ca(c)).join('')}</ul>
  <p class="xd-nhom-ten">ĐÃ CÓ ĐIỂM · 5 ca, mới nhất trước</p>
  <ul class="xd-ca-ds">${D.ds.map((c) => C.ca(c)).join('')}</ul>
</main>` })

// PH-1 · báo cáo cho phụ huynh
P['ph-1-bao-cao-phu-huynh'] = () => trang({ tieuDe: 'PH-1 · Báo cáo cho phụ huynh', body: `${C.thanhTren('Báo cáo ca kiểm tra của con', `${D.em.ten} · Lớp ${D.em.lop}`, { phai: `<a class="xd-nut-tron" href="ban-in-a4.html" aria-label="In báo cáo">${ic('in', true)}</a>` })}
<main class="xd-khung xd-khung--rong"><div class="xd-bao-cao">
  ${C.mucLuc([['ket-qua', 'Kết quả của con'], ['tot-them', 'Con làm tốt · cần thêm'], ['ba-phan', 'Ba phần'], ['buoc-tiep', 'Bước tiếp theo'], ['lam-gi', 'Anh/chị có thể làm gì'], ['tien-bo', 'Tiến bộ']], 0)}
  <div class="xd-bao-cao__noi-dung">
    <p class="xd-muc__mo-ta" style="margin-bottom:-8px">${D.ca.ten}</p>
    <section class="xd-muc" id="ket-qua" aria-label="Kết quả của con">${C.ketQua({ ...D.ca, ss: D.ca.diem - D.ca.truoc, truoc: D.ca.truoc, ai: 'con', giong: 'con', nop: `Nộp lúc ${D.ca.nop} · ${D.ca.ngay}` })}</section>
    <section class="xd-muc" id="tot-them" aria-labelledby="h-tt"><div class="xd-muc__dau"><h2 id="h-tt">Con làm tốt và cần luyện thêm</h2></div>
      <div class="xd-hai-cot">
        <div class="xd-tot"><h3>${ic('dung')}Con làm tốt</h3><ul><li>Danh pháp ester<span>Đúng 2/2 câu. Con vừa lên mức Vận dụng, mức cao nhất.</span></li><li>Tính chất vật lí của lipid<span>Đúng 3/3 câu.</span></li><li>Nhận biết ester, axit và ancol<span>Đúng 4/5 câu.</span></li></ul></div>
        <div class="xd-them"><h3>${ic('muc-tieu')}Con cần luyện thêm</h3><ul><li>Xà phòng hoá chất béo<span>Đúng 1/3 câu. Con đang ở mức Biết.</span></li><li>Bài toán hỗn hợp ester<span>Đúng 1/2 câu. Con đang ở mức Biết.</span></li></ul><p class="xd-muc__mo-ta" style="margin-top:8px;font-size:var(--bnv-cx-1)">Ba mức đi từ Biết, đến Hiểu, đến Vận dụng.</p></div>
      </div></section>
    <section class="xd-muc" id="ba-phan" aria-labelledby="h-3p"><div class="xd-muc__dau"><h2 id="h-3p">Ba phần của bài</h2></div><div class="xd-phan-ds">${D.phan.map((p) => C.phan(p, { chiTiet: false })).join('')}</div></section>
    <section class="xd-muc" id="buoc-tiep" aria-label="Bước tiếp theo">${C.mayDaLo({ doc: 'con' })}</section>
    <section class="xd-muc" id="lam-gi" aria-labelledby="h-lg"><div class="xd-the xd-goi-y"><h2 id="h-lg">Anh/chị có thể làm gì</h2><ol><li>Hỏi con kể lại cách giải câu 9 (bài toán thuỷ phân ester) — con nói được là con đã hiểu.</li><li>Nhắc con làm phần ôn lại ngày mai, khoảng 10 phút.</li></ol></div></section>
    ${C.tienBo({ doc: 'con' })}
  </div></div></main>` })

// PH-2 · danh sách ca cho phụ huynh
P['ph-2-danh-sach-ca'] = () => trang({ tieuDe: 'PH-2 · Danh sách ca (phụ huynh)', body: `${C.thanhTren('Kết quả kiểm tra của con', `${D.em.ten} · Lớp ${D.em.lop}`)}
<main class="xd-khung">
  ${C.tongCa('con')}
  <p class="xd-nhom-ten">CHƯA CÓ ĐIỂM · 2 ca</p>
  <ul class="xd-ca-ds">${D.cho.map((c) => C.ca({ ...c }, { doc: 'con' })).join('')}</ul>
  <p class="xd-nhom-ten">ĐÃ CÓ ĐIỂM · 5 ca, mới nhất trước</p>
  <ul class="xd-ca-ds">${D.ds.map((c) => C.ca(c, { doc: 'con' })).join('')}</ul>
</main>` })

// BỘ THÀNH PHẦN — trang tra cứu
P['bo-thanh-phan'] = () => {
  const mau = (t, h) => `<div style="display:grid;gap:8px"><p class="xd-mau-tieu">${t}</p>${h}</div>`
  return trang({ tieuDe: 'Bộ thành phần chung · Xem điểm + báo cáo bản 2', body: `${C.thanhTren('Bộ thành phần chung', 'Xem điểm + báo cáo chi tiết · bản vẽ 21/09/2026 · dùng cho cả ba app')}
<main class="xd-khung xd-khung--rong" style="gap:28px">
  <div class="xd-ghi-chu-bo">Bộ này vẽ TRƯỚC; Học sinh, Phụ huynh và Giáo viên đều dùng lại đúng các khối bên dưới (khác nhau ở giọng chữ và độ sâu, không khác cấu trúc). Màu chỉ đọc biến của app (tokens.css + m3-theme.css), sáng/tối theo máy. Không emoji, không mã, đích chạm ≥ 48 px, mọi con số có nhãn.</div>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>1 · Số lớn + vòng điểm</h2><p>SoLon</p></div><div class="xd-luoi-mau">
    ${mau('Tăng so với lần trước của chính em', C.ketQua({ ...D.ca, ss: 0.75, truoc: 6.75 }))}
    ${mau('Giảm (giọng trung tính, không đỏ, không doạ)', C.ketQua({ diem: 6, dung: 22, tong: 28, lam: '38 phút 02 giây', de: '45 phút', ss: -0.75, truoc: 6.75 }))}
    ${mau('Ca đầu tiên (chưa có lần trước)', C.ketQua({ diem: 5, dung: 20, tong: 40, lam: '51 phút 40 giây', de: '60 phút', ss: null }))}
  </div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>2 · Trạng thái công bố</h2><p>Chip + khối · luật CongBoDiem</p></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${['ok', 'lop', 'khong'].map(C.chipCongBo).join('')}</div>
    <div class="xd-luoi-mau">${mau('ca_lop_xong — chờ cả lớp', C.trangThai('lop'))}${mau('khong — thầy chưa công bố', C.trangThai('khong'))}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>3 · Thanh phần</h2><p>ThanhPhan · ba thanh I · II · III</p></div><div class="xd-luoi-mau">
    ${mau('Thu gọn (chạm để mở)', `<div class="xd-phan-ds">${D.phan.map((p) => C.phan(p, { chiTiet: true })).join('')}</div>`)}
    ${mau('Mở ra: lưới câu, có biểu tượng + chữ (không chỉ màu)', `<div class="xd-phan-ds">${C.phan(D.phan[1], { mo: true })}</div>`)}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>4 · Dòng dạng bài + huy hiệu bậc</h2><p>DongDang</p></div><div class="xd-luoi-mau">
    ${mau('Dạng còn vấp (xếp trên)', `<ul class="xd-dang-ds">${C.dang(D.dang[0])}</ul>`)}${mau('Giữ bậc', `<ul class="xd-dang-ds">${C.dang(D.dang[2])}</ul>`)}${mau('Vừa lên bậc', `<ul class="xd-dang-ds">${C.dang(D.dang[3])}</ul>`)}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>5 · Thẻ câu cần xem lại</h2><p>TheCau</p></div><div class="xd-luoi-mau">
    ${mau('Đã công bố: có đáp án + lời giải', C.cau(CAU_MAU[0]))}${mau('Chưa công bố: khoá, KHÔNG có đáp án/lời giải', C.cau({ ...CAU_MAU[0], id: 'I-9k' }, { cb: false }))}${mau('Đúng nhưng làm lâu', C.cau({ ...CAU_MAU[2], id: 'I-12k' }))}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>6 · Thẻ "máy đã lo"</h2><p>MayDaLo · chỉ điều chắc chắn xảy ra</p></div><div class="xd-luoi-mau">${mau('Giọng em', C.mayDaLo())}${mau('Giọng phụ huynh', C.mayDaLo({ doc: 'con' }))}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>7 · Tiến bộ qua các ca</h2><p>DuongDiem · chỉ so với chính em</p></div><div class="xd-luoi-mau">${mau('Đường điểm + 3 dạng tiến bộ nhất', `<div class="xd-the">${C.bieuDo(D.tienBo)}</div>`)}${mau('Tổng 5 ca gần nhất (danh sách ca)', C.tongCa('em'))}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>8 · Dòng ca trong danh sách</h2><p>DongCa</p></div><div class="xd-luoi-mau"><ul class="xd-ca-ds">${C.ca(D.ds[0])}${C.ca(D.cho[0])}${C.ca(D.cho[1])}</ul></div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>9 · Mục lục dính (điện thoại: hàng chip; máy tính: cột trái)</h2><p>MucLuc</p></div>${C.mucLucHS(1)}</section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>10 · Chờ · Rỗng · Lỗi · Mất mạng</h2><p>Bốn trạng thái phải có</p></div><div class="xd-luoi-mau">${mau('Đang tải (khung xương, không màn trắng)', C.hop('xuong'))}${mau('Trống', C.hop('rong'))}${mau('Lỗi (nói lý do thật + Thử lại)', C.hop('loi'))}${mau('Mất mạng', C.hop('matmang'))}</div></section>
  <section class="xd-muc"><div class="xd-muc__dau"><h2>11 · Nút</h2><p>Đúng MỘT nút chính mỗi màn</p></div><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="xd-nut xd-nut--chinh" type="button">Xem báo cáo chi tiết</button><button class="xd-nut xd-nut--tonal" type="button">Xem cả 7 câu cần xem lại</button><button class="xd-nut xd-nut--chu" type="button">Về bảng nhiệm vụ</button></div></section>
</main>` })
}

// BẢN IN A4 (PhieuScreen) — nền trắng, mực đen, tiết kiệm mực
P['ban-in-a4'] = () => {
  const trHtml = (p) => `<tr><td>${p.ten}</td><td class="r">${p.ma === 'II' ? `đúng trọn ${p.dung}/${p.tong}` : `${p.dung}/${p.tong}`}</td><td style="width:26%"><span class="a4-thanh"><i style="width:${(p.diem / p.toiDa) * 100}%"></i></span></td><td class="r">${so(p.diem)}/${so(p.toiDa)}</td></tr>`
  return trang({ tieuDe: 'Bản in A4 · Báo cáo ca kiểm tra', mau: 'xd xd-in', body: `
<article class="a4"><div class="a4-dau"><div><h1>Báo cáo ca kiểm tra</h1><p>${D.ca.ten} · ${D.ca.ngay}</p><p><b>${D.em.ten}</b> · Lớp ${D.em.lop}</p></div><div class="ben">Luyện thi Hoá · Thầy Đỗ Đại Học<br>Nộp bài lúc ${D.ca.nop}</div></div>
  <section><h2>Kết quả</h2><div class="a4-kq"><div class="so"><b>${so(D.ca.diem)}</b><span>trên 10 điểm</span></div><ul><li>Đúng <b>${D.ca.dung}/${D.ca.tong}</b> câu (Phần II tính câu đúng trọn cả 4 ý)</li><li>Thời gian làm ${D.ca.lam} (đề cho ${D.ca.de})</li><li>So với lần trước của chính em (${so(D.ca.truoc)} điểm): tăng <b>+${so(D.ca.diem - D.ca.truoc)} điểm</b></li></ul></div></section>
  <section><h2>Ba phần của bài</h2><table><thead><tr><th>Phần</th><th class="r">Số câu đúng</th><th>Tỉ lệ điểm</th><th class="r">Điểm</th></tr></thead><tbody>${D.phan.map(trHtml).join('')}</tbody></table></section>
  <section><h2>Theo dạng bài</h2><table><thead><tr><th>Dạng bài</th><th class="r">Đúng / Tổng</th><th>Bậc hiện tại</th></tr></thead><tbody>${D.dang.map((d) => `<tr class="${d.vap ? 'a4-vap' : ''}"><td>${d.ten}${d.vap ? ' (cần ôn thêm)' : ''}</td><td class="r">${d.dung}/${d.tong}</td><td>${BAC[d.bac]}${d.bac > d.truoc ? ' · vừa lên từ ' + BAC[d.truoc] : ''}</td></tr>`).join('')}</tbody></table></section>
  <div class="a4-chan"><span>Điểm trên 10; bậc đi từ Biết, đến Hiểu, đến Vận dụng.</span><span>Trang 1/2</span></div></article>
<article class="a4"><div class="a4-dau"><div><h1>Câu cần xem lại</h1><p>${D.em.ten} · ${D.ca.ten}</p></div><div class="ben">Trang 2/2</div></div>
  <section><h2>3 trong 7 câu cần xem lại</h2><div style="display:grid;gap:10px">${CAU_MAU.map((c) => `<div class="a4-cau"><div><b>Câu ${c.so} · ${c.phan}</b> — ${c.dang} <i>(${c.loai === 'sai' ? 'em làm sai' : 'đúng nhưng làm lâu'})</i></div><div>${c.de}</div><div class="l"><span>Em chọn</span><span>${c.em}</span></div><div class="l"><span>Đáp án</span><span>${c.dapAn}</span></div><div class="l"><span>Thời gian</span><span>${c.giay} (trung bình cả bài ${c.tb}) · máy xếp vào lịch ôn ngày ${c.on}</span></div></div>`).join('')}</div></section>
  <section><h2>Máy đã lo giúp em bước tiếp theo</h2><ul class="a4-lo"><li>Bài tập về nhà tới ưu tiên dạng Xà phòng hoá chất béo.</li><li>Ngày mai (Chủ Nhật 20/09) em ôn lại 5 câu đã làm sai; lịch ôn sau 1 ngày, 3 ngày và 7 ngày.</li><li>Đã cộng +18 EXP cho ca này.</li></ul></section>
  <section><h2>Điểm các ca gần đây của em</h2><table><thead><tr><th>Ngày</th>${D.tienBo.map(([n]) => `<th class="r">${n}</th>`).join('')}</tr></thead><tbody><tr><td>Điểm trên 10</td>${D.tienBo.map(([, v]) => `<td class="r">${so(v)}</td>`).join('')}</tr></tbody></table></section>
  <div class="a4-chan"><span>In từ app ngày 19/09/2026 · dữ liệu mẫu</span><span>Trang 2/2</span></div></article>` })
}

// TRANG CHỦ của bộ bản vẽ
P.index = () => trang({ tieuDe: 'Bản vẽ Xem điểm + báo cáo chi tiết · bản 2', body: `${C.thanhTren('Xem điểm + báo cáo chi tiết · bản 2', 'Bản vẽ để thầy duyệt · dữ liệu giả · chưa build')}
<main class="xd-khung xd-khung--rong" style="gap:20px">
  <div class="xd-ghi-chu-bo">Đây là BẢN VẼ, chưa phải app chạy thật. Tên và số liệu là giả. Mở từng trang bằng trình duyệt; đổi giữa sáng/tối theo cài đặt máy.</div>
  <div class="xd-hub">
    <a href="bo-thanh-phan.html"><b>Bộ thành phần chung</b><span>Số lớn, ba phần, dòng dạng + bậc, thẻ câu, "máy đã lo", tiến bộ, bốn trạng thái. Cả ba app dùng lại.</span></a>
    <a href="hs-1a-da-cong-bo.html"><b>HS-1a · Sau khi nộp (đã công bố)</b><span>Điểm to, ba phần, bước tiếp theo, một nút chính.</span></a>
    <a href="hs-1b-cho-ca-lop.html"><b>HS-1b · Chờ cả lớp nộp</b><span>Đã nộp 27/32 em; không lộ điểm, đáp án.</span></a>
    <a href="hs-1c-chua-cong-bo.html"><b>HS-1c · Thầy chưa công bố</b><span>Nói thật, không doạ, không lộ gì.</span></a>
    <a href="hs-2-bao-cao-chi-tiet.html"><b>HS-2 · Báo cáo chi tiết</b><span>Một trang cuộn dọc + mục lục dính (thay 4 tab).</span></a>
    <a href="hs-3-danh-sach-ca.html"><b>HS-3 · Danh sách ca (tab Xem điểm)</b><span>Điểm 5 ca gần nhất + ca chưa có điểm + ca đã có điểm.</span></a>
    <a href="ph-1-bao-cao-phu-huynh.html"><b>PH-1 · Báo cáo cho phụ huynh</b><span>Tiếng thường, "Anh/chị có thể làm gì".</span></a>
    <a href="ph-2-danh-sach-ca.html"><b>PH-2 · Danh sách ca (phụ huynh)</b><span>Cùng khung với HS-3, giọng "con".</span></a>
    <a href="ban-in-a4.html"><b>Bản in A4</b><span>Hai trang, nền trắng, mực đen (PhieuScreen).</span></a>
  </div></main>` })

// ───────────────────────────── GHI TỆP ─────────────────────────────
for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
console.log(`đã ghi ${Object.keys(P).length} trang HTML vào ${AQUI}`)

// ───────────────────────────── CHỤP ẢNH (--anh) ─────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  const TRAN = 150 * 1024
  const browser = await chromium.launch()
  const CHI = process.argv.filter((a) => a.startsWith('--chi=')).map((a) => a.slice(6))
  let tong = 0
  for (const ten of Object.keys(P)) {
    if (ten === 'index' || (CHI.length && !CHI.includes(ten))) continue
    const cauHinh = ten === 'ban-in-a4' ? [[820, 900, false]] : [[390, 844, false], [390, 844, true], [1440, 900, false], [1440, 900, true]]
    for (const [w, h, toi] of cauHinh) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: 1 })
      const tr = await ctx.newPage()
      const loi = []
      tr.on('pageerror', (e) => loi.push(String(e)))
      await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort())
      await tr.goto('file://' + join(AQUI, `${ten}.html`), { waitUntil: 'load' })
      await tr.waitForTimeout(300)
      const kt = await tr.evaluate(() => ({ cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth }))
      // Nếu một tấm quá 150 KB ở chất lượng thấp nhất thì cắt đôi theo chiều cao (…-a, …-b).
      const chup = async (clip, tep) => {
        for (const q of [82, 72, 62, 52, 44, 36]) {
          const buf = await tr.screenshot({ type: 'jpeg', quality: q, clip, fullPage: true })
          if (buf.length <= TRAN) { writeFileSync(tep, buf); return buf.length }
        }
        return 0
      }
      const goc = `${ten}-${w === 820 ? 'a4' : w}${w === 820 ? '' : toi ? '-toi' : '-sang'}`
      let n = await chup({ x: 0, y: 0, width: w, height: kt.cao }, join(RA, `${goc}.jpg`))
      let ghi = `${goc}.jpg`
      if (!n) {
        const nua = Math.ceil(kt.cao / 2)
        const a = await chup({ x: 0, y: 0, width: w, height: nua }, join(RA, `${goc}-a.jpg`))
        const b = await chup({ x: 0, y: nua, width: w, height: kt.cao - nua }, join(RA, `${goc}-b.jpg`))
        n = a + b
        ghi = `${goc}-a/-b.jpg (cắt đôi)`
      }
      console.log(`${ghi.padEnd(52)} ${Math.round(n / 1024)} KB · cao ${kt.cao} · tràn ${kt.tran} · lỗi ${loi.length}`)
      tong += kt.tran > 0 || loi.length ? 1 : 0
      await ctx.close()
    }
  }
  await browser.close()
  console.log(tong ? `${tong} ảnh có tràn/lỗi` : 'sạch: 0 tràn ngang, 0 lỗi')
}
