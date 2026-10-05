// OMNI 3 — KIỂU + HẰNG SỐ DÙNG CHUNG (HỢP ĐỒNG giữa lõi thuần, lớp D1, đường trả lời và ba app).
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md · Hợp đồng API: docs/hop-dong-omni-3.md.
// Tệp này là HỢP ĐỒNG: đổi chữ ký / nghĩa một trường ở đây phải báo phiên điều phối (không tự đổi trong làn riêng).
// Mọi hằng số con số của OMNI nằm ở `THAM_SO_OMNI` — cấm rải số ra tệp khác.
// KHÔNG import tệp nào khác của máy chủ (tránh vòng phụ thuộc): lõi thuần, D1, game đều import từ đây.

/** Khoá `cau_hinh` của công tắc OMNI: `{"bat":true}` cả trung tâm · `{"bat":true,"lop":["12A1"]}` theo lớp · `{"bat":true,"sbd":["12001"]}` chạy thử. Mặc định TẮT. */
export const KHOA_CO_OMNI = 'omni'
/** Khoá `cau_hinh`: thể lực mặc định theo lớp `{"12A1":40}`. Vắng lớp ⇒ 40. */
export const KHOA_THE_LUC_LOP = 'the_luc_lop'
/** Khoá `cau_hinh`: ma trận đề thi 2026 `{"I":18,"II":4,"III":6}` (số câu mỗi phần). Vắng ⇒ 18/4/6. */
export const KHOA_MA_TRAN_THI = 'ma_tran_thi_2026'
/** Khoá `cau_hinh`: tham số OMNI đã hiệu chỉnh hằng tuần (ghi đè từng phần của THAM_SO_OMNI: S0, T theo dạng…). */
export const KHOA_THAM_SO_OMNI = 'omni_tham_so'
/** Phiên bản mô hình — đổi luật cập nhật/ngưỡng ⇒ tăng số này để bảng đệm `omni_*` dựng lại. */
export const PHIEN_BAN_OMNI = 'omni3-0510-v1'

/**
 * `purpose` của LƯỢT SAI QUÁ NHANH (lướt): KHÔNG phải một lần làm — mọi bộ đếm đúng/sai, mọi phát lại (srs2, luật đóng lỗi, hồ sơ nắm,
 * năng lực, OMNI) bỏ qua như `xem_loi_giai`; nhưng dòng vẫn nằm trong sổ nên câu được coi là ĐÃ PHỤC VỤ HÔM NAY (không hỏi lại trong ngày,
 * mai quay lại như chưa làm). Dòng lướt ghi `ket_qua = NULL`. Chỉ sinh ra khi OMNI bật cho em ⇒ cờ tắt không có dòng nào như vậy.
 */
export const MUC_DICH_LUOT = 'luot'
/** Đoạn SQL dùng chung cho mọi bộ đọc sổ: bỏ dòng "đọc lời giải trước khi làm" và dòng lướt. Cột `purpose` có thể vắng ở D1 cũ ⇒ nơi gọi tự lùi. */
export const SQL_LA_LAN_LAM = "COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot')"

/** Tên A.I làm chủ ngữ trên mọi chữ MỚI của OMNI ở cả ba app (thầy lệnh 05/10: "Thay từ máy bằng A.i Đỗ Đại Học"). Chữ "máy" chỉ THIẾT BỊ giữ nguyên. */
export const TEN_AI = 'A.I Đỗ Đại Học'

export type Phan = 'I' | 'II' | 'III'
export type TuTin = 'chac' | 'chua_chac'
export type NhanTocDo = 'troi_chay' | 'thuong' | 'cham' | 'luot'
/** Ba trạng thái quyết định tuần tự (SPRT) của một vi kỹ năng. */
export type TrangThaiSprt = 'vung' | 'chua_vung' | 'chua_du'
/** Năm khung giờ VN cho hồ sơ mệt: [06,18) · [18,20) · [20,22) · [22,24) · [00,06). */
export type KhungGio = 'truoc18' | '18_20' | '20_22' | '22_24' | 'sau24'
export const CAC_KHUNG_GIO: readonly KhungGio[] = ['truoc18', '18_20', '20_22', '22_24', 'sau24']

