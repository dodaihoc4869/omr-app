// Hợp đồng `POST /ph/bon-so-do` (máy chủ server/src/ph-bon-so-do.ts) — 4 số đo của con cho trang «Một trang về con» (thầy chốt 01/11).
export type MaSoDo = 'ht' | 'dp' | 'ch' | 'lu'

/** Một bằng chứng đã dịch sang lời phụ huynh: con số lớn + câu; ví dụ có giờ (nếu có). */
export interface BangChungPh {
  so: string
  chu: string
  /** Nhãn ngắn (≤ 24 ký tự) cho ô trên trang: «9/11 câu sai đã tự sửa». */
  ngan: string
  vd?: { luc: string; chu: string }
}

/** Một ngày trong cửa sổ 14 ngày: mức câu phải làm, câu làm kỹ, câu chọn vội (khi chưa đọc hết đề). */
export interface NgaySoDo { ngay: string; muc: number; ky: number; voi: number }

export type TraLoiBonSoDo =
  | { ok: true; co: false }
  | {
      ok: true
      co: true
      /** Lúc máy chủ tính (ISO); cửa sổ `tu`…`den` (YYYY-MM-DD, 14 ngày trọn tới hết hôm qua). */
      tinhLuc: string
      tu: string
      den: string
      soLuot: number
      /** Điểm 0–100; null = chưa đủ dữ liệu (dưới 40 lượt / dưới 3 ngày phải làm). */
      diem: Record<MaSoDo, number | null>
      bangChung: Record<MaSoDo, BangChungPh[]>
      ngay: NgaySoDo[]
    }
