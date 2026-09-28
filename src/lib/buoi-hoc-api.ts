// LỚP NỐI BUỔI HỌC / ĐIỂM DANH (bảng DẠY HỌC của mục Lên bảng, 28/09). Chỉ tệp này biết hình dạng lệnh máy chủ (`server/src/buoi-hoc.ts`):
//   THẦY (mã bí mật, qua `goiLenh`):
//     POST /gv/buoi-hoc {action:'mo', lop?, ten?, kemLop?}   → TrangThaiBuoi (mở buổi mới)
//     POST /gv/buoi-hoc {action:'dang-mo'}                   → { buoi: BuoiHoc[] } (buổi còn mở, nối tiếp khi mở lại app)
//     POST /gv/buoi-hoc {action:'xem'|'dong', id, kemLop?}   → TrangThaiBuoi
//     POST /gv/buoi-hoc {action:'them-em', id, sbd[]} / {action:'bot-em', id, sbd} → TrangThaiBuoi
//     POST /gv/buoi-hoc/suc-hoc {sbd[], cau[]}               → { em: {sbd: SucHocEm} }  (ĐỌC-CHỈ)
//   HỌC SINH (token của em):
//     POST /hs/buoi-hoc {token}        → { buoi: {id, ten, lop, daDiemDanh} | null }  (KHÔNG có mã)
//     POST /hs/diem-danh {token, ma}   → { buoi } | { ok:false, lyDo, error }
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import type { SucHocEm } from './chon-em-day-hoc'

export interface BuoiHoc {
  id: string
  ten: string
  lop: string
  moLuc: string
  hetHan: string
  dongLuc: string | null
  dangMo: boolean
  soCoMat?: number
}
export interface EmDiemDanh {
  sbd: string
  hoTen: string
  luc: string
  cach: 'ma' | 'thay'
}
export interface EmLop {
  sbd: string
  hoTen: string
  tenLop: string
}
export interface TrangThaiBuoi {
  buoi: BuoiHoc
  /** Mã đang chiếu (vắng khi buổi đã kết thúc). */
  ma: string | null
  /** Mốc (ms) mã đổi sang mã mới. */
  doiMaLuc: number | null
  coMat: EmDiemDanh[]
  siSo: number | null
  lopEm: EmLop[] | null
}

const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const doiTuong = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

export function docBuoi(v: unknown): BuoiHoc | null {
  const o = doiTuong(v)
  if (!chu(o.id)) return null
  return {
    id: chu(o.id),
    ten: chu(o.ten),
    lop: chu(o.lop),
    moLuc: chu(o.moLuc),
    hetHan: chu(o.hetHan),
    dongLuc: chu(o.dongLuc) || null,
    dangMo: o.dangMo === true,
    ...(so(o.soCoMat) !== null ? { soCoMat: so(o.soCoMat)! } : {}),
  }
}

/** Đọc trạng thái buổi CÓ CHỐNG SAI KIỂU (dòng thiếu SBD bị bỏ). */
export function docTrangThai(j: Record<string, unknown>): TrangThaiBuoi | null {
  const buoi = docBuoi(j.buoi)
  if (!buoi) return null
  const coMat = (Array.isArray(j.coMat) ? j.coMat : [])
    .map(doiTuong)
    .filter((x) => chu(x.sbd))
    .map((x) => ({ sbd: chu(x.sbd), hoTen: chu(x.hoTen), luc: chu(x.luc), cach: x.cach === 'thay' ? ('thay' as const) : ('ma' as const) }))
  const lopEm = Array.isArray(j.lopEm) ? j.lopEm.map(doiTuong).filter((x) => chu(x.sbd)).map((x) => ({ sbd: chu(x.sbd), hoTen: chu(x.hoTen), tenLop: chu(x.tenLop) })) : null
  return { buoi, ma: /^\d{6}$/.test(chu(j.ma)) ? chu(j.ma) : null, doiMaLuc: so(j.doiMaLuc), coMat, siSo: so(j.siSo), lopEm }
}

const KHONG_CO_LENH = 'Máy chủ chưa có lệnh Điểm danh buổi học — cần đẩy bản máy chủ mới.'

async function lenhBuoi(body: Record<string, unknown>): Promise<KetQuaLenh<TrangThaiBuoi>> {
  const r = await goiLenh('/gv/buoi-hoc', body, KHONG_CO_LENH)
  if (!r.ok) return r
  const t = docTrangThai(r.du)
  return t ? { ok: true, du: t } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả buổi học không đúng dạng.' }
}

export const moBuoiHoc = (lop: string, ten = '') => lenhBuoi({ action: 'mo', lop, ten, kemLop: true })
export const xemBuoiHoc = (id: string, kemLop = false) => lenhBuoi({ action: 'xem', id, kemLop })
export const themEmBuoi = (id: string, sbd: string[]) => lenhBuoi({ action: 'them-em', id, sbd })
export const botEmBuoi = (id: string, sbd: string) => lenhBuoi({ action: 'bot-em', id, sbd })
export const dongBuoiHoc = (id: string) => lenhBuoi({ action: 'dong', id })

