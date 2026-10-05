// RESET TOÀN APP — MỘT LẦN, CHẠY THEO LỆNH (thầy chốt 19/09, ĐỔI 21/09 00:08 "cho chọn lại thú, xoá hết BTVN nhưng GIỮ LẠI toàn bộ hồ sơ mạnh yếu", ĐỔI TIẾP 21/09 ~01:30
// "khi reset giữ lại toàn bộ ca thi đã thi").
//
// XOÁ: BTVN, bài Mẹ giao, luyện đề, kế hoạch ngày, trao đổi, game + thần thú + EXP + mảnh khiên + Đoàn (chọn lại thú), vinh danh, bảng tin phụ huynh.
// GIỮ: tài khoản/mật khẩu, lớp, kho đề, cấu hình, MỌI CA THI đã thi (`ca`, `luot`, `chi_tiet_cau`, `ban_do_sai`, `phong_cho`, `chan_vao`, `trang_thai`, `phieu`, `kho_ca_them`, `nhan_xet`,
// `de_rieng`, `dong_bo`, `nop_khac_phuc`, `tien_do_ca`), VÀ SỔ + HỒ SƠ MẠNH YẾU (`su_kien_hoc`, `nam_kt_cau`, `nam_kt_dang`, `tien_do_hs`, `qid_da_lam`). `su_kien_hoc` là NGUỒN của hồ sơ
// (hồ sơ được dựng lại từ sổ sau mỗi lần nộp): xoá sổ mà giữ hồ sơ thì lần dựng lại đầu tiên xoá sạch hồ sơ của em.
//
// AN TOÀN, theo thứ tự:
//   · Hai danh sách CỐ ĐỊNH `BANG_XOA` / `BANG_GIU`: job CHỈ xoá bảng trong `BANG_XOA` (tên đi vào SQL chỉ từ hằng này, có kiểm định dạng). Bảng nào có trong D1 mà không
//     thuộc danh sách nào (`chuaPhanLoai`) thì KHÔNG bị đụng và được báo cáo; test khoá "mọi bảng của lược đồ phải được phân loại" nên thêm bảng mới là buộc phải quyết.
//   · Bảng trong danh sách mà chưa tồn tại (chưa chạy migration) thì BỎ QUA, không làm chết job. Bảng WITHOUT ROWID xoá bằng `DELETE FROM "t"` (không dùng rowid).
//   · AN TOÀN MẶC ĐỊNH — CỜ LÊN ĐẠN `cau_hinh.reset_toan_app_cho_phep` = true: chỉ khi có cờ, job mới chạy và cổng đóng băng mới bật. Không cờ ⇒ không xoá gì, không đóng băng gì.
//     Lúc lên đạn = `cap_nhat_luc` của dòng cờ. CỜ HUỶ `cau_hinh.reset_toan_app_huy` THẮNG cờ cho phép.
//   · MỘT LẦN: khoá `cau_hinh.reset_toan_app` giành bằng INSERT OR IGNORE (hai lượt cron không chạy đôi). Khoá `xong` thì không bao giờ chạy lại.
//   · CỬA SỔ TỰ CHẠY + ĐÓNG BĂNG = 60 phút kể từ lúc lên đạn (mở sớm ngay khi xong). Quá hạn mà chưa `xong` ⇒ `qua_gio`, KHÔNG tự chạy nữa; chỉ lệnh tay `/reset/chay-tiep` (mã bí mật).
//   · NGÂN SÁCH TRUY VẤN: mỗi lượt gọi Worker ≤ TOI_DA_TRUY_VAN_MOI_LUOT (40, đúng cho cả gói Free 50) truy vấn D1; job CHIA BƯỚC, hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau
//     tiếp tục NGAY. Mọi truy vấn đi qua bộ đếm; test đo độc lập.
//   · CHẠY THỬ: `resetDryRun` chỉ đếm, không ghi gì, ≤ 40 truy vấn.
//   · Sao lưu: trước khi xoá, khoá ghi `batDauLuc` (mốc D1 Time Travel) và `demTruoc` (số dòng từng bảng); tập mã đã dùng nạp vào `ma_da_dung` TRƯỚC khi xoá `ca`.
//     Ngoài job: bản export .sql do Boss ra lệnh và R2 giữ nguyên (docs/reset-2109.md).
//   · EXP sau reset: `exp_moi.tu` = `batDauLuc` nên sổ cũ và lượt thi cũ (`nop_luc` < tu) KHÔNG sinh EXP (câu, lên bậc, điểm ca); câu cũ từng sai nay làm đúng vẫn "lên bậc" (sổ giữ).
//     Ca thi được GIỮ nên luật "ca chưa công bố thì ẩn câu thi" giữ nguyên; luật "ca không còn trong bảng `ca` thì coi là đã công bố" (`exp-d1.ts`, `game-v2-bank.ts`) chỉ còn dùng khi thầy xoá cứng ca.
//   · MÃ ĐÃ DÙNG: chỉ nạp BTVN và bài Mẹ giao (đã xoá nên máy em còn nháp theo mã cũ). KHÔNG nạp mã ca: ca còn nguyên trong bảng `ca`, không có mã ca nào "đã dùng mà biến mất".
//   · KHÔNG đụng: tài khoản/mật khẩu/token (`hoc_sinh`), danh sách lớp, kho đề/câu hỏi, chỉ mục game, cấu hình thầy, cài đặt em, đăng ký push, thống kê dùng app, sổ + hồ sơ mạnh yếu, R2.
//
// TỔNG QUÁT HOÁ (27/09, reset LẦN 2 "Game Hóa 2.0" — `reset-hoa2.ts`): MÁY MÓC ở tệp này (cờ lên đạn/huỷ, khoá một lần, cửa sổ 60 phút, ngân sách 40 truy vấn,
// chạy thử, nạp `ma_da_dung`, chốt `exp_moi.tu` + mùa game) nay nhận CẤU HÌNH `CauHinhReset` (khoá riêng, danh sách XOÁ/GIỮ riêng, loại mã cần nạp, điều kiện HOÃN).
// Lần 21/09 = `RESET_2109`, mọi export cũ giữ NGUYÊN tên, chữ ký và hành vi (test `tests/reset-toan-app-1909.test.ts`). Cổng đóng băng `dangLamMoi` và `docMocReset`
// xét MỌI job trong `CAC_JOB_RESET` bằng MỘT truy vấn (như cũ); job 21/09 đã `xong` nên không bao giờ đóng băng lại.
import type { D1PreparedStatement, Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'

export const MA_RESET = 'reset_toan_app'
export const KHOA_HUY = 'reset_toan_app_huy'
/** CỜ LÊN ĐẠN: không có cờ này = true thì job không chạy và không đóng băng. `cap_nhat_luc` của dòng = lúc lên đạn. */
export const KHOA_CHO_PHEP = 'reset_toan_app_cho_phep'

/** KHOÁ của MỘT job reset trong `cau_hinh` + kiểu đóng băng. Đủ để cổng đóng băng và `mocReset` đọc (không cần danh sách bảng). */
export interface KhoaJobReset {
  /** Khoá trạng thái (JSON `TrangThaiReset`) — giành bằng INSERT OR IGNORE, `xong` thì không bao giờ chạy lại. */
  maReset: string
  /** Cờ HUỶ: thắng cờ lên đạn. */
  khoaHuy: string
  /** Cờ LÊN ĐẠN: `cap_nhat_luc` của dòng = lúc lên đạn. */
  khoaChoPhep: string
  /**
   * true (lần 21/09): ĐÓNG BĂNG GHI ngay từ lúc lên đạn tới khi xong/hết 60 phút.
   * false (lần 2): chỉ đóng băng khi job ĐÃ GIÀNH KHOÁ và đang làm (`dang_chay`/`cho_tiep`) — lên đạn mà job đang HOÃN (có ca thi mở) thì KHÔNG đóng băng,
   * em đang thi không bị chặn nộp bài.
   */
  dongBangTuLenDan: boolean
}

export const KHOA_JOB_2109: KhoaJobReset = { maReset: MA_RESET, khoaHuy: KHOA_HUY, khoaChoPhep: KHOA_CHO_PHEP, dongBangTuLenDan: true }
/** Khoá của reset LẦN 2 (Game Hóa 2.0, 27/09). Cấu hình đầy đủ (danh sách bảng, điều kiện hoãn) ở `reset-hoa2.ts`; khai khoá Ở ĐÂY để cổng đóng băng không phải nạp vòng. */
export const KHOA_JOB_HOA2: KhoaJobReset = { maReset: 'reset_hoa2', khoaHuy: 'reset_hoa2_huy', khoaChoPhep: 'reset_hoa2_cho_phep', dongBangTuLenDan: false }
/** MỌI job reset mà cổng đóng băng (`dangLamMoi`) và `docMocReset` phải xét — MỘT truy vấn đọc gộp. */
export const CAC_JOB_RESET: readonly KhoaJobReset[] = [KHOA_JOB_2109, KHOA_JOB_HOA2]

export type LoaiMa = 'ca' | 'btvn' | 'mom'

/** Lý do HOÃN job (chưa được chạy): ví dụ còn ca thi đang mở. */
export interface LyDoHoan {
  lyDo: string
  /** Mã các ca đang mở (nếu lý do là ca thi mở). */
  caDangMo?: string[]
}

/** CẤU HÌNH một job reset: khoá + danh sách XOÁ/GIỮ + mã cần nạp + điều kiện hoãn. */
export interface CauHinhReset extends KhoaJobReset {
  /** Nhãn trong log (`[reset]`, `[reset-hoa2]`). */
  ten: string
  /** Bảng XOÁ, theo THỨ TỰ xoá. Tên đi vào SQL CHỈ từ danh sách này (có kiểm định dạng). */
  bangXoa: readonly string[]
  /** Bảng GIỮ (không bao giờ vào SQL xoá). */
  bangGiu: readonly string[]
  /** Loại mã nạp vào `ma_da_dung` TRƯỚC khi xoá (máy em/thầy còn nháp, bộ nhớ đệm theo mã cũ). */
  loaiMaNap: readonly LoaiMa[]
  /** > 0: sau khi giành khoá, CHỜ ngần này (để mọi isolate hết bộ nhớ đệm của cổng đóng băng, `HAN_DEM_MS`) rồi kiểm HOÃN lần nữa mới xoá. 0 = xoá ngay (lần 21/09). */
  choBangMs: number
  /** Điều kiện HOÃN (≤ 1 truy vấn): kiểm TRƯỚC khi giành khoá và lần nữa ngay trước khi xoá. null = được chạy. Vắng = không bao giờ hoãn (lần 21/09). */
  kiemHoan?: (env: Env) => Promise<LyDoHoan | null>
}
/** Cửa sổ tự chạy + đóng băng kể từ lúc lên đạn. */
export const CUA_SO_MS = 60 * 60_000
/** Job coi là chết nếu quá ngần này không có nhịp tim (trạng thái `dang_chay`). Trạng thái `cho_tiep` (nhường) được tiếp tục ngay. */
export const QUA_HAN_DANG_CHAY_MS = 3 * 60_000
/** Trần truy vấn D1 mỗi lượt gọi Worker: 40 đúng cho cả gói Free (50). */
export const TOI_DA_TRUY_VAN_MOI_LUOT = 40
const DU_TRU_GHI_KHOA = 1
const CHI_PHI_NAP_MA = 12
const XOA_MOI_LENH = 4000
const COT_MOI_TRUY_VAN_DEM = 60
/** Bộ nhớ đệm đọc cờ/khoá trong isolate (mở băng sớm: không lâu hơn ngần này). */
/** 30 giây (Boss 21/09: truy vấn 3 cờ này 23 nghìn lượt/giờ khi D1 nghẽn; bản cũ 3 giây × nhiều isolate). Hệ quả: lên đạn / huỷ reset có hiệu lực ở cổng đóng băng chậm nhất 30 giây (job reset vẫn đọc TƯƠI). Reset toàn app 21/09 đã chạy xong, không lên đạn lại. */
export const HAN_DEM_MS = 30_000

/** XOÁ — theo lệnh thầy. */
export const BANG_XOA: readonly string[] = [
  // BTVN, bài giao, luyện đề
  'btvn', 'btvn_em', 'btvn_em_lich_su', 'btvn_cau', 'btvn_em_cau', 'mom_bai', 'luyen_de_2026', 'yeu_cau_giao_bai', 'study_drafts',
  // Kế hoạch ngày và lên bảng (SỔ + HỒ SƠ MẠNH YẾU và CA THI được GIỮ, xem BANG_GIU)
  'ke_hoach_ngay', 'len_bang',
  // Buổi học + điểm danh (bảng DẠY HỌC của Lên bảng, 28/09 — buoi-hoc.ts): danh sách có mặt từng buổi, cùng họ với `len_bang`.
  'buoi_hoc', 'buoi_hoc_diem_danh',
  // Kiểm tra đầu giờ (dau-gio.ts, 29/09): lượt hỏi từng buổi + dấu kết thúc — cùng họ với `buoi_hoc`. Kết quả Đạt/Chưa đạt nằm ở sổ `su_kien_hoc` (GIỮ).
  'dau_gio_hoi', 'dau_gio_buoi',
  // GIỮ CHỖ CÂU THEO LƯỢT (migration-2309-cnh1-giu-cho.sql, CNH-1.0 P05 mục 4): trạng thái ĐANG CHẠY của
  // ngày — lượt mới phải giành lại chỗ, nên reset XOÁ (không phải quyền học/không phải bằng chứng).
  'giu_cho',
  // Trao đổi
  'tin_nhan', 'cau_hoi_em', 'student_notice', 'student_push_delivery', 'canh_bao_thay',
  // Game, thần thú, EXP
  'game_v2_profile', 'game_v2_attempt', 'game_v2_reward', 'game_v2_room', 'game_v2_session', 'game_v2_task', 'than_thu', 'vo_dai_phong', 'vo_dai_moi', 'exp_so', 'manh_khien_so', 'khien_mat_so', 'ph_giao_them', 'lop_da_hoc',
  // Đoàn Hộ Tống (bảng của Code 5; mùa 1 tính từ ngày reset). `doan_ve_so` = vé sinh từ sổ EXP (exp_so bị xoá thì vé cũng phải xoá); `doan_trum_lop` = đóng góp trùm lớp; `doan_trum_cau` = sổ kết quả câu chung của trùm theo lớp (bước 6, migration 2109-game-doan-trum-cau; bảng chưa tồn tại thì bỏ qua).
  'doan_chang', 'doan_luot', 'doan_tiep_suc', 'doan_ve_so', 'doan_trum_lop', 'doan_trum_cau',
  // CNH-1.0 CÁ NHÂN HOÁ (Cline 2409, migration-2309-cnh-exp-{ledger,submit,task,p08}.sql): ví, khoản cộng/chi,
  // sổ mảnh, khiên, nhiệm vụ, cổng gác, sổ chuyển đổi. Đây là bản KẾ NHIỆM của `exp_so` + `manh_khien_so` +
  // `khien_mat_so` (ba bảng đều XOÁ ở trên) nên PHẢI XOÁ cùng: reset = MÙA MỚI, mọi ví bắt đầu lại từ 0.
  // `cnh_exp_p08_state`/`cnh_exp_p08_*` (sổ chuyển đổi) XOÁ cùng ví — giữ lại thì chuyển đổi tưởng đã xong
  // trong khi ví đã bị xoá, khoá cứng ở trạng thái nửa vời.
  'cnh_exp_account', 'cnh_exp_grant_ledger', 'cnh_exp_spend_ledger', 'cnh_exp_fragment_ledger', 'cnh_exp_day',
  'cnh_exp_command', 'cnh_exp_task', 'cnh_exp_accepted', 'cnh_exp_attempt_control', 'cnh_exp_guard',
  'cnh_exp_exposure_lock', 'cnh_exp_academic_lock', 'cnh_exp_submit_guard', 'cnh_exp_assistance_guard', 'cnh_exp_assistance_receipt',
  'cnh_exp_p08_state', 'cnh_exp_p08_guard', 'cnh_exp_p08_chuyen_doi', 'cnh_exp_p08_giai_quyet',
  // Vinh danh, tin phụ huynh
  'daily_honors', 'parent_daily_news',
]

/** GIỮ — tài khoản, lớp, kho, cấu hình, cài đặt. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng vài dòng (xem `chayReset`), không bị xoá. */
export const BANG_GIU: readonly string[] = [
  'hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope',
  'study_preferences', 'student_push', 'app_presence', 'ma_da_dung', 'khien_truoc_reset_2109',
  // Đếm truy cập cổng phụ huynh (token PH giai đoạn mềm): số liệu vận hành, không thuộc dữ liệu học của em
  'ph_truy_cap',
  // SỔ + HỒ SƠ MẠNH YẾU của học sinh (thầy chốt 21/09 00:08: giữ lại toàn bộ hồ sơ mạnh yếu đã kiểm tra)
  'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'tien_do_hs', 'qid_da_lam',
  // SNAPSHOT ĐỀ LÚC GIAO (migration-2309-cnh1-cau-snapshot.sql, CNH-1.0 P01/T34): ảnh chụp câu lúc giao
  // để chấm đúng phiên bản em đã làm. Là trạng thái chấm phía máy chủ; xoá đi chỉ làm câu đang mở bị thu hồi.
  'cau_snapshot',
  // PHẠM VI HỌC CÁ NHÂN (migration-2309-cnh1-learner-scope.sql, CNH-1.0 P02): kỹ năng nào đã được DẠY cho em.
  // Là quyền học của em (như hồ sơ mạnh yếu) — reset KHÔNG được xoá, nếu không em mất quyền học đã được thầy mở.
  'learner_scope',
  // QUYỀN DO MÁY CHỦ XÁC NHẬN (migration-2309-cnh1-quyen-hoc-sinh.sql, CNH-1.0 P02 mục 3): thầy cấp quyền
  // luyện đề toàn chương trình… Cũng là quyền học đã được thầy mở ⇒ GIỮ.
  'quyen_hoc_sinh',
  // HỒ SƠ NĂNG LỰC THEO BẰNG CHỨNG (migration-2309-cnh1-su-kien-chuan.sql, CNH-1.0 P03): `skill_snapshot` và
  // `nang_luc_cursor` là BẢN DỰNG LẠI từ sổ `su_kien_hoc` — và sổ ấy đã thuộc BANG_GIU. Xoá chúng chỉ làm mất
  // con trỏ (lần sau dựng lại từ đầu), nên GIỮ cho nhất quán với `nam_kt_cau`/`nam_kt_dang` (cũng là bản dựng lại).
  'skill_snapshot', 'nang_luc_cursor',
  // MỌI CA THI đã thi (thầy chốt 21/09 ~01:30: khi reset giữ lại toàn bộ ca thi đã thi): ca, lượt, điểm từng câu, bản đồ sai, phòng chờ, chặn vào, trạng thái, phiếu, kho ca thêm, nhận xét, đề riêng, đồng bộ Sheet, nộp khắc phục, tiến độ theo ca
  'ca', 'luot', 'bai_bo_sung', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'chan_vao', 'trang_thai', 'phieu', 'kho_ca_them', 'nhan_xet', 'de_rieng', 'dong_bo', 'nop_khac_phuc', 'tien_do_ca',
  // NHẬN XÉT CỦA THẦY theo em + ca (migration-2809-nhan-xet-ca-em.sql): đi cùng ca thi ⇒ GIỮ.
  'nhan_xet_ca_em',
  // BỘ NÃO A.I (Code 1, migration-2109-bo-nao.sql): hồ sơ ngày, nhật ký điều chỉnh, bản tin — chỉ số tổng hợp + nhật ký điều chỉnh, GIỮ (Code 3 quyết 21/09 theo đề nghị của Code 1).
  'ai_ho_so_ngay', 'ai_dieu_chinh', 'ai_ban_tin',
  // BẢNG LƯU khi gỡ em khỏi danh sách (migration-2109-hoc-sinh-da-go.sql): để KHÔI PHỤC được, không bao giờ xoá.
  'hoc_sinh_da_go', 'danh_sach_da_go',
  // NHẬT KÝ LỖI CỦA MÁY (migration-2109-nhat-ky-may.sql, B11): số liệu vận hành, không thuộc dữ liệu học của em.
  'nhat_ky_may',
  // THỬ THÁCH RIÊNG (migration-2109-thu-thach-rieng.sql): câu đã chốt của ngày — số liệu vận hành, kết quả nằm ở sổ `su_kien_hoc` (đã GIỮ).
  'thu_thach_rieng',
  // CỬA HÀNG PHỤ KIỆN (migration-2109-shop-phu-kien.sql): sổ vàng, đồ đã mua, đồ đang mặc — tài sản em đã kiếm bằng việc học, GIỮ (EXP đã trừ khỏi ống nghiệm lúc đổi nên hồ sơ game bị xoá không ảnh hưởng số vàng).
  'vang_so', 'phu_kien_so_huu', 'phu_kien_dang_mac',
  // GAME HÓA 2.0 (migration-2709-game-hoa-2.sql) — bảng SINH SAU lần 21/09. Job 21/09 đã `xong` (không bao giờ chạy lại); xếp GIỮ cho job ấy = KHÔNG đụng,
  // y hệt "chưa phân loại" (chỉ khác là không bị báo). Phân loại THẬT cho lần 2 nằm ở `reset-hoa2.ts` (`srs2_ke_hoach`, `ruong_bat_linh` XOÁ; `chien_dich`, `srs2_day_lai` GIỮ).
  'chien_dich', 'srs2_ke_hoach', 'srs2_day_lai', 'ruong_bat_linh',
  // Nhãn "Thầy đã chữa" (dau-gio.ts, 29/09) — đi cùng mốc dạy lại `srs2_day_lai` ⇒ GIỮ.
  'thay_da_chua',
  // LỜI GIẢI TỪNG BƯỚC (loi-giai.ts, 29/09): hồ sơ lời giải thầy duyệt + chỉ mục câu + hàng soạn — HỌC LIỆU, không phải tiến độ game ⇒ GIỮ.
  'loi_giai', 'loi_giai_cau', 'loi_giai_viec',
  // Em đọc lời giải thế nào (migration-0210-doc-loi-giai.sql, GĐ1 v2 02/10) — hồ sơ học tập của em ⇒ GIỮ (như sổ su_kien_hoc).
  'doc_loi_giai',
  // Vòng học v2 (migration-0210-v2.sql): học liệu bổ trợ (học liệu ⇒ GIỮ), thẻ nút thắt + lời thầy gỡ + câu kiểm em làm (hồ sơ học tập ⇒ GIỮ).
  'cau_bo_tro', 'nut_that', 'loi_go', 'cau_kiem_lam',
  // HỌC PHÍ (hoc-phi.ts, migration-0510-hoc-phi.sql): sổ thu tiền của trung tâm — dữ liệu tài chính thật ⇒ GIỮ.
  'hoc_phi', 'hoc_phi_nop',
  // GĐ5: nhật ký hiệu chỉnh luật + câu nghi sai đáp án (dữ liệu vận hành máy, không phải tiến độ game) ⇒ GIỮ.
  'v2_hieu_chinh', 'cau_nghi_dap_an', 'v2_tham_so_em',
  // Ngân hàng câu kiến thức nền (thang-tu-go.ts, migration-0210-v2.sql) — học liệu ⇒ GIỮ.
  'cau_nen',
  // Bàn gỡ nút thắt (ban-go-nut-that.ts, 02/10): em đã đọc lời thầy gỡ nào — hồ sơ học tập ⇒ GIỮ.
  'loi_go_doc',
  // BI-A PHẢN ỨNG (migration-2809-bi-a.sql) — cũng sinh sau lần 21/09: GIỮ cho job ấy = không đụng. Phân loại thật ở `reset-hoa2.ts` (XOÁ).
  'bi_a_van', 'bi_a_ghe', 'bi_a_diem_ban', 'bi_a_moi', 'bi_a_co_mat',
  // TU LUYỆN (migration-2909-tu-luyen.sql) — sinh sau lần 21/09: GIỮ cho job ấy = không đụng (job đã xong).
  'tu_luyen_luot', 'tu_luyen_cau',
  // TU LUYỆN v3 (migration-3009-tu-luyen-khac-phuc.sql) — cũng sinh sau lần 21/09: GIỮ = không đụng.
  'tu_luyen_khac_phuc', 'tu_luyen_cham_cau',
]

/** Cấu hình của lần reset 21/09 (đã xong): nạp mã BTVN + bài Mẹ giao, KHÔNG nạp mã ca (ca được giữ), không hoãn, xoá ngay khi giành khoá. */
export const RESET_2109: CauHinhReset = {
  ...KHOA_JOB_2109,
  ten: 'reset',
  bangXoa: BANG_XOA,
  bangGiu: BANG_GIU,
  loaiMaNap: ['btvn', 'mom'],
  choBangMs: 0,
}

const TEN_HOP_LE = /^[a-z][a-z0-9_]*$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const json = (v: unknown) => JSON.stringify(v)
const ms = (iso: string): number => Date.parse(iso) || 0

/** `hoan` (chỉ job có `kiemHoan`): đã từng xoá dở rồi gặp ca thi mở ⇒ DỪNG, KHÔNG đóng băng; hết ca mở thì cron tự làm tiếp (trong cửa sổ). */
export type TrangThaiKhoa = 'dang_chay' | 'cho_tiep' | 'xong' | 'qua_gio' | 'hoan'

export interface TrangThaiReset {
  trangThai: TrangThaiKhoa
  /** Bước đang làm: (chờ băng →) nạp mã đã dùng → xoá bảng → chốt. `cho_bang` chỉ có ở job `choBangMs > 0`. */
  buoc: 'cho_bang' | 'nap_ma' | 'xoa' | 'chot'
  /** Mốc bắt đầu chờ băng (ISO) — lần đầu = `batDauLuc`, làm tiếp sau `qua_gio`/`hoan` = lúc làm tiếp. */
  choBangTu?: string
  /** Lần hoãn gần nhất (có ca thi mở) sau khi đã giành khoá. */
  hoan?: LyDoHoan & { luc: string }
  /** Chỉ số (trong BANG_XOA) bảng sẽ xoá tiếp. */
  bangTiep: number
  batDauLuc: string
  /** Lúc lên đạn (`cap_nhat_luc` của dòng cờ) khi job bắt đầu. */
  lenDanLuc?: string
  tiepTucLuc?: string
  soLanChay: number
  demTruoc: Record<string, number | null>
  muaCu?: string | null
  expMoiCu?: string | null
  chuaPhanLoai?: string[]
  maDaDung?: { ca: number; btvn: number; mom: number }
  demSau?: Record<string, number | null>
  xoaConDu?: Record<string, number>
  xongLuc?: string
  /** Ngày VN lúc XONG ("YYYY-MM-DD"): giá trị `mocReset` máy khách nhận. */
  mocReset?: string
  /** Mùa game mới đã đặt (`<ngày VN lúc bắt đầu>-mua-1`). */
  mua?: string
  quaGioLuc?: string
  soEm?: number
  loi?: string
}

/**
 * Bọc D1 để ĐẾM mọi truy vấn của một lượt chạy. Job chỉ dùng prepare().first/all/run (không dùng batch) nên mỗi lời gọi = đúng một truy vấn D1.
 */
function boDemTruyVan(env: Env): { env: Env; dem: () => number } {
  let n = 0
  const goc = env.DB
  const boc = (st: D1PreparedStatement): D1PreparedStatement => ({
    bind: (...v: unknown[]) => boc(st.bind(...v)),
    first: <T>(c?: string) => { n++; return st.first<T>(c) },
    run: <T>() => { n++; return st.run<T>() },
    all: <T>() => { n++; return st.all<T>() },
  })
  const DB = {
    prepare: (q: string) => boc(goc.prepare(q)),
    batch: () => { throw new Error('reset-toan-app không dùng batch') },
  } as unknown as Env['DB']
  return { env: { ...env, DB }, dem: () => n }
}

async function docGiaTri(env: Env, khoa: string): Promise<string | null> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string | null }>()
    return r ? String(r.gia_tri ?? '') : null
  } catch {
    return null
  }
}

