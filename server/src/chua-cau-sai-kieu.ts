// KIỂU DÙNG CHUNG — vòng chữa câu sai (07/10/2026, đặc tả §6, §7, §8).
// Tệp này được import cả ở máy chủ lẫn bundle frontend (qua src/lib/chua-cau-sai-api.ts).
// KHÔNG đặt logic chấm, đáp án, rubric hay ref riêng vào đây.

/** Cờ thử nghiệm — khoá trong bảng `cau_hinh`. */
export const KHOA_CHUA_CAU_SAI = 'chua_cau_sai_v1'

/** Cohort mặc định cho pilot. */
export const COHORT_PILOT = 'pilot-chua-cau-sai-v1'

// ---------------------------------------------------------------------------
// Trạng thái dạy (đặc tả §7.1) — lưu ở chua_loi_dot.trang_thai_day
// ---------------------------------------------------------------------------
export type TrangThaiDay =
  | 'can_chan_doan'
  | 'dang_chua_buoc'
  | 'dang_ghep_bai'
  | 'cho_gap_lai_2'
  | 'dang_kiem_chung'
  | 'da_tu_sua'
  | 'can_thay'
  | 'thieu_hoc_lieu'
  | 'tam_khoa'
  | 'cau_thay_doi'

// ---------------------------------------------------------------------------
// Mã loại item (đặc tả §9.2)
// ---------------------------------------------------------------------------
export type LoaiItem =
  | 'chan_doan'
  | 'phan_biet'
  | 'kiem_lai'
  | 'kiem_ly_do'
  | 'chuyen_giao'
  | 'ghep_bai'
  | 'kiem_chung'
  | 'nen'

// ---------------------------------------------------------------------------
// Loại lỗi (đặc tả §5.1)
// ---------------------------------------------------------------------------
export type LoaiLoi =
  | 'doc_de'
  | 'kien_thuc'
  | 'phuong_phap'
  | 'tinh_toan'
  | 'chua_xac_dinh'

// ---------------------------------------------------------------------------
// Mức kết luận chẩn đoán
// ---------------------------------------------------------------------------
export type MucKetLuan = 'gia_thuyet' | 'co_bang_chung' | 'chua_xac_dinh'

// ---------------------------------------------------------------------------
// Ref câu kiểm (ProbeRef) — máy chủ giữ đầy đủ; máy em chỉ nhận ID opaque
// ---------------------------------------------------------------------------

/** Nội dung nhúng trực tiếp trong học liệu — thay thế tra R2 khi soạn bài nhanh. */
export interface NoiDungTrucTiep {
  hoi: string
  kieu: KieuItem   // định nghĩa bên dưới
  dapAn: string    // máy chủ giữ, KHÔNG gửi xuống client
  luaChon?: { ky: string; noi: string }[]
  donVi?: string
}

export interface ProbeRef {
  qid: string
  phienBan: string
  /** Phần câu hỏi (I/II/III). */
  phan: string
  /** Kỹ năng kiểm tra. */
  kyNang: string[]
  /** Có phải bản tương đương đã kiểm để dùng ở gặp lại 2 không. */
  laTuongDuong: boolean
  /** Nội dung nhúng — nếu có thì dùng thay tra R2 (server-only). */
  noiDungTrucTiep?: NoiDungTrucTiep
}

export interface VariantRef extends ProbeRef {
  loai: 'ghep_bai' | 'kiem_chung'
}

// ---------------------------------------------------------------------------
// Bước chữa (BuocChua) — đặc tả §6.1
// ---------------------------------------------------------------------------
export interface HieuBuoc {
  mucTieu: string
  yNghiaDaiLuong: string
  viSaoCanBuoc: string
  dieuKienApDung: string
  noiVoiBuocSau: string
  doiChieu: {
    maLoi: string
    probeXacNhan: ProbeRef
    cachNghiCu: string
    diemLech: string
    heQua: string
    cachDung: string
  }[]
  bieuDien?: {
    loai: 'cong_thuc' | 'so_do' | 'bang' | 'don_vi'
    noiDung: string
    moTaVanBan: string
    hienSau: 'nop_chan_doan' | 'xin_ho_tro'
  }
  kiemLyDo: ProbeRef[]
  chuyenGiao: ProbeRef[]
  phanViDu?: ProbeRef[]
}

export interface BuocChua {
  id: string
  thuTu: number
  tieuDe: string
  tienQuyet: string[]
  viKyNang: string[]
  yApDung?: number[]  // chỉ số ý Phần II, 0..3
  chanDoan: ProbeRef[]
  phanBiet: ProbeRef[]
  kiemLai: ProbeRef[]
  hieuBuoc?: HieuBuoc  // bắt buộc với học liệu mới; thiếu = thiếu độ phủ
  hoTro: { muc: 1 | 2 | 3; noiDung: string; viDuRef?: string }[]
  loiThuongGap: { ma: string; loai: LoaiLoi; tinHieu: string; probeXacNhan: string }[]
}

export interface HocLieuChua {
  schemaVersion: 1
  contentVersion: string
  qidGoc: string
  buoc: BuocChua[]
  banGhepBai: VariantRef[]
  banKiemChung: VariantRef[]
}

