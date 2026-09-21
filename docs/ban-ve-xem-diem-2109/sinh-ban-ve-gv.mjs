#!/usr/bin/env node
// SINH BẢN VẼ GIÁO VIÊN cho "XEM ĐIỂM + BÁO CÁO CHI TIẾT" bản 2 (Code 4, 21/09/2026) — đề bài `prompt-xem-diem-bao-cao-v2.md` mục 3: GV-1 chi tiết ca · GV-2 báo cáo một em trong ca · GV-3 lịch sử ca.
//   node docs/ban-ve-xem-diem-2109/sinh-ban-ve-gv.mjs          ghi 3 trang HTML tĩnh tự chứa vào thư mục này
//   node docs/ban-ve-xem-diem-2109/sinh-ban-ve-gv.mjs --anh    thêm: chụp Chromium 390 + 1440, sáng + tối, JPG ≤ 150 KB vào ./anh/
// DÙNG LẠI ĐÚNG bộ thành phần chung của Code 2 (`sinh-ban-ve.mjs`: C.ketQua, C.phan, C.dang, C.cau, C.bieuDo, C.tienBo, C.thanhTren, C.mucLuc, C.hop…) — không vẽ bản thứ hai:
// mã của bộ đó được cắt ra từ tệp gốc và chạy lại ở đây, nên sửa bộ chung là hai bên cùng đổi. Chỉ thêm phần RIÊNG của giáo viên (phổ điểm, bảng em, dạng cả lớp vấp…) bằng CÙNG lớp `xd-*` + token.
// Chỉ dữ liệu GIẢ (tên giả). Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md: "Ca kiểm tra", "A.I Đỗ Đại Học đã lo", "Ester", giờ 24, không emoji, không "nắm chắc".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')

// ── nạp bộ thành phần chung của Code 2 (cắt từ `const AQUI` đến trước `const P = {}`) ──
const nguon = readFileSync(join(AQUI, 'sinh-ban-ve.mjs'), 'utf8')
const dau = nguon.indexOf('const AQUI = ')
const cuoi = nguon.indexOf('const P = {}')
if (dau < 0 || cuoi < 0) throw new Error('Không tìm thấy vùng bộ thành phần trong sinh-ban-ve.mjs')
const mao = nguon.slice(dau, cuoi).replace('const AQUI = dirname(fileURLToPath(import.meta.url))', `const AQUI = ${JSON.stringify(AQUI)}`)
const nap = new Function('readFileSync', 'join', 'dirname', 'fileURLToPath', `${mao}\nreturn { C, ic, trang, so, D, BAC, CAU_MAU }`)
const { C, ic, trang, so, D, CAU_MAU } = nap(readFileSync, join, dirname, fileURLToPath)

// ── giọng GIÁO VIÊN: bộ chung viết cho "em"/"con"; ở đây nói về MỘT em cụ thể và gọi hệ thống tự động đúng tên (thầy lệnh 21/09) ──
const giongGV = (h) =>
  h
    .replaceAll('Em làm đúng', 'Làm đúng')
    .replaceAll('so với lần trước của em', 'so với lần trước của em ấy')
    .replaceAll('Em vừa lên bậc', 'Vừa lên bậc')
    .replaceAll('<b>Em chọn</b>', '<b>Em ấy chọn</b>')
    .replaceAll('Em làm ', 'Làm ')
    .replaceAll('Máy đã xếp câu này', 'A.I Đỗ Đại Học đã xếp câu này')
    .replaceAll('Điểm các ca gần đây của em', 'Điểm các ca gần đây của em ấy')
    .replaceAll('chỉ so với chính em', 'chỉ so với chính em ấy')
    .replaceAll('3 dạng bài em tiến bộ nhất', '3 dạng bài em ấy tiến bộ nhất')
    .replaceAll('Bậc của em ở mỗi dạng', 'Bậc của em ấy ở mỗi dạng')
    .replaceAll('Dạng em còn vấp', 'Dạng em ấy còn vấp')

const LOP = '12 - Tinh Hoa'
const CA = { ten: 'Kiểm tra 45 phút · Ester – lipid', ma: '784817', ngay: 'Thứ Bảy 19/09/2026', nopDen: '09:30' }
const LOPSO = { si: 42, nop: 40, tb: 6.8, cao: 9.5, thap: 3.25, phut: 31 }
const EM = { ten: 'Nguyễn Minh Anh', sbd: '12121007', diem: 7.5, truoc: 6.75, dung: 21, tong: 28, hang: 9 }

const ROI = (h) => h // giữ chỗ: mọi đoạn HTML riêng của GV đều đi qua đây cho dễ soát

// ───────────────────────────── phần RIÊNG của giáo viên ─────────────────────────────
const G = {}

