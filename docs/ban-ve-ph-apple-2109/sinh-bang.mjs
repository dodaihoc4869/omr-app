#!/usr/bin/env node
// SINH BẢN VẼ bảng "Mọi thứ về con" KIỂU APPLE (thầy lệnh 21/09/2026). CHỈ LÀ BẢN VẼ: không đụng mã chạy thật, không sửa ph-a / ph-b / ph-c.
//   node docs/ban-ve-ph-apple-2109/sinh-bang.mjs          ghi ph-d-bang-day-du.html + ph-e-bang-thua.html (tự chứa)
//   node docs/ban-ve-ph-apple-2109/sinh-bang.mjs --anh    thêm: chụp Chromium vào ./anh/ph-d-* và ./anh/ph-e-* (JPG ≤ 150 KB, cắt đoạn ≤ 1700 px) + bảng KIỂM TRÀN 320/360/390/412/430
// CHỈ xoá ảnh ph-d-* / ph-e-* cũ (ảnh ph-a / ph-b / ph-c của bộ sinh kia giữ nguyên).
// Trạng thái trang đổi bằng phần sau dấu #:  canh=thua|chua-hoc (chỉ ph-e) & ten=dai & co=115
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const CSS = [doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'ph-apple-bang.css'), 'utf8')].join('\n')

// ── biểu tượng nét mảnh, tự vẽ ───────────────────────────────────────
const IC = {
  phai: '<path d="m9 5 7 7-7 7"/>', trai: '<path d="m15 5-7 7 7 7"/>', xuong: '<path d="m5 9 7 7 7-7"/>',
  dung: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'dung-tron': '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.8 2.8 5.2-6"/>', sai: '<path d="m7 7 10 10M17 7 7 17"/>',
  gui: '<path d="M21 3 10.2 13.8"/><path d="m21 3-6.6 18-4.2-7.2L3 9.6z"/>',
  lich: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10h17"/><path d="m9 15.2 2.2 2.2 3.8-4.2"/>',
  tang: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>', len: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>', ngang: '<path d="M5 12h14"/>',
  'on-lai': '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/>',
  khoa: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sach: '<path d="M12 6.5C10.3 5 7.8 4.5 4 4.5v13c3.8 0 6.3.5 8 2 1.7-1.5 4.2-2 8-2v-13c-3.8 0-6.3.5-8 2z"/><path d="M12 6.5v13"/>',
  nha: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5v10h12v-10"/><path d="M10 19.5v-5h4v5"/>',
  'muc-tieu': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  bac: '<path d="M3.5 19.5H8V15h4.5v-4.5H17V6h3.5"/>',
  chuong: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  tia: '<path d="M11 4.5 12.7 10l5.8 1.7-5.8 1.8L11 19l-1.7-5.5-5.8-1.8L9.3 10z"/><path d="M18.5 3.5v3.4M16.8 5.2h3.4"/>',
  'dong-ho': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  nhom: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3.2 2.7-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14c2.3.2 3.7 1.8 4.2 4.5"/>',
  cham: '<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="m3.5 6.3 1.4 1.4 2.3-2.6M3.5 11.8l1.4 1.4 2.3-2.6M3.5 17.3l1.4 1.4 2.3-2.6"/>',
  cot: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
}
const ic = (t, cls = '') => `<svg class="phm-i ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${IC[t]}</svg>`
const dam = (dk, loi) => { if (!dk) { console.error('SỐ LIỆU LỆCH:', loi); process.exit(1) } }
const tong = (ds, k) => ds.reduce((a, x) => a + x[k], 0)
const pt = (a, b) => Math.round((a / b) * 100)
const vn = (x) => String(x).replace('.', ',')

// ── DỮ LIỆU GIẢ · BẢNG ĐẦY ĐỦ (khớp bản Material docs/ban-ve-ph-moi-thu-ve-con-2109 + màn chính ph-a) ────────────────
const CON = { ten: 'Nguyễn Minh Khôi', tenDai: 'Nguyễn Hoàng Bảo Khánh An', lop: '12 - Tinh Hoa' }
const tenGoi = (ten) => ten.trim().split(/\s+/).at(-1)
const NGAY = 'Thứ Hai 21/09/2026'
const MUC_TIEU = { cau: 16, phut: 45 }
const BTVN_TEN = 'Bài tập về nhà <span class="phm-lien">“Ester – Lipid”</span> · chặng 2'
const LAN = [
  { gio: '06:40', ten: 'Ôn lại 6 câu đến lịch', bt: 'on-lai', cau: 6, dung: 5, phut: 7, sai: [4] },
  { gio: '17:12', ten: BTVN_TEN, tenTron: 'Bài tập về nhà Ester – Lipid, chặng 2', bt: 'sach', cau: 12, dung: 9, phut: 21, them: 'nộp đúng nhịp', sai: [2, 9, 11] },
  { gio: '19:35', ten: 'Thử thách riêng hôm nay', bt: 'muc-tieu', cau: 5, dung: 4, phut: 6, sai: [3] },
  { gio: '20:10', ten: 'Luyện dạng con còn vấp', bt: 'bac', cau: 9, dung: 7, phut: 11, sai: [2, 6] },
  { gio: '20:40', ten: 'Bài gia đình giao lúc 19:58', bt: 'nha', cau: 6, dung: 5, phut: 7, sai: [5] },
]
const T = { cau: tong(LAN, 'cau'), dung: tong(LAN, 'dung'), phut: tong(LAN, 'phut') }
T.pt = pt(T.dung, T.cau); T.sai = T.cau - T.dung; T.daiNhat = Math.max(...LAN.map((m) => m.phut))
const HOM_QUA = { cau: 33, dung: 25, phut: 45 }
const N14 = [['T3', '08', 22], ['T4', '09', 0], ['T5', '10', 18], ['T6', '11', 31], ['T7', '12', 26], ['CN', '13', 0], ['T2', '14', 24], ['T3', '15', 0], ['T4', '16', 20], ['T5', '17', 27], ['T6', '18', 16], ['T7', '19', 28], ['CN', '20', HOM_QUA.cau], ['T2', '21', T.cau]]
const chuoiCua = (ds) => { let c = 0; for (let i = ds.length - 1; i >= 0 && ds[i][2] > 0; i--) c++; return c }
const CHUOI = chuoiCua(N14)
const CA = { diem: 7.5, truoc: 6.75, ten: 'Kiểm tra 45 phút · Ester – Lipid', nop: '09:12 · Thứ Bảy 19/09/2026', lam: '32 phút 10 giây',
  phan: [{ ten: 'Phần I · Trắc nghiệm', diem: 3.75, toiDa: 4.5, dung: 15, tong: 18, chu: 'đúng' }, { ten: 'Phần II · Đúng–sai', diem: 2.75, toiDa: 4, dung: 2, tong: 4, chu: 'đúng trọn' }, { ten: 'Phần III · Trả lời ngắn', diem: 1, toiDa: 1.5, dung: 4, tong: 6, chu: 'đúng' }] }
const LAM_TOT = [{ ten: 'Danh pháp ester', dung: 11, tong: 12, bac: 2 }, { ten: 'Phản ứng ester hoá', dung: 9, tong: 10, bac: 1, moi: true }, { ten: 'Tính chất vật lí của lipid', dung: 8, tong: 9, bac: 1, moi: true }]
const CON_VAP = [{ ten: 'Xà phòng hoá chất béo', dung: 3, tong: 9, bac: 0, xep: 4 }, { ten: 'Bài toán hỗn hợp ester', dung: 4, tong: 10, bac: 0, xep: 2 }, { ten: 'Phản ứng thuỷ phân ester', dung: 6, tong: 11, bac: 1, xep: 1 }]
const ON = { mai: 7, phut: 10, khacPhuc: 12, tungSai: 31, tuan: [['T3', '22', 7], ['T4', '23', 3], ['T5', '24', 4], ['T6', '25', 2], ['T7', '26', 0], ['CN', '27', 3], ['T2', '28', 0]] }
const AI_CHON = { thuThach: 5, luyen: 9, giaDinh: 6, btvnRieng: 3 }
const SO_LAM_LAU = 5
dam(T.cau === 38 && T.dung === 30 && T.phut === 52 && T.pt === 79 && T.sai === 8 && CHUOI === 6 && LAN.length === 5 && T.daiNhat === 21, JSON.stringify(T))
dam(LAN.every((m) => m.sai.length === m.cau - m.dung), 'ô sai của từng lần')
dam(Math.abs(tong(CA.phan, 'diem') - CA.diem) < 1e-9 && tong(CA.phan, 'dung') === 21 && tong(CA.phan, 'tong') === 28, 'ca kiểm tra')
dam(tong(CON_VAP, 'xep') === ON.mai && ON.tuan[0][2] === ON.mai && ON.tuan.reduce((a, x) => a + x[2], 0) === ON.tungSai - ON.khacPhuc, 'lịch ôn')
dam(N14.reduce((a, x) => a + x[2], 0) === 283 && N14.filter((x) => x[2] > 0).length === 11, '14 ngày')
dam(Object.values(AI_CHON).reduce((a, b) => a + b, 0) === 23, 'A.I chọn riêng 23 câu')

