/**
 * LUẬT DẪM — HÀM THUẦN, ĐÚNG MỘT CHỖ.
 *
 * Rải luật này ra nhiều nơi là chắc chắn sinh ra ca "em đứng yên mà bị loại",
 * và đó là ca làm em bỏ game. Mọi thứ quyết định ai mất mạng đều ở đây.
 */
import { CAU_HINH } from './cau-hinh'
import { xuLyHoaChat, type KetQuaDam } from './bang-khac-che'

export interface ThanhPhan {
  x: number
  /** y của CHÂN. Trục y hướng lên: y lớn hơn là cao hơn. */
  y: number
  vy: number
  rong: number
  cao: number
  batTuDen: number   // thời điểm hết bất tử, tính bằng giây trong ván
  song: boolean
  hoaChat: string
}

export type LoaiVaCham = 'khongCham' | 'dam'

export interface KetQuaVaCham {
  cham: LoaiVaCham
  /** null khi không chạm. */
  hoa: KetQuaDam | null
  /** Ai mất mạng. Mảng rỗng nghĩa là không ai. */
  matMang: ('nguoiDam' | 'nguoiBiDam')[]
  /** Người nhảy lên có bị bật ra không (luôn có khi chạm). */
  nayLen: boolean
}

const KHONG_CHAM: KetQuaVaCham = { cham: 'khongCham', hoa: null, matMang: [], nayLen: false }

/**
 * Có chạm trúng ĐỈNH ĐẦU không. Đủ cả ba mới tính:
 *  1. chân người dẫm nằm trong vùng CAO_VUNG_DAU tính từ đỉnh đầu người kia
 *  2. người dẫm ĐANG RƠI XUỐNG đủ nhanh
 *  3. người bị dẫm KHÔNG trong thời gian bất tử
 * Thiếu bất kỳ điều nào ⇒ không chạm. Người lao vào chịu, không phải người đứng yên.
 */
export function chamDinhDau(dam: ThanhPhan, bi: ThanhPhan, giay: number): boolean {
  if (!dam.song || !bi.song) return false
  if (dam === bi) return false
  if (bi.batTuDen > giay) return false
  if (dam.vy > -CAU_HINH.TOC_DO_ROI_TOI_THIEU) return false
  const chongX = Math.abs(dam.x - bi.x) < (dam.rong + bi.rong) / 2
  if (!chongX) return false
  const dinhDau = bi.y + bi.cao
  return dam.y >= dinhDau - CAU_HINH.CAO_VUNG_DAU && dam.y <= dinhDau + CAU_HINH.CAO_VUNG_DAU
}

/**
 * Chạm rồi thì ai mất mạng — tra bảng hoá chất.
 *
 * Bốn kết quả, không hơn:
 *  khắc chế      → đối thủ mất 1 mạng
 *  BỊ khắc chế   → CHÍNH MÌNH mất 1 mạng, dù mình là người nhảy lên
 *  trung hoà     → cả hai mất 1 mạng
 *  không phản ứng→ không ai mất mạng, chỉ bật ra
 */
export function xuLyDam(dam: ThanhPhan, bi: ThanhPhan, giay: number): KetQuaVaCham {
  if (!chamDinhDau(dam, bi, giay)) return KHONG_CHAM
  const hoa = xuLyHoaChat(dam.hoaChat, bi.hoaChat)
  const matMang: ('nguoiDam' | 'nguoiBiDam')[] = []
  if (hoa.loai === 'trungHoa') { matMang.push('nguoiDam', 'nguoiBiDam') }
  else if (hoa.loai === 'khacChe') {
    if (hoa.thang === dam.hoaChat) matMang.push('nguoiBiDam')
    else matMang.push('nguoiDam')
  }
  return { cham: 'dam', hoa, matMang, nayLen: true }
}
