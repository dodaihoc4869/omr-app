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
// ─── TRẠNG THÁI: kiểu + chữ ký chốt ở 27059a6 (Code 3/4/2 đã bám); `chonLoi` · `chonBoCuaEm` · `theTienBo` cài ở 569ebfd; Đợt 2: `thichNghiChangSau` cài,
// `chonBoCuaEm` nhận thêm cổng `dieuChinh?` tuỳ chọn (vắng ⇒ kết quả Y HỆT 569ebfd, khoá bằng chữ ký vàng trong test). KHẮC PHỤC LUÔN (`dieuChinh.khacPhuc`) cài 21/09 chiều (Boss: bộ não chạy thật).
// BẢN 1.2 (Boss 21/09, bài thật đầu tiên: bài 29 dạng, em yếu nhận 29 câu toàn lõi, 14 câu `loi_cao`, phần riêng 0): LÕI BẮT BUỘC của từng em = câu lõi mức ≤ bậc đích + 1 (hoặc câu GHIM);
// lõi cao hơn ⇒ `thuSucThem[]` ("thử sức thêm — không bắt buộc": không nằm trong `chang`, không tính vào ngân sách/xong chặng/xong bài); ngân sách so với LÕI BẮT BUỘC ⇒ em yếu còn chỗ cho phần riêng đúng bậc. ───
import { hashSeed } from './exam-shuffle'

// ══════════════════════════════ HẰNG SỐ (đổi một chỗ; test khoá) ══════════════════════════════

export const BTVN_NANG_DO = {
  /** Lõi chung ≈ 30 % số câu (thầy chốt 21/09); tự tính theo số dạng: mỗi dạng ≥ 1 câu, tới 2 câu cho tới khi chạm mục tiêu. */
  TL_LOI: 0.3,
  LOI_TOI_DA_MOI_DANG: 2,
  /** Một định nghĩa với `ho-so-lop.ts` (`SO_CAU_DU_TIN_DANG`, `NGUONG_DANG_YEU`) — test so hai nơi. */
  SO_CAU_DU_TIN_DANG: 4,
  NGUONG_DANG_YEU: 0.7,
  /** Mỗi dạng YẾU của em có ít nhất bấy nhiêu câu trong bộ (khi kho còn và ngân sách đủ). */
  DANG_YEU_TOI_THIEU_CAU: 2,
  /** Câu thử thách (+1 bậc): mục tiêu 15 %, TRẦN 20 % (làm tròn xuống, có thể 0) của phần NGOÀI lõi, mỗi chặng tối đa một câu (đứng cuối chặng). */
  TL_THU_THACH: 0.15,
  TL_THU_THACH_TOI_DA: 0.2,
  /** Mở +1 bậc đích khi em đã đúng (khắc phục hoặc chưa từng sai) ≥ bấy nhiêu câu ở BẬC HIỆN TẠI của dạng trong bài này. */
  DUNG_MO_BAC: 2,
  SO_KHOI_DONG: 2,
  /** Cổng điều chỉnh (bộ não đêm). */
  NHIP_TOI_DA: 3,
  CAU_NGAY_TOI_THIEU: 6,
  CAU_NGAY_TOI_DA: 16,
  KHOI_DONG_TOI_THIEU: 1,
  KHOI_DONG_TOI_DA: 3,
  DANG_DIEU_CHINH_TOI_DA: 3,
  /** Khắc phục luôn (`dieuChinh.khacPhuc`): tối đa 2 dạng, mỗi dạng 2–4 câu. */
  KHAC_PHUC_TOI_DA: 2,
  KHAC_PHUC_SO_CAU_TOI_THIEU: 2,
  KHAC_PHUC_SO_CAU_TOI_DA: 4,
  /** Thích nghi sau chặng (bước G, Đợt 2): đúng ≥ 80 % (≥ 2 câu thường của dạng, dạng yếu cần ≥ 3) ⇒ đổi 1 câu sang bậc cao hơn; sai ≥ 50 % (≥ 2 câu) ⇒ thêm 1 câu cùng dạng bậc thấp hơn. */
  TL_DUNG_LEN_BAC: 0.8,
  TL_SAI_HA_THAP: 0.5,
  MAU_TOI_THIEU_THICH_NGHI: 2,
  MAU_TOI_THIEU_DANG_YEU: 3,
  DOI_TOI_DA_MOI_CHANG: 3,
  /** Em đã đúng câu ở ≥ bấy nhiêu NGÀY KHÁC NHAU thì làm nữa là phí sức. */
  NGAY_DUNG_LAI_BO: 2,
  /** Điểm chọn câu riêng (bước E). Câu chỉ được lấp vào chỗ trống khi điểm > 0. */
  DIEM: {
    dangYeu: 3,
    dungBacDich: 2,
    duoiBacDichMot: 0.5,
    saiChuaDungLai: 2.5,
    chuaTungLam: 1,
    /** Dạng thầy / bộ não cho ưu tiên: cộng như dạng yếu. */
    uuTien: 3,
    daDungLai: -4,
    /** Trừ nhẹ cho mỗi câu ĐÃ chọn cùng dạng — để bộ không dồn hết vào một dạng. */
    trungDang: 0.25,
    saoCao: 0.01,
  },
} as const

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
  /** Câu GHIM của thầy: LUÔN bắt buộc với mọi em (thầy chủ động chọn), kể cả khi cao hơn bậc đích + 1 của em. (Có thể truyền qua `tuyChon.ghim` thay vì cờ này.) */
  ghim?: boolean
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
  /** TRẦN TỔNG số câu của bộ (bản 1.4, hạn ngắn — `nganSachHanNgan` của `btvn-nang-do-lich.ts`): tổng câu bắt buộc ≤ max(lõi bắt buộc, min(soNgay × (cauMoiNgay − ôn lại), tongToiDa)) — LÕI luôn đủ, chỉ phần riêng
   *  + thử thách bị chặn. Vắng / không phải số hữu hạn ≥ 0 ⇒ không trần (kết quả Y HỆT bản trước). */
  tongToiDa?: number
}

/** Nhãn LÝ DO của từng câu trong bộ của em (Code 2 hiện chữ nhẹ: khởi động / cốt lõi / dành riêng cho em / thử thách).
 * `loi_cao` (bản 1.2, Boss 21/09): câu LÕI mà CAO HƠN bậc đích + 1 của em ở dạng ấy và KHÔNG được ghim — nay là "THỬ SỨC THÊM · không bắt buộc" (`BoCuaEm.thuSucThem`, KHÔNG nằm trong `chang`):
 * đúng thì cộng (câu THƯỞNG), sai/bỏ không vào mẫu, không tính vào điều kiện xong chặng / xong bài. Trường hợp hiếm bài KHÔNG có gì bắt buộc mà lõi toàn câu cao ⇒ các câu ấy vào chặng như bản cũ. */
export type NhanCau = 'loi' | 'khoi_dong' | 'dang_yeu' | 'cung_co' | 'thu_thach' | 'loi_cao'

/** CON SỐ ĐO ĐƯỢC của một bộ — cho bảng xem trước của thầy và đầu bài của em. Không có chữ đánh giá em. */
export interface TomTatBo {
  /** Số câu BẮT BUỘC = số câu trong các chặng = `soLoi` + `soRieng` + `soThuThach` (không gồm `thuSucThem`). */
  tong: number
  /** Số câu lõi BẮT BUỘC của em này (lõi mức ≤ bậc đích + 1, hoặc ghim). */
  soLoi: number
  soRieng: number
  soThuThach: number
  /** Số câu lõi đang mang nhãn `loi_cao` với em này (⊆ lõi) — bằng `soThuSucThem`, trừ trường hợp hiếm bài không có gì bắt buộc. */
  soLoiCao: number
  /** Số câu "thử sức thêm — không bắt buộc" (`BoCuaEm.thuSucThem`). Xem trước hiện "bắt buộc `tong` · thử sức thêm `soThuSucThem`". */
  soThuSucThem: number
  /** Số câu bắt buộc (= `tong`; tên rõ nghĩa cho màn Xem trước). */
  soBatBuoc: number
  /** Số câu theo mức độ của câu (Biết / Hiểu / Vận dụng). */
  soBiet: number
  soHieu: number
  soVanDung: number
  soChang: number
  /** Số dạng em đang YẾU trong bài này và số dạng trong đó có ≥ 2 câu ở bộ. */
  soDangYeu: number
  soDangYeuDuCau: number
  /** Ngân sách (soNgay × (cauMoiNgay − onLaiMoiNgay)) đã kẹp trong [|lõi bắt buộc|, N − |thử sức thêm|] — `tong` không bao giờ vượt số này trừ khi lõi bắt buộc đã vượt sẵn. */
  nganSachCau: number
}

