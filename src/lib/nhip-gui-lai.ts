// NHỊP GỬI LẠI KHI NỘP BÀI HỎNG — một nguồn sự thật, tách ra để kiểm bằng số.
//
// VÌ SAO CÓ TỆP NÀY (thầy báo 10/09: "học sinh nộp vẫn bị treo").
//
// Đường nộp cũ thử lại bằng `setInterval(..., 15000)`. Ba chỗ hỏng cùng lúc, và
// chúng cộng hưởng với nhau:
//
//   ① `setInterval` KHÔNG đợi lượt trước xong. Một lượt nộp có hạn chờ 25 giây,
//      mà nhịp thử lại là 15 giây ⇒ lượt sau chồng lên lượt trước còn đang chạy.
//      Chờ một phút là mỗi máy ôm bốn lượt song song.
//   ② NHỊP CỐ ĐỊNH nghĩa là CẢ LỚP thử lại cùng một khoảnh khắc. Hết giờ thì ba
//      mươi sáu máy tự nộp trong cùng một giây, hỏng thì mười lăm giây sau lại
//      cùng nhau đập vào máy chủ lần nữa.
//   ③ KHÔNG CÓ ĐIỂM DỪNG: hỏng mãi thì thử mãi, mỗi lần lại thêm lượt chồng.
//
// Cộng lại thành bão gửi lại: máy chủ càng nghẹn thì càng nhiều lượt hết hạn,
// càng nhiều lượt hết hạn thì càng nhiều lượt thử lại. Em ngồi nhìn dòng "Đang
// gửi lên hệ thống…" không bao giờ tắt — đúng cái thầy gọi là treo.
//
// Chữa bằng ba luật dưới đây. Cùng thuốc màn Phòng chờ đã dùng từ 09/09, chỉ là
// hồi đó chưa ai mang sang đường nộp.

/** Lệch pha tối đa, cùng hằng với `LECH_PHA` của `exam-api`. */
export const LECH_PHA_GUI_LAI = 0.4

/** Chờ lần đầu, mili giây. Ngắn — phần lớn ca hỏng là chập mạng một nhịp. */
export const CHO_DAU_MS = 4000

/** Trần chờ. Quá mức này thì thử dày hơn cũng không giúp, chỉ tốn pin và mạng. */
export const CHO_TOI_DA_MS = 60000

/** Hệ số giãn mỗi lần hỏng. */
export const HE_SO_GIAN = 2

/** LÙI DẦN CÓ LỆCH PHA. `lanHong` đếm từ 0 (vừa hỏng lần đầu).
 *
 * Không lệch pha thì cả lớp vẫn thử lại cùng một khoảnh khắc, chỉ là thưa hơn —
 * bão nhỏ lại chứ không hết. Lệch pha rải ba mươi sáu máy ra một khoảng rộng. */
export function choBaoLau(lanHong: number, nn: () => number = Math.random): number {
  const nen = Math.min(CHO_TOI_DA_MS, CHO_DAU_MS * Math.pow(HE_SO_GIAN, Math.max(0, lanHong)))
  return Math.round(nen * (1 + nn() * LECH_PHA_GUI_LAI))
}

/** GIÃN CÚ NỘP TỰ ĐỘNG LÚC HẾT GIỜ.
 *
 * Hết giờ là mốc CHUNG của cả ca: mọi máy đếm về 0 trong cùng một giây rồi cùng
 * bắn một lượt POST. Bài đã lưu xong trên máy em TRƯỚC khi gọi mạng, nên hoãn
 * vài giây không mất gì của em, mà máy chủ đỡ hẳn một cú dồn.
 *
 * Trần 2,5 giây: đủ rải một lớp ba mươi sáu máy, và ngắn hơn nhiều so với một
 * lượt gọi (~1,3–4,4 giây) nên em không thấy chậm. */
export const GIAN_NOP_TOI_DA_MS = 2500

export function gianNopTuDong(nn: () => number = Math.random): number {
  return Math.round(nn() * GIAN_NOP_TOI_DA_MS)
}