export interface CoOmni { bat: boolean; lop: string[]; sbd: string[] }

/** Đọc giá trị `cau_hinh.omni` (chuỗi JSON hoặc object). Hỏng / vắng ⇒ TẮT. Thuần. */
export function docCoOmniTu(giaTri: unknown): CoOmni {
  let o: unknown = giaTri
  if (typeof o === 'string') {
    try { o = JSON.parse(o) } catch { return { bat: false, lop: [], sbd: [] } }
  }
  if (!o || typeof o !== 'object') return { bat: false, lop: [], sbd: [] }
  const r = o as Record<string, unknown>
  const mang = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [])
  return { bat: r.bat === true, lop: mang(r.lop), sbd: mang(r.sbd) }
}
/** Cờ áp cho một em: tắt ⇒ false; bật không danh sách ⇒ mọi em; có danh sách lớp/SBD ⇒ em thuộc một trong hai. Thuần. */
export function coOmniApCho(co: CoOmni, sbd: string, lop: string | null | undefined): boolean {
  if (!co.bat) return false
  if (!co.lop.length && !co.sbd.length) return true
  return co.sbd.includes(sbd) || (!!lop && co.lop.includes(lop))
}

/** Khung giờ VN của một thời điểm (ms). Thuần. */
export function khungGioCua(ms: number): KhungGio {
  const gio = new Date(ms + 7 * 3_600_000).getUTCHours()
  if (gio < 6) return 'sau24'
  if (gio < 18) return 'truoc18'
  if (gio < 20) return '18_20'
  if (gio < 22) return '20_22'
  return '22_24'
}