function laCoBat(v: string | null | undefined, truong: string): boolean {
  if (v === null || v === undefined) return false
  const t = String(v).trim().toLowerCase()
  if (t === 'true' || t === '1') return true
  try {
    const o = JSON.parse(String(v)) as unknown
    return o === true || (typeof o === 'object' && o !== null && (o as Record<string, unknown>)[truong] === true)
  } catch {
    return false
  }
}

/** `cap_nhat_luc` của cau_hinh có thể là ISO ("…T…Z") hoặc `datetime('now')` của SQLite ("YYYY-MM-DD HH:MM:SS", UTC không có Z): cả hai đều đọc ra mốc UTC. */
export function docMocCauHinh(v: unknown): number | null {
  const t = String(v ?? '').trim()
  if (!t) return null
  const chuan = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(t) ? `${t.replace(' ', 'T')}Z` : t
  const ms2 = Date.parse(chuan)
  return Number.isFinite(ms2) ? ms2 : null
}

export interface TrangThaiChung {
  choPhep: boolean
  huy: boolean
  /** Lúc lên đạn (ms) = `cap_nhat_luc` của dòng cờ cho phép; null nếu không có cờ. */
  lenDanMs: number | null
  khoa: TrangThaiReset | null
}

/** MỘT truy vấn đọc ba dòng (cờ cho phép, cờ huỷ, khoá) của MỖI job trong `ds`. Lỗi/thiếu bảng → coi như KHÔNG lên đạn. Một job ⇒ đúng câu `IN (?, ?, ?)` như cũ. */
async function docTrangThaiNhieu(env: Env, ds: readonly KhoaJobReset[]): Promise<TrangThaiChung[]> {
  const ra: TrangThaiChung[] = ds.map(() => ({ choPhep: false, huy: false, lenDanMs: null, khoa: null }))
  try {
    const khoa = ds.flatMap((j) => [j.khoaChoPhep, j.khoaHuy, j.maReset])
    const r = await env.DB.prepare(`SELECT khoa, gia_tri, cap_nhat_luc FROM cau_hinh WHERE khoa IN (${khoa.map(() => '?').join(', ')})`).bind(...khoa).all<{ khoa: string; gia_tri: string | null; cap_nhat_luc: string | null }>()
    for (const x of r.results ?? []) {
      ds.forEach((j, i) => {
        const o = ra[i]!
        if (x.khoa === j.khoaChoPhep) { o.choPhep = laCoBat(x.gia_tri, 'choPhep'); o.lenDanMs = docMocCauHinh(x.cap_nhat_luc) }
        else if (x.khoa === j.khoaHuy) o.huy = laCoBat(x.gia_tri, 'huy')
        else if (x.khoa === j.maReset && x.gia_tri) {
          try { const v = JSON.parse(x.gia_tri) as TrangThaiReset; if (v && typeof v === 'object') o.khoa = v } catch { /* khoá hỏng: coi như chưa có */ }
        }
      })
    }
  } catch { /* chưa có bảng cau_hinh */ }
  return ra
}