// ── DỮ LIỆU GIẢ · TÀI KHOẢN MỚI DÙNG, DỮ LIỆU THƯA (khớp ph-a cảnh "thua": 9 câu, 56 %, 11 phút, chuỗi 4 ngày, học gần nhất 19:20) ──
const LAN_T = [
  { gio: '06:50', ten: 'Ôn lại câu đến lịch', bt: 'on-lai', cau: 1, dung: 1, phut: 1, sai: [] },
  { gio: '12:10', ten: 'Luyện dạng con còn vấp', bt: 'bac', cau: 2, dung: 1, phut: 2, sai: [2] },
  { gio: '16:45', ten: 'Ôn lại câu đến lịch', bt: 'on-lai', cau: 1, dung: 0, phut: 1, sai: [1] },
  { gio: '18:30', ten: 'Thử thách riêng hôm nay', bt: 'muc-tieu', cau: 2, dung: 1, phut: 3, sai: [1] },
  { gio: '19:02', ten: 'Luyện dạng con còn vấp', bt: 'bac', cau: 2, dung: 1, phut: 2, sai: [2] },
  { gio: '19:20', ten: 'Ôn lại câu đến lịch', bt: 'on-lai', cau: 1, dung: 1, phut: 2, sai: [] },
]
const TT = { cau: tong(LAN_T, 'cau'), dung: tong(LAN_T, 'dung'), phut: tong(LAN_T, 'phut') }
TT.pt = pt(TT.dung, TT.cau); TT.sai = TT.cau - TT.dung; TT.daiNhat = Math.max(...LAN_T.map((m) => m.phut))
const HOM_QUA_T = { cau: 7, dung: 4, phut: 9 }
const N14_T = N14.map(([t, n], i) => [t, n, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 8, HOM_QUA_T.cau, TT.cau][i]])
const N14_CH = N14_T.map((x, i) => (i === 13 ? [x[0], x[1], 0] : x))
const ON_T = { mai: 2, phut: 3, khacPhuc: 1, tungSai: 5 }
dam(TT.cau === 9 && TT.dung === 5 && TT.pt === 56 && TT.phut === 11 && LAN_T.length === 6 && chuoiCua(N14_T) === 4 && LAN_T.every((m) => m.sai.length === m.cau - m.dung), JSON.stringify(TT))

// ── MẢNH DÙNG CHUNG ──────────────────────────────────────────────────
/** Ba vòng hoạt động lồng nhau. tl > 1 ⇒ vòng khép kín + "đầu vòng" có bóng đè lên (vượt mục tiêu). tl = 0 ⇒ chỉ còn rãnh. */
let soVong = 0
const baVong = (ds, nhan) => { const id = `phm-v${++soVong}`, DAY = 10.5, BK = [50, 37.5, 25]
  const vong = ds.map((tl, i) => { const r = BK[i], C = 2 * Math.PI * r, m = i + 1
    let s = `<circle class="phm-v-nen" data-mau="${m}" cx="60" cy="60" r="${r}" stroke-width="${DAY}"/>`
    if (tl <= 0) return s
    if (tl < 1) return s + `<circle data-mau="${m}" cx="60" cy="60" r="${r}" stroke-width="${DAY}" stroke-linecap="round" stroke-dasharray="${(C * tl).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 60 60)"/>`
    const a = ((tl % 1) || 0.0001) * 2 * Math.PI, x = 60 + r * Math.sin(a), y = 60 - r * Math.cos(a), bx = x + 3.2 * Math.cos(a), by = y + 3.2 * Math.sin(a)
    return s + `<circle data-mau="${m}" cx="60" cy="60" r="${r}" stroke-width="${DAY}"/><circle data-mau="${m}" data-vuot cx="60" cy="60" r="${r}" stroke-width="${DAY}" stroke-linecap="round" stroke-dasharray="${(C * ((tl % 1) || 0.0001)).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 60 60)"/><mask id="${id}-${m}"><circle cx="60" cy="60" r="${r}" fill="none" stroke="#fff" stroke-width="${DAY}"/></mask>
      <g mask="url(#${id}-${m})"><circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="${DAY / 2}" fill="#000" stroke="none" opacity="0.42" filter="url(#${id}-mo)"/></g><circle data-to="${m}" data-vuot cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${DAY / 2}"/>` }).join('')
  return `<div class="phm-vong3" role="img" aria-label="${nhan}"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><filter id="${id}-mo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.7"/></filter></defs>${vong}</svg></div>` }
const vongNho = (a, b, nhan) => { const R = 43, C = 2 * Math.PI * R
  return `<div class="phm-vong1" role="img" aria-label="${nhan}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="phm-v-nen" cx="50" cy="50" r="${R}"/><circle class="phm-v-dat" cx="50" cy="50" r="${R}" stroke-dasharray="${(C * a / b).toFixed(1)} ${C.toFixed(1)}"/></svg><div>${a}/${b}<small>câu</small></div></div>` }
const thanh = (tl, mau = '', nhan = '', cls = '') => `<span class="phm-thanh ${cls}"${mau ? ` data-mau="${mau}"` : ''}${nhan ? ` role="img" aria-label="${nhan}"` : ''}><i style="width:${(tl * 100).toFixed(1)}%"></i></span>`
const chip = (chu, mau = '', bt = '') => `<span class="phm-chip${bt ? '' : ' phm-chip--tron'}"${mau ? ` data-mau="${mau}"` : ''}>${bt ? ic(bt) : ''}${chu}</span>`
const dauMuc = (h2, p = '') => `<header class="phm-muc__dau"><h2>${h2}</h2>${p ? `<p>${p}</p>` : ''}</header>`
const muc = (id, tt, nhan, trong, cls = '', canh = '') => `<section class="phm-muc ${cls}" id="${id}" style="--tt:${tt}" aria-label="${nhan}"${canh ? ` data-khi-canh="${canh}"` : ''}>${trong}</section>`
const bienThe = (chu) => `<p class="phm-bien-the">Biến thể · ${chu}</p>`

const JS = `(()=>{const b=document.body,h=new URLSearchParams(location.hash.slice(1));
if(h.get('canh'))b.dataset.canh=h.get('canh');
if(h.get('co'))document.documentElement.style.fontSize=h.get('co')+'%';
if(h.get('ten')==='dai'){document.querySelectorAll('[data-ten]').forEach(e=>e.textContent=${JSON.stringify(CON.tenDai)});document.querySelectorAll('[data-ten-goi]').forEach(e=>e.textContent=${JSON.stringify(tenGoi(CON.tenDai))})}
const day=document.querySelector('.phm-day');if(day){const f=()=>b.style.setProperty('--phm-day-cao',day.offsetHeight+'px');new ResizeObserver(f).observe(day);f()}
const td=document.querySelector('.phm-tieu-de h1'),cuon=()=>{b.toggleAttribute('data-cuon',scrollY>6);if(td)b.toggleAttribute('data-thu',td.getBoundingClientRect().bottom<(document.querySelector('.phm-tren').offsetHeight+4))};addEventListener('scroll',cuon,{passive:true});cuon();
const ml=document.querySelector('.phm-muc-luc ul'),lk=[...document.querySelectorAll('.phm-muc-luc a')];
if(ml&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(scrollY<8)return;for(const e of es)if(e.isIntersecting){const a=lk.find(x=>x.getAttribute('href')==='#'+e.target.id);if(!a)continue;lk.forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','true');ml.scrollTo({left:a.parentElement.offsetLeft-ml.offsetLeft-16,behavior:'auto'})}},{rootMargin:'-30% 0px -60% 0px'});lk.forEach(a=>{const m=document.getElementById(a.getAttribute('href').slice(1));if(m)io.observe(m)})}
document.querySelectorAll('.phm-seg').forEach(s=>s.addEventListener('click',e=>{const n=e.target.closest('button');if(!n)return;s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===n)));s.closest('.phm-muc').querySelector('.phm-tu-cau').dataset.loc=n.dataset.loc}));
document.querySelectorAll('.phm-cau > button[aria-controls]').forEach(n=>n.addEventListener('click',()=>{const li=n.parentElement,mo=li.toggleAttribute('data-mo');n.setAttribute('aria-expanded',String(mo));document.getElementById(n.getAttribute('aria-controls')).hidden=!mo}))})()`

