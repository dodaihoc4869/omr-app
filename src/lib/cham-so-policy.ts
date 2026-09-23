// CHÍNH SÁCH CHẤM CÂU THEO VERSION — CNH-1.0 (P01)
// Nguồn quyết định: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md mục 1.2 (bảng policy),
//                   04-DU-LIEU-API-DONG-THOI.md mục 2 (kiểu dữ liệu + runtime validation).
//
// VÌ SAO CÓ TỆP NÀY: luật chấm Phần III trước đây nằm trong `src/lib/cham-so.ts` dưới dạng hai chế
// độ `'chat'`/`'so_hoc'` KHÔNG có version. CNH-1.0 yêu cầu policy CÓ VERSION, kiểm kiểu lúc chạy,
// và phải chặn ba lỗi đã đo được trên máy chủ:
//   1. `parseFloat('12abc') → 12`: hậu tố chữ bất kỳ bị coi là "đơn vị viết theo" ⇒ câu SAI thành ĐÚNG.
//   2. `1.0001` so với `1` bằng dấu phẩy động: biên 1e-4 phải là "nhỏ hơn", không phải "≤".
//   3. đơn vị khác nhau (`12 g` vs `12 kg`) bị bỏ qua ⇒ SAI thành ĐÚNG.
//
// Tệp này là nguồn sự thật DUY NHẤT cho `chuanHoaSoNhap` + phép so Phần III. `src/lib/cham-so.ts`
// chỉ còn là lớp mỏng gọi lại (giữ nguyên tên hàm cũ cho mọi nơi gọi).
// KHÔNG dùng eval/Function. Mọi phép so chạy trên số hữu tỉ BigInt nên biên thập phân chính xác.

/** Version của bộ chính sách. Đổi luật ⇒ tăng version, sửa đồng bộ THAM-SO.json + MAU-KET-QUA.json. */
export const POLICY_VERSION = 'CNH-1.0' as const

/** Mã lỗi chuẩn hoá: chuỗi KHÔNG đọc được thành số theo grammar. Không phải "sai kiến thức". */
export type GradingError = 'unsupported-format'

export type GradingPolicyId = 'numeric-value-v1' | 'numeric-rounded-v1' | 'numeric-unit-v1' | 'literal-v1'

export interface GradingResult {
  correct: boolean
  /** Chỉ có mặt khi đầu vào không đọc được (422 ở tầng API), KHÁC với "sai giá trị". */
  error?: GradingError
}

/** Tham số chấm đã chốt cho v1 — đồng bộ THAM-SO.json (`technical.numericalAbsoluteToleranceExclusive`). */
export const THAM_SO_CHAM_CNH_1_0 = Object.freeze({
  policyVersion: POLICY_VERSION,
  /** Sai số tuyệt đối phải NHỎ HƠN giá trị này mới là bằng nhau (1e-4, không phải ≤). */
  saiSoTuyetDoiLoaiTru: 1e-4,
  /** Số chữ số thập phân tối đa cho phép ở `numeric-rounded-v1`. */
  soChuSoThapPhanToiDa: 12,
  policies: Object.freeze(['numeric-value-v1', 'numeric-rounded-v1', 'numeric-unit-v1', 'literal-v1'] as const),
})

export class ChamInputError extends Error {}

// ---------------------------------------------------------------------------
// 1. Chuẩn hoá hình thức (giữ NGUYÊN hành vi đã chốt 21/09 + 23/09, có test khoá)
// ---------------------------------------------------------------------------

const KHOANG_TRANG = new RegExp('[\\s\\u00a0\\u1680\\u180e\\u2000-\\u200f\\u2028\\u2029\\u202f\\u205f\\u2060\\u3000\\ufeff]+', 'g')
const DAU_TRU = new RegExp('[\\u2010-\\u2015\\u2212\\ufe63\\uff0d\\u207b]', 'g')
const SO_THUAN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/
const PHAN_SO = /^([+-]?(?:\d+\.?\d*|\.\d+))\/([+-]?(?:\d+\.?\d*|\.\d+))$/
const SO_ROI_DUOI = /^([+-]?(?:\d+\.?\d*|\.\d+))(.*)$/
const KHOA_HOC_X10 = /^([+-]?(?:\d+\.?\d*|\.\d+))[x×*·]10\^?\(?([+-]?\d+)\)?$/
const KHOA_HOC_E = /^([+-]?(?:\d+\.?\d*|\.\d+))e([+-]?\d+)$/

