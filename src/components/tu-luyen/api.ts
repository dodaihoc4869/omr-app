// TU LUYỆN — lớp gọi máy chủ của màn học sinh (hợp đồng docs/hop-dong-tu-luyen-2909.md). Mọi lệnh `POST /hs/tu-luyen/<lệnh>` kèm token.
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, không bịa số. Không bao giờ nhận đáp án trước khi nộp (máy chủ không gửi).
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import type {
  CauCongKhai,
  CheDoTuLuyen,
  DongCauTuLuyen,
  DongLuotTuLuyen,
  KetQuaCau,
  LopDangBaiTL,
} from '../../lib/tu-luyen'

type Obj = Record<string, unknown>
export type KetQua<T> = { ok: true; du: T } | { ok: false; loi: string }

async function goi(lenh: string, token: string, du: Obj = {}, giay = 60): Promise<Obj | null> {
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), giay * 1000)
  try {
    const goc = await layDiaChiMayChu()
    if (!goc) return null
    const r = await fetch(`${goc}/hs/tu-luyen/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...du, token }),
      signal: dk.signal,
    })
    return (await r.json()) as Obj
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
const LOI_MANG = 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.'
const loiCua = (j: Obj | null): string => (j ? String(j.error ?? 'Máy chủ chưa trả lời được. Em thử lại.') : LOI_MANG)
const so = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
const chu = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))

export interface CaCoCauSai { maCa: string; tenCa: string; soCauSai: number }
export interface NguonTuLuyen {
  cacCa: CaCoCauSai[]
  soCauSai: number
  loiCauSai: string
  danhMuc: LopDangBaiTL[]
  loiDanhMuc: string
  dangThi: boolean
}
export async function taiNguon(token: string): Promise<KetQua<NguonTuLuyen>> {
  const j = await goi('nguon', token)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const cacCa = (Array.isArray(j.cacCa) ? j.cacCa : []).map((x: Obj) => ({ maCa: chu(x.maCa), tenCa: chu(x.tenCa), soCauSai: so(x.soCauSai) })).filter((x) => x.maCa)
  const danhMuc = (Array.isArray(j.danhMuc) ? j.danhMuc : []).map((l: Obj) => ({
    lop: chu(l.lop),
    bais: (Array.isArray(l.bais) ? l.bais : []).map((b: Obj) => ({
      tenBai: chu(b.tenBai),
      dangs: (Array.isArray(b.dangs) ? b.dangs : []).map((d: Obj) => ({ ma: chu(d.ma), ten: chu(d.ten), soCau: so(d.soCau) })),
    })),
  }))
  return { ok: true, du: { cacCa, soCauSai: so(j.soCauSai), loiCauSai: chu(j.loiCauSai), danhMuc, loiDanhMuc: chu(j.loiDanhMuc), dangThi: j.dangThi === true } }
}

export interface ThamSoRut { cheDo: CheDoTuLuyen; soCau?: number; dsMaCa?: string[]; dsDang?: string[]; mucDo?: string[] }
export interface XemTruoc { tongToiDa: number; loi: string; thongKe: { tenDang: string; soCauSai: number; soUngVien: number }[] }
export async function xemTruoc(token: string, t: ThamSoRut): Promise<KetQua<XemTruoc>> {
  const j = await goi('xem-truoc', token, { ...t })
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const thongKe = (Array.isArray(j.thongKe) ? j.thongKe : []).map((x: Obj) => ({ tenDang: chu(x.tenDang), soCauSai: so(x.soCauSai), soUngVien: so(x.soUngVien) }))
  return { ok: true, du: { tongToiDa: so(j.tongToiDa), loi: chu(j.loi), thongKe } }
}

export interface LuotDangLam { luotId: string; cheDo: CheDoTuLuyen; tieuDe: string; taoLuc: number; cau: CauCongKhai[] }
export async function rutCau(token: string, t: ThamSoRut): Promise<KetQua<LuotDangLam>> {
  const j = await goi('rut', token, { ...t }, 90)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const cau = (Array.isArray(j.cau) ? j.cau : []) as CauCongKhai[]
  if (!cau.length) return { ok: false, loi: 'Không rút được câu nào. Em đổi lựa chọn rồi thử lại.' }
  return { ok: true, du: { luotId: chu(j.luotId), cheDo: so(j.cheDo) as CheDoTuLuyen, tieuDe: chu(j.tieuDe), taoLuc: so(j.taoLuc), cau } }
}

export interface KetQuaNop { luotId: string; tieuDe: string; cheDo: CheDoTuLuyen; soCau: number; soDung: number; diem: number; giay: number; nopLuc: number; cau: KetQuaCau[] }
export async function nopBai(
  token: string,
  luotId: string,
  traLoi: Record<string, string>,
  giay: number,
  giayCau: Record<string, number>,
  coGoiY: string[],
): Promise<KetQua<KetQuaNop>> {
  const j = await goi('nop', token, { luotId, traLoi, giay, giayCau, coGoiY })
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  return {
    ok: true,
    du: {
      luotId: chu(j.luotId), tieuDe: chu(j.tieuDe), cheDo: so(j.cheDo) as CheDoTuLuyen, soCau: so(j.soCau), soDung: so(j.soDung),
      diem: so(j.diem), giay: so(j.giay), nopLuc: so(j.nopLuc), cau: (Array.isArray(j.cau) ? j.cau : []) as KetQuaCau[],
    },
  }
}

export async function taiTongHop(token: string): Promise<KetQua<{ luot: DongLuotTuLuyen[]; cau: DongCauTuLuyen[] }>> {
  const j = await goi('tong-hop', token)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  return { ok: true, du: { luot: (Array.isArray(j.luot) ? j.luot : []) as DongLuotTuLuyen[], cau: (Array.isArray(j.cau) ? j.cau : []) as DongCauTuLuyen[] } }
}
