// HÀM SOÁT CHẠY TRONG TRANG (Playwright `evaluate` tuần tự hoá từng hàm ⇒ mỗi hàm phải TỰ ĐỦ, không gọi biến ngoài).
// Mỗi lỗi: { loai, chu (mẫu chữ), dau (đường phần tử ngắn, dùng gộp trùng), id (data-soat để khoanh ảnh), id2?, so (con số đo) }.
// Loại: a cắt chữ · a… ba chấm cố ý ở danh sách · b tràn khung · c chồng nhau · d bị phần tử nổi/ghim che · e chữ chạm lòng vòng ·
//       f dòng mở bằng «·» · g vỡ mỗi từ một dòng · h tràn ngang · i đích bấm < 44px · j ô rơi một mình xuống hàng.

/** Kiểm a, a…, b, c, e, f, g, h, i, j ở trạng thái cảnh hiện tại. */
export function kiemTrang() {
  const W = innerWidth, H = innerHeight
  const ra = []
  window.__soatDem ??= 0
  const danh = (el) => { if (!el.dataset.soat) el.dataset.soat = String(++window.__soatDem); return el.dataset.soat }
  const cs = new Map()
  const css = (el) => { let s = cs.get(el); if (!s) { s = getComputedStyle(el); cs.set(el, s) } return s }
  const moTa = (el) => {
    const p = []
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 3 && e !== document.body; e = e.parentElement, i++) {
      const lop = [...e.classList].filter((c) => !/[:[\]/]/.test(c) && !/^(m3|flex|grid|block|hidden|relative|absolute|w-|h-|p[xytblr]?-|m[xytblr]?-|gap-|text-|bg-|items-|justify-|rounded|border|font-|leading-|shrink|grow|min-|max-|overflow|sm|md|lg|dark)/.test(c)).slice(0, 2)
      p.unshift(e.tagName.toLowerCase() + (lop.length ? '.' + lop.join('.') : '') + (e.getAttribute('data-o') ? `[o=${e.getAttribute('data-o')}]` : ''))
    }
    return p.join('>')
  }
  const thay = (el) => el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true }) : true
  const anCache = new Map()
  // chữ chỉ cho trình đọc màn hình (.an-chu / sr-only: clip, khung 1px) — không phải chữ hiển thị
  const chiDoc = (el) => {
    if (anCache.has(el)) return anCache.get(el)
    let kq = false
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 6; e = e.parentElement, i++) {
      const s = css(e), r = e.getBoundingClientRect()
      if ((s.clip && s.clip !== 'auto') || /inset\(50%\)/.test(s.clipPath) || ((r.width <= 2 || r.height <= 2) && s.overflow !== 'visible')) { kq = true; break }
    }
    anCache.set(el, kq)
    return kq
  }
  // ── gốc soát: tấm phủ cố định chiếm ≥ 50% khung đang ở trên cùng (hộp thoại, tấm toàn màn) ⇒ chỉ soát trong tấm ấy
  const lon = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height >= 0.5 * W * H }
  const coDinh = (el) => { const p = css(el).position; return p === 'fixed' }
  // tấm phủ trên cùng (theo thứ tự chồng tại tâm khung); tấm không chữ (nền mờ) ⇒ gốc = khung cha (chứa cả nền mờ lẫn tấm nổi bên cạnh)
  let goc = document.body
  const lops = [...document.body.querySelectorAll('*')].filter((e) => coDinh(e) && lon(e) && thay(e))
  if (lops.length) {
    const chong = document.elementsFromPoint(W / 2, H / 2)
    let tot = null, vt = 1e9
    for (const L of lops) { const i = chong.findIndex((x) => L.contains(x)); if (i >= 0 && i < vt) { vt = i; tot = L } }
    if (tot) goc = tot.textContent.trim() ? tot : tot.parentElement || document.body
  }
  // phần tử nổi (fixed/sticky) gần nhất — không tính chính gốc
  const noiCache = new Map()
  const noi = (el) => {
    if (noiCache.has(el)) return noiCache.get(el)
    let kq = null
    for (let e = el; e && e !== goc && e !== document.body; e = e.parentElement) { const p = css(e).position; if (p === 'fixed' || p === 'sticky') { kq = e; break } }
    noiCache.set(el, kq)
    return kq
  }
  // ── gom chữ
  const chu = []
  const tw = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT)
  const rg = document.createRange()
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const t = n.textContent
    if (!t || !t.trim()) continue
    const el = n.parentElement
    if (!el || /^(SCRIPT|STYLE|NOSCRIPT|TITLE|TEXTAREA|OPTION)$/.test(el.tagName) || !thay(el) || chiDoc(el)) continue
    rg.selectNodeContents(n)
    const rects = [...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom }))
    if (!rects.length) continue
    chu.push({ n, el, rects, t: t.trim() })
  }
  // phần NHÌN THẤY của mỗi dòng chữ: cắt theo tổ tiên overflow hidden/clip (chữ bị line-clamp / truncate không tính chồng). Khung CUỘN không cắt:
  // chữ đang cuộn khuất vẫn được soát (chồng / «·» / vỡ dòng không đổi khi cuộn tới).
  const khungCat = new Map()
  const catBoi = (el) => {
    if (khungCat.has(el)) return khungCat.get(el)
    let k = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }
    for (let e = el; e && e !== document.documentElement && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (/auto|scroll/.test(s.overflowX + s.overflowY)) break // trong khung cuộn: phần khuất cuộn tới được, khung cắt bên ngoài chỉ cắt ô cuộn
      const cx = /hidden|clip/.test(s.overflowX), cy = /hidden|clip/.test(s.overflowY)
      if (!cx && !cy) continue
      const r = e.getBoundingClientRect()
      if (cx) { k.l = Math.max(k.l, r.left); k.r = Math.min(k.r, r.right) }
      if (cy) { k.t = Math.max(k.t, r.top); k.b = Math.min(k.b, r.bottom) }
    }
    khungCat.set(el, k)
    return k
  }
  for (const c of chu) {
    const k = catBoi(c.el)
    c.thay = c.rects.map((r) => ({ l: Math.max(r.l, k.l), t: Math.max(r.t, k.t), r: Math.min(r.r, k.r), b: Math.min(r.b, k.b) })).filter((r) => r.r - r.l > 1 && r.b - r.t > 1)
  }
  const mau = (s) => s.replace(/\s+/g, ' ').slice(0, 40)
  const tranTruc = (s, truc) => /hidden|clip/.test(truc === 'x' ? s.overflowX : s.overflowY)
  const cuonTruc = (s, truc) => /auto|scroll/.test(truc === 'x' ? s.overflowX : s.overflowY)
  const hopTrong = (e) => { const r = e.getBoundingClientRect(); return { l: r.left + e.clientLeft, t: r.top + e.clientTop, r: r.left + e.clientLeft + e.clientWidth, b: r.top + e.clientTop + e.clientHeight } }
  const nutLa = (e) => e.closest('button, a[href], [role="button"], [role="tab"], label, summary')
  // ngữ cảnh danh sách: thẻ danh sách, hoặc dòng bấm được rộng ≥ 60% khung cha có ≥ 2 dòng anh em cùng lớp (danh sách dựng bằng nút)
  const danhSach = (e) => {
    if (e.closest('li, tr, td, dd, ul, ol, [role="list"], [role="listitem"], [role="row"], [role="option"], [role="gridcell"], [role="listbox"]')) return true
    const dong = nutLa(e), cha = dong?.parentElement
    if (!dong || !cha) return false
    const anhEm = [...cha.children].filter((x) => x.tagName === dong.tagName && x.className === dong.className)
    return anhEm.length >= 2 && dong.getBoundingClientRect().width >= 0.6 * cha.getBoundingClientRect().width
  }

  // ── (a) cắt chữ, (b) tràn khung có nền/viền
  const daCat = new Map()
  const daTran = new Map()
  for (const c of chu) {
    // (a) tổ tiên cắt (overflow hidden/clip) đầu tiên làm mất một phần chữ; gặp khung cuộn thì dừng (chữ cuộn tới được)
    for (let e = c.el; e && e !== document.documentElement && e !== document.body; e = e.parentElement) {
      const s = css(e)
      if (cuonTruc(s, 'x') || cuonTruc(s, 'y')) break
      const cx = tranTruc(s, 'x'), cy = tranTruc(s, 'y')
      if (!cx && !cy) continue
      const k = hopTrong(e)
      const ngoai = c.rects.some((r) => (cx && (r.l < k.l - 1 || r.r > k.r + 1)) || (cy && (r.t < k.t - 1 || r.b > k.b + 1)))
      if (!ngoai) continue
      if (!daCat.has(e)) {
        const sel = css(c.el)
        const baCham = s.textOverflow === 'ellipsis' || sel.textOverflow === 'ellipsis' || (s.webkitLineClamp && s.webkitLineClamp !== 'none') || (sel.webkitLineClamp && sel.webkitLineClamp !== 'none')
        const motDong = s.whiteSpace === 'nowrap' || sel.whiteSpace === 'nowrap'
        const nut = nutLa(e)
        // ba chấm CỐ Ý: một dòng (hoặc line-clamp) ở dòng danh sách; ba chấm trong nút KHÔNG phải dòng danh sách = lỗi thật (ảnh thầy «họn để x…»)
        const loai = baCham && danhSach(e) ? 'a…' : 'a'
        const mat = Math.max(0, ...c.rects.map((r) => Math.max(k.l - r.l, r.r - k.r, cy ? r.b - k.b : 0, cy ? k.t - r.t : 0)))
        daCat.set(e, { loai, chu: mau(c.t), dau: moTa(e), id: danh(e), so: Math.round(mat), ghi: baCham ? (motDong ? 'ba chấm 1 dòng' : 'ba chấm nhiều dòng') : cy && !cx ? 'mất theo chiều dọc' : '' })
      }
      break
    }
    // (b) khung có nền/viền gần nhất mà chữ thò ra ngoài (khung không cắt)
    for (let e = c.el; e && e !== document.documentElement && e !== document.body; e = e.parentElement) {
      const s = css(e)
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') break
      const coNen = (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor)) || s.backgroundImage !== 'none'
      const coVien = ['Top', 'Right', 'Bottom', 'Left'].some((p) => parseFloat(s[`border${p}Width`]) > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(s[`border${p}Color`]) && s[`border${p}Style`] !== 'none')
      if (!coNen && !coVien) continue
      if (s.display.startsWith('inline') && s.display !== 'inline-block' && s.display !== 'inline-flex' && s.display !== 'inline-grid') continue
      const r = e.getBoundingClientRect()
      const thua = Math.max(0, ...c.rects.map((x) => Math.max(r.left - x.l, x.r - r.right, r.top - x.t, x.b - r.bottom)))
      if (thua > 2 && !daTran.has(e)) daTran.set(e, { loai: 'b', chu: mau(c.t), dau: moTa(e) + ' ∋ ' + moTa(c.el).split('>').pop(), id: danh(c.el), id2: danh(e), so: Math.round(thua) })
      break
    }
  }
  ra.push(...daCat.values(), ...daTran.values())

  // ── (c) chồng nhau: dòng chữ × dòng chữ, chữ × nút, nút × nút (bỏ cha–con, bỏ phần tử nổi — thuộc (d))
  const NUT = 'button, a[href], [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], input:not([type="hidden"]), select, textarea'
  const nuts = [...goc.querySelectorAll(NUT)].filter((e) => thay(e) && !chiDoc(e) && e.getBoundingClientRect().width > 1 && e.getBoundingClientRect().height > 1)
  const muc = []
  for (const c of chu) if (!noi(c.el)) for (const r of c.thay) muc.push({ el: c.el, r, chu: c.t, nut: false })
  for (const e of nuts) if (!noi(e)) { const r0 = e.getBoundingClientRect(), k = catBoi(e.parentElement || e), r = { left: Math.max(r0.left, k.l), top: Math.max(r0.top, k.t), right: Math.min(r0.right, k.r), bottom: Math.min(r0.bottom, k.b) }; if (r.right - r.left <= 1 || r.bottom - r.top <= 1) continue; muc.push({ el: e, r: { l: r.left, t: r.top, r: r.right, b: r.bottom }, chu: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim(), nut: true }) }
  muc.sort((x, y) => x.r.t - y.r.t)
  const daChong = new Set()
  for (let i = 0; i < muc.length; i++) {
    const x = muc[i]
    for (let j = i + 1; j < muc.length && muc[j].r.t < x.r.b - 2; j++) {
      const y = muc[j]
      if (x.el === y.el || x.el.contains(y.el) || y.el.contains(x.el)) continue
      const w = Math.min(x.r.r, y.r.r) - Math.max(x.r.l, y.r.l), hh = Math.min(x.r.b, y.r.b) - Math.max(x.r.t, y.r.t)
      if (w <= 2 || hh <= 2) continue
      // nút không chữ phủ trọn phần kia (mẫu «cả thẻ bấm được»: nút trong suốt trải cả ô) — chữ nằm trên nó là cố ý
      const trongSuot = (e) => /rgba\(0, 0, 0, 0\)|transparent/.test(css(e).backgroundColor) && css(e).backgroundImage === 'none'
      const phu = (a, b) => a.nut && !b.nut && (!a.el.textContent.trim() || trongSuot(a.el)) && a.r.l <= b.r.l + 1 && a.r.r >= b.r.r - 1 && a.r.t <= b.r.t + 1 && a.r.b >= b.r.b - 1
      if (phu(x, y) || phu(y, x)) continue
      const k = [danh(x.el), danh(y.el)].sort().join('|')
      if (daChong.has(k)) continue
      daChong.add(k)
      ra.push({ loai: 'c', chu: `${mau(x.chu).slice(0, 18)} ⟷ ${mau(y.chu).slice(0, 18)}`, dau: [moTa(x.el), moTa(y.el)].sort().join(' ⟷ '), id: danh(x.el), id2: danh(y.el), so: Math.round(Math.min(w, hh)) })
    }
  }

  // ── (e) chữ trong vòng/ô tròn chạm hoặc vượt lòng vòng
  const vong = []
  for (const svg of goc.querySelectorAll('svg')) {
    if (!thay(svg)) continue
    let to = null
    for (const ci of svg.querySelectorAll('circle')) {
      const s = css(ci)
      const sw = parseFloat(s.strokeWidth) || 0
      if (s.stroke === 'none' || sw <= 0) continue
      const m = ci.getScreenCTM()
      if (!m) continue
      const kx = Math.hypot(m.a, m.b), r = ci.r.baseVal.value * kx
      if (!to || r > to.r) {
        const p = new DOMPoint(ci.cx.baseVal.value, ci.cy.baseVal.value).matrixTransform(m)
        to = { x: p.x, y: p.y, r, long: r - (sw * kx) / 2, el: svg.parentElement || svg }
      }
    }
    if (to && to.r >= 10) vong.push(to)
  }
  for (const e of goc.querySelectorAll('*')) {
    const r = e.getBoundingClientRect()
    if (r.width < 16 || r.height < 16 || Math.abs(r.width - r.height) > 0.2 * Math.max(r.width, r.height)) continue
    const s = css(e)
    const bk = s.borderTopLeftRadius
    const px = bk.endsWith('%') ? (parseFloat(bk) / 100) * r.width : parseFloat(bk)
    if (!(px >= Math.min(r.width, r.height) / 2 - 1)) continue
    if (!e.textContent.trim() || !thay(e)) continue
    vong.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2, long: Math.min(r.width, r.height) / 2 - (parseFloat(s.borderLeftWidth) || 0), el: e })
  }
  const daVong = new Set()
  for (const c of chu) {
    const co = parseFloat(css(c.el).fontSize) || 14
    for (const r of c.thay) {
      const tx = (r.l + r.r) / 2, ty = (r.t + r.b) / 2
      // vòng nhỏ nhất chứa tâm dòng chữ
      let v = null
      for (const o of vong) if (Math.hypot(tx - o.x, ty - o.y) < o.r && (!v || o.r < v.r)) v = o
      if (!v) continue
      const gh = co * 0.72 // chiều cao nét chữ số/hoa (không tính khoảng dòng)
      const goc4 = [[r.l, ty - gh / 2], [r.r, ty - gh / 2], [r.l, ty + gh / 2], [r.r, ty + gh / 2]]
      const xa = Math.max(...goc4.map(([x, y]) => Math.hypot(x - v.x, y - v.y)))
      if (xa > v.long + 0.5 && !daVong.has(v.el)) {
        daVong.add(v.el)
        ra.push({ loai: 'e', chu: mau(c.t), dau: moTa(v.el), id: danh(c.el), id2: danh(v.el), so: Math.round(xa - v.long) })
      }
    }
  }

  // ── (f) dòng mở đầu bằng «·»
  const kyTu = (n, i) => { rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getBoundingClientRect(); return r.width > 0 ? r : null }
  for (const c of chu) {
    if (!c.n.textContent.includes('·')) continue
    const t = c.n.textContent
    for (let i = t.indexOf('·'); i >= 0; i = t.indexOf('·', i + 1)) {
      const r = kyTu(c.n, i)
      const kc = catBoi(c.el)
      if (!r || r.left >= kc.r || r.right <= kc.l || r.top >= kc.b || r.bottom <= kc.t) continue
      // «·» là dấu NHÂN trong phép tính (chữ số hai bên: «3 · 0,01») — không phải dấu ngăn
      if (/\d\s*$/.test(t.slice(0, i)) && /^\s*\d/.test(t.slice(i + 1))) continue
      let truoc = null
      for (let j = i - 1; j >= 0; j--) if (t[j].trim()) { truoc = kyTu(c.n, j); break }
      let dauDong
      if (truoc) dauDong = Math.abs(truoc.top - r.top) > r.height / 2
      else {
        // «·» đứng đầu nút chữ ⇒ xét khung dòng: có chữ nào khác cùng dòng ở bên trái không
        // khung dòng: leo qua phần tử inline và ô con của flex/grid (tối đa 4 bậc)
        let khung = c.el
        for (let k = 0; k < 4 && khung.parentElement && khung !== goc && (css(khung).display.startsWith('inline') || /flex|grid/.test(css(khung.parentElement).display)); k++) khung = khung.parentElement
        const ben = chu.filter((x) => x !== c && khung.contains(x.el))
        dauDong = !ben.some((x) => x.thay.some((q) => q.r <= r.left + 1 && Math.min(q.b, r.bottom) - Math.max(q.t, r.top) > 0.5 * Math.min(q.b - q.t, r.height)))
        if (dauDong) dauDong = ![...khung.querySelectorAll('svg, img')].some((q) => { const z = q.getBoundingClientRect(); return z.right <= r.left + 1 && Math.min(z.bottom, r.bottom) - Math.max(z.top, r.top) > 2 })
      }
      if (dauDong) { ra.push({ loai: 'f', chu: mau(t.slice(i, i + 40)), dau: moTa(c.el), id: danh(c.el), so: 0 }); break }
    }
  }

  // ── (g) vỡ mỗi từ một dòng: gom dòng theo khối chứa (khối gần nhất không phải inline)
  const khoiCua = (el) => { for (let e = el; e && e !== goc; e = e.parentElement) if (!css(e).display.startsWith('inline') || css(e).display === 'inline-block' || css(e).display === 'inline-flex') return e; return el }
  const theoKhoi = new Map()
  for (const c of chu) { const k = khoiCua(c.el); if (!theoKhoi.has(k)) theoKhoi.set(k, []); theoKhoi.get(k).push(c) }
  for (const [k, ds] of theoKhoi) {
    const rs = ds.flatMap((c) => c.thay)
    const tops = []
    for (const r of rs.sort((a, b) => a.t - b.t)) if (!tops.some((t) => Math.abs(t - r.t) < (r.b - r.t) / 2)) tops.push(r.t)
    const dong = tops.length
    if (dong < 3) continue
    const rong = Math.max(...rs.map((r) => r.r)) - Math.min(...rs.map((r) => r.l))
    const soChu = ds.map((c) => c.t).join(' ').replace(/\s+/g, ' ').length
    const soTu = ds.map((c) => c.t).join(' ').trim().split(/\s+/).length
    if ((k.getBoundingClientRect().width < 80 && dong > 3) || (soTu >= 3 && soChu / dong <= 9 && rong < 140 && dong >= soTu * 0.6)) {
      ra.push({ loai: 'g', chu: mau(ds.map((c) => c.t).join(' ')), dau: moTa(k), id: danh(k), so: dong, ghi: `${dong} dòng, rộng ${Math.round(rong)}px` })
    }
  }

  // ── (h) tràn ngang: trang cuộn ngang, hoặc chữ/nút thò qua mép phải/trái khung nhìn (không nằm trong khung cuộn/cắt ngang)
  const de = document.documentElement
  const tranTrang = Math.max(de.scrollWidth - de.clientWidth, document.body.scrollWidth - de.clientWidth, goc !== document.body ? goc.scrollWidth - goc.clientWidth : 0)
  if (tranTrang > 0) ra.push({ loai: 'h', chu: `trang rộng hơn khung ${tranTrang}px`, dau: 'trang', id: danh(goc === document.body ? document.body : goc), so: tranTrang })
  const daH = new Set()
  for (const x of [...chu.map((c) => ({ el: c.el, rs: c.rects, t: c.t })), ...nuts.map((e) => { const r = e.getBoundingClientRect(); return { el: e, rs: [{ l: r.left, r: r.right, t: r.top, b: r.bottom }], t: e.textContent.trim() } })]) {
    const thoa = Math.max(...x.rs.map((r) => (r.l < W && r.r > W + 1 ? r.r - W : r.r > 0 && r.l < -1 ? -r.l : 0)))
    if (thoa <= 1) continue
    let boc = false
    for (let e = x.el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) if (css(e).overflowX !== 'visible') { boc = true; break }
    if (boc || daH.has(x.el)) continue
    daH.add(x.el)
    ra.push({ loai: 'h', chu: mau(x.t), dau: moTa(x.el), id: danh(x.el), so: Math.round(thoa) })
  }

  // ── (i) đích bấm < 44px
  for (const e of nuts) {
    if (e.closest('iframe') || (e.tagName === 'INPUT' && /checkbox|radio/.test(e.type) && e.closest('label'))) continue
    const r = e.getBoundingClientRect()
    if (r.width >= 44 && r.height >= 44) continue
    ra.push({ loai: 'i', chu: mau((e.getAttribute('aria-label') || e.textContent || e.tagName).trim()), dau: moTa(e), id: danh(e), so: Math.round(Math.min(r.width, r.height)), ghi: `${Math.round(r.width)}×${Math.round(r.height)}` })
  }

  // ── (j) ô rơi một mình xuống hàng: hàng flex-wrap/grid ≤ 8 ô, hàng cuối 1 ô, hàng đầu ≥ 3 ô ⇒ khoảng trắng lớn
  for (const e of goc.querySelectorAll('*')) {
    const s = css(e)
    if (!((s.display.includes('flex') && s.flexWrap === 'wrap') || s.display.includes('grid'))) continue
    const con = [...e.children].filter((x) => thay(x) && x.getBoundingClientRect().height > 0 && css(x).position !== 'absolute')
    if (con.length < 3 || con.length > 8) continue
    // chỉ hàng Ô (có nền hoặc viền) — dòng chữ thường xuống hàng không tính
    const laO = (x) => { const q = css(x); return (!/rgba\(0, 0, 0, 0\)|transparent/.test(q.backgroundColor) || parseFloat(q.borderTopWidth) > 0) }
    if (!con.every(laO)) continue
    const hang = []
    for (const x of con) { const t = Math.round(x.getBoundingClientRect().top); let h = hang.find((q) => Math.abs(q.t - t) < 4); if (!h) hang.push((h = { t, ds: [] })); h.ds.push(x) }
    if (hang.length < 2) continue
    hang.sort((a, b) => a.t - b.t)
    const cuoi = hang[hang.length - 1]
    if (cuoi.ds.length !== 1 || hang[0].ds.length < 3) continue
    const rr = e.getBoundingClientRect(), o = cuoi.ds[0].getBoundingClientRect()
    if (o.width > 0.5 * rr.width) continue
    ra.push({ loai: 'j', chu: mau(cuoi.ds[0].textContent || ''), dau: moTa(e), id: danh(cuoi.ds[0]), id2: danh(e), so: Math.round(rr.width - o.width), ghi: `${hang.map((h) => h.ds.length).join('+')} ô` })
  }
  return { ra, goc: goc === document.body ? 'trang' : moTa(goc), cuonDoc: Math.max(0, de.scrollHeight - H) }
}

