// Kiểu dữ liệu từng hiệu ứng ăn mừng (chỉ kiểu — xoá khi dịch, không thành mã). Phần tử nào thiếu (null) ⇒ hiệu ứng tự bỏ phần đó, không lỗi.

type Pt = Element | null | undefined

export interface DatSet {
  /** Chuỗi câu đúng liền (5, 10, 15 …) — mức sét theo số này. */
  chuoi: number
  /** Chỗ sét đánh vào (thẻ đáp án vừa đúng); thiếu ⇒ giữa màn, trên dải kết quả. */
  dich?: Pt
  /** Băng chữ «Phản ứng dây chuyền! ×5» ⇒ nảy quá đà lúc sét chạm. */
  chu?: Pt
  /** Khung nội dung rung lúc sét chạm (bản đầy đủ). */
  goc?: Pt
  /** Dải kết quả: sét dừng trên mép dải, màn tối KHÔNG phủ dải (nút «Tiếp tục» luôn sáng). */
  day?: Pt
  /** Rung máy (mặc định không — màn làm chặng đã rung theo mốc chuỗi). */
  rung?: boolean
}

export interface DatThe {
  /** Thẻ đáp án (ô phương án, ý đúng–sai, hàng ô trả lời ngắn). */
  the: Pt
  /** Bản nhẹ (nhiều thẻ cùng lúc, vd. bốn ý đúng–sai): không viền chạy, ít sao. */
  nhe?: boolean
}

export interface DatNguyenTu {
  /** Chỗ nguyên tử bay ra (thẻ vừa đúng / dấu của dải kết quả). */
  tu: Pt
  /** Bộ đếm nguyên tử (góc phải trên). */
  dich: Pt
  /** Số nguyên tử máy chủ cộng (chỉ để chọn số hạt bay — số trên bộ đếm do nơi gọi đổi). */
  N: number
  /** Gọi MỘT lần khi hạt cuối chạm bộ đếm (hoặc ngay nếu không bay được / bị huỷ) ⇒ nơi gọi cộng số. */
  onXong?: () => void
}

export interface DatLua {
  /** Ngọn lửa / ô số chuỗi ngày. */
  goc: Pt
  rung?: boolean
}

export interface DatChang {
  /** Khối giữa màn kết chặng (linh vật + tiêu đề «Xong chặng!»). */
  goc: Pt
  rung?: boolean
}

export interface DatRuong {
  /** Rương. */
  goc: Pt
  /** Nắp rương (bật lên theo lò xo); thiếu ⇒ cả rương nảy. */
  nap?: Pt
  /** Rung lắc lấy đà trước khi bật (mặc định có; nơi gọi đã tự lắc ⇒ false, chỉ bùng). */
  lac?: boolean
  rung?: boolean
}

export interface DatAnMung {
  set: DatSet
  dung: DatThe
  sai: DatThe
  'nguyen-tu': DatNguyenTu
  lua: DatLua
  chang: DatChang
  ruong: DatRuong
}
export type LoaiAnMung = keyof DatAnMung