/** MỘT truy vấn đọc cờ cho phép + cờ huỷ + khoá của MỘT job (mặc định lần 21/09). */
export async function docTrangThaiChung(env: Env, j: KhoaJobReset = KHOA_JOB_2109): Promise<TrangThaiChung> {
  return (await docTrangThaiNhieu(env, [j]))[0]!
}

const boNhoChung = new WeakMap<object, { at: number; v: TrangThaiChung[] }>()

/** Bản đọc ĐỆM HAN_DEM_MS trong isolate cho cổng đóng băng và `mocReset` (mỗi request một truy vấn quá tốn): MỌI job của `CAC_JOB_RESET`, cùng thứ tự. */
async function docTrangThaiChungDem(env: Env, nowMs: number): Promise<TrangThaiChung[]> {
  // `env.DB` có thể là đối tượng D1 giả thô trong test (không phải object): chỉ đệm khi làm khoá WeakMap được.
  const dungDem = !!env.DB && (typeof env.DB === 'object' || typeof env.DB === 'function')
  // Khoá theo D1 GỐC (bản session / bộ đếm bọc D1 dùng chung đệm của isolate — như cau-hinh-dem.ts).
  const goc = dungDem ? dbGoc(env.DB as unknown as object) : null
  const c = goc ? boNhoChung.get(goc) : undefined
  if (c && nowMs >= c.at && nowMs - c.at < HAN_DEM_MS) return c.v
  const v = await docTrangThaiNhieu(env, CAC_JOB_RESET)
  if (goc) boNhoChung.set(goc, { at: nowMs, v })
  return v
}

