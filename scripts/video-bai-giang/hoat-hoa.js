// VIDEO BÀI GIẢNG — HOẠT HOẠ HOÁ HỌC CHI TIẾT (bản 2, thầy 14/11: «hoạt hoạ ghép luôn vào video siêu đỉnh cực kì chi tiết dễ hiểu»).
// Mỗi loại một cặp dựng / vẽ; vẽ theo đúng giây t và các mốc (giây) bộ dựng đã gắn vào câu Thầy nói. Dùng chung tiện ích của khung.js.
'use strict'
const NS = 'http://www.w3.org/2000/svg'
const svgEl = (tag, attrs, cha) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cha) cha.appendChild(e); return e }
const MN = '#8fb6ff', MC = '#fda4af', MV = '#ffd27a'

// ═════════ 1) THƯ VIỆN 5 α-AMINO ACID: nhóm NH₂ sáng xanh, COOH sáng hồng, bộ đếm N / C ═════════
const TV = [
  { k: 'ala', ten: 'Ala', ct: 'CH₃-CH(<n>NH₂</n>)-<c>COOH</c>' },
  { k: 'gly', ten: 'Gly', ct: '<n>H₂N</n>-CH₂-<c>COOH</c>' },
  { k: 'val', ten: 'Val', ct: '(CH₃)₂CH-CH(<n>NH₂</n>)-<c>COOH</c>' },
  { k: 'lys', ten: 'Lys', ct: '<n>H₂N</n>-(CH₂)₄-CH(<n>NH₂</n>)-<c>COOH</c>' },
  { k: 'glu', ten: 'Glu', ct: '<c>HOOC</c>-(CH₂)₂-CH(<n>NH₂</n>)-<c>COOH</c>' },
]
function dungThuVien(d, goc) {
  goc.classList.add('tv')
  tao('div', 'tv-giai', goc, '<span class="o n">N</span> nhóm NH₂ <span class="o c">C</span> nhóm COOH')
  d.hoatNeo = {}
  d.tv = TV.map((r, i) => {
    const h = tao('div', 'tv-hang', goc, `<div class="tv-ten">${r.ten}</div><div class="tv-ct">${r.ct.replace(/<n>/g, '<span class="g n">').replace(/<c>/g, '<span class="g c">').replace(/<\/[nc]>/g, '</span>')}</div><div class="tv-dem"><b class="dn">0 N</b><b class="dc">0 C</b></div>`)
    h.style.top = `${62 + i * 116}px`; d.hoatNeo[r.k] = h
    return { ...r, h, n: [...h.querySelectorAll('.g.n')], c: [...h.querySelectorAll('.g.c')], dn: h.querySelector('.dn'), dc: h.querySelector('.dc') }
  })
}
function veThuVien(d, t) {
  const m = d.hoat.moc
  d.hoatEl.querySelector('.tv-giai').style.opacity = tien(t, m.hien, 0.4)
  for (const r of d.tv) {
    const t0 = m[r.k], p = lo(t - t0, 2.0, 0.55)
    r.h.style.opacity = kep((t - t0) / 0.2); r.h.style.transform = `translateX(${(1 - p) * 70}px) scale(${0.94 + 0.06 * p})`
    // giờ sáng từng nhóm: mặc định nối nhau sau khi hàng hiện; Lys: NH₂ thứ hai theo lời "hai đầu N"; Glu: COOH thứ hai theo lời "hai đầu C"
    const tn = r.n.map((_, i) => (r.k === 'lys' && i === 0 ? t0 + 0.5 : r.k === 'lys' && i === 1 ? m.lysN2 : t0 + 0.5 + i * 0.4))
    const tc = r.c.map((_, i) => (r.k === 'glu' && i === 1 ? m.gluC2 : r.k === 'glu' ? m.gluC2 - 0.9 : t0 + 0.9 + i * 0.4))
    let soN = 0, soC = 0
    r.n.forEach((g, i) => { const tau = t - tn[i]; if (tau >= 0) soN++; sangNhom(g, tau, MN) })
    r.c.forEach((g, i) => { const tau = t - tc[i]; if (tau >= 0) soC++; sangNhom(g, tau, MC) })
    capNhatDem(r.dn, `${soN} N`, t - Math.max(...tn.filter((x) => x <= t), -99))
    capNhatDem(r.dc, `${soC} C`, t - Math.max(...tc.filter((x) => x <= t), -99))
    const sang = t >= m.sang ? Math.exp(-(t - m.sang - (d.tv.indexOf(r) * 0.08)) * 2.2) : 0
    r.h.style.boxShadow = `0 14px 34px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,${0.08 + 0.5 * kep(sang)}), 0 0 ${40 * kep(sang)}px rgba(255,210,122,${0.5 * kep(sang)})`
  }
}
function sangNhom(g, tau, mau) {
  if (tau < 0) { g.style.background = 'transparent'; g.style.color = ''; g.style.boxShadow = ''; g.style.transform = ''; return }
  const xung = Math.exp(-tau * 3.5)
  g.style.background = `${mau}33`; g.style.color = mau; g.style.boxShadow = `0 0 ${10 + 26 * xung}px ${mau}${xung > 0.05 ? 'aa' : '55'}`
  g.style.transform = `scale(${1 + 0.22 * xung * Math.cos(tau * 18)})`
}
function capNhatDem(el, chu, tau) {
  if (el.textContent !== chu) el.textContent = chu
  const so = parseInt(chu, 10)
  el.style.opacity = so > 0 ? 1 : 0.25
  el.style.transform = tau >= 0 && tau < 0.6 ? `scale(${1 + 0.35 * Math.exp(-tau * 7)})` : ''
}

