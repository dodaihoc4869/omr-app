// ĐOÀN HỘ TỐNG — hình dạng gói tin máy chủ trả về cho MỘT em (server/src/game-v2-doan.ts `khungNhin`).
// Chỉ có kiểu, không có mã chạy.
import type { Question } from './core'
import type { HanhDong, KhungNhinHiep, Quai, TomTatGhe } from './doan-core'
import type { HinhAnh } from '../../data/examContent'

export type GoiDoan = (action: string, data?: Record<string, unknown>) => Promise<unknown>
export type TrangThaiGhe = 'cho' | 'may' | 'dang_lam' | 'da_chot' | 'can_tiep_suc'
export type NhanCau = 'toi_han_on' | 'dang_yeu' | 'cau_moi' | 'vua_suc'
export interface GheXem { ghe: number; ten: string; pet: number; cap: number; laMay: boolean; roi: boolean; laEm: boolean; trangThai: TrangThaiGhe; tinHieu: string | null }
export interface TranXem {
  tenChang: string; hiep: number; soHiep: number; laTrum: boolean; ketThuc: boolean; thang: boolean | null
  linhTam: { hp: number; toiDa: number }; quai: Quai[]; trumVoGiap: boolean[]
  nangLuong: number; daNhanTiepSuc: number; giay: number; moSauMs: number; conMs: number; tenQuai: string[]; loaiQuai: string[]; tenTrum: string[]; loaiTrum: string[]
}
export interface KetQuaCau { correct: boolean; answer: string; solution: unknown; solutionImages?: HinhAnh[]; reward?: number; stage?: number }
export interface CauXem { qid?: string; nhan?: NhanCau; an?: boolean; de?: Question; giuNguyen?: boolean; daChot?: boolean; hanhDong?: HanhDong; boTrong?: boolean; ketQua?: KetQuaCau | null; het?: boolean; rut?: boolean; loiNhan?: string }
export interface TrumXem { coCau: boolean; giaoY: number[]; yCuaEm: number[]; yDaChot: boolean[]; qid?: string; tenDang?: string; de?: Question; giuNguyen?: boolean; loiNhan?: string }
export interface TienBoXem { soCau: number; tuLamDung: number; lenBac: number | null; giup: number; giupThanhCong: number; duocGiup: number }
/** Bước 5 — mọi con số của Sảnh do máy chủ đọc từ sổ; máy chủ chưa có (chưa chạy migration) thì `sanh` = null và giao diện giữ ô "SẮP MỞ". */
export interface DoanLopXem { lop: string; tram: number; tongTram: number; changThang: number; changMoiTram: number; conChangToiTramKe: number; mocKe: number | null; tenMocKe: string | null; conTramToiMoc: number | null; gopSucHomNay: number; siSo: number }
export interface SanhXem {
  lop: string; tenDoan: string; mua: { so: number; conNgay: number }; ve: number | null; mienPhiHomNay: boolean
  chuoi: { ngay: number; daDiHomNay: boolean; mocKe: number | null; conNgay: number | null }; doanLop: DoanLopXem
  trumLop: { dangMo: boolean; chuNhat: string; moSauMs: number; conMs: number; daGop: number; mucTieu: number; daHa: boolean }
  quaMoi: { loai: string; ve: number; ghiChu: string }[]
}
export interface AnThachXem { dang: string; ten: string; trangThai: 'sang' | 'nut'; conCau: number }
export interface AnXem { sang: number; nut: number; ds: AnThachXem[]; ganSang: { ten: string; conCau: number; kyNang: string } | null }
export interface BanDongHanhXem { ten: string; pet: number; cap: number; banVung: string; emVung: string }
export interface KetChangLopXem { tramTruoc: number; tramSau: number; tongTram: number; banThu: number; siSo: number; conTramToiMoc: number | null; tenMocKe: string | null; trumLop: number | null }
export interface KetChangXem {
  thang: boolean; sao: number; linhTam: { hp: number; toiDa: number }; trumVoGiap: boolean[]; quaiHaGuc: number; soLienKich: number
  /** Các khoản EXP của chuyến này của em (chỉ-thêm, Đợt 2): {loai: doan_chang | doan_giap | tiepsuc, exp đã qua trần 120/ngày, ghiChu}. Máy chủ cũ không gửi ⇒ vắng. */
  expChang?: { loai: string; exp: number; ghiChu: string }[]
  cuaEm: TomTatGhe; tienBo: TienBoXem; doanLop?: KetChangLopXem | null; anThach?: AnXem['ganSang']; ban: { ghe: number; laMay: boolean; soLanGiupThanhCong: number }[]
}
export interface TiepSucXem { conLuotNhan: number; daXin: boolean; theNhan: { tuTen: string; tuLaMay: boolean; loai: string; tieuDe: string; noiDung: string } | null; banCan: number[]; daGiup: boolean; lienKichSanSang: boolean }
export interface GoiYTiepSuc { den: number; ten: string; pet: number; cap: number; tenDang: string; de: string; the: { loai: string; tieuDe: string; moTa: string }[] }
export interface DoanXem {
  ma: string; revision: number; laChu: boolean; batDau: boolean; ghe: GheXem[]; gioMayChu: number
  tran?: TranXem; hiepVuaXong?: KhungNhinHiep; cau?: CauXem; trum?: TrumXem; ketChang?: KetChangXem; tiepSuc?: TiepSucXem
}
export interface PhanHoiDoan { ok: boolean; doan?: DoanXem; sanh?: SanhXem | null; anThach?: AnXem; banDongHanh?: BanDongHanhXem | null; dangDo?: string | null; ketQuaCau?: KetQuaCau; /** Chỉ-thêm: `doan-sanh` = trần + lượt CỦA ĐOÀN (`tranNgay`, `dailyUsed`) và `changHomNay`; `doan-mo` báo `hetCauMoi` khi hết câu mới hôm nay. Máy chủ cũ không gửi ⇒ vắng. */ tranNgay?: number; dailyUsed?: number; changHomNay?: { daDi: number; toiDa: number }; hetCauMoi?: boolean; goiY?: GoiYTiepSuc; expTiepSuc?: { bat: boolean; exp: number; conLai: number }; loiGiaiTrum?: { hiep: number; de: Question; answer: string; solution: unknown; solutionImages?: HinhAnh[] } | null; daRoi?: boolean }

export const NHAN_CAU: Record<NhanCau, string> = { toi_han_on: 'đến lịch ôn lại', dang_yeu: 'dạng em đang yếu', cau_moi: 'câu mới', vua_suc: 'vừa sức em' }
export const CHU_TRANG_THAI: Record<TrangThaiGhe, string> = { cho: 'sẵn sàng', may: 'máy đỡ thay', dang_lam: 'đang làm', da_chot: 'đã chốt', can_tiep_suc: 'cần tiếp sức' }
export const TIN_HIEU_TRUM = [['chac_y', 'Mình chắc ý này'], ['ban_them', 'Cần bàn thêm'], ['doi_ti', 'Đợi tí']] as const
