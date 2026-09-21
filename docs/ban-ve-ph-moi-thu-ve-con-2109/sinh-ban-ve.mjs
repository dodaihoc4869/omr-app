#!/usr/bin/env node
// SINH BẢN VẼ app phụ huynh TỐI GIẢN + bảng "MỌI THỨ VỀ CON" (thầy lệnh 21/09/2026). CHỈ LÀ BẢN VẼ: không đụng mã chạy thật.
//   node docs/ban-ve-ph-moi-thu-ve-con-2109/sinh-ban-ve.mjs          ghi 2 trang HTML tĩnh tự chứa vào thư mục này
//   node docs/ban-ve-ph-moi-thu-ve-con-2109/sinh-ban-ve.mjs --anh    thêm: chụp Chromium vào ./anh/ (JPG ≤ 150 KB mỗi ảnh) + tự kiểm tràn / đích chạm / tương phản
// Dữ liệu và tên là GIẢ, nhưng các con số KHỚP nhau (script tự kiểm: 38 câu = tổng 5 mốc, 30 đúng, 52 phút…).
// Màu đọc từ tokens.css + m3-theme.css của app; phông Be Vietnam Pro lấy từ node_modules/@fontsource (để ảnh chụp đúng phông).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const PHONG = [400, 500, 600, 700, 800]
  .map((w) => { try { return doc(`node_modules/@fontsource/be-vietnam-pro/${w}.css`).replace(/url\(\.\/files\//g, 'url(../../node_modules/@fontsource/be-vietnam-pro/files/') } catch { return '' } })
  .join('\n')
const CSS = [PHONG, doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'ph-moi-thu.css'), 'utf8')].join('\n')

// ── biểu tượng (nét, kiểu lucide) ────────────────────────────────────
const IC = {
  trai: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  phai: '<path d="m9 18 6-6-6-6"/>',
  xuong: '<path d="m6 9 6 6 6-6"/>',
  dung: '<path d="M20 6 9 17l-5-5"/>',
  sai: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'dong-ho': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  khoa: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  tang: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  sach: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  lich: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  'on-lai': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  sao: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'muc-tieu': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  lua: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'but-chi': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  nha: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tia: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  gui: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  set: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
}
const ic = (t, cls = '') => `<svg class="mt-i ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${IC[t]}</svg>`
/** Công thức hoá học: số đứng sau chữ cái hoặc ngoặc đóng thành chỉ số dưới. Viết {CH3COOC2H5} trong chuỗi. */
const hoa = (s) => s.replace(/\{([^}]+)\}/g, (_, c) => c.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>'))

// ── DỮ LIỆU GIẢ (một nguồn, mọi khối đọc chung) ──────────────────────
const CON = { ten: 'Nguyễn Minh Khôi', goi: 'Khôi', lop: '12 - Tinh Hoa' }
const NGAY = 'Thứ Hai 21/09/2026'
const HOM_QUA = { cau: 33, dung: 25, phut: 45 }
const LUOT_GIAO_CON = 2
// day: 1 = đúng, 0 = sai, theo thứ tự con làm. dong: các dòng được VẼ (bản vẽ không vẽ đủ 38 dòng).
const MOC = [
  { id: 'moc-1', gio: '06:40', het: '06:47', nguon: 'Ôn lại', ten: 'Ôn lại 6 câu đến lịch', bt: 'on-lai', phut: 7, day: [1, 1, 1, 1, 0, 1], mo: false,
    dong: [
      { thu: 1, gio: '06:40', dang: 'Danh pháp ester', de: 'Ester {CH3COOC2H5} có tên gọi là', chon: 'A', dapAn: 'A', tg: '38 giây' },
      { thu: 5, gio: '06:44', dang: 'Xà phòng hoá chất béo', de: 'Xà phòng hoá hoàn toàn tristearin {(C17H35COO)3C3H5} bằng dung dịch NaOH dư, thu được glycerol và muối nào sau đây?', chon: 'C', dapAn: 'B', tg: '1 phút 55 giây' },
    ] },
  { id: 'moc-2', gio: '17:12', het: '17:33', nguon: 'Bài tập về nhà', ten: 'Bài tập về nhà “Ester – Lipid” · chặng 2', bt: 'sach', phut: 21, day: [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1], mo: true, them: 'nộp đúng nhịp',
    dong: [
      { thu: 1, gio: '17:12', dang: 'Phản ứng ester hoá', de: 'Đun nóng {CH3COOH} với {C2H5OH} (xúc tác {H2SO4} đặc) thu được ester có công thức là', chon: 'B', dapAn: 'B', tg: '52 giây' },
      { thu: 2, gio: '17:15', dang: 'Phản ứng thuỷ phân ester', de: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate {CH3COOC2H5} bằng 200 mL dung dịch NaOH 1 M. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là', chon: 'A', dapAn: 'C', tg: '3 phút 48 giây', lau: true, moRa: true,
        pa: [['A', '8,2'], ['B', '10,2'], ['C', '12,2'], ['D', '16,2']],
        giai: 'Số mol ester = 8,8 : 88 = 0,1 mol. Số mol NaOH = 0,2 mol, nên sau phản ứng NaOH còn dư 0,1 mol. Chất rắn khan gồm {CH3COONa} 0,1 mol (8,2 gam) và NaOH dư 0,1 mol (4,0 gam). Vậy m = 8,2 + 4,0 = 12,2 gam. Số 8,2 con chọn mới là khối lượng muối, chưa cộng NaOH còn dư.' },
      { thu: 9, gio: '17:29', dang: 'Bài toán hỗn hợp ester', de: 'Đốt cháy hoàn toàn 0,1 mol hỗn hợp hai ester no, đơn chức, mạch hở thu được 0,35 mol {CO2}. Khối lượng {H2O} thu được là', chon: 'D', dapAn: 'B', tg: '4 phút 10 giây', lau: true },
    ] },
  { id: 'moc-3', gio: '19:35', het: '19:41', nguon: 'Thử thách riêng', ten: 'Thử thách riêng hôm nay', bt: 'set', phut: 6, day: [1, 1, 0, 1, 1], mo: false, dong: [] },
  { id: 'moc-4', gio: '20:10', het: '20:21', nguon: 'Luyện dạng còn vấp', ten: 'Luyện dạng con còn vấp', bt: 'muc-tieu', phut: 11, day: [1, 1, 0, 1, 1, 1, 0, 1, 1], mo: false,
    dong: [
      { thu: 2, gio: '20:12', dang: 'Xà phòng hoá chất béo', de: 'Xà phòng hoá hoàn toàn 17,8 gam tristearin cần vừa đủ V mL dung dịch NaOH 1 M. Giá trị của V là', chon: 'B', dapAn: 'B', tg: '2 phút 05 giây' },
    ] },
  { id: 'moc-5', gio: '20:40', het: '20:47', nguon: 'Gia đình giao', ten: 'Gói gia đình giao lúc 19:58', bt: 'nha', gd: true, phut: 7, day: [1, 1, 1, 0, 1, 1], mo: false,
    dong: [
      { thu: 3, gio: '20:43', dang: 'Danh pháp ester', de: 'Tên gọi của ester {HCOOCH3} là', chon: 'D', dapAn: 'D', tg: '29 giây' },
    ] },
]
for (const m of MOC) { m.cau = m.day.length; m.dung = m.day.reduce((a, b) => a + b, 0) }
const TONG = { cau: MOC.reduce((a, m) => a + m.cau, 0), dung: MOC.reduce((a, m) => a + m.dung, 0), phut: MOC.reduce((a, m) => a + m.phut, 0) }
TONG.sai = TONG.cau - TONG.dung
TONG.pt = Math.round((TONG.dung / TONG.cau) * 100)
const LAM_LAU = 5
// 14 ngày 08/09 → 21/09 (08/09/2026 là Thứ Ba). Ngày cuối = hôm nay = TONG.cau.
const THU = ['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2']
const THU_DU = ['Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật', 'Thứ Hai']
const N14 = [22, 0, 18, 31, 26, 0, 24, 0, 20, 27, 16, 28, HOM_QUA.cau, TONG.cau]
let CHUOI = 0
for (let i = N14.length - 1; i >= 0 && N14[i] > 0; i--) CHUOI++
const DANG_TOT = [
  { ten: 'Danh pháp ester', dung: 11, tong: 12, bac: 2 },
  { ten: 'Phản ứng ester hoá', dung: 9, tong: 10, bac: 1, moi: true, tu: 'Biết' },
  { ten: 'Tính chất vật lí của lipid', dung: 8, tong: 9, bac: 1, moi: true, tu: 'Biết' },
]
const DANG_VAP = [
  { ten: 'Xà phòng hoá chất béo', dung: 3, tong: 9, bac: 0, xep: 4 },
  { ten: 'Bài toán hỗn hợp ester', dung: 4, tong: 10, bac: 0, xep: 2 },
  { ten: 'Phản ứng thuỷ phân ester', dung: 6, tong: 11, bac: 1, xep: 1 },
]
const ON = { mai: DANG_VAP.reduce((a, d) => a + d.xep, 0), khacPhuc: 12, tungSai: 31, lich: [['T3', '22/09', 7], ['T4', '23/09', 3], ['T5', '24/09', 4], ['T6', '25/09', 2], ['T7', '26/09', 0], ['CN', '27/09', 3], ['T2', '28/09', 0]] }
const CA = { ten: 'Kiểm tra 45 phút · Ester – Lipid', diem: '7,5', truoc: '6,75', hon: '0,75', dung: 21, tong: 28, nop: '09:12 · Thứ Bảy 19/09/2026', tg: '32 phút 10 giây',
  phan: [['Phần I · Trắc nghiệm', '3,75', '4,5', 'đúng 15/18 câu', 15 / 18], ['Phần II · Đúng–sai', '2,75', '4', 'đúng trọn 2/4 câu', 2.75 / 4], ['Phần III · Trả lời ngắn', '1', '1,5', 'đúng 4/6 câu', 4 / 6]] }

// tự kiểm số liệu: sai là dừng, không ghi trang
const dam = (dk, loi) => { if (!dk) { console.error('SỐ LIỆU LỆCH:', loi); process.exit(1) } }
dam(TONG.cau === 38 && TONG.dung === 30 && TONG.sai === 8 && TONG.phut === 52 && TONG.pt === 79, `tổng ${JSON.stringify(TONG)}`)
dam(CHUOI === 6, `chuỗi ${CHUOI}`)
dam(ON.mai === 7 && ON.lich[0][2] === ON.mai && ON.lich.reduce((a, l) => a + l[2], 0) === ON.tungSai - ON.khacPhuc, 'lịch ôn')
dam(CA.phan.reduce((a, p) => a + Number(p[1].replace(',', '.')), 0) === Number(CA.diem.replace(',', '.')), 'điểm ba phần')
for (const m of MOC) for (const d of m.dong) dam((d.chon === d.dapAn) === (m.day[d.thu - 1] === 1), `${m.id} câu ${d.thu}`)
dam(MOC.flatMap((m) => m.dong).filter((d) => d.lau).length <= LAM_LAU, 'làm lâu')

// ── mảnh dùng chung ──────────────────────────────────────────────────
const trang = ({ tieuDe, body, js = '' }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="m3 mt">${body}${js ? `<script>${js}</script>` : ''}</body></html>`

/** Vòng 4 cung = 4 việc của nhiệm vụ hôm nay (đều đã xong). */
const vong = (giua, nhan) => { const C = 2 * Math.PI * 52, khe = 7, cung = C / 4 - khe
  return `<div class="mt-vong" role="img" aria-label="${nhan}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="nen" cx="60" cy="60" r="52"/><circle class="dat" cx="60" cy="60" r="52" stroke-dasharray="${cung.toFixed(1)} ${khe}" stroke-dashoffset="${(-khe / 2).toFixed(1)}"/></svg><div class="mt-vong__giua">${giua}</div></div>` }
const thanh = (tl, nhan, cls = '') => `<span class="mt-thanh ${cls}" role="img" aria-label="${nhan}"><i style="width:${(tl * 100).toFixed(1)}%"></i></span>`
const BAC = ['Biết', 'Hiểu', 'Vận dụng']
const bac = (d) => `<span class="mt-bac" role="img" aria-label="Bậc hiện tại của con: ${BAC[d.bac]}${d.moi ? ' (mới lên hôm nay)' : ''}. Ba bậc: Biết, Hiểu, Vận dụng">${BAC.map((b, i) => `<span data-da="${i < d.bac ? 'qua' : i === d.bac ? (d.moi ? 'moi' : 'dang') : ''}">${i === d.bac && d.moi ? ic('tang') : ''}${b}</span>`).join('')}</span>`
const day = (chu, phu = '') => `<div class="mt-day" data-vung="thanh-day"><button class="mt-nut mt-nut--chinh" type="button">${ic('gui')}${chu}</button>${phu ? `<p>${phu}</p>` : ''}</div>`

// ── PH-0 · MÀN CHÍNH ─────────────────────────────────────────────────
const P = {}
P['ph-0-man-chinh'] = () => trang({ tieuDe: 'App phụ huynh · màn chính (bản vẽ)', body: `<main class="mt-nha">
  <header class="mt-chao"><small>Thầy Đỗ Đại Học · dành cho phụ huynh</small><h1>Chào anh/chị</h1><span class="mt-chao__anh" aria-hidden="true">${CON.goi[0]}</span><p>Con: <b>${CON.ten}</b><br>Lớp ${CON.lop}</p></header>
  <a class="mt-hn" href="ph-1-moi-thu-ve-con.html" aria-label="Hôm nay của con: đã đạt nhiệm vụ hôm nay, ${TONG.cau} câu đã làm, ${TONG.pt} phần trăm câu đúng, ${TONG.phut} phút học, chuỗi ${CHUOI} ngày học đều. Xem mọi thứ về con">
    <div class="mt-hn__dau"><h2>Hôm nay của con</h2><span>${NGAY.slice(0, -5)}</span></div>
    <div class="mt-hn__dat">${vong(ic('dung'), 'Nhiệm vụ hôm nay: đã đạt')}<div><h3>Con đã đạt nhiệm vụ hôm nay</h3><p class="mt-so">Xong 4 trong 4 việc · học gần nhất lúc ${MOC.at(-1).gio}</p></div></div>
    <ul class="mt-hn__so"><li><b>${TONG.cau}</b><span>câu<br>đã làm</span></li><li><b>${TONG.pt}<small>%</small></b><span>câu<br>đúng</span></li><li><b>${TONG.phut}</b><span>phút<br>học</span></li><li><b>${CHUOI}</b><span>ngày<br>học đều</span></li></ul>
    <div class="mt-hn__xem"><span>Xem mọi thứ về con<small>Từng câu, điểm mạnh, dạng còn vấp</small></span>${ic('phai', 'mt-i--l')}</div>
  </a>
  <section class="mt-the mt-ca-nho" aria-labelledby="h-ca0"><h2 id="h-ca0">Ca kiểm tra gần nhất của con</h2>
    <p class="mt-ca__ten">${CA.ten}</p><p class="mt-ca__phu">Nộp lúc ${CA.nop}</p>
    <div class="mt-ca-nho__than"><p class="mt-ca__diem" role="img" aria-label="Điểm ${CA.diem} trên 10"><b>${CA.diem}</b><span>/10 điểm</span></p>
      <p class="mt-ca-nho__hon"><b>Hơn ${CA.hon} điểm</b><small>so với lần trước của chính con (${CA.truoc} điểm)</small></p></div>
  </section>
</main>
${day('Giao thêm bài cho con', `Hôm nay còn ${LUOT_GIAO_CON} lượt giao · A.I Đỗ Đại Học chọn câu hợp với con`)}` })

// ── PH-1 · BẢNG "MỌI THỨ VỀ CON" ─────────────────────────────────────
const MUC = [['tong-quan', 'Tổng quan'], ['dong-thoi-gian', 'Dòng thời gian'], ['ca-kiem-tra', 'Ca kiểm tra'], ['manh-yeu', 'Điểm mạnh · cần luyện'], ['tung-cau', `Từng câu (${TONG.cau})`], ['btvn', 'Bài tập về nhà'], ['lich-on', 'Lịch ôn lại'], ['nhip-14-ngay', '14 ngày'], ['loi-ai', 'Lời A.I Đỗ Đại Học']]

const khoiHero = () => `<section class="mt-muc" id="tong-quan" aria-labelledby="h-1"><h2 id="h-1" class="mt-sr">Tổng quan hôm nay</h2>
  <div class="mt-hero">
    <p class="mt-hero__tren mt-so">${NGAY} · cập nhật lúc 21:00</p>
    <div class="mt-hero__dat">${vong(`<b>4/4</b><span>việc đã xong</span>`, 'Nhiệm vụ hôm nay: đã đạt, xong 4 trong 4 việc')}
      <div class="mt-hero__loi"><h3>Nhiệm vụ hôm nay: đã đạt</h3><p>Con xong cả 4 việc của hôm nay và làm thêm 1 gói gia đình giao.</p></div></div>
    <div class="mt-so-luoi">
      <div class="mt-so-o"><span class="mt-so-o__nhan">${ic('but-chi', 'mt-i--s')}Câu đã làm</span><b>${TONG.cau}<small>câu</small></b><span class="mt-so-o__phu">${MOC.length} lần ngồi học</span></div>
      <div class="mt-so-o"><span class="mt-so-o__nhan">${ic('dung', 'mt-i--s')}Câu đúng</span><b>${TONG.pt}<small>%</small></b><span class="mt-so-o__phu">${TONG.dung} trong ${TONG.cau} câu</span></div>
      <div class="mt-so-o"><span class="mt-so-o__nhan">${ic('dong-ho', 'mt-i--s')}Thời gian học</span><b>${TONG.phut}<small>phút</small></b><span class="mt-so-o__phu">dài nhất ${Math.max(...MOC.map((m) => m.phut))} phút</span></div>
      <div class="mt-so-o"><span class="mt-so-o__nhan">${ic('lua', 'mt-i--s')}Chuỗi học đều</span><b>${CHUOI}<small>ngày</small></b><span class="mt-so-o__phu">liên tục từ 16/09</span></div>
    </div>
    <div class="mt-hom-qua"><h4>So với hôm qua của chính con</h4><ul class="mt-so">
      <li>${ic('tang', 'mt-i--s')}Nhiều hơn ${TONG.cau - HOM_QUA.cau} câu (hôm qua ${HOM_QUA.cau} câu)</li>
      <li>${ic('tang', 'mt-i--s')}Câu đúng ${TONG.pt} % (hôm qua ${Math.round((HOM_QUA.dung / HOM_QUA.cau) * 100)} %)</li>
      <li>${ic('tang', 'mt-i--s')}Lâu hơn ${TONG.phut - HOM_QUA.phut} phút (hôm qua ${HOM_QUA.phut} phút)</li></ul></div>
  </div></section>`

const phutTu5h = (g) => { const [h, p] = g.split(':').map(Number); return h * 60 + p - 300 }
const khoiTimeline = () => `<section class="mt-muc mt-muc--7" id="dong-thoi-gian" aria-labelledby="h-2"><div class="mt-muc__dau"><h2 id="h-2">Dòng thời gian trong ngày</h2><p>chạm một mốc để xem từng câu</p></div>
  <div class="mt-the">
    <div class="mt-ngay" role="img" aria-label="Con học ${MOC.length} lần trong ngày: ${MOC.map((m) => `${m.gio} đến ${m.het}`).join(', ')}">
      <div class="mt-ngay__thanh">${MOC.map((m) => `<i style="left:${((phutTu5h(m.gio) / 1080) * 100).toFixed(2)}%;width:${((m.phut / 1080) * 100).toFixed(2)}%"></i>`).join('')}</div>
      <div class="mt-ngay__nhan" aria-hidden="true">${[6, 9, 12, 15, 18, 21].map((h) => `<span style="left:${(((h * 60 - 300) / 1080) * 100).toFixed(2)}%">${String(h).padStart(2, '0')}:00</span>`).join('')}</div>
      <p>Con ngồi học ${MOC.length} lần: 1 lần buổi sáng, 1 lần buổi chiều, 3 lần buổi tối.</p></div>
    <ol class="mt-tl">${MOC.map((m) => `<li><a href="#${m.id}" aria-label="${m.gio}, ${m.ten}: ${m.cau} câu, đúng ${m.dung}, ${m.phut} phút. Xem từng câu của mốc này">
      <span class="mt-tl__gio">${m.gio}</span><span class="mt-tl__nut${m.gd ? ' mt-tl__nut--gd' : ''}">${ic(m.bt)}</span>
      <div class="mt-tl__chu"><h3>${m.ten}</h3><p>${m.cau} câu · đúng ${m.dung} · ${m.phut} phút${m.them ? ` · ${m.them}` : ''}</p>${thanh(m.dung / m.cau, `đúng ${m.dung} trong ${m.cau} câu`, 'mt-thanh--xanh')}</div>
      ${ic('phai', 'mt-tl__mui')}</a></li>`).join('')}</ol>
  </div></section>`

const khoiCa = () => `<section class="mt-muc mt-muc--5" id="ca-kiem-tra" aria-labelledby="h-3"><div class="mt-muc__dau"><h2 id="h-3">Ca kiểm tra gần nhất</h2></div>
  <div class="mt-the mt-ca">
    <div class="mt-ca__chu"><p class="mt-ca__diem" role="img" aria-label="Điểm ${CA.diem} trên 10"><b>${CA.diem}</b><span>/10 điểm</span></p>
      <p class="mt-ca__ten">${CA.ten}</p><p class="mt-ca__phu">Nộp lúc ${CA.nop}</p><p class="mt-ca__phu">Đúng ${CA.dung}/${CA.tong} câu · làm trong ${CA.tg}</p>
      <span class="mt-ss">${ic('tang')}<span class="mt-so">Hơn lần trước của chính con ${CA.hon} điểm (lần trước ${CA.truoc})</span></span></div>
    <div class="mt-phan-ds">${CA.phan.map(([ten, d, tren, dem, tl]) => `<div class="mt-phan"><span class="mt-phan__ten">${ten}</span><span class="mt-phan__diem">${d}<small> /${tren} điểm</small></span>${thanh(tl, `${ten}: ${d} trên ${tren} điểm`)}<span class="mt-phan__dem">${dem}</span></div>`).join('')}</div>
  </div>
  <div class="mt-bien-the"><small>Mẫu biến thể · khi thầy chưa công bố điểm</small>
    <div class="mt-chua-cb"><span class="mt-chua-cb__bt">${ic('khoa')}</span><div><h3>Thầy chưa công bố điểm</h3><p class="mt-so">Con đã nộp bài lúc ${CA.nop}. Điểm và từng câu sẽ hiện khi thầy công bố.</p></div></div></div>
</section>`

const dongDang = (d, vap) => `<li class="mt-dang"><p class="mt-dang__ten">${d.ten}</p>
  <div class="mt-dang__hang"><span class="mt-dang__dem">đúng <b>${d.dung}/${d.tong}</b> câu</span>${bac(d)}</div>
  ${thanh(d.dung / d.tong, `đúng ${d.dung} trong ${d.tong} câu`, vap ? '' : 'mt-thanh--xanh')}
  ${vap ? `<span class="mt-chip mt-chip--cho mt-dang__xep mt-so">${ic('lich', 'mt-i--s')}${d.xep} câu vào lịch ôn ngày 22/09</span>` : ''}</li>`
const khoiManhYeu = () => { const moi = DANG_TOT.filter((d) => d.moi)
  return `<section class="mt-muc" id="manh-yeu" aria-labelledby="h-4"><div class="mt-muc__dau"><h2 id="h-4">Điểm mạnh · Điểm cần luyện</h2><p>tính trên 14 ngày gần đây</p></div>
  <div class="mt-len-bac"><span class="mt-len-bac__bt">${ic('tang', 'mt-i--l')}</span><div><h3>Hôm nay con lên bậc ở ${moi.length} dạng</h3><p>${moi.map((d) => `${d.ten}: ${d.tu} lên ${BAC[d.bac]}`).join(' · ')}</p></div></div>
  <div class="mt-hai-cot">
    <div class="mt-the mt-dang-the"><div class="mt-dang-the__dau"><span class="mt-dang-the__bt">${ic('sao')}</span><div><h3>Dạng con làm tốt</h3><p>3 dạng con đúng nhiều nhất trong 14 ngày</p></div></div><ul>${DANG_TOT.map((d) => dongDang(d, false)).join('')}</ul></div>
    <div class="mt-the mt-dang-the mt-dang-the--vap"><div class="mt-dang-the__dau"><span class="mt-dang-the__bt">${ic('muc-tieu')}</span><div><h3>Dạng con còn vấp</h3><p>A.I Đỗ Đại Học đã xếp ${ON.mai} câu của 3 dạng này vào lịch ôn ngày 22/09</p></div></div><ul>${DANG_VAP.map((d) => dongDang(d, true)).join('')}</ul></div>
  </div>
  <p class="mt-mo-ta">Mỗi dạng bài con đi qua ba bậc: Biết, Hiểu, Vận dụng.</p></section>` }

const chipKq = (d) => d.chon === d.dapAn ? `<span class="mt-chip mt-chip--ok">${ic('dung', 'mt-i--s')}Đúng</span>` : `<span class="mt-chip mt-chip--sai">${ic('sai', 'mt-i--s')}Sai</span>`
const dongCau = (m, d) => `<details class="mt-cau"${d.moRa ? ' open' : ''}><summary>
    <span class="mt-cau__gio"><b>${d.gio}</b><span>${m.nguon} · câu ${d.thu}/${m.cau}</span></span>
    <span class="mt-cau__kq">${chipKq(d)}${ic('xuong', 'mt-mui')}</span>
    <span class="mt-cau__de"><span class="mt-cau__dang">${d.dang}</span><span class="mt-cau__cau">${hoa(d.de)}</span></span>
    <span class="mt-cau__chan"><span class="mt-cau__chon">Con chọn <b>${d.chon}</b> · Đáp án <b>${d.dapAn}</b></span>
      <span class="mt-cau__tg-o"><span class="mt-cau__tg">${ic('dong-ho', 'mt-i--s')}${d.tg}</span>${d.lau ? `<span class="mt-chip mt-chip--luu-y">Làm lâu</span>` : ''}</span></span>
  </summary>${d.moRa ? `<div class="mt-cau__mo">
    <ul class="mt-pa" aria-label="Bốn phương án">${d.pa.map(([k, v]) => { const la = k === d.dapAn ? 'dung' : k === d.chon ? 'chon-sai' : ''
      return `<li${la ? ` data-la="${la}"` : ''}><b>${k}</b><span>${v}</span>${la === 'dung' ? `<small>${ic('dung', 'mt-i--s')}Đáp án đúng</small>` : la === 'chon-sai' ? `<small>${ic('sai', 'mt-i--s')}Con chọn</small>` : ''}</li>` }).join('')}</ul>
    <div class="mt-loi-giai"><h4>Lời giải ngắn</h4><p>${hoa(d.giai)}</p></div></div>` : `<div class="mt-cau__mo"><p class="mt-mo-ta">Bản vẽ chỉ mở sẵn một dòng mẫu (17:15). Bản thật: dòng nào mở ra cũng có bốn phương án và lời giải ngắn.</p></div>`}</details>`
const khoiMoc = (m) => { const con = m.cau - m.dong.length
  return `<section class="mt-moc" id="${m.id}" aria-label="${m.gio} · ${m.ten}">
  <h3 class="mt-moc__h"><button class="mt-moc__dau" type="button" aria-expanded="${m.mo}"><span class="mt-moc__bt${m.gd ? ' mt-moc__bt--gd' : ''}">${ic(m.bt)}</span><span class="mt-moc__ten">${m.gio} · ${m.ten}</span><span class="mt-moc__so">${m.cau} câu · đúng ${m.dung} · sai ${m.cau - m.dung} · ${m.phut} phút</span>${ic('xuong', 'mt-mui')}
    <span class="mt-moc__cham" role="img" aria-label="Lần lượt ${m.cau} câu: ${m.day.map((x, i) => `câu ${i + 1} ${x ? 'đúng' : 'sai'}`).join(', ')}">${m.day.map((x) => `<i class="mt-cham${x ? '' : ' mt-cham--sai'}"></i>`).join('')}</span></button></h3>
  ${m.mo ? m.dong.map((d) => dongCau(m, d)).join('') + `<p class="mt-moc__con">Bản vẽ rút gọn: còn ${con} câu nữa của mốc này, bản thật hiện đủ ${m.cau} câu</p>` : ''}</section>` }
const khoiTungCau = () => `<section class="mt-muc" id="tung-cau" aria-labelledby="h-5"><div class="mt-muc__dau"><h2 id="h-5">Từng câu con đã làm hôm nay</h2><p>${TONG.cau} câu · xếp theo giờ làm</p></div>
  <div class="mt-loc" role="group" aria-label="Lọc danh sách câu">
    <button type="button" aria-pressed="true">Tất cả <b>${TONG.cau}</b></button><button type="button" aria-pressed="false">${ic('sai', 'mt-i--s')}Sai <b>${TONG.sai}</b></button><button type="button" aria-pressed="false">${ic('dong-ho', 'mt-i--s')}Làm lâu <b>${LAM_LAU}</b></button><button type="button" aria-pressed="false">${ic('khoa', 'mt-i--s')}Chưa công bố <b>0</b></button></div>
  <p class="mt-chu-giai"><span><i class="mt-cham"></i>ô đặc: đúng</span><span><i class="mt-cham mt-cham--sai"></i>ô gạch chéo: sai</span><span>Làm lâu: hơn 3 phút một câu</span></p>
  <div class="mt-bang-dau" aria-hidden="true"><span>Giờ · nguồn</span><span>Dạng bài và đề</span><span>Con chọn · đáp án</span><span>Thời gian làm</span><span>Kết quả</span></div>
  ${MOC.map(khoiMoc).join('')}
  <div class="mt-bien-the"><small>Mẫu biến thể · câu thuộc bài con chưa nộp</small>
    <div class="mt-moc"><details class="mt-cau" style="border-top:0"><summary>
      <span class="mt-cau__gio"><b>21:05</b><span>Bài tập về nhà · chặng 3 · con đang làm</span></span>
      <span class="mt-cau__kq"><span class="mt-chip mt-chip--khoa">${ic('khoa', 'mt-i--s')}Chờ con nộp</span></span>
      <span class="mt-cau__de"><span class="mt-cau__dang">Phản ứng thuỷ phân ester</span><span class="mt-cau__cau">${hoa('Thuỷ phân ester {CH3COOCH3} trong môi trường acid thu được các sản phẩm là')}</span></span>
      <span class="mt-cau__chan"><span class="mt-cau__chon mt-cau__chon--rong">Con đã làm · kết quả hiện sau khi con nộp bài</span></span></summary></details></div></div>
</section>`

const khoiBtvn = () => `<section class="mt-muc mt-muc--6" id="btvn" aria-labelledby="h-6"><div class="mt-muc__dau"><h2 id="h-6">Bài tập về nhà</h2><p>1 bài đang chạy · 2 bài gần đây</p></div>
  <div class="mt-the mt-btvn"><p class="mt-nhom-ten">Đang chạy</p>
    <div class="mt-btvn__dau"><h3>Ester – Lipid</h3><span class="mt-chip mt-chip--cho mt-so">Xong 2 trong 5 chặng</span></div>
    <ol class="mt-chang" aria-label="Con đã xong 2 trong 5 chặng">${[1, 2, 3, 4, 5].map((c) => `<li${c <= 2 ? ' data-xong' : ''}>Chặng ${c}</li>`).join('')}</ol>
    <p class="mt-dong-bt">${ic('dung')}<span>Chặng 2: con nộp hôm nay lúc 17:33, đúng 9/12 câu<small>Nộp đúng nhịp: mỗi ngày một chặng</small></span></p>
    <p class="mt-dong-bt">${ic('dong-ho')}<span>Hạn nộp 12:00 · Thứ Sáu 25/09/2026<small>còn 3 ngày 15 giờ (tới 12:00 Thứ Sáu 25/09)</small></span></p>
    <p class="mt-nhom-ten mt-btvn__ngan">Gần đây · mới nhất trước</p><ul class="mt-btvn-ds">
    <li class="mt-btvn-dong"><div><h3>Ôn tập Alcohol – Phenol</h3><p>Nộp 21:40 · Thứ Năm 17/09/2026</p><span class="mt-chip mt-chip--ok">${ic('dung', 'mt-i--s')}Nộp đúng hạn</span></div><div class="mt-btvn-dong__diem"><b>8,2</b><small>/10 điểm</small></div></li>
    <li class="mt-btvn-dong"><div><h3>Ôn tập Carboxylic acid</h3><p>Nộp 23:05 · Chủ nhật 13/09/2026</p><span class="mt-chip mt-chip--luu-y">${ic('dong-ho', 'mt-i--s')}Nộp trễ 1 giờ</span></div><div class="mt-btvn-dong__diem"><b>7,0</b><small>/10 điểm</small></div></li></ul></div>
</section>`

const khoiOn = () => { const max = Math.max(...ON.lich.map((l) => l[2]))
  return `<section class="mt-muc mt-muc--6" id="lich-on" aria-labelledby="h-7"><div class="mt-muc__dau"><h2 id="h-7">Lịch ôn lại</h2><p>các câu con từng làm sai</p></div>
  <div class="mt-the mt-on">
    <p class="mt-on__mai"><b>${ON.mai}</b><span>câu đến lịch ôn ngày mai<small>Thứ Ba 22/09/2026 · khoảng 10 phút</small></span></p>
    <div class="mt-on__kp"><p><b>Đã khắc phục ${ON.khacPhuc} trong ${ON.tungSai} câu từng sai</b><span>còn ${ON.tungSai - ON.khacPhuc} câu đang trong lịch ôn</span></p>${thanh(ON.khacPhuc / ON.tungSai, `đã khắc phục ${ON.khacPhuc} trong ${ON.tungSai} câu`, 'mt-thanh--xanh')}</div>
    <div><p class="mt-nhom-ten" style="margin-bottom:10px">Số câu đến lịch ôn · 7 ngày tới</p>
      <div class="mt-cot" role="img" aria-label="Số câu đến lịch ôn 7 ngày tới: ${ON.lich.map((l) => `${l[1]} có ${l[2]} câu`).join(', ')}">${ON.lich.map(([t, n, c], i) => `<div>${c ? `<small class="so">${c}</small><i${i ? ' class="nhat"' : ''} style="height:${Math.round((c / max) * 64)}px"></i>` : `<small class="so">0</small><i class="trong"></i>`}<small>${t}</small><small>${n.slice(0, 2)}</small></div>`).join('')}</div></div>
  </div></section>` }

const khoi14 = () => { const muc = (c) => (c === 0 ? 0 : c < 20 ? 1 : c < 30 ? 2 : 3); const coHoc = N14.filter((c) => c > 0).length
  return `<section class="mt-muc" id="nhip-14-ngay" aria-labelledby="h-8"><div class="mt-muc__dau"><h2 id="h-8">14 ngày gần đây</h2><p>số câu con làm mỗi ngày · 08/09 đến 21/09</p></div>
  <div class="mt-the"><ol class="mt-14" aria-label="Số câu con làm mỗi ngày, từ 08/09 đến 21/09">${N14.map((c, i) => `<li data-muc="${muc(c)}"${i === 13 ? ' data-nay' : ''} aria-label="${THU_DU[i % 7]} ${String(8 + i).padStart(2, '0')}/09: ${c ? `${c} câu` : 'không học'}"><small>${THU[i % 7]} ${String(8 + i).padStart(2, '0')}</small><b>${c || '–'}</b><small>${c ? 'câu' : 'nghỉ'}</small></li>`).join('')}</ol>
    <p class="mt-thang-mau" aria-hidden="true"><span><i style="box-shadow:inset 0 0 0 1.5px var(--mt-vien-dam)"></i>không học</span><span><i style="background:var(--m3-primary-container)"></i>dưới 20 câu</span><span><i style="background:color-mix(in srgb, var(--m3-primary) 30%, var(--m3-primary-container))"></i>20 đến 29 câu</span><span><i style="background:var(--m3-primary)"></i>từ 30 câu</span><span>Ô viền xanh lá: hôm nay</span></p>
    <p class="mt-14-chu"><span>${ic('lich')}Con học ${coHoc} trong 14 ngày · tổng ${N14.reduce((a, b) => a + b, 0)} câu</span><span>${ic('dong-ho')}Con thường học từ 19:30 đến 21:00</span></p></div></section>` }

const khoiLoi = () => `<section class="mt-muc" id="loi-ai" aria-labelledby="h-9"><div class="mt-muc__dau"><h2 id="h-9">Lời A.I Đỗ Đại Học gửi anh/chị</h2></div>
  <div class="mt-thu"><h3>${ic('tia', 'mt-i--s')} Hôm nay · ${NGAY}</h3>
    <p>Hôm nay ${CON.goi} làm ${TONG.cau} câu trong ${TONG.phut} phút, đúng ${TONG.dung} câu, nhiều hơn hôm qua ${TONG.cau - HOM_QUA.cau} câu. Con lên bậc Hiểu ở hai dạng: Phản ứng ester hoá và Tính chất vật lí của lipid. Dạng Xà phòng hoá chất béo con mới đúng ${DANG_VAP[0].dung} trong ${DANG_VAP[0].tong} câu, nên ngày mai 22/09 con sẽ ôn lại ${DANG_VAP[0].xep} câu dạng này. Gói ${MOC[4].cau} câu anh/chị giao lúc 19:58 con đã làm xong lúc ${MOC[4].het}, đúng ${MOC[4].dung} câu.</p>
    <small>A.I Đỗ Đại Học viết từ số liệu học của con, lúc 21:00</small></div>
  <div class="mt-goi-y"><h3>Anh/chị có thể làm gì</h3><ol>
    <li><b>1</b><span>Hỏi con kể lại cách giải câu thuỷ phân ethyl acetate lúc 17:15 (đáp án 12,2 gam). Con nói được vì sao phải cộng phần NaOH còn dư là con đã hiểu.</span></li>
    <li><b>2</b><span>Ngày mai nhắc con làm ${ON.mai} câu đến lịch ôn, khoảng 10 phút.</span></li></ol></div></section>`

const JS_MUC_LUC = `(()=>{const ul=document.querySelector('.mt-muc-luc ul');const ls=[...ul.querySelectorAll('a')];const ms=ls.map(a=>document.querySelector(a.getAttribute('href')));let cu=-1;
const f=()=>{const hep=innerWidth<1000,y=hep?96:48;let k=0;ms.forEach((m,i)=>{if(m.getBoundingClientRect().top<=y)k=i});if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)k=ms.length-1;if(k===cu)return;cu=k;
ls.forEach((a,i)=>{if(i===k)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});if(hep){const a=ls[k];ul.scrollTo({left:a.offsetLeft-ul.offsetLeft-(ul.clientWidth-a.offsetWidth)/2,behavior:'instant'})}};
addEventListener('scroll',f,{passive:true});addEventListener('resize',f);f()})()`

P['ph-1-moi-thu-ve-con'] = () => trang({ tieuDe: 'App phụ huynh · Mọi thứ về con (bản vẽ)', js: JS_MUC_LUC, body: `<header class="mt-tren"><a class="mt-nut-tron" href="ph-0-man-chinh.html" aria-label="Về màn chính">${ic('trai', 'mt-i--l')}</a><div class="mt-tren-ten"><h1>Mọi thứ về con</h1><p>${CON.ten} · Lớp ${CON.lop}</p></div></header>
<div class="mt-khung"><div class="mt-canh">
  <nav class="mt-muc-luc" aria-label="Các mục của bảng"><span class="mt-muc-luc__tieu">TRONG BẢNG NÀY</span><ul>${MUC.map(([id, t], i) => `<li><a href="#${id}"${i === 0 ? ' aria-current="true"' : ''}>${t}</a></li>`).join('')}</ul></nav>
  <div class="mt-canh-giao"><button class="mt-nut mt-nut--chinh mt-nut--rong" type="button">${ic('gui')}Giao thêm bài cho con</button><p class="mt-so">Hôm nay còn ${LUOT_GIAO_CON} lượt giao · A.I Đỗ Đại Học chọn câu hợp với con</p></div></div>
  <main class="mt-noi-dung">${khoiHero()}${khoiTimeline()}${khoiCa()}${khoiManhYeu()}${khoiTungCau()}${khoiBtvn()}${khoiOn()}${khoi14()}${khoiLoi()}</main></div>
${day(`Giao thêm bài cho con · còn ${LUOT_GIAO_CON} lượt`)}` })

for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
console.log(`đã ghi ${Object.keys(P).length} trang HTML vào ${AQUI} · số liệu khớp: ${TONG.cau} câu, ${TONG.dung} đúng, ${TONG.phut} phút, chuỗi ${CHUOI} ngày`)

// ── CHỤP ẢNH + TỰ KIỂM ───────────────────────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  for (const f of readdirSync(RA)) if (f.endsWith('.jpg')) unlinkSync(join(RA, f))
  const TRAN = 150 * 1024
  const browser = await chromium.launch()
  let xau = 0
  /** Chạy trong trang: tràn ngang, đích chạm < 48, chữ tương phản < 4,5:1 (chữ lớn < 3:1). */
  const KIEM = () => {
    const doi = (s) => { let m = s.match(/^rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
      m = s.match(/^color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] } return null }
    const tron = (tren, duoi) => { const a = tren[3]; return [0, 1, 2].map((i) => tren[i] * a + duoi[i] * (1 - a)).concat(1) }
    const sang = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
    const nen = (e) => { const lop = []; for (let x = e; x; x = x.parentElement) { const c = doi(getComputedStyle(x).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] === 1) break } } let kq = [255, 255, 255, 1]; for (const c of lop.reverse()) kq = tron(c, kq); return kq }
    const tp = []
    for (const e of document.querySelectorAll('body *')) {
      if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
      if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || e.closest('.mt-sr')) continue
      const b = nen(e); const chu = tron(doi(cs.color) || [0, 0, 0, 1], b); const l1 = sang(chu), l2 = sang(b); const ti = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      const co = parseFloat(cs.fontSize), lon = co >= 24 || (co >= 18.66 && Number(cs.fontWeight) >= 700)
      if (ti < (lon ? 3 : 4.5)) tp.push(`${e.className || e.tagName} "${e.textContent.trim().slice(0, 24)}" ${ti.toFixed(2)}`)
    }
    const nho = [...document.querySelectorAll('a,button,summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 47.5 || r.width < 47.5) }).map((e) => `${e.className} ${Math.round(e.getBoundingClientRect().height)}`)
    const chuNho = [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width > 2 && !e.closest('sub') && parseFloat(getComputedStyle(e).fontSize) < 12).length
    return { cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth, nho, tp, chuNho, tren: document.querySelector('.mt-muc-luc')?.offsetHeight ?? 0, day: (() => { const d = document.querySelector('.mt-day'); return d && getComputedStyle(d).display !== 'none' ? d.offsetHeight : 0 })() }
  }
  const Q = [84, 76, 68, 60, 52, 46, 40]
  const chup = async (tr, tep, qs = Q) => { for (const q of qs) { const buf = await tr.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= TRAN) { writeFileSync(join(RA, tep), buf); return `${Math.round(buf.length / 1024)} KB (chất lượng ${q})` } } return '' }
  const mo = async (ten, w, h, toi, dsf = 1) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: dsf }); const tr = await ctx.newPage(); const loi = []; tr.on('pageerror', (e) => loi.push(String(e)))
    await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); await tr.goto('file://' + join(AQUI, `${ten}.html`), { waitUntil: 'load' }); await tr.evaluate(() => document.fonts.ready); await tr.waitForTimeout(250); return { ctx, tr, loi } }
  const bao = (tep, kq, kt, loi) => { console.log(tep.padEnd(40), kq || 'QUÁ 150 KB', `· cao ${kt.cao} · tràn ${kt.tran} · đích<48 ${kt.nho.length} · tương phản thấp ${kt.tp.length} · chữ<12 ${kt.chuNho} · lỗi ${loi.length}`); if (kt.nho.length) console.log('   đích nhỏ:', kt.nho.slice(0, 6).join(' | ')); if (kt.tp.length) console.log('   tương phản:', kt.tp.slice(0, 8).join(' | ')); if (!kq || kt.tran > 0 || kt.nho.length || kt.tp.length || kt.chuNho || loi.length) xau++ }

  // màn chính: một khung điện thoại 390 × 844 (thanh đáy nằm đúng chỗ)
  for (const toi of [false, true]) { const { ctx, tr, loi } = await mo('ph-0-man-chinh', 390, 844, toi); const kt = await tr.evaluate(KIEM); const tep = `ph-0-man-chinh-390-${toi ? 'toi' : 'sang'}.jpg`
    const vua = await tr.evaluate(() => document.querySelector('.mt-nha > :last-child').getBoundingClientRect().bottom <= document.querySelector('.mt-day').getBoundingClientRect().top - 8)
    if (!vua) { console.log('   màn chính KHÔNG vừa 844: chụp cả trang'); await tr.setViewportSize({ width: 390, height: kt.cao }) }
    bao(tep, await chup(tr, tep), kt, loi); await ctx.close() }

  // bảng: chụp theo ĐOẠN CUỘN (390: mục lục dính trên + thanh dính đáy có mặt ở mọi ảnh). Điểm dừng cuộn BẮT vào mép trên một khối/dòng để không cắt ngang số to; nội dung nối tiếp, không mất dòng nào.
  const MOC_DUNG = '.mt-muc, .mt-the, .mt-hero, .mt-moc, .mt-cau, .mt-dang, .mt-tl li, .mt-phan, .mt-so-luoi, .mt-hom-qua, .mt-pa, .mt-loi-giai, .mt-bien-the, .mt-len-bac, .mt-btvn-dong, .mt-dong-bt, .mt-on__kp, .mt-cot, .mt-14, .mt-thu, .mt-goi-y li, .mt-hai-cot'
  const xepDoan = (cao, V, tren, day, ung) => { const ys = [0]; let het = V - day
    while (het < cao - 1 && ys.length < 12) { const dau = ys.at(-1) + tren + 120; const c = ung.filter((u) => u - 8 <= het && u > dau).at(-1); let y = c ? c - tren - 8 : het - tren; y = Math.min(y, cao - V); ys.push(y); het = y >= cao - V ? cao : y + V - day }
    return ys }
  for (const [w, toi, chiLay] of [[390, false, 99], [390, true, 2], [1440, false, 99]]) {
    const do1 = await mo('ph-1-moi-thu-ve-con', w, 900, toi); const kt = await do1.tr.evaluate(KIEM); if (do1.loi.length) console.log('   lỗi trang:', do1.loi[0].slice(0, 200))
    const ung = await do1.tr.evaluate((q) => [...new Set([...document.querySelectorAll(q)].flatMap((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top + scrollY), Math.round(r.bottom + scrollY) + 8] }))].sort((a, b) => a - b), w < 1000 ? 'main :is(section, div, p, h2, h3, h4, li, ul, ol, details, summary > span, .mt-tl__chu > *)' : MOC_DUNG); await do1.ctx.close()
    const hep = w < 1000, tren = hep ? kt.tren : 0, day = hep ? kt.day : 0, TRAN_V = hep ? 1665 : 99999
    // 1440: thầy cần 2 ảnh (nửa trên / nửa dưới). Thử tỉ lệ 1 trước; quá 150 KB thì chụp tỉ lệ 0,75 (ảnh rộng 1080 px); vẫn quá thì chia 3.
    const cachThu = hep ? [{ n: 4, dsf: 1, qs: Q }, { n: 5, dsf: 1, qs: Q }, { n: 6, dsf: 1, qs: Q }] : [{ n: 2, dsf: 1, qs: [84, 76, 68, 60] }, { n: 2, dsf: 0.75, qs: [84, 76, 68, 60, 52] }, { n: 3, dsf: 1, qs: Q }]
    for (const { n, dsf, qs } of cachThu) {
      let V = Math.ceil((kt.cao + (n - 1) * (tren + day)) / n), ys = xepDoan(kt.cao, V, tren, day, ung)
      while (ys.length > n && V < TRAN_V) { V += 5; ys = xepDoan(kt.cao, V, tren, day, ung) }
      if (ys.length > n) continue
      const { ctx, tr, loi } = await mo('ph-1-moi-thu-ve-con', w, V, toi, dsf); let hong = false
      for (let k = 0; k < Math.min(ys.length, chiLay); k++) { await tr.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), ys[k]); await tr.waitForTimeout(200)
        const tep = `ph-1-moi-thu-${w}-${toi ? 'toi' : 'sang'}-${k + 1}.jpg`; const kq = await chup(tr, tep, qs); if (!kq) { hong = true; break } bao(tep, `${kq} · ${Math.round(w * dsf)}×${Math.round(V * dsf)} px · cuộn ${Math.round(ys[k])}`, k === 0 ? kt : { ...kt, nho: [], tp: [], chuNho: 0, tran: 0 }, loi) }
      await ctx.close(); if (!hong) break; console.log(`   ${w}: quá 150 KB với ${n} đoạn ở tỉ lệ ${dsf}, thử cách kế`)
    }
  }
  await browser.close()
  console.log(xau ? `${xau} mục có vấn đề` : 'sạch: mọi ảnh ≤ 150 KB, 0 tràn, 0 đích < 48, 0 chữ tương phản thấp, 0 lỗi')
}