/** Chuỗi đã dọn nhiễu hình thức (chữ thường, dấu thập phân là "."); rỗng nếu không còn gì. Không đổi giá trị số. */
export function chuanHoaSoNhap(raw: unknown): string {
  let s = String(raw ?? '').normalize('NFKC')
    .replace(KHOANG_TRANG, '').replace(DAU_TRU, '-').replace(/[٫‚،]/g, ',').toLowerCase()
  s = s.replace(/^[+≈~=]+/, '').replace(/[.,;:!?]+$/, '').replace(/,/g, '.')
  const x10 = KHOA_HOC_X10.exec(s) ?? KHOA_HOC_E.exec(s)
  if (x10) { const n = Number(`${x10[1]}e${x10[2]}`); if (Number.isFinite(n)) return String(n) }
  return s
}

// ---------------------------------------------------------------------------
// 2. Đơn vị: danh mục ĐÓNG. Hậu tố không nằm trong danh mục ⇒ unsupported-format.
//    (Đây chính là chỗ vá lỗi `12abc` = `12`.)
// ---------------------------------------------------------------------------

const DON_VI_DA_BIET = new Set([
  // độ dài / diện tích / thể tích
  'm', 'dm', 'cm', 'mm', 'km', 'hm', 'dam', 'nm', 'um', 'µm', 'μm', 'met', 'mét',
  'm2', 'm²', 'm3', 'm³', 'cm2', 'cm²', 'cm3', 'cm³', 'dm3', 'dm³', 'mm3', 'mm³',
  'km2', 'km²', 'km3', 'km³', 'ha', 'cc', 'l', 'ml', 'cl', 'dl', 'lit', 'lít',
  // khối lượng
  'g', 'kg', 'mg', 'hg', 'dag', 't', 'tan', 'tấn', 'gam', 'kilogam',
  // thời gian
  's', 'giay', 'giây', 'phut', 'phút', 'h', 'gio', 'giờ', 'ms', 'min',
  // lượng chất / nồng độ
  'mol', 'mmol', 'kmol', 'umol', 'µmol', 'mol/l', 'mol/lit', 'mol/lít', 'n',
  'kmol/m3', 'kmol/m³', 'mol/kg', 'm/mol',
  // khối lượng riêng / khối lượng mol
  'g/mol', 'kg/mol', 'g/ml', 'g/cm3', 'g/cm³', 'kg/m3', 'kg/m³', 'kg/l', 'mg/ml', 'g/l',
  // năng lượng / công suất / nhiệt
  'j', 'kj', 'cal', 'kcal', 'w', 'kw', 'mw', 'wh', 'kwh', 'j/kg', 'j/mol', 'kj/mol', 'j/g', 'j/(mol.k)',
  // điện / từ / sóng
  'v', 'mv', 'kv', 'a', 'ma', 'ohm', 'ω', 'f', 'µf', 'uf', 'nf', 'pf', 'mh', 'wb', 'hz', 'khz', 'mhz', 'ghz',
  // áp suất / lực
  'pa', 'kpa', 'mpa', 'atm', 'mmhg', 'bar', 'mbar', 'psi', 'n/m2', 'n/m²', 'n.m',
  // phần trăm / nhiệt độ / góc
  '%', '‰', '°c', '°k', '°f', 'do', 'độ', 'rad', 'sr',
  // vận tốc / tốc độ biến thiên
  'm/s', 'km/h', 'm/s2', 'm/s²', 'cm/s', 'km/s', 'g/s', 'mol/s', 'm3/s', 'l/s', 'l/min',
  // khác dùng trong đề
  'cd', 'lm', 'lux', 'lx', 'db', 'eq', 'dv', 'đvc', 'u', 'amu',
])