/** BỘ CÂU CỦA MỘT EM. `loi`, `rieng`, `thuThach` ĐÔI MỘT RỜI NHAU; hợp của ba = mọi câu của em = hợp của `chang` VÀ `thuSucThem` (rời nhau). */
export interface BoCuaEm {
  /** Lõi chung (giống hệt nhau ở MỌI em của bài; thứ tự theo đề) — gồm cả câu "thử sức thêm" (`thuSucThem ⊆ loi`). */
  loi: string[]
  /** THỬ SỨC THÊM (bản 1.2): câu lõi cao hơn bậc đích + 1 của em, không ghim. KHÔNG nằm trong `chang`; máy học sinh xếp thành nhóm riêng SAU chặng cuối (mở cùng lúc chặng cuối);
   *  không tính vào xong chặng / xong bài / ngân sách; đúng thì cộng (câu thưởng), sai/bỏ không vào mẫu, không hẹn ôn. Em khá (bậc đủ) ⇒ rỗng. */
  thuSucThem: string[]
  /** Phần riêng chọn theo hồ sơ (không gồm thử thách). */
  rieng: string[]
  /** Câu +1 bậc so với bậc đích, chỉ ở dạng em đang ổn; ≤ 20 % (làm tròn xuống) của phần NGOÀI lõi. */
  thuThach: string[]
  /** Các chặng theo ngày (chặng đầu = ngày đầu); MỖI chặng: 2 khởi động → lõi → dạng yếu → củng cố → (câu lõi cao) → thử thách đứng cuối. */
  chang: string[][]
  nhan: Record<string, NhanCau>
  tomTat: TomTatBo
  /** KẾT QUẢ "khắc phục luôn" — CHỈ có khi `dieuChinh.khacPhuc` có phần tử (vắng ⇒ không có trường: bộ Y HỆT bản không có cổng). Mỗi dạng được yêu cầu một dòng: làm được bao nhiêu + lý do nếu thiếu. */
  khacPhuc?: KetQuaKhacPhuc[]
}

/** KẾT QUẢ MỘT YÊU CẦU `khacPhuc` (để ghi nhật ký / cho thầy đọc — máy chủ không bịa hơn con số này). Không đủ câu thì làm được bao nhiêu trả bấy nhiêu; `lyDo` rỗng khi làm đủ. */
export interface KetQuaKhacPhuc {
  dang: string
  /** Số câu bộ não xin (đã kẹp 2–4). */
  yeuCau: number
  /** Số câu THẬT SỰ được chèn (0 ≤ duoc ≤ yeuCau). */
  duoc: number
  /** Câu chèn vào / câu phần riêng bị bớt để tổng tải không tăng (cùng độ dài `duoc`). */
  vao: string[]
  ra: string[]
  /** Chỉ số chặng (từ 0) được chèn; `null` khi không chèn được câu nào. */
  chang: number | null
  /** Một câu ngắn tiếng Việt khi `duoc < yeuCau`; rỗng khi đủ. */
  lyDo: string
}

/** KẾT QUẢ MỘT CHẶNG (máy chủ chấm) — đầu vào của `thichNghiChangSau` (ĐỢT 2). */
export interface KetQuaChang {
  /** qid → đúng/sai của các câu em đã làm trong chặng. */
  dung: Record<string, boolean>
}

/** MỘT THAY ĐỔI của `thichNghiChangSau` (để ghi sổ / hiện chỉ số): `len_bac` = đổi `ra` (bậc thấp) lấy `vao` (bậc cao hơn) · `them_cau_de` = thêm `vao` (bậc thấp hơn); nếu hết chỗ thì `ra` là câu củng cố bị nhường chỗ. */
export interface DoiThichNghi {
  ma: string
  loai: 'len_bac' | 'them_cau_de' | 'khac_phuc'
  /** Chỉ số chặng (từ 0) bị đổi. */
  chang: number
  vao: string
  ra: string | null
}

/** KẾT QUẢ THÍCH NGHI: bộ mới + câu cần HẸN vào lịch ôn 1·3·7 (câu THƯỜNG em làm sai ở chặng vừa xong; thử thách và lõi cao sai không vào — "sai không sao") + các thay đổi đã làm. */
export interface KetQuaThichNghi {
  bo: BoCuaEm
  henOnLai: string[]
  doi: DoiThichNghi[]
  /** Kết quả "khắc phục luôn" — chỉ có khi cổng `dieuChinh.khacPhuc` có phần tử (mỗi dạng một dòng; chèn thật nằm ở `doi` với `loai: 'khac_phuc'`). */
  khacPhuc?: KetQuaKhacPhuc[]
}

/** NÚT VẶN TỪNG DẠNG của bộ não đêm (`DE-XUAT-BO-NAO-AI-2109.md` mục 4): ưu tiên · hạ một bậc · cho thử lên bậc · tạm nghỉ. */
export type NutDang = 'uu_tien' | 'ha_mot_bac' | 'cho_thu_len_bac' | 'tam_nghi'

/** ĐIỀU CHỈNH THEO EM (cổng TUỲ CHỌN của `chonBoCuaEm`; máy chủ kiểm từng trường trước khi đưa vào). Vắng ⇒ kết quả Y HỆT không có cổng (test khoá).
 * CẤM TUYỆT ĐỐI (luật thầy, cài cứng ở đây): rút câu lõi · câu ngoài lõi vượt bậc đích + 1 · chọn mã câu. Chỉ đổi NHỊP và CÁCH chọn/xếp phần riêng. */
