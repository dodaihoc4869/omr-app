// Hiển thị công thức Hoá học đẹp mắt (chỉ số dưới, số mũ điện tích, mũi tên
// phản ứng) từ văn bản thầy gõ thuần chữ — KHÔNG sửa dữ liệu gốc đã lưu, chỉ
// là bước trình bày (render) khi hiện lên màn hình.
//
// Quy tắc:
// 1) Mũi tên: "->" → "→", "<-" → "←", "<=>" → "⇌" (an toàn, không mơ hồ).
// 2) Đánh dấu tường minh (thầy chủ động gõ, LUÔN đúng vì thầy tự kiểm soát):
//    "_2" hoặc "_{23}" → chỉ số dưới; "^2+" hoặc "^{2-}" → số mũ (điện tích).
// 3) Tự động suy đoán PHẦN AN TOÀN, không mơ hồ:
//    - Một dãy số đứng ngay sau chữ cái/dấu đóng ngoặc, KHÔNG có dấu +/- bám
//      ngay sau → hiểu là chỉ số nguyên tử (vd H2O, CO2, Fe2O3) → chỉ số dưới.
//    - Dấu +/- đứng một mình ngay sau chữ/số, không có số khác kèm theo →
//      hiểu là điện tích đơn giản (vd Na+, Cl-) → số mũ.
//    - Trường hợp số ĐI KÈM dấu +/- (vd "SO42-", "Fe3+") có thể hiểu theo 2
//      nghĩa khác nhau tuỳ từng ion cụ thể → KHÔNG đoán bừa, giữ nguyên chữ
//      thường để tránh hiển thị sai điện tích. Muốn hiển thị đúng, thầy gõ rõ
//      bằng dấu ^: "SO4^{2-}" hoặc "Fe^3+".
// 4) Cú pháp chuẩn mhchem/LaTeX (dùng cho công thức đọc lại bằng ảnh, chính
//    xác tuyệt đối, không suy đoán): "\ce{...}" cho công thức/phương trình
//    Hoá (vd \ce{Ca^2+}, \ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}), "$...$" cho ký
//    hiệu toán/lý không phải phản ứng Hoá (vd $\Delta_f H^\circ_{298}$,
//    $E^\circ_{Ni^{2+}/Ni}$). Render bằng KaTeX (nhẹ, nhanh trên điện thoại
//    hơn MathJax). Công thức lỗi cú pháp -> hiện nguyên văn kèm dấu cảnh báo,
//    KHÔNG BAO GIỜ để trắng hay làm sập trang (bọc try/catch).
import type { JSX } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { goKyTuLa } from './chu-la-pdf'

type ChemPart = { t: 'text'; v: string } | { t: 'sub'; v: string } | { t: 'sup'; v: string }

function isAtomBoundaryChar(ch: string | undefined): boolean {
  if (!ch) return false
  return /[A-Za-zĐ)\]]/.test(ch)
}

// ---------------------------------------------------------------------------
// CÔNG THỨC TỔNG QUÁT — CnH2n+3N (thầy báo 06/09)
//
// LỖI ĐÃ DÍNH: kho đề ghi `$\ce{CnH2n+3N}$`. mhchem đọc `n+3` là ĐIỆN TÍCH của
// nguyên tố "n", nên in ra `CnH₂n³⁺N` — sai hẳn nghĩa, mà em đọc phiếu rồi học
// theo đúng cái sai đó. Kiểm bằng KaTeX thật: `\ce{CnH2n+3N}` ra "CnHX2nX3+N",
// còn `\ce{C_{n}H_{2n+3}N}` ra đúng "C_n H_{2n+3} N".
//
// SỬA Ở TẦNG TRÌNH BÀY, KHÔNG SỬA KHO ĐỀ: viết lại `Cn` → `C_{n}` và `H2n+3` →
// `H_{2n+3}` ngay trước khi đưa cho mhchem. Nhờ vậy mọi câu đã nằm trong kho
// hiện đúng ngay, không phải sửa tay hàng trăm file — và dữ liệu gốc thầy đã
// duyệt vẫn nguyên vẹn.

