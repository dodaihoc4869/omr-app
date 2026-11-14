// VIDEO BÀI GIẢNG — HOẠT HOẠ PHẦN 2 (video K12 đầy đủ, thầy 14/11 «Làm đầy đủ video k12»): chuỗi hạt peptide 2 → 50, dựng phương trình,
// đồng phân đổi chỗ + đầu N / đầu C, cắt liên kết peptide bằng nước, ống nghiệm biuret. Mỗi loại một cặp dựng / vẽ theo giây t và các mốc.
'use strict'
const MAU5 = ['#ffd27a', '#6ee7b7', '#8fb6ff', '#fda4af', '#c4b5fd']
const TEN5 = ['Gly', 'Ala', 'Val', 'Lys', 'Glu']
const rongCot = () => (typeof COT !== 'undefined' && COT.w) || 828
const bat = (e, t, t0, dy = 16) => { const p = lo(t - t0, 2.2, 0.55); e.style.opacity = kep(p * 1.4); e.style.transform = `translateY(${(1 - p) * dy}px) scale(${0.85 + 0.15 * kep(p, 0, 1.2)})`; return p }

// ═════════ A) CHUỖI HẠT: peptide 2 → 50 mắt xích, oligo 2–10 · poly 11–50 ═════════
function dungHat(d, goc) {
  goc.classList.add('ht')
  const W = rongCot()
  const dem = tao('div', 'ht-dem', goc, 'Số mắt xích: <b>2</b>')
  const svg = svgEl('svg', { width: W, height: 400, viewBox: `0 0 ${W} 400`, class: 'ht-svg' }, goc)
  const lopLk = svgEl('g', {}, svg), lopHat = svgEl('g', {}, svg)
  const pos = []; for (let i = 0; i < 50; i++) { const r = Math.floor(i / 10), c = i % 10, cc = r % 2 ? 9 - c : c; pos.push([54 + cc * ((W - 108) / 9), 46 + r * 76]) }
  const lk = [], hat2 = []
  for (let i = 1; i < 50; i++) lk.push(svgEl('line', { x1: pos[i - 1][0], y1: pos[i - 1][1], x2: pos[i][0], y2: pos[i][1], stroke: '#5d7078', 'stroke-width': 7, 'stroke-linecap': 'round' }, lopLk))
  for (let i = 0; i < 50; i++) { const g = svgEl('g', { transform: `translate(${pos[i][0]},${pos[i][1]})` }, lopHat); const vong = svgEl('circle', { r: 31, fill: 'none', 'stroke-width': 4, opacity: 0 }, g); const c = svgEl('circle', { r: 22, fill: '#46575e' }, g); hat2.push({ g, c, vong }) }
  const chu = tao('div', 'ht-chu', goc, TEN5.map((t, i) => `<span style="--m:${MAU5[i]}"><i></i>${t}</span>`).join(''))
  const thang = tao('div', 'ht-thang', goc, '<div class="o1"><b>Oligopeptide</b><span>2 → 10 mắt xích</span></div><div class="o2"><b>Polypeptide</b><span>11 → 50 mắt xích</span></div>')
  d.ht = { dem, lk, hat: hat2, chu, thang }
  d.hoatNeo = { thang: thang }
}
function veHat(d, t) {
  const m = d.hoat.moc, H = d.ht
  const n = t < m.dem50 ? 2 : Math.round(lerp(2, 50, eInOut(tien(t, m.dem50, 2.4))))
  H.dem.style.opacity = tien(t, m.hien, 0.3); H.dem.querySelector('b').textContent = String(n)
  H.dem.querySelector('b').style.transform = t >= m.dem50 && t < m.dem50 + 2.6 ? `scale(${1.15 + 0.1 * Math.sin(t * 20)})` : ''
  const coMau = tien(t, m.mau, 0.5), lkSang = t >= m.lk ? 0.5 + 0.5 * Math.cos((t - m.lk) * 4) * ex(-(t - m.lk) * 0.5) : 0
  H.hat.forEach((h, i) => {
    const tHien = i < 2 ? m.hien + i * 0.15 : m.dem50 + ((i - 2) / 48) * 2.4 * 0.85, p = lo(t - tHien, 2.6, 0.5)
    h.g.setAttribute('opacity', kep(p * 1.5)); h.c.setAttribute('r', String(22 * kep(0.4 + 0.6 * p, 0, 1.25)))
    h.c.setAttribute('fill', coMau > 0 ? MAU5[i % 5] : '#46575e'); h.c.setAttribute('opacity', String(0.55 + 0.45 * Math.max(coMau, i < 2 ? 1 : 0)))
    const oligo = i < 10 ? tien(t, m.oligo + i * 0.03, 0.3) * (1 - tien(t, m.poly, 0.4) * 0.6) : 0, poly = i >= 10 ? tien(t, m.poly + (i - 10) * 0.012, 0.3) : 0
    h.vong.setAttribute('opacity', Math.max(oligo, poly)); h.vong.setAttribute('stroke', i < 10 ? '#ffd27a' : '#6ee7b7')
  })
  H.lk.forEach((l, i) => { const tHien = i === 0 ? m.hien + 0.3 : m.dem50 + ((i - 1) / 48) * 2.4 * 0.85 + 0.1; l.setAttribute('opacity', tien(t, tHien, 0.2)); l.setAttribute('stroke', lkSang > 0.05 ? '#ffd27a' : '#5d7078'); l.setAttribute('stroke-width', String(7 + 4 * lkSang)) })
  bat(H.chu, t, m.mau)
  const th = H.thang; th.style.opacity = tien(t, m.oligo - 0.2, 0.3)
  const o1 = th.querySelector('.o1'), o2 = th.querySelector('.o2')
  const p1 = lo(t - m.oligo, 2, 0.55), p2 = lo(t - m.poly, 2, 0.55)
  o1.style.transform = `scaleY(${0.7 + 0.3 * kep(p1, 0, 1.2)})`; o1.style.opacity = 0.35 + 0.65 * kep(p1); o2.style.transform = `scaleY(${0.7 + 0.3 * kep(p2, 0, 1.2)})`; o2.style.opacity = 0.35 + 0.65 * kep(p2)
}

