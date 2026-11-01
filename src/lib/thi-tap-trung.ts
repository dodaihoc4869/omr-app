// THI TẬP TRUNG (thầy 01/11: «Thanh màu xanh đồng hồ và nút hơi rối, khi vào kiểm tra thì ẩn hết đi. Lúc nào 15 phút cuối, 5 phút cuối, 1 phút cuối
// thì hiện thời gian lên tinh tế đẹp mắt báo một lần rồi lại ẩn đi. Tôi muốn full màn hình để hs kiểm tra cho tập trung»).
// Lõi THUẦN của lời báo giờ ở khung ca thi kiểu Duo (components/kiem-tra-duo/ThiDuo.tsx — mảnh nạp lười, tệp này chỉ mảnh ấy nhập ⇒ không cộng byte
// đường /t). CHỈ TRÌNH BÀY: không đụng đồng hồ, hết giờ, tự nộp — đọc giây còn lại từ kho giờ màn thi đưa xuống.
// Thầy chốt lại mốc cùng ngày 01/11: 12 phút · 6 phút · 1 phút (thay 15 · 5 · 1).

/** Ba mốc báo (giây còn lại): 12 phút · 6 phút · 1 phút. */
export const MOC_BAO_GIO = [720, 360, 60] as const
/** Qua mốc chưa quá chừng này giây vẫn báo (nhịp đồng hồ 1 giây, máy chậm / màn tạm ẩn có thể nhảy vài nhịp); quá rồi thì thôi — báo muộn vô ích. */
export const GIAY_CUA_SO_BAO = 20
/** Vào bài mà còn KHÔNG QUÁ mốc + chừng này giây ⇒ bỏ mốc ấy (vừa vào đã sát mốc — báo ngay lúc mở đề là thừa; ca 12 phút không báo «Còn 12 phút»). */
export const GIAY_SAT_MOC_LUC_VAO = 30
/** Lời báo hiện bao lâu (khớp hoạt ảnh `duo-kt-bao` ở trong-kiem-tra.css). */
export const MS_HIEN_BAO = 4000
/** Chạm tay nắm / vuốt từ mép trên ⇒ thanh trên hiện bấy lâu rồi tự ẩn. */
export const MS_HIEN_TREN = 5000

/** Mốc cần báo NGAY (giây) hoặc null.
 *  - `giayNay`: giây còn lại bây giờ; `giayLucVao`: giây còn lại lúc em vào bài (lượt này);
 *  - `daBao`: các mốc ĐÃ báo của lượt (nhớ qua tải lại) — mỗi mốc một lần;
 *  - hết giờ / số hỏng ⇒ không báo. */
export function mocCanBao(giayNay: number, giayLucVao: number, daBao: readonly number[]): number | null {
  if (!Number.isFinite(giayNay) || giayNay <= 0) return null
  for (const moc of MOC_BAO_GIO) {
    if (daBao.includes(moc)) continue
    if (!(giayLucVao > moc + GIAY_SAT_MOC_LUC_VAO)) continue
    if (giayNay <= moc && giayNay > moc - GIAY_CUA_SO_BAO) return moc
  }
  return null
}

/** «Còn 12 phút» · «Còn 6 phút» · «Còn 1 phút». */
export function chuBaoGio(moc: number): string {
  return `Còn ${Math.round(moc / 60)} phút`
}

/** Sổ báo giờ của MỘT lượt: giây còn lại lúc vào (lần đầu thấy lượt) + mốc đã báo. Chỉ giữ lượt gần nhất (một khoá, không đẻ rác). */
export interface SoBaoGio { vao: number; da: number[] }
const KHOA_SO = 'omr_bao_gio_thi'
type KhoChu = Pick<Storage, 'getItem' | 'setItem'>
const khoMacDinh = (): KhoChu | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

/** Đọc sổ của lượt `luot`; chưa có (lượt mới / bộ nhớ hỏng) ⇒ sổ mới với `vao` = giây còn lại bây giờ (và ghi lại ngay). */
export function docSoBao(luot: string, giayNay: number, kho: KhoChu | null = khoMacDinh()): SoBaoGio {
  try {
    const s = JSON.parse(kho?.getItem(KHOA_SO) || 'null') as { l?: unknown; v?: unknown; d?: unknown } | null
    if (s && s.l === luot && typeof s.v === 'number' && Array.isArray(s.d)) return { vao: s.v, da: s.d.filter((x): x is number => typeof x === 'number') }
  } catch { /* sổ hỏng ⇒ sổ mới */ }
  const so: SoBaoGio = { vao: giayNay, da: [] }
  ghiSoBao(luot, so, kho)
  return so
}

export function ghiSoBao(luot: string, so: SoBaoGio, kho: KhoChu | null = khoMacDinh()): void {
  try { kho?.setItem(KHOA_SO, JSON.stringify({ l: luot, v: so.vao, d: so.da })) } catch { /* chặn bộ nhớ ⇒ chỉ nhớ trong phiên */ }
}
