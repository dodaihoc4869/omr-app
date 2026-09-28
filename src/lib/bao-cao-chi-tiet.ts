// BÁO CÁO CHI TIẾT CA (bản vẽ ca thi 28/09/2026 — docs/ban-ve-ca-thi-2809, màn c + d). Bộ đọc CHỐNG SAI KIỂU cho phần THÊM của `/gv/bao-cao-ca`
// (`hocSinh`, `maTran`, `tongQuan.tbCaTruoc`, `aiDaLo`, `congBo`) + hai lệnh GHI mới của thầy: `/gv/cong-bo-ca`, `/gv/nhan-xet-ca-em` (server/src/ca-thi-them.ts).
// Số liệu lớp dạng `BaoCaoCaLop` vẫn đọc bằng `docBaoCaoCaLopMayChu` (một nguồn với khối cũ). Khối nào sai dạng ⇒ vắng, không số 0 giả.
import { goiLenh } from './goi-lenh-thay'
import { docBaoCaoCaLopMayChu, type EmRoiMan } from './bao-cao-may-chu'
import type { BaoCaoCaLop } from './bao-cao-ca-lop'

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const doiTuong = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

export interface EmBangDiem {
  sbd: string
  hoTen: string
  tong: number
  diemTruoc: number | null
  doi: number | null
  giay: number | null
  dung: number | null
  soCau: number | null
}
/** Ô bản đồ: D đúng · P đúng một phần · S sai · B bỏ trống · N chưa chấm · - không có câu. */
export type OBanDo = 'D' | 'P' | 'S' | 'B' | 'N' | '-'
export interface MaTranCa {
  cot: { phan: string; soCau: number }[]
  em: { sbd: string; kq: OBanDo[] }[]
}
export interface AiDaLoLop {
  soCauSaiVaoLichOn: number | null
  soEmCoLichOn: number | null
  dangBaiTapKe: { ten: string; soEm: number }[]
}
export interface CongBoCa {
  congBo: 'khong' | 'ngay' | 'ca_lop_xong'
  daCongBo: boolean
  soEmDaNop: number
  soEmDaVao: number
}
export interface ThemBaoCaoCa {
  hocSinh: EmBangDiem[]
  maTran: MaTranCa | null
  tbCaTruoc: number | null
  caTruoc: { tenCa: string; ngay: string } | null
  aiDaLo: AiDaLoLop | null
  congBo: CongBoCa | null
}

const O_HOP_LE = new Set(['D', 'P', 'S', 'B', 'N', '-'])

export function docThemBaoCaoCa(j: Record<string, unknown>): ThemBaoCaoCa {
  const hocSinh: EmBangDiem[] = []
  for (const x of mang(j.hocSinh)) {
    const o = doiTuong(x)
    const sbd = chu(o?.sbd)
    const tong = so(o?.tong)
    if (!o || !sbd || tong === null) continue
    hocSinh.push({ sbd, hoTen: chu(o.hoTen) || sbd, tong, diemTruoc: so(o.diemTruoc), doi: so(o.doi), giay: so(o.thoiGianLamGiay), dung: so(o.soCauDung), soCau: so(o.soCau) })
  }
  let maTran: MaTranCa | null = null
  const mt = doiTuong(j.maTran)
  if (mt) {
    const cot = mang(mt.cot).flatMap((x) => {
      const o = doiTuong(x)
      const p = chu(o?.phan)
      const s = so(o?.soCau)
      return p && s !== null ? [{ phan: p, soCau: s }] : []
    })
    const em = mang(mt.em).flatMap((x) => {
      const o = doiTuong(x)
      const sbd = chu(o?.sbd)
      const kq = chu(o?.kq)
      if (!sbd || kq.length !== cot.length) return []
      return [{ sbd, kq: [...kq].map((c) => (O_HOP_LE.has(c) ? (c as OBanDo) : '-')) }]
    })
    if (cot.length > 0 && em.length > 0) maTran = { cot, em }
  }
  const tq = doiTuong(j.tongQuan)
  const ct = doiTuong(tq?.caTruoc)
  const ai = doiTuong(j.aiDaLo)
  const cb = doiTuong(j.congBo)
  const cheDo = chu(cb?.congBo)
  return {
    hocSinh,
    maTran,
    tbCaTruoc: so(tq?.tbCaTruoc),
    caTruoc: ct ? { tenCa: chu(ct.tenCa), ngay: chu(ct.ngay) } : null,
    aiDaLo: ai
      ? {
          soCauSaiVaoLichOn: so(ai.soCauSaiVaoLichOn),
          soEmCoLichOn: so(ai.soEmCoLichOn),
          dangBaiTapKe: mang(ai.dangBaiTapKe).flatMap((x) => {
            const o = doiTuong(x)
            const ten = chu(o?.ten) || chu(o?.ma)
            const n = so(o?.soEm)
            return ten && n !== null ? [{ ten, soEm: n }] : []
          }),
        }
      : null,
    congBo: cb
      ? { congBo: cheDo === 'ngay' || cheDo === 'ca_lop_xong' ? cheDo : 'khong', daCongBo: cb.daCongBo === true, soEmDaNop: so(cb.soEmDaNop) ?? 0, soEmDaVao: so(cb.soEmDaVao) ?? 0 }
      : null,
  }
}

