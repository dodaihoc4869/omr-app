// BỘ NÃO — KHUÔN ĐẦU RA + KIỂM KHUÔN (Code 1, 21/09/2026). Đề bài `prompt-bo-nao.md`; KHUÔN là hợp đồng ở `bo-nao/HUONG-DAN-BO-NAO.md`; thiết kế `DE-XUAT-BO-NAO-AI-2109.md`.
//
// Hai nơi cùng import tệp này (hai lớp kiểm): `scripts/bo-nao/nop.mjs` kiểm tại máy thầy trước khi gửi, `server/src/bo-nao.ts` kiểm LẦN NỮA trước khi lưu.
// THUẦN: không IO, không đồng hồ, không `Math.random`. Sai khuôn là BỎ phần tử ấy (không sửa hộ) và trả lý do bằng lời để báo thầy.
//
// AI (phiên trên máy thầy) chỉ VẶN NÚM trong khung; không bao giờ chọn mã câu, bỏ lõi, vượt bậc + 1, sửa điểm, soạn gì cho phụ huynh, nhắc ca thi đang mở.
// Luật lời nhắn cho em: chỉ số có trong THẺ của em; không so với bạn; không nhãn năng lực; không doạ; ≤ 140 ký tự.
import type { DieuChinhEm } from './btvn-nang-do'

// ══════════════════════════════ KIỂU ══════════════════════════════

export type HanhDongDang = 'uu_tien' | 'ha_mot_bac' | 'cho_thu_len_bac' | 'tam_nghi'
export type CoBoNao = 'khong' | 'tut_nhip' | 'qua_tai' | 'lam_cho_xong' | 'nghi_chep'
/** KHẮC PHỤC LUÔN (bộ não tự hành, 21/09): `khac_phuc` = cho em gặp lại đúng dạng vừa vấp ngay chặng kế (`soCau` câu, đúng bậc hoặc thấp hơn một bậc; thuật toán bớt câu riêng dễ để tổng tải không tăng);
 * `on_som` = kéo các câu em vừa sai của dạng ấy về ôn sớm (chỉ SỚM hơn, không bao giờ muộn hơn — máy chủ làm). */
export type KieuKhacPhuc = 'khac_phuc' | 'on_som'
export type BacKhacPhuc = 'dung_bac' | 'thap_hon_mot_bac'
export interface KhacPhucEm {
  dang: string
  kieu: KieuKhacPhuc
  /** 2–4 với `khac_phuc`; vắng với `on_som`. */
  soCau?: number
  /** Vắng với `on_som`. */
  bac?: BacKhacPhuc
}
export type HanhDongChoThay = 'khong' | 'goi_len_bang' | 'nhan_phu_huynh' | 'giao_bai_rieng'
/** THỬ THÁCH RIÊNG HÔM NAY (thầy chốt 21/09, hợp đồng `docs/hop-dong-thu-thach-rieng-2109.md`): Bộ não chọn DẠNG + số câu + bậc, KHÔNG chọn mã câu (máy chủ chọn). Không bắt buộc, không hạn. */
export type BacThuThach = 'dung_bac' | 'thap_hon_mot_bac' | 'cao_hon_mot_bac'
export interface ThuThachEm {
  /** 1–2 mã dạng, CÓ TRONG thẻ, không lặp. */
  dang: string[]
  /** Số nguyên 3–8 (máy chủ có thể chọn được ít hơn ⇒ lời mời KHÔNG được nêu số câu). */
  soCau: number
  bac: BacThuThach
}

/**
 * V4 "VÒNG KHÉP KÍN" (thầy chốt 21/09; đề xuất `docs/de-xuat-bo-nao-v3-v4-2109.md`): Bộ não ĐỀ XUẤT ≤ 2 NHÃN KÍN về cách em hợp với lời mời/thử thách, mỗi nhãn kèm SỐ BẰNG CHỨNG trong thẻ. KHÔNG chữ tự do
 * (không nhãn năng lực, không lộ đời tư). Em KHÔNG thấy; thầy xem chỉ-đọc ở Hồ sơ em; hết hạn 14 ngày. Ba cặp đối nghịch: thích thử thách / cần trấn an · thích ngắn / cần giải thích · học sớm / học muộn.
 */
export type NhanHuongEm = 'thu_thach' | 'tran_an' | 'ngan' | 'giai_thich' | 'som' | 'muon'
export interface HuongEmDeXuat {
  nhan: NhanHuongEm
  /** 1–4 con số THẬT trong thẻ làm bằng chứng (không rỗng, mọi số phải có trong thẻ). */
  so: number[]
}
/** V3 "MỤC TIÊU TUẦN": MỘT dạng + bậc đích (= bậc hiện tại + 1), chỉ ở ngày soi kỹ hằng tuần của em. Đi cùng `loiMucTieu`. */
export interface MucTieuTuanEm {
  dang: string
  den: 1 | 2
}

/** MỘT PHẦN TỬ ĐẦU RA của bộ não cho MỘT em (`ra/<tệp>.json` là mảng các phần tử này). `biDanh` là bí danh của đêm — nop.mjs đổi về SBD trước khi gửi. */
export interface DauRaEm {
  biDanh: string
  /** 0–1. Dưới `NGUONG_TIN_CAY` ⇒ máy chủ chỉ ghi sổ, không áp dụng. */
  doTinCay: number
  nhip: { lech: number; khoiDong: number }
  dang: { ma: string; hanhDong: HanhDongDang; lyDo: string }[]
  /** ≤ 2 phần tử (mỗi dạng tối đa một). Có thể vắng ở phần tử cũ ⇒ coi như rỗng. */
  khacPhuc: KhacPhucEm[]
  co: CoBoNao
  loiNhanChoEm: string
  /** ≤ 280 ký tự hoặc rỗng — CHỈ khi thẻ có một lý do "khi nào viết" (xem `KHI_NAO_VIET_PHU_HUYNH`); ngày thường để rỗng. Vắng ⇒ coi như rỗng. */
  loiNhanChoPhuHuynh: string
  /** ≤ 600 ký tự hoặc rỗng — CHỈ ở lượt soi kỹ hằng tuần của em (`the.luotSoiKyTuan`). Vắng ⇒ coi như rỗng. */
  thuTuan: string
  goiYChoThay: { chu: string; hanhDong: HanhDongChoThay; dang: string }
  ghiChuHlv: string
  /** Em cần nhìn kỹ hơn (mô hình nhỏ đặt khi thấy tín hiệu khó) — KHÔNG phải điều chỉnh, máy chủ bỏ qua khi nộp. */
  canSau: boolean
  /** THỬ THÁCH RIÊNG HÔM NAY: hai trường ĐI CÙNG NHAU (thiếu một ⇒ bỏ cả hai). Sai khuôn chỉ làm mất phần này (`boLoi: ['thuThach']`), các phần khác của phần tử vẫn xét như cũ. Vắng ⇒ không có thử thách. */
  thuThach?: ThuThachEm
  /** ≤ 200 ký tự: lời mời hôm nay. Phải có ≥ 1 số THẬT trong thẻ, không nêu số câu sẽ làm, tên thú chỉ lấy từ `thanThu.ten` của thẻ. */
  loiMoi?: string
  /** V4 (CHƯA bật — xem cẩm nang): ≤ 2 nhãn kín kèm số bằng chứng. Sai khuôn CHỈ bỏ phần này (`boLoi: ['huongEm']`). */
  huongEm?: HuongEmDeXuat[]
  /** V3 (CHƯA bật): mục tiêu tuần — hai trường ĐI CÙNG NHAU với `loiMucTieu`. Sai khuôn CHỈ bỏ phần này (`boLoi: ['mucTieuTuan']`). */
  mucTieuTuan?: MucTieuTuanEm
  loiMucTieu?: string
}

/** Loại dòng bản tin (Boss chốt tên 21/09): em cần thầy để ý · dạng cả lớp · gợi ý gọi lên bảng · điều chỉnh hôm qua có ăn thua không · thầy xem lại một điều chỉnh. */
export type LoaiDongBanTin = 'can_thay_y' | 'ca_lop' | 'goi_len_bang' | 'dieu_chinh' | 'thay_xem_lai'
export type HanhDongBanTin = 'khong' | 'xem_ho_so' | 'goi_len_bang' | 'dua_vao_buoi_chua' | 'nhan_phu_huynh' | 'giao_bai_rieng'

/** Một dòng bản tin sáng cho thầy (khối "Bộ não đêm qua") do AI viết: CHỈ chữ không tên. `biDanh` (có thể rỗng khi dòng nói về cả lớp) được nop.mjs đổi về SBD; máy chủ ghép TÊN em từ SBD. */
export interface DongBanTin {
  loai: LoaiDongBanTin
  chu: string
  biDanh: string
  dang: string
  hanhDong: HanhDongBanTin
}

/** `ra/lop.json`: bản tin sáng ≤ 6 dòng. */
export interface BanTinSang {
  cacDong: DongBanTin[]
}

/** Kết quả kiểm: `lyDo` rỗng khi hợp lệ; mỗi lý do MỘT câu ngắn để báo thầy ("bị loại vì sao"). */
export interface KetQuaKiem {
  hopLe: boolean
  /** Lỗi làm HỎNG phần tử (bị BỎ cả phần tử). */
  lyDo: string[]
  /** Lỗi chỉ làm mất MỘT LỜI (phụ huynh / thư tuần): phần tử vẫn hợp lệ, phần núm được giữ, lời đó bị làm rỗng (`lamSachDauRa`). */
  canhBao?: string[]
  boLoi?: ('loiNhanChoPhuHuynh' | 'thuTuan' | 'thuThach' | 'huongEm' | 'mucTieuTuan')[]
}

/** Phần thẻ CỦA EM mà kiểm khuôn cần: bí danh, mã dạng có trong thẻ, và TOÀN BỘ thẻ (để gom mọi con số có thật). Thẻ đầy đủ ở `bo-nao-dac-trung.ts`. */
export interface TheDeKiem {
  biDanh: string
  /** Mã dạng có trong thẻ (dạng AI được phép nêu). Vắng/`undefined` ⇒ không kiểm mã dạng. */
  maDang?: string[]
  /** Hôm nay là lượt soi kỹ hằng tuần của em ⇒ được viết `thuTuan`. Vắng ⇒ không. */
  luotSoiKyTuan?: boolean
  /** Các lý do "khi nào viết lời cho phụ huynh" mà thuật toán thấy trong thẻ. Vắng/rỗng ⇒ KHÔNG được có `loiNhanChoPhuHuynh`. */
  khiNaoVietPhuHuynh?: string[]
  /** Số lời cho phụ huynh em đã có trong 7 ngày trước; đủ `TRAN_LOI_PHU_HUYNH_7_NGAY` ⇒ KHÔNG được viết thêm. */
  soLoiPhuHuynh7?: number
  /** Các dạng đã xử lý trong lời gần nhất cho phụ huynh: lý do "vấp lặp đã xử lý" chỉ hợp lệ khi đầu ra xử lý một dạng KHÔNG nằm trong danh sách này. */
  dangLoiPhuHuynhTruoc?: string[]
  [khac: string]: unknown
}

