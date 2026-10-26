// BỌC CHỮ ĐỀ TẠI CHỖ (làn B, 26/10) — «chỉ bọc trong các nút chữ, không phá cấu trúc».
// Luật cứng (để React không bao giờ hụt nút nó đang giữ):
//   1. CHỈ tách nút chữ (Text.splitText) và bọc MẢNH CHỮ vào <span> mới — KHÔNG bao giờ dời một phần tử (<sub>, <span class=ct-lien>, ảnh…).
//      Vùng vắt qua nhiều nút (FeS<sub>2</sub>) ⇒ nhiều mảnh cùng `data-vung`, mảnh đầu nhận Tab / Enter.
//   2. Bỏ qua công thức KaTeX, sơ đồ phản ứng, mũi tên, bảng, nút bấm, ô nhập, hình vẽ.
//   3. `go()` trả DOM về ĐÚNG như cũ (mảnh chữ về chỗ, nút chữ đã tách ghép lại vào nút gốc) — React StrictMode chạy hiệu ứng hai lần vẫn đúng.
// Vị trí vùng = vị trí ký tự trong chữ ghép từ các nút chữ đủ điều kiện (= «chữ đề thô đã bỏ thẻ HTML» của hợp đồng kieu.ts).
import type { LoaiCham, VungCham } from '../../lib/goi-y-cham/kieu'

const BO_QUA = '.katex,.ct-cho-katex,.ct-dai,.so-do,.mt,table,button,a,input,textarea,select,svg,img,script,style,[contenteditable],[data-gyc-bo-qua]'
const LOAI: readonly LoaiCham[] = ['cho', 'hoi', 'chat', 'khoa']

