// HÌNH CỦA ĐỀ — VẼ LẠI (thầy 03/11 «chỉ cần đề có hình là vẽ lại màu mè đẹp… nếu hoạt hoạ được luôn thì hoạt hoạ… hình vẽ mới là một thẻ riêng ở phía dưới»;
// «chỉ vẽ những câu có hình trong toàn kho thôi, câu khác lúc nào tôi bảo mới vẽ»). Dữ liệu cảnh do máy đọc ảnh điền, app vẽ bằng mã (SVG vector).
// BỘ KIỂM THUẦN (máy chủ · máy vẽ · app cùng dùng) — luật an toàn:
//   1) KHÔNG thêm thông tin ngoài ảnh gốc: mọi chữ / số trong cảnh phải nằm trong PHIÊN ÂM ảnh (chép nguyên văn, hai lượt độc lập phải khớp nhau);
//   2) ẩn danh chất chưa biết giữ nguyên (X, T, Y… không được máy «đoán» thành tên chất);
//   3) cảnh sai khuôn / vị trí ngoài khung ⇒ bỏ cảnh (app giữ ảnh gốc, không vẽ gì).
export const PHIEN_BAN_HINH = 1
export const CAC_KHUON_HINH = ['so-do', 'do-thi', 'thi-nghiem', 'fischer', 'svg'] as const

export type CanhSoDo = { loai: 'so-do'; o: { id: string; chu: string; x: number; y: number }[]; noi: { tu: string[]; den: string; nhan?: string; so?: string }[] }
export type CanhDoThi = { loai: 'do-thi'; truc: { x: string; y: string; xMin: number; xMax: number; yMax: number; xVach: number[]; yVach: number[] }; que: { x: number; y: number; nhan?: string }[] }
export type CanhThiNghiem = { loai: 'thi-nghiem'; khuon: 'chung-cat'; nhan: { binh: string; luoi: string; sinhHan: string; vao: string; ra: string; hung: string } }
export type CanhFischer = { loai: 'fischer'; dau: string; cuoi: string; hang: [string, string][] }
/** Khuôn VẼ TỰ DO (thầy 03/11 «ảnh có trong sgk vẽ lại đưa lên kho thoải mái»): mô hình nguyên tử, cấu tạo, dụng cụ, hình bất kì — máy vẽ SVG thô, `lamSachSvg` dựng lại CHỈ từ thẻ / thuộc tính an toàn, màu CHỈ qua lớp bảng màu app. */
export type CanhSvg = { loai: 'svg'; rong: number; cao: number; svg: string }
export type CanhHinh = CanhSoDo | CanhDoThi | CanhThiNghiem | CanhFischer | CanhSvg
/** Tiêu đề chung theo khuôn — hoặc chép nguyên văn chú thích có trong ảnh (kiểm ở `kiemCanhHinh`). Máy không được tự đặt tiêu đề nêu thêm thông tin. */
export const TIEU_DE_CHUNG: Readonly<Record<string, string>> = { 'so-do': 'Sơ đồ chuyển hoá', 'do-thi': 'Đồ thị', 'thi-nghiem': 'Bộ dụng cụ chưng cất', fischer: 'Công thức chiếu Fischer', svg: 'Hình minh hoạ' }
export interface HinhVeLai { phienBan: number; tieuDe: string; canh: CanhHinh }

const laObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const chu = (v: unknown, tran: number): string => (typeof v === 'string' ? v.replace(/\p{Cc}/gu, ' ').trim().slice(0, tran) : '')
const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v.replace(',', '.'))) ? Number(v.replace(',', '.')) : null)

const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
/** Chuẩn hoá để so chữ: bỏ chỉ số / mũ viết kiểu `_2` `^{3+}` hoặc kí tự Unicode, bỏ dấu cách & dấu câu, hoa thường, NFC. «H₂SO₄» = «H2SO4» = «H_2SO_4». */
export function chuanChuHinh(t: unknown): string {
  return String(t ?? '').normalize('NFC').replace(/[_^{}]/g, '').replace(/[₀-₉]/g, (c) => String(SUB.indexOf(c))).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String(SUP.indexOf(c)))
    .replace(/[⁺₊]/g, '+').replace(/[⁻₋−–]/g, '-').toLowerCase().replace(/[^\p{L}\p{N}+\-%]/gu, '')
}