// ══════════════════════════════ HẰNG SỐ ══════════════════════════════

export const HAN_MUC_BO_NAO = {
  NHIP_LECH_TOI_DA: 3,
  KHOI_DONG_TOI_THIEU: 1,
  KHOI_DONG_TOI_DA: 3,
  SO_DANG_TOI_DA: 3,
  SO_KHAC_PHUC_TOI_DA: 2,
  KHAC_PHUC_SO_CAU_TOI_THIEU: 2,
  KHAC_PHUC_SO_CAU_TOI_DA: 4,
  LY_DO_TOI_DA: 80,
  LOI_NHAN_TOI_DA: 160,
  LOI_PHU_HUYNH_TOI_DA: 280,
  /** Tối đa bấy nhiêu lời cho phụ huynh / em / 7 ngày (không tính thư tuần) — cùng số với `TRAN_LOI_PHU_HUYNH` của `bo-nao-dac-trung.ts` (test so hai nơi). */
  TRAN_LOI_PHU_HUYNH_7_NGAY: 2,
  THU_TUAN_TOI_DA: 600,
  GOI_Y_TOI_DA: 200,
  GHI_CHU_HLV_TOI_DA: 200,
  /** Thử thách riêng (thầy chốt 21/09): ≤ 2 dạng, 3–8 câu, lời mời ≤ 200 ký tự; `cao_hon_mot_bac` chỉ khi dạng ấy đã đúng ≥ 80 % trong ≥ 5 câu gần nhất theo số trong thẻ. */
  THU_THACH_SO_DANG_TOI_DA: 2,
  THU_THACH_SO_CAU_TOI_THIEU: 3,
  THU_THACH_SO_CAU_TOI_DA: 8,
  LOI_MOI_TOI_DA: 200,
  THU_THACH_LEN_BAC_DUNG_TOI_THIEU: 0.8,
  THU_THACH_LEN_BAC_MAU_TOI_THIEU: 5,
  /** V4: ≤ 2 nhãn kín, mỗi nhãn ≥ 3 ngày có bài trong 7 ngày (`hoatDong.ngayCoBai7`), 1–4 số bằng chứng; `som` khi giờ học trung vị ≤ 19, `muon` khi ≥ 21; hết hạn 14 ngày (máy chủ). */
  HUONG_EM_SO_NHAN_TOI_DA: 2,
  HUONG_EM_SO_NGAY_TOI_THIEU: 3,
  HUONG_EM_SO_BANG_CHUNG_TOI_DA: 4,
  HUONG_EM_GIO_SOM_TOI_DA: 19,
  HUONG_EM_GIO_MUON_TOI_THIEU: 21,
  HUONG_EM_TUOI_THO_NGAY: 14,
  /** Khi thẻ có `huongEm` `ngan` ⇒ thử thách hôm nay ≤ chừng này câu. */
  HUONG_EM_NGAN_SO_CAU_TOI_DA: 5,
  /** V3: lời mục tiêu ≤ 160 ký tự; dạng phải đủ tin (≥ bấy nhiêu câu đã gặp). */
  LOI_MUC_TIEU_TOI_DA: 160,
  MUC_TIEU_SO_CAU_DU_TIN: 4,
  BI_DANH_TOI_DA: 40,
  MA_DANG_TOI_DA: 80,
  BAN_TIN_SO_DONG_TOI_DA: 6,
  DONG_BAN_TIN_TOI_DA: 160,
  /** Dưới ngưỡng này máy chủ chỉ ghi sổ, không áp dụng. 0,6 từ 21/09 (bộ não TỰ HÀNH: thầy không duyệt từng điều chỉnh; trước đó 0,5). */
  NGUONG_TIN_CAY: 0.6,
  /** Điều chỉnh tự hết hạn sau bấy nhiêu ngày. */
  HAN_NGAY: 3,
} as const

export const HANH_DONG_DANG: readonly HanhDongDang[] = ['uu_tien', 'ha_mot_bac', 'cho_thu_len_bac', 'tam_nghi']
export const CO_BO_NAO: readonly CoBoNao[] = ['khong', 'tut_nhip', 'qua_tai', 'lam_cho_xong', 'nghi_chep']
export const HANH_DONG_CHO_THAY: readonly HanhDongChoThay[] = ['khong', 'goi_len_bang', 'nhan_phu_huynh', 'giao_bai_rieng']
export const BAC_THU_THACH: readonly BacThuThach[] = ['dung_bac', 'thap_hon_mot_bac', 'cao_hon_mot_bac']
export const NHAN_HUONG_EM: readonly NhanHuongEm[] = ['thu_thach', 'tran_an', 'ngan', 'giai_thich', 'som', 'muon']
/** Ba TRỤC đối nghịch: một em không được mang cả hai nhãn của cùng một trục. */
export const TRUC_HUONG_EM: readonly (readonly [NhanHuongEm, NhanHuongEm])[] = [['thu_thach', 'tran_an'], ['ngan', 'giai_thich'], ['som', 'muon']]
export const LOAI_DONG_BAN_TIN: readonly LoaiDongBanTin[] = ['can_thay_y', 'ca_lop', 'goi_len_bang', 'dieu_chinh', 'thay_xem_lai']
export const HANH_DONG_BAN_TIN: readonly HanhDongBanTin[] = ['khong', 'xem_ho_so', 'goi_len_bang', 'dua_vao_buoi_chua', 'nhan_phu_huynh', 'giao_bai_rieng']

/** Các lý do được phép viết lời cho phụ huynh ("khi nào viết", cẩm nang): con đạt mốc đáng khen · con vấp lặp một dạng VÀ bộ não ĐÃ xử lý · con bỏ dở 2 ngày liền · con vắng ≥ 3 ngày · con vừa thi xong. */
export const KHI_NAO_VIET_PHU_HUYNH = ['moc_dang_khen', 'vap_lap_da_xu_ly', 'bo_do_2_ngay', 'vang_3_ngay', 'vua_thi'] as const

// TỪ CẤM — so theo TỪ / CỤM ĐÃ CHUẨN NFC, chữ thường, CÓ DẤU (không bỏ dấu: "kẽm", "đốt cháy", "rót", "yêu thích", "tiến bộ" là chữ bình thường của bài Hoá / lời khen và
// KHÔNG được báo nhầm). Nhược điểm chấp nhận: "axit yếu" trong lời cho em bị chặn — viết "axit có độ phân li nhỏ" hoặc bỏ nhắc thuật ngữ.
/** Lời gửi CHO EM: nhãn năng lực, so với bạn, xếp hạng, doạ / mỉa, nhắc đáp án / ca thi / phụ huynh. */
export const TU_CAM_CHO_EM: readonly string[] = [
  'yếu', 'kém', 'giỏi', 'dốt', 'ngu', 'lười', 'tệ', 'tồi', 'ngốc', 'nắm chắc', 'thông minh', 'năng lực',
  'xếp hạng', 'hạng nhất', 'hạng nhì', 'cao nhất lớp', 'thấp nhất lớp', 'so với bạn', 'hơn bạn', 'thua bạn', 'bạn khác', 'các bạn', 'cả lớp', 'bắt kịp bạn',
  'thất bại', 'trượt', 'rớt', 'bị phạt', 'phạt', 'doạ', 'dọa', 'nguy hiểm', 'thảm hại', 'vô vọng',
  'đáp án', 'ca thi', 'phụ huynh', 'cha mẹ', 'bố mẹ', 'ba mẹ', 'điểm thi', 'dự đoán',
]
/** Lời MỜI thử thách (`loiMoi`), NGOÀI `TU_CAM_CHO_EM`: hứa điều không chắc xảy ra (EXP chỉ có khi trả lời đúng; máy chủ có thể chọn được ít câu hơn) và xưng hô gọi tên (thẻ ẩn danh — Bộ não không biết tên em). */
export const TU_CAM_RIENG_LOI_MOI: readonly string[] = [
  'chắc chắn', 'đảm bảo', 'nhất định', 'cam kết', 'xong là', 'là đủ', 'chỉ cần', 'sẽ lên cấp', 'chắc sẽ', 'chắc là', 'ơi',
  // KHEN CHUNG CHUNG (thầy 21/09: "quan tâm sâu sắc" = khen ĐÚNG việc em làm bằng dữ kiện, không khen suông)
  'tuyệt vời', 'xuất sắc', 'làm tốt lắm', 'rất tốt', 'cố lên', 'tiếp tục phát huy', 'quá giỏi',
  // SO SÁNH NGẦM VỚI BẠN KHÁC (Boss 21/09: lời E046 "hiếm có" hàm ý hơn bạn khác): khen chỉ so với CHÍNH em, không nói em "hiếm" so với ai.
  'hiếm có', 'hiếm ai', 'ít ai',
  // KHIÊN (Boss 22/09, luật khiên mới đã sống): chữ "khiên" CHỈ được nói kèm luật "21 ngày đạt nhiệm vụ ngày" (kiểm riêng ở `kiemChuLoiMoi`); số mảnh khiên thì vẫn cấm.
  'mảnh khiên',
]
/** SỐ CỦA LUẬT (không phải số của thẻ) mà lời mời được nêu: thú ăn no 200 EXP khi đạt nhiệm vụ ngày (120 khi làm đủ 4 câu chưa đạt), khiên đầu sau 21 ngày đạt. Không tính là "số thật có trong thẻ". */
export const HANG_SO_LUAT_LOI_MOI: ReadonlySet<string> = new Set(['200', '120', '21', '4'])
/**
 * TẠM ẨN SỐ CỦA GAME khỏi Bộ não (lệnh tạm của Boss 21/09 chiều, cho lượt chiều): thầy đang siết đường cấp (21 ngày tới cấp 10, 1 200 ngày tới cấp 120) và tính lại cấp của em đã chơi
 * ⇒ "thiếu 27 EXP lên cấp 8" sẽ sai. Bỏ `exp` (tổng EXP, cấp) và `thanThu.{cap, expConThieu, manhKhien, manhKhienTong}`; GIỮ tên thú (`thanThu.ten`) và `thanThu.chuoiNgay`.
 * GỠ khi Boss báo luật cấp mới đã sống: đặt `SO_GAME_AN_TAM` về `{ goc: [], thanThu: [] }` (không cần sửa chỗ khác).
 */
