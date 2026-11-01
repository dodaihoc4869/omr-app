// LaTeX → HTML THUẦN cho phiếu in, tờ chiếu, đáp án, lời giải (thầy 01/11 tối: tờ «Chiếu chữa bài sau ca» in thô `K_C = \frac {…} {…}`).
//
// Tờ chiếu và phiếu là chuỗi HTML tự đủ, KHÔNG kéo KaTeX vào (nặng, cần phông riêng, tờ mở trên máy chiếu yếu). Ở đây dựng tay đúng phần
// kho đề thật sự dùng:
//   · `\frac/\dfrac/\tfrac/\cfrac{a}{b}` (cho phép khoảng trắng giữa các nhóm) ⇒ PHÂN SỐ CHỒNG: hộp inline-flex cột, vạch ngang `currentColor`
//     (đúng cả nền sáng lẫn tối), tử/mẫu đi lại qua ĐƯỜNG CHỮ HOÁ HỌC của phiếu (`chu` — chỉ số dưới, `K_C`, mũi tên vẽ nét);
//   · `\sqrt[n]{x}`, `\bar/\overline`, `\underline`, `\vec/\overrightarrow/\hat/\widehat/\tilde`, `\text/\mathrm/\operatorname/\mathit/\mathbf`, `\ce{}`,
//     `\left/\right`, `_`/`^` có nhóm, ký hiệu (× · ± ≤ ≥ ≠ ≈ …), chữ Hy Lạp, `\circ`, mũi tên (về `->`/`<=>` để đường chữ hoá học vẽ nét).
// BẢNG ĐÓNG: chỉ nhận lệnh trong `LENH_LATEX_TOAN` — CÙNG bảng ChemText dùng trên màn hình (`chem-format.tsx`). `\<chữ>` lạ giữ NGUYÊN VĂN, không nuốt.
// `$…$` chỉ dựng ở đây khi bên trong có lệnh trong bảng (khác `\ce`); còn lại để đường cũ xử lý như trước — chuỗi không có khúc LaTeX nào ra
// ĐÚNG TỪNG BYTE như trước (`chuCoLatex(s, chu) === chu(s)`).
import { LENH_LATEX_TOAN } from './chem-format'

/** Một mảnh sau khi dựng: `r` = chữ thô (còn phải qua đường chữ hoá học), `h` = HTML đã dựng xong. */
export type NutLatex = { r: string; h?: undefined } | { h: string; r?: undefined }

/** Ký hiệu một lệnh ⇒ chữ. Mũi tên về dạng ASCII để đường chữ hoá học vẽ bằng nét như mọi mũi tên khác của phiếu. */
const KY_HIEU: Record<string, string> = {
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', approx: '≈', neq: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥', ll: '≪', gg: '≫', equiv: '≡',
  rightarrow: '->', to: '->', longrightarrow: '->', leftarrow: '<-', gets: '<-', rightleftharpoons: '<=>', Rightarrow: '⇒', Leftarrow: '⇐',
  alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', Theta: 'Θ',
  kappa: 'κ', lambda: 'λ', Lambda: 'Λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', Pi: 'Π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', varphi: 'φ',
  Phi: 'Φ', chi: 'χ', psi: 'ψ', Psi: 'Ψ', omega: 'ω', Omega: 'Ω',
  circ: '°', degree: '°', infty: '∞', sum: '∑', prod: '∏', int: '∫', log: 'log', ln: 'ln', exp: 'exp', lg: 'lg', quad: ' ', qquad: '  ',
  left: '', right: '',
}
/** Lệnh một ký tự (`\,` `\%` …). */
const KY_DON: Record<string, string> = { ',': ' ', ';': ' ', ':': ' ', '!': '', ' ': ' ', '\\': ' ', '%': '%', '{': '{', '}': '}', '&': '&', '#': '#', $: '$', _: '_', '|': '‖' }
/** Dấu trên đầu chữ (vec, hat, tilde). */
const DAU_TREN: Record<string, string> = { vec: '→', overrightarrow: '→', hat: '^', widehat: '^', tilde: '~' }
const PHAN_SO = new Set(['frac', 'dfrac', 'tfrac', 'cfrac'])
const VO_CHU = new Set(['text', 'mathrm', 'operatorname'])

const trang = (c: string | undefined): boolean => c === ' ' || c === '\t' || c === '\n' || c === '\r'
function boTrang(s: string, i: number): number {
  while (trang(s[i])) i++
  return i
}

/** Vị trí `}` khớp với `{` ở `mo` (tính ngoặc lồng, bỏ qua `\{` `\}`); không khớp ⇒ -1. */
function dongNgoac(s: string, mo: number): number {
  let sau = 0
  for (let j = mo; j < s.length; j++) {
    if (s[j] === '\\') {
      j++
      continue
    }
    if (s[j] === '{') sau++
    else if (s[j] === '}' && --sau === 0) return j
  }
  return -1
}

