// XEM LẠI LIVE — MÁY EM: ghép chữ hiện (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 2.1, 4.6). Thuần, không DOM.
// Tên bài / tên đoạn do máy chủ ghép sẵn trong `buoi.json` (`tenTuDong`, `tenThay`, `doan[].ten`); tệp này chỉ ghép ngày, lớp, số liệu quanh tên ấy.
// Giờ Việt Nam tính tay (UTC + 7, không đổi giờ mùa) ⇒ không phụ thuộc múi giờ của máy em, test chạy ở đâu cũng ra cùng chữ.
import type { BuoiLiveDs, BuoiLiveJson, CauBuoiLive } from '../../../lib/live/xem-lai-kieu'

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const THU_NGAN = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'] as const
/** Màu đội theo chỉ số đội 0..3 (đúng thứ tự `DOI_BPU`: Natri · Kali · Đồng · Canxi). Chép 4 tên biến để mảnh này không kéo cả lõi phòng. */
export const MAU_DOI = ['--p-cam', '--p-tim-2', '--p-xanh', '--p-do'] as const
export const mauDoi = (doi: number | null | undefined): string => `var(${(doi != null && MAU_DOI[doi]) || '--tr-hs-nut'})`

type BuoiTen = Pick<BuoiLiveDs, 'ngay' | 'lop' | 'tenTuDong' | 'tenThay'>

/** `YYYY-MM-DD` ⇒ thứ, ngày, tháng, năm. Chuỗi hỏng ⇒ null. */
export function tachNgay(ngay: string): { thu: string; thuNgan: string; dd: string; mm: string; nam: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(ngay ?? ''))
  if (!m) return null
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!)).getUTCDay()
  return { thu: THU[d]!, thuNgan: THU_NGAN[d]!, dd: m[3]!, mm: m[2]!, nam: m[1]! }
}
/** Tên bài là dòng lớn của thẻ: tên thầy đặt ⇒ tên tự động ⇒ «Buổi live 12A1». */
export function tenBai(b: BuoiTen): string {
  return (b.tenThay ?? '').trim() || (b.tenTuDong ?? '').trim() || (b.lop ? `Buổi live ${b.lop}` : 'Buổi live')
}
/** «Thứ Ba 10/11/2026 · 12A1» (dòng phụ của thẻ / bìa). */
export function dongNgay(b: BuoiTen): string {
  const n = tachNgay(b.ngay)
  return [n ? `${n.thu} ${n.dd}/${n.mm}/${n.nam}` : '', b.lop].filter(Boolean).join(' · ')
}
/** Giờ Việt Nam «19:34» của một mốc ISO; hỏng ⇒ ''. */
export function gioVn(iso: string | null | undefined): string {
  const t = Date.parse(String(iso ?? ''))
  if (!Number.isFinite(t)) return ''
  const d = new Date(t + 7 * 3600_000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
/** Số phút hiện cho em (ít nhất 1). */
export const soPhut = (giay: number): number => Math.max(1, Math.round((Number(giay) || 0) / 60))
/** Tên đầy đủ theo luật mục 4.6: «Thứ Ba 10/11 · 12A1 · Bài 8. Amine · 5 câu · 48 phút» (nhãn đọc màn hình, dòng xem đủ khi tên bị cắt). */
export function tenDayDu(b: BuoiTen & { soCau: number; giayLive: number }): string {
  const n = tachNgay(b.ngay)
  return [n ? `${n.thu} ${n.dd}/${n.mm}` : '', b.lop, tenBai(b), `${b.soCau} câu`, `${soPhut(b.giayLive)} phút`].filter(Boolean).join(' · ')
}
/** Nhãn nhóm tháng của danh sách: «Tháng 11» (khác năm đang xem ⇒ «Tháng 11/2025»). */
export function nhanThang(ngay: string, namNay: number): string {
  const n = tachNgay(ngay)
  if (!n) return 'Buổi cũ'
  return `Tháng ${+n.mm}${+n.nam === namNay ? '' : `/${n.nam}`}`
}
/** Mốc trên trục tiếng ⇒ «4:12» / «1:02:07». */
export function gioPhat(ms: number): string {
  const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), g = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${g}` : `${m}:${g}`
}
/** Tên gọi hai chữ cuối («Trần Minh Anh» ⇒ «Minh Anh»). */
export const tenGoi = (ten: string): string => { const p = String(ten ?? '').trim().split(/\s+/); return p.slice(-2).join(' ') }
/** Tỉ lệ lớp làm đúng (số nguyên %); chưa em nào gửi ⇒ null. */
export const tiLeDung = (c: Pick<CauBuoiLive, 'soDung' | 'soGui'>): number | null => (c.soGui > 0 ? Math.round((c.soDung * 100) / c.soGui) : null)
/** Chữ loại câu như màn làm bài. */
export const loaiCau = (c: Pick<CauBuoiLive, 'phan' | 'tuLuan'>): string => (c.tuLuan ? 'Tự luận' : c.phan === 'I' ? 'Trắc nghiệm' : c.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn')
/** Đáp án đúng viết cho em đọc: Phần II «a) Đúng · b) Sai …», còn lại giữ nguyên chuỗi. */
export function chuDapAn(c: Pick<CauBuoiLive, 'phan' | 'dung'>): string {
  const d = String(c.dung ?? '').trim()
  if (c.phan !== 'II') return d
  return d.toUpperCase().split('').slice(0, 4).map((x, i) => `${'abcd'[i]}) ${x === 'D' || x === 'Đ' ? 'Đúng' : 'Sai'}`).join(' · ')
}
/** Dòng số liệu của một buổi trong `buoi.json` (bìa trang buổi). */
export const soLieuBuoi = (b: BuoiLiveJson): { cau: number; phutLive: number; doan: number; phutDoan: number } =>
  ({ cau: b.cau.length, phutLive: soPhut(b.msLive / 1000), doan: b.doan.length, phutDoan: soPhut(b.msDoan / 1000) })