// ═════════ B) DỰNG PHƯƠNG TRÌNH: từng vế bật ra đúng lúc Thầy nói ═════════
// d.hoat.p.tk = [{ chu, moc, lop?: 'kq' | 'dau', duoi? }]
function dungPhuongTrinh(d, goc) {
  goc.classList.add('ptr')
  const hang = tao('div', 'ptr-hang', goc)
  d.ptr = (d.hoat.p.tk || []).map((k) => { const e = tao('div', `ptr-tk ${k.lop || ''}`, hang, `<b>${dam(k.chu)}</b>${k.duoi ? `<small>${dam(k.duoi)}</small>` : ''}`); return { ...k, e } })
  d.hoatNeo = Object.fromEntries(d.ptr.map((k) => [k.moc, k.e]))
}
function vePhuongTrinh(d, t) {
  const m = d.hoat.moc
  for (const k of d.ptr) {
    const t0 = m[k.moc]; bat(k.e, t, t0, 26)
    if (k.lop === 'kq' && t >= t0) { const x = ex(-(t - t0) * 2.5); k.e.style.boxShadow = `0 0 0 ${3 + 3 * x}px var(--mau), 0 0 ${30 + 30 * x}px rgba(255,210,122,${0.25 + 0.35 * x})` }
  }
}