/** Bỏ ngoặc bao đơn vị rồi chuẩn hoá: `"(M)"` → `"m"`. */
export function chuanHoaDonVi(u: string): string {
  const s = u.normalize('NFKC').toLowerCase().replace(KHOANG_TRANG, '')
  const trongNgoac = /^\((.*)\)$/.exec(s) ?? /^\[(.*)\]$/.exec(s)
  return trongNgoac ? trongNgoac[1] : s
}

// ---------------------------------------------------------------------------
// 3. Số hữu tỉ chính xác (BigInt) — biên 1e-4 không phụ thuộc dấu phẩy động.
// ---------------------------------------------------------------------------

interface SoHuuTy { tu: bigint; mau: bigint }

function rutGon(x: SoHuuTy): SoHuuTy {
  let tu = x.tu
  let mau = x.mau
  if (mau < 0n) { tu = -tu; mau = -mau }
  let a = tu < 0n ? -tu : tu
  let b = mau
  while (b) { const t = a % b; a = b; b = t }
  const g = a === 0n ? 1n : a
  return { tu: tu / g, mau: mau / g }
}

/** Đọc TOÀN BỘ chuỗi thành số hữu tỉ; `null` nếu còn ký tự lạ (không bao giờ `parseFloat('12abc')`). */
function phanSoTuChuoiSo(s: string): SoHuuTy | null {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m) return null
  const dau = m[1] ?? ''
  const nguyen = m[2] ?? ''
  const le = m[3] ?? ''
  if (!nguyen && !le) return null
  const chuSo = (nguyen || '0') + le
  if (!/^\d+$/.test(chuSo)) return null
  const so = BigInt(chuSo)
  return rutGon({ tu: dau === '-' ? -so : so, mau: 10n ** BigInt(le.length) })
}

function bangNhau(a: SoHuuTy, b: SoHuuTy): boolean {
  return a.tu * b.mau === b.tu * a.mau
}

/** |a − b| < 1/10000 — đúng quy ước "nhỏ hơn", không phải "≤". */
function lechNhoHon(a: SoHuuTy, b: SoHuuTy): boolean {
  const hieu = a.tu * b.mau - b.tu * a.mau
  const tuyetDoi = hieu < 0n ? -hieu : hieu
  return tuyetDoi * 10000n < a.mau * b.mau
}

/** Làm tròn nửa-ra-xa-0 theo ĐÚNG `decimals` chữ số thập phân, trên số hữu tỉ. */
function lamTron(gia: SoHuuTy, decimals: number): SoHuuTy {
  const mu = 10n ** BigInt(decimals)
  const am = gia.tu < 0n
  const duong = am ? -gia.tu : gia.tu
  const moRong = duong * mu
  const thuong = moRong / gia.mau
  const du = moRong % gia.mau
  const lam = du * 2n >= gia.mau ? thuong + 1n : thuong
  return rutGon({ tu: am ? -lam : lam, mau: mu })
}

interface TachSo { numText: string; unit: string | null; gia: SoHuuTy }
type PhanTich = { ok: true; so: TachSo } | { ok: false; loi: GradingError }

/** Tách `s` (đã chuẩn hoá) thành số + đơn vị. Đuôi không nằm trong danh mục đơn vị ⇒ unsupported-format. */
export function tachSoVaDonVi(s: string, allowFraction: boolean): PhanTich {
  if (!s) return { ok: false, loi: 'unsupported-format' }
  if (allowFraction) {
    const m = PHAN_SO.exec(s)
    if (m) {
      const tu = phanSoTuChuoiSo(m[1])
      const mau = phanSoTuChuoiSo(m[2])
      if (!tu || !mau || mau.tu === 0n) return { ok: false, loi: 'unsupported-format' }
      return { ok: true, so: { numText: s, unit: null, gia: rutGon({ tu: tu.tu * mau.mau, mau: tu.mau * mau.tu }) } }
    }
  }
  if (SO_THUAN.test(s)) {
    const gia = phanSoTuChuoiSo(s)
    return gia ? { ok: true, so: { numText: s, unit: null, gia } } : { ok: false, loi: 'unsupported-format' }
  }
  const m = SO_ROI_DUOI.exec(s)
  if (!m) return { ok: false, loi: 'unsupported-format' }
  const gia = phanSoTuChuoiSo(m[1])
  if (!gia) return { ok: false, loi: 'unsupported-format' }
  const don = chuanHoaDonVi(m[2])
  if (!don || !DON_VI_DA_BIET.has(don)) return { ok: false, loi: 'unsupported-format' }
  return { ok: true, so: { numText: m[1], unit: don, gia } }
}

