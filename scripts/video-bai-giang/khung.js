// VIDEO BÀI GIẢNG — bước 2/3: KHUNG HÌNH. `nap(kichBan, net)` dựng DOM một lần; `ve(t)` đặt MỌI kiểu dáng theo đúng giây t (không hoạt cảnh CSS chạy tự do)
// ⇒ chụp từng khung bằng Chromium ra video không bao giờ lệch nhịp. Nét phấn: vẽ vectơ (Path2D lưu sẵn) theo giờ tiếng gốc qua bảng ánh xạ mảnh.
'use strict'
const kep = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const tien = (t, t0, d) => kep((t - t0) / d)
const eOut = (p) => 1 - Math.pow(1 - p, 3)
const eInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
/** Lò xo tắt dần (vượt đích ~15 % rồi về 1) theo số giây kể từ lúc bật. */
function lo(tau, f = 2.3, z = 0.5) {
  if (tau <= 0) return 0
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau))
}
const lerp = (a, b, p) => a + (b - a) * p
const MAU = { vang: '#ffd27a', hong: '#fda4af', ngoc: '#6ee7b7', xanh: '#8fb6ff', trang: '#f4efe4' }
const MAU_PHU = { vang: ['#ffd27a', '#fda4af', '#6ee7b7'], hong: ['#fda4af', '#ffd27a', '#8fb6ff'], ngoc: ['#6ee7b7', '#8fb6ff', '#ffd27a'] }
const $ = (s) => document.querySelector(s)
const tao = (tag, cls, cha, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (cha) cha.appendChild(e); return e }
const thoat = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
/** `**chữ**` ⇒ <em>chữ</em>. */
const dam = (s) => thoat(s).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>')
function hat(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const CHECK = '<svg width="40" height="40" viewBox="0 0 40 40"><path class="dau-tick" d="M9 21 l7 7 l15 -16" fill="none" stroke="#6ee7b7" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40" stroke-dashoffset="40"/></svg>'

let KB = null, NET = null, CANH = [], DOAN = []
const BANG = { w: 1140, h: 760 }
let ctx = null, hoaCtx = null

function nap(kb, net) {
  KB = kb; NET = net; DOAN = kb.doan
  NET.net.sort((a, b) => a.t - b.t)
  for (const n of NET.net) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (let i = 0; i < n.p.length; i += 3) { const x = n.p[i] / 4, y = n.p[i + 1] / 4; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    n.hop = [x0, y0, x1, y1]; n.ket = n.t + (n.p[n.p.length - 1] || 0); n.mauVe = (NET.mau[n.m] && NET.mau[n.m][0]) || '#f4efe4'
    const p = new Path2D(); for (let i = 0; i < n.p.length; i += 3) { const x = n.p[i] / 4, y = n.p[i + 1] / 4; if (i === 0) p.moveTo(x, y); else p.lineTo(x, y) } if (n.p.length === 3) p.lineTo(n.p[0] / 4 + 0.1, n.p[1] / 4)
    n.duong = p
  }
  $('#ten-bai').textContent = `${String(kb.ten || '').toUpperCase()} · ${String(kb.lop || '').replace(/^Live Khối /, 'K')}`
  dungNen(); dungCanh(); dungMoDau(); dungKet(); dungChuong()
  const c = $('#phan'); c.width = BANG.w; c.height = BANG.h; ctx = c.getContext('2d')
  const h = $('#hoa'); h.width = 1920; h.height = 1080; hoaCtx = h.getContext('2d')
  return document.fonts.ready.then(() => { doCo(); return { tong: KB.tong } })
}

// ── NỀN ──
function dungNen() {
  const nen = $('#nen')
  const ds = [['#6ee7b7', 980, .11], ['#ffd27a', 820, .09], ['#8fb6ff', 900, .10], ['#fda4af', 700, .07]]
  ds.forEach(([m, r, a], i) => { const q = tao('div', 'quang', nen); q.style.width = q.style.height = `${r}px`; q.style.background = `radial-gradient(circle, ${m}${Math.round(a * 255).toString(16).padStart(2, '0')} 0%, transparent 68%)`; q.dataset.i = i })
  const bui = tao('div', 'bui', nen); bui.style.cssText = 'position:absolute;inset:0'
  for (let i = 0; i < 46; i++) { const d = tao('i', '', bui); const r = 2 + hat(i) * 4; d.style.cssText = `position:absolute;width:${r}px;height:${r}px;border-radius:50%;background:rgba(244,239,228,${0.15 + hat(i + 9) * 0.35})` }
}
function veNen(t) {
  document.querySelectorAll('.quang').forEach((q) => { const i = +q.dataset.i, r = parseFloat(q.style.width); const x = [0.2, 0.75, 0.55, 0.1][i] * 2112 + 160 * Math.sin(t * (0.11 + i * 0.03) + i * 2.1) - r / 2, y = [0.25, 0.3, 0.8, 0.75][i] * 1188 + 110 * Math.cos(t * (0.09 + i * 0.025) + i) - r / 2; q.style.transform = `translate(${x}px,${y}px)` })
  const bui = document.querySelectorAll('.bui i')
  bui.forEach((d, i) => { const sp = 8 + hat(i + 3) * 18, x = (hat(i) * 2112 + t * sp * (hat(i + 5) - 0.5) * 2) % 2112, y = ((hat(i + 1) * 1188 - t * sp) % 1188 + 1188) % 1188; d.style.transform = `translate(${x}px,${y}px)` })
  const f = Math.floor(t * 30); $('#hat').style.transform = `translate(${-Math.floor(hat(f) * 64)}px,${-Math.floor(hat(f + 7) * 64)}px)`
}

// ── CẢNH: thẻ cột phải, phụ đề, phân tử, đố vui ──
const TU_KHOA = /^(gly|ala|val|lys|lysine|glu|hcl|naoh|h₂o|oh|nh₂|cooh|co|nh|peptide|alpha|α-amino|nitrogen|biuret|\d+[a-z]?|[0-9]+[a-z]?)$/i
function dungCanh() {
  const cot = $('#cot-trong'), pd = $('#phu-de')
  for (const d of DOAN) {
    if (d.loai !== 'canh') continue
    const mau = MAU[d.mau] || MAU.vang
    d.mauHex = mau
    // các từ đậm trong thẻ ⇒ tô màu trong phụ đề
    const khoa = new Set(); for (const s of d.su) (s.chu || '').replace(/\*\*(.+?)\*\*/g, (_, x) => { x.toLowerCase().split(/\s+/).forEach((w) => khoa.add(w.replace(/[.,:;!?()]/g, ''))); return '' })
    d.the = []
    for (const s of d.su) {
      let el
      if (s.loai === 'tieu-de') { el = tao('div', 'the tieu-de', cot, `${dam(s.chu)}<i class="gach"></i>`) }
      else if (s.loai === 'chip') { el = tao('div', 'the chip', cot); for (const [ten, phu] of s.ds) tao('div', 'chip-o', el, `<b>${thoat(ten)}</b><span>${dam(phu)}</span>`) }
      else if (s.loai === 'the' || s.loai === 'lon') { el = tao('div', 'the', cot, `${s.so ? `<span class="so">${thoat(s.so)}</span>` : ''}<span class="chu">${dam(s.chu)}</span><i class="bong"></i>`) }
      else if (s.loai === 'ghi') { el = tao('div', 'the ghi', cot, `${dam(s.chu)}<i class="bong"></i>`) }
      else if (s.loai === 'dau') { d.dau = s; continue }
      el.style.setProperty('--mau', mau); el.classList.add('an')
      d.the.push({ el, su: s, t: s.loai === 'lon' ? s.t + 2.4 : s.t })
    }
    d.lon = d.su.filter((s) => s.loai === 'lon')
    // phụ đề: mỗi câu một dòng, mỗi chữ một ô
    for (const q of d.cau) {
      const el = tao('div', 'dong an', pd); el.style.setProperty('--mau', mau)
      const tu = q.chu.split(/\s+/)
      q.tu = tu.map((w) => { const s = tao('span', 'tu', el, thoat(w) + ' '); const sach = w.toLowerCase().replace(/[.,:;!?()]/g, ''); if (TU_KHOA.test(sach) || khoa.has(sach)) s.classList.add('k'); return s })
      q.el = el
    }
    if (d.doVui) dungDoVui(d)
    if (d.phanTu) dungPhanTu(d)
    CANH.push(d)
  }
  // vạch chương trên thanh tiến độ
  const td = $('#tien-do'), a = CANH[0].t0, b = CANH[CANH.length - 1].t1
  for (const c of CANH.slice(1)) { const s = tao('s', '', td); s.style.left = `${((c.t0 - a) / (b - a)) * 100}%` }
}
/** Đo kích thước sau khi phông đã nạp: chồng thẻ cột phải, bề ngang phụ đề, mảnh phân tử. */
function doCo() {
  const hienTam = ['#canh', '#cot', '#pt'].map((id) => document.querySelector(id))
  hienTam.forEach((e) => e.classList.remove('an'))
  for (const d of CANH) {
    let y = 0
    for (const th of d.the) { th.el.classList.remove('an'); th.y = y; th.h = th.el.offsetHeight; y += th.h + 20; th.el.classList.add('an') }
    // cuộn chồng thẻ khi tràn: sau thẻ k, đáy chồng phải nằm trong cột
    let cuon = 0; for (const th of d.the) { cuon = Math.max(cuon, th.y + th.h - 740 + (d.doVui ? 0 : 0)); th.cuon = Math.max(0, cuon) }
    for (const q of d.cau) { q.el.classList.remove('an'); q.rong = Math.min(1700, Math.max(...[...q.el.querySelectorAll('.tu')].map((s) => s.offsetLeft + s.offsetWidth)) - Math.min(...[...q.el.querySelectorAll('.tu')].map((s) => s.offsetLeft)) + 90); q.cao = q.el.offsetHeight + 30; q.el.classList.add('an') }
    if (d.phanTu) doPhanTu(d)
  }
  hienTam.forEach((e) => e.classList.add('an'))
}

// ── PHÂN TỬ: hai Gly nối thành liên kết peptide, tách OH + H thành H₂O ──
function dungPhanTu(d) {
  const pt = $('#pt')
  pt.innerHTML = '<div class="khung-pt"></div><div class="tieu-pt">Ví dụ: <span style="color:var(--ngoc)">Gly</span> + <span style="color:var(--ngoc)">Gly</span></div>'
  const m = (cls, chu) => tao('div', `m ${cls}`, pt, chu)
  d.pt = {
    n1: tao('div', 'nhan-pt', pt, 'Gly · mắt xích 1 <span class="dk">α ' + CHECK.replace('width="40" height="40"', 'width="24" height="24"') + '</span>'),
    n2: tao('div', 'nhan-pt', pt, 'Gly · mắt xích 2 <span class="dk">α ' + CHECK.replace('width="40" height="40"', 'width="24" height="24"') + '</span>'),
    a1: m('a1', 'H₂N-CH₂-CO'), b1: m('b1', 'OH'), b2: m('b2', 'H'), a2: m('a2', 'NH-CH₂-COOH'), gach: m('gach', '-'),
    lk: tao('div', 'lienket', pt), nlk: tao('div', 'nhan-lk', pt, 'liên kết peptide'),
    nuoc: tao('div', 'nuoc', pt, 'H₂O'), nnuoc: tao('div', 'nhan-nuoc', pt, 'mất 1 H₂O'),
  }
  pt.classList.add('an')
}
function doPhanTu(d) {
  const pt = $('#pt')
  const P = d.pt, w = (e) => e.offsetWidth
  P.w = { a1: w(P.a1), b1: w(P.b1), b2: w(P.b2), a2: w(P.a2), gach: w(P.gach) }
  // bề ngang "CO" cuối a1 và "NH" đầu a2 để khoanh đúng liên kết
  const thu = tao('div', 'm', pt, 'CO'); P.w.co = thu.offsetWidth; thu.innerHTML = 'NH'; P.w.nh = thu.offsetWidth; thu.remove()
  pt.classList.add('an')
}
function vePhanTu(d, t) {
  const P = d.pt, c = d.phanTu, W = P.w
  const X0 = 40, R1 = 170, R2 = 360, RS = 560
  const daHien = (k) => t >= c[k]
  const hien = (e, on) => { e.style.display = on ? '' : 'none' }
  const vao = (k, tre = 0) => lo(t - c[k] - tre)
  // nhãn + dấu α
  for (const [e, y, tre] of [[P.n1, R1 - 52, 0], [P.n2, R2 - 52, 0.25]]) {
    hien(e, daHien('hien') && t < c.noi + 0.6)
    const p = vao('hien', tre), ra = 1 - tien(t, c.noi, 0.5)
    e.style.opacity = kep(p) * ra; e.style.transform = `translate(${X0 - 4}px,${y + (1 - p) * 20}px)`
    const dk = e.querySelector('.dk'); dk.style.opacity = tien(t, c.dk1, 0.25); dk.style.transform = `scale(${0.6 + 0.4 * lo(t - c.dk1)})`
    e.querySelector('.dau-tick').style.strokeDashoffset = 40 * (1 - eOut(tien(t, c.dk1 + 0.15, 0.4)))
  }
  // các mảnh công thức: vị trí theo pha
  const noi = eInOut(tien(t, c.noi, 0.9)), tachOH = eOut(tien(t, c.matOH, 0.45)), tachH = eOut(tien(t, c.matH, 0.45)), bay = eInOut(tien(t, c.nuoc, 0.75))
  const xNoiA1 = 18, xNoiG = xNoiA1 + W.a1, xNoiA2 = xNoiG + W.gach
  const BX = 420, BY = 210 // tâm bong bóng nước
  const dat = (e, x, y, s = 1, o = 1) => { e.style.transform = `translate(${x}px,${y}px) scale(${s})`; e.style.opacity = o }
  const p1 = vao('hien'), p2 = vao('hien', 0.25)
  hien(P.a1, daHien('hien')); dat(P.a1, lerp(X0, xNoiA1, noi), lerp(R1, RS, noi) + (1 - p1) * 30, 1, kep(p1 * 1.5))
  hien(P.a2, daHien('hien')); dat(P.a2, lerp(X0 + W.b2 + 2, xNoiA2, noi), lerp(R2, RS, noi) + (1 - p2) * 30, 1, kep(p2 * 1.5))
  // OH, H: đỏ lên, tách ra, rồi bay vào bong bóng
  const xOH = X0 + W.a1 + tachOH * 26, yOH = R1 - tachOH * 34, xH = X0 - tachH * 26, yH = R2 - tachH * 34
  const nhay = (k) => 1 + 0.25 * Math.sin(Math.PI * tien(t, c[k], 0.35))
  hien(P.b1, daHien('hien') && t < c.nuoc + 0.9); P.b1.classList.toggle('do', t >= c.matOH)
  dat(P.b1, lerp(xOH, BX - W.b1 / 2, bay), lerp(yOH, BY - 30, bay), nhay('matOH') * (1 - 0.5 * bay), kep(p1 * 1.5) * (1 - tien(t, c.nuoc + 0.6, 0.3)))
  hien(P.b2, daHien('hien') && t < c.nuoc + 0.9); P.b2.classList.toggle('do', t >= c.matH)
  dat(P.b2, lerp(xH, BX - W.b2 / 2, bay), lerp(yH, BY - 30, bay), nhay('matH') * (1 - 0.5 * bay), kep(p2 * 1.5) * (1 - tien(t, c.nuoc + 0.6, 0.3)))
  // gạch nối + khoanh liên kết peptide
  hien(P.gach, t >= c.noi + 0.5); dat(P.gach, xNoiG, RS, 1, tien(t, c.noi + 0.5, 0.3))
  const lkP = lo(t - c.noi - 0.95)
  hien(P.lk, t >= c.noi + 0.95); P.lk.style.left = `${xNoiG - W.co - 10}px`; P.lk.style.top = `${RS - 6}px`; P.lk.style.width = `${W.co + W.gach + W.nh + 20}px`; P.lk.style.height = '58px'; P.lk.style.transform = `scale(${0.7 + 0.3 * lkP})`; P.lk.style.opacity = kep(lkP * 1.3)
  hien(P.nlk, t >= c.noi + 1.1); P.nlk.style.left = `${xNoiG - W.co - 6}px`; P.nlk.style.top = `${RS + 82}px`; P.nlk.style.opacity = tien(t, c.noi + 1.1, 0.3); P.nlk.style.transform = `translateY(${(1 - eOut(tien(t, c.noi + 1.1, 0.4))) * 16}px)`
  // bong bóng nước
  const bp = lo(t - c.nuoc - 0.7, 2.0, 0.42), noiLen = Math.max(0, t - c.nuoc - 1.4)
  hien(P.nuoc, t >= c.nuoc + 0.7); P.nuoc.style.left = `${BX - 75}px`; P.nuoc.style.top = `${BY - 75 - Math.min(40, noiLen * 14) + Math.sin(noiLen * 2.2) * 6}px`; P.nuoc.style.transform = `scale(${0.2 + 0.8 * bp})`; P.nuoc.style.opacity = kep(bp * 1.4)
  hien(P.nnuoc, t >= c.nuoc + 1.0); P.nnuoc.style.left = `${BX + 92}px`; P.nnuoc.style.top = `${BY - 22 - Math.min(40, noiLen * 14)}px`; P.nnuoc.style.opacity = tien(t, c.nuoc + 1.0, 0.3)
}

// ── ĐỐ VUI ──
function dungDoVui(d) {
  const v = d.doVui
  $('#dv-hoi').innerHTML = dam(v.hoi)
  const lc = $('#dv-lc'); lc.innerHTML = ''
  v.o = v.luaChon.map(([chu, gt, dung]) => { const e = tao('div', 'lc', lc, `<b>${thoat(chu)}</b><span>${thoat(gt)}</span>`); e.dataset.dung = dung ? '1' : ''; return e })
  // thẻ thu nhỏ trong cột sau khi đếm xong
  const mini = tao('div', 'the an', $('#cot-trong'), `<span class="chu" style="font-size:27px">Gly - Lys - Gly : a + HCl ⇒ cần <em>? mol HCl</em></span><div class="mini-lc" style="display:flex;gap:12px;margin-top:14px"></div><i class="bong"></i>`)
  mini.style.setProperty('--mau', MAU.vang)
  v.mini = mini; v.miniO = v.luaChon.map(([chu, gt, dung]) => { const e = tao('div', '', mini.querySelector('.mini-lc'), `<b style="opacity:.6;font-size:20px">${chu}</b> ${gt}`); e.style.cssText = 'flex:1;text-align:center;padding:10px 0;border-radius:16px;background:rgba(255,255,255,.07);font-size:30px;font-weight:800'; e.dataset.dung = dung ? '1' : ''; return e })
  d.the.unshift({ el: mini, su: { loai: 'the' }, t: v.t1 })
  // hạt pháo giấy (cố định theo hạt giống)
  v.phao = Array.from({ length: 110 }, (_, i) => ({ g: -Math.PI / 2 + (hat(i) - 0.5) * 2.2, v: 650 + hat(i + 1) * 900, q: hat(i + 2) * 8, m: ['#ffd27a', '#6ee7b7', '#fda4af', '#8fb6ff', '#f4efe4'][i % 5], w: 10 + hat(i + 3) * 10, h: 6 + hat(i + 4) * 8 }))
}
function veDoVui(d, t) {
  const v = d.doVui, dv = $('#dv')
  const on = t >= v.t0 && t < v.t1 + 0.55
  dv.classList.toggle('an', !on)
  if (on) {
    const vao = lo(t - v.t0, 1.8, 0.55), ra = eInOut(tien(t, v.t1, 0.5))
    $('#dv-nen').style.opacity = kep((t - v.t0) / 0.3) * (1 - ra)
    const hop = $('#dv-hop')
    hop.style.transform = `translateX(-50%) translate(${ra * 640}px,${(1 - vao) * -60 - ra * 40}px) scale(${1 - ra * 0.6})`; hop.style.opacity = kep(vao * 1.5) * (1 - ra)
    v.o.forEach((e, i) => { const p = lo(t - v.t0 - 0.45 - i * 0.12); e.style.transform = `scale(${0.6 + 0.4 * p})`; e.style.opacity = kep(p * 1.4) })
    const batDem = v.t1 - 5.4, conLai = 5 - Math.floor(kep((t - batDem) / 5, 0, 0.9999) * 5), pha = (t - batDem) % 1
    const dem = $('#dv-dem'); dem.style.opacity = tien(t, batDem - 0.3, 0.3) * (1 - ra)
    dem.querySelector('b').textContent = String(conLai)
    dem.querySelector('b').style.transform = `scale(${1 + 0.35 * Math.exp(-pha * 6)})`
    dem.querySelector('.vong').style.strokeDashoffset = String(440 * kep((t - batDem) / 5))
    $('#dv-goi').style.opacity = tien(t, v.t0 + 0.9, 0.4) * (1 - ra)
  }
  // lật đáp án trong thẻ thu nhỏ + pháo giấy
  const mo = t >= v.tMo
  v.miniO.forEach((e) => { const dung = e.dataset.dung === '1'; e.style.background = mo && dung ? 'linear-gradient(170deg,#1f6f55,#145240)' : 'rgba(255,255,255,.07)'; e.style.boxShadow = mo && dung ? `0 0 0 ${3 + 3 * Math.exp(-(t - v.tMo) * 3)}px #6ee7b7, 0 0 40px rgba(110,231,183,.5)` : 'none'; e.style.opacity = mo && !dung ? 0.4 : 1; e.style.transform = mo && dung ? `scale(${1 + 0.18 * Math.exp(-(t - v.tMo) * 4) * Math.cos((t - v.tMo) * 14)})` : '' })
  const tau = t - v.tMo
  if (tau >= 0 && tau < 2.6) {
    const r = v.mini.getBoundingClientRect(), dungO = v.miniO.find((e) => e.dataset.dung === '1').getBoundingClientRect()
    const ox = dungO.left + dungO.width / 2, oy = dungO.top + dungO.height / 2; void r
    for (const p of v.phao) {
      const x = ox + Math.cos(p.g) * p.v * tau * 0.55, y = oy + Math.sin(p.g) * p.v * tau * 0.55 + 900 * tau * tau * 0.5
      hoaCtx.save(); hoaCtx.globalAlpha = kep(1 - (tau - 1.6) / 1); hoaCtx.translate(x, y); hoaCtx.rotate(p.q + tau * 9); hoaCtx.fillStyle = p.m; hoaCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); hoaCtx.restore()
    }
  }
}