/** Hai lượt phiên âm độc lập khớp nhau? Mỗi mục lượt này nằm trong chuỗi chuẩn hoá của lượt kia, ≥ 90 % cả hai chiều (ảnh nhiễu cho phép lệch ít). */
export function phienAmKhop(a: readonly string[], b: readonly string[]): boolean {
  const ca = chuanChuHinh(a.join('')), cb = chuanChuHinh(b.join(''))
  if (!ca && !cb) return true // ảnh không có chữ: hai lượt cùng thấy trống
  if (!ca || !cb) return false
  const ty = (xs: readonly string[], kho: string) => { const m = xs.map(chuanChuHinh).filter(Boolean); return m.length ? m.filter((x) => kho.includes(x)).length / m.length : 0 }
  return ty(a, cb) >= 0.9 && ty(b, ca) >= 0.9
}

function trongKhung(v: number, lo = 0, hi = 100) { return v >= lo && v <= hi }


/** Lớp màu cho khuôn SVG (CSS ở hinh-ve.css, chỉ biến --tr-*): f-* tô · s-* viền · t-* chữ. Máy vẽ KHÔNG được ghi màu trực tiếp. */
export const LOP_SVG: ReadonlySet<string> = new Set([
  'f-khong', 'f-nen', 'f-chu', 'f-xam', 'f-hs', 'f-hs-nhat', 'f-tin', 'f-tin-nhat', 'f-sao', 'f-sao-nhat', 'f-sai', 'f-sai-nhat', 'f-dung', 'f-dung-nhat', 'f-tim', 'f-tim-nhat',
  's-chu', 's-chu-2', 's-mo', 's-hs', 's-tin', 's-sao', 's-sai', 's-dung', 's-tim', 's-nen', 'nc', 'net-dut',
  'f-kinh', 'f-nap', 'f-bong', 'f-dd1', 'f-dd2', 'f-dd3', 'f-dd4', 'f-muoi', 'f-the', 's-sang', 's-mui', 's-vien', 't-dau', 't-the', 't-mui',
  'a-bay', 'a-giot', 'a-lua', 'a-nhip', 'a-chay', 'a-quay', 'a-quay-nguoc', 'a-hien', 'tre-1', 'tre-2', 'tre-3', 'tre-4',
  't-chu', 't-chu-2', 't-hs', 't-tin', 't-sao', 't-sai', 't-dung', 't-tim', 't-dam', 't-nho', 't-lon',
])
const THE_SVG = new Set(['g', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan'])
const SO_SVG = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'opacity', 'font-size'])
const RE_SO = /^-?\d{1,4}(?:\.\d{1,3})?$/
const decodeSvg = (t: string) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const maHoaSvg = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * SVG thô của máy vẽ ⇒ SVG sạch DỰNG LẠI từ thẻ / thuộc tính cho phép, hoặc lý do bỏ. Không script, không href / style / image / foreignObject / use, không màu trực tiếp
 * (chỉ `class` trong LOP_SVG), `transform` chỉ translate / rotate / scale. `chu` = mọi chữ trong thẻ text (để đối chiếu phiên âm).
 */
