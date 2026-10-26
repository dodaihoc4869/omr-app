// Bộ dò vùng chạm cho «Chạm để hiểu đề» (thầy chốt build 26/10). Hàm thuần, không React, không mạng.
// Nhận chữ đề THÔ (đã bỏ HTML), trả các vùng: 'hoi' (đề hỏi) > 'cho' (số + đơn vị) > 'chat' (tên chất, công thức) > 'khoa' (từ then chốt).
// Vùng không chồng lấn; vị trí theo ký tự của CHÍNH chuỗi đưa vào (chữ NFD cũng được: dò trên bản NFC rồi ánh xạ ngược).
// Luật bẫy (DAC-TA §5): «M» chỉ là đơn vị khi đứng ngay sau số; «không» chỉ tô trong câu hỏi «… không đúng / sai / không phải»;
// không tô «không khí», «không màu»; không tô gì trong mệnh đề «Cho nguyên tử khối: H = 1; C = 12…».
import type { LoaiCham, VungCham } from './kieu'
import { chuanChu, chuanCongThuc, docNguyenTuKhoiTrongDe, laIon, NGUYEN_TU_KHOI, phanTichCongThuc, tachDienTich, tenDeDo, traCongThuc, traTen } from './tu-dien-chat'
import { CACH_VIET_DON_VI } from './tu-dien-don-vi'
import { DAC_KHONG_PHAI, danhSachThenChot } from './tu-then-chot'

type UngVien = { loai: LoaiCham; tu: number; den: number; khoa?: string }
const UU_TIEN: Record<LoaiCham, number> = { hoi: 0, cho: 1, chat: 2, khoa: 3 }

const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Mẫu regex từ chữ thô, đã chuẩn hoá như chữ đề (thường, đ→d, dấu thanh kiểu mới). */
const mau = (s: string) => thoat(chuanChu(s))
const BIEN_TRAI = '(?<![\\p{L}\\p{N}])'
const BIEN_PHAI = '(?![\\p{L}\\p{N}])'

// ───────────── Số + đơn vị ─────────────
const SO = String.raw`\d+(?:[.,]\d+)*(?:\s*[×x.·*]\s*10\s*(?:\^\s*\(?[-−–+]?\s*\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|\^\s*\(?[-−]?\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?`
let _reDonVi: RegExp | null = null
const reDonVi = () =>
  (_reDonVi ??= new RegExp(
    `(?<![\\p{L}\\p{N}_.,^])(${SO})([ \\u00a0]?)(${[...CACH_VIET_DON_VI].sort((a, b) => b[0].length - a[0].length).map(([v]) => thoat(v)).join('|')})${BIEN_PHAI}`,
    'gu',
  ))
const MA_DON_VI = new Map(CACH_VIET_DON_VI)

const RE_DIEN = new RegExp(['điện phân', 'dòng điện', 'cường độ', 'ampe'].map(mau).join('|'), 'u')
const RE_PT_C = new RegExp(`c%|${mau('nồng độ')}`, 'u')

function doSoDonVi(t: string, lc: string, ra: UngVien[]) {
  const coDien = RE_DIEN.test(lc)
  for (const m of t.matchAll(reDonVi())) {
    const [, , cach, dv] = m
    let ma = MA_DON_VI.get(dv)!
    if ((dv === 's' || dv === 'h') && cach) continue // «s», «h» chỉ nhận khi viết liền số: «1930s», «2h»
    if (dv === 'A' && !coDien) continue
    const tu = m.index!
    if (ma === '%') {
      const truoc = lc.slice(Math.max(0, tu - 40), tu)
      ma = /hiệu suất/.test(truoc) ? '%H' : RE_PT_C.test(truoc) ? '%C' : /thể tích/.test(truoc) ? '%V' : /khối lượng/.test(truoc) ? '%m' : '%'
    }
    ra.push({ loai: 'cho', tu, den: tu + m[0].length, khoa: ma })
  }
  const reDk = new RegExp(`${BIEN_TRAI}(${mau('đkc')}|${mau('đktc')}|${mau('điều kiện tiêu chuẩn')}|${mau('điều kiện chuẩn')})${BIEN_PHAI}`, 'gu')
  for (const m of lc.matchAll(reDk)) {
    const k = m[1] === 'dkc' || m[1] === mau('điều kiện chuẩn') ? 'dkc' : 'dktc'
    ra.push({ loai: 'cho', tu: m.index!, den: m.index! + m[0].length, khoa: k })
  }
}

