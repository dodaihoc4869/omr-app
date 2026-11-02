// Bộ vẽ dùng chung của bản vẽ «Ô nguyên tố»: biểu tượng (nét lucide như app đang dùng), Mol (ảnh vector chụp từ mol-dong.ts thật),
// nguyên tử mục tiêu, khung app (thanh trên / thanh dưới / ray trái), mạch liên kết của Lộ trình, vòng đoạn quanh nút đang học.
const I = {
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  luoi: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  atom: '<circle cx="12" cy="12" r="1.2"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect width="16" height="11" x="4" y="11" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  clip: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  dan: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cai: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  loa: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  rung: '<path d="m2 8 2 2-2 2 2 2-2 2M22 8l-2 2 2 2-2 2 2 2"/><rect x="8" y="5" width="8" height="14" rx="1.5"/>',
  tai: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  phai: '<path d="m9 18 6-6-6-6"/>',
  trai: '<path d="m15 18-6-6 6-6"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  anh: '<rect width="18" height="18" x="3" y="3" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  gui: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  den: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  sach: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  xoa: '<path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/>',
  ra: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  dong_ho: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  tay: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
  giot: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  binh: '<path d="M9 3h6M10 3v6.5L4.5 19A2 2 0 0 0 6.2 22h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7 15h10"/>',
  co: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.33 2q2 0 3.67-.67a1 1 0 0 1 1 .87v8.75a1 1 0 0 1-.4.8A6 6 0 0 1 16 14c-3 0-5-2-8-2a6 6 0 0 0-4 1.5"/>',
  cong: '<path d="M5 12h14M12 5v14"/>',
  mat: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
}
const ic = (k, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[k] || ''}</svg>`
const mol = (m) => `<picture><source srcset="mol/mol-${m}-toi.svg" media="(prefers-color-scheme: dark)"><img src="mol/mol-${m}-sang.svg" alt=""></picture>`

/** NGUYÊN TỬ MỤC TIÊU: mỗi câu của mức hôm nay = một electron trên 3 quỹ đạo; vượt mức = electron vàng ở vòng ngoài. */
function nguyenTu(da, muc, o = {}) {
  const R = 88, r = 46, goc = [0, 60, 120], vuot = Math.max(0, da - muc), n = Math.ceil(muc / 3)
  let s = `<svg class="nguyen-tu" viewBox="-104 -104 208 208" ${da >= muc ? 'data-du' : ''} role="img" aria-label="${o.nhan || `Mục tiêu hôm nay: ${da}/${muc} câu`}">`
  for (const g of goc) s += `<ellipse class="qd" rx="${R}" ry="${r}" transform="rotate(${g})"/>`
  for (let i = 0; i < muc; i++) {
    const q = i % 3, k = Math.floor(i / 3), t = (2 * Math.PI * (k + 0.5 + q * 0.33)) / n, g = (goc[q] * Math.PI) / 180
    const x = R * Math.cos(t), y = r * Math.sin(t)
    s += `<circle class="e" ${i < da ? 'data-d' : ''} cx="${(x * Math.cos(g) - y * Math.sin(g)).toFixed(1)}" cy="${(x * Math.sin(g) + y * Math.cos(g)).toFixed(1)}" r="${muc > 30 ? 5.2 : 6}"/>`
  }
  for (let i = 0; i < vuot; i++) { const t = -Math.PI / 2 + ((i - (vuot - 1) / 2) * Math.PI) / 9; s += `<circle class="e" data-v cx="${(99 * Math.cos(t)).toFixed(1)}" cy="${(99 * Math.sin(t)).toFixed(1)}" r="5.5"/>` }
  s += `<circle class="nhan" r="33"/>`
  s += vuot ? `<text class="so" y="-6" font-size="26">${da}</text><text class="dv" y="16" font-size="12">mức ${muc}</text>`
    : `<text class="so" y="-5" font-size="${da >= 10 && muc >= 10 ? 21 : 26}">${da}/${muc}</text><text class="dv" y="16" font-size="12">câu</text>`
  return s + '</svg>'
}
const mtNho = (da, muc) => { const c = 2 * Math.PI * 18, p = Math.min(1, da / muc)
  return `<span class="mt-nho" role="img" aria-label="Mục tiêu hôm nay: ${da}/${muc} câu"><svg viewBox="-22 -22 44 44"><circle class="nen" r="18"/><circle class="chay" r="18" transform="rotate(-90)" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}"/><circle class="nhan" r="12.5"/><text>${da}</text></svg></span>` }