export async function laHuy(env: Env): Promise<boolean> {
  return (await docTrangThaiChung(env)).huy
}
/** Cờ LÊN ĐẠN: chỉ khi `true` job mới chạy và cổng đóng băng mới bật. */
export async function laChoPhep(env: Env): Promise<boolean> {
  return (await docTrangThaiChung(env)).choPhep
}

export async function docTrangThaiReset(env: Env, j: KhoaJobReset = KHOA_JOB_2109): Promise<TrangThaiReset | null> {
  return (await docTrangThaiChung(env, j)).khoa
}

interface ThongTinBang {
  /** Bảng khai `WITHOUT ROWID` (không có `rowid`): xoá bằng `DELETE FROM` thẳng. */
  khongRowid: boolean
}

/** Bảng có thật (đọc `sqlite_master` THẬT, gồm cột `sql` để nhận ra WITHOUT ROWID): MỘT truy vấn. */
async function docBangHienCo(env: Env): Promise<Map<string, ThongTinBang>> {
  const r = await env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<{ name: string; sql: string | null }>()
  return new Map((r.results ?? []).map((x) => [String(x.name), { khongRowid: /WITHOUT\s+ROWID/i.test(String(x.sql ?? '')) }]))
}

/** Số dòng từng bảng đã phân loại (bảng chưa tồn tại → null): GỘP bằng truy vấn scalar (D1 không cho compound SELECT dài), ≤ 60 bảng một truy vấn. */
export async function demCacBang(env: Env, hienCo: ReadonlyMap<string, unknown>, ds: readonly string[] = [...BANG_XOA, ...BANG_GIU]): Promise<Record<string, number | null>> {
  const ra: Record<string, number | null> = {}
  const co: string[] = []
  for (const t of new Set(ds)) {
    if (hienCo.has(t) && TEN_HOP_LE.test(t)) co.push(t)
    else ra[t] = null
  }
  for (let i = 0; i < co.length; i += COT_MOI_TRUY_VAN_DEM) {
    const nhom = co.slice(i, i + COT_MOI_TRUY_VAN_DEM)
    try {
      const r = await env.DB.prepare('SELECT ' + nhom.map((t) => `(SELECT COUNT(*) FROM "${t}") AS "${t}"`).join(', ')).first<Record<string, number>>()
      for (const t of nhom) ra[t] = Number(r?.[t]) || 0
    } catch {
      for (const t of nhom) ra[t] = null
    }
  }
  return ra
}

