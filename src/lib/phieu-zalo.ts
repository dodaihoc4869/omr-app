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
export function soanPhieuZalo(d: DuLieuPhieu, xungHo = 'Anh/chị'): string {
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

  if (d.baiTapDaGiao) {
    const han = ngayVN(d.baiTapDaGiao.hanNop)
    cau.push(`Thầy đã giao em ${d.baiTapDaGiao.soCau} câu bài tập trong app, hạn nộp ${han}.`)
    cau.push('Thầy chấm bài đó rồi báo lại kết quả.')
  } else if (d.chuyenDeSai && d.chuyenDeSai.soSai > 0) {
    cau.push(`Thầy sẽ giao em bài tập riêng chuyên đề ${d.chuyenDeSai.ten} trong app.`)
    cau.push('Em làm xong, Thầy chấm rồi báo lại.')
  } else {
    cau.push('Buổi tới Thầy cho em làm phần khó hơn để kiểm tra lại.')
  }

  return cau.join(' ')
}

/** Gợi ý chỗ thầy nên tự viết thêm trước khi gửi — máy không đoán thay. */
export const NHAC_TRUOC_KHI_GUI = 'Thầy đọc lại và thêm nguyên nhân cụ thể (em hổng phần nào, hay sai kỹ năng nào) trước khi gửi.'
