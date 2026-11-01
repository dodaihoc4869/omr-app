// HÔM NAY · 4 BẢNG (thầy chốt bản vẽ 01/11, docs/ban-ve-hom-nay-4-bang-0111; sửa khi chốt: «bằng chứng ẩn phần cách tính đi, chỉ hiện các thông số sắc bén»).
// HỢP ĐỒNG KIỂU DỮ LIỆU dùng chung máy chủ (`server/src/bon-chi-so*.ts`) và app thầy (`src/components/hom-nay-thay/BonBang*.tsx`). Chỉ kiểu + hằng — không mã chạy.
//
// Bốn điểm 0–100 của MỖI em, cửa sổ 14 ngày TRỌN tới hết hôm qua (giờ VN):
//   · ht  Học thật   — sửa đúng câu từng sai · đọc đủ thời gian · đúng câu mới tự làm · kiểm tra khớp luyện tập. Vào bảng: ht ≥ 75 và dp < 30.
//   · dp  Học đối phó — chọn khi chưa đọc hết đề mà sai · bấm lặp một chữ · treo máy · xem lời giải trước · thuộc đáp án không hiểu · rời màn khi thi
//                      · luyện cao mà kiểm tra thấp. Vào bảng: dp ≥ 50.
//   · ch  Chăm       — ngày đủ mức · câu làm kỹ / câu được giao · chuỗi ngày đủ mức. Vào bảng: ch ≥ 75.
//   · lu  Lười       — 100 − ch. Vào bảng: lu ≥ 60.
// ht / dp = null khi chưa đủ dữ liệu (< 40 lượt làm câu có giây đo thật); ch / lu = null khi < 3 ngày phải làm.

export type MaBang = 'ht' | 'dp' | 'ch' | 'lu'
export const THU_TU_BANG: readonly MaBang[] = ['ht', 'dp', 'ch', 'lu']
export const TEN_BANG: Readonly<Record<MaBang, string>> = { ht: 'Học thật', dp: 'Học đối phó', ch: 'Chăm', lu: 'Lười' }
/** Ngưỡng vào bảng (xem đầu tệp). */
export const NGUONG_BANG = { ht: 75, htDpDuoi: 30, dp: 50, ch: 75, lu: 60 } as const
export const SO_NGAY_BON = 14
export const LUOT_TOI_THIEU_BON = 40

export interface DiemBon {
  ht: number | null
  dp: number | null
  ch: number | null
  lu: number | null
}

/** Một dòng trong bảng xếp hạng. `bc` = MỘT bằng chứng sắc nhất của em cho ĐÚNG bảng ấy (chuỗi ngắn, phần cần nhấn bọc **…**). */
export interface DongBang {
  sbd: string
  hoTen: string
  lop: string
  khoi: string
  diem: number
  bc: string
}

export interface TraLoiBonBang {
  ok: true
  /** Ngày cuối của cửa sổ (hôm qua, giờ VN) + ngày đầu. */
  tu: string
  den: string
  /** Lúc bản tính MỚI NHẤT trong số các em (ISO). */
  tinhLuc: string
  /** Số em đã tính / tổng số em đang học (đang tính dần ⇒ < tong). */
  daTinh: number
  tong: number
  bang: Record<MaBang, DongBang[]>
  /** Trung vị cả lớp (mọi em đủ dữ liệu) từng điểm — vạch xám ở trang bằng chứng. */
  trungVi: DiemBon
}

/** Một ví dụ cụ thể có ngày giờ (bằng chứng «tâm phục khẩu phục»). */
export interface ViDuBon {
  /** ISO lúc làm. */
  luc: string
  /** «Bài 7 · Fe và Cu tác dụng với HCl» — tên bài + đầu đề (máy chủ tra từ mã câu); thiếu ⇒ «Câu <số>». */
  cau: string
  /** Dòng phụ: «đề 64 chữ ⇒ cần ít nhất 16 giây để đọc». */
  phu: string
  /** Kết quả: «chọn sau 3 giây · B · sai». */
  kq: string
  dung: boolean | null
}

/** Một thẻ bằng chứng. `so` + `lop` = thanh «Em / Cả lớp» (0–100, %). */
export interface TheBangChung {
  ma: string
  tieu: string
  /** Con số lớn: «88/191», «71% → 3,5». `nhoSo` = chữ nhỏ cạnh («lượt · 46%»). */
  lon: string
  nhoSo?: string
  so?: number
  lop?: number
  /** Chuỗi chữ cái bấm lặp + vị trí câu đúng trong chuỗi. */
  chuoi?: { chu: string; dung: number[] }
  /** Hai ô so sánh (luyện tập ↔ kiểm tra). `lech` = ô tô đỏ. */
  hai?: { nhan: string; so: string; phu: string; lech?: boolean }[]
  viDu?: ViDuBon[]
  /** Một câu chốt bằng số dưới thẻ. */
  chu?: string
}

export interface NgayBon {
  ngay: string
  muc: number
  /** Câu làm kỹ / câu chọn khi chưa đọc hết đề (Mức 1) — cột chồng 14 ngày. */
  ky: number
  voi: number
}

export interface TraLoiBangChung {
  ok: true
  em: { sbd: string; hoTen: string; lop: string }
  tu: string
  den: string
  tinhLuc: string
  diem: DiemBon
  trungVi: DiemBon
  /** Số lượt làm câu trong cửa sổ. */
  soLuot: number
  /** Bảng thầy bấm vào (để kết luận + thứ tự thẻ) và hạng của em trong bảng ấy (null = em không ở bảng ấy). */
  bang: MaBang
  hang: { thu: number; tong: number } | null
  /** Câu kết luận, phần nhấn bọc **…**. */
  ketLuan: string
  the: TheBangChung[]
  ngay: NgayBon[]
}

export type LoiBon = { ok: false; error: string }
