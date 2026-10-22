#!/usr/bin/env node
// DỰNG BẢN VẼ "MỨC LÀM 6 MỨC" — phần Code app 2 (Đợt 2, thầy 22/10: "thêm 2 mức nữa là treo máy, cố tình treo máy … tối ưu giao diện đầy đủ trực quan dễ nhìn
// thân thiện hơn"). Đặc tả chung: docs/dac-ta-muc-lam-6-muc-2210.md · đặc tả phần này: docs/ban-ve-muc-lam-6-muc-2210/DAC-TA.md.
//   node scripts/dung-ban-ve-muc-lam-6-muc-2210.mjs && node scripts/chup-ban-ve-muc-lam-6-muc-2210.mjs
// Sinh hai tệp: `diem-danh.html` (bảng điểm danh của thầy — màu ĐÚNG biến --gvm-* nạp thẳng từ src/styles/tokens.css, sáng + tối) và `chieu.html` (tờ chiếu
// «Ai đã sai?» — bảng màu tờ chiếu đã duyệt 21/10, chỉ nền tối). Số trên bản vẽ là số GIẢ (tên giả); mọi con số hiện ra đều TÍNH từ bảng dữ liệu ở tệp này.
// CHƯA sửa src/ hay server/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const GOC = resolve(import.meta.dirname, '..')
const THU_MUC = join(GOC, 'docs/ban-ve-muc-lam-6-muc-2210')
mkdirSync(THU_MUC, { recursive: true })
const fonts = readFileSync(join(GOC, 'docs/ban-ve-tu-sua-2010/tu-sua.html'), 'utf8').split('\n').filter((l) => l.startsWith('@font-face')).join('\n')
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// ═════════════════════════ NGƯỠNG TẠM (đặc tả chung mục 4 + phần này mục 4) ═════════════════════════
/** Dấu hiệu "Sai khi làm vội" chỉ khi em có ít nhất ngần này lượt SAI có Mức làm 1–4 (ít hơn ⇒ "Ít lượt sai có số đo — chưa kết luận").
 *  Mức làm chỉ GIẢI THÍCH lượt SAI (lõi server/src/muc-lam.ts): lượt đúng ở Mức 1 là ghi chú riêng, không phải vội ⇒ dấu hiệu tính trên `saiLamVoi / (saiLamVoi + saiDuNghi)`
 *  — CÙNG số "x/y lượt sai là lúc làm vội" của hồ sơ em 14 ngày (`cachLam14`). */
const MAU_TOI_THIEU = 5
/** Tỉ lệ lượt sai ở Mức 1–2 trong lượt sai có Mức làm 1–4 để gắn "Sai khi làm vội". */
const TI_LE_VOI = 0.5
/** Số lượt Treo máy (Mức 5 + 6) trong 14 ngày để tô ô cột Treo máy (1 lượt có thể là em nghe điện thoại — chỉ hiện số, không tô). */
const TREO_GAN_CHIP = 2
const NGAY_DO_TREO = '23/10'

/** "Sai vì vội nhiều" (THUẦN — bản build đặt ở src/lib/muc-lam-lo-api.ts, test riêng): ≥ MAU_TOI_THIEU lượt sai có Mức làm 1–4 và tỉ lệ sai ở Mức 1–2 ≥ TI_LE_VOI.
 *  Treo / cố tình không phải "dấu hiệu" nữa: có CỘT riêng (Treo máy) và CỜ trên tên (Cố tình). */
function dauHieu(d) {
  if (!d || d.soDo === 0) return []
  const sai = d.saiVoi + d.saiNghi
  return sai >= MAU_TOI_THIEU && d.saiVoi / sai >= TI_LE_VOI ? [{ k: 'voi' }] : []
}

// ═════════════════════════ DỮ LIỆU GIẢ — 12 Nhóm 10 điểm, có mặt 30/38 ═════════════════════════
// [giờ, tên, nhóm, chữ chip nhóm, mức {m:[1..4], treo, coTinh (lượt), ngayCoTinh, chuaDoTreo, chuaCoSoDo, uoc}]
// `m` = lượt Mức làm 1–4 KHÔNG treo; `treo` = Mức 5; `coTinh` = Mức 6; `chuaDoTreo` = trong `m`, số lượt làm trước khi máy em đo treo máy (hợp đồng đề xuất, DAC-TA mục 4).
// `saiVoi` / `saiNghi` = lượt SAI ở Mức 1–2 / Mức 3–4 (≤ số lượt của các mức ấy) — mặc định ~45% lượt Mức 1–2 và ~30% lượt Mức 3–4 là sai.
const M = (m, treo = 0, coTinh = 0, ngayCoTinh = 0, chuaDoTreo = 0, chuaCoSoDo = 0, uoc = 0, sai = null) => ({ m, treo, coTinh, ngayCoTinh, chuaDoTreo, chuaCoSoDo, uoc,
  saiVoi: sai ? sai[0] : Math.round((m[0] + m[1]) * 0.45), saiNghi: sai ? sai[1] : Math.round((m[2] + m[3]) * 0.3) })
const DONG_DAU = [
  ['18:03', 'Đỗ Mai Anh', 'moi', 'Mới', M([5, 9, 28, 6], 1, 0, 0, 0, 3)],
  ['18:02', 'Trần Gia Anh', 'luoi', 'Lười · 3/11', M([7, 5, 3, 0], 1, 3, 1, 0, 0, 0, [9, 1])],
  ['18:02', 'Phan Quang Huy', 'chua-deu', 'Chưa đều · 7/11', M([9, 8, 12, 2], 2, 0, 0, 0, 5, 0, [10, 4])],
  ['18:02', 'Phạm Minh Hà', 'cham', 'Chăm · 11/11', M([0, 0, 0, 0])],
  ['18:01', 'Vũ Thanh Long', 'cham', 'Chăm · 10/11', M([1, 2, 10, 3], 0, 0, 0, 6, 0, 4)],
  ['18:01', 'Chu Hải Vy', 'cham', 'Chăm · 11/11', M([1, 1, 2, 0])],
]
// 24 em còn lại (không hiện sẵn, chỉ vào dòng tổng + khi lọc): sinh tất định.
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Võ']
const LOT = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thu', 'Gia', 'Khánh', 'Hải', 'Mỹ', 'Bảo', 'Tuệ', 'Diệp', 'Công', 'Đức']
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hiếu', 'Khoa', 'Lan', 'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Thảo', 'Uyên', 'Yến', 'Trang', 'Long', 'Nhi']
let hat = 11
const ngau = (n) => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat % n }
const NHOM = [['cham', 'Chăm'], ['chua-deu', 'Chưa đều'], ['luoi', 'Lười']]
const DONG_SAU = Array.from({ length: 24 }, (_, i) => {
  const [nhom, tenNhom] = NHOM[i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0]
  const du = nhom === 'cham' ? 9 + ngau(3) : nhom === 'chua-deu' ? 5 + ngau(3) : 1 + ngau(3)
  const n = 6 + ngau(30)
  const m1 = ngau(Math.ceil(n * 0.35)), m2 = ngau(Math.ceil(n * 0.3)), m4 = ngau(4), m3 = Math.max(0, n - m1 - m2 - m4)
  const treo = i === 4 || i === 13 ? 2 + ngau(2) : ngau(9) === 0 ? 1 : 0
  return [`17:${String(59 - i * 2).padStart(2, '0')}`, `${HO[(i * 7 + 3) % HO.length]} ${LOT[(i * 5 + 1) % LOT.length]} ${TEN[(i * 3 + 2) % TEN.length]}`, nhom, `${tenNhom} · ${du}/11`, M([m1, m2, m3, m4], treo, 0, 0, ngau(4) === 0 ? ngau(5) : 0, ngau(3))]
})
// Đặt thêm vài em vội rõ (để dòng tổng có số thật từ bảng)
;[1, 7, 15].forEach((i) => { const d = DONG_SAU[i][4]; d.m = [9 + i % 3, 6, 4, 1]; d.saiVoi = 8 + i % 3; d.saiNghi = 2 })
const CA_LOP = [...DONG_DAU, ...DONG_SAU]
const SI_SO = 38

