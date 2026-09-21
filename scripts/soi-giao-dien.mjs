#!/usr/bin/env node
// BỘ SOI GIAO DIỆN TĨNH (21/09/2026) — soát mã nguồn theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`
// (Phần B mục 3, 6, 7, 11–16 + bảng từ A2). Node thuần, KHÔNG phụ thuộc mới, KHÔNG tải gì từ mạng.
//
//   npm run soi:giao-dien                      soi cả `src/**/*.{tsx,ts,css}` + `index.html`
//   npm run soi:giao-dien -- --tep 'src/game/**'   chỉ soi vài tệp (glob hoặc đường dẫn, lặp lại được)
//   npm run soi:giao-dien -- --chi-loi         ẩn CẢNH BÁO
//   npm run soi:giao-dien -- --json            in JSON (để máy đọc)
//
// Mã thoát: 0 khi không có LỖI (cảnh báo không làm đỏ), 1 khi có LỖI.
// MIỄN TRỪ một dòng: đặt chú thích `soi-bo-qua: G03 lý do` ở NGAY DÒNG TRÊN dòng bị báo
// (`// …`, `/* … */`, `{/* … */}`, `<!-- … -->` đều được; nhiều luật: `soi-bo-qua: G03, G13 lý do`).
//
// NGUYÊN TẮC HEURISTIC: thà SÓT còn hơn báo bừa. Mỗi luật là MỘT hàm thuần nhận `{ duong, noiDung }`
// trả danh sách phát hiện — test `tests/soi-giao-dien-2109.test.ts` gọi thẳng các hàm này.
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const LOI = 'LOI'
export const CANH_BAO = 'CANH_BAO'
const NHAN_MUC = { [LOI]: 'LỖI', [CANH_BAO]: 'CẢNH BÁO' }

// ───────────────────────────── 1. PHÂN TÍCH TỆP (bỏ chú thích, tách chuỗi) ─────────────────────────────