// ───────────── Công thức + tên chất ─────────────
const RE_CT = /(?<![\p{L}])[A-Z([](?:[A-Za-z0-9()[\]]|[=≡-](?=[A-Z([]))*(?:[·.*•]\d*H2O)?(?:\^?\d?[+-]|[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])?(?![\p{L}\p{N}])/gu
const CHAN = new Set(['HCHC', 'CHC', 'HC', 'CH'])
const LA_MA = /\((?:I{1,3}|IV|VI{0,3})\)/

/** Công thức có hợp lệ để TÔ không (chặt hơn phanTichCongThuc: loại chữ cái lẻ, số La Mã, viết tắt). */
function hopLeDeTo(goc: string): boolean {
  if (!goc || CHAN.has(goc) || /^I+$/.test(goc)) return false
  if (!phanTichCongThuc(goc)) return false
  if (/[=≡-]/.test(goc) && goc.split(/[=≡-]/).some((d) => !/\d/.test(d) && (d.match(/[A-Z]/g) ?? []).length < 2)) return false
  if (/\d/.test(goc)) return true
  const kyHieu = goc.match(/[A-Z][a-z]?/g) ?? []
  if (kyHieu.length === 1) return kyHieu[0].length === 2 // «Fe», «Na»; chữ cái lẻ «C», «K», «B» không tô
  if (kyHieu.every((k) => k.length === 1)) return traCongThuc(goc).some((c) => c.cachViet.includes(goc)) // «CO», «HCl»… phải có trong từ điển
  return true
}

function doCongThuc(t: string, f: string, lc: string, ra: UngVien[]) {
  for (const m of f.matchAll(RE_CT)) {
    let tu = m.index!
    let c = m[0]
    // số La Mã: «Fe(III)» ⇒ chỉ lấy «Fe»
    const lm = LA_MA.exec(c)
    if (lm) c = c.slice(0, lm.index)
    // ngoặc thừa ở đầu/cuối: «(NaOH)», «NaOH)»
    for (;;) {
      const mo = (c.match(/[([]/g) ?? []).length; const dong = (c.match(/[)\]]/g) ?? []).length
      if (/^[([]/.test(c) && (mo > dong || /^[([][^()[\]]*[)\]]$/.test(c))) { c = c.slice(1); tu++; if (/^[^()[\]]*[)\]]$/.test(c)) c = c.slice(0, -1); continue }
      if (/[)\]]$/.test(c) && dong > mo) { c = c.slice(0, -1); continue }
      break
    }
    let khoa = chuanCongThuc(c)
    let goc = khoa
    if (/[+-]$/.test(khoa)) {
      const tach = tachDienTich(khoa)
      if (laIon(khoa) || NGUYEN_TU_KHOI[tach.goc] !== undefined) goc = tach.goc
      else { c = c.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]$|[+-]$/, ''); khoa = goc = chuanCongThuc(c) }
    }
    if (!hopLeDeTo(goc)) continue
    if (goc === 'Ba' && khoa === 'Ba') {
      // «Ba» còn là số ba: chỉ nhận khi không đứng trước một chữ thường, hoặc sau «kim loại», «và», «,»…
      const sau = t.slice(tu + c.length).match(/^\s*(\p{Ll})/u)
      if (sau && !/(loại|tố|và|với|gồm)\s*$/.test(lc.slice(Math.max(0, tu - 12), tu))) continue
    }
    ra.push({ loai: 'chat', tu, den: tu + c.length, khoa })
  }
}

let _reTen: RegExp | null = null
const reTen = () =>
  (_reTen ??= new RegExp(`${BIEN_TRAI}(${tenDeDo().sort((a, b) => b.length - a.length).map(thoat).join('|')})${BIEN_PHAI}`, 'gu'))
const KHONG_PHAI_CHAT_SAU = new Map([['oxi', / hoá/y], ['hidro', / hoá/y]])

function doTenChat(lc: string, ra: UngVien[]) {
  for (const m of lc.matchAll(reTen())) {
    const den = m.index! + m[0].length
    const cam = KHONG_PHAI_CHAT_SAU.get(m[1])
    if (cam) { cam.lastIndex = den; if (cam.test(lc)) continue }
    const chat = traTen(m[1])
    if (chat) ra.push({ loai: 'chat', tu: m.index!, den, khoa: chat.ten })
  }
}

// ───────────── Từ then chốt ─────────────
let _reKhoa: { re: RegExp; ma: Map<string, string> } | null = null
function reKhoa() {
  if (_reKhoa) return _reKhoa
  const ma = new Map<string, string>()
  for (const t of danhSachThenChot()) for (const v of t.cachViet) if (!ma.has(chuanChu(v))) ma.set(chuanChu(v), t.ma)
  const dac = mau('đặc')
  const cacCach = [...ma.keys()].sort((a, b) => b.length - a.length).map((k) => (k === dac ? `${thoat(k)}(?! (?:${DAC_KHONG_PHAI.map(mau).join('|')}))` : thoat(k)))
  return (_reKhoa = { re: new RegExp(`${BIEN_TRAI}(${cacCach.join('|')})${BIEN_PHAI}`, 'gu'), ma })
}
function doThenChot(lc: string, ra: UngVien[]) {
  const { re, ma } = reKhoa()
  for (const m of lc.matchAll(re)) ra.push({ loai: 'khoa', tu: m.index!, den: m.index! + m[0].length, khoa: ma.get(m[1]) })
}