// ═════════ 2) CẤU TRÚC (quả cầu - que): hai α-amino acid ⇒ OH + H thành H₂O thật, nối liên kết peptide ═════════
// toạ độ khung nhìn 760 × 600; nguyên tử: [khoá, nhãn, loại, x, y, mắt xích]
const NT = [
  ['n1', 'H₂N', 'nhom-n', 70, 300, 1], ['ca1', 'C', 'c', 160, 300, 1], ['h_ca1', 'H', 'h', 160, 228, 1], ['r1', 'R₁', 'r', 160, 375, 1],
  ['c1', 'C', 'c', 250, 300, 1], ['o_c1', 'O', 'o', 250, 222, 1], ['oh_o', 'O', 'o', 330, 300, 1], ['oh_h', 'H', 'h', 388, 300, 1],
  ['h2', 'H', 'h', 450, 300, 2], ['n2', 'N', 'n', 510, 300, 2], ['h_n2', 'H', 'h', 510, 372, 2], ['ca2', 'C', 'c', 598, 300, 2], ['h_ca2', 'H', 'h', 598, 228, 2], ['r2', 'R₂', 'r', 598, 375, 2],
  ['c2', 'COOH', 'nhom-c', 694, 300, 2],
]
const LK = [['n1', 'ca1'], ['ca1', 'h_ca1'], ['ca1', 'r1'], ['ca1', 'c1'], ['c1', 'o_c1', 2], ['c1', 'oh_o'], ['oh_o', 'oh_h'], ['h2', 'n2'], ['n2', 'h_n2'], ['n2', 'ca2'], ['ca2', 'h_ca2'], ['ca2', 'r2'], ['ca2', 'c2']]
const MAU_NT = { c: ['#56656c', '#2b373c', '#f4efe4'], h: ['#ffffff', '#c9d1d3', '#22303a'], o: ['#ff9a9a', '#e05a5a', '#2a1215'], n: ['#b5ceff', '#5d86e0', '#0f1d3a'], r: ['#ddd2ff', '#9d86f0', '#1e1440'], 'nhom-n': ['#b5ceff', '#5d86e0', '#0f1d3a'], 'nhom-c': ['#ffc1c8', '#e0788a', '#2a1215'] }
function dungCauTruc(d, goc) {
  goc.classList.add('ct')
  const rong = (typeof COT !== 'undefined' && COT.w) || 828
  const svg = svgEl('svg', { viewBox: '0 70 760 420', width: rong, height: Math.round(rong * 420 / 760), class: 'ct-svg' }, goc)
  const defs = svgEl('defs', {}, svg)
  for (const [k, [a, b]] of Object.entries(MAU_NT)) { const g = svgEl('radialGradient', { id: `cau-${k}`, cx: '35%', cy: '30%', r: '70%' }, defs); svgEl('stop', { offset: '0%', 'stop-color': a }, g); svgEl('stop', { offset: '100%', 'stop-color': b }, g) }
  const f = svgEl('filter', { id: 'phat-sang', filterUnits: 'userSpaceOnUse', x: -100, y: -100, width: 960, height: 800 }, defs); svgEl('feGaussianBlur', { stdDeviation: '6', result: 'b' }, f); const mg = svgEl('feMerge', {}, f); svgEl('feMergeNode', { in: 'b' }, mg); svgEl('feMergeNode', { in: 'SourceGraphic' }, mg)
  const lopLk = svgEl('g', {}, svg), lopNt = svgEl('g', {}, svg), lopNhan = svgEl('g', {}, svg)
  const C = { svg, nt: {}, lk: [], nhan: {} }
  for (const [k, nhan, loai, x, y, mx] of NT) {
    const g = svgEl('g', {}, lopNt), nhom = loai.startsWith('nhom')
    const r = loai === 'h' ? 19 : nhom ? 0 : 28
    const hinh = nhom ? svgEl('rect', { x: -52, y: -28, width: 104, height: 56, rx: 28, fill: `url(#cau-${loai})` }, g) : svgEl('circle', { r, fill: `url(#cau-${loai})` }, g)
    const vong = svgEl('circle', { r: (r || 40) + 12, fill: 'none', stroke: MV, 'stroke-width': 4, opacity: 0, filter: 'url(#phat-sang)' }, g)
    const chu = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': nhom ? 27 : loai === 'h' ? 21 : 27, 'font-weight': 800, fill: MAU_NT[loai][2] }, g); chu.textContent = nhan
    C.nt[k] = { g, hinh, vong, x, y, x0: x, y0: y, mx, loai }
  }
  for (const [a, b, kep2] of LK) C.lk.push({ a, b, l: svgEl('line', { stroke: '#cfd8dc', 'stroke-width': 7, 'stroke-linecap': 'round' }, lopLk), l2: kep2 ? svgEl('line', { stroke: '#cfd8dc', 'stroke-width': 7, 'stroke-linecap': 'round' }, lopLk) : null })
  C.lkMoi = svgEl('line', { stroke: MV, 'stroke-width': 9, 'stroke-linecap': 'round', filter: 'url(#phat-sang)' }, lopLk)
  const nhanSvg = (k, x, y, chu, mau, co = 24) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': co, 'font-weight': 800, fill: mau }, lopNhan); e.textContent = chu; C.nhan[k] = e; return e }
  nhanSvg('mx1', 230, 150, 'mắt xích 1 (bên trái)', '#b9c3c0', 26); nhanSvg('mx2', 560, 150, 'mắt xích 2 (bên phải)', '#b9c3c0', 26)
  nhanSvg('a1', 160, 190, 'Cα', MV, 28); nhanSvg('a2', 598, 190, 'Cα', MV, 28)
  nhanSvg('oh', 352, 246, 'mất OH', MC, 29); nhanSvg('h2', 432, 378, 'mất H', MC, 29)
  nhanSvg('lk', 330, 455, 'liên kết peptide', MV, 33); nhanSvg('nuoc', 628, 132, 'mất 1 H₂O', '#8fd8ee', 32)
  C.cung = svgEl('path', { fill: 'none', stroke: MV, 'stroke-width': 3.5, 'stroke-dasharray': '7 7', opacity: 0 }, lopNhan)
  C.cungChu = nhanSvg('cung', 205, 468, 'gắn ngay cạnh COOH', MV, 26)
  // dải chữ điều kiện ở đáy
  C.dk = tao('div', 'ct-dk', goc, '<span class="dk-1"><b>1</b>Hai <em>α-amino acid</em></span><span class="dk-2"><b>2</b>Trái <em>mất OH</em>, phải <em>mất H</em></span>')
  d.ct = C; d.hoatNeo = { oh: C.nt.oh_o.g, h2: C.nt.h2.g }
}
function veCauTruc(d, t) {
  const m = d.hoat.moc, C = d.ct
  const noi = eInOut(tien(t, m.noi, 1.0)), bay = eInOut(tien(t, m.noi + 0.1, 1.0))
  const DX = (250 + 80) - 510 // mắt xích 2 dời sang trái để N nối vào C của mắt xích 1
  const NUOC = { oh_o: [470, 120], oh_h: [432, 150], h2: [508, 150] }
  for (const [k, a] of Object.entries(C.nt)) {
    const tre = a.mx === 1 ? 0 : 0.45, idx = NT.findIndex((x) => x[0] === k)
    const p = lo(t - m.hien - tre - idx * 0.035, 2.2, 0.5)
    let x = a.x0, y = a.y0
    if (k in NUOC) { x = lerp(a.x0, NUOC[k][0], bay); y = lerp(a.y0, NUOC[k][1], bay) }
    else if (a.mx === 2) x = a.x0 + DX * noi
    const troi = Math.max(0, t - m.noi - 1.2)
    if (k in NUOC && troi > 0) { y -= Math.min(30, troi * 10); x += Math.sin(troi * 2) * 3 }
    a.x = x; a.y = y
    a.g.setAttribute('transform', `translate(${x},${y}) scale(${kep(p, 0, 1.3)})`); a.g.setAttribute('opacity', kep(p * 1.5))
    // vòng sáng: Cα (mốc alpha), OH (mốc matOH), H (mốc matH)
    let v = 0, mau = MV
    if (k === 'ca1' || k === 'ca2') v = Math.max(t >= m.dk1 && t < m.dk1 + 1.2 ? 0.8 * Math.sin(Math.PI * tien(t, m.dk1, 1.2)) : 0, t >= m.alpha ? 0.55 + 0.45 * Math.cos((t - m.alpha) * 5) * Math.exp(-(t - m.alpha) * 0.6) : 0) * (1 - tien(t, m.matOH, 0.5))
    if (k === 'oh_o' || k === 'oh_h') { v = t >= m.matOH ? 0.7 + 0.3 * Math.sin((t - m.matOH) * 6) : 0; mau = MC }
    if (k === 'h2') { v = t >= m.matH ? 0.7 + 0.3 * Math.sin((t - m.matH) * 6) : 0; mau = MC }
    if (k in NUOC) v *= 1 - tien(t, m.noi, 0.4)
    a.vong.setAttribute('opacity', kep(v)); a.vong.setAttribute('stroke', mau)
    a.vong.setAttribute('stroke-dasharray', mau === MC ? '10 7' : 'none'); a.vong.setAttribute('transform', mau === MC ? `rotate(${t * 60})` : '')
  }
  for (const L of C.lk) {
    const A = C.nt[L.a], B = C.nt[L.b], doi = (L.a in NUOC) !== (L.b in NUOC)
    // liên kết nối nhóm tách ra (C-OH, H-N) đứt khi nối
    const dut = doi ? 1 - tien(t, m.noi, 0.25) : 1
    const ve = tien(t, m.hien + (A.mx === 1 ? 0 : 0.45) + 0.2, 0.6) * dut
    for (const [ln, lech] of [[L.l, L.l2 ? -6 : 0], [L.l2, 6]]) {
      if (!ln) continue
      const dx = B.x - A.x, dy = B.y - A.y, dd = Math.hypot(dx, dy) || 1, ox = (-dy / dd) * lech, oy = (dx / dd) * lech
      ln.setAttribute('x1', A.x + ox); ln.setAttribute('y1', A.y + oy); ln.setAttribute('x2', A.x + ox + dx * ve); ln.setAttribute('y2', A.y + oy + dy * ve)
      ln.setAttribute('opacity', ve > 0 ? 1 : 0)
    }
  }
  // liên kết peptide mới C1 - N2
  const c1 = C.nt.c1, n2 = C.nt.n2, lkp = tien(t, m.noi + 0.85, 0.35)
  C.lkMoi.setAttribute('x1', c1.x); C.lkMoi.setAttribute('y1', c1.y); C.lkMoi.setAttribute('x2', c1.x + (n2.x - c1.x) * lkp); C.lkMoi.setAttribute('y2', c1.y + (n2.y - c1.y) * lkp); C.lkMoi.setAttribute('opacity', lkp > 0 ? 1 : 0)
  C.lkMoi.setAttribute('stroke-width', 9 + 5 * Math.exp(-(t - m.noi - 1.2) * 4) * (t > m.noi + 1.2 ? 1 : 0))
  // nhãn
  const hienNhan = (k, on, tre = 0) => { const e = C.nhan[k]; e.setAttribute('opacity', on); e.setAttribute('transform', `translate(0,${(1 - on) * 12 + tre})`) }
  hienNhan('mx1', tien(t, m.hien + 0.3, 0.4) * (1 - tien(t, m.noi, 0.4))); hienNhan('mx2', tien(t, m.hien + 0.7, 0.4) * (1 - tien(t, m.noi, 0.4)))
  const ma = tien(t, m.alpha + 0.1, 0.35) * (1 - tien(t, m.noi, 0.3)); hienNhan('a1', ma); hienNhan('a2', ma)
  hienNhan('oh', tien(t, m.matOH + 0.2, 0.3) * (1 - tien(t, m.noi, 0.3))); hienNhan('h2', tien(t, m.matH + 0.2, 0.3) * (1 - tien(t, m.noi, 0.3)))
  hienNhan('lk', tien(t, m.noi + 1.1, 0.4)); hienNhan('nuoc', tien(t, m.noi + 1.0, 0.4))
  C.nhan.lk.setAttribute('x', (c1.x + n2.x) / 2)
  // cung chỉ Cα "ngay cạnh COOH" (Cα ⇒ C của nhóm COOH)
  const ca = C.nt.ca1, cc = C.nt.c1, cv = tien(t, m.alpha + 0.3, 0.6) * (1 - tien(t, m.matOH, 0.4))
  C.cung.setAttribute('d', `M ${ca.x} ${ca.y + 40} Q ${(ca.x + cc.x) / 2} ${ca.y + 120} ${cc.x} ${cc.y + 40}`); C.cung.setAttribute('opacity', cv); C.cung.setAttribute('stroke-dashoffset', -t * 30)
  C.cungChu.setAttribute('opacity', cv)
  // dải điều kiện
  const d1 = C.dk.querySelector('.dk-1'), d2 = C.dk.querySelector('.dk-2')
  const p1 = lo(t - m.dk1, 2, 0.55), p2 = lo(t - m.matOH, 2, 0.55)
  d1.style.opacity = kep(p1 * 1.4); d1.style.transform = `translateY(${(1 - p1) * 20}px)`
  d2.style.opacity = kep(p2 * 1.4); d2.style.transform = `translateY(${(1 - p2) * 20}px)`
  d2.querySelectorAll('em')[1].style.opacity = t >= m.matH ? 1 : 0.25
}

