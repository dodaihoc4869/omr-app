// TỪ VỰNG ĐÓNG CỦA MÃ DẠNG — bản chép máy đọc được của `kho-de/DANG-BAI.md`.
//
// Đặc tả v3 mục 3: bảng mã đóng ở HAI TỪ VỰNG (cơ chế theo chương, việc dùng
// chung), KHÔNG đóng ở danh sách tổ hợp — bản đầu liệt kê sẵn 43 tổ hợp chỉ phủ
// 71% đề thật.
//
// App KHÔNG tự nghĩ mã. File này chỉ để hai việc:
//   1. dựng ô chọn mã cho thầy sửa câu gán sai (không cho gõ tay);
//   2. đọc mã ra tiếng Việt để thầy nhìn hiểu ngay.
// Thêm mã mới thì sửa `kho-de/DANG-BAI.md` TRƯỚC, rồi chép sang đây.

/** Tầng 3 — việc phải làm, dùng chung mọi chương. */
export const VIEC: Record<string, string> = {
  NHAN_DANG: 'nhận dạng',
  CHON_PHAT_BIEU: 'chọn phát biểu',
  GIAI_THICH: 'giải thích',
  SO_SANH: 'so sánh',
  GOI_TEN: 'gọi tên',
  VIET_CTCT: 'viết công thức cấu tạo',
  VIET_PTHH: 'viết phương trình',
  DEM_NGUYEN_TU: 'đếm nguyên tử',
  DEM_LIEN_KET_PI: 'đếm liên kết pi',
  DEM_DONG_PHAN: 'đếm đồng phân',
  XAC_DINH_CHAT: 'xác định chất',
  XAC_DINH_CTPT: 'xác định công thức phân tử',
  XAC_DINH_CHIEU: 'xác định chiều',
  NEU_HIEN_TUONG: 'nêu hiện tượng',
  TINH_KHOI_LUONG: 'tính khối lượng',
  TINH_SO_MOL: 'tính số mol',
  TINH_THE_TICH: 'tính thể tích',
  TINH_NONG_DO: 'tính nồng độ',
  TINH_HIEU_SUAT: 'tính hiệu suất',
  TINH_HANG_SO: 'tính hằng số',
  TINH_CHI_SO: 'tính chỉ số',
  TINH_NANG_LUONG: 'tính năng lượng',
  TINH_PHAN_TRAM: 'tính phần trăm',
}

/** Tầng 1 + 2 — cơ chế, theo từng chương. */
export const CO_CHE: Record<string, Record<string, string>> = {
  ESTER: {
    CAU_TAO: 'Cấu tạo',
    DANH_PHAP: 'Danh pháp',
    TINH_CHAT_VAT_LI: 'Tính chất vật lí',
    ESTER_HOA: 'Ester hoá',
    THUY_PHAN_ACID: 'Thuỷ phân acid',
    THUY_PHAN_BASE: 'Xà phòng hoá',
    HYDRO_HOA: 'Hydrogen hoá',
    CHI_SO_BEO: 'Chỉ số chất béo',
    DOT_CHAY: 'Đốt cháy',
    NANG_LUONG: 'Năng lượng',
    UNG_DUNG: 'Ứng dụng',
  },
  NGUYEN_TU: {
    THANH_PHAN: 'Thành phần nguyên tử',
    CAU_HINH_E: 'Cấu hình electron',
    DONG_VI: 'Đồng vị',
    MO_HINH: 'Mô hình nguyên tử',
    VI_TRI_BTH: 'Vị trí bảng tuần hoàn',
  },
  CAN_BANG: {
    CAN_BANG: 'Chuyển dịch cân bằng',
    HANG_SO_K: 'Hằng số cân bằng',
    DIEN_LI: 'Sự điện li',
    ACID_BASE: 'Thuyết acid–base',
    PH_DUNG_DICH: 'pH dung dịch',
    THUY_PHAN_MUOI: 'Môi trường muối',
    CHUAN_DO: 'Chuẩn độ',
  },
  CARBOHYDRATE: {
    CAU_TAO: 'Cấu tạo',
    PHAN_UNG_TRANG_BAC: 'Phản ứng tráng bạc',
    PHAN_UNG_MAU: 'Phản ứng màu',
    THUY_PHAN: 'Thuỷ phân',
    LEN_MEN: 'Lên men',
    TINH_CHAT_VAT_LI: 'Tính chất vật lí',
    UNG_DUNG: 'Ứng dụng',
  },
  HOP_CHAT_N: {
    AMINE_CAU_TAO: 'Amine — cấu tạo',
    AMINE_TINH_BASE: 'Amine — tính base',
    AMINE_DIEU_CHE: 'Amine — điều chế',
    AMINO_ACID: 'Amino acid',
    PEPTIDE: 'Peptide',
    PROTEIN: 'Protein',
    POLYMER_N: 'Polymer chứa N',
  },
}

/** Tên chương cho thầy đọc. */
export const TEN_CHUONG: Record<string, string> = {
  ESTER: 'Ester – lipid',
  NGUYEN_TU: 'Cấu tạo nguyên tử',
  CAN_BANG: 'Cân bằng hoá học',
  CARBOHYDRATE: 'Carbohydrate',
  HOP_CHAT_N: 'Hợp chất chứa nitrogen',
}

export const DS_CHUONG = Object.keys(CO_CHE)

/** Mã có nằm trong từ vựng đóng không. Khác `maDangHopLe` ở `cau-hinh-chua.ts`:
 * bên đó chỉ xét KHUÔN ba tầng, ở đây xét cả NỘI DUNG từng tầng. */
export function maTrongTuVung(ma: string | null | undefined): boolean {
  const t = String(ma ?? '').split('.')
  if (t.length !== 3) return false
  return t[0] in CO_CHE && t[1] in CO_CHE[t[0]] && t[2] in VIEC
}

/** "ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG" -> "Xà phòng hoá — tính khối lượng".
 * Mã ngoài từ vựng thì trả nguyên mã: thà thầy thấy mã lạ còn hơn thấy chữ đẹp
 * che mất chỗ hỏng. */
export function tenCua(ma: string): string {
  const t = String(ma ?? '').split('.')
  if (!maTrongTuVung(ma)) return String(ma ?? '')
  return `${CO_CHE[t[0]][t[1]]} — ${VIEC[t[2]]}`
}

/** Tên chương của một mã, để nhóm và lọc. Mã hỏng trả ''. */
export function chuongCua(ma: string | null | undefined): string {
  const t = String(ma ?? '').split('.')
  return t.length === 3 && t[0] in CO_CHE ? t[0] : ''
}