// ---------------------------------------------------------------- tham số (một nguồn)
export const THAM_SO_OMNI = Object.freeze({
  /** Xác suất đoán mò: Phần I (4 phương án) · MỖI Ý Đúng–sai · Phần III (điền số, 0,01 để không chia cho 0) · cả câu Đúng–sai khi không có kết quả từng ý. */
  G: Object.freeze({ I: 0.25, Y: 0.5, III: 0.01, II_CA_CAU: 0.0625 }),
  /** Sơ ý khởi đầu (prior) + số lượt ảo co Bayes của sơ ý riêng từng em. */
  S0: 0.08,
  S_AO: 10,
  /** Bước học sau mỗi lượt có phản hồi; kẹp khi hiệu chỉnh tuần. */
  T: 0.15,
  T_MIN: 0.05,
  T_MAX: 0.35,
  /** Kẹp P sau cập nhật. */
  P_MIN: 0.02,
  P_MAX: 0.99,
  /** Prior khi không có ca mở màn của em và không có prior lớp. */
  P0: 0.3,
  /** Số em tối thiểu có dữ liệu ở một vi kỹ năng để dùng prior lớp. */
  PRIOR_LOP_TOI_THIEU: 5,
  /** Ngưỡng "đã nắm" khi xét một lượt có phải lượt VỮNG (để đo sơ ý): mọi vi kỹ năng cần có P ≥ ngưỡng này TRƯỚC lượt đó. */
  P_VUNG_DO_SO_Y: 0.9,
  /** CHỨNG CHỈ "Sẵn sàng 8+" — bốn điều kiện K ∧ C ∧ M ∧ T. */
  K_P_VKN: 0.95,
  C_SO_Y: 0.07,
  M_P8: 0.9,
  T_CA_CHOT: 8.0,
  MUC_TIEU: 8.0,
  /** "Cần thầy chữa" loại 3: sơ ý cao dù kiến thức vững. */
  SO_Y_CAO: 0.09,
  /** SPRT: H0 p ≤ 0,7 · H1 p ≥ 0,9 (ý Đúng–sai 0,93) · α 0,10 · β 0,20 ⇒ ngưỡng ±. */
  SPRT: Object.freeze({ p0: 0.7, p1: 0.9, p1Y: 0.93, alpha: 0.1, beta: 0.2 }),
  /** "Dạng đã vững" ngoài SPRT: ≥ 4 câu tự làm khác content_group · ≥ 3 ngày · ≥ 2 lượt trôi chảy · ≥ 2 câu chưa gặp từ BÀI KHÁC trong DẠY HỌC đúng. */
  VUNG_SO_CAU: 4,
  VUNG_SO_NGAY: 3,
  VUNG_TROI_CHAY: 2,
  VUNG_CAU_LA: 2,
  /** Tốc độ: trôi chảy ≤ 1,25 × kỳ vọng riêng · chậm > 2,0 × · lướt = SAI và < max(3 s, 10 % kỳ vọng), kẹp [3, 8] s · ≤ 3 lượt lướt/ngày (lượt 4 tính sai). */
  TROI_CHAY: 1.25,
  CHAM: 2.0,
  LUOT_MS_MIN: 3000,
  LUOT_MS_MAX: 8000,
  LUOT_TI_LE: 0.1,
  LUOT_TOI_DA_NGAY: 3,
  /** Thời lượng máy em gửi được kẹp [0, 900 s]; ngoài khoảng ⇒ coi như không đo. */
  MS_TOI_DA: 900_000,
  /** β câu: cần ≥ 8 lượt đúng tự làm có thời lượng. τ em: 20 lượt gần nhất, co về 0 bằng 10 mẫu ảo. */
  BETA_MAU_TOI_THIEU: 8,
  TAU_SO_MAU: 20,
  TAU_MAU_AO: 10,
  /** Trạm hồi phục: 3 câu sai liền tự làm (không lướt, không gợi ý) trong một chuyến · tối đa 1 trạm/chuyến · 3 câu nền. */
  TRAM_SAI_LIEN: 3,
  TRAM_TOI_DA_CHUYEN: 1,
  TRAM_SO_CAU_NEN: 3,
  /** Vé thử thách: 2 vé/tuần (cấp 00:01 thứ Hai VN, không cộng dồn) · 3 câu cao hơn một bậc. */
  VE_MOI_TUAN: 2,
  VE_SO_CAU: 3,
  /** Hạn bài tự tính: D nhỏ nhất trong [7, 14] sao cho lượt cần của em trung vị ≤ 0,8 × D × thể lực. */
  HAN_BAI_MIN: 7,
  HAN_BAI_MAX: 14,
  HAN_BAI_TI_LE: 0.8,
  THE_LUC_MAC_DINH: 40,
  /** Chế độ chờ bài mới: thể lực 60 % (sàn 12) · duy trì nới tới 50 % · ôn bài cũ lấp phần còn lại. */
  CHO_THE_LUC_TI_LE: 0.6,
  CHO_THE_LUC_SAN: 12,
  CHO_DUY_TRI_TI_LE: 0.5,
  /** Ôn bài cũ khi có bài đang luyện: ≤ 20 % thể lực; ngày 4–5 của bài (đan xen) ≤ 40 %. */
  ON_BAI_CU_TI_LE: 0.2,
  DAN_XEN_TI_LE: 0.4,
  DAN_XEN_NGAY: Object.freeze([4, 5]),
  /** Chọn câu ĐỂ HỌC: ưu tiên vùng P(đúng) dự đoán [0,75; 0,90] (×1,3); P(đúng) < 0,5 ×0,8 (quy tắc 85 %). */
  VUNG_HOC: Object.freeze({ tu: 0.75, den: 0.9, heSo: 1.3, khoHeSo: 0.8, khoDuoi: 0.5 }),
  /** Đề thử nửa (ngày 6 trở đi của bài): 14 câu lạ · 25 phút · chỉ đo. */
  DE_THU: Object.freeze({ soCau: 14, phut: 25, ngayTu: 6 }),
  /** Ca chốt: khung 18 + 4 + 6 · 50 phút · 50 % câu chưa gặp cùng ô từ TU LUYỆN. */
  CA_CHOT: Object.freeze({ I: 18, II: 4, III: 6, phut: 50, tiLeLa: 0.5 }),
  /** Khung đề dùng cho dự báo khi thầy chưa nhập ma trận. */
  KHUNG_DE: Object.freeze({ I: 18, II: 4, III: 6 }),
  /** Điểm mỗi câu: Phần I và III 0,25; Phần II theo số ý đúng 0/1/2/3/4 = 0 · 0,1 · 0,25 · 0,5 · 1. */
  DIEM_CAU: Object.freeze({ I: 0.25, III: 0.25 }),
  DIEM_Y: Object.freeze([0, 0.1, 0.25, 0.5, 1]),
  /** Ngân sách thời gian đề thi (giây) — lọc tập câu khả thi theo tốc độ riêng. */
  THOI_GIAN_THI_GIAY: 50 * 60,
  /** Hồ sơ mệt: kích hoạt khi tỉ lệ (lướt + chắc-mà-sai) ở khung hiện tại ≥ 2 × khung tốt nhất, ≥ 20 lượt thật; co Bayes 20 lượt ảo. */
  MET_GIO: Object.freeze({ boi: 2, toiThieu: 20, luotAo: 20 }),
  /** Dự báo chỉ hiện cho phụ huynh khi đủ 3 ca chốt và sai số tuyệt đối trung bình ≤ 0,6 điểm. */
  HIEU_CHUAN: Object.freeze({ soCaChot: 3, maeToiDa: 0.6 }),
  /** Thầy xác nhận dạng: vững ⇒ P = 0,95 + điểm SPRT đạt ngưỡng; dạy lại ⇒ P = 0,10 + mở đợt dạy lại. */
  XAC_NHAN: Object.freeze({ vung: 0.95, dayLai: 0.1 }),
})
export type ThamSoOmni = typeof THAM_SO_OMNI

