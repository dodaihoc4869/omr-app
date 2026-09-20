// BTVN "NÂNG ĐỠ" — LÕI THUẦN (Code 1, 21/09/2026). Đề bài `prompt-btvn-nang-do.md` (mục Code 1), thiết kế `DE-XUAT-BTVN-NANG-DO-2109.md`.
//
// Giao 80 câu, mỗi em nhận BỘ CÂU VỪA SỨC: LÕI CHUNG (cả lớp giống nhau, phủ hết các dạng) + PHẦN RIÊNG (theo hồ sơ em, đúng "bậc thang" của em),
// chia thành CHẶNG mỗi ngày. Máy chủ import tệp này như `doan-core` (`import … from '../../src/lib/btvn-nang-do'`).
//
// THUẦN: không IO, không đọc đồng hồ, không `Math.random()`. "Ngẫu nhiên" (chỉ để phá hoà) rút từ hạt giống truyền vào (`maBtvn|sbd`)
// qua `hashSeed` ⇒ cùng đầu vào + cùng hạt giống ⇒ CÙNG bộ câu (máy chủ chốt một lần lúc em mở bài, thầy xem trước ra đúng bộ ấy).
//
// TÔN TRỌNG (luật thầy): chỉ SỐ ĐẾM; không xếp hạng em với em; không chữ "nắm chắc"; không kết luận năng lực từ điểm.
//
// ─── TRẠNG THÁI: COMMIT ĐẦU = KIỂU + CHỮ KÝ HÀM (để Code 3 / 4 / 2 bám). Thân hàm ném lỗi "chưa cài" tới khi có commit kế. ───

// ══════════════════════════════ KIỂU ══════════════════════════════

export type PhanCau = 'I' | 'II' | 'III'

/** Bậc / mức độ dùng CHUNG một thang số: 0 = Biết · 1 = Hiểu · 2 = Vận dụng (`nam_kt_dang.bac` và `mucDo` của câu). */
export type Muc = 0 | 1 | 2

/** Sao cốt lõi của câu: 0 = đọc đáp án là đủ · 1 = vừa · 2 = khó / cốt lõi (AI gán lúc nạp đề, chỉ có ở máy thầy). */
export type Sao = 0 | 1 | 2

/** MỘT CÂU TRONG BÀI THẦY GIAO — máy thầy gửi kèm lúc bấm giao (`/btvn/giao` → `cau[]`). */
export interface CauGiao {
  qid: string
  /** Mã dạng (`game_v2_question.dang`); `null` = thiếu ⇒ lõi gom theo chuyên đề + mức, hồ sơ tra theo `CD:<chuyên đề>` (xem `maDangCua`). */
  dang: string | null
  chuyenDe: string
  mucDo: Muc
  sao: Sao
  phan: PhanCau
}

/** Trạng thái một câu trong hồ sơ nắm kiến thức (`nam_kt_cau.trang_thai`). Câu em CHƯA TỪNG GẶP thì không có dòng trong `HoSoEmRut.cau`. */
export type TrangThaiCauEm = 'chua_thay_sai' | 'moi_sai' | 'dang_on' | 'da_khac_phuc'

/** HỒ SƠ CỦA MỘT EM, rút gọn đúng phần bộ rút câu cần — máy chủ dựng từ `nam_kt_dang` + `nam_kt_cau` (+ số ngày đúng lại). */
export interface HoSoEmRut {
  /** Theo MÃ DẠNG (`maDangCua`). Vắng dạng ⇒ em chưa có bằng chứng ở dạng ấy (coi như bậc Biết, chưa đủ tin). */
  dang: Record<string, DangCuaEm>
  /** Theo qid. Vắng qid ⇒ em chưa từng làm câu ấy. */
  cau: Record<string, CauCuaEm>
}

export interface DangCuaEm {
  bac: Muc
  /** Số câu ĐÃ GẶP ở dạng này. Dưới `SO_CAU_DU_TIN_DANG` (4) ⇒ chưa đủ tin: bậc coi là Biết, dạng không bị gọi là "yếu". */
  soGap: number
  soSai: number
  /** (câu đã khắc phục + câu chưa từng sai) / câu đã gặp, 0–1; `null` khi chưa đủ mẫu. Dưới `NGUONG_DANG_YEU` (0,7) ⇒ dạng YẾU. */
  tiLeKhacPhuc: number | null
}

export interface CauCuaEm {
  trangThai: TrangThaiCauEm
  /** Số NGÀY KHÁC NHAU em đã làm đúng câu này. ≥ 2 ⇒ làm nữa là phí sức (em giỏi được bỏ câu dễ đã đúng lại). */
  ngayDungKhacNhau: number
  lanSai: number
}

/** NGÂN SÁCH CỦA MỘT EM cho bài này — máy chủ tính từ tốc độ thật của em (8–16 câu/ngày) và phần ôn lại tới hạn. */
export interface NganSachBai {
  /** Số ngày từ lúc em mở bài tới hạn nộp (≥ 1). Bằng số CHẶNG. */
  soNgay: number
  /** Số câu em làm được mỗi ngày. */
  cauMoiNgay: number
  /** Trong số đó, bao nhiêu câu mỗi ngày dành cho ôn lại 1·3·7 tới hạn (không thuộc bài này). */
  onLaiMoiNgay: number
}

/** Nhãn LÝ DO của từng câu trong bộ của em (Code 2 hiện chữ nhẹ: khởi động / cốt lõi / dành riêng cho em / thử thách). */
export type NhanCau = 'loi' | 'khoi_dong' | 'dang_yeu' | 'cung_co' | 'thu_thach'