/** Bản "ngày đầu" (Đợt 1 vừa lên): mọi lượt chưa đo treo máy, chưa có Mức 5–6. */
const ngayDau = (ds) => ds.map(([g, t, n, c, d]) => [g, t, n, c, { ...d, m: d.m.map((x, k) => x + (k === 2 ? d.treo + d.coTinh : 0)), treo: 0, coTinh: 0, ngayCoTinh: 0, chuaDoTreo: d.m.reduce((a, b) => a + b, 0) + d.treo + d.coTinh - (t === 'Đỗ Mai Anh' ? 4 : 0) }])
const soDo = (d) => d.m.reduce((a, b) => a + b, 0) + d.treo + d.coTinh

// ═════════════════════════ BẢNG ĐIỂM DANH (app thầy) — bản 2 theo góp ý Boss 22/10 ═════════════════════════
// Góp ý: (1) 4 sắc xanh không phân biệt nổi vội với có nghĩ khi liếc ⇒ thanh 3 NHÓM màu có nghĩa (Vội 1–2 = hổ phách cảnh báo · Có nghĩ 3–4 = xanh lục ·
// Treo 5–6 = hồng lỗi) + SỐ % LỚN; (2) dòng phụ "chưa có số đo" lặp mọi dòng ⇒ gom MỘT chú thích dưới danh sách; (3) Mức 6 = CỜ nổi ngay sau tên em (chỉ màn thầy);
// (4) nhãn nhịp và thanh tranh chỗ ⇒ CỘT THẲNG HÀNG: Em (tên + cờ, nhãn nhịp nhỏ dưới) · Sai vì vội (% lớn) · Cách làm 14 ngày (thanh) · Treo máy.
const SVG = {
  voi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  treo: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  'co-tinh': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4h11l-1.5 4L16 12H7v9z"/></svg>',
  tat: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.2 1.7 4.5 4.3"/></svg>',
}
/** Bộ lọc dòng tổng: "Treo máy" = ≥ 1 lượt treo (Mức 5 hoặc 6); "Cố tình" = có Mức 6; "voi" = tỉ lệ sai vì vội đạt ngưỡng. */
const coDau = (d, k) => (k === 'treo' ? d.treo + d.coTinh > 0 : k === 'co-tinh' ? d.coTinh > 0 : dauHieu(d).some((x) => x.k === k))
const pt = (a, b) => Math.round((100 * a) / b)

/** Thanh 3 nhóm theo MỌI lượt 14 ngày: Vội (Mức 1–2) · Có nghĩ (3–4) · Treo (5) · Cố tình (6, đặc). */
function thanh(d) {
  if (soDo(d) === 0) return '<span class="ml-thanh ml-thanh--rong"></span>'
  const doan = [['voi', d.m[0] + d.m[1]], ['nghi', d.m[2] + d.m[3]], ['treo', d.treo], ['co-tinh', d.coTinh]].filter(([, n]) => n > 0)
  return `<span class="ml-thanh">${doan.map(([k, n]) => `<i data-g="${k}" style="flex-grow:${n}"></i>`).join('')}</span>`
}

function dong([gio, ten, nhom, chip, d], { dang = false, ngayDauBan = false } = {}) {
  const sai = d.saiVoi + d.saiNghi
  const du = sai >= MAU_TOI_THIEU
  const voiNhieu = dauHieu(d).some((x) => x.k === 'voi')
  const co = d.coTinh > 0
  const tongTreo = d.treo + d.coTinh
  const nhan = `${ten}, ${chip.replace(' · ', ' ')}${co ? `. Cố tình treo máy ${d.coTinh} lượt` : ''}${du ? `. Sai vì vội ${pt(d.saiVoi, sai)}%, ${d.saiVoi} trên ${sai} lượt sai` : ''}${tongTreo ? `. Treo máy ${tongTreo} lượt` : ''}`
  const oVoi = dang === 'loi' ? '<span class="o-voi o-voi--trong">—</span>'
    : dang ? '<span class="o-voi o-voi--trong">…</span>'
      : soDo(d) === 0 ? '<span class="o-voi o-voi--trong">—</span>'
        : du ? `<span class="o-voi"${voiNhieu ? ' data-nhieu' : ''}><b>${pt(d.saiVoi, sai)}%</b><small>${d.saiVoi}/${sai} lượt sai</small></span>`
          : `<span class="o-voi o-voi--it"><b>—</b><small>ít lượt sai (${sai})</small></span>`
  const oThanh = dang === 'loi' ? '<span class="o-thanh"><span class="ml-thanh ml-thanh--rong"></span><small class="nghieng">Chưa tải được</small></span>'
    : dang ? '<span class="o-thanh"><span class="ml-thanh ml-thanh--cho"></span><small class="nghieng">Đang đo…</small></span>'
      : soDo(d) === 0 ? `<span class="o-thanh"><span class="ml-thanh ml-thanh--rong"></span><small class="nghieng">${d.chuaCoSoDo ? 'Chưa có số đo' : 'Chưa có lượt 14 ngày qua'}</small></span>`
        : `<span class="o-thanh">${thanh(d)}<small>${d.uoc ? '≈ ' : ''}Vội <b>${d.m[0] + d.m[1]}</b> · Có nghĩ <b>${d.m[2] + d.m[3]}</b>${tongTreo ? ` · Treo <b>${tongTreo}</b>` : ''} lượt</small></span>`
  const oTreo = ngayDauBan || dang ? '<span class="o-treo o-treo--trong">—</span>'
    : tongTreo ? `<span class="o-treo" data-nhieu="${tongTreo >= TREO_GAN_CHIP ? '1' : '0'}">${SVG.treo}<b>${tongTreo}</b> lượt</span>`
      : '<span class="o-treo o-treo--trong">0</span>'
  return `<li><button type="button" class="dd-dong" aria-label="${e(nhan)} (điểm danh ${gio})">
    <span class="dd-gio">${gio}</span>
    <span class="o-em"><span class="o-ten"><b class="dd-ten">${e(ten)}</b>${co ? `<span class="co-tinh">${SVG['co-tinh']}Cố tình treo máy</span>` : ''}</span><span class="dd-chip" data-nhom="${nhom}">${chip}</span></span>
    ${oVoi}${oThanh}${oTreo}
  </button></li>`
}

