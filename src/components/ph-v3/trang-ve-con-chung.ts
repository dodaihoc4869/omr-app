// PHẦN CHUNG CỦA TRANG CŨ «Hôm nay của con» (TrangVeCon.tsx) — tách 26/10 (luật tốc độ: đường /ph chỉ nhẹ đi) để vỏ AppPhuHuynh và màn «Chỉ đọc»
// (DocPh.tsx) dùng mà KHÔNG kéo cả trang cũ vào lượt tải đầu: trang cũ (TrangVeCon + trang-con.css) nay nạp lười, chỉ khi cần (ddh.trong='tat' hoặc màn con).
// Chỉ CHUYỂN CHỖ nguyên văn các kiểu / hằng / phép thuần dưới đây; TrangVeCon.tsx xuất lại y tên cũ (test và TrangVeConDuoi không đổi).
import type { ReactElement } from 'react'
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import type { ConTongQuan, NgayHoc } from '../../lib/ph-v3/con-tong-quan'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { gioVn, tachVn } from '../../lib/ph-moi/dinh-dang'
import type { KetQuaNhipHocApp } from '../../lib/nhip-hoc-em'
import type { KetQuaHoSoThaiDo } from '../../lib/bai-hang-ngay-api'
import type { KetQuaLichSuLamCau } from '../../lib/lich-su-lam-cau-api'
import { BtBang, BtBut, BtDongHo, BtHomNay, BtLich, BtLichSu, BtLop, BtNhipTim, BtSach } from './BieuTuong'

// ---------------------------------------------------------------- các phần trên trang ----------------------------------------------------------------
export type IdPhan = 'hom-nay' | 'nhip' | 'thai-do' | 'cau-sai' | 'thoi-gian' | 'kiem-tra' | 'btvn' | 'buoi-hoc' | 'lich-su'
export type Bt = (p: { co?: number; day?: number }) => ReactElement
export const PHAN: readonly { id: IdPhan; ten: string; bt: Bt }[] = [
  { id: 'hom-nay', ten: 'Hôm nay', bt: BtHomNay },
  { id: 'nhip', ten: 'Nhịp học', bt: BtLich },
  { id: 'thai-do', ten: 'Thái độ', bt: BtNhipTim },
  { id: 'cau-sai', ten: 'Câu sai', bt: BtBut },
  { id: 'thoi-gian', ten: 'Thời gian', bt: BtDongHo },
  { id: 'kiem-tra', ten: 'Kiểm tra', bt: BtBang },
  { id: 'btvn', ten: 'Bài tập về nhà', bt: BtSach },
  { id: 'buoi-hoc', ten: 'Buổi học', bt: BtLop },
  { id: 'lich-su', ten: 'Lịch sử', bt: BtLichSu },
]
/** Các phần nằm ở khối nạp khi cuộn tới (TrangVeConDuoi.tsx). */
export const PHAN_DUOI: ReadonlySet<IdPhan> = new Set(['thai-do', 'cau-sai', 'thoi-gian', 'kiem-tra', 'btvn', 'buoi-hoc', 'lich-su'])
/** id phần tử của một phần (`phan-…`) — KHÔNG trùng tuyến cũ (`#lich-su` là tuyến cũ của Ca kiểm tra). */
export const idPhan = (id: IdPhan): string => `phan-${id}`
/** `#phan-thai-do` ⇒ 'thai-do'; khác ⇒ null. */
export function docPhanTuHash(hash: string): IdPhan | null {
  const h = hash.replace(/^#/, '')
  const p = PHAN.find((x) => `phan-${x.id}` === h)
  return p ? p.id : null
}
/** Phần có trên trang với số đang có: Bài tập về nhà / Buổi học / Lịch sử chỉ khi máy chủ có số (máy chủ cũ ⇒ phần ẩn, không có mục trỏ vào chỗ trống). */
export function phanCo(pm: PhMoi | null, tq: ConTongQuan | null): IdPhan[] {
  return PHAN.map((p) => p.id).filter((id) => (id === 'btvn' ? !!pm?.baiTapVeNha || !!pm?.no : id === 'buoi-hoc' ? !!pm?.buoiHoc : id === 'lich-su' ? !!tq : true))
}

/** Trạng thái hai lệnh nạp khi cuộn tới (AppPhuHuynh giữ — quay lại trang không nạp lại). */
export type TaiHoSo = { td: KetQuaHoSoThaiDo | null; ls: KetQuaLichSuLamCau | null; dangTaiTd: boolean; dangTaiLs: boolean; loiTd: string; loiLs: string; daGoi: boolean }
export const HO_SO_TRONG: TaiHoSo = { td: null, ls: null, dangTaiTd: false, dangTaiLs: false, loiTd: '', loiLs: '', daGoi: false }
export type TaiNhip = { k: KetQuaNhipHocApp | null; dangTai: boolean; loi: string; thuLai: () => void }
export type TaiTq = { v: ConTongQuan | null; daTai: boolean; chuLoi: string; thuLai: () => void }

const hai = (n: number) => String(n).padStart(2, '0')
const ngayCuaMs = (ms: number): string => {
  const t = tachVn(ms)
  return t ? `${t.y}-${hai(t.m)}-${hai(t.d)}` : ''
}
export const homNayTq = (tq: ConTongQuan | null): NgayHoc | null => tq?.ngay.find((n) => n.homNay) ?? null
/** Tên gọi của con: chữ cuối của họ tên ("Nguyễn Minh Khôi" ⇒ "Khôi"). */
export const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).pop() || hoTen.trim()

