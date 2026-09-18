// Chỉ phục vụ lịch và giao diện. Không chọn câu, chấm điểm hoặc thay hạn máy chủ.
export function mocThoiGian(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

export function hanBaiMom(bai: { batDauLuc?: string }): string | undefined {
  const start = mocThoiGian(bai.batDauLuc)
  // Máy chủ tính 120 phút từ lúc bắt đầu, không tính từ lúc phụ huynh giao.
  return start === undefined ? undefined : new Date(start + 120 * 60_000).toISOString()
}

export function gioHanVietNam(value: unknown): string {
  const ms = mocThoiGian(value)
  if (ms === undefined) return 'Chưa có hạn hợp lệ'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric', hourCycle: 'h23',
  }).format(ms)
}

export function ngayVietNam(value: unknown): string | undefined {
  const ms = typeof value === 'number' && Number.isFinite(value) ? value : mocThoiGian(value)
  return ms === undefined ? undefined : new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
}

export function chuoiNgayHoc(dates: unknown[], now: number): number {
  const days = new Set(dates.map(ngayVietNam).filter(Boolean))
  let day = Date.parse(`${ngayVietNam(now)}T00:00:00+07:00`)
  if (!days.has(ngayVietNam(day))) day -= 86400_000
  let count = 0
  while (days.has(ngayVietNam(day))) { count++; day -= 86400_000 }
  return count
}

/** Giá trị nhập ở màn giao bài luôn là giờ Việt Nam, kể cả máy ở múi giờ khác. */
export function hanNhapVietNam(value: string, now: number): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Thầy chọn đủ ngày và giờ hạn nộp.')
  const ms = Date.parse(`${value}:00+07:00`)
  if (!Number.isFinite(ms) || new Date(ms + 7 * 3600_000).toISOString().slice(0, 16) !== value) throw new Error('Ngày giờ hạn nộp không hợp lệ.')
  if (ms <= now) throw new Error('Hạn nộp phải ở sau thời điểm hiện tại.')
  return new Date(ms).toISOString()
}

export function hanChoOChon(value: string): string {
  const ms = mocThoiGian(value)
  return ms === undefined ? '' : new Date(ms + 7 * 3600_000).toISOString().slice(0, 16)
}

/** NGÂN SÁCH VÒNG 2 (KIEM-TRA-VONG-2.md): 24 giờ kể từ lúc em xong Vòng 1. */
export const NGAN_SACH_VONG2_MS = 24 * 3600_000

/**
 * Hạn Vòng 2 của một BTVN đang chia vòng — hạn MỀM, không thay hạn cứng.
 *
 * = xongVong1Luc + NGAN_SACH_VONG2_MS, nhưng KHÔNG BAO GIỜ muộn hơn hanChung:
 * hạn chung là thứ duy nhất máy chủ còn chặn nộp, hạn Vòng 2 chỉ đổi CHỮ hiện
 * trên bảng tin để nhắc em, không đổi luật nộp/chấm/thưởng.
 *
 * Thuần, không đọc Date.now(). xongVong1Luc hỏng/rỗng thì coi như chưa có mốc
 * riêng, trả nguyên hanChung.
 */
export function tinhHanVong2(xongVong1Luc: string, hanChung: string): string {
  const xongMs = mocThoiGian(xongVong1Luc)
  if (xongMs === undefined) return hanChung
  const han2Ms = xongMs + NGAN_SACH_VONG2_MS
  const hanChungMs = mocThoiGian(hanChung)
  return new Date(hanChungMs !== undefined && hanChungMs < han2Ms ? hanChungMs : han2Ms).toISOString()
}
