/**
 * TRÙM CUỐI — bốn giai đoạn, dùng lại ĐÚNG cơ chế đã học suốt ván.
 *
 * Không bắt học kỹ năng mới ở phút chót. Thứ duy nhất mới là: rồng CŨNG cầm
 * một hoá chất, và đổi chất mỗi khi mất một máu. Ba máu là ba câu hỏi hoá.
 */
import { CAU_HINH } from './cau-hinh'
import { HOA_CHAT } from './hoa-chat'
import type { PhaRong } from './types'

export interface Rong {
  x: number
  y: number
  mau: number
  pha: PhaRong
  /** Còn bao lâu thì đổi giai đoạn. */
  conLai: number
  hoaChat: string
  /** Hướng phun lửa. */
  huongPhun: 1 | -1
  /** Cột đá còn chịu được mấy lần lửa. */
  cotConLai: number
  /** Cửa sổ hở, giây. Hẹp hơn là khó dẫm trúng hơn. */
  giayHo: number
}

/** Cửa sổ hở — hẹp dần theo mức độ khó. Đặt lúc tạo rồng. */
function vongPha(giayHo: number): { pha: PhaRong; giay: number }[] {
  return [
    { pha: 'do', giay: 2.0 },
    { pha: 'phun', giay: CAU_HINH.GIAY_PHUN_LUA },
    { pha: 'dap', giay: 1.2 },
    { pha: 'ho', giay: giayHo },
  ]
}

export function taoRong(
  xHang: number, chonChat: () => number, giayHo = CAU_HINH.GIAY_HO_SAU_DAP,
): Rong {
  return {
    x: xHang + 200,
    y: 0,
    mau: CAU_HINH.MAU_RONG,
    pha: 'do',
    conLai: vongPha(giayHo)[0]!.giay,
    hoaChat: HOA_CHAT[chonChat()]!.ct,
    huongPhun: -1,
    cotConLai: CAU_HINH.SO_LAN_COT_DA_CHIU,
    giayHo,
  }
}

/** Đẩy rồng sang giai đoạn kế. Trả về giai đoạn mới. */
export function buocRong(r: Rong, dt: number): PhaRong {
  if (r.pha === 'nga') return 'nga'
  r.conLai -= dt
  if (r.conLai > 0) return r.pha
  const vong = vongPha(r.giayHo)
  const i = vong.findIndex((v) => v.pha === r.pha)
  const ke = vong[(i + 1) % vong.length]!
  r.pha = ke.pha
  r.conLai = ke.giay
  return r.pha
}

/** Đỉnh đầu rồng — chỗ duy nhất dẫm được, và chỉ trong giai đoạn 'ho'. */
export function dinhDauRong(r: Rong): { x: number; y: number } {
  return { x: r.x - 150, y: r.pha === 'ho' ? 70 : 240 }
}

/** Rồng mất một máu và ĐỔI hoá chất. */
export function rongMatMau(r: Rong, chonChat: () => number): void {
  r.mau -= 1
  if (r.mau <= 0) { r.pha = 'nga'; r.conLai = 0; return }
  let c = HOA_CHAT[chonChat()]!.ct
  let vong = 0
  while (c === r.hoaChat && vong < 12) { c = HOA_CHAT[chonChat()]!.ct; vong++ }
  r.hoaChat = c
  r.pha = 'do'
  r.conLai = vongPha(r.giayHo)[0]!.giay
}