/** (d) phần tử nổi (fixed/sticky) che chữ hoặc nút ở dưới. che = 'dau' (cuộn về đầu: thanh trên + cạnh) | 'cuoi' (cuộn tới đáy: thanh đáy, nút nổi) | 'ca'. */
export function kiemChe(che) {
  const W = innerWidth, H = innerHeight
  window.__soatDem ??= 0
  const danh = (el) => { if (!el.dataset.soat) el.dataset.soat = String(++window.__soatDem); return el.dataset.soat }
  const cs = new Map()
  const css = (el) => { let s = cs.get(el); if (!s) { s = getComputedStyle(el); cs.set(el, s) } return s }
  const moTa = (el) => {
    const p = []
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 3 && e !== document.body; e = e.parentElement, i++) {
      const lop = [...e.classList].filter((c) => !/[:[\]/]/.test(c) && !/^(m3|flex|grid|block|hidden|relative|absolute|w-|h-|p[xytblr]?-|m[xytblr]?-|gap-|text-|bg-|items-|justify-|rounded|border|font-|leading-|shrink|grow|min-|max-|overflow|sm|md|lg|dark)/.test(c)).slice(0, 2)
      p.unshift(e.tagName.toLowerCase() + (lop.length ? '.' + lop.join('.') : ''))
    }
    return p.join('>')
  }
  const thay = (el) => el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true }) : true
  const lon = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height >= 0.5 * W * H }
  let goc = document.body
  const lops = [...document.body.querySelectorAll('*')].filter((e) => css(e).position === 'fixed' && lon(e) && thay(e))
  if (lops.length) {
    const chong = document.elementsFromPoint(W / 2, H / 2)
    let tot = null, vt = 1e9
    for (const L of lops) { const i = chong.findIndex((x) => L.contains(x)); if (i >= 0 && i < vt) { vt = i; tot = L } }
    if (tot) goc = tot.textContent.trim() ? tot : tot.parentElement || document.body
  }
  const noiCache = new Map()
  const noi = (el) => {
    if (noiCache.has(el)) return noiCache.get(el)
    let kq = null
    for (let e = el; e && e !== goc && e !== document.body; e = e.parentElement) { const p = css(e).position; if (p === 'fixed' || p === 'sticky') { kq = e; break } }
    noiCache.set(el, kq)
    return kq
  }
  const hopLe = (f) => {
    if (che === 'ca') return true
    const r = f.getBoundingClientRect(), cao = r.height > 0.6 * H, giua = (r.top + r.bottom) / 2
    return cao || (che === 'dau' ? giua < H / 2 : giua >= H / 2)
  }
  const ra = []
  const da = new Set()
  const rg = document.createRange()
  // vùng nhìn thấy của phần tử (cắt theo khung cuộn/cắt tổ tiên) — điểm nằm ngoài vùng này vốn khuất, không phải bị phần tử nổi che
  const vung = (el) => {
    const k = { l: 0, t: 0, r: W, b: H }
    for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      const s = css(e)
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue
      const r = e.getBoundingClientRect()
      if (s.overflowX !== 'visible') { k.l = Math.max(k.l, r.left); k.r = Math.min(k.r, r.right) }
      if (s.overflowY !== 'visible') { k.t = Math.max(k.t, r.top); k.b = Math.min(k.b, r.bottom) }
    }
    return k
  }
  const xet = (el, diem, chu) => {
    const k = vung(el)
    for (const [x, y] of diem) {
      if (x < k.l + 1 || y < k.t + 1 || x > k.r - 1 || y > k.b - 1) continue
      const tren = document.elementFromPoint(x, y)
      if (!tren || tren === el || el.contains(tren)) continue
      const f = noi(tren)
      // bỏ: tấm lớn (nền mờ hộp thoại) và ngăn kéo đang MỞ (cao ≥ 80% khung, rộng ≥ 25%) — che có chủ đích khi người dùng mở
      if (!f || f.contains(el) || !hopLe(f) || lon(f)) continue
      const rf = f.getBoundingClientRect()
      if (rf.height >= 0.8 * H && rf.width >= 0.25 * W) continue
      const k = danh(f) + '|' + danh(el)
      if (da.has(k)) return
      da.add(k)
      ra.push({ loai: 'd', chu: chu.replace(/\s+/g, ' ').slice(0, 40), dau: moTa(f) + ' che ' + moTa(el), id: danh(el), id2: danh(f), so: 0, ghi: css(f).position })
      return
    }
  }
  const tw = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT)
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const el = n.parentElement
    if (!el || !n.textContent.trim() || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(el.tagName) || noi(el) || !thay(el)) continue
    rg.selectNodeContents(n)
    const rs = [...rg.getClientRects()].filter((r) => r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < H).slice(0, 4)
    if (rs.length) xet(el, rs.map((r) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2]), n.textContent)
  }
  for (const e of goc.querySelectorAll('button, a[href], [role="button"], input:not([type="hidden"]), select, textarea')) {
    if (noi(e) || !thay(e)) continue
    const r = e.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > H) continue
    xet(e, [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.bottom - 4]], e.getAttribute('aria-label') || e.textContent || e.tagName)
  }
  return { ra }
}

