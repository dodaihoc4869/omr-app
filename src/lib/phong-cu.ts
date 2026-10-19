// CHỮ PHÔNG CŨ (TCVN3 / .VnTime) và CHỮ TRÊN-DƯỚI MŨI TÊN BỊ XEN KẼ — thầy chụp 19/10 (câu quang hợp DB-12-B6-D3-III-46):
//   "CO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂"
// NGUYÊN NHÂN GỐC (ở kho đề, không phải ở app): tệp Word gõ nhãn trên mũi tên bằng phông TCVN3 (ô công thức MathType xếp CHỒNG hai hàng:
// hàng trên "¸nh s¸ng" = "ánh sáng", hàng dưới "chÊt diÖp lôc (chlorophyll)" = "chất diệp lục (chlorophyll)"), bộ nhập đọc ô theo CỘT nên
// hai hàng xen kẽ từng chữ, chữ "n" của hàng trên thành số mũ "ⁿ", dấu ngoặc hàng dưới thành chỉ số "₍ ₎", mã TCVN3 đọc như Unicode.
// Mô-đun này THUẦN (không React) — dùng chung cho bộ hiển thị (`chem-format`), phiếu PDF và công cụ soi kho `scripts/soi-phong-cu-kho.mjs`.

/** Ký tự CHỈ có trong phông TCVN3, không dùng trong chữ Việt Unicode, tiếng Anh hay kí hiệu Hoá thường gặp (loại ×, ·, µ, ½, ø, ö, ü là kí hiệu hợp lệ). */
const KY_TU_TCVN3 = '¸¶ª«¬¨»®ÆÇËÏÐÑÞß¡¢£¤¥¦'
const RE_CHU_HOA_GIUA = /[a-zà-ỹ][ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝÖ]/
const RE_XEN_KE = /[A-Za-zÀ-ỹ]ⁿ[A-Za-zÀ-ỹ]|⁼|₍[A-Za-z¸-ÿ]{3,}₎/
const RE_NGAT = /[\s→⟶⇌⇄]+/

export type PhongCuTim = { loai: 'tcvn3' | 'xen-ke'; token: string; ngu: string }

/** Liệt kê các token nghi là chữ phông cũ / chữ xen kẽ (không sửa). Mỗi token ≤ 80 ký tự, kèm 24 ký tự quanh. */
export function timPhongCu(text: string): PhongCuTim[] {
  const out: PhongCuTim[] = []
  if (!text || !/[^\x00-\x7F]/.test(text)) return out
  let vt = 0
  for (const t of text.split(RE_NGAT)) {
    const i = text.indexOf(t, vt)
    vt = i + t.length
    if (!t) continue
    const tcvn = [...t].some((c) => KY_TU_TCVN3.includes(c)) || RE_CHU_HOA_GIUA.test(t)
    const xen = RE_XEN_KE.test(t)
    if (!tcvn && !xen) continue
    out.push({ loai: tcvn ? 'tcvn3' : 'xen-ke', token: t.slice(0, 80), ngu: text.slice(Math.max(0, i - 24), i + t.length + 24).replace(/\s+/g, ' ') })
  }
  return out
}
