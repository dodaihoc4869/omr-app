#!/usr/bin/env node
// DỰNG BẢN VẼ TỜ CHIẾU "MỨC LÀM 1–4" (21/10/2026): khung 12 = "Ai đã sai?" (phím X) có HAI THẺ — em đã điểm danh làm sai · cả lớp làm sai — mỗi thẻ chia theo Mức làm 1–4;
// khung 13 = bảng chi tiết em đang được gọi lên bảng, hiện ĐỦ Mức làm 1–4. Thầy dặn 21/10: hiện đủ trên màn chiếu, KHÔNG có câu "chỉ thầy thấy".
//   node scripts/dung-ban-ve-chieu-muc-lam-2110.mjs && node scripts/chup-ban-ve-chieu-muc-lam-2110.mjs
// Số trên bản vẽ là số GIẢ (tên giả), mọi con số hiện ra đều TÍNH từ bảng dữ liệu ở đầu tệp này (không gõ tay). Ngưỡng Mức làm theo đặc tả: T_đọc, sàn nghĩ, 0,8 × thời gian thường.
// Màu: đúng bảng màu tờ chiếu đã duyệt 20/10 (xanh theo độ đậm cho Mức làm 1→4; đúng/sai giữ xanh lá/đỏ của tờ). Chưa sửa src/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const GOC = resolve(import.meta.dirname, '..')
const THU_MUC = join(GOC, 'docs/ban-ve-chieu-muc-lam-2110')
mkdirSync(THU_MUC, { recursive: true })
const fonts = readFileSync(join(GOC, 'docs/ban-ve-tu-sua-2010/tu-sua.html'), 'utf8').split('\n').filter((l) => l.startsWith('@font-face')).join('\n')
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ───────────────────────── Ngưỡng của câu đang chiếu (Câu 12 · phần I · 46 từ, không hình)
const T_DOC = 24, SAN = 6
const THUONG = 75 // thời gian thường của lớp (β thật) ⇒ Mức làm 4 từ 0,8 × 75 = 60 giây
const TOP = Math.round(0.8 * THUONG)
const mucTheoGiay = (g, top = TOP) => (g < T_DOC ? 1 : g < T_DOC + SAN ? 2 : top != null && g >= top ? 4 : 3)
const TEN_MUC = { 1: 'Chưa đọc hết đề', 2: 'Đọc xong, chưa kịp nghĩ', 3: 'Có nghĩ', 4: 'Làm kỹ' }

// ───────────────────────── Dữ liệu giả — lớp 12 Tinh Hoa: sĩ số 34, có mặt 28
const SI_SO = 34, CO_MAT = 28
// [tên, có mặt, [giây, nơi, ngày, giờ, cũ?]...]; "cũ" = lượt làm bằng đồng hồ cũ ⇒ chưa có số đo (không đoán mức)
const EM = [
  ['Phạm Quốc Huy', 1, [[9, 'BTVN', '26/10', '18:30'], [6, 'Luyện theo dạng', '24/10', '20:12', 1]]],
  ['Lê Thu Hà', 1, [[11, 'BTVN', '26/10', '18:48'], [24, 'Tự sửa lỗi', '25/10', '19:08']]],
  ['Vũ Minh Quân', 1, [[14, 'BTVN', '26/10', '18:57'], [21, 'Luyện theo dạng', '24/10', '20:31', 1]]],
  ['Đỗ Khánh Linh', 1, [[17, 'BTVN', '26/10', '19:06'], [19, 'Luyện theo dạng', '24/10', '21:44', 1]]],
  ['Bùi Tuấn Kiệt', 1, [[31, 'BTVN', '26/10', '19:33'], [38, 'Tự sửa lỗi', '25/10', '19:40']]],
  ['Mai Hồng Nhung', 1, [[36, 'BTVN', '26/10', '20:45'], [33, 'Luyện theo dạng', '24/10', '21:20', 1]]],
  ['Lương Tuệ Minh', 1, [[61, 'BTVN', '26/10', '21:03'], [70, 'Luyện theo dạng', '25/10', '21:05']]],
  ['Tô Gia Hân', 1, [[58, 'BTVN', '26/10', '21:12'], [49, 'Tự sửa lỗi', '25/10', '20:03']]],
  ['Nguyễn Đức Anh', 1, [[7, 'BTVN', '26/10', '19:21']]],
  ['Trần Bảo Châu', 1, [[27, 'BTVN', '26/10', '19:40']]],
  ['Hoàng Minh Khôi', 1, [[44, 'BTVN', '26/10', '20:10']]],
  ['Đặng Thu Trang', 1, [[66, 'BTVN', '26/10', '20:58']]],
  ['Ngô Quang Vinh', 0, [[12, 'BTVN', '26/10', '22:05']]],
  ['Phan Diệp Chi', 0, [[25, 'BTVN', '26/10', '21:48']]],
  ['Võ Hải Đăng', 0, [[40, 'Luyện theo dạng', '23/10', '20:02', 1]]],
  ['Lý Mỹ Duyên', 0, [[8, 'BTVN', '26/10', '19:55']]],
  ['Dương Gia Bảo', 0, [[34, 'BTVN', '26/10', '21:30']]],
  ['Hồ Khánh Vy', 0, [[45, 'Tự sửa lỗi', '24/10', '18:15', 1, 1]]], // lượt cũ có giây ƯỚC TÍNH (≈)
  ['Trịnh Công Sơn', 0, [[15, 'BTVN', '26/10', '22:20']]],
]
const lopTu = (ds, top = TOP) => ds.flatMap(([ten, coMat, ls]) => ls.map(([giay, noi, ngay, gio, cu, uoc]) => ({ ten, coMat: !!coMat, giay, noi, ngay, gio, cu: !!cu, uoc: !!uoc, muc: cu ? 0 : mucTheoGiay(giay, top) })))

// Trường hợp đông: câu khó — 27/34 em làm sai, nhiều lượt (để thử "0 bị cắt" và chế độ 4 cột)
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Võ']
const LOT = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thu', 'Gia', 'Khánh', 'Hải', 'Mỹ', 'Bảo', 'Tuệ', 'Diệp', 'Công', 'Đức']
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Khoa', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Thảo', 'Uyên', 'Vy', 'Yến', 'Trang', 'Long', 'Nhi']
let hat = 7
const ngau = (n) => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat % n }
const EM_DONG = Array.from({ length: 27 }, (_, i) => {
  const ten = `${HO[(i * 7 + 3) % HO.length]} ${LOT[(i * 5 + 1) % LOT.length]} ${TEN[(i * 3 + 2) % TEN.length]}`
  const soLuot = 1 + (ngau(3) === 0 ? 2 : ngau(2))
  const ls = Array.from({ length: soLuot }, (_, k) => {
    const g = 4 + ngau(85)
    const cu = ngau(7) === 0
    return [g, ['BTVN', 'Luyện theo dạng', 'Tự sửa lỗi'][ngau(3)], `${24 + ngau(3)}/10`, `${18 + ngau(5)}:${String(ngau(6) * 10).padStart(2, '0')}`, cu ? 1 : 0]
  })
  return [ten, i < 22 ? 1 : 0, ls]
})

