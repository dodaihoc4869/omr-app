// ĐỐI CHIẾU PHÒNG CHỜ VỚI ĐƯỜNG CŨ — chặn cú treo cả lớp, 11/09.
//
// LỖ HỔNG ĐƯỢC BỊT Ở ĐÂY, tìm ra trước ca thi 18h:
//
// `batDauThi` gọi Apps Script trước, rồi đẩy mốc bắt đầu sang máy chủ mới
// TRONG MỘT `try {} catch {}` KHÔNG ĐỌC KẾT QUẢ. Lượt đẩy ấy trượt — chập mạng
// một nhịp là đủ — thì:
//
//   · Apps Script: ca ĐÃ bắt đầu. Thầy nhìn màn Theo dõi thấy "đã bắt đầu".
//   · D1:          `bat_dau_thi_luc` vẫn RỖNG.
//   · Máy em hỏi `/phong-cho` → Worker trả `batDau: false`.
//   · `trangThaiPhongCho` thấy máy chủ mới TRẢ LỜI ĐƯỢC nên tin luôn, KHÔNG
//     hỏi Apps Script nữa.
//
// Kết quả: **cả lớp đứng trong phòng chờ vĩnh viễn**, trong khi thầy tưởng ca
// đang chạy. Không một dòng lỗi nào hiện ra ở cả hai phía. Đây đúng thứ thầy
// gọi là treo, và là kiểu treo tệ nhất vì nó im lặng.
//
// CÁCH BỊT — hai vế, và vế thứ hai mới là vế cứu:
//
//   ① "ĐÃ bắt đầu" thì tin máy chủ mới NGAY. Đó là tin tốt, không cần đối chiếu.
//   ② "CHƯA bắt đầu" thì chỉ tin trong `NHIP_DOI_CHIEU_MS`. Quá hạn thì hỏi
//      thêm Apps Script một lượt. Đường cũ bảo đã bắt đầu ⇒ ghi nhớ, và từ đó
//      MỌI lượt vào thi của ca này đi thẳng đường cũ.
//
// Vế ② phải có, vì nếu chỉ sửa phòng chờ thì em thoát khỏi màn chờ rồi lại bị
// `/vao-thi` của máy chủ mới đẩy về chờ tiếp — `bat_dau_thi_luc` vẫn rỗng mà.
//
// GIÁ PHẢI TRẢ, tính bằng số: một lượt gọi Apps Script mỗi 15 giây cho mỗi em
// ĐANG CHỜ, và chỉ khi máy chủ mới nói chưa bắt đầu. Nhịp hỏi phòng chờ hôm nay
// là 3 giây, nên đây là **1/5 tải của chính hôm nay**. Đổi lại: cú treo dài vô
// hạn thành cú chậm tối đa 15 giây.

/** Bao lâu mới đối chiếu đường cũ một lần, mili giây. */
export const NHIP_DOI_CHIEU_MS = 15000

const mocHoi = new Map<string, number>()
const daBatDauDuongCu = new Set<string>()

/** Đến lúc hỏi lại đường cũ chưa.
 *
 * Lần THẤY ĐẦU TIÊN của một ca chỉ ghi mốc rồi trả `false`: lúc ấy máy chủ mới
 * vừa trả lời xong và câu trả lời của nó còn mới, hỏi thêm chỉ tốn một lượt. */
export function nenDoiChieu(maCa: string, nay: number = Date.now(), nhip: number = NHIP_DOI_CHIEU_MS): boolean {
  const khoa = String(maCa || '')
  if (!khoa) return false
  const cu = mocHoi.get(khoa)
  if (cu === undefined) {
    mocHoi.set(khoa, nay)
    return false
  }
  if (nay - cu < nhip) return false
  mocHoi.set(khoa, nay)
  return true
}

/** Đường cũ xác nhận ca đã bắt đầu — nhớ lại để đường vào thi khỏi hỏi lần nữa. */
export function ghiNhoDaBatDauDuongCu(maCa: string): void {
  const khoa = String(maCa || '')
  if (khoa) daBatDauDuongCu.add(khoa)
}

/** Ca này đã được đường cũ xác nhận bắt đầu chưa. */
export function daBatDauTheoDuongCu(maCa: string): boolean {
  return daBatDauDuongCu.has(String(maCa || ''))
}

/** Dọn trí nhớ. Dùng trong phép kiểm, và khi em rời ca. */
export function quenDoiChieu(maCa?: string): void {
  if (maCa === undefined) {
    mocHoi.clear()
    daBatDauDuongCu.clear()
    return
  }
  mocHoi.delete(maCa)
  daBatDauDuongCu.delete(maCa)
}
