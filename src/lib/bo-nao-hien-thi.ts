// BỘ NÃO A.I — PHẦN HIỂN THỊ Ở MÁY EM / MÁY PHỤ HUYNH. Đề bài: prompt-bo-nao.md (CẬP NHẬT 3), cẩm nang bo-nao/HUONG-DAN-BO-NAO.md.
//
// Tệp THUẦN (không API trình duyệt): đọc phần lời nhắn từ phản hồi kế hoạch ngày của máy chủ thành kiểu chặt.
//  · HỌC SINH: `loiNhanHlv` — lời hôm nay + tối đa 7 lời gần nhất.
//  · PHỤ HUYNH: `boNaoAi { loiNhan, thuTuan, ngay }` — lời cho phụ huynh + thư tuần.
// Dạng trường CHƯA được Code 3 chốt hẳn ⇒ bộ đọc chịu cả `loiNhanHlv` dạng chuỗi trơn lẫn dạng đối tượng; thiếu/rỗng ⇒ KHÔNG
// hiện thẻ (không khung rỗng, không "chưa có lời"). Chạy thử (`cheDo:'bong'`) thì máy chủ không trả gì ⇒ cũng không thẻ.
//
// Lời do mô hình viết đã qua `kiemKhuon` ở máy chủ, nhưng máy em vẫn làm sạch: bỏ ký tự điều khiển, gọn khoảng trắng, chặn
// độ dài (không để một lời bất thường làm vỡ màn) — chữ luôn được vẽ như CHỮ (React), không bao giờ như HTML.

export const TOI_DA_LOI_GAN_DAY = 7
const TRAN_LOI = 400
const TRAN_THU = 1200

export interface LoiNhanNgay {
  /** "YYYY-MM-DD"; rỗng nếu máy chủ không gửi. */
  ngay: string
  loi: string
}

export interface BoNaoHocSinh {
  ngay: string
  loi: string
  /** Lời gần nhất, MỚI NHẤT TRƯỚC, gồm cả lời hôm nay, tối đa 7. */
  gan: LoiNhanNgay[]
}

export interface BoNaoPhuHuynh {
  ngay: string
  /** Lời hôm nay cho phụ huynh — có thể rỗng (chỉ có thư tuần). */
  loiNhan: string
  /** Thư tuần — có thể rỗng (chỉ có lời hôm nay). */
  thuTuan: string
  /** Ngày ĐẦU của tuần thư nói tới ("YYYY-MM-DD"), rỗng nếu máy chủ không gửi. */
  tuanTu: string
}

export interface BoNaoView {
  hs: BoNaoHocSinh | null
  ph: BoNaoPhuHuynh | null
}

export const KHONG_BO_NAO: BoNaoView = { hs: null, ph: null }

const laDoiTuong = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Làm sạch một đoạn chữ: bỏ ký tự điều khiển, gọn khoảng trắng THEO DÒNG (giữ xuống dòng), cắt tại `tran`. Rỗng ⇒ ''. */
export function lamSachLoi(v: unknown, tran = TRAN_LOI): string {
  if (typeof v !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (s.length <= tran) return s
  // cắt ở ranh giới câu/từ gần nhất, thêm dấu ba chấm — không cắt cụt giữa chữ
  const cat = s.slice(0, tran)
  // ƯU TIÊN dừng sau dấu kết câu (giữ dấu), rồi mới tới ranh giới từ; đều phải nằm ở 60% cuối của trần, không thì cắt cứng.
  const cauKet = Math.max(cat.lastIndexOf('. '), cat.lastIndexOf('! '), cat.lastIndexOf('? '))
  const tu = cat.lastIndexOf(' ')
  const dungTai = cauKet >= tran * 0.6 ? cauKet + 1 : tu >= tran * 0.6 ? tu : tran
  return `${cat.slice(0, dungTai).trimEnd()}…`
}

const ngayHopLe = (v: unknown): string => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.trim()) ? v.trim().slice(0, 10) : '')