// ───────────────────────── Bộ phận dùng chung
const pip = (n) => `<span class="pip" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i${k <= n ? ' class="b"' : ''}></i>`).join('')}</span>`
/** Tên viết tắt chữ đệm khi pill không đủ chỗ ("Nguyễn Đức Anh" ⇒ "Nguyễn Đ. Anh"): họ và tên luôn đủ chữ. */
const tenNgan = (ten) => { const w = String(ten).trim().split(/\s+/); return w.length < 3 ? w.join(' ') : [w[0], ...w.slice(1, -1).map((x) => x[0] + '.'), w[w.length - 1]].join(' ') }

/** Một thẻ (đã điểm danh / cả lớp): số em · thanh 4 mức · các làn Mức làm 1–4 + làn "Chưa có số đo" với thẻ tên từng lượt. */
function the({ kieu, tieuDe, phu, luot, soEm, mau, top = TOP, cot: cotMoi, trangThai = 'co' }) {
  const cot = cotMoi ?? 3
  const dem = [0, 0, 0, 0, 0]
  luot.forEach((l) => { dem[l.muc]++ })
  const nEm = new Set(luot.map((l) => l.ten)).size
  const tongMuc = dem[1] + dem[2] + dem[3] + dem[4]
  const lan = (m, ten, khoang) => {
    const ds = luot.filter((l) => l.muc === m).sort((a, b) => a.giay - b.giay || a.ten.localeCompare(b.ten, 'vi'))
    const cua = (l) => `<li class="pl" data-m="${m}">${kieu === 'lop' && !l.coMat ? '<i class="vg" title="vắng"></i>' : ''}<b data-t="${e(tenNgan(l.ten))}">${e(l.ten)}</b><u>${l.giay} giây</u></li>`
    if (!ds.length) return `<section class="ln ln-rong" data-m="${m}"><header>${pip(m)}<b>Mức làm ${m}</b><span>${ten} · ${khoang}</span><em>0 lượt</em></header></section>`
    return `<section class="ln" data-m="${m}"><header>${pip(m)}<b>Mức làm ${m}</b><span>${ten} · ${khoang}</span><em>${ds.length} lượt</em></header><ul class="pls" style="--cot:${cot}">${ds.map(cua).join('')}</ul></section>`
  }
  const chua = luot.filter((l) => l.muc === 0).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
  const lanChua = chua.length
    ? `<section class="ln ln-chua"><header><b>Chưa có số đo</b><span>Lượt làm trước khi máy em dùng đồng hồ mới</span><em>${chua.length} lượt</em></header><ul class="pls" style="--cot:${cot}">${chua.map((l) => `<li class="pl pl-chua">${kieu === 'lop' && !l.coMat ? '<i class="vg" title="vắng"></i>' : ''}<b data-t="${e(tenNgan(l.ten))}">${e(l.ten)}</b><u>${l.uoc ? '≈ ' : ''}${l.giay} giây</u></li>`).join('')}</ul></section>`
    : ''
  const tren = dem.slice(1).map((n, i) => (n ? `<i data-m="${i + 1}" style="flex:${n}">${pip(i + 1)}<b>${n}</b></i>` : '')).join('')
  const thanh = tongMuc ? `<div class="tn" role="img" aria-label="${dem.slice(1).map((n, i) => `Mức làm ${i + 1}: ${n} lượt`).join('; ')}">${tren}${chua.length ? `<i data-m="0" style="flex:${chua.length}"><b>${chua.length}</b></i>` : ''}</div>`
    : (chua.length ? `<div class="tn" role="img" aria-label="${chua.length} lượt chưa có số đo"><i data-m="0" style="flex:1"><b>${chua.length}</b></i></div>` : '')
  const bieuTuong = kieu === 'dd'
    ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
    : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.2 1.7 4.5 4.3"/></svg>'
  if (trangThai === 'chua-diem-danh') {
    return `<article class="the-ai" data-k="${kieu}"><header class="th-dau"><span class="th-ky">${bieuTuong}${tieuDe}</span></header>
      <div class="th-rong"><b>Buổi này chưa điểm danh</b><p>Thẻ này chỉ hiện những em đã có mặt. Điểm danh bằng mã hoặc ghi tay ở bước Điểm danh, rồi bấm X lần nữa.</p></div></article>`
  }
  return `<article class="the-ai${cot > 3 ? ' dense' : ''}" data-k="${kieu}"><header class="th-dau"><span class="th-ky">${bieuTuong}${tieuDe}</span><span class="th-phu">${phu}</span></header>
    <div class="th-so"><p class="th-em"><b>${nEm}</b><span>/ ${soEm} em ${kieu === 'dd' ? 'có mặt' : 'của lớp'} làm sai</span></p><p class="th-luot"><b>${luot.length}</b><span>lượt sai</span></p></div>
    ${thanh}
    <div class="th-lan">${[1, 2, 3].map((m) => lan(m, TEN_MUC[m], m === 1 ? `dưới ${T_DOC} giây` : m === 2 ? `${T_DOC}–${T_DOC + SAN - 1} giây` : (top != null ? `${T_DOC + SAN}–${top - 1} giây` : `từ ${T_DOC + SAN} giây`))).join('')}${top != null ? lan(4, TEN_MUC[4], `từ ${top} giây`) : `<section class="ln ln-rong" data-m="4"><header>${pip(4)}<b>Mức làm 4</b><span>Lớp chưa đủ mẫu của câu này để xếp Mức làm 4</span></header></section>`}${lanChua}</div>
  </article>`
}

function khungAiSai({ ten, ds, soDd, soLop, top = TOP, dd = 'co', cot: cotMoi, ghiChu = '' }) {
  const luot = lopTu(ds, top)
  const cot = cotMoi ?? (luot.length > 28 ? 4 : 3) // cùng số cột cho cả hai thẻ (thẻ "cả lớp" đông hơn quyết định)
  const lopA = luot.filter((l) => l.coMat)
  return `<section class="kh" id="k-${ten}" hidden>
  <div class="to-sau" aria-hidden="true"><b>Câu 12</b><span>Pin điện hóa</span></div>
  <aside class="ai">
    <button class="dong" aria-label="Đóng">×</button>
    <header class="ai-dau"><div><span class="ai-ke">CÂU 12 · AI ĐÃ SAI?</span><h2>Học sinh làm sai câu này</h2></div>
      <p class="ai-thuoc"><span>Đọc hết đề cần</span><b>${T_DOC} giây</b><span>Nghĩ từ ${T_DOC + SAN} giây</span></p></header>
    <div class="ai-hai">
      ${the({ kieu: 'dd', tieuDe: 'ĐÃ ĐIỂM DANH', phu: 'Em có mặt buổi này, làm sai câu này', luot: lopA, soEm: soDd, top, cot, trangThai: dd === 'co' ? 'co' : 'chua-diem-danh' })}
      ${the({ kieu: 'lop', tieuDe: 'CẢ LỚP', phu: 'Mọi em của lớp làm sai câu này · <i class="vg vg-g"></i> em vắng buổi này', luot, soEm: soLop, top, cot })}
    </div>
    <footer class="ai-chan"><span>${ghiChu || `Mức làm xếp theo số giây làm của từng lượt so với thời gian đọc hết đề (${T_DOC} giây) và sàn nghĩ (${SAN} giây).`}</span><span class="ai-esc"><kbd>Esc</kbd> đóng</span></footer>
  </aside></section>`
}

// ───────────────────────── KHUNG 13 · chi tiết em được gọi lên bảng
const LAN_EM = [
  { ngay: '24/10', gio: '20:12', dung: false, chon: 'B', noi: 'Luyện theo dạng', giay: 22, cu: true },
  { ngay: '25/10', gio: '19:08', dung: true, chon: 'A', noi: 'Tự sửa lỗi', giay: 18 },
  { ngay: '26/10', gio: '18:48', dung: false, chon: 'C', noi: 'BTVN', giay: 11 },
  { ngay: '27/10', gio: '08:42', dung: false, chon: 'B', noi: 'Lên bảng', giay: 41 },
]
function thuocEm(g, top = TOP) {
  const max = 100, p = (x) => Math.min(100, (100 * x) / max)
  const vung = [[0, T_DOC, 1], [T_DOC, T_DOC + SAN, 2], [T_DOC + SAN, top ?? max, 3], ...(top != null ? [[top, max, 4]] : [])]
  return `<div class="th" role="img" aria-label="${g} giây; đọc hết đề cần ${T_DOC} giây">
    <div class="th-z">${vung.map(([a, b, m]) => `<i data-m="${m}" style="left:${p(a)}%;width:${p(b) - p(a)}%"></i>`).join('')}<u style="left:${p(T_DOC)}%"></u><b style="left:${p(g)}%"></b></div>
    <div class="th-moc"><span style="left:0">0</span><span style="left:${p(T_DOC)}%">${T_DOC}</span><span style="left:${p(T_DOC + SAN)}%">${T_DOC + SAN}</span>${top != null ? `<span style="left:${p(top)}%">${top}</span>` : ''}<span class="th-cuoi" style="left:100%">${max} giây</span></div></div>`
}
function khungEm({ ten, lan, tong14, top = TOP, chuaCo = false }) {
  const ls = lan.map((l) => ({ ...l, muc: l.cu || chuaCo ? 0 : mucTheoGiay(l.giay, top) }))
  const cuoi = ls[ls.length - 1]
  const dung = ls.filter((l) => l.dung).length, sai = ls.length - dung
  const dongLan = (l) => {
    const chip = l.muc ? `<span class="ch" data-m="${l.muc}">${pip(l.muc)}<b>Mức làm ${l.muc}</b></span>` : '<span class="ch ch-chua"><b>Chưa có số đo</b></span>'
    const ghi = l.muc === 1 && l.dung ? '<p class="ln-ghi">Đúng · nộp sau ' + l.giay + ' giây, trước khi đọc hết đề (' + T_DOC + ' giây).</p>' : l.muc === 0 ? `<p class="ln-ghi">Làm bằng đồng hồ cũ${l.giay ? `: ${l.giay} giây` : ''} — chưa xếp mức.</p>` : `<p class="ln-ghi">${TEN_MUC[l.muc]} · ${l.giay} giây, đọc hết đề cần ${T_DOC} giây.</p>`
    return `<li class="lan ${l.dung ? 'd' : 's'}"><div class="lan-t"><span class="kq">${l.dung ? 'Đúng' : 'Sai'}</span><b>${l.ngay} · ${l.gio}</b><span class="ng">${l.noi}</span><span class="chon">chọn <b>${l.chon}</b></span>${chip}</div>${l.muc ? thuocEm(l.giay, top) : ''}${ghi}</li>`
  }
  // tổng 14 ngày
  const bang = tong14
  const sum = (a) => a.reduce((x, y) => x + y, 0)
  const dem = bang.theo.map((r) => r[0] + r[1])
  const cheo = bang.theo.map((r, i) => `<li data-m="${i + 1}"><span>${pip(i + 1)}<b>Mức làm ${i + 1}</b><small>${TEN_MUC[i + 1]}</small></span><i class="so">${r[0]}</i><i class="so sai">${r[1]}</i></li>`).join('')
  const dungD = sum(bang.theo.map((r) => r[0])), saiD = sum(bang.theo.map((r) => r[1]))
  const voi = bang.theo[0][1] + bang.theo[1][1], nghi = bang.theo[2][1] + bang.theo[3][1]
  return `<section class="kh" id="k-${ten}" hidden>
  <div class="to-sau" aria-hidden="true"><b>Câu 12</b><span>Pin điện hóa</span></div>
  <aside class="ct"><button class="dong" aria-label="Đóng">×</button>
    <header class="ct-dau"><div class="ct-anh" aria-hidden="true"><svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="26" r="13" fill="rgb(255,210,122)"/><path d="M12 56c2-14 10-20 20-20s18 6 20 20z" fill="rgb(142,202,230)"/></svg></div>
      <div><h2>Lê Thu Hà</h2><p class="ct-chips"><span class="chip">Lớp 12 - Tinh Hoa</span><span class="chip">1.280 EXP · hôm nay +40</span><span class="chip">Chuỗi 5 ngày liền</span><span class="chip">Đang được gọi lên bảng · Câu 12</span></p>
      <div class="exp"><div class="exp-d"><b>Cấp 14</b><span>320 / 500 EXP</span></div><div class="exp-r"><i style="width:64%"></i></div></div></div></header>
    <div class="ct-hero">
      <section class="ct-the ct-nay"><h4>Em làm câu này thế nào · Câu 12</h4>
        <div class="kpi"><p><b>${ls.length}</b><span>lần làm</span></p><p class="k-d"><b>${dung}</b><span>đúng</span></p><p class="k-s"><b>${sai}</b><span>sai</span></p></div>
        ${cuoi.muc ? `<div class="gan"><p class="gan-t">Lần gần nhất · ${cuoi.ngay} ${cuoi.gio} · ${cuoi.dung ? 'đúng' : 'sai'}</p>
          <p class="gan-so"><b>${cuoi.giay}</b><span>giây em làm</span><i></i><b>${T_DOC}</b><span>giây đọc hết đề cần</span></p>
          ${thuocEm(cuoi.giay, top)}
          <p class="gan-nhan"><span class="ch ch-lon" data-m="${cuoi.muc}">${pip(cuoi.muc)}<b>Mức làm ${cuoi.muc}</b><span>${TEN_MUC[cuoi.muc]}</span></span></p>
          <p class="gan-gt">Đọc hết đề cần ${T_DOC} giây, rồi cần thêm ít nhất ${SAN} giây để nghĩ${top != null ? `. Thời gian thường của lớp ở câu này: ${THUONG} giây.` : '. Lớp chưa đủ mẫu của câu này nên chưa có thời gian thường.'}</p>
          <ul class="cg"><li data-m="1"><i></i>Dưới ${T_DOC} giây: chưa đọc hết đề</li><li data-m="2"><i></i>${T_DOC}–${T_DOC + SAN - 1} giây: đọc xong, chưa kịp nghĩ</li><li data-m="3"><i></i>${T_DOC + SAN}–${(top ?? 100) - 1} giây: có nghĩ</li><li data-m="4"><i></i>${top != null ? `Từ ${top} giây: làm kỹ` : 'Lớp chưa đủ mẫu để xếp Mức làm 4'}</li></ul></div>`
          : `<div class="gan gan-chua"><p class="gan-t">Lần gần nhất · ${cuoi.ngay} ${cuoi.gio} · ${cuoi.dung ? 'đúng' : 'sai'}</p><p class="chua-d"><span class="ch ch-chua ch-lon"><b>Chưa có số đo</b></span></p><p>Lượt này làm trước khi máy em dùng đồng hồ mới nên chưa xếp được Mức làm. Từ lần làm tới, mức hiện ở đây.</p></div>`}
      </section>
      <section class="ct-the"><h4>Các lần làm câu này</h4><ul class="lan-ds">${ls.slice().reverse().map(dongLan).join('')}</ul></section>
    </div>
    <div class="ct-luoi">
      <section class="ct-the ct-cach"><h4>Cách làm bài 14 ngày</h4>
        <p class="do">Đo được <b>${bang.do}</b>/<b>${bang.tong}</b> lượt${bang.tong - bang.do ? ` · ${bang.tong - bang.do} lượt chưa có số đo` : ''}.</p>
        ${bang.do ? `<div class="tn tn-s" role="img" aria-label="Lượt theo Mức làm">${dem.map((n, i) => (n ? `<i data-m="${i + 1}" style="flex:${n}"><b>${n}</b></i>` : '')).join('')}</div>
        <ul class="cheo"><li class="cheo-d"><span></span><i>Đúng</i><i>Sai</i></li>${cheo}<li class="cheo-t"><span>Cộng</span><i class="so">${dungD}</i><i class="so">${saiD}</i></li></ul>
        <p class="ket"><b>${voi}</b> lượt sai khi làm vội (Mức làm 1–2) · <b>${nghi}</b> lượt sai dù đã nghĩ (Mức làm 3–4)</p>` : '<p class="rong">Chưa lượt nào của em có số đo mức. Mức làm hiện ra từ khi máy em dùng đồng hồ mới.</p>'}
      </section>
      <section class="ct-the"><h4>Chiến dịch đang theo</h4><p class="cd-t">Hành trình Hóa 12 · tuần 4</p><div class="vong"><span><b>62%</b>cọ xát</span><span><b>31%</b>thành thạo</span></div><p><span class="chip chip-v">Đúng nhịp</span> làm đủ mức cần mỗi ngày</p></section>
      <section class="ct-the"><h4>Đúng / sai 14 ngày</h4><svg class="bd" viewBox="0 0 300 100" preserveAspectRatio="none">${Array.from({ length: 14 }, (_, i) => { const d = [4, 6, 2, 8, 5, 0, 3, 7, 6, 4, 9, 5, 3, 6][i], s = [1, 2, 0, 3, 1, 0, 2, 1, 2, 1, 3, 1, 1, 2][i]; const k = 6.5; return `<rect x="${i * 21.4 + 4}" y="${84 - d * k}" width="14" height="${d * k}" rx="2" fill="rgb(76,179,95)"/><rect x="${i * 21.4 + 4}" y="${84 - d * k - s * k}" width="14" height="${s * k}" rx="2" fill="rgb(229,83,75)"/>` }).join('')}</svg><p class="cg2"><span><i style="background:rgb(76,179,95)"></i>Đúng 64</span><span><i style="background:rgb(229,83,75)"></i>Sai 21</span><span>Tỉ lệ đúng 75%</span></p></section>
      <section class="ct-the"><h4>Sức học theo dạng (30 ngày)</h4><div class="nhiet"><p><span>Pin điện hóa</span><i><u style="width:58%"></u></i><b>58%</b></p><p><span>Điện phân</span><i><u style="width:41%"></u></i><b>41%</b></p><p><span>Đại cương kim loại</span><i><u style="width:88%"></u></i><b>88%</b></p></div></section>
      <section class="ct-the"><h4>5 câu sai gần nhất</h4><ul class="dg"><li><b>Câu 12</b><span>Pin điện hóa</span><span>26/10</span></li><li><b>Câu 21</b><span>Điện phân</span><span>25/10</span></li><li><b>Câu 8</b><span>Pin điện hóa</span><span>25/10</span></li></ul></section>
      <section class="ct-the"><h4>Lịch sử lên bảng</h4><ul class="dg"><li><b>20/10</b><span>Câu 9</span><span class="kq-d">Đạt</span></li><li><b>13/10</b><span>Câu 14</span><span class="kq-s">Chưa đạt</span></li></ul></section>
      <section class="ct-the"><h4>Ca kiểm tra gần nhất</h4><p class="diem"><b>7,5</b><small> /10</small></p><p class="ca"><b>Kiểm tra tuần 3</b><br>nộp 25/10 · lần trước 6,8</p></section>
    </div>
    <footer class="ct-chan"><span>Bảng này hiện trên máy chiếu — cả lớp cùng thấy. Giờ Việt Nam.</span><span><kbd>Esc</kbd> đóng</span></footer>
  </aside></section>`
}

// ───────────────────────── CSS (đúng ngôn ngữ tờ chiếu: nền tối, chữ trắng, xanh theo độ đậm cho Mức làm)
const CSS = `
:root { --u: min(1vw, 1.777778vh); --r: rgb(134, 182, 239); --nen: rgb(15, 18, 30); --mat: rgb(26, 28, 40); --chu: #fff; --chu2: rgb(195, 194, 183);
  --m0: rgb(120, 126, 142);
  --m1: color-mix(in srgb, var(--r) 36%, var(--mat)); --m2: color-mix(in srgb, var(--r) 56%, var(--mat)); --m3: color-mix(in srgb, var(--r) 78%, var(--mat)); --m4: var(--r);
  --dung: rgb(76, 179, 95); --sai: rgb(229, 83, 75); --vang: rgb(255, 210, 122); }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: rgb(10, 12, 18); font-family: 'Be Vietnam Pro', 'Noto Sans', system-ui, sans-serif; color: var(--chu); -webkit-font-smoothing: antialiased; }
