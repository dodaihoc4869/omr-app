// CẤU HÌNH BÁO CÁO GỬI PHỤ HUYNH — PHIEU-PHU-HUYNH-V3 mục 3.
//
// MỘT NGUỒN SỰ THẬT. Cấm rải mấy cờ này vào component hay lib khác, và cấm gõ
// cứng giá trị của chúng ở chỗ khác để "bật tạm".
//
// Bốn khoá dưới đây đi THEO GÓI PHIẾU, không đọc từ máy phụ huynh: báo cáo mở
// trên máy lạ, không có IndexedDB của thầy, nên cờ phải được chốt lúc DỰNG
// phiếu và nằm luôn trong gói. `cauHinhPhieu()` trả bản mặc định; chỗ dựng
// phiếu ghi đè bằng lựa chọn của thầy rồi đóng vào gói.

export interface CauHinhPhieu {
  /** Bật lại hạng trong lớp và biểu đồ phân bố điểm cả lớp.
   *
   * MẶC ĐỊNH TẮT. Dự án Dynamic Learning Maps khảo sát giáo viên và họ phản
   * đối đưa thông tin so sánh vào báo cáo vì làm nản phụ huynh có con dưới
   * trung bình; dự án gỡ bỏ hoàn toàn phần so sánh sau vòng đó.
   *
   * Ca ĐỀ RIÊNG TỪNG EM luôn tắt phần này bất kể cờ, vì mỗi em một bộ câu thì
   * hạng và phân bố không còn nghĩa (xem DE-RIENG-TUNG-EM mục 2). */
  HIEN_HANG_LOP: boolean
  /** Tắt thì tầng 3 chỉ hiện đáp án đúng, không hiện lời giải từng bước. */
  HIEN_LOI_GIAI_DAY_DU: boolean
  /** Số câu phiếu luyện, kẹp xuống `tongUngVien` (RUT-DE-CHUA-CAU-SAI.md). */
  SO_CAU_LUYEN: number
  /** Câu sai đầu tiên mở sẵn, các câu sau gập lại. */
  MO_SAN_CAU_SAI_DAU: boolean
}

export const CAU_HINH_PHIEU_MAC_DINH: CauHinhPhieu = {
  HIEN_HANG_LOP: false,
  HIEN_LOI_GIAI_DAY_DU: true,
  SO_CAU_LUYEN: 10,
  MO_SAN_CAU_SAI_DAU: true,
}

/** Đọc cấu hình đã chốt trong gói phiếu, điền mặc định cho khoá thiếu.
 *
 * Gói cũ (v2) không có trường này ⇒ ra đúng bản mặc định, nên bản cũ mở lại
 * không đổi hành vi. */
export function cauHinhPhieu(luu?: Partial<CauHinhPhieu> | null): CauHinhPhieu {
  const c = luu ?? {}
  return {
    HIEN_HANG_LOP: c.HIEN_HANG_LOP === true,
    HIEN_LOI_GIAI_DAY_DU: c.HIEN_LOI_GIAI_DAY_DU !== false,
    SO_CAU_LUYEN: Number.isFinite(Number(c.SO_CAU_LUYEN)) && Number(c.SO_CAU_LUYEN) > 0 ? Math.floor(Number(c.SO_CAU_LUYEN)) : CAU_HINH_PHIEU_MAC_DINH.SO_CAU_LUYEN,
    MO_SAN_CAU_SAI_DAU: c.MO_SAN_CAU_SAI_DAU !== false,
  }
}

/** CÓ ĐƯỢC HIỆN HẠNG LỚP KHÔNG — một chỗ trả lời, để báo cáo và test không mỗi
 * nơi tính một kiểu.
 *
 * Hai điều kiện, và điều kiện thứ hai THẮNG: cờ phải bật, VÀ ca không phải ca
 * đề riêng từng em. Ca đề riêng mà vẫn hiện hạng là so điểm hai em làm hai bộ
 * câu khác nhau. */
export function duocHienHang(ch: CauHinhPhieu, deRieng?: boolean | null): boolean {
  return ch.HIEN_HANG_LOP && deRieng !== true
}

// ---------------------------------------------------------------------------
// BẢNG MÀU BÁO CÁO — PHIEU-PHU-HUYNH-V3 mục 3, đã chạy qua bộ kiểm, CẤM ĐỔI.
//
// CHỈ HAI MÀU MANG NGHĨA: đúng/đã chắc và sai/hụt. Cấm dùng màu để trang trí,
// và cấm dùng màu MỘT MÌNH để chỉ trạng thái — mỗi chỗ tô màu phải có chữ đi
// kèm, vì khoảng 1/12 nam giới không phân biệt được đỏ với lục.
//
// Sống ở đây dưới dạng token để `check:mau` không bắt lỗi mã màu rải trong
// component, và để một chỗ đổi là cả báo cáo đổi theo.
export const MAU_PHIEU = {
  dung: 'var(--p3-dung)',
  sai: 'var(--p3-sai)',
  neenHero: 'var(--p3-hero)',
  nen: 'var(--p3-nen)',
} as const

/** Ngưỡng "cả lớp cùng sai một phương án" — tới đây thì câu đó là BẪY của đề,
 * không phải lỗi riêng của em, và báo cáo phải nói ra. */
export const NGUONG_LOP_CUNG_SAI = 0.5
