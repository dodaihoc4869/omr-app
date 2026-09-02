// GIỜ MÁY CHỦ LÀ NGUỒN THỜI GIAN DUY NHẤT (QUANLYCATHI.md mục 3). Máy học
// sinh chỉ hiển thị: mỗi lần máy chủ trả `serverNow` (vaoThi, examStatus 10
// giây/lần, submit) thì hiệu chỉnh lại mốc. Giữa hai lần hiệu chỉnh, thời gian
// trôi = MAX(đồng hồ tường, đồng hồ đơn điệu performance.now()):
//   - em chỉnh giờ điện thoại LÙI lại → Date.now() nhỏ đi nhưng performance.now()
//     vẫn tăng → lấy performance.now() → không kéo dài được bài;
//   - máy ngủ sâu làm performance.now() đứng yên → Date.now() lớn hơn → lấy
//     Date.now() → đồng hồ không bị chậm.
// Chỉnh giờ TIẾN lên chỉ làm em mất giờ (tự hại), không cần chặn.
// Thuần logic, không DOM — có test ở tests/gio-may-chu.test.ts.

interface Moc {
  serverMs: number
  wallMs: number
  perfMs: number
}

let moc: Moc | null = null

function perfNow(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
}

/** Ghi nhận giờ máy chủ vừa nhận (ms epoch). Bỏ qua giá trị không hợp lệ. */
export function dongBoGioMayChu(serverMs: number): void {
  if (!Number.isFinite(serverMs) || serverMs <= 0) return
  moc = { serverMs, wallMs: Date.now(), perfMs: perfNow() }
}

/** Đã có mốc giờ máy chủ chưa (chưa có → gioMayChu() trả giờ máy em). */
export function daDongBoGio(): boolean {
  return moc !== null
}

/** Giờ máy chủ ước lượng hiện tại (ms epoch). */
export function gioMayChu(): number {
  if (!moc) return Date.now()
  const troiWall = Date.now() - moc.wallMs
  const troiPerf = perfNow() - moc.perfMs
  return moc.serverMs + Math.max(troiWall, troiPerf, 0)
}

/** Chỉ dùng cho test: xoá mốc. */
export function _resetGioMayChu(): void {
  moc = null
}

/** Số giây còn lại tới mốc hết giờ (ISO máy chủ) — âm nếu đã quá. */
export function giayConLai(hetGioLucIso: string): number {
  const het = new Date(hetGioLucIso).getTime()
  if (!Number.isFinite(het)) return 0
  return (het - gioMayChu()) / 1000
}

/** Định dạng giờ HH:mm (kèm ngày nếu khác hôm nay) cho thông báo — hiển thị theo múi giờ máy em. */
export function gioNgan(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const gio = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const homNay = new Date(gioMayChu())
  const cungNgay = d.getFullYear() === homNay.getFullYear() && d.getMonth() === homNay.getMonth() && d.getDate() === homNay.getDate()
  return cungNgay ? gio : `${gio} ngày ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
}