.kh { position: relative; height: 100vh; overflow: hidden; background: rgb(10, 12, 18); }
.kh[hidden] { display: none; }
.to-sau { position: absolute; inset: 0; padding: calc(var(--u) * 3); opacity: .22; }
.to-sau b { display: block; font-size: calc(var(--u) * 3.4); } .to-sau span { font-size: calc(var(--u) * 1.6); }
h2, p, ul, h4 { margin: 0; padding: 0; } ul { list-style: none; }
.dong { position: absolute; top: calc(var(--u) * 1.2); right: calc(var(--u) * 1.3); width: calc(var(--u) * 2.8); height: calc(var(--u) * 2.8); min-width: 44px; min-height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.1); color: #fff; font: inherit; font-size: calc(var(--u) * 1.5); cursor: pointer; }
kbd { display: inline-grid; place-items: center; min-width: 1.7em; padding: 0 .4em; border-radius: .4em; background: rgba(255,255,255,.14); font: inherit; font-weight: 800; }
.so { font-variant-numeric: tabular-nums; }

/* pip + chip Mức làm */
.pip { display: inline-flex; align-items: flex-end; gap: .14em; height: 1em; width: 1.1em; flex: none; }
.pip i { flex: 1; border-radius: 1px; background: rgba(255,255,255,.3); }
.pip i:nth-child(1) { height: 30%; } .pip i:nth-child(2) { height: 52%; } .pip i:nth-child(3) { height: 76%; } .pip i:nth-child(4) { height: 100%; }
.pip i.b { background: currentColor; }