// ── THẺ CHƯƠNG ──
function dungChuong() { const c = $('#chuong'); for (let i = 0; i < 3; i++) tao('div', 'phien', c) ; c.appendChild($('#chuong-noi')) }
function veChuong(d, t) {
  const c = $('#chuong'); c.classList.remove('an')
  const mau = MAU_PHU[d.mau] || MAU_PHU.vang
  const phien = c.querySelectorAll('.phien')
  phien.forEach((e, k) => {
    const vao = eInOut(tien(t, d.t0 + (2 - k) * 0.06, 0.44)), ra = eInOut(tien(t, d.t1 - 0.5 + (2 - k) * 0.05, 0.44))
    const x = -175 + vao * 175 + ra * 175
    e.style.background = mau[k]; e.style.transform = `translateX(${x}%) skewX(-14deg)`; e.style.zIndex = String(3 - k)
    e.style.opacity = k === 0 ? 1 : 0.95
  })
  // nội dung theo phiến chính
  const vao0 = eInOut(tien(t, d.t0 + 0.12, 0.44)), ra0 = eInOut(tien(t, d.t1 - 0.4, 0.44))
  const noi = $('#chuong-noi'); noi.style.transform = `translateX(${(-1 + vao0) * 110 + ra0 * 175}%)`; noi.style.zIndex = '5'
  const so = $('#chuong-so'), ke = $('#chuong-ke'), ten = $('#chuong-ten')
  if (ten.dataset.id !== d.so + d.tieuDe) {
    ten.dataset.id = d.so + d.tieuDe; so.textContent = d.so === '?' ? '?' : d.so; ke.textContent = d.so === '?' ? 'THỬ SỨC' : `PHẦN ${d.so}`
    ten.innerHTML = d.tieuDe.split(/\s+/).map((w) => `<span class="tu">${thoat(w)} </span>`).join('')
  }
  const ps = lo(t - d.t0 - 0.35, 1.6, 0.6); so.style.transform = `translateX(${(1 - ps) * -120}px)`; so.style.opacity = kep(ps * 1.3)
  ke.style.opacity = tien(t, d.t0 + 0.45, 0.3); ke.style.letterSpacing = `${0.6 - 0.32 * eOut(tien(t, d.t0 + 0.45, 0.7))}em`
  ten.querySelectorAll('.tu').forEach((w, j) => { const p = lo(t - d.t0 - 0.5 - j * 0.055, 2.2, 0.55); w.style.transform = `translateY(${(1 - p) * 60}px)`; w.style.opacity = kep(p * 1.5); w.style.filter = `blur(${Math.max(0, (1 - p * 1.4) * 10)}px)` })
}

