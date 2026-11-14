// VIDEO BÀI GIẢNG — HOẠT HOẠ TỰ DO THEO DỮ LIỆU «tu-do» (thầy 14/11 «tất cả phải có hoạt hoạ đầy đủ như video K12, chỉnh sửa để văn phòng làm tự động»).
// Văn phòng KHÔNG viết mã: soạn hoạt hoạ của cảnh bằng DỮ LIỆU trong cấu hình (p.phanTu + p.buoc), mốc theo lời (moc). Mô-đun này vẽ đúng, tất định
// theo giây t (bộ quay video và trang xem trong app ra cùng một hình). Đặt chỗ theo LƯỚI 12 cột × hàng 56 px trong cột minh hoạ ⇒ không đè, không tràn.
//
// p.phanTu[]: { id, kieu, o, h, r, c, … }   o = cột trái (0–11), h = hàng trên (0…), r = số cột rộng (1–12), c = số hàng cao (≥ 1)
//   chu       { chu, co: 'lon'|'vua'|'nho', mau, nen: true|false, ct: true (tự xuống chỉ số công thức: H2O ⇒ H₂O, SO4^2- ⇒ SO₄²⁻) } — **đậm** được
//   nguyen-tu { ky, mau, nhan? }                                  vòng nguyên tử (kí hiệu ở giữa, nhãn nhỏ phía dưới)
//   lien-ket  { tu: id, den: id, bac: 1|2|3, mau? }               nét liên kết giữa hai phần tử (vẽ dần khi hiện)
//   mui-ten   { tu: id, den: id, cong: 0 (thẳng) | ±1 (cong), nhan?, mau? }
//   so        { gt: số, dv?: 'mol', ct?: true, mau? }             con số (động tác «dem» chạy từ số cũ tới số mới)
//   khung     { quanh: [id, …], mau? }                            khung sáng bao các phần tử
//   cot       { hang: [[trái, phải], …], tieuDe?: [trái, phải], ct: true }   sơ đồ cột dọc (chất | số liệu), từng hàng hiện theo «hien» kèm hang
//   pt        { tu: ['2H2', '+', 'O2', '→', '2H2O'], ct: true }  phương trình: từng ô gọi được bằng id + «.k» (vd «pt1.4»)
// p.buoc[]: { moc: 'tên mốc', lam, id, … }   moc = khoá trong hoat.moc (mốc lời: [dòng, "từ"]) — bộ dựng đổi ra giây
//   hien (hiện bật) · an (mờ đi) · di { o, h } (trượt tới ô lưới) · doi { chu } (đổi chữ / số tại chỗ) · sang (loé sáng + lấp lánh) · nay (nảy)
//   gach (gạch ngang) · dem { gt } (đếm tới số mới) · hang { i } (cot: hiện hàng i)
'use strict'
;(function () {
  const MAU = { vang: '#ffd27a', ngoc: '#6ee7b7', xanh: '#8fb6ff', hong: '#fda4af', tim: '#c4b5fd', trang: '#eef3f4', mo: '#9fb1b7' }
  const W0 = () => (typeof COT !== 'undefined' && COT.w) || 828
  const COT_N = 12, HANG = 56
  const r2 = (x) => Math.round(x * 100) / 100
  const mau = (m, mac) => MAU[m] || (typeof m === 'string' && /^#[0-9a-f]{6}$/i.test(m) ? m : mac || MAU.trang)
  const thoat4 = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' }, SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' }
  /** công thức: chữ số NGAY SAU chữ cái / ngoặc đóng ⇒ chỉ số dưới; «^2-» ⇒ trên. Hệ số đứng đầu (2H2O) giữ nguyên. */
  const hoaCT = (s) => String(s).replace(/\^(\d*[+-])/g, (_, a) => [...a].map((c) => SUP[c] || c).join('')).replace(/([A-Za-z)\]])(\d+)/g, (_, a, b) => a + [...b].map((c) => SUP[c] && SUB[c] ? SUB[c] : c).join(''))
  const dep = (s, ct) => thoat4(ct ? hoaCT(s) : s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  const NS2 = 'http://www.w3.org/2000/svg'
  const sv = (tag, at, cha) => { const e = document.createElementNS(NS2, tag); for (const k in at) e.setAttribute(k, at[k]); if (cha) cha.appendChild(e); return e }
  const hop = (pt) => { const cw = W0() / COT_N; return { x: pt.o * cw, y: pt.h * HANG, w: (pt.r || 4) * cw, h: (pt.c || 1) * HANG } }

  function dung(d, goc) {
    goc.classList.add('lk5')
    const p = d.hoat.p || {}, W = W0(), H = d.hoat.cao
    const svg = sv('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'lk5-svg' }, goc)
    const lopNoi = sv('g', {}, svg)
    const pt = new Map(), ds = []
    for (const e of p.phanTu || []) {
      const o = { ...e, mau: mau(e.mau, e.kieu === 'nguyen-tu' ? MAU.vang : undefined) }
      if (e.kieu === 'lien-ket' || e.kieu === 'mui-ten') {
        const g = sv('g', { opacity: 0 }, lopNoi); o.g = g; o.duong = []
        const n = e.kieu === 'lien-ket' ? Math.min(3, Math.max(1, e.bac || 1)) : 1
        for (let k = 0; k < n; k++) o.duong.push(sv(e.kieu === 'mui-ten' && e.cong ? 'path' : 'line', { stroke: o.mau, 'stroke-width': e.kieu === 'mui-ten' ? 6 : 7, 'stroke-linecap': 'round', fill: 'none' }, g))
        if (e.kieu === 'mui-ten') { o.dau = sv('path', { d: 'M0,-11 L18,0 L0,11 Z', fill: o.mau }, g); if (e.nhan) { o.chu = document.createElement('div'); o.chu.className = 'lk5-nhan'; o.chu.innerHTML = dep(e.nhan, true); goc.appendChild(o.chu) } }
      } else {
        const el = document.createElement('div'); el.className = `lk5-pt lk5-${e.kieu}`; el.style.setProperty('--m', o.mau)
        const b = hop(e), le = e.kieu === 'chu' || e.kieu === 'so' ? 5 : 0 // thẻ chữ / số chừa khe 5 px trên dưới ⇒ hai hàng liền nhau không dính
        o.b0 = b; Object.assign(el.style, { left: `${b.x}px`, top: `${b.y + le}px`, width: `${b.w}px`, height: `${b.h - 2 * le}px` })
        if (e.kieu === 'chu') { el.classList.add(`co-${e.co || 'vua'}`); if (e.nen !== false) el.classList.add('nen'); el.innerHTML = `<span>${dep(e.chu, e.ct)}</span>` }
        else if (e.kieu === 'nguyen-tu') el.innerHTML = `<i>${dep(e.ky, true)}</i>${e.nhan ? `<small>${dep(e.nhan, true)}</small>` : ''}`
        else if (e.kieu === 'so') el.innerHTML = `<span><b>${thoat4(String(e.gt).replace('.', ','))}</b>${e.dv ? ` <small>${thoat4(e.dv)}</small>` : ''}</span>`
        else if (e.kieu === 'pt') { el.innerHTML = (e.tu || []).map((t) => `<em>${dep(t, e.ct !== false)}</em>`).join(''); o.o2 = [...el.querySelectorAll('em')] }
        else if (e.kieu === 'cot') {
          el.innerHTML = `${e.tieuDe ? `<div class="td"><span>${dep(e.tieuDe[0], true)}</span><span>${dep(e.tieuDe[1], true)}</span></div>` : ''}` + (e.hang || []).map((h) => `<div class="h"><span>${dep(h[0], e.ct !== false)}</span><span>${dep(h[1], e.ct !== false)}</span></div>`).join('')
          o.hangEl = [...el.querySelectorAll('.h')]
        } else if (e.kieu === 'khung') el.classList.add('khung')
        el.style.opacity = 0; goc.appendChild(el); o.el = el
      }
      pt.set(e.id, o); ds.push(o)
    }
    // phần tử con của phương trình: «pt1.3»
    for (const o of ds) if (o.o2) o.o2.forEach((em, k) => pt.set(`${o.id}.${k}`, { id: `${o.id}.${k}`, kieu: 'o-pt', el: em, cha: o }))
    // bước: sắp theo giờ; mỗi phần tử nhận các bước của mình
    const m = d.hoat.moc || {}
    const buoc = (p.buoc || []).map((b, i) => ({ ...b, t: m[b.moc], i })).filter((b) => Number.isFinite(b.t)).sort((a, b) => a.t - b.t || a.i - b.i)
    for (const o of pt.values()) o.bc = buoc.filter((b) => b.id === o.id)
    d.k5 = { pt, ds, W, H, svg, daDo: false }
    d.hoatNeo = Object.fromEntries([...pt].filter(([, o]) => o.el || o.g).map(([k, o]) => [k, o.el || o.g]))
    d.lap = buoc.filter((b) => b.lam === 'sang' && pt.get(b.id)?.el).map((b) => ({ k: b.moc, e: pt.get(b.id).el, mau: pt.get(b.id).mau || MAU.vang, n: 12 }))
  }
  /** chữ quá ô ⇒ thu cỡ (đo một lần khi phông đã nạp) */
  function doCo5(K) {
    if (K.daDo || (document.fonts && document.fonts.status !== 'loaded')) return
    K.daDo = true
    for (const o of K.ds) {
      const s = o.el && o.el.querySelector(':scope > span, :scope > i'); if (!s || !o.el.clientWidth) continue
      let k = 1; while (k > 0.5 && (s.scrollWidth > o.el.clientWidth - 8 || s.scrollHeight > o.el.clientHeight + 4)) { k -= 0.08; s.style.fontSize = `${Math.round(k * 100)}%` }
    }
  }
  /** trạng thái một phần tử tại giây t: gộp các bước đã tới */
  function trangThai(o, t) {
    const b0 = hop(o)
    const st = { hien: 0, x: b0.x, y: b0.y, sang: 0, nay: 0, gach: 0, chu: null, gt: o.gt, gtTu: o.gt, tDem: null, hang: -1 }
    let coHien = false
    for (const b of o.bc || []) {
      if (b.t > t) break
      const tau = t - b.t
      if (b.lam === 'hien') { coHien = true; st.hien = lo(tau, 2.3, 0.55) }
      else if (b.lam === 'an') st.hien = st.hien * (1 - tien(t, b.t, 0.4))
      else if (b.lam === 'di') { const c = hop({ ...o, o: b.o ?? o.o, h: b.h ?? o.h }), q = eInOut(tien(t, b.t, 0.9)); st.x = lerp(st.x, c.x, q); st.y = lerp(st.y, c.y, q) }
      else if (b.lam === 'doi') st.chu = { chu: b.chu, q: tien(t, b.t, 0.35) }
      else if (b.lam === 'sang') st.sang = Math.max(st.sang, ex(-tau * 1.6))
      else if (b.lam === 'nay') st.nay = Math.max(st.nay, Math.sin(Math.min(tau, 0.6) / 0.6 * Math.PI) * ex(-tau * 2))
      else if (b.lam === 'gach') st.gach = tien(t, b.t, 0.45)
      else if (b.lam === 'dem') { st.gtTu = st.gt; st.gt = b.gt; st.tDem = b.t }
      else if (b.lam === 'hang') st.hang = Math.max(st.hang, b.i ?? 0)
    }
    if (!coHien && !(o.bc || []).length) st.hien = 0
    return st
  }
  function ve(d, t) {
    const K = d.k5; doCo5(K)
    const tam = new Map()
    for (const o of K.ds) {
      if (!o.el) continue
      const st = trangThai(o, t), el = o.el
      el.style.opacity = r2(kep(st.hien * 1.4))
      const s = 0.82 + 0.18 * kep(st.hien, 0, 1.15) + 0.08 * st.nay
      el.style.transform = o.kieu === 'khung' ? '' : `translate(${r2(st.x - o.b0.x)}px,${r2(st.y - o.b0.y - 10 * st.nay)}px) scale(${r2(s)})`
      el.style.setProperty('--sang', r2(st.sang)); el.style.setProperty('--gach', r2(st.gach))
      if (st.chu && o.chuDang !== st.chu.chu) { const sp = el.querySelector(':scope > span'); if (sp) { sp.innerHTML = dep(st.chu.chu, o.ct); o.chuDang = st.chu.chu } }
      if (o.kieu === 'so') {
        const q = st.tDem != null ? eInOut(tien(t, st.tDem, 1.1)) : 1, v = Number(st.gtTu) + (Number(st.gt) - Number(st.gtTu)) * q
        const so = Number.isInteger(Number(st.gt)) && Number.isInteger(Number(st.gtTu)) ? String(Math.round(v)) : String(Math.round(v * 100) / 100).replace('.', ',')
        const b = el.querySelector('b'); if (b && b.textContent !== so) b.textContent = so
      }
      if (o.hangEl) o.hangEl.forEach((h, i) => { h.style.opacity = i <= st.hang ? r2(tien(t, (o.bc.find((b) => b.lam === 'hang' && b.i === i) || { t: 0 }).t, 0.35)) : 0 })
      const b = hop(o); tam.set(o.id, { x: st.x + b.w / 2, y: st.y + b.h / 2, r: Math.min(b.w, b.h) / 2, hien: st.hien })
    }
    // ô của phương trình: sáng / gạch / nảy riêng từng ô
    for (const o of K.pt.values()) if (o.kieu === 'o-pt') { const st = trangThai({ ...o.cha, bc: o.bc }, t); o.el.style.setProperty('--sang', r2(st.sang)); o.el.style.setProperty('--gach', r2(st.gach)); o.el.style.transform = st.nay ? `translateY(${r2(-10 * st.nay)}px)` : '' }
    // khung: bao các phần tử đã hiện
    for (const o of K.ds) if (o.kieu === 'khung' && o.quanh) {
      const cs = o.quanh.map((id) => { const e = K.pt.get(id); return e && e.el ? hop(e) : null }).filter(Boolean); if (!cs.length) continue
      const x0 = Math.min(...cs.map((c) => c.x)) - 8, y0 = Math.min(...cs.map((c) => c.y)) - 6, x1 = Math.max(...cs.map((c) => c.x + c.w)) + 8, y1 = Math.max(...cs.map((c) => c.y + c.h)) + 6
      Object.assign(o.el.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` })
    }
    // nét nối (liên kết, mũi tên): vẽ dần từ phần tử đầu tới phần tử cuối
    for (const o of K.ds) {
      if (!o.g) continue
      const a = tam.get(o.tu), b = tam.get(o.den), st = trangThai(o, t)
      if (!a || !b || st.hien <= 0) { o.g.setAttribute('opacity', 0); if (o.chu) o.chu.style.opacity = 0; continue }
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, ra = o.kieu === 'lien-ket' ? a.r * 0.62 : a.r * 0.75 + 6, rb = o.kieu === 'lien-ket' ? b.r * 0.62 : b.r * 0.75 + 14
      const x1 = a.x + ux * ra, y1 = a.y + uy * ra, q = kep(st.hien), x2 = lerp(x1, b.x - ux * rb, q), y2 = lerp(y1, b.y - uy * rb, q)
      o.g.setAttribute('opacity', r2(kep(st.hien * 2) * Math.min(a.hien, 1)))
      o.duong.forEach((ln, k) => {
        const lech = (k - (o.duong.length - 1) / 2) * 14, nx = -uy * lech, ny = ux * lech
        if (ln.tagName === 'path') { const cx = (x1 + x2) / 2 - uy * 60 * o.cong, cy = (y1 + y2) / 2 + ux * 60 * o.cong; ln.setAttribute('d', `M${r2(x1)},${r2(y1)} Q${r2(cx)},${r2(cy)} ${r2(x2)},${r2(y2)}`) }
        else { ln.setAttribute('x1', r2(x1 + nx)); ln.setAttribute('y1', r2(y1 + ny)); ln.setAttribute('x2', r2(x2 + nx)); ln.setAttribute('y2', r2(y2 + ny)) }
      })
      if (o.dau) { const goc = (Math.atan2(y2 - (o.cong ? (y1 + y2) / 2 + ux * 60 * o.cong : y1), x2 - (o.cong ? (x1 + x2) / 2 - uy * 60 * o.cong : x1)) * 180) / Math.PI; o.dau.setAttribute('transform', `translate(${r2(x2)},${r2(y2)}) rotate(${r2(goc)})`); o.dau.setAttribute('opacity', q > 0.6 ? 1 : 0) }
      if (o.chu) { Object.assign(o.chu.style, { left: `${r2((x1 + x2) / 2 - uy * (o.cong ? 70 * o.cong : 26))}px`, top: `${r2((y1 + y2) / 2 + ux * (o.cong ? 70 * o.cong : 26))}px` }); o.chu.style.opacity = r2(tien(t, (o.bc[0] || { t: 0 }).t + 0.5, 0.3)) }
    }
  }
  Object.assign(HOAT, { 'tu-do': [dung, ve] })
})()