export function lamSachSvg(tho: unknown, rong: number, cao: number): { ok: true; svg: string; chu: string[] } | { ok: false; lyDo: string } {
  const t = typeof tho === 'string' ? tho.trim() : ''
  if (!t || t.length > 24_000) return { ok: false, lyDo: 'svg rỗng hoặc quá dài (> 24 KB)' }
  const ra: string[] = [], chu: string[] = [], mo: string[] = []
  let vt = 0, soThe = 0, trongText = 0
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+="[^"<>]*")*)\s*(\/?)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) {
    if (m.index !== vt) return { ok: false, lyDo: 'svg có kí tự / thẻ ngoài khuôn' }
    vt = re.lastIndex
    if (m[5] !== undefined) {
      const van = m[5]
      if (!van.trim()) { ra.push(van.replace(/\s+/g, ' ')); continue }
      if (!trongText) return { ok: false, lyDo: 'chữ nằm ngoài thẻ text' }
      if (/&(?!amp;|lt;|gt;)/.test(van) || van.length > 80) return { ok: false, lyDo: 'chữ trong svg sai khuôn' }
      chu.push(decodeSvg(van).trim()); ra.push(maHoaSvg(decodeSvg(van))); continue
    }
    const dong = m[1] === '/', ten = m[2]!.toLowerCase(), tuDong = m[4] === '/'
    if (!THE_SVG.has(ten)) return { ok: false, lyDo: `thẻ <${ten}> không được phép` }
    if (dong) {
      if (mo.pop() !== ten) return { ok: false, lyDo: 'thẻ đóng / mở lệch' }
      if (ten === 'text' || ten === 'tspan') trongText--
      ra.push(`</${ten}>`); continue
    }
    if (++soThe > 400) return { ok: false, lyDo: 'svg quá nhiều thẻ (> 400)' }
    const thuoc: string[] = []
    const rea = /\s+([a-zA-Z-]+)="([^"<>]*)"/g
    let a: RegExpExecArray | null
    while ((a = rea.exec(m[3] ?? ''))) {
      const k = a[1]!.toLowerCase(), v = a[2]!.trim()
      let ok = false
      if (SO_SVG.has(k)) ok = RE_SO.test(v) && (k === 'font-size' ? Number(v) >= 6 && Number(v) <= 60 : k.startsWith('stroke') || k === 'opacity' || Math.abs(Number(v)) <= 900)
      else if (k === 'd') ok = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]{1,2400}$/.test(v)
      else if (k === 'points') ok = /^[0-9.,\s-]{1,900}$/.test(v)
      else if (k === 'transform') ok = /^(?:(?:translate|rotate|scale)\(\s*-?\d{1,4}(?:\.\d{1,3})?(?:[\s,]+-?\d{1,4}(?:\.\d{1,3})?){0,2}\s*\)\s*){1,3}$/.test(v)
      else if (k === 'class') ok = v.split(/\s+/).every((c) => LOP_SVG.has(c))
      else if (k === 'text-anchor') ok = v === 'start' || v === 'middle' || v === 'end'
      else if (k === 'stroke-dasharray') ok = /^[0-9.\s,]{1,24}$/.test(v)
      if (!ok) return { ok: false, lyDo: `thuộc tính ${k}="${v.slice(0, 20)}" không được phép` }
      thuoc.push(`${k}="${v}"`)
    }
    if (ten === 'text' || ten === 'tspan') trongText++
    ra.push(`<${ten}${thuoc.length ? ' ' + thuoc.join(' ') : ''}${tuDong ? '/' : ''}>`)
    if (tuDong) { if (ten === 'text' || ten === 'tspan') trongText-- } else mo.push(ten)
  }
  if (vt !== t.length || mo.length) return { ok: false, lyDo: 'thẻ svg chưa đóng' }
  if (chu.length > 60) return { ok: false, lyDo: 'svg quá nhiều nhãn chữ (> 60)' }
  if (!(rong >= 100 && rong <= 800 && cao >= 60 && cao <= 800)) return { ok: false, lyDo: 'khung svg sai cỡ' }
  return { ok: true, svg: ra.join(''), chu }
}