const trang = ({ tieuDe, canh = '', mucLuc, body, day }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<!-- iPhone / Mac: San Francisco có sẵn. Máy khác (Android, Windows): nạp Inter (giấy phép OFL). Bản thật nên tự chứa Inter qua @fontsource/inter. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="m3 phm-goc"${canh ? ` data-canh="${canh}"` : ''}>
<header class="phm-tren"><div class="phm-tren__hang"><a class="phm-lui" href="ph-a-man-chinh.html" aria-label="Quay lại màn Hôm nay">${ic('trai')}<span>Hôm nay</span></a>
  <div class="phm-tren__giua" aria-hidden="true"><span class="phm-tren__ten">Mọi thứ về con</span><span class="phm-tren__phu" data-ten>${CON.ten}</span></div><span></span></div></header>
<div class="phm-tieu-de"><h1>Mọi thứ về con</h1><p><b data-ten>${CON.ten}</b> · Lớp ${CON.lop}</p></div>
${mucLuc}
<main class="phm-man">${body}</main>
${day}<script>${JS}</script></body></html>`

const mucLuc = (ds, canh = '') => `<nav class="phm-muc-luc" aria-label="Các mục của bảng"${canh ? ` data-khi-canh="${canh}"` : ''}><div class="phm-muc-luc__khung"><ul>${ds.map(([id, t], i) => `<li><a href="#${id}"${i === 0 ? ' aria-current="true"' : ''}><span>${t}</span></a></li>`).join('')}</ul></div></nav>`
const thanhDay = (phu) => `<div class="phm-day"><div class="phm-day__trong"><button class="phm-nut" type="button">${ic('gui')}Giao thêm bài cho con</button><p class="phm-day__phu">${phu}</p></div></div>`

// ── KHỐI ANH HÙNG ────────────────────────────────────────────────────
const soSanh = (hn, hq) => { const c = hn.cau - hq.cau, p = hn.pt - pt(hq.dung, hq.cau), f = hn.phut - hq.phut
  const mot = (d, tang, giam, bang) => d > 0 ? chip(tang, 'dat', 'len') : d < 0 ? chip(giam, '', 'ngang') : chip(bang, '', 'ngang')
  return `<div class="phm-ah__hq"><h3>So với hôm qua của chính con</h3><div class="phm-chips">
    ${mot(c, `nhiều hơn ${c} câu`, `ít hơn ${-c} câu`, 'số câu bằng hôm qua')}${Math.abs(p) <= 1 ? chip('câu đúng gần bằng hôm qua', '', 'ngang') : mot(p, `đúng hơn ${p} %`, `câu đúng ${hn.pt} % (hôm qua ${pt(hq.dung, hq.cau)} %)`, '')}${mot(f, `lâu hơn ${f} phút`, `ngắn hơn ${-f} phút`, 'số phút bằng hôm qua')}</div></div>` }
const anhHung = ({ t, dat, loi, loiPhu = '', hq, capNhat, canh = '' }) => { const vuot = (a, b, dv) => a >= b ? 'vượt mục tiêu' : `mục tiêu ${b} ${dv}`
  return `<div class="phm-the phm-the--dem phm-ah"${canh ? ` data-khi-canh="${canh}"` : ''}>
    <p class="phm-ah__ngay">${NGAY} · ${capNhat}</p><h2>Hôm nay của <span data-ten-goi>${tenGoi(CON.ten)}</span></h2>
    <div class="phm-ah__than">${baVong([t.cau / MUC_TIEU.cau, t.cau ? t.dung / t.cau : 0, t.phut / MUC_TIEU.phut], t.cau ? `Ba vòng hôm nay: ${t.cau} câu đã làm trên mục tiêu ${MUC_TIEU.cau} câu; câu đúng ${t.pt} %; ${t.phut} phút học trên mục tiêu ${MUC_TIEU.phut} phút` : 'Ba vòng hôm nay còn trống: con chưa học')}
      <ul class="phm-chu-giai"><li data-mau="1"${t.cau ? '' : ' data-rong'}><b>${t.cau}<small>/${MUC_TIEU.cau} câu</small></b><span>đã làm · ${vuot(t.cau, MUC_TIEU.cau, 'câu')}</span></li>
        <li data-mau="2"${t.cau ? '' : ' data-rong'}><b>${t.cau ? t.pt : '—'}<small>${t.cau ? '%' : ''}</small></b><span>${t.cau ? `đúng ${t.dung} trong ${t.cau} câu` : 'câu đúng · chưa có câu nào'}</span></li>
        <li data-mau="3"${t.cau ? '' : ' data-rong'}><b>${t.phut}<small>/${MUC_TIEU.phut} phút</small></b><span>đã học · ${vuot(t.phut, MUC_TIEU.phut, 'phút')}</span></li></ul></div>
    <div class="phm-ah__loi"${dat ? '' : ' data-mau="nhan"'}>${ic(dat ? 'dung-tron' : t.cau ? 'muc-tieu' : 'dong-ho')}<p>${loi}${loiPhu ? `<small>${loiPhu}</small>` : ''}</p></div>
    ${hq ? soSanh(t, hq) : ''}</div>` }

// ── ĐIỀU ĐÁNG MỪNG · A.I ĐÃ LÀM GÌ ───────────────────────────────────
const tuan7 = (ds) => `<ol class="phm-7" aria-hidden="true">${ds.slice(-7).map(([t, , c]) => `<li${c ? '' : ' data-nghi'}><i></i>${t}</li>`).join('')}</ol>`
const theMung = (dong, canh = '') => `<div class="phm-the phm-the--dem"${canh ? ` data-khi-canh="${canh}"` : ''}><p class="phm-nhan-muc" data-mau="dat">${ic('tia')}Điều đáng mừng hôm nay</p><ul class="phm-mung">${dong.join('')}</ul></div>`
const theLam = ({ ten, dong, cuoi, canh = '' }) => `<div class="phm-the phm-the--dem"${canh ? ` data-khi-canh="${canh}"` : ''}><p class="phm-nhan-muc">${ic('cham')}A.I Đỗ Đại Học · hôm nay</p><h2 class="phm-ten-the">${ten}</h2>
  <ul class="phm-lam" style="margin-top:6px">${dong.map(([a, b]) => `<li><span class="phm-tich">${ic('dung')}</span><div><h3>${a}</h3><p>${b}</p></div></li>`).join('')}</ul><p class="phm-lam__cuoi">${cuoi}</p></div>`

// ── DÒNG THỜI GIAN ───────────────────────────────────────────────────
const bieuGio = (lan) => { const gio = Array(24).fill(0); for (const m of lan) gio[Number(m.gio.slice(0, 2))] += m.phut
  return `<div class="phm-bieu phm-gio" role="img" aria-label="Số phút con học theo từng giờ trong ngày: ${gio.map((p, g) => p ? `${g} giờ ${p} phút` : '').filter(Boolean).join(', ')}">
    <div class="phm-bieu__luoi" aria-hidden="true"><span style="top:0"><em>30 phút</em></span><span style="top:50%"><em>15 phút</em></span><span style="top:100%"><em>0</em></span></div>
    <ol aria-hidden="true">${gio.map((p, g) => `<li${g % 6 === 0 ? ' data-moc' : ''}>${p ? `<i style="--c:${Math.min(p, 30)}"></i>` : ''}${g % 6 === 0 ? `<span>${g} giờ</span>` : ''}</li>`).join('')}</ol></div>` }
const buoi = (lan) => { const d = [0, 0, 0]; for (const m of lan) { const g = Number(m.gio.slice(0, 2)); d[g < 12 ? 0 : g < 18 ? 1 : 2]++ } return ['buổi sáng', 'buổi chiều', 'buổi tối'].map((t, i) => d[i] ? `${d[i]} lần ${t}` : '').filter(Boolean).join(', ') }
const dongThoiGian = (lan, t, neo) => `${dauMuc('Dòng thời gian trong ngày', 'chạm một lần ngồi học để xem từng câu')}<div class="phm-the">
  <div style="padding:18px 18px 0"><p class="phm-so-to"><b>${lan.length}<small>lần ngồi học</small></b><span>dài nhất ${t.daiNhat} phút · tổng ${t.phut} phút</span></p>${bieuGio(lan)}<p class="phm-gio__loi">${buoi(lan).replace(/^./, (c) => c.toUpperCase())}.</p></div>
  <ol class="phm-lan">${lan.map((m, i) => `<li><a href="#${neo(i)}" aria-label="${m.gio}, ${m.tenTron ?? m.ten}: ${m.cau} câu, đúng ${m.dung}, ${m.phut} phút. Xem từng câu của lần này"><span class="phm-o-bt">${ic(m.bt)}</span>
    <div><h3>${m.ten}</h3><p><b>${m.gio}</b> · ${m.cau} câu · đúng ${m.dung} · ${m.phut} phút${m.them ? ` · ${m.them}` : ''}</p>${thanh(m.dung / m.cau, 'dat', `đúng ${m.dung} trong ${m.cau} câu`, 'phm-thanh--manh')}</div>${ic('phai', 'phm-i--mui')}</a></li>`).join('')}</ol></div>`

// ── TỪNG CÂU ─────────────────────────────────────────────────────────
const daiO = (m) => `<div class="phm-dai-o" role="img" aria-label="${m.cau} câu: đúng ${m.dung}, sai ${m.cau - m.dung}">${Array.from({ length: m.cau }, (_, i) => `<i class="phm-o-cau"${m.sai.includes(i + 1) ? ' data-sai' : ''}></i>`).join('')}</div>`
const chipKq = (dung) => dung ? chip('Đúng', 'dat', 'dung') : chip('Sai', 'do', 'sai')
let soMo = 0
/** Một câu: gio · dạng · đề (1–2 dòng) · "Con chọn X" (chỉ khi máy chủ có) · "Đáp án Y" · chip Đúng/Sai · thời gian làm. mo = { pa:[…], chon, loiGiai } ⇒ dòng đang mở. */
const cau = ({ gio, dang, de, chon, dapAn, dung, giay, lau, mo }) => { const id = mo ? `phm-mo-${++soMo}` : ''
  return `<li class="phm-cau"${dung ? '' : ' data-sai'}${lau ? ' data-lau' : ''}${mo ? ' data-mo' : ''}><button type="button"${mo ? ` aria-expanded="true" aria-controls="${id}"` : ''}>
    <div><p class="phm-cau__dau"><b>${dang}</b><span>${gio}</span></p><p class="phm-cau__de">${de}</p>
      <p class="phm-cau__kq">${chipKq(dung)}<span>${chon ? `Con chọn <b>${chon}</b> · ` : ''}Đáp án <b>${dapAn}</b></span><span>${giay}</span>${lau ? chip('Làm lâu', 'cam', 'dong-ho') : ''}</p></div>${ic('xuong', 'phm-i--mui')}</button>
    ${mo ? `<div class="phm-mo" id="${id}"><ul class="phm-pa">${mo.pa.map((p, i) => { const k = 'ABCD'[i]; return `<li${k === dapAn ? ' data-dung' : k === chon ? ' data-chon' : ''}><i>${k}</i><span>${p}</span>${k === dapAn ? `<em>${ic('dung')}Đáp án đúng</em>` : k === chon ? '<em>Con chọn</em>' : ''}</li>` }).join('')}</ul>
      <div class="phm-loi-giai"><h4>Lời giải ngắn</h4><p>${mo.loiGiai}</p></div></div>` : ''}</li>` }
const nhomCau = (m, i, { ds = [], them = '' } = {}) => `<div class="phm-nhom" id="nhom-${i + 1}"><div class="phm-nhom__dau"><h3><b>${m.gio}</b> · ${m.ten}</h3><p>${m.cau} câu · đúng ${m.dung} · sai ${m.cau - m.dung} · ${m.phut} phút</p></div>
  <div class="phm-the">${daiO(m)}${ds.length ? `<ul>${ds.map(cau).join('')}</ul>` : ''}<button class="phm-them" type="button"><span>${them || `Xem ${m.cau} câu của lần này`}</span>${ic(ds.length ? 'xuong' : 'phai', 'phm-i--mui')}</button></div></div>`
const boLoc = (t, lau) => `<div class="phm-seg" role="group" aria-label="Lọc câu"><button type="button" data-loc="" aria-pressed="true"><span>Tất cả <small>${t.cau}</small></span></button><button type="button" data-loc="sai" aria-pressed="false"><span>Sai <small>${t.sai}</small></span></button>${lau ? `<button type="button" data-loc="lau" aria-pressed="false"><span>Làm lâu <small>${lau}</small></span></button>` : ''}</div>
  <p class="phm-chu-thich"><span><i class="phm-o-cau"></i>ô đặc: đúng</span><span><i class="phm-o-cau" data-sai></i>ô gạch chéo: sai</span>${lau ? '<span>Làm lâu: hơn 3 phút một câu</span>' : ''}</p>`

const CAU_BTVN = [
  { gio: '17:12', dang: 'Phản ứng ester hoá', de: 'Đun nóng CH<sub>3</sub>COOH với C<sub>2</sub>H<sub>5</sub>OH (xúc tác H<sub>2</sub>SO<sub>4</sub> đặc) thu được ester có công thức là', dapAn: 'B', dung: true, giay: '52 giây' },
  { gio: '17:15', dang: 'Phản ứng thuỷ phân ester', de: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> bằng 200 mL dung dịch NaOH 1 M. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là', dapAn: 'C', dung: false, giay: '3 phút 48 giây', lau: true },
  { gio: '17:29', dang: 'Bài toán hỗn hợp ester', de: 'Đốt cháy hoàn toàn 0,1 mol hỗn hợp hai ester no, đơn chức, mạch hở thu được 0,35 mol CO<sub>2</sub>. Khối lượng H<sub>2</sub>O thu được là', dapAn: 'B', dung: false, giay: '4 phút 10 giây', lau: true },
]
const CAU_LUYEN = [
  { gio: '20:10', dang: 'Xà phòng hoá chất béo', de: 'Chất béo là triester của glycerol với', chon: 'A', dapAn: 'A', dung: true, giay: '35 giây' },
  { gio: '20:14', dang: 'Xà phòng hoá chất béo', de: 'Xà phòng hoá hoàn toàn 17,8 gam tristearin (C<sub>17</sub>H<sub>35</sub>COO)<sub>3</sub>C<sub>3</sub>H<sub>5</sub> bằng dung dịch NaOH vừa đủ. Khối lượng glycerol thu được là', chon: 'D', dapAn: 'B', dung: false, giay: '3 phút 20 giây', lau: true,
    mo: { pa: ['0,92 gam', '1,84 gam', '2,76 gam', '5,52 gam'], loiGiai: 'Số mol tristearin = 17,8 : 890 = 0,02 mol. Một mol chất béo khi xà phòng hoá chỉ cho một mol glycerol C<sub>3</sub>H<sub>5</sub>(OH)<sub>3</sub>, nên số mol glycerol = 0,02 mol. Khối lượng glycerol = 0,02 × 92 = 1,84 gam. Số 5,52 con chọn là do nhân thêm hệ số 3 của NaOH.' } },
]

// ══ ph-d · BẢNG ĐẦY ĐỦ ═══════════════════════════════════════════════
const dang = (d, mau) => `<li><div class="phm-dang__dau"><h3>${d.ten}</h3><span>đúng <b>${d.dung}/${d.tong}</b> câu</span></div>${thanh(d.dung / d.tong, mau, '', 'phm-thanh--manh')}
  <div class="phm-bac" role="img" aria-label="Bậc hiện tại của con: ${['Biết', 'Hiểu', 'Vận dụng'][d.bac]}. Ba bậc: Biết, Hiểu, Vận dụng">${['Biết', 'Hiểu', 'Vận dụng'].map((b, i) => `<span${i === d.bac ? ' data-nay' : ''}>${b}</span>`).join('')}</div>
  ${d.moi ? `<p class="phm-dang__ghi" data-mau="dat">${ic('len')}Mới lên bậc Hiểu hôm nay</p>` : d.xep ? `<p class="phm-dang__ghi">${ic('on-lai')}${d.xep} câu vào lịch ôn ngày 22/09</p>` : ''}</li>`
const cot14 = (ds) => `<div class="phm-bieu phm-14" role="img" aria-label="Số câu con làm mỗi ngày, ${ds[0][1]}/09 đến ${ds.at(-1)[1]}/09: ${ds.map(([t, n, c]) => `${t} ${n}: ${c ? c + ' câu' : 'không học'}`).join('; ')}">
  <div class="phm-bieu__luoi" aria-hidden="true"><span style="top:0"><em>40 câu</em></span><span style="top:50%"><em>20 câu</em></span><span style="top:100%"><em>0</em></span></div>
  <ol aria-hidden="true">${ds.map(([, n, c], i) => `<li${i === ds.length - 1 ? ' data-nay' : ''}${c ? '' : ' data-nghi'}>${i === ds.length - 1 && c ? `<em>${c}</em>` : ''}<i style="--c:${c}"></i><span>${n}</span></li>`).join('')}</ol></div>
  <p class="phm-14__chu" aria-hidden="true"><span><i data-nay></i>hôm nay</span><span><i></i>ngày có học</span><span><i data-nghi></i>ngày con không học</span></p>`
const theOn = (o, khi = 'ngày mai', ngay = 'Thứ Ba 22/09/2026') => `<div class="phm-on"><p class="phm-on__so"><b>${o.mai}</b><span>câu đến lịch ôn ${khi}</span><small>${ngay} · khoảng ${o.phut} phút</small></p>${o.khacPhuc ? vongNho(o.khacPhuc, o.tungSai, `Đã khắc phục ${o.khacPhuc} trong ${o.tungSai} câu từng sai`) : ''}</div>
  ${o.khacPhuc ? `<p class="phm-on__kp">${ic('dung-tron')}<span>Đã khắc phục ${o.khacPhuc} trong ${o.tungSai} câu từng sai<small>còn ${o.tungSai - o.khacPhuc} câu đang trong lịch ôn</small></span></p>`
    : `<p class="phm-on__kp" data-mau="xam">${ic('on-lai')}<span>${o.tungSai} câu con từng sai đang trong lịch ôn<small>câu nào con làm đúng lại đủ lịch sẽ được tính là đã khắc phục</small></span></p>`}`

const MUC_D = [['muc-tong-quan', 'Tổng quan'], ['muc-thoi-gian', 'Dòng thời gian'], ['muc-ca', 'Ca kiểm tra'], ['muc-dang', 'Điểm mạnh · cần luyện'], ['muc-cau', `Từng câu (${T.cau})`], ['muc-btvn', 'Bài tập về nhà'], ['muc-on', 'Lịch ôn lại'], ['muc-14', '14 ngày'], ['muc-loi', 'Lời A.I Đỗ Đại Học']]
const trangD = () => trang({ tieuDe: 'App phụ huynh · bảng “Mọi thứ về con” kiểu Apple, đầy đủ (bản vẽ)', mucLuc: mucLuc(MUC_D), day: thanhDay('Hôm nay còn 2 lượt giao'), body: `
<div class="phm-hang"><div class="phm-cot">
  ${muc('muc-tong-quan', 1, 'Tổng quan hôm nay', anhHung({ t: T, dat: true, capNhat: 'cập nhật lúc 21:00', hq: HOM_QUA, loi: `Hôm nay <span data-ten-goi>${tenGoi(CON.ten)}</span> học ${LAN.length} lần, lần dài nhất ${T.daiNhat} phút, và đã đạt nhiệm vụ ngày.` }), 'phm-muc--dau')}
  ${muc('muc-thoi-gian', 4, 'Dòng thời gian trong ngày', dongThoiGian(LAN, T, (i) => `nhom-${i + 1}`))}
</div><div class="phm-cot">
  ${muc('muc-mung', 2, 'Điều đáng mừng hôm nay', theMung([
    `<li><span class="phm-o-bt" data-mau="dat">${ic('on-lai')}</span><div><h3>Con làm đúng lại <b>4 câu</b> từng sai tuần trước</h3><p>trong 6 câu ôn lại lúc 06:40 sáng nay</p><div class="phm-o4" aria-hidden="true">${`<i>${ic('dung')}</i>`.repeat(4)}</div></div></li>`,
    `<li><span class="phm-o-bt" data-mau="dat">${ic('bac')}</span><div><h3>Con lên bậc ở <b>2 dạng</b></h3><ul class="phm-len-bac">${LAM_TOT.filter((d) => d.moi).map((d) => `<li><span>${d.ten}</span><span class="phm-bac-len">Biết ${ic('phai')} <b>Hiểu</b></span></li>`).join('')}</ul></div></li>`,
    `<li><span class="phm-o-bt" data-mau="dat">${ic('lich')}</span><div><h3>Con học đều ngày thứ <b>${CHUOI}</b> liên tiếp</h3><p>từ Thứ Tư 16/09 đến hôm nay</p>${tuan7(N14)}</div></li>`]), 'phm-muc--sat')}
  ${muc('muc-ai-lam', 3, 'Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay', theLam({ ten: 'Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay', cuoi: 'Anh/chị không cần làm gì thêm — chỉ cần động viên con học đều.', dong: [
    [`Chọn riêng <b>${Object.values(AI_CHON).reduce((a, b) => a + b, 0)} câu</b> hợp với sức của con`, `${AI_CHON.thuThach} câu thử thách, ${AI_CHON.luyen} câu luyện dạng còn vấp, ${AI_CHON.giaDinh} câu bài gia đình giao, ${AI_CHON.btvnRieng} câu dành riêng trong bài tập về nhà`],
    [`Xếp <b>${ON.mai} câu</b> con từng sai vào lịch ôn ngày mai`, 'Thứ Ba 22/09/2026 · khoảng 10 phút'],
    [`Soạn một thử thách riêng <b>${AI_CHON.thuThach} câu</b> lúc 19:30`, `con làm lúc 19:35, đúng ${LAN[2].dung} câu`],
    ['Nhắc con trước hạn nộp bài tập về nhà', 'nhắc lúc 17:00 · con làm chặng 2 lúc 17:12'],
    [`Chấm và giải thích <b>${T.cau} câu</b> ngay khi con làm xong`, 'câu nào cũng có đáp án và lời giải ngắn']] }), 'phm-muc--sat')}
  ${muc('muc-ca', 5, 'Ca kiểm tra gần nhất', `${dauMuc('Ca kiểm tra gần nhất')}<div class="phm-the phm-the--dem"><p class="phm-nhan-muc" data-mau="xam">${CA.ten}</p>
    <p class="phm-diem" role="img" aria-label="${vn(CA.diem)} trên 10 điểm"><b>${vn(CA.diem)}</b><span>/10 điểm</span></p>
    <p class="phm-ca__hon"><i>${ic('len')}</i><span>Hơn ${vn(CA.diem - CA.truoc)} điểm so với lần trước của chính con</span></p>
    <p class="phm-phu">Lần trước ${vn(CA.truoc)} điểm · nộp lúc ${CA.nop} · đúng ${tong(CA.phan, 'dung')}/${tong(CA.phan, 'tong')} câu · làm trong ${CA.lam}</p>
    <ul class="phm-phan">${CA.phan.map((p) => `<li><div class="phm-phan__dau"><h3>${p.ten}</h3><span>${vn(p.diem)}<small>/${vn(p.toiDa)} điểm</small></span></div>${thanh(p.diem / p.toiDa, '', `${vn(p.diem)} trên ${vn(p.toiDa)} điểm`)}<p>${p.chu} ${p.dung}/${p.tong} câu</p></li>`).join('')}</ul></div>
    ${bienThe('khi thầy chưa công bố điểm')}<div class="phm-the phm-dong-bt"><span class="phm-o-bt" data-mau="xam">${ic('khoa')}</span><div><h3>Thầy chưa công bố điểm</h3><p>Con đã nộp bài lúc ${CA.nop}. Điểm và từng câu sẽ hiện khi thầy công bố.</p></div></div>`)}
</div></div>
${muc('muc-dang', 6, 'Điểm mạnh và cần luyện', `${dauMuc('Điểm mạnh · cần luyện', 'tính trên 14 ngày gần đây')}<div class="phm-hai">
  <div class="phm-the phm-the--dem"><p class="phm-nhan-muc" data-mau="dat">${ic('dung-tron')}Dạng con làm tốt</p><ul class="phm-dang">${LAM_TOT.map((d) => dang(d, 'dat')).join('')}</ul></div>
  <div class="phm-the phm-the--dem"><p class="phm-nhan-muc" data-mau="cam">${ic('muc-tieu')}Dạng con còn vấp</p><ul class="phm-dang">${CON_VAP.map((d) => dang(d, 'cam')).join('')}</ul>
    <p class="phm-the__cuoi">${ic('lich')}<span>A.I Đỗ Đại Học đã xếp <b>${ON.mai} câu</b> của ${CON_VAP.length} dạng này vào lịch ôn ngày 22/09</span></p></div></div>
  <p class="phm-ghi-chu">Mỗi dạng bài con đi qua ba bậc: Biết, Hiểu, Vận dụng.</p>`)}
<div class="phm-hang"><div class="phm-cot">
  ${muc('muc-cau', 7, 'Từng câu con đã làm hôm nay', `${dauMuc('Từng câu con đã làm', `${T.cau} câu hôm nay · xếp theo giờ làm`)}${boLoc(T, SO_LAM_LAU)}<div class="phm-tu-cau" data-loc="">
    ${nhomCau(LAN[0], 0)}
    ${nhomCau(LAN[1], 1, { ds: CAU_BTVN, them: `Hiện đủ ${LAN[1].cau} câu<small>còn ${LAN[1].cau - CAU_BTVN.length} câu nữa của lần này</small>` })}
    ${nhomCau(LAN[2], 2)}
    ${nhomCau(LAN[3], 3, { ds: CAU_LUYEN, them: `Hiện đủ ${LAN[3].cau} câu<small>còn ${LAN[3].cau - CAU_LUYEN.length} câu nữa của lần này</small>` })}
    ${nhomCau(LAN[4], 4)}
    ${bienThe('nhóm câu của bài con chưa nộp')}<div class="phm-the"><div class="phm-dong-bt"><span class="phm-o-bt" data-mau="xam">${ic('khoa')}</span><div><h3>Bài tập về nhà · chặng 3 · con đang làm</h3><p>Con đã làm 6 câu · kết quả hiện sau khi con nộp bài</p></div></div>
      <div class="phm-dai-o" style="padding-top:0" role="img" aria-label="6 câu con đã làm, chưa hiện kết quả">${'<i class="phm-o-cau" data-che></i>'.repeat(6)}</div></div></div>`)}
</div><div class="phm-cot">
  ${muc('muc-btvn', 8, 'Bài tập về nhà', `${dauMuc('Bài tập về nhà', '1 bài đang chạy · 2 bài gần đây')}<div class="phm-the phm-the--dem"><p class="phm-nhan-muc">${ic('sach')}Đang chạy</p><h3 class="phm-ten-the">Ester – Lipid</h3><p class="phm-phu">Xong 2 trong 5 chặng</p>
    <ol class="phm-chang" aria-label="Năm chặng: chặng 1 và 2 đã xong, chặng 2 là của hôm nay, chặng 3 đến 5 sắp tới">${[['xong', 'CN 20'], ['hom-nay', 'Hôm nay'], ['', 'T3 22'], ['', 'T4 23'], ['', 'T5 24']].map(([tt, n], i) => `<li data-tt="${tt}"><i>${tt ? ic('dung') : i + 1}</i>${n}</li>`).join('')}</ol>
    <p style="margin-top:14px">${chip('Nộp đúng nhịp: mỗi ngày một chặng', 'dat', 'dung')}</p>
    <ul class="phm-ds phm-ds--vach"><li><span>Chặng 2</span><b>đúng 9/12 câu<small>con nộp hôm nay lúc 17:33</small></b></li>
      <li><span>Hạn nộp</span><b>12:00 · Thứ Sáu 25/09/2026<small>còn 3 ngày 15 giờ</small></b></li></ul></div>
    ${bienThe('khi con còn chặng của ngày trước')}<p class="phm-dong-cam">${ic('dong-ho')}<span><b>Con còn 1 chặng của Thứ Hai</b> · tối nay cần khoảng 36 phút</span></p>
    <div class="phm-nhom__dau" style="margin-top:20px"><h3>Gần đây · mới nhất trước</h3></div><div class="phm-the"><ul class="phm-bai">
      <li><div><h3>Ôn tập Alcohol – Phenol</h3><p>Nộp 21:40 · Thứ Năm 17/09/2026</p>${chip('Nộp đúng hạn', 'dat', 'dung')}</div><p class="phm-bai__diem">8,2<small>/10 điểm</small></p></li>
      <li><div><h3>Ôn tập Carboxylic acid</h3><p>Nộp 23:05 · Thứ Bảy 12/09/2026</p>${chip('Nộp trễ 1 giờ', 'cam', 'dong-ho')}</div><p class="phm-bai__diem">7,0<small>/10 điểm</small></p></li></ul></div>`)}
  ${muc('muc-on', 9, 'Lịch ôn lại', `${dauMuc('Lịch ôn lại', 'các câu con từng làm sai')}<div class="phm-the phm-the--dem">${theOn(ON)}
    <div class="phm-tuan"><h3>Số câu đến lịch ôn · 7 ngày tới</h3><ol>${ON.tuan.map(([t, n, c], i) => `<li${i === 0 ? ' data-mai' : ''}${c ? '' : ' data-khong'} aria-label="${t} ${n}/09: ${c} câu"><b>${c}</b><i style="--c:${c}"></i>${t} ${n}</li>`).join('')}</ol></div></div>`)}
  ${muc('muc-14', 10, '14 ngày gần đây', `${dauMuc('14 ngày gần đây', 'số câu con làm mỗi ngày · 08/09 đến 21/09')}<div class="phm-the phm-the--dem"><p class="phm-so-to"><b>283<small>câu trong 14 ngày</small></b><span>con học 11 trong 14 ngày</span></p>${cot14(N14)}
    <ul class="phm-ds phm-ds--vach"><li><span>Trung bình mỗi ngày</span><b>${Math.round(283 / 14)} câu</b></li><li><span>Giờ con thường học</span><b><span class="phm-lien">19:30 đến 21:00</span></b></li><li><span>Chuỗi học đều</span><b>${CHUOI} ngày<small>liên tục từ 16/09</small></b></li></ul></div>`)}
  ${muc('muc-loi', 11, 'Lời A.I Đỗ Đại Học gửi anh/chị', `${dauMuc('Lời A.I Đỗ Đại Học gửi anh/chị')}<div class="phm-the phm-thu"><div class="phm-thu__dau"><i aria-hidden="true">A.I</i><div><h3>A.I Đỗ Đại Học</h3><p>${NGAY} · 21:00</p></div></div>
    <div class="phm-thu__than"><p>Thưa anh/chị, hôm nay <span data-ten-goi>${tenGoi(CON.ten)}</span> làm ${T.cau} câu trong ${T.phut} phút, đúng ${T.dung} câu, nhiều hơn hôm qua ${T.cau - HOM_QUA.cau} câu. Con lên bậc Hiểu ở hai dạng: Phản ứng ester hoá và Tính chất vật lí của lipid.</p>
      <p>Dạng Xà phòng hoá chất béo con mới đúng ${CON_VAP[0].dung} trong ${CON_VAP[0].tong} câu, nên ngày mai 22/09 con sẽ ôn lại ${CON_VAP[0].xep} câu dạng này. Bài ${LAN[4].cau} câu anh/chị giao lúc 19:58 con đã làm xong lúc 20:47, đúng ${LAN[4].dung} câu.</p></div>
    <p class="phm-thu__ky">A.I Đỗ Đại Học viết từ số liệu học của con.</p></div>
    <div class="phm-the phm-the--dem"><p class="phm-nhan-muc">Anh/chị có thể làm gì</p><ol class="phm-goi-y">
      <li><i aria-hidden="true">1</i><span>Hỏi con kể lại cách giải câu xà phòng hoá tristearin lúc 20:14 (đáp án 1,84 gam). Con nói được vì sao một mol chất béo chỉ cho một mol glycerol là con đã hiểu.</span></li>
      <li><i aria-hidden="true">2</i><span>Ngày mai nhắc con làm ${ON.mai} câu đến lịch ôn, khoảng ${ON.phut} phút.</span></li></ol></div>`)}
  <p class="phm-do-cham">${ic('nhom')}<span>Độ chăm hôm nay: con đứng thứ <b>9</b> trong <b>42</b> bạn của lớp</span></p>
</div></div>` })

// ══ ph-e · DỮ LIỆU THƯA + "HÔM NAY CON CHƯA HỌC" ═════════════════════
const CAU_T = [
  { gio: '06:50', dang: 'Danh pháp ester', de: 'Tên gọi của ester CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> là', chon: 'B', dapAn: 'B', dung: true, giay: '40 giây' },
  { gio: '12:10', dang: 'Phản ứng ester hoá', de: 'Phản ứng giữa carboxylic acid và alcohol (xúc tác H<sub>2</sub>SO<sub>4</sub> đặc, đun nóng) được gọi là phản ứng', chon: 'A', dapAn: 'A', dung: true, giay: '48 giây' },
  { gio: '12:11', dang: 'Phản ứng thuỷ phân ester', de: 'Thuỷ phân ester CH<sub>3</sub>COOCH<sub>3</sub> trong môi trường acid thu được các sản phẩm là', chon: 'C', dapAn: 'A', dung: false, giay: '1 phút 5 giây' },
  { gio: '16:45', dang: 'Danh pháp ester', de: 'Ester HCOOCH<sub>3</sub> có tên gọi là', chon: 'D', dapAn: 'C', dung: false, giay: '55 giây' },
]
const MUC_E = [['muc-tong-quan', 'Tổng quan'], ['muc-thoi-gian', 'Dòng thời gian'], ['muc-cau', `Từng câu (${TT.cau})`], ['muc-on', 'Lịch ôn lại'], ['muc-14', '14 ngày'], ['muc-loi', 'Lời A.I Đỗ Đại Học']]
const MUC_CH = [['muc-tong-quan', 'Tổng quan'], ['muc-on-ch', 'Lịch ôn lại'], ['muc-14-ch', '14 ngày']]
const theSap = (canh) => `<div class="phm-the phm-the--dem" data-khi-canh="${canh}"><p class="phm-nhan-muc" data-mau="xam">Bảng sẽ đầy dần khi con học thêm</p><ul class="phm-sap">
  <li>${ic('cot')}<span>Điểm mạnh · cần luyện<small>hiện khi con làm khoảng 20 câu nữa, đủ để A.I Đỗ Đại Học nhận ra từng dạng</small></span></li>
  <li>${ic('cham')}<span>Ca kiểm tra gần nhất<small>hiện khi thầy công bố điểm ca kiểm tra đầu tiên của con</small></span></li>
  <li>${ic('sach')}<span>Bài tập về nhà<small>hiện khi thầy giao bài cho lớp của con</small></span></li></ul></div>`
const trangE = () => trang({ tieuDe: 'App phụ huynh · bảng “Mọi thứ về con” kiểu Apple, dữ liệu thưa + con chưa học (bản vẽ)', canh: 'thua', mucLuc: mucLuc(MUC_E, 'thua') + mucLuc(MUC_CH, 'chua-hoc'),
  day: `<div data-khi-canh="thua">${thanhDay('Hôm nay còn 3 lượt giao')}</div><div data-khi-canh="chua-hoc">${thanhDay('Hôm nay còn 3 lượt giao · một bài ngắn khoảng 8 phút')}</div>`, body: `
<div class="phm-hang"><div class="phm-cot">
  ${muc('muc-tong-quan', 1, 'Tổng quan hôm nay', `${anhHung({ canh: 'thua', t: TT, dat: false, capNhat: 'cập nhật lúc 19:30', hq: HOM_QUA_T, loi: `Hôm nay <span data-ten-goi>${tenGoi(CON.ten)}</span> học ${LAN_T.length} lần ngắn, lần dài nhất ${TT.daiNhat} phút.`, loiPhu: `Con cần thêm ${MUC_TIEU.cau - TT.cau} câu nữa để đạt nhiệm vụ ngày.` })}
    ${anhHung({ canh: 'chua-hoc', t: { cau: 0, dung: 0, phut: 0, pt: 0 }, dat: false, capNhat: 'cập nhật lúc 17:30', loi: 'Hôm nay con chưa học', loiPhu: 'Lần học gần nhất: 19:45 · Chủ nhật 20/09/2026. Anh/chị có thể giao cho con một bài ngắn 6 câu, khoảng 8 phút, để con bắt đầu buổi tối nay.' })}`, 'phm-muc--dau')}
  <section class="phm-muc" id="muc-thoi-gian" style="--tt:4" aria-label="Dòng thời gian trong ngày" data-khi-canh="thua">${dongThoiGian(LAN_T, TT, () => 'muc-cau')}</section>
</div><div class="phm-cot">
  ${muc('muc-mung', 2, 'Điều đáng mừng hôm nay', theMung([
    `<li><span class="phm-o-bt" data-mau="dat">${ic('lich')}</span><div><h3>Con học đều ngày thứ <b>${chuoiCua(N14_T)}</b> liên tiếp</h3><p>từ Thứ Sáu 18/09 đến hôm nay</p>${tuan7(N14_T)}</div></li>`,
    `<li><span class="phm-o-bt" data-mau="dat">${ic('on-lai')}</span><div><h3>Con làm đúng lại <b>1 câu</b> từng sai</h3><p>câu ôn lại lúc 19:20</p></div></li>`]), 'phm-muc--sat', 'thua')}
  ${muc('muc-ai-lam', 3, 'A.I Đỗ Đại Học đã làm gì cho con hôm nay', `${theLam({ canh: 'thua', ten: 'Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay', cuoi: 'Anh/chị không cần làm gì thêm — chỉ cần động viên con học đều.', dong: [
    ['Chọn riêng <b>6 câu</b> hợp với sức của con', '4 câu luyện dạng còn vấp, 2 câu thử thách'], [`Xếp <b>${ON_T.mai} câu</b> con từng sai vào lịch ôn ngày mai`, `Thứ Ba 22/09/2026 · khoảng ${ON_T.phut} phút`],
    ['Soạn một thử thách riêng <b>5 câu</b> lúc 18:30', 'con đã làm 2 câu, còn 3 câu chờ con'], [`Chấm và giải thích <b>${TT.cau} câu</b> ngay khi con làm xong`, 'câu nào cũng có đáp án và lời giải ngắn']] })}
    ${theLam({ canh: 'chua-hoc', ten: 'A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay', cuoi: 'Mọi thứ đã sẵn. Con chỉ cần mở app là có bài vừa sức để làm ngay.', dong: [
    ['Chọn sẵn <b>8 câu</b> hợp với sức của con', '4 câu luyện dạng còn vấp, 4 câu thử thách'], ['Xếp <b>2 câu</b> con từng sai vào lịch ôn hôm nay', 'khoảng 3 phút'], ['Sẽ nhắc con lúc <b>19:00</b>', 'nếu đến giờ đó con vẫn chưa mở bài']] })}`, 'phm-muc--sat')}
</div></div>
<div class="phm-hang"><div class="phm-cot">
  <section class="phm-muc" id="muc-cau" style="--tt:7" aria-label="Từng câu con đã làm hôm nay" data-khi-canh="thua">${dauMuc('Từng câu con đã làm', `${TT.cau} câu hôm nay · xếp theo giờ làm`)}${boLoc(TT, 0)}<div class="phm-tu-cau" data-loc="">
    <div class="phm-nhom" style="margin-top:14px"><div class="phm-the">${daiO({ cau: TT.cau, dung: TT.dung, sai: [3, 4, 5, 8] })}<ul>${CAU_T.map(cau).join('')}</ul><button class="phm-them" type="button"><span>Hiện đủ ${TT.cau} câu<small>còn ${TT.cau - CAU_T.length} câu nữa</small></span>${ic('xuong', 'phm-i--mui')}</button></div></div></div></section>
  <section class="phm-muc" id="muc-on" style="--tt:9" aria-label="Lịch ôn lại" data-khi-canh="thua">${dauMuc('Lịch ôn lại', 'các câu con từng làm sai')}<div class="phm-the phm-the--dem">${theOn(ON_T)}</div></section>
  <section class="phm-muc" id="muc-on-ch" style="--tt:9" aria-label="Lịch ôn lại" data-khi-canh="chua-hoc">${dauMuc('Lịch ôn lại', 'các câu con từng làm sai')}<div class="phm-the phm-the--dem">${theOn({ mai: 2, phut: 3, khacPhuc: 0, tungSai: 3 }, 'hôm nay', NGAY)}</div></section>
</div><div class="phm-cot">
  <section class="phm-muc" id="muc-14" style="--tt:10" aria-label="14 ngày gần đây" data-khi-canh="thua">${dauMuc('14 ngày gần đây', 'con bắt đầu dùng app từ Thứ Sáu 18/09')}<div class="phm-the phm-the--dem"><p class="phm-so-to"><b>${N14_T.reduce((a, x) => a + x[2], 0)}<small>câu trong 4 ngày</small></b><span>con học đủ cả 4 ngày</span></p>${cot14(N14_T)}
    <ul class="phm-ds phm-ds--vach"><li><span>Trung bình mỗi ngày có học</span><b>${vn((N14_T.reduce((a, x) => a + x[2], 0) / 4).toFixed(1))} câu</b></li><li><span>Chuỗi học đều</span><b>4 ngày<small>liên tục từ 18/09</small></b></li></ul></div></section>
  <section class="phm-muc" id="muc-14-ch" style="--tt:10" aria-label="14 ngày gần đây" data-khi-canh="chua-hoc">${dauMuc('14 ngày gần đây', 'con bắt đầu dùng app từ Thứ Sáu 18/09')}<div class="phm-the phm-the--dem"><p class="phm-so-to"><b>${N14_CH.reduce((a, x) => a + x[2], 0)}<small>câu trong 3 ngày</small></b><span>chuỗi 3 ngày, tính đến hôm qua</span></p>${cot14(N14_CH)}</div></section>
  <section class="phm-muc" id="muc-loi" style="--tt:11" aria-label="Lời A.I Đỗ Đại Học gửi anh/chị" data-khi-canh="thua">${dauMuc('Lời A.I Đỗ Đại Học gửi anh/chị')}<div class="phm-the phm-thu"><div class="phm-thu__dau"><i aria-hidden="true">A.I</i><div><h3>A.I Đỗ Đại Học</h3><p>${NGAY} · 19:30</p></div></div>
    <div class="phm-thu__than"><p>Thưa anh/chị, hôm nay <span data-ten-goi>${tenGoi(CON.ten)}</span> mở app ${LAN_T.length} lần, làm ${TT.cau} câu trong ${TT.phut} phút, đúng ${TT.dung} câu. Con đã học đều ${chuoiCua(N14_T)} ngày liền, đó là điều quý nhất ở tuần đầu.</p><p>Mỗi lần con mới ngồi 1 đến 3 phút. Nếu có một lần ngồi khoảng 10 phút, con sẽ làm được đủ ${MUC_TIEU.cau} câu của nhiệm vụ ngày.</p></div>
    <p class="phm-thu__ky">A.I Đỗ Đại Học viết từ số liệu học của con.</p></div>
    <div class="phm-the phm-the--dem"><p class="phm-nhan-muc">Anh/chị có thể làm gì</p><ol class="phm-goi-y"><li><i aria-hidden="true">1</i><span>Khen con đã học đều 4 ngày liền, rồi rủ con ngồi một lần 10 phút sau bữa tối.</span></li><li><i aria-hidden="true">2</i><span>Ngày mai nhắc con làm ${ON_T.mai} câu đến lịch ôn, khoảng ${ON_T.phut} phút.</span></li></ol></div></section>
  <section class="phm-muc" style="--tt:12" aria-label="Bảng sẽ đầy dần khi con học thêm">${theSap('thua')}${theSap('chua-hoc')}</section>
  <p class="phm-do-cham" data-khi-canh="thua">${ic('nhom')}<span>Độ chăm hôm nay: con đứng thứ <b>31</b> trong <b>42</b> bạn của lớp</span></p>
</div></div>` })

writeFileSync(join(AQUI, 'ph-d-bang-day-du.html'), trangD())
writeFileSync(join(AQUI, 'ph-e-bang-thua.html'), trangE())
console.log(`đã ghi ph-d-bang-day-du.html + ph-e-bang-thua.html · đầy đủ: ${T.cau} câu, ${T.dung} đúng (${T.pt} %), ${T.phut} phút, ${LAN.length} lần, chuỗi ${CHUOI} · thưa: ${TT.cau} câu, ${TT.dung} đúng (${TT.pt} %), ${TT.phut} phút, ${LAN_T.length} lần, chuỗi ${chuoiCua(N14_T)}`)

// kiểm chữ cấm + tiền tố lớp (tĩnh, trên HTML đã sinh — bỏ phần <style> và <script>)
for (const tep of ['ph-d-bang-day-du.html', 'ph-e-bang-thua.html']) { const s = readFileSync(join(AQUI, tep), 'utf8'); const than = s.slice(s.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g, '')
  const chu = than.replace(/<[^>]+>/g, ' ')
  const cam = ['thần thú', 'EXP', 'khiên', 'game', 'Đảo', 'Đoàn', 'nắm chắc', 'Yếu', 'Khá', 'Giỏi', 'este ', 'deadline', 'Máy '].filter((w) => chu.includes(w))
  const lop = [...than.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/)).filter((c) => !c.startsWith('phm-') && c !== 'm3')
  const emoji = /\p{Extended_Pictographic}/u.test(chu.replace(/[▲▼©®™↔↕]/g, ''))
  console.log(`${tep}: chữ cấm ${cam.length ? cam.join(', ') : '0'} · lớp sai tiền tố ${lop.length ? [...new Set(lop)].join(', ') : '0'} · emoji ${emoji ? 'CÓ' : '0'}`) }
{ const lopCss = [...readFileSync(join(AQUI, 'ph-apple-bang.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]).filter((c) => !c.startsWith('phm-') && !/^\d/.test(c))
  console.log(`ph-apple-bang.css: lớp không bắt đầu bằng phm-: ${[...new Set(lopCss)].join(', ') || '0'}`) }

// ── CHỤP ẢNH + TỰ KIỂM ───────────────────────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh'); mkdirSync(RA, { recursive: true })
  for (const f of readdirSync(RA)) if (/^ph-[de]-.*\.jpg$/.test(f)) unlinkSync(join(RA, f))
  const TRAN = 150_000, CAO_DOAN = 1400
  const browser = await chromium.launch(); let xau = 0
  /** Chạy trong trang: tràn ngang, phần tử lòi mép, chữ bị cắt, đích chạm < 48, tương phản < 4,5:1 (chữ lớn < 3:1), chữ < 12 px. */
  const KIEM = () => {
    const doi = (s) => { let m = s.match(/^rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
      m = s.match(/^color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] } return null }
    const tron = (tren, duoi) => { const a = tren[3]; return [0, 1, 2].map((i) => tren[i] * a + duoi[i] * (1 - a)).concat(1) }
    const sang = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
    const nen = (e) => { const lop = []; for (let x = e; x; x = x.parentElement) { const c = doi(getComputedStyle(x).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] === 1) break } } let kq = [255, 255, 255, 1]; for (const c of lop.reverse()) kq = tron(c, kq); return kq }
    const coChu = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden' }
    const tat = [...document.querySelectorAll('body *')].filter((e) => hien(e) && !e.closest('.phm-sr, script, style'))
    const tp = []
    for (const e of tat) { if (!coChu(e) || e.closest('.phm-tren__giua')) continue
      const cs = getComputedStyle(e), b = nen(e), chu = tron(doi(cs.color) || [0, 0, 0, 1], b), l1 = sang(chu), l2 = sang(b), ti = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      const co = parseFloat(cs.fontSize), lon = co >= 24 || (co >= 18.66 && Number(cs.fontWeight) >= 700)
      if (ti < (lon ? 3 : 4.5)) tp.push(`${e.className || e.tagName} "${e.textContent.trim().slice(0, 22)}" ${ti.toFixed(2)}`) }
    const nho = [...document.querySelectorAll('a,button,summary')].filter((e) => hien(e)).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 47.5 || r.width < 47.5 }).map((e) => `${e.className} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    const chuNho = tat.filter((e) => coChu(e) && e.tagName !== 'SUB' && parseFloat(getComputedStyle(e).fontSize) < 11.99).map((e) => e.className || e.tagName)
    const loi = tat.filter((e) => { const r = e.getBoundingClientRect(); return !e.closest('.phm-muc-luc ul') && !e.closest('svg') && (r.right > innerWidth + 0.5 || r.left < -0.5) }).map((e) => e.className || e.tagName)
    const cat = tat.filter((e) => coChu(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible' && !e.closest('.phm-tren__giua')).map((e) => e.className || e.tagName)
    // chữ của một ô đè sang ô bên cạnh trong cùng hàng lưới/flex (nhãn trục, ô chặng, ô bậc)
    const de = []; for (const cha of document.querySelectorAll('.phm-chang, .phm-bac, .phm-tuan ol, .phm-seg, .phm-7')) { if (!hien(cha)) continue; for (const c of cha.children) if (c.scrollWidth > c.clientWidth + 1) de.push(`${cha.className}>${c.textContent.trim().slice(0, 12)}`) }
    const diem = [...document.querySelectorAll('.phm-muc, .phm-nhom, .phm-the + .phm-the, .phm-bien-the, .phm-do-cham, .phm-nhom__dau')].filter(hien).map((e) => Math.round(e.getBoundingClientRect().top + scrollY))
    return { cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth, nho, tp, chuNho, loi, cat, de, diem, hang: getComputedStyle(document.querySelector('.phm-hang')).display }
  }
  const mo = async (ten, w, h, { toi = false, dsf = 2, bam = '', diDong = true } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: dsf, hasTouch: diDong, isMobile: diDong }); const tr = await ctx.newPage(); const loi = []; tr.on('pageerror', (e) => loi.push(String(e)))
    await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); await tr.goto('file://' + join(AQUI, `${ten}.html`) + (bam ? `#${bam}` : ''), { waitUntil: 'load' }); await tr.evaluate(() => document.fonts.ready); await tr.waitForTimeout(250); return { ctx, tr, loi } }
  const bao = (tep, kq, kt) => { const hong = !kq || kt.tran > 0 || kt.loi.length || kt.cat.length || kt.de.length || kt.nho.length || kt.tp.length || kt.chuNho.length || kt.loiTrang?.length
    console.log(tep.padEnd(40), (kq || 'QUÁ 150 KB').padEnd(36), `tràn ${kt.tran} · lòi ${kt.loi.length} · cắt chữ ${kt.cat.length} · đè ô ${kt.de.length} · đích<48 ${kt.nho.length} · tương phản thấp ${kt.tp.length} · chữ<12 ${kt.chuNho.length}`)
    for (const [k, v] of [['đích nhỏ', kt.nho], ['tương phản', kt.tp], ['lòi', kt.loi], ['cắt chữ', kt.cat], ['đè ô', kt.de], ['chữ nhỏ', kt.chuNho], ['lỗi trang', kt.loiTrang ?? []]]) if (v.length) console.log(`   ${k}:`, [...new Set(v)].slice(0, 8).join(' | '))
    if (hong) xau++ }
  const nen = async (tr, clip, dsfGhi, tep) => { for (const q of [84, 76, 68, 60]) { const buf = await tr.screenshot({ type: 'jpeg', quality: q, clip }); if (buf.length <= TRAN) { writeFileSync(join(RA, tep), buf); return `${Math.round(buf.length / 1024)} KB · tỉ lệ ${dsfGhi} · chất lượng ${q} · cao ${Math.round(clip.height)}` } } return '' }
  /** Chụp CẢ TRANG thành các đoạn ≤ 1700 px, cắt ở khe giữa các khối. toiDa = chỉ lấy mấy đoạn đầu. */
  const chupDoan = async (ten, goc, w, { toiDa = 99, caoDoan = CAO_DOAN, dsfs = [2, 1.5, 1.25, 1], ...tuy } = {}) => {
    const { ctx, tr, loi } = await mo(ten, w, 844, { ...tuy, dsf: 1 }); const kt = await tr.evaluate(KIEM); kt.loiTrang = loi; await ctx.close()
    // chia ĐỀU: n đoạn, mỗi nhát cắt rơi vào khe giữa hai khối gần mốc k·cao/n nhất (đoạn cuối không bị cụt lủn)
    const n = Math.ceil(kt.cao / caoDoan), cat = [0]
    for (let k = 1; k < n; k++) { const dich = (k * kt.cao) / n, ung = kt.diem.map((y) => y - 7).filter((y) => y > cat.at(-1) + 400 && y < kt.cao - 400); cat.push(ung.length ? ung.reduce((a, y) => (Math.abs(y - dich) < Math.abs(a - dich) ? y : a)) : Math.round(dich)) }
    cat.push(kt.cao)
    const soDoan = Math.min(cat.length - 1, toiDa)
    for (let i = 0; i < soDoan; i++) { const tep = `${goc}-${i + 1}.jpg`; let xong = ''
      for (const dsf of dsfs) { const p = await mo(ten, w, 844, { ...tuy, dsf }); await p.tr.setViewportSize({ width: w, height: kt.cao }); await p.tr.waitForTimeout(120)
        xong = await nen(p.tr, { x: 0, y: cat[i], width: w, height: cat[i + 1] - cat[i] }, dsf, tep); await p.ctx.close(); if (xong) break }
      bao(tep, xong, i === 0 ? kt : { ...kt, tran: 0, loi: [], cat: [], de: [], nho: [], tp: [], chuNho: [], loiTrang: [] }) }
    return { kt, soDoan, tongDoan: cat.length - 1 } }
  const chupMan = async (ten, tep, w, h, { cuonToi = '', dsfs = [2, 1.5, 1], ...tuy } = {}) => { let xong = '', kt = null
    for (const dsf of dsfs) { const p = await mo(ten, w, h, { ...tuy, dsf }); kt = await p.tr.evaluate(KIEM); kt.loiTrang = p.loi
      if (cuonToi) { await p.tr.evaluate((s) => { const e = document.querySelector(s); scrollTo({ top: e.getBoundingClientRect().top + scrollY - 118, behavior: 'instant' }) }, cuonToi); await p.tr.waitForTimeout(350) }
      xong = await nen(p.tr, { x: 0, y: 0, width: w, height: h }, dsf, tep); await p.ctx.close(); if (xong) break }
    bao(tep, xong, kt) }

  { const { ctx, tr } = await mo('ph-d-bang-day-du', 390, 844, { dsf: 1 }); const cdp = await ctx.newCDPSession(tr); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const { root } = await cdp.send('DOM.getDocument'); const ra = []
    for (const q of ['h1', '.phm-chu-giai b', '.phm-diem b', '.phm-nut']) { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: q }); const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); ra.push(`${q}: ${fonts.map((f) => f.familyName).join(' + ')}`) }
    console.log('\n── PHÔNG THẬT KHI CHỤP ── ' + ra.join(' · ')); await ctx.close() }
  console.log('\n── ẢNH ─────────────────────────────────────────────')
  const d = await chupDoan('ph-d-bang-day-du', 'ph-d-390-sang', 390)
  await chupDoan('ph-d-bang-day-du', 'ph-d-390-toi', 390, { toi: true, toiDa: 3 })
  await chupMan('ph-d-bang-day-du', 'ph-d-390-sang-dang-cuon.jpg', 390, 844, { cuonToi: '#muc-ca' })
  await chupMan('ph-d-bang-day-du', 'ph-d-1024-sang-hai-cot.jpg', 1024, 1366, { diDong: false, dsfs: [1.5, 1.25, 1] })
  await chupDoan('ph-e-bang-thua', 'ph-e-360-sang-du-lieu-thua', 360)
  await chupDoan('ph-e-bang-thua', 'ph-e-390-sang-chua-hoc', 390, { bam: 'canh=chua-hoc' })
  await chupMan('ph-e-bang-thua', 'ph-e-390-toi-chua-hoc-man-dau.jpg', 390, 844, { bam: 'canh=chua-hoc', toi: true })
  console.log(`bảng đầy đủ 390 px cao ${d.kt.cao} px → ${d.tongDoan} đoạn`)

  console.log('\n── KIỂM TRÀN (scrollWidth − innerWidth / phần tử lòi mép / chữ bị cắt / chữ đè ô) · trái: thường · phải: tên con dài “' + CON.tenDai + '” + cỡ chữ hệ thống 115 % ──')
  const RONG = [320, 360, 390, 412, 430, 768, 1024]
  const DS = [['D · đầy đủ', 'ph-d-bang-day-du', ''], ['E · dữ liệu thưa', 'ph-e-bang-thua', ''], ['E · con chưa học', 'ph-e-bang-thua', 'canh=chua-hoc']]
  console.log('màn'.padEnd(20) + RONG.map((w) => `${w} px`.padEnd(24)).join(''))
  let tranTong = 0
  for (const [nhan, ten, bam] of DS) { let dong = nhan.padEnd(20)
    for (const w of RONG) { const o = []
      for (const kho of ['', 'ten=dai&co=115']) { const { ctx, tr } = await mo(ten, w, 800, { dsf: 1, bam: [bam, kho].filter(Boolean).join('&'), diDong: w < 900 }); const kt = await tr.evaluate(KIEM); await ctx.close()
        o.push(`${kt.tran}/${kt.loi.length}/${kt.cat.length}/${kt.de.length}`)
        if (kt.tran > 0 || kt.loi.length || kt.cat.length || kt.de.length || kt.nho.length) { tranTong++; console.log(`   ✗ ${nhan} ${w}px ${kho || 'thường'}: tràn ${kt.tran} · lòi ${[...new Set(kt.loi)].slice(0, 5).join(', ')} · cắt ${[...new Set(kt.cat)].slice(0, 5).join(', ')} · đè ${kt.de.slice(0, 5).join(', ')} · đích nhỏ ${kt.nho.slice(0, 4).join(', ')}`) } }
      dong += o.join('  ·  ').padEnd(24) }
    console.log(dong) }
  await browser.close(); xau += tranTong
  console.log(xau ? `\n${xau} mục có vấn đề` : '\nsạch: mọi ảnh ≤ 150 KB · 0 tràn ở 320/360/390/412/430/768/1024 (kể cả tên dài + chữ 115 %) · 0 đích < 48 · 0 chữ tương phản thấp · 0 chữ < 12 px')
}
