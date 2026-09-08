// HAI CON SỐ TRÊN CÙNG MÀN, ĐO HAI THỨ KHÁC NHAU — PHẢI GỌI ĐÚNG TÊN.
//
// Thầy đọc màn Ca thi 638242 và bắt được: biên bản ghi "rút được 8" nhưng khối
// đỏ ngay dưới ghi "hỏi lại 9 câu". Kiểm lại: CẢ HAI ĐỀU ĐÚNG, chỉ là đếm hai
// tập khác nhau.
//
//   · "rút được 8"  = số câu máy CHỦ ĐỘNG rút lại từ ca trước, ghi trong biên
//                     bản lúc rút đề.
//   · "hỏi lại 9"   = số câu trong ĐỀ CỦA EM mà em từng sai. Bao gồm cả câu
//                     lọt vào đề theo lượt rút thường (ca 638242: câu
//                     12-C1-B1-II-3), không phải máy cố ý hỏi lại.
//
// Hai nhãn cũ đều gọi là "câu hỏi lại" nên đọc như một con số bị sai. Sửa bằng
// cách gọi đúng tên, KHÔNG bằng cách ép hai số bằng nhau — ép là mất thông tin.

export interface SoCauHoiLai {
  /** Câu trong đề của em mà em từng sai (gồm cả câu tự vào đề). */
  tong: number
  /** Trong số đó, em làm đúng lần này. */
  daSua: number
  /** Trong số đó, em vẫn sai. */
  saiLai: number
  /** Số câu biên bản ghi là máy CHỦ ĐỘNG rút lại. `null` = máy này không giữ
   * biên bản (thầy bấm Bắt đầu ở máy khác). */
  rutChuDong: number | null
}

/** Dòng chữ dưới tên em trong khối đỏ. */
export function dongSoCauHoiLai(s: SoCauHoiLai): string {
  const dau = `${s.tong} câu em từng sai có trong đề này · sửa được ${s.daSua} · còn sai ${s.saiLai}`
  if (s.rutChuDong === null || s.rutChuDong === s.tong) return dau
  const tu = s.tong - s.rutChuDong
  if (tu > 0) return `${dau} (máy chủ động rút lại ${s.rutChuDong}, ${tu} câu còn lại tự vào đề)`
  // rutChuDong > tong: máy rút nhiều hơn số câu đếm được trong đề của em — chỉ
  // xảy ra khi máy này chấm bằng bản đồ thiếu. Nói thẳng chứ không giấu.
  return `${dau} (biên bản ghi rút ${s.rutChuDong} — máy này chỉ soi được ${s.tong} câu trong đề)`
}