// --- Tập mã đã dùng ---------------------------------------------------------------------------------

/**
 * Tập mã đã dùng nạp lúc reset, theo `loai` của cấu hình. Lần 21/09: BTVN và bài Mẹ giao (đã xoá) — KHÔNG có mã ca (mọi ca thi được GIỮ), trường `ca` rỗng.
 * Lần 2 (Game Hóa 2.0): THÊM mã ca (bảng `ca` bị xoá) ⇒ các nơi chặn "mã ca đã dùng mà không còn trong ca" (publish, capNhatKeyBank, noiKhoCa, /ca/nhieu) chặn máy thầy đẩy lại ca cũ.
 */
async function docMaDaDung(env: Env, hienCo: ReadonlyMap<string, unknown>, loai: readonly LoaiMa[] = RESET_2109.loaiMaNap): Promise<{ ca: string[]; btvn: string[]; mom: string[] }> {
  const ca: string[] = []
  if (loai.includes('ca') && hienCo.has('ca')) {
    const r = await env.DB.prepare("SELECT DISTINCT ma_ca AS ma FROM ca WHERE ma_ca IS NOT NULL AND ma_ca <> ''").all<{ ma: string }>()
    for (const x of r.results ?? []) ca.push(String(x.ma))
  }
  const btvn: string[] = []
  if (loai.includes('btvn') && hienCo.has('btvn')) {
    const r = await env.DB.prepare("SELECT DISTINCT ma_btvn AS ma FROM btvn WHERE ma_btvn IS NOT NULL AND ma_btvn <> ''").all<{ ma: string }>()
    for (const x of r.results ?? []) btvn.push(String(x.ma))
  }
  const mom: string[] = []
  if (loai.includes('mom') && hienCo.has('mom_bai')) {
    const r = await env.DB.prepare("SELECT DISTINCT id AS ma FROM mom_bai WHERE id IS NOT NULL AND id <> ''").all<{ ma: string }>()
    for (const x of r.results ?? []) if (!UUID.test(String(x.ma))) mom.push(String(x.ma)) // id UUID không bao giờ trùng nên khỏi giữ
  }
  return { ca: ca.sort(), btvn: btvn.sort(), mom: mom.sort() }
}

const CHEN_MA = `INSERT OR IGNORE INTO ma_da_dung (loai, ma, xoa_luc)
  SELECT ?, value, ? FROM json_each(?)`

async function napMaDaDung(env: Env, ma: { ca: string[]; btvn: string[]; mom: string[] }, luc: string): Promise<void> {
  for (const [loai, ds] of [['ca', ma.ca], ['btvn', ma.btvn], ['mom', ma.mom]] as const) {
    for (let i = 0; i < ds.length; i += 1000) await env.DB.prepare(CHEN_MA).bind(loai, luc, json(ds.slice(i, i + 1000))).run()
  }
}

/** Mã này ĐÃ TỪNG DÙNG (nằm trong tập nạp lúc reset)? Chưa có bảng → false (đường cũ chạy như trước). */
export async function maDaDung(env: Env, loai: 'ca' | 'btvn' | 'mom', ma: string): Promise<boolean> {
  if (!ma) return false
  try {
    return !!(await env.DB.prepare('SELECT 1 AS x FROM ma_da_dung WHERE loai = ? AND ma = ?').bind(loai, ma).first())
  } catch {
    return false
  }
}

/** Trong `dsMa`, những mã ĐÃ TỪNG DÙNG (một truy vấn). Chưa có bảng → tập rỗng. */
export async function maDaDungTrong(env: Env, loai: 'ca' | 'btvn' | 'mom', dsMa: string[]): Promise<Set<string>> {
  const xin = [...new Set(dsMa.filter(Boolean))]
  if (xin.length === 0) return new Set()
  try {
    const r = await env.DB.prepare('SELECT ma FROM ma_da_dung WHERE loai = ? AND ma IN (SELECT value FROM json_each(?))').bind(loai, json(xin)).all<{ ma: string }>()
    return new Set((r.results ?? []).map((x) => String(x.ma)))
  } catch {
    return new Set()
  }
}

// --- Chạy thử -----------------------------------------------------------------------------------------

export interface KetQuaDryRun {
  ok: true
  dryRun: true
  /** Lúc lên đạn (ISO) nếu có cờ; null nếu chưa lên đạn. */
  lenDanLuc: string | null
  /** Hạn tự chạy + đóng băng (ISO) = lên đạn + 60 phút; null nếu chưa lên đạn. */
  hanTuChay: string | null
  /** Job sẵn sàng về KỸ THUẬT (đủ bảng/migration)? false thì `lyDo` nói thiếu gì — biết NGAY ở dryRun, đừng đợi tới 00:01. */
  sanSang: boolean
  lyDo: string[]
  /** Cờ lên đạn đã bật? Không bật thì job KHÔNG chạy và KHÔNG đóng băng. */
  choPhep: boolean
  huy: boolean
  daXong: boolean
  trangThaiKhoa: TrangThaiReset | null
  xoa: { bang: string; dong: number | null }[]
  giu: { bang: string; dong: number | null }[]
  khongCoBang: string[]
  chuaPhanLoai: string[]
  tongDongSeXoa: number
  tongDongGiu: number
  maSeGiuLai: { ca: number; btvn: number; mom: number }
  /** Chỉ job có điều kiện hoãn (lần 2): lý do job SẼ HOÃN nếu chạy lúc này (ví dụ ca thi đang mở), null = không hoãn. Vắng ở lần 21/09. */
  hoan?: LyDoHoan | null
  /** Số truy vấn D1 dryRun đã dùng (phải ≤ TOI_DA_TRUY_VAN_MOI_LUOT). */
  soTruyVan: number
}