/** GIÃN CÚ VÀO THI — KHACPHUCTREOHANGLOAT.md T5, "biến cú húc cửa thành dòng chảy".
 *
 * Thầy hô "vào thi đi" và ba mươi máy bấm trong hai giây. `vaoThi` là lệnh NẶNG
 * NHẤT của cả ca — nó phải cầm khoá toàn cục để ghi dòng lượt — nên đúng khoảnh
 * khắc ấy là lúc dễ tắc nhất.
 *
 * Trần 3 giây: rải đủ một lớp, và ngắn hơn chính một lượt gọi (1,3–4,4 giây)
 * nên em không cảm thấy chậm hơn — em vẫn đang nhìn dòng "Đang vào phòng thi…"
 * mà trước đây cũng phải nhìn.
 *
 * Chỉ giãn LƯỢT ĐẦU. Em bấm lại sau khi hỏng thì vào thẳng: lúc ấy em đang chờ
 * và đám đông đã tan. */
export const GIAN_VAO_THI_TOI_DA_MS = 3000

export function gianVaoThi(nn: () => number = Math.random): number {
  return Math.round(nn() * GIAN_VAO_THI_TOI_DA_MS)
}

/** GIÃN CÚ VÀO THI SAU KHI THẦY BẤM BẮT ĐẦU — cú dồn LỚN NHẤT của cả ca.
 *
 * Thầy báo 11/09: "bấm duyệt bắt đầu ở phòng chờ, rất chậm và học sinh bị văng
 * ra thử lại nhiều lần".
 *
 * ĐÂY LÀ CÚ DỒN TỆ NHẤT, tệ hơn hẳn lúc em tự bấm Vào thi, và vì một lý do
 * ĐÚNG NGƯỢC với trực giác: em tự bấm thì rải ra theo tay từng em, còn ở phòng
 * chờ thì MÁY bấm hộ. Ba mươi máy đang hỏi `trangThaiPhongCho` mỗi 3 giây, thầy
 * bấm một cái là trong vòng đúng một nhịp 3 giây cả ba mươi máy cùng thấy
 * `batDau` và cùng gọi `vaoThi` — mà `vaoThi` là lệnh DUY NHẤT phải cầm khoá
 * toàn cục để ghi dòng lượt. Ba mươi lượt ghi nối đuôi nhau, em cuối hàng hết
 * hạn chờ, bị ném về màn nhập mã, phải tự bấm lại — rồi lượt bấm lại ấy nối vào
 * cuối chính hàng đợi đang tắc.
 *
 * Cửa sổ 8 giây, KHÔNG phải 3: ba mươi em rải trong 8 giây là ~4 lượt/giây,
 * vừa đúng sức nuốt của khoá (mỗi lượt giữ khoá 0,3–0,5 giây). Rải trong 3 giây
 * thì vẫn còn 10 lượt/giây, tức vẫn dồn.
 *
 * Tám giây KHÔNG làm em thiệt: đồng hồ của em chỉ chạy từ lúc máy chủ tạo lượt,
 * nên chờ ở đây không ăn vào giờ làm bài của ai. */
export const GIAN_VAO_SAU_BAT_DAU_MS = 8000

export function gianVaoSauBatDau(nn: () => number = Math.random): number {
  return Math.round(nn() * GIAN_VAO_SAU_BAT_DAU_MS)
}

/** LỖI NÀY CÓ PHẢI "MÁY CHỦ ĐANG ĐÔNG" KHÔNG — dùng để quyết định có tự thử
 * lại hộ em hay không.
 *
 * Chỉ đúng với lỗi ĐƯỜNG TRUYỀN và lỗi HÀNG ĐỢI. Em bị chặn vì sai số báo
 * danh, vì ca đã khoá, vì đã nộp rồi — thử lại là hành em sáu lần rồi vẫn ra
 * đúng câu ấy, mà mỗi lượt lại thêm một lượt gọi vào đúng lúc đang tắc. */
export function laLoiDongNguoi(loi: string): boolean {
  const s = String(loi || '')
  return (
    s.includes('Không kết nối được máy chủ') ||
    s.includes('không trả lời sau') ||
    s.includes('đang bận') ||
    s.includes('Failed to fetch') ||
    s.includes('NetworkError') ||
    s.includes('Load failed') ||
    s.includes('HTTP 5') ||
    s.includes('Máy chủ chưa gửi đề')
  )
}
