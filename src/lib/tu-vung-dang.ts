// TỪ VỰNG ĐÓNG CỦA MÃ DẠNG — bản MÁY SINH từ `kho-de/cong-cu/tu_vung_dang.py`,
// vốn là bản máy đọc được của `kho-de/DANG-BAI.md`.
//
// 09/09/2026: hai khối VIEC và CO_CHE chuyển từ CHÉP TAY sang SINH RA. Chép tay
// đã trôi mất 2 việc, 3 chương và 7 cơ chế, nên app báo "143 câu mang mã NGOÀI
// bảng đóng" trong khi `gan_dang.py --thu` ở kho báo "Mã lạ 0" — hai bên nhìn
// hai bảng khác nhau, không bên nào sai một mình.
//
// Đặc tả v3 mục 3: bảng mã đóng ở HAI TỪ VỰNG (cơ chế theo chương, việc dùng
// chung), KHÔNG đóng ở danh sách tổ hợp — bản đầu liệt kê sẵn 43 tổ hợp chỉ phủ
// 71% đề thật.
//
// App KHÔNG tự nghĩ mã. File này chỉ để hai việc:
//   1. dựng ô chọn mã cho thầy sửa câu gán sai (không cho gõ tay);
//   2. đọc mã ra tiếng Việt để thầy nhìn hiểu ngay.
// Thêm mã mới: sửa `kho-de/DANG-BAI.md` TRƯỚC, rồi `tu_vung_dang.py`, rồi chạy
// `python3 kho-de/cong-cu/xuat-tu-vung-app.py <omr-app>` để sinh lại tệp này.

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
  XAC_DINH_SO_OXI_HOA: 'xác định số oxi hoá',
  TINH_KHOI_LUONG: 'tính khối lượng',
  TINH_SO_MOL: 'tính số mol',
  TINH_THE_TICH: 'tính thể tích',
  TINH_NONG_DO: 'tính nồng độ',
  TINH_HIEU_SUAT: 'tính hiệu suất',
  TINH_HANG_SO: 'tính hằng số',
  TINH_CHI_SO: 'tính chỉ số',
  TINH_NANG_LUONG: 'tính năng lượng',
  TINH_PHAN_TRAM: 'tính phần trăm',
  TINH_SUC_DIEN_DONG: 'tính sức điện động',
  XAC_DINH_DIEN_TICH: 'xác định điện tích',
  TINH_TI_SO: 'tính tỉ số',
}