/** Chữ cái dùng làm BIẾN chỉ số trong công thức tổng quát. */
const BIEN_CHI_SO = 'nmxyzk'

/** Ký hiệu nguyên tố THẬT kết thúc bằng một chữ trong `BIEN_CHI_SO` — tách ra
 * là hỏng chất. Zn, Mn, Sn có mặt đầy trong chương trình phổ thông.
 *
 * CỐ Ý KHÔNG có `Cn` (copernicium) và `Cm` (curium): hai nguyên tố này không
 * bao giờ xuất hiện trong đề phổ thông, còn `CnH2n+2` và `CmH2m+2` thì có ở
 * mọi bài công thức tổng quát. */
const NGUYEN_TO_DUNG_YEN = new Set(['In', 'Mn', 'Rn', 'Sn', 'Zn', 'Am', 'Fm', 'Pm', 'Sm', 'Tm', 'Bk', 'Dy'])

/** Nguyên tố một chữ được phép mang chỉ số biến đứng một mình (`Cn`, `Hx`).
 * Giới hạn danh sách này để `Zn`, `Sn` không lọt vào. */
const NGUYEN_TO_MOT_CHU = 'CHNOSPR'

/** Đưa công thức tổng quát về dạng mhchem hiểu đúng.
 *
 * Hai luật, luật một an toàn tuyệt đối vì đòi có dấu +/- kèm số:
 *   1. `H2n+3` → `H_{2n+3}` · `CmH2m-2` → `CmH_{2m-2}`
 *   2. `Cn` → `C_{n}` khi sau nó là chữ HOA hoặc hết chuỗi, và ghép lại không
 *      thành một ký hiệu nguyên tố có thật. */
export function chuanHoaCongThucTongQuat(raw: string): string {
  let s = String(raw ?? '')
  // 1 — chỉ số có phép cộng trừ. CẤM khoảng trắng quanh dấu: `Zn + 2HCl` mà
  // cho phép khoảng trắng thì thành `Z_{n+2}HCl`, hỏng hẳn phương trình.
  s = s.replace(new RegExp(`([A-Z][a-z]?)((?:\\d+)?[${BIEN_CHI_SO}][+-]\\d+)(?![a-z0-9])`, 'g'), (m, nt: string, chiSo: string) =>
    NGUYEN_TO_DUNG_YEN.has(nt) || NGUYEN_TO_DUNG_YEN.has(nt + chiSo[0]) ? m : `${nt}_{${chiSo}}`,
  )
  // 2 — chỉ số là một biến đứng một mình.
  s = s.replace(new RegExp(`([${NGUYEN_TO_MOT_CHU}])((?:\\d+)?[${BIEN_CHI_SO}])(?=[A-Z_]|$)`, 'g'), (m, nt: string, chiSo: string) =>
    NGUYEN_TO_DUNG_YEN.has(nt + chiSo) ? m : `${nt}_{${chiSo}}`,
  )
  return s
}

