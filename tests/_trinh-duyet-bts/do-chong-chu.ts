// Hai hàm CHẠY TRONG TRÌNH DUYỆT (Playwright nạp bằng addInitScript / evaluate — nên tự chứa, không dùng biến ngoài, không import):
//  · `caiBatChuCanvas` — chặn fillText của canvas 2D, nhớ hộp chữ của KHUNG VẼ CUỐI (khung mới bắt đầu ở clearRect phủ cả canvas).
//  · `doChongChu` — đo mọi hộp chữ (chữ DOM qua Range + chữ canvas đã nhớ) trong màn Bảng tin sàn: cặp hộp chữ GIAO NHAU và chữ BỊ CẮT (tràn khỏi khung overflow hidden / clip, bị ellipsis / line-clamp, tràn khỏi canvas hoặc khỏi màn hình).
export interface KetQuaDo {
  soChuDom: number
  soChuCanvas: number
  giao: string[]
  cat: string[]
  cuonDoc: boolean
}

export function caiBatChuCanvas(): void {
  const w = window as unknown as { __cv?: Map<HTMLCanvasElement, { chu: unknown[] }> }
  if (w.__cv) return
  const cv = new Map<HTMLCanvasElement, { chu: unknown[] }>()
  w.__cv = cv
  const P = CanvasRenderingContext2D.prototype
  const clearRect = P.clearRect
  const fillText = P.fillText
  P.clearRect = function (this: CanvasRenderingContext2D, x: number, y: number, rong: number, cao: number) {
    const m = this.getTransform()
    if (rong * m.a >= this.canvas.width - 1 && cao * m.d >= this.canvas.height - 1) cv.set(this.canvas, { chu: [] })
    return clearRect.call(this, x, y, rong, cao)
  }
  P.fillText = function (this: CanvasRenderingContext2D, chu: string, x: number, y: number, toiDa?: number) {
    let rec = cv.get(this.canvas)
    if (!rec) { rec = { chu: [] }; cv.set(this.canvas, rec) }
    const m = this.getTransform()
    const t = this.measureText(chu)
    let rong = t.width
    if (toiDa !== undefined && rong > toiDa) rong = toiDa // canvas ép chữ hẹp lại cho vừa, không cắt
    const asc = t.actualBoundingBoxAscent
    const desc = t.actualBoundingBoxDescent
    const a = this.textAlign
    const x0 = a === 'center' ? x - rong / 2 : a === 'right' || a === 'end' ? x - rong : x
    const b = this.textBaseline
    const y0 = b === 'top' || b === 'hanging' ? y : b === 'middle' ? y - (asc + desc) / 2 : b === 'bottom' || b === 'ideographic' ? y - (asc + desc) : y - asc
    const y1 = y0 + asc + desc
    // về toạ độ điểm ảnh của canvas (tính cả tỉ lệ màn hình)
    const g = (px: number, py: number): [number, number] => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]
    const [l, tr] = g(x0, y0)
    const [r, bo] = g(x0 + rong, y1)
    rec.chu.push({ chu, l: Math.min(l, r), t: Math.min(tr, bo), r: Math.max(l, r), b: Math.max(tr, bo), tiLe: m.a })
    return fillText.call(this, chu, x, y, ...(toiDa === undefined ? [] : [toiDa]))
  } as typeof P.fillText
}