/** Tầng 1 + 2 — cơ chế, theo từng chương.
 *
 * MƯỜI BA CHƯƠNG ĐƯỢC MỞ BẢNG 07/09/2026. Trước đó các chương này chỉ có tên,
 * 262 câu trong kho mang `dang: null` vì "chương chưa có bảng cơ chế" — ca thi
 * dùng bộ 12-BD7 chỉ có 26/84 câu có mã nên phiếu không rút được câu chữa nào.
 * Bảng dựng từ việc đọc tay đủ 262 câu đó.
 *
 * KHỐI DƯỚI ĐÂY DO MÁY SINH, đừng sửa tay: chạy
 * `python3 kho-de/cong-cu/xuat-tu-vung-app.py <omr-app>` sau khi sửa
 * `kho-de/DANG-BAI.md` và `kho-de/cong-cu/tu_vung_dang.py`. */
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
    ACID_BASE: 'Thuyết acid-base',
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
  KIM_LOAI: {
    LIEN_KET_KIM_LOAI: 'Liên kết kim loại, tinh thể',
    TINH_CHAT_VAT_LI: 'Tính chất vật lí',
    TINH_KHU: 'Tính khử, dãy điện hoá',
    DIEU_CHE: 'Tách và điều chế kim loại',
    AN_MON: 'Ăn mòn và chống ăn mòn',
    HOP_KIM: 'Hợp kim',
    UNG_DUNG: 'Ứng dụng kim loại',
  },
  KIM_LOAI_IA_IIA: {
    TINH_CHAT_KIM_LOAI: 'Tính chất kim loại IA, IIA',
    MAU_NGON_LUA: 'Màu ngọn lửa',
    DO_TAN: 'Độ tan hợp chất',
    NHIET_PHAN: 'Nhiệt phân muối carbonate',
    NUOC_CUNG: 'Nước cứng',
    SAN_XUAT: 'Solvay, chlorine – kiềm',
    HOP_CHAT: 'Hợp chất và ứng dụng',
  },
  POLYMER: {
    CAU_TAO: 'Cấu tạo, mắt xích',
    DANH_PHAP: 'Tên gọi polymer',
    TRUNG_HOP: 'Trùng hợp',
    TRUNG_NGUNG: 'Trùng ngưng',
    PHAN_LOAI: 'Phân loại polymer, tơ',
    TINH_CHAT: 'Tính chất polymer',
    UNG_DUNG: 'Ứng dụng và môi trường',
  },
  DIEN_PHAN: {
    THE_DIEN_CUC: 'Thế điện cực chuẩn',
    PIN_GALVANI: 'Pin Galvani, sức điện động',
    DIEN_PHAN_DD: 'Điện phân dung dịch',
    DIEN_PHAN_NC: 'Điện phân nóng chảy',
    MA_TINH_LUYEN: 'Mạ điện, tinh luyện',
    AN_MON_DIEN_HOA: 'Ăn mòn điện hoá',
    NGUON_DIEN: 'Nguồn điện hoá học khác',
  },
  PHUC_CHAT: {
    KIM_LOAI_CHUYEN_TIEP: 'Kim loại chuyển tiếp dãy 1',
    CAU_TAO_PHUC: 'Cấu tạo phức chất',
    HINH_HOC: 'Dạng hình học phức chất',
    MAU_SAC: 'Màu sắc phức chất',
    TAO_PHUC: 'Phản ứng tạo phức',
    CHUAN_DO: 'Chuẩn độ thuốc tím',
  },
  OXI_HOA_KHU: {
    SO_OXI_HOA: 'Số oxi hoá',
    CHAT_KHU_CHAT_OXH: 'Chất khử, chất oxi hoá',
    HIEN_TUONG: 'Hiện tượng thí nghiệm',
    CHUAN_DO: 'Chuẩn độ oxi hoá – khử',
    HOP_CHAT_VO_CO: 'Hợp chất vô cơ thường gặp',
  },
  ALCOHOL_PHENOL: {
    DAN_XUAT_HALOGEN: 'Dẫn xuất halogen',
    CAU_TAO: 'Cấu tạo, đồng phân, danh pháp',
    TINH_CHAT_ALCOHOL: 'Tính chất alcohol',
    TINH_CHAT_PHENOL: 'Tính chất phenol',
    UNG_DUNG: 'Điều chế và ứng dụng',
  },
  CARBONYL_ACID: {
    CAU_TAO: 'Cấu tạo, đồng phân, danh pháp',
    TINH_ACID: 'Tính acid',
    PHAN_UNG_OXH: 'Tráng bạc, nhận biết',
    DIEU_CHE: 'Điều chế, chuỗi chuyển hoá',
    UNG_DUNG: 'Ứng dụng',
  },
  HYDROCARBON: {
    LIEN_KET_PHAN_TU: 'Liên kết sigma, pi và hình dạng phân tử',
    CAU_TAO: 'Cấu tạo, đồng phân',
    TINH_CHAT_VAT_LI: 'Tính chất vật lí',
    PHAN_UNG: 'Phản ứng, nhận biết',
    UNG_DUNG: 'Ứng dụng',
  },
  LIEN_KET: {
    LIEN_KET_ION: 'Liên kết ion',
    LIEN_KET_CHT: 'Liên kết cộng hoá trị',
    LIEN_KET_HYDROGEN: 'Liên kết hydrogen',
    VAN_DER_WAALS: 'Tương tác van der Waals',
    QUY_TAC_OCTET: 'Quy tắc octet',
    XEN_PHU_AO: 'Xen phủ orbital, liên kết sigma và pi',
    NANG_LUONG_LIEN_KET: 'Năng lượng liên kết',
  },
  BANG_TUAN_HOAN: {
    CAU_TRUC_BTH: 'Cấu trúc bảng tuần hoàn, ô, chu kì, nhóm',
    VI_TRI_TU_CAU_HINH: 'Suy vị trí từ cấu hình electron',
    XU_HUONG_BIEN_DOI: 'Xu hướng biến đổi tính chất',
    OXIDE_HYDROXIDE: 'Oxide cao nhất, hydroxide, hợp chất với hydrogen',
    PHAN_LOAI_NGUYEN_TO: 'Phân loại kim loại, phi kim, khí hiếm',
  },
  NANG_LUONG_HH: {
    TOA_THU_NHIET: 'Phản ứng toả nhiệt, thu nhiệt',
    ENTHALPY_TAO_THANH: 'Nhiệt tạo thành',
    NANG_LUONG_LIEN_KET: 'Năng lượng liên kết',
    HESS: 'Định luật Hess',
  },
  TOC_DO: {
    YEU_TO: 'Yếu tố ảnh hưởng tốc độ',
    XUC_TAC: 'Xúc tác',
    BIEU_THUC: 'Biểu thức tốc độ',
    DUONG_CONG_DONG_HOC: 'Đường cong động học',
  },
  HALOGEN: {
    DON_CHAT_HALOGEN: 'Đơn chất halogen, tính chất vật lí và tính oxi hoá',
    PHAN_UNG_HALOGEN: 'Phản ứng của halogen với hydrogen, kiềm, muối halide',
    HYDROGEN_HALIDE: 'Hydrogen halide và hydrohalic acid',
    ION_HALIDE: 'Ion halide, nhận biết và tính khử',
    UNG_DUNG_DIEU_CHE: 'Ứng dụng và điều chế halogen',
  },
  NITROGEN_SULFUR: {
    DON_CHAT_N2: 'Đơn chất nitrogen, cấu tạo và tính trơ',
    AMMONIA_AMMONIUM: 'Ammonia và muối ammonium',
    OXIDE_NITROGEN: 'Các oxide của nitrogen và mưa acid',
    NITRIC_ACID: 'Nitric acid và muối nitrate',
    O_NHIEM_PHU_DUONG: 'Ô nhiễm môi trường và phú dưỡng',
    DON_CHAT_S: 'Sulfur và hợp chất sulfur dioxide',
    SULFURIC_ACID: 'Sulfuric acid, muối sulfate và oleum',
    SAN_XUAT_H2SO4: 'Sản xuất sulfuric acid',
  },
  HUU_CO_DAI_CUONG: {
    PHAN_LOAI: 'Phân loại hợp chất hữu cơ',
    PHO: 'Phổ MS, phổ IR',
    LAP_CTPT: 'Lập công thức phân tử',
    TACH_CHAT: 'Tách và tinh chế hợp chất hữu cơ',
    CAU_TAO_HH: 'Thuyết cấu tạo hoá học, đồng đẳng, đồng phân',
  },
}