// ---------------------------------------------------------------- dữ liệu vào của mô hình
/** Một dòng `su_kien_hoc` đã chuẩn hoá cho OMNI. Nơi đọc D1 dựng (omni-d1.ts); lõi thuần chỉ nhận kiểu này. */
export interface SuKienOmni {
  khoa: string
  sbd: string
  /** qid GỐC (đã bỏ hậu tố song sinh `~ss0|1`). */
  qid: string
  songSinh: boolean
  nguon: string
  /** 1 đúng · 0 sai · null bỏ trống (không là quan sát). */
  ketQua: 0 | 1 | null
  /** ISO 8601 (giờ học). */
  luc: string
  /** YYYY-MM-DD giờ VN. */
  ngayVn: string
  /** Giờ máy chủ tiếp nhận (ms) — thứ tự phát lại (receivedAt, khoa); thiếu ⇒ Date.parse(luc). */
  receivedAt: number
  assistance: 'none' | 'assisted' | 'unknown'
  purpose: string | null
  phan: Phan
  maDang: string | null
  mucDo: string | null
  contentGroup?: string | null
  /** Kết quả TỪNG Ý Phần II (đọc `subitem_json`): 4 phần tử 1/0/null. Vắng ⇒ dùng kết quả cả câu với G.II_CA_CAU. */
  y?: readonly (0 | 1 | null)[] | null
  /** Từ `raw_json` (chỉ có khi OMNI bật lúc làm): thời lượng máy em đo, tự tin, nhãn tốc độ đã tính lúc chấm. */
  msLam?: number | null
  tuTin?: TuTin | null
  nhanTocDo?: NhanTocDo | null
  /** Câu thuộc BÀI nào trong phạm vi DẠY HỌC (để đếm "câu lạ từ bài khác"); vắng ⇒ không rõ. */
  khoaBai?: string | null
}

/** Một vi kỹ năng trong danh mục (`omni_vkn`). `id` dạng `<ma_dang>#<số>`; vi kỹ năng mặc định của một dạng: `dang:<ma_dang>`. */
export interface Vkn {
  id: string
  maDang: string
  ten: string
  /** Tên lỗi hay gặp khi hỏng vi kỹ năng này (Trạm hồi phục đọc). */
  tenLoi?: string | null
  /** Nhãn kiến thức nền (khoá ngân hàng `cau_nen.nhan`) để lấy câu nền. */
  nhanNen?: string | null
  thuTu: number
}