/** CON SỐ ĐO ĐƯỢC của một bộ — cho bảng xem trước của thầy và đầu bài của em. Không có chữ đánh giá em. */
export interface TomTatBo {
  /** |lõi| + |riêng| + |thử thách|. */
  tong: number
  soLoi: number
  soRieng: number
  soThuThach: number
  /** Số câu theo mức độ của câu (Biết / Hiểu / Vận dụng). */
  soBiet: number
  soHieu: number
  soVanDung: number
  soChang: number
  /** Số dạng em đang YẾU trong bài này và số dạng trong đó có ≥ 2 câu ở bộ. */
  soDangYeu: number
  soDangYeuDuCau: number
  /** Ngân sách (soNgay × (cauMoiNgay − onLaiMoiNgay)) đã kẹp trong [|lõi|, N] — `tong` không bao giờ vượt số này trừ khi lõi đã vượt sẵn. */
  nganSachCau: number
}

/** BỘ CÂU CỦA MỘT EM. `loi`, `rieng`, `thuThach` ĐÔI MỘT RỜI NHAU; hợp của ba = mọi câu của em = hợp của `chang`. */
export interface BoCuaEm {
  /** Lõi chung (giống hệt nhau ở MỌI em của bài; thứ tự theo đề). */
  loi: string[]
  /** Phần riêng chọn theo hồ sơ (không gồm thử thách). */
  rieng: string[]
  /** Câu +1 bậc so với bậc đích, chỉ ở dạng em đang ổn; ≤ 20 % bộ. */
  thuThach: string[]
  /** Các chặng theo ngày (chặng đầu = ngày đầu); MỖI chặng: 2 khởi động → lõi → dạng yếu → củng cố → thử thách đứng cuối. */
  chang: string[][]
  nhan: Record<string, NhanCau>
  tomTat: TomTatBo
}

/** KẾT QUẢ MỘT CHẶNG (máy chủ chấm) — đầu vào của `thichNghiChangSau` (ĐỢT 2). */
export interface KetQuaChang {
  /** qid → đúng/sai của các câu em đã làm trong chặng. */
  dung: Record<string, boolean>
}

/** THẺ "HÔM NAY EM TIẾN THÊM GÌ" — CHỈ SỐ ĐẾM, so em với chính em lần trước (không xếp hạng, không kết luận năng lực). */
export interface TienBo {
  /** Dạng có bậc CAO HƠN so với `truoc`. */
  dangLenBac: { ma: string; tu: Muc; den: Muc }[]
  /** Số câu từng sai / đang ôn nay đã khắc phục. */
  soCauDungLai: number
  /** Số câu lần đầu gặp. */
  soCauMoiGap: number
  /** Số dạng lần đầu gặp. */
  soDangMoi: number
  /** Có ít nhất một tiến triển ở trên (để thẻ chọn lời: có gì thì nói, không có thì im — không bịa). */
  coTienBo: boolean
}

// ══════════════════════════════ HÀM ══════════════════════════════

/** Mức độ dạng chữ của phiếu ('biet' | 'hieu' | 'van_dung') → số 0|1|2; chữ lạ ⇒ 0. */
export function mucTuChu(_chu: string | null | undefined): Muc {
  throw new Error('btvn-nang-do: chưa cài (commit kiểu)')
}

/** Mã dạng dùng để tra hồ sơ: `dang` nếu có, không thì `CD:<chuyên đề>` (đúng quy ước `nam_kt_dang.ma_dang`). */
export function maDangCua(_c: Pick<CauGiao, 'dang' | 'chuyenDe'>): string {
  throw new Error('btvn-nang-do: chưa cài (commit kiểu)')
}

/**
 * LÕI CHUNG (bước B). Với MỖI dạng có trong bài lấy 1–2 câu đại diện (sao cao → mức thấp → phần I trước), tổng ≈ 25–35 % số câu; luôn gồm câu
 * `ghim` (thầy bắt buộc cả lớp); câu thiếu dạng thì nhóm theo chuyên đề + mức. Trả qid theo THỨ TỰ ĐỀ. Không phụ thuộc hồ sơ em nào ⇒ mọi em cùng lõi.
 */
export function chonLoi(_cau: CauGiao[], _ghim: string[]): string[] {
  throw new Error('btvn-nang-do: chưa cài (commit kiểu)')
}

/**
 * BỘ CÂU CỦA MỘT EM (bước C–F). `loi` = kết quả `chonLoi`; `hoSo` = hồ sơ em (rỗng ⇒ lõi + Biết/Hiểu); `nganSach` = của em; `hatGiong` = `maBtvn|sbd`.
 * Tất định. |bộ| ∈ [|lõi|, N] và ≤ ngân sách; mọi câu ngoài lõi không vượt bậc đích + 1.
 */
export function chonBoCuaEm(_cau: CauGiao[], _loi: string[], _hoSo: HoSoEmRut, _nganSach: NganSachBai, _hatGiong: string): BoCuaEm {
  throw new Error('btvn-nang-do: chưa cài (commit kiểu)')
}

/** THÍCH NGHI SAU MỖI CHẶNG (bước G, ĐỢT 2 — chữ ký có thể còn đổi, chưa ai bám): trả bộ mới cho các chặng CHƯA MỞ; chặng đã mở và lõi không bao giờ đổi. */
export function thichNghiChangSau(_bo: BoCuaEm, _cau: CauGiao[], _hoSo: HoSoEmRut, _chiSoChangVuaXong: number, _ketQua: KetQuaChang): BoCuaEm {
  throw new Error('btvn-nang-do: chưa cài (Đợt 2)')
}

/** THẺ TIẾN BỘ: so hồ sơ em TRƯỚC và SAU (cùng một em). Chỉ số đếm. */
export function theTienBo(_truoc: HoSoEmRut, _sau: HoSoEmRut): TienBo {
  throw new Error('btvn-nang-do: chưa cài (commit kiểu)')
}