// ---------------------------------------------------------------------------
// Cấu hình tính năng (đặc tả §15.1)
// ---------------------------------------------------------------------------
export interface CauHinhChuaCauSai {
  bat: boolean
  lop: string[]
  sbd: string[]
  dongBoTuLuyen: boolean
  kiemLaiSauGio: number   // giờ tối thiểu trước gặp lại 2 (mặc định 24)
  chanDoanToiDa: number   // số probe chẩn đoán mỗi lượt (mặc định 4)
  vongHoTroToiDaMoiBuoc: number  // số vòng giải thích→bài mới (mặc định 2)
  phutToiDaMotLuot: number  // giới hạn tải nhận thức (mặc định 10)
  cuaSoDoNgay: number     // cửa sổ đo KPI (mặc định 7)
  cohortId: string
}

export const CAU_HINH_MAC_DINH: CauHinhChuaCauSai = {
  bat: false,
  lop: [],
  sbd: [],
  dongBoTuLuyen: true,
  kiemLaiSauGio: 24,
  chanDoanToiDa: 4,
  vongHoTroToiDaMoiBuoc: 2,
  phutToiDaMotLuot: 10,
  cuaSoDoNgay: 7,
  cohortId: COHORT_PILOT,
}

// ---------------------------------------------------------------------------
// Kiểu nhập của item (định nghĩa trước NoiDungTrucTiep dùng ở ProbeRef trên)
// ---------------------------------------------------------------------------
export type KieuItem = 'so' | 'chon' | 'ds' | 'chon_ly_do' | 'tu_nhap'

// ---------------------------------------------------------------------------
// Payload công khai của item (gửi máy em, đặc tả §10.2)
// ---------------------------------------------------------------------------
export interface ItemCongKhai {
  id: string          // opaque item ID
  loai: LoaiItem
  buocSo?: number
  tieuDe: string
  kieu: KieuItem
  hoi: string
  luaChon: { ky: string; noi: string }[] | null
  donVi?: string
  // Không có đáp án, rubric, ref riêng
}

// ---------------------------------------------------------------------------
// Tiến độ bước trong phiên (lưu ở chua_loi_phien.tien_do_json)
// ---------------------------------------------------------------------------
export type TrangThaiBuoc =
  | 'chua_kiem'
  | 'dang_kiem'
  | 'da_lam_dung_trong_phien'
  | 'co_bang_chung_hieu_trong_phien'
  | 'can_ho_tro_tiep'
  | 'chuyen_thay'

export interface BuocTienDo {
  buocId: string
  thuTu: number
  tieuDe: string
  trangThai: TrangThaiBuoc
  maLoiDaXacNhan?: string
  mucHoTroCaoNhat: number   // 0-3
  receiptChanDoan?: string
  receiptLyDo?: string
  receiptChuyenGiao?: string
  soVongHoTro: number
}

// ---------------------------------------------------------------------------
// Response phiên (trả về máy em, đặc tả §10.2)
// ---------------------------------------------------------------------------
export interface PhienResponse {
  ok: true
  serverNow: string
  dotId: string
  phienId: string
  revision: number
  trangThai: TrangThaiDay
  lanGapLai: number
  tienDo: { soBuocDaQua: number; soBuocCanKiem: number }
  cauGoc: { phan: string; text: string; table: unknown | null } | null
  item: ItemCongKhai | null
  hanhDong: { coTheNop: boolean; coTheXinGoiY: boolean; coTheTiep: boolean }
  phanHoiTruoc: PhanHoiItem | null
}

export interface PhanHoiItem {
  itemId: string
  dung: boolean
  phanGiuDuoc?: string  // phần em đã làm đúng
  diemlech?: string     // điểm lệch cụ thể
  giaThiet?: string     // câu hỏi kiểm tiếp (chưa lộ đáp án)
  hanhDongTiep?: string // việc em tự làm
}

// ---------------------------------------------------------------------------
// Mã lỗi hợp đồng (đặc tả §10.7)
// ---------------------------------------------------------------------------
export type MaLoiHopDong =
  | 'CAN_DANG_NHAP'
  | 'DANG_KIEM_TRA'
  | 'CHUA_CONG_BO'
  | 'CAU_BI_BAO_VE'
  | 'CHUA_DEN_HAN'
  | 'THIEU_HOC_LIEU'
  | 'CAU_THAY_DOI'
  | 'XUNG_DOT_PHIEN'
  | 'CHO_GHI_SO'
  | 'FEATURE_TAT'

// ---------------------------------------------------------------------------
// Ref nguồn để mở đợt lỗi (đặc tả §10.1)
// ---------------------------------------------------------------------------
export interface NguonRefTuLuyen {
  loai: 'tu_luyen'
  luotId: string
  itemId?: string
}
export interface NguonRefGame {
  loai: 'dao' | 'doan' | 'bia'
  phienId: string
  qid: string
}
export interface NguonRefCa {
  loai: 'ca'
  maCa: string
  qid: string
}
export type NguonRef = NguonRefTuLuyen | NguonRefGame | NguonRefCa

// ---------------------------------------------------------------------------
// Raw event namespace (đặc tả §9.2)
// ---------------------------------------------------------------------------
export interface RawChua {
  dotId: string
  phienId: string
  itemId: string
  loai: LoaiItem
  buocId?: string
  mucHoTro: number
  banTuongDuongDaKiem?: boolean
  version: string
  lanGapLai: number
}