export interface DieuChinhEm {
  /** Thêm (+) / bớt (−) câu MỖI NGÀY, số nguyên, kẹp [−3, +3]; số câu/ngày sau điều chỉnh kẹp trong [6, 16] (ngân sách gốc nằm ngoài khoảng ấy thì không bị kéo vào). */
  nhip?: number
  /** Số câu khởi động mỗi chặng, 1–3 (mặc định 2). */
  khoiDong?: number
  /** Tối đa 3 dạng (dòng thứ 4 trở đi và dạng lặp bị bỏ; mã không có trong bài bị bỏ).
   *  · `uu_tien`: dạng được xử lý như dạng YẾU (≥ 2 câu, điểm cộng, xếp trước phần củng cố); · `ha_mot_bac`: bậc đích của dạng thấp đi một bậc;
   *  · `cho_thu_len_bac`: bậc đích của dạng cao thêm một bậc, KHÔNG quá bậc hồ sơ + 1 và không áp cho dạng YẾU; · `tam_nghi`: phần riêng và thử thách không lấy câu của dạng
   *  (câu lõi của dạng vẫn ở lại). */
  dang?: { ma: string; nut: NutDang }[]
  /** KHẮC PHỤC LUÔN (bộ não tự hành, ≤ 2 dạng; đã cài): rút `soCau` (2–4) câu cùng dạng CHƯA giao từ kho của chính bài, đúng bậc đích (`dung_bac`) hoặc thấp hơn một bậc (`thap_hon_mot_bac`),
   *  chèn vào chặng CHƯA mở kế tiếp (lúc chọn bộ = chặng đầu; sau chặng xong = chặng kế chưa mở) và BỚT câu CỦNG CỐ dễ nhất của dạng KHÁC để tổng tải không tăng.
   *  Không đủ câu (hoặc không còn câu củng cố để bớt) thì chèn được bao nhiêu trả bấy nhiêu (`BoCuaEm.khacPhuc` / `KetQuaThichNghi.khacPhuc` nêu lý do). Không đổi số chặng, lõi, thử thách, chặng đã mở, hạn nộp. */
  khacPhuc?: { dang: string; soCau: number; bac: 'dung_bac' | 'thap_hon_mot_bac' }[]
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

const PHAN_THU_TU: Record<PhanCau, number> = { I: 0, II: 1, III: 2 }
const D = BTVN_NANG_DO

/** Mức độ dạng chữ của phiếu ('biet' | 'hieu' | 'van_dung') → số 0|1|2; chữ lạ ⇒ 0. */
export function mucTuChu(chu: string | null | undefined): Muc {
  const c = (chu ?? '').trim().toLowerCase()
  return c === 'van_dung' ? 2 : c === 'hieu' ? 1 : 0
}

/** Mã dạng dùng để tra hồ sơ: `dang` nếu có, không thì `CD:<chuyên đề>` (đúng quy ước `nam_kt_dang.ma_dang`). */
export function maDangCua(c: Pick<CauGiao, 'dang' | 'chuyenDe'>): string {
  const d = (c.dang ?? '').trim()
  return d ? d : `CD:${c.chuyenDe}`
}

/** Khoá NHÓM khi chọn lõi: dạng nếu có, không thì chuyên đề + mức. */
function khoaNhomLoi(c: CauGiao): string {
  const d = (c.dang ?? '').trim()
  return d ? d : `CD:${c.chuyenDe}|${c.mucDo}`
}

/** Bỏ qid trùng (giữ dòng đầu) — đầu vào từ máy thầy, không tin tuyệt đối. */
function duyNhat(cau: CauGiao[]): CauGiao[] {
  const thay = new Set<string>()
  const ra: CauGiao[] = []
  for (const c of cau) {
    if (!c || thay.has(c.qid)) continue
    thay.add(c.qid)
    ra.push(c)
  }
  return ra
}

/**
 * LÕI CHUNG (bước B). Với MỖI dạng có trong bài lấy 1–2 câu đại diện — MỨC THẤP NHẤT có trong dạng trước (Boss 21/09: em yếu không phân câu khó),
 * rồi sao cao, rồi phần I trước — tổng ≈ 30 % số câu (`TL_LOI`); luôn gồm câu `ghim` (tuỳ chọn: `[]` là bình thường, lõi tự phủ mọi dạng); câu thiếu dạng
 * thì nhóm theo chuyên đề + mức. Trả qid theo THỨ TỰ ĐỀ. Không phụ thuộc hồ sơ em nào ⇒ mọi em cùng lõi.
 *
 * Nếu số dạng đã vượt mục tiêu 30 % thì vẫn mỗi dạng một câu (phủ mọi dạng quan trọng hơn con số 30 %).
 */
export function chonLoi(cau: CauGiao[], ghim: string[] = []): string[] {
  const ds = duyNhat(cau)
  const n = ds.length
  if (n === 0) return []
  const nhom = new Map<string, number[]>()
  ds.forEach((c, i) => {
    const k = khoaNhomLoi(c)
    const a = nhom.get(k)
    if (a) a.push(i)
    else nhom.set(k, [i])
  })
  const sapXep = (a: number[]) =>
    [...a].sort((x, y) => ds[x].mucDo - ds[y].mucDo || ds[y].sao - ds[x].sao || PHAN_THU_TU[ds[x].phan] - PHAN_THU_TU[ds[y].phan] || x - y)
  const xep = new Map<string, number[]>([...nhom].map(([k, a]) => [k, sapXep(a)]))

  const chon = new Set<number>()
  for (const a of xep.values()) chon.add(a[0])
  const viTri = new Map(ds.map((c, i) => [c.qid, i]))
  for (const q of ghim) {
    const i = viTri.get(q)
    if (i !== undefined) chon.add(i)
  }
  // Câu thứ hai của các dạng LỚN trước (nhiều câu nhất), cho tới khi chạm mục tiêu.
  const mucTieu = Math.round(D.TL_LOI * n)
  const theoCo = [...xep.entries()].sort((a, b) => b[1].length - a[1].length)
  for (const [, a] of theoCo) {
    if (chon.size >= mucTieu) break
    if (a.length < 2 || a.filter((i) => chon.has(i)).length >= D.LOI_TOI_DA_MOI_DANG) continue
    const them = a.find((i) => !chon.has(i))
    if (them !== undefined) chon.add(them)
  }
  return [...chon].sort((x, y) => x - y).map((i) => ds[i].qid)
}

interface TinDang {
  /** Đủ bằng chứng (≥ 4 câu đã gặp). */
  duTin: boolean
  yeu: boolean
  tiLe: number
  /** Bậc đích: bậc hiện tại (Biết nếu chưa đủ tin), +1 khi dạng ổn và đã đúng ≥ 2 câu ở bậc hiện tại trong bài. */
  bacDich: Muc
  /** Bậc trong hồ sơ (Biết nếu chưa đủ tin) — mốc chặn cho `cho_thu_len_bac`. */
  bacHoSo: Muc
  /** Bậc đích GỐC (trước mọi núm của bộ não): mốc phân lõi bắt buộc / thử sức thêm — núm bộ não KHÔNG được kéo câu lõi ra khỏi phần bắt buộc. */
  bacGoc: Muc
  /** Cờ từ `DieuChinhEm` (vắng ⇒ false). */
  uuTien: boolean
  nghi: boolean
  /** `cho_thu_len_bac` ĐÃ nâng bậc đích ở dạng này (thử thách của dạng không được vượt bậc hồ sơ + 1). */
  nutLen: boolean
}

/** Bậc đích + tình trạng yếu của em ở từng dạng CÓ trong bài (bước C). */
function tinhDang(ds: CauGiao[], hoSo: HoSoEmRut): Map<string, TinDang> {
  const ra = new Map<string, TinDang>()
  const dungLien = new Map<string, number>()
  for (const c of ds) {
    const ma = maDangCua(c)
    const d = hoSo.dang?.[ma]
    const duTin = !!d && d.soGap >= D.SO_CAU_DU_TIN_DANG
    if (!ra.has(ma)) {
      const yeu = duTin && d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < D.NGUONG_DANG_YEU
      ra.set(ma, { duTin, yeu, tiLe: duTin && d.tiLeKhacPhuc !== null ? d.tiLeKhacPhuc : 1, bacDich: duTin ? d.bac : 0, bacHoSo: duTin ? d.bac : 0, bacGoc: 0, uuTien: false, nghi: false, nutLen: false })
    }
    const t = ra.get(ma)!
    const dq = hoSo.cau?.[c.qid]
    const bac = t.duTin ? (hoSo.dang[ma].bac as Muc) : 0
    if (dq && c.mucDo === bac && (dq.trangThai === 'da_khac_phuc' || dq.trangThai === 'chua_thay_sai')) dungLien.set(ma, (dungLien.get(ma) ?? 0) + 1)
  }
  for (const [ma, t] of ra) {
    if (!t.yeu && (dungLien.get(ma) ?? 0) >= D.DUNG_MO_BAC) t.bacDich = Math.min(2, t.bacDich + 1) as Muc
    t.bacGoc = t.bacDich
  }
  return ra
}

interface DieuChinhChuan {
  nhip: number
  khoiDong: number | null
  nut: Map<string, NutDang>
}

/** Chuẩn hoá cổng điều chỉnh (dữ liệu từ ngoài, không tin): nhịp nguyên kẹp ±3, khởi động 1–3, tối đa 3 dạng không lặp. */
function chuanDieuChinh(dc: DieuChinhEm | null | undefined): DieuChinhChuan {
  const nut = new Map<string, NutDang>()
  for (const x of dc?.dang ?? []) {
    if (nut.size >= D.DANG_DIEU_CHINH_TOI_DA) break
    if (!x || typeof x.ma !== 'string' || nut.has(x.ma)) continue
    if (x.nut === 'uu_tien' || x.nut === 'ha_mot_bac' || x.nut === 'cho_thu_len_bac' || x.nut === 'tam_nghi') nut.set(x.ma, x.nut)
  }
  const nhip = Number.isFinite(dc?.nhip) ? Math.max(-D.NHIP_TOI_DA, Math.min(D.NHIP_TOI_DA, Math.trunc(dc!.nhip as number))) : 0
  const kd = Number.isFinite(dc?.khoiDong) ? Math.max(D.KHOI_DONG_TOI_THIEU, Math.min(D.KHOI_DONG_TOI_DA, Math.trunc(dc!.khoiDong as number))) : null
  return { nhip, khoiDong: kd, nut }
}

/** Số câu/ngày SAU nhịp: gốc ± nhịp, kẹp [6, 16] nhưng KHÔNG kéo ngân sách gốc nằm ngoài khoảng ấy về phía không được điều chỉnh. Nhịp 0 ⇒ nguyên gốc. */
function cauNgaySauNhip(goc: number, nhip: number): number {
  if (nhip === 0) return goc
  return Math.max(Math.min(D.CAU_NGAY_TOI_THIEU, goc), Math.min(Math.max(D.CAU_NGAY_TOI_DA, goc), goc + nhip))
}

/** Áp các nút dạng lên bậc đích / cờ của từng dạng (chỉ dạng CÓ trong bài). */
function apNutDang(dang: Map<string, TinDang>, nut: Map<string, NutDang>): void {
  for (const [ma, n] of nut) {
    const t = dang.get(ma)
    if (!t) continue
    if (n === 'uu_tien') t.uuTien = true
    else if (n === 'tam_nghi') t.nghi = true
    else if (n === 'ha_mot_bac') t.bacDich = Math.max(0, t.bacDich - 1) as Muc
    else if (n === 'cho_thu_len_bac' && !t.yeu) {
      const len = Math.min(2, t.bacHoSo + 1, t.bacDich + 1) as Muc
      if (len > t.bacDich) {
        t.bacDich = len
        t.nutLen = true
      }
    }
  }
}

/** Hạng "dễ chắc đúng" của câu với em: 0 = em từng làm đúng · 1 = chưa từng làm · 2 = từng sai (còn phải ôn). */
function hangDe(dq: CauCuaEm | undefined): number {
  if (!dq) return 1
  return dq.trangThai === 'da_khac_phuc' || dq.trangThai === 'chua_thay_sai' ? 0 : 2
}

type KhacPhucYeuCau = NonNullable<DieuChinhEm['khacPhuc']>[number]

/** Chuẩn hoá `dieuChinh.khacPhuc` (dữ liệu từ ngoài, không tin): ≤ 2 dạng không lặp, bậc hợp lệ, `soCau` nguyên kẹp 2–4; phần tử sai bị bỏ. */
function chuanKhacPhuc(dc: DieuChinhEm | null | undefined): KhacPhucYeuCau[] {
  const ra: KhacPhucYeuCau[] = []
  const daCo = new Set<string>()
  for (const x of Array.isArray(dc?.khacPhuc) ? dc!.khacPhuc! : []) {
    if (ra.length >= D.KHAC_PHUC_TOI_DA) break
    if (!x || typeof x.dang !== 'string' || x.dang === '' || daCo.has(x.dang)) continue
    if (x.bac !== 'dung_bac' && x.bac !== 'thap_hon_mot_bac') continue
    if (!Number.isFinite(x.soCau)) continue
    daCo.add(x.dang)
    ra.push({ dang: x.dang, bac: x.bac, soCau: Math.max(D.KHAC_PHUC_SO_CAU_TOI_THIEU, Math.min(D.KHAC_PHUC_SO_CAU_TOI_DA, Math.trunc(x.soCau))) })
  }
  return ra
}

/**
 * KHẮC PHỤC LUÔN lên một bộ đã dựng. Với mỗi yêu cầu (theo thứ tự): rút tối đa `soCau` câu cùng dạng CHƯA giao (không lõi, không trong chặng, không "thử sức thêm") ở đúng bậc đích (hoặc thấp hơn một bậc),
 * chèn vào chặng `chiSoDich` (chặng CHƯA mở đầu tiên), ngay sau khởi động/lõi/dạng yếu; đồng thời BỚT đúng bấy nhiêu câu CỦNG CỐ dễ nhất của dạng KHÁC ở các chặng chưa mở (chặng đích trước) — tổng tải KHÔNG tăng.
 * Chỉ động vào chặng ≥ `chiSoDich`; không đổi số chặng, lõi, thử thách, "thử sức thêm". Thiếu câu / thiếu câu để bớt ⇒ làm được bao nhiêu trả bấy nhiêu + lý do. Câu em đã đúng lại ≥ 2 ngày khác nhau không được chọn.
 */
function apKhacPhucLenBo(bo: BoCuaEm, ds: CauGiao[], hs: HoSoEmRut, dang: Map<string, TinDang>, kp: KhacPhucYeuCau[], chiSoDich: number): { bo: BoCuaEm; doi: DoiThichNghi[]; ketQua: KetQuaKhacPhuc[] } {
  const theoQid = new Map(ds.map((c, i) => [c.qid, { c, i }]))
  const chang = bo.chang.map((c) => [...c])
  const nhan: Record<string, NhanCau> = { ...bo.nhan }
  const rieng = [...bo.rieng]
  const loiSet = new Set(bo.loi)
  const thuSucSet = new Set(bo.thuSucThem ?? [])
  const thuThachSet = new Set(bo.thuThach)
  const daCo = new Set<string>([...chang.flat(), ...loiSet, ...thuSucSet]) // đã giao (kể cả câu vừa bị bớt: không rút lại)
  const coChang = Number.isInteger(chiSoDich) && chiSoDich >= 0 && chiSoDich < chang.length
  const doi: DoiThichNghi[] = []
  const ketQua: KetQuaKhacPhuc[] = []
  const hangCau = (q: string) => hangDe(hs.cau[q])

  for (const y of kp) {
    const khong = (lyDo: string) => ketQua.push({ dang: y.dang, yeuCau: y.soCau, duoc: 0, vao: [], ra: [], chang: null, lyDo })
    const t = dang.get(y.dang)
    if (!t) { khong('Dạng này không có trong bài'); continue }
    if (!coChang) { khong('Không còn chặng nào chưa mở để chèn câu'); continue }
    if (t.nghi) { khong('Dạng đang được tạm nghỉ'); continue }
    const muc = y.bac === 'dung_bac' ? t.bacDich : t.bacDich - 1
    if (muc < 0) { khong('Dạng đang ở bậc Biết, không có bậc thấp hơn'); continue }

    // ứng viên: câu chưa từng làm trước, rồi câu từng sai, sau cùng câu em đã đúng; đúng ≥ 2 ngày khác nhau thì bỏ (phí sức)
    const ung = ds
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => maDangCua(c) === y.dang && c.mucDo === muc && !daCo.has(c.qid) && (hs.cau[c.qid]?.ngayDungKhacNhau ?? 0) < D.NGAY_DUNG_LAI_BO)
      .sort((a, b) => (hangCau(a.c.qid) === 1 ? 0 : hangCau(a.c.qid) === 2 ? 1 : 2) - (hangCau(b.c.qid) === 1 ? 0 : hangCau(b.c.qid) === 2 ? 1 : 2) || b.c.sao - a.c.sao || a.i - b.i)
    // câu có thể BỚT: củng cố (không lõi, không thử thách, không khởi động, không dạng yếu/ưu tiên) của dạng KHÁC, ở chặng chưa mở; chặng đích trước, rồi dễ nhất
    const bot: { q: string; c: number; i: number }[] = []
    for (let c = chiSoDich; c < chang.length; c++)
      for (const q of chang[c]) {
        const x = theoQid.get(q)
        if (x && nhan[q] === 'cung_co' && !loiSet.has(q) && !thuThachSet.has(q) && maDangCua(x.c) !== y.dang) bot.push({ q, c, i: x.i })
      }
    bot.sort((a, b) => Number(a.c !== chiSoDich) - Number(b.c !== chiSoDich) || ds[a.i].mucDo - ds[b.i].mucDo || hangCau(a.q) - hangCau(b.q) || ds[a.i].sao - ds[b.i].sao || a.i - b.i)

    const duoc = Math.min(y.soCau, ung.length, bot.length)
    const vao: string[] = []
    const ra: string[] = []
    for (let k = 0; k < duoc; k++) {
      const moi = ung[k].c.qid
      const cu = bot[k]
      chang[cu.c].splice(chang[cu.c].indexOf(cu.q), 1)
      rieng.splice(rieng.indexOf(cu.q), 1)
      delete nhan[cu.q]
      const dich = chang[chiSoDich]
      let vt = 0
      while (vt < dich.length && (nhan[dich[vt]] === 'khoi_dong' || nhan[dich[vt]] === 'loi' || nhan[dich[vt]] === 'dang_yeu')) vt++
      dich.splice(vt, 0, moi)
      rieng.push(moi)
      nhan[moi] = 'dang_yeu'
      daCo.add(moi)
      vao.push(moi)
      ra.push(cu.q)
      doi.push({ ma: y.dang, loai: 'khac_phuc', chang: chiSoDich, vao: moi, ra: cu.q })
    }
    const lyDo = duoc >= y.soCau ? '' : ung.length <= bot.length ? (ung.length === 0 ? 'Không còn câu cùng dạng chưa giao ở đúng bậc' : `Chỉ còn ${ung.length} câu cùng dạng chưa giao ở đúng bậc`) : 'Không còn câu củng cố để bớt, giữ nguyên tổng số câu'
    ketQua.push({ dang: y.dang, yeuCau: y.soCau, duoc, vao, ra, chang: duoc > 0 ? chiSoDich : null, lyDo })
  }
  if (doi.length === 0) return { bo, doi, ketQua }

