// TRÌNH BÀY PHƯƠNG TRÌNH Ở APP HỌC SINH (thầy 27/10, ảnh câu «tính base của amine»: «RNH₂+H₂O⇌RNH₃⁺+OH⁻» dính
// liền, ⇌ nhỏ lệch dòng, «l» trong HCl giống «I» hoa). Chỉ BỌC kí tự vào span có lớp — chữ (textContent) giữ
// nguyên; kiểu ở styles/trong-lam-bai.css mục «PHƯƠNG TRÌNH HOÁ RÕ RÀNG».
//   ct-tt  toán tử «+ → ⇌ ←» dính liền hai chất ⇒ khoảng hẹp hai bên (+ <wbr> cho phép xuống dòng sau toán tử)
//   ct-mt  mũi tên trần ⇒ cỡ và căn giữa dọc theo chữ
//   ct-kh  «↑ ↓» dính sau chất ⇒ khoảng hẹp trước
//   ct-l   «l» của Cl / Al / Tl ⇒ phông con một chữ «l» có đuôi
//   ct-khong  chữ «không» PHỦ ĐỊNH (thầy 06/11: «riêng phần đề để chữ mảnh, chỉ in đậm chữ Không cần thiết trong đề») — chỉ ĐÁNH DẤU, độ đậm đặt ở
//          trong-lam-bai.css và CHỈ trong khung đề (phương án / lời giải không in đậm). Bỏ qua «không» thuộc từ ghép tính chất: không khí, không màu,
//          không mùi, không vị, không gian, không đổi, không no (chưa no), không phân cực, không bão hoà, không đáng kể; và «hay / hoặc không» cuối câu
//          hỏi. «KHÔNG» viết hoa: tác giả cố ý nhấn ⇒ luôn đánh dấu. Nhận cả «ô» dựng sẵn lẫn «o» + dấu mũ rời (chữ dán từ Word / PDF).
// Mảnh nạp lười: màn làm bài / tự chữa của app học sinh import ⇒ tự cắm vào ChemText (datTrinhBayChu).
import { Fragment, type JSX } from 'react'
import { datTrinhBayChu } from './chem-format'

const RE_CAN_TRINH_BAY = /[+→⇌←↑↓]|[CAT]l/
const CHU_CHAT = /[A-Za-z0-9₀-₉⁰-⁹()[\]]/

/** Chuỗi chữ ⇒ nguyên chuỗi (không có gì cần bọc) hoặc mảng nút. `truoc` / `sau`
 * là kí tự kề bên ngoài chuỗi (đoạn chỉ số, số mũ…), rỗng nếu hết khúc. */
function congThuc(v: string, truoc = '', sau = ''): string | (string | JSX.Element)[] {
  if (!RE_CAN_TRINH_BAY.test(v) && !(v[0] === 'l' && /[CAT]/.test(truoc))) return v
  const ra: (string | JSX.Element)[] = []
  let tu = 0
  const boc = (i: number, lop: string, den = i + 1) => {
    if (i > tu) ra.push(v.slice(tu, i))
    ra.push(<span key={i} className={lop}>{v.slice(i, den)}</span>)
    if (lop.startsWith('ct-tt')) ra.push(<wbr key={`w${i}`} />)
    tu = den
  }
  for (let i = 0; i < v.length; i++) {
    const c = v[i], t = i > 0 ? v[i - 1] : truoc, s = i + 1 < v.length ? v[i + 1] : sau
    const dinh = !!t && !!s && !/\s/.test(t) && !/\s/.test(s)
    if (c === '→' || c === '⇌' || c === '←') boc(i, dinh && !/[⎯─—–=-]/.test(t) ? 'ct-tt ct-mt' : 'ct-mt')
    else if (c === '+' && dinh && /[A-Za-z0-9)\]₀-₉⁰-⁹⁺⁻↑↓]/.test(t) && /[A-Za-z0-9([]/.test(s)) boc(i, 'ct-tt')
    else if ((c === '↑' || c === '↓') && t && !/\s/.test(t)) boc(i, 'ct-kh')
    else if (c === 'l' && /[CAT]/.test(t) && !/[a-zà-ỹđ]/.test(s)) {
      // bọc CẢ CHẤT chứa «l» (HCl, C₆H₅NH₃Cl) trong một nút chữ — chữ không bị cắt vụn (tìm chữ, chạm chữ vẫn thấy «HCl» liền)
      let dau = i, cuoi = i + 1
      while (dau > tu && CHU_CHAT.test(v[dau - 1])) dau--
      while (cuoi < v.length && CHU_CHAT.test(v[cuoi])) cuoi++
      boc(dau, 'ct-l', cuoi)
      i = cuoi - 1
    }
  }
  if (!ra.length) return v
  if (tu < v.length) ra.push(v.slice(tu))
  return ra
}

