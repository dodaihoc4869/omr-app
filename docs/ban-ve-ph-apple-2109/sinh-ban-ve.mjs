#!/usr/bin/env node
// SINH BẢN VẼ app phụ huynh KIỂU APPLE (thầy lệnh 21/09/2026). CHỈ LÀ BẢN VẼ: không đụng mã chạy thật.
//   node docs/ban-ve-ph-apple-2109/sinh-ban-ve.mjs          ghi các trang HTML tĩnh tự chứa vào thư mục này
//   node docs/ban-ve-ph-apple-2109/sinh-ban-ve.mjs --anh    thêm: chụp Chromium vào ./anh/ (JPG ≤ 150 KB) + bảng KIỂM TRÀN 320/360/390/412/430 + đích chạm + tương phản
// Dữ liệu và tên là GIẢ nhưng KHỚP với bản vẽ docs/ban-ve-ph-moi-thu-ve-con-2109 (38 câu, 30 đúng, 79 %, 52 phút, chuỗi 6 ngày, ca 7,5 điểm).
// Màu đọc từ tokens.css + m3-theme.css của app. PHÔNG: chồng phông hệ thống (máy Mac chụp ra San Francisco); KHÔNG nhúng tệp phông Apple.
// Trạng thái của trang đổi bằng phần sau dấu # của đường dẫn:  #canh=day|thua|chua-hoc & giao=san|da-giao|het-luot & menu=mo & ten=dai & co=115
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const CSS = [doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'ph-apple.css'), 'utf8')].join('\n')

// ── biểu tượng nét mảnh, tự vẽ (tinh thần SF Symbols) ────────────────
const IC = {
  phai: '<path d="m9 5 7 7-7 7"/>',
  trai: '<path d="m15 5-7 7 7 7"/>',
  dung: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'dung-tron': '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.8 2.8 5.2-6"/>',
  gui: '<path d="M21 3 10.2 13.8"/><path d="m21 3-6.6 18-4.2-7.2L3 9.6z"/>',
  doi: '<path d="M7.5 4 4 7.5 7.5 11"/><path d="M4 7.5h13"/><path d="M16.5 13 20 16.5 16.5 20"/><path d="M20 16.5H7"/>',
  lich: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10h17"/><path d="m9 15.2 2.2 2.2 3.8-4.2"/>',
  tang: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  'on-lai': '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/>',
  khoa: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sach: '<path d="M12 6.5C10.3 5 7.8 4.5 4 4.5v13c3.8 0 6.3.5 8 2 1.7-1.5 4.2-2 8-2v-13c-3.8 0-6.3.5-8 2z"/><path d="M12 6.5v13"/>',
}
const ic = (t, cls = '') => `<svg class="ap-i ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${IC[t]}</svg>`

// ── DỮ LIỆU GIẢ (khớp bản vẽ "Mọi thứ về con") ───────────────────────
const CON = { ten: 'Nguyễn Minh Khôi', tenDai: 'Nguyễn Hoàng Bảo Khánh An', lop: '12 - Tinh Hoa', sbd: '120347' }
const chuDau = (ten) => ten.trim().split(/\s+/).at(-1)[0]
const NGAY = 'Thứ Hai 21/09/2026'
const CA = { diem: '7,5', ngay: 'Thứ Bảy 19/09', hon: '0,75' }
const MOC = [
  { gio: '06:40', ten: 'Ôn lại 6 câu đến lịch', bt: 'on-lai', cau: 6, dung: 5, phut: 7 },
  { gio: '17:12', ten: 'Bài tập về nhà <span class="ap-lien">“Ester – Lipid”</span> · chặng\u00a02', tenTron: 'Bài tập về nhà Ester – Lipid, chặng 2', bt: 'sach', cau: 12, dung: 9, phut: 21, them: 'nộp đúng nhịp' },
  { gio: '19:35', cau: 5, dung: 4, phut: 6 }, { gio: '20:10', cau: 9, dung: 7, phut: 11 }, { gio: '20:40', cau: 6, dung: 5, phut: 7 },
]
const TONG = { cau: MOC.reduce((a, m) => a + m.cau, 0), dung: MOC.reduce((a, m) => a + m.dung, 0), phut: MOC.reduce((a, m) => a + m.phut, 0) }
TONG.pt = Math.round((TONG.dung / TONG.cau) * 100)
const HOM_QUA = { cau: 33, dung: 25, phut: 45 }
const BAY_NGAY = [0, 20, 27, 16, 28, 33, TONG.cau] // Thứ Ba 15/09 → Thứ Hai 21/09
let CHUOI = 0
for (let i = BAY_NGAY.length - 1; i >= 0 && BAY_NGAY[i] > 0; i--) CHUOI++
/** Ba cảnh dữ liệu của thẻ "Hôm nay của con" (phương án A vẽ đủ cả ba). */
const CANH = {
  day: { viec: 4, dat: true, loi: 'Con đã đạt nhiệm vụ hôm nay', phu: 'Học gần nhất lúc 20:47', cau: TONG.cau, pt: TONG.pt, phut: TONG.phut, chuoi: CHUOI, chuoiPhu: 'từ 16/09 đến nay', ca: CA },
  thua: { viec: 1, loi: 'Con đang làm nhiệm vụ hôm nay', phu: 'Xong 1 trong 4 việc</p><p>Học gần nhất lúc 19:20', cau: 9, pt: Math.round((5 / 9) * 100), phut: 11, chuoi: 4, chuoiPhu: 'từ 18/09 đến nay', ca: null },
  'chua-hoc': { viec: 0, loi: 'Hôm nay con chưa học', phu: 'Lần học gần nhất: 21:15 · Chủ nhật 20/09/2026', cau: 0, pt: null, phut: 0, chuoi: 5, chuoiPhu: 'tính đến hôm qua', ca: CA },
}
const dam = (dk, loi) => { if (!dk) { console.error('SỐ LIỆU LỆCH:', loi); process.exit(1) } }
dam(TONG.cau === 38 && TONG.dung === 30 && TONG.phut === 52 && TONG.pt === 79 && CHUOI === 6 && CANH.thua.pt === 56, JSON.stringify(TONG))