// ── MỞ ĐẦU · KẾT ──
function dungMoDau() {
  const d = DOAN.find((x) => x.loai === 'mo-dau'); if (!d) return
  $('#mo-ke').textContent = d.kicker; $('#mo-phu').textContent = d.phu; $('#mo-thay').innerHTML = `<i>ĐĐH</i>${thoat(d.thay)}`
  $('#mo-ten').innerHTML = [...d.tieuDe].map((ch) => `<span class="ch">${thoat(ch)}</span>`).join('')
}
function veMoDau(d, t) {
  const mo = $('#mo'); mo.classList.remove('an')
  const ra = eInOut(tien(t, d.t1 - 0.6, 0.6))
  mo.style.transform = `scale(${1 + ra * 0.9})`; mo.style.opacity = 1 - ra; mo.style.filter = ra > 0 ? `blur(${ra * 14}px)` : ''
  const ke = $('#mo-ke'); ke.style.opacity = tien(t, 0.3, 0.5); ke.style.letterSpacing = `${0.7 - 0.4 * eOut(tien(t, 0.3, 1.2))}em`
  $('#mo-ten').querySelectorAll('.ch').forEach((c, j) => { const p = lo(t - 0.9 - j * 0.075, 2.0, 0.45); c.style.transform = `translateY(${(1 - p) * 90}px) scale(${0.3 + 0.7 * p}) rotate(${(1 - p) * -14}deg)`; c.style.opacity = kep(p * 1.6) })
  const g = $('#mo-gach'), gw = 760 * eOut(tien(t, 1.9, 0.7)); g.style.width = `${gw}px`; g.style.marginLeft = `${-gw / 2}px`
  const ph = $('#mo-phu'); ph.style.opacity = tien(t, 2.3, 0.5); ph.style.transform = `translateY(${(1 - eOut(tien(t, 2.3, 0.6))) * 24}px)`
  const th = $('#mo-thay'), pt = lo(t - 2.9, 1.8, 0.55); th.style.transform = `translate(-50%, ${(1 - pt) * 60}px)`; th.style.opacity = kep(pt * 1.5)
}
function dungKet() {
  const d = DOAN.find((x) => x.loai === 'ket'); if (!d) return
  $('#ket-ten').innerHTML = `${thoat(d.tieuDe)}<i class="gach"></i>`
  d.y.forEach((y, i) => { const e = tao('div', 'ket-y', $('#ket'), `<span class="tick">${CHECK}</span><span>${dam(y)}</span>`); e.style.top = `${330 + i * 180}px` })
  $('#ket-cuoi').textContent = d.cuoi
}
function veKet(d, t) {
  const k = $('#ket'); k.classList.remove('an')
  const vao = eOut(tien(t, d.t0, 0.5)); k.style.opacity = vao; k.style.transform = `scale(${1.08 - 0.08 * vao})`
  const ten = $('#ket-ten'), pt = lo(t - d.t0 - 0.2); ten.style.transform = `translateX(${(1 - pt) * -80}px)`; ten.style.opacity = kep(pt * 1.4)
  ten.querySelector('.gach').style.width = `${eOut(tien(t, d.t0 + 0.6, 0.6)) * 320}px`
  k.querySelectorAll('.ket-y').forEach((e, i) => { const t0 = d.t0 + 1.3 + i * 0.9, p = lo(t - t0); e.style.transform = `translateX(${(1 - p) * 90}px)`; e.style.opacity = kep(p * 1.5); e.querySelector('.tick').style.transform = `scale(${0.4 + 0.6 * lo(t - t0, 2.6, 0.4)})`; e.querySelector('.dau-tick').style.strokeDashoffset = 40 * (1 - eOut(tien(t, t0 + 0.2, 0.4))) })
  const c = $('#ket-cuoi'); c.style.opacity = tien(t, d.t0 + 4.6, 0.6)
  $('#den').style.opacity = tien(t, d.t1 - 0.9, 0.9)
}