// ═════════ C) ĐỒNG PHÂN: Gly - Ala đổi chỗ thành Ala - Gly (12 ≠ 21); đầu N, đầu C ═════════
function dungDongPhan(d, goc) {
  goc.classList.add('dp')
  const W = rongCot(), x0 = (W - 650) / 2
  const hang = (y) => {
    const n = tao('div', 'dp-mu n', goc, 'H₂N'), c = tao('div', 'dp-mu c', goc, 'COOH'), a = tao('div', 'dp-k', goc, ''), b = tao('div', 'dp-k', goc, ''), g = tao('div', 'dp-g', goc, '-')
    n.style.left = `${x0}px`; a.style.left = `${x0 + 110}px`; g.style.left = `${x0 + 310}px`; b.style.left = `${x0 + 340}px`; c.style.left = `${x0 + 540}px`
    for (const e of [n, c, a, b, g]) e.style.top = `${y}px`
    return { n, c, a, b, g }
  }
  const A = hang(30), B = hang(232)
  A.a.innerHTML = '<b>Gly</b>'; A.b.innerHTML = '<b>Ala</b>'; B.a.innerHTML = '<b>Gly</b>'; B.b.innerHTML = '<b>Ala</b>'
  const khac = tao('div', 'dp-khac', goc, '≠'); khac.style.left = `${W / 2 - 30}px`
  const so = tao('div', 'dp-so', goc, '<b>12</b><i>≠</i><b>21</b>')
  const quy = tao('div', 'dp-quy', goc, '<em>Đồng phân</em>: đổi chỗ các mắt xích')
  const tenN = tao('div', 'dp-ten n', goc, 'đầu N'), tenC = tao('div', 'dp-ten c', goc, 'đầu C')
  tenN.style.left = `${x0 - 6}px`; tenC.style.left = `${x0 + 540}px`
  d.dp = { A, B, khac, so, quy, tenN, tenC, x0 }
  d.hoatNeo = { n: A.n, c: A.c }
}
function veDongPhan(d, t) {
  const m = d.hoat.moc, P = d.dp
  for (const e of [P.A.n, P.A.a, P.A.g, P.A.b, P.A.c]) bat(e, t, m.hien + [P.A.n, P.A.a, P.A.g, P.A.b, P.A.c].indexOf(e) * 0.08)
  // hàng 2: chép hàng 1 rồi Gly ⇄ Ala đổi chỗ (Gly vòng lên, Ala vòng xuống)
  const doi = eInOut(tien(t, m.doi + 0.5, 0.9)), hien2 = tien(t, m.doi, 0.35)
  for (const e of [P.B.n, P.B.g, P.B.c]) { e.style.opacity = hien2; e.style.transform = '' }
  P.B.a.style.opacity = hien2; P.B.b.style.opacity = hien2
  P.B.a.style.transform = `translate(${230 * doi}px,${-70 * Math.sin(Math.PI * doi)}px)`; P.B.b.style.transform = `translate(${-230 * doi}px,${70 * Math.sin(Math.PI * doi)}px)`
  bat(P.khac, t, m.doi + 1.5, 10)
  bat(P.so, t, m.so); bat(P.quy, t, m.quy)
  const giu = t >= m.giu ? 0.5 + 0.5 * Math.sin((t - m.giu) * 5) : 0
  P.A.n.style.boxShadow = giu ? `0 0 ${12 + 24 * giu}px rgba(143,182,255,.85)` : ''; P.A.c.style.boxShadow = giu ? `0 0 ${12 + 24 * giu}px rgba(253,164,175,.85)` : ''
  bat(P.tenN, t, m.dau); bat(P.tenC, t, m.dau + 0.5)
}