/** Bốn số của lớp + tiến độ nộp + trạng thái công bố. */
G.tongQuan = () => `<section class="xd-the gv-tq" aria-labelledby="t-tq">
  <div class="gv-tq__dau"><h2 id="t-tq">Cả lớp ${LOP}</h2>${C.chipCongBo('ok')}</div>
  <dl class="gv-so">
    <div><dt>Đã nộp bài</dt><dd class="xd-so">${LOPSO.nop}<small>/${LOPSO.si} em</small></dd></div>
    <div><dt>Điểm trung bình</dt><dd class="xd-so">${so(LOPSO.tb)}<small>trên 10</small></dd></div>
    <div><dt>Cao nhất · thấp nhất</dt><dd class="xd-so">${so(LOPSO.cao)}<small>· ${so(LOPSO.thap)}</small></dd></div>
    <div><dt>Thời gian làm trung bình</dt><dd class="xd-so">${LOPSO.phut}<small>phút (đề cho 45 phút)</small></dd></div>
  </dl>
  <div class="xd-tien-do"><div class="xd-tien-do__thanh" role="progressbar" aria-label="Số em đã nộp" aria-valuemin="0" aria-valuemax="${LOPSO.si}" aria-valuenow="${LOPSO.nop}"><i style="width:${(LOPSO.nop / LOPSO.si) * 100}%"></i></div><div class="xd-tien-do__nhan xd-so"><span>Còn ${LOPSO.si - LOPSO.nop} em chưa nộp</span><span>Ca đóng lúc ${CA.nopDen}</span></div></div>
</section>`

/** Phổ điểm: số em theo từng khoảng điểm (cùng kiểu cột `xd-cot` của bộ chung). */
G.phoDiem = () => {
  const bin = [['0–2', 0], ['2–4', 2], ['4–5', 3], ['5–6', 6], ['6–7', 9], ['7–8', 10], ['8–9', 6], ['9–10', 4]]
  const max = Math.max(...bin.map((b) => b[1]))
  return `<section class="xd-the" aria-labelledby="h-pho"><div class="xd-muc__dau"><h2 id="h-pho">Phổ điểm của lớp</h2><p>Số em ở mỗi khoảng điểm</p></div>
  <div class="xd-cot gv-cot" role="img" aria-label="Phổ điểm: ${bin.map(([n, v]) => `từ ${n} điểm có ${v} em`).join(', ')}">${bin.map(([n, v]) => `<div><small>${v}</small><i style="height:${Math.max(4, Math.round((v / max) * 96))}px"></i><small style="color:var(--m3-on-surface-variant);font-weight:600">${n}</small></div>`).join('')}</div>
  <p class="xd-muc__mo-ta" style="margin-top:8px">Điểm trên 10 · ${LOPSO.nop} em đã nộp. Nhiều em nhất ở khoảng 7–8 điểm.</p></section>`
}

/** Điểm trung bình của lớp theo ba phần (thanh + điểm, dùng lại C.phan không mở câu). */
G.baPhanLop = () => `<div class="xd-phan-ds">${[
  { ma: 'I', ten: 'Phần I · Trắc nghiệm', dung: 12.6, tong: 18, diem: 3.6, toiDa: 4.5, o: [] },
  { ma: 'II', ten: 'Phần II · Đúng–sai', dung: 1.8, tong: 4, diem: 2.1, toiDa: 4, o: [] },
  { ma: 'III', ten: 'Phần III · Trả lời ngắn', dung: 3.9, tong: 6, diem: 1.1, toiDa: 1.5, o: [] },
].map((p) => C.phan({ ...p, dung: Math.round(p.dung) }, { chiTiet: false }).replace(/đúng (?:trọn )?(\d+)\/(\d+) câu/g, 'trung bình đúng $1/$2 câu')).join('')}</div>`

/** Dạng cả lớp đang vấp (cùng khung `xd-dang`, đo bằng tỉ lệ đúng của CẢ LỚP). */
G.dangLop = () => {
  const ds = [['Xà phòng hoá chất béo', 41, 25], ['Bài toán hỗn hợp ester', 47, 21], ['Phản ứng thuỷ phân ester', 61, 15], ['Chỉ số chất béo', 66, 12], ['Phản ứng ester hoá (điều chế ester)', 72, 9]]
  return `<ul class="xd-dang-ds">${ds.map(([t, p, n], i) => `<li class="xd-dang${i < 2 ? ' xd-dang--vap' : ''}"><div class="xd-dang__ten"><span>${t}</span>${i < 2 ? '<span class="xd-chip xd-chip--cho">Cả lớp còn vấp</span>' : ''}</div>
    <div class="xd-dang__hang"><span class="xd-dang__dem">Cả lớp đúng <b>${p}%</b> số câu · <b>${n}/${LOPSO.nop}</b> em sai ít nhất một câu</span></div></li>`).join('')}</ul>`
}

