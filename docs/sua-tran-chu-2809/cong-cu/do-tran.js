// Hàm dò tràn chữ chạy TRONG trang. Trả danh sách lỗi.
(() => {
  const W = innerWidth
  const out = []
  const csCache = new Map()
  const CS = (el) => { let c = csCache.get(el); if (!c) { c = getComputedStyle(el); csCache.set(el, c) } return c }
  const tenEl = (el) => {
    const parts = []
    for (let a = el, i = 0; a && a !== document.body && i < 4; a = a.parentElement, i++) {
      let s = a.tagName.toLowerCase()
      const cls = (typeof a.className === 'string' ? a.className : '').trim().split(/\s+/).filter(Boolean).filter(c => !/[:\[]/.test(c) && !/^(flex|grid|items|justify|gap|p[xytblr]?|m[xytblr]?|w|h|min|max|text|font|rounded|bg|border|shadow|leading|tracking|overflow|truncate|shrink|grow|inline|block|relative|absolute|col|row|space|self|z|top|left|right|bottom|opacity|transition|cursor|select|pointer|tap|ring|outline|uppercase|whitespace|break|tabular|sticky|fixed|hidden|order|basis|flex-1|divide|underline|italic|antialiased|aspect|object|place|content|list|isolate|duration|ease|animate|backdrop|fill|stroke|sr|overscroll)(-|$)/.test(c)).slice(0, 2)
      if (a.id) s += '#' + a.id
      if (cls.length) s += '.' + cls.join('.')
      parts.unshift(s)
      if ((cls.length || a.id) && i >= 1) break
    }
    return parts.join('>')
  }
  const anDi = (el) => {
    if (el.closest('svg,.sr-only,[hidden],canvas,.katex-mathml')) return true
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      if (a.tagName === 'DETAILS' && !a.open) { const s = a.querySelector(':scope > summary'); if (!s || !s.contains(el)) return true }
      const c = CS(a)
      if (c.visibility === 'hidden' || c.display === 'none' || Number(c.opacity) < 0.05) return true
      if (c.clipPath && c.clipPath !== 'none' && /inset\(50%|circle\(0/.test(c.clipPath)) return true
      if (c.position === 'absolute' && c.clip && c.clip !== 'auto') return true
    }
    return false
  }
  const lop = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) { const p = CS(a).position; if (p === 'fixed' || p === 'sticky') return a } return null }
  const doc = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) { const c = CS(a); if (/vertical/.test(c.writingMode) || (c.transform && c.transform !== 'none' && !/^matrix\(1, 0, 0, 1,/.test(c.transform))) return true } return false }
  // 1. Trang cuộn ngang
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  if (sw > W + 1) {
    const thu = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || r.right <= W + 1) continue
      if (anDi(el)) continue
      let chaCuon = false
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (CS(a).overflowX !== 'visible') { chaCuon = true; break } }
      if (chaCuon) continue
      const pr = el.parentElement?.getBoundingClientRect()
      if (pr && pr.right > W + 1) continue
      thu.push(tenEl(el) + ` (phải ${Math.round(r.right)}px)`)
    }
    out.push({ loai: 'trang-cuon-ngang', el: thu.slice(0, 3).join(' | ') || 'body', mota: `trang rộng ${sw}px > ${W}px` })
  }
  // 2. Chữ bị cắt / ra ngoài màn / gãy từ / nhãn ngắn xuống dòng; gom mẩu chữ nhìn thấy để dò đè
  const hop = []
  const daBao = new Set()
  const bao = (o) => { const k = o.loai + '|' + o.el + '|' + (o.chu || '').slice(0, 16); if (!daBao.has(k)) { daBao.add(k); out.push(o) } }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const txt = n.textContent
    if (!txt.trim()) continue
    const el = n.parentElement
    if (!el || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION|TITLE)$/.test(el.tagName)) continue
    if (anDi(el)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    let rects = [...range.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5).map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height }))
    if (!rects.length) continue
    let eli = false
    let conThay = rects.map(r => ({ ...r }))
    let cuonNgangCo = false, cuonDocCo = false
    // đi lên tổ tiên
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const c = CS(a)
      if (c.textOverflow === 'ellipsis' || (c.webkitLineClamp && c.webkitLineClamp !== 'none')) eli = true
      const ox = c.overflowX, oy = c.overflowY
      if (ox === 'visible' && oy === 'visible') { if (c.position === 'fixed') break; continue }
      const ar = a.getBoundingClientRect()
      const L = ar.left + (parseFloat(c.borderLeftWidth) || 0), R = ar.right - (parseFloat(c.borderRightWidth) || 0), T = ar.top + (parseFloat(c.borderTopWidth) || 0), B = ar.bottom - (parseFloat(c.borderBottomWidth) || 0)
      const cuonX = /auto|scroll/.test(ox) && a.scrollWidth > a.clientWidth + 1
      const cuonY = /auto|scroll/.test(oy) && a.scrollHeight > a.clientHeight + 1
      if (/auto|scroll/.test(ox)) cuonNgangCo = cuonNgangCo || cuonX
      if (/auto|scroll/.test(oy) || a === document.body) cuonDocCo = cuonDocCo || cuonY
      if (!eli && a !== document.body) {
        for (const r of rects) {
          const catX = !/auto|scroll/.test(ox) && !cuonNgangCo && (r.right > R + 1.5 || r.left < L - 1.5) && r.left < R && r.right > L
          const catY = !/auto|scroll/.test(oy) && !cuonDocCo && ((r.bottom > B + 2 && r.top < B - 1) || (r.top < T - 2 && r.bottom > T + 1))
          if (catX || catY) { bao({ loai: 'chu-bi-cat', el: tenEl(el), chu: txt.trim().slice(0, 40), mota: `${catX ? 'ngang' : 'dọc'} — bị ${tenEl(a)} (overflow ${ox}/${oy}) cắt` }); break }
        }
      }
      // cắt vùng nhìn thấy
      conThay = conThay.map(r => ({ ...r, left: Math.max(r.left, L), right: Math.min(r.right, R), top: Math.max(r.top, T), bottom: Math.min(r.bottom, B) })).filter(r => r.right - r.left > 1 && r.bottom - r.top > 1)
      if (!conThay.length) break
      if (c.position === 'fixed') break
    }
    // 2b: chữ ra ngoài màn ngang (không trong hàng cuộn)
    for (const r of conThay) if (r.right > W + 1 || r.left < -1) { bao({ loai: 'chu-ra-ngoai-man', el: tenEl(el), chu: txt.trim().slice(0, 40), mota: `chữ ở x ${Math.round(r.left)}–${Math.round(r.right)}, màn rộng ${W}` }); break }
    if (!conThay.length) continue
    const xoay = doc(el)
    if (!xoay) {
      // 2c: gãy từ
      const re = /[^\s\/\-–—·,()]{3,}/g
      let m, dem = 0
      while ((m = re.exec(txt)) && dem < 80) {
        dem++
        const rg = document.createRange()
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length)
        const rr = [...rg.getClientRects()].filter(r => r.width > 0.5)
        if (rr.length > 1 && Math.abs(rr[0].top - rr[rr.length - 1].top) > 3 && m[0].length < 25 && !/^[A-Z0-9_-]{8,}$/.test(m[0])) { bao({ loai: 'gay-tu', el: tenEl(el), chu: m[0], mota: `chữ “${m[0]}” bị bẻ đôi xuống dòng` }); break }
      }
      // 2d: nhãn ngắn (chip/nút/huy hiệu) bị xuống dòng
      const t = txt.trim()
      if (t.length <= 14 && t.includes(' ')) {
        let the = null
        for (let a = el, i = 0; a && i < 3; a = a.parentElement, i++) { const c = CS(a); if (a.tagName === 'BUTTON' || (c.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) && a.getBoundingClientRect().width < 160)) { the = a; break } }
        if (the && the.textContent.trim().length <= 16 && !the.matches('.dh2-roi')) {
          const tops = new Set(rects.map(r => Math.round(r.top / 4)))
          if (tops.size > 1 && !/^TH|TD$/.test(the.tagName)) bao({ loai: 'nhan-xuong-dong', el: tenEl(the), chu: t, mota: `nhãn ngắn “${t}” bị tách 2 dòng` })
        }
      }
    }
    for (const r of conThay) hop.push({ el, r, t: txt.trim().slice(0, 25), lop: lop(el) })
  }
  // 3. chữ đè nhau (khác phần tử, không lồng nhau, cùng lớp nổi)
  const daDe = new Set()
  for (let i = 0; i < hop.length; i++) for (let j = i + 1; j < hop.length; j++) {
    const A = hop[i], B = hop[j]
    if (A.el === B.el || A.lop !== B.lop) continue
    const x = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left)
    const y = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top)
    if (x > 3 && y > Math.min(A.r.height, B.r.height) * 0.35) {
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue
      if (A.el.closest('.katex') || B.el.closest('.katex')) continue
      const dong = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) if (a.getAnimations && a.getAnimations().some(x => x.playState === 'running' || x.effect?.getComputedTiming().fill !== 'none')) return true; return false }
      if (dong(A.el) || dong(B.el)) continue
      const cx = (Math.max(A.r.left, B.r.left) + Math.min(A.r.right, B.r.right)) / 2
      const cy = (Math.max(A.r.top, B.r.top) + Math.min(A.r.bottom, B.r.bottom)) / 2
      if (cx >= 0 && cy >= 0 && cx < W && cy < innerHeight) {
        const top = document.elementFromPoint(cx, cy)
        if (top && !(A.el.contains(top) || B.el.contains(top) || top.contains(A.el) || top.contains(B.el))) continue
        // một bên nằm DƯỚI một mặt nền đục của bên kia ⇒ bị che, không phải đè chữ
        if (top) {
          const khac = A.el.contains(top) ? B.el : B.el.contains(top) ? A.el : null
          if (khac) {
            let che = false
            for (let a = top; a && a !== document.body; a = a.parentElement) {
              if (a.contains(khac)) break
              const m = (getComputedStyle(a).backgroundColor.match(/[\d.]+/g) || []).map(Number)
              if (m.length >= 3 && (m[3] ?? 1) >= 0.85 && a.getBoundingClientRect().width >= 0.8 * W) { che = true; break }
            }
            if (che) continue
          }
        }
      }
      const k = tenEl(A.el) + '~' + tenEl(B.el)
      if (daDe.has(k)) continue
      daDe.add(k)
      out.push({ loai: 'chu-de-nhau', el: tenEl(A.el) + ' ⟂ ' + tenEl(B.el), chu: A.t + ' / ' + B.t, mota: `hai mẩu chữ giao nhau ${Math.round(x)}×${Math.round(y)}px` })
    }
  }
  return out
})()
