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
  { ten: 'HCl',      dau: 'muLuoiTrai',  hoaChat: MUOI_HAI_HOA_CHAT[0 ], mau: { chinh: 'rgb(255, 90, 78)', phu: 'rgb(46, 74, 138)', da: 'rgb(255, 217, 184)', toc: 'rgb(58, 42, 34)' } },
  { ten: 'H₂SO₄',    dau: 'toc',         hoaChat: MUOI_HAI_HOA_CHAT[1 ], mau: { chinh: 'rgb(255, 193, 61)', phu: 'rgb(138, 90, 30)', da: 'rgb(255, 224, 196)', toc: 'rgb(43, 33, 24)' } },
  { ten: 'NaOH',     dau: 'muLen',       hoaChat: MUOI_HAI_HOA_CHAT[2 ], mau: { chinh: 'rgb(47, 139, 255)', phu: 'rgb(35, 64, 110)', da: 'rgb(246, 203, 160)', toc: 'rgb(70, 48, 36)' } },
  { ten: 'Ca(OH)₂',  dau: 'nonLa',       hoaChat: MUOI_HAI_HOA_CHAT[3 ], mau: { chinh: 'rgb(232, 237, 245)', phu: 'rgb(142, 156, 180)', da: 'rgb(255, 217, 184)', toc: 'rgb(58, 42, 34)' } },
  { ten: 'Ba(OH)₂',  dau: 'toc2',        hoaChat: MUOI_HAI_HOA_CHAT[4 ], mau: { chinh: 'rgb(126, 143, 232)', phu: 'rgb(58, 70, 148)', da: 'rgb(255, 224, 196)', toc: 'rgb(43, 31, 48)' } },
  { ten: 'Na₂CO₃',   dau: 'bangDo',      hoaChat: MUOI_HAI_HOA_CHAT[5 ], mau: { chinh: 'rgb(37, 184, 107)', phu: 'rgb(27, 94, 74)', da: 'rgb(255, 230, 208)', toc: 'rgb(74, 42, 48)' } },
  { ten: 'CuSO₄',    dau: 'muLuoiTrai',  hoaChat: MUOI_HAI_HOA_CHAT[6 ], mau: { chinh: 'rgb(30, 127, 212)', phu: 'rgb(16, 64, 110)', da: 'rgb(246, 203, 160)', toc: 'rgb(58, 42, 34)' } },
  { ten: 'AgNO₃',    dau: 'toc',         hoaChat: MUOI_HAI_HOA_CHAT[7 ], mau: { chinh: 'rgb(155, 93, 229)', phu: 'rgb(74, 46, 122)', da: 'rgb(255, 217, 184)', toc: 'rgb(43, 33, 24)' } },
  { ten: 'Al',       dau: 'muLen',       hoaChat: MUOI_HAI_HOA_CHAT[8 ], mau: { chinh: 'rgb(176, 184, 196)', phu: 'rgb(94, 102, 116)', da: 'rgb(240, 192, 152)', toc: 'rgb(51, 36, 24)' } },
  { ten: 'Zn',       dau: 'toc2',        hoaChat: MUOI_HAI_HOA_CHAT[9 ], mau: { chinh: 'rgb(32, 196, 192)', phu: 'rgb(22, 110, 108)', da: 'rgb(255, 224, 196)', toc: 'rgb(58, 34, 42)' } },
  { ten: 'FeCl₃',    dau: 'bangDo',      hoaChat: MUOI_HAI_HOA_CHAT[10], mau: { chinh: 'rgb(255, 138, 61)', phu: 'rgb(122, 58, 18)', da: 'rgb(246, 203, 160)', toc: 'rgb(70, 48, 36)' } },
  { ten: 'Cl₂',      dau: 'nonLa',       hoaChat: MUOI_HAI_HOA_CHAT[11], mau: { chinh: 'rgb(143, 191, 63)', phu: 'rgb(74, 110, 30)', da: 'rgb(255, 217, 184)', toc: 'rgb(43, 33, 24)' } },
]