// ---------------------------------------------------------------------------
// NHÃN MŨI TÊN CÓ NGOẶC VUÔNG LỒNG — sơ đồ chuyển hoá (thầy báo 06/09)
//
// LỖI ĐÃ DÍNH: kho ghi `\ce{->[+[Ag(NH3)2]OH][t^\circ]}`. mhchem đóng nhãn ở
// dấu `]` ĐẦU TIÊN nên nhãn thành `+[Ag(NH3)2`, còn `OH]` và `[t^\circ]` rơi ra
// ngoài thành chữ rời — đúng cái ảnh thầy chụp ở câu cellulose.
//
// Kiểm bằng KaTeX thật (mathml, đếm `<msub>`):
//   `->[+[Ag(NH3)2]OH][t^\circ]`     → nhãn trên "+[Ag(NH3)2OH][t°]", MẤT nhãn dưới
//   `->[+{[}Ag(NH3)2{]}OH][t^\circ]` → nhãn trên "+[Ag(NH₃)₂]OH", nhãn dưới "t°" ✓
//
// `{[}` là cách mhchem viết dấu ngoặc vuông NGUYÊN VĂN. Bọc cả nhãn trong `{}`
// cũng hết lỗi nhưng MẤT chỉ số dưới (in ra "NH3)2" thay vì "NH₃)₂").
const MUI_TEN_MHCHEM = /(<=>>|<<=>|<=>|<->|->|<-)(\s*)\[/g

/** Đổi `[` `]` bên trong NHÃN mũi tên thành `{[}` `{]}`.
 *
 * Chỉ động vào chữ nằm giữa nhãn, và chỉ khi ngoặc trong nhãn CÂN — lệch ngoặc
 * là dữ liệu đã hỏng sẵn, đoán tiếp chỉ hỏng thêm nên giữ nguyên cho hiện rõ. */
export function chuanHoaNhanMuiTen(raw: string): string {
  const s = String(raw ?? '')
  if (!s.includes('[')) return s
  let ra = ''
  let i = 0
  MUI_TEN_MHCHEM.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MUI_TEN_MHCHEM.exec(s)) !== null) {
    const moNhan = m.index + m[0].length - 1 // vị trí dấu `[` mở nhãn
    if (moNhan < i) continue // nhãn này đã nằm trong phần vừa xử lý
    ra += s.slice(i, moNhan)
    i = moNhan
    // Tối đa hai nhãn: `->[trên][dưới]`.
    for (let lan = 0; lan < 2 && s[i] === '['; lan++) {
      const dong = timNgoacDong(s, i)
      if (dong < 0) break
      ra += `[${thoatNgoacVuong(s.slice(i + 1, dong))}]`
      i = dong + 1
    }
    MUI_TEN_MHCHEM.lastIndex = i
  }
  return ra + s.slice(i)
}

/** Vị trí `]` khớp với `[` ở `mo`, tính cả ngoặc lồng. Không khớp thì -1. */
function timNgoacDong(s: string, mo: number): number {
  let sau = 0
  for (let j = mo; j < s.length; j++) {
    if (s[j] === '[') sau++
    else if (s[j] === ']') {
      sau--
      if (sau === 0) return j
    }
  }
  return -1
}

function thoatNgoacVuong(nhan: string): string {
  return nhan.replace(/\[/g, '{[}').replace(/\]/g, '{]}')
}

/** Một khúc của chuỗi: chữ thường, hoặc MỘT mũi tên kèm nhãn trên/nhãn dưới. */
export type KhucMuiTen = { t: 'chu'; v: string } | { t: 'mui'; mui: '→' | '←' | '⇌'; tren: string; duoi: string }

const KY_HIEU_MUI: Record<string, '→' | '←' | '⇌'> = { '->': '→', '<-': '←', '<=>': '⇌', '<->': '⇌' }
// `<=>` và `<->` phải đứng TRƯỚC `->` và `<-`, nếu không `<->` bị đọc thành
// `<` rồi `->` và mũi tên hai chiều biến thành mũi tên một chiều.
const RE_MUI = /(<=>|<->|->|<-)/g

/** Tách chuỗi thành chữ và MŨI TÊN KÈM NHÃN, để bên vẽ dựng nhãn nằm TRÊN và
 * DƯỚI thân mũi tên đúng như sách viết.
 *
 * Bản cũ nhét điều kiện vào ngoặc ngay sau mũi tên (`→ (+H2 dư, Ni, t°)`) vì
 * bộ vẽ PDF không xếp chồng chữ được. Phiếu nay là HTML nên xếp chồng được, và
 * sơ đồ chuyển hoá đọc đúng như trong sách giáo khoa. */