function dongTong(ds, { loc = null, ngayDauBan = false } = {}) {
  const dem = { voi: 0, treo: 0, 'co-tinh': 0 }
  for (const r of ds) { if (coDau(r[4], 'voi')) dem.voi++; if (coDau(r[4], 'treo')) dem.treo++; if (coDau(r[4], 'co-tinh')) dem['co-tinh']++ }
  const nut = (k, chu, so) => `<button type="button" class="tong-nut" data-k="${k}" aria-pressed="${loc === k}">${SVG[k]}<span>${chu}</span><b>${so}</b></button>`
  return `<div class="tong" role="group" aria-label="Lọc em có mặt theo cách làm bài 14 ngày">
    <p class="tong-chu">14 ngày qua, trong <b>${ds.length}</b> em có mặt:</p>
    <div class="tong-nuts">
      ${nut('tat', 'Tất cả', ds.length)}
      ${nut('voi', 'Sai vì vội nhiều', dem.voi)}
      ${ngayDauBan ? `<span class="tong-cho">${SVG.treo}Treo máy: đo từ lượt làm sau ${NGAY_DO_TREO}</span>` : `${nut('treo', 'Treo máy', dem.treo)}${nut('co-tinh', 'Cố tình treo máy', dem['co-tinh'])}`}
    </div>
  </div>`
}

/** Đầu cột (máy tính / ngang) — điện thoại ẩn, thay bằng chú giải. */
const DAU_COT = (ngayDauBan) => `<div class="dau-cot" aria-hidden="true"><span></span><span>Em</span><span>Sai vì vội<small>% lượt sai</small></span><span>Cách làm 14 ngày<small>mọi lượt</small></span><span>Treo máy${ngayDauBan ? `<small>đo từ ${NGAY_DO_TREO}</small>` : '<small>14 ngày</small>'}</span></div>`
const CHU_GIAI = `<p class="chu-giai" aria-label="Chú giải thanh 14 ngày">
  <span><i data-g="voi"></i>Vội (Mức làm 1–2)</span><span><i data-g="nghi"></i>Có nghĩ (3–4)</span><span><i data-g="treo"></i>Treo máy</span><span><i data-g="co-tinh"></i>Cố tình treo máy</span>
  <span class="cg-rieng">Màn riêng của thầy, không lên bản chiếu</span></p>`

/** Chú thích CHUNG dưới danh sách (thay dòng phụ lặp ở từng dòng). */
function chuThichChung(dsHien, ngayDauBan) {
  const chua = dsHien.reduce((a, r) => a + r[4].chuaCoSoDo, 0)
  const chuaTreo = dsHien.reduce((a, r) => a + Math.min(r[4].chuaDoTreo, soDo(r[4])), 0)
  const uoc = dsHien.some((r) => r[4].uoc)
  const phan = [`% và thanh chỉ tính lượt đã đo giờ làm. ${dsHien.length} em đang hiện: <b>${chua}</b> lượt chưa có số đo`]
  if (!ngayDauBan && chuaTreo) phan.push(`<b>${chuaTreo}</b> lượt làm trước khi đo treo máy (nằm trong nhóm Vội / Có nghĩ)`)
  if (uoc) phan.push('≈ = có lượt giây ước tính')
  return `<p class="chu-chung">${phan.join(' · ')}.</p>`
}

/** Phần đầu bước 1 GIỮ NGUYÊN (mã · có mặt · vắng) — vẽ gọn, nhãn "Giữ". */
const DAU_BUOC = `<header class="b1-dau"><span class="b1-so">1</span><div><h2>Điểm danh — việc đầu tiên của buổi</h2><p>Buổi học 22/10 · 12 Nhóm 10 điểm · em gõ mã hoặc quét QR</p></div></header>
  <div class="giu" data-nhan="Giữ nguyên"><div class="giu-o"><span class="nhan-nho">Mã buổi</span><b class="ma">482 915</b></div><div class="giu-o"><b class="so-lon">30</b><span>/${SI_SO} em có mặt</span></div><div class="giu-o giu-vang"><b>Vắng 8 em — 3 em đang Lười</b></div></div>`

function khungDiemDanh({ id, ds, hien = 6, loc = null, ngayDauBan = false, loi = false, dangSau = 0 }) {
  const loc_ = loc && loc !== 'tat' ? ds.filter((r) => coDau(r[4], loc)) : ds
  const dsHien = loc_.slice(0, loc ? loc_.length : hien)
  return `<section class="kh" id="k-${id}" hidden><div class="trang">
  <article class="b1">${DAU_BUOC}
    <div class="vua" data-nhan="Đổi">
      <h3 class="vua-tieu">Vừa điểm danh <small>· bấm em ⇒ hồ sơ làm bài</small></h3>
      ${dongTong(ds, { loc, ngayDauBan })}
      ${loi ? '<p class="loi" role="alert">Chưa tải được Mức làm 14 ngày của 1 em: Không nối được máy chủ. Các dòng khác và danh sách điểm danh vẫn đúng. <button type="button" class="nut-chu">Thử tải lại</button></p>' : ''}
      ${loc && loc !== 'tat' ? `<p class="loc-dong"><b>${loc_.length} em</b> ${loc === 'voi' ? 'sai vì vội nhiều' : loc === 'treo' ? 'có treo máy' : 'cố tình treo máy'} trong 14 ngày · <button type="button" class="nut-chu">Bỏ lọc</button></p>` : ''}
      ${CHU_GIAI}
      ${DAU_COT(ngayDauBan)}
      <ul class="vua-ds">${dsHien.map((r, i) => dong(r, { dang: loi && i === dsHien.length - 1 ? 'loi' : i >= dsHien.length - dangSau, ngayDauBan })).join('')}</ul>
      ${chuThichChung(dsHien, ngayDauBan)}
      ${!loc && ds.length > hien ? `<button type="button" class="nut-chu">Xem cả ${ds.length} em có mặt ›</button>` : ''}
    </div>
    <div class="xong" data-nhan="Đổi chỗ"><p>Xong điểm danh: chiếu Nhịp học của lớp — ba cột Chăm · Chưa đều · Lười. Trên bản chiếu bấm <b>H</b> để ẩn tên nhóm Lười.</p><button type="button" class="nut-chinh">Xong điểm danh · chiếu Nhịp học của lớp</button></div>
  </article></div></section>`
}