// ═════════ 3) CHUỖI PEPTIDE THUỶ PHÂN (tham số hoá): acid ⇒ HCl đếm N · base ⇒ NaOH đếm đầu C; nước cắt (k−1) liên kết ═════════
// d.hoat.p = { khoi: [[tên, số N, số đầu C], …], mt: 'acid' | 'base', nhan?: chữ ghi chú, muoi?: [chữ muối 1, chữ muối 2] }
// mốc: hien, cat (nước cắt liên kết), d1…dK (sáng từng chấm đếm), tong, thuoc (HCl / NaOH bay vào), sinh / con (base: nước sinh / còn), nhan, m1, m2
const soA = (n) => (n === 1 ? 'a' : `${n}a`)
function dungChuoi(d, goc) {
  goc.classList.add('cq')
  const P = d.hoat.p || { khoi: [['Gly', 1, 1], ['Lys', 2, 1], ['Gly', 1, 1]], mt: 'acid' }
  const acid = P.mt !== 'base', K = P.khoi.map(([ten, n, c]) => ({ ten, dem: acid ? n : c })), k = K.length
  const W = (typeof COT !== 'undefined' && COT.w) || 828, gap = k > 3 ? 34 : 55, bw = Math.min(230, (W - 28 - gap * (k - 1)) / k)
  const C = { khoi: [], lk: [], n: [], thuoc: [], giot: [], acid, k, P }
  K.forEach((kh, i) => {
    const x = 14 + i * (bw + gap), e = tao('div', 'cq-khoi', goc, `<b>${thoat(kh.ten)}</b>`); e.style.left = `${x}px`; e.style.width = `${bw}px`
    C.khoi.push({ e, x })
    for (let j = 0; j < kh.dem; j++) { const dot = tao('div', `cq-n${acid ? '' : ' c'}`, goc, acid ? 'N' : 'C'); const cx = x + bw / 2 - (kh.dem - 1) * 40 + j * 80; dot.style.left = `${cx - 31}px`; C.n.push({ e: dot, x: cx, khoi: i, so: tao('div', 'cq-so', goc, String(C.n.length + 1)) }) }
  })
  for (let i = 0; i < k - 1; i++) { const x = 14 + (i + 1) * (bw + gap) - gap, l = tao('div', 'cq-lk', goc); l.style.left = `${x}px`; l.style.width = `${gap}px`; C.lk.push(l); const g = tao('div', 'cq-giot', goc, 'H₂O'); g.style.left = `${x + gap / 2 - 38}px`; C.giot.push(g) }
  C.n.forEach(() => { C.thuoc.push(tao('div', 'cq-hcl', goc, acid ? 'HCl' : 'NaOH')) })
  const tong = C.n.length, phan = K.map((kh) => kh.dem)
  C.dem = tao('div', 'cq-dem', goc,
    (acid ? `<div class="cq-d nuoc"><span>H₂O</span><b class="pt"><i>: ${soA(k - 1)}</i></b></div>` : `<div class="cq-d nuoc"><span>H₂O</span><b class="pt"><i>sinh ${soA(tong)}</i><i>− cần ${soA(k - 1)}</i><i>⇒ còn ${soA(tong - k + 1)}</i></b></div>`)
    + `<div class="cq-d dem"><span>${acid ? 'N' : 'đầu C'}</span><b class="pt">${phan.map((p, i) => `<i>${i ? '+ ' : ''}${p}</i>`).join('')}<i>= ${tong}</i></b></div>`
    + `<div class="cq-d hcl"><span>${acid ? 'HCl' : 'NaOH'}</span><b>: 0a</b></div>`)
  C.nhan = P.nhan ? tao('div', 'cq-nhan-lys', goc, dam(P.nhan)) : null
  C.muoi = (P.muoi || []).map((m, i) => { const e = tao('div', 'cq-muoi', goc, dam(m)); e.style.top = `${568 + i * 46}px`; return e })
  d.cq = C; d.hoatNeo = { nuoc: C.dem.querySelector('.nuoc'), dem: C.dem.querySelector('.dem'), thuoc: C.dem.querySelector('.hcl') }
}
function veChuoi(d, t) {
  const m = d.hoat.moc, C = d.cq, Y = 26, tong = C.n.length
  const tCat = m.cat ?? m.hien + 1, tachRa = eInOut(tien(t, tCat + 0.55, 0.6))
  C.khoi.forEach((kh, i) => { const p = lo(t - m.hien - i * 0.12, 2.2, 0.55), dx = (i - (C.k - 1) / 2) * 16 * tachRa; kh.e.style.top = `${Y}px`; kh.e.style.transform = `translateX(${dx}px) scale(${0.6 + 0.4 * p})`; kh.e.style.opacity = kep(p * 1.4); kh.dx = dx })
  C.lk.forEach((l) => { const ve = tien(t, m.hien + 0.35, 0.3), dut = tien(t, tCat + 0.55, 0.2); l.style.top = `${Y + 54}px`; l.style.transform = `scaleX(${ve * (1 - dut)})`; l.style.opacity = ve > 0 ? 1 : 0; l.style.boxShadow = t > tCat + 0.45 && t < tCat + 0.75 ? '0 0 24px 8px rgba(143,216,238,.9)' : '' })
  C.giot.forEach((g, i) => { const roi = eInOut(tien(t, tCat + i * 0.12, 0.55)), mat = tien(t, tCat + 0.6 + i * 0.12, 0.25); g.style.top = `${lerp(-70, Y + 16, roi)}px`; g.style.opacity = tien(t, tCat + i * 0.12, 0.15) * (1 - mat); g.style.transform = `scale(${1 - 0.5 * mat})` })
  const tN = C.n.map((_, i) => m[`d${i + 1}`] ?? m.tong)
  C.n.forEach((n, i) => {
    const kh = C.khoi[n.khoi], hien = tien(t, m.hien + 0.5, 0.4), tau = t - tN[i]
    n.e.style.top = `${Y + 172}px`; n.e.style.transform = `translateX(${kh.dx || 0}px) scale(${tau >= 0 ? 1 + 0.4 * Math.exp(-tau * 5) : 0.9})`; n.e.style.opacity = hien
    n.e.classList.toggle('sang', tau >= 0)
    const ps = lo(tau, 2.4, 0.5); n.so.style.left = `${n.x - 19 + (kh.dx || 0)}px`; n.so.style.top = `${Y + 128 - ps * 8}px`; n.so.style.opacity = kep(ps * 1.5); n.so.style.transform = `scale(${0.4 + 0.6 * ps})`
  })
  // HCl / NaOH bay vào gắn từng chấm
  const tThuoc = m.thuoc ?? m.tong + 0.4
  C.thuoc.forEach((h, i) => {
    const t0 = tThuoc + i * 0.16, p = eInOut(tien(t, t0, 0.6)), n = C.n[i], kh = C.khoi[n.khoi]
    h.style.left = `${lerp(780, n.x - (C.acid ? 40 : 52) + (kh.dx || 0), p)}px`; h.style.top = `${lerp(-40, Y + 250, p)}px`; h.style.opacity = tien(t, t0, 0.12)
    const xung = m.nhan != null && t >= m.nhan && C.P.khoi[n.khoi][C.acid ? 1 : 2] > 1 ? 0.5 + 0.5 * Math.sin((t - m.nhan) * 7) : 0
    h.style.boxShadow = xung ? `0 0 ${10 + 22 * xung}px rgba(253,164,175,.8)` : ''
    h.style.transform = `scale(${1 + (p >= 1 ? 0.2 * Math.exp(-(t - t0 - 0.6) * 6) : 0) + 0.12 * xung})`
  })
  // bộ đếm
  const dn = C.dem.querySelector('.nuoc'), dd = C.dem.querySelector('.dem'), dh = C.dem.querySelector('.hcl')
  const iNuoc = dn.querySelectorAll('i')
  if (C.acid) { dn.style.opacity = tien(t, tCat + 0.5, 0.3); iNuoc[0].style.opacity = 1 }
  else {
    dn.style.opacity = tien(t, Math.min(m.sinh ?? 1e9, tCat) - 0.1, 0.3)
    ;[m.sinh, tCat + 0.5, m.con].forEach((tt, i) => { const p = lo(t - (tt ?? 1e9), 2.4, 0.5); iNuoc[i].style.opacity = kep(p * 1.4); iNuoc[i].style.transform = `translateY(${(1 - p) * 12}px)` })
  }
  const iDem = dd.querySelectorAll('i'), daDem = C.khoi.map((_, k) => Math.max(...C.n.map((n, i) => (n.khoi === k ? tN[i] : -1e9))))
  dd.style.opacity = tien(t, Math.min(...tN) - 0.2, 0.3)
  iDem.forEach((e, i) => { const t0 = i < daDem.length ? daDem[i] : m.tong, p = lo(t - t0, 2.4, 0.5); e.style.opacity = kep(p * 1.4); e.style.transform = `translateY(${(1 - p) * 14}px) scale(${i === daDem.length ? 1 + 0.4 * Math.exp(-Math.max(0, t - t0) * 4) : 1})` })
  dh.style.opacity = tien(t, tThuoc, 0.3); const so = Math.min(tong, Math.max(0, Math.floor((t - tThuoc - 0.6) / 0.16) + 1)); dh.querySelector('b').textContent = `: ${so ? soA(so) : '0a'}`
  dh.classList.toggle('du', so === tong)
  if (C.nhan) { const pl = lo(t - (m.nhan ?? 1e9), 2, 0.55); C.nhan.style.opacity = kep(pl * 1.4); C.nhan.style.transform = `translateY(${(1 - pl) * 16}px)` }
  C.muoi.forEach((e, i) => { const pl = lo(t - (m[`m${i + 1}`] ?? 1e9), 2, 0.55); e.style.opacity = kep(pl * 1.4); e.style.transform = `translateX(${(1 - pl) * 40}px)` })
}

