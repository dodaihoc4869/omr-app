// CHUẨN HOÁ CHUỖI TRƯỚC KHI ĐƯA CHO KaTeX / mhchem — chỉ cần khi đã có KaTeX nên nằm cùng mảnh nạp lười
// `katex-goi.ts` (thầy 27/10, luật tốc độ: bù byte cho phần sửa dấu cộng ở chem-format.tsx). Mã chuyển NGUYÊN
// từ chem-format.tsx, không đổi hành vi; chem-format gọi qua `chuanBiLatex` sau khi `napKatex()` xong.
import { chuanHoaCongThucTongQuat, RE_TRANG_THAI } from './chem-format'
import { laNhanMuiTen } from './chem-format-so-do'

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

/** Đổi ký hiệu toán Unicode về lệnh LaTeX tương ứng TRƯỚC khi đưa cho KaTeX.
 * Kho đề cũ đã bị một lượt "gỡ LaTeX" đổi `\times` thành `×` nhưng bỏ sót
 * `\bar` và `\dfrac`, nên chuỗi còn lại lẫn cả hai kiểu. */
function kyHieuToanVeLatex(s: string): string {
  return s.replace(/\u00d7/g, '\\times ').replace(/\u00b7/g, '\\cdot ').replace(/\u2212/g, '-')
}

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

function chuanHoaMuiTenMhchem(raw: string): string {
  let s = String(raw ?? '')
  s = s.replace(/(<=>>|<<=>|<=>|<->|->|<-|→|←|⇌|\\to|\\rightarrow)(\s*)\(([^)]+)\)/g, (m, mui: string, cach: string, nhan: string, viTri: number, goc: string) => {
    // "-> (CH3)2O" là chất sản phẩm, không phải điều kiện — xem `laNhanMuiTen`.
    const mo = viTri + mui.length + cach.length
    if (!laNhanMuiTen(goc, mo, mo + nhan.length + 1, cach.length > 0, false)) return m
    const chuanMui = mui === '→' || mui === '\\to' || mui === '\\rightarrow' ? '->' : mui === '←' ? '<-' : mui === '⇌' ? '<=>' : mui
    return `${chuanMui}[${nhan}]`
  })
  s = s.replace(/\[([^\]]*)\]/g, (_m, nhan: string) => {
    const dk = nhan.replace(/\bt\^o\b/gi, 't^\\circ').replace(/t°/g, 't^\\circ')
    return `[${dk}]`
  })
  return s
}

/** mhchem: `\ce{ROH+N2}` cũng đọc `+` là điện tích ⇒ nới thành `ROH + N2`. */
export function tachToanTuCongCe(latex: string): string {
  return latex.replace(/([A-Za-z0-9)\]])\+(?=[A-Z([])/g, (m, truoc: string, viTri: number, goc: string) =>
    RE_TRANG_THAI.test(goc.slice(viTri + m.length)) || goc[viTri - 1] === '^' || goc[viTri - 1] === '{' ? m : `${truoc} + `)
}

/** Chuỗi gốc `\ce{…}` / `$…$` ⇒ chuỗi đưa KaTeX + có phải tách khối cuộn ngang không. */
export function chuanBiLatex(t: 'ce' | 'math', latexGoc: string): { latex: string; dai: boolean } {
  const latex = chuanHoaCongThucTongQuat(chuanHoaNhanMuiTen(kyHieuToanVeLatex(t === 'ce' ? tachToanTuCongCe(chuanHoaMuiTenMhchem(latexGoc)) : latexGoc)))
  return { latex, dai: beRongUocTinh(latex) > DAI_PHAI_CUON }
}

/** Tách một phương trình mhchem thành cụm ngắt dòng được: [{dau: '' | '+' | '->…', chat}] ở cấp ngoài cùng (ngoài mọi ngoặc).
 *  `2Al(s) + 3H2O(l) -> Al2O3(s) + 6H+ + 6e` ⇒ 2Al(s) · + 3H2O(l) · -> Al2O3(s) · + 6H+ · + 6e. Dưới 3 cụm / ngoặc lệch ⇒ null. Thuần (có test). */