// ───────────── Đề hỏi ─────────────
const RE_BAY = new RegExp(`${BIEN_TRAI}(?:${['không đúng', 'không phải', 'không chính xác'].map(mau).join('|')}|sai(?! số))${BIEN_PHAI}`, 'gu')
const RE_NAO = new RegExp(`${BIEN_TRAI}nào (?:sau|${mau('dưới')}) ${mau('đây')}${BIEN_PHAI}`, 'u')
const RE_DAU = new RegExp(`^\\s*(?:${mau('hãy')}\\s+)?(?:${mau('tính')}|${mau('xác định')})${BIEN_PHAI}`, 'u')
const RE_BAO_NHIEU = new RegExp(`${BIEN_TRAI}bao ${mau('nhiêu')}(?:\\s+[\\p{L}/³]+)?`, 'u')
const RE_LA_CUOI = new RegExp(`${BIEN_TRAI}${mau('là')}$`, 'u')
const RE_DAU_CAU = new RegExp(
  `${BIEN_TRAI}(?:${['giá trị', 'khối lượng', 'thể tích', 'nồng độ', 'số mol', 'số gam', 'phần trăm', 'hiệu suất', 'công thức', 'tên gọi', 'tổng số', 'tổng', 'tỉ lệ', 'tỉ khối', 'nhiệt độ', 'thời gian', 'độ tan', 'số'].map(mau).join('|')})${BIEN_PHAI}`,
  'u',
)

/** Tách câu: [đầu, cuối) theo «. ? !» + khoảng trắng, hoặc xuống dòng. */
function tachCau(t: string): [number, number][] {
  const ra: [number, number][] = []
  let dau = 0
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (c === '\n' || (/[.?!]/.test(c) && (i + 1 === t.length || /\s/.test(t[i + 1])))) { ra.push([dau, i + 1]); dau = i + 1 }
  }
  if (dau < t.length) ra.push([dau, t.length])
  return ra
}

function doDeHoi(t: string, lc: string, daCo: UngVien[], ra: UngVien[]) {
  const cau = tachCau(t)
  for (let k = cau.length - 1; k >= 0; k--) {
    const [a, b] = cau[k]
    // bỏ đuôi: khoảng trắng, dấu câu, «(làm tròn …)»
    let e = b
    for (;;) {
      const truoc = e
      while (e > a && /[\s.?!:…]/.test(t[e - 1])) e--
      if (e > a && t[e - 1] === ')') { const mo = t.lastIndexOf('(', e - 1); if (mo > a) e = mo }
      if (e === truoc) break
    }
    let s = a
    while (s < e && /\s/.test(t[s])) s++
    if (s >= e) continue
    const doan = lc.slice(s, e)
    const nao = RE_NAO.exec(doan)
    const dau = RE_DAU.test(doan)
    const bn = RE_BAO_NHIEU.exec(doan)
    const laCuoi = RE_LA_CUOI.test(doan)
    const hoiCham = /\?\s*$/.test(t.slice(a, b).replace(/\([^()]*\)\s*$/, '').trimEnd())
    if (!nao && !dau && !bn && !laCuoi && !hoiCham) continue
    // 1) bẫy phủ định: chỉ tô cụm bẫy (bản vẽ màn 5)
    const bay = [...doan.matchAll(RE_BAY)]
    if (bay.length) {
      for (const m of bay) ra.push({ loai: 'hoi', tu: s + m.index!, den: s + m.index! + m[0].length, khoa: 'phu-dinh' })
      return
    }
    const benTrong = (x: number, y: number) => daCo.filter((v) => (v.loai === 'cho' || v.loai === 'chat') && v.tu >= x && v.den <= y)
    // mệnh đề cuối: sau dấu «, ; :» gần nhất (dấu phẩy thập phân «0,5» không tính)
    const cuoiMenhDe = (den: number) => {
      let i = den
      while (i > s && !(/[;:]/.test(t[i - 1]) || (t[i - 1] === ',' && !/\d/.test(t[i] ?? '')))) i--
      while (i < den && /\s/.test(t[i])) i++
      return i
    }
    let tu: number, den: number, khoa: string
    if (nao) {
      den = s + nao.index! + nao[0].length
      const md = cuoiMenhDe(s + nao.index!)
      const dc = RE_DAU_CAU.exec(lc.slice(md, s + nao.index!))
      if (dc) tu = md + dc.index!
      else {
        // tối đa 2 chữ đứng trước «nào sau đây»
        const truoc = lc.slice(md, s + nao.index!)
        const chu = [...truoc.matchAll(/[\p{L}\p{N}]+/gu)]
        tu = chu.length ? md + chu[Math.max(0, chu.length - 2)].index! : s + nao.index!
      }
      khoa = 'nao-sau-day'
    } else if (dau) {
      tu = s
      const dung = /\d|,|;| khi | biết | nếu | sau khi /u.exec(lc.slice(s, e))
      den = dung ? s + dung.index! : e
      khoa = 'tinh'
    } else {
      den = bn ? s + bn.index! + bn[0].length : e
      const md = cuoiMenhDe(bn ? s + bn.index! : e)
      const dc = RE_DAU_CAU.exec(lc.slice(md, den))
      khoa = dc && lc.startsWith(mau('giá trị'), md + dc.index!) ? 'gia-tri' : bn ? 'bao-nhieu' : laCuoi ? 'la' : 'cau-hoi'
      if (dc) tu = md + dc.index!
      else {
        tu = md
        const trong = benTrong(md, den)
        if (trong.length) tu = Math.max(...trong.map((v) => v.den))
      }
    }
    // không nuốt số liệu / chất: tách thành phần đầu (trước vùng 'cho'/'chat' đầu tiên) và phần đuôi (sau vùng cuối)
    const day = (x: number, y: number) => {
      while (y > x && /[\s,.;:]/.test(t[y - 1])) y--
      while (x < y && /[\s,.;:]/.test(t[x])) x++
      if (y > x) ra.push({ loai: 'hoi', tu: x, den: y, khoa })
    }
    const trong = benTrong(tu, den)
    if (!trong.length) day(tu, den)
    else {
      day(tu, Math.min(...trong.map((v) => v.tu)))
      day(Math.max(...trong.map((v) => v.den)), den)
    }
    return
  }
}

