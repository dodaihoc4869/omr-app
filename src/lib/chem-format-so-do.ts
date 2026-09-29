// SƠ ĐỒ CHUYỂN HOÁ & NHÃN MŨI TÊN — luật trình bày dùng chung cho màn hình
// (ChemText) và phiếu/tờ chiếu (chuHtml). Chỉ là bước HIỂN THỊ, không sửa kho.
//
// Thầy chụp câu 28/09 (DH-12-C2-B6 câu III.16):
//   "CO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ ⁽²⁾→ C₆H₁₂O₆ ⁽³⁾→ C₂H₅OH ⁽⁴⁾→CH₃COOH Gán số thứ tự…"
// hiện ra: số (1) treo lơ lửng TRƯỚC mũi tên, "(C6H10O5)" bị hút lên làm chữ
// nhỏ trên mũi tên (ₙ rơi lại một mình), và "Gán số thứ tự…" dính liền sau
// CH₃COOH. Ba luật dưới đây sửa đúng ba lỗi đó cho MỌI câu:
//
// 1) `nhanTruocMuiTenVeSau` — số hiệu viết TRƯỚC mũi tên ("(1) →", "⁽¹⁾→")
//    được đưa lên trên thân mũi tên như sách: "→(1)".
// 2) `laNhanMuiTen` — ngoặc sau mũi tên CHỈ là nhãn khi dính liền mũi tên
//    (hoặc cách một dấu cách nhưng rõ ràng là điều kiện/số hiệu), và KHÔNG có
//    chỉ số bám sau ngoặc: "→ (C₆H₁₀O₅)ₙ", "→ [Cu(NH₃)₄](OH)₂" là CHẤT.
// 3) `tachDongSoDo` — sơ đồ/phương trình đứng dính vào câu chữ được tách ra
//    đứng riêng một dòng.

const MUI_KY_TU = '→←⇌'
const SO_MU: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }

/** "CO₂ ⁽¹⁾→ X", "CO₂ (1) → X" → "CO₂ →(1) X".
 *
 * Chỉ nhận số hiệu 1–2 chữ số hoặc La Mã đứng SAU một chất (có dấu cách trước)
 * và NGAY TRƯỚC mũi tên. Không đụng "(1) → (3) → (2)" (dãy thứ tự ở phương
 * án): số hiệu đứng đầu chuỗi, hoặc sau mũi tên lại là một số hiệu khác. */