const MUC = [['lo-trinh', 'Lộ trình', 'route', 'hs'], ['luyen-tap', 'Luyện tập', 'wrench', 'chu-y'], ['thanh-tich', 'Thành tích', 'trophy', 'sao'],
  ['ca', 'Ca kiểm tra', 'clip', 'tin'], ['ai', 'Hỏi A.I Đỗ Đại Học', 'chat', 'tim'], ['cai-dat', 'Cài đặt', 'cai', 'hs']]
function khung() {
  for (const el of document.querySelectorAll('[data-ve="tren"]')) {
    const d = el.dataset
    el.innerHTML = `<span class="dem" data-k="lua" aria-label="Chuỗi ${d.lua} ngày">${ic('flame')}${d.lua}</span><span class="dem" data-k="nt" aria-label="Nguyên tử hôm nay">${ic('atom')}${d.nt}</span><span class="dem" data-k="tt" aria-label="Tinh thể">${ic('gem')}${d.tt}</span><span class="day"></span>`
      + (d.muc ? mtNho(+d.da, +d.muc) : '') + `<button class="chuong" aria-label="Thông báo${d.tb ? `, ${d.tb} chưa đọc` : ''}">${ic('bell')}${d.tb ? `<span class="cham-do">${d.tb}</span>` : ''}</button>`
  }
  for (const el of document.querySelectorAll('[data-ve="duoi"]')) {
    const m = el.dataset.muc, ds = [...MUC.slice(0, 3), ['them', 'Thêm', 'luoi']]
    el.setAttribute('aria-label', 'Điều hướng học sinh')
    el.innerHTML = ds.map(([id, ten, i]) => `<a href="#" ${id === m ? 'aria-current="page"' : ''}>${ic(i)}${ten}${id === 'them' && el.dataset.cham ? `<span class="cham-do">${el.dataset.cham}</span>` : ''}</a>`).join('')
  }
  for (const el of document.querySelectorAll('[data-ve="ray"]')) {
    const m = el.dataset.muc
    el.setAttribute('aria-label', 'Điều hướng học sinh')
    el.innerHTML = `<div class="logo"><img src="../../public/logo-hs-v3.svg" alt=""><span>Đỗ Đại Học</span></div>`
      + MUC.map(([id, ten, i, sac]) => `<a href="#" ${id === m ? 'aria-current="page"' : ''}><span class="o" data-sac="${sac}" ${id === m ? '' : 'data-nhat'}>${ic(i)}</span>${ten === 'Hỏi A.I Đỗ Đại Học' ? '<span>Hỏi A.I</span>' : `<span>${ten}</span>`}</a>`).join('')
  }
  for (const el of document.querySelectorAll('[data-i]')) el.outerHTML = ic(el.dataset.i, el.className)
  for (const el of document.querySelectorAll('[data-mol]')) el.innerHTML = mol(el.dataset.mol)
  for (const el of document.querySelectorAll('[data-nguyen-tu]')) el.innerHTML = nguyenTu(+el.dataset.da, +el.dataset.muc)
  for (const el of document.querySelectorAll('.nut-m[data-loai="kiem"]')) el.insertAdjacentHTML('afterbegin', '<svg class="luc" viewBox="-50 -50 100 100" aria-hidden="true"><path class="mat" d="M0 -48 L41.6 -24 L41.6 24 L0 48 L-41.6 24 L-41.6 -24 Z" stroke-linejoin="round"/><circle class="vong-b" r="27"/></svg>')
  for (const el of document.querySelectorAll('.nut-m[data-vd]')) { // vòng đoạn: n đoạn quanh ô, phần đã làm tô liền một dải
    const [k, n] = el.dataset.vd.split('/').map(Number), w = el.offsetWidth + 30, g = 4, seg = 100 / n - g
    el.insertAdjacentHTML('afterbegin', `<svg class="vd" viewBox="0 0 ${w} ${w}" aria-hidden="true"><rect class="nen" x="2.5" y="2.5" width="${w - 5}" height="${w - 5}" rx="36" pathLength="100" stroke-dasharray="${seg} ${g}" stroke-dashoffset="${-g / 2}"/>${k ? `<rect class="chay" x="2.5" y="2.5" width="${w - 5}" height="${w - 5}" rx="36" pathLength="100" stroke-dasharray="${k * (seg + g) - g} 200" stroke-dashoffset="${-g / 2}"/>` : ''}</svg>`)
  }
}
/** (2) MẠCH LIÊN KẾT: nối tâm các nút liên tiếp — liên kết đôi (đã xong), đơn (tới nút đang học), chấm (còn khoá). */
function mach() {
  for (const m of document.querySelectorAll('.mach')) {
    const r0 = m.getBoundingClientRect(), nut = [...m.querySelectorAll(':scope > .nut-m, :scope > .ruong')]
    let s = `<svg class="lk" aria-hidden="true">`
    for (let i = 1; i < nut.length; i++) {
      const a = nut[i - 1].getBoundingClientRect(), b = nut[i].getBoundingClientRect(), loai = nut[i].dataset.lk || 'cho'
      const x1 = a.left + a.width / 2 - r0.left, y1 = a.top + a.height / 2 - r0.top, x2 = b.left + b.width / 2 - r0.left, y2 = b.top + b.height / 2 - r0.top
      if (loai === 'doi') { const L = Math.hypot(x2 - x1, y2 - y1), nx = (-(y2 - y1) / L) * 4, ny = ((x2 - x1) / L) * 4
        s += `<line class="doi" x1="${x1 + nx}" y1="${y1 + ny}" x2="${x2 + nx}" y2="${y2 + ny}"/><line class="doi" x1="${x1 - nx}" y1="${y1 - ny}" x2="${x2 - nx}" y2="${y2 - ny}"/>` }
      else s += `<line class="${loai}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
    }
    m.insertAdjacentHTML('afterbegin', s + '</svg>')
  }
}
/** Mol đứng phía TRỐNG cạnh nút đang học (đối diện nút), bong bóng ngay trên đầu Mol — cùng luật «né nút» của app. */
function datMol() {
  for (const m of document.querySelectorAll('.mach')) {
    const d = m.querySelector('.nut-m[data-tt="dang"]'), mo = m.querySelector('.mol'), l = m.querySelector('.loi')
    if (!d || !mo) continue
    const r0 = m.getBoundingClientRect(), r = d.getBoundingClientRect(), trai = r.left + r.width / 2 > r0.left + r0.width / 2
    const y = r.top - r0.top + r.height / 2
    mo.style.top = `${y - mo.offsetHeight * 0.16}px`
    mo.style[trai ? 'left' : 'right'] = '4px'
    if (l) { l.style.top = `${y - mo.offsetHeight * 0.16 - l.offsetHeight - 10}px`; l.style[trai ? 'left' : 'right'] = '0px'; l.style.setProperty('--duoi-x', trai ? '46px' : `calc(100% - 46px)`) }
  }
}
const sauPhong = (f) => document.fonts.ready.then(() => requestAnimationFrame(f))
khung()
sauPhong(() => { datMol(); mach() })