/** Ma trận Q của một câu: vi kỹ năng câu cần (cổng AND), và — Phần II — vi kỹ năng TỪNG Ý. */
export interface QCau {
  qid: string
  phan: Phan
  maDang: string | null
  mucDo: string | null
  /** Vi kỹ năng cả câu (Phần I/III; Phần II khi không có kết quả từng ý). Không bao giờ rỗng: thiếu nhãn ⇒ [`dang:<ma_dang>`] (hoặc `cd:<chuyên đề>`). */
  vkn: string[]
  /** Phần II: đúng 4 phần tử, mỗi phần tử ≥ 1 vi kỹ năng. Vắng ⇒ mỗi ý dùng `vkn`. */
  vknY?: string[][]
  /** 'thay' = thầy đã duyệt · 'goi_y' = A.I gợi từ nhãn kho · 'mac_dinh' = lùi về một vi kỹ năng = dạng. */
  nguon: 'thay' | 'goi_y' | 'mac_dinh'
  khoaBai?: string | null
  contentGroup?: string | null
}

/** Thầy xác nhận một dạng của em ở Bảng bài (bảng chỉ-thêm `omni_xac_nhan`, phát lại cùng sổ). */
export interface XacNhanThay { sbd: string; maDang: string; ket: 'vung' | 'day_lai'; luc: string }

// ---------------------------------------------------------------- hồ sơ em (kết quả phát lại — ĐỆM, dựng lại 100 % từ sổ)
export interface HoSoVkn {
  vkn: string
  p: number
  /** Số quan sát tự làm độc lập (một/câu/ngày). */
  nTuLam: number
  /** Số câu KHÁC content_group đã có quan sát tự làm. */
  nCau: number
  /** Số ngày VN khác nhau có quan sát. */
  nNgay: number
  /** Số lượt đúng trôi chảy. */
  nTroiChay: number
  /** Số câu CHƯA GẶP thuộc BÀI KHÁC (trong DẠY HỌC) làm đúng lần đầu — bằng chứng chuyển giao. */
  nCauLaDung: number
  diemSprt: number
  trangThai: TrangThaiSprt
  ngayCuoi: string | null
  /** Có đợt dạy lại đang mở (thầy bấm "Chưa đạt, dạy lại" và chưa có lượt đúng tự làm sau đó). */
  dayLai: boolean
}

export interface HoSoOmniEm {
  sbd: string
  vkn: Record<string, HoSoVkn>
  /** Sơ ý riêng: (n_sai_vung + S0 × S_AO) / (n_vung + S_AO). */
  sEm: number
  nVung: number
  nSaiVung: number
  /** Tốc độ riêng (log): τ > 0 nhanh hơn lớp. */
  tau: number
  nTau: number
  /** Lượt thật và lượt "sơ ý" (lướt + chắc-mà-sai) theo khung giờ. */
  khungGio: Record<KhungGio, { n: number; soY: number }>
  /** Số lượt lướt hôm nay (ngày `homNay` của lần phát lại). */
  luotHomNay: number
  /** Con trỏ phát lại (receivedAt, khoa) của sự kiện cuối đã dùng. */
  cursor: string
  phienBan: string
}

// ---------------------------------------------------------------- dự báo + chứng chỉ
/** Khung số câu từng phần của một đề. */
export interface KhungDe { I: number; II: number; III: number }
/** Xác suất đúng TRUNG BÌNH của một câu từng phần (Phần II: từng Ý) trên phạm vi. */
export interface XacSuatPhan { pI: number; pY: number; pIII: number }
export interface PhanBoDiem { kyVong: number; p8: number; saiSo: number; pmf: number[] }
export interface DuBao extends PhanBoDiem {
  /** Con đường tới mục tiêu rẻ nhất (mục 3.2 đặc tả bản 3): 'A' cân bằng · 'B' mạnh Phần I · 'C' mạnh Phần II; null khi đã đạt. */
  conDuong: 'A' | 'B' | 'C' | null
  /** Vi kỹ năng còn dưới ngưỡng K và số ý Đúng–sai còn thiếu (theo ý). */
  conThieu: { vkn: string[]; soY: number }
  /** Số câu từng phần khả thi trong 50 phút theo tốc độ riêng (vắng ⇒ đủ khung). */
  khaThi?: KhungDe
  /** Tổng số quan sát tự làm trong phạm vi (để nói kèm cỡ mẫu). */
  soBangChung: number
}
export type LyDoChungChi = 'kien_thuc' | 'can_than' | 'mo_hinh' | 'ca_chot'
export interface ChungChi {
  dat: boolean
  /** Độ tin = P(điểm ≥ 8) của mô hình (0..1). Không bao giờ hiện 100 %: chữ hiện tối đa 99 %. */
  doTin: number
  /** Điều kiện còn thiếu (rỗng khi đạt). */
  thieu: LyDoChungChi[]
  conThieu: { vkn: string[]; soY: number }
  /** Ước số ngày còn cần theo nhịp thật của em; null khi đã đạt hoặc chưa ước được. */
  uocNgay: number | null
}