export function tachMuiTen(raw: string): KhucMuiTen[] {
  const s = String(raw ?? '')
  const ra: KhucMuiTen[] = []
  let i = 0
  RE_MUI.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_MUI.exec(s)) !== null) {
    if (m.index < i) continue
    if (m.index > i) ra.push({ t: 'chu', v: s.slice(i, m.index) })
    let j = m.index + m[0].length
    const nhan: string[] = []
    // Tối đa hai nhãn `[trên][dưới]`, cho phép một dấu cách trước mỗi nhãn.
    for (let lan = 0; lan < 2; lan++) {
      const sau = /^\s*\[/.exec(s.slice(j))
      if (!sau) break
      const mo = j + sau[0].length - 1
      const dong = timNgoacDong(s, mo)
      if (dong < 0) break
      nhan.push(s.slice(mo + 1, dong))
      j = dong + 1
    }
    ra.push({ t: 'mui', mui: KY_HIEU_MUI[m[0]], tren: nhan[0] ?? '', duoi: nhan[1] ?? '' })
    i = j
    RE_MUI.lastIndex = j
  }
  if (i < s.length) ra.push({ t: 'chu', v: s.slice(i) })
  return ra.filter((k) => k.t === 'mui' || k.v !== '')
}

// ---------------------------------------------------------------------------
// ĐỘ RỘNG ƯỚC TÍNH — quyết định công thức nằm trong dòng hay tách khối riêng.
//
// LỖI ĐÃ DÍNH: đo bằng `latex.length` thì `$\ce{->[+H2O][acid, t^\circ]}$` dài
// 28 ký tự nên bị đẩy thành KHỐI RIÊNG. Hậu quả: mỗi mũi tên của sơ đồ chuyển
// hoá rơi xuống một dòng, "Cellulose" một dòng, "X" một dòng — sơ đồ vỡ vụn.
//
// Đo cho đúng thứ mắt nhìn thấy: bỏ vỏ `\ce{}`, bỏ lệnh LaTeX và dấu gom, và
// HAI NHÃN của mũi tên XẾP CHỒNG nên chỉ tính nhãn dài hơn, không cộng dồn.

/** Bề rộng ước tính theo số ký tự MẮT NHÌN THẤY. */
export function beRongUocTinh(latex: string): number {
  let s = String(latex ?? '').trim()
  const voCe = /^\\ce\s*\{([\s\S]*)\}$/.exec(s)
  if (voCe) s = voCe[1]
  let rong = 0
  let i = 0
  while (i < s.length) {
    const con = s.slice(i)
    const mui = /^(<=>>|<<=>|<=>|<->|->|<-)(\s*)\[/.exec(con)
    if (mui) {
      i += mui[1].length + mui[2].length
      let daiNhat = 0
      for (let lan = 0; lan < 2 && s[i] === '['; lan++) {
        const dong = timNgoacDong(s, i)
        if (dong < 0) break
        daiNhat = Math.max(daiNhat, donDeDem(s.slice(i + 1, dong)).length)
        i = dong + 1
      }
      rong += 2 + daiNhat // thân mũi tên + nhãn rộng nhất
      continue
    }
    const lenh = /^\\[a-zA-Z]+/.exec(con)
    if (lenh) {
      rong += 1
      i += lenh[0].length
      continue
    }
    if ('{}_^'.includes(s[i])) {
      i += 1
      continue
    }
    rong += 1
    i += 1
  }
  return rong
}

function donDeDem(t: string): string {
  return t.replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}_^]/g, '')
}

