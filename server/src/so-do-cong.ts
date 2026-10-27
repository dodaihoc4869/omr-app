// CỔNG KIỂM «LỜI GIẢI KIỂU SƠ ĐỒ» (thầy chốt build 26/10) — HÀM THUẦN, không D1, không mạng, không AI.
// Hợp đồng: src/lib/goi-y-cham/kieu.ts. Đặc tả: docs/ban-ve-doc-de-2610/DAC-TA.md mục 4 («Cổng đúng số», «Hai cửa kiểm») và mục 7.
//
// `kiemCong(ban, cau)` trả MỘT trong bốn kết quả (`KetQuaCong`):
//   'lo_dap_an'       — phần hiện TRƯỚC khi nộp (deNoiGi · soDo · nghĩa / «tới đây» của từng thừa số · chìa khoá · câu tự hỏi · hiện tượng)
//                       chứa đáp số cuối, chữ cái / giá trị phương án đúng, hoặc kết quả trung gian quyết định. Xét TRƯỚC mọi thứ khác.
//   'khong_kiem_duoc' — Phần II (v1); câu thiếu sơ đồ / bước tính; thừa số không đọc được; đáp án kho không phải số; phương án đúng không phải số.
//   'lech'            — nhân hết các thừa số KHÔNG ra đúng đáp án kho (hoặc `ketQua` ghi trong bản lệch với phép tính).
//   'dat'             — nhân hết các thừa số ra ĐÚNG đáp án kho theo cách làm tròn của kho.
//
// SỐ: đọc bằng `docSoPhanIII` (một hàm dùng chung mọi kênh chấm Phần III: dấu phẩy thập phân, 10^6, 10^-6, 10⁶, 10⁻⁶, ×10⁹…).
// ĐÚNG ĐÁP ÁN PHẦN III: làm tròn giá trị tính được về đúng số chữ số của đáp án kho rồi chấm bằng `khopPhanIII` (một luật chấm Phần III cho mọi kênh,
// src/lib/cham-so.ts); hoặc lệch không quá nửa đơn vị chữ số cuối của đáp án kho (đúng nghĩa «đáp án kho là số đã làm tròn»).
import type { BanSoDo, KetQuaCong } from '../../src/lib/goi-y-cham/kieu'
import { docSoPhanIII } from '../../src/lib/doc-so-phan-iii'
import { khopPhanIII } from '../../src/lib/cham-so'

export type CauKiemCong = { phan: 'I' | 'II' | 'III'; dapAn: string; luaChon?: Record<string, string> }
export type KetQuaKiemCong = { ket: KetQuaCong; lyDo?: string; giaTri?: number }

/** Số bước tối đa của hợp đồng (1 là chuẩn; khó hiểu thì tách 2, TỐI ĐA 3). */
export const SO_BUOC_TOI_DA = 3
const str = (v: unknown): string => (v == null ? '' : String(v))

// ---------------------------------------------------------------- đọc số

/** Một con số đọc được + đơn vị chữ số cuối của CHÍNH cách viết ấy (để biết nó đã làm tròn tới đâu). */
type SoDoc = { v: number; donViCuoi: number; donVi: string }
const CO_MU = /(?:[×x*·]\s*10|\.\s*10\s*\^|\^|[eE][+-]?\d|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/

/** Đọc một chuỗi số (kiểu kho): «76,8», «1,2375×10⁹ kJ», «10^-6», «0,5M». Không phải số ⇒ null. */
export function docSo(raw: unknown): SoDoc | null {
  const s = str(raw).trim()
  const d = docSoPhanIII(s)
  if (!d) return null
  const v = Number(d.so)
  if (!Number.isFinite(v)) return null
  let donViCuoi: number
  if (CO_MU.test(s)) {
    // Có số mũ: số chữ số có nghĩa lấy ở phần định trị (trước ×10…): «1,2375×10⁹» ⇒ 5 chữ số ⇒ đơn vị cuối 10⁵.
    const m = /^[+\-−]?\s*(\d+(?:[.,]\d+)?)/.exec(s)
    const chuSo = (m?.[1] ?? '').replace(/[.,]/g, '').replace(/^0+/, '')
    const coNghia = Math.max(1, chuSo.length)
    donViCuoi = v === 0 ? 1 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - coNghia + 1)
    if (/^[+\-−]?\s*10\s*(?:\^|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])/.test(s)) donViCuoi = Math.abs(v) * 1e-9 // «10^6» là lũy thừa chính xác, không phải số làm tròn
  } else {
    const tp = d.so.split('.')[1] ?? ''
    donViCuoi = Math.pow(10, -tp.length)
  }
  return { v, donViCuoi, donVi: d.donVi }
}

