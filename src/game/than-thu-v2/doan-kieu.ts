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
export interface CauXem { qid?: string; nhan?: NhanCau; de?: Question; giuNguyen?: boolean; daChot?: boolean; hanhDong?: HanhDong; boTrong?: boolean; ketQua?: KetQuaCau | null; het?: boolean; rut?: boolean; loiNhan?: string }
export interface TrumXem { coCau: boolean; giaoY: number[]; yCuaEm: number[]; yDaChot: boolean[]; qid?: string; tenDang?: string; de?: Question; giuNguyen?: boolean; loiNhan?: string }
export interface TienBoXem { soCau: number; tuLamDung: number; lenBac: number | null; giup: number; giupThanhCong: number; duocGiup: number }
export interface KetChangXem {
  thang: boolean; sao: number; linhTam: { hp: number; toiDa: number }; trumVoGiap: boolean[]; quaiHaGuc: number; soLienKich: number
  cuaEm: TomTatGhe; tienBo: TienBoXem; ban: { ghe: number; laMay: boolean; soLanGiupThanhCong: number }[]
}
export interface TiepSucXem { conLuotNhan: number; daXin: boolean; theNhan: { tuTen: string; tuLaMay: boolean; loai: string; tieuDe: string; noiDung: string } | null; banCan: number[]; daGiup: boolean; lienKichSanSang: boolean }
export interface GoiYTiepSuc { den: number; ten: string; pet: number; cap: number; tenDang: string; de: string; the: { loai: string; tieuDe: string; moTa: string }[] }
export interface DoanXem {
  ma: string; revision: number; laChu: boolean; batDau: boolean; ghe: GheXem[]; gioMayChu: number
  tran?: TranXem; hiepVuaXong?: KhungNhinHiep; cau?: CauXem; trum?: TrumXem; ketChang?: KetChangXem; tiepSuc?: TiepSucXem
}
export interface PhanHoiDoan { ok: boolean; doan?: DoanXem; ketQuaCau?: KetQuaCau; goiY?: GoiYTiepSuc; expTiepSuc?: { bat: boolean; exp: number; conLai: number }; loiGiaiTrum?: { hiep: number; de: Question; answer: string; solution: unknown; solutionImages?: HinhAnh[] } | null; daRoi?: boolean }

export const NHAN_CAU: Record<NhanCau, string> = { toi_han_on: 'tới hạn ôn', dang_yeu: 'dạng em đang yếu', cau_moi: 'câu mới', vua_suc: 'vừa sức em' }
export const CHU_TRANG_THAI: Record<TrangThaiGhe, string> = { cho: 'sẵn sàng', may: 'máy đỡ thay', dang_lam: 'đang làm', da_chot: 'đã chốt', can_tiep_suc: 'cần tiếp sức' }
export const TIN_HIEU_TRUM = [['chac_y', 'Mình chắc ý này'], ['ban_them', 'Cần bàn thêm'], ['doi_ti', 'Đợi tí']] as const