/** Chuỗi liền (không khoảng trắng) chứa `-` nối vào chữ hay `[` `(` là CÔNG
 * THỨC CẤU TẠO, mọi dấu `-` trong đó là LIÊN KẾT chứ không phải điện tích.
 *
 * LỖI ĐÃ DÍNH (thầy báo 06/09): `-CO-NH-` in ra `-CO⁻NH⁻`, biến liên kết
 * peptide thành hai ion âm. Luật cũ chỉ nhìn một ký tự trước và một ký tự sau
 * nên dấu `-` cuối `-NH-` (sau nó là dấu cách) trông y hệt `OH-`.
 *
 * Nhìn CẢ TỪ thì phân biệt được: `-CO-NH-` có `-C`, `-N` nối vào chữ nên cả từ
 * là công thức cấu tạo; `OH-` thì không có dấu nối nào như vậy. */
function laCongThucCauTao(text: string, i: number): boolean {
  let dau = i
  while (dau > 0 && !/\s/.test(text[dau - 1])) dau--
  let cuoi = i
  while (cuoi < text.length && !/\s/.test(text[cuoi])) cuoi++
  return /-[A-Za-zĐ[(]/.test(text.slice(dau, cuoi))
}

// ---------------------------------------------------------------------------
// CẤU HÌNH ELECTRON — `1s22s22p3` phải ra `1s²2s²2p³` (thầy bắt được 10/09)
//
// Ảnh thầy chụp: câu "Cấu hình electron nguyên tử của nitrogen" hiện ra
// `1s₂₂s₂₂p₁`. Hai chỗ sai cùng lúc, cái thứ hai nặng hơn nhiều:
//
//   1. SỐ ELECTRON LÀ SỐ MŨ, không phải chỉ số dưới. Chỉ số dưới là số nguyên
//      tử trong công thức (H₂O). `1s₂` là một ký hiệu khác hẳn.
//   2. DÃY SỐ BỊ GỘP SAI. Luật cũ vơ CẢ dãy số đứng sau chữ, nên `1s22s2` cắt
//      thành `1s` + `22` + `s` + `2`: chữ số mở đầu lớp sau bị nuốt vào số
//      electron của lớp trước. Hậu quả trên màn làm bài là bốn phương án
//      `1s22s22p3` · `1s22s22p4` · `1s22p5` · `1s22s22p2` trông giống hệt nhau
//      ở hai lớp đầu — em chọn bừa mà tưởng mình đọc kỹ.
//
// KHÔNG SỬA KHO ĐỀ, sửa ở tầng trình bày: mọi câu đã nằm trong kho và mọi
// phiếu đã gửi phụ huynh tự đúng lại, không phải nạp lại đề nào.

/** Cắt một dãy thành các cụm `<lớp><phân lớp><số electron>`.
 *
 * Trả `null` nếu dãy KHÔNG phải cấu hình electron — bên gọi rơi về luật cũ.
 *
 * Chỗ khó duy nhất là biết chữ số nào kết thúc cụm này và chữ số nào mở cụm
 * sau. Luật: đang đọc số electron mà gặp một chữ số `1..7` có phân lớp
 * (`s p d f`) đứng ngay sau thì đó là lớp mới, dừng cụm tại đây.
 *
 *   `1s22s22p3` → 1s² · 2s² · 2p³
 *   `3d104s2`   → 3d¹⁰ · 4s²   (số `0` không mở được lớp nên `10` giữ nguyên)
 *   `4f14`      → 4f¹⁴          (`4` cuối không có phân lớp theo sau)
 */
export function cumCauHinhElectron(day: string): { lop: string; soE: string }[] | null {
  const s = String(day ?? '')
  if (!s) return null
  const ra: { lop: string; soE: string }[] = []
  let i = 0
  while (i < s.length) {
    if (!/[1-7]/.test(s[i]) || !/[spdf]/.test(s[i + 1] ?? '')) return null
    let j = i + 2
    let soE = ''
    while (j < s.length && /[0-9]/.test(s[j])) {
      if (soE.length > 0 && /[1-7]/.test(s[j]) && /[spdf]/.test(s[j + 1] ?? '')) break
      soE += s[j]
      j++
    }
    if (!soE) return null
    ra.push({ lop: s.slice(i, i + 2), soE })
    i = j
  }
  return ra.length > 0 ? ra : null
}

/** Ký tự được phép nằm trong một dãy cấu hình electron. */
const KY_TU_CAU_HINH = /[0-9spdf]/

/** Ký tự đứng SÁT trước hoặc sau dãy mà làm dãy đó không còn là cấu hình.
 *
 * Nhờ hai chốt này mà `H2SO4`, `Fe2O3`, `Na2S2O3` không lọt (chữ đứng sau số
 * đều là chữ HOA, mà phân lớp phải là chữ thường), và `Os`, `Np`, `Pd`, `Cf`
 * cũng không (chữ thường của chúng đứng sau chữ HOA, không đứng sau chữ số). */
function chanCauHinh(ch: string | undefined): boolean {
  return !!ch && /[A-Za-zĐ0-9]/.test(ch)
}

export function parseChemText(raw: string): ChemPart[] {
  const text = chuanHoaCongThucTongQuat(raw).replace(/<=>/g, '⇌').replace(/->/g, '→').replace(/<-/g, '←')
  const parts: ChemPart[] = []
  const pushText = (ch: string) => {
    const last = parts[parts.length - 1]
    if (last && last.t === 'text') last.v += ch
    else parts.push({ t: 'text', v: ch })
  }

  let i = 0
  while (i < text.length) {
    const ch = text[i]

    // Đánh dấu tường minh: _{...} hoặc _X
    if (ch === '_' && text[i + 1] === '{') {
      const end = text.indexOf('}', i + 2)
      if (end !== -1) {
        parts.push({ t: 'sub', v: text.slice(i + 2, end) })
        i = end + 1
        continue
      }
    }
    if (ch === '_' && /[A-Za-z0-9]/.test(text[i + 1] ?? '')) {
      parts.push({ t: 'sub', v: text[i + 1] })
      i += 2
      continue
    }

    // Đánh dấu tường minh: ^{...} hoặc ^(số/+/- liên tiếp)
    if (ch === '^' && text[i + 1] === '{') {
      const end = text.indexOf('}', i + 2)
      if (end !== -1) {
        parts.push({ t: 'sup', v: text.slice(i + 2, end) })
        i = end + 1
        continue
      }
    }
    if (ch === '^') {
      const m = /^[0-9+-]+/.exec(text.slice(i + 1))
      if (m) {
        parts.push({ t: 'sup', v: m[0] })
        i += 1 + m[0].length
        continue
      }
    }

    // CẤU HÌNH ELECTRON — xét TRƯỚC luật chỉ số dưới tự động, vì luật kia sẽ
    // vơ cả dãy số và cắt sai chỗ. Dãy phải đứng riêng: hai đầu không dính chữ
    // hay số nào khác.
    if (/[1-7]/.test(ch) && !chanCauHinh(text[i - 1])) {
      let cuoi = i
      while (cuoi < text.length && KY_TU_CAU_HINH.test(text[cuoi])) cuoi++
      if (!chanCauHinh(text[cuoi])) {
        const cum = cumCauHinhElectron(text.slice(i, cuoi))
        if (cum) {
          for (const c of cum) {
            pushText(c.lop)
            parts.push({ t: 'sup', v: c.soE })
          }
          i = cuoi
          continue
        }
      }
    }

    // Tự động: dãy số ngay sau chữ/dấu đóng ngoặc
    if (/[0-9]/.test(ch)) {
      const lastPart = parts[parts.length - 1]
      const prevChar = lastPart && lastPart.t === 'text' ? lastPart.v.slice(-1) : undefined
      if (isAtomBoundaryChar(prevChar)) {
        const m = /^[0-9]+/.exec(text.slice(i))!
        const after = text[i + m[0].length]
        // Số đi liền dấu +/- — có thể là chỉ số NGUYÊN TỬ hay ĐIỆN TÍCH tuỳ
        // ion cụ thể, không thể suy đoán chắc chắn → giữ nguyên chữ thường.
        //
        // TRỪ khi dấu đó là LIÊN KẾT trong công thức cấu tạo: `[CH2]4-CH(...)`
        // thì `4` là chỉ số nhóm, không dính dáng gì tới điện tích.
        const dauLaLienKet = after === '-' && laCongThucCauTao(text, i + m[0].length)
        if ((after === '+' || after === '-') && !dauLaLienKet) {
          pushText(m[0])
          i += m[0].length
          continue
        }
        parts.push({ t: 'sub', v: m[0] })
        i += m[0].length
        continue
      }
    }

    // Tự động: dấu +/- đứng một mình ngay sau chữ/dấu đóng ngoặc (không có số kèm)
    if ((ch === '+' || ch === '-') && i > 0) {
      const prevChar = text[i - 1]
      const nextChar = text[i + 1]
      const boundaryBefore = isAtomBoundaryChar(prevChar)
      const boundaryAfter = !nextChar || !/[0-9+-]/.test(nextChar)
      // Dấu `-` trong một công thức cấu tạo là LIÊN KẾT, không phải điện tích.
      const laLienKet = ch === '-' && laCongThucCauTao(text, i)
      if (boundaryBefore && boundaryAfter && !laLienKet) {
        parts.push({ t: 'sup', v: ch })
        i += 1
        continue
      }
    }

    pushText(ch)
    i += 1
  }
  return parts
}

type Segment = { t: 'ce' | 'math'; latex: string } | { t: 'plain'; text: string }

// Tách "\ce{...}" và "$...$" ra khỏi phần chữ thường xung quanh — phần chữ
// thường vẫn qua parseChemText (giữ nguyên cách hiển thị cũ, dữ liệu thầy đã
// gõ trước đây không cần sửa lại tay).
const CE_OR_MATH_RE = /\\ce\{([^}]*)\}|\$([^$]*)\$/g

export function splitCeSegments(raw: string): Segment[] {
  const text = raw ?? ''
  const out: Segment[] = []
  let last = 0
  let m: RegExpExecArray | null
  CE_OR_MATH_RE.lastIndex = 0
  while ((m = CE_OR_MATH_RE.exec(text))) {
    if (m.index > last) out.push({ t: 'plain', text: text.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ t: 'ce', latex: m[1] })
    else out.push({ t: 'math', latex: m[2] ?? '' })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ t: 'plain', text: text.slice(last) })
  return out
}