const CSS_DD = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--gvm-nen); color: var(--gvm-chu); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
.kh[hidden] { display: none; }
h2, h3, p, ul { margin: 0; padding: 0; } ul { list-style: none; }
button { font: inherit; color: inherit; }
.trang { max-width: 1180px; margin: 0 auto; padding: 24px 24px 40px; }
.minh-hoa { position: absolute; z-index: 9; right: 10px; top: 6px; padding: 4px 10px; border-radius: 999px; background: var(--gvm-chu); color: var(--gvm-nen); font-size: 12px; font-weight: 800; letter-spacing: .02em; }
[data-nhan] { position: relative; outline: 2px dashed color-mix(in srgb, var(--gvm-tim) 55%, transparent); outline-offset: 4px; }
[data-nhan]::after { content: attr(data-nhan); position: absolute; top: -12px; right: 12px; padding: 1px 8px; border-radius: 999px; background: var(--gvm-tim); color: var(--gvm-tren-dac); font-size: 11px; font-weight: 800; }
.b1 { display: grid; gap: 20px; padding: 20px 24px 24px; border: 2px solid var(--gvm-xd); border-radius: 28px; background: var(--gvm-mat); box-shadow: var(--gvm-bong); }
.b1-dau { display: flex; gap: 14px; align-items: center; } .b1-dau h2 { font-size: 20px; font-weight: 800; } .b1-dau p { font-size: 14px; color: var(--gvm-chu-2); }
.b1-so { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--gvm-xd); color: var(--gvm-tren-dac); font-weight: 800; }
.giu { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; opacity: .55; }
.giu-o { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; padding: 14px 16px; border-radius: 20px; background: var(--gvm-mat-2); font-size: 14px; color: var(--gvm-chu-2); }
.giu-o .ma { font-size: 26px; color: var(--gvm-xd-dam); letter-spacing: .06em; } .so-lon { font-size: 26px; color: var(--gvm-xl); } .nhan-nho { width: 100%; font-size: 12px; }
.giu-vang { background: var(--gvm-ho-nen); color: var(--gvm-ho-dam); }
.vua { display: grid; gap: 12px; padding: 18px 20px; border: 1px solid var(--gvm-vien); border-radius: 22px; background: var(--gvm-mat); }
.vua-tieu { font-size: 17px; font-weight: 800; } .vua-tieu small { font-size: 13px; font-weight: 500; color: var(--gvm-chu-3); }
/* dòng tổng + nút lọc */
.tong { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 12px; border-radius: 18px; background: var(--gvm-mat-2); }
.tong-chu { font-size: 14px; color: var(--gvm-chu-2); } .tong-chu b { color: var(--gvm-chu); font-variant-numeric: tabular-nums; }
.tong-nuts { display: flex; flex-wrap: wrap; gap: 8px; }
.tong-nut { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px 0 10px; border: 1.5px solid var(--gvm-vien); border-radius: 999px; background: var(--gvm-mat); color: var(--gvm-chu); font-size: 14px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
.tong-nut svg { width: 18px; height: 18px; fill: currentColor; flex: none; }
.tong-nut[data-k='tat'] svg { fill: none; stroke: currentColor; stroke-width: 2; }
.tong-nut b { min-width: 24px; padding: 1px 7px; border-radius: 999px; background: var(--gvm-mat-2); font-variant-numeric: tabular-nums; text-align: center; }
.tong-nut[data-k='voi'] { color: var(--gvm-hp-dam); border-color: var(--gvm-hp); background: var(--gvm-hp-nen); }
.tong-nut[data-k='treo'] { color: var(--gvm-ho); border-color: color-mix(in srgb, var(--gvm-ho) 45%, var(--gvm-vien)); }
.tong-nut[data-k='co-tinh'] { color: var(--gvm-ho-dam); border-color: var(--gvm-ho); background: var(--gvm-ho-nen); }
.tong-nut[aria-pressed='true'] { background: var(--gvm-xd); border-color: var(--gvm-xd); color: var(--gvm-tren-dac); }
.tong-nut[aria-pressed='true'] b { background: color-mix(in srgb, var(--gvm-tren-dac) 22%, transparent); }
.tong-nut:focus-visible, .dd-dong:focus-visible, .nut-chu:focus-visible { outline: 3px solid var(--gvm-xd); outline-offset: 2px; }
.tong-cho { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px 0 10px; border: 1.5px dashed var(--gvm-vien); border-radius: 999px; font-size: 13px; color: var(--gvm-chu-3); font-style: italic; }
.tong-cho svg { width: 16px; height: 16px; fill: currentColor; }
.loc-dong { font-size: 14px; color: var(--gvm-chu-2); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } .loc-dong b { color: var(--gvm-chu); }
.loi { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 8px 12px; border-radius: 14px; background: var(--gvm-ho-nen); color: var(--gvm-ho-dam); font-size: 14px; }
.loi .nut-chu { color: inherit; text-decoration: underline; }
/* chú giải + màu 3 nhóm (biến có nghĩa sẵn có: hổ phách = cảnh báo, lục = tốt, hồng = lỗi) */
.chu-giai { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; font-size: 12px; color: var(--gvm-chu-3); }
.chu-giai > span { display: inline-flex; align-items: center; gap: 5px; } .cg-rieng { margin-left: auto; font-style: italic; }
.chu-giai i { display: inline-block; width: 16px; height: 9px; border-radius: 3px; }
[data-g='voi'] { background: var(--gvm-hp); } [data-g='nghi'] { background: var(--gvm-xl); }
[data-g='treo'] { background: repeating-linear-gradient(135deg, var(--gvm-ho) 0 3px, var(--gvm-ho-nen) 3px 6px); } [data-g='co-tinh'] { background: var(--gvm-ho-dam); }
/* CỘT THẲNG HÀNG: giờ · em · % sai vì vội · thanh · treo máy */
.dau-cot, .dd-dong { display: grid; grid-template-columns: 48px minmax(150px, 1.15fr) 104px minmax(180px, 1.5fr) 92px; align-items: center; column-gap: 16px; }
.dau-cot { padding: 0 8px 6px; border-bottom: 1px solid var(--gvm-vien); font-size: 12px; font-weight: 800; color: var(--gvm-chu-2); }
.dau-cot small { display: block; font-weight: 500; color: var(--gvm-chu-3); }
.vua-ds { display: grid; }
.dd-dong { width: 100%; min-height: 64px; padding: 10px 8px; border: 0; border-bottom: 1px solid var(--gvm-mat-2); background: none; text-align: left; cursor: pointer; touch-action: manipulation; }
.dd-dong:hover { background: var(--gvm-mat-2); }
.dd-gio { font-size: 13px; color: var(--gvm-chu-3); font-variant-numeric: tabular-nums; }
.o-em { display: grid; gap: 4px; min-width: 0; justify-items: start; }
.o-ten { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; }
.dd-ten { font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
.co-tinh { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px 2px 7px; border-radius: 6px; background: var(--gvm-ho); color: var(--gvm-tren-dac); font-size: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 1px 0 var(--gvm-ho-dam); }
.co-tinh svg { width: 13px; height: 13px; fill: currentColor; }
.dd-chip { padding: 1px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; background: var(--gvm-mat-2); color: var(--gvm-chu-2); white-space: nowrap; }
.dd-chip[data-nhom='cham'] { background: var(--gvm-xl-nen); color: var(--gvm-xl-dam); } .dd-chip[data-nhom='chua-deu'] { background: var(--gvm-hp-nen); color: var(--gvm-hp-dam); } .dd-chip[data-nhom='luoi'] { background: var(--gvm-ho-nen); color: var(--gvm-ho-dam); }
.o-voi { display: grid; line-height: 1.1; font-variant-numeric: tabular-nums; }
.o-voi b { font-size: 26px; font-weight: 900; color: var(--gvm-chu-2); }
.o-voi[data-nhieu] b { color: var(--gvm-hp); }
.o-voi small { font-size: 12px; color: var(--gvm-chu-3); }
.o-voi--trong, .o-treo--trong { font-size: 18px; color: var(--gvm-chu-3); }
.o-voi--it b { font-size: 20px; color: var(--gvm-chu-3); }
.o-thanh { display: grid; gap: 5px; min-width: 0; }
.o-thanh small { font-size: 12px; color: var(--gvm-chu-2); font-variant-numeric: tabular-nums; } .o-thanh small b { color: var(--gvm-chu); }
.o-thanh small.nghieng { font-style: italic; color: var(--gvm-chu-3); }
.ml-thanh { display: flex; gap: 2px; height: 12px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--gvm-chu-3) 14%, transparent); }
.ml-thanh i { display: block; flex-basis: 0; min-width: 6px; }
.ml-thanh--cho { opacity: .5; }
.o-treo { display: inline-flex; align-items: center; gap: 5px; justify-self: start; padding: 3px 10px 3px 8px; border-radius: 999px; font-size: 13px; color: var(--gvm-chu-2); font-variant-numeric: tabular-nums; }
.o-treo svg { width: 13px; height: 13px; fill: currentColor; } .o-treo b { font-size: 16px; }
.o-treo[data-nhieu='1'] { background: var(--gvm-ho-nen); color: var(--gvm-ho-dam); font-weight: 700; }
.chu-chung { font-size: 12px; line-height: 1.5; color: var(--gvm-chu-3); } .chu-chung b { color: var(--gvm-chu-2); }
.nut-chu { min-height: 44px; padding: 0 4px; border: 0; background: none; color: var(--gvm-xd); font-size: 14px; font-weight: 700; cursor: pointer; justify-self: start; }
.xong { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 14px 18px; border-radius: 22px; background: var(--gvm-mat-2); }
.xong p { flex: 1 1 320px; font-size: 14px; line-height: 1.6; color: var(--gvm-chu-2); } .xong p b { color: var(--gvm-chu); }
.nut-chinh { min-height: 52px; padding: 0 22px; border: 0; border-radius: 16px; background: var(--gvm-xd); color: var(--gvm-tren-dac); font-size: 16px; font-weight: 800; box-shadow: var(--gvm-bong-nut); cursor: pointer; }
@media (max-width: 860px) {
  .trang { padding: 34px 12px 32px; } .b1 { padding: 16px; border-radius: 24px; gap: 16px; }
  .giu { grid-template-columns: 1fr 1fr; } .giu-vang { grid-column: 1 / -1; }
  .vua { padding: 14px; }
  .dau-cot, .dd-dong { grid-template-columns: 44px minmax(120px, 1fr) 84px minmax(140px, 1.2fr) 70px; column-gap: 10px; }
  .o-voi b { font-size: 22px; }
}
/* ĐIỆN THOẠI DỌC: không đủ 5 cột ⇒ mỗi em 3 hàng: (giờ · tên · cờ) / (nhịp · % · treo) / thanh cả bề ngang; đầu cột ẩn (chú giải đã nói nghĩa màu) */
@media (max-width: 600px) {
  .dau-cot { display: none; }
  .dd-dong { grid-template-columns: 40px minmax(0, 1fr) auto; grid-template-areas: 'gio em em' '. voi treo' '. thanh thanh'; row-gap: 6px; column-gap: 8px; padding-inline: 4px; }
  .dd-gio { grid-area: gio; align-self: start; padding-top: 3px; } .o-em { grid-area: em; grid-template-columns: auto; } .o-voi { grid-area: voi; } .o-treo { grid-area: treo; justify-self: end; } .o-thanh { grid-area: thanh; }
  .o-em { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
  .o-voi { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 6px; min-width: 0; } .o-voi b { font-size: 22px; }
  .o-voi::before { content: 'Sai vì vội'; font-size: 12px; color: var(--gvm-chu-3); white-space: nowrap; } .o-voi small { white-space: nowrap; }
  .o-treo::before { content: 'Treo'; font-size: 12px; font-weight: 500; color: var(--gvm-chu-3); white-space: nowrap; } .o-treo[data-nhieu='1']::before { color: inherit; }
  .o-treo--trong { font-size: 14px; }
  .o-voi--trong::before { content: none; }
  .tong-nuts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; } .tong-nut { padding-inline: 8px 10px; font-size: 13px; gap: 5px; } .tong-nut span { min-width: 0; } .tong-nut b { margin-left: auto; }
  .tong-cho { grid-column: span 2; } .cg-rieng { margin-left: 0; width: 100%; } .nut-chinh { width: 100%; }
}
`

const ngay0 = ngayDau(CA_LOP)
// Bản "trạng thái": em 5 + 6 đang đo, có dải lỗi (lệnh lô hỏng) — dòng điểm danh vẫn như cũ
const KHUNG_DD = [
  khungDiemDanh({ id: 'du', ds: CA_LOP }),
  khungDiemDanh({ id: 'ngay-dau', ds: ngay0, ngayDauBan: true }),
  khungDiemDanh({ id: 'loc-treo', ds: CA_LOP, loc: 'treo' }),
  khungDiemDanh({ id: 'trang-thai', ds: CA_LOP, loi: true, dangSau: 2 }),
]
const htmlDd = `<!doctype html>
<html lang="vi" data-giao-dien="sang"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bản vẽ điểm danh 6 mức</title>
<link rel="stylesheet" href="../../src/styles/tokens.css">
<style>
${fonts}
${CSS_DD}
</style></head><body>
<span class="minh-hoa">Minh hoạ — số giả</span>
${KHUNG_DD.join('\n')}
<script>
(() => { const q = new URLSearchParams(location.hash.slice(1)); const k = q.get('k'); if (q.get('toi') === '1') document.documentElement.dataset.giaoDien = 'toi'
  const ds = [...document.querySelectorAll('.kh')]; if (!k) { ds.forEach((s) => { s.hidden = false }); return } const m = ds.find((s) => s.id === 'k-' + k); if (m) m.hidden = false })()