/** Cuộn trang + mọi khung cuộn dọc về đầu ('dau') hoặc tới đáy ('cuoi'). Trả số khung đã cuộn. */
export function cuon(toi) {
  let so = 0
  const de = document.scrollingElement || document.documentElement
  if (de.scrollHeight > de.clientHeight + 2) { de.scrollTop = toi === 'dau' ? 0 : de.scrollHeight; so++ }
  for (const e of document.querySelectorAll('*')) {
    if (e.scrollHeight <= e.clientHeight + 2) continue
    const s = getComputedStyle(e)
    if (!/auto|scroll/.test(s.overflowY)) continue
    e.scrollTop = toi === 'dau' ? 0 : e.scrollHeight
    so++
  }
  return so
}

/** Khoanh vùng lỗi lên ảnh: viền + nhãn ngay trên trang (vị trí fixed theo khung nhìn hiện tại). */
export function ve({ cap, nhan }) {
  document.querySelectorAll('.__soat-ve').forEach((e) => e.remove())
  const W = innerWidth, H = innerHeight
  let dau = null
  for (const [id, id2] of cap) { const e = document.querySelector(`[data-soat="${id}"]`); if (e) { dau = e; break } ; if (id2) { const e2 = document.querySelector(`[data-soat="${id2}"]`); if (e2) { dau = e2; break } } }
  if (dau) { const r = dau.getBoundingClientRect(); if (r.top < 0 || r.bottom > H || r.left < 0 || r.right > W) dau.scrollIntoView({ block: 'center', inline: 'nearest' }) }
  let so = 0
  const hop = (e, mau, net) => {
    const r = e.getBoundingClientRect()
    if (r.bottom < 0 || r.top > H || r.width === 0) return
    const d = document.createElement('div')
    d.className = '__soat-ve'
    Object.assign(d.style, { position: 'fixed', left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px`, border: `3px ${net} ${mau}`, borderRadius: '4px', zIndex: 2147483647, pointerEvents: 'none', boxShadow: '0 0 0 1px #fff' })
    document.body.append(d)
    so++
  }
  for (const [id, id2] of cap) {
    const e = document.querySelector(`[data-soat="${id}"]`)
    if (e) hop(e, '#e0007a', 'solid')
    const e2 = id2 && document.querySelector(`[data-soat="${id2}"]`)
    if (e2) hop(e2, '#ff8a00', 'dashed')
  }
  const n = document.createElement('div')
  n.className = '__soat-ve'
  n.textContent = nhan
  Object.assign(n.style, { position: 'fixed', left: '4px', bottom: '4px', maxWidth: `${W - 8}px`, padding: '2px 6px', font: '600 12px/1.3 system-ui, sans-serif', color: '#fff', background: '#e0007a', zIndex: 2147483647, pointerEvents: 'none', borderRadius: '4px' })
  document.body.append(n)
  return so
}
export function xoaVe() { document.querySelectorAll('.__soat-ve').forEach((e) => e.remove()) }