// ═════════ D) CẮT LIÊN KẾT PEPTIDE: H₂O trả lại OH cho mắt xích 1, H cho mắt xích 2; hoàn toàn / không hoàn toàn ═════════
function dungCatLk(d, goc) {
  goc.classList.add('cl')
  const W = rongCot(), cx = W / 2
  const P = {
    m1: tao('div', 'cl-k', goc, 'Mắt xích 1'), co: tao('div', 'cl-f', goc, '-CO'), nh: tao('div', 'cl-f', goc, 'NH-'), m2: tao('div', 'cl-k', goc, 'Mắt xích 2'),
    lk: tao('div', 'cl-lk', goc), nuoc: tao('div', 'cl-nuoc', goc, 'H₂O'), oh: tao('div', 'cl-f do', goc, 'OH'), h: tao('div', 'cl-f do', goc, 'H'),
    cooh: tao('div', 'cl-f', goc, '-CO<span class="do">OH</span>'), h2n: tao('div', 'cl-f', goc, '<span class="do">H</span>₂N-'),
    n1: tao('div', 'cl-nhan', goc, 'nhận <em>OH</em>'), n2: tao('div', 'cl-nhan', goc, 'nhận <em>H</em>'),
    mt: tao('div', 'cl-mt', goc, '<span>Môi trường <em>acid</em></span><span>Môi trường <em>base</em></span>'),
    xich: [0, 1].map((i) => { const e = tao('div', 'cl-xich', goc, `<div class="cl-hat">${'<i></i>'.repeat(5)}</div><b>${i ? 'Không hoàn toàn: <em>không cắt hết</em>' : 'Hoàn toàn: cắt <em>100%</em>'}</b>`); e.style.top = `${330 + i * 130}px`; return e }),
    cx,
  }
  d.cl = P; d.hoatNeo = { lk: P.lk }
}
function veCatLk(d, t) {
  const m = d.hoat.moc, P = d.cl, cx = P.cx, Y = 110
  const tach = eInOut(tien(t, m.tach, 0.8)), roi = eInOut(tien(t, m.nuoc, 0.7)), xa = 60 * tach
  const dat = (e, x, y, o = 1, s = 1) => { e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.opacity = o; e.style.transform = `scale(${s})` }
  const hien = lo(t - m.hien, 2, 0.55)
  dat(P.m1, cx - 330 - xa, Y, kep(hien * 1.4)); dat(P.co, cx - 92 - xa, Y + 14, kep(hien * 1.4)); dat(P.nh, cx + 16 + xa, Y + 14, kep(hien * 1.4)); dat(P.m2, cx + 92 + xa, Y, kep(hien * 1.4))
  P.lk.style.left = `${cx - 40}px`; P.lk.style.top = `${Y + 6}px`; P.lk.style.opacity = kep(hien) * (1 - tien(t, m.tach, 0.2)); P.lk.style.transform = `scale(${1 + 0.15 * Math.sin(Math.max(0, t - m.hien) * 4)})`
  // giọt nước rơi vào chỗ nối, tách thành OH (sang trái) + H (sang phải)
  dat(P.nuoc, cx - 46, lerp(-80, Y - 20, roi), tien(t, m.nuoc, 0.15) * (1 - tien(t, m.tach, 0.2)))
  const v = tien(t, m.tach, 0.01) > 0
  dat(P.oh, lerp(cx - 30, cx - 30 - xa + 6, tach), lerp(Y - 10, Y + 14, tach), v ? 1 : 0)
  dat(P.h, lerp(cx + 4, cx + 2 + xa - 20, tach), lerp(Y - 10, Y + 14, tach), v ? 1 : 0)
  const lien = tien(t, m.tach + 0.75, 0.15)
  if (lien > 0) { for (const e of [P.co, P.oh, P.nh, P.h]) e.style.opacity = 1 - lien }
  dat(P.cooh, cx - 92 - xa, Y + 14, lien); dat(P.h2n, cx + 16 + xa - 30, Y + 14, lien)
  bat(P.n1, t, m.tach + 0.8); bat(P.n2, t, m.tach + 1.0)
  P.n1.style.left = `${cx - 250}px`; P.n1.style.top = `${Y + 100}px`; P.n2.style.left = `${cx + 110}px`; P.n2.style.top = `${Y + 100}px`
  const mt = P.mt; mt.style.top = `${Y + 160}px`; mt.querySelectorAll('span').forEach((e, i) => bat(e, t, m.mt + i * 0.35))
  // hai chuỗi 5 hạt: hoàn toàn cắt cả 4 nối, không hoàn toàn cắt 2 / 4
  P.xich.forEach((e, i) => {
    const t0 = i ? m.khong : m.hoan; bat(e, t, t0 - 0.3, 20)
    const hat = e.querySelectorAll('.cl-hat i'), cat = eInOut(tien(t, t0 + 0.6, 0.5))
    hat.forEach((h, j) => { const doiRa = i === 0 ? j : [0, 0, 1, 1, 2][j]; h.style.transform = `translateX(${doiRa * 26 * cat}px)` })
    e.querySelector('.cl-hat').classList.toggle('cat', cat > 0.5)
    e.querySelector('.cl-hat').dataset.kieu = i ? 'mot-phan' : 'het'
  })
}