</script></body></html>`
writeFileSync(join(THU_MUC, 'diem-danh.html'), htmlDd)

// ═════════════════════════ TỜ CHIẾU «AI ĐÃ SAI?» (phím X) ═════════════════════════
// Ngưỡng của câu đang chiếu (Câu 12 · phần I · 46 từ) — như bản vẽ 21/10 đã duyệt.
const T_DOC = 24, SAN = 6, THUONG = 75, TOP = Math.round(0.8 * THUONG)
const mucTheoGiay = (g, top = TOP) => (g < T_DOC ? 1 : g < T_DOC + SAN ? 2 : top != null && g >= top ? 4 : 3)
const TEN_MUC = { 1: 'Chưa đọc hết đề', 2: 'Đọc xong, chưa kịp nghĩ', 3: 'Có nghĩ', 4: 'Làm kỹ' }
const SI_SO_C = 34, CO_MAT_C = 28
// [tên, có mặt, [[giây, cũ?, phút treo?, cố tình?], …]] — giây = giây làm (đồng hồ g); phút treo = khoảng lặng/rời app dài nhất (Mức 5); cố tình = Mức 6 (máy chủ / app HẠ thành Mức 5 trước khi lên tờ)
const EM_C = [
  ['Phạm Quốc Huy', 1, [[9], [6, 1]]],
  ['Lê Thu Hà', 1, [[11], [24]]],
  ['Vũ Minh Quân', 1, [[14], [21, 1]]],
  ['Đỗ Khánh Linh', 1, [[17], [19, 1]]],
  ['Bùi Tuấn Kiệt', 1, [[31], [38]]],
  ['Mai Hồng Nhung', 1, [[36], [33, 1]]],
  ['Lương Tuệ Minh', 1, [[61], [70]]],
  ['Tô Gia Hân', 1, [[58, 0, 7], [49]]],
  ['Nguyễn Đức Anh', 1, [[7]]],
  ['Trần Bảo Châu', 1, [[27, 0, 12, 1]]],
  ['Hoàng Minh Khôi', 1, [[44]]],
  ['Đặng Thu Trang', 1, [[66, 0, 9]]],
  ['Ngô Quang Vinh', 0, [[12]]],
  ['Phan Diệp Chi', 0, [[25, 0, 15, 1]]],
  ['Võ Hải Đăng', 0, [[40, 1]]],
  ['Lý Mỹ Duyên', 0, [[8]]],
  ['Dương Gia Bảo', 0, [[34]]],
  ['Trịnh Công Sơn', 0, [[15]]],
]
const lopTu = (ds, { top = TOP, chuaDoTreo = false } = {}) => ds.flatMap(([ten, coMat, ls]) => ls.map(([giay, cu, treo, coTinh]) => ({
  ten, coMat: !!coMat, giay, cu: !!cu,
  // HẠ Mức 6 ⇒ 5 TRƯỚC khi lên tờ: tờ chiếu chỉ biết `treo` (phút), không có cờ cố tình.
  treo: chuaDoTreo ? null : treo ?? null, _coTinhBiHa: !!coTinh,
  muc: cu ? 0 : !chuaDoTreo && treo ? 5 : mucTheoGiay(giay, top),
})))
const EM_DONG_C = Array.from({ length: 27 }, (_, i) => {
  const ten = `${HO[(i * 7 + 3) % HO.length]} ${LOT[(i * 5 + 1) % LOT.length]} ${TEN[(i * 3 + 2) % TEN.length]}`
  const soLuot = 1 + (ngau(3) === 0 ? 2 : ngau(2))
  return [ten, i < 22 ? 1 : 0, Array.from({ length: soLuot }, () => { const g = 4 + ngau(85); return [g, ngau(7) === 0 ? 1 : 0, ngau(25) === 0 ? 5 + ngau(20) : undefined] })]
})

const pip = (n) => `<span class="pip" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i${k <= n ? ' class="b"' : ''}></i>`).join('')}</span>`
const icTreo = '<svg class="ic-treo" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
const tenNgan = (ten) => { const w = String(ten).trim().split(/\s+/); return w.length < 3 ? w.join(' ') : [w[0], ...w.slice(1, -1).map((x) => x[0] + '.'), w[w.length - 1]].join(' ') }