/** MỘT lần gọi `/gv/bao-cao-ca` ⇒ số liệu lớp (khuôn cũ) + phần thêm. Lỗi ⇒ `{lop:null, them:null, loi}`. */
export async function layBaoCaoCaDayDu(maCa: string, roiMan: readonly EmRoiMan[] = []): Promise<{ lop: BaoCaoCaLop | null; them: ThemBaoCaoCa | null; loi: string }> {
  const r = await goiLenh('/gv/bao-cao-ca', { maCa }, 'Máy chủ chưa có lệnh Báo cáo ca — tính từ số ở máy này.')
  if (!r.ok) return { lop: null, them: null, loi: r.chu }
  return { lop: docBaoCaoCaLopMayChu(r.du, roiMan), them: docThemBaoCaoCa(r.du), loi: '' }
}

/** Công bố điểm ca ĐÃ ĐÓNG. Trả câu lỗi (rỗng = xong). */
export async function congBoDiemCa(maCa: string): Promise<string> {
  const r = await goiLenh('/gv/cong-bo-ca', { maCa }, 'Máy chủ chưa có lệnh Công bố điểm — cần đẩy bản máy chủ mới.')
  return r.ok ? '' : r.chu
}

/** ĐÓNG CỬA VÀO (bản vẽ ca thi 28/09, màn b): máy chủ đặt hạn vào phòng = bây giờ cho ca đang mở. Rỗng = xong; chuỗi = lỗi để hiện. */
export async function dongCuaVaoCa(maCa: string): Promise<string> {
  const r = await goiLenh('/gv/dong-cua-vao', { maCa }, 'Máy chủ chưa có lệnh Đóng cửa vào — cần đẩy bản máy chủ mới.')
  return r.ok ? '' : r.chu
}

/** Nhận xét đã lưu của thầy (đọc kèm `/gv/bao-cao-ca-em`). */
export async function layNhanXetEm(maCa: string, sbd: string): Promise<string | null> {
  const r = await goiLenh('/gv/bao-cao-ca-em', { maCa, sbd }, '')
  if (!r.ok) return null
  return chu(doiTuong(r.du.nhanXet)?.noiDung)
}

export async function luuNhanXetEm(maCa: string, sbd: string, noiDung: string): Promise<string> {
  const r = await goiLenh('/gv/nhan-xet-ca-em', { maCa, sbd, noiDung }, 'Máy chủ chưa có lệnh lưu nhận xét — cần đẩy bản máy chủ mới.')
  return r.ok ? '' : r.chu
}

/** "41 phút" / "38 phút 10 giây" từ giây. */
export function chuPhut(giay: number | null): string {
  if (giay === null || giay < 0) return '—'
  const p = Math.floor(giay / 60)
  const g = Math.round(giay % 60)
  return p > 0 ? `${p} phút` : `${g} giây`
}