/** CHẠY THỬ: chỉ ĐẾM, không ghi gì, ≤ 40 truy vấn. Cho biết job sẽ xoá bảng nào, bao nhiêu dòng, giữ bảng nào, bảng nào chưa phân loại, và job đã sẵn sàng chưa. */
export async function resetDryRun(envGoc: Env): Promise<KetQuaDryRun> {
  return resetDryRunTheo(RESET_2109, envGoc)
}

/** CHẠY THỬ theo cấu hình `ch` (xem `resetDryRun`). */
export async function resetDryRunTheo(ch: CauHinhReset, envGoc: Env): Promise<KetQuaDryRun> {
  const { env, dem } = boDemTruyVan(envGoc)
  const hienCo = await docBangHienCo(env)
  const demBang = await demCacBang(env, hienCo, [...ch.bangXoa, ...ch.bangGiu])
  const phanLoai = new Set([...ch.bangXoa, ...ch.bangGiu])
  const ma = await docMaDaDung(env, hienCo, ch.loaiMaNap)
  const chung = await docTrangThaiChung(env, ch)
  const hoan = ch.kiemHoan ? await ch.kiemHoan(env) : undefined
  const khoa = chung.khoa
  const lyDo: string[] = []
  if (!hienCo.has('ma_da_dung')) lyDo.push('Chưa chạy migration-1909-ma-da-dung.sql (bảng ma_da_dung): job sẽ DỪNG, không xoá gì')
  if (!hienCo.has('cau_hinh')) lyDo.push('Thiếu bảng cau_hinh (khoá, cờ)')
  const xoa = ch.bangXoa.map((bang) => ({ bang, dong: demBang[bang] ?? null }))
  const giu = ch.bangGiu.map((bang) => ({ bang, dong: demBang[bang] ?? null }))
  const ra: KetQuaDryRun = {
    ok: true,
    dryRun: true,
    lenDanLuc: chung.lenDanMs === null ? null : new Date(chung.lenDanMs).toISOString(),
    hanTuChay: chung.lenDanMs === null ? null : new Date(chung.lenDanMs + CUA_SO_MS).toISOString(),
    sanSang: lyDo.length === 0,
    lyDo,
    choPhep: chung.choPhep,
    huy: chung.huy,
    daXong: khoa?.trangThai === 'xong',
    trangThaiKhoa: khoa,
    xoa,
    giu,
    khongCoBang: [...phanLoai].filter((t) => !hienCo.has(t)).sort(),
    chuaPhanLoai: [...hienCo.keys()].filter((t) => !phanLoai.has(t)).sort(),
    tongDongSeXoa: xoa.reduce((t, x) => t + (x.dong ?? 0), 0),
    tongDongGiu: giu.reduce((t, x) => t + (x.dong ?? 0), 0),
    maSeGiuLai: { ca: ma.ca.length, btvn: ma.btvn.length, mom: ma.mom.length },
    soTruyVan: 0,
  }
  if (hoan !== undefined) ra.hoan = hoan
  ra.soTruyVan = dem()
  return ra
}

// --- Chạy thật ------------------------------------------------------------------------------------------

/** Xoá MỘT lô của một bảng (một truy vấn). Bảng WITHOUT ROWID: xoá thẳng cả bảng. */
async function xoaMotLo(env: Env, ch: CauHinhReset, ten: string, khongRowid: boolean): Promise<number> {
  // Phòng thủ hai lớp: tên phải nằm trong danh sách XOÁ (của CHÍNH job này) và đúng định dạng — không bao giờ ghép tên từ nguồn khác vào SQL.
  if (!ch.bangXoa.includes(ten) || !TEN_HOP_LE.test(ten)) throw new Error(`Bảng "${ten}" không nằm trong danh sách XOÁ`)
  const sql = khongRowid ? `DELETE FROM "${ten}"` : `DELETE FROM "${ten}" WHERE rowid IN (SELECT rowid FROM "${ten}" LIMIT ${XOA_MOI_LENH})`
  const r = await env.DB.prepare(sql).run()
  return Number(r.meta?.changes) || 0
}

async function ghiKhoa(env: Env, ch: KhoaJobReset, st: TrangThaiReset): Promise<void> {
  await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ?').bind(json(st), new Date().toISOString(), ch.maReset).run()
}

export interface KetQuaChayReset {
  chay: boolean
  /** `hoan` (chỉ job có điều kiện hoãn): có ca thi mở ⇒ KHÔNG làm gì, không đóng băng; cron phút sau kiểm lại. */
  lyDo?: 'huy' | 'khong_cho_phep' | 'chua_toi_gio' | 'da_xong' | 'dang_chay' | 'cho_tiep' | 'qua_gio' | 'loi' | 'hoan'
  trangThai?: TrangThaiReset
  /** Khi `lyDo === 'hoan'`: vì sao (ca nào đang mở). */
  hoan?: LyDoHoan
  /** Số truy vấn D1 lượt này đã dùng (≤ TOI_DA_TRUY_VAN_MOI_LUOT). */
  soTruyVan: number
}

export interface TuyChonChayReset {
  /** Lệnh TAY của thầy (`/reset/chay-tiep`): bỏ qua hạn 01:00; vẫn phải có cờ cho phép và không có cờ huỷ. */
  tay?: boolean
}

/** Mở băng và bật `mocReset` NGAY trong isolate này (isolate khác trễ tối đa HAN_DEM_MS). */
function boNhoLai(envGoc: Env): void {
  if (envGoc.DB && (typeof envGoc.DB === 'object' || typeof envGoc.DB === 'function')) boNhoChung.delete(envGoc.DB)
}

/**
 * CHẠY JOB (cron), CHIA BƯỚC. Mỗi lượt gọi dùng ≤ TOI_DA_TRUY_VAN_MOI_LUOT truy vấn D1; hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau tiếp tục NGAY.
 * Chỉ chạy khi: có cờ cho phép, không huỷ, đã tới mốc, còn trong hạn 01:00 (trừ lệnh tay), chưa xong, và giành/nhận được khoá. Không ném lỗi ra ngoài.
 */
export async function chayReset(envGoc: Env, nowMs: number, tuyChon: TuyChonChayReset = {}): Promise<KetQuaChayReset> {
  return chayResetTheo(RESET_2109, envGoc, nowMs, tuyChon)
}

/**
 * CHẠY JOB theo cấu hình `ch` (xem `chayReset`). Thêm so với lần 21/09, CHỈ khi cấu hình có:
 *   · `kiemHoan`: job CHƯA giành khoá, hoặc đang dừng (`qua_gio`/`hoan`), mà có ca thi mở ⇒ trả `hoan`, KHÔNG ghi gì (không đóng băng).
 *   · `choBangMs > 0`: giành khoá xong thì bước `cho_bang` CHỜ cho mọi isolate hết đệm cổng đóng băng (không còn máy nào nhận lệnh mở ca), rồi kiểm hoãn LẦN NỮA
 *     ngay trước khi xoá. Có ca mở lọt qua khe đệm ⇒ chưa xoá gì thì TRẢ KHOÁ (về "đã lên đạn, chưa bắt đầu"); đã xoá dở thì ghi `hoan` (mở băng).
 */