// ───────────── Ghép ─────────────
const _nho = new Map<string, VungCham[]>()
const NHO_TOI_DA = 300

/** Dò mọi vùng chạm trong chữ đề thô. Kết quả ghi nhớ theo chữ đề (tính một lần mỗi câu). */
export function phatHien(chuDe: string): VungCham[] {
  const daNho = _nho.get(chuDe)
  if (daNho) return daNho.map((v) => ({ ...v }))
  const ketQua = phatHienMoi(chuDe)
  if (_nho.size >= NHO_TOI_DA) _nho.delete(_nho.keys().next().value!)
  _nho.set(chuDe, ketQua)
  return ketQua.map((v) => ({ ...v }))
}

function phatHienMoi(goc: string): VungCham[] {
  if (!goc) return []
  // chữ NFD (dấu tách rời) ⇒ dò trên bản NFC, giữ bảng ánh xạ vị trí về chuỗi gốc
  let t = goc
  let viTri: number[] | null = null
  if (/[\u0300-\u036f]/.test(goc) && goc.normalize('NFC') !== goc) {
    viTri = []
    let nfc = ''
    let p = 0
    for (const nhom of goc.match(/[\s\S][\u0300-\u036f]*/g) ?? []) {
      const n = nhom.normalize('NFC')
      for (let i = 0; i < n.length; i++) viTri.push(i === 0 ? p : p + nhom.length)
      nfc += n
      p += nhom.length
    }
    viTri.push(goc.length)
    t = nfc
  }
  let lc = chuanChu(t)
  if (lc.length !== t.length) lc = t
  let f = ''
  for (const c of t) { const d = '₀₁₂₃₄₅₆₇₈₉'.indexOf(c); f += d >= 0 ? String(d) : c }
  if (f.length !== t.length) f = t

  const vung: UngVien[] = []
  doSoDonVi(t, lc, vung)
  doCongThuc(t, f, lc, vung)
  doTenChat(lc, vung)
  doThenChot(lc, vung)
  doDeHoi(t, lc, vung, vung)

  const cam = docNguyenTuKhoiTrongDe(t).khoang
  const nhan: UngVien[] = []
  for (const v of vung.sort((x, y) => UU_TIEN[x.loai] - UU_TIEN[y.loai] || x.tu - y.tu || y.den - x.den)) {
    if (v.den <= v.tu) continue
    if (cam.some(([a, b]) => v.tu < b && v.den > a)) continue
    if (nhan.some((n) => v.tu < n.den && v.den > n.tu)) continue
    nhan.push(v)
  }
  nhan.sort((x, y) => x.tu - y.tu)
  const doi = (i: number) => (viTri ? viTri[i] : i)
  return nhan.map((v) => {
    const tu = doi(v.tu); const den = doi(v.den)
    const r: VungCham = { loai: v.loai, tu, den, chu: goc.slice(tu, den) }
    if (v.khoa !== undefined) r.khoa = v.khoa
    return r
  })
}