const giuNguyen = (v: string): string => v
// MÀN THI link /t (data-trong='hs' mà KHÔNG có data-ht2 của cổng): chỉ «không» (thầy 07/11), bỏ span trình bày phương trình — tác tử tốc độ đo
// 800 ChemText ×4 CPU +20 ms vì span thêm; cổng học sinh (data-ht2) và test (không data-trong) giữ trình bày đủ như 27/10.
// Đọc thuộc tính <html> MỘT lần mỗi nhịp vẽ (nhớ tới hết microtask) thay vì mỗi khúc chữ — màn thi ~800 khúc / lượt vẽ.
let nhoCheDo: typeof congThuc | null = null
function cheDo(): typeof congThuc {
  if (!nhoCheDo) {
    const g = document.documentElement
    nhoCheDo = g.dataset.trong === 'hs' && !g.hasAttribute('data-ht2') ? giuNguyen : congThuc
    queueMicrotask(() => { nhoCheDo = null })
  }
  return nhoCheDo
}
const RE_KHONG = /(^|[^\p{L}\p{M}\p{N}])(kh(?:ô|o\u0302)ng)(?![\p{L}\p{M}\p{N}])/giu // nhóm bắt ký tự đứng trước thay cho nhìn-lùi (iPhone iOS < 16.4 không chạy)
const RE_KHONG_NHANH = /kh(?:ô|o\u0302)ng/i
const TU_GHEP = /^\s+(khí|màu|mùi|vị|gian|đổi|no|phân cực|bão hòa|bão hoà|đáng kể)(?![\p{L}\p{M}\p{N}])/u
const HAY_HOAC = /(?:^|[^\p{L}\p{M}])(?:hay|hoặc)\s+$/iu

/** «không» tại vị trí `i` (dài `n`) của `v` có phải chữ phủ định cần nhấn không. */
export function laKhongNhan(v: string, i: number, n: number): boolean {
  const chu = v.slice(i, i + n).normalize('NFC')
  if (chu === 'KHÔNG') return true
  const sau = v.slice(i + n, i + n + 16).normalize('NFC').toLowerCase()
  if (TU_GHEP.test(sau)) return false
  return !HAY_HOAC.test(v.slice(Math.max(0, i - 8), i).normalize('NFC'))
}

/** Chuỗi chữ ⇒ nguyên chuỗi hoặc mảng nút: «không» phủ định bọc `ct-khong`, phần còn lại qua luật phương trình như cũ. */
export function trinhBayChu(v: string, truoc = '', sau = ''): string | (string | JSX.Element)[] {
  const trinhBayCongThuc = cheDo()
  if (!RE_KHONG_NHANH.test(v)) return trinhBayCongThuc(v, truoc, sau)
  const ra: (string | JSX.Element)[] = []
  let tu = 0
  const day = (den: number) => {
    if (den <= tu) return
    const k = trinhBayCongThuc(v.slice(tu, den), tu > 0 ? v[tu - 1] : truoc, den < v.length ? v[den] : sau)
    ra.push(typeof k === 'string' ? k : <Fragment key={`p${tu}`}>{k}</Fragment>)
  }
  for (const m of v.matchAll(RE_KHONG)) {
    const i = (m.index ?? 0) + m[1].length, chu = m[2]
    if (!laKhongNhan(v, i, chu.length)) continue
    day(i)
    ra.push(<span key={`k${i}`} className="ct-khong">{chu}</span>)
    tu = i + chu.length
  }
  if (!ra.length) return trinhBayCongThuc(v, truoc, sau)
  day(v.length)
  return ra
}

// 07/11 (thầy: «in đậm chữ không trong đề thi nữa»): mảnh này nay nạp CÙNG gói KaTeX (katex-goi.ts, không còn import ở ManLamBaiTap) ⇒ màn thi /t,
// thi trong cổng, Kiểm tra ôn tập, mọi màn làm câu đều có (cắm TRƯỚC khi KaTeX báo về ⇒ mọi ChemText vẽ lại có đánh dấu). CHỈ cắm khi
// <html data-trong='hs'>: app thầy ('gv'), phiếu, test (không có data-trong — tests/_nap-katex.ts nạp KaTeX cho mọi tệp) giữ DOM y nguyên;
// test cần trình bày này gọi `datTrinhBayChu(trinhBayChu)`.
export function camNeuHs(): boolean {
  const co = typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs'
  if (co) datTrinhBayChu(trinhBayChu)
  return co
}
camNeuHs()