// displayMode:false TƯỜNG MINH — công thức luôn nằm trong dòng chữ (không
// tự tách khối riêng), dù đây vốn đã là mặc định của KaTeX. Ghi rõ ra để
// không ai vô tình bật displayMode:true sau này (sẽ làm công thức tự xuống
// dòng, chiếm hẳn 1 dòng riêng, đúng lỗi đã gặp).
const KATEX_OPTS = { throwOnError: true, strict: false, displayMode: false } as const

/** 1 công thức "\ce{...}" hoặc "$...$" render bằng KaTeX. Lỗi cú pháp -> hiện
 * nguyên văn chuỗi gốc kèm gạch chân đỏ cảnh báo, KHÔNG BAO GIỜ để trắng hay
 * làm sập trang. */
/** Công thức dài hơn ngần này thì tách thành khối riêng cuộn ngang được.
 *
 * Ngưỡng đặt theo phương trình NGẮN NHẤT đã thấy bị cắt trên máy thầy:
 * `HCOOCH3 + NaOH -> HCOONa + CH3OH` (32 ký tự) tràn khỏi ô lời giải ở màn
 * Gọi lên bảng. Bản đầu để 42 nên đúng câu đó vẫn lọt lưới. Để 26 thì mọi
 * phương trình phản ứng đều thành khối riêng, còn công thức một chất
 * (`CH3COOC2H5` — 10 ký tự) vẫn nằm trong dòng chữ như cũ.
 *
 * Thà xuống dòng thừa còn hơn cắt cụt: chữ tràn ra ngoài thì em MẤT HẲN vế
 * phải mà không biết là mình đang thiếu.
 *
 * Đo bằng `beRongUocTinh`, KHÔNG bằng `latex.length` — xem ghi chú ở hàm đó. */