export async function chayResetTheo(ch: CauHinhReset, envGoc: Env, nowMs: number, tuyChon: TuyChonChayReset = {}): Promise<KetQuaChayReset> {
  const { env, dem } = boDemTruyVan(envGoc)
  const kq = (r: Omit<KetQuaChayReset, 'soTruyVan'>): KetQuaChayReset => ({ ...r, soTruyVan: dem() })
  const tay = tuyChon.tay === true
  const chung = await docTrangThaiChung(env, ch) // MỘT truy vấn đọc cờ cho phép + cờ huỷ + khoá (bỏ qua bộ nhớ đệm)
  if (chung.huy) return kq({ chay: false, lyDo: 'huy' })
  if (!chung.choPhep || chung.lenDanMs === null) return kq({ chay: false, lyDo: 'khong_cho_phep' })
  const cu = chung.khoa
  if (cu?.trangThai === 'xong') return kq({ chay: false, lyDo: 'da_xong', trangThai: cu })
  if (nowMs < chung.lenDanMs) return kq({ chay: false, lyDo: 'chua_toi_gio' })
  const hanMs = chung.lenDanMs + CUA_SO_MS
  if (!tay && nowMs > hanMs) {
    // Quá 60 phút kể từ lúc lên đạn mà chưa xong: KHÔNG tự chạy nữa (chạy muộn là xoá bài các em vừa làm). Ghi `qua_gio` một lần, mở băng.
    if (cu && cu.trangThai !== 'qua_gio') {
      const st: TrangThaiReset = { ...cu, trangThai: 'qua_gio', quaGioLuc: new Date(nowMs).toISOString() }
      await ghiKhoa(env, ch, st)
      boNhoLai(envGoc)
      return kq({ chay: false, lyDo: 'qua_gio', trangThai: st })
    }
    return kq({ chay: false, lyDo: 'qua_gio', trangThai: cu ?? undefined })
  }
  // HOÃN: job chưa bắt đầu hoặc đang dừng (không đóng băng) mà có ca thi mở ⇒ không ghi gì. Job đang giữ khoá (`dang_chay`/`cho_tiep`) thì cổng đã đóng băng, không cần kiểm.
  const dangGiuKhoa = cu?.trangThai === 'dang_chay' || cu?.trangThai === 'cho_tiep'
  if (ch.kiemHoan && !dangGiuKhoa) {
    const h = await ch.kiemHoan(env)
    if (h) return kq({ chay: false, lyDo: 'hoan', hoan: h, trangThai: cu ?? undefined })
  }

  const hienCo = await docBangHienCo(env)
  const tatCa = [...ch.bangXoa, ...ch.bangGiu]
  let st: TrangThaiReset
  if (!cu) {
    // Giành khoá: chỉ MỘT lượt chạy nhận được `changes = 1`.
    const demTruoc = await demCacBang(env, hienCo, tatCa)
    const muaCu = hienCo.has('game_v2_settings') ? await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key = 'season'").first<{ json: string }>().then((r) => r?.json ?? null).catch(() => null) : null
    const expMoiCu = await docGiaTri(env, 'exp_moi')
    const luc = new Date(nowMs).toISOString()
    st = { trangThai: 'dang_chay', buoc: 'nap_ma', bangTiep: 0, batDauLuc: luc, lenDanLuc: new Date(chung.lenDanMs).toISOString(), tiepTucLuc: luc, soLanChay: 1, demTruoc, muaCu, expMoiCu }
    if (ch.choBangMs > 0) { st.buoc = 'cho_bang'; st.choBangTu = luc }
    const g = await env.DB.prepare('INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)').bind(ch.maReset, json(st), luc).run()
    if (!g.meta?.changes) return kq({ chay: false, lyDo: 'dang_chay' })
  } else {
    // `cho_tiep` (đã nhường) và `qua_gio` (lệnh tay) tiếp tục NGAY; `dang_chay` chỉ khi nhịp tim đã cũ (chết). Giành bằng CAS trên đúng chuỗi cũ.
    const nhip = ms(cu.tiepTucLuc ?? cu.batDauLuc)
    if (cu.trangThai === 'dang_chay' && nowMs - nhip < QUA_HAN_DANG_CHAY_MS) return kq({ chay: false, lyDo: 'dang_chay', trangThai: cu })
    const giaTriCu = await docGiaTri(env, ch.maReset)
    st = { ...cu, trangThai: 'dang_chay', tiepTucLuc: new Date(nowMs).toISOString(), soLanChay: (cu.soLanChay || 1) + 1, loi: undefined }
    // Làm tiếp sau khi đã DỪNG (không đóng băng) ⇒ lại chờ băng + kiểm hoãn trước khi xoá tiếp (bước nạp mã/xoá lặp lại được).
    if (ch.choBangMs > 0 && (cu.trangThai === 'qua_gio' || cu.trangThai === 'hoan')) { st.buoc = 'cho_bang'; st.choBangTu = st.tiepTucLuc }
    const g = await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ? AND gia_tri = ?').bind(json(st), st.tiepTucLuc, ch.maReset, giaTriCu).run()
    if (!g.meta?.changes) return kq({ chay: false, lyDo: 'dang_chay' })
  }

  const conNganSach = (chiPhi: number) => dem() + chiPhi + DU_TRU_GHI_KHOA <= TOI_DA_TRUY_VAN_MOI_LUOT
  const nhuong = async (): Promise<KetQuaChayReset> => {
    st.trangThai = 'cho_tiep'
    st.tiepTucLuc = new Date(nowMs).toISOString()
    await ghiKhoa(env, ch, st)
    return kq({ chay: true, lyDo: 'cho_tiep', trangThai: st })
  }
  // Chốt: mùa game + exp_moi + khoá P08 + đọc bảng + đếm lại (mỗi 60 bảng một truy vấn). Lần 21/09 (≤ 120 bảng) = 6 như cũ.
  const chiPhiChot = 4 + Math.ceil(new Set(tatCa).size / COT_MOI_TRUY_VAN_DEM)
  try {
    const phanLoai = new Set(tatCa)
    st.chuaPhanLoai = [...hienCo.keys()].filter((t) => !phanLoai.has(t)).sort()
    for (;;) {
      if (st.buoc === 'cho_bang') {
        if (nowMs - ms(st.choBangTu ?? st.batDauLuc) < ch.choBangMs) return await nhuong()
        const h = ch.kiemHoan ? await ch.kiemHoan(env) : null
        if (h) {
          if (!st.maDaDung) {
            // Chưa nạp mã, chưa xoá gì: TRẢ KHOÁ — job về trạng thái "đã lên đạn, chưa bắt đầu", cổng mở băng, cron kiểm lại mỗi phút.
            await env.DB.prepare('DELETE FROM cau_hinh WHERE khoa = ?').bind(ch.maReset).run()
            boNhoLai(envGoc)
            return kq({ chay: false, lyDo: 'hoan', hoan: h })
          }
          // Đã xoá dở (làm tiếp sau qua_gio/hoan): DỪNG ở `hoan`, mở băng; hết ca mở thì cron làm tiếp (trong cửa sổ).
          st.trangThai = 'hoan'
          st.hoan = { ...h, luc: new Date(nowMs).toISOString() }
          await ghiKhoa(env, ch, st)
          boNhoLai(envGoc)
          return kq({ chay: false, lyDo: 'hoan', hoan: h, trangThai: st })
        }
        st.buoc = 'nap_ma'
        continue
      }
      if (st.buoc === 'nap_ma') {
        // Nạp tập MÃ ĐÃ DÙNG trước khi xoá `btvn`/`mom_bai` (lần 2: cả `ca`) — lặp lại được: INSERT OR IGNORE. Chưa có bảng `ma_da_dung` thì DỪNG — không xoá khi chưa giữ được mã.
        if (!hienCo.has('ma_da_dung')) throw new Error('Chưa chạy migration-1909-ma-da-dung.sql — DỪNG, chưa xoá gì')
        if (!conNganSach(CHI_PHI_NAP_MA)) return await nhuong()
        const ma = await docMaDaDung(env, hienCo, ch.loaiMaNap)
        await napMaDaDung(env, ma, st.batDauLuc)
        // Làm tiếp sau khi đã xoá dở thì bảng nguồn đã vơi: giữ số LỚN hơn (lần nạp đầu).
        const cuMa = st.maDaDung
        st.maDaDung = { ca: Math.max(ma.ca.length, cuMa?.ca ?? 0), btvn: Math.max(ma.btvn.length, cuMa?.btvn ?? 0), mom: Math.max(ma.mom.length, cuMa?.mom ?? 0) }
        st.buoc = 'xoa'
        st.bangTiep = 0
        continue
      }
      if (st.buoc === 'xoa') {
        while (st.bangTiep < ch.bangXoa.length && !hienCo.has(ch.bangXoa[st.bangTiep]!)) st.bangTiep++
        if (st.bangTiep >= ch.bangXoa.length) { st.buoc = 'chot'; continue }
        if (!conNganSach(1)) return await nhuong()
        const ten = ch.bangXoa[st.bangTiep]!
        const khongRowid = hienCo.get(ten)!.khongRowid
        const n = await xoaMotLo(env, ch, ten, khongRowid)
        if (khongRowid || n < XOA_MOI_LENH) st.bangTiep++ // lô cuối (ít hơn một lô) = bảng đã sạch
        continue
      }
      // Chốt: mùa game mới + EXP mới cho MỌI em từ đúng mốc (bỏ cờ riêng dsSbd/tuDsSbd), đếm lại, ghi `xong`.
      if (!conNganSach(chiPhiChot)) return await nhuong()
      const ngayVn = new Date(ms(st.batDauLuc) + 7 * 3_600_000).toISOString().slice(0, 10)
      st.mua = `${ngayVn}-mua-1`
      if (hienCo.has('game_v2_settings')) {
        await env.DB.prepare("INSERT INTO game_v2_settings (key, json) VALUES ('season', ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json").bind(json({ id: st.mua, startedAt: st.batDauLuc })).run()
      }
      // EXP mới cho MỌI em từ đúng lúc bắt đầu (bỏ cờ riêng dsSbd/tuDsSbd): sổ cũ nằm TRƯỚC `tu` nên không sinh EXP; câu cũ từng sai nay làm đúng vẫn lên bậc.
      await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
        .bind('exp_moi', json({ tu: st.batDauLuc, toanBo: true }), new Date(nowMs).toISOString()).run()
      // CNH-1.0 P08 (Cline 2409): reset XOÁ `cnh_exp_account` + MỌI bảng `cnh_exp_p08_*` (xem BANG_XOA) ⇒ **trạng thái
      // lắp đặt P08 PHẢI bị xoá theo**. Giữ `p08_setup = 'xong'` trong khi ví đã mất ⇒ job không chạy lại ⇒ mọi lệnh P08
      // ném `NOT_FOUND`. Xoá cả ba khoá (`KHOA_TRANG_THAI`/`KHOA_CHO_PHEP`/`KHOA_HUY` của `cnh-exp-p08-setup.ts`) để đợt
      // lắp đặt sau chạy lại từ đầu. KHÔNG tự bật lại cờ kích hoạt `cnh_exp_kich_hoat` — đó là quyết định riêng.
      await env.DB.prepare('DELETE FROM cau_hinh WHERE khoa IN (?, ?, ?)')
        .bind('p08_setup', 'p08_setup_cho_phep', 'p08_setup_huy').run()
      st.demSau = await demCacBang(env, await docBangHienCo(env), tatCa)
      const conDu: Record<string, number> = {}
      for (const t of ch.bangXoa) if ((st.demSau[t] ?? 0) > 0) conDu[t] = st.demSau[t] as number
      if (Object.keys(conDu).length) st.xoaConDu = conDu // bảng XOÁ còn dòng do em/thầy ghi trong lúc chạy; báo, không coi là lỗi
      st.soEm = st.demTruoc.hoc_sinh ?? 0
      st.xongLuc = new Date(nowMs).toISOString()
      st.mocReset = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10) // ngày VN lúc XONG
      st.trangThai = 'xong'
      await ghiKhoa(env, ch, st)
      boNhoLai(envGoc)
      return kq({ chay: true, trangThai: st })
    }
  } catch (e) {
    st.loi = e instanceof Error ? e.message : String(e)
    console.error(`[${ch.ten}] LỖI (lần cron sau sẽ tiếp tục):`, st.loi)
    try { await ghiKhoa(env, ch, st) } catch { /* khoá không ghi được thì thôi */ }
    return kq({ chay: false, lyDo: 'loi', trangThai: st })
  }
}