  const rienDoDe = [...rieng].sort((a, b) => (theoQid.get(a)?.i ?? 0) - (theoQid.get(b)?.i ?? 0))
  const tatCa = [...bo.loi.filter((q) => !thuSucSet.has(q)), ...rienDoDe, ...bo.thuThach] // câu BẮT BUỘC (không gồm thử sức thêm)
  const demMuc = (m: Muc) => tatCa.filter((q) => theoQid.get(q)?.c.mucDo === m).length
  const dangYeuDu = [...dang.entries()].filter(([ma, t]) => t.yeu && tatCa.filter((q) => { const x = theoQid.get(q); return !!x && maDangCua(x.c) === ma }).length >= D.DANG_YEU_TOI_THIEU_CAU).length
  return {
    bo: { ...bo, rieng: rienDoDe, chang, nhan, tomTat: { ...bo.tomTat, tong: tatCa.length, soBatBuoc: tatCa.length, soRieng: rienDoDe.length, soBiet: demMuc(0), soHieu: demMuc(1), soVanDung: demMuc(2), soDangYeuDuCau: dangYeuDu } },
    doi,
    ketQua,
  }
}

/**
 * BỘ CÂU CỦA MỘT EM (bước C–F). `loi` = kết quả `chonLoi`; `hoSo` = hồ sơ em (rỗng ⇒ lõi + Biết, Hiểu là thử thách); `nganSach` = của em; `hatGiong` = `maBtvn|sbd`.
 * Tất định. |bộ bắt buộc| ∈ [|lõi bắt buộc|, N] và ≤ ngân sách; câu NGOÀI lõi không vượt bậc đích + 1; câu lõi cao hơn bậc đích + 1 (không ghim) thành `thuSucThem` (nhãn `loi_cao`, ngoài chặng).
 * `tuyChon.ghim` (hoặc `CauGiao.ghim`): câu ghim của thầy LUÔN bắt buộc với mọi em.
 * `dieuChinh` (tuỳ chọn, bộ não đêm / thầy): nhịp ±, khởi động 1–3, nút từng dạng, `khacPhuc` (chèn câu cùng dạng vào chặng đầu, bớt câu củng cố dễ nhất — kết quả ở `BoCuaEm.khacPhuc`) — VẮNG (hoặc rỗng) ⇒ kết quả Y HỆT không có cổng; lõi không bao giờ bị rút.
 */
