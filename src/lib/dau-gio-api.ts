// LỚP NỐI KIỂM TRA ĐẦU GIỜ (thẻ thứ ba của mục Lên bảng, 29/09). Chỉ tệp này biết hình dạng lệnh máy chủ `POST /gv/dau-gio` (`server/src/dau-gio.ts`):
//   {action:'ung-vien', buoiId}              → { em: EmUngVien[], daGoi: sbd[], cauDaDung: qid[] }   (ĐỌC)
//   {action:'chot', buoiId, cap[{sbd,qid,chuyenDe}]} → { luot, nhan[], tuChoi[], ds: LuotHoi[] }
//   {action:'cham', buoiId, sbd, qid, dat}   → { ketQua, daCoTruoc? }   (idempotent)
//   {action:'da-chua', buoiId, sbd, qid}     → { luc, daCoTruoc? }      (idempotent)
//   {action:'ket-thuc', buoiId}              → { soBo, luot: LuotHoi[] }
//   {action:'xem', buoiId}                   → { dangMo, daKetThuc, luot: LuotHoi[] }
//   {action:'lich-su', cap[{sbd,qid}]}       → { ketQua: [{sbd, qid, chu, daChua[]}] }
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import type { EmUngVien, UngVienCau } from './dau-gio'

export type TrangThaiHoi = 'cho' | 'dat' | 'chua_dat' | 'bo'
export interface LuotHoi {
  sbd: string
  hoTen: string
  qid: string
  luot: number
  chuyenDe: string
  trangThai: TrangThaiHoi
  chamLuc: string | null
  daChuaLuc: string | null
}
export interface LichSuHoi {
  sbd: string
  qid: string
  chu: string
  daChua: string[]
}

const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const so = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const dt = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

const KHONG_CO_LENH = 'Máy chủ chưa có lệnh Kiểm tra đầu giờ — cần đẩy bản máy chủ mới.'
const goi = (body: Record<string, unknown>) => goiLenh('/gv/dau-gio', body, KHONG_CO_LENH)

export function docLuotHoi(v: unknown): LuotHoi | null {
  const o = dt(v)
  if (!chu(o.sbd) || !chu(o.qid)) return null
  const tt = chu(o.trangThai)
  return {
    sbd: chu(o.sbd),
    hoTen: chu(o.hoTen),
    qid: chu(o.qid),
    luot: so(o.luot),
    chuyenDe: chu(o.chuyenDe),
    trangThai: (['cho', 'dat', 'chua_dat', 'bo'].includes(tt) ? tt : 'cho') as TrangThaiHoi,
    chamLuc: chu(o.chamLuc) || null,
    daChuaLuc: chu(o.daChuaLuc) || null,
  }
}
const dsLuot = (v: unknown): LuotHoi[] => mang(v).map(docLuotHoi).filter((x): x is LuotHoi => !!x)

export function docUngVien(v: unknown): EmUngVien | null {
  const o = dt(v)
  if (!chu(o.sbd)) return null
  const cau: UngVienCau[] = mang(o.cau)
    .map(dt)
    .filter((c) => chu(c.qid))
    .map((c) => ({ qid: chu(c.qid), soLan: so(c.soLan), dungLanDau: c.dungLanDau === true, lanCuoi: chu(c.lanCuoi) }))
  return { sbd: chu(o.sbd), hoTen: chu(o.hoTen), cau }
}

export async function layUngVien(buoiId: string): Promise<KetQuaLenh<{ em: EmUngVien[]; daGoi: string[]; cauDaDung: string[] }>> {
  const r = await goi({ action: 'ung-vien', buoiId })
  if (!r.ok) return r
  return {
    ok: true,
    du: {
      em: mang(r.du.em).map(docUngVien).filter((x): x is EmUngVien => !!x),
      daGoi: mang(r.du.daGoi).map(chu).filter(Boolean),
      cauDaDung: mang(r.du.cauDaDung).map(chu).filter(Boolean),
    },
  }
}

export async function chotLuot(buoiId: string, cap: { sbd: string; qid: string; chuyenDe: string }[]): Promise<KetQuaLenh<{ luot: number; soNhan: number; soTuChoi: number; ds: LuotHoi[] }>> {
  const r = await goi({ action: 'chot', buoiId, cap })
  if (!r.ok) return r
  return { ok: true, du: { luot: so(r.du.luot), soNhan: mang(r.du.nhan).length, soTuChoi: mang(r.du.tuChoi).length, ds: dsLuot(r.du.ds) } }
}

export async function chamCau(buoiId: string, sbd: string, qid: string, dat: boolean): Promise<KetQuaLenh<{ ketQua: 'dat' | 'chua_dat'; daCoTruoc: boolean }>> {
  const r = await goi({ action: 'cham', buoiId, sbd, qid, dat })
  if (!r.ok) return r
  return { ok: true, du: { ketQua: r.du.ketQua === 'dat' ? 'dat' : 'chua_dat', daCoTruoc: r.du.daCoTruoc === true } }
}

export async function ghiDaChua(buoiId: string, sbd: string, qid: string): Promise<KetQuaLenh<{ luc: string }>> {
  const r = await goi({ action: 'da-chua', buoiId, sbd, qid })
  if (!r.ok) return r
  return { ok: true, du: { luc: chu(r.du.luc) } }
}

export async function ketThucDauGio(buoiId: string): Promise<KetQuaLenh<{ soBo: number; luot: LuotHoi[] }>> {
  const r = await goi({ action: 'ket-thuc', buoiId })
  if (!r.ok) return r
  return { ok: true, du: { soBo: so(r.du.soBo), luot: dsLuot(r.du.luot) } }
}

export async function xemDauGio(buoiId: string): Promise<KetQuaLenh<{ daKetThuc: boolean; luot: LuotHoi[] }>> {
  const r = await goi({ action: 'xem', buoiId })
  if (!r.ok) return r
  return { ok: true, du: { daKetThuc: r.du.daKetThuc === true, luot: dsLuot(r.du.luot) } }
}

export async function layLichSuHoi(cap: { sbd: string; qid: string }[]): Promise<KetQuaLenh<LichSuHoi[]>> {
  if (!cap.length) return { ok: true, du: [] }
  const r = await goi({ action: 'lich-su', cap })
  if (!r.ok) return r
  return {
    ok: true,
    du: mang(r.du.ketQua)
      .map(dt)
      .filter((x) => chu(x.sbd) && chu(x.qid))
      .map((x) => ({ sbd: chu(x.sbd), qid: chu(x.qid), chu: chu(x.chu), daChua: mang(x.daChua).map(chu).filter(Boolean) })),
  }
}