/** Vị trí `]` khớp với `[` ở `mo` (ngoặc vuông lồng như `[Ag(NH3)2]`); không khớp ⇒ -1. */
function dongVuong(s: string, mo: number): number {
  let sau = 0
  for (let j = mo; j < s.length; j++) {
    if (s[j] === '[') sau++
    else if (s[j] === ']' && --sau === 0) return j
  }
  return -1
}

/** Một tham số của lệnh: nhóm `{…}`, một lệnh `\abc`, hoặc một ký tự. `mot` = tham số là MỘT ký tự trần (giữ dạng `K_C`, không đổi thành `K_{C}`). */
function docThamSo(s: string, i: number): { noi: string; sau: number; mot: boolean } | null {
  const j = boTrang(s, i)
  if (j >= s.length) return null
  if (s[j] === '{') {
    const d = dongNgoac(s, j)
    return d < 0 ? null : { noi: s.slice(j + 1, d), sau: d + 1, mot: false }
  }
  if (s[j] === '}') return null
  if (s[j] === '\\') {
    const m = /^\\(?:[a-zA-Z]+|.)/.exec(s.slice(j, j + 40))
    return m ? { noi: m[0], sau: j + m[0].length, mot: false } : null
  }
  return { noi: s[j]!, sau: j + 1, mot: true }
}

/** Tham số tuỳ chọn `[…]` (căn bậc n, nhãn dưới mũi tên). */
function docTuyChon(s: string, i: number): { noi: string; sau: number } | null {
  const j = boTrang(s, i)
  if (s[j] !== '[') return null
  const d = dongVuong(s, j)
  return d < 0 ? null : { noi: s.slice(j + 1, d), sau: d + 1 }
}

function themChu(ra: NutLatex[], v: string): void {
  if (!v) return
  const cuoi = ra[ra.length - 1]
  if (cuoi && cuoi.r !== undefined) cuoi.r += v
  else ra.push({ r: v })
}

function them(ra: NutLatex[], ds: NutLatex[]): void {
  for (const n of ds) {
    if (n.r !== undefined) themChu(ra, n.r)
    else ra.push(n)
  }
}

/** Ráp các mảnh thành HTML: chữ thô qua `chu`, HTML giữ nguyên. Đường chữ hoá học cắt khoảng trắng hai đầu ⇒ khoảng trắng sát một mảnh HTML
 *  (`K_C = ` trước phân số) được trả lại, không dính chữ vào phân số. */
export function dungNut(ds: readonly NutLatex[], chu: (raw: string) => string): string {
  if (ds.length === 1 && ds[0]!.r !== undefined) return chu(ds[0]!.r)
  return ds
    .map((n) => {
      if (n.r === undefined) return n.h
      const noi = chu(n.r)
      return (/^\s/.test(n.r) && !/^\s/.test(noi) ? ' ' : '') + noi + (/\s$/.test(n.r) && !/\s$/.test(noi) ? ' ' : '')
    })
    .join('')
}