// ── BẢNG PHẤN ──
function nguon(d, t) {
  for (const m of d.manh) if (t >= m.t0 && t < m.t1) return m.s0 + ((t - m.t0) / (m.t1 - m.t0)) * (m.s1 - m.s0)
  const cuoi = d.manh[d.manh.length - 1]; return t < d.t0 ? d.manh[0].s0 : cuoi.s1
}
function camera(d, t) {
  const ks = d.khung; let i = 0; while (i + 1 < ks.length && ks[i + 1].t <= t) i++
  const truoc = ks[Math.max(0, i - 1)].k, nay = ks[i].k, q = i === 0 ? 1 : eInOut(tien(t, ks[i].t, 1.1))
  const c = [0, 1, 2, 3].map((j) => lerp(truoc[j], nay[j], q))
  // đẩy máy chậm vào giữa hai khung (Ken Burns)
  const den = ks[i + 1] ? ks[i + 1].t : d.t1, z = 1 - 0.045 * eInOut(tien(t, ks[i].t, Math.max(1, den - ks[i].t)))
  const cx = c[0] + c[2] / 2, cy = c[1] + c[3] / 2
  return [cx - (c[2] * z) / 2, cy - (c[3] * z) / 2, c[2] * z, c[3] * z]
}
function veBang(d, t) {
  const s = nguon(d, t) * 1000, s0 = d.cau[0].s0 * 1000 - 2000
  const [cx, cy, cw] = camera(d, t), k = BANG.w / cw
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, BANG.w, BANG.h)
  ctx.setTransform(k, 0, 0, k, -cx * k, -cy * k)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const x1 = cx + cw, y1 = cy + BANG.h / k
  let dau = null
  for (const n of NET.net) {
    if (n.t > s) break
    const h = n.hop; if (h[2] < cx - 20 || h[0] > x1 + 20 || h[3] < cy - 20 || h[1] > y1 + 20) continue
    const xong = n.ket <= s, tuoi = (s - n.ket) / 1000
    ctx.globalAlpha = n.ket < s0 ? 0.38 : 1
    ctx.strokeStyle = n.mauVe; ctx.lineWidth = Math.max(1.6 / k, n.c * 1.05)
    if (!xong || tuoi < 1.4) { ctx.shadowColor = n.mauVe; ctx.shadowBlur = 16 * (xong ? 1 - tuoi / 1.4 : 1) } else ctx.shadowBlur = 0
    if (xong) ctx.stroke(n.duong)
    else {
      const da = s - n.t; ctx.beginPath(); let lx = 0, ly = 0
      for (let i = 0; i < n.p.length; i += 3) { if (n.p[i + 2] > da) break; lx = n.p[i] / 4; ly = n.p[i + 1] / 4; if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly) }
      ctx.stroke(); dau = [lx, ly, n.mauVe]
    }
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1
  if (dau) { ctx.fillStyle = '#fff'; ctx.shadowColor = dau[2]; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(dau[0], dau[1], 7 / k, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0 }
}