const KHOI = new Set(['P', 'LI', 'DIV', 'SECTION', 'ARTICLE', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LABEL', 'DD', 'DT', 'FIGCAPTION', 'FIELDSET'])
export type Khoi = { chu: string; nut: { n: Text; tu: number }[] }
/**
 * Chữ ghép + bảng vị trí các nút chữ đủ điều kiện dưới `goc`, TÁCH THEO KHỐI (đoạn, ý Đ/S, ô bảng…): mỗi khối dò riêng
 * (thầy/làn A 26/10: «ý Đ/S: gọi phatHien riêng cho từng ý») — không ghép chữ cuối ý a) với chữ đầu ý b) thành một vùng ma.
 */
export function chuCuaGoc(goc: HTMLElement): Khoi[] {
  const ds: Khoi[] = []
  const theoKhoi = new Map<Element, Khoi>()
  const di = document.createTreeWalker(goc, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => n.nodeType === 1 ? ((n as Element).matches(BO_QUA) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT,
  })
  for (let n = di.nextNode(); n; n = di.nextNode()) {
    const t = n as Text
    if (!t.data) continue
    let k: Element = goc
    for (let e = t.parentElement; e && e !== goc; e = e.parentElement) if (KHOI.has(e.tagName) || e.hasAttribute('data-gyc-khoi')) { k = e; break }
    let khoi = theoKhoi.get(k)
    if (!khoi) { khoi = { chu: '', nut: [] }; theoKhoi.set(k, khoi); ds.push(khoi) }
    khoi.nut.push({ n: t, tu: khoi.chu.length })
    khoi.chu += t.data
  }
  return ds
}

/** Ký tự không nhìn thấy (khoảng trắng, xuống dòng, ký tự rộng 0) — cụm chỉ gồm chúng thì không vẽ ô. */
const VO_HINH = /[\s\u00a0\u200b-\u200d\u2060\ufeff]/
const RE_VO_HINH = /[\s\u00a0\u200b-\u200d\u2060\ufeff]/g
/** Cắt ký tự vô hình hai đầu mỗi vùng (ảnh thầy 27/10: ô «đề hỏi» RỖNG lẻ ở cuối đề); vùng chỉ còn rỗng ⇒ bỏ. */
export function catKhoangTrang(ds: unknown, chu: string): unknown {
  if (!Array.isArray(ds)) return ds
  const ra: VungCham[] = []
  for (const v of ds as VungCham[]) {
    if (!v || typeof v !== 'object' || !Number.isInteger(v.tu) || !Number.isInteger(v.den)) { ra.push(v); continue }
    let tu = Math.max(0, v.tu), den = Math.min(chu.length, v.den)
    while (tu < den && VO_HINH.test(chu[tu]!)) tu++
    while (den > tu && VO_HINH.test(chu[den - 1]!)) den--
    if (den > tu) ra.push({ ...v, tu, den })
  }
  return ra
}

/** Vùng hợp lệ, xếp theo vị trí, bỏ vùng chồng nhau (giữ vùng đến trước). */
export function lamSachVung(ds: unknown, dai: number): VungCham[] {
  if (!Array.isArray(ds)) return []
  const tot = ds.filter((v): v is VungCham => !!v && typeof v === 'object' && LOAI.includes((v as VungCham).loai) &&
    Number.isInteger((v as VungCham).tu) && Number.isInteger((v as VungCham).den) && (v as VungCham).tu >= 0 && (v as VungCham).den > (v as VungCham).tu && (v as VungCham).den <= dai)
    .sort((a, b) => a.tu - b.tu)
  const ra: VungCham[] = []
  for (const v of tot) if (!ra.length || v.tu >= ra[ra.length - 1].den) ra.push(v)
  return ra
}

export type KetQuaBoc = { vung: VungCham[]; /** chữ TOÀN đề (mọi khối nối bằng xuống dòng) — `theCho` đọc «Cho nguyên tử khối …» dù nó nằm ở đoạn khác */ chuDe: string; manh: HTMLElement[][]; go: () => void }

/**
 * Tìm vùng trong từng khối chữ dưới `goc` (hàm `phatHien` của làn A) rồi bọc từng vùng.
 * `loc(ds)`: bỏ bớt vùng theo luật của màn (vd câu lý thuyết chỉ giữ «Đề hỏi»). `chamDuoc(v, chuDe)` = vùng có thẻ giải nghĩa (mảnh đầu nhận Tab).
 * Lỗi bất kỳ ⇒ trả DOM nguyên trạng, không vùng nào (đề vẫn hiện trơn).
 */
export function bocVung(goc: HTMLElement, phatHien: (chu: string) => VungCham[], chamDuoc: (v: VungCham, chu: string) => boolean, loc: (ds: VungCham[]) => VungCham[] = (x) => x): KetQuaBoc {
  const tach: { goc: Text; moi: Text }[] = []
  const boc: HTMLElement[] = []
  const go = () => {
    for (const s of boc.splice(0).reverse()) {
      const cha = s.parentNode
      if (!cha) continue
      while (s.firstChild) cha.insertBefore(s.firstChild, s)
      cha.removeChild(s)
    }
    for (const { goc: g, moi } of tach.splice(0).reverse()) {
      g.data += moi.data
      moi.parentNode?.removeChild(moi)
    }
  }
  try {
    const khoi = chuCuaGoc(goc)
    const tim: { v: VungCham; k: number }[] = []
    khoi.forEach((kh, k) => {
      if (!kh.chu.trim()) return
      let ds: VungCham[]
      try { ds = lamSachVung(catKhoangTrang(phatHien(kh.chu), kh.chu), kh.chu.length) } catch { ds = [] }
      for (const v of ds) tim.push({ v, k })
    })
    const giu = new Set(loc(tim.map((x) => x.v)))
    const chon = tim.filter((x) => giu.has(x.v))
    const vung = chon.map((x) => x.v), chuDe = khoi.map((x) => x.chu).join('\n')
    const manh: HTMLElement[][] = vung.map(() => [])
    // Đi TỪ CUỐI lên: tách đuôi một nút chữ không làm lệch vị trí phần đầu của chính nút ấy (nút gốc luôn giữ phần đầu).
    for (let i = vung.length - 1; i >= 0; i--) {
      const v = vung[i], nut = khoi[chon[i].k].nut
      for (let j = nut.length - 1; j >= 0; j--) {
        const { n, tu } = nut[j]
        const a = Math.max(v.tu, tu) - tu, b = Math.min(v.den, tu + n.data.length) - tu
        if (b <= a) continue
        if (b < n.data.length) tach.push({ goc: n, moi: n.splitText(b) })
        let giua: Text
        if (a > 0) giua = n.splitText(a)
        else {
          // Cả phần đầu nút là vùng: nút GỐC (React đang giữ) ở yên tại chỗ với chữ rỗng, mảnh chữ là nút MỚI ngay sau nó.
          giua = document.createTextNode(n.data)
          n.data = ''
          n.parentNode!.insertBefore(giua, n.nextSibling)
        }
        tach.push({ goc: n, moi: giua })
        if (!giua.data.replace(RE_VO_HINH, '')) continue
        const s = document.createElement('span')
        s.className = `gyc-v gyc-${v.loai}`
        s.dataset.vung = String(i)
        giua.parentNode!.insertBefore(s, giua)
        s.appendChild(giua)
        boc.push(s)
        manh[i].unshift(s)
      }
    }
    vung.forEach((v, i) => {
      const ds = manh[i]
      if (!ds.length) return
      if (ds.length > 1) { ds[0].classList.add('gyc-dau'); ds[ds.length - 1].classList.add('gyc-cuoi'); ds.forEach((s) => s.classList.add('gyc-nhieu')) }
      if (v.loai === 'khoa') ds.forEach((s) => s.classList.add('gyc-dam'))
      if (!chamDuoc(v, chuDe)) return
      ds.forEach((s) => s.classList.add('gyc-cham'))
      const dau = ds[0]
      dau.tabIndex = 0
      dau.setAttribute('role', 'button')
      dau.setAttribute('aria-haspopup', 'dialog')
      dau.setAttribute('aria-expanded', 'false')
      dau.setAttribute('aria-label', `${v.chu || ds.map((s) => s.textContent).join('')}: chạm để xem giải nghĩa`)
    })
    return { vung, chuDe, manh, go }
  } catch {
    go()
    return { vung: [], chuDe: '', manh: [], go }
  }
}