/** Có mặt buổi học hôm nay: có mặt (giờ vào) · buổi đang mở mà con chưa điểm danh · vắng. Hôm nay không có buổi nào của con ⇒ null. */
export function buoiHomNay(pm: PhMoi, nowMs: number): { kieu: 'co-mat'; luc: string } | { kieu: 'chua' } | { kieu: 'vang' } | null {
  const nay = ngayCuaMs(nowMs)
  const ds = (pm.buoiHoc ?? []).filter((b) => ngayCuaMs(Date.parse(b.moLuc)) === nay)
  if (ds.length === 0) return null
  const co = ds.find((b) => b.coMat)
  if (co) return { kieu: 'co-mat', luc: gioVn(co.luc) }
  return ds.some((b) => b.dangMo) ? { kieu: 'chua' } : { kieu: 'vang' }
}

/** Số câu hôm nay từ MỘT nguồn (như trước): tổng quan (đã làm / mức tối thiểu) ⇒ kế hoạch Game Hoá 2.0 ⇒ câu đã làm + mục tiêu ngày. */
export function soHomNay(pm: PhMoi, hoc2: Hoc2 | null, tq: ConTongQuan | null): { daLam: number; tong: number | null; xap: string; dich: string; du: string } {
  const n = homNayTq(tq)
  if (n) return { daLam: n.daLam, tong: n.canLam, xap: n.mucUocTinh ? '≈' : '', dich: 'mức tối thiểu của ngày', du: 'đủ mức hôm nay' }
  if (hoc2?.homNay) return { daLam: hoc2.homNay.daLam, tong: hoc2.homNay.tong, xap: '', dich: 'kế hoạch hôm nay', du: 'xong kế hoạch hôm nay' }
  const muc = pm.tongQuan?.mucTieu?.soCau ?? null
  return { daLam: pm.tongQuan?.soCau ?? 0, tong: muc && muc > 0 ? muc : null, xap: '', dich: 'mục tiêu của ngày', du: 'đủ mục tiêu của ngày' }
}


export interface TrangVeConProps {
  v: ViewPhMoi
  hoc2: Hoc2 | null
  tongQuan: TaiTq
  nhip: TaiNhip
  loiThay: { ds: NhanXetCa[] | null; chuLoi: string }
  thuLaiLoiThay: () => void
  canhBao: CanhBaoThay[]
  onDaXem: (id: string) => void
  hoSo: TaiHoSo
  napHoSo: () => void
  sbd: string
  tenCon: string
  lop: string
  /** Phần cần cuộn tới (bấm mục ở thanh bên, hoặc mở `#phan-…`); xong ⇒ `daDenPhan()`. */
  denPhan: { id: IdPhan; lan: number } | null
  daDenPhan: () => void
  /** Phần đang đọc (thanh mục sáng đúng chỗ). */
  phanHien: IdPhan
  onPhanHien: (id: IdPhan) => void
}