function docMotLoi(v: unknown): LoiNhanNgay | null {
  if (typeof v === 'string') {
    const loi = lamSachLoi(v)
    return loi ? { ngay: '', loi } : null
  }
  if (!laDoiTuong(v)) return null
  const loi = lamSachLoi(v.loi ?? v.loiNhan ?? v.noiDung)
  return loi ? { ngay: ngayHopLe(v.ngay), loi } : null
}

/** Đọc `loiNhanHlv` (học sinh). null khi không có lời nào để hiện. */
export function docBoNaoHocSinh(raw: unknown): BoNaoHocSinh | null {
  const chinh = docMotLoi(raw)
  if (!chinh) return null
  const ganTho = laDoiTuong(raw) ? (raw.gan ?? raw.ganDay ?? raw.loiNhanGanDay) : undefined
  const ds: LoiNhanNgay[] = []
  if (Array.isArray(ganTho)) for (const g of ganTho) { const m = docMotLoi(g); if (m) ds.push(m) }
  // Lời hôm nay luôn đứng đầu danh sách; bỏ trùng đúng chữ (máy chủ hay lặp lời hôm nay trong `gan`).
  const gan = [chinh, ...ds.filter((d) => d.loi !== chinh.loi)].slice(0, TOI_DA_LOI_GAN_DAY)
  return { ngay: chinh.ngay, loi: chinh.loi, gan }
}

/** Đọc `boNaoAi` (phụ huynh). null khi CẢ lời lẫn thư tuần đều rỗng. */
export function docBoNaoPhuHuynh(raw: unknown): BoNaoPhuHuynh | null {
  if (!laDoiTuong(raw)) return null
  const loiNhan = lamSachLoi(raw.loiNhan ?? raw.loi)
  const thuTuan = lamSachLoi(raw.thuTuan ?? raw.thu, TRAN_THU)
  if (!loiNhan && !thuTuan) return null
  return { ngay: ngayHopLe(raw.ngay), loiNhan, thuTuan, tuanTu: ngayHopLe(raw.tuanTu) }
}

/** Đọc cả hai phần từ GỐC phản hồi `/hs/ke-hoach-ngay`. Phản hồi hỏng/thiếu ⇒ không có thẻ. */
export function docBoNao(khMayChu: unknown): BoNaoView {
  if (!laDoiTuong(khMayChu)) return KHONG_BO_NAO
  return { hs: docBoNaoHocSinh(khMayChu.loiNhanHlv), ph: docBoNaoPhuHuynh(khMayChu.boNaoAi) }
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const hai = (n: number): string => String(n).padStart(2, '0')

/** "YYYY-MM-DD" → "Thứ Hai 21/09". Sai khuôn ⇒ ''. Dùng lịch dương ghép từ chuỗi (không lệch múi giờ). */
export function ngayNganVi(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ngay)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (!Number.isFinite(d.getTime()) || d.getMonth() !== Number(m[2]) - 1) return ''
  return `${THU[d.getDay()]} ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}

/** "YYYY-MM-DD" của hôm nay theo giờ máy. */
export function ngayHomNay(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

/** Nhãn dưới tiêu đề thẻ: "Lời hôm nay · Thứ Hai 21/09"; lời của ngày khác thì "Lời ngày Thứ Hai 21/09" (không nhận là hôm nay). */
export function nhanNgayLoi(ngay: string, now: number, dau = 'Lời hôm nay'): string {
  const chu = ngayNganVi(ngay)
  if (!ngay) return dau
  return ngay === ngayHomNay(now) ? `${dau} · ${chu}` : `Lời ngày ${chu}`
}

/** "2026-09-14" → "14–20/09" (tuần 7 ngày; sang tháng thì "28/09–04/10"). Sai khuôn ⇒ ''. */
export function nhanTuan(tuanTu: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(tuanTu)
  if (!m) return ''
  const dau = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (!Number.isFinite(dau.getTime()) || dau.getMonth() !== Number(m[2]) - 1) return ''
  const cuoi = new Date(dau.getFullYear(), dau.getMonth(), dau.getDate() + 6)
  const dm = (d: Date) => `${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
  return dau.getMonth() === cuoi.getMonth() ? `${hai(dau.getDate())}–${dm(cuoi)}` : `${dm(dau)}–${dm(cuoi)}`
}