export function nhanTruocMuiTenVeSau(raw: string): string {
  let s = String(raw ?? '')
  if (!/[→←⇌]|->|<=>/.test(s)) return s
  // Số mũ trong ngoặc mũ: ⁽¹⁾→
  s = s.replace(/(\S)[ \t]*⁽([⁰¹²³⁴-⁹]{1,2})⁾[ \t]*(→|←|⇌)[ \t]*/g, (_m, truoc: string, so: string, mui: string) => {
    const soThuong = [...so].map((c) => SO_MU[c] ?? c).join('')
    return `${truoc} ${mui}(${soThuong}) `
  })
  // Ngoặc thường: " (1) →"
  s = s.replace(/(\S)[ \t]+\((\d{1,2}|[IVX]{1,4})\)[ \t]*(→|←|⇌|->|<=>)(?![ \t]*[(⁽][\dIVX]{1,4}[)⁾])(?![([])[ \t]*/g, (m, truoc: string, so: string, mui: string) => {
    // "(1) → (3)": trước số hiệu cũng là mũi tên/số hiệu ⇒ dãy thứ tự, giữ nguyên.
    if (/[→←⇌)>]/.test(truoc)) return m
    return `${truoc} ${mui}(${so}) `
  })
  // Mũi tên dài kiểu PDF: "NH₃ —(O₂, t°, xt)→ NO", "--enzyme→", "C₆H₅NO₂ —(1) Fe + HCl→ …", "—t°→".
  s = s.replace(/[ \t]*(?:—|--)(\S[^—–→⇌\n]{0,31}?)(→|⇌)(?!\()[ \t]*/g, (m, nhan: string, mui: string) => {
    let n = nhan.trim()
    if (!n || demTuChu(n) > 4) return m
    if (n.startsWith('(') && timDong(n, 0) === n.length - 1) n = n.slice(1, -1).trim()
    return ` ${mui}(${n}) `
  })
  // "NH₄Clto→" (PDF mất dấu độ): "to" dính sau công thức ngay trước mũi tên là t°.
  // KHÔNG dùng lookbehind (nhóm nhìn lùi): Safari iOS < 16.4 báo "invalid group specifier name" lúc NẠP tệp ⇒ sập cả Cổng học sinh (29/09).
  s = s.replace(/([A-Z₀-₉)]|[A-Z][a-z])to(?=[ \t]?(→|⇌))/g, '$1t°')
  // Điều kiện viết ngay TRƯỚC mũi tên: "Fe + H₂SO₄ t°→ …", "4NH₃+3O₂t°→ …", "Pt,t°→".
  s = s.replace(/[ \t]?(?:(H₂SO₄(?: đặc)?|Ni|Pt|Pd|H⁺|V₂O₅)[ \t]*,[ \t]*)?(t°|xt|đpdd|đpnc)[ \t]*(→|⇌)(?!\()[ \t]*/g, (m: string, tac: string | undefined, dk: string, mui: string, viTri: number, goc: string) => {
    // "xt" ngay sau chữ thường (vd "next→") không phải xúc tác — thay cho nhóm nhìn lùi cũ.
    if (dk === 'xt' && /[a-z]/.test(goc.charAt(viTri + m.indexOf('xt') - 1))) return m
    return ` ${mui}(${tac ? `${tac}, ` : ''}${dk}) `
  })
  return s
}

/** Chữ bên trong ngoặc có dáng một ĐIỀU KIỆN/SỐ HIỆU phản ứng hay không. */
function dangDieuKien(nhan: string): boolean {
  const t = nhan.trim()
  if (/^\(?\d{1,2}\)?$/.test(t) || /^[IVX]{1,4}$/.test(t)) return true
  return /t°|t\^o|\bxt\b|đp|điện phân|enzyme|men|ánh sáng|as\b|H⁺|OH⁻|°C|\bNi\b|\bPt\b|\bPd\b|đặc|loãng|dư/i.test(t)
}

/** Cặp ngoặc từ `mo` tới `dong` (sau mũi tên) có phải NHÃN của mũi tên không.
 *
 * @param cachTruoc có khoảng trắng giữa mũi tên (hoặc nhãn trước) và ngoặc mở.
 * @param thuHai    đây là nhãn thứ hai (nhãn dưới). */
export function laNhanMuiTen(s: string, mo: number, dong: number, cachTruoc: boolean, thuHai: boolean): boolean {
  const nhan = s.slice(mo + 1, dong)
  const sau = s.slice(dong + 1)
  // Ngoặc có chỉ số bám sau ⇒ nhóm nguyên tử của một CHẤT: (C₆H₁₀O₅)ₙ, [Cu(NH₃)₄](OH)₂.
  if (/^[₀-₉ₙₓᵧ]/.test(sau)) return false
  if (/^[0-9n](?![a-zà-ỹ])/.test(sau) && /[A-Z]/.test(nhan)) return false
  // Ngay sau ngoặc là thêm một nhóm ngoặc chất: "[Cu(NH₃)₄](OH)₂"
  if (/^[([][^)\]]*[)\]][₀-₉0-9]/.test(sau) && /[A-Z]/.test(nhan) && !/^\+/.test(nhan.trim())) return false
  if (!cachTruoc) return true
  // Cách một dấu cách: nhãn thứ hai phải dính liền nhãn đầu.
  if (thuHai) return false
  // "(1) → (3) → (2)": sau ngoặc lại là mũi tên ⇒ phần tử của dãy, không phải nhãn.
  if (/^\s*(→|←|⇌|->|<=>|<-)/.test(sau)) return false
  // Nhãn phải có chất đứng sau; "[OH⁻] = 0,1 M" là nồng độ, không phải nhãn.
  if (!/^\s+[^\s=≈<>]/.test(sau)) return false
  return dangDieuKien(nhan)
}

