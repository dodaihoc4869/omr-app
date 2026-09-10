// MỘT NGUỒN SỰ THẬT CHO CHẨN ĐOÁN NGUYÊN NHÂN SAI.
//
// Đặc tả: RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md, mục "một nguồn sự thật cấu hình".
// Cấm rải mấy con số này ra chỗ khác.
//
// ================= BA CHỖ ĐẶC TẢ ĐỂ NGỎ, TÔI TỰ CHỐT =======================
//
// Đặc tả kết bằng ba câu hỏi cho thầy. Thầy giao "tự sửa sao cho hợp lý nhất,
// không cần hỏi", nên chốt như dưới đây — mỗi chốt kèm căn cứ đo được, và mỗi
// chốt đều đổi lại được bằng một dòng cấu hình.
//
// ❶ SỐ GIÂY TRÊN ĐIỆN THOẠI CÓ ĐÁNG TIN KHÔNG → DÙNG, NHƯNG CÓ HAI CỔNG.
//    Đo 10/09 trên sheet `ChiTietCau`: tỉ lệ dòng còn giây theo ca là 99%, 98%,
//    71%, và 12%. Tức là có ca dùng được, có ca không — bỏ hẳn tín hiệu giây thì
//    mất luôn mấy ca 99%, mà tin mù thì chẩn đoán ca 12% bằng rác. Nên:
//      · cổng CẢ CA — dưới `TI_LE_CO_GIAY_TOI_THIEU` thì tắt mọi luật đọc giờ;
//      · cổng TỪNG EM — `LuotThi` đã ghi sẵn `TongGiayRoiMan`; em rời màn quá
//        `GIAY_ROI_MAN_TOI_DA` thì giây của em ấy không còn nghĩa, tắt riêng cho
//        em đó. Đây chính là chỗ thầy lo, và dữ liệu để xử lý nó đã có sẵn.
//
// ❷ CHO AI GÁN NHÃN MỨC TỪNG PHƯƠNG ÁN NHIỄU LÚC NẠP ĐỀ KHÔNG → CHƯA.
//    Nó đổi pipeline nạp đề và tốn tiền theo từng đề. Bản này dùng `loiThuongGap`
//    ở mức DẠNG (kho đã có sẵn) và CỜ HOÁ những câu mà nhãn mức phương án sẽ giúp
//    được — có số rồi thầy quyết có đáng chi hay không.
//
// ❸ CÂU ÔN LẠI CA SAU: TỰ ĐỘNG CHÈN HAY CHỜ DUYỆT → CHỜ DUYỆT, MỘT CHẠM.
//    Tự chèn là lấn vào bộ câu thầy tự tích cho ca đó. Hàng đợi vẫn chạy đủ, chỉ
//    khác ở chỗ nó ĐỀ NGHỊ chứ không tự tay bỏ câu vào ca.
//
// Và một chốt nữa về CHỖ CẤT hàng đợi: đặc tả viết "thêm cột `MocOn`, `LanDung`,
// `LanSai` vào sheet `TienDoHS`". KHÔNG LÀM THẾ. Thêm cột vào bảng đang có dữ
// liệu thật là đổi cấu trúc đang chạy. Hàng đợi cất ở IndexedDB máy thầy, đúng
// chỗ `khoChuaCa` và `khoDoKho` đang nằm — rút đề chỉ xảy ra trên máy thầy, nên
// không cần máy chủ, và không phải triển khai Apps Script lần nào.

export type Benh = 'nham_khai_niem' | 'chua_biet' | 'loi_tinh' | 'bua_het_gio' | 'thieu_du_lieu' | 'chua_ro'

export const TEN_BENH: Record<Benh, string> = {
  nham_khai_niem: 'nhầm khái niệm',
  chua_biet: 'chưa biết',
  loi_tinh: 'lỗi tính',
  bua_het_gio: 'bừa / hết giờ',
  thieu_du_lieu: 'thiếu dữ liệu',
  chua_ro: 'chưa rõ nguyên nhân',
}

/** Bệnh nào ĐƯỢC kê câu chữa. `bua_het_gio` KHÔNG — kê câu kiến thức cho em hết
 * giờ là chữa nhầm bệnh. `thieu_du_lieu` và `chua_ro` rơi về đường rút cũ. */
export const BENH_DUOC_KE: Benh[] = ['nham_khai_niem', 'chua_biet', 'loi_tinh']

export interface CauHinhChanDoan {
  /** Dưới bấy nhiêu lần trung vị lớp CỦA CHÍNH CÂU ĐÓ thì em không kịp đọc đề. */
  NHANH_TI_LE: number
  /** Trên bấy nhiêu lần trung vị là dấu em có làm thật mà vướng. */
  CHAM_TI_LE: number
  /** Từ mức này số em sai cùng chọn một phương án thì đó là bẫy chung. */
  CHUM_TI_LE: number
  /** Dưới bấy nhiêu em làm cùng câu thì `doChum` là nhiễu. */
  TOI_THIEU_EM_TINH_CHUM: number
  /** Ca có dưới tỉ lệ này số dòng còn giây thì TẮT mọi luật đọc giờ. */
  TI_LE_CO_GIAY_TOI_THIEU: number
  /** Em rời màn quá bấy nhiêu giây thì giây của EM ẤY không còn nghĩa. */
  GIAY_ROI_MAN_TOI_DA: number
  /** Bao nhiêu phần trăm câu CUỐI bài là vùng hay bị hết giờ. */
  VI_TRI_CUOI_BAI: number
  /** Phần III lệch dưới mức này so với đáp án thì là lỗi tính, không phải chưa biết. */
  LECH_SO_LOI_TINH: number
  /** Trần câu cho MỘT lỗi trong một phiếu. */
  TRAN_CAU_MOT_LOI: number
  /** Trần cứng cả phiếu, không thanh kéo nào vượt được. */
  TRAN_CAU_MOT_PHIEU: number
  /** Mốc ôn lại, tính bằng SỐ BUỔI. Sai lại thì về mốc đầu. */
  MOC_ON: number[]
}

export const CAU_HINH_CHAN_DOAN_MAC_DINH: CauHinhChanDoan = {
  NHANH_TI_LE: 0.4,
  CHAM_TI_LE: 1.6,
  CHUM_TI_LE: 0.35,
  TOI_THIEU_EM_TINH_CHUM: 8,
  TI_LE_CO_GIAY_TOI_THIEU: 0.6,
  GIAY_ROI_MAN_TOI_DA: 120,
  VI_TRI_CUOI_BAI: 0.2,
  LECH_SO_LOI_TINH: 0.15,
  TRAN_CAU_MOT_LOI: 3,
  TRAN_CAU_MOT_PHIEU: 12,
  MOC_ON: [1, 3, 7],
}

/** Mốc kế tiếp sau khi em làm ĐÚNG ở lần ôn thứ `lanDung`. Hết bậc thì giữ bậc cuối. */
export function mocOnKeTiep(lanDung: number, ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH): number {
  const i = Math.max(0, Math.min(ch.MOC_ON.length - 1, lanDung))
  return ch.MOC_ON[i]
}