/** Tên chương cho thầy đọc. */
export const TEN_CHUONG: Record<string, string> = {
  ESTER: 'Ester – lipid',
  NGUYEN_TU: 'Cấu tạo nguyên tử',
  CAN_BANG: 'Cân bằng hoá học',
  CARBOHYDRATE: 'Carbohydrate',
  HOP_CHAT_N: 'Hợp chất chứa nitrogen',
  KIM_LOAI_IA_IIA: 'Kim loại nhóm IA, IIA',
  KIM_LOAI: 'Đại cương kim loại',
  POLYMER: 'Polymer',
  DIEN_PHAN: 'Pin điện và điện phân',
  PHUC_CHAT: 'Kim loại chuyển tiếp và phức chất',
  OXI_HOA_KHU: 'Phản ứng oxi hoá – khử',
  ALCOHOL_PHENOL: 'Dẫn xuất halogen – alcohol – phenol',
  CARBONYL_ACID: 'Hợp chất carbonyl – carboxylic acid',
  HYDROCARBON: 'Hydrocarbon',
  LIEN_KET: 'Liên kết hoá học',
  NANG_LUONG_HH: 'Năng lượng hoá học',
  TOC_DO: 'Tốc độ phản ứng',
  HUU_CO_DAI_CUONG: 'Đại cương hoá hữu cơ',
  BANG_TUAN_HOAN: 'Bảng tuần hoàn các nguyên tố',
  HALOGEN: 'Nguyên tố nhóm halogen',
  NITROGEN_SULFUR: 'Nitrogen và sulfur',
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
