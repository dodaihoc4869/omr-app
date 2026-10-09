// Trung tu giao diện thầy duyệt 09/10: BA mục Hôm nay · Tiến bộ · Ca kiểm tra; "Nhận xét của thầy" là màn con mở từ Hôm nay (`#loi-thay`).
// Nguồn đọc và quyền công bố được giữ; khối vắng dữ liệu không dựng số minh họa.
import type { DiemTienBo, PhMoi } from '../../lib/ph-moi/du-lieu'
import { tachVn, thuTuChuoiNgay } from '../../lib/ph-moi/dinh-dang'

// BA mục trên thanh: Hôm nay · Tiến bộ · Ca kiểm tra ("Lịch sử"/"Điểm số" là tên cũ của "Ca kiểm tra"). Hai màn con không nằm trên thanh:
// `loi-thay` (Nhận xét của thầy — mở từ Hôm nay, có nút quay lại) và `thong-tin` (mở từ menu Tài khoản).
export type Muc = 'hom-nay' | 'tien-bo' | 'ca-kiem-tra' | 'loi-thay' | 'thong-tin'
export type Tuyen = { muc: Muc; maCa: string | null }

/** `#ca/<mã>` ⇒ màn chi tiết ca (thuộc mục Ca kiểm tra); hash lạ ⇒ Hôm nay. Liên kết cũ còn lưu: `#diem`, `#lich-su` ⇒ Ca kiểm tra; `#loi-thay` ⇒ màn con Nhận xét của thầy. */
export function docTuyen(hash: string): Tuyen {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('ca/')) {
    let ma = ''
    try {
      ma = decodeURIComponent(h.slice(3)).trim()
    } catch {
      ma = ''
    }
    if (ma) return { muc: 'ca-kiem-tra', maCa: ma }
  }
  if (h === 'ca-kiem-tra' || h === 'diem') return { muc: 'ca-kiem-tra', maCa: null }
  if (h === 'thong-tin') return { muc: 'thong-tin', maCa: null }
  if (h === 'loi-thay') return { muc: 'loi-thay', maCa: null }
  if (h === 'lich-su') return { muc: 'ca-kiem-tra', maCa: null }
  if (h === 'tien-bo') return { muc: 'tien-bo', maCa: null }
  return { muc: 'hom-nay', maCa: null }
}
export const lienKetCa = (maCa: string): string => `#ca/${encodeURIComponent(maCa)}`

/** Hạn nộp theo ngày (YYYY-MM-DD, hết lúc 23:59 giờ VN): "23:59 · Thứ Tư 30/09/2026". Sai dạng ⇒ "". */
export function chuHanNgay(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? `23:59 · ${thuTuChuoiNgay(ngay)} ${m[3]}/${m[2]}/${m[1]}` : ''
}

export const TEN_PHAN: Record<'I' | 'II' | 'III', string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

const hai = (n: number) => String(n).padStart(2, '0')
/** Mục trên thanh đang sáng cho một tuyến: màn con Nhận xét của thầy thuộc Hôm nay; chi tiết ca thuộc Ca kiểm tra; Thông tin không thuộc mục nào. */
export function mucSang(t: Tuyen): Muc | null {
  if (t.muc === 'loi-thay') return 'hom-nay'
  if (t.muc === 'thong-tin') return null
  return t.muc
}
/** Khoá chỗ cuộn của một tuyến: ba mục giữ chỗ riêng; màn con (chi tiết ca, nhận xét, thông tin) mở lại luôn từ đầu. */
export const khoaCuon = (t: Tuyen): string => (t.maCa ? `ca/${t.maCa}` : t.muc)
export const laManCon = (t: Tuyen): boolean => !!t.maCa || t.muc === 'loi-thay' || t.muc === 'thong-tin'

const chuoiNgay = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${hai(d.getUTCMonth() + 1)}-${hai(d.getUTCDate())}`
}

/** Bảy ngày (Thứ Hai → Chủ nhật, "YYYY-MM-DD") của TUẦN chứa `nowMs` theo giờ VN + vị trí hôm nay (0 = Thứ Hai). Mốc hỏng ⇒ rỗng. */
export function tuanNay(nowMs: number): { ngay: string[]; homNay: number } {
  const t = tachVn(nowMs)
  if (!t) return { ngay: [], homNay: -1 }
  const homNay = (t.thu + 6) % 7
  const thu2 = Date.UTC(t.y, t.m - 1, t.d) - homNay * 86_400_000
  return { ngay: Array.from({ length: 7 }, (_, i) => chuoiNgay(thu2 + i * 86_400_000)), homNay }
}

/**
 * Điểm các ca ĐÃ công bố (cũ → mới) — MỘT nguồn cho đồ thị ở Tiến bộ và danh sách ở Ca kiểm tra: `tienBo.diem` của máy chủ (tối đa 8 ca).
 * Ca gần nhất ĐÃ công bố mà máy chủ chưa đưa vào `tienBo.diem` (máy chủ cũ / ca vừa công bố) ⇒ thêm vào cuối, không để màn nói "chưa có ca".
 */
export function diemCacCa(pm: PhMoi): DiemTienBo[] {
  const ds: DiemTienBo[] = [...(pm.tienBo?.diem ?? [])]
  const ca = pm.caGanNhat
  const t = ca ? tachVn(ca.nopLuc) : null
  if (ca?.ketQua && ca.ketQua.tong !== null && t && !ds.some((d) => d.maCa === ca.maCa))
    ds.push({ ngay: `${t.y}-${hai(t.m)}-${hai(t.d)}`, diem: ca.ketQua.tong, maCa: ca.maCa, tenCa: ca.tenCa })
  return ds
}

// Thầy 28/09: phụ huynh chỉ thấy "Thầy Đỗ Đại Học" — bộ lọc dùng chung với app học sinh + máy chủ.
export { chuThay } from '../../lib/chu-thay'