// ── VẼ CẢNH ──
let canhDangDung = null
function veCanh(d, t) {
  $('#canh').classList.remove('an')
  if (canhDangDung !== d) {
    canhDangDung = d
    $('#nhan-chuong').innerHTML = `<b style="--mau:${d.mauHex}">${thoat(d.so)}</b>${dam(d.tieuDe)}`
    document.querySelectorAll('#cot-trong > .the, .dong').forEach((e) => e.classList.add('an'))
    $('#pt').classList.toggle('an', !d.phanTu); $('#cot').classList.toggle('an', !!d.phanTu)
  }
  const a = CANH[0].t0, b = CANH[CANH.length - 1].t1
  $('#tien-do i').style.width = `${kep((t - a) / (b - a)) * 100}%`
  // vào cảnh: phóng 1,1 ⇒ 1 khi phiến thẻ chương rút; điểm nhấn: phóng nhẹ cả sân
  const vao = eOut(tien(t, d.t0 - 0.45, 0.95))
  let nhan = 0; for (const w of d.nhanManh) nhan = Math.max(nhan, Math.min(eOut(tien(t, w.t0, 0.35)), 1 - eInOut(tien(t, w.t1 - 0.3, 0.7))))
  let rung = 0; if (d.dau) { const tau = t - d.dau.t; if (tau > 0.18 && tau < 0.5) rung = Math.sin(tau * 90) * 7 * (1 - (tau - 0.18) / 0.32) }
  $('#canh').style.transform = `translate(${rung}px,${rung * 0.6}px) scale(${(1.1 - 0.1 * vao) * (1 + 0.032 * nhan)})`
  veBang(d, t)
  // thẻ cột phải
  let cuon = 0, cuonTruoc = 0, tCuon = -1
  for (const th of d.the) {
    const on = t >= th.t; th.el.classList.toggle('an', !on); if (!on) continue
    if (th.cuon !== cuon) { cuonTruoc = cuon; cuon = th.cuon; tCuon = th.t }
    const tau = t - th.t, p = lo(tau, 2.1, 0.55)
    th.el.style.top = `${th.y}px`; th.el.style.opacity = kep(tau / 0.22)
    th.el.style.transform = `translateX(${(1 - p) * 80}px) scale(${0.9 + 0.1 * p})`
    th.el.style.filter = tau < 0.3 ? `blur(${(1 - tau / 0.3) * 8}px)` : ''
    const bong = th.el.querySelector('.bong'); if (bong) bong.style.left = `${-200 + (tau - 0.25) * 1500}px`
    const gach = th.el.querySelector('.gach'); if (gach) gach.style.width = `${eOut(tien(tau, 0.3, 0.6)) * Math.min(560, th.el.querySelector('em') ? 360 : 300)}px`
  }
  const cuonNay = tCuon < 0 ? cuon : lerp(cuonTruoc, cuon, eInOut(tien(t, tCuon, 0.6)))
  $('#cot-trong').style.transform = `translateY(${-cuonNay}px)`
  // dấu "PHẢI THUỘC"
  const dauEl = $('#dau')
  if (d.dau && t >= d.dau.t) { dauEl.classList.remove('an'); dauEl.textContent = d.dau.chu; const p = eOut(tien(t, d.dau.t, 0.2)); dauEl.style.transform = `rotate(-9deg) scale(${2.6 - 1.6 * p})`; dauEl.style.opacity = kep(p * 1.6) } else dauEl.classList.add('an')
  // điểm nhấn lớn giữa màn
  const lonEl = $('#lon'); let coLon = false
  for (const l of d.lon) {
    const tau = t - l.t; if (tau < 0 || tau > 2.7) continue
    coLon = true; lonEl.classList.remove('an')
    if (lonEl.dataset.chu !== l.chu) { lonEl.dataset.chu = l.chu; $('#lon-chu').innerHTML = dam(l.chu); $('#lon-chu').style.setProperty('--mau', d.mauHex) }
    const vao2 = lo(tau, 1.9, 0.5), ra = eInOut(tien(tau, 2.25, 0.45))
    $('#lon-nen').style.opacity = kep(tau / 0.25) * (1 - ra)
    $('#lon-chu').style.transform = `translate(${ra * 560}px,${ra * -120}px) scale(${(0.55 + 0.45 * vao2) * (1 - 0.6 * ra)})`; $('#lon-chu').style.opacity = kep(vao2 * 1.5) * (1 - ra)
  }
  if (!coLon) lonEl.classList.add('an')
  // phụ đề
  let qDang = null; for (const q of d.cau) if (t >= q.t0 - 0.05 && t < q.t1 + 0.12) qDang = q
  const nen = $('#phu-de-nen')
  for (const q of d.cau) {
    const on = q === qDang && !(d.doVui && t >= d.doVui.t0 && t < d.doVui.t1); q.el.classList.toggle('an', !on); if (!on) continue
    const ra = tien(t, q.t1 - 0.06, 0.18)
    q.tu.forEach((w, j) => { const tj = q.t0 + j * 0.04, p = lo(t - tj, 2.6, 0.55); w.style.transform = `translateY(${(1 - p) * 20 - ra * 10}px) scale(${0.88 + 0.12 * p})`; w.style.opacity = kep((t - tj) / 0.14) * (1 - ra) })
    nen.style.width = `${q.rong}px`; nen.style.height = `${q.cao}px`; nen.style.opacity = 1 - ra
  }
  if (!qDang || (d.doVui && t >= d.doVui.t0 && t < d.doVui.t1)) nen.style.opacity = 0
  if (d.phanTu) vePhanTu(d, t)
  if (d.doVui) veDoVui(d, t); else $('#dv').classList.add('an')
}

function ve(t) {
  veNen(t)
  hoaCtx.clearRect(0, 0, 1920, 1080)
  for (const id of ['#mo', '#chuong', '#canh', '#ket', '#lon', '#dv']) $(id).classList.add('an')
  $('#den').style.opacity = 0
  const i = DOAN.findIndex((x) => t >= x.t0 && t < x.t1), d = DOAN[i === -1 ? DOAN.length - 1 : i]
  if (d.loai === 'mo-dau') veMoDau(d, t)
  else if (d.loai === 'ket') veKet(d, t)
  else if (d.loai === 'canh') veCanh(d, t)
  else if (d.loai === 'the-chuong') {
    const truoc = DOAN[i - 1], sau = DOAN[i + 1]
    if (t - d.t0 < 0.5 && truoc && truoc.loai === 'canh') veCanh(truoc, Math.min(t, truoc.t1 - 1e-3))
    if (t - d.t0 < 0.5 && truoc && truoc.loai === 'mo-dau') veMoDau(truoc, truoc.t1 - 1e-3)
    if (d.t1 - t < 0.6 && sau && sau.loai === 'canh') veCanh(sau, t)
    veChuong(d, t)
  }
  return true
}
window.nap = nap; window.ve = ve