/* ───── khung 12 · Ai đã sai? ───── */
.ai { position: absolute; top: 0; right: 0; bottom: 0; width: 94%; display: flex; flex-direction: column; gap: calc(var(--u) * 1); padding: calc(var(--u) * 1.5) calc(var(--u) * 2) calc(var(--u) * 1.1);
  background: radial-gradient(120% 70% at 100% 0%, rgba(57,135,229,.22), transparent 60%), radial-gradient(90% 60% at 0% 100%, rgba(213,81,129,.12), transparent 60%), var(--nen);
  border-left: 1px solid rgba(255,255,255,.14); box-shadow: -2em 0 4em rgba(0,0,0,.45); }
.ai-dau { display: flex; align-items: flex-end; justify-content: space-between; gap: calc(var(--u) * 2); padding-right: calc(var(--u) * 3.6); }
.ai-ke { display: inline-flex; align-items: center; gap: .5em; font-weight: 800; font-size: max(12px, calc(var(--u) * .85)); letter-spacing: .14em; color: var(--vang); }
.ai-ke::before { content: ""; width: .6em; height: .6em; border-radius: 50%; background: var(--sai); box-shadow: 0 0 0 .3em rgba(229,83,75,.25); }
.ai h2 { margin-top: .15em; font-weight: 900; font-size: max(22px, calc(var(--u) * 2.3)); line-height: 1.1; }
.ai-thuoc { display: flex; align-items: baseline; gap: .7em; font-size: max(12px, calc(var(--u) * .95)); color: var(--chu2); }
.ai-thuoc b { font-size: max(20px, calc(var(--u) * 2)); color: #fff; font-variant-numeric: tabular-nums; }
.ai-hai { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: calc(var(--u) * 1); }
.the-ai { min-height: 0; overflow-y: auto; scrollbar-width: none; display: flex; flex-direction: column; gap: calc(var(--u) * .7); padding: calc(var(--u) * .9) calc(var(--u) * 1.1); border-radius: calc(var(--u) * 1.1); background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.13); }
.the-ai[data-k='dd'] { border-color: color-mix(in srgb, var(--vang) 55%, transparent); background: linear-gradient(160deg, rgba(255,210,122,.09), rgba(255,255,255,.04)); }
.th-dau { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; }
.th-ky { display: inline-flex; align-items: center; gap: .5em; font-weight: 900; font-size: max(13px, calc(var(--u) * 1)); letter-spacing: .1em; }
.the-ai[data-k='dd'] .th-ky { color: var(--vang); }
.th-phu { font-size: max(11px, calc(var(--u) * .82)); color: rgba(255,255,255,.68); font-weight: 600; text-align: right; }
.vg-g { display: inline-block; width: .6em; height: .6em; margin: 0 .2em; border: 2px solid rgba(255,255,255,.8); border-radius: 50%; vertical-align: baseline; }
.th-so { display: flex; align-items: baseline; gap: calc(var(--u) * 1.6); }
.th-so p { display: flex; align-items: baseline; gap: .4em; } .th-so b { font-size: max(28px, calc(var(--u) * 3)); line-height: 1; font-weight: 900; font-variant-numeric: tabular-nums; }
.th-so span { font-size: max(12px, calc(var(--u) * .95)); font-weight: 700; color: rgba(255,255,255,.78); }
.th-luot { margin-left: auto; } .th-luot b { font-size: max(22px, calc(var(--u) * 2.2)); color: var(--vang); }
/* thanh chồng 4 mức */
.tn { display: flex; gap: 3px; height: max(calc(var(--u) * 1.7), 20px); }
.tn > i { position: relative; display: flex; align-items: center; justify-content: center; min-width: 3.4em; border-radius: 99px; background: var(--m1); color: #fff; font-style: normal; }
.tn > i[data-m='2'] { background: var(--m2); color: #fff; } .tn > i[data-m='3'] { background: var(--m3); color: var(--nen); } .tn > i[data-m='4'] { background: var(--m4); color: var(--nen); }
.tn > i[data-m='0'] { background: transparent; border: 2px dashed var(--m0); color: rgba(255,255,255,.85); }
.tn > i { gap: .35em; } .tn .pip { font-size: calc(var(--u) * .95); } .tn > i[data-m='3'] .pip, .tn > i[data-m='4'] .pip { color: var(--nen); } .tn b { font-size: max(12px, calc(var(--u) * .9)); font-variant-numeric: tabular-nums; }
.tn-s { height: max(calc(var(--u) * 1.5), 18px); }
/* làn Mức làm */
.th-lan { display: flex; flex-direction: column; gap: calc(var(--u) * .45); }
.ln { display: flex; flex-direction: column; gap: calc(var(--u) * .35); padding: calc(var(--u) * .45) calc(var(--u) * .7) calc(var(--u) * .5); border-radius: calc(var(--u) * .8); background: rgba(0,0,0,.22); border-left: calc(var(--u) * .3) solid var(--mm, var(--m0)); }
.ln[data-m='1'] { --mm: var(--m1); } .ln[data-m='2'] { --mm: var(--m2); } .ln[data-m='3'] { --mm: var(--m3); } .ln[data-m='4'] { --mm: var(--m4); }
.ln header { display: flex; align-items: center; gap: .6em; font-size: max(12px, calc(var(--u) * .9)); }
.ln header .pip { font-size: calc(var(--u) * 1.1); color: color-mix(in srgb, var(--mm, #fff) 100%, #fff 25%); }
.ln header b { font-weight: 900; } .ln header span { color: rgba(255,255,255,.72); font-weight: 600; } .ln header em { margin-left: auto; font-style: normal; font-weight: 800; font-variant-numeric: tabular-nums; }
.ln-rong { padding-block: calc(var(--u) * .35); opacity: .6; } .ln-rong header em { display: none; }
.ln-chua { border-left: calc(var(--u) * .3) dashed var(--m0); background: transparent; border-top: 1px dashed rgba(255,255,255,.2); border-right: 1px dashed rgba(255,255,255,.2); border-bottom: 1px dashed rgba(255,255,255,.2); }
.pls { display: grid; grid-template-columns: repeat(var(--cot, 3), minmax(0, 1fr)); gap: calc(var(--u) * .35); }
.pl { display: flex; align-items: baseline; gap: .5em; min-width: 0; padding: calc(var(--u) * .3) calc(var(--u) * .7); border-radius: 99px; background: color-mix(in srgb, var(--mm) 26%, transparent); border: 1px solid color-mix(in srgb, var(--mm) 60%, transparent); font-size: max(12px, calc(var(--u) * .92)); }
.pl[data-m='1'] { --mm: var(--m1); } .pl[data-m='2'] { --mm: var(--m2); } .pl[data-m='3'] { --mm: var(--m3); } .pl[data-m='4'] { --mm: var(--m4); }
.pl-chua { background: transparent; border: 1px dashed rgba(255,255,255,.35); }
.pl b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 800; }
.pl .vg { flex: none; align-self: center; width: .62em; height: .62em; margin-left: -.15em; border: 2px solid rgba(255,255,255,.8); border-radius: 50%; }
.dense .pl { font-size: max(11.5px, calc(var(--u) * .82)); padding-inline: calc(var(--u) * .5); gap: .35em; }
.pl u { text-decoration: none; font-weight: 800; color: var(--vang); font-variant-numeric: tabular-nums; white-space: nowrap; }
.th-rong { display: grid; place-content: center; text-align: center; gap: .5em; flex: 1; padding: calc(var(--u) * 2); border: 2px dashed rgba(255,255,255,.22); border-radius: calc(var(--u) * 1); color: rgba(255,255,255,.8); }
.th-rong b { font-size: max(16px, calc(var(--u) * 1.4)); color: var(--vang); } .th-rong p { max-width: 24em; margin-inline: auto; font-size: max(12px, calc(var(--u) * .95)); line-height: 1.5; }
.ai-chan { display: flex; justify-content: space-between; gap: 2em; font-size: max(11px, calc(var(--u) * .8)); color: rgba(255,255,255,.6); }

/* ───── khung 13 · chi tiết em ───── */
.ct { position: absolute; top: 0; right: 0; bottom: 0; width: 88%; display: flex; flex-direction: column; gap: calc(var(--u) * .75); padding: calc(var(--u) * 1) calc(var(--u) * 1.3) calc(var(--u) * .6);
  background: rgba(19,23,36,.96); border-left: 1px solid rgba(255,255,255,.12); font-size: max(12px, calc(var(--u) * .85)); line-height: 1.4; color: rgb(238,241,248); box-shadow: -2em 0 4em rgba(0,0,0,.45); }
.ct-dau { display: grid; grid-template-columns: calc(var(--u) * 5.4) minmax(0, 1fr); gap: calc(var(--u) * 1.2); align-items: center; padding-right: calc(var(--u) * 3.2); }
.ct-anh { width: calc(var(--u) * 5.4); height: calc(var(--u) * 5.4); border-radius: 28%; background: radial-gradient(circle at 50% 38%, rgba(255,220,150,.45), rgba(255,255,255,.04) 70%); border: 1px solid rgba(255,255,255,.12); padding: 12%; }
.ct-dau h2 { font-size: calc(var(--u) * 1.9); font-weight: 800; line-height: 1.1; }
.ct-chips { display: flex; flex-wrap: wrap; gap: .5em; margin: .3em 0 0; }
.chip { display: inline-flex; align-items: center; border-radius: 2em; padding: .12em .7em; background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.1); font-weight: 600; white-space: nowrap; font-size: .95em; }
.chip-v { background: rgba(53,182,164,.22); border-color: rgba(53,182,164,.5); }
.exp { margin-top: calc(var(--u) * .45); max-width: calc(var(--u) * 28); } .exp-d { display: flex; justify-content: space-between; font-weight: 700; font-size: .95em; } .exp-d span { color: rgb(154,163,184); }
.exp-r { height: calc(var(--u) * .5); border-radius: 1em; background: rgba(255,255,255,.1); overflow: hidden; margin-top: .25em; } .exp-r i { display: block; height: 100%; background: var(--vang); }
.ct-hero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: calc(var(--u) * .8); min-height: 0; flex: none; }
.ct-the { min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: calc(var(--u) * .45); padding: calc(var(--u) * .7) calc(var(--u) * .9); border-radius: calc(var(--u) * .9); background: rgba(255,255,255,.065); border: 1px solid rgba(255,255,255,.12); }
.ct-the h4 { font-size: .82em; letter-spacing: .05em; text-transform: uppercase; font-weight: 800; color: rgb(201,208,224); }
.ct-nay { background: linear-gradient(135deg, rgba(255,210,122,.14), rgba(255,255,255,.05)); border-color: rgba(255,210,122,.35); } .ct-nay h4 { color: var(--vang); }
.kpi { display: flex; gap: calc(var(--u) * 1.6); align-items: baseline; } .kpi p { display: flex; align-items: baseline; gap: .35em; }
.kpi b { font-size: calc(var(--u) * 2.4); line-height: 1; font-weight: 800; font-variant-numeric: tabular-nums; } .kpi span { color: rgb(170,178,197); font-weight: 600; }
.kpi .k-d b { color: rgb(155,227,168); } .kpi .k-s b { color: rgb(255,170,163); }
.gan { display: flex; flex-direction: column; gap: calc(var(--u) * .4); }
.gan-t { font-weight: 700; color: rgb(201,208,224); }
.gan-so { display: flex; align-items: baseline; gap: .45em; flex-wrap: wrap; } .gan-so b { font-size: calc(var(--u) * 2.2); line-height: 1; font-weight: 800; font-variant-numeric: tabular-nums; } .gan-so span { color: rgb(170,178,197); } .gan-so i { width: 1px; height: 1.6em; background: rgba(255,255,255,.25); margin: 0 .6em; align-self: center; }
.gan-gt { color: rgb(210,216,232); }
.gan-chua p { color: rgb(201,208,224); } .chua-d { margin-block: .2em; }
.ch { display: inline-flex; align-items: center; gap: .45em; padding: .15em .7em .15em .5em; border-radius: 99px; background: color-mix(in srgb, var(--mc, var(--m1)) 40%, transparent); border: 1px solid color-mix(in srgb, var(--mc, var(--m1)) 80%, #fff 10%); font-weight: 800; white-space: nowrap; font-size: .95em; color: #fff; }
.ch[data-m='1'] { --mc: var(--m1); } .ch[data-m='2'] { --mc: var(--m2); } .ch[data-m='3'] { --mc: var(--m3); } .ch[data-m='4'] { --mc: var(--m4); }
.ch .pip { font-size: 1.05em; }
.ch-chua { background: transparent; border: 1px dashed rgba(255,255,255,.45); padding-left: .8em; color: rgba(255,255,255,.88); }
.ch-lon { font-size: calc(var(--u) * 1.15); padding: .25em .9em .25em .6em; } .ch-lon > span:last-child { font-weight: 600; opacity: .9; }
.gan-nhan { margin-top: .1em; }
.cg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .25em .9em; color: rgb(201,208,224); font-size: .92em; } .cg li { display: flex; align-items: center; gap: .5em; } .cg i { width: .8em; height: .8em; border-radius: 50%; background: var(--m0); flex: none; }
.cg li[data-m='1'] i { background: var(--m1); } .cg li[data-m='2'] i { background: var(--m2); } .cg li[data-m='3'] i { background: var(--m3); } .cg li[data-m='4'] i { background: var(--m4); }
/* thước giây */
.th { position: relative; padding-top: .2em; }
.th-z { position: relative; height: calc(var(--u) * 1.1); border-radius: 99px; overflow: visible; }
.th-z i { position: absolute; top: 0; bottom: 0; background: var(--m1); }
.th-z i[data-m='1'] { background: var(--m1); border-radius: 99px 0 0 99px; } .th-z i[data-m='2'] { background: var(--m2); } .th-z i[data-m='3'] { background: var(--m3); } .th-z i[data-m='4'] { background: var(--m4); border-radius: 0 99px 99px 0; }
.th-z u { position: absolute; top: -.3em; bottom: -.3em; width: 3px; margin-left: -1.5px; background: #fff; border-radius: 2px; }
.th-z b { position: absolute; top: 50%; width: calc(var(--u) * 1.5); height: calc(var(--u) * 1.5); margin: calc(var(--u) * -.75) 0 0 calc(var(--u) * -.75); border-radius: 50%; background: #fff; border: 3px solid var(--nen); box-shadow: 0 0 0 2px #fff; }
.th-moc { position: relative; height: 1.5em; margin-top: .35em; font-size: .85em; color: rgb(170,178,197); font-variant-numeric: tabular-nums; } .th-moc span { position: absolute; transform: translateX(-50%); white-space: nowrap; } .th-moc .th-cuoi { transform: translateX(-100%); }
/* các lần làm */
.lan-ds { display: flex; flex-direction: column; gap: calc(var(--u) * .4); overflow: auto; scrollbar-width: none; }
.lan { padding: calc(var(--u) * .45) calc(var(--u) * .7); border-radius: calc(var(--u) * .6); background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-left: .35em solid var(--sai); display: flex; flex-direction: column; gap: .15em; }
.lan.d { border-left-color: var(--dung); }
.lan-t { display: flex; align-items: center; gap: .55em; flex-wrap: wrap; } .lan-t b { font-weight: 700; }
.kq { font-weight: 800; padding: 0 .6em; border-radius: 1em; font-size: .9em; } .lan.d .kq { background: rgba(76,179,95,.3); color: rgb(184,240,194); } .lan.s .kq { background: rgba(229,83,75,.3); color: rgb(255,196,191); }
.ng { font-size: .85em; font-weight: 700; border-radius: 1em; padding: 0 .55em; background: rgba(142,202,230,.2); border: 1px solid rgba(142,202,230,.4); } .chon { color: rgb(170,178,197); } .chon b { color: #fff; }
.lan .ch { margin-left: auto; font-size: .9em; } .lan .th { margin-block: .1em; } .lan .th-z { height: calc(var(--u) * .7); } .lan .th-z b { width: calc(var(--u) * 1); height: calc(var(--u) * 1); margin: calc(var(--u) * -.5) 0 0 calc(var(--u) * -.5); border-width: 2px; } .lan .th-moc { display: none; }
.ln-ghi { color: rgb(190,198,216); font-size: .9em; }
/* lưới dưới */
.ct-luoi { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: calc(var(--u) * .7); }
.ct-cach { grid-row: span 2; }
.do { color: rgb(201,208,224); } .do b { color: #fff; }
.cheo { display: flex; flex-direction: column; font-variant-numeric: tabular-nums; } .cheo li { display: grid; grid-template-columns: minmax(0, 1fr) 3.2em 3.2em; align-items: center; gap: .3em; padding: .3em .2em; border-top: 1px solid rgba(255,255,255,.1); }
.cheo li > span { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: .5em; align-items: center; } .cheo li > span .pip { grid-row: span 2; } .cheo li > span b { font-weight: 800; white-space: nowrap; } .cheo small { color: rgba(255,255,255,.62); font-size: .85em; line-height: 1.2; } .cheo i { font-style: normal; text-align: right; font-weight: 800; } .cheo .sai { color: rgb(255,170,163); }
.cheo li[data-m] .pip { font-size: 1.1em; } .cheo li[data-m='1'] .pip { color: var(--m1); filter: brightness(1.7); } .cheo li[data-m='2'] .pip { color: var(--m2); filter: brightness(1.4); } .cheo li[data-m='3'] .pip { color: var(--m3); } .cheo li[data-m='4'] .pip { color: var(--m4); }
.cheo-d { border-top: 0 !important; color: rgba(255,255,255,.6); font-weight: 700; } .cheo-t { font-weight: 800; background: rgba(255,255,255,.05); border-radius: .5em; }
.ket { color: rgb(220,226,240); line-height: 1.45; } .ket b { color: var(--vang); } .rong { color: rgb(170,178,197); }
.cd-t { font-weight: 700; } .vong { display: flex; gap: 1.2em; } .vong span { display: flex; flex-direction: column; color: rgb(170,178,197); } .vong b { font-size: calc(var(--u) * 1.8); color: #fff; line-height: 1.1; }
.bd { width: 100%; height: calc(var(--u) * 5.4); } .cg2 { display: flex; flex-wrap: wrap; gap: .3em 1em; color: rgb(201,208,224); font-size: .9em; } .cg2 i { display: inline-block; width: .7em; height: .7em; border-radius: 2px; margin-right: .35em; }
.nhiet { display: flex; flex-direction: column; gap: .4em; } .nhiet p { display: grid; grid-template-columns: 38% minmax(0, 1fr) 2.8em; gap: .5em; align-items: center; } .nhiet i { height: .6em; border-radius: 1em; background: rgba(255,255,255,.1); overflow: hidden; } .nhiet u { display: block; height: 100%; background: rgb(142,202,230); } .nhiet b { text-align: right; }
.dg { display: flex; flex-direction: column; gap: .3em; } .dg li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: .6em; } .dg li span:nth-child(2) { color: rgb(170,178,197); } .kq-d { color: rgb(155,227,168); font-weight: 800; } .kq-s { color: rgb(255,170,163); font-weight: 800; }
.diem b { font-size: calc(var(--u) * 2.6); font-weight: 800; line-height: 1; } .diem small { color: rgb(170,178,197); } .ca { color: rgb(201,208,224); } .ca b { color: #fff; }
.ct-chan { display: flex; justify-content: space-between; font-size: .9em; color: rgba(255,255,255,.6); }
/* màn thấp (≤ 800 px cao, vd 1280×720): gọn lại — đặt CUỐI tệp để thắng các luật cùng độ ưu tiên ở trên */
@media (max-height: 800px) { .pl { padding-block: 2px; } .cheo small, .cg { display: none; } .th-so b { font-size: 24px; } .th-luot b { font-size: 20px; } .the-ai { gap: calc(var(--u) * .45); padding-block: calc(var(--u) * .6); } .ln header { font-size: 12px; } .tn { height: 18px; } .ct-cach { gap: calc(var(--u) * .3); } .ct-cach .do { font-size: .9em; } .ct-cach .ket { font-size: .9em; line-height: 1.3; } .tn-s { height: 16px; } .ct { width: 90%; } .ct-dau { grid-template-columns: calc(var(--u) * 4.6) minmax(0, 1fr); } .ct-anh { width: calc(var(--u) * 4.6); height: calc(var(--u) * 4.6); } .cheo li { padding-block: .15em; } .ln { padding-block: calc(var(--u) * .3); } .pls { gap: calc(var(--u) * .25); } .th-lan { gap: calc(var(--u) * .3); } .ct-the { padding-block: calc(var(--u) * .5); } }
`

// ───────────────────────── Ghép
const sumT = (a) => a.reduce((x, y) => x + y, 0)
const KHUNG = [
  khungAiSai({ ten: 'ai-sai', ds: EM, soDd: CO_MAT, soLop: SI_SO }),
  khungAiSai({ ten: 'ai-sai-dong', ds: EM_DONG, soDd: CO_MAT, soLop: SI_SO }),
  // Những ngày đầu: gần như mọi lượt chưa có số đo mức; câu chưa đủ mẫu β ⇒ không xếp Mức làm 4
  khungAiSai({
    ten: 'ai-sai-dau',
    ds: EM.map(([t, c, ls]) => [t, c, ls.map((l, i) => (i === 0 && ['Phạm Quốc Huy', 'Lê Thu Hà', 'Bùi Tuấn Kiệt'].includes(t) ? l : [l[0], l[1], l[2], l[3], 1, l[5]]))]),
    soDd: CO_MAT, soLop: SI_SO, top: null,
    ghiChu: 'Mức làm có từ khi máy em dùng đồng hồ mới. Lượt làm trước đó chưa có số đo — không đoán mức.',
  }),
  khungAiSai({ ten: 'ai-sai-chua-dd', ds: EM, soDd: CO_MAT, soLop: SI_SO, dd: 'chua' }),
  khungEm({ ten: 'em', lan: LAN_EM, tong14: { theo: [[1, 5], [3, 6], [26, 5], [10, 2]], do: 58, tong: 71 } }),
  khungEm({ ten: 'em-chua-do', lan: LAN_EM.map((l) => ({ ...l, cu: true })), tong14: { theo: [[0, 0], [0, 0], [0, 0], [0, 0]], do: 0, tong: 71 }, top: null }),
]
const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bản vẽ tờ chiếu Mức làm</title>
<style>
${fonts}
${CSS}
</style></head><body>
${KHUNG.join('\n')}
<script>
(() => { const k = new URLSearchParams(location.hash.slice(1)).get('k'); const ds = [...document.querySelectorAll('.kh')];
  if (!k) { ds.forEach((s) => { s.hidden = false }); return } const m = ds.find((s) => s.id === 'k-' + k); if (m) m.hidden = false
  // Pill không đủ chỗ cho tên đầy đủ ⇒ viết tắt chữ đệm (thật: làm trong tờ chiếu sau khi vẽ xong, và khi đổi cỡ cửa sổ).
  const vua = () => document.querySelectorAll('.pl b').forEach((b) => { b.textContent = b.dataset.full || (b.dataset.full = b.textContent) && b.textContent; b.textContent = b.dataset.full; if (b.scrollWidth > b.clientWidth + 1) b.textContent = b.dataset.t })
  document.fonts.ready.then(vua) })()
</script></body></html>`
writeFileSync(join(THU_MUC, 'chieu.html'), html)
console.log(`ĐÃ DỰNG docs/ban-ve-chieu-muc-lam-2110/chieu.html · ${(html.length / 1024).toFixed(0)} KB · ${KHUNG.length} khung · sumT=${sumT([1])}`)