function theC({ kieu, tieuDe, phu, luot, soEm, top = TOP, cot = 3, chuaDoTreo = false }) {
  const dem = [0, 0, 0, 0, 0, 0]
  luot.forEach((l) => { dem[l.muc]++ })
  const nEm = new Set(luot.map((l) => l.ten)).size
  const vg = (l) => (kieu === 'lop' && !l.coMat ? '<i class="vg" title="vắng"></i>' : '')
  const lan = (m, ten, khoang) => {
    const ds = luot.filter((l) => l.muc === m).sort((a, b) => a.giay - b.giay || a.ten.localeCompare(b.ten, 'vi'))
    if (!ds.length) return `<section class="ln ln-rong" data-m="${m}"><header>${pip(m)}<b>Mức làm ${m}</b><span>${ten} · ${khoang}</span><em>0 lượt</em></header></section>`
    return `<section class="ln" data-m="${m}"><header>${pip(m)}<b>Mức làm ${m}</b><span>${ten} · ${khoang}<i class="don-vi"> · số = giây làm</i></span><em>${ds.length} lượt</em></header><ul class="pls" style="--cot:${cot}">${ds.map((l) => `<li class="pl" data-m="${m}">${vg(l)}<b data-t="${e(tenNgan(l.ten))}">${e(l.ten)}</b><u>${l.giay}<s> giây</s></u></li>`).join('')}</ul></section>`
  }
  const dsTreo = luot.filter((l) => l.muc === 5).sort((a, b) => b.treo - a.treo || a.ten.localeCompare(b.ten, 'vi'))
  const lanTreo = chuaDoTreo
    ? `<section class="ln ln-treo ln-treo-chua"><header>${icTreo}<b>Treo máy</b><span>Chưa đo — lượt làm trước ${NGAY_DO_TREO} chưa ghi khoảng treo máy</span></header></section>`
    : dsTreo.length
      ? `<section class="ln ln-treo"><header>${icTreo}<b>Treo máy</b><span>để máy ≥ 5 phút không làm, rồi mới nộp<i class="don-vi"> · số = phút treo</i></span><em>${dsTreo.length} lượt</em></header><ul class="pls" style="--cot:${cot}">${dsTreo.map((l) => `<li class="pl pl-treo">${vg(l)}<b data-t="${e(tenNgan(l.ten))}">${e(l.ten)}</b><u>${l.treo}<s> phút</s></u></li>`).join('')}</ul></section>`
      : `<section class="ln ln-treo ln-rong"><header>${icTreo}<b>Treo máy</b><span>Không lượt nào để máy treo</span><em>0 lượt</em></header></section>`
  const chua = luot.filter((l) => l.muc === 0).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
  const lanChua = chua.length ? `<section class="ln ln-chua"><header><b>Chưa có số đo</b><span>Lượt làm trước khi máy em dùng đồng hồ mới</span><em>${chua.length} lượt</em></header><ul class="pls" style="--cot:${cot}">${chua.map((l) => `<li class="pl pl-chua">${vg(l)}<b data-t="${e(tenNgan(l.ten))}">${e(l.ten)}</b><u>${l.giay}<s> giây</s></u></li>`).join('')}</ul></section>` : ''
  const tren = [1, 2, 3, 4].map((k) => (dem[k] ? `<i data-m="${k}" style="flex:${dem[k]}">${pip(k)}<b>${dem[k]}</b></i>` : '')).join('') + (dem[5] ? `<i data-m="5" style="flex:${dem[5]}">${icTreo}<b>${dem[5]}</b></i>` : '') + (dem[0] ? `<i data-m="0" style="flex:${dem[0]}"><b>${dem[0]}</b></i>` : '')
  const bieu = kieu === 'dd'
    ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
    : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.2 1.7 4.5 4.3"/></svg>'
  return `<article class="the-ai${cot > 3 ? ' dense' : ''}" data-k="${kieu}"><header class="th-dau"><span class="th-ky">${bieu}${tieuDe}</span><span class="th-phu">${phu}</span></header>
    <div class="th-so"><p class="th-em"><b>${nEm}</b><span>/ ${soEm} em ${kieu === 'dd' ? 'có mặt' : 'của lớp'} làm sai</span></p><p class="th-luot"><b>${luot.length}</b><span>lượt sai</span></p></div>
    <div class="tn" role="img" aria-label="${[1, 2, 3, 4].map((k) => `Mức làm ${k}: ${dem[k]} lượt`).join('; ')}; Treo máy: ${dem[5]} lượt; Chưa có số đo: ${dem[0]} lượt">${tren}</div>
    <div class="th-lan">${[1, 2, 3].map((m) => lan(m, TEN_MUC[m], m === 1 ? `dưới ${T_DOC} giây` : m === 2 ? `${T_DOC}–${T_DOC + SAN - 1} giây` : `${T_DOC + SAN}–${top - 1} giây`)).join('')}${lan(4, TEN_MUC[4], `từ ${top} giây`)}${lanTreo}${lanChua}</div>
  </article>`
}