// ── mảnh dùng chung ──────────────────────────────────────────────────
const JS = `(()=>{const b=document.body,h=new URLSearchParams(location.hash.slice(1));
for(const k of ['canh','giao','menu'])if(h.get(k))b.dataset[k]=h.get(k);
if(h.get('co'))document.documentElement.style.fontSize=h.get('co')+'%';
if(h.get('ten')==='dai'){document.querySelectorAll('[data-ten]').forEach(e=>e.textContent=${JSON.stringify(CON.tenDai)});document.querySelectorAll('[data-chu-dau]').forEach(e=>e.textContent=${JSON.stringify(chuDau(CON.tenDai))})}
const nut=document.querySelector('.ap-anh'),dat=(mo)=>{b.dataset.menu=mo?'mo':'dong';nut.setAttribute('aria-expanded',String(mo))};
if(nut){nut.setAttribute('aria-expanded',String(b.dataset.menu==='mo'));nut.addEventListener('click',()=>dat(b.dataset.menu!=='mo'));document.querySelector('.ap-phu').addEventListener('click',()=>dat(false));addEventListener('keydown',e=>{if(e.key==='Escape')dat(false)})}
document.querySelectorAll('[data-bam-giao]').forEach(n=>n.addEventListener('click',()=>{b.dataset.giao=b.dataset.giao==='san'?'da-giao':'het-luot'}));
const day=document.querySelector('.ap-day');if(day){const f=()=>b.style.setProperty('--ap-day-cao',day.offsetHeight+'px');new ResizeObserver(f).observe(day);f()}})()`