export function chonBoCuaEm(cau: CauGiao[], loi: string[], hoSo: HoSoEmRut, nganSach: NganSachBai, hatGiong: string, dieuChinh?: DieuChinhEm, tuyChon: { ghim?: string[] } = {}): BoCuaEm {
  const ds = duyNhat(cau)
  const n = ds.length
  const viTri = new Map(ds.map((c, i) => [c.qid, i]))
  let loiIdx = [...new Set(loi.map((q) => viTri.get(q)).filter((i): i is number => i !== undefined))].sort((a, b) => a - b)
  let loiSet = new Set(loiIdx)
  const soNgay = Math.max(1, Math.floor(Number.isFinite(nganSach.soNgay) ? nganSach.soNgay : 1))
  const dc = chuanDieuChinh(dieuChinh)
  const cauNgayGoc = Math.floor(Number.isFinite(nganSach.cauMoiNgay) ? nganSach.cauMoiNgay : 0)
  const moiNgay = Math.max(0, cauNgaySauNhip(cauNgayGoc, dc.nhip) - Math.max(0, Math.floor(Number.isFinite(nganSach.onLaiMoiNgay) ? nganSach.onLaiMoiNgay : 0)))

  const hoSoAnToan: HoSoEmRut = { dang: hoSo?.dang ?? {}, cau: hoSo?.cau ?? {} }
  const dang = tinhDang(ds, hoSoAnToan)
  apNutDang(dang, dc.nut)
  const dangCua = ds.map((c) => dang.get(maDangCua(c))!)
  const nhieu = (i: number) => hashSeed(`${hatGiong}|${ds[i].qid}`)

  // ── LÕI BẮT BUỘC (bản 1.2): lõi mức ≤ bậc đích GỐC + 1, hoặc ghim; còn lại = THỬ SỨC THÊM (không bắt buộc). Bậc GỐC ⇒ núm bộ não không bao giờ kéo lõi ra khỏi phần bắt buộc. ──
  const ghimSet = new Set<string>([...(tuyChon.ghim ?? []), ...ds.filter((c) => c.ghim === true).map((c) => c.qid)])

  // ── LÕI ĐÚNG BẬC (thầy chốt 21/09/2026): dạng em ỔN ĐỊNH ở bậc ≥ Hiểu (đủ tin, không yếu) thì câu lõi mức THẤP HƠN bậc của em được ĐỔI TẠI CHỖ 1–1 bằng MỘT câu cùng dạng
  // ĐÚNG bậc (câu không phải lõi, em chưa đúng lại ≥ 2 ngày; câu em đang cần ôn được ưu tiên). Không có câu như vậy ⇒ giữ câu lõi gốc. Bất biến: mỗi dạng giữ nguyên số câu lõi (độ phủ + tổng số câu
  // không đổi); mức thay = bậc HỒ SƠ ≤ bậc đích gốc ⇒ không bao giờ vượt bậc đích, càng không vượt bậc + 1; câu GHIM không bị thay; hạn/điểm/lịch không liên quan. CHỈ phụ thuộc hồ sơ + hạt giống: núm bộ não
  // (`dieuChinh`) KHÔNG đổi lõi. Vắng hồ sơ, dạng chưa đủ tin, bậc Biết, dạng yếu ⇒ Y HỆT bản trước (lõi giống nhau ở mọi em). `BoCuaEm.loi` là lõi CỦA EM; câu lõi gốc bị thay KHÔNG quay lại làm phần riêng.
  const daThay = new Set<number>()
  {
    const dungRoi = new Set<number>(loiIdx)
    const moi: number[] = []
    for (const i of loiIdx) {
      const t = dangCua[i]
      const muc = t.bacHoSo // hồ sơ (không phải bậc đích sau núm): lõi không đổi theo `dieuChinh`
      if (ghimSet.has(ds[i].qid) || !t.duTin || t.yeu || muc < 1 || ds[i].mucDo >= muc) {
        moi.push(i)
        continue
      }
      const ma = maDangCua(ds[i])
      const cho = (j: number): number => {
        const dq = hoSoAnToan.cau[ds[j].qid]
        if (!dq) return 1
        return dq.trangThai === 'moi_sai' || dq.trangThai === 'dang_on' || (dq.lanSai > 0 && dq.trangThai !== 'da_khac_phuc') ? 0 : 2
      }
      const ung = Array.from(ds.keys())
        .filter((j) => !dungRoi.has(j) && maDangCua(ds[j]) === ma && ds[j].mucDo === muc && !((hoSoAnToan.cau[ds[j].qid]?.ngayDungKhacNhau ?? 0) >= D.NGAY_DUNG_LAI_BO))
        .sort((a, b) => cho(a) - cho(b) || ds[b].sao - ds[a].sao || nhieu(a) - nhieu(b) || a - b)
      if (ung.length === 0) {
        moi.push(i)
        continue
      }
      dungRoi.add(ung[0])
      daThay.add(i)
      moi.push(ung[0])
    }
    if (daThay.size > 0) {
      loiIdx = [...new Set(moi)].sort((a, b) => a - b)
      loiSet = new Set(loiIdx)
    }
  }
  let batBuocIdx = loiIdx.filter((i) => ghimSet.has(ds[i].qid) || ds[i].mucDo <= dangCua[i].bacGoc + 1)
  let thuSucIdx = loiIdx.filter((i) => !(ghimSet.has(ds[i].qid) || ds[i].mucDo <= dangCua[i].bacGoc + 1))
  const tranTong = Number.isFinite(nganSach.tongToiDa) && (nganSach.tongToiDa as number) >= 0 ? Math.floor(nganSach.tongToiDa as number) : Infinity
  const nganSachCau = Math.min(Math.max(0, n - thuSucIdx.length), Math.max(batBuocIdx.length, Math.min(soNgay * moiNgay, tranTong)))

  // ── ứng viên PHẦN RIÊNG (mức ≤ bậc đích; dạng chưa đủ tin: bậc đích Biết) và THỬ THÁCH (đúng bậc đích + 1, dạng KHÔNG yếu) ──
  const ungRieng: number[] = []
  const ungThu: number[] = []
  ds.forEach((c, i) => {
    if (loiSet.has(i) || daThay.has(i)) return // câu lõi gốc đã bị thay bằng câu đúng bậc không quay lại làm phần riêng
    const t = dangCua[i]
    if (t.nghi) return // tạm nghỉ dạng này: phần riêng và thử thách không lấy (lõi vẫn ở lại)
    if (c.mucDo <= t.bacDich) ungRieng.push(i)
    else if (c.mucDo === t.bacDich + 1 && !t.yeu && !(t.nutLen && c.mucDo > t.bacHoSo + 1)) ungThu.push(i)
  })
  const diem = (i: number, daChonCungDang: number): number => {
    const c = ds[i]
    const t = dangCua[i]
    const dq = hoSoAnToan.cau[c.qid]
    let d = 0
    if (t.yeu) d += D.DIEM.dangYeu
    if (t.uuTien) d += D.DIEM.uuTien
    if (c.mucDo === t.bacDich) d += D.DIEM.dungBacDich
    else if (c.mucDo === t.bacDich - 1) d += D.DIEM.duoiBacDichMot
    if (!dq) d += D.DIEM.chuaTungLam
    else if (dq.trangThai === 'moi_sai' || dq.trangThai === 'dang_on' || (dq.lanSai > 0 && dq.trangThai !== 'da_khac_phuc')) d += D.DIEM.saiChuaDungLai
    if (dq && dq.ngayDungKhacNhau >= D.NGAY_DUNG_LAI_BO) d += D.DIEM.daDungLai
    d += D.DIEM.saoCao * c.sao
    return d - D.DIEM.trungDang * daChonCungDang
  }
  const hon = (a: { i: number; d: number }, b: { i: number; d: number }) => b.d - a.d || nhieu(a.i) - nhieu(b.i) || a.i - b.i

  // ── số chỗ: tổng = min(ngân sách, số câu có thể cho) ──
  const conCho = Math.max(0, nganSachCau - batBuocIdx.length)
  // THỬ THÁCH tính trên CHỖ TRỐNG SAU LÕI, không trên cả bộ (Boss 21/09 — sửa lỗi cũ: ngân sách chỉ hơn lõi vài câu mà nhiều ngày thì toàn bộ chỗ trống thành thử thách):
  // ≤ 20 % (làm tròn xuống, có thể bằng 0), mục tiêu 15 %, mỗi chặng tối đa một. Chỗ còn lại theo thứ tự: dạng YẾU đúng bậc đích → củng cố → (thử thách ở trên).
  const tranThu = Math.min(Math.floor(D.TL_THU_THACH_TOI_DA * conCho), soNgay)
  const mucThu = Math.min(tranThu, Math.round(D.TL_THU_THACH * conCho))
  const soThu = Math.min(conCho, ungThu.length, mucThu)
  const choRieng = Math.max(0, conCho - soThu)

  // ── PHẦN RIÊNG: trước hết mỗi dạng YẾU đủ ≥ 2 câu (dạng yếu nhất trước), rồi lấp theo điểm (chỉ câu điểm > 0) ──
  const chonRieng: number[] = []
  const daChon = new Set<number>(batBuocIdx) // chỉ lõi BẮT BUỘC tính vào "dạng yếu đủ ≥ 2 câu": câu lõi quá cao không phải câu luyện đúng bậc
  const dem = (ma: string) => [...daChon].filter((j) => maDangCua(ds[j]) === ma).length
  const cungDang = (ma: string) => [...chonRieng].filter((j) => maDangCua(ds[j]) === ma).length
  const dangCanDu = [...dang.entries()].filter(([, t]) => t.yeu || t.uuTien).sort((a, b) => a[1].tiLe - b[1].tiLe || (a[0] < b[0] ? -1 : 1))
  for (const [ma] of dangCanDu) {
    while (chonRieng.length < choRieng && dem(ma) < D.DANG_YEU_TOI_THIEU_CAU) {
      const tot = ungRieng
        .filter((i) => !daChon.has(i) && maDangCua(ds[i]) === ma)
        .map((i) => ({ i, d: diem(i, cungDang(ma)) }))
        .sort(hon)[0]
      if (!tot) break
      chonRieng.push(tot.i)
      daChon.add(tot.i)
    }
  }
  while (chonRieng.length < choRieng) {
    const tot = ungRieng
      .filter((i) => !daChon.has(i))
      .map((i) => ({ i, d: diem(i, cungDang(maDangCua(ds[i]))) }))
      .filter((x) => x.d > 0)
      .sort(hon)[0]
    if (!tot) break
    chonRieng.push(tot.i)
    daChon.add(tot.i)
  }

  // ── THỬ THÁCH: mỗi dạng tối đa một câu trước (dạng ổn nhất trước), rồi vòng hai ──
  const chonThu: number[] = []
  const xepThu = ungThu
    .map((i) => ({ i, t: dangCua[i], m: dang.get(maDangCua(ds[i]))! }))
    .sort((a, b) => Number(b.t.duTin) - Number(a.t.duTin) || b.t.tiLe - a.t.tiLe || hangDe(hoSoAnToan.cau[ds[a.i].qid]) - hangDe(hoSoAnToan.cau[ds[b.i].qid]) || ds[b.i].sao - ds[a.i].sao || nhieu(a.i) - nhieu(b.i) || a.i - b.i)
  for (const vong of [0, 1]) {
    const daDang = new Set<string>(chonThu.map((j) => maDangCua(ds[j])))
    for (const x of xepThu) {
      if (chonThu.length >= soThu) break
      if (chonThu.includes(x.i)) continue
      const ma = maDangCua(ds[x.i])
      if (vong === 0 && daDang.has(ma)) continue
      chonThu.push(x.i)
      daDang.add(ma)
    }
  }

  // Trần 20 % tính trên phần NGOÀI lõi THẬT (phần riêng có thể ít hơn chỗ trống): bớt câu thử thách kém ưu tiên nhất tới khi vừa.
  while (chonThu.length > 0 && chonThu.length > Math.floor(D.TL_THU_THACH_TOI_DA * (chonRieng.length + chonThu.length))) chonThu.pop()

  // ── NHÃN + CHẶNG ──
  const rieng = [...chonRieng].sort((a, b) => a - b)
  const thuThach = [...chonThu].sort((a, b) => a - b)
  const thuSet = new Set(thuThach)
  // Hiếm: bài KHÔNG có gì bắt buộc (mọi câu lõi đều quá cao và không có phần riêng/thử thách) ⇒ giữ như bản cũ: lõi cao vào chặng (cuối chặng, `loi_cao`) để bài không rỗng.
  const loiCao = new Set<number>()
  if (batBuocIdx.length + rieng.length + thuThach.length === 0 && thuSucIdx.length > 0) {
    for (const i of thuSucIdx) loiCao.add(i)
    batBuocIdx = loiIdx
    thuSucIdx = []
  }
  const tatCa = [...batBuocIdx, ...rieng, ...thuThach]
  const tong = tatCa.length
  const soChang = tong === 0 ? 0 : Math.min(soNgay, tong)

  // Câu THƯỜNG (không thử thách, không lõi cao) chia vòng tròn theo độ dễ → mỗi chặng có cùng dải độ khó; chặng nào cũng mở bằng câu dễ nhất của nó.
  const thuong = tatCa.filter((i) => !thuSet.has(i) && !loiCao.has(i))
  thuong.sort((a, b) => ds[a].mucDo - ds[b].mucDo || hangDe(hoSoAnToan.cau[ds[a].qid]) - hangDe(hoSoAnToan.cau[ds[b].qid]) || ds[a].sao - ds[b].sao || a - b)
  const chang: number[][] = Array.from({ length: soChang }, () => [])
  thuong.forEach((i, k) => chang[k % soChang].push(i))
  const loiCaoXep = [...loiCao].sort((a, b) => a - b)
  const choCao: number[][] = Array.from({ length: soChang }, () => [])
  // Chặng NHIỀU câu thường nhất nhận trước (không để chặng chỉ có câu cao); dồn đều.
  const thuTuChang = [...Array(soChang).keys()].sort((a, b) => chang[b].length - chang[a].length || a - b)
  loiCaoXep.forEach((i, k) => choCao[thuTuChang[k % soChang]].push(i))
  // Thử thách: mỗi chặng tối đa một, dồn về các chặng SAU (em đã ấm người).
  const choThu: (number | null)[] = Array.from({ length: soChang }, () => null)
  thuThach.forEach((i, k) => {
    choThu[soChang - 1 - (k % soChang)] = i
  })

  const nhan: Record<string, NhanCau> = {}
  const changQid: string[][] = []
  for (let c = 0; c < soChang; c++) {
    const soKhoiDong = dc.khoiDong ?? D.SO_KHOI_DONG
    const dau = chang[c].slice(0, soKhoiDong)
    const con = chang[c].slice(soKhoiDong)
    // sau khởi động: lõi → dạng yếu → củng cố (giữ thứ tự dễ → khó bên trong từng nhóm)
    const hang = (i: number) => (loiSet.has(i) ? 0 : dangCua[i].yeu || dangCua[i].uuTien ? 1 : 2)
    con.sort((a, b) => hang(a) - hang(b))
    const thanChang = [...dau, ...con, ...choCao[c], ...(choThu[c] !== null ? [choThu[c] as number] : [])]
    for (const i of dau) nhan[ds[i].qid] = 'khoi_dong'
    for (const i of con) nhan[ds[i].qid] = loiSet.has(i) ? 'loi' : dangCua[i].yeu || dangCua[i].uuTien ? 'dang_yeu' : 'cung_co'
    for (const i of choCao[c]) nhan[ds[i].qid] = 'loi_cao'
    if (choThu[c] !== null) nhan[ds[choThu[c] as number].qid] = 'thu_thach'
    changQid.push(thanChang.map((i) => ds[i].qid))
  }
  for (const i of thuSucIdx) nhan[ds[i].qid] = 'loi_cao' // thử sức thêm: nhãn có, nhưng KHÔNG nằm trong chặng

  const dangYeuTrongBai = [...dang.values()].filter((t) => t.yeu).length
  const dangYeuDu = dangCanDu.filter(([ma, t]) => t.yeu && tatCa.filter((j) => maDangCua(ds[j]) === ma).length >= D.DANG_YEU_TOI_THIEU_CAU).length
  const demMuc = (m: Muc) => tatCa.filter((i) => ds[i].mucDo === m).length
  const boXong: BoCuaEm = {
    loi: loiIdx.map((i) => ds[i].qid),
    thuSucThem: thuSucIdx.map((i) => ds[i].qid),
    rieng: rieng.map((i) => ds[i].qid),
    thuThach: thuThach.map((i) => ds[i].qid),
    chang: changQid,
    nhan,
    tomTat: {
      tong,
      soLoi: batBuocIdx.length,
      soRieng: rieng.length,
      soThuThach: thuThach.length,
      soLoiCao: thuSucIdx.length + loiCao.size,
      soThuSucThem: thuSucIdx.length,
      soBatBuoc: tong,
      soBiet: demMuc(0),
      soHieu: demMuc(1),
      soVanDung: demMuc(2),
      soChang,
      soDangYeu: dangYeuTrongBai,
      soDangYeuDuCau: dangYeuDu,
      nganSachCau,
    },
  }
  // KHẮC PHỤC LUÔN (bộ não): vắng/rỗng ⇒ trả đúng `boXong` (không thêm trường); có ⇒ chèn vào chặng đầu (lúc chọn bộ chưa chặng nào mở)
  const kp = chuanKhacPhuc(dieuChinh)
  if (kp.length === 0) return boXong
  const r = apKhacPhucLenBo(boXong, ds, hoSoAnToan, dang, kp, 0)
  return { ...r.bo, khacPhuc: r.ketQua }
}