export const SO_GAME_AN_TAM: { goc: readonly string[]; thanThu: readonly string[] } = { goc: ['exp'], thanThu: ['cap', 'expConThieu', 'manhKhien', 'manhKhienTong'] }
export function anSoGameTam<T>(the: T): T {
  if (the === null || typeof the !== 'object' || Array.isArray(the)) return the
  const ra: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(the)) if (!SO_GAME_AN_TAM.goc.includes(k)) ra[k] = v
  const tt = ra.thanThu
  if (tt !== null && typeof tt === 'object' && !Array.isArray(tt)) ra.thanThu = Object.fromEntries(Object.entries(tt as Record<string, unknown>).filter(([k]) => !SO_GAME_AN_TAM.thanThu.includes(k)))
  return ra as T
}

/**
 * LUẬT CẤP MỚI (Boss duyệt 21/09 chiều, áp từ lượt 04:00 22/09): lời mời nói về "cho {tên thú} ăn hôm nay"; được nêu SỐ CỦA LUẬT (`HANG_SO_LUAT_LOI_MOI`: 200 · 120 · 21 · 4) nhưng KHÔNG nêu số cấp, KHÔNG nêu số EXP
 * còn thiếu để lên cấp (số ấy đổi theo giờ / theo hồ sơ nên lời soạn lúc 04:00 có thể sai lúc em đọc). Bắt: "cấp 6", "6 cấp", "level 6"; "N EXP" / "EXP N" với N ngoài số của luật; câu vừa có "EXP" vừa có "lên cấp".
 * Không truyền `hangSo` (lời mục tiêu tuần) ⇒ MỌI số đi kèm EXP đều bị cấm như bản tạm.
 */
const SO_CAP_CAM = /(?:cấp|level|lv)\s*(?:độ\s*)?\d|\d\s*cấp/iu
const SO_TRUOC_EXP = /(\d[\d.,]*)\s*(?:exp|điểm kinh nghiệm|kinh nghiệm)/giu
const SO_SAU_EXP = /(?:exp|kinh nghiệm)\s*[:=]?\s*(\d[\d.,]*)/giu
function viPhamExpCap(lm: string, hangSo?: ReadonlySet<string>): string | null {
  const t = lm.normalize('NFC')
  if (SO_CAP_CAM.test(t)) return 'nêu số cấp của thú'
  for (const re of [SO_TRUOC_EXP, SO_SAU_EXP]) for (const m of t.matchAll(re)) if (!hangSo || !hangSo.has(chuanSo(m[1]!))) return `nêu số EXP ngoài luật (${m[1]})`
  if (t.split(/[.!?]+/u).some((c) => /exp/iu.test(c) && /lên cấp/iu.test(c))) return 'nói EXP còn thiếu để lên cấp'
  return null
}
const CO_LUAT_KHIEN = /21\s+ngày\s+đạt\s+nhiệm\s+vụ\s+ngày/iu
/** Lời mời / lời mục tiêu KHÔNG được nói ra điều Bộ não "biết" về em (nhãn `huongEm` là để CHỈNH lời, không để khoe): cấm những cách nói này. */
export const TU_LO_HUONG_EM: readonly string[] = ['em thích', 'em hay', 'em thường', 'mình biết em', 'mình để ý', 'mình thấy em', 'mình nhận ra em', 'mình nhớ em']
/** Lời cho THẦY (gợi ý, lý do, bản tin, ghi chú): "dạng yếu" là chữ thường dùng trong app nên chỉ cấm những từ này. */
export const TU_CAM_CHO_THAY: readonly string[] = ['nắm chắc', 'dốt', 'ngu', 'lười', 'ngốc', 'vô dụng']
/** Lời cho PHỤ HUYNH (`loiNhanChoPhuHuynh`, `thuTuan`): MỞ RỘNG — so với con nhà khác, nhãn năng lực, dự đoán điểm, sức khoẻ / tâm lý, tiền bạc / quảng cáo, chép bài / gian lận, báo động. */
export const TU_CAM_CHO_PHU_HUYNH: readonly string[] = [
  'yếu', 'kém', 'giỏi', 'dốt', 'ngu', 'lười', 'tệ', 'tồi', 'ngốc', 'nắm chắc', 'thông minh', 'năng lực', 'tài năng', 'thiên phú',
  'con nhà khác', 'con người ta', 'bạn cùng lớp', 'các bạn', 'cả lớp', 'bạn khác', 'hơn bạn', 'thua bạn', 'xếp hạng', 'hạng nhất', 'top đầu',
  'dự đoán', 'dự kiến điểm', 'sẽ đạt', 'sẽ trượt', 'đậu đại học', 'rớt đại học', 'trượt đại học', 'điểm thi', 'điểm chuẩn', 'thất bại', 'trượt', 'rớt',
  'trầm cảm', 'lo âu', 'căng thẳng', 'stress', 'áp lực', 'bệnh', 'sức khoẻ', 'sức khỏe', 'tâm lý', 'tự ti', 'mệt mỏi',
  'học phí', 'tiền', 'đóng phí', 'khuyến mãi', 'giảm giá', 'ưu đãi', 'đăng ký', 'lớp học thêm', 'khoá học', 'khóa học', 'gói học', 'quảng cáo',
  'chép bài', 'gian lận', 'sao chép', 'đạo văn', 'nghi vấn', 'nghi ngờ',
  'cảnh báo', 'báo động', 'khẩn cấp', 'nghiêm trọng', 'nguy hiểm', 'thảm hại', 'vô vọng', 'đáp án',
  // GAME (thầy lệnh 21/09/2026: app phụ huynh KHÔNG hiện thần thú / EXP / khiên / gì liên quan tới game): cả `loiNhanChoPhuHuynh` lẫn `thuTuan`. Lời cho EM vẫn được nhắc (em thấy game).
  'thần thú', 'exp', 'khiên', 'mảnh khiên', 'đoàn hộ tống', 'đảo thần thú', 'đảo của em', 'võ đài', 'game', 'trò chơi',
]

// ══════════════════════════════ HÀM PHỤ ══════════════════════════════

/** Bỏ dấu tiếng Việt + chữ thường + chuẩn NFC — để so từ cấm không lách được bằng dấu / hoa thường. */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

/** Độ dài theo ký tự người đọc thấy (điểm mã sau khi chuẩn NFC). */
export function doDai(s: string): number {
  return [...s.normalize('NFC')].length
}

/** Những từ / cụm cấm có trong `chu` (so theo TỪ, chuẩn NFC + chữ thường, CÓ DẤU). Trả danh sách cụm bị trúng (không lặp). */
export function timTuCam(chu: string, danhSach: readonly string[]): string[] {
  const t = ` ${chu
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join(' ')} `
  return danhSach.filter((c) => t.includes(` ${c.normalize('NFC')} `))
}

/**
 * Mọi con số (chữ số) trong một đoạn chữ, chuẩn hoá dấu phẩy thập phân về dấu chấm; bỏ số 0 thừa đầu ("007" ⇒ "7") nhưng giữ "0.5".
 * Chữ số DÍNH CHỮ CÁI là công thức / mã, không phải số liệu (Boss 21/09): chữ số ĐỨNG SAU một chữ cái (N2, CO2, H2SO4, C6H12O6) hoặc đứng trước MỘT CHỮ HOA (12A1, 2H2O) ⇒ không tính.
 * "3 câu", "7/9", "70 %", "0,5" vẫn tính; "3câu" (chữ số + chữ THƯỜNG liền nhau) VẪN tính — không cho lách luật bằng cách bỏ dấu cách.
 */
export function timSoTrongChu(chu: string): string[] {
  const ra: string[] = []
  // KHÔNG dùng lookbehind (nhìn-lùi) trong regex: Safari/iOS < 16.4 ném SyntaxError ngay khi nạp mô-đun (máy học sinh cũ không mở được app). Thay bằng nhóm `(^|[^\p{L}\d])` rồi lấy nhóm 2.
  for (const m of chu.matchAll(/(^|[^\p{L}\d])(\d+(?:[.,]\d+)?)(?![\p{Lu}\d])/gu)) ra.push(chuanSo(m[2]))
  return ra
}

/** Cụm CỬA SỔ THỜI GIAN của luật ("7 ngày", "3 ngày", "30 ngày", "1 tuần", "1·3·7") — số trong đó luôn hợp lệ dù thẻ không ghi (Boss 21/09). */
const CUM_CUA_SO = /(^|[^\p{L}\d])(?:(?:1|3|7|30)\s*ngày|1\s*tuần|1\s*[·•\-–,./]\s*3\s*[·•\-–,./]\s*7)(?![\p{L}\d])/giu
function boCumCuaSo(chu: string): string {
  return chu.replace(CUM_CUA_SO, '$1 ') // giữ ký tự đứng trước (nhóm 1) — kết quả y hệt bản dùng lookbehind
}

function chuanSo(x: string): string {
  const n = Number(x.replace(',', '.'))
  return Number.isFinite(n) ? String(n) : x
}

/** Khoá của thẻ mang MÃ / định danh / mốc thời gian / bậc 0-1-2 (nói bằng TÊN bậc: Biết, Hiểu, Vận dụng — không nói bằng số), không phải sự thật để nêu cho em: số nằm trong chúng ("D3", "12-C1", "2026-09-22") KHÔNG được coi là số có thật. */
const KHOA_KHONG_LAY_SO = new Set(['ma', 'maDang', 'qid', 'biDanh', 'sbd', 'ngay', 'luc', 'loiNhanGanDay', 'khiNaoVietPhuHuynh', 'bac', 'tu', 'den', 'bacCuaMaDang', 'bacNay', 'emNoiLen'])
/** Khoá mà GIÁ TRỊ CHUỖI là mã (mã dạng, tên núm…) — bỏ khi là chuỗi, nhưng vẫn đi vào khi là mảng/đối tượng (`dang: [{gap: 9}]` là số thật). */
const KHOA_CHUOI_LA_MA = new Set(['dang', 'hanhDong', 'kieu', 'co', 'trangThai', 'xuHuong'])

