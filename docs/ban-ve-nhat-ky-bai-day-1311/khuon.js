// BẢN VẼ «Nhật ký bài dạy» · THƯ VIỆN KHUÔN HOẠT HOẠ (dùng chung cho nhat-ky.html, duyet.html, cho-gan.html).
// Mỗi khuôn dựng một cảnh từ DỮ LIỆU (một mục trong `canh` của kich-ban-*.json). Không thư viện ngoài: SVG + HTML + Web Animations API.
// Hoạt hoạ chỉ đổi transform / opacity (riêng nét khung, mũi tên vẽ bằng stroke-dashoffset, ít phần tử).
// Mỗi cảnh có MỘT dòng thời gian tua được: chạy, xem lại, đứng hình ở mốc bất kỳ (để chụp), nhảy tới cuối (giảm chuyển động).
// Bảy khuôn: keo-co · thang-delta · lewis · quy-tac · vi-du-cot-doc · doan-nhanh · tong-ket. Kịch bản chỉ được dùng đúng bảy khuôn này (luoc-do.json).
// Phần cuối tệp là BỘ KIỂM SỐ của app: tính lại mọi con số bằng bảng cố định, không tin số trong kịch bản.
(function () {
  'use strict'
  const NS = 'http://www.w3.org/2000/svg'
  const q = new URLSearchParams(location.search)
  const GIAM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const yeu = () => document.documentElement.classList.contains('may-yeu')
  const TOC = Math.max(0.25, Math.min(4, +q.get('toc') || 1))

  // ── Bảng số cố định của app (Hoá 10, chương trình 2018). Kịch bản KHÔNG được mang số riêng. ──
  const CHI = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Cl: 3.16, K: 0.82 } // độ âm điện Pauling
  const E_NGOAI = { H: 1, C: 4, N: 5, O: 6, F: 7, Na: 1, Cl: 7, K: 1, S: 6 } // electron lớp ngoài cùng
  const KHOI = { H: 1, C: 12, N: 14, O: 16, Na: 23, S: 32, Cl: 35.5, K: 39, Fe: 56 } // nguyên tử khối
  // Ngưỡng Δχ: hai phương án, Thầy chốt một (duyet.html). Bộ kiểm và khuôn thang-delta đều đọc tham số này.
  const NGUONG = {
    sgk: { ten: 'Theo SGK Hoá 10 (2018)', vung: [{ loai: 'khong-phan-cuc', tu: 0, den: 0.4 }, { loai: 'phan-cuc', tu: 0.4, den: 1.7 }, { loai: 'ion', tu: 1.7, den: null }] },
    thay: { ten: 'Theo đúng bảng Thầy viết', vung: [{ loai: 'cong-hoa-tri', tu: 0, den: 1.7 }, { loai: 'ion', tu: 1.7, den: null, lonHon: true }] },
  }
  const TEN_LOAI = { 'khong-phan-cuc': 'Cộng hoá trị không phân cực', 'phan-cuc': 'Cộng hoá trị phân cực', ion: 'Liên kết ion', 'cong-hoa-tri': 'Liên kết cộng hoá trị' }
  const TEN_DAY = { 'khong-phan-cuc': 'Liên kết cộng hoá trị không phân cực', 'phan-cuc': 'Liên kết cộng hoá trị phân cực', ion: 'Liên kết ion', 'cong-hoa-tri': 'Liên kết cộng hoá trị' }
  const MAU_LOAI = { 'khong-phan-cuc': 'ngoc', 'phan-cuc': 'vang', ion: 'hong', 'cong-hoa-tri': 'ngoc' }
  const TEN_KHUON = { 'keo-co': 'Hình dung', 'thang-delta': 'Thang Δχ', lewis: 'Công thức electron', 'quy-tac': 'Quy tắc', 'vi-du-cot-doc': 'Ví dụ', 'doan-nhanh': 'Đoán nhanh', 'tong-ket': 'Tổng kết' }
  const KHUON = ['keo-co', 'thang-delta', 'lewis', 'quy-tac', 'vi-du-cot-doc', 'doan-nhanh', 'tong-ket']

  // ── tiện ích ──
  function h(tag, at, con) {
    const e = document.createElement(tag)
    if (at) for (const k in at) { if (at[k] == null || at[k] === false) continue; if (k === 'text') e.textContent = at[k]; else if (k === 'html') e.innerHTML = at[k]; else e.setAttribute(k, at[k]) }
    if (con) for (const c of [].concat(con)) if (c != null) e.append(c)
    return e
  }
  function s(tag, at, con) {
    const e = document.createElementNS(NS, tag)
    if (at) for (const k in at) { if (at[k] == null) continue; if (k === 'text') e.textContent = at[k]; else e.setAttribute(k, at[k]) }
    if (con) for (const c of [].concat(con)) if (c != null) e.append(c)
    return e
  }
  const soVi = (x, k) => (k == null ? String(x) : x.toFixed(k)).replace('.', ',')
  const soChi = (x) => soVi(x, 2)
  const soDelta = (x) => (Math.abs(x) < 1e-9 ? '0' : soVi(x, 2))
  const soGon = (x) => String(+x.toFixed(2)).replace('.', ',')
  const gio = (giay) => { const g = Math.max(0, Math.round(giay)), m = Math.floor(g / 60), x = g - m * 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x }
  const DUOI = '₀₁₂₃₄₅₆₇₈₉', TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'
  const boDuoi = (t) => String(t).replace(/[₀-₉]/g, (c) => DUOI.indexOf(c))
  /** Chữ có **đậm** ⇒ HTML an toàn (chỉ một kiểu đánh dấu). */
  const dam = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  const boDam = (t) => String(t).replace(/\*\*/g, '')
  /** «FeS₂» ⇒ { Fe: 1, S: 2 } */
  function phanTichCT(ct) {
    const ra = {}, t = boDuoi(ct).replace(/^\d+/, '')
    for (const m of t.matchAll(/([A-Z][a-z]?)(\d*)/g)) ra[m[1]] = (ra[m[1]] || 0) + (m[2] ? +m[2] : 1)
    return ra
  }
  function khoiMol(ct) { const p = phanTichCT(ct); let m = 0; for (const k in p) { if (KHOI[k] == null) return null; m += KHOI[k] * p[k] } return m }
  /** «10⁶», «8/100», «2,55», «76,8» ⇒ số */
  function docSo(t) {
    t = String(t).trim()
    let m = t.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/)
    if (m) return Math.pow(+m[1], +[...m[2]].map((c) => TREN.indexOf(c)).join(''))
    m = t.match(/^(\d+(?:,\d+)?)\s*\/\s*(\d+(?:,\d+)?)$/)
    if (m) return +m[1].replace(',', '.') / +m[2].replace(',', '.')
    m = t.match(/^-?\d+(?:,\d+)?$/)
    return m ? +t.replace(',', '.') : NaN
  }
  function phanLoai(d, ng) {
    const v = NGUONG[ng] || NGUONG.sgk
    for (const z of v.vung) { const tren = z.den == null ? Infinity : z.den; if (z.lonHon ? d > z.tu && d <= tren : d >= z.tu && d < tren) return z.loai }
    return v.vung[v.vung.length - 1].loai
  }
  const hopLoai = (ghi, tinh) => ghi === tinh || (tinh === 'cong-hoa-tri' && (ghi === 'khong-phan-cuc' || ghi === 'phan-cuc'))

  // ── DÒNG THỜI GIAN: mọi hoạt hoạ của một cảnh nằm trên một trục, tua được ──
  class Dong {
    constructor() { this.ds = []; this.vong = []; this.t = 0; this.hen = 0 }
    /** Một chuỗi trạng thái trên MỘT phần tử: moc = [[ms, {thuộc tính}, easing?], …] (mỗi phần tử chỉ một chuỗi ⇒ không giẫm nhau). */
    chuoi(el, moc) {
      if (!el || moc.length < 2) return null
      const t0 = moc[0][0] / TOC, t1 = moc[moc.length - 1][0] / TOC, dai = Math.max(1, t1 - t0)
      const kf = moc.map((m) => Object.assign({ offset: Math.min(1, Math.max(0, (m[0] / TOC - t0) / dai)), easing: m[2] || 'cubic-bezier(.22,.8,.3,1)' }, m[1]))
      const a = el.animate(kf, { duration: dai, delay: t0, fill: 'both' })
      a.pause(); a.currentTime = 0
      this.ds.push(a); this.t = Math.max(this.t, t1)
      return a
    }
    /** Hiện dần: mờ ⇒ rõ (kèm dời / phóng nhẹ) từ mốc `tai`. */
    hien(el, tai, dai, tu) { return this.chuoi(el, [[tai, Object.assign({ opacity: 0 }, tu || {})], [tai + (dai || 420), { opacity: 1, transform: 'none' }]]) }
    /** Nét vẽ: stroke-dashoffset 1 ⇒ 0 (phần tử có pathLength="1"). */
    ve(el, tai, dai) { el.style.strokeDasharray = '1 1'; return this.chuoi(el, [[Math.max(0, tai - 1), { strokeDashoffset: 1, opacity: 0 }], [tai, { strokeDashoffset: 1, opacity: 1 }, 'ease-in-out'], [tai + (dai || 700), { strokeDashoffset: 0, opacity: 1 }]]) }
    /** Vòng lặp nền nhẹ (không tính vào thời lượng; tắt khi giảm chuyển động / máy yếu). */
    lap(el, kf, dai) {
      if (GIAM || yeu() || !el) return
      const a = el.animate(kf, { duration: dai, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' })
      a.pause(); this.vong.push(a)
    }
    chay(xong) {
      clearTimeout(this.hen)
      if (GIAM) { this.cuoi(); if (xong) xong(); return }
      for (const a of this.ds) { a.currentTime = 0; a.play() }
      for (const a of this.vong) a.play()
      if (xong) this.hen = setTimeout(xong, this.t + 60)
    }
    toi(ms) { clearTimeout(this.hen); for (const a of this.ds) { a.pause(); a.currentTime = Math.max(0, ms) } for (const a of this.vong) { a.pause(); a.currentTime = 0 } }
    cuoi() { this.toi(this.t + 5) }
    dungVong() { for (const a of this.vong) a.pause() }
    huy() { clearTimeout(this.hen); for (const a of this.ds.concat(this.vong)) a.cancel(); this.ds = []; this.vong = [] }
  }

  // ═══════════ KHUÔN 1 · keo-co: hai nguyên tử kéo co cặp electron dùng chung ═══════════
  // duLieu: { trai: {nhan, ky?}, phai: {nhan, ky?}, anSo?, pha: [{ chiTrai?, chiPhai?, loai, chu, loi?: [], ketLuan? }] }
  // ky có trong bảng ⇒ χ lấy từ bảng của app; không có ky ⇒ số minh hoạ (anSo: không in ra).
  function keoCo(goc, d, dg, ctx) {
    // khổ hẹp (điện thoại dọc) ⇒ bố cục gọn để chữ trên bảng không dưới 15 px
    const hep = goc.clientWidth > 0 && goc.clientWidth < 560
    const coChi = !d.anSo && !!(d.trai.ky && d.phai.ky), W = hep ? 600 : 720, H = (hep ? 392 : 400) + (coChi ? 30 : 0), Y = hep ? 196 : 200, XC = W / 2, KC = hep ? 132 : 150, XT = XC - KC, XP = XC + KC, R = hep ? 46 : 50, LMT = hep ? 92 : 120, id = ctx.id
    const chiCua = (ben, p) => (d[ben].ky && CHI[d[ben].ky] != null ? CHI[d[ben].ky] : ben === 'trai' ? p.chiTrai : p.chiPhai)
    // ctx.nho (hình thu nhỏ trên thẻ): cắt khung quanh hai nguyên tử, ẩn chữ
    const khungNho = `${XT - R - LMT - 10} ${Y - R - 90} ${XP - XT + 2 * (R + LMT + 10)} ${2 * R + 120}`
    const svg = s('svg', { viewBox: ctx.nho ? khungNho : `0 0 ${W} ${H}`, class: 'kc' + (hep ? ' hep' : '') + (ctx.nho ? ' nho' : ''), role: 'img', 'aria-label': (ctx.tieuDe || 'Hai nguyên tử kéo cặp electron dùng chung') })
    const grad = (ten, mau, a0, a1) => s('radialGradient', { id: `${id}-${ten}` }, [s('stop', { offset: '0', 'stop-color': `var(--phan-${mau})`, 'stop-opacity': a0 }), s('stop', { offset: '1', 'stop-color': `var(--phan-${mau})`, 'stop-opacity': a1 })])
    svg.append(s('defs', null, [grad('gt', 'ngoc', 0.42, 0.06), grad('gp', 'hong', 0.42, 0.06), grad('ge', 'vang', 0.5, 0)]))
    // bụi phấn (chỉ ở bìa; máy yếu thì bỏ)
    if (ctx.hat && !yeu() && !GIAM) {
      for (let i = 0; i < 9; i++) {
        const x = 40 + ((i * 263) % (W - 80)), y = 70 + ((i * 151) % (H - 150)), r = 1.6 + (i % 3) * 0.9
        const c = s('circle', { cx: x, cy: y, r, class: 'kc-hat', style: `opacity:${0.18 + (i % 4) * 0.08}` }); svg.append(c)
        dg.lap(c, [{ transform: 'translate(0px,0px)' }, { transform: `translate(${(i % 2 ? 1 : -1) * (6 + i)}px,${-10 - (i % 3) * 6}px)` }], 2600 + i * 410)
      }
    }
    // dây kéo: hai nửa (để đứt khi thành ion)
    const dayT = s('line', { x1: XT + R, y1: Y, x2: XC, y2: Y, class: 'kc-day', style: `transform-origin:${XT + R}px ${Y}px` })
    const dayP = s('line', { x1: XC, y1: Y, x2: XP - R, y2: Y, class: 'kc-day', style: `transform-origin:${XP - R}px ${Y}px` })
    const day = s('g', null, [dayT, dayP])
    svg.append(day)
    // mũi tên lực kéo (dài theo χ), lồng hai lớp: lớp ngoài theo pha, lớp trong rung nhẹ
    const muiTen = (x, huong, mau) => {
      const ngoai = s('g', { style: `transform-origin:${x}px ${Y}px` }), trong = s('g', { style: `transform-origin:${x}px ${Y}px` })
      const x2 = x + huong * LMT
      trong.append(s('line', { x1: x, y1: Y, x2: x2 + -huong * 6, y2: Y, class: `kc-luc mau-${mau}` }), s('path', { d: `M${x2 + -huong * 18} ${Y - 12} L${x2} ${Y} L${x2 + -huong * 18} ${Y + 12}`, class: `kc-luc mau-${mau}` }))
      ngoai.append(trong); return { ngoai, trong }
    }
    const lucT = muiTen(XT - R - 8, -1, 'ngoc'), lucP = muiTen(XP + R + 8, 1, 'hong')
    svg.append(lucT.ngoai, lucP.ngoai)
    // nguyên tử: lớp ngoài hiện ra, lớp trong co / giãn khi thành ion
    const nguyenTu = (x, ben, gr, mau) => {
      const g = s('g', { style: `transform-origin:${x}px ${Y}px` })
      g.append(s('circle', { cx: x, cy: Y, r: R, fill: `url(#${id}-${gr})`, class: `kc-vo mau-${mau}` }))
      if (d[ben].ky) g.append(s('text', { x, y: Y + 17, class: 'kc-ky', text: d[ben].ky }))
      else g.append(s('circle', { cx: x, cy: Y, r: 11, class: `kc-nhan mau-${mau}` }))
      const ngoai = s('g', { style: `transform-origin:${x}px ${Y}px` }, g)
      return { ngoai, g }
    }
    const NT = nguyenTu(XT, 'trai', 'gt', 'ngoc'), NP = nguyenTu(XP, 'phai', 'gp', 'hong'), ntT = NT.g, ntP = NP.g
    svg.append(NT.ngoai, NP.ngoai)
    const nhan = (x, ben, mau) => {
      const g = s('g')
      g.append(s('text', { x, y: Y + R + 40, class: `kc-ten mau-${mau}`, text: d[ben].nhan || (ben === 'trai' ? 'Bên trái' : 'Bên phải') }))
      if (!d.anSo && d[ben].ky && CHI[d[ben].ky] != null) g.append(s('text', { x, y: Y + R + 74, class: 'kc-chi', text: `χ = ${soChi(CHI[d[ben].ky])}` }))
      return g
    }
    svg.append(nhan(XT, 'trai', 'ngoc'), nhan(XP, 'phai', 'hong'))
    // dấu điện tích (khi thành ion)
    const dauT = s('text', { x: XT + R - 2, y: Y - R + 6, class: 'kc-dau mau-ngoc', text: '+', style: 'opacity:0' }), dauP = s('text', { x: XP + R + 4, y: Y - R + 6, class: 'kc-dau mau-hong', text: '−', style: 'opacity:0' })
    svg.append(dauT, dauP)
    // cặp electron + đám mây electron: một lớp bọc cho mỗi pha (dời tương đối) + lớp rung
    let bocNgoai = s('g', { style: `transform-origin:${XC}px ${Y}px` }), boc = bocNgoai
    const bocPha = d.pha.map(() => { const g = s('g'); boc.append(g); boc = g; return g })
    const rung = s('g'); boc.append(rung)
    rung.append(s('ellipse', { cx: XC, cy: Y, rx: 66, ry: 30, fill: `url(#${id}-ge)`, class: 'kc-quang' }))
    rung.append(s('circle', { cx: XC - 13, cy: Y, r: 8, class: 'kc-e' }))
    rung.append(s('path', { d: `M${XC + 6} ${Y - 7} L${XC + 20} ${Y + 7} M${XC + 20} ${Y - 7} L${XC + 6} ${Y + 7}`, class: 'kc-ex' }))
    svg.append(bocNgoai)
    // tiêu đề pha: một dòng mỗi pha (cảnh) hoặc dải các pha sáng lần lượt (bìa: thanhPha)
    let tdPha = [], dai = null
    if (d.thanhPha) {
      dai = d.pha.map((p, i) => {
        // dải pha: chữ đầu neo trái, chữ cuối neo phải, giữa canh giữa (không tràn mép bảng)
        const n = d.pha.length, dau = i === 0, cuoi = i === n - 1 && n > 1, x = dau ? 30 : cuoi ? W - 30 : W * (i + 0.5) / n
        const g = s('g'), t = s('text', { x, y: 50, class: 'kc-dai', text: p.chu || '', style: `text-anchor:${dau ? 'start' : cuoi ? 'end' : 'middle'}` }), ch = s('circle', { cx: dau ? x + 8 : cuoi ? x - 8 : x, cy: 72, r: 4.5, class: `kc-dai-cham mau-${MAU_LOAI[p.loai]}` })
        g.append(t, ch); svg.append(g); return g
      })
    } else tdPha = d.pha.map((p) => { const t = s('text', { x: XC, y: 52, class: 'kc-pha', text: p.chu || '' }); svg.append(t); return t })
    // kết luận + khung phấn vẽ quanh (như khung Thầy đóng trên bảng)
    const klPha = d.pha.map((p) => {
      const g = s('g'), mau = MAU_LOAI[p.loai] || 'vang'
      const t = s('text', { x: XC, y: H - 30, class: `kc-kl mau-${mau}`, text: p.ketLuan || TEN_DAY[p.loai] || '' })
      const khung = s('rect', { x: XC - 200, y: H - 66, width: 400, height: 52, rx: 14, class: `kc-khung mau-${mau}`, pathLength: 1 })
      g.append(khung, t); svg.append(g); return { g, t, khung }
    })
    goc.append(svg)
    // khung ôm vừa chữ (đo lại khi phông tải xong)
    const doKhung = () => {
      klPha.forEach((k) => { try { const b = k.t.getBBox(); if (b.width) { const w = Math.min(W - 12, b.width + 40); k.khung.setAttribute('x', XC - w / 2); k.khung.setAttribute('width', w) } } catch (e) { /* chưa vẽ được */ } })
      // dải pha: các chữ giữa chia đều khoảng trống giữa chữ đầu và chữ cuối
      if (dai && dai.length > 2) try {
        const a = dai[0].firstChild.getBBox(), z = dai[dai.length - 1].firstChild.getBBox(), tu = a.x + a.width, den = z.x
        for (let i = 1; i < dai.length - 1; i++) { const x = tu + (den - tu) * i / (dai.length - 1); dai[i].firstChild.setAttribute('x', x); dai[i].lastChild.setAttribute('cx', x) }
      } catch (e) { /* chưa vẽ được */ }
    }
    doKhung(); if (document.fonts) document.fonts.ready.then(doKhung)

    // ── lịch ──
    const DAI = 4400, dauPha = (i) => 300 + i * DAI
    let viTruoc = { x: 0, y: 0 }, scT = 0.62, scP = 0.62
    dg.hien(NT.ngoai, 0, 500, { transform: 'scale(.6)' }); dg.hien(NP.ngoai, 120, 500, { transform: 'scale(.6)' })
    dg.hien(day, 200, 500)
    dg.hien(bocNgoai, 500, 400, { transform: 'scale(.4)' })
    const lichLucT = [[0, { transform: 'scaleX(0)', opacity: 0 }]], lichLucP = [[0, { transform: 'scaleX(0)', opacity: 0 }]]
    d.pha.forEach((p, i) => {
      const t0 = dauPha(i), cT = chiCua('trai', p), cP = chiCua('phai', p), delta = Math.abs(cP - cT), huong = cP >= cT ? 1 : -1
      // mũi tên lực
      const sT = Math.min(1, 0.32 + 0.24 * cT), sP = Math.min(1, 0.32 + 0.24 * cP)
      lichLucT.push([t0 + 300, { transform: `scaleX(${scT})`, opacity: 1 }], [t0 + 1100, { transform: `scaleX(${sT})`, opacity: 1 }]); scT = sT
      lichLucP.push([t0 + 300, { transform: `scaleX(${scP})`, opacity: 1 }], [t0 + 1100, { transform: `scaleX(${sP})`, opacity: 1 }]); scP = sP
      // vị trí cặp electron: lệch theo Δχ; ion ⇒ về hẳn nguyên tử kéo mạnh
      const vi = p.loai === 'ion' ? { x: huong * KC, y: -(R + 26) } : { x: huong * Math.min(1, delta / 1.7) * (KC - R - 22), y: 0 }
      const dx = vi.x - viTruoc.x, dy = vi.y - viTruoc.y
      if (dx || dy) dg.chuoi(bocPha[i], [[t0 + 1100, { transform: 'translate(0px,0px)' }, 'cubic-bezier(.45,0,.2,1.25)'], [t0 + (p.loai === 'ion' ? 2300 : 2000), { transform: `translate(${dx}px,${dy}px)` }]])
      viTruoc = vi
      if (p.loai === 'ion') {
        dg.chuoi(dayT, [[t0 + 1900, { transform: 'scaleX(1)', opacity: 1 }], [t0 + 2500, { transform: 'scaleX(0)', opacity: 0 }]])
        dg.chuoi(dayP, [[t0 + 1900, { transform: 'scaleX(1)', opacity: 1 }], [t0 + 2500, { transform: 'scaleX(0)', opacity: 0 }]])
        dg.chuoi(huong > 0 ? ntT : ntP, [[t0 + 2200, { transform: 'scale(1)' }], [t0 + 2800, { transform: 'scale(.84)' }]])
        dg.chuoi(huong > 0 ? ntP : ntT, [[t0 + 2200, { transform: 'scale(1)' }], [t0 + 2800, { transform: 'scale(1.1)' }]])
        dg.hien(huong > 0 ? dauT : dauP, t0 + 2600, 380, { transform: 'translateY(8px)' })
        dg.hien(huong > 0 ? dauP : dauT, t0 + 2750, 380, { transform: 'translateY(8px)' })
      }
      // tiêu đề / kết luận của pha
      const het = i < d.pha.length - 1 ? dauPha(i + 1) : null
      if (dai) {
        const m = [[t0 - 1, { opacity: 0.34 }], [t0 + 300, { opacity: 1 }]]
        if (het) m.push([het - 200, { opacity: 1 }], [het + 100, { opacity: 0.34 }])
        if (i === 0) m.unshift([0, { opacity: 0.34 }])
        dg.chuoi(dai[i], m.sort((a, b) => a[0] - b[0]))
      } else {
        const td = [[t0, { opacity: 0, transform: 'translateY(6px)' }], [t0 + 400, { opacity: 1, transform: 'none' }]]
        if (het) td.push([het - 300, { opacity: 1, transform: 'none' }], [het, { opacity: 0, transform: 'none' }])
        dg.chuoi(tdPha[i], td)
      }
      const kl = [[t0 + 2400, { opacity: 0 }], [t0 + 2800, { opacity: 1 }]]
      if (het) kl.push([het - 300, { opacity: 1 }], [het, { opacity: 0 }])
      dg.chuoi(klPha[i].g, kl); dg.ve(klPha[i].khung, t0 + 2600, 800)
      ;(p.loi || []).forEach((l, k) => ctx.noi(l, t0 + 200 + k * 1100))
      if (p.ketLuan || TEN_DAY[p.loai]) ctx.noi(p.ketLuan || TEN_DAY[p.loai], t0 + 2800, MAU_LOAI[p.loai])
    })
    lichLucT.push([dauPha(d.pha.length - 1) + 1200, { transform: `scaleX(${scT})`, opacity: 1 }]); lichLucP.push([dauPha(d.pha.length - 1) + 1200, { transform: `scaleX(${scP})`, opacity: 1 }])
    dg.chuoi(lucT.ngoai, lichLucT); dg.chuoi(lucP.ngoai, lichLucP)
    dg.chuoi(svg, [[0, { opacity: 1 }], [dauPha(d.pha.length - 1) + 3400, { opacity: 1 }]])
    dg.lap(rung, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-3px)' }], 520)
    dg.lap(lucT.trong, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.06)' }], 640)
    dg.lap(lucP.trong, [{ transform: 'scaleX(1.05)' }, { transform: 'scaleX(1)' }], 700)
  }

  // ═══════════ KHUÔN 2 · thang-delta: thang Δχ, kim chạy tới giá trị, vùng sáng lên ═══════════
  // duLieu: { max, kim: [{ nhan, a, b, delta, loai, chu? }] } · vùng lấy theo ngưỡng đang dùng (ctx.nguong)
  function thangDelta(goc, d, dg, ctx) {
    const max = d.max || 3, ng = NGUONG[ctx.nguong] || NGUONG.sgk, phan = (x) => Math.max(0, Math.min(1, x / max))
    const khung = h('div', { class: 'td', style: `--hang:${d.kim.length}` })
    const tren = h('div', { class: 'td-tren' }), ray = h('div', { class: 'td-ray' })
    const vungEl = ng.vung.map((z) => {
      const tu = phan(z.tu), den = z.den == null ? 1 : phan(z.den)
      const e = h('div', { class: `td-vung mau-${MAU_LOAI[z.loai]}`, style: `left:${(tu * 100).toFixed(3)}%;width:${((den - tu) * 100).toFixed(3)}%` }, [h('i', { class: 'td-sang' })])
      ray.append(e); return e
    })
    const moc = h('div', { class: 'td-moc so' })
    const diem = [0]; ng.vung.forEach((z) => { if (z.den != null) diem.push(z.den) })
    const mocEl = diem.map((v) => { const e = h('span', { style: `left:${(phan(v) * 100).toFixed(3)}%`, text: soGon(v) }); moc.append(e); return e })
    const kimEl = d.kim.map((k, i) => {
      const p = phan(k.delta), phai = p > 0.62
      const kd = h('div', { class: 'td-kd' })
      const kim = h('div', { class: 'td-kim', style: `top:calc(${i} * var(--hang-cao))` }, [h('span', { class: `td-nhan${phai ? ' phai' : ''}`, html: `${dam(k.nhan)} <b class="so">Δχ = ${soDelta(k.delta)}</b>` })])
      kd.append(kim); tren.append(kd); return { kd, kim, p }
    })
    const ten = h('div', { class: 'td-ten', style: `grid-template-columns:repeat(${ng.vung.length},minmax(0,1fr))` })
    const tenEl = ng.vung.map((z) => {
      const tam = z.den == null ? (z.lonHon ? `Δχ > ${soGon(z.tu)}` : `Δχ ≥ ${soGon(z.tu)}`) : z.tu === 0 ? (z.loai === 'cong-hoa-tri' ? `Δχ ≤ ${soGon(z.den)}` : `0 ≤ Δχ < ${soGon(z.den)}`) : `${soGon(z.tu)} ≤ Δχ < ${soGon(z.den)}`
      const e = h('div', { class: `td-o mau-${MAU_LOAI[z.loai]}` }, [h('i', { class: 'td-o-sang' }), h('b', { text: TEN_LOAI[z.loai] }), h('span', { class: 'so', text: tam })])
      ten.append(e); return e
    })
    khung.append(h('div', { class: 'td-khung' }, [tren, ray]), moc, ten)
    goc.append(khung)
    // lịch
    vungEl.forEach((e, i) => dg.hien(e, 100 + i * 200, 420, { transform: 'scaleY(.2)' }))
    mocEl.forEach((e, i) => dg.hien(e, 500 + i * 120, 300))
    tenEl.forEach((e, i) => dg.hien(e, 300 + i * 200, 420, { transform: 'translateY(8px)' }))
    ;(d.loiMo || []).forEach((l, k) => ctx.noi(l, 200 + k * 1200))
    let t = 1100 + (d.loiMo || []).length * 600
    kimEl.forEach((k, i) => {
      const kim = d.kim[i], loai = phanLoai(kim.delta, ctx.nguong), vi = ng.vung.findIndex((z) => z.loai === loai)
      dg.hien(k.kim, t, 300)
      dg.chuoi(k.kd, [[t, { transform: 'translateX(0%)' }, 'cubic-bezier(.3,0,.2,1.15)'], [t + 1100, { transform: `translateX(${(k.p * 100).toFixed(3)}%)` }]])
      if (vi >= 0) {
        dg.chuoi(vungEl[vi].firstChild, [[t + 1000, { opacity: 0 }], [t + 1300, { opacity: 1 }], [t + 1900, { opacity: 0.55 }]])
        dg.chuoi(tenEl[vi].firstChild, [[t + 1000, { opacity: 0 }], [t + 1300, { opacity: 1 }]])
      }
      if (kim.chu) ctx.noi(kim.chu, t + 1100, MAU_LOAI[kim.loai])
      t += 2100
    })
    ;(d.loi || []).forEach((l, k) => ctx.noi(l, t + k * 1100))
    dg.chuoi(khung, [[0, { opacity: 1 }], [t + 400, { opacity: 1 }]])
  }

  // ═══════════ KHUÔN 3 · lewis: công thức electron tự vẽ từng cặp, cặp dùng chung nằm giữa ═══════════
  // duLieu: { congThuc, nguyenTu: [{ ky, kieu: 'cham'|'x', vt?: [cột, hàng] }], lienKet: [{ a, b, cap }], capRieng: [số cặp riêng mỗi nguyên tử], nhanChung?, loi?: [3 câu] }
  function lewis(goc, d, dg, ctx) {
    const B = 168, nt = d.nguyenTu.map((a, i) => Object.assign({ i }, a, { vt: a.vt || [i, 0] }))
    const c0 = Math.min(...nt.map((a) => a.vt[0])), c1 = Math.max(...nt.map((a) => a.vt[0])), r0 = Math.min(...nt.map((a) => a.vt[1])), r1 = Math.max(...nt.map((a) => a.vt[1]))
    const W = Math.max(520, (c1 - c0) * B + 280), H = (r1 - r0) * B + 300
    const ox = (W - (c1 - c0) * B) / 2, oy = 128
    nt.forEach((a) => { a.x = ox + (a.vt[0] - c0) * B; a.y = oy + (a.vt[1] - r0) * B })
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lw', role: 'img', 'aria-label': `Công thức electron của ${d.congThuc}` })
    goc.append(svg)
    const HUONG = { tren: [0, -1], duoi: [0, 1], trai: [-1, 0], phai: [1, 0] }
    const dung = nt.map(() => new Set())
    d.lienKet.forEach((l) => {
      const A = nt[l.a], Bt = nt[l.b], dx = Math.sign(Bt.x - A.x), dy = Math.sign(Bt.y - A.y)
      dung[l.a].add(dx > 0 ? 'phai' : dx < 0 ? 'trai' : dy > 0 ? 'duoi' : 'tren'); dung[l.b].add(dx > 0 ? 'trai' : dx < 0 ? 'phai' : dy > 0 ? 'tren' : 'duoi')
    })
    const eDot = (x, y, kieu, chung) => kieu === 'x'
      ? s('path', { d: `M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}`, class: `lw-ex${chung ? ' chung' : ''}`, style: 'transform-box:fill-box;transform-origin:center' })
      : s('circle', { cx: x, cy: y, r: 7.5, class: `lw-e${chung ? ' chung' : ''}`, style: 'transform-box:fill-box;transform-origin:center' })
    // nguyên tử
    const kyEl = nt.map((a) => { const t = s('text', { x: a.x, y: a.y + 24, class: 'lw-ky', text: a.ky, style: 'transform-box:fill-box;transform-origin:center' }); svg.append(t); return t })
    // cặp riêng
    const rieng = []
    nt.forEach((a, i) => {
      const tu = ['tren', 'duoi', 'trai', 'phai'].filter((x) => !dung[i].has(x))
      for (let k = 0; k < (d.capRieng[i] || 0); k++) {
        const v = HUONG[tu[k]], p = [-v[1], v[0]], cx = a.x + v[0] * 48, cy = a.y + v[1] * 46
        const g = s('g'); g.append(eDot(cx + p[0] * 11, cy + p[1] * 11, a.kieu), eDot(cx - p[0] * 11, cy - p[1] * 11, a.kieu)); svg.append(g); rieng.push(g)
      }
    })
    // cặp dùng chung
    const chung = [], vungChung = []
    d.lienKet.forEach((l) => {
      const A = nt[l.a], Bt = nt[l.b], len = Math.hypot(Bt.x - A.x, Bt.y - A.y), v = [(Bt.x - A.x) / len, (Bt.y - A.y) / len], p = [-v[1], v[0]], mx = (A.x + Bt.x) / 2, my = (A.y + Bt.y) / 2
      const n = l.cap
      for (let k = 0; k < n; k++) {
        const o = (k - (n - 1) / 2) * 24, g = s('g')
        g.append(eDot(mx - v[0] * 11 + p[0] * o, my - v[1] * 11 + p[1] * o, A.kieu, true), eDot(mx + v[0] * 11 + p[0] * o, my + v[1] * 11 + p[1] * o, Bt.kieu, true))
        svg.append(g); chung.push(g)
      }
      const rw = Math.abs(v[0]) > 0.5 ? 46 : 22 + n * 24, rh = Math.abs(v[0]) > 0.5 ? 22 + n * 24 : 46
      const r = s('rect', { x: mx - rw / 2, y: my - rh / 2, width: rw, height: rh, rx: 14, class: 'lw-vung', pathLength: 1 })
      svg.insertBefore(r, svg.firstChild); vungChung.push(r)
    })
    // đếm electron quanh mỗi nguyên tử (8, riêng H là 2)
    const dem = nt.map((a, i) => {
      const so = 2 * (d.capRieng[i] || 0) + 2 * d.lienKet.filter((l) => l.a === i || l.b === i).reduce((x, l) => x + l.cap, 0)
      const t = s('text', { x: a.x, y: a.y + 104 + (dung[i].has('duoi') ? 0 : 0), class: 'lw-dem', text: `${so} e` }); svg.append(t); return t
    })
    const nhanChung = s('text', { x: W / 2, y: H - 22, class: 'lw-nhan', text: d.nhanChung || 'Cặp electron dùng chung nằm giữa hai nguyên tử' })
    svg.append(nhanChung)
    // lịch
    kyEl.forEach((e, i) => dg.hien(e, i * 220, 420, { transform: 'scale(.5)' }))
    const loi = d.loi || []
    if (loi[0]) ctx.noi(loi[0], 300)
    let t = 300 + kyEl.length * 220
    rieng.forEach((g, i) => { [...g.children].forEach((e, k) => dg.hien(e, t + k * 110, 300, { transform: 'scale(0)' })); t += 260 })
    t += 300
    if (loi[1]) ctx.noi(loi[1], t)
    chung.forEach((g) => { [...g.children].forEach((e, k) => dg.hien(e, t + k * 160, 360, { transform: 'scale(0)' })); t += 560 })
    vungChung.forEach((r, i) => dg.ve(r, t + i * 150, 700))
    dg.hien(nhanChung, t + 300, 500, { transform: 'translateY(8px)' })
    t += 1300
    if (loi[2]) ctx.noi(loi[2], t)
    dem.forEach((e, i) => dg.hien(e, t + i * 200, 400, { transform: 'translateY(-6px)' }))
    dg.chuoi(svg, [[0, { opacity: 1 }], [t + dem.length * 200 + 600, { opacity: 1 }]])
  }

  // ═══════════ KHUÔN 4 · quy-tac: thẻ quy tắc, chữ hiện dần, khung sáng ═══════════
  // duLieu: { nhan, dong: [chữ có **nhấn**], mau: 'vang'|'ngoc'|'hong', viDu?: [], loi?: [] }
  function quyTac(goc, d, dg, ctx) {
    const mau = d.mau || 'vang'
    const the = h('div', { class: `qt mau-${mau}` })
    const sang = h('i', { class: 'qt-sang' })
    const khungSvg = s('svg', { class: 'qt-khung', 'aria-hidden': 'true' }, [s('rect', { class: 'qt-rect', pathLength: 1, rx: 20 })])
    const nhan = h('span', { class: 'qt-nhan', text: d.nhan || 'Quy tắc' })
    the.append(sang, khungSvg, nhan)
    const tu = []
    d.dong.forEach((dong) => {
      const p = h('p', { class: 'qt-dong' })
      const tmp = h('span', { html: dam(dong) })
      for (const node of [...tmp.childNodes]) {
        const laNhan = node.nodeType === 1
        for (const w of node.textContent.split(/(\s+)/)) {
          if (!w) continue
          if (/^\s+$/.test(w)) { p.append(' '); continue }
          const sp = h(laNhan ? 'b' : 'span', { class: 'qt-tu', text: w }); p.append(sp); tu.push(sp)
        }
      }
      the.append(p)
    })
    let vd = null
    if (d.viDu && d.viDu.length) { vd = h('div', { class: 'qt-vd' }, [h('span', { class: 'qt-vd-nhan', text: 'Ví dụ trên bảng' })].concat(d.viDu.map((x) => h('span', { class: 'qt-vd-o', text: x })))); the.append(vd) }
    goc.append(h('div', { class: 'qt-boc' }, the))
    dg.ve(khungSvg.firstChild, 0, 900)
    dg.hien(nhan, 300, 400, { transform: 'translateY(6px)' })
    tu.forEach((e, i) => dg.hien(e, 700 + i * 90, 360, { transform: 'translateY(10px)' }))
    const t = 700 + tu.length * 90 + 300
    dg.chuoi(sang, [[t, { opacity: 0 }], [t + 500, { opacity: 1 }], [t + 1400, { opacity: 0.5 }]])
    if (vd) dg.hien(vd, t + 600, 450, { transform: 'translateY(8px)' })
    ;(d.loi || []).forEach((l, k) => ctx.noi(l, 400 + k * 1500))
    dg.chuoi(the, [[0, { opacity: 1 }], [t + 1500, { opacity: 1 }]])
  }

  // ═══════════ KHUÔN 5 · vi-du-cot-doc: sơ đồ cột dọc của Thầy + phép tính hiện từng thừa số ═══════════
  // duLieu: { de?, soDo: { chat: [{ ct, heSo?, so: [{ hien, chi?, M? }] }], muiTen: [{ tren }] | null },
  //           tinh: { ten, thuaSo: [{ dau?, hien, gt?|tu+mau, noi, tro?: [chất, ô] | ['muiTen', i] | [chất, 'heSo'], loai?, ct?, nt?, tuCt?, denCt?, H? }],
  //                   ketQua: { hien, gt, donVi?, noi } } }
  function viDuCotDoc(goc, d, dg, ctx) {
    const sd = d.soDo, root = h('div', { class: 'vd' })
    if (d.de) root.append(h('p', { class: 'vd-de', html: dam(d.de) }))
    const hang = h('div', { class: 'vd-sd' }), oChat = [], muiTenEl = [], heSoEl = []
    sd.chat.forEach((c, i) => {
      if (i > 0) {
        const mt = (sd.muiTen || [])[i - 1]
        if (mt) {
          const path = s('path', { d: 'M4 14 H86 M74 4 L88 14 L74 24', class: 'vd-mt-net', pathLength: 1 })
          const e = h('div', { class: 'vd-mt' }, [h('span', { class: 'vd-mt-tren so' }, [h('i', { class: 'vd-sang' }), h('span', { text: mt.tren || '' })]), s('svg', { viewBox: '0 0 92 28', 'aria-hidden': 'true' }, path)])
          hang.append(e); muiTenEl.push({ e, path })
        } else hang.append(h('div', { class: 'vd-cach' }))
      }
      const hs = c.heSo ? h('span', { class: 'vd-hs', text: String(c.heSo) }) : null
      heSoEl.push(hs)
      const cot = h('ul', { class: 'vd-cot' })
      const o = c.so.map((x) => { const li = h('li', { class: 'so' }, [h('i', { class: 'vd-sang' }), h('span', { text: x.hien })]); cot.append(li); return li })
      const ctEl = h('b', { class: 'vd-ct' }, [hs, document.createTextNode(c.ct)])
      hang.append(h('div', { class: 'vd-chat' }, [ctEl, cot]))
      oChat.push({ ctEl, o })
    })
    root.append(hang)
    const pt = h('div', { class: 'vd-pt so' }), tenEl = h('span', { class: 'vd-ten', text: `${d.tinh.ten} =` })
    pt.append(tenEl)
    const tsEl = d.tinh.thuaSo.map((f, i) => {
      const dau = i === 0 ? null : h('i', { class: 'vd-dau', text: f.dau || '·' })
      const m = String(f.hien).match(/^(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)$/)
      const gtEl = m ? h('span', { class: 'vd-ps' }, [h('b', { text: m[1] }), h('i', { text: m[2] })]) : h('span', { class: 'vd-so', text: f.hien })
      const e = h('span', { class: 'vd-ts' }, [dau, gtEl]); pt.append(e); return e
    })
    const kq = d.tinh.ketQua, kqEl = h('span', { class: 'vd-kq' }, [h('i', { class: 'vd-dau', text: '=' }), h('span', { class: 'vd-so', text: kq.hien }), kq.donVi ? h('small', { text: ' ' + kq.donVi }) : null])
    const gach = s('line', { x1: 0, y1: 4, x2: 100, y2: 4, class: 'vd-gach', pathLength: 1 })
    kqEl.append(s('svg', { class: 'vd-gach-svg', viewBox: '0 0 100 8', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, gach))
    pt.append(kqEl); root.append(pt); goc.append(root)
    // lịch: đề ⇒ chất ⇒ mũi tên ⇒ số liệu cột dọc ⇒ từng thừa số (kèm lời nói, ô liên quan sáng lên) ⇒ kết quả
    let t = 0
    if (d.de) { dg.hien(root.firstChild, 0, 400); t = 500 }
    oChat.forEach((c, i) => dg.hien(c.ctEl, t + i * 250, 400, { transform: 'translateY(-8px)' }))
    t += oChat.length * 250
    muiTenEl.forEach((m) => { dg.ve(m.path, t, 600); dg.hien(m.e.firstChild, t + 300, 400) })
    t += 500
    if (d.loiMo) d.loiMo.forEach((l, k) => ctx.noi(l, 200 + k * 1200))
    oChat.forEach((c) => c.o.forEach((li) => { dg.hien(li, t, 380, { transform: 'translateY(-6px)' }); t += 300 }))
    heSoEl.forEach((e) => { if (e) e.style.display = 'inline-block' })
    t += 400
    dg.hien(tenEl, t, 400); t += 500
    const sang = (el, tai) => { if (!el) return; const g = el.querySelector('.vd-sang') || el; dg.chuoi(g, [[tai, { opacity: 0 }], [tai + 260, { opacity: 1 }], [tai + 1300, { opacity: 0 }]]) }
    d.tinh.thuaSo.forEach((f, i) => {
      dg.hien(tsEl[i], t, 420, { transform: 'translateY(10px) scale(.8)' })
      ctx.noi(f.noi, t, null, f.hien)
      const tro = f.tro
      if (tro) {
        if (tro[0] === 'muiTen') { const m = muiTenEl[tro[1]]; if (m) sang(m.e.firstChild, t) }
        else if (tro[1] === 'heSo') { const e = heSoEl[tro[0]]; if (e) dg.hien(e, t + 150, 420, { transform: 'scale(2.2)' }) }
        else if (oChat[tro[0]]) sang(oChat[tro[0]].o[tro[1]], t)
      }
      t += 1250
    })
    heSoEl.forEach((e, i) => { if (e && !d.tinh.thuaSo.some((f) => f.tro && f.tro[0] === i && f.tro[1] === 'heSo')) dg.hien(e, 0, 1) })
    dg.hien(kqEl, t, 500, { transform: 'scale(.7)' })
    dg.ve(gach, t + 300, 600)
    ctx.noi(kq.noi, t + 200, 'vang')
    dg.chuoi(root, [[0, { opacity: 1 }], [t + 1200, { opacity: 1 }]])
  }

  // ═══════════ KHUÔN 6 · doan-nhanh: chạm để đoán trước, chạm xong mới mở đáp án bằng hoạt hoạ ═══════════
  // duLieu: { hoi, luaChon: [{ chu, dung }], giai, mo: { khuon: 'keo-co'|'thang-delta'|'lewis'|'quy-tac', duLieu } }
  // Câu luyện trong bài, không chấm điểm, không EXP (xem dac-ta.md mục 6).
  function doanNhanh(goc, d, dg, ctx) {
    const root = h('div', { class: 'dn' })
    const hoi = h('p', { class: 'dn-hoi', html: dam(d.hoi) })
    const nhacChon = h('p', { class: 'dn-nhac', text: 'Chạm một đáp án để đoán trước. Đoán xong, Thầy mở lời giải.' })
    const chon = h('div', { class: 'dn-chon', role: 'group', 'aria-label': 'Các đáp án' })
    const nut = d.luaChon.map((c, i) => { const b = h('button', { type: 'button', class: 'dn-pa' }, [h('span', { class: 'dn-chu', text: 'ABCD'[i] }), h('span', { html: dam(c.chu) })]); chon.append(b); return b })
    const phan = h('div', { class: 'dn-phan', 'aria-live': 'polite' })
    const mo = h('div', { class: 'dn-mo', hidden: '' })
    root.append(hoi, nhacChon, chon, phan, mo); goc.append(root)
    dg.hien(hoi, 0, 450, { transform: 'translateY(8px)' })
    nut.forEach((b, i) => dg.hien(b, 450 + i * 140, 380, { transform: 'translateY(10px)' }))
    dg.hien(nhacChon, 450 + nut.length * 140, 380)
    ;(d.loi || []).forEach((l, k) => ctx.noi(l, 200 + k * 1100))
    let dgMo = null
    const traLoi = (i, ngay) => {
      if (root.dataset.da) return
      root.dataset.da = String(i)
      const dungI = d.luaChon.findIndex((c) => c.dung)
      nut.forEach((b, k) => { b.disabled = true; b.classList.toggle('dung', k === dungI); b.classList.toggle('sai', k === i && k !== dungI); b.setAttribute('aria-pressed', k === i ? 'true' : 'false') })
      nhacChon.hidden = true
      phan.innerHTML = ''
      phan.append(h('b', { class: i === dungI ? 'mau-ngoc' : 'mau-hong', text: i === dungI ? 'Em đoán đúng.' : `Chưa đúng. Đáp án là ${'ABCD'[dungI]}.` }), h('span', { html: ' ' + dam(d.giai) }))
      mo.hidden = false; mo.innerHTML = ''
      const bang = h('div', { class: `dn-mo-bang k-${d.mo.khuon}` }); mo.append(bang)
      if (dgMo) dgMo.huy()
      dgMo = new Dong()
      DUNG[d.mo.khuon](bang, d.mo.duLieu, dgMo, { id: ctx.id + '-mo', nguong: ctx.nguong, noi: () => {}, tieuDe: d.hoi })
      dgMo.hien(phan, 0, 380, { transform: 'translateY(6px)' })
      if (ngay) dgMo.cuoi(); else dgMo.chay()
      ctx.khiTraLoi && ctx.khiTraLoi(i, i === dungI)
    }
    nut.forEach((b, i) => b.addEventListener('click', () => traLoi(i)))
    ctx.dieuKhien.traLoi = traLoi
    ctx.dieuKhien.datLai = () => { delete root.dataset.da; nut.forEach((b) => { b.disabled = false; b.classList.remove('dung', 'sai'); b.removeAttribute('aria-pressed') }); nhacChon.hidden = false; phan.innerHTML = ''; mo.hidden = true; if (dgMo) { dgMo.huy(); dgMo = null } }
    ctx.dieuKhien.dongMo = () => dgMo
  }

  // ═══════════ KHUÔN 7 · tong-ket: các ý chốt, mỗi ý có nút nghe đúng phút ═══════════
  // duLieu: { y: [{ chu, giay?, canh? }] } · giay do APP điền từ giờ của nét (không do A.I đoán)
  function tongKet(goc, d, dg, ctx) {
    const ul = h('ul', { class: 'tk' })
    d.y.forEach((y, i) => {
      const dau = s('svg', { viewBox: '0 0 28 28', class: 'tk-dau', 'aria-hidden': 'true' }, s('path', { d: 'M6 15 L12 21 L23 8', pathLength: 1 }))
      const nut = y.giay != null ? h('button', { type: 'button', class: 'tk-nghe', 'data-giay': y.giay, 'aria-label': `Nghe Thầy giảng đoạn này, phút ${gio(y.giay)}` }, [
        s('svg', { viewBox: '0 0 24 24', width: 18, height: 18, 'aria-hidden': 'true' }, s('path', { d: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z', fill: 'currentColor' })),
        h('span', { text: 'Nghe Thầy giảng đoạn này' }), h('b', { class: 'so', text: gio(y.giay) })]) : null
      const li = h('li', { class: 'tk-y' }, [dau, h('div', { class: 'tk-than' }, [h('p', { html: dam(y.chu) }), nut])])
      ul.append(li)
      dg.hien(li, 200 + i * 700, 450, { transform: 'translateX(-10px)' })
      dg.ve(dau.firstChild, 400 + i * 700, 420)
    })
    goc.append(ul)
    ;(d.loi || []).forEach((l, k) => ctx.noi(l, 300 + k * 1200))
    goc.addEventListener('click', (e) => { const b = e.target.closest('.tk-nghe'); if (b && ctx.khiNghe) ctx.khiNghe(+b.dataset.giay) })
  }

  const DUNG = { 'keo-co': keoCo, 'thang-delta': thangDelta, lewis, 'quy-tac': quyTac, 'vi-du-cot-doc': viDuCotDoc, 'doan-nhanh': doanNhanh, 'tong-ket': tongKet }

  /** Dựng một cảnh vào `bang` (bảng đen) + `loi` (cột lời Thầy). Trả bộ điều khiển { dg, chay, toi, cuoi, datLai, thoiLuong }. */
  function dungCanh(bang, loiEl, canh, opt) {
    opt = opt || {}
    const dg = new Dong(), dieuKhien = {}
    const ctx = {
      id: 'k' + String(canh.id).replace(/[^a-z0-9]/gi, ''), nguong: opt.nguong || 'sgk', tieuDe: canh.tieuDe, dieuKhien, hat: !!opt.hat, nho: !!opt.nho,
      khiNghe: opt.khiNghe, khiTraLoi: opt.khiTraLoi,
      noi(chu, tai, mau, the) {
        if (!loiEl || !chu) return
        const li = h('li', { class: mau ? `loi-kl mau-${mau}` : '' }, [the ? h('span', { class: 'loi-the so', text: the }) : null, h('span', { html: dam(chu) })])
        loiEl.append(li); dg.hien(li, tai, 420, { transform: 'translateY(8px)' })
      },
    }
    bang.classList.add('k-' + canh.khuon)
    if (!DUNG[canh.khuon]) { bang.append(h('p', { class: 'k-loi', text: 'Cảnh này dùng khuôn chưa có trong thư viện.' })); return { dg, chay() {}, toi() {}, cuoi() {}, datLai() {}, thoiLuong: 0 } }
    DUNG[canh.khuon](bang, canh.duLieu, dg, ctx)
    return {
      dg, dieuKhien,
      get thoiLuong() { return dg.t },
      chay(xong) { if (dieuKhien.datLai && opt.datLaiKhiChay) dieuKhien.datLai(); dg.chay(xong) },
      toi(ms) { dg.toi(ms) }, cuoi() { dg.cuoi() }, dungVong() { dg.dungVong() },
      datLai() { if (dieuKhien.datLai) dieuKhien.datLai(); dg.toi(0) },
    }
  }

  // ═══════════ BỘ KIỂM CỦA APP: tính lại mọi con số, soát chữ, soát khuôn ═══════════
  // Trả { canh: { [id]: [{ ok: true|false|null, chu }] }, tong: { dung, sai, chuaKiem } }. ok = null: không có số để kiểm (chỉ ghi chú).
  const TU_CAM = ['tiền', 'nhà', 'giàu', 'thuế']
  const VIET_TAT = ['VD', 'VD1', 'VD2', 'LK', 'CHT', 'KPC', 'PC', 'ntố', 'QT', 'QT3', 'QT₃']
  function kiemChu(t) {
    const loi = [], x = boDam(t)
    if (/—/.test(x)) loi.push('có dấu gạch ngang dài')
    if (/\p{Extended_Pictographic}/u.test(x)) loi.push('có emoji')
    for (const cau of x.split(/(?<=[.!?])\s+/)) { const n = cau.trim().split(/\s+/).filter(Boolean).length; if (n > 30) loi.push(`câu ${n} chữ (quá 30)`) }
    const tok = x.toLowerCase().split(/[^\p{L}\p{N}₀-₉]+/u)
    for (const w of TU_CAM) if (tok.includes(w)) loi.push(`có chữ «${w}»`)
    for (const w of VIET_TAT) if (x.split(/[^\p{L}\p{N}₀-₉]+/u).includes(w)) loi.push(`viết tắt «${w}»`)
    for (const k of KHUON) if (x.includes(k)) loi.push(`lộ mã khuôn «${k}»`)
    return loi
  }
  function chuCua(canh) {
    const ra = [canh.tieuDe]
    const di = (v) => { if (typeof v === 'string') ra.push(v); else if (Array.isArray(v)) v.forEach(di); else if (v && typeof v === 'object') for (const k in v) if (!['khuon', 'loai', 'kieu', 'ky', 'a', 'b', 'mau', 'ct', 'nt', 'tuCt', 'denCt'].includes(k)) di(v[k]) }
    di(canh.duLieu); return ra.filter(Boolean)
  }
  function kiemKeoCo(d, ng, kq) {
    d.pha.forEach((p, i) => {
      const cT = d.trai.ky ? CHI[d.trai.ky] : p.chiTrai, cP = d.phai.ky ? CHI[d.phai.ky] : p.chiPhai
      if (cT == null || cP == null) { kq.push({ ok: false, chu: `Pha ${i + 1}: thiếu độ âm điện` }); return }
      const delta = Math.abs(cP - cT), loai = phanLoai(delta, ng)
      const that = d.trai.ky && d.phai.ky
      kq.push({ ok: hopLoai(p.loai, loai), chu: that ? `Pha ${i + 1}: Δχ = ${soChi(Math.max(cT, cP))} − ${soChi(Math.min(cT, cP))} = ${soDelta(delta)} ⇒ ${TEN_LOAI[loai]}` : `Pha ${i + 1}: lực kéo minh hoạ (không in số), lệch ${soDelta(delta)} ⇒ ${TEN_LOAI[loai]}` + (hopLoai(p.loai, loai) ? '' : ` (kịch bản ghi ${TEN_LOAI[p.loai]})`) })
    })
  }
  function kiemThang(d, ng, kq) {
    d.kim.forEach((k) => {
      if (CHI[k.a] == null || CHI[k.b] == null) { kq.push({ ok: false, chu: `${boDam(k.nhan)}: nguyên tố ngoài bảng độ âm điện` }); return }
      const delta = Math.abs(CHI[k.a] - CHI[k.b]), loai = phanLoai(delta, ng), khop = Math.abs(delta - k.delta) < 0.005
      kq.push({ ok: khop, chu: `${boDam(k.nhan)}: |${soChi(CHI[k.a])} − ${soChi(CHI[k.b])}| = ${soDelta(delta)}` + (khop ? '' : ` (kịch bản ghi ${soDelta(k.delta)})`) })
      kq.push({ ok: hopLoai(k.loai, loai), chu: `${boDam(k.nhan)}: ${soDelta(delta)} thuộc vùng «${TEN_LOAI[loai]}» (${NGUONG[ng].ten})` })
    })
  }
  function kiemLewis(d, kq) {
    d.nguyenTu.forEach((a, i) => {
      const chungI = d.lienKet.filter((l) => l.a === i || l.b === i).reduce((x, l) => x + l.cap, 0), rieng = d.capRieng[i] || 0
      const cua = 2 * rieng + chungI, quanh = 2 * rieng + 2 * chungI, can = a.ky === 'H' ? 2 : 8
      if (E_NGOAI[a.ky] == null) { kq.push({ ok: false, chu: `${a.ky}: chưa có trong bảng electron lớp ngoài` }); return }
      kq.push({ ok: cua === E_NGOAI[a.ky] && quanh === can, chu: `${a.ky} thứ ${i + 1}: góp ${cua} electron (cần ${E_NGOAI[a.ky]}), quanh có ${quanh} (cần ${can})` })
    })
  }
  function kiemViDu(d, kq) {
    d.soDo.chat.forEach((c) => c.so.forEach((x) => {
      if (x.chi) { const m = String(x.hien).match(/(\d+(?:,\d+)?)\s*$/), v = m ? +m[1].replace(',', '.') : NaN; kq.push({ ok: Math.abs(v - CHI[x.chi]) < 0.005, chu: `χ của ${x.chi} trên sơ đồ ${m ? m[1] : '?'}, bảng của app ${soChi(CHI[x.chi])}` }) }
      if (x.M) { const M = khoiMol(c.ct); kq.push({ ok: M === x.M, chu: `M ${c.ct} = ${soVi(M)} (sơ đồ ghi ${x.M})` }) }
    }))
    let v = null
    d.tinh.thuaSo.forEach((f, i) => {
      const gt = f.tu != null ? f.tu / f.mau : f.gt, doc = docSo(f.hien)
      if (Math.abs(doc - gt) > 1e-9 * Math.max(1, Math.abs(gt))) kq.push({ ok: false, chu: `Thừa số «${f.hien}» đọc ra ${doc}, kịch bản ghi ${gt}` })
      if (f.loai === 'chia-M') { const M = khoiMol(f.ct); kq.push({ ok: Math.abs(gt - 1 / M) < 1e-12, chu: `«${f.hien}»: chia M ${f.ct} = ${soVi(M)}` }) }
      if (f.loai === 'nhan-M') { const M = khoiMol(f.ct); kq.push({ ok: gt === M, chu: `«${f.hien}»: nhân M ${f.ct} = ${soVi(M)}` }) }
      if (f.loai === 'bao-toan') { const a = phanTichCT(f.tuCt)[f.nt] || 0, b = phanTichCT(f.denCt)[f.nt] || 0; kq.push({ ok: b > 0 && Math.abs(gt - a / b) < 1e-12, chu: `«${f.hien}»: bảo toàn ${f.nt}, 1 ${f.tuCt} có ${a} ${f.nt}, 1 ${f.denCt} có ${b} ${f.nt} ⇒ × ${soVi(a / b)}` }) }
      if (f.loai === 'hieu-suat-xuoi') kq.push({ ok: Math.abs(gt - f.H / 100) < 1e-12, chu: `«${f.hien}»: tính xuôi × H/100 với H = ${soVi(f.H)} %` })
      if (f.loai === 'hieu-suat-nguoc') kq.push({ ok: Math.abs(gt - 100 / f.H) < 1e-12, chu: `«${f.hien}»: tính ngược × 100/H với H = ${soVi(f.H)} %` })
      const dau = f.dau || (i === 0 ? null : '·')
      v = i === 0 ? gt : dau === '−' ? v - gt : dau === '+' ? v + gt : v * gt
    })
    const kq0 = d.tinh.ketQua, sai = Math.abs(v - kq0.gt) > 1e-6 * Math.max(1, Math.abs(kq0.gt)), docKq = docSo(kq0.hien)
    kq.push({ ok: !sai && Math.abs(docKq - kq0.gt) < 1e-9, chu: `Tính lại cả chuỗi: ${d.tinh.ten} = ${soVi(Math.round(v * 1e6) / 1e6)}${kq0.donVi ? ' ' + kq0.donVi : ''} (kịch bản ghi ${kq0.hien})` })
  }
  function kiemCanh(canh, ng) {
    const kq = [], d = canh.duLieu || {}
    if (!KHUON.includes(canh.khuon)) { kq.push({ ok: false, chu: `Khuôn «${canh.khuon}» không có trong thư viện` }); return kq }
    try {
      if (canh.khuon === 'keo-co') kiemKeoCo(d, ng, kq)
      if (canh.khuon === 'thang-delta') kiemThang(d, ng, kq)
      if (canh.khuon === 'lewis') kiemLewis(d, kq)
      if (canh.khuon === 'vi-du-cot-doc') kiemViDu(d, kq)
      if (canh.khuon === 'doan-nhanh') {
        const n = d.luaChon.filter((c) => c.dung).length
        kq.push({ ok: n === 1, chu: `Đúng ${n} đáp án được đánh dấu là đúng (cần 1)` })
        const con = kiemCanh({ khuon: d.mo.khuon, duLieu: d.mo.duLieu, tieuDe: '' }, ng); con.forEach((x) => kq.push(Object.assign({}, x, { chu: 'Hoạt hoạ mở đáp án: ' + x.chu })))
      }
      if (canh.khuon === 'tong-ket') d.y.forEach((y, i) => { if (y.giay == null) kq.push({ ok: null, chu: `Ý ${i + 1}: chưa có phút để nghe` }) })
    } catch (e) { kq.push({ ok: false, chu: 'Dữ liệu cảnh sai dạng: ' + e.message }) }
    for (const t of chuCua(canh)) for (const l of kiemChu(t)) kq.push({ ok: false, chu: `Chữ «${boDam(t).slice(0, 40)}…»: ${l}` })
    if (!kq.length) kq.push({ ok: null, chu: 'Không có con số để kiểm' })
    return kq
  }
  function kiemKichBan(kb, ng) {
    ng = ng || kb.nguongDangDung || 'sgk'
    const ra = { canh: {}, tong: { dung: 0, sai: 0, chuaKiem: 0 } }
    for (const c of kb.canh) {
      const kq = kiemCanh(c, ng); ra.canh[c.id] = kq
      for (const x of kq) { if (x.ok === true) ra.tong.dung++; else if (x.ok === false) ra.tong.sai++; else ra.tong.chuaKiem++ }
    }
    return ra
  }

  /** Tải kịch bản: đọc JSON thật; mở thẳng từ ổ đĩa (file://) thì trình duyệt chặn fetch ⇒ dùng bản nhúng do chup.mjs dựng từ đúng tệp JSON. */
  function taiKichBan(ten) {
    const tep = `kich-ban-${ten}.json`
    return fetch(tep, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }).catch(() => new Promise((ok, loi) => {
      if (window.KB_NHUNG && window.KB_NHUNG[ten]) return ok(window.KB_NHUNG[ten])
      const sc = document.createElement('script'); sc.src = 'kich-ban-nhung.js'
      sc.onload = () => (window.KB_NHUNG && window.KB_NHUNG[ten] ? ok(window.KB_NHUNG[ten]) : loi(new Error('thiếu ' + tep)))
      sc.onerror = () => loi(new Error('không đọc được ' + tep)); document.head.append(sc)
    }))
  }

  window.NKB = { CHI, E_NGOAI, KHOI, NGUONG, TEN_LOAI, TEN_KHUON, KHUON, GIAM, TOC, Dong, dungCanh, kiemKichBan, kiemCanh, kiemChu, taiKichBan, gio, soDelta, soChi, h, s, dam, boDam, phanLoai, khoiMol }
})()