/** Mọi chữ trong cảnh (không kể toạ độ) — để đối chiếu với phiên âm. */
export function chuTrongCanh(c: CanhHinh): string[] {
  if (c.loai === 'so-do') return [...c.o.map((b) => b.chu), ...c.noi.flatMap((n) => [n.nhan ?? '', n.so ?? ''])]
  if (c.loai === 'do-thi') return [c.truc.x, c.truc.y, ...c.truc.xVach.map(String), ...c.truc.yVach.map(String), ...c.que.map((q) => q.nhan ?? '')]
  if (c.loai === 'thi-nghiem') return Object.values(c.nhan)
  if (c.loai === 'svg') { const k = lamSachSvg(c.svg, c.rong, c.cao); return k.ok ? k.chu : [] }
  return [c.dau, c.cuoi, ...c.hang.flat()]
}

/**
 * Cảnh thô (JSON máy vẽ viết) ⇒ cảnh sạch hoặc null; `phienAm` = chữ chép nguyên văn từ ảnh. Chữ nào của cảnh không nằm trong phiên âm ⇒ null (không «sáng tác»).
 * `ketQua.lyDo` nói vì sao bỏ để máy vẽ sửa.
 */
export function kiemCanhHinh(tho: unknown, phienAm: readonly string[]): { ok: true; hinh: HinhVeLai } | { ok: false; lyDo: string } {
  if (!laObj(tho) || !laObj(tho.canh)) return { ok: false, lyDo: 'thiếu canh' }
  const x = tho.canh, tieuDe = chu(tho.tieuDe, 80)
  if (!tieuDe) return { ok: false, lyDo: 'thiếu tiêu đề' }
  let canh: CanhHinh | null = null
  if (x.loai === 'so-do') {
    const o = mang(x.o).map((b) => (laObj(b) && chu(b.id, 12) && chu(b.chu, 60) && so(b.x) !== null && so(b.y) !== null && trongKhung(so(b.x)!) && trongKhung(so(b.y)!) ? { id: chu(b.id, 12), chu: chu(b.chu, 60), x: so(b.x)!, y: so(b.y)! } : null))
    const ids = new Set(o.map((b) => b?.id))
    const noi = mang(x.noi).map((n) => (laObj(n) && chu(n.den, 12) && ids.has(chu(n.den, 12)) && mang(n.tu).length >= 1 && mang(n.tu).length <= 3 && mang(n.tu).every((t) => ids.has(chu(t, 12)))
      ? { tu: mang(n.tu).map((t) => chu(t, 12)), den: chu(n.den, 12), ...(chu(n.nhan, 60) ? { nhan: chu(n.nhan, 60) } : {}), ...(chu(n.so, 6) ? { so: chu(n.so, 6) } : {}) } : null))
    if (o.length < 2 || o.length > 14 || o.some((b) => !b) || noi.length < 1 || noi.length > 14 || noi.some((n) => !n)) return { ok: false, lyDo: 'sơ đồ: ô / mũi tên sai khuôn' }
    canh = { loai: 'so-do', o: o as CanhSoDo['o'], noi: noi as CanhSoDo['noi'] }
  } else if (x.loai === 'do-thi' && laObj(x.truc)) {
    const t = x.truc, xMin = so(t.xMin), xMax = so(t.xMax), yMax = so(t.yMax)
    const xv = mang(t.xVach).map(so), yv = mang(t.yVach).map(so)
    const que = mang(x.que).map((q) => (laObj(q) && so(q.x) !== null && so(q.y) !== null && so(q.y)! >= 0 ? { x: so(q.x)!, y: so(q.y)!, ...(chu(q.nhan, 40) ? { nhan: chu(q.nhan, 40) } : {}) } : null))
    if (xMin === null || xMax === null || yMax === null || xMax <= xMin || yMax <= 0 || !chu(t.x, 30) || !chu(t.y, 40) || xv.some((v) => v === null) || yv.some((v) => v === null) || xv.length > 10 || yv.length > 10
      || que.length < 1 || que.length > 24 || que.some((q) => !q || q.x < xMin || q.x > xMax || q.y > yMax)) return { ok: false, lyDo: 'đồ thị: trục / que sai khuôn' }
    canh = { loai: 'do-thi', truc: { x: chu(t.x, 30), y: chu(t.y, 40), xMin, xMax, yMax, xVach: xv as number[], yVach: yv as number[] }, que: que as CanhDoThi['que'] }
  } else if (x.loai === 'thi-nghiem' && x.khuon === 'chung-cat' && laObj(x.nhan)) {
    const n = x.nhan, ks = ['binh', 'luoi', 'sinhHan', 'vao', 'ra', 'hung'] as const
    if (ks.some((k) => !chu(n[k], 30))) return { ok: false, lyDo: 'dụng cụ: thiếu nhãn' }
    canh = { loai: 'thi-nghiem', khuon: 'chung-cat', nhan: Object.fromEntries(ks.map((k) => [k, chu(n[k], 30)])) as CanhThiNghiem['nhan'] }
  } else if (x.loai === 'svg') {
    const rong = so(x.rong), cao = so(x.cao)
    if (rong === null || cao === null) return { ok: false, lyDo: 'svg: thiếu rong / cao' }
    const k = lamSachSvg(x.svg, rong, cao)
    if (!k.ok) return { ok: false, lyDo: `svg: ${k.lyDo}` }
    canh = { loai: 'svg', rong, cao, svg: k.svg }
  } else if (x.loai === 'fischer') {
    const hang = mang(x.hang).map((h) => (Array.isArray(h) && h.length === 2 && chu(h[0], 6) && chu(h[1], 6) ? [chu(h[0], 6), chu(h[1], 6)] as [string, string] : null))
    if (!chu(x.dau, 10) || !chu(x.cuoi, 10) || hang.length < 2 || hang.length > 6 || hang.some((h) => !h)) return { ok: false, lyDo: 'Fischer sai khuôn' }
    canh = { loai: 'fischer', dau: chu(x.dau, 10), cuoi: chu(x.cuoi, 10), hang: hang as [string, string][] }
  }
  if (!canh) return { ok: false, lyDo: 'khuôn cảnh chưa hỗ trợ' }
  const kho = chuanChuHinh(phienAm.join(''))
  if (!kho && canh.loai !== 'svg') return { ok: false, lyDo: 'thiếu phiên âm ảnh' } // ảnh không chữ chỉ vẽ được bằng khuôn svg không nhãn
  if (tieuDe !== TIEU_DE_CHUNG[canh.loai] && !kho.includes(chuanChuHinh(tieuDe))) return { ok: false, lyDo: `tiêu đề «${tieuDe.slice(0, 30)}» phải là «${TIEU_DE_CHUNG[canh.loai]}» hoặc chú thích có trong ảnh` }
  const la = chuTrongCanh(canh).filter((t) => chuanChuHinh(t)).find((t) => !kho.includes(chuanChuHinh(t)))
  if (la !== undefined) return { ok: false, lyDo: `chữ «${la.slice(0, 24)}» không có trong ảnh gốc (không được thêm thông tin)` }
  return { ok: true, hinh: { phienBan: PHIEN_BAN_HINH, tieuDe, canh } }
}

/** App: cảnh nhận từ máy chủ còn dùng được (khuôn). Không cần phiên âm (máy chủ đã kiểm lúc nhận). */
export function hinhVeDungDuoc(x: unknown): HinhVeLai | null {
  if (!laObj(x) || x.phienBan !== PHIEN_BAN_HINH || !laObj(x.canh)) return null
  const k = kiemCanhHinh(x, [chuTrongCanhTho(x)])
  return k.ok ? k.hinh : null
}
// Cảnh đã qua máy chủ: dùng chính chữ của nó làm «phiên âm» để chỉ kiểm khuôn.
function chuTrongCanhTho(c: Record<string, unknown>): string {
  const ra: string[] = []
  const di = (v: unknown) => { if (typeof v === 'string') ra.push(v); else if (typeof v === 'number') ra.push(String(v)); else if (Array.isArray(v)) v.forEach(di); else if (laObj(v)) Object.values(v).forEach(di) }
  di(c)
  return ra.join(' ')
}