function khungChieu({ id, ds, cot: cotMoi, chuaDoTreo = false }) {
  const luot = lopTu(ds, { chuaDoTreo })
  const cot = cotMoi ?? (luot.length > 28 ? 4 : 3)
  const lopA = luot.filter((l) => l.coMat)
  const soTreo = luot.filter((l) => l.muc === 5).length
  const chan = chuaDoTreo
    ? `Mức làm xếp theo số giây làm so với thời gian đọc hết đề (${T_DOC} giây) và sàn nghĩ (${SAN} giây). Treo máy đo từ lượt làm sau ${NGAY_DO_TREO}.`
    : `Mức làm xếp theo số giây làm so với thời gian đọc hết đề (${T_DOC} giây) và sàn nghĩ (${SAN} giây). Lượt treo máy không xếp Mức làm 1–4: số giây của lượt ấy không nói em đã nghĩ bao lâu.`
  return `<section class="kh" id="k-${id}" hidden data-so-treo="${soTreo}">
  <div class="to-sau" aria-hidden="true"><b>Câu 12</b><span>Pin điện hóa</span></div>
  <aside class="ai"><button class="dong" aria-label="Đóng">×</button>
    <header class="ai-dau"><div><span class="ai-ke">CÂU 12 · AI ĐÃ SAI?</span><h2>Học sinh làm sai câu này</h2></div>
      <p class="ai-thuoc"><span>Đọc hết đề cần</span><b>${T_DOC} giây</b><span>Nghĩ từ ${T_DOC + SAN} giây</span></p></header>
    <div class="ai-tab" role="tablist" aria-label="Chọn thẻ"><button type="button" role="tab" aria-selected="true">Đã điểm danh · ${new Set(lopA.map((l) => l.ten)).size} em</button><button type="button" role="tab" aria-selected="false">Cả lớp · ${new Set(luot.map((l) => l.ten)).size} em <kbd>L</kbd></button></div>
    <div class="ai-hai">
      ${theC({ kieu: 'dd', tieuDe: 'ĐÃ ĐIỂM DANH', phu: 'Em có mặt buổi này, làm sai câu này', luot: lopA, soEm: CO_MAT_C, cot, chuaDoTreo })}
      ${theC({ kieu: 'lop', tieuDe: 'CẢ LỚP', phu: 'Mọi em của lớp làm sai câu này · <i class="vg vg-g"></i> em vắng buổi này', luot, soEm: SI_SO_C, cot, chuaDoTreo })}
    </div>
    <footer class="ai-chan"><span>${chan}</span><span class="ai-esc"><kbd>Esc</kbd> đóng</span></footer>
  </aside><span class="minh-hoa">Minh hoạ — số giả</span></section>`
}