/** Câu cả lớp sai nhiều nhất: dùng lại thẻ `xd-cau`, thêm số em sai + đáp án em chọn nhiều nhất (GV thấy cả đáp án và lời giải). */
G.cauSaiNhieu = () => {
  const ds = [
    { c: CAU_MAU[1], sai: 27, chon: 'Được 1,84 g (12 em quên làm tròn đến một chữ số thập phân)', tl: 68 },
    { c: CAU_MAU[0], sai: 22, chon: 'Chọn C · 9,8 g — nhầm khối lượng mol của sodium acetate (9 em)', tl: 55 },
    { c: { ...CAU_MAU[0], id: 'II-2', so: 2, phan: 'Phần II · Đúng–sai', dang: 'Chỉ số chất béo', de: 'Ý c) Chỉ số xà phòng hoá của một chất béo luôn lớn hơn chỉ số axit của nó.', em: 'Chọn Sai (cả lớp: 19 em)', dapAn: 'Đúng' }, sai: 19, chon: 'Chọn Sai (19 em)', tl: 48 },
  ]
  return ds
    .map(({ c, sai, chon, tl }) => giongGV(C.cau({ ...c, loai: 'sai' }, { cb: true })).replace('<span class="xd-chip xd-chip--luu-y">', `<span class="xd-chip xd-chip--luu-y xd-so">Sai ${sai}/${LOPSO.nop} em (${tl}%)</span><span class="xd-sr">`).replace('</span></div>\n    <p class="xd-cau__de">', `</span></div>\n    <p class="xd-cau__de">`).replace(/<div class="xd-tl xd-tl--em">.*?<\/div>/s, `<div class="xd-tl xd-tl--em"><b>Nhiều em chọn</b><span>${chon}</span></div>`).replace(/<div class="xd-cau__meta[\s\S]*?<\/div>\s*<p class="xd-cau__on">.*?<\/p>/, `<div class="xd-cau__meta xd-so"><span>${ic('dong-ho')}Làm trung bình 1 phút 40 giây</span></div>`))
    .join('')
}

/** Em cần để ý — lý do bằng SỐ; chạm ⇒ Toàn cảnh một em (dùng dòng `xd-ca`). */
G.emCanYY = () => `<ul class="xd-ca-ds">${[
  ['Vũ Đức Minh', 'Đúng 8/28 câu (29%) — điểm 3,25', 'sai'],
  ['Đỗ Hà My', 'Chưa nộp bài · ca đóng lúc 09:30', 'chua'],
  ['Ngô Tuấn Kiệt', 'Rời màn làm bài 4 lần, tổng 2 phút 10 giây', 'roi'],
  ['Hoàng Nhật Nam', 'Làm 28 câu trong 6 phút, đúng 9 câu', 'nhanh'],
  ['Bùi Khánh Linh', 'Điểm 5,25 — giảm 1,5 điểm so với lần trước của em ấy', 'giam'],
].map(([t, ly]) => `<li><a class="xd-ca xd-ca--khoa" href="#"><div class="xd-ca__ten-o"><h3 class="xd-ca__ten">${t}</h3><p class="xd-ca__ngay">${LOP}</p></div><div class="xd-ca__diem"><div><b style="font-size:var(--bnv-cx-2)">Toàn cảnh</b><small>một em</small></div>${ic('phai', true)}</div><div class="xd-ca__chi"><span class="xd-chip xd-chip--cho xd-so">${ly}</span></div></a></li>`).join('')}</ul>`

/** Bảng em trong ca: bảng thật ở máy tính, thẻ ở điện thoại (cùng dữ liệu). */
const BANG = [
  ['Trần Gia Hân', 9.5, 27, 28, '27 phút', '+0,75', 'ok'], ['Lê Quốc Bảo', 9, 26, 28, '30 phút', '+1', 'ok'], ['Phạm Thu Trang', 8.75, 25, 28, '33 phút', '+0,25', 'ok'], ['Nguyễn Minh Anh', 7.5, 21, 28, '32 phút', '+0,75', 'ok'],
  ['Đặng Bảo Ngọc', 7.25, 21, 28, '35 phút', '−0,25', 'ok'], ['Ngô Tuấn Kiệt', 6.5, 19, 28, '41 phút', '+0,5', 'ok'], ['Bùi Khánh Linh', 5.25, 15, 28, '37 phút', '−1,5', 'ok'], ['Hoàng Nhật Nam', 4.25, 9, 28, '6 phút', '−0,5', 'ok'],
  ['Vũ Đức Minh', 3.25, 8, 28, '29 phút', '−0,75', 'ok'], ['Đỗ Hà My', null, null, 28, '—', '—', 'chua'],
]
G.bangEm = () => `<section class="xd-muc" id="bang-em" aria-labelledby="h-be"><div class="xd-muc__dau"><h2 id="h-be">Từng em trong ca</h2><p>${LOPSO.si} em · chạm tên để xem báo cáo</p></div>
  <div class="gv-loc" role="group" aria-label="Lọc danh sách em"><button type="button" class="gv-chip" aria-pressed="true">Tất cả ${LOPSO.si}</button><button type="button" class="gv-chip" aria-pressed="false">Cần để ý 5</button><button type="button" class="gv-chip" aria-pressed="false">Chưa nộp 2</button>
  <label class="gv-tim"><span class="xd-sr">Tìm em theo tên hoặc số báo danh</span><input type="search" placeholder="Tìm em theo tên hoặc số báo danh"></label></div>
  <div class="xd-the gv-bang-o"><table class="gv-bang"><caption class="xd-sr">Điểm từng em trong ca, xếp từ cao xuống thấp</caption><thead><tr><th scope="col">Tên em</th><th scope="col" class="s">Điểm</th><th scope="col" class="s">Đúng</th><th scope="col" class="s">Thời gian làm</th><th scope="col" class="s">So với lần trước của em ấy</th><th scope="col">Trạng thái</th></tr></thead><tbody>
  ${BANG.map(([t, d, du, tg, tm, ss, tt]) => `<tr${t === EM.ten ? ' aria-current="true"' : ''}><th scope="row"><a href="gv-2-bao-cao-mot-em.html">${t}</a></th><td class="s xd-so">${d === null ? '—' : so(d)}</td><td class="s xd-so">${du === null ? '—' : `${du}/${tg}`}</td><td class="s xd-so">${tm}</td><td class="s xd-so">${ss === '—' ? '—' : `<span class="xd-ss xd-ss--${ss.startsWith('+') ? 'len' : 'xuong'}">${ic(ss.startsWith('+') ? 'tang' : 'giam')}${ss}</span>`}</td><td>${tt === 'ok' ? '<span class="xd-chip xd-chip--ok">Đã nộp</span>' : '<span class="xd-chip xd-chip--cho">Chưa nộp</span>'}</td></tr>`).join('')}
  </tbody></table>
  <ul class="gv-the-em">${BANG.map(([t, d, du, tg, tm, ss, tt]) => `<li><a class="gv-em" href="gv-2-bao-cao-mot-em.html"><span class="gv-em__ten">${t}</span><span class="gv-em__diem xd-so">${d === null ? 'Chưa nộp' : `${so(d)}<small>/10</small>`}</span><span class="gv-em__phu xd-so">${du === null ? 'Chưa có bài nộp' : `Đúng ${du}/${tg} · ${tm}`}</span>${ss === '—' ? '' : `<span class="xd-ss xd-ss--${ss.startsWith('+') ? 'len' : 'xuong'}">${ic(ss.startsWith('+') ? 'tang' : 'giam')}${ss} so với lần trước</span>`}</a></li>`).join('')}</ul>
  <p class="gv-them"><a href="#">Xem thêm 32 em nữa</a></p></div></section>`

/** Thẻ "A.I Đỗ Đại Học đã lo" của giáo viên (luật Bộ não: chỉ nói điều CHẮC CHẮN xảy ra). */
G.aiDaLo = (muc, tieuDe = 'A.I Đỗ Đại Học đã lo phần sau ca này') => `<section class="xd-the xd-lo" aria-labelledby="t-lo"><h2 id="t-lo">${tieuDe}</h2>
  <ul class="xd-lo__ds">${muc.map(([i, t, s]) => `<li class="xd-lo__muc"><span class="xd-lo__o">${ic(i)}</span><p>${t}<small>${s}</small></p></li>`).join('')}</ul></section>`

// ───────────────────────────── CSS RIÊNG (chỉ token + biến của bộ chung) ─────────────────────────────
const CSS_GV = `
.gv-tq__dau { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.gv-tq__dau h2 { font-size: var(--bnv-cx-4); font-weight: 700; }
.gv-so { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0 0 16px; }
@media (min-width: 900px) { .gv-so { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.gv-so > div { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: var(--m3-bo-16); background: var(--m3-surface-container); }
.gv-so dt { font-size: var(--bnv-cx-1); font-weight: 600; color: var(--m3-on-surface-variant); }
.gv-so dd { margin: 0; font-size: 28px; line-height: 32px; font-weight: 700; color: var(--m3-primary); }
.gv-so dd small { margin-left: 6px; font-size: var(--bnv-cx-1); font-weight: 600; color: var(--m3-on-surface-variant); }
.gv-cot { height: 148px; }
.gv-loc { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.gv-chip { min-height: 48px; padding: 0 16px; border-radius: var(--m3-bo-tron); border: 1px solid var(--m3-outline); background: transparent; color: var(--m3-on-surface); font: inherit; font-size: var(--bnv-cx-2); font-weight: 600; }
.gv-chip[aria-pressed='true'] { background: var(--m3-secondary-container); border-color: transparent; color: var(--m3-on-secondary-container); }
.gv-tim { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; min-height: 48px; padding: 0 16px; border-radius: var(--m3-bo-tron); border: 1px solid var(--m3-outline); background: var(--m3-surface-container-lowest); color: var(--m3-on-surface-variant); }
.gv-tim input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--m3-on-surface); font: inherit; font-size: var(--bnv-cx-2); }
.gv-bang-o { padding: 0; overflow: hidden; }
.gv-bang { display: none; width: 100%; border-collapse: collapse; }
.gv-bang th, .gv-bang td { padding: 12px 16px; text-align: left; border-bottom: 1px solid color-mix(in srgb, var(--m3-outline) 24%, transparent); font-size: var(--bnv-cx-2); }
.gv-bang thead th { font-size: var(--bnv-cx-1); font-weight: 700; color: var(--m3-on-surface-variant); background: var(--m3-surface-container); }
.gv-bang .s { text-align: right; }
.gv-bang tbody th a { color: var(--m3-on-surface); font-weight: 600; text-decoration: none; }
.gv-bang tr[aria-current='true'] { background: color-mix(in srgb, var(--m3-primary-container) 40%, transparent); }
.gv-the-em { list-style: none; margin: 0; padding: 0; }
.gv-em { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; align-items: center; min-height: 64px; padding: 12px 16px; color: inherit; text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--m3-outline) 24%, transparent); }
.gv-em__ten { font-size: var(--bnv-cx-3); font-weight: 600; }
.gv-em__diem { grid-row: 1 / span 2; grid-column: 2; font-size: 26px; font-weight: 700; color: var(--m3-primary); text-align: right; }
.gv-em__diem small { font-size: var(--bnv-cx-1); color: var(--m3-on-surface-variant); margin-left: 2px; }
.gv-em__phu { font-size: var(--bnv-cx-1); color: var(--m3-on-surface-variant); }
.gv-em .xd-ss { grid-column: 1; }
.xd-the .gv-them { margin: 0; padding: 8px 16px 12px; }
.gv-them a { display: inline-flex; align-items: center; min-height: 48px; font-weight: 600; color: var(--m3-primary); text-decoration: none; }
@media (min-width: 900px) { .gv-bang { display: table; } .gv-the-em { display: none; } }
.gv-so-lop { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.gv-hai-nut { display: grid; gap: 8px; justify-items: stretch; }
@media (min-width: 720px) { .gv-hai-nut { grid-template-columns: 1fr auto; align-items: center; } }
.gv-so-sanh { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.gv-so-sanh > div { display: flex; flex-direction: column; gap: 2px; }
.gv-so-sanh b { font-size: 24px; color: var(--m3-primary); font-variant-numeric: tabular-nums; }
.gv-so-sanh span { font-size: var(--bnv-cx-1); color: var(--m3-on-surface-variant); }
.gv-nhom { display: grid; gap: 12px; }
.gv-ca-lop { display: flex; flex-direction: column; gap: 6px; }
.gv-loc-ngang { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
`

const NAV_GV = (id) => [['tong-quan', 'Cả lớp'], ['pho-diem', 'Phổ điểm'], ['theo-phan', 'Ba phần'], ['dang-vap', 'Dạng cả lớp vấp'], ['cau-sai', 'Câu sai nhiều nhất'], ['em-can-y', 'Em cần để ý'], ['bang-em', 'Từng em'], ['buoc-tiep', 'Bước tiếp theo']].map(([k, t]) => [k, t]).slice(0, id)
void NAV_GV

const P = {}

// GV-1 · chi tiết ca — tổng quan lớp + bảng em (một trang cuộn dọc + mục lục dính như HS-2)
P['gv-1-chi-tiet-ca'] = () =>
  trang({
    tieuDe: 'GV-1 · Chi tiết ca',
    them: CSS_GV,
    body: `${C.thanhTren('Chi tiết ca', `${CA.ten} · mã ${CA.ma}`, { quayLai: 'Về danh sách ca', phai: `<a class="xd-nut-tron" href="#" aria-label="In báo cáo cả lớp">${ic('in', true)}</a>` })}
<main class="xd-khung xd-khung--rong"><div class="xd-bao-cao">
  ${C.mucLuc([['tong-quan', 'Cả lớp'], ['pho-diem', 'Phổ điểm'], ['theo-phan', 'Ba phần'], ['dang-vap', 'Dạng cả lớp vấp'], ['cau-sai', 'Câu sai nhiều nhất'], ['em-can-y', 'Em cần để ý'], ['bang-em', 'Từng em'], ['buoc-tiep', 'Bước tiếp theo']], 0)}
  <div class="xd-bao-cao__noi-dung">
    <p class="xd-muc__mo-ta">${CA.ngay} · lớp ${LOP} · điểm đã công bố cho học sinh</p>
    <section class="xd-muc" id="tong-quan" aria-label="Cả lớp">${G.tongQuan()}</section>
    <section class="xd-muc" id="pho-diem" aria-label="Phổ điểm">${G.phoDiem()}</section>
    <section class="xd-muc" id="theo-phan" aria-labelledby="h-3p"><div class="xd-muc__dau"><h2 id="h-3p">Ba phần của bài (trung bình cả lớp)</h2></div>${G.baPhanLop()}</section>
    <section class="xd-muc" id="dang-vap" aria-labelledby="h-dv"><div class="xd-muc__dau"><h2 id="h-dv">Dạng cả lớp đang vấp</h2><p>5 dạng đúng ít nhất</p></div><p class="xd-muc__mo-ta">Tính trên số câu của dạng đó trong ca này, cả ${LOPSO.nop} em đã nộp. Đây là nguồn chọn dạng cho buổi chữa.</p>${G.dangLop()}</section>
    <section class="xd-muc" id="cau-sai" aria-labelledby="h-cs"><div class="xd-muc__dau"><h2 id="h-cs">Câu cả lớp sai nhiều nhất</h2><p>3 câu</p></div><div class="xd-cau-ds">${G.cauSaiNhieu()}</div></section>
    <section class="xd-muc" id="em-can-y" aria-labelledby="h-ey"><div class="xd-muc__dau"><h2 id="h-ey">Em cần thầy để ý</h2><p>5 em · lý do bằng số</p></div>${G.emCanYY()}</section>
    ${G.bangEm()}
    <section class="xd-muc" id="buoc-tiep" aria-label="Bước tiếp theo">${G.aiDaLo([
      ['on-lai', 'Đã xếp 312 câu sai vào lịch ôn lại của 40 em', 'Mỗi em ôn lại sau 1 ngày, 3 ngày và 7 ngày — không cần thầy nhắc'],
      ['lich', 'Đã chọn sẵn 4 dạng cho buổi chữa tối nay', 'Xà phòng hoá chất béo · Bài toán hỗn hợp ester · Phản ứng thuỷ phân ester · Chỉ số chất béo (đúng ít nhất, 12–25 em sai)'],
      ['muc-tieu', 'Bài tập về nhà tới ưu tiên dạng Xà phòng hoá chất béo cho 25 em', 'Chỉ giao cho em sai dạng này; em đã vững thì không phải làm lại'],
    ])}</section>
    <div class="gv-hai-nut"><a class="xd-nut xd-nut--chinh xd-nut--rong" href="#">${ic('lich')}Mở buổi chữa xếp sẵn</a><a class="xd-nut xd-nut--chu" href="#">Xem toàn cảnh 5 em cần để ý</a></div>
  </div></div></main>`,
  })

// GV-2 · báo cáo MỘT em trong ca (cùng bộ xương HS-2, thêm so sánh trong lớp — chỉ thầy thấy)
P['gv-2-bao-cao-mot-em'] = () =>
  trang({
    tieuDe: 'GV-2 · Báo cáo một em trong ca',
    them: CSS_GV,
    body: `${C.thanhTren(`Báo cáo · ${EM.ten}`, `${CA.ten} · ${LOP} · SBD ${EM.sbd}`, { quayLai: 'Về chi tiết ca', phai: `<a class="xd-nut-tron" href="#" aria-label="In báo cáo em này">${ic('in', true)}</a>` })}
<main class="xd-khung xd-khung--rong"><div class="xd-bao-cao">
  ${C.mucLuc([['ket-qua', 'Kết quả'], ['so-lop', 'So với lớp'], ['ba-phan', 'Ba phần'], ['theo-dang', 'Theo dạng bài'], ['cau-xem-lai', 'Câu cần xem lại'], ['buoc-tiep', 'Bước tiếp theo'], ['tien-bo', 'Tiến bộ']], 0)}
  <div class="xd-bao-cao__noi-dung">
    <section class="xd-muc" id="ket-qua" aria-label="Kết quả">${giongGV(C.ketQua({ ...D.ca, ss: EM.diem - EM.truoc, truoc: EM.truoc, nop: `Nộp lúc 09:12 · ${CA.ngay}` }))}</section>
    <section class="xd-muc" id="so-lop" aria-labelledby="h-sl"><div class="xd-muc__dau"><h2 id="h-sl">So với cả lớp</h2><p>Chỉ thầy thấy mục này</p></div>
      <div class="xd-the"><div class="gv-so-sanh"><div><b>${so(EM.diem)}</b><span>điểm của em ấy</span></div><div><b>${so(LOPSO.tb)}</b><span>trung bình cả lớp</span></div><div><b>+${so(EM.diem - LOPSO.tb)}</b><span>cao hơn trung bình lớp</span></div></div>
      <p class="xd-muc__mo-ta" style="margin-top:12px">Đứng thứ ${EM.hang} trong ${LOPSO.nop} em đã nộp. Ba dạng em ấy làm tốt hơn cả lớp: Danh pháp ester, Tính chất vật lí của lipid, Chỉ số chất béo.</p></div></section>
    <section class="xd-muc" id="ba-phan" aria-labelledby="h-3p"><div class="xd-muc__dau"><h2 id="h-3p">Ba phần của bài</h2><p>Chạm một phần để xem từng câu</p></div><div class="xd-phan-ds">${D.phan.map((p, i) => giongGV(C.phan(p, { mo: i === 0 }))).join('')}</div>${C.chuGiai(false)}</section>
    <section class="xd-muc" id="theo-dang" aria-labelledby="h-dang"><div class="xd-muc__dau"><h2 id="h-dang">Theo dạng bài</h2><p>8 dạng trong ca này</p></div>
      <p class="xd-muc__mo-ta">Bậc của em ấy ở mỗi dạng đi từ Biết, đến Hiểu, đến Vận dụng. Dạng em ấy còn vấp được xếp lên trên.</p>
      <ul class="xd-dang-ds">${D.dang.map((d) => giongGV(C.dang(d, { doc: 'em' }))).join('')}</ul></section>
    <section class="xd-muc" id="cau-xem-lai" aria-labelledby="h-cx"><div class="xd-muc__dau"><h2 id="h-cx">Câu cần xem lại</h2><p>3 câu · thầy xem cả đáp án và lời giải</p></div><div class="xd-cau-ds">${CAU_MAU.map((c) => giongGV(C.cau(c, { cb: true }))).join('')}</div></section>
    <section class="xd-muc" id="buoc-tiep" aria-label="Bước tiếp theo">${G.aiDaLo([
      ['lich', 'Bài tập về nhà tới của em ấy ưu tiên dạng Xà phòng hoá chất béo', 'Vì em ấy đúng 1/3 câu ở dạng này'],
      ['on-lai', 'Ngày mai (Chủ Nhật 20/09) em ấy ôn lại 5 câu đã làm sai', 'Lịch ôn lại sau 1 ngày, 3 ngày và 7 ngày'],
      ['sao', 'Đã cộng +18 EXP cho em ấy', 'Theo điểm ca và số câu đã khắc phục'],
    ], 'A.I Đỗ Đại Học đã lo cho em ấy')}</section>
    <section class="xd-muc" id="tien-bo" aria-label="Tiến bộ">${giongGV(C.tienBo({ doc: 'em' }))}</section>
    <div class="gv-hai-nut"><a class="xd-nut xd-nut--chinh xd-nut--rong" href="#">${ic('nguoi')}Xem toàn cảnh em này</a><a class="xd-nut xd-nut--chu" href="#">Giao bài riêng cho em này</a></div>
  </div></div></main>`,
  })

// GV-3 · lịch sử ca (danh sách ca của thầy)
const CA_LS = [
  ['Kiểm tra 45 phút · Ester – lipid', 'Thứ Bảy 19/09/2026 · 12 - Tinh Hoa', 'dong', 6.8, '40/42', 'ok'],
  ['Kiểm tra 45 phút · Ester – lipid', 'Thứ Bảy 19/09/2026 · 12 - Lớp Thường', 'dong', 6.1, '63/67', 'ok'],
  ['Kiểm tra 20 phút · Amin – amino axit', 'Thứ Sáu 18/09/2026 · 12 - Nhóm 10 điểm', 'dong', null, '13/15', 'lop'],
  ['Kiểm tra 10 phút · Polime', 'Thứ Năm 17/09/2026 · 11', 'mo', null, '52/91', 'khong'],
  ['Kiểm tra 60 phút · Ancol – phenol', 'Thứ Bảy 12/09/2026 · 12 - Tinh Hoa', 'dong', 6.5, '41/42', 'ok'],
  ['Kiểm tra 60 phút · Hiđrocacbon', 'Thứ Bảy 05/09/2026 · 12 - Tinh Hoa', 'dong', 6.3, '42/42', 'ok'],
]
P['gv-3-lich-su-ca'] = () =>
  trang({
    tieuDe: 'GV-3 · Lịch sử ca kiểm tra',
    them: CSS_GV,
    body: `${C.thanhTren('Ca kiểm tra', 'Lịch sử · 6 ca gần nhất', { quayLai: 'Về Hôm nay' })}
<main class="xd-khung xd-khung--rong"><div class="xd-bao-cao__noi-dung" style="max-width:920px;margin-inline:auto">
  <section class="xd-the xd-tong" aria-labelledby="t-tong"><div><h2 id="t-tong" style="font-size:var(--bnv-cx-3);font-weight:700">Điểm trung bình lớp 12 - Tinh Hoa</h2><p class="xd-tong__so"><b>6,5</b><span>trên 10 · 4 ca gần nhất đã công bố</span></p></div>
    <div class="xd-cot" role="img" aria-label="Điểm trung bình lớp qua 4 ca: 05/09 được 6,3; 12/09 được 6,5; 19/09 được 6,8; 26/09 chưa có">${[['05/09', 6.3], ['12/09', 6.5], ['19/09', 6.8]].map(([n, v]) => `<div><small>${so(v)}</small><i style="height:${v * 10}px"></i><small style="color:var(--m3-on-surface-variant);font-weight:600">${n}</small></div>`).join('')}</div></section>
  <div class="gv-loc" role="group" aria-label="Lọc ca"><button type="button" class="gv-chip" aria-pressed="true">Tất cả 6</button><button type="button" class="gv-chip" aria-pressed="false">Đang mở 1</button><button type="button" class="gv-chip" aria-pressed="false">Đã đóng 5</button><button type="button" class="gv-chip" aria-pressed="false">Đã xoá 0</button>
    <label class="gv-tim"><span class="xd-sr">Tìm ca theo tên, lớp hoặc mã</span><input type="search" placeholder="Tìm ca theo tên, lớp hoặc mã"></label></div>
  <p class="xd-nhom-ten">THÁNG 9/2026</p>
  <ul class="xd-ca-ds">${CA_LS.map(([t, n, tt, tb, nop, cb]) => `<li><a class="xd-ca${cb === 'ok' ? '' : ' xd-ca--khoa'}" href="gv-1-chi-tiet-ca.html"><div class="xd-ca__ten-o"><h3 class="xd-ca__ten">${t}</h3><p class="xd-ca__ngay">${n}</p></div><div class="xd-ca__diem"><div><b>${tb === null ? 'Chưa có' : so(tb)}</b><small>${tb === null ? 'điểm trung bình' : 'trung bình lớp'}</small></div>${ic('phai', true)}</div>
    <div class="xd-ca__chi">${tt === 'mo' ? '<span class="xd-chip xd-chip--cho">Đang mở</span>' : '<span class="xd-chip">Đã đóng</span>'}${C.chipCongBo(cb)}<span class="xd-chip xd-so">${ic('nguoi')}Đã nộp ${nop} em</span></div></a></li>`).join('')}</ul>
  <p class="xd-muc__mo-ta" style="text-align:center;margin-top:12px">Chạm một ca để xem chi tiết cả lớp; chạm tên em trong ca để xem báo cáo một em.</p>
  <section class="xd-muc" aria-label="Trạng thái khác" style="margin-top:24px"><div class="xd-muc__dau"><h2>Khi chưa có ca nào</h2></div><div class="xd-hop"><span class="xd-hop__o">${ic('tai-lieu', true)}</span><h3>Chưa có ca kiểm tra nào</h3><p>Khi thầy mở ca kiểm tra đầu tiên, ca và điểm của cả lớp hiện ở đây. Bấm "Mở ca kiểm tra" ở thanh bên để bắt đầu.</p></div></section>
</div></main>`,
  })

// ───────────────────────────── GHI TỆP ─────────────────────────────
for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
console.log(`đã ghi ${Object.keys(P).length} trang HTML giáo viên vào ${AQUI}`)

// ───────────────────────────── CHỤP ẢNH (--anh) ─────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  const TRAN = 150 * 1024
  const browser = await chromium.launch()
  let loiTong = 0
  for (const ten of Object.keys(P)) {
    for (const [w, h, toi] of [[390, 844, false], [390, 844, true], [1440, 900, false], [1440, 900, true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: 1 })
      const tr = await ctx.newPage()
      const loi = []
      tr.on('pageerror', (e) => loi.push(String(e)))
      await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort())
      await tr.goto('file://' + join(AQUI, `${ten}.html`), { waitUntil: 'load' })
      await tr.waitForTimeout(300)
      const kt = await tr.evaluate(() => ({ cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth }))
      const chup = async (clip, tep) => {
        for (const q of [82, 72, 62, 52, 44, 36]) {
          const buf = await tr.screenshot({ type: 'jpeg', quality: q, clip, fullPage: true })
          if (buf.length <= TRAN) {
            writeFileSync(tep, buf)
            return buf.length
          }
        }
        return 0
      }
      const goc = `${ten}-${w}${toi ? '-toi' : '-sang'}`
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
      loiTong += kt.tran > 0 || loi.length ? 1 : 0
      await ctx.close()
    }
  }
  await browser.close()
  console.log(loiTong ? `${loiTong} ảnh có tràn/lỗi` : 'sạch: 0 tràn ngang, 0 lỗi')
}