const trang = ({ tieuDe, lop = '', body }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<!-- iPhone / Mac: San Francisco có sẵn. Máy khác (Android, Windows): nạp Inter (giấy phép OFL). Bản thật nên tự chứa Inter qua @fontsource/inter. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="m3 ap ${lop}" data-canh="day" data-giao="san" data-menu="dong">${body}<script>${JS}</script></body></html>`

/** Vòng tiến độ kiểu Activity ring: tl = phần đã xong (0..1). Đủ 1 thì vòng khép kín + màu xanh lá "đã đạt". */
const vong = (tl, giua, nhan) => { const R = 50 - 6.5, C = 2 * Math.PI * R
  return `<div class="ap-vong"${tl >= 1 ? ' data-dat' : ''} role="img" aria-label="${nhan}"><svg viewBox="0 0 100 100" aria-hidden="true" style="--vong-day:13"><circle class="nen" cx="50" cy="50" r="${R}"/>${tl > 0 ? `<circle class="dat" cx="50" cy="50" r="${R}" stroke-dasharray="${(C * tl).toFixed(1)} ${C.toFixed(1)}"/>` : ''}</svg><div class="ap-vong__giua">${giua}</div></div>` }

const dau = (tieuDe) => `<header class="ap-dau">
  <div><p class="ap-dau__nho">Thầy Đỗ Đại Học</p><h1>${tieuDe}</h1></div>
  <div class="ap-tk"><button class="ap-anh" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-tk" aria-label="Tài khoản: mở để đổi số báo danh"><span data-chu-dau>${chuDau(CON.ten)}</span></button>
    <button class="ap-phu" type="button" tabindex="-1" aria-label="Đóng menu"></button>
    <div class="ap-menu" id="menu-tk" role="menu" aria-label="Tài khoản">
      <button class="ap-menu__muc" type="button" role="menuitem"><span>Đổi số báo danh</span>${ic('doi')}</button>
      <p class="ap-menu__chu">Đang xem: số báo danh ${CON.sbd} của con</p></div></div>
  <p class="ap-dau__con"><b data-ten>${CON.ten}</b> · Lớp ${CON.lop}</p>
</header>`

const hangXem = (cls = '') => `<a class="ap-hang ${cls}" href="ph-c-dau-bang.html"><span>Xem mọi thứ về con<small>Từng câu, điểm mạnh, dạng còn vấp</small></span>${ic('phai', 'ap-i--mui')}</a>`

/** Thanh đáy: nút "Giao thêm bài cho con" với ba trạng thái (sẵn · đã giao · hết lượt). gon = chỉ nút, không dòng phụ (dùng ở bảng). */
const thanhDay = (gon = false) => `<div class="ap-day" data-vung="thanh-day"><div class="ap-day__trong">
  <div data-khi-giao="san"><button class="ap-nut" type="button" data-bam-giao>${ic('gui')}Giao thêm bài cho con</button>${gon ? '' : `<p class="ap-day__phu"><span>Hôm nay còn 2 lượt giao</span><i aria-hidden="true"> · </i><span>A.I Đỗ Đại Học chọn câu hợp với con</span></p>`}</div>
  <div data-khi-giao="da-giao"><div class="ap-xong" role="status">${ic('dung-tron')}<p>Đã giao cho con 6 câu, khoảng 8 phút<small>Lúc 21:04 · hôm nay còn 1 lượt giao</small></p></div>
    <button class="ap-nut" type="button" data-bam-giao>${ic('gui')}Giao thêm bài cho con</button></div>
  <div data-khi-giao="het-luot"><button class="ap-nut" type="button" disabled>${ic('gui')}Giao thêm bài cho con</button><p class="ap-day__phu">Hôm nay đã giao đủ 3 lượt, mai giao tiếp được</p></div>
</div></div>`

// ── PHƯƠNG ÁN A · "Thẻ sáng" ─────────────────────────────────────────
const oSo = (so, donVi, nhan, phu = '') => `<li><b class="ap-so__so${so === '—' ? ' ap-so__so--rong' : ''}">${so}${donVi ? `<small>${donVi}</small>` : ''}</b><span class="ap-so__nhan">${nhan}</span>${phu ? `<span class="ap-so__phu">${phu}</span>` : ''}</li>`
const oDiem = (ca) => ca
  ? oSo(ca.diem, 'điểm', 'ca kiểm tra gần nhất')
  : `<li><b class="ap-so__so ap-so__so--rong" aria-hidden="true">—</b><span class="ap-so__nhan"><b>Thầy chưa công bố điểm</b></span></li>`
/** Dòng phụ của ô điểm: đặt NGAY DƯỚI lưới, rộng hết thẻ, để bốn ô số cao bằng nhau và chữ không bị bó 3 dòng trong ô hẹp. */
const dongCa = (ca) => ca
  ? `<p class="ap-hn__ca">${ic('tang', 'ap-i--s')}<span>Ca kiểm tra ${ca.ngay}: <b>hơn ${ca.hon} điểm</b> so với lần trước của chính con</span></p>`
  : `<p class="ap-hn__ca">${ic('khoa', 'ap-i--s')}<span>Ca kiểm tra ${CA.ngay}: con đã nộp bài, điểm hiện khi thầy công bố</span></p>`
const theHomNay = (k, c) => `<div data-khi-canh="${k}">
    <div class="ap-hn__dat"${c.dat ? ' data-dat' : ''}>${vong(c.viec / 4, c.dat ? ic('dung') : `${c.viec}/4`, `Nhiệm vụ hôm nay: xong ${c.viec} trong 4 việc`)}<div><h2>${c.loi}</h2><p>${c.phu}</p></div></div>
    <ul class="ap-luoi">${oSo(c.cau, '', 'câu đã làm')}${c.pt === null ? oSo('—', '', 'câu đúng') : oSo(c.pt, '%', 'câu đúng')}${oSo(c.phut, '', 'phút học')}${oDiem(c.ca)}</ul>
    <div class="ap-hn__duoi">${dongCa(c.ca)}<div class="ap-hn__chuoi"><span class="ap-chip">${ic('lich')}Chuỗi ${c.chuoi} ngày học đều</span><span>${c.chuoiPhu}</span></div></div>
  </div>`

const P = {}
P['ph-a-man-chinh'] = () => trang({ tieuDe: 'App phụ huynh · Phương án A “Thẻ sáng” (bản vẽ)', body: `<main class="ap-man ap-man--a">
  ${dau('Hôm nay của con')}
  <section class="ap-the ap-hn" aria-label="Hôm nay của con">
    <p class="ap-hn__ngay">${NGAY}</p>
    ${Object.entries(CANH).map(([k, c]) => theHomNay(k, c)).join('')}
    ${hangXem()}
  </section>
</main>
${thanhDay()}` })

// ── PHƯƠNG ÁN B · "Widget" ───────────────────────────────────────────
P['ph-b-man-chinh'] = () => { const c = CANH.day
  return trang({ tieuDe: 'App phụ huynh · Phương án B “Widget” (bản vẽ)', body: `<main class="ap-man ap-man--b">
  ${dau('Chào anh/chị')}
  <section class="ap-the ap-w ap-w-lon" aria-labelledby="w-hn">
    <div class="ap-w__dau"><h2 class="ap-w__ten ap-w__ten--nhan" id="w-hn">Hôm nay của con</h2><span class="ap-w__ngay">${NGAY.slice(0, -5)}</span></div>
    <div class="ap-w-lon__than">${vong(1, `4/4<small>việc đã xong</small>`, 'Nhiệm vụ hôm nay: xong 4 trong 4 việc')}
      <ul class="ap-ba"><li><b>${c.cau}</b><span>câu đã làm</span></li><li><b>${c.pt}<small>%</small></b><span>câu đúng</span></li><li><b>${c.phut}</b><span>phút học</span></li></ul></div>
    <div class="ap-w-lon__dat">${ic('dung-tron')}<p>${c.loi}<small>${c.phu}</small></p></div>
  </section>
  <div class="ap-hai">
    <section class="ap-the ap-w ap-w-nho" aria-labelledby="w-ca"><h2 class="ap-w__ten" id="w-ca">Ca kiểm tra gần nhất</h2>
      <p class="ap-w-nho__so" role="img" aria-label="${CA.diem} trên 10 điểm">${CA.diem}<small>/10 điểm</small></p>
      <p class="ap-w-nho__phu"><b>${CA.ngay}</b>Hơn ${CA.hon} điểm so với lần trước của chính con</p></section>
    <section class="ap-the ap-w ap-w-nho" aria-labelledby="w-deu"><h2 class="ap-w__ten" id="w-deu">Học đều</h2>
      <p class="ap-w-nho__so">${c.chuoi}<small>ngày liên tục</small></p>
      <div class="ap-7" role="img" aria-label="7 ngày gần đây: con học ${BAY_NGAY.filter((x) => x > 0).length} ngày, nghỉ ${BAY_NGAY.filter((x) => !x).length} ngày">${BAY_NGAY.map((x) => `<i${x ? '' : ' data-nghi'}></i>`).join('')}</div>
      <p class="ap-w-nho__phu"><b>Từ 16/09 đến hôm nay</b>7 ngày gần đây: học ${BAY_NGAY.filter((x) => x > 0).length} ngày, nghỉ ${BAY_NGAY.filter((x) => !x).length} ngày</p></section>
  </div>
  ${hangXem('ap-the ap-hang--the')}
</main>
${thanhDay()}` }) }

// ── PHẦN C · đầu bảng "Mọi thứ về con" ───────────────────────────────
const MUC = ['Tổng quan', 'Dòng thời gian', 'Ca kiểm tra', 'Điểm mạnh · cần luyện', `Từng câu (${TONG.cau})`, 'Bài tập về nhà', 'Lịch ôn lại', '14 ngày', 'Lời A.I Đỗ Đại Học']
const phutTu5h = (g) => { const [h, p] = g.split(':').map(Number); return h * 60 + p - 300 }
P['ph-c-dau-bang'] = () => trang({ tieuDe: 'App phụ huynh · đầu bảng “Mọi thứ về con” kiểu Apple (bản vẽ)', body: `<header class="ap-tren">
  <div class="ap-tren__hang"><a class="ap-lui" href="ph-a-man-chinh.html" aria-label="Quay lại màn chính">${ic('trai')}</a><h1 class="ap-tren__ten">Mọi thứ về con</h1><span></span></div>
  <nav class="ap-muc-luc" aria-label="Các mục của bảng"><ul>${MUC.map((t, i) => `<li><a href="#muc-${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><span>${t}</span></a></li>`).join('')}</ul></nav>
</header>
<main class="ap-man ap-man--c">
  <div class="ap-c-dau"><h2 data-ten>${CON.ten}</h2><p>Lớp ${CON.lop}</p><p>${NGAY} · cập nhật lúc 21:00</p></div>
  <section class="ap-the ap-tq" id="muc-1" aria-label="Tổng quan hôm nay">
    <div class="ap-hn__dat" data-dat>${vong(1, ic('dung'), 'Nhiệm vụ hôm nay: xong 4 trong 4 việc')}<div><h2>Nhiệm vụ hôm nay: đã đạt</h2><p>Con xong cả 4 việc của hôm nay và làm thêm 1 gói gia đình giao.</p></div></div>
    <ul class="ap-luoi">${oSo(TONG.cau, 'câu', 'đã làm', `${MOC.length} lần ngồi học`)}${oSo(TONG.pt, '%', 'câu đúng', `${TONG.dung} trong ${TONG.cau} câu`)}${oSo(TONG.phut, 'phút', 'thời gian học', `dài nhất ${Math.max(...MOC.map((m) => m.phut))} phút`)}${oSo(CHUOI, 'ngày', 'chuỗi học đều', 'liên tục từ 16/09')}</ul>
    <div class="ap-hq"><h3>So với hôm qua của chính con</h3><ul>
      <li>${ic('tang', 'ap-i--s')}<span>Nhiều hơn ${TONG.cau - HOM_QUA.cau} câu <small>(hôm qua ${HOM_QUA.cau} câu)</small></span></li>
      <li>${ic('tang', 'ap-i--s')}<span>Câu đúng ${TONG.pt} % <small>(hôm qua ${Math.round((HOM_QUA.dung / HOM_QUA.cau) * 100)} %)</small></span></li>
      <li>${ic('tang', 'ap-i--s')}<span>Lâu hơn ${TONG.phut - HOM_QUA.phut} phút <small>(hôm qua ${HOM_QUA.phut} phút)</small></span></li></ul></div>
  </section>
  <div class="ap-muc-dau" id="muc-2"><h2>Dòng thời gian trong ngày</h2><p>chạm một mốc để xem từng câu</p></div>
  <section class="ap-the" aria-label="Dòng thời gian trong ngày">
    <div class="ap-ngay" role="img" aria-label="Con ngồi học ${MOC.length} lần trong ngày, lúc ${MOC.map((m) => m.gio).join(', ')}">
      <div class="ap-ngay__thanh">${MOC.map((m) => `<i style="left:${((phutTu5h(m.gio) / 1080) * 100).toFixed(2)}%;width:${((m.phut / 1080) * 100).toFixed(2)}%"></i>`).join('')}</div>
      <div class="ap-ngay__gio" aria-hidden="true"><span>05:00</span><span>11:00</span><span>17:00</span><span>23:00</span></div>
      <p>Con ngồi học ${MOC.length} lần: 1 lần buổi sáng, 1 lần buổi chiều, 3 lần buổi tối.</p></div>
    <ol class="ap-tl">${MOC.slice(0, 2).map((m) => `<li><a href="#" aria-label="${m.gio}, ${m.tenTron ?? m.ten}: ${m.cau} câu, đúng ${m.dung}, ${m.phut} phút. Xem từng câu của mốc này">
      <span class="ap-tl__bt">${ic(m.bt)}</span><div><h3>${m.ten}</h3><p>${m.cau} câu · đúng ${m.dung} · ${m.phut} phút${m.them ? `<span>${m.them}</span>` : ''}</p><span class="ap-thanh" role="img" aria-label="đúng ${m.dung} trong ${m.cau} câu"><i style="width:${((m.dung / m.cau) * 100).toFixed(1)}%"></i></span></div>
      <span class="ap-tl__gio">${m.gio}${ic('phai', 'ap-i--mui')}</span></a></li>`).join('')}</ol>
  </section>
  <p class="ap-ghi-chu">Bản vẽ dừng ở đây: còn 3 mốc nữa (${MOC.slice(2).map((m) => m.gio).join(', ')}) và 7 mục phía dưới, cùng phong cách này.</p>
</main>
${thanhDay(true)}` })

// trang ghép so sánh A | B (chỉ để chụp một ảnh)
const SO_SANH = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>So sánh A | B (bản vẽ)</title><style>
body{margin:0;padding:20px 24px 24px;background:rgb(229 231 235);font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;color:rgb(31 31 31)}
.hai{display:flex;gap:24px;justify-content:center}figure{margin:0}figcaption{font-size:17px;font-weight:600;margin:0 0 10px 4px}figcaption small{display:block;font-size:13px;font-weight:400;color:rgb(68 71 70)}
iframe{display:block;width:390px;height:844px;border:0;border-radius:28px;box-shadow:0 12px 36px -12px rgb(0 0 0 / .35)}</style></head><body><div class="hai">
<figure><figcaption>Phương án A · Thẻ sáng<small>một thẻ lớn, lưới 2 × 2 bốn số</small></figcaption><iframe src="ph-a-man-chinh.html" title="Phương án A"></iframe></figure>
<figure><figcaption>Phương án B · Widget<small>một widget lớn + hai widget vuông</small></figcaption><iframe src="ph-b-man-chinh.html" title="Phương án B"></iframe></figure></div></body></html>`

for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
writeFileSync(join(AQUI, 'ph-so-sanh-a-b.html'), SO_SANH)
console.log(`đã ghi ${Object.keys(P).length + 1} trang HTML vào ${AQUI} · số liệu khớp: ${TONG.cau} câu, ${TONG.dung} đúng (${TONG.pt} %), ${TONG.phut} phút, chuỗi ${CHUOI} ngày`)

// ── CHỤP ẢNH + TỰ KIỂM ───────────────────────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  for (const f of readdirSync(RA)) if (f.endsWith('.jpg')) unlinkSync(join(RA, f))
  const TRAN = 150 * 1024
  const browser = await chromium.launch()
  let xau = 0
  /** Chạy trong trang: tràn ngang, phần tử lòi khỏi mép phải, đích chạm < 48, chữ tương phản < 4,5:1 (chữ lớn < 3:1), chữ < 12 px, màn chính có vừa một màn không. */
  const KIEM = () => {
    const doi = (s) => { let m = s.match(/^rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
      m = s.match(/^color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] } return null }
    const tron = (tren, duoi) => { const a = tren[3]; return [0, 1, 2].map((i) => tren[i] * a + duoi[i] * (1 - a)).concat(1) }
    const sang = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
    const nen = (e) => { const lop = []; for (let x = e; x; x = x.parentElement) { const c = doi(getComputedStyle(x).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] === 1) break } } let kq = [255, 255, 255, 1]; for (const c of lop.reverse()) kq = tron(c, kq); return kq }
    const coChu = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    const tp = []
    for (const e of document.querySelectorAll('body *')) {
      if (!coChu(e)) continue
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
      if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || e.closest('.ap-sr')) continue
      const b = nen(e); const chu = tron(doi(cs.color) || [0, 0, 0, 1], b); const l1 = sang(chu), l2 = sang(b); const ti = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      const co = parseFloat(cs.fontSize), lon = co >= 24 || (co >= 18.66 && Number(cs.fontWeight) >= 700)
      if (ti < (lon ? 3 : 4.5)) tp.push(`${e.className || e.tagName} "${e.textContent.trim().slice(0, 24)}" ${ti.toFixed(2)}`)
    }
    const nho = [...document.querySelectorAll('a,button,summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.classList.contains('ap-phu') && (r.height < 47.5 || r.width < 47.5) }).map((e) => `${e.className} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    const chuNho = [...document.querySelectorAll('body *')].filter((e) => coChu(e) && e.getBoundingClientRect().width > 2 && parseFloat(getComputedStyle(e).fontSize) < 11.99).length
    // phần tử lòi khỏi mép phải / trái (trừ dải chip cuộn ngang có chủ đích)
    const loi = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('.ap-muc-luc ul') && !e.classList.contains('ap-phu') && (r.right > innerWidth + 0.5 || r.left < -0.5) }).map((e) => e.className || e.tagName)
    // chữ bị cắt (ô có overflow hidden mà nội dung rộng hơn khung)
    const cat = [...document.querySelectorAll('body *')].filter((e) => coChu(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible' && !e.classList.contains('ap-tren__ten')).map((e) => e.className || e.tagName)
    const day = document.querySelector('.ap-day'), cuoi = document.querySelector('.ap-man > :last-child')
    return { cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth, nho, tp, chuNho, loi, cat,
      vua: day && cuoi ? Math.round(day.getBoundingClientRect().top - (cuoi.getBoundingClientRect().bottom + scrollY)) : null }
  }
  const mo = async (ten, w, h, { toi = false, dsf = 2, bam = '' } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: dsf, hasTouch: true, isMobile: true }); const tr = await ctx.newPage(); const loi = []; tr.on('pageerror', (e) => loi.push(String(e)))
    await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); await tr.goto('file://' + join(AQUI, `${ten}.html`) + (bam ? `#${bam}` : ''), { waitUntil: 'load' }); await tr.evaluate(() => document.fonts.ready); await tr.waitForTimeout(250); return { ctx, tr, loi } }
  /** Chụp: thử tỉ lệ điểm ảnh 2 (nét như màn Retina) trước, quá 150 KB thì hạ chất lượng rồi hạ tỉ lệ. */
  const chup = async (ten, tep, w, h, tuy = {}) => {
    let kt = null, phong = ''
    for (const dsf of tuy.dsf ? [tuy.dsf] : [2, 1.5, 1]) {
      const { ctx, tr, loi } = await mo(ten, w, h, { ...tuy, dsf })
      kt = await tr.evaluate(KIEM); kt.loiTrang = loi
      phong = await tr.evaluate(() => getComputedStyle(document.body).fontFamily.split(',')[0])
      if (tuy.caTrang) await tr.setViewportSize({ width: w, height: kt.cao })
      let xong = ''
      for (const q of [86, 78, 70, 62, 54]) { const buf = await tr.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= TRAN) { writeFileSync(join(RA, tep), buf); xong = `${Math.round(buf.length / 1024)} KB · tỉ lệ ${dsf} · chất lượng ${q}`; break } }
      await ctx.close(); if (xong) { bao(tep, xong, kt); return kt }
    }
    bao(tep, '', kt); return kt
  }
  const bao = (tep, kq, kt) => { const hong = !kq || kt.tran > 0 || kt.loi.length || kt.cat.length || kt.nho.length || kt.tp.length || kt.chuNho || kt.loiTrang?.length
    console.log(tep.padEnd(38), (kq || 'QUÁ 150 KB').padEnd(34), `tràn ${kt.tran} · lòi ${kt.loi.length} · cắt chữ ${kt.cat.length} · đích<48 ${kt.nho.length} · tương phản thấp ${kt.tp.length} · chữ<12 ${kt.chuNho}${kt.vua !== null ? ` · cách thanh đáy ${kt.vua}px` : ''}`)
    if (kt.nho.length) console.log('   đích nhỏ:', kt.nho.slice(0, 6).join(' | ')); if (kt.tp.length) console.log('   tương phản:', kt.tp.slice(0, 8).join(' | ')); if (kt.loi.length) console.log('   lòi:', kt.loi.slice(0, 6).join(' | ')); if (kt.cat.length) console.log('   cắt chữ:', kt.cat.slice(0, 6).join(' | ')); if (kt.loiTrang?.length) console.log('   lỗi trang:', kt.loiTrang[0].slice(0, 160))
    if (hong) xau++ }

  { // phông THẬT mà Chromium dùng để vẽ (hỏi thẳng trình duyệt, không đoán theo tên trong CSS)
    const { ctx, tr } = await mo('ph-a-man-chinh', 390, 844, { dsf: 1 }); const cdp = await ctx.newCDPSession(tr); await cdp.send('DOM.enable'); await cdp.send('CSS.enable')
    const { root } = await cdp.send('DOM.getDocument'); const ra = []
    for (const q of ['h1', '.ap-so__so', '.ap-nut', '.ap-day__phu']) { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: q }); const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); ra.push(`${q}: ${fonts.map((f) => f.familyName).join(' + ')}`) }
    console.log('\n── PHÔNG THẬT KHI CHỤP ── ' + ra.join(' · ')); await ctx.close() }
  console.log('\n── ẢNH ─────────────────────────────────────────────')
  await chup('ph-a-man-chinh', 'ph-a-390-sang.jpg', 390, 844)
  await chup('ph-a-man-chinh', 'ph-a-390-toi.jpg', 390, 844, { toi: true })
  await chup('ph-a-man-chinh', 'ph-a-360-sang-du-lieu-thua.jpg', 360, 760, { bam: 'canh=thua' })
  await chup('ph-a-man-chinh', 'ph-a-360-sang-chua-hoc.jpg', 360, 760, { bam: 'canh=chua-hoc' })
  await chup('ph-a-man-chinh', 'ph-a-390-sang-menu-mo.jpg', 390, 844, { bam: 'menu=mo' })
  await chup('ph-a-man-chinh', 'ph-a-390-sang-da-giao.jpg', 390, 844, { bam: 'giao=da-giao' })
  await chup('ph-a-man-chinh', 'ph-a-390-sang-het-luot.jpg', 390, 844, { bam: 'giao=het-luot' })
  await chup('ph-b-man-chinh', 'ph-b-390-sang.jpg', 390, 844)
  await chup('ph-b-man-chinh', 'ph-b-390-toi.jpg', 390, 844, { toi: true })
  await chup('ph-c-dau-bang', 'ph-c-390-sang.jpg', 390, 844, { caTrang: true })
  await chup('ph-c-dau-bang', 'ph-c-360-sang.jpg', 360, 760, { caTrang: true })
  { // ảnh ghép A | B (rộng ≤ 900 px)
    const ctx = await browser.newContext({ viewport: { width: 876, height: 930 }, colorScheme: 'light', locale: 'vi-VN', deviceScaleFactor: 1 }); const tr = await ctx.newPage()
    await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); await tr.goto('file://' + join(AQUI, 'ph-so-sanh-a-b.html'), { waitUntil: 'load' }); await tr.waitForTimeout(500)
    let xong = ''; for (const q of [88, 80, 72, 64]) { const buf = await tr.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= TRAN) { writeFileSync(join(RA, 'so-sanh-a-b.jpg'), buf); xong = `${Math.round(buf.length / 1024)} KB · rộng 876 px · chất lượng ${q}`; break } }
    console.log('so-sanh-a-b.jpg'.padEnd(38), xong || 'QUÁ 150 KB'); if (!xong) xau++; await ctx.close() }

  // ── BẢNG KIỂM TRÀN: mỗi ô = tràn ngang (px) / số phần tử lòi mép / số chữ bị cắt. "thường" rồi "tên dài + cỡ chữ 115 %".
  console.log('\n── KIỂM TRÀN (scrollWidth − innerWidth / phần tử lòi mép / chữ bị cắt) · trái: thường · phải: tên con dài “' + CON.tenDai + '” + cỡ chữ hệ thống 115 % ──')
  const RONG = [320, 360, 390, 412, 430]
  const DS = [['A · đầy đủ', 'ph-a-man-chinh', ''], ['A · dữ liệu thưa', 'ph-a-man-chinh', 'canh=thua'], ['A · con chưa học', 'ph-a-man-chinh', 'canh=chua-hoc'], ['A · menu mở', 'ph-a-man-chinh', 'menu=mo'], ['A · đã giao', 'ph-a-man-chinh', 'giao=da-giao'], ['A · hết lượt', 'ph-a-man-chinh', 'giao=het-luot'],
    ['B · đầy đủ', 'ph-b-man-chinh', ''], ['B · menu mở', 'ph-b-man-chinh', 'menu=mo'], ['C · đầu bảng', 'ph-c-dau-bang', '']]
  console.log('màn'.padEnd(20) + RONG.map((w) => `${w} px`.padEnd(20)).join(''))
  let tranTong = 0
  for (const [nhan, ten, bam] of DS) { let dong = nhan.padEnd(20)
    for (const w of RONG) { const o = []
      for (const kho of ['', 'ten=dai&co=115']) { const { ctx, tr } = await mo(ten, w, 760, { dsf: 1, bam: [bam, kho].filter(Boolean).join('&') }); const kt = await tr.evaluate(KIEM); await ctx.close()
        o.push(`${kt.tran}/${kt.loi.length}/${kt.cat.length}`); if (kt.tran > 0 || kt.loi.length || kt.cat.length) { tranTong++; console.log(`   ✗ ${nhan} ${w}px ${kho || 'thường'}: tràn ${kt.tran} · lòi ${kt.loi.slice(0, 4).join(', ')} · cắt ${kt.cat.slice(0, 4).join(', ')}`) } }
      dong += o.join('  ·  ').padEnd(20) }
    console.log(dong) }
  // màn chính vừa MỘT màn 360 × 760 (khoảng cách từ khối cuối tới mép trên thanh đáy ≥ 8 px)
  console.log('\n── VỪA MỘT MÀN 360 × 760 (không phải cuộn, thanh đáy không che nội dung) ──')
  for (const [nhan, ten, bam] of DS.filter((d) => d[1] !== 'ph-c-dau-bang' && !d[2].startsWith('menu'))) { const { ctx, tr } = await mo(ten, 360, 760, { dsf: 1, bam }); const kt = await tr.evaluate(KIEM); await ctx.close()
    const dat = kt.vua >= 8 && kt.cao <= 760; if (!dat) xau++; console.log(`${nhan.padEnd(20)} ${dat ? 'VỪA' : 'KHÔNG VỪA'} · khối cuối cách thanh đáy ${kt.vua}px · trang cao ${kt.cao}px`) }
  await browser.close()
  xau += tranTong
  console.log(xau ? `\n${xau} mục có vấn đề` : '\nsạch: mọi ảnh ≤ 150 KB · 0 tràn ở 5 bề ngang (kể cả tên dài + chữ 115 %) · 0 đích < 48 · 0 chữ tương phản thấp · màn chính vừa một màn 360 × 760')
}