export function tachCumCe(ce: string): { dau: string; chat: string }[] | null {
  const tok: string[] = []
  let sau = 0, cur = ''
  for (const ch of ce) {
    if ('([{'.includes(ch)) sau++
    else if (')]}'.includes(ch)) sau--
    if (sau < 0) return null
    if (ch === ' ' && sau === 0) { if (cur) tok.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) tok.push(cur)
  if (sau !== 0) return null
  const laDau = (x: string) => x === '+' || /^(->|<=>|<-|<->|=)/.test(x)
  const ra: { dau: string; chat: string }[] = []
  let dau = ''
  for (const x of tok) {
    if (laDau(x)) { if (dau) return null; dau = x; continue }
    if (!dau && ra.length) { ra[ra.length - 1]!.chat += ' ' + x; continue } // hệ số tách rời («2 H2O») ⇒ dính vào chất
    ra.push({ dau, chat: x }); dau = ''
  }
  if (dau) return null
  return ra.length >= 3 ? ra : null
}

/** PHƯƠNG TRÌNH DÀI NGẮT DÒNG (thầy 01/11: «đầu dòng dãn cách phải đẹp chỉnh chu để hs dễ đọc nhất»): HTML một khối flex-wrap, mỗi cụm «dấu + chất» đi liền
 *  (mũi tên luôn đi cùng chất phía sau). `ve(t, latex)` = KaTeX của chem-format (có nhớ); một cụm lỗi / không tách được ⇒ null (ô cuộn như cũ). */
export function ngatCe(t: 'ce' | 'math', latex: string, dai: boolean, ve: (t: 'ce' | 'math', latex: string) => string | null): string | null {
  // `\ce{…}` cả công thức (dạng $\ce{…}$) cũng tính; ngắn (≤ 23 kí tự) mà không «dài» ⇒ để nguyên trong dòng.
  const ce = t === 'ce' ? latex : /^\s*\\ce\{([\s\S]*)\}\s*$/.exec(latex)?.[1]
  if (!ce || (!dai && ce.length <= 23)) return null
  const cum = tachCumCe(ce)
  if (!cum) return null
  let html = ''
  for (const c of cum) {
    const chat = ve('ce', c.chat)
    const dau = c.dau ? ve(c.dau === '+' ? 'math' : 'ce', c.dau) : ''
    if (chat === null || dau === null) return null
    html += `<span style="white-space:nowrap">${dau ? `<span style="margin-right:.3em">${dau}</span>` : ''}${chat}</span>`
  }
  return `<span class="ct-ngat" style="display:inline-flex;flex-wrap:wrap;align-items:baseline;column-gap:.3em;row-gap:.15em;max-width:100%">${html}</span>`
}

// ── DỰNG CÔNG THỨC (dời từ chem-format.tsx 01/11 để lượt mở app không mang mã chỉ chạy khi đã có KaTeX) ──
type KatexRender = { renderToString: (latex: string, opts: Record<string, unknown>) => string }
const KATEX_OPTS = { throwOnError: true, strict: false, displayMode: false } as const
export type KetQuaCongThuc = { latex: string; html: string; dai: boolean } | { latex: string; loi: true }
// NHỚ KẾT QUẢ KaTeX (28/09). `katex.renderToString` là phần đắt nhất khi vẽ đề (~260 công thức/đề). Cùng chuỗi nguồn ⇒ cùng HTML, giữ theo kiểu LRU
// (Map giữ thứ tự chèn; đọc trúng thì chèn lại xuống cuối; vượt trần thì bỏ mục cũ nhất). Kết quả hiển thị y hệt bản không nhớ.
const TRAN_NHO_CONG_THUC = 2000
const nhoCongThuc = new Map<string, KetQuaCongThuc>()
export function dungCongThuc(katex: KatexRender, t: 'ce' | 'math', latexGoc: string): KetQuaCongThuc {
  const khoa = t + '\u0000' + latexGoc
  const co = nhoCongThuc.get(khoa)
  if (co) {
    nhoCongThuc.delete(khoa)
    nhoCongThuc.set(khoa, co)
    return co
  }
  // Chuẩn hoá TRƯỚC khi đưa cho mhchem
  const { latex, dai } = chuanBiLatex(t, latexGoc)
  let kq: KetQuaCongThuc
  try {
    // PHƯƠNG TRÌNH DÀI (thầy 01/11): ngắt dòng ở «+» / mũi tên thay vì ô cuộn.
    const ngat = ngatCe(t, latex, dai, (t2, l) => { const r = dungCongThuc(katex, t2, l); return 'html' in r ? r.html : null })
    kq = ngat ? { latex, html: ngat, dai: false } : { latex, html: katex.renderToString(t === 'ce' ? `\\ce{${latex}}` : latex, KATEX_OPTS), dai }
  } catch {
    kq = { latex, loi: true }
  }
  nhoCongThuc.set(khoa, kq)
  if (nhoCongThuc.size > TRAN_NHO_CONG_THUC) nhoCongThuc.delete(nhoCongThuc.keys().next().value as string)
  return kq
}
