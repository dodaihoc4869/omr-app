// TRÌNH BÀY PHƯƠNG TRÌNH Ở APP HỌC SINH (thầy 27/10, ảnh câu «tính base của amine»: «RNH₂+H₂O⇌RNH₃⁺+OH⁻» dính
// liền, ⇌ nhỏ lệch dòng, «l» trong HCl giống «I» hoa). Chỉ BỌC kí tự vào span có lớp — chữ (textContent) giữ
// nguyên; kiểu ở styles/trong-lam-bai.css mục «PHƯƠNG TRÌNH HOÁ RÕ RÀNG».
//   ct-tt  toán tử «+ → ⇌ ←» dính liền hai chất ⇒ khoảng hẹp hai bên (+ <wbr> cho phép xuống dòng sau toán tử)
//   ct-mt  mũi tên trần ⇒ cỡ và căn giữa dọc theo chữ
//   ct-kh  «↑ ↓» dính sau chất ⇒ khoảng hẹp trước
//   ct-l   «l» của Cl / Al / Tl ⇒ phông con một chữ «l» có đuôi
// Mảnh nạp lười: màn làm bài / tự chữa của app học sinh import ⇒ tự cắm vào ChemText (datTrinhBayChu).
import type { JSX } from 'react'
import { datTrinhBayChu } from './chem-format'

const RE_CAN_TRINH_BAY = /[+→⇌←↑↓]|[CAT]l/
const CHU_CHAT = /[A-Za-z0-9₀-₉⁰-⁹()[\]]/

/** Chuỗi chữ ⇒ nguyên chuỗi (không có gì cần bọc) hoặc mảng nút. `truoc` / `sau`
 * là kí tự kề bên ngoài chuỗi (đoạn chỉ số, số mũ…), rỗng nếu hết khúc. */
export function trinhBayChu(v: string, truoc = '', sau = ''): string | (string | JSX.Element)[] {
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

datTrinhBayChu(trinhBayChu)
