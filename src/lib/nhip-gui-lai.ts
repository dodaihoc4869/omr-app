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