const DAI_PHAI_CUON = 26

function ChemFormula({ t, latex: latexGoc }: { t: 'ce' | 'math'; latex: string }): JSX.Element {
  // Chuẩn hoá TRƯỚC khi đưa cho mhchem, nếu không `CnH2n+3N` ra sai (xem ghi
  // chú ở `chuanHoaCongThucTongQuat`), và nhãn mũi tên có ngoặc vuông lồng thì
  // vỡ (xem `chuanHoaNhanMuiTen`). Thoát ngoặc TRƯỚC: sau bước đó nhãn có thêm
  // `{[}` nên luật công thức tổng quát khỏi phải đoán giữa đống ngoặc.
  const latex = chuanHoaCongThucTongQuat(chuanHoaNhanMuiTen(latexGoc))
  try {
    const html = katex.renderToString(t === 'ce' ? `\\ce{${latex}}` : latex, KATEX_OPTS)
    // Công thức NGẮN: KHÔNG bọc thêm inline-block/overflow/vertical-align —
    // từng làm lệch đường chân chữ và CẮT mất chỉ số dưới (overflow-x:auto kéo
    // theo overflow-y:auto).
    //
    // Công thức DÀI: KaTeX không xuống dòng giữa phương trình được, nên để
    // nguyên là chữ tràn khỏi màn hình và em MẤT HẲN vế phải mà không biết —
    // đúng lỗi thầy chụp ngày 04-09. Tách thành khối riêng cuộn ngang được, có
    // đệm trên dưới để chỉ số dưới không bị cắt.
    if (beRongUocTinh(latex) > DAI_PHAI_CUON) {
      return (
        <span
          className="ct-dai"
          style={{ display: 'block', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', padding: '6px 0', margin: '2px 0', WebkitOverflowScrolling: 'touch' }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    }
    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    const goc = t === 'ce' ? `\\ce{${latex}}` : `$${latex}$`
    return (
      <span className="underline decoration-wavy decoration-rose-500 text-rose-600" title="Công thức lỗi cú pháp — hiện nguyên văn, thầy tự kiểm tra lại">
        {goc}
      </span>
    )
  }
}

/** Component hiển thị: <ChemText text={item.question.text} /> — nhận cả cú
 * pháp cũ (H2SO4, Na+, SO4^{2-} — tự suy chỉ số dưới/số mũ) LẪN cú pháp mới
 * chuẩn mhchem (\ce{...}, $...$) trong CÙNG một chuỗi, không cần chuyển đổi
 * dữ liệu cũ. */
export function ChemText({ text }: { text: string }): JSX.Element {
  // Lớp chắn cuối cho ký tự vùng dùng riêng: đề cũ đã nằm trong máy trước khi
  // cửa nạp biết dọn thì vẫn hiện đúng chứ không ra ô vuông rỗng.
  const segments = splitCeSegments(goKyTuLa(text ?? ''))
  return (
    <>
      {segments.map((seg, si) => {
        if (seg.t !== 'plain') return <ChemFormula key={si} t={seg.t} latex={seg.latex} />
        const parts = parseChemText(seg.text)
        return (
          <span key={si}>
            {parts.map((p, i) => {
              if (p.t === 'sub') return <sub key={i}>{p.v}</sub>
              if (p.t === 'sup') return <sup key={i}>{p.v}</sup>
              return <span key={i}>{p.v}</span>
            })}
          </span>
        )
      })}
    </>
  )
}