const chuanDuong = (d) => String(d ?? '').split(sep).join('/').replace(/^\.\//, '')

function loaiTep(duong) {
  if (/\.tsx$/.test(duong)) return 'tsx'
  if (/\.ts$/.test(duong)) return 'ts'
  if (/\.css$/.test(duong)) return 'css'
  if (/\.html?$/.test(duong)) return 'html'
  return ''
}

const xoa = (mang, a, b) => {
  for (let k = a; k < b; k++) if (mang[k] !== '\n') mang[k] = ' '
}

const TU_TRUOC_REGEX = /^(return|typeof|case|in|of|do|else|void|delete|throw|new)$/

/** Tách mã TS/TSX: `ma` = chú thích đã thành dấu cách; `trong` = thêm cả RUỘT chuỗi / mẫu / regex thành dấu cách
 *  (cùng độ dài với bản gốc ⇒ vị trí khớp nhau). `vanBan` = danh sách chuỗi `'…'`, `"…"` và mẫu `` `…` ``. */
function tachTs(s) {
  const n = s.length
  const ma = s.split('')
  const trong = s.split('')
  const vanBan = []
  const nganXep = []
  let i = 0
  let truoc = ''
  let tu = ''
  while (i < n) {
    const dinh = nganXep[nganXep.length - 1]
    const c = s[i]
    if (dinh && dinh.loai === 'mau') {
      if (c === '\\') {
        dinh.manh += s.slice(i, i + 2)
        i += 2
        continue
      }
      if (c === '`') {
        xoa(trong, dinh.doanBd, i)
        vanBan.push({ kieu: 'mau', bd: dinh.bd, vanBan: dinh.manh })
        nganXep.pop()
        i++
        truoc = '`'
        tu = ''
        continue
      }
      if (c === '$' && s[i + 1] === '{') {
        xoa(trong, dinh.doanBd, i)
        dinh.manh += '${}'
        nganXep.push({ loai: 'bt', sau: 0 })
        i += 2
        truoc = '{'
        tu = ''
        continue
      }
      dinh.manh += c
      i++
      continue
    }
    // ── đang ở MÃ (trên cùng hoặc trong `${ … }`) ──
    if (c === '/' && s[i + 1] === '/') {
      let j = s.indexOf('\n', i)
      if (j < 0) j = n
      xoa(ma, i, j)
      xoa(trong, i, j)
      i = j
      continue
    }
    if (c === '/' && s[i + 1] === '*') {
      let j = s.indexOf('*/', i + 2)
      j = j < 0 ? n : j + 2
      xoa(ma, i, j)
      xoa(trong, i, j)
      i = j
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      let dong = false
      while (j < n) {
        if (s[j] === '\n') break
        if (s[j] === '\\') {
          j += 2
          continue
        }
        if (s[j] === c) {
          dong = true
          break
        }
        j++
      }
      if (dong) {
        vanBan.push({ kieu: 'chuoi', bd: i, vanBan: s.slice(i + 1, j) })
        xoa(trong, i + 1, j)
        i = j + 1
        truoc = c
        tu = ''
        continue
      }
      // nháy không đóng trong cùng dòng (dấu nháy trong chữ JSX) ⇒ ký tự thường
      i++
      truoc = c
      tu = ''
      continue
    }
    // regex chỉ đứng sau toán tử / từ khoá / mũi tên `=>` (KHÔNG sau `>` `}` của JSX: `<b>5</b>/10`, `{a}/{b}`)
    if (c === '/' && (truoc === '' || /[(,=:[!&|?{;+*%~^-]/.test(truoc) || TU_TRUOC_REGEX.test(tu) || (truoc === '>' && /=>\s*$/.test(s.slice(Math.max(0, i - 12), i))))) {
      let j = i + 1
      let trongLop = false
      let ok = false
      while (j < n) {
        const d = s[j]
        if (d === '\n') break
        if (d === '\\') {
          j += 2
          continue
        }
        if (d === '[') trongLop = true
        else if (d === ']') trongLop = false
        else if (d === '/' && !trongLop) {
          ok = true
          break
        }
        j++
      }
      if (ok && j > i + 1) {
        let k = j + 1
        while (k < n && /[a-z]/.test(s[k])) k++
        xoa(trong, i + 1, j)
        i = k
        truoc = ')'
        tu = ''
        continue
      }
    }
    if (dinh && dinh.loai === 'bt') {
      if (c === '{') dinh.sau++
      else if (c === '}') {
        if (dinh.sau === 0) {
          nganXep.pop()
          const mau = nganXep[nganXep.length - 1]
          if (mau) mau.doanBd = i + 1
          i++
          truoc = '}'
          tu = ''
          continue
        }
        dinh.sau--
      }
    }
    if (c === '`') {
      nganXep.push({ loai: 'mau', bd: i, doanBd: i + 1, manh: '' })
      i++
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (/[\w$]/.test(c)) tu = /[\w$]/.test(truoc) && s[i - 1] === truoc ? tu + c : c
    else tu = ''
    truoc = c
    i++
  }
  return { ma: ma.join(''), trong: trong.join(''), vanBan }
}

function tachCss(s) {
  const ma = s.split('')
  let i = 0
  while (i < s.length) {
    if (s[i] === '/' && s[i + 1] === '*') {
      let j = s.indexOf('*/', i + 2)
      j = j < 0 ? s.length : j + 2
      xoa(ma, i, j)
      i = j
      continue
    }
    i++
  }
  const m = ma.join('')
  return { ma: m, trong: m, vanBan: [] }
}

function tachHtml(s) {
  const ma = s.split('')
  let i = 0
  while (i < s.length) {
    if (s.startsWith('<!--', i)) {
      let j = s.indexOf('-->', i + 4)
      j = j < 0 ? s.length : j + 3
      xoa(ma, i, j)
      i = j
      continue
    }
    i++
  }
  const m = ma.join('')
  return { ma: m, trong: m, vanBan: [] }
}

const boNho = new WeakMap()

/** Phân tích một tệp MỘT lần (nhớ theo đối tượng `tep`) — mọi luật dùng chung kết quả. */
export function phanTich(tep) {
  let pt = boNho.get(tep)
  if (pt) return pt
  const duong = chuanDuong(tep.duong)
  const noiDung = String(tep.noiDung ?? '')
  const loai = loaiTep(duong)
  const tach = loai === 'tsx' || loai === 'ts' ? tachTs(noiDung) : loai === 'css' ? tachCss(noiDung) : loai === 'html' ? tachHtml(noiDung) : { ma: noiDung, trong: noiDung, vanBan: [] }
  const dauDong = [0]
  for (let i = 0; i < noiDung.length; i++) if (noiDung[i] === '\n') dauDong.push(i + 1)
  const dongCua = (viTri) => {
    let a = 0
    let b = dauDong.length - 1
    while (a < b) {
      const g = (a + b + 1) >> 1
      if (dauDong[g] <= viTri) a = g
      else b = g - 1
    }
    return a + 1
  }
  pt = { duong, noiDung, loai, ...tach, dongMa: tach.ma.split('\n'), dongCua }
  boNho.set(tep, pt)
  return pt
}

function taoPhatHien(pt, luat, muc, dong, moTa, goiY) {
  return { luat, muc, duong: pt.duong, dong, moTa, goiY }
}

/** Mỗi (dòng + mô tả) chỉ báo một lần. */
function khuTrung(ds) {
  const thay = new Set()
  return ds.filter((p) => {
    const k = `${p.luat}|${p.dong}|${p.moTa}`
    if (thay.has(k)) return false
    thay.add(k)
    return true
  })
}

// ───────────────────────────── 2. ĐỌC THẺ JSX ─────────────────────────────

/** Đọc thẻ mở bắt đầu ở `viTri` (ký tự `<`). Trả null khi thẻ lạ (thà sót). */
function docThe(pt, viTri) {
  const { ma, trong } = pt
  const m = /^<([A-Za-z][\w.:-]*)/.exec(trong.slice(viTri, viTri + 80))
  if (!m) return null
  const ten = m[1]
  let i = viTri + m[0].length
  const bdThuocTinh = i
  let sau = 0
  const gioiHan = Math.min(trong.length, viTri + 8000)
  for (; i < gioiHan; i++) {
    const c = trong[i]
    if (c === '{') sau++
    else if (c === '}') sau--
    else if (sau === 0 && c === '>') break
    else if (sau === 0 && c === '<') return null
    if (sau < 0) return null
  }
  if (i >= gioiHan) return null
  const tuDong = trong[i - 1] === '/'
  const ktThuocTinh = tuDong ? i - 1 : i
  // `nong`: chỉ phần ở độ sâu ngoặc 0 (ruột `{…}` và ruột chuỗi thành dấu cách) ⇒ tìm TÊN thuộc tính an toàn
  const nong = trong.slice(bdThuocTinh, ktThuocTinh).split('')
  let d = 0
  let coTrai = false
  for (let k = 0; k < nong.length; k++) {
    const c = nong[k]
    if (c === '{') {
      if (d === 0 && ma.slice(bdThuocTinh + k + 1, bdThuocTinh + k + 40).trimStart().startsWith('...')) coTrai = true
      d++
      continue
    }
    if (c === '}') {
      d--
      continue
    }
    if (d > 0 && c !== '\n') nong[k] = ' '
  }
  return { ten, bd: viTri, kt: i + 1, tuDong, coTrai, bdThuocTinh, nong: nong.join(''), day: ma.slice(bdThuocTinh, ktThuocTinh) }
}

const reTen = (ten) => new RegExp(`(^|\\s)${ten.replace(/[-.]/g, '\\$&')}(?=[\\s=/]|$)`)

function coThuocTinh(the, ...tenS) {
  return tenS.some((t) => reTen(t).test(the.nong))
}

/** Giá trị thô của thuộc tính: chuỗi trong nháy ⇒ ruột chuỗi; `{…}` ⇒ nguyên cả ngoặc; không có ⇒ null; có tên mà không có `=` ⇒ ''. */
function giaTri(the, ten) {
  const m = reTen(ten).exec(the.nong)
  if (!m) return null
  let i = m.index + m[0].length
  while (i < the.nong.length && /\s/.test(the.nong[i])) i++
  if (the.nong[i] !== '=') return ''
  i++
  while (i < the.day.length && /\s/.test(the.day[i])) i++
  const c = the.day[i]
  if (c === '"' || c === "'") {
    const j = the.day.indexOf(c, i + 1)
    return j < 0 ? '' : the.day.slice(i + 1, j)
  }
  if (c === '{') {
    let d = 0
    for (let k = i; k < the.nong.length; k++) {
      if (the.nong[k] === '{') d++
      else if (the.nong[k] === '}') {
        d--
        if (d === 0) return the.day.slice(i, k + 1)
      }
    }
  }
  return ''
}

/** Duyệt mọi thẻ mở tên khớp `reTenThe` (vd /<(div|span)(?=[\s/>])/g) trong tệp TSX. */
function* duyetThe(pt, reTenThe) {
  if (pt.loai !== 'tsx') return
  reTenThe.lastIndex = 0
  let m
  while ((m = reTenThe.exec(pt.trong))) {
    const truoc = pt.trong[m.index - 1] ?? ''
    if (/[\w)\]]/.test(truoc)) continue // `useState<input…`, `a<b` — không phải thẻ JSX
    const the = docThe(pt, m.index)
    if (the) yield the
  }
}

/** Các đoạn CHỮ JSX (giữa hai thẻ, đã bỏ `{…}`) — chỉ dùng cho từ cấm dễ trùng tên biến (deadline / HP / streak). */
function vanBanJsx(pt) {
  if (pt.loai !== 'tsx') return []
  if (pt._jsx) return pt._jsx
  const { trong } = pt
  const kq = []
  const re = /<\/?[A-Za-z][\w.]*|<\/?>/g
  let sau = 0
  let ktTruoc = -1
  let boQuaDen = 0
  let m
  while ((m = re.exec(trong))) {
    const idx = m.index
    if (idx < boQuaDen) continue
    // `useState<string>`, `a<b`: không phải thẻ. Thẻ ĐÓNG thì luôn dính chữ phía trước; thẻ chữ nghiêng/đậm giữa câu cũng vậy.
    if (m[0][1] !== '/' && /[\w)\]]/.test(trong[idx - 1] ?? '') && !(sau > 0 && /^<(b|i|u|a|em|strong|span|small|sub|sup|code|mark|br)$/.test(m[0]))) continue
    let kt
    let mo = 0
    if (m[0] === '<>') {
      kt = idx + 2
      mo = 1
    } else if (m[0] === '</>') {
      kt = idx + 3
      mo = -1
    } else if (m[0][1] === '/') {
      const j = trong.indexOf('>', idx)
      if (j < 0 || j - idx > 120) continue
      kt = j + 1
      mo = -1
    } else {
      const the = docThe(pt, idx)
      if (!the) continue
      if (/^\s*(,|extends\b)/.test(the.nong)) continue // `<T,>(…)` — tham số kiểu, không phải thẻ
      kt = the.kt
      mo = the.tuDong ? 0 : 1
    }
    if (ktTruoc >= 0 && sau > 0) {
      const doan = trong.slice(ktTruoc, idx)
      if (/^(function|export|const|import|type|interface|class)\b/m.test(doan)) sau = 0 // đếm lệch ⇒ bắt đầu lại
      else {
        const ky = doan.split('')
        let d = 0
        for (let k = 0; k < ky.length; k++) {
          const c = ky[k]
          if (c === '{') {
            d++
            ky[k] = ' '
          } else if (c === '}') {
            if (d === 0) xoa(ky, 0, k)
            else d--
            ky[k] = ' '
          } else if (d > 0 && c !== '\n') ky[k] = ' '
        }
        const chu = ky.join('')
        if (/\p{L}/u.test(chu) && !/=>|&&|\|\||===|!==/.test(chu)) kq.push({ kieu: 'jsx', bd: ktTruoc, vanBan: pt.ma.slice(ktTruoc, idx).split('').map((c, k) => (ky[k] === ' ' && c !== '\n' ? ' ' : c)).join('') })
      }
    }
    sau = Math.max(0, sau + mo)
    ktTruoc = kt
    boQuaDen = kt
  }
  pt._jsx = kq
  return kq
}

/** Dòng (1-based) của vị trí `lech` bên trong một đoạn văn bản bắt đầu ở `bd`. */
function dongTrongVanBan(pt, vb, lech) {
  let them = 0
  for (let k = 0; k < lech && k < vb.vanBan.length; k++) if (vb.vanBan[k] === '\n') them++
  return pt.dongCua(vb.bd) + them
}

const dongCoConsole = (pt, dong) => /\bconsole\s*\./.test(pt.dongMa[dong - 1] ?? '')

// ───────────────────────────── 3. CÁC LUẬT ─────────────────────────────

/** G01 · LỖI · `<div|span onClick>` không có `role` + (`tabIndex`/`onKeyDown`). */
export function luatG01(tep) {
  const pt = phanTich(tep)
  const kq = []
  for (const the of duyetThe(pt, /<(div|span)(?=[\s/>])/g)) {
    if (!coThuocTinh(the, 'onClick') || the.coTrai) continue
    const an = giaTri(the, 'aria-hidden')
    if (an !== null && an !== 'false' && an !== '{false}') continue // tấm che ẩn với trình đọc màn hình
    const role = giaTri(the, 'role')
    if (role !== null && /^(presentation|none|dialog|alertdialog)$/.test(role)) continue
    const onClick = giaTri(the, 'onClick') ?? ''
    if (/^\{\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{?\s*\1\.stopPropagation\(\)\s*;?\s*\}?\s*\}$/.test(onClick)) continue // chỉ chặn nổi bọt
    const lop = giaTri(the, 'className') ?? ''
    if (/(^|[\s'"`])inset-0(?![\w-])/.test(lop)) continue // tấm nền phủ kín: bấm ra ngoài để đóng (đã có Esc)
    const coRole = role !== null
    const coPhim = coThuocTinh(the, 'tabIndex', 'onKeyDown', 'onKeyUp', 'onKeyPress')
    if (coRole && coPhim) continue
    const thieu = !coRole && !coPhim ? 'không có role lẫn tabIndex/onKeyDown' : !coRole ? 'có bàn phím nhưng thiếu role' : 'có role nhưng thiếu tabIndex/onKeyDown'
    kq.push(taoPhatHien(pt, 'G01', LOI, pt.dongCua(the.bd), `<${the.ten} onClick> ${thieu}`, 'Đổi thành <button type="button"> (điều hướng thì <a>); bất đắc dĩ mới thêm role="button" + tabIndex={0} + onKeyDown (Enter/Space).'))
  }
  return kq
}

function tenBieuTuongLucide(pt) {
  if (pt._lucide) return pt._lucide
  const ten = new Set()
  const re = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g
  let m
  while ((m = re.exec(pt.ma))) {
    for (const manh of m[1].split(',')) {
      const t = manh.trim().split(/\s+as\s+/).pop()?.trim()
      if (t) ten.add(t)
    }
  }
  pt._lucide = ten
  return ten
}

/** G02 · LỖI · nút chỉ có biểu tượng mà không có `aria-label`/`title`. */
export function luatG02(tep) {
  const pt = phanTich(tep)
  const kq = []
  const lucide = tenBieuTuongLucide(pt)
  for (const the of duyetThe(pt, /<[a-z][a-z0-9]*(?=[\s/>])/g)) {
    if (the.tuDong || the.coTrai) continue
    const laNut = the.ten === 'button' || giaTri(the, 'role') === 'button'
    if (!laNut) continue
    if (coThuocTinh(the, 'aria-label', 'aria-labelledby', 'title')) continue
    // con DUY NHẤT: một thành phần viết Hoa tự đóng, rồi tới ngay thẻ đóng
    let i = the.kt
    while (i < pt.trong.length && /\s/.test(pt.trong[i])) i++
    if (!/^<[A-Z]/.test(pt.trong.slice(i, i + 2))) continue
    const con = docThe(pt, i)
    if (!con || !con.tuDong || con.coTrai) continue
    let j = con.kt
    while (j < pt.trong.length && /\s/.test(pt.trong[j])) j++
    if (!pt.trong.startsWith(`</${the.ten}`, j)) continue
    const laBieuTuong = lucide.has(con.ten) || /^(Icon|BieuTuong)[A-Z0-9]/.test(con.ten) || /Icon$/.test(con.ten)
    if (!laBieuTuong) continue // không chắc là biểu tượng ⇒ bỏ qua
    if (coThuocTinh(con, 'aria-label', 'title')) continue
    kq.push(taoPhatHien(pt, 'G02', LOI, pt.dongCua(the.bd), `<${the.ten}> chỉ có biểu tượng <${con.ten} /> mà không có aria-label/title`, 'Thêm aria-label="Động từ + kết quả" (vd "Đóng", "Xoá câu 3") hoặc kèm chữ nhìn thấy được.'))
  }
  return kq
}

const RE_THAY_FOCUS_CSS = /box-shadow\s*:(?!\s*none)|(?<![\w-])border(-[a-z]+)*\s*:(?!\s*(0|none)\b)|background(-color)?\s*:|(?<![\w-])outline\s*:\s*(?!none\b|0\b)\S/

/** Khối `{ … }` CSS chứa vị trí `viTri`: trả { boChon, than, ktKhoi }. */
function khoiCss(ma, viTri) {
  let d = 0
  let mo = -1
  for (let i = viTri; i >= 0; i--) {
    if (ma[i] === '}') d++
    else if (ma[i] === '{') {
      if (d === 0) {
        mo = i
        break
      }
      d--
    }
  }
  if (mo < 0) return null
  let dong = ma.length
  d = 0
  for (let i = mo + 1; i < ma.length; i++) {
    if (ma[i] === '{') d++
    else if (ma[i] === '}') {
      if (d === 0) {
        dong = i
        break
      }
      d--
    }
  }
  let bdChon = mo - 1
  while (bdChon >= 0 && !/[{};]/.test(ma[bdChon])) bdChon--
  return { boChon: ma.slice(bdChon + 1, mo).trim(), than: ma.slice(mo + 1, dong), ktKhoi: dong }
}

/** G03 · LỖI · xoá viền focus (`outline: none|0`) mà không có thay thế. */
export function luatG03(tep) {
  const pt = phanTich(tep)
  const kq = []
  const goiY = 'Giữ viền focus: dùng :focus-visible { outline: 2px solid var(--m3-primary) } hoặc box-shadow vòng thay thế; không xoá trơn.'
  if (pt.loai === 'css') {
    const re = /(?<![\w-])outline(-style)?\s*:\s*(none|0(px)?)\s*(!important)?\s*(?=[;}])/g
    let m
    while ((m = re.exec(pt.ma))) {
      const khoi = khoiCss(pt.ma, m.index)
      if (!khoi) continue
      const boChon = khoi.boChon
      if (/:not\(\s*:focus-visible\s*\)/.test(boChon)) continue // chỉ ẩn viền khi bấm chuột, bàn phím vẫn thấy
      if (/:focus/.test(boChon)) {
        if (RE_THAY_FOCUS_CSS.test(khoi.than)) continue
      } else {
        // khối nền (không :focus): chấp nhận khi tệp có luật `:focus…` cho CÙNG lớp cuối của bộ chọn
        const lopCuoi = boChon.split(',').map((p) => (p.match(/\.[\w-]+/g) ?? []).pop()).filter(Boolean)
        const reLuat = /([^{}]*)\{/g
        let coThay = false
        let r
        while (!coThay && (r = reLuat.exec(pt.ma))) {
          const chon = r[1]
          if (!/:focus/.test(chon)) continue
          if (lopCuoi.length ? lopCuoi.some((l) => new RegExp(`${l.replace(/[-.]/g, '\\$&')}(?![\\w-])`).test(chon)) : boChon.split(',').some((p) => chon.includes(p.trim()))) coThay = true
        }
        if (coThay) continue
      }
      const sau5 = pt.ma.slice(m.index).split('\n').slice(0, 6).join('\n')
      if (/:focus-visible/.test(sau5.slice(m[0].length))) continue
      kq.push(taoPhatHien(pt, 'G03', LOI, pt.dongCua(m.index), `"${boChon.replace(/\s+/g, ' ').slice(0, 60)}" xoá outline mà không thấy :focus-visible / box-shadow thay thế`, goiY))
    }
    return kq
  }
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const cuaSo = (dong) => pt.dongMa.slice(Math.max(0, dong - 6), dong + 5).join('\n')
  // (a) style nội tuyến: outline: 'none' | 0
  const reNoiTuyen = /(?<![\w-])outline\s*:\s*(?:(['"`])\s*(?:none|0(?:px)?)\s*\1|0\s*(?=[,}\n]))/g
  let m
  while ((m = reNoiTuyen.exec(pt.ma))) {
    const dong = pt.dongCua(m.index)
    if (/focus/i.test(cuaSo(dong))) continue
    kq.push(taoPhatHien(pt, 'G03', LOI, dong, 'style nội tuyến outline: none — không có thay thế khi focus (5 dòng quanh đó không có onFocus / focus:)', goiY))
  }
  // (b) lớp Tailwind outline-none không kèm ring/focus thay thế trong CÙNG chuỗi lớp
  for (const vb of pt.vanBan) {
    const t = vb.vanBan
    if (!/(?<![\w-])(focus:|focus-visible:)?outline-(none|0|hidden)(?![\w-])/.test(t)) continue
    const conLai = t.replace(/(focus:|focus-visible:)?outline-(none|0|hidden)/g, '')
    if (/ring|focus:|focus-visible:|focus-within:/.test(conLai)) continue
    const dong = pt.dongCua(vb.bd)
    if (/onFocus|:focus/.test(cuaSo(dong))) continue
    kq.push(taoPhatHien(pt, 'G03', LOI, dong, 'lớp outline-none không kèm focus:ring / focus-visible: thay thế trong cùng chuỗi lớp', goiY))
  }
  return khuTrung(kq)
}

/** G04 · LỖI · `transition: all` / `transition-property: all` (kể cả lớp Tailwind `transition-all`). */
export function luatG04(tep) {
  const pt = phanTich(tep)
  const kq = []
  const goiY = 'Liệt kê đúng thuộc tính cần chuyển (transform, opacity, background-color…); Tailwind: transition-opacity / transition-transform / transition-colors.'
  if (pt.loai === 'css') {
    const re = /(?<![\w-])transition(-property)?\s*:\s*([^;{}]*)/g
    let m
    while ((m = re.exec(pt.ma))) {
      if (/(^|[\s,])all(?=[\s,]|$)/.test(m[2].trim())) kq.push(taoPhatHien(pt, 'G04', LOI, pt.dongCua(m.index), `${m[0].trim().replace(/\s+/g, ' ').slice(0, 60)}`, goiY))
    }
    return kq
  }
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const re = /(?<![\w-])transition(Property)?\s*:\s*(['"`])([^'"`\n]*)\2/g
  let m
  while ((m = re.exec(pt.ma))) {
    if (/(^|[\s,])all(?=[\s,]|$)/.test(m[3].trim())) kq.push(taoPhatHien(pt, 'G04', LOI, pt.dongCua(m.index), `style nội tuyến transition: '${m[3].trim().slice(0, 40)}'`, goiY))
  }
  for (const vb of pt.vanBan) {
    const lech = vb.vanBan.search(/(?<![\w-])transition-all(?![\w-])/)
    if (lech >= 0) kq.push(taoPhatHien(pt, 'G04', LOI, dongTrongVanBan(pt, vb, lech), 'lớp Tailwind transition-all (= transition-property: all)', goiY))
    // CSS viết trong chuỗi mẫu (phiếu HTML, tờ chiếu)
    const reCss = /(?<![\w-])transition(-property)?\s*:\s*all(?=[\s;,!]|$)/g
    let c
    while ((c = reCss.exec(vb.vanBan))) kq.push(taoPhatHien(pt, 'G04', LOI, dongTrongVanBan(pt, vb, c.index), 'CSS trong chuỗi: transition: all', goiY))
  }
  return khuTrung(kq)
}

/** G05 · LỖI · chặn phóng to trang trong index.html. */
export function luatG05(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'html') return kq
  const mau = [
    [/user-scalable\s*=\s*(no|0)\b/gi, 'user-scalable=no chặn phóng to trang'],
    [/maximum-scale\s*=\s*1(\.0*)?(?![\d.])/gi, 'maximum-scale=1 chặn phóng to trang'],
  ]
  for (const [re, moTa] of mau) {
    let m
    while ((m = re.exec(pt.ma))) kq.push(taoPhatHien(pt, 'G05', LOI, pt.dongCua(m.index), moTa, 'Bỏ khỏi thẻ <meta name="viewport"> — chỉ giữ width=device-width, initial-scale=1, viewport-fit=cover.'))
  }
  return kq
}

/** G06 · CẢNH BÁO · `<img>` không có kích thước giữ chỗ và không có `loading=`. */
export function luatG06(tep) {
  const pt = phanTich(tep)
  const kq = []
  for (const the of duyetThe(pt, /<img(?=[\s/>])/g)) {
    if (the.coTrai) continue
    const style = giaTri(the, 'style') ?? ''
    const lop = giaTri(the, 'className') ?? ''
    const coKichThuoc = (coThuocTinh(the, 'width') && coThuocTinh(the, 'height')) || /\b(width|height|aspectRatio|inlineSize|blockSize)\b/.test(style) || /(^|[\s'"`:])(w|h|size|aspect|max-w|max-h)-/.test(lop)
    if (coKichThuoc || coThuocTinh(the, 'loading')) continue
    kq.push(taoPhatHien(pt, 'G06', CANH_BAO, pt.dongCua(the.bd), '<img> thiếu width/height (hoặc style có kích thước) và thiếu loading=', 'Thêm width + height (giữ chỗ, khỏi xô lệch); ảnh dưới màn đầu thêm loading="lazy".'))
  }
  return kq
}

/** G07 · CẢNH BÁO · ô nhập không có nhãn. */
export function luatG07(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx') return kq
  const htmlFor = new Set()
  const reFor = /(?<![\w-])htmlFor\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\})/g
  let m
  while ((m = reFor.exec(pt.ma))) htmlFor.add((m[1] ?? m[2] ?? m[3] ?? '').trim())
  for (const the of duyetThe(pt, /<(input|select|textarea)(?=[\s/>])/g)) {
    if (the.coTrai) continue
    if (coThuocTinh(the, 'aria-label', 'aria-labelledby', 'title', 'hidden')) continue
    const kieu = giaTri(the, 'type') ?? ''
    if (/^(hidden|submit|button|reset|image)$/.test(kieu)) continue
    if (/(^|[\s'"`])(hidden|sr-only)(?![\w-])/.test(giaTri(the, 'className') ?? '')) continue
    if (/display\s*:\s*['"]none/.test(giaTri(the, 'style') ?? '')) continue
    const id = giaTri(the, 'id')
    if (id !== null) {
      const khoa = id.startsWith('{') ? id.slice(1, -1).trim() : id.trim()
      if (htmlFor.has(khoa)) continue
      if (id.startsWith('{') && htmlFor.size > 0) continue // id động + tệp có htmlFor ⇒ coi như đã nối
    }
    const moLabel = pt.trong.lastIndexOf('<label', the.bd)
    if (moLabel >= 0 && pt.trong.lastIndexOf('</label', the.bd) < moLabel) continue // nằm trong <label>
    kq.push(taoPhatHien(pt, 'G07', CANH_BAO, pt.dongCua(the.bd), `<${the.ten}> không có nhãn (aria-label / aria-labelledby / id khớp <label htmlFor> / nằm trong <label>)`, 'Bọc trong <label> có chữ, hoặc thêm <label htmlFor=…>; ô không có chữ cạnh thì aria-label.'))
  }
  return kq
}

/** G08 · CẢNH BÁO · ba dấu chấm "..." thay vì ký tự "…". */
export function luatG08(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const goiY = 'Thay "..." bằng ký tự "…" (U+2026).'
  const reChuoi = /(^|[\p{L}\p{N}\s!?)}])\.{3}(?!\.)/u
  for (const vb of pt.vanBan) {
    const t = vb.vanBan
    const mm = reChuoi.exec(t)
    if (!mm) continue
    if (t !== '...' && !/\p{L}/u.test(t)) continue
    if (/\.{3}\/|\/\.{3}|\*\*|\.{3}\w+\s*[,)\]]/.test(t)) continue // đường dẫn / glob / mã nguồn trong chuỗi
    const dong = dongTrongVanBan(pt, vb, mm.index)
    if (dongCoConsole(pt, dong)) continue
    if (/^\s*import\b/.test(pt.dongMa[dong - 1] ?? '')) continue
    kq.push(taoPhatHien(pt, 'G08', CANH_BAO, dong, `chuỗi có "..." : "${t.replace(/\s+/g, ' ').slice(Math.max(0, mm.index - 20), mm.index + 6)}"`, goiY))
  }
  if (pt.loai === 'tsx') {
    // chữ JSX: trong mã đã bỏ chuỗi + chú thích, "chữ cái + ..." chỉ có thể là chữ hiển thị (toán tử trải luôn đứng sau dấu , ( [ {)
    const re = /[\p{L}\p{N}!?]\s?\.{3}(?!\.)/gu
    let m
    while ((m = re.exec(pt.trong))) kq.push(taoPhatHien(pt, 'G08', CANH_BAO, pt.dongCua(m.index), 'chữ JSX có "..."', goiY))
  }
  return khuTrung(kq)
}

const RE_EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️|[\u{1F000}-\u{1FAFF}]/u

/** G09 · CẢNH BÁO · emoji trong chuỗi giao diện. */
export function luatG09(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const goiY = 'App cấm emoji: dùng biểu tượng lucide + chữ, hoặc bỏ hẳn.'
  for (const vb of pt.vanBan) {
    const mm = RE_EMOJI.exec(vb.vanBan)
    if (!mm) continue
    const dong = dongTrongVanBan(pt, vb, mm.index)
    if (dongCoConsole(pt, dong)) continue
    kq.push(taoPhatHien(pt, 'G09', CANH_BAO, dong, `emoji ${mm[0]} trong chuỗi`, goiY))
  }
  const re = new RegExp(RE_EMOJI.source, 'gu')
  let m
  while ((m = re.exec(pt.trong))) kq.push(taoPhatHien(pt, 'G09', CANH_BAO, pt.dongCua(m.index), `emoji ${m[0]} trong chữ JSX`, goiY))
  return khuTrung(kq)
}

const VUNG_HS_PH = [/^src\/components\/bang-nhiem-vu\//, /^src\/screens\/StudentPortalScreen\.tsx$/, /^src\/screens\/ParentPortalScreen\.tsx$/, /^src\/game\//]
const KHONG_DINH = '(?<![\\p{L}\\p{N}_-])'
const KHONG_SAU = '(?![\\p{L}\\p{N}_-])'
const TU_CAM_HS_PH = [
  { re: new RegExp(`${KHONG_DINH}deadline${KHONG_SAU}`, 'iu'), tu: 'deadline', thay: '"Hạn nộp"', canChuHienThi: true },
  { re: new RegExp(`${KHONG_DINH}streak${KHONG_SAU}`, 'iu'), tu: 'streak', thay: '"Chuỗi ngày"', canChuHienThi: true },
  { re: new RegExp(`${KHONG_DINH}HP${KHONG_SAU}`, 'u'), tu: 'HP', thay: '"Máu" (vd "Máu 83/100")', canChuHienThi: true },
  { re: /(?<![\p{L}\p{N}_-])(Lô|lô|LÔ)(?=\s+[\p{L}\p{N}])/u, tu: 'Lô', thay: '"Chặng"', canChuHienThi: false },
]
const RE_NAM_CHAC = /nắm\s+chắc/iu
const RE_TEN_THUOC_TINH_CHU = /(title|label|aria-label|placeholder|alt|nhan|tieuDe|moTa|chu)\s*[=:]\s*\{?\s*$/

/** Chuỗi "trông như chữ hiển thị": có dấu cách hoặc chữ có dấu, không phải className / import. */
function laChuHienThi(pt, vb) {
  const truoc = pt.ma.slice(Math.max(0, vb.bd - 60), vb.bd)
  if (/(className|class|import|from|require\()\s*[=:(]?\s*\{?\s*$/.test(truoc)) return false
  if (/\bfrom\s*$/.test(truoc) || /^\s*import\b[^\n]*$/.test(truoc.split('\n').pop() ?? '')) return false
  if (RE_TEN_THUOC_TINH_CHU.test(truoc)) return true
  return /\s/.test(vb.vanBan.trim()) || /[\u0080-\uFFFF]/.test(vb.vanBan)
}

/** G10 · từ bị cấm theo bảng A2: "nắm chắc" (mọi nơi, LỖI); deadline / Lô / HP / streak ở màn học sinh + phụ huynh (CẢNH BÁO). */
export function luatG10(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const goiYNamChac = 'Bỏ chữ "nắm chắc" (chuẩn A1.7: không nhãn năng lực) — nói sự việc: "đúng 4/5 câu gần đây".'
  const chuoi = pt.vanBan.map((vb) => ({ ...vb, vanBan: vb.vanBan.normalize('NFC') }))
  for (const vb of chuoi) {
    const mm = RE_NAM_CHAC.exec(vb.vanBan)
    // chuỗi CHỈ gồm đúng hai chữ ấy = mục trong bảng từ cấm của bộ chặn, không phải chữ hiển thị
    if (mm && vb.vanBan.trim().length > mm[0].length) kq.push(taoPhatHien(pt, 'G10', LOI, dongTrongVanBan(pt, vb, mm.index), 'chuỗi có chữ "nắm chắc"', goiYNamChac))
  }
  const trongNfc = pt.trong.normalize('NFC')
  const coTheDoViTri = trongNfc.length === pt.trong.length
  const reNc = new RegExp(RE_NAM_CHAC.source, 'giu')
  let m
  while ((m = reNc.exec(trongNfc))) kq.push(taoPhatHien(pt, 'G10', LOI, coTheDoViTri ? pt.dongCua(m.index) : trongNfc.slice(0, m.index).split('\n').length, 'chữ JSX có "nắm chắc"', goiYNamChac))

  if (!VUNG_HS_PH.some((re) => re.test(pt.duong))) return khuTrung(kq)
  const hienThi = [...chuoi.filter((vb) => laChuHienThi(pt, vb)), ...vanBanJsx(pt).map((vb) => ({ ...vb, vanBan: vb.vanBan.normalize('NFC') }))]
  for (const vb of hienThi) {
    for (const tc of TU_CAM_HS_PH) {
      const mm = tc.re.exec(vb.vanBan)
      if (!mm) continue
      const dong = dongTrongVanBan(pt, vb, mm.index)
      if (dongCoConsole(pt, dong)) continue
      kq.push(taoPhatHien(pt, 'G10', CANH_BAO, dong, `chữ hiển thị màn học sinh/phụ huynh có "${tc.tu}"`, `Dùng từ chuẩn ${tc.thay} (bảng A2).`))
    }
  }
  // "Lô " không thể là tên biến ⇒ soi thêm thẳng trên mã đã bỏ chuỗi (chữ JSX nằm trong thuộc tính lồng nhau)
  const reLo = new RegExp(TU_CAM_HS_PH[3].re.source, 'gu')
  while ((m = reLo.exec(trongNfc))) kq.push(taoPhatHien(pt, 'G10', CANH_BAO, coTheDoViTri ? pt.dongCua(m.index) : trongNfc.slice(0, m.index).split('\n').length, 'chữ hiển thị màn học sinh/phụ huynh có "Lô"', 'Dùng từ chuẩn "Chặng" (bảng A2).'))
  return khuTrung(kq)
}

/** Ruột ngoặc tròn cân bằng bắt đầu ở `mo` (vị trí dấu `(`). */
function ruotNgoac(pt, mo, kyMo = '(', kyDong = ')') {
  let d = 0
  for (let i = mo; i < pt.trong.length && i < mo + 4000; i++) {
    if (pt.trong[i] === kyMo) d++
    else if (pt.trong[i] === kyDong) {
      d--
      if (d === 0) return pt.ma.slice(mo + 1, i)
    }
  }
  return null
}

const RE_GIO_24 = /hour12\s*:\s*false|hourCycle\s*:\s*['"]h23['"]/

/** G11 · CẢNH BÁO · giờ 12 tiếng: toLocale(Time)String thiếu hour12:false; ô datetime-local/time còn sót. */
export function luatG11(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const re = /\.(toLocaleTimeString|toLocaleString)\s*\(/g
  let m
  while ((m = re.exec(pt.trong))) {
    const mo = m.index + m[0].length - 1
    const ruot = ruotNgoac(pt, mo)
    if (ruot === null || RE_GIO_24.test(ruot)) continue
    const thamSo2 = ruot.includes(',') ? ruot.slice(ruot.indexOf(',') + 1).trim() : ''
    if (thamSo2 && !thamSo2.startsWith('{')) continue // tuỳ chọn truyền bằng biến ⇒ không biết, bỏ qua
    if (m[1] === 'toLocaleString') {
      // toLocaleString còn dùng cho SỐ ⇒ chỉ báo khi chắc là giờ: tuỳ chọn có hour/minute/timeStyle, hoặc gọi trên `new Date(…)`
      const truoc = pt.ma.slice(Math.max(0, m.index - 80), m.index)
      const chacLaGio = /\b(hour|minute|second|timeStyle)\s*:/.test(ruot) || /new Date\([^()]*(\([^()]*\))?[^()]*\)\s*$/.test(truoc)
      if (!chacLaGio) continue
    } else if (thamSo2 && !/\b(hour|minute|second|timeStyle)\s*:/.test(thamSo2) && /\b(weekday|day|month|year|dateStyle)\s*:/.test(thamSo2)) continue
    kq.push(taoPhatHien(pt, 'G11', CANH_BAO, pt.dongCua(m.index), `${m[1]}(…) không truyền hour12: false / hourCycle: 'h23'`, "Thêm hour12: false (hoặc hourCycle: 'h23') — máy đặt 12 giờ vẫn phải ra 24 giờ; hoặc dùng hàm chung src/lib/ngay-gio-24.ts."))
  }
  if (/^src\/(screens|components)\//.test(pt.duong) && !/ONgayGio24/.test(pt.duong)) {
    const reO = /(?<![\w-])type\s*=\s*\{?\s*['"](datetime-local|time)['"]/g
    while ((m = reO.exec(pt.ma))) kq.push(taoPhatHien(pt, 'G11', CANH_BAO, pt.dongCua(m.index), `ô type="${m[1]}" còn sót (hiện 12 giờ SA/CH trên nhiều máy)`, 'Thay bằng <ONgayGio24> (src/components/ONgayGio24.tsx).'))
  }
  return kq
}

/** G12 · CẢNH BÁO · chặn dán vào ô nhập. */
export function luatG12(tep) {
  const pt = phanTich(tep)
  const kq = []
  if (pt.loai !== 'tsx') return kq
  const re = /(?<![\w-])onPaste\s*=\s*\{/g
  let m
  while ((m = re.exec(pt.trong))) {
    const ruot = ruotNgoac(pt, m.index + m[0].length - 1, '{', '}')
    if (ruot === null || !/\.preventDefault\s*\(/.test(ruot)) continue
    kq.push(taoPhatHien(pt, 'G12', CANH_BAO, pt.dongCua(m.index), 'onPaste gọi preventDefault — chặn dán', 'Không chặn dán (chuẩn B13); cần lọc ký tự thì lọc trong onChange.'))
  }
  return kq
}

const RE_THUOC_TINH_BO_CUC = /^(min-|max-)?(width|height)$|^(top|left|right|bottom|inset)$|^(margin|padding)(-[a-z]+)*$/

function thuocTinhBoCucTrongTransition(giaTriTransition) {
  const thay = []
  for (const phan of giaTriTransition.split(',')) {
    const tu = phan.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
    if (RE_THUOC_TINH_BO_CUC.test(tu)) thay.push(tu)
  }
  return thay
}

/** G13 · CẢNH BÁO · chuyển động trên thuộc tính gây dàn lại bố cục. */
export function luatG13(tep) {
  const pt = phanTich(tep)
  const kq = []
  const goiY = 'Chỉ chuyển động transform / opacity (chuẩn B15): thanh tiến độ dùng transform: scaleX(), trượt dùng translate.'
  if (pt.loai === 'css') {
    const re = /(?<![\w-])transition(-property)?\s*:\s*([^;{}]*)/g
    let m
    while ((m = re.exec(pt.ma))) {
      const thay = thuocTinhBoCucTrongTransition(m[2])
      if (thay.length) kq.push(taoPhatHien(pt, 'G13', CANH_BAO, pt.dongCua(m.index), `transition trên ${[...new Set(thay)].join(', ')}`, goiY))
    }
    const reKf = /@keyframes\s+([\w-]+)\s*\{/g
    while ((m = reKf.exec(pt.ma))) {
      const mo = m.index + m[0].length - 1
      let d = 0
      let dong = pt.ma.length
      for (let i = mo; i < pt.ma.length; i++) {
        if (pt.ma[i] === '{') d++
        else if (pt.ma[i] === '}') {
          d--
          if (d === 0) {
            dong = i
            break
          }
        }
      }
      const than = pt.ma.slice(mo + 1, dong)
      const reKhai = /(?:^|[{;\s])((?:min-|max-)?(?:width|height)|top|left|right|bottom|inset|(?:margin|padding)(?:-[a-z]+)*)\s*:/g
      const r = reKhai.exec(than)
      if (r) kq.push(taoPhatHien(pt, 'G13', CANH_BAO, pt.dongCua(mo + 1 + r.index + r[0].indexOf(r[1])), `@keyframes ${m[1]} đổi ${r[1]}`, goiY))
    }
    return kq
  }
  if (pt.loai !== 'tsx' && pt.loai !== 'ts') return kq
  const re = /(?<![\w-])transition(Property)?\s*:\s*(['"`])([^'"`\n]*)\2/g
  let m
  while ((m = re.exec(pt.ma))) {
    const thay = thuocTinhBoCucTrongTransition(m[3])
    if (thay.length) kq.push(taoPhatHien(pt, 'G13', CANH_BAO, pt.dongCua(m.index), `style nội tuyến transition trên ${[...new Set(thay)].join(', ')}`, goiY))
  }
  return kq
}

/** G14 · CẢNH BÁO · tệp CSS có hoạt ảnh mà cả tệp không có `prefers-reduced-motion`. */
export function luatG14(tep) {
  const pt = phanTich(tep)
  if (pt.loai !== 'css') return []
  const m = /@keyframes\s|(?<![\w-])animation(-name)?\s*:(?!\s*(?:none|inherit|unset|initial)\b)/.exec(pt.ma)
  if (!m || /prefers-reduced-motion/.test(pt.ma)) return []
  return [taoPhatHien(pt, 'G14', CANH_BAO, pt.dongCua(m.index), 'tệp có @keyframes/animation mà không có khối prefers-reduced-motion', 'Thêm @media (prefers-reduced-motion: reduce) { … animation: none } cho hoạt ảnh của tệp (hiệu ứng game phải tắt sạch).')]
}

export const LUAT = [
  { ma: 'G01', muc: LOI, ten: '<div|span onClick> thiếu role + bàn phím', ham: luatG01 },
  { ma: 'G02', muc: LOI, ten: 'nút chỉ có biểu tượng, thiếu aria-label', ham: luatG02 },
  { ma: 'G03', muc: LOI, ten: 'xoá outline không có thay thế', ham: luatG03 },
  { ma: 'G04', muc: LOI, ten: 'transition: all', ham: luatG04 },
  { ma: 'G05', muc: LOI, ten: 'chặn phóng to trang (index.html)', ham: luatG05 },
  { ma: 'G06', muc: CANH_BAO, ten: '<img> thiếu kích thước + loading', ham: luatG06 },
  { ma: 'G07', muc: CANH_BAO, ten: 'ô nhập không có nhãn', ham: luatG07 },
  { ma: 'G08', muc: CANH_BAO, ten: '"..." thay vì "…"', ham: luatG08 },
  { ma: 'G09', muc: CANH_BAO, ten: 'emoji trong chuỗi giao diện', ham: luatG09 },
  { ma: 'G10', muc: CANH_BAO, ten: 'từ bị cấm (A2); "nắm chắc" = LỖI', ham: luatG10 },
  { ma: 'G11', muc: CANH_BAO, ten: 'giờ 12 tiếng / ô datetime-local', ham: luatG11 },
  { ma: 'G12', muc: CANH_BAO, ten: 'chặn dán (onPaste preventDefault)', ham: luatG12 },
  { ma: 'G13', muc: CANH_BAO, ten: 'chuyển động trên thuộc tính bố cục', ham: luatG13 },
  { ma: 'G14', muc: CANH_BAO, ten: 'CSS có hoạt ảnh, thiếu prefers-reduced-motion', ham: luatG14 },
]

// ───────────────────────────── 4. MIỄN TRỪ + CHẠY ─────────────────────────────

/** Tệp bị bỏ qua hẳn: test, graphify-out, *.d.ts. */
export function laTepBoQua(duong) {
  const d = chuanDuong(duong)
  return /(^|\/)graphify-out\//.test(d) || /\.d\.ts$/.test(d) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(d) || /(^|\/)(__tests__|tests)\//.test(d) || /(^|\/)node_modules\//.test(d)
}

/** Tách phát hiện thành { giu, mienTru } theo chú thích `soi-bo-qua: G0x lý do` ở NGAY DÒNG TRÊN. */
export function apDungMienTru(noiDung, phatHien) {
  const dong = String(noiDung ?? '').split('\n')
  const giu = []
  const mienTru = []
  for (const p of phatHien) {
    const tren = dong[p.dong - 2] ?? ''
    const m = /soi-bo-qua\s*:\s*((?:G\d{2}[\s,]*)+)/.exec(tren)
    if (m && m[1].split(/[\s,]+/).includes(p.luat)) mienTru.push(p)
    else giu.push(p)
  }
  return { giu, mienTru }
}

/** Soi MỘT tệp bằng mọi luật (đã áp miễn trừ). */
export function soiTep(tep) {
  if (laTepBoQua(tep.duong) || !loaiTep(chuanDuong(tep.duong))) return { giu: [], mienTru: [] }
  const tatCa = []
  for (const l of LUAT) tatCa.push(...l.ham(tep))
  tatCa.sort((a, b) => a.dong - b.dong || a.luat.localeCompare(b.luat))
  return apDungMienTru(tep.noiDung, tatCa)
}

export function globThanhRegex(glob) {
  let r = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++
        if (glob[i + 1] === '/') {
          i++
          r += '(?:.*/)?'
        } else r += '.*'
      } else r += '[^/]*'
    } else if (c === '?') r += '[^/]'
    else if (c === '{') {
      const j = glob.indexOf('}', i)
      if (j < 0) r += '\\{'
      else {
        r += `(?:${glob.slice(i + 1, j).split(',').map((x) => x.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|')})`
        i = j
      }
    } else r += c.replace(/[.+^$()|[\]\\}]/g, '\\$&')
  }
  return new RegExp(`^${r}$`)
}

export function khopTep(duong, mauS) {
  if (!mauS.length) return true
  const d = chuanDuong(duong).normalize('NFC')
  return mauS.some((mau) => {
    const g = chuanDuong(mau).normalize('NFC').replace(/\/$/, '')
    return d === g || d.startsWith(`${g}/`) || globThanhRegex(g).test(d)
  })
}

export function demTheoLuat(giu, mienTru) {
  const dem = {}
  for (const l of LUAT) dem[l.ma] = { ten: l.ten, loi: 0, canhBao: 0, mienTru: 0 }
  for (const p of giu) dem[p.luat][p.muc === LOI ? 'loi' : 'canhBao']++
  for (const p of mienTru) dem[p.luat].mienTru++
  return dem
}

function lietKeTep(goc) {
  const kq = []
  const duyet = (thuMuc) => {
    for (const ten of readdirSync(thuMuc).sort()) {
      if (ten === 'node_modules' || ten === 'graphify-out' || ten.startsWith('.')) continue
      const p = join(thuMuc, ten)
      if (statSync(p).isDirectory()) duyet(p)
      else if (/\.(tsx?|css)$/.test(ten)) kq.push(p)
    }
  }
  duyet(join(goc, 'src'))
  kq.push(join(goc, 'index.html'))
  return kq
}

function docThamSo(argv, goc) {
  const ts = { tep: [], chiLoi: false, json: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--chi-loi') ts.chiLoi = true
    else if (a === '--json') ts.json = true
    else if (a === '--tep') {
      // vỏ lệnh có thể đã bung glob thành nhiều đường dẫn ⇒ nhận mọi tham số tới cờ kế tiếp
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) ts.tep.push(argv[++i])
    } else if (a.startsWith('--tep=')) ts.tep.push(a.slice(6))
    else if (!a.startsWith('--')) ts.tep.push(a)
  }
  ts.tep = ts.tep.map((t) => (isAbsolute(t) ? relative(goc, t) : t))
  return ts
}

function chay() {
  const goc = fileURLToPath(new URL('..', import.meta.url))
  const ts = docThamSo(process.argv.slice(2), goc)
  const giu = []
  const mienTru = []
  let soTep = 0
  for (const p of lietKeTep(goc)) {
    const duong = chuanDuong(relative(goc, p))
    if (laTepBoQua(duong) || !khopTep(duong, ts.tep)) continue
    let noiDung
    try {
      noiDung = readFileSync(p, 'utf8')
    } catch {
      continue
    }
    soTep++
    const kq = soiTep({ duong, noiDung })
    giu.push(...kq.giu)
    mienTru.push(...kq.mienTru)
  }
  const dem = demTheoLuat(giu, mienTru)
  const tongLoi = giu.filter((p) => p.muc === LOI).length
  const tongCanhBao = giu.length - tongLoi
  const hien = ts.chiLoi ? giu.filter((p) => p.muc === LOI) : giu
  if (ts.json) {
    process.stdout.write(`${JSON.stringify({ soTep, tongLoi, tongCanhBao, tongMienTru: mienTru.length, dem, phatHien: hien, mienTru }, null, 1)}\n`)
  } else {
    for (const p of hien) console.log(`${p.duong}:${p.dong} · ${p.luat} ${NHAN_MUC[p.muc]} · ${p.moTa} · ${p.goiY}`)
    console.log(`\nBẢNG ĐẾM THEO LUẬT (${soTep} tệp)`)
    console.log('Luật  Lỗi  Cảnh báo  Miễn trừ  Nội dung')
    for (const l of LUAT) {
      const d = dem[l.ma]
      console.log(`${l.ma}  ${String(d.loi).padStart(4)}  ${String(d.canhBao).padStart(8)}  ${String(d.mienTru).padStart(8)}  ${l.ten}`)
    }
    console.log(`TỔNG ${String(tongLoi).padStart(4)}  ${String(tongCanhBao).padStart(8)}  ${String(mienTru.length).padStart(8)}`)
    console.log(tongLoi ? `\nCÓ ${tongLoi} LỖI — mã thoát 1.` : '\nKhông có LỖI (cảnh báo không làm đỏ) — mã thoát 0.')
  }
  process.exitCode = tongLoi ? 1 : 0
}

const laChayTrucTiep = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
})()
if (laChayTrucTiep) chay()
