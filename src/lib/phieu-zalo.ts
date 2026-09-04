// PHIẾU KẾT QUẢ GỬI PHỤ HUYNH (BA-APP.md đợt 4).
//
// Soạn theo đúng bộ quy tắc viết của thầy: xưng "Thầy", vào thẳng nội dung,
// không lời chào, không lời chúc, không khen suông, KHÔNG BỊA SỐ — mọi con số
// trong phiếu đều lấy từ bài đã chấm. Độ dài nhắm 60–120 chữ.
//
// Máy điền được 3 trong 4 phần bắt buộc (lỗi cụ thể có ngày và số câu · việc
// em phải làm có số lượng · mốc thầy kiểm tra lại). Phần NGUYÊN NHÂN thì máy
// không biết, và đoán là bịa — nên phiếu chỉ nêu dữ kiện "sai tập trung ở
// chuyên đề nào" và để thầy tự thêm nguyên nhân trước khi gửi.

export interface DuLieuPhieu {
  hoTen: string
  /** Ngày làm bài (ISO). */
  ngay: string
  diem: number
  xepLoai: string
  diemPhan?: { I: number; II: number; III: number } | null
  soCauSai: number
  /** Chuyên đề sai nhiều nhất: tên + số câu sai thuộc chuyên đề đó. */
  chuyenDeSai?: { ten: string; soSai: number } | null
  /** Bài tập vừa giao kèm phiếu (nếu có): số câu + hạn nộp ISO. */
  baiTapDaGiao?: { soCau: number; hanNop: string } | null
}

function soVN(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}

function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Đếm chữ (tách theo khoảng trắng) — để giữ phiếu trong khoảng 60–120 chữ. */
export function demChu(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Soạn phiếu kết quả để thầy dán vào Zalo.
 * `xungHo` mặc định "Anh/chị"; biết tên phụ huynh thì truyền "Chị Lan".
 */
export function soanPhieuZalo(d: DuLieuPhieu, xungHo = 'Anh/chị', vieCanLam?: string): string {
  const ngay = ngayVN(d.ngay)
  const cau: string[] = []

  cau.push(`${xungHo}, bài kiểm tra ${ngay} em ${d.hoTen} được ${soVN(d.diem)} điểm, xếp loại ${d.xepLoai}.`)

  if (d.diemPhan) {
    cau.push(`Phần I ${soVN(d.diemPhan.I)}, phần II ${soVN(d.diemPhan.II)}, phần III ${soVN(d.diemPhan.III)}.`)
  }

  if (d.soCauSai > 0 && d.chuyenDeSai && d.chuyenDeSai.soSai > 0) {
    cau.push(`Em sai ${d.soCauSai} câu, trong đó ${d.chuyenDeSai.soSai} câu thuộc ${d.chuyenDeSai.ten}.`)
  } else if (d.soCauSai > 0) {
    cau.push(`Em sai ${d.soCauSai} câu, rải đều các chuyên đề.`)
  } else {
    cau.push('Em làm đúng toàn bộ các câu.')
  }

  cau.push(vieCanLam ?? viecCanLamMacDinh(d))

  return cau.join(' ')
}

/** VIỆC CẦN LÀM — phần 3 và 4 của bộ quy tắc viết (việc em phải làm + mốc thầy
 * kiểm tra lại). Tách riêng vì ẢNH PHIẾU và TIN NHẮN phải nói cùng một việc:
 * hai chỗ soạn riêng thì sớm muộn cũng lệch nhau. Thầy sửa được trước khi gửi,
 * sửa một lần là cả hai đổi theo. */
export function viecCanLamMacDinh(d: DuLieuPhieu): string {
  if (d.baiTapDaGiao) {
    const han = ngayVN(d.baiTapDaGiao.hanNop)
    return `Thầy đã giao em ${d.baiTapDaGiao.soCau} câu bài tập trong app, hạn nộp ${han}. Thầy chấm bài đó rồi báo lại kết quả.`
  }
  if (d.chuyenDeSai && d.chuyenDeSai.soSai > 0) {
    return `Thầy sẽ giao em bài tập riêng chuyên đề ${d.chuyenDeSai.ten} trong app. Em làm xong, Thầy chấm rồi báo lại.`
  }
  return 'Buổi tới Thầy cho em làm phần khó hơn để kiểm tra lại.'
}

/** Gợi ý chỗ thầy nên tự viết thêm trước khi gửi — máy không đoán thay. */
export const NHAC_TRUOC_KHI_GUI = 'Thầy đọc lại và thêm nguyên nhân cụ thể (em hổng phần nào, hay sai kỹ năng nào) trước khi gửi.'

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

export function soanTinRoiMan(d: DuLieuBaoRoiMan, xungHo = 'Anh/chị'): string {
  const ngay = ngayVN(d.ngay)
  const ten = d.tenCa ? `bài ${d.tenCa}` : `bài kiểm tra ${ngay}`
  const cau: string[] = []
  cau.push(`${xungHo}, trong ${ten} em ${d.hoTen} rời khỏi màn hình làm bài ${d.soLan} lần, tổng ${d.tongGiay} giây.`)
  cau.push(
    d.daKhoa
      ? 'Máy đã khoá bài và nộp phần em làm được.'
      : 'Bài vẫn tính bình thường, Thầy ghi lại để theo dõi.',
  )
  cau.push('Thầy hỏi em xem lúc đó có việc gì rồi báo lại anh/chị.')
  cau.push('Buổi tới anh/chị nhắc em bật Không làm phiền trước khi làm bài.')
  return cau.join(' ')
}

/** TIN BÁO BÀI TẬP MỚI GỬI EM, kèm LINK VÀO LÀM BÀI.
 *
 * Mắt xích hay bị quên: giao bài xong là xong ở phía thầy, nhưng máy em CHỈ
 * thấy bài khi mở đúng link ca đó. Nên tin này luôn kèm link, không bắt thầy đi
 * tìm ở màn khác. Bài tập là một ca đặt riêng cho một em, nên em phải nhập số
 * báo danh của mình mới vào được — nhắc luôn số trong tin cho khỏi hỏi lại.
 */
export function tinBaoBaiTap(hoTen: string, soCau: number, hanNopISO: string, link: string, sbd = ''): string {
  const han = ngayVN(hanNopISO)
  const cau: string[] = []
  cau.push(`${hoTen ? hoTen + ', t' : 'T'}hầy vừa giao ${soCau} câu bài tập về nhà${han ? `, hạn nộp ${han}` : ''}.`)
  cau.push(`Em mở link này để làm: ${link}`)
  cau.push(
    sbd
      ? `Vào rồi nhập số báo danh ${sbd}. Bài chỉ mở cho số báo danh này, bạn khác không vào được. Làm xong nộp là xem được lời giải ngay.`
      : 'Vào rồi nhập số báo danh của em. Bài chỉ mở cho số báo danh đó, bạn khác không vào được. Làm xong nộp là xem được lời giải ngay.',
  )
  return cau.join('\n')
}