/** Dựng một khúc LaTeX (đã bỏ `$`) thành các mảnh. */
export function nutLatex(s: string, chu: (raw: string) => string): NutLatex[] {
  const ra: NutLatex[] = []
  const html = (x: string) => dungNut(nutLatex(x, chu), chu)
  let i = 0
  while (i < s.length) {
    const c = s[i]!
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)/.exec(s.slice(i, i + 40))
      if (!m) {
        const k = s[i + 1] ?? ''
        themChu(ra, k in KY_DON ? KY_DON[k]! : '\\' + k)
        i += 2
        continue
      }
      const ten = m[1]!
      const sau = i + m[0].length
      // Lệnh NGOÀI bảng đóng: giữ nguyên văn (đường cũ của phiếu vẫn gỡ được `\rm{}`…), không nuốt chữ đi sau.
      if (!LENH_LATEX_TOAN.has(ten)) {
        themChu(ra, m[0])
        i = sau
        continue
      }
      if (PHAN_SO.has(ten)) {
        const a = docThamSo(s, sau)
        const b = a ? docThamSo(s, a.sau) : null
        if (!a || !b) {
          themChu(ra, m[0])
          i = sau
          continue
        }
        ra.push({ h: `<span class="lt-ps${ten === 'tfrac' ? ' lt-ps-nho' : ''}"><span class="lt-tu">${html(a.noi)}</span><span class="lt-mau">${html(b.noi)}</span></span>` })
        i = b.sau
        continue
      }
      if (ten === 'sqrt') {
        const bac = docTuyChon(s, sau)
        const a = docThamSo(s, bac ? bac.sau : sau)
        if (!a) {
          themChu(ra, '√')
          i = sau
          continue
        }
        ra.push({ h: `<span class="lt-can">${bac ? `<span class="lt-can-bac">${html(bac.noi)}</span>` : ''}<span class="lt-can-dau" aria-hidden="true">√</span><span class="lt-can-trong">${html(a.noi)}</span></span>` })
        i = a.sau
        continue
      }
      if (ten === 'xrightarrow') {
        const duoi = docTuyChon(s, sau)
        const tren = docThamSo(s, duoi ? duoi.sau : sau)
        // Về đúng cú pháp mũi tên có nhãn mà đường chữ hoá học đã vẽ (`->[trên][dưới]`).
        themChu(ra, `->${tren && tren.noi.trim() ? `[${tren.noi}]` : duoi ? '[]' : ''}${duoi ? `[${duoi.noi}]` : ''}`)
        i = tren ? tren.sau : duoi ? duoi.sau : sau
        continue
      }
      if (ten === 'ce' || VO_CHU.has(ten) || ten === 'mathit' || ten === 'mathbf' || ten === 'bar' || ten === 'overline' || ten === 'underline' || ten in DAU_TREN) {
        const a = docThamSo(s, sau)
        if (!a) {
          themChu(ra, ten === 'ce' || VO_CHU.has(ten) ? '' : m[0])
          i = sau
          continue
        }
        i = a.sau
        // `\ce{…}` đi thẳng vào đường chữ hoá học (mũi tên có nhãn, chỉ số); `\text{…}` là chữ — cùng cách phiếu vẫn gỡ vỏ từ trước.
        if (ten === 'ce') themChu(ra, a.noi)
        else if (VO_CHU.has(ten)) them(ra, nutLatex(a.noi, chu))
        else if (ten === 'mathit') ra.push({ h: `<i>${html(a.noi)}</i>` })
        else if (ten === 'mathbf') ra.push({ h: `<b>${html(a.noi)}</b>` })
        else if (ten === 'underline') ra.push({ h: `<span class="lt-gach-duoi">${html(a.noi)}</span>` })
        else if (ten === 'bar' || ten === 'overline') ra.push({ h: `<span class="lt-gach">${html(a.noi)}</span>` })
        else ra.push({ h: `<span class="lt-tren" data-k="${DAU_TREN[ten]}">${html(a.noi)}</span>` })
        continue
      }
      i = sau
      if (ten === 'left' || ten === 'right') {
        // `\left.` / `\right.` = ngoặc vô hình.
        const j = boTrang(s, i)
        if (s[j] === '.') i = j + 1
        continue
      }
      themChu(ra, KY_HIEU[ten] ?? m[0])
      continue
    }
    if (c === '_' || c === '^') {
      const a = docThamSo(s, i + 1)
      if (!a) {
        themChu(ra, c)
        i++
        continue
      }
      i = a.sau
      const con = nutLatex(a.noi, chu)
      const v = con.map((n) => n.r ?? '').join('')
      // Chữ thô đi tiếp qua đường chữ hoá học (`_{298}`, `^2`); chỉ số LỒNG (`n_{H^+}`) hay có HTML thì dựng thẻ ở đây.
      if (con.every((n) => n.r !== undefined) && !/[_^]/.test(v)) {
        // `^\circ` / `^{\circ}` là dấu độ, không phải số mũ (như đường cũ của phiếu).
        if (c === '^' && v.trim() === '°') themChu(ra, '°')
        else themChu(ra, a.mot ? c + v : `${c}{${v}}`)
      } else {
        ra.push({ h: `<${c === '_' ? 'sub' : 'sup'}>${dungNut(con, chu)}</${c === '_' ? 'sub' : 'sup'}>` })
      }
      continue
    }
    if (c === '{') {
      const d = dongNgoac(s, i)
      if (d > i) {
        them(ra, nutLatex(s.slice(i + 1, d), chu))
        i = d + 1
        continue
      }
    }
    if (c === '}' || c === '$') {
      i++
      continue
    }
    themChu(ra, c === '~' ? ' ' : c)
    i++
  }
  return ra
}

/** Ký tự được NỐI hai lệnh LaTeX vào cùng một khúc — đúng `NOI_LATEX` của ChemText: chữ tiếng Việt / dấu chấm câu ở giữa ⇒ cắt khúc. */
const NOI = /^[\s=+\-−×·/()[\]0-9A-Za-z,^_{}]{0,14}$/

/** Đọc MỘT lệnh trong bảng (khác `\ce`) ở `i` cùng các nhóm theo sau (cho phép khoảng trắng trước `{`), `[…]` của `\sqrt`/`\xrightarrow`,
 *  ngoặc đi kèm `\left/\right` và chỉ số `_`/`^` dính liền. Trả vị trí ngay SAU, hoặc -1 nếu không phải lệnh trong bảng. */
