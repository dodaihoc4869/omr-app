// MỞ CA KIỂM TRA · «Em đã điểm danh hôm nay» (thầy 23/10: "chỗ chọn học sinh kiểm tra thêm một lựa chọn chọn hs đã điểm danh").
// Từ các buổi gần đây (`buoiGanDay`, mỗi buổi kèm SBD em CÓ MẶT) lấy buổi mở HÔM NAY theo giờ Việt Nam.
// Có buổi đúng lớp của ca ⇒ chỉ lấy buổi lớp ấy; không có ⇒ gộp mọi buổi hôm nay (thầy vẫn bỏ tích được trong hộp chọn em). Thuần.

export interface BuoiCoMat {
  lop: string
  moLuc: string
  coMat: readonly string[]
}

export interface EmDiemDanhHomNay {
  sbd: string[]
  /** Số buổi hôm nay đã gộp. */
  soBuoi: number
  /** true = lấy đúng buổi của lớp ca; false = không có buổi nào đúng lớp ⇒ gộp mọi buổi hôm nay. */
  dungLop: boolean
}

/** Ngày (YYYY-MM-DD) giờ Việt Nam của một mốc ISO / ms; mốc hỏng ⇒ ''. */
export function ngayVnCuaMoc(moc: string | number): string {
  const ms = typeof moc === 'number' ? moc : Date.parse(moc)
  return Number.isFinite(ms) ? new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10) : ''
}

const chuanLop = (s: string) => s.trim().toLowerCase()

export function emDiemDanhHomNay(buoi: readonly BuoiCoMat[], lop: string, nowMs: number = Date.now()): EmDiemDanhHomNay {
  const homNay = ngayVnCuaMoc(nowMs)
  const trongNgay = buoi.filter((b) => ngayVnCuaMoc(b.moLuc) === homNay)
  const l = chuanLop(lop)
  const dungLop = l ? trongNgay.filter((b) => chuanLop(b.lop) === l) : []
  const chon = dungLop.length ? dungLop : trongNgay
  return { sbd: [...new Set(chon.flatMap((b) => b.coMat.map((s) => String(s).trim()).filter(Boolean)))].sort(), soBuoi: chon.length, dungLop: dungLop.length > 0 }
}
