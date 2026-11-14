// VIDEO BÀI GIẢNG — HOẠT HOẠ K10 «Liên kết cộng hoá trị phân cực / không phân cực» (thầy 14/11 «làm video tóm tắt cho bản live lớp 10»).
// Bốn loại, mỗi loại một cặp dựng / vẽ theo giây t và các mốc lời (d.hoat.moc), không ngẫu nhiên ⇒ bộ quay video và trang xem trong app ra cùng một hình:
//   keo-co      hai nguyên tử kéo co cặp electron dùng chung: lệch về bên χ lớn (phân cực) · đứng giữa (không phân cực) · về hẳn một bên (ion)
//   thang-delta thang hiệu độ âm điện Δχ: ba vùng theo mốc 0,4 và 1,7 Thầy viết trên bảng; ví dụ: χ hai nguyên tố ⇒ phép trừ ⇒ kim chạy tới vùng
//   lewis       công thức electron O₂ / CO₂: electron góp chung vào giữa ⇒ nét gạch; CO₂: hai liên kết phân cực ngược chiều triệt tiêu
//   obitan      liên kết σ (xen phủ trục: s–s, s–p, p–p) và π (xen phủ bên hai AO p); dem-lk: nối đơn / đôi / ba có mấy σ, mấy π
'use strict'
;(function () {
  const VANG = '#ffd27a', NGOC = '#6ee7b7', XANH = '#8fb6ff', HONG = '#fda4af', CHU = '#eef3f4', MO = '#9fb1b7', DAY = '#5d7078'
  const W0 = () => (typeof COT !== 'undefined' && COT.w) || 828
  const r2 = (x) => Math.round(x * 100) / 100
  const so = (x) => String(x).replace('.', ',')
  const dam4 = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  const chu = (cha, at, s) => { const e = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 800, ...at }, cha); e.textContent = s; return e }
  /** hiện bật lò xo (mờ ⇒ rõ + nảy nhẹ) cho phần tử SVG đặt sẵn ở (x, y) */
  const nay = (e, t, t0, x, y, s0 = 0.6) => { const p = t0 == null ? 0 : lo(t - t0, 2.4, 0.55); e.setAttribute('opacity', r2(kep(p * 1.6))); e.setAttribute('transform', `translate(${x},${y}) scale(${r2(s0 + (1 - s0) * p)})`); return p }
  const hienHtml = (e, t, t0, dy = 14) => { const p = t0 == null ? 0 : lo(t - t0, 2.2, 0.55); e.style.opacity = r2(kep(p * 1.4)); e.style.transform = `translateY(${r2((1 - p) * dy)}px)`; return p }
  /** mũi tên ngang: gốc (0,0), dài L, hướng h = ±1 */
  function muiTen(cha, mau) {
    const g = svgEl('g', { opacity: 0 }, cha)
    const l = svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: mau, 'stroke-width': 9, 'stroke-linecap': 'round' }, g)
    const dau = svgEl('path', { d: 'M0,-15 L22,0 L0,15 Z', fill: mau }, g)
    return { g, l, dau, dat(x, y, L, h) { l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', r2(x + h * L)); l.setAttribute('y2', y); dau.setAttribute('transform', `translate(${r2(x + h * L)},${y}) scale(${h},1)`) } }
  }
  function chip(goc, cls) { const e = tao('div', `lk4-chip ${cls || ''}`, goc); e.style.opacity = 0; return e }

  // ═════════ A) KÉO CO: cặp electron dùng chung giữa hai nguyên tử ═════════
  // p: { trai: { ky, nhan }, phai: { ky, nhan }, manh: 'trai' | 'phai' | null, kieu: 'phan-cuc' | 'khong-phan-cuc' | 'ion', so: '>' | '=', ket }
  // moc: hien · keo (mũi tên lực kéo) · so (dấu so sánh) · lech (cặp electron di chuyển) · delta (δ⁺ / δ⁻ hoặc ion) · ket (thẻ kết luận)
  function dungKeo(d, goc) {
    goc.classList.add('lk4')
    const W = W0(), H = d.hoat.cao, p = d.hoat.p, y = Math.round(H * 0.36), xL = 214, xR = W - 214, R = 60
    const svg = svgEl('svg', { width: W, height: H - 96, viewBox: `0 0 ${W} ${H - 96}` }, goc)
    const day = svgEl('line', { x1: xL, y1: y, x2: xR, y2: y, stroke: DAY, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, svg)
    const mL = muiTen(svg, VANG), mR = muiTen(svg, XANH)
    const nt = (mau, ky) => { const g = svgEl('g', { opacity: 0 }, svg); svgEl('circle', { r: R, fill: '#14232a', stroke: mau, 'stroke-width': 6 }, g); chu(g, { 'font-size': 50, fill: mau }, ky); return g }
    const A = nt(VANG, p.trai.ky), B = nt(XANH, p.phai.ky)
    const nA = chu(svg, { x: xL, y: y + R + 46, 'font-size': 38, fill: VANG, opacity: 0 }, p.trai.nhan), nB = chu(svg, { x: xR, y: y + R + 46, 'font-size': 38, fill: XANH, opacity: 0 }, p.phai.nhan)
    const sS = chu(svg, { 'font-size': 64, fill: CHU, opacity: 0 }, p.so || '')
    const cap = svgEl('g', { opacity: 0 }, svg)
    const vien = svgEl('ellipse', { rx: 44, ry: 30, fill: 'rgba(255,210,122,.14)', stroke: VANG, 'stroke-width': 3, 'stroke-dasharray': '7 6' }, cap)
    svgEl('circle', { cx: -13, cy: 0, r: 8, fill: CHU }, cap); svgEl('circle', { cx: 13, cy: 0, r: 8, fill: CHU }, cap)
    const nhanCap = chu(svg, { 'font-size': 26, fill: MO, opacity: 0 }, 'cặp electron dùng chung')
    const dA = chu(svg, { 'font-size': 44, fill: VANG, opacity: 0 }, ''), dB = chu(svg, { 'font-size': 44, fill: XANH, opacity: 0 }, '')
    const ket = chip(goc, 'ket'); ket.innerHTML = dam4(p.ket)
    d.k4 = { W, y, xL, xR, R, day, mL, mR, A, B, nA, nB, sS, cap, vien, nhanCap, dA, dB, ket }
    d.hoatNeo = { capE: vien, ket }
    d.lap = [{ k: 'ket', e: ket, mau: VANG, n: 14 }]
  }
  function veKeo(d, t) {
    const K = d.k4, p = d.hoat.p, m = d.hoat.moc, ion = p.kieu === 'ion', huong = p.manh === 'trai' ? -1 : p.manh === 'phai' ? 1 : 0
    // lực kéo: kéo giằng co (rung tắt dần) ngay khi hiện mũi tên
    const tk = m.keo != null ? t - m.keo : -1, rung = tk > 0 ? 7 * Math.sin(tk * 9) * ex(-tk * 1.3) : 0
    // ion: hai nguyên tử tách xa hơn một chút khi cặp electron về hẳn một bên
    const pL = m.lech != null ? eInOut(tien(t, m.lech, 1.2)) : 0, tach = ion ? 26 * pL : 0
    const xA = K.xL - rung - tach, xB = K.xR + rung + tach
    nay(K.A, t, m.hien, r2(xA), K.y); nay(K.B, t, m.hien + 0.15, r2(xB), K.y)
    K.nA.setAttribute('opacity', r2(tien(t, m.hien + 0.3, 0.3))); K.nB.setAttribute('opacity', r2(tien(t, m.hien + 0.4, 0.3)))
    const pd = tien(t, m.hien + 0.2, 0.5)
    K.day.setAttribute('x1', r2(xA + K.R)); K.day.setAttribute('x2', r2(xA + K.R + pd * (xB - xA - 2 * K.R))); K.day.setAttribute('opacity', r2(pd * (1 - (ion ? tien(t, m.lech + 0.7, 0.4) : 0))))
    // mũi tên lực kéo: bên χ lớn dài hơn; ngang sức ⇒ bằng nhau
    const pk = m.keo != null ? lo(t - m.keo, 2.2, 0.6) : 0, dai = (ben) => (huong === 0 ? 86 : (ben === p.manh ? 124 : 58)) * pk
    K.mL.g.setAttribute('opacity', r2(kep(pk * 1.5))); K.mR.g.setAttribute('opacity', r2(kep(pk * 1.5)))
    K.mL.dat(r2(xA - K.R - 14), K.y, dai('trai'), -1); K.mR.dat(r2(xB + K.R + 14), K.y, dai('phai'), 1)
    // dấu so sánh giữa hai nhãn
    if (p.so) nay(K.sS, t, m.so, K.W / 2, K.y + K.R + 46)
    // cặp electron: giữa dây ⇒ lệch về bên mạnh (phân cực) / đứng yên giữa (không phân cực) / về hẳn nguyên tử mạnh (ion)
    const giua = (xA + xB) / 2
    let xc = giua
    if (huong !== 0) xc = ion ? lerp(giua, huong < 0 ? xA + K.R + 8 : xB - K.R - 8, pL) : lerp(giua, giua + huong * 88, pL)
    else if (m.lech != null && t >= m.lech) xc = giua + 9 * Math.sin((t - m.lech) * 11) * ex(-(t - m.lech) * 1.6) // lắc rồi đứng yên chính giữa
    const pc = tien(t, m.hien + 0.6, 0.4)
    K.cap.setAttribute('opacity', r2(pc)); K.cap.setAttribute('transform', `translate(${r2(xc)},${K.y})`)
    K.vien.setAttribute('stroke', ion && pL > 0.9 ? (huong < 0 ? VANG : XANH) : VANG)
    K.nhanCap.setAttribute('x', r2(xc)); K.nhanCap.setAttribute('y', K.y - 58); K.nhanCap.setAttribute('opacity', r2(pc * (1 - tien(t, m.keo ?? 1e9, 0.4) * 0.45) * (1 - tien(t, m.lech ?? 1e9, 0.4))))
    // δ⁻ ở bên hút cặp electron, δ⁺ bên kia · ion: điện tích − / +
    if (m.delta != null && huong !== 0) {
      const manhA = huong < 0
      K.dA.textContent = ion ? (manhA ? '−' : '+') : (manhA ? 'δ⁻' : 'δ⁺'); K.dB.textContent = ion ? (manhA ? '+' : '−') : (manhA ? 'δ⁺' : 'δ⁻')
      nay(K.dA, t, m.delta, r2(xA + K.R * 0.78), K.y - K.R - 18); nay(K.dB, t, m.delta + 0.2, r2(xB - K.R * 0.78), K.y - K.R - 18)
    } else { K.dA.setAttribute('opacity', 0); K.dB.setAttribute('opacity', 0) }
    hienHtml(K.ket, t, m.ket)
  }

  // ═════════ B) THANG Δχ ═════════
  // p: { max, a: [kí hiệu, χ], b: [kí hiệu, χ], ky (công thức chất), vung: true (giới thiệu ba vùng theo mốc v1 v2 v3) }
  // Thang chia theo mốc Thầy dạy (0,4 và 1,7) — mỗi vùng một đoạn đọc rõ trên điện thoại (không theo tỉ lệ), vạch có ghi số.
  const VUNG = [[0, 0.4, NGOC, 'Không phân cực'], [0.4, 1.7, VANG, 'Phân cực'], [1.7, null, HONG, 'Ion']]
  function dungThang(d, goc) {
    goc.classList.add('lk4')
    const W = W0(), H = d.hoat.cao, p = d.hoat.p
    const x0 = 64, x1 = W - 64, phan = [0.26, 0.44, 0.30], xv = [x0, x0 + phan[0] * (x1 - x0), x0 + (phan[0] + phan[1]) * (x1 - x0), x1]
    const viTri = (v) => { const max = p.max || 3; if (v <= 0.4) return lerp(xv[0], xv[1], v / 0.4); if (v <= 1.7) return lerp(xv[1], xv[2], (v - 0.4) / 1.3); return lerp(xv[2], xv[3], Math.min(1, (v - 1.7) / (max - 1.7))) }
    // phần trên: χ hai nguyên tố ⇒ phép trừ
    const tren = tao('div', 'lk4-tinh', goc)
    let A = null, B = null, pt = null
    if (p.a) {
      tren.innerHTML = `${p.ky ? `<div class="lk4-ky">${dam4(p.ky)}</div>` : ''}<div class="lk4-chi"><span class="a"><b>${p.a[0]}</b> : ${so(p.a[1])}</span><span class="b"><b>${p.b[0]}</b> : ${so(p.b[1])}</span></div>` +
        `<div class="lk4-pt"><i>Δχ</i><i>=</i><i>${so(p.a[1])}</i><i>−</i><i>${so(p.b[1])}</i><i>=</i><i class="kq">${so(Math.round((p.a[1] - p.b[1]) * 100) / 100)}</i></div>`
      A = tren.querySelector('.a'); B = tren.querySelector('.b'); pt = [...tren.querySelectorAll('.lk4-pt i')]
      for (const e of [A, B, ...pt]) e.style.opacity = 0
    }
    const yT = H - 150
    const svg = svgEl('svg', { width: W, height: 160, viewBox: `0 ${yT - 70} ${W} 160`, class: 'lk4-thang' }, goc)
    const vung = VUNG.map(([a, b, mau, ten], i) => {
      const g = svgEl('g', {}, svg)
      const r = svgEl('rect', { x: xv[i] + 2, y: yT, width: xv[i + 1] - xv[i] - 4, height: 34, rx: 10, fill: mau, opacity: 0.16 }, g)
      const nh = chu(g, { x: (xv[i] + xv[i + 1]) / 2, y: yT - 46, 'font-size': i === 0 ? 24 : 28, fill: mau, opacity: 0.35 }, ten)
      return { g, r, nh, a, b }
    })
    const vach = [[0, '0'], [0.4, '0,4'], [1.7, '1,7']].map(([v, s]) => { const x = viTri(v); svgEl('line', { x1: x, y1: yT - 4, x2: x, y2: yT + 40, stroke: CHU, 'stroke-width': 3, opacity: 0.7 }, svg); return chu(svg, { x, y: yT + 62, 'font-size': 28, fill: CHU }, s) })
    const kim = svgEl('g', { opacity: 0 }, svg)
    svgEl('path', { d: 'M0,-6 L-14,-30 L14,-30 Z', fill: CHU }, kim); svgEl('line', { x1: 0, y1: -6, x2: 0, y2: 40, stroke: CHU, 'stroke-width': 4 }, kim)
    const ket = chip(goc, 'ket'); ket.innerHTML = dam4(p.ket || '')
    d.k4 = { yT, tren, A, B, pt, vung, vach, kim, viTri, ket, gt: p.a ? Math.round((p.a[1] - p.b[1]) * 100) / 100 : null }
    d.hoatNeo = { thang: svg, ket, pt: tren }
    d.lap = p.a ? [{ k: 'kq', e: pt[6], mau: VANG, n: 12 }, { k: 'ket', e: ket, mau: VANG, n: 14 }] : [{ k: 'ket', e: ket, mau: VANG, n: 14 }]
  }
  function veThang(d, t) {
    const K = d.k4, m = d.hoat.moc
    // ba vùng: giới thiệu lần lượt (v1, v2, v3) hoặc hiện cùng lúc
    K.vung.forEach((v, i) => {
      const tv = m['v' + (i + 1)] ?? m.hien, pv = tien(t, tv, 0.5), dang = m['v' + (i + 1)] != null && t >= tv && t < (m['v' + (i + 2)] ?? (m.ket ?? 1e9))
      v.r.setAttribute('opacity', r2(0.16 + pv * (dang ? 0.7 : 0.22)))
      v.nh.setAttribute('opacity', r2(0.35 + 0.65 * pv))
    })
    if (K.A) {
      hienHtml(K.A, t, m.a); hienHtml(K.B, t, m.b)
      const tt = [m.tinh, m.tinh, m.tinh + 0.35, m.tinh + 0.6, m.tinh + 0.85, m.kq - 0.2, m.kq]
      K.pt.forEach((e, i) => hienHtml(e, t, tt[i], 10))
      // kim chạy từ 0 tới giá trị rồi nảy; vùng chứa giá trị sáng hẳn
      if (m.kim != null) {
        const pk = t < m.kim ? 0 : lo(t - m.kim, 1.6, 0.45), x = K.viTri(K.gt * pk)
        K.kim.setAttribute('opacity', r2(tien(t, m.kim - 0.2, 0.25))); K.kim.setAttribute('transform', `translate(${r2(x)},${K.yT})`)
        const iV = K.gt <= 0.4 ? 0 : K.gt <= 1.7 ? 1 : 2, sang = tien(t, m.kim + 0.9, 0.4)
        K.vung.forEach((v, i) => { if (i === iV && sang > 0) v.r.setAttribute('opacity', r2(0.16 + 0.7 * sang)); else if (sang > 0) v.r.setAttribute('opacity', r2(0.16 * (1 - sang * 0.4))) })
      }
    }
    hienHtml(K.ket, t, m.ket)
  }

  // ═════════ C) CÔNG THỨC ELECTRON (Lewis) O₂ / CO₂ ═════════
  // p: { ct: 'O2' | 'CO2', luc: true (CO₂: hai liên kết phân cực ngược chiều ⇒ phân tử không phân cực), ket }
  // moc: hien · chung (electron góp vào giữa) · gach (cặp chung ⇒ nét gạch) · luc · triet · ket
  function dungLewis(d, goc) {
    goc.classList.add('lk4')
    const W = W0(), H = d.hoat.cao, p = d.hoat.p, co2 = p.ct === 'CO2', y = co2 && p.luc ? 170 : Math.round((H - 96) * 0.45)
    const svg = svgEl('svg', { width: W, height: H - 96, viewBox: `0 0 ${W} ${H - 96}` }, goc)
    const kc = co2 ? 230 : 250, xs = co2 ? [W / 2 - kc, W / 2, W / 2 + kc] : [W / 2 - kc / 2, W / 2 + kc / 2], ky = co2 ? ['O', 'C', 'O'] : ['O', 'O'], mauNt = co2 ? [HONG, XANH, HONG] : [VANG, XANH]
    const nt = xs.map((x, i) => { const g = svgEl('g', { opacity: 0 }, svg); chu(g, { 'font-size': 76, fill: mauNt[i] }, ky[i]); return { g, x } })
    // electron: mỗi chấm có chỗ đầu (quanh nguyên tử) và chỗ cuối (cặp chung ở giữa hai nguyên tử nếu là electron góp chung)
    const e = []
    const cham = (x, y0, mau, xc, yc) => { const c = svgEl('circle', { r: 8, fill: mau, opacity: 0 }, svg); e.push({ c, a: [x, y0], b: [xc ?? x, yc ?? y0], chung: xc != null }) }
    const capRieng = (x, mau, ben) => { // hai cặp riêng trên / dưới (O)
      cham(x - 12, y - 58, mau); cham(x + 12, y - 58, mau); cham(x - 12, y + 58, mau); cham(x + 12, y + 58, mau)
      if (ben) { cham(x + ben * 54, y - 12, mau); cham(x + ben * 54, y + 12, mau) }
    }
    const lienKet = []
    for (let k = 0; k + 1 < xs.length; k++) {
      const xa = xs[k], xb = xs[k + 1], xm = (xa + xb) / 2, ma = mauNt[k], mb = mauNt[k + 1]
      // mỗi bên góp 2 electron ⇒ 2 cặp chung xếp dọc ở giữa
      cham(xa + 50, y - 16, ma, xm - 11, y - 16); cham(xa + 50, y + 16, ma, xm - 11, y + 16)
      cham(xb - 50, y - 16, mb, xm + 11, y - 16); cham(xb - 50, y + 16, mb, xm + 11, y + 16)
      const g = svgEl('g', { opacity: 0 }, svg)
      svgEl('line', { x1: xa + 46, y1: y - 13, x2: xb - 46, y2: y - 13, stroke: CHU, 'stroke-width': 8, 'stroke-linecap': 'round' }, g)
      svgEl('line', { x1: xa + 46, y1: y + 13, x2: xb - 46, y2: y + 13, stroke: CHU, 'stroke-width': 8, 'stroke-linecap': 'round' }, g)
      lienKet.push(g)
    }
    if (co2) { capRieng(xs[0], HONG, 0); capRieng(xs[2], HONG, 0); cham(xs[0] - 54, y - 12, HONG); cham(xs[0] - 54, y + 12, HONG); cham(xs[2] + 54, y - 12, HONG); cham(xs[2] + 54, y + 12, HONG) }
    else { capRieng(xs[0], VANG, 0); capRieng(xs[1], XANH, 0) }
    // CO₂: mỗi liên kết C=O phân cực về phía O (χ lớn) ⇒ hai mũi tên ngược chiều, bằng nhau ⇒ triệt tiêu
    let luc = null
    if (co2 && p.luc) {
      const yl = y + 120, mT = muiTen(svg, VANG), mP = muiTen(svg, VANG)
      const tong = chu(svg, { 'font-size': 40, fill: NGOC, opacity: 0 }, 'tổng = 0')
      const dd = [chu(svg, { 'font-size': 38, fill: HONG, opacity: 0 }, 'δ⁻'), chu(svg, { 'font-size': 38, fill: XANH, opacity: 0 }, 'δ⁺'), chu(svg, { 'font-size': 38, fill: HONG, opacity: 0 }, 'δ⁻')]
      luc = { yl, mT, mP, tong, dd }
    }
    const ket = chip(goc, 'ket'); ket.innerHTML = dam4(p.ket || '')
    d.k4 = { y, nt, e, lienKet, luc, ket, xs }
    d.hoatNeo = { lk: lienKet[0], ket }
    d.lap = [{ k: 'gach', e: lienKet[0], mau: VANG, n: 12 }, { k: 'ket', e: ket, mau: VANG, n: 14 }]
  }
  function veLewis(d, t) {
    const K = d.k4, m = d.hoat.moc
    K.nt.forEach((n, i) => nay(n.g, t, m.hien + i * 0.15, n.x, K.y))
    const pc = m.chung != null ? eInOut(tien(t, m.chung, 1.1)) : 0, pg = m.gach != null ? tien(t, m.gach, 0.5) : 0
    K.e.forEach((c, i) => {
      const x = c.chung ? lerp(c.a[0], c.b[0], pc) : c.a[0], y = c.chung ? lerp(c.a[1], c.b[1], pc) : c.a[1]
      c.c.setAttribute('cx', r2(x)); c.c.setAttribute('cy', r2(y))
      c.c.setAttribute('opacity', r2(tien(t, m.hien + 0.4 + (i % 6) * 0.05, 0.3) * (c.chung ? 1 - pg : 1)))
    })
    K.lienKet.forEach((g) => g.setAttribute('opacity', r2(pg)))
    if (K.luc) {
      const L = K.luc, pl = m.luc != null ? lo(t - m.luc, 2.2, 0.6) : 0, pt2 = m.triet != null ? eInOut(tien(t, m.triet, 0.9)) : 0
      L.mT.g.setAttribute('opacity', r2(kep(pl * 1.5) * (1 - pt2 * 0.7))); L.mP.g.setAttribute('opacity', r2(kep(pl * 1.5) * (1 - pt2 * 0.7)))
      // mũi tên đặt dưới mỗi liên kết, từ C chỉ ra O; khi triệt tiêu: hai mũi tên co về giữa
      const dai = 150 * pl * (1 - pt2), xc = K.xs[1]
      L.mT.dat(r2(xc - 20), L.yl, dai, -1); L.mP.dat(r2(xc + 20), L.yl, dai, 1)
      L.dd.forEach((e, i) => nay(e, t, m.luc != null ? m.luc - 0.3 + i * 0.1 : null, K.xs[i], K.y - 104))
      nay(L.tong, t, m.triet != null ? m.triet + 0.6 : null, K.xs[1], L.yl + 92)
    }
    hienHtml(K.ket, t, m.ket)
  }

  // ═════════ D) XEN PHỦ AO: liên kết σ (trục) và π (bên) ═════════
  // moc: hien · s (AO s) · p (AO p) · ss · sp · pp (ba kiểu xen phủ trục ⇒ σ) · pi (xen phủ bên ⇒ π) · ket
  const ellAO = (cha, cx, cy, rx, ry, mau) => svgEl('ellipse', { cx, cy, rx, ry, fill: 'rgba(253,164,175,.08)', stroke: mau, 'stroke-width': 4 }, cha)
  /** AO p nằm ngang (hai thuỳ dọc trục x) hoặc dựng đứng (dọc trục y), tâm (0,0) */
  function aoP(cha, mau, dung) { const g = svgEl('g', {}, cha); if (dung) { ellAO(g, 0, -36, 21, 36, mau); ellAO(g, 0, 36, 21, 36, mau) } else { ellAO(g, -38, 0, 38, 21, mau); ellAO(g, 38, 0, 38, 21, mau) } return g }
  function aoS(cha, mau) { const g = svgEl('g', {}, cha); svgEl('circle', { r: 34, fill: 'rgba(143,182,255,.08)', stroke: mau, 'stroke-width': 4 }, g); return g }
  function dungObitan(d, goc) {
    goc.classList.add('lk4')
    const W = W0(), H = d.hoat.cao
    const svg = svgEl('svg', { width: W, height: H - 96, viewBox: `0 0 ${W} ${H - 96}` }, goc)
    const xC = 300, hang = [92, 192, 292], ten = ['s – s', 's – p', 'p – p']
    // hàng mẫu AO s, AO p (đầu cảnh)
    const mauS = svgEl('g', { opacity: 0 }, svg); const s0 = aoS(mauS, XANH); s0.setAttribute('transform', 'translate(0,0)'); chu(mauS, { x: 0, y: 64, 'font-size': 28, fill: XANH }, 'AO s')
    const mauP = svgEl('g', { opacity: 0 }, svg); aoP(mauP, HONG, false); chu(mauP, { x: 0, y: 64, 'font-size': 28, fill: HONG }, 'AO p')
    // ba hàng xen phủ trục: hai AO trượt vào nhau dọc trục, vùng xen phủ sáng
    const truc = hang.map((y, i) => {
      const g = svgEl('g', { opacity: 0 }, svg)
      svgEl('line', { x1: 40, y1: y, x2: 560, y2: y, stroke: DAY, 'stroke-width': 2, 'stroke-dasharray': '6 8' }, g)
      const a = i === 2 ? aoP(g, HONG, false) : aoS(g, XANH), b = i === 0 ? aoS(g, XANH) : aoP(g, HONG, false)
      const vung = svgEl('ellipse', { cx: xC, cy: y, rx: 14, ry: 20, fill: VANG, opacity: 0 }, g)
      const nh = chu(g, { x: 660, y, 'font-size': 32, fill: CHU }, ten[i])
      return { g, a, b, vung, nh, y, ra: i === 2 ? 76 : 34, rb: i === 0 ? 34 : 76 }
    })
    const nhSigma = chu(svg, { x: 680, y: 40, 'font-size': 34, fill: VANG, opacity: 0 }, 'σ: xen phủ trục')
    // π: hai AO p dựng đứng cạnh nhau, xen phủ ở phía trên và phía dưới trục
    const yPi = 420, pi = svgEl('g', { opacity: 0 }, svg)
    svgEl('line', { x1: 140, y1: yPi, x2: 460, y2: yPi, stroke: DAY, 'stroke-width': 2, 'stroke-dasharray': '6 8' }, pi)
    const pa = aoP(pi, HONG, true), pb = aoP(pi, HONG, true)
    const vTren = svgEl('ellipse', { cx: 300, cy: yPi - 38, rx: 9, ry: 26, fill: VANG, opacity: 0 }, pi), vDuoi = svgEl('ellipse', { cx: 300, cy: yPi + 38, rx: 9, ry: 26, fill: VANG, opacity: 0 }, pi)
    const nhPi = chu(svg, { x: 660, y: yPi, 'font-size': 34, fill: VANG, opacity: 0 }, 'π: xen phủ bên')
    const ket = chip(goc, 'ket'); ket.innerHTML = dam4(d.hoat.p?.ket || '')
    d.k4 = { mauS, mauP, truc, nhSigma, pi, pa, pb, vTren, vDuoi, nhPi, yPi, xC, ket, W }
    d.hoatNeo = { sigma: nhSigma, pi: nhPi, ket }
    d.lap = [{ k: 'ss', e: truc[0].vung, tre: 1.1, mau: VANG, n: 10 }, { k: 'sp', e: truc[1].vung, tre: 1.1, mau: VANG, n: 10 }, { k: 'pp', e: truc[2].vung, tre: 1.1, mau: VANG, n: 10 }, { k: 'pi', e: vTren, tre: 1.1, mau: VANG, n: 10 }]
  }
  function veObitan(d, t) {
    const K = d.k4, m = d.hoat.moc
    // AO s, AO p mẫu: hiện ở đầu, rút đi khi bắt đầu xen phủ
    const di = tien(t, m.ss ?? 1e9, 0.5)
    nay(K.mauS, t, m.s, 200, 240); nay(K.mauP, t, m.p, 470, 240)
    if (di > 0) { K.mauS.setAttribute('opacity', r2(1 - di)); K.mauP.setAttribute('opacity', r2(1 - di)) }
    K.nhSigma.setAttribute('opacity', r2(tien(t, m.ss, 0.4)))
    for (const [i, k] of ['ss', 'sp', 'pp'].entries()) {
      const h = K.truc[i], tm = m[k]
      if (tm == null) { h.g.setAttribute('opacity', 0); continue }
      h.g.setAttribute('opacity', r2(tien(t, tm - 0.3, 0.35)))
      // hai AO trượt vào nhau dọc trục: từ cách nhau 150 px tới lấn vào nhau 30 px, chỗ xen phủ ở chính giữa (xC)
      const o = lerp(-150, 30, eInOut(tien(t, tm, 1.1)))
      h.a.setAttribute('transform', `translate(${r2(K.xC + o / 2 - h.ra)},${h.y})`)
      h.b.setAttribute('transform', `translate(${r2(K.xC - o / 2 + h.rb)},${h.y})`)
      h.vung.setAttribute('opacity', r2(0.85 * tien(t, tm + 0.9, 0.3)))
    }
    // π
    if (m.pi != null) {
      K.pi.setAttribute('opacity', r2(tien(t, m.pi - 0.3, 0.35))); K.nhPi.setAttribute('opacity', r2(tien(t, m.pi, 0.4)))
      const pv = eInOut(tien(t, m.pi, 1.1)), kc = lerp(190, 40, pv)
      K.pa.setAttribute('transform', `translate(${r2(K.xC - kc / 2)},${K.yPi})`); K.pb.setAttribute('transform', `translate(${r2(K.xC + kc / 2)},${K.yPi})`)
      const sv = r2(0.85 * tien(t, m.pi + 0.9, 0.3)); K.vTren.setAttribute('opacity', sv); K.vDuoi.setAttribute('opacity', sv)
    }
    hienHtml(K.ket, t, m.ket)
  }

  // ═════════ E) NỐI ĐƠN / ĐÔI / BA: mấy σ, mấy π ═════════
  // moc: don · doi · ba (hiện hàng) · kq1 · kq2 · kq3 (hiện số σ / π) · ket. Nét thứ nhất của mọi liên kết là σ (vàng), các nét thêm là π (hồng).
  function dungDemLk(d, goc) {
    goc.classList.add('lk4')
    const W = W0(), H = d.hoat.cao
    const svg = svgEl('svg', { width: W, height: H - 96, viewBox: `0 0 ${W} ${H - 96}` }, goc)
    const hang = [[1, 'Liên kết đơn', '1σ'], [2, 'Liên kết đôi', '1σ + 1π'], [3, 'Liên kết ba', '1σ + 2π']].map(([n, ten, kq], i) => {
      const y = 92 + i * 150, g = svgEl('g', { opacity: 0 }, svg)
      chu(g, { x: 92, y, 'font-size': 52, fill: CHU }, 'A'); chu(g, { x: 332, y, 'font-size': 52, fill: CHU }, 'B')
      const net = []; for (let k = 0; k < n; k++) { const yy = y + (k - (n - 1) / 2) * 20; net.push(svgEl('line', { x1: 128, y1: yy, x2: 296, y2: yy, stroke: k === 0 ? VANG : HONG, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0 }, g)) }
      chu(g, { x: 212, y: y + 54, 'font-size': 26, fill: MO }, ten)
      const k2 = chu(g, { 'font-size': 50, fill: VANG, opacity: 0 }, kq)
      return { g, net, k2, y }
    })
    const ket = chip(goc, 'ket'); ket.innerHTML = dam4(d.hoat.p?.ket || '')
    d.k4 = { hang, ket }
    d.hoatNeo = { don: hang[0].k2, doi: hang[1].k2, ba: hang[2].k2, ket }
    d.lap = [{ k: 'don', e: hang[0].k2, tre: 0.9, mau: VANG }, { k: 'doi', e: hang[1].k2, tre: 0.9, mau: VANG }, { k: 'ba', e: hang[2].k2, tre: 0.9, mau: VANG }]
  }
  function veDemLk(d, t) {
    const K = d.k4, m = d.hoat.moc
    ;['don', 'doi', 'ba'].forEach((k, i) => {
      const h = K.hang[i], tm = m[k]
      h.g.setAttribute('opacity', r2(tm == null ? 0 : tien(t, tm - 0.4, 0.35)))
      h.net.forEach((l, j) => l.setAttribute('opacity', r2(tm == null ? 0 : tien(t, tm + j * 0.3, 0.25))))
      if (tm != null) nay(h.k2, t, m['kq' + (i + 1)] ?? tm + 0.3 + h.net.length * 0.3, 590, h.y) // kết quả σ / π hiện đúng lúc Thầy nói (kq1..kq3), không thì ngay sau nét
    })
    hienHtml(K.ket, t, m.ket)
  }

  Object.assign(HOAT, { 'keo-co': [dungKeo, veKeo], 'thang-delta': [dungThang, veThang], lewis: [dungLewis, veLewis], obitan: [dungObitan, veObitan], 'dem-lk': [dungDemLk, veDemLk] })
})()
