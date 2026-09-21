// TIN NHẮN THẦY SOẠN SẴN (chữ do thầy sửa rồi mới gửi): báo phụ huynh việc em rời màn hình lúc làm bài (gửi vào HỘP THƯ TRONG APP, Ca thi).
// Tách ra từ `phieu-zalo.ts` khi thầy lệnh "Bỏ phiếu Zalo" (21/09): phiếu/tin Zalo gửi phụ huynh đã gỡ hẳn; tin này KHÔNG phải Zalo nên giữ, NGUYÊN VĂN. (`tinBaoBaiTap` đã xoá 21/09 cùng GiaoBaiTap — mã chết.)

function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Tin BÁO PHỤ HUYNH về việc em rời màn hình lúc làm bài (BA-APP.md mục 4D).
 *
 * Nguyên tắc: **nêu dữ kiện, không kết luận gian lận**. Máy chỉ đo được "em
 * rời khỏi màn làm bài mấy lần, mấy giây" — một cuộc gọi đến cũng cho ra đúng
 * tín hiệu đó. Kết luận là việc của thầy sau khi hỏi em, nên tin soạn sẵn chỉ
 * mô tả và nêu bước tiếp theo; thầy sửa trước khi gửi. */
export interface DuLieuBaoRoiMan {
  hoTen: string
  maCa: string
  tenCa?: string
  ngay: string
  soLan: number
  tongGiay: number
  daKhoa: boolean
}

export function soanTinRoiMan(d: DuLieuBaoRoiMan, xungHo = 'Phụ huynh'): string {
  const ngay = ngayVN(d.ngay)
  const ten = d.tenCa ? `bài ${d.tenCa}` : `bài kiểm tra ${ngay}`
  const cau: string[] = []
  cau.push(`${xungHo}, trong ${ten} em ${d.hoTen} rời khỏi màn hình làm bài ${d.soLan} lần, tổng ${d.tongGiay} giây.`)
  cau.push(
    d.daKhoa
      ? 'Máy đã khoá bài và nộp phần em làm được.'
      : 'Bài vẫn tính bình thường, Thầy ghi lại để theo dõi.',
  )
  cau.push('Thầy hỏi em xem lúc đó có việc gì rồi báo lại phụ huynh.')
  cau.push('Buổi tới phụ huynh nhắc em bật Không làm phiền trước khi làm bài.')
  return cau.join(' ')
}