/** `x` (đã viết, làm tròn tới `donViCuoi`) có phải là cách viết làm tròn của giá trị `t` không. */
function trongLamTron(x: SoDoc, t: number): boolean {
  return Math.abs(x.v - t) <= 0.5 * x.donViCuoi * (1 + 1e-9) + 1e-12 * Math.max(1, Math.abs(t))
}

/** Đơn vị viết theo một con số mà vẫn coi là «một con số» (phương án «10,2 gam», «0,5M», «25%»): chữ, %, °, ³, ², /, ·. Không chứa chữ số. */
const DON_VI_SO = /^[\p{L}%°³²/·.\s]{0,12}$/u

// ---------------------------------------------------------------- tính chuỗi thừa số

type KetTinh = { ok: true; giaTriBuoc: number[]; tienTo: number[]; nguyenVan: number[] } | { ok: false; lyDo: string }

const MU_NHO: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' }
/** Chuẩn hoá chữ của một thừa số để phân tích: số mũ chữ nhỏ ⇒ «^(…)», dấu trừ Unicode ⇒ «-», × · ∙ ⇒ «*», «:» ⇒ «/», «a.10^k» (kiểu VN) ⇒ «a*10^k». */
function chuanBieuThuc(so: string): string {
  return so
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^(${[...m].map((c) => MU_NHO[c]).join('')})`)
    .replace(/[−–—‒]/g, '-').replace(/[×·∙⋅]/g, '*').replace(/:/g, '/')
    .replace(/(\d)\s*\.\s*(?=10\s*\^)/g, '$1*')
    .replace(/(\d)\s*[xX]\s*(?=10\s*\^)/g, '$1*')
    .replace(/[\s ]+/g, ' ').trim()
}

/**
 * Giá trị một thừa số — một BIỂU THỨC nhỏ: số (dấu phẩy thập phân, «%» ⇒ /100), lũy thừa «10^6» «10^-6» «10⁶» «10⁻⁶», + − × /, ngoặc, và TÊN kết quả
 * bước trước (`ten` của bước, khớp dài nhất). Ví dụ «8/100», «1/120», «(0,15 − 0,1)», «1/n_SO2», «n_CO2 · 44», «(90/100)». Không đọc được ⇒ null.
 */
export function giaTriThuaSo(so: string, ten: Map<string, number> = new Map()): number | null {
  const goc = str(so).trim()
  if (!goc) return null
  if (ten.has(goc)) return ten.get(goc)!
  const s = chuanBieuThuc(goc).replace(/^\*\s*/, '')
  const tenDai = [...ten.keys()].filter(Boolean).sort((a, b) => b.length - a.length)
  let i = 0
  const trang = () => { while (s[i] === ' ') i++ }
  const xem = (): string => { trang(); return s[i] ?? '' }
  const loi = { v: NaN }
  function nguyenTo(): number {
    const c = xem()
    if (c === '(') { i++; const v = tong(); if (xem() !== ')') throw loi; i++; return v }
    for (const t of tenDai) if (s.startsWith(t, i)) { i += t.length; return ten.get(t)! }
    // 27/10: số có dấu cách ngăn hàng nghìn kiểu VN («1 000 000», «10 000,5») — chỉ nhóm đúng 3 chữ số.
    const m = /^\d{1,3}(?: \d{3})+(?:,\d+)?(?![\d.])|^\d+(?:[.,]\d+)?/.exec(s.slice(i))
    if (!m) throw loi
    i += m[0].length
    let v = Number(m[0].replace(/ /g, '').replace(',', '.'))
    if (xem() === '%') { i++; v /= 100 }
    return v
  }
  function luyThua(): number {
    const co = nguyenTo()
    if (xem() === '^') { i++; return Math.pow(co, motNgoi()) }
    return co
  }
  function motNgoi(): number {
    const c = xem()
    if (c === '-') { i++; return -motNgoi() }
    if (c === '+') { i++; return motNgoi() }
    return luyThua()
  }
  function tich(): number {
    let v = motNgoi()
    for (;;) {
      const c = xem()
      if (c === '*') { i++; v *= motNgoi() } else if (c === '/') { i++; const m = motNgoi(); if (m === 0) throw loi; v /= m } else return v
    }
  }
  function tong(): number {
    let v = tich()
    for (;;) {
      const c = xem()
      if (c === '+') { i++; v += tich() } else if (c === '-') { i++; v -= tich() } else return v
    }
  }
  try {
    const v = tong()
    if (xem() !== '') return null
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}


/** Nhân từng bước; bước sau dùng tên kết quả bước trước. Kèm tích TỪ ĐẦU TỚI ĐÂY (≥ 2 thừa số) để chặn lộ kết quả trung gian. */
function tinhChuoi(ban: BanSoDo): KetTinh {
  const ten = new Map<string, number>()
  const giaTriBuoc: number[] = [], tienTo: number[] = [], nguyenVan: number[] = []
  for (const [i, b] of ban.buoc.entries()) {
    const ds = Array.isArray(b?.thuaSo) ? b.thuaSo : []
    if (!ds.length) return { ok: false, lyDo: `Bước ${i + 1} không có thừa số.` }
    let tich = 1
    for (const [j, t] of ds.entries()) {
      const v = giaTriThuaSo(str(t?.so), ten)
      if (v === null) return { ok: false, lyDo: `Bước ${i + 1}: thừa số «${str(t?.so).slice(0, 40)}» không đọc được.` }
      const ve = str(t?.so).trim()
      if (!ten.has(ve) && docSoPhanIII(ve)) nguyenVan.push(v)
      tich *= v
      if (j >= 1) tienTo.push(tich)
    }
    if (!Number.isFinite(tich)) return { ok: false, lyDo: `Bước ${i + 1} ra số không hữu hạn.` }
    giaTriBuoc.push(tich)
    const tenBuoc = str(b?.ten).trim()
    if (tenBuoc) ten.set(tenBuoc, tich)
  }
  return { ok: true, giaTriBuoc, tienTo, nguyenVan }
}

// ---------------------------------------------------------------- chặn lộ

/** Chữ hiện TRƯỚC khi nộp (mọi thứ trừ `ketQua`). */
export function chuTruocNop(ban: BanSoDo): string[] {
  const ra: string[] = [str(ban.deNoiGi), str(ban.chiaKhoa), str(ban.cauTuHoi)]
  if (ban.soDo) {
    for (const n of ban.soDo.nut ?? []) ra.push(str(n?.tong), str(n?.chat), ...(Array.isArray(n?.soLieu) ? n.soLieu.map(str) : []))
    for (const m of ban.soDo.muiTen ?? []) if (m?.H != null) ra.push(`H = ${str(m.H)}%`)
  }
  for (const b of ban.buoc ?? []) for (const t of b?.thuaSo ?? []) ra.push(str(t?.nghia), str(t?.denDay))
  if (ban.hienTuong) {
    ra.push(...(ban.hienTuong.giaiThich ?? []).map(str))
    for (const k of ban.hienTuong.thiNghiem?.khung ?? []) ra.push(str(k?.tieuDe), str(k?.moTa))
  }
  return ra.filter((x) => x.trim())
}

/** Các con số viết trong chữ — bỏ chữ số dính vào công thức (FeS_2, Fe2O3, H₂SO₄, CuSO4.5H2O). */
const RE_SO_TRONG_CHU = /(?<![\p{L}\d_^.,])[-−]?\d+(?:[.,]\d+)*(?:\s*(?:[×x*·]|\.)\s*10\s*(?:\^\s*\(?[-−+]?\d+\)?|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+))?(?:\^\s*\(?[-−+]?\d+\)?|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)?/gu
export function soTrongChu(chu: string): SoDoc[] {
  const ra: SoDoc[] = []
  for (const m of chu.matchAll(RE_SO_TRONG_CHU)) {
    const d = docSo(m[0])
    if (d) ra.push(d)
  }
  return ra
}

/** Con số `x` trong chữ có phải đích `t` (đã làm tròn theo cách viết của `x`, lệch tương đối ≤ 1%). */
const trungDich = (x: SoDoc, t: number): boolean => t !== 0 && trongLamTron(x, t) && Math.abs(x.v - t) <= 0.01 * Math.abs(t)

/** Chữ cái phương án đúng được nói thẳng: «đáp án B», «chọn B», «phương án B», «(B)», «B.» ở đầu câu. */
function noiChuCai(chu: string, x: string): boolean {
  const L = x.toUpperCase()
  return new RegExp(`(?:đáp\\s*án|phương\\s*án|chọn|câu|ý)\\s*[:\\-–]?\\s*\\(?${L}\\)?(?![\\p{L}\\d])`, 'iu').test(chu)
    || new RegExp(`\\(${L}\\)`, 'u').test(chu)
    || new RegExp(`^\\s*${L}\\s*[.:)]`, 'u').test(chu)
}

function timLo(ban: BanSoDo, cau: CauKiemCong, tinh: KetTinh): string | null {
  const chu = chuTruocNop(ban)
  const dich: { t: number; ten: string }[] = []
  const so = chu.flatMap((c) => soTrongChu(c))
  if (cau.phan === 'III') {
    const d = docSo(cau.dapAn)
    if (d) dich.push({ t: d.v, ten: 'đáp số cuối' })
  }
  if (cau.phan === 'I') {
    const x = str(cau.dapAn).trim().toUpperCase()
    if (/^[ABCD]$/.test(x)) {
      if (chu.some((c) => noiChuCai(c, x))) return `Lộ chữ cái phương án đúng (${x}).`
      const pa = str(cau.luaChon?.[x])
      const d = docSo(pa)
      // Phương án CHỮ (tên chất, phát biểu) thường lặp lại chữ của đề ⇒ không so chữ (v1: câu ấy vốn «không kiểm được», không bao giờ hiện).
      if (d && DON_VI_SO.test(d.donVi)) dich.push({ t: d.v, ten: `giá trị phương án đúng (${x})` })
    }
  }
  if (tinh.ok) {
    const nguyenVan = tinh.nguyenVan
    const laNguyenVan = (t: number) => nguyenVan.some((v) => Math.abs(v - t) <= 1e-9 * Math.max(1, Math.abs(t)))
    tinh.giaTriBuoc.forEach((t, i) => dich.push({ t, ten: i === tinh.giaTriBuoc.length - 1 ? 'kết quả phép tính' : `kết quả bước ${i + 1}` }))
    for (const t of tinh.tienTo) if (!laNguyenVan(t)) dich.push({ t, ten: 'kết quả trung gian' })
  }
  for (const b of ban.buoc ?? []) { const d = docSo(b?.ketQua); if (d) dich.push({ t: d.v, ten: `kết quả ghi của bước «${str(b?.ten)}»` }) }
  { const d = docSo(ban.ketQua); if (d) dich.push({ t: d.v, ten: 'kết quả cuối ghi trong bản' }) }
  for (const d of dich) {
    const x = so.find((s) => trungDich(s, d.t))
    if (x) return `Phần hiện trước khi nộp có số ${x.v} trùng ${d.ten}.`
  }
  return null
}

// ---------------------------------------------------------------- cổng

/** Bản có đủ hình dạng tối thiểu để kiểm (đối tượng, `buoc` là mảng ≤ 3). */
function hinhDangLoi(ban: BanSoDo): string | null {
  if (!ban || typeof ban !== 'object') return 'Bản không phải đối tượng.'
  if (!Array.isArray(ban.buoc)) return 'Thiếu mảng bước tính.'
  if (ban.buoc.length > SO_BUOC_TOI_DA) return `Quá ${SO_BUOC_TOI_DA} bước tính.`
  return null
}

/** Lý do cổng khi câu tính thiếu sơ đồ / bước tính — máy soạn nhận ra để bắt soạn lại (27/10). */
export const LY_DO_THIEU_SO_DO = 'Câu tính thiếu sơ đồ hoặc bước tính.'

/**
 * CỔNG KIỂM của một bản sơ đồ với câu của kho (đáp án KHO, không tin máy soạn). Thứ tự: hình dạng → CHẶN LỘ → Phần II → thiếu sơ đồ/bước →
 * tính chuỗi → so đáp án. `giaTri` = giá trị nhân hết các thừa số (khi tính được).
 */
export function kiemCong(ban: BanSoDo, cau: CauKiemCong): KetQuaKiemCong {
  const hd = hinhDangLoi(ban)
  if (hd) return { ket: 'khong_kiem_duoc', lyDo: hd }
  const tinh = tinhChuoi(ban)
  const giaTri = tinh.ok ? tinh.giaTriBuoc[tinh.giaTriBuoc.length - 1] : undefined
  const kem = giaTri === undefined ? {} : { giaTri }
  const lo = timLo(ban, cau, tinh)
  if (lo) return { ket: 'lo_dap_an', lyDo: lo, ...kem }
  if (cau.phan === 'II') return { ket: 'khong_kiem_duoc', lyDo: 'Phần II chưa kiểm số (v1).', ...kem }
  if (!ban.soDo || !ban.buoc.length) return { ket: 'khong_kiem_duoc', lyDo: LY_DO_THIEU_SO_DO }
  if (!tinh.ok) return { ket: 'khong_kiem_duoc', lyDo: tinh.lyDo }
  const v = giaTri!
  // `ketQua` ghi trong bản (hiện SAU khi nộp) phải khớp phép tính theo cách viết của chính nó.
  for (const [i, b] of ban.buoc.entries()) {
    const d = docSo(b?.ketQua)
    if (str(b?.ketQua).trim() && (!d || !trongLamTron(d, tinh.giaTriBuoc[i]!))) return { ket: 'lech', lyDo: `Kết quả ghi của bước ${i + 1} («${str(b?.ketQua)}») lệch phép tính ${tinh.giaTriBuoc[i]}.`, giaTri: v }
  }
  if (str(ban.ketQua).trim()) {
    const d = docSo(ban.ketQua)
    if (!d || !trongLamTron(d, v)) return { ket: 'lech', lyDo: `Kết quả cuối ghi trong bản («${str(ban.ketQua)}») lệch phép tính ${v}.`, giaTri: v }
  }
  if (cau.phan === 'III') {
    const d = docSo(cau.dapAn)
    if (!d) return { ket: 'khong_kiem_duoc', lyDo: 'Đáp án kho không phải số.', giaTri: v }
    return khopDapAnSo(v, cau.dapAn, d) ? { ket: 'dat', giaTri: v } : { ket: 'lech', lyDo: `Phép tính ra ${v}, đáp án kho ${cau.dapAn}.`, giaTri: v }
  }
  // Phần I: so GIÁ TRỊ SỐ của phương án đúng; phương án không phải số ⇒ không kiểm được.
  const x = str(cau.dapAn).trim().toUpperCase()
  if (!/^[ABCD]$/.test(x)) return { ket: 'khong_kiem_duoc', lyDo: 'Đáp án Phần I không phải A–D.', giaTri: v }
  const doc = Object.fromEntries(Object.entries(cau.luaChon ?? {}).map(([k, s]) => [k.toUpperCase(), docSo(s)]))
  const dung = doc[x]
  if (!dung || !DON_VI_SO.test(dung.donVi)) return { ket: 'khong_kiem_duoc', lyDo: 'Phương án đúng không phải số.', giaTri: v }
  if (!khopDapAnSo(v, str(cau.luaChon?.[x]), dung)) return { ket: 'lech', lyDo: `Phép tính ra ${v}, phương án đúng ${x} = ${str(cau.luaChon?.[x])}.`, giaTri: v }
  // Hai phương án cùng khớp (làm tròn quá thô) ⇒ phép tính không phân biệt được ⇒ không coi là đạt.
  const khac = Object.entries(doc).find(([k, d]) => k !== x && d && DON_VI_SO.test(d.donVi) && khopDapAnSo(v, str(cau.luaChon?.[k]), d))
  if (khac) return { ket: 'khong_kiem_duoc', lyDo: `Phép tính khớp cả phương án ${khac[0]}.`, giaTri: v }
  return { ket: 'dat', giaTri: v }
}

/** Giá trị tính được `v` có khớp đáp án số `dapAn` theo cách làm tròn của kho: làm tròn về đúng số chữ số rồi chấm bằng `khopPhanIII`, hoặc lệch ≤ ½ đơn vị chữ số cuối. */
function khopDapAnSo(v: number, dapAn: string, d: SoDoc): boolean {
  if (trongLamTron(d, v)) return true
  const soChu = d.donViCuoi >= 1 ? 0 : Math.min(12, Math.round(-Math.log10(d.donViCuoi)))
  return Math.abs(v) < 1e15 && khopPhanIII(v.toFixed(soChu), dapAn)
}

/** Chữ hiện cho em (thầy 27/10 «Bỏ thực tế lý thuyết đi», ảnh): bỏ «thực tế» / «lý thuyết» / «theo lý thuyết»; «per» (tiếng Anh) ⇒ «/». Không đụng `so`, `ten`. */
export function lamSachChu(chu: string): string {
  return chu
    .replace(/\s*\b(?:theo\s+)?(?:l[ýí] thuyết|thực tế)(?![\p{L}\p{N}])/giu, '')
    .replace(/(?<=[\p{L}\p{N}])\s+per\s+(?=[\p{L}\p{N}])/gu, '/')
    .replace(/\(\s+/g, '(').replace(/\s+([,.;:)])/g, '$1').replace(/:\s*:/g, ':').replace(/\s{2,}/g, ' ').trim()
}
/** Làm sạch mọi chữ hiện cho em của một bản (đề nói gì, sơ đồ, nghĩa thừa số, tới đây, hiện tượng, chìa khoá). Không sửa bản gốc. */
export function lamSachChuHien(ban: BanSoDo): BanSoDo {
  const c = (v: unknown) => (typeof v === 'string' ? lamSachChu(v) : v)
  return {
    ...ban,
    deNoiGi: c(ban.deNoiGi) as string,
    ...(ban.chiaKhoa !== undefined ? { chiaKhoa: c(ban.chiaKhoa) as string } : {}),
    ...(ban.cauTuHoi !== undefined ? { cauTuHoi: c(ban.cauTuHoi) as string } : {}),
    ...(ban.soDo ? { soDo: { ...ban.soDo, nut: (ban.soDo.nut ?? []).map((n) => ({ ...n, ...(n.tong !== undefined ? { tong: c(n.tong) as string } : {}), soLieu: (n.soLieu ?? []).map((x) => c(x) as string) })) } } : {}),
    buoc: (ban.buoc ?? []).map((b) => ({ ...b, thuaSo: (b.thuaSo ?? []).map((t) => ({ ...t, nghia: c(t.nghia) as string, ...(t.denDay !== undefined ? { denDay: c(t.denDay) as string } : {}) })) })),
    ...(ban.hienTuong ? { hienTuong: { ...ban.hienTuong, giaiThich: (ban.hienTuong.giaiThich ?? []).map((x) => c(x) as string) } } : {}),
  }
}

/** Bản để hiện TRƯỚC khi em nộp: bỏ mọi `ketQua` (cả trong từng bước). Không sửa bản gốc. */
export function catTruocNop(ban: BanSoDo): BanSoDo {
  const { ketQua: _k, ...con } = ban
  return { ...con, buoc: (ban.buoc ?? []).map(({ ketQua: _b, ...b }) => ({ ...b, thuaSo: (b.thuaSo ?? []).map((t) => ({ ...t })) })) }
}