/**
 * THÍCH NGHI SAU MỖI CHẶNG (bước G, Đợt 2). Máy chủ chấm chặng `chiSoChangVuaXong` (từ 0) rồi gọi hàm này; hàm trả bộ mới CHỈ đổi chặng CHƯA MỞ
 * (từ `max(chiSoChangVuaXong + 1, soChangDaMo)`; em mở sớm chặng sau bằng "Em muốn làm thêm" thì truyền `soChangDaMo`). Truyền lại ĐÚNG `dieuChinh` đã dùng lúc chọn bộ.
 *
 *   · dạng X đúng ≥ 80 % (≥ 2 câu THƯỜNG của dạng ở chặng vừa xong; dạng yếu cần ≥ 3) ⇒ chặng sau ĐỔI 1 câu bậc thấp của dạng sang bậc đích + 1;
 *   · dạng X sai ≥ 50 % (≥ 2 câu) ⇒ chặng sau THÊM 1 câu cùng dạng bậc thấp hơn (hết ngân sách thì nhường chỗ một câu củng cố của dạng khác);
 *   · câu THƯỜNG sai ⇒ `henOnLai` (lịch ôn 1·3·7). Khởi động không vào mẫu dạng (quá dễ), thử thách và lõi cao KHÔNG BAO GIỜ vào mẫu hay lịch ôn ("sai không sao").
 *
 * BẤT BIẾN (test khoá): lõi và thử thách không đổi · chặng đã mở không đổi · câu mới không thuộc lõi, không trùng, không vượt bậc đích + 1 · tổng không vượt ngân sách ·
 * mỗi chặng tối đa 3 thay đổi THEO MẪU. Câu mới chọn theo thứ tự đề (tất định).
 *
 * KHẮC PHỤC LUÔN (`tuyChon.dieuChinh.khacPhuc`): sau khi thích nghi theo mẫu, chèn câu cùng dạng CHƯA giao vào chặng chưa mở đầu tiên và bớt câu củng cố dễ nhất của dạng khác (tổng không tăng, chặng đã mở/lõi/thử thách
 * nguyên; các chèn nằm ở `doi` với `loai: 'khac_phuc'`, tối đa 2 dạng × 4 câu; kết quả + lý do thiếu ở `khacPhuc`). Mỗi lần gọi bảo đảm THÊM tối đa `soCau` câu — điều chỉnh tự hết hạn sau 3 ngày nên không lặp mãi.
 * Gọi với `chiSoChangVuaXong = -1` để áp khắc phục lên bộ đang chạy khi chưa chặng nào xong (chặng đích = `max(0, soChangDaMo)`). Không có mẫu hay không còn chặng chưa mở thì phần theo mẫu không đổi, khắc phục vẫn áp nếu còn chặng.
 */