export function doChongChu(): KetQuaDo {
  const goc = document.querySelector('[data-khoi="bang-tin-san"]') as HTMLElement
  interface Hop { chu: string; l: number; t: number; r: number; b: number; nguon: string }
  const giao: string[] = []
  const cat: string[] = []
  const lam = (n: number): string => String(Math.round(n))
  const tenPhan = (e: Element | null): string => {
    const ra: string[] = []
    for (let p: Element | null = e; p && p !== goc && ra.length < 2; p = p.parentElement) if (p.className && typeof p.className === 'string') ra.push('.' + p.className.split(/\s+/)[0])
    return ra.join('<')
  }
  const chong = (a: Hop, b: Hop): boolean => {
    const rong = Math.min(a.r, b.r) - Math.max(a.l, b.l)
    const cao = Math.min(a.b, b.b) - Math.max(a.t, b.t)
    return rong > 2 && cao > 0.35 * Math.min(a.b - a.t, b.b - b.t)
  }
  // canvas: hộp là NÉT CHỮ thật (actualBoundingBox), không phải hộp dòng ⇒ chạm nhau dù nửa điểm ảnh cũng là dính chữ
  const chongChat = (a: Hop, b: Hop): boolean => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0.5
  const tuHop = (h: Hop) => `“${h.chu}” [${lam(h.l)},${lam(h.t)},${lam(h.r)},${lam(h.b)}] ${h.nguon}`

  // ── chữ DOM ──  (hộp CHỮ đã cắt theo khung overflow hidden/clip của tổ tiên: chỉ phần NHÌN THẤY mới tính chồng; phần bị khung cắt mất tính là "cắt")
  const kep = (v: string) => v === 'hidden' || v === 'clip'
  const khongCat = '.bts-cs, .bts-bang-day' // số lăn (chỉ một chữ số lộ ra khỏi dải) và băng chạy (chữ trôi ngang khỏi khung là CÓ CHỦ Ý)
  const dom: Array<Hop & { nut: Node; cha: HTMLElement }> = []
  const duyet = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let n = duyet.nextNode(); n; n = duyet.nextNode()) {
    const chu = (n.textContent ?? '').replace(/\s+/g, ' ').trim()
    const cha = n.parentElement
    if (!chu || !cha || cha.closest('script,style,noscript')) continue
    let an = false
    for (let e: Element | null = cha; e && e !== goc.parentElement; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') { an = true; break }
      const rc = e.getBoundingClientRect()
      if ((rc.width <= 2 || rc.height <= 2) && cs.overflow !== 'visible') { an = true; break } // chữ chỉ cho trình đọc màn hình (sr-only)
    }
    if (an) continue
    range.selectNodeContents(n)
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 0.5 || r.height < 0.5) continue
      let l = r.left, t = r.top, rr = r.right, b = r.bottom
      for (let e: HTMLElement | null = cha; e && e !== goc.parentElement; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (!kep(cs.overflowX) && !kep(cs.overflowY)) continue
        const rc = e.getBoundingClientRect()
        if (kep(cs.overflowX)) { l = Math.max(l, rc.left + e.clientLeft); rr = Math.min(rr, rc.left + e.clientLeft + e.clientWidth) }
        if (kep(cs.overflowY)) { t = Math.max(t, rc.top + e.clientTop); b = Math.min(b, rc.top + e.clientTop + e.clientHeight) }
      }
      const dienTich = (r.right - r.left) * (r.bottom - r.top)
      const thay = Math.max(0, rr - l) * Math.max(0, b - t)
      const chuY = !!cha.closest(khongCat)
      if (thay < 1) { // bị khung che HẾT: chỉ hợp lệ với số lăn / băng chạy
        if (!chuY) cat.push(`DOM “${chu}” [${lam(r.left)},${lam(r.top)},${lam(r.right)},${lam(r.bottom)}] ${tenPhan(cha)} bị khung che hết`)
        continue
      }
      if (cha.closest('.bts-cs') && thay < 0.6 * dienTich) continue // mép chữ số kế bên lộ vài điểm ảnh khỏi dải số lăn (phần đệm dòng, không có nét chữ) — chỉ chữ số đang hiện mới tính
      if (thay < 0.92 * dienTich && !chuY) cat.push(`DOM “${chu}” [${lam(r.left)},${lam(r.top)},${lam(r.right)},${lam(r.bottom)}] ${tenPhan(cha)} bị khung cắt bớt (${lam((100 * thay) / dienTich)} % còn thấy)`)
      dom.push({ chu, l, t, r: rr, b, nguon: tenPhan(cha), nut: n, cha })
    }
  }
  const choPhep = (a: Hop, b: Hop): boolean => (a.nguon.includes('.bts-bang-nhan') && b.nguon.includes('.bts-bang-day')) || (b.nguon.includes('.bts-bang-nhan') && a.nguon.includes('.bts-bang-day')) // nhãn "Vừa xảy ra" nằm ĐÈ LÊN băng chạy (nền đặc) có chủ ý
  for (let i = 0; i < dom.length; i++) {
    for (let j = i + 1; j < dom.length; j++) {
      if (dom[i]!.nut !== dom[j]!.nut && chong(dom[i]!, dom[j]!) && !choPhep(dom[i]!, dom[j]!)) giao.push(`DOM ${tuHop(dom[i]!)}  ×  ${tuHop(dom[j]!)}`)
    }
  }
  // chữ DOM đè lên tia nhỏ (canvas không chữ) của thẻ số: hộp chữ NGOÀI tia mà giao hộp của tia
  for (const tia of Array.from(goc.querySelectorAll('.bts-o-tia'))) {
    const rt = tia.getBoundingClientRect()
    for (const h of dom) {
      if (tia.contains(h.cha)) continue
      const rong = Math.min(h.r, rt.right) - Math.max(h.l, rt.left)
      const cao = Math.min(h.b, rt.bottom) - Math.max(h.t, rt.top)
      if (rong > 2 && cao > 2) giao.push(`TIA ${tuHop(h)}  ×  tia nhỏ [${lam(rt.left)},${lam(rt.top)},${lam(rt.right)},${lam(rt.bottom)}]`)
    }
  }
  // chữ bị cắt bằng ellipsis / line-clamp, hoặc nằm ngoài màn hình
  const daBao = new Set<string>()
  for (const h of dom) {
    for (let e: HTMLElement | null = h.cha; e && e !== goc.parentElement; e = e.parentElement) {
      const cs = getComputedStyle(e)
      const kepDong = (cs as unknown as { webkitLineClamp?: string }).webkitLineClamp
      if ((cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) || (kepDong && kepDong !== 'none' && e.scrollHeight > e.clientHeight + 1)) {
        const k = `${h.chu}|cắt|${tenPhan(e)}`
        if (!daBao.has(k)) { daBao.add(k); cat.push(`DOM ${tuHop(h)} bị cắt bằng ellipsis/line-clamp ở ${tenPhan(e)}`) }
      }
    }
    // chiều dọc: màn một cột (điện thoại) được cuộn ⇒ chỉ tính ngoài TỜ (scrollHeight), không ngoài cửa sổ
    const caoTo = Math.max(innerHeight, (document.scrollingElement as HTMLElement).scrollHeight)
    if (h.r > innerWidth + 1 || h.b > caoTo + 1 || h.l < -1 || h.t < -1) cat.push(`DOM ${tuHop(h)} nằm ngoài màn hình ${innerWidth}×${caoTo}`)
  }

  // ── chữ canvas (khung vẽ cuối) ──
  let soCanvas = 0
  const cv = (window as unknown as { __cv?: Map<HTMLCanvasElement, { chu: Array<{ chu: string; l: number; t: number; r: number; b: number; tiLe: number }> }> }).__cv
  if (cv) {
    for (const [canvas, rec] of cv) {
      if (!canvas.isConnected || !goc.contains(canvas)) continue
      const ten = tenPhan(canvas.closest('[data-khoi]') ?? canvas)
      const hop: Hop[] = rec.chu.map((c) => ({ chu: c.chu, l: c.l / c.tiLe, t: c.t / c.tiLe, r: c.r / c.tiLe, b: c.b / c.tiLe, nguon: `canvas ${ten}` }))
      soCanvas += hop.length
      const rong = canvas.width / (rec.chu[0]?.tiLe || 1)
      const cao = canvas.height / (rec.chu[0]?.tiLe || 1)
      for (let i = 0; i < hop.length; i++) {
        const h = hop[i]!
        if (h.r > rong + 1 || h.b > cao + 1 || h.l < -1 || h.t < -1) cat.push(`CANVAS ${tuHop(h)} tràn khỏi canvas ${lam(rong)}×${lam(cao)}`)
        for (let j = i + 1; j < hop.length; j++) if (chongChat(h, hop[j]!)) giao.push(`CANVAS ${tuHop(h)}  ×  ${tuHop(hop[j]!)}`)
      }
    }
  }
  const se = document.scrollingElement as HTMLElement
  return { soChuDom: dom.length, soChuCanvas: soCanvas, giao, cat, cuonDoc: se.scrollHeight > innerHeight + 1 }
}