const HOAT = { 'thu-vien': [dungThuVien, veThuVien], 'cau-truc': [dungCauTruc, veCauTruc], chuoi: [dungChuoi, veChuoi] }

// ═════════ KHOANH TRÊN BẢNG + ĐƯỜNG NỐI (kiểu bút dạ truyền hình) ═════════
function veDanhDau(d, t, cam, bienDoi) {
  const svg = document.getElementById('danh-dau')
  svg.innerHTML = ''
  for (const dd of d.danhDau || []) {
    if (t < dd.t0 || t > dd.t1 + 0.4) continue
    const [cx, cy, cw] = cam, k = BANG.w / cw
    const le = 18
    let x0 = BANG.x + (dd.neo[0] - cx) * k - le, y0 = BANG.y + (dd.neo[1] - cy) * k - le, x1 = BANG.x + (dd.neo[2] - cx) * k + le, y1 = BANG.y + (dd.neo[3] - cy) * k + le
    x0 = Math.max(BANG.x + 8, x0); y0 = Math.max(BANG.y + 8, y0); x1 = Math.min(BANG.x + BANG.w - 8, x1); y1 = Math.min(BANG.y + BANG.h - 8, y1)
    if (x1 - x0 < 30 || y1 - y0 < 20) continue
    const a = bienDoi(x0, y0), b = bienDoi(x1, y1)
    const mo = 1 - tien(t, dd.t1, 0.4), ve = eOut(tien(t, dd.t0, 0.5)), noiP = eOut(tien(t, dd.t0 + 0.35, 0.45))
    const mau = d.mauHex
    const r = svgEl('rect', { x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1], rx: 22, fill: `${mau}14`, stroke: mau, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - ve, opacity: mo, filter: 'url(#dd-sang)' }, svg)
    void r
    const dich = d.hoatNeo && d.hoatNeo[dd.toi]
    if (dich) {
      const rr = dich.getBoundingClientRect(), laNt = dich instanceof SVGElement
      const ex = laNt ? rr.left + rr.width / 2 : rr.left - 10, ey = laNt ? rr.top - 8 : rr.top + rr.height / 2
      const sx = b[0] + 4, sy = (a[1] + b[1]) / 2
      const p = svgEl('path', { d: laNt ? `M ${sx} ${sy} C ${sx + 120} ${sy}, ${ex} ${ey - 160}, ${ex} ${ey}` : `M ${sx} ${sy} C ${sx + 90} ${sy}, ${ex - 90} ${ey}, ${ex} ${ey}`, fill: 'none', stroke: mau, 'stroke-width': 4, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - noiP, opacity: mo, filter: 'url(#dd-sang)' }, svg)
      void p
      if (noiP > 0.98) svgEl('circle', { cx: ex, cy: ey, r: 8, fill: mau, opacity: mo }, svg)
    }
  }
}

// ═════════ LẤP LÁNH (tia nhỏ toả ra khi một hình hiện) ═════════
function lapLanh(ctx2, x, y, tau, mau, n = 12) {
  if (tau < 0 || tau > 0.8) return
  ctx2.save(); ctx2.globalAlpha = 1 - tau / 0.8; ctx2.strokeStyle = mau; ctx2.lineWidth = 3; ctx2.lineCap = 'round'
  for (let i = 0; i < n; i++) { const g = (i / n) * Math.PI * 2 + hat(i) * 0.3, r0 = 20 + tau * 90, r1 = r0 + 14 * (1 - tau); ctx2.beginPath(); ctx2.moveTo(x + Math.cos(g) * r0, y + Math.sin(g) * r0); ctx2.lineTo(x + Math.cos(g) * r1, y + Math.sin(g) * r1); ctx2.stroke() }
  ctx2.restore()
}

// dùng chung với khung.js (tệp nạp sau)
window.HOAT = HOAT; window.veDanhDau = veDanhDau; window.lapLanh = lapLanh