export function thichNghiChangSau(
  bo: BoCuaEm,
  cau: CauGiao[],
  hoSo: HoSoEmRut,
  chiSoChangVuaXong: number,
  ketQua: KetQuaChang,
  tuyChon: { soChangDaMo?: number; dieuChinh?: DieuChinhEm } = {},
): KetQuaThichNghi {
  const r = thichNghiTheoMau(bo, cau, hoSo, chiSoChangVuaXong, ketQua, tuyChon)
  const kp = chuanKhacPhuc(tuyChon.dieuChinh)
  if (kp.length === 0) return r // vắng khắc phục ⇒ Y HỆT bản trước (không thêm trường)
  // KHẮC PHỤC LUÔN: áp lên bộ SAU khi đã thích nghi theo mẫu, vào chặng CHƯA MỞ đầu tiên. `chiSoChangVuaXong = -1` = áp lên bộ đang chạy khi chưa chặng nào xong.
  if (!Number.isInteger(chiSoChangVuaXong)) return r
  const ds = duyNhat(cau)
  const hs: HoSoEmRut = { dang: hoSo?.dang ?? {}, cau: hoSo?.cau ?? {} }
  const dang = tinhDang(ds, hs)
  apNutDang(dang, chuanDieuChinh(tuyChon.dieuChinh).nut)
  const chiSoDich = Math.max(chiSoChangVuaXong + 1, Math.floor(tuyChon.soChangDaMo ?? 0))
  const k = apKhacPhucLenBo(r.bo, ds, hs, dang, kp, chiSoDich)
  return { bo: k.bo, henOnLai: r.henOnLai, doi: [...r.doi, ...k.doi], khacPhuc: k.ketQua }
}