/** Hai đơn vị "nói cùng một thứ"? Chỉ so TÊN đơn vị, KHÔNG tự quy đổi (đặc tả v1 không cho bảng quy đổi). */
function donViTuongThich(a: TachSo, b: TachSo): boolean {
  return !(a.unit && b.unit && a.unit !== b.unit)
}


// ---------------------------------------------------------------------------
// 4. Kiểm tra kiểu LÚC CHẠY cho hợp đồng chấm
// ---------------------------------------------------------------------------

export interface ChamInput {
  policy: GradingPolicyId
  key: string
  answer: string
  decimals?: number
  requiredUnit?: string
  /** ASSUMPTION v1: chưa định nghĩa bảng quy đổi có hệ số; phần tử được hiểu là TÊN đơn vị tương đương (hệ số 1). */
  allowedConversions?: string[]
  allowFraction?: boolean
  accepted?: string[]
  policyVersion?: string
}

function laChuoiKhongRong(v: unknown, ten: string): string {
  if (typeof v !== 'string' || v.length === 0) throw new ChamInputError(`${ten} phải là chuỗi không rỗng`)
  return v
}

export function parseChamInput(raw: unknown): ChamInput {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new ChamInputError('chamTheoPolicy cần một đối tượng')
  const o = raw as Record<string, unknown>
  const policy = o.policy
  if (typeof policy !== 'string' || !(THAM_SO_CHAM_CNH_1_0.policies as readonly string[]).includes(policy)) {
    throw new ChamInputError(`policy không nằm trong CNH-1.0: ${String(policy)}`)
  }
  const key = laChuoiKhongRong(o.key, 'key')
  const answer = laChuoiKhongRong(o.answer, 'answer')
  if (o.policyVersion !== undefined && o.policyVersion !== POLICY_VERSION) {
    throw new ChamInputError(`policyVersion không khớp CNH-1.0: ${String(o.policyVersion)}`)
  }
  const out: ChamInput = { policy: policy as GradingPolicyId, key, answer }
  if (o.decimals !== undefined) {
    const d = o.decimals
    if (typeof d !== 'number' || !Number.isInteger(d) || d < 0 || d > THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa) {
      throw new ChamInputError(`decimals phải là số nguyên 0..${THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa}`)
    }
    out.decimals = d
  }
  if (o.requiredUnit !== undefined) out.requiredUnit = laChuoiKhongRong(o.requiredUnit, 'requiredUnit')
  if (o.allowFraction !== undefined) {
    if (typeof o.allowFraction !== 'boolean') throw new ChamInputError('allowFraction phải là boolean')
    out.allowFraction = o.allowFraction
  }
  for (const ten of ['allowedConversions', 'accepted'] as const) {
    const v = o[ten]
    if (v === undefined) continue
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.length)) throw new ChamInputError(`${ten} phải là mảng chuỗi không rỗng`)
    out[ten] = v as string[]
  }
  if (policy === 'numeric-unit-v1' && !out.requiredUnit) throw new ChamInputError('numeric-unit-v1 cần requiredUnit')
  if (policy === 'numeric-rounded-v1' && out.decimals === undefined) throw new ChamInputError('numeric-rounded-v1 cần decimals')
  return out
}


// ---------------------------------------------------------------------------
// 5. Bốn chính sách v1
// ---------------------------------------------------------------------------