// ---------------------------------------------------------------------------
// TÁCH SƠ ĐỒ RA DÒNG RIÊNG

export type KhucDong = { t: 'chu'; v: string } | { t: 'sodo'; v: string }

/** Chữ Việt có dấu (không tính × ÷). */
const RE_CHU_VIET = /[À-ÃÈ-ÊÌÍÒ-ÕÙÚÝà-ãè-êìíò-õùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/
/** Từ Việt thông dụng KHÔNG dấu — đủ để nhận ra câu chữ. */
const TU_KHONG_DAU = new Set(['cho', 'khi', 'theo', 'trong', 'tan', 'hai', 'ba', 'sau', 'the', 'nhu', 'va', 'la', 'thu', 'con', 'ta', 'nay', 'ra', 'thanh', 'tinh'])

function laTuChu(tu: string): boolean {
  const t = tu.replace(/^[("'“[]+|[)"'”\].,;:!?]+$/g, '')
  if (!t) return false
  if (RE_CHU_VIET.test(t) && /[a-zà-ỹđ]/.test(t)) return true
  return TU_KHONG_DAU.has(t.toLowerCase()) && /^[A-Za-z]+$/.test(t) && t.length >= 2 && /[a-z]$/.test(t)
}

function demTuChu(doan: string): number {
  return doan.split(/\s+/).filter(laTuChu).length
}

/** Vị trí các mũi tên trong một dòng (kèm cả nhãn dính liền). */
function viTriMui(dong: string): { bd: number; kt: number }[] {
  const ra: { bd: number; kt: number }[] = []
  const re = /(<=>|<->|->|<-|→|←|⇌)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(dong)) !== null) {
    let j = m.index + m[0].length
    for (let lan = 0; lan < 2 && (dong[j] === '(' || dong[j] === '['); lan++) {
      const dongNgoac = timDong(dong, j)
      if (dongNgoac < 0) break
      j = dongNgoac + 1
    }
    ra.push({ bd: m.index, kt: j })
    re.lastIndex = j
  }
  return ra
}

function timDong(s: string, mo: number): number {
  const a = s[mo]
  const b = a === '(' ? ')' : ']'
  let sau = 0
  for (let j = mo; j < s.length; j++) {
    if (s[j] === a) sau++
    else if (s[j] === b) {
      sau--
      if (sau === 0) return j
    }
  }
  return -1
}

/** Ranh giới câu trong khoảng [tu, den): trả vị trí NGAY SAU dấu ranh giới, hoặc -1. */
function ranhGioiCuoi(dong: string, tu: number, den: number): number {
  let ra = -1
  const re = /[.;:?!](?=\s|$)/g
  re.lastIndex = tu
  let m: RegExpExecArray | null
  while ((m = re.exec(dong)) !== null && m.index < den) {
    // "0,1 M." hay "…" vẫn là hết câu; "1.5" không khớp vì đòi khoảng trắng sau.
    ra = m.index + 1
  }
  return ra
}

/** Từ câu chữ VIẾT HOA mở câu mới ("Gán", "Biết", "Ở"). So hoa/thường bằng
 * toUpperCase — dải À-Ỹ của Unicode xen kẽ chữ hoa với chữ thường. */
function moCauMoi(tu: string): boolean {
  const dau = tu[0] ?? ''
  return laTuChu(tu) && dau !== dau.toLowerCase() && dau === dau.toUpperCase()
}

/** Tìm chỗ hết của cụm sơ đồ bắt đầu quét từ `tu`: sau dấu . ; ? ! kết câu
 * (giữ dấu ấy với sơ đồ) hoặc trước một từ viết hoa mở câu mới. */
function timHetCum(dong: string, tu: number): number {
  const re = /([.;?!])(?=\s|$)|\s+(\S+)/g
  re.lastIndex = tu
  let m: RegExpExecArray | null
  while ((m = re.exec(dong)) !== null) {
    if (m[1]) return m.index + 1
    if (moCauMoi(m[2])) return m.index
    re.lastIndex = m.index + m[0].length - m[2].length
    if (re.lastIndex <= m.index) re.lastIndex = m.index + 1
    // nhảy qua từ vừa xét
    const cuoiTu = m.index + m[0].length
    const dauCau = /[.;?!](?=\s|$)/.exec(dong.slice(re.lastIndex, cuoiTu))
    if (dauCau) return re.lastIndex + dauCau.index + 1
    re.lastIndex = cuoiTu
  }
  return dong.length
}

/** Một dòng → các khúc chữ và sơ đồ. */
function tachMotDong(dong: string): KhucDong[] {
  const muis = viTriMui(dong)
  if (muis.length === 0) return [{ t: 'chu', v: dong }]
  const ra: KhucDong[] = []
  let con = 0 // phần chưa xử lý bắt đầu từ đây
  let k = 0
  while (k < muis.length) {
    const dau = muis[k]
    // Đầu cụm: sau ranh giới câu gần nhất trước mũi tên đầu (không lùi quá `con`).
    const rg = ranhGioiCuoi(dong, con, dau.bd)
    const bd = rg >= 0 ? rg : con
    // Gom các mũi tên liền nhau (không có ranh giới câu xen giữa).
    let cuoi = k
    while (cuoi + 1 < muis.length) {
      const giua = dong.slice(muis[cuoi].kt, muis[cuoi + 1].bd)
      if (/[.;?!](\s|$)/.test(giua) || giua.split(/\s+/).slice(1).some(moCauMoi)) break
      cuoi++
    }
    const kt = timHetCum(dong, muis[cuoi].kt)
    const cum = dong.slice(bd, kt)
    const truoc = dong.slice(bd, dau.bd)
    const laSoDo =
      !/[=≈]/.test(cum) &&
      truoc.trim() !== '' &&
      demTuChu(truoc) <= 2 &&
      demTuChu(dong.slice(muis[cuoi].kt, kt)) <= 3 &&
      !/^\s*\(/.test(dong.slice(dau.bd - 1, dau.bd)) // "(→)" mũi tên trong ngoặc giải thích
    if (laSoDo) {
      const chuTruoc = dong.slice(con, bd)
      if (chuTruoc) ra.push({ t: 'chu', v: chuTruoc })
      ra.push({ t: 'sodo', v: cum.trim() })
      con = kt
    }
    k = cuoi + 1
  }
  if (con < dong.length) ra.push({ t: 'chu', v: dong.slice(con) })
  // Không có sơ đồ nào hoặc cả dòng chỉ là sơ đồ ⇒ không cần tách.
  return ra
}

/** Chuỗi (nhiều dòng) → khúc chữ và khúc SƠ ĐỒ đứng riêng dòng.
 *
 * Trả `[{t:'chu', v: toàn chuỗi}]` khi không có gì phải tách, hoặc khi cả
 * chuỗi chỉ là một sơ đồ (phương án "X → Y" giữ nằm trong dòng như cũ).
 * Dấu xuống dòng bao quanh khúc sơ đồ được NUỐT (khúc sơ đồ tự là một khối),
 * để chỗ hiện có `white-space: pre-line` không bị thừa một dòng trống. */
export function tachDongSoDo(raw: string): KhucDong[] {
  const s = String(raw ?? '')
  if (!/[→←⇌]|->|<=>|<-/.test(s)) return [{ t: 'chu', v: s }]
  // Chuỗi có LaTeX (\ce{…}, $…$): cắt dòng có thể rơi vào giữa ngoặc — để KaTeX lo.
  if (/\\[a-zA-Z]|\$/.test(s)) return [{ t: 'chu', v: s }]
  const dongs = s.split('\n')
  const ra: KhucDong[] = []
  const themChu = (v: string) => {
    const cuoi = ra[ra.length - 1]
    if (cuoi && cuoi.t === 'chu') cuoi.v += v
    else ra.push({ t: 'chu', v })
  }
  dongs.forEach((dong, i) => {
    const khucs = tachMotDong(dong)
    for (const kh of khucs) {
      if (kh.t === 'chu') themChu(kh.v)
      else ra.push(kh)
    }
    if (i < dongs.length - 1) themChu('\n')
  })
  if (!ra.some((k) => k.t === 'sodo')) return [{ t: 'chu', v: s }]
  // Cắt khoảng trắng/một dấu xuống dòng bám hai bên khối sơ đồ.
  for (let i = 0; i < ra.length; i++) {
    const k = ra[i]
    if (k.t !== 'chu') continue
    if (ra[i + 1]?.t === 'sodo') k.v = k.v.replace(/[ \t]*\n?[ \t]*$/, '')
    if (ra[i - 1]?.t === 'sodo') k.v = k.v.replace(/^[ \t]*\n?[ \t]*/, '')
  }
  const gon = ra.filter((k) => k.t === 'sodo' || k.v !== '')
  if (gon.length === 1) return [{ t: 'chu', v: s }]
  return gon
}

/** Từ công thức có chỗ trình duyệt ĐƯỢC PHÉP ngắt (gạch nối liên kết "CH₂-COOH",
 * "H₃N⁺–CH₂") ⇒ phải bọc liền. Công thức không có chỗ ngắt ("H₂SO₄") để nguyên. */
export const RE_TU_CONG_THUC = /[A-Z\])₀-₉⁺⁻][-–—\/][A-Z(\[]/
export const MUI_TEN = MUI_KY_TU

/** Một phần tử sau khi gom: đứng lẻ, hoặc một cụm LIỀN (in `white-space: nowrap`). */
export type PhanGom<T> = { lien: false; x: T } | { lien: true; ds: T[] }

/** Gom các đoạn đã tách (chữ / chỉ số / mũi tên) thành TỪ, và bọc liền những từ
 * là công thức để trình duyệt không ngắt dòng giữa "(C₆H₁₀O₅" và "ₙ", giữa
 * "CH₂-" và "COOH". Mũi tên dính với chất ĐỨNG SAU nó (dấu cách sau mũi tên
 * không được ngắt) — xuống dòng thì mũi tên đi cùng sản phẩm, không bỏ lửng.
 *
 * `chu(x)` trả chữ của đoạn chữ, `null` với đoạn không phải chữ. */
export function gomTuCongThuc<T>(ds: T[], chu: (x: T) => string | null, taoChu: (v: string) => T, laMui: (x: T) => boolean): PhanGom<T>[] {
  // 1) Tách đoạn chữ theo khoảng trắng.
  const nguyen: { x: T; trang: boolean }[] = []
  for (const x of ds) {
    const v = chu(x)
    if (v === null) {
      nguyen.push({ x, trang: false })
      continue
    }
    for (const m of v.match(/\s+|\S+/g) ?? []) nguyen.push({ x: taoChu(m), trang: /^\s/.test(m) })
  }
  // 2) Gom từ.
  const ra: PhanGom<T>[] = []
  let tu: { x: T; trang: boolean }[] = []
  const chot = () => {
    if (!tu.length) return
    // Có mũi tên (mũi tên + chất sau) hoặc gạch nối nằm giữa công thức.
    const laCongThuc = tu.some((n) => laMui(n.x)) || RE_TU_CONG_THUC.test(tu.map((n) => chu(n.x) ?? '').join(''))
    if (laCongThuc && tu.length > 1) ra.push({ lien: true, ds: tu.map((n) => n.x) })
    else for (const n of tu) ra.push({ lien: false, x: n.x })
    tu = []
  }
  for (let i = 0; i < nguyen.length; i++) {
    const n = nguyen[i]
    if (n.trang) {
      const truoc = tu[tu.length - 1]
      // Khoảng trắng ngay sau mũi tên, và còn chữ phía sau ⇒ giữ trong cùng từ.
      if (truoc && laMui(truoc.x) && i + 1 < nguyen.length && !/\n/.test(chu(n.x) ?? '')) {
        tu.push(n)
        continue
      }
      chot()
      ra.push({ lien: false, x: n.x })
      continue
    }
    // Trước mũi tên luôn được ngắt dòng (phiếu gỡ dấu cách quanh mũi tên, không
    // cắt ở đây thì cả sơ đồ thành MỘT từ không xuống dòng được, tràn khổ giấy).
    if (laMui(n.x)) chot()
    tu.push(n)
  }
  chot()
  return ra
}
