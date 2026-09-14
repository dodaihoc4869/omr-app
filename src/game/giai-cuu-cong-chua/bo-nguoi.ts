/**
 * BỘ 12 NGƯỜI CHƠI — dữ liệu thuần, KHÔNG có một lệnh vẽ nào.
 *
 * Tách khỏi nhan-vat.ts để máy chủ dùng chung được: Durable Object cần biết
 * màu áo và kiểu đầu của từng người để phát cho máy khách, nhưng không được
 * kéo theo mã vẽ canvas (Worker không có DOM).
 */
import { HOA_CHAT } from './hoa-chat'

export type TuThe = 'dung' | 'chay' | 'nhay' | 'dam' | 'thang'

export type KieuDau = 'toc' | 'muLuoiTrai' | 'muLen' | 'nonLa' | 'bangDo' | 'toc2'

export interface BoMau { chinh: string; phu: string; da: string; toc: string }

export interface HocTro {
  ten: string
  dau: KieuDau
  mau: BoMau
  hoaChat?: { ct: string; mau: string }
}

export const MUOI_HAI_HOA_CHAT: readonly { ct: string; mau: string }[] = HOA_CHAT
/**
 * Bộ 12 người chơi.
 *
 * MỘT NGƯỜI MỘT HOÁ CHẤT, KHÔNG TRÙNG — và tên hiển thị chính là công thức.
 * Nhờ vậy nhìn một cái là biết CẢ hai thứ cần biết trước khi quyết định dẫm:
 * đó là ai, và người đó cầm chất gì. Hai màu riêng cho hai thứ là bắt mắt đọc
 * hai lần trong nửa giây — không kịp.
 */
export const MUOI_HAI_NGUOI: HocTro[] = [
  { ten: 'HCl',      dau: 'muLuoiTrai',  hoaChat: MUOI_HAI_HOA_CHAT[0 ], mau: { chinh: '#FF5A4E', phu: '#2E4A8A', da: '#FFD9B8', toc: '#3A2A22' } },
  { ten: 'H₂SO₄',    dau: 'toc',         hoaChat: MUOI_HAI_HOA_CHAT[1 ], mau: { chinh: '#FFC13D', phu: '#8A5A1E', da: '#FFE0C4', toc: '#2B2118' } },
  { ten: 'NaOH',     dau: 'muLen',       hoaChat: MUOI_HAI_HOA_CHAT[2 ], mau: { chinh: '#2F8BFF', phu: '#23406E', da: '#F6CBA0', toc: '#463024' } },
  { ten: 'Ca(OH)₂',  dau: 'nonLa',       hoaChat: MUOI_HAI_HOA_CHAT[3 ], mau: { chinh: '#E8EDF5', phu: '#8E9CB4', da: '#FFD9B8', toc: '#3A2A22' } },
  { ten: 'Ba(OH)₂',  dau: 'toc2',        hoaChat: MUOI_HAI_HOA_CHAT[4 ], mau: { chinh: '#7E8FE8', phu: '#3A4694', da: '#FFE0C4', toc: '#2B1F30' } },
  { ten: 'Na₂CO₃',   dau: 'bangDo',      hoaChat: MUOI_HAI_HOA_CHAT[5 ], mau: { chinh: '#25B86B', phu: '#1B5E4A', da: '#FFE6D0', toc: '#4A2A30' } },
  { ten: 'CuSO₄',    dau: 'muLuoiTrai',  hoaChat: MUOI_HAI_HOA_CHAT[6 ], mau: { chinh: '#1E7FD4', phu: '#10406E', da: '#F6CBA0', toc: '#3A2A22' } },
  { ten: 'AgNO₃',    dau: 'toc',         hoaChat: MUOI_HAI_HOA_CHAT[7 ], mau: { chinh: '#9B5DE5', phu: '#4A2E7A', da: '#FFD9B8', toc: '#2B2118' } },
  { ten: 'Al',       dau: 'muLen',       hoaChat: MUOI_HAI_HOA_CHAT[8 ], mau: { chinh: '#B0B8C4', phu: '#5E6674', da: '#F0C098', toc: '#332418' } },
  { ten: 'Zn',       dau: 'toc2',        hoaChat: MUOI_HAI_HOA_CHAT[9 ], mau: { chinh: '#20C4C0', phu: '#166E6C', da: '#FFE0C4', toc: '#3A222A' } },
  { ten: 'FeCl₃',    dau: 'bangDo',      hoaChat: MUOI_HAI_HOA_CHAT[10], mau: { chinh: '#FF8A3D', phu: '#7A3A12', da: '#F6CBA0', toc: '#463024' } },
  { ten: 'Cl₂',      dau: 'nonLa',       hoaChat: MUOI_HAI_HOA_CHAT[11], mau: { chinh: '#8FBF3F', phu: '#4A6E1E', da: '#FFD9B8', toc: '#2B2118' } },
]