function thichNghiTheoMau(
  bo: BoCuaEm,
  cau: CauGiao[],
  hoSo: HoSoEmRut,
  chiSoChangVuaXong: number,
  ketQua: KetQuaChang,
  tuyChon: { soChangDaMo?: number; dieuChinh?: DieuChinhEm } = {},
): KetQuaThichNghi {
  const ds = duyNhat(cau)
  const theoQid = new Map(ds.map((c, i) => [c.qid, { c, i }]))
  const hs: HoSoEmRut = { dang: hoSo?.dang ?? {}, cau: hoSo?.cau ?? {} }
  const dang = tinhDang(ds, hs)
  apNutDang(dang, chuanDieuChinh(tuyChon.dieuChinh).nut)
  const dungMap = ketQua?.dung ?? {}
  const changXong = Number.isInteger(chiSoChangVuaXong) ? bo.chang[chiSoChangVuaXong] ?? [] : []

  const henOnLai = changXong.filter((q) => dungMap[q] === false && (['khoi_dong', 'loi', 'dang_yeu', 'cung_co'] as NhanCau[]).includes(bo.nhan[q]))
  const mau = new Map<string, { n: number; dung: number }>()
  for (const q of changXong) {
    const x = theoQid.get(q)
    if (!x || typeof dungMap[q] !== 'boolean' || !(['loi', 'dang_yeu', 'cung_co'] as NhanCau[]).includes(bo.nhan[q])) continue
    const ma = maDangCua(x.c)
    const m = mau.get(ma) ?? { n: 0, dung: 0 }
    m.n++
    if (dungMap[q]) m.dung++
    mau.set(ma, m)
  }

  const chiSoDich = Math.max(chiSoChangVuaXong + 1, Math.floor(tuyChon.soChangDaMo ?? 0))
  if (mau.size === 0 || chiSoDich >= bo.chang.length) return { bo, henOnLai, doi: [] }

  const chang = bo.chang.map((c) => [...c])
  const rieng = [...bo.rieng]
  const nhan: Record<string, NhanCau> = { ...bo.nhan }
  const loiSet = new Set(bo.loi)
  const thuSucSet = new Set(bo.thuSucThem ?? []) // bộ chốt trước bản 1.2 không có trường này ⇒ rỗng
  const daCo = new Set<string>([...bo.loi, ...bo.rieng, ...bo.thuThach])
  const doi: DoiThichNghi[] = []
  const dich = chang[chiSoDich]
  const chiSoChen = () => {
    let k = 0
    while (k < dich.length && (nhan[dich[k]] === 'khoi_dong' || nhan[dich[k]] === 'loi' || nhan[dich[k]] === 'dang_yeu')) k++
    return k
  }
  const ungVien = (ma: string, loc: (m: Muc) => boolean, uuTien: (dq: CauCuaEm | undefined) => number) =>
    ds
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => maDangCua(c) === ma && !daCo.has(c.qid) && loc(c.mucDo))
      .sort((a, b) => uuTien(hs.cau[a.c.qid]) - uuTien(hs.cau[b.c.qid]) || b.c.sao - a.c.sao || a.i - b.i)

  for (const ma of [...mau.keys()].sort()) {
    if (doi.length >= D.DOI_TOI_DA_MOI_CHANG) break
    const t = dang.get(ma)
    const m = mau.get(ma)!
    if (!t || t.nghi) continue
    if (m.n < (t.yeu ? D.MAU_TOI_THIEU_DANG_YEU : D.MAU_TOI_THIEU_THICH_NGHI)) continue

    if (m.dung / m.n >= D.TL_DUNG_LEN_BAC && t.bacDich < 2) {
      // LÊN BẬC: đổi 1 câu bậc thấp (củng cố / dạng yếu) của dạng ở chặng chưa mở lấy 1 câu đúng bậc đích + 1
      const muc = (t.bacDich + 1) as Muc
      const ra = [...dich].reverse().find((q) => {
        const x = theoQid.get(q)
        return !!x && !loiSet.has(q) && (nhan[q] === 'cung_co' || nhan[q] === 'dang_yeu') && maDangCua(x.c) === ma && x.c.mucDo < muc
      })
      if (ra === undefined) continue
      // câu chưa từng làm trước, rồi câu từng sai, sau cùng câu em đã đúng
      const vao = ungVien(ma, (mm) => mm === muc, (dq) => (!dq ? 0 : dq.trangThai === 'da_khac_phuc' || dq.trangThai === 'chua_thay_sai' ? 2 : 1))[0]
      if (!vao) continue
      const vt = dich.indexOf(ra)
      dich[vt] = vao.c.qid
      rieng.splice(rieng.indexOf(ra), 1, vao.c.qid)
      nhan[vao.c.qid] = nhan[ra]
      delete nhan[ra]
      daCo.delete(ra)
      daCo.add(vao.c.qid)
      doi.push({ ma, loai: 'len_bac', chang: chiSoDich, vao: vao.c.qid, ra })
    } else if ((m.n - m.dung) / m.n >= D.TL_SAI_HA_THAP) {
      // HẠ NHẸ: thêm 1 câu cùng dạng bậc thấp hơn (đúng bậc thấp hơn nếu có, không thì gần nhất)
      const muc = Math.max(0, t.bacDich - 1) as Muc
      const vao = ungVien(ma, (mm) => mm <= muc, (dq) => (!dq ? 0 : dq.trangThai === 'da_khac_phuc' || dq.trangThai === 'chua_thay_sai' ? 1 : 2)).sort((a, b) => b.c.mucDo - a.c.mucDo)[0]
      if (!vao) continue
      let ra: string | null = null
      if (daCo.size - thuSucSet.size >= bo.tomTat.nganSachCau) { // "thử sức thêm" không tính vào ngân sách
        // hết ngân sách: nhường chỗ một câu CỦNG CỐ của dạng khác (không lõi, không thử thách)
        ra = [...dich].reverse().find((q) => {
          const x = theoQid.get(q)
          return !!x && !loiSet.has(q) && nhan[q] === 'cung_co' && maDangCua(x.c) !== ma
        }) ?? null
        if (ra === null) continue
        dich.splice(dich.indexOf(ra), 1)
        rieng.splice(rieng.indexOf(ra), 1)
        delete nhan[ra]
        daCo.delete(ra)
      }
      dich.splice(chiSoChen(), 0, vao.c.qid)
      rieng.push(vao.c.qid)
      nhan[vao.c.qid] = 'dang_yeu'
      daCo.add(vao.c.qid)
      doi.push({ ma, loai: 'them_cau_de', chang: chiSoDich, vao: vao.c.qid, ra })
    }
  }
  if (doi.length === 0) return { bo, henOnLai, doi }

  const rienDoDe = [...rieng].sort((a, b) => (theoQid.get(a)?.i ?? 0) - (theoQid.get(b)?.i ?? 0))
  const tatCa = [...bo.loi.filter((q) => !thuSucSet.has(q)), ...rienDoDe, ...bo.thuThach] // câu BẮT BUỘC (không gồm thử sức thêm)
  const demMuc = (mm: Muc) => tatCa.filter((q) => theoQid.get(q)?.c.mucDo === mm).length
  const dangYeuDu = [...dang.entries()].filter(([ma, t]) => t.yeu && tatCa.filter((q) => { const x = theoQid.get(q); return !!x && maDangCua(x.c) === ma }).length >= D.DANG_YEU_TOI_THIEU_CAU).length
  return {
    bo: {
      ...bo,
      rieng: rienDoDe,
      chang,
      nhan,
      tomTat: { ...bo.tomTat, tong: tatCa.length, soBatBuoc: tatCa.length, soRieng: rienDoDe.length, soBiet: demMuc(0), soHieu: demMuc(1), soVanDung: demMuc(2), soDangYeuDuCau: dangYeuDu },
    },
    henOnLai,
    doi,
  }
}

/** Bậc HIỆU LỰC của một dạng: chưa đủ tin (< 4 câu đã gặp) ⇒ Biết. */
function bacHieuLuc(d: DangCuaEm): Muc {
  return d.soGap >= D.SO_CAU_DU_TIN_DANG ? d.bac : 0
}

/** THẺ TIẾN BỘ: so hồ sơ em TRƯỚC và SAU (cùng một em). Chỉ số đếm; dạng theo mã cho tất định. */
export function theTienBo(truoc: HoSoEmRut, sau: HoSoEmRut): TienBo {
  const dangT = truoc?.dang ?? {}
  const dangS = sau?.dang ?? {}
  const cauT = truoc?.cau ?? {}
  const cauS = sau?.cau ?? {}
  const dangLenBac: TienBo['dangLenBac'] = []
  let soDangMoi = 0
  for (const ma of Object.keys(dangS).sort()) {
    const t = dangT[ma]
    if (!t) {
      soDangMoi++
      continue
    }
    const tu = bacHieuLuc(t)
    const den = bacHieuLuc(dangS[ma])
    if (den > tu) dangLenBac.push({ ma, tu, den })
  }
  let soCauDungLai = 0
  let soCauMoiGap = 0
  for (const q of Object.keys(cauS)) {
    const t = cauT[q]
    if (!t) soCauMoiGap++
    else if (cauS[q].trangThai === 'da_khac_phuc' && (t.trangThai === 'moi_sai' || t.trangThai === 'dang_on')) soCauDungLai++
  }
  return { dangLenBac, soCauDungLai, soCauMoiGap, soDangMoi, coTienBo: dangLenBac.length > 0 || soCauDungLai > 0 || soCauMoiGap > 0 || soDangMoi > 0 }
}