export async function buoiDangMo(): Promise<KetQuaLenh<BuoiHoc[]>> {
  const r = await goiLenh('/gv/buoi-hoc', { action: 'dang-mo' }, KHONG_CO_LENH)
  if (!r.ok) return r
  return { ok: true, du: (Array.isArray(r.du.buoi) ? r.du.buoi : []).map(docBuoi).filter((x): x is BuoiHoc => !!x) }
}

const dem = (v: unknown) => {
  const o = doiTuong(v)
  return { n: Math.max(0, so(o.n) ?? 0), d: Math.max(0, so(o.d) ?? 0) }
}
const bangDem = (v: unknown) => Object.fromEntries(Object.entries(doiTuong(v)).map(([k, x]) => [k, dem(x)]))
export function docSucHoc(v: unknown): SucHocEm {
  const o = doiTuong(v)
  const lb = doiTuong(o.lenBang)
  return {
    tong: dem(o.tong),
    qid: bangDem(o.qid),
    dang: bangDem(o.dang),
    chuyenDe: bangDem(o.chuyenDe),
    bac: Object.fromEntries(Object.entries(doiTuong(o.bac)).filter(([, x]) => so(x) !== null) as [string, number][]),
    lenBang: { n: so(lb.n) ?? 0, dat: so(lb.dat) ?? 0, homNay: so(lb.homNay) ?? 0 },
  }
}

export async function laySucHoc(sbd: string[], cau: { qid: string; maDang: string | null; chuyenDe: string }[]): Promise<KetQuaLenh<Record<string, SucHocEm>>> {
  const r = await goiLenh('/gv/buoi-hoc/suc-hoc', { sbd, cau }, KHONG_CO_LENH)
  if (!r.ok) return r
  return { ok: true, du: Object.fromEntries(Object.entries(doiTuong(r.du.em)).map(([k, v]) => [k, docSucHoc(v)])) }
}

/** Link QR điểm danh: mở app học sinh với mã điền sẵn (em quét bằng máy ảnh điện thoại). */
export function linkDiemDanh(goc: string, ma: string): string {
  return `${goc.replace(/\/+$/, '')}/hs?diem-danh=${encodeURIComponent(ma)}`
}
/** Mã điểm danh đọc từ đường dẫn app học sinh (`?diem-danh=123456`); không có ⇒ ''. */
export function maTuDuongDan(search: string): string {
  try {
    const m = new URLSearchParams(search).get('diem-danh') ?? ''
    return /^\d{6}$/.test(m.trim()) ? m.trim() : ''
  } catch {
    return ''
  }
}

// ───────── HỌC SINH ─────────
export interface BuoiCuaEm {
  id: string
  ten: string
  lop: string
  daDiemDanh: boolean
}
async function goiHs(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const c = new AbortController()
  const hen = setTimeout(() => c.abort(), 15_000)
  try {
    const goc = await layDiaChiMayChu('')
    const r = await fetch(`${goc}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: c.signal })
    if (r.status === 404) return { ok: false, error: 'Máy chủ chưa có chức năng điểm danh.' }
    return doiTuong(await r.json().catch(() => null))
  } catch {
    return { ok: false, error: 'Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.' }
  } finally {
    clearTimeout(hen)
  }
}
const docBuoiEm = (v: unknown): BuoiCuaEm | null => {
  const o = doiTuong(v)
  return chu(o.id) ? { id: chu(o.id), ten: chu(o.ten), lop: chu(o.lop), daDiemDanh: o.daDiemDanh === true } : null
}
export async function buoiCuaEm(token: string): Promise<BuoiCuaEm | null> {
  const j = await goiHs('/hs/buoi-hoc', { token })
  return j.ok === true ? docBuoiEm(j.buoi) : null
}
export async function emDiemDanh(token: string, ma: string): Promise<{ ok: true; buoi: BuoiCuaEm } | { ok: false; chu: string }> {
  const j = await goiHs('/hs/diem-danh', { token, ma: ma.replace(/\D/g, '') })
  const b = docBuoiEm(j.buoi)
  if (j.ok === true && b) return { ok: true, buoi: b }
  return { ok: false, chu: chu(j.error) || 'Chưa điểm danh được. Em thử lại.' }
}


// ───────── LỌC EM ĐỂ THẦY THÊM TAY (khối "Thêm em chưa điểm danh được", 28/09) ─────────
/** Bỏ dấu + chữ thường ("Đỗ Thị Ánh" → "do thi anh") để tìm không phân biệt dấu/hoa. */
export function boDau(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
/** Em theo lớp đang chọn (rỗng = mọi lớp) + chữ tìm (SBD hoặc tên, không dấu, không phân biệt hoa; mọi từ phải khớp). Giữ thứ tự tên. */
export function locEmThem(ds: readonly EmLop[], lop: string, tim: string): EmLop[] {
  const tu = boDau(tim).split(' ').filter(Boolean)
  return ds.filter((e) => {
    if (lop && e.tenLop !== lop) return false
    if (!tu.length) return true
    const chu = `${boDau(e.hoTen)} ${boDau(e.sbd)}`
    return tu.every((t) => chu.includes(t))
  })
}
