// CHỮ PHÔNG CŨ (TCVN3 / .VnTime) và CHỮ TRÊN-DƯỚI MŨI TÊN BỊ XEN KẼ — thầy chụp 19/10 (câu quang hợp DB-12-B6-D3-III-46):
//   "CO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂"
// NGUYÊN NHÂN GỐC (ở kho đề, không phải ở app): tệp Word gõ nhãn trên mũi tên bằng phông TCVN3 (ô công thức MathType xếp CHỒNG hai hàng:
// hàng trên "¸nh s¸ng" = "ánh sáng", hàng dưới "chÊt diÖp lôc (chlorophyll)" = "chất diệp lục (chlorophyll)"), bộ nhập đọc ô theo CỘT nên
// hai hàng xen kẽ từng chữ, chữ "n" của hàng trên thành số mũ "ⁿ", dấu ngoặc hàng dưới thành chỉ số "₍ ₎", mã TCVN3 đọc như Unicode.
// Mô-đun này THUẦN (không React) — dùng chung cho bộ hiển thị (`chem-format`), phiếu PDF và công cụ soi kho `scripts/soi-phong-cu-kho.mjs`.

/** Ký tự CHỈ có trong phông TCVN3, không dùng trong chữ Việt Unicode, tiếng Anh hay kí hiệu Hoá thường gặp (loại ×, ·, µ, ½, ø, ö, ü là kí hiệu hợp lệ). */
const KY_TU_TCVN3 = '¸¶ª«¬¨»®ÆÇËÏÐÑÞß¡¢£¤¥¦'
const RE_CHU_HOA_GIUA = /[a-zà-ỹ][ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝÖ]/
const RE_XEN_KE = /[A-Za-zÀ-ỹ]ⁿ[A-Za-zÀ-ỹ₀-₉₌]|⁼|₍[A-Za-z¸-ÿ]{3,}₎/
const RE_NGAT = /[\s→⟶⇌⇄]+/

export type PhongCuTim = { loai: 'tcvn3' | 'xen-ke'; token: string; ngu: string }

/** Liệt kê các token nghi là chữ phông cũ / chữ xen kẽ (không sửa). Mỗi token ≤ 80 ký tự, kèm `soNgu` (mặc định 24) ký tự quanh. */
export function timPhongCu(text: string, soNgu = 24): PhongCuTim[] {
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
    out.push({ loai: tcvn ? 'tcvn3' : 'xen-ke', token: t.slice(0, 80), ngu: text.slice(Math.max(0, i - soNgu), i + t.length + soNgu).replace(/\s+/g, ' ') })
  }
  return out
}

// ---------------------------------------------------------------- GIẢI MÃ TCVN3 → Unicode
// Bảng chữ thường TCVN3 (ABC): mã 0xA1–0xFE đọc như Latin-1. Chữ HOA có dấu của TCVN3 nằm ở phông riêng (VnTimeH) nên chỉ có Ă Â Ê Ô Ơ Ư Đ.
const TCVN3: Record<string, string> = {
  'µ': 'à', '¸': 'á', '¶': 'ả', '·': 'ã', '¹': 'ạ', '¨': 'ă', '»': 'ằ', '¾': 'ắ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
  '©': 'â', 'Ç': 'ầ', 'Ê': 'ấ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ', '®': 'đ',
  'Ì': 'è', 'Ð': 'é', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ', 'ª': 'ê', 'Ò': 'ề', 'Õ': 'ế', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ',
  '×': 'ì', 'Ý': 'í', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
  'ß': 'ò', 'ã': 'ó', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ', '«': 'ô', 'å': 'ồ', 'è': 'ố', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
  '¬': 'ơ', 'ê': 'ờ', 'í': 'ớ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ',
  'ï': 'ù', 'ó': 'ú', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ', '­': 'ư', 'õ': 'ừ', 'ø': 'ứ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự',
  'ú': 'ỳ', 'ý': 'ý', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
  '¡': 'Ă', '¢': 'Â', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư', '§': 'Đ',
}
/** Đọc lại chuỗi TCVN3 bị đọc như Unicode. CHỈ gọi cho chuỗi đã biết là TCVN3 (mọi chữ cái có dấu trong đó là mã TCVN3). */
export function giaiMaTcvn3(s: string): string {
  let out = ''
  for (const c of s) out += TCVN3[c] ?? c
  return out
}

// ---------------------------------------------------------------- SỬA chữ trên-dưới mũi tên bị xen kẽ (dạng ĐÃ BIẾT CHẮC)
// Hai hàng chữ xếp chồng quanh mũi tên bị đọc theo CỘT ⇒ KHÔNG đảo ngược được bằng luật chung (không biết hàng nào chữ nào) nếu không có từ điển.
// Chỉ sửa chuỗi ĐÃ ĐỐI CHIẾU bằng tay với câu gốc (khoá = chuỗi bỏ hết khoảng trắng); chuỗi lạ giữ nguyên, để công cụ soi kho báo.
// Mỗi mục: [nhãn TRÊN mũi tên, nhãn DƯỚI mũi tên] — dạng đúng của sách giáo khoa.
// Soi toàn kho 19/10 (D1 `game_v2_question`, 15 359 câu / 268 tờ): đúng 5 câu có chữ trên-dưới mũi tên vỡ, thuộc ba dạng — mỗi dạng một nhánh dưới đây:
//  · "¸nh s¸ng" + "chÊt diÖp lôc (chlorophyll)" xen kẽ theo cột — DB-12-B6-D3-III-46, DH-12-C2-B6-III-51, DH-12-C2-B6-DT-III-10;
//  · "eⁿzim" / "eⁿzyme": chữ "n" của enzim thành số mũ, dính ngay trước mũi tên — DH-12-C2-B6-DT-III-8, DH-12-C2-B5-DT-III-6 (mũi tên thứ nhất);
//  · "Heⁿ₌z₈y₀m%e": hàng trên "enzyme" xen hàng dưới "H=80%" — DH-12-C2-B5-DT-III-6 (mũi tên thứ hai).
// Các dạng vỡ khác ("SH⁼⁹⁶%→…", "ch¸ÊⁿthdisÖ¸pⁿlgôc") chỉ còn trong ô GHI CHÚ nội bộ của lời giải, không tới học sinh.
// Viết gọn có chủ ý: mô-đun này nằm trong gói MỞ app học sinh (luật tốc độ) — thêm chuỗi đã đối chiếu = thêm một nhánh vào biểu thức dưới.
const RE_NHAN_XEN_KE = /\s*(?:(chÊtdiÖp[^→]*₎)|eⁿz(im|yme)|(Heⁿ₌[^→]*%e))\s*→\s*/g

/** Thay chữ vỡ ĐÃ BIẾT (và mũi tên theo sau) bằng `→(nhãn trên)(nhãn dưới) `: bộ hiển thị vẽ nhãn lên / xuống thân mũi tên như sách. */
export const suaNhanXenKe = (t: string): string =>
  t.replace(RE_NHAN_XEN_KE, (_m, quangHop?: string, enzim?: string, hieuSuat?: string) =>
    ` →(${quangHop ? 'ánh sáng)(chất diệp lục (chlorophyll)' : hieuSuat ? 'enzyme)(H = 80%' : 'enz' + enzim}) `)