// CSS tờ chiếu: lấy NGUYÊN khối CSS của bản vẽ 21/10 đã duyệt (cùng bảng màu tờ chiếu) rồi thêm phần Treo máy.
const cssCu = readFileSync(join(GOC, 'scripts/dung-ban-ve-chieu-muc-lam-2110.mjs'), 'utf8').match(/const CSS = `([\s\S]*?)`\n/)[1]
const CSS_TREO = `
/* ── THÊM 22/10: Treo máy (Mức làm 5; Mức 6 đã hạ về 5 trước khi lên tờ). Màu: xám --m0 + sọc (tạm dừng), KHÔNG màu cảnh báo trước lớp. ── */
.pl u s { text-decoration: none; } .dense .pl u s { display: none; } .don-vi { display: none; } .dense .don-vi { display: inline; }
.ic-treo { width: 1em; height: 1em; fill: currentColor; flex: none; }
.tn > i[data-m='5'] { background: repeating-linear-gradient(135deg, var(--m0) 0 6px, color-mix(in srgb, var(--m0) 55%, var(--mat)) 6px 12px); color: #fff; }
.ln-treo { --mm: var(--m0); border-left-style: solid; background: repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 10px, transparent 10px 20px), rgba(0,0,0,.22); }
.ln-treo header .ic-treo { font-size: calc(var(--u) * 1.1); color: rgb(200, 205, 218); }
.pl-treo { --mm: var(--m0); background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--m0) 30%, transparent) 0 6px, transparent 6px 12px); border: 1px solid color-mix(in srgb, var(--m0) 85%, #fff 10%); }
.ln-treo-chua { border-left-style: dashed; background: transparent; border-top: 1px dashed rgba(255,255,255,.2); border-right: 1px dashed rgba(255,255,255,.2); border-bottom: 1px dashed rgba(255,255,255,.2); opacity: .75; }
.minh-hoa { position: absolute; z-index: 9; left: 46%; top: 10px; padding: 3px 10px; border-radius: 999px; background: rgb(255,255,255); color: rgb(15,18,30); font-size: 12px; font-weight: 800; }
/* chỗ cho làn thứ sáu: gọn khoảng cách ở mọi khổ (khổ cao giữ cỡ chữ); máy chiếu 4:3 (≤ 1100 px ngang) 2 cột thẻ tên */
.the-ai { gap: calc(var(--u) * .5); } .th-lan { gap: calc(var(--u) * .35); } .ln { padding-block: calc(var(--u) * .35) calc(var(--u) * .4); gap: calc(var(--u) * .28); } .pls { gap: calc(var(--u) * .28); }
.th-so b { font-size: max(26px, calc(var(--u) * 2.5)); } .th-luot b { font-size: max(20px, calc(var(--u) * 1.9)); }
.dense { gap: calc(var(--u) * .35); } .dense .th-so b { font-size: max(22px, calc(var(--u) * 2)); } .dense .th-luot b { font-size: max(18px, calc(var(--u) * 1.6)); } .dense .tn { height: max(calc(var(--u) * 1.3), 16px); }
.dense .th-lan { gap: calc(var(--u) * .25); } .dense .ln { padding-block: calc(var(--u) * .25) calc(var(--u) * .3); gap: calc(var(--u) * .2); } .dense .pls { gap: calc(var(--u) * .2); } .dense .pl { padding-block: 1px; }
/* máy chiếu 4:3 (≤ 1100 px ngang): hai thẻ cạnh nhau quá hẹp cho thẻ tên ⇒ MỘT thẻ rộng + hai nút chuyển (phím L) */
.ai-tab { display: none; }
@media (max-width: 1100px) { .ai { width: 97%; padding-inline: calc(var(--u) * 1.4); } .ai-hai { grid-template-columns: minmax(0, 1fr); } .the-ai[data-k='lop'] { display: none; }
  .ai-tab { display: flex; gap: 8px; } .ai-tab button { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: transparent; color: #fff; font: inherit; font-size: 15px; font-weight: 800; }
  .ai-tab button[aria-selected='true'] { background: var(--vang); border-color: var(--vang); color: var(--nen); } .ai-tab kbd { margin-left: .4em; } }
@media (max-height: 800px) { .ln-treo header { font-size: 12px; } }
`
const KHUNG_C = [
  khungChieu({ id: 'ai-sai', ds: EM_C }),
  khungChieu({ id: 'ai-sai-dong', ds: EM_DONG_C }),
  khungChieu({ id: 'ai-sai-ngay-dau', ds: EM_C, chuaDoTreo: true }),
]
const htmlC = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bản vẽ Ai đã sai 6 mức</title>
<style>
${fonts}
${cssCu}
${CSS_TREO}
</style></head><body>
${KHUNG_C.join('\n')}
<script>
(() => { const k = new URLSearchParams(location.hash.slice(1)).get('k'); const ds = [...document.querySelectorAll('.kh')];
  if (!k) { ds.forEach((s) => { s.hidden = false }); return } const m = ds.find((s) => s.id === 'k-' + k); if (m) m.hidden = false
  const vua = () => document.querySelectorAll('.pl b').forEach((b) => { b.textContent = b.dataset.full || (b.dataset.full = b.textContent) && b.textContent; b.textContent = b.dataset.full; if (b.scrollWidth > b.clientWidth + 1) b.textContent = b.dataset.t })
  // SỐ CỘT THẺ TÊN (đề xuất cho tờ thật): thử 2 → 3 → 4 cột, chọn ÍT cột nhất mà KHÔNG tràn thẻ và ít tên phải cắt "…" nhất (tràn thẻ nặng hơn cắt tên).
  const chon = () => { const kh = document.querySelector('.kh:not([hidden])'); const pls = [...kh.querySelectorAll('.pls')]; if (!pls.length) return
    let tot = null
    for (const c of [2, 3, 4]) { pls.forEach((p) => p.style.setProperty('--cot', c)); kh.querySelectorAll('.the-ai').forEach((t) => t.classList.toggle('dense', c > 3)); vua()
      const tran = [...kh.querySelectorAll('.the-ai')].some((t) => t.scrollHeight > t.clientHeight + 1); const cat = [...kh.querySelectorAll('.pl b')].filter((b) => b.scrollWidth > b.clientWidth + 1).length
      const diem = (tran ? 1000 : 0) + cat; if (!tot || diem < tot.diem) tot = { c, diem } }
    pls.forEach((p) => p.style.setProperty('--cot', tot.c)); kh.querySelectorAll('.the-ai').forEach((t) => t.classList.toggle('dense', tot.c > 3)); vua(); kh.dataset.cot = tot.c }
  document.fonts.ready.then(() => { chon(); setTimeout(chon, 60) }) })()
</script></body></html>`
writeFileSync(join(THU_MUC, 'chieu.html'), htmlC)

// Kiểm: tờ chiếu KHÔNG được có chữ "Cố tình" (Mức 6 chỉ màn thầy)
if (/Cố tình|co_tinh|coTinh/.test(htmlC.replace(/_coTinhBiHa/g, ''))) throw new Error('Tờ chiếu lộ chữ Cố tình')
const tongDd = (ds) => ({ voi: ds.filter((r) => coDau(r[4], 'voi')).length, treo: ds.filter((r) => coDau(r[4], 'treo')).length, coTinh: ds.filter((r) => coDau(r[4], 'co-tinh')).length })
console.log(`ĐÃ DỰNG docs/ban-ve-muc-lam-6-muc-2210/ · diem-danh.html ${(htmlDd.length / 1024).toFixed(0)} KB (${KHUNG_DD.length} khung) · chieu.html ${(htmlC.length / 1024).toFixed(0)} KB (${KHUNG_C.length} khung)`)
console.log('Lọc 30 em có mặt:', JSON.stringify(tongDd(CA_LOP)), '· 6 dòng đầu (sai vì vội):', DONG_DAU.map((r) => { const d = r[4]; const n = d.saiVoi + d.saiNghi; return `${r[1]}=${n >= MAU_TOI_THIEU ? `${pt(d.saiVoi, n)}% (${d.saiVoi}/${n})` : `ít (${n})`} treo ${d.treo + d.coTinh}` }).join('; '))