/** TẬP SỐ CÓ THẬT trong một thẻ (JSON bất kỳ): mọi số, và dạng hiển thị thường gặp — số làm tròn, một chữ số thập phân, phần trăm của số 0–1, và các số nằm TRONG chuỗi chữ của thẻ. */
export function tapSoCuaThe(the: unknown): Set<string> {
  const tap = new Set<string>()
  const them = (n: number) => {
    if (!Number.isFinite(n)) return
    tap.add(String(n))
    tap.add(String(Math.abs(n))) // "nhịp −2" trong thẻ ⇒ lời nhắn được nói "giảm 2 câu"
    tap.add(String(Math.round(Math.abs(n))))
    tap.add(String(Math.round(n)))
    tap.add(String(Math.round(n * 10) / 10))
    if (n > 0 && n <= 1) tap.add(String(Math.round(n * 100)))
    if (n >= 0 && n <= 100) tap.add(String(Math.round(n)))
  }
  const duyet = (v: unknown, sau: number) => {
    if (sau > 12 || v === null || v === undefined) return
    // SỐ SUY RA cho lời "đúng N trong M câu": đúng = đã gặp − đã sai (dạng), đúng 7 ngày = làm 7 − sai 7, đúng 3 ngày = làm 3 × tỉ lệ 3 ngày (Boss 21/09: lời đẩy bậc phải nêu "đúng N trong M")
    if (typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      if (typeof o.gap === 'number' && typeof o.sai === 'number') them(o.gap - o.sai)
      if (typeof o.lam7 === 'number' && typeof o.sai7 === 'number') them(o.lam7 - o.sai7)
      if (typeof o.lam3 === 'number' && typeof o.tiLe3 === 'number') them(Math.round(o.lam3 * o.tiLe3))
    }
    if (typeof v === 'number') them(v)
    else if (typeof v === 'string') for (const s of timSoTrongChu(v)) them(Number(s))
    else if (Array.isArray(v)) for (const x of v) duyet(x, sau + 1)
    else if (typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (!KHOA_KHONG_LAY_SO.has(k) && !(typeof x === 'string' && KHOA_CHUOI_LA_MA.has(k))) duyet(x, sau + 1)
  }
  duyet(the, 0)
  return tap
}

/** Số trong `chu` mà `tap` KHÔNG có (không tính số của cụm cửa sổ thời gian và số dính chữ cái). */
export function soLa(chu: string, tap: Set<string>): string[] {
  return [...new Set(timSoTrongChu(boCumCuaSo(chu)).filter((s) => !tap.has(s)))]
}

const soLaTrongChu = (chu: string, tap: Set<string>): string[] => soLa(chu, tap)
const laChuoi = (v: unknown): v is string => typeof v === 'string'
const laSoNguyenTrong = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
const KY_TU_LA = /[\u0000-\u001f\u007f<>`]|https?:|www\./i

// ══════════════════════════════ THỬ THÁCH RIÊNG HÔM NAY ══════════════════════════════

/** Có emoji / ký hiệu hình không? Duyệt điểm mã (KHÔNG dùng regex `\p{Extended_Pictographic}`: nạp mô-đun trên Safari cũ không hiểu ⇒ SyntaxError, xem P0 21/09). */
function coEmoji(chu: string): boolean {
  for (const ch of chu) {
    const c = ch.codePointAt(0) ?? 0
    if ((c >= 0x1f000 && c <= 0x1faff) || (c >= 0x2600 && c <= 0x27bf) || c === 0x2b50 || c === 0x2b55 || c === 0x200d || c === 0xfe0f || c === 0x20e3) return true
  }
  return false
}

/** Từ mở đầu câu quen thuộc (viết hoa chỉ vì đứng đầu câu): không tính là phần của tên riêng ("Dạng Thuỷ phân ester" không phải tên thú). */
const TU_DAU_CAU_THUONG = new Set(['Dạng', 'Bài', 'Câu', 'Hôm', 'Em', 'Mình', 'Chuỗi', 'Tuần', 'Ngày', 'Thử', 'Chặng', 'Còn', 'Mỗi', 'Đã', 'Vừa', 'Rồi', 'Nếu', 'Khi', 'Nhờ', 'Sau', 'Trong'])
/** Cụm TÊN RIÊNG lạ: chuỗi ≥ 2 từ liền nhau viết hoa chữ đầu (không tính từ toàn hoa như "EXP") mà KHÔNG nằm trong `tenThu` — Bộ não chỉ được nêu tên thú có trong thẻ. */
function tenRiengLa(chu: string, tenThu: string | undefined): string[] {
  const ra: string[] = []
  const ten = (tenThu ?? '').normalize('NFC')
  for (const cau of chu.normalize('NFC').split(/[.!?;:\n]+/)) {
    let chay: string[] = []
    const chot = () => {
      if (chay.length >= 2) {
        const c = chay.join(' ')
        if (!ten.includes(c)) ra.push(c)
      }
      chay = []
    }
    const cacTu = cau.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
    for (const [vt, tu] of cacTu.entries()) {
      const dau = tu.charAt(0)
      const hoaDau = dau !== dau.toLowerCase() && dau === dau.toUpperCase() && !(vt === 0 && TU_DAU_CAU_THUONG.has(tu))
      const toanHoa = tu.length >= 2 && tu === tu.toUpperCase() && tu !== tu.toLowerCase()
      if (hoaDau && !toanHoa) chay.push(tu)
      else chot()
    }
    chot()
  }
  return [...new Set(ra)]
}

/** Cụm MỜI chọn thú cho em CHƯA có thú (Boss 21/09: "chọn một bạn đồng hành để EXP của em có chỗ về"). Không kèm tên thú nào. */
const MOI_CHON_THU = /chọn\s+(?:cho\s+mình\s+)?(?:một\s+)?(?:thần\s+thú|bạn\s+đồng\s+hành|thú)/giu

/** Số câu nêu như VIỆC SẼ LÀM ("thử 6 câu", "làm 6 câu" khi 6 = soCau): máy chủ có thể chọn được ÍT hơn ⇒ không hứa. Số câu nói về QUÁ KHỨ trong thẻ ("đúng lại 4 câu") vẫn được. */
const THU_N_CAU = /thử\s+(?:\p{L}+\s+){0,2}\d+(?:[.,]\d+)?\s*câu/iu
const VIEC_N_CAU = /(?:thử|làm|luyện|giải|chinh phục|hoàn thành|nhận)\s+(?:\p{L}+\s+){0,2}(\d+)\s*câu/giu

/**
 * LUẬT CHỮ chung của lời MỜI thử thách (`loiMoi`) và lời MỤC TIÊU TUẦN (`loiMucTieu`): `ten` = tên trường để báo lỗi; `soCau` = số câu Bộ não muốn (nếu có) để chặn nêu số câu sẽ làm.
 * Một dòng, ≤ `toiDa` ký tự, không emoji / gạch dài, không từ cấm lời cho em, không hứa / gọi tên, không nói điều Bộ não "biết" về em, có ≥ 1 số và MỌI số có trong thẻ, nhắc thú / tên riêng chỉ khi thẻ có `thanThu.ten`.
 */
export function kiemChuLoiMoi(lm: unknown, ten: string, toiDa: number, the: TheDeKiem, tapSo: Set<string>, soCau?: number, hangSo?: ReadonlySet<string>): string[] {
  const e: string[] = []
  if (!laChuoi(lm) || lm.trim().length === 0) return [`${ten} phải là chuỗi không rỗng`]
  if (doDai(lm) > toiDa) e.push(`${ten} quá ${toiDa} ký tự`)
  if (KY_TU_LA.test(lm)) e.push(`${ten} có ký tự lạ hoặc xuống dòng`)
  if (coEmoji(lm)) e.push(`${ten} có emoji`)
  if (/[—–]/.test(lm)) e.push(`${ten} có dấu gạch dài`)
  const cam = timTuCam(lm, TU_CAM_CHO_EM)
  if (cam.length) e.push(`${ten} có từ cấm: ${cam.join(', ')}`)
  const hua = timTuCam(lm, TU_CAM_RIENG_LOI_MOI)
  if (hua.length) e.push(`${ten} hứa điều không chắc hoặc gọi tên: ${hua.join(', ')}`)
  const viPham = viPhamExpCap(lm, hangSo)
  if (viPham) e.push(`${ten} ${viPham} — chỉ nói "cho {tên thú} ăn hôm nay" và số của luật (200 · 120 · 21 · 4)`)
  if (timTuCam(lm, ['khiên']).length > 0 && !CO_LUAT_KHIEN.test(lm.normalize('NFC'))) e.push(`${ten} nhắc khiên mà không nói luật "21 ngày đạt nhiệm vụ ngày"`)
  const lo = timTuCam(lm, TU_LO_HUONG_EM)
  if (lo.length) e.push(`${ten} nói ra điều Bộ não "biết" về em: ${lo.join(', ')}`)
  const so = timSoTrongChu(boCumCuaSo(lm))
  if (hangSo ? !so.some((n) => tapSo.has(n)) : so.length === 0) e.push(`${ten} phải có ít nhất một con số thật có trong thẻ`)
  const soLa = soLaTrongChu(lm, hangSo ? new Set([...tapSo, ...hangSo]) : tapSo)
  if (soLa.length) e.push(`${ten} có số không có trong thẻ: ${soLa.join(', ')}`)
  // không hứa số câu
  if (THU_N_CAU.test(lm)) e.push(`${ten} nêu số câu sẽ làm sau chữ "thử" — viết "mấy câu này" hoặc "vài câu"`)
  else if (soCau !== undefined) for (const m of lm.matchAll(VIEC_N_CAU)) if (Number(m[1]) === soCau && !/đủ\s+4\s*câu/iu.test(m[0])) e.push(`${ten} nêu số câu sẽ làm (${soCau} câu) — máy chủ có thể chọn được ít hơn; viết "mấy câu này"`)
  // thú / tên riêng: chỉ khi thẻ có thanThu.ten và đúng tên ấy
  const thanThu = the.thanThu as Record<string, unknown> | undefined
  const tenThu = thanThu && typeof thanThu === 'object' && laChuoi(thanThu.ten) && thanThu.ten.trim().length > 0 ? thanThu.ten : undefined
  // Em CHƯA có thú (thẻ không có thanThu): được MỜI chọn thú ("chọn một thần thú / bạn đồng hành") nhưng không nói thú nào cả — bỏ cụm mời rồi mới soi chữ "thú"
  const conLai = lm.replace(MOI_CHON_THU, ' ')
  // câu mời chọn thú đặt ở CUỐI (Boss 21/09): nằm trong CÂU CUỐI của lời, không ở giữa
  const cacCau = lm.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean)
  const viTriMoi = cacCau.findIndex((c) => new RegExp(MOI_CHON_THU.source, 'iu').test(c))
  if (viTriMoi >= 0 && viTriMoi < cacCau.length - 1) e.push(`${ten}: câu mời chọn thú phải ở CUỐI lời, không ở giữa`)
  if (!tenThu && timTuCam(conLai, ['thú', 'thần thú']).length) e.push(`${ten} nhắc thú nhưng thẻ không có thanThu (chỉ được MỜI chọn thú: "chọn một thần thú")`)
  const laTen = tenRiengLa(lm, tenThu)
  if (laTen.length) e.push(`${ten} có tên riêng không có trong thẻ: ${laTen.join(', ')}`)
  return e
}

/**
 * KIỂM V4 `huongEm` — trả lý do BỎ CẢ phần này (rỗng ⇒ hợp lệ hoặc vắng). ≤ 2 nhãn trong danh sách kín, không lặp, mỗi trục tối đa MỘT nhãn; mỗi nhãn 1–4 số bằng chứng, MỌI số có trong thẻ; thẻ phải có ≥ 3 ngày có bài
 * trong 7 ngày; `som` chỉ khi `gioHoc` ≤ 19, `muon` chỉ khi `gioHoc` ≥ 21 (thẻ phải có `gioHoc`); `thu_thach` chỉ khi hôm qua em ĐÃ MỞ thẻ thử thách (`homQuaThuThach.mo`) và làm ≥ 3 câu.
 */
export function kiemHuongEm(d: Record<string, unknown>, the: TheDeKiem, tapSo: Set<string>): string[] {
  if (d.huongEm === undefined || d.huongEm === null) return []
  const H = HAN_MUC_BO_NAO
  const e: string[] = []
  const h = d.huongEm
  if (!Array.isArray(h)) return ['huongEm phải là mảng']
  if (h.length === 0) return []
  if (h.length > H.HUONG_EM_SO_NHAN_TOI_DA) e.push(`huongEm quá ${H.HUONG_EM_SO_NHAN_TOI_DA} nhãn`)
  const hoatDong = the.hoatDong as Record<string, unknown> | undefined
  if (!(Number(hoatDong?.ngayCoBai7) >= H.HUONG_EM_SO_NGAY_TOI_THIEU)) e.push(`huongEm cần thẻ có ≥ ${H.HUONG_EM_SO_NGAY_TOI_THIEU} ngày có bài trong 7 ngày`)
  const daCo = new Set<string>()
  const gio = Number(the.gioHoc)
  h.forEach((x, i) => {
    const o = x as Record<string, unknown> | null
    if (!o || typeof o !== 'object' || Array.isArray(o)) return void e.push(`huongEm[${i}] không phải đối tượng`)
    const la = Object.keys(o).filter((k) => k !== 'nhan' && k !== 'so')
    if (la.length) e.push(`huongEm[${i}] có khoá lạ: ${la.join(', ')}`)
    if (!NHAN_HUONG_EM.includes(o.nhan as NhanHuongEm)) return void e.push(`huongEm[${i}].nhan không thuộc danh sách kín`)
    const nhan = o.nhan as NhanHuongEm
    if (daCo.has(nhan)) e.push(`huongEm[${i}].nhan lặp`)
    daCo.add(nhan)
    if (!Array.isArray(o.so) || o.so.length < 1 || o.so.length > H.HUONG_EM_SO_BANG_CHUNG_TOI_DA || o.so.some((n) => typeof n !== 'number' || !Number.isFinite(n))) e.push(`huongEm[${i}].so phải là 1–${H.HUONG_EM_SO_BANG_CHUNG_TOI_DA} con số`)
    else {
      const la2 = (o.so as number[]).filter((n) => !tapSo.has(String(n)))
      if (la2.length) e.push(`huongEm[${i}].so có số không có trong thẻ: ${la2.join(', ')}`)
    }
    if (nhan === 'som' && !(Number.isFinite(gio) && gio <= H.HUONG_EM_GIO_SOM_TOI_DA)) e.push(`huongEm[${i}]: som cần thẻ có gioHoc ≤ ${H.HUONG_EM_GIO_SOM_TOI_DA}`)
    if (nhan === 'muon' && !(Number.isFinite(gio) && gio >= H.HUONG_EM_GIO_MUON_TOI_THIEU)) e.push(`huongEm[${i}]: muon cần thẻ có gioHoc ≥ ${H.HUONG_EM_GIO_MUON_TOI_THIEU}`)
    if (nhan === 'thu_thach') {
      const q = the.homQuaThuThach as Record<string, unknown> | undefined
      if (!(q && q.mo === true && Number(q.soDaLam) >= 3)) e.push(`huongEm[${i}]: thu_thach cần thẻ có homQuaThuThach (em đã mở thẻ và làm ≥ 3 câu)`)
    }
  })
  for (const [a, b] of TRUC_HUONG_EM) if (daCo.has(a) && daCo.has(b)) e.push(`huongEm mang cả hai nhãn đối nghịch ${a} và ${b}`)
  return [...new Set(e)]
}

/**
 * KIỂM V3 `mucTieuTuan` + `loiMucTieu` — trả lý do BỎ CẢ HAI (rỗng ⇒ hợp lệ hoặc vắng). Đi cùng nhau; CHỈ ở ngày soi kỹ hằng tuần của em (`luotSoiKyTuan`); em CHƯA có mục tiêu đang chạy (thẻ `mucTieuTuan.ngayCon > 0`);
 * `dang` có trong thẻ, đủ tin (≥ 4 câu đã gặp), không yếu; `den` = bậc hiện tại + 1 và ≤ Vận dụng; lời ≤ 160 ký tự theo LUẬT CHỮ chung (nói bậc bằng chữ Biết/Hiểu/Vận dụng, số lấy từ thẻ).
 */
export function kiemMucTieuTuan(d: Record<string, unknown>, the: TheDeKiem, tapSo: Set<string>): string[] {
  const coMt = d.mucTieuTuan !== undefined && d.mucTieuTuan !== null
  const coLoi = d.loiMucTieu !== undefined && d.loiMucTieu !== null && d.loiMucTieu !== ''
  if (!coMt && !coLoi) return []
  if (coMt !== coLoi) return ['mucTieuTuan và loiMucTieu phải đi cùng nhau (thiếu một trong hai)']
  const H = HAN_MUC_BO_NAO
  const e: string[] = []
  if (the.luotSoiKyTuan !== true) e.push('mục tiêu tuần chỉ được đặt ở ngày soi kỹ hằng tuần của em')
  const dangChay = the.mucTieuTuan as Record<string, unknown> | undefined
  if (dangChay && typeof dangChay === 'object' && Number(dangChay.ngayCon) > 0) e.push('em đang có mục tiêu tuần chưa hết hạn')
  const m = d.mucTieuTuan as Record<string, unknown>
  if (typeof m !== 'object' || Array.isArray(m)) e.push('mucTieuTuan không phải đối tượng')
  else {
    const la = Object.keys(m).filter((k) => k !== 'dang' && k !== 'den')
    if (la.length) e.push(`mucTieuTuan có khoá lạ: ${la.join(', ')}`)
    if (!laChuoi(m.dang) || m.dang.length === 0 || m.dang.length > H.MA_DANG_TOI_DA || KY_TU_LA.test(m.dang)) e.push('mucTieuTuan.dang không hợp lệ')
    else if (the.maDang && !the.maDang.includes(m.dang)) e.push('mucTieuTuan.dang không có trong thẻ của em')
    else {
      const ds = Array.isArray(the.dangChuY) ? (the.dangChuY as Record<string, unknown>[]) : []
      const x = ds.find((y) => y && y.ma === m.dang)
      if (!x) e.push('mucTieuTuan.dang không có số liệu trong thẻ (dangChuY)')
      else {
        if (!(Number(x.gap) >= H.MUC_TIEU_SO_CAU_DU_TIN)) e.push(`mucTieuTuan.dang chưa đủ tin (cần ≥ ${H.MUC_TIEU_SO_CAU_DU_TIN} câu đã gặp)`)
        if (typeof x.tiLeKhacPhuc === 'number' && x.tiLeKhacPhuc < 0.7) e.push('mucTieuTuan.dang đang yếu — chưa đặt mục tiêu lên bậc')
        const bac = Number(x.bac)
        if (m.den !== 1 && m.den !== 2) e.push('mucTieuTuan.den phải là 1 (Hiểu) hoặc 2 (Vận dụng)')
        else if (!(bac >= 0 && bac <= 1 && m.den === bac + 1)) e.push('mucTieuTuan.den phải đúng bậc hiện tại + 1 (không quá Vận dụng)')
      }
    }
  }
  e.push(...kiemChuLoiMoi(d.loiMucTieu, 'loiMucTieu', H.LOI_MUC_TIEU_TOI_DA, the, tapSo))
  return [...new Set(e)]
}

/**
 * KIỂM PHẦN THỬ THÁCH (`thuThach` + `loiMoi`) — trả các lý do BỎ CẢ HAI trường (rỗng ⇒ hợp lệ hoặc vắng). Luật (thầy chốt 21/09; hợp đồng Code 3):
 *   • đi cùng nhau; `thuThach` = { dang: 1–2 mã có trong thẻ, không lặp; soCau: nguyên 3–8; bac: một trong ba } và không khoá lạ;
 *   • `cao_hon_mot_bac` CHỈ khi MỖI dạng đã đúng ≥ 80 % trong ≥ 5 câu 7 ngày (`dangChuY.lam7/sai7`), không yếu, VÀ 3 ngày gần nhất chung đúng ≥ 80 % (`cau.tiLe3`) — theo số TRONG thẻ
 *     (thẻ chưa có tỉ lệ đúng 3 ngày riêng từng dạng; nếu thiếu số ⇒ không cho);
 *   • `loiMoi` ≤ 200 ký tự, một dòng, không emoji, không dấu gạch dài, không từ cấm lời cho em (nhãn năng lực, so với bạn…), không hứa điều không chắc / gọi tên; MỌI con số phải có trong thẻ và có ≥ 1 số;
 *     không nêu số câu sẽ làm; nhắc thú / tên riêng chỉ khi thẻ có `thanThu.ten` và đúng tên ấy.
 */
export function kiemThuThach(d: Record<string, unknown>, the: TheDeKiem, tapSo: Set<string>): string[] {
  const H = HAN_MUC_BO_NAO
  const coTt = d.thuThach !== undefined && d.thuThach !== null
  const coLm = d.loiMoi !== undefined && d.loiMoi !== null && d.loiMoi !== ''
  if (!coTt && !coLm) return []
  if (coTt !== coLm) return ['thuThach và loiMoi phải đi cùng nhau (thiếu một trong hai)']
  const e: string[] = []

  const t = d.thuThach as Record<string, unknown>
  let dangHopLe: string[] = []
  if (typeof t !== 'object' || Array.isArray(t)) e.push('thuThach không phải đối tượng')
  else {
    const la = Object.keys(t).filter((k) => !['dang', 'soCau', 'bac'].includes(k))
    if (la.length) e.push(`thuThach có khoá lạ: ${la.join(', ')}`)
    if (!Array.isArray(t.dang) || t.dang.length < 1 || t.dang.length > H.THU_THACH_SO_DANG_TOI_DA) e.push(`thuThach.dang phải là mảng 1–${H.THU_THACH_SO_DANG_TOI_DA} mã dạng`)
    else {
      const thay = new Set<string>()
      t.dang.forEach((m, i) => {
        if (!laChuoi(m) || m.length === 0 || m.length > H.MA_DANG_TOI_DA || KY_TU_LA.test(m)) return void e.push(`thuThach.dang[${i}] không hợp lệ`)
        if (thay.has(m)) e.push(`thuThach.dang[${i}] lặp`)
        thay.add(m)
        if (the.maDang && !the.maDang.includes(m)) e.push(`thuThach.dang[${i}] không có trong thẻ của em`)
        else dangHopLe.push(m)
      })
    }
    if (!laSoNguyenTrong(t.soCau, H.THU_THACH_SO_CAU_TOI_THIEU, H.THU_THACH_SO_CAU_TOI_DA)) e.push(`thuThach.soCau phải là số nguyên trong [${H.THU_THACH_SO_CAU_TOI_THIEU}, ${H.THU_THACH_SO_CAU_TOI_DA}]`)
    if (!BAC_THU_THACH.includes(t.bac as BacThuThach)) e.push('thuThach.bac phải là dung_bac, thap_hon_mot_bac hoặc cao_hon_mot_bac')
    else if (t.bac === 'cao_hon_mot_bac') {
      const dangChuY = Array.isArray(the.dangChuY) ? (the.dangChuY as Record<string, unknown>[]) : []
      const tiLe3 = (the.cau as Record<string, unknown> | undefined)?.tiLe3
      if (typeof tiLe3 !== 'number' || tiLe3 < H.THU_THACH_LEN_BAC_DUNG_TOI_THIEU) e.push('cao_hon_mot_bac: 3 ngày gần nhất chung chưa đúng ≥ 80 % theo thẻ')
      for (const m of dangHopLe) {
        const x = dangChuY.find((y) => y && y.ma === m)
        const lam = Number(x?.lam7)
        const sai = Number(x?.sai7)
        const yeu = typeof x?.tiLeKhacPhuc === 'number' && x.tiLeKhacPhuc < 0.7
        if (!x || !Number.isFinite(lam) || !Number.isFinite(sai) || lam < H.THU_THACH_LEN_BAC_MAU_TOI_THIEU || (lam - sai) / lam < H.THU_THACH_LEN_BAC_DUNG_TOI_THIEU || yeu)
          e.push(`cao_hon_mot_bac: dạng ${m} chưa đúng ≥ 80 % trong ≥ ${H.THU_THACH_LEN_BAC_MAU_TOI_THIEU} câu theo thẻ`)
      }
    }
  }

  const soCauDe = typeof t === 'object' && !Array.isArray(t) && laSoNguyenTrong(t.soCau, 0, 1000) ? t.soCau : undefined
  e.push(...kiemChuLoiMoi(d.loiMoi, 'loiMoi', H.LOI_MOI_TOI_DA, the, tapSo, soCauDe, HANG_SO_LUAT_LOI_MOI))
  // Lời PHẢI nói đúng bậc (Boss 21/09): cao_hon_mot_bac ⇒ "câu khó hơn một bậc" + "đúng N trong M câu"; thap_hon_mot_bac ⇒ "lùi một bậc"; bậc khác không được nói những điều ấy
  if (laChuoi(d.loiMoi) && typeof t === 'object' && !Array.isArray(t) && BAC_THU_THACH.includes(t.bac as BacThuThach)) {
    const chuLoi = d.loiMoi
    const noiKhoHon = timTuCam(chuLoi, ['khó hơn một bậc']).length > 0
    const noiLui = timTuCam(chuLoi, ['lùi một bậc']).length > 0
    if (t.bac === 'cao_hon_mot_bac') {
      if (!noiKhoHon) e.push('loiMoi: bậc cao_hon_mot_bac ⇒ lời PHẢI nói rõ đó là câu "khó hơn một bậc"')
      if (!/đúng\s+\d+(?:[.,]\d+)?\s+(?:trong|trên)\s+\d+/iu.test(chuLoi)) e.push('loiMoi: bậc cao_hon_mot_bac ⇒ lời PHẢI nêu lý do bằng số: "vì em đã đúng N trong M câu dạng này"')
    } else if (noiKhoHon) e.push('loiMoi nói "khó hơn một bậc" nhưng bac không phải cao_hon_mot_bac')
    if (t.bac === 'thap_hon_mot_bac') {
      if (!noiLui) e.push('loiMoi: bậc thap_hon_mot_bac ⇒ lời PHẢI nói "mình lùi một bậc để em lấy lại nhịp"')
    } else if (noiLui) e.push('loiMoi nói "lùi một bậc" nhưng bac không phải thap_hon_mot_bac')
  }
  // V4: nhãn kín ĐANG CÓ của em (thẻ) ràng buộc thử thách hôm nay — chỉ làm bộ NHẸ đi, không nặng thêm
  const huong = new Set(Array.isArray(the.huongEm) ? (the.huongEm as { nhan?: unknown }[]).map((x) => String(x?.nhan)) : [])
  if (typeof t === 'object' && !Array.isArray(t)) {
    if (huong.has('tran_an') && t.bac === 'cao_hon_mot_bac') e.push('em đang có nhãn tran_an (cần trấn an) — không được cao_hon_mot_bac')
    if (huong.has('ngan') && typeof t.soCau === 'number' && t.soCau > H.HUONG_EM_NGAN_SO_CAU_TOI_DA) e.push(`em đang có nhãn ngan (thích ngắn) — soCau tối đa ${H.HUONG_EM_NGAN_SO_CAU_TOI_DA}`)
  }
  return [...new Set(e)]
}

// ══════════════════════════════ KIỂM KHUÔN ══════════════════════════════

/**
 * KIỂM MỘT PHẦN TỬ ĐẦU RA của em (`dauRa` là JSON lạ — không tin kiểu). Kiểm: đủ trường + đúng kiểu, biên độ (nhịp ±3, khởi động 1–3, ≤ 3 dạng, độ tin cậy 0–1),
 * độ dài, TỪ CẤM, ký tự lạ (điều khiển, `<`, `>`, đường dẫn), `biDanh` khớp thẻ, mã dạng có trong thẻ, và MỌI CON SỐ trong `loiNhanChoEm` / `lyDo` / `goiYChoThay.chu` phải có
 * trong thẻ của em (`tapSoCuaThe`). `lyDo` của dạng phải có ít nhất một số ("lý do bằng số").
 * Không sửa hộ, không đoán: sai là trả lý do để BỎ.
 */
export function kiemKhuon(dauRa: unknown, the: TheDeKiem): KetQuaKiem {
  const loi: string[] = []
  const canhBaoSo: string[] = [] // số lạ ở phần THẦY đọc (lý do, gợi ý): cảnh báo, không loại
  if (!dauRa || typeof dauRa !== 'object' || Array.isArray(dauRa)) return { hopLe: false, lyDo: ['không phải một đối tượng'] }
  const d = dauRa as Record<string, unknown>
  const tapSo = tapSoCuaThe(the)
  const H = HAN_MUC_BO_NAO

  if (!laChuoi(d.biDanh) || d.biDanh.length === 0 || d.biDanh.length > H.BI_DANH_TOI_DA) loi.push('biDanh thiếu hoặc quá dài')
  else if (d.biDanh !== the.biDanh) loi.push('biDanh không khớp thẻ của em')

  if (typeof d.doTinCay !== 'number' || !Number.isFinite(d.doTinCay) || d.doTinCay < 0 || d.doTinCay > 1) loi.push('doTinCay ngoài [0, 1]')

  const nhip = d.nhip as Record<string, unknown> | undefined
  if (!nhip || typeof nhip !== 'object') loi.push('thiếu nhip')
  else {
    if (!laSoNguyenTrong(nhip.lech, -H.NHIP_LECH_TOI_DA, H.NHIP_LECH_TOI_DA)) loi.push('nhip.lech phải là số nguyên trong [−3, +3]')
    if (!laSoNguyenTrong(nhip.khoiDong, H.KHOI_DONG_TOI_THIEU, H.KHOI_DONG_TOI_DA)) loi.push('nhip.khoiDong phải là số nguyên trong [1, 3]')
  }

  if (!Array.isArray(d.dang)) loi.push('dang phải là mảng')
  else {
    if (d.dang.length > H.SO_DANG_TOI_DA) loi.push(`dang quá ${H.SO_DANG_TOI_DA} phần tử`)
    const daThay = new Set<string>()
    d.dang.forEach((x, i) => {
      const o = x as Record<string, unknown> | null
      if (!o || typeof o !== 'object') return void loi.push(`dang[${i}] không phải đối tượng`)
      if (!laChuoi(o.ma) || o.ma.length === 0 || o.ma.length > H.MA_DANG_TOI_DA || KY_TU_LA.test(o.ma)) loi.push(`dang[${i}].ma không hợp lệ`)
      else {
        if (daThay.has(o.ma)) loi.push(`dang[${i}].ma lặp`)
        daThay.add(o.ma)
        if (the.maDang && !the.maDang.includes(o.ma)) loi.push(`dang[${i}].ma không có trong thẻ của em`)
      }
      if (!HANH_DONG_DANG.includes(o.hanhDong as HanhDongDang)) loi.push(`dang[${i}].hanhDong không thuộc bốn núm`)
      if (!laChuoi(o.lyDo)) loi.push(`dang[${i}].lyDo thiếu`)
      else {
        if (doDai(o.lyDo) > H.LY_DO_TOI_DA) loi.push(`dang[${i}].lyDo quá ${H.LY_DO_TOI_DA} ký tự`)
        if (KY_TU_LA.test(o.lyDo)) loi.push(`dang[${i}].lyDo có ký tự lạ`)
        // SỐ trong lý do CHỈ CẢNH BÁO (phần tử vẫn hợp lệ): lời tới em/phụ huynh/thư tuần mới bị áp cứng (Boss 21/09: kiểm loại oan)
        if (timSoTrongChu(o.lyDo).length === 0) canhBaoSo.push(`dang[${i}].lyDo nên có số (lý do bằng số)`)
        const la = soLa(o.lyDo, tapSo)
        if (la.length) canhBaoSo.push(`dang[${i}].lyDo có số không có trong thẻ: ${la.join(', ')}`)
        const cam = timTuCam(o.lyDo, TU_CAM_CHO_THAY)
        if (cam.length) loi.push(`dang[${i}].lyDo có từ cấm: ${cam.join(', ')}`)
      }
    })
  }

  // khacPhuc: vắng ⇒ rỗng (phần tử cũ); có thì phải là mảng ≤ 2, mỗi (dạng, kiểu) một lần, dạng có trong thẻ, `khac_phuc` cần soCau 2–4 + bac, `on_som` không mang soCau/bac
  if (d.khacPhuc !== undefined) {
    if (!Array.isArray(d.khacPhuc)) loi.push('khacPhuc phải là mảng')
    else {
      if (d.khacPhuc.length > H.SO_KHAC_PHUC_TOI_DA) loi.push(`khacPhuc quá ${H.SO_KHAC_PHUC_TOI_DA} phần tử`)
      const daKp = new Set<string>()
      d.khacPhuc.forEach((x, i) => {
        const o = x as Record<string, unknown> | null
        if (!o || typeof o !== 'object') return void loi.push(`khacPhuc[${i}] không phải đối tượng`)
        if (!laChuoi(o.dang) || o.dang.length === 0 || o.dang.length > H.MA_DANG_TOI_DA || KY_TU_LA.test(o.dang)) loi.push(`khacPhuc[${i}].dang không hợp lệ`)
        else {
          // CẶP `khac_phuc` + `on_som` cùng một dạng là hợp lệ (khác `kieu`); chỉ cấm trùng CẢ dạng lẫn kiểu (Boss 21/09)
          const khoa = `${o.dang}|${String(o.kieu)}`
          if (daKp.has(khoa)) loi.push(`khacPhuc[${i}] lặp (cùng dạng và cùng kiểu)`)
          daKp.add(khoa)
          if (the.maDang && !the.maDang.includes(o.dang)) loi.push(`khacPhuc[${i}].dang không có trong thẻ của em`)
        }
        if (o.kieu !== 'khac_phuc' && o.kieu !== 'on_som') loi.push(`khacPhuc[${i}].kieu phải là khac_phuc hoặc on_som`)
        else if (o.kieu === 'khac_phuc') {
          if (!laSoNguyenTrong(o.soCau, H.KHAC_PHUC_SO_CAU_TOI_THIEU, H.KHAC_PHUC_SO_CAU_TOI_DA)) loi.push(`khacPhuc[${i}].soCau phải là số nguyên trong [2, 4]`)
          if (o.bac !== 'dung_bac' && o.bac !== 'thap_hon_mot_bac') loi.push(`khacPhuc[${i}].bac phải là dung_bac hoặc thap_hon_mot_bac`)
          // CHỈ HỨA ĐIỀU LÀM ĐƯỢC (Boss 21/09): máy chủ chỉ chèn câu cùng dạng CHƯA giao vào chặng chưa mở của bài cá nhân hoá ĐANG CHẠY. Thẻ có `coBaiCaNhanDangChay` ⇒ kiểm; thẻ cũ không có ⇒ bỏ qua.
          if (laChuoi(o.dang) && typeof the.coBaiCaNhanDangChay === 'boolean' && laSoNguyenTrong(o.soCau, H.KHAC_PHUC_SO_CAU_TOI_THIEU, H.KHAC_PHUC_SO_CAU_TOI_DA) && (o.bac === 'dung_bac' || o.bac === 'thap_hon_mot_bac')) {
            if (!the.coBaiCaNhanDangChay) loi.push(`khacPhuc[${i}]: em không có bài tập về nhà cá nhân hoá đang chạy còn chặng để chèn — không dùng khac_phuc (dùng on_som hoặc uu_tien)`)
            else {
              const cap = (the.soCauConLaiCungDang as Record<string, unknown> | undefined)?.[o.dang]
              const con = Array.isArray(cap) ? Number(cap[o.bac === 'dung_bac' ? 0 : 1]) || 0 : 0
              if (con < H.KHAC_PHUC_SO_CAU_TOI_THIEU) loi.push(`khacPhuc[${i}]: dạng ${o.dang} chỉ còn ${con} câu chưa giao ở bậc ${o.bac === 'dung_bac' ? 'đúng bậc' : 'thấp hơn một bậc'} — khac_phuc cần ít nhất ${H.KHAC_PHUC_SO_CAU_TOI_THIEU}`)
              else if ((o.soCau as number) > con) loi.push(`khacPhuc[${i}].soCau ${o.soCau as number} vượt số câu còn lại (${con})`)
            }
          }
        } else if (o.soCau !== undefined || o.bac !== undefined) loi.push(`khacPhuc[${i}]: on_som không mang soCau/bac`)
      })
    }
  }

  if (!CO_BO_NAO.includes(d.co as CoBoNao)) loi.push('co không thuộc năm giá trị')

  if (!laChuoi(d.loiNhanChoEm)) loi.push('loiNhanChoEm phải là chuỗi (có thể rỗng)')
  else if (d.loiNhanChoEm.length > 0) {
    const t = d.loiNhanChoEm
    if (doDai(t) > H.LOI_NHAN_TOI_DA) loi.push(`loiNhanChoEm quá ${H.LOI_NHAN_TOI_DA} ký tự`)
    if (KY_TU_LA.test(t)) loi.push('loiNhanChoEm có ký tự lạ')
    const cam = timTuCam(t, TU_CAM_CHO_EM)
    if (cam.length) loi.push(`loiNhanChoEm có từ cấm: ${cam.join(', ')}`)
    const la = soLa(t, tapSo)
    if (la.length) loi.push(`loiNhanChoEm có số không có trong thẻ: ${la.join(', ')}`)
  }

  // ── LỜI CHO PHỤ HUYNH + THƯ TUẦN: lỗi ở đây CHỈ làm mất lời ấy (phần núm được giữ) ──
  const canhBao: string[] = []
  const boLoi: ('loiNhanChoPhuHuynh' | 'thuTuan' | 'thuThach' | 'huongEm' | 'mucTieuTuan')[] = []
  const kiemLoiNgoai = (ten: 'loiNhanChoPhuHuynh' | 'thuTuan', v: unknown, toiDa: number, duocViet: boolean, lyDoKhong: string) => {
    if (v === undefined || v === '') return
    if (!laChuoi(v)) return void loi.push(`${ten} phải là chuỗi (có thể rỗng)`)
    const e: string[] = []
    if (!duocViet) e.push(lyDoKhong)
    if (doDai(v) > toiDa) e.push(`quá ${toiDa} ký tự`)
    if (KY_TU_LA.test(v)) e.push('có ký tự lạ')
    const cam = timTuCam(v, TU_CAM_CHO_PHU_HUYNH)
    if (cam.length) e.push(`có từ cấm: ${cam.join(', ')}`)
    const la = soLa(v, tapSo)
    if (la.length) e.push(`có số không có trong thẻ: ${la.join(', ')}`)
    if (e.length) {
      boLoi.push(ten)
      canhBao.push(`${ten} bị bỏ (giữ núm): ${e.join('; ')}`)
    }
  }
  const xuLy = [
    ...(Array.isArray(d.dang) ? (d.dang as { ma?: unknown }[]).map((x) => String(x?.ma ?? '')) : []),
    ...(Array.isArray(d.khacPhuc) ? (d.khacPhuc as { dang?: unknown }[]).map((x) => String(x?.dang ?? '')) : []),
  ].filter(Boolean)
  const daXuLy = xuLy.length > 0
  // "vấp lặp đã xử lý": phải xử lý (núm) ít nhất một dạng KHÔNG nằm trong các dạng đã báo phụ huynh ở lời gần nhất; thẻ không ghi dạng đã báo ⇒ chỉ cần có xử lý
  const daBao = new Set(the.dangLoiPhuHuynhTruoc ?? [])
  const daXuLyDangMoi = daXuLy && (daBao.size === 0 || xuLy.some((m) => !daBao.has(m)))
  const soLoi7 = Number(the.soLoiPhuHuynh7 ?? 0)
  const daDuTran = Number.isFinite(soLoi7) && soLoi7 >= H.TRAN_LOI_PHU_HUYNH_7_NGAY
  const lyDoPh = daDuTran ? [] : (the.khiNaoVietPhuHuynh ?? []).filter((x) => KHI_NAO_VIET_PHU_HUYNH.includes(x as (typeof KHI_NAO_VIET_PHU_HUYNH)[number]) && (x !== 'vap_lap_da_xu_ly' || daXuLyDangMoi))
  kiemLoiNgoai(
    'loiNhanChoPhuHuynh',
    d.loiNhanChoPhuHuynh,
    H.LOI_PHU_HUYNH_TOI_DA,
    lyDoPh.length > 0,
    daDuTran ? `đã có ${soLoi7} lời cho phụ huynh trong 7 ngày (trần ${H.TRAN_LOI_PHU_HUYNH_7_NGAY})` : 'hôm nay không có lý do được phép viết lời cho phụ huynh',
  )
  kiemLoiNgoai('thuTuan', d.thuTuan, H.THU_TUAN_TOI_DA, the.luotSoiKyTuan === true, 'chưa tới lượt soi kỹ hằng tuần của em')

  const g = d.goiYChoThay as Record<string, unknown> | undefined
  if (!g || typeof g !== 'object') loi.push('thiếu goiYChoThay')
  else {
    if (!laChuoi(g.chu)) loi.push('goiYChoThay.chu phải là chuỗi')
    else if (g.chu.length > 0) {
      if (doDai(g.chu) > H.GOI_Y_TOI_DA) loi.push(`goiYChoThay.chu quá ${H.GOI_Y_TOI_DA} ký tự`)
      if (KY_TU_LA.test(g.chu)) loi.push('goiYChoThay.chu có ký tự lạ')
      const cam = timTuCam(g.chu, TU_CAM_CHO_THAY)
      if (cam.length) loi.push(`goiYChoThay.chu có từ cấm: ${cam.join(', ')}`)
      const la = soLa(g.chu, tapSo)
      if (la.length) canhBaoSo.push(`goiYChoThay.chu có số không có trong thẻ: ${la.join(', ')}`)
    }
    if (!HANH_DONG_CHO_THAY.includes(g.hanhDong as HanhDongChoThay)) loi.push('goiYChoThay.hanhDong không thuộc bốn giá trị')
    if (!laChuoi(g.dang)) loi.push('goiYChoThay.dang phải là chuỗi (có thể rỗng)')
    else if (g.dang.length > 0 && (g.dang.length > H.MA_DANG_TOI_DA || KY_TU_LA.test(g.dang) || (the.maDang && !the.maDang.includes(g.dang)))) loi.push('goiYChoThay.dang không hợp lệ hoặc không có trong thẻ')
    if (g.hanhDong === 'goi_len_bang' && laChuoi(g.dang) && g.dang.length === 0) loi.push('goiYChoThay gọi lên bảng phải nêu dạng')
  }

  // ── THỬ THÁCH RIÊNG: sai khuôn CHỈ bỏ phần này (cả `thuThach` lẫn `loiMoi`), phần tử vẫn hợp lệ ──
  // Lệnh tạm: số EXP / cấp / khiên của game bị ẩn khỏi tập số hợp lệ của thử thách (số ấy có trong thẻ nhưng không được nêu); `anSoGameTam` rỗng lại khi Boss gỡ.
  const loiTt = kiemThuThach(d, the, tapSoCuaThe(anSoGameTam(the)))
  if (loiTt.length) {
    boLoi.push('thuThach')
    canhBao.push(`thuThach bị bỏ (giữ núm): ${loiTt.join('; ')}`)
  }

  // ── V4 huongEm + V3 mucTieuTuan: sai khuôn CHỈ bỏ phần ấy (phần tử vẫn hợp lệ) ──
  const loiHuong = kiemHuongEm(d, the, tapSo)
  if (loiHuong.length) {
    boLoi.push('huongEm')
    canhBao.push(`huongEm bị bỏ (giữ núm): ${loiHuong.join('; ')}`)
  }
  const loiMt = kiemMucTieuTuan(d, the, tapSo)
  if (loiMt.length) {
    boLoi.push('mucTieuTuan')
    canhBao.push(`mucTieuTuan bị bỏ (giữ núm): ${loiMt.join('; ')}`)
  }

  if (!laChuoi(d.ghiChuHlv)) loi.push('ghiChuHlv phải là chuỗi (có thể rỗng)')
  else {
    if (doDai(d.ghiChuHlv) > H.GHI_CHU_HLV_TOI_DA) loi.push(`ghiChuHlv quá ${H.GHI_CHU_HLV_TOI_DA} ký tự`)
    if (KY_TU_LA.test(d.ghiChuHlv)) loi.push('ghiChuHlv có ký tự lạ')
    const cam = timTuCam(d.ghiChuHlv, TU_CAM_CHO_THAY)
    if (cam.length) loi.push(`ghiChuHlv có từ cấm: ${cam.join(', ')}`)
  }

  if (typeof d.canSau !== 'boolean') loi.push('canSau phải là true/false')

  const ra: KetQuaKiem = { hopLe: loi.length === 0, lyDo: loi }
  if (canhBao.length || canhBaoSo.length) ra.canhBao = [...canhBao, ...canhBaoSo]
  if (boLoi.length) ra.boLoi = boLoi
  return ra
}

/** Phần tử ĐÃ KIỂM → bản sạch để lưu: điền trường vắng (`khacPhuc: []`, hai lời phụ huynh rỗng) và làm rỗng các lời bị `boLoi`. Chỉ gọi khi `hopLe`. */
export function lamSachDauRa(d: DauRaEm, kq: KetQuaKiem): DauRaEm {
  const ra: DauRaEm = { ...d, khacPhuc: d.khacPhuc ?? [], loiNhanChoPhuHuynh: d.loiNhanChoPhuHuynh ?? '', thuTuan: d.thuTuan ?? '' }
  for (const t of kq.boLoi ?? []) {
    if (t === 'thuThach') {
      delete ra.thuThach
      delete ra.loiMoi
    } else if (t === 'huongEm') delete ra.huongEm
    else if (t === 'mucTieuTuan') {
      delete ra.mucTieuTuan
      delete ra.loiMucTieu
    } else ra[t] = ''
  }
  return ra
}

/** Kiểm BẢN TIN SÁNG (`ra/lop.json`): ≤ 6 dòng, đúng khuôn từng dòng, số trong chữ phải có trong số liệu lớp (`soLieuLop`), từ cấm của lời cho thầy. */
export function kiemBanTin(banTin: unknown, soLieuLop: unknown, biDanhHopLe?: ReadonlySet<string>): KetQuaKiem {
  const loi: string[] = []
  const canhBao: string[] = [] // số lạ trong dòng bản tin (thầy đọc): CẢNH BÁO, dòng vẫn giữ (Boss 21/09)
  const b = banTin as Record<string, unknown> | null
  if (!b || typeof b !== 'object' || !Array.isArray(b.cacDong)) return { hopLe: false, lyDo: ['bản tin phải có mảng cacDong'] }
  if (b.cacDong.length > HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA) loi.push(`bản tin quá ${HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA} dòng`)
  const tapSo = tapSoCuaThe(soLieuLop)
  b.cacDong.forEach((x, i) => {
    const o = x as Record<string, unknown> | null
    if (!o || typeof o !== 'object') return void loi.push(`dòng ${i + 1}: không phải đối tượng`)
    if (!LOAI_DONG_BAN_TIN.includes(o.loai as LoaiDongBanTin)) loi.push(`dòng ${i + 1}: loai lạ`)
    if (!HANH_DONG_BAN_TIN.includes(o.hanhDong as HanhDongBanTin)) loi.push(`dòng ${i + 1}: hanhDong lạ`)
    if (!laChuoi(o.biDanh) || o.biDanh.length > HAN_MUC_BO_NAO.BI_DANH_TOI_DA) loi.push(`dòng ${i + 1}: biDanh phải là chuỗi (có thể rỗng)`)
    else if (o.biDanh.length > 0 && biDanhHopLe && !biDanhHopLe.has(o.biDanh)) loi.push(`dòng ${i + 1}: biDanh không có trong dữ liệu đêm`)
    if (!laChuoi(o.dang) || o.dang.length > HAN_MUC_BO_NAO.MA_DANG_TOI_DA || KY_TU_LA.test(o.dang)) loi.push(`dòng ${i + 1}: dang phải là chuỗi ngắn (có thể rỗng)`)
    if (!laChuoi(o.chu) || o.chu.length === 0) loi.push(`dòng ${i + 1}: chu thiếu`)
    else {
      if (doDai(o.chu) > HAN_MUC_BO_NAO.DONG_BAN_TIN_TOI_DA) loi.push(`dòng ${i + 1}: chu quá ${HAN_MUC_BO_NAO.DONG_BAN_TIN_TOI_DA} ký tự`)
      if (KY_TU_LA.test(o.chu)) loi.push(`dòng ${i + 1}: chu có ký tự lạ`)
      const cam = timTuCam(o.chu, TU_CAM_CHO_THAY)
      if (cam.length) loi.push(`dòng ${i + 1}: từ cấm ${cam.join(', ')}`)
      const la = soLa(o.chu, tapSo)
      if (la.length) canhBao.push(`dòng ${i + 1}: số không có trong số liệu lớp: ${la.join(', ')}`)
    }
  })
  return { hopLe: loi.length === 0, lyDo: loi, ...(canhBao.length ? { canhBao } : {}) }
}

// ══════════════════════════════ ĐỔI SANG NÚM CỦA LÕI BTVN ══════════════════════════════

/** Điều chỉnh của một em dưới dạng cổng `dieuChinh` của `chonBoCuaEm` / `thichNghiChangSau` (`btvn-nang-do.ts`). Chỉ gọi sau khi `kiemKhuon` hợp lệ VÀ `doTinCay ≥ NGUONG_TIN_CAY`. */
export function dieuChinhTuDauRa(d: Pick<DauRaEm, 'nhip' | 'dang'> & { khacPhuc?: KhacPhucEm[] }): DieuChinhEm {
  const ra: DieuChinhEm = { nhip: d.nhip.lech, khoiDong: d.nhip.khoiDong, dang: d.dang.map((x) => ({ ma: x.ma, nut: x.hanhDong })) }
  // `on_som` là việc của kế hoạch ngày (máy chủ), không phải của bộ câu BTVN — chỉ `khac_phuc` đi vào cổng của lõi
  const kp = (d.khacPhuc ?? []).filter((x): x is KhacPhucEm & { soCau: number; bac: BacKhacPhuc } => x.kieu === 'khac_phuc' && typeof x.soCau === 'number' && !!x.bac)
  if (kp.length) ra.khacPhuc = kp.map((x) => ({ dang: x.dang, soCau: x.soCau, bac: x.bac }))
  return ra
}

/** Số THAY ĐỔI của một phần tử (nguyên tắc 10 "không rung lắc": ≤ 2 mỗi em mỗi đêm): nhịp lệch ≠ 0, khởi động ≠ 2, mỗi dạng bị vặn. `khac_phuc` tính một thay đổi, `on_som` không (chỉ là kéo mốc ôn sớm). Cờ không tính (chỉ là nhãn). */
export function demThayDoi(d: Pick<DauRaEm, 'nhip' | 'dang'> & { khacPhuc?: KhacPhucEm[] }): number {
  return (d.nhip.lech !== 0 ? 1 : 0) + (d.nhip.khoiDong !== 2 ? 1 : 0) + d.dang.length + (d.khacPhuc ?? []).filter((x) => x.kieu === 'khac_phuc').length
}
