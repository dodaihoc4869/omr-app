/**
 * MỘT NGUỒN SỰ THẬT CHO MỌI CẤU HÌNH.
 * Cấm hard-code ngưỡng, tốc độ, số mạng ở bất kỳ tệp nào khác.
 * Toạ độ tính bằng ĐƠN VỊ LOGIC, không bằng pixel — máy to nhỏ cùng độ khó.
 */
export interface CauHinhDao {
  SO_NGUOI_TOI_DA: number
  SO_NGUOI_TOI_THIEU: number
  NHIP_MAY_CHU_HZ: number

  TOC_DO_CHAY: number
  TOC_DO_NHAY: number
  TRONG_LUC: number
  GIAY_NHAY_SOM: number
  GIAY_NHAY_MUON: number
  SO_LAN_NHAY: number

  CAO_VUNG_DAU: number
  TOC_DO_ROI_TOI_THIEU: number
  NAY_SAU_DAM: number
  GIAY_BAT_TU_SAU_MAT_MANG: number

  SO_MANG: number
  DOI_CHAT_KHI_MAT_MANG: boolean
  GIAY_CHON_LAI_CHAT: number
  CAM_TRUNG_HOA_CHAT: boolean
  GIAY_KHONG_LO: number
  GIAY_HIEN_PHUONG_TRINH: number
  HIEN_CANH_BAO_KHAC_CHE: boolean

  /** Cảnh mở đầu trận rồng kéo bao lâu. */
  GIAY_CANH_MO_DAU: number
  /** Chỉ người SỐNG SÓT CUỐI CÙNG mới được vào hang gặp rồng. */
  CHI_NGUOI_CUOI_CUNG_GAP_RONG: boolean
  MAU_RONG: number
  GIAY_PHUN_LUA: number
  GIAY_HO_SAU_DAP: number
  SO_LAN_COT_DA_CHIU: number

  BOT_GIAY_PHAN_XA: number
  BOT_DO_CHINH_XAC: number

  CAO_NHAN_VAT: number
  RONG_NHAN_VAT: number
  DAI_DAO: number
  FPS_MUC_TIEU: number
}

export const CAU_HINH: Readonly<CauHinhDao> = {
  SO_NGUOI_TOI_DA: 12,
  SO_NGUOI_TOI_THIEU: 1,
  NHIP_MAY_CHU_HZ: 20,

  TOC_DO_CHAY: 240,
  TOC_DO_NHAY: 560,
  TRONG_LUC: 1800,
  GIAY_NHAY_SOM: 0.12,   // bấm sớm trước khi chạm đất vẫn ăn
  GIAY_NHAY_MUON: 0.10,  // vừa rơi khỏi mép vẫn nhảy được
  SO_LAN_NHAY: 2,

  CAO_VUNG_DAU: 18,
  TOC_DO_ROI_TOI_THIEU: 120,
  NAY_SAU_DAM: 620,
  GIAY_BAT_TU_SAU_MAT_MANG: 1.4,

  SO_MANG: 3,
  DOI_CHAT_KHI_MAT_MANG: true,
  GIAY_CHON_LAI_CHAT: 6,
  CAM_TRUNG_HOA_CHAT: true,
  GIAY_KHONG_LO: 10,   // thầy chốt: ăn hoa thì khổng lồ 10 giây
  GIAY_HIEN_PHUONG_TRINH: 1.6,
  HIEN_CANH_BAO_KHAC_CHE: true,

  GIAY_CANH_MO_DAU: 6.5,
  CHI_NGUOI_CUOI_CUNG_GAP_RONG: true,   // thầy chốt 14-09
  MAU_RONG: 3,
  GIAY_PHUN_LUA: 1.2,
  GIAY_HO_SAU_DAP: 1.5,
  SO_LAN_COT_DA_CHIU: 3,

  BOT_GIAY_PHAN_XA: 0.32,
  BOT_DO_CHINH_XAC: 0.62,

  CAO_NHAN_VAT: 100,
  RONG_NHAN_VAT: 46,
  DAI_DAO: 7200,        // đơn vị logic từ đầu đảo tới cửa hang
  FPS_MUC_TIEU: 60,
} as const