// ---------------------------------------------------------------- phản hồi cho app (chi tiết từng trường: docs/hop-dong-omni-3.md)
/** Trạm hồi phục (trả kèm `answer` khi đủ 3 câu sai liền). Client mở luồng câu nền SẴN CÓ (`/hs/luyen-nen` với `nhan`). */
export interface TramHoiPhuc {
  vkn: string | null
  ten: string | null
  tenLoi: string | null
  /** Nhãn câu nền (khoá `cau_nen.nhan`); null ⇒ không có câu nền — chỉ đổi ải kế dễ hơn một bậc. */
  nhan: string | null
  coCauNen: boolean
  /** Một câu chữ hiển thị (đã có số/tên, chủ ngữ A.I Đỗ Đại Học). */
  chu: string
}
/** Phần OMNI thêm vào phản hồi `answer` (chỉ khi OMNI bật cho em). */
export interface KetQuaOmniTraLoi {
  nhanTocDo: NhanTocDo | null
  msLam: number | null
  msKyVong: number | null
  /** Lướt: không tính đúng/sai, không trừ Máu, câu quay lại ngày mai. */
  luot: boolean
  /** Chắc mà sai ⇒ client mở lời giải từng bước ngay. */
  chacMaSai: boolean
  tram?: TramHoiPhuc
  dang?: { ma: string; ten: string; pTruoc: number; pSau: number; nTuLam: number; nNgay: number }
  /** Một dòng chữ dưới kết quả (đúng nhưng chậm / lướt / chưa chắc…); null ⇒ không thêm dòng. */
  loiNhan: string | null
}
/** Phần OMNI thêm vào `hoa2-sanh`. */
export interface SanhOmni {
  bat: true
  baiDangLuyen: { id: string; ten: string; hanNop: string }[]
  dangVung: { a: number; b: number }
  /** Số dạng còn cần vững để chạm mốc 8 (em KHÔNG thấy điểm dự báo thô). null ⇒ chưa đủ dữ liệu. */
  conDangDe8: number | null
  sEm: number | null
  sMucTieu: number
  chungChi: { ten: string; doTin: number; ngay: string }[]
  ve: { con: number; tong: number }
  choBaiMoi: boolean
  onBaiCu: number
  metGio: { khung: KhungGio; tiLe: number; tiLeTot: number; coTheDoi: boolean } | null
  nhatKy: string[] | null
  deThu: { duoc: boolean; soCau: number; phut: number }
}
/** Phần OMNI thêm vào `/ph/hoc-2`. */
export interface PhOmni {
  khoangCach8: number | null
  hieuChuan: { soCaChot: number; du: boolean }
  dangCanVung: string[]
  sEm: number | null
  chungChi: { ten: string; doTin: number; ngay: string; diem: number | null }[]
  gioHoc: string | null
  canThayChua: number
}
export interface CanThayChua {
  loai: 'nut_that' | 'cat_tia' | 'so_y'
  tieuDe: string
  phu: string
  soEm: number
  qids?: string[]
  sbd?: string[]
  vkn?: string
}
/** Bảng bài của thầy (`/gv/omni` action `bang`). */
export interface BangOmni {
  ok: true
  chienDich: { id: string; ten: string; hanNop: string; lop: string | null }
  em: { sbd: string; ten: string }[]
  dang: { ma: string; ten: string }[]
  o: Record<string, Record<string, { p: number; n: number; trangThai: TrangThaiSprt }>>
  sEm: Record<string, number | null>
  khoangCach8: Record<string, number | null>
  sanSang: Record<string, number | null>
  hieuChuan: { soCaChot: number; du: boolean }
  canThayChua: CanThayChua[]
}