function chamSoHoc(key: string, answer: string, allowFraction: boolean, baoLoi: boolean): GradingResult {
  const a = chuanHoaSoNhap(answer)
  const k = chuanHoaSoNhap(key)
  if (!a || !k) return { correct: false } // bỏ trống ⇒ sai, KHÔNG phải lỗi định dạng
  if (a === k) return { correct: true }
  const pa = tachSoVaDonVi(a, allowFraction)
  const pk = tachSoVaDonVi(k, allowFraction)
  if (!pa.ok || !pk.ok) return baoLoi ? { correct: false, error: 'unsupported-format' } : { correct: false }
  if (!donViTuongThich(pa.so, pk.so)) return { correct: false }
  if (bangNhau(pa.so.gia, pk.so.gia) || lechNhoHon(pa.so.gia, pk.so.gia)) return { correct: true }
  return { correct: false }
}

function chamLamTron(key: string, answer: string, decimals: number): GradingResult {
  const a = chuanHoaSoNhap(answer)
  const k = chuanHoaSoNhap(key)
  if (!a || !k) return { correct: false }
  const pa = tachSoVaDonVi(a, false)
  const pk = tachSoVaDonVi(k, false)
  if (!pa.ok || !pk.ok) return { correct: false, error: 'unsupported-format' }
  if (!donViTuongThich(pa.so, pk.so)) return { correct: false }
  return { correct: bangNhau(lamTron(pa.so.gia, decimals), lamTron(pk.so.gia, decimals)) }
}

function chamDonVi(key: string, answer: string, requiredUnit: string, allowedConversions: string[]): GradingResult {
  const a = chuanHoaSoNhap(answer)
  const k = chuanHoaSoNhap(key)
  if (!a || !k) return { correct: false }
  const pa = tachSoVaDonVi(a, false)
  const pk = tachSoVaDonVi(k, false)
  if (!pa.ok || !pk.ok) return { correct: false, error: 'unsupported-format' }
  const dich = chuanHoaDonVi(requiredUnit)
  const dungDonVi = pa.so.unit === dich
    || (pa.so.unit !== null && allowedConversions.map(chuanHoaDonVi).includes(pa.so.unit))
  if (!dungDonVi) return { correct: false }
  if (pk.so.unit !== null && pk.so.unit !== dich) return { correct: false }
  return { correct: bangNhau(pa.so.gia, pk.so.gia) || lechNhoHon(pa.so.gia, pk.so.gia) }
}

function chamLiteral(key: string, answer: string, accepted: string[] | undefined): GradingResult {
  const a = chuanHoaSoNhap(answer)
  if (!a) return { correct: false }
  if (a === chuanHoaSoNhap(key)) return { correct: true }
  for (const moi of accepted ?? []) {
    if (a === chuanHoaSoNhap(moi)) return { correct: true }
  }
  return { correct: false }
}

/**
 * Quyết định ĐÚNG/SAI cho một câu theo policy có version.
 * Đầu vào sai KIỂU ⇒ ném `ChamInputError` (422, chưa tiêu attempt).
 * Đầu vào hợp lệ nhưng chuỗi không đọc được ⇒ `{ correct: false, error: 'unsupported-format' }`.
 */
export function chamTheoPolicy(raw: unknown): GradingResult {
  const input = parseChamInput(raw)
  switch (input.policy) {
    case 'numeric-value-v1':
      return chamSoHoc(input.key, input.answer, input.allowFraction === true, true)
    case 'numeric-rounded-v1':
      return chamLamTron(input.key, input.answer, input.decimals as number)
    case 'numeric-unit-v1':
      return chamDonVi(input.key, input.answer, input.requiredUnit as string, input.allowedConversions ?? [])
    case 'literal-v1':
      return chamLiteral(input.key, input.answer, input.accepted)
  }
}

/** Policy của mọi câu Phần III chưa gắn metadata riêng (quyết định v1: `numeric-value-v1`). */
export const POLICY_MAC_DINH_PHAN_III: GradingPolicyId = 'numeric-value-v1'