function docLenh(s: string, i: number): number {
  const m = /^\\([a-zA-Z]+)/.exec(s.slice(i, i + 40))
  if (!m || m[1] === 'ce' || !LENH_LATEX_TOAN.has(m[1]!)) return -1
  const ten = m[1]!
  let j = i + m[0].length
  if (ten === 'left' || ten === 'right') {
    const k = boTrang(s, j)
    if (s[k] === '\\' && /[{}|]/.test(s[k + 1] ?? '')) j = k + 2
    else if (/[()[\]|.]/.test(s[k] ?? '')) j = k + 1
  }
  if (ten === 'sqrt' || ten === 'xrightarrow') {
    const tc = docTuyChon(s, j)
    if (tc) j = tc.sau
  }
  for (;;) {
    const k = boTrang(s, j)
    if (s[k] !== '{') break
    const d = dongNgoac(s, k)
    if (d < 0) return -1
    j = d + 1
  }
  for (;;) {
    if (s[j] !== '_' && s[j] !== '^') break
    const a = docThamSo(s, j + 1)
    if (!a || trang(s[j + 1])) break
    j = a.sau
  }
  return j
}

/** Quét một khúc LaTeX TRẦN bắt đầu ở `i` (lệnh trong bảng, nối tiếp qua `NOI`). -1 nếu ở đó không mở đầu lệnh nào. */
function quetKhuc(s: string, i: number): number {
  let cuoi = docLenh(s, i)
  if (cuoi === -1) return -1
  for (;;) {
    const m = /\\[a-zA-Z]+/.exec(s.slice(cuoi))
    if (!m || !NOI.test(s.slice(cuoi, cuoi + m.index))) break
    const tiep = docLenh(s, cuoi + m.index)
    if (tiep === -1) break
    cuoi = tiep
  }
  return cuoi
}

/** `$…$` có lệnh trong bảng (khác `\ce`) không. */
function coLenhBang(s: string): boolean {
  for (const m of s.matchAll(/\\([a-zA-Z]+)/g)) if (m[1] !== 'ce' && LENH_LATEX_TOAN.has(m[1]!)) return true
  return false
}

export type KhucLatex = { t: 'chu' | 'tex'; v: string }

/** Tách chuỗi thành chữ thường và khúc LaTeX: khúc TRẦN (`\frac…` thiếu `$`) và `$…$`/`$$…$$` có lệnh trong bảng. `\ce{…}` để nguyên cho chữ thường. */
export function tachKhucLatex(s: string): KhucLatex[] {
  const ra: KhucLatex[] = []
  let truoc = 0
  let i = 0
  const chot = (den: number, tex: string, tiep: number) => {
    if (den > truoc) ra.push({ t: 'chu', v: s.slice(truoc, den) })
    ra.push({ t: 'tex', v: tex })
    i = truoc = tiep
  }
  while (i < s.length) {
    const c = s[i]
    if (c === '$') {
      const kep = s[i + 1] === '$'
      const dong = s.indexOf(kep ? '$$' : '$', i + (kep ? 2 : 1))
      if (dong === -1) {
        i++
        continue
      }
      const noi = s.slice(i + (kep ? 2 : 1), dong)
      if (coLenhBang(noi)) chot(i, noi, dong + (kep ? 2 : 1))
      else i = dong + (kep ? 2 : 1)
      continue
    }
    if (c === '\\') {
      if (/^\\ce\s*\{/.test(s.slice(i, i + 8))) {
        const d = dongNgoac(s, s.indexOf('{', i))
        i = d > 0 ? d + 1 : i + 3
        continue
      }
      const cuoi = quetKhuc(s, i)
      if (cuoi > i) {
        chot(i, s.slice(i, cuoi), cuoi)
        continue
      }
      i += 2
      continue
    }
    i++
  }
  if (truoc < s.length) ra.push({ t: 'chu', v: s.slice(truoc) })
  return ra
}

/** Dựng một đoạn chữ có thể lẫn LaTeX. `chu` dựng phần chữ thường (đường chữ hoá học của phiếu). Không có khúc LaTeX nào ⇒ đúng `chu(s)`.
 *  Khúc chỉ có ký hiệu (× ≤ Δ …) thành chữ và NHẬP vào chữ thường hai bên trước khi qua `chu` — gom từ công thức giữ như cũ. */
export function chuCoLatex(s: string, chu: (raw: string) => string): string {
  if (!s.includes('\\')) return chu(s)
  const khuc = tachKhucLatex(s)
  if (!khuc.some((k) => k.t === 'tex')) return chu(s)
  const ra: NutLatex[] = []
  for (const k of khuc) {
    if (k.t === 'chu') themChu(ra, k.v)
    else them(ra, nutLatex(k.v, chu))
  }
  return dungNut(ra, chu)
}