// ═════════ E) BIURET: Cu(OH)₂ / OH⁻ dư; X₂ không đổi màu, từ X₃ trở lên màu tím ═════════
function dungBiuret(d, goc) {
  goc.classList.add('bi')
  const W = rongCot(), svg = svgEl('svg', { width: W, height: 340, viewBox: `0 0 ${W} 420`, class: 'bi-svg' }, goc)
  const defs = svgEl('defs', {}, svg), ong = []
  const f = svgEl('filter', { id: 'bi-sang', filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: 420 }, defs); svgEl('feGaussianBlur', { stdDeviation: 14 }, f)
  for (const [i, x] of [[0, W * 0.3], [1, W * 0.7]]) {
    const g = svgEl('g', { transform: `translate(${x},0)` }, svg)
    const cp = svgEl('clipPath', { id: `bi-ong-${i}` }, defs); svgEl('path', { d: 'M -46 40 L -46 330 A 46 46 0 0 0 46 330 L 46 40 Z' }, cp)
    const sang = svgEl('ellipse', { cx: 0, cy: 300, rx: 90, ry: 120, fill: '#b48cff', opacity: 0, filter: 'url(#bi-sang)' }, g)
    const nuoc = svgEl('rect', { x: -46, y: 190, width: 92, height: 200, fill: '#dfe7ea', opacity: 0.55, 'clip-path': `url(#bi-ong-${i})` }, g)
    svgEl('path', { d: 'M -46 30 L -46 330 A 46 46 0 0 0 46 330 L 46 30', fill: 'none', stroke: '#cfd8dc', 'stroke-width': 5, opacity: 0.9 }, g)
    svgEl('rect', { x: -58, y: 22, width: 116, height: 12, rx: 6, fill: '#cfd8dc', opacity: 0.9 }, g)
    const giot = [0, 1, 2].map(() => svgEl('circle', { r: 9, fill: '#5aa9e6', opacity: 0 }, g))
    ong.push({ g, nuoc, sang, giot, x })
  }
  const nhan = [tao('div', 'bi-nhan', goc, 'X₂ (dipeptide)'), tao('div', 'bi-nhan', goc, 'Từ <em>X₃</em> trở lên')]
  nhan.forEach((e, i) => { e.style.left = `${ong[i].x - 150}px` })
  const kq = [tao('div', 'bi-kq', goc, 'không có màu tím'), tao('div', 'bi-kq tim', goc, '<em>màu tím</em>')]
  kq.forEach((e, i) => { e.style.left = `${ong[i].x - 150}px` })
  const thuoc = tao('div', 'bi-thuoc', goc, 'Thuốc thử: <em>Cu(OH)₂</em> / OH⁻ dư')
  const x3 = tao('div', 'bi-x3', goc, 'X₃: 3 mắt xích, <em>2 liên kết peptide</em>')
  d.bi = { ong, nhan, kq, thuoc, x3 }; d.hoatNeo = { tim: kq[1] }
}
function veBiuret(d, t) {
  const m = d.hoat.moc, B = d.bi
  bat(B.thuoc, t, m.thuoc - 0.4)
  B.ong.forEach((o, i) => {
    o.g.setAttribute('opacity', tien(t, m.hien ?? m.thuoc - 0.6, 0.4))
    o.giot.forEach((g, j) => { const t0 = m.thuoc + j * 0.25 + i * 0.1, p = tien(t, t0, 0.5); g.setAttribute('cx', String((j - 1) * 14)); g.setAttribute('cy', String(lerp(-20, 200, p))); g.setAttribute('opacity', p > 0 && p < 1 ? 1 : 0) })
    const xanh = tien(t, m.thuoc + 0.7, 0.8), tim = i === 1 ? eInOut(tien(t, m.tim, 1.4)) : 0
    const mau = tim > 0 ? `rgb(${Math.round(lerp(120, 168, tim))},${Math.round(lerp(190, 95, tim))},${Math.round(lerp(235, 240, tim))})` : xanh > 0 ? `rgb(${Math.round(lerp(223, 120, xanh))},${Math.round(lerp(231, 190, xanh))},${Math.round(lerp(234, 235, xanh))})` : '#dfe7ea'
    o.nuoc.setAttribute('fill', mau); o.nuoc.setAttribute('opacity', String(0.55 + 0.35 * Math.max(xanh, tim)))
    o.sang.setAttribute('opacity', String(0.55 * tim * (0.8 + 0.2 * Math.sin(t * 3))))
  })
  B.nhan.forEach((e, i) => { bat(e, t, (m.hien ?? m.thuoc - 0.6) + i * 0.2); e.classList.toggle('sang', i === 1 && t >= m.x3) })
  bat(B.x3, t, m.x3 + 0.6)
  bat(B.kq[0], t, m.tim + 0.4); bat(B.kq[1], t, m.tim + 0.9)
}

Object.assign(HOAT, { hat: [dungHat, veHat], 'phuong-trinh': [dungPhuongTrinh, vePhuongTrinh], 'dong-phan': [dungDongPhan, veDongPhan], 'cat-lk': [dungCatLk, veCatLk], biuret: [dungBiuret, veBiuret] })
