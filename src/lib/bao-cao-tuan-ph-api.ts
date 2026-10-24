// BÁO CÁO TUẦN CỦA CON (app phụ huynh, thầy 24/10). Tệp riêng để chỉ mảnh nạp lười (TrangVeConDuoi) kéo về — không nặng thêm lúc mở app.
import type { KetQuaLenh } from './goi-lenh-thay'
import { goiLenhCon } from './ho-so-con-ph-api'

type Thoat = Extract<KetQuaLenh<never>, { ok: false }>
const thoat = (loai: Thoat['loai'], chu: string): Thoat => ({ ok: false, loai, chu })
// `POST /ph/bao-cao-tuan` (server/src/bao-cao-tuan.ts): số liệu 7 ngày tới hôm nay + tin số liệu đã soạn. Nhận định chỉ «Học thật» / «Đối phó» (máy chủ đã lọc;
// tệp này KHÔNG chứa tên bậc nào khác). Trường sai kiểu ⇒ null, không bịa số.
export const DUONG_BAO_CAO_TUAN_CON = '/ph/bao-cao-tuan'
export interface BaoCaoTuanCon {
  tu: string
  den: string
  buoi: { tong: number; coMat: number; coPhep: number } | null
  soNgay: number
  ngayCoLam: number
  ngayKhongLam: string[]
  soCau: number
  soDung: number
  mucLam: { thuoc: number; bamVoi: number; treo: number; doDuoc: number } | null
  ktcn: { nop: number; hetHan: string[]; diem: number[] }
  banKhac: { lam: number; dung: number } | null
  banKhacTruoc: { lam: number; dung: number } | null
  chuyenDeYeu: { ten: string; sai: number; lam: number }[]
  nhan: 'Học thật' | 'Đối phó' | null
  lyDo: string[]
  soLieu: string
}
const soN = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null)
const chuS = (x: unknown) => (typeof x === 'string' ? x : '')
const dtO = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)
const capLD = (x: unknown) => { const o = dtO(x); const lam = soN(o?.lam), dung = soN(o?.dung); return lam !== null && dung !== null && dung <= lam ? { lam, dung } : null }
export function docBaoCaoTuanCon(j: Record<string, unknown>): BaoCaoTuanCon | null {
  const d = dtO(j.duLieu)
  if (!d || !chuS(j.soLieu)) return null
  const soNgay = soN(d.soNgay), ngayCoLam = soN(d.ngayCoLam), soCau = soN(d.soCau), soDung = soN(d.soDung)
  if (soNgay === null || ngayCoLam === null || soCau === null || soDung === null || soDung > soCau || ngayCoLam > soNgay) return null
  const b = dtO(d.buoi), m = dtO(d.mucLam), k = dtO(d.ktcn)
  const buoi = b && soN(b.tong) !== null && soN(b.coMat) !== null ? { tong: soN(b.tong)!, coMat: soN(b.coMat)!, coPhep: soN(b.coPhep) ?? 0 } : null
  const mucLam = m && [m.thuoc, m.bamVoi, m.treo, m.doDuoc].every((x) => soN(x) !== null) ? { thuoc: soN(m.thuoc)!, bamVoi: soN(m.bamVoi)!, treo: soN(m.treo)!, doDuoc: soN(m.doDuoc)! } : null
  const nhan = d.nhan === 'Học thật' || d.nhan === 'Đối phó' ? d.nhan : null
  return {
    tu: chuS(d.tu), den: chuS(d.den), buoi, soNgay, ngayCoLam, soCau, soDung,
    ngayKhongLam: (Array.isArray(d.ngayKhongLam) ? d.ngayKhongLam : []).map(chuS).filter(Boolean),
    mucLam: mucLam && mucLam.thuoc + mucLam.bamVoi <= mucLam.doDuoc ? mucLam : null,
    ktcn: { nop: soN(k?.nop) ?? 0, hetHan: (Array.isArray(k?.hetHan) ? (k!.hetHan as unknown[]) : []).map(chuS).filter(Boolean), diem: (Array.isArray(k?.diem) ? (k!.diem as unknown[]) : []).map(soN).filter((x): x is number => x !== null && x <= 10) },
    banKhac: capLD(d.banKhac), banKhacTruoc: capLD(d.banKhacTruoc),
    chuyenDeYeu: (Array.isArray(d.chuyenDeYeu) ? d.chuyenDeYeu : []).map((x) => { const o = dtO(x); const sai = soN(o?.sai), lam = soN(o?.lam); return o && chuS(o.ten) && sai !== null && lam !== null && sai <= lam ? { ten: chuS(o.ten), sai, lam } : null }).filter((x): x is { ten: string; sai: number; lam: number } => !!x),
    nhan, lyDo: nhan === 'Đối phó' ? (Array.isArray(d.lyDo) ? d.lyDo : []).map(chuS).filter(Boolean) : [],
    soLieu: chuS(j.soLieu),
  }
}
export async function layBaoCaoTuanCon(sbd: string): Promise<KetQuaLenh<BaoCaoTuanCon>> {
  const r = await goiLenhCon(DUONG_BAO_CAO_TUAN_CON, sbd)
  if (!r.ok) return r
  const d = docBaoCaoTuanCon(r.du)
  return d ? { ok: true, du: d } : thoat('khong_doc_duoc', 'Báo cáo tuần của con chưa đọc được. Anh/chị tải lại sau ít phút.')
}