/** Cho cron (mỗi phút): MỘT truy vấn đọc cờ khi chưa lên đạn / đã xong, rồi bỏ qua. Không ném lỗi. */
export async function chayResetNeuDenGio(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  try {
    return await chayReset(env, nowMs)
  } catch (e) {
    console.error('[reset] lỗi ngoài dự kiến:', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi', soTruyVan: 0 }
  }
}

/** Lệnh TAY của thầy (`/reset/chay-tiep`): làm MỘT lượt (≤ 40 truy vấn), bỏ qua hạn 01:00. Gọi lặp tới khi `trangThai.trangThai === 'xong'`. */
export async function chayTiepTay(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  try {
    return await chayReset(env, nowMs, { tay: true })
  } catch (e) {
    return { chay: false, lyDo: 'loi', soTruyVan: 0, trangThai: undefined }
  }
}

// --- Đóng băng và mốc cho máy khách ---------------------------------------------------------------------------

/**
 * Đang ĐÓNG BĂNG GHI? Khi CÓ cờ lên đạn, KHÔNG huỷ, đã tới lúc lên đạn, trong 60 phút kể từ lúc lên đạn, và job CHƯA `xong` (xong sớm thì mở ngay; đang xoá dở thì KHÔNG mở
 * giữa chừng). Không có cờ ⇒ không bao giờ đóng băng. Một truy vấn đọc gộp (MỌI job của `CAC_JOB_RESET`) có bộ nhớ đệm HAN_DEM_MS trong isolate. Lỗi đọc → không đóng băng.
 */
export async function dangLamMoi(env: Env, nowMs: number): Promise<boolean> {
  try {
    const ds = await docTrangThaiChungDem(env, nowMs)
    return CAC_JOB_RESET.some((j, i) => dongBangJob(j, ds[i], nowMs))
  } catch {
    return false
  }
}

/** Một job có đang đóng băng ghi không (xem `dangLamMoi`, `KhoaJobReset.dongBangTuLenDan`). */
function dongBangJob(j: KhoaJobReset, c: TrangThaiChung | undefined, nowMs: number): boolean {
  if (!c || !c.choPhep || c.huy || c.lenDanMs === null) return false
  if (nowMs < c.lenDanMs || nowMs > c.lenDanMs + CUA_SO_MS) return false
  // Lần 21/09: `qua_gio` chỉ được ghi SAU khi cửa sổ đã hết; lên đạn LẠI (cờ mới) mở cửa sổ mới và cron tiếp tục job, nên trong cửa sổ mới vẫn phải đóng băng. Chỉ `xong` mới mở.
  if (j.dongBangTuLenDan) return c.khoa?.trangThai !== 'xong'
  // Lần 2: chỉ khi job ĐANG GIỮ KHOÁ (đã qua kiểm "không có ca thi mở"). Đã lên đạn mà còn hoãn/dừng (`hoan`, `qua_gio`) thì KHÔNG đóng băng.
  return c.khoa?.trangThai === 'dang_chay' || c.khoa?.trangThai === 'cho_tiep'
}

export const LOI_DANG_LAM_MOI = { ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true } as const

/**
 * `mocReset` cho máy khách: ngày VN lúc job XONG ("YYYY-MM-DD") CHỈ SAU KHI job đã `xong`; trước đó là null (VẮNG trường). Gửi sớm là máy khách dọn nháp bài của học sinh.
 * Dùng chung bản đọc đệm với cổng đóng băng (một truy vấn mỗi 3 giây mỗi isolate).
 */
export async function docMocReset(env: Env, nowMs: number = Date.now()): Promise<string | null> {
  try {
    // Nhiều job đã xong (21/09 rồi lần 2): mốc của job XONG MUỘN NHẤT — máy khách thấy mốc KHÁC mốc đã lưu thì dọn lại một lần nữa.
    let moi: TrangThaiReset | null = null
    for (const c of await docTrangThaiChungDem(env, nowMs)) {
      const st = c.khoa
      if (st?.trangThai === 'xong' && st.xongLuc && st.mocReset && (!moi || ms(st.xongLuc) >= ms(moi.xongLuc ?? ''))) moi = st
    }
    return moi?.mocReset ?? null
  } catch {
    return null
  }
}

// --- Đo giới hạn truy vấn D1 mỗi lượt gọi (chẩn đoán, chỉ đọc) -------------------------------------------------

/** Chạy `SELECT 1` liên tiếp trong MỘT lượt gọi cho tới khi D1/Worker từ chối (hoặc tới `toiDa`): cho biết giới hạn thật của gói đang dùng (Free 50 / Paid 1000). */
export async function doGioiHanTruyVan(env: Env, toiDa = 1100): Promise<{ ok: true; soTruyVanThanhCong: number; biTuChoi: boolean; loi: string | null }> {
  let n = 0
  try {
    for (; n < toiDa; n++) await env.DB.prepare('SELECT 1 AS x').first()
    return { ok: true, soTruyVanThanhCong: n, biTuChoi: false, loi: null }
  } catch (e) {
    return { ok: true, soTruyVanThanhCong: n, biTuChoi: true, loi: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) }
  }
}
