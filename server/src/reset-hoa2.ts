// RESET LẦN 2 — "GAME HÓA 2.0" (thầy ra lệnh 27/09/2026): "reset lại toàn bộ về 0, chọn lại thần thú. Giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh,
// xoá toàn bộ các ca thi cũ." + "Bỏ hẳn BTVN", "bỏ app phụ huynh". Thầy chốt thêm 27/09: "xoá cả vàng và phụ kiện luôn nhé vì cho chọn lại thần thú từ đầu
// chơi cho công bằng".
//
// DÙNG LẠI TOÀN BỘ MÁY MÓC của `reset-toan-app.ts` (cờ lên đạn/huỷ, khoá một lần, cửa sổ 60 phút, ≤ 40 truy vấn/lượt, chạy thử, nạp `ma_da_dung`, chốt
// `exp_moi.tu` + mùa game mới) qua cấu hình `RESET_HOA2`, với KHOÁ RIÊNG (`reset_hoa2`, `reset_hoa2_cho_phep`, `reset_hoa2_huy`) và DANH SÁCH RIÊNG:
//   · XOÁ = mọi bảng XOÁ của lần 21/09 (BTVN, bài Mẹ giao, luyện đề, kế hoạch ngày, lên bảng, trao đổi, game + thú + EXP + khiên + Đoàn + CNH ví, vinh danh,
//     tin phụ huynh) + 13 bảng CA THI + `srs2_ke_hoach`, `ruong_bat_linh` (2.0) + `vang_so`, `phu_kien_so_huu`, `phu_kien_dang_mac` (thầy chốt 27/09).
//   · GIỮ = tài khoản, lớp, kho đề, cấu hình, SỔ + HỒ SƠ của từng em, `chien_dich`, `srs2_day_lai`, bảng vận hành; và `dong_bo` (DẤU "D1 đủ dữ liệu ca"
//     — xoá nó là app thầy quay về đọc ca cũ từ Google Sheet, xem docs/reset-hoa2-2709.md).
//   · NẠP `ma_da_dung` loại 'ca' (MỌI mã ca) + 'btvn' + 'mom' TRƯỚC khi xoá: máy thầy còn bộ nhớ đệm/hàng đợi đẩy ca cũ, các nơi chặn "mã ca đã dùng mà không
//     còn trong ca" (publish, capNhatKeyBank, noiKhoCa, /ca/nhieu) từ chối đẩy lại.
//   · HOÃN khi có ca thi MỞ (`ca.trang_thai = 'mo'`, trừ ca đo tải `DOTAI`): kiểm trước khi giành khoá và lần nữa ngay trước khi xoá; lên đạn mà còn hoãn thì
//     KHÔNG đóng băng (em đang thi vẫn nộp được). Đóng băng chỉ khi job đã giành khoá (`KHOA_JOB_HOA2.dongBangTuLenDan = false`).
//   · Em phải CHỌN LẠI thần thú: `game_v2_profile` + `than_thu` bị xoá và mùa game mới được đặt ⇒ hồ sơ game tạo lại có `choice: true` (như 21/09).
// KHÔNG tự chạy trên D1 thật: chỉ khi Boss/thầy đặt cờ `cau_hinh.reset_hoa2_cho_phep = true` (xem docs/reset-hoa2-2709.md).
import type { Env } from './kieu'
import {
  BANG_XOA, CUA_SO_MS, HAN_DEM_MS, KHOA_JOB_HOA2, chayResetTheo, docTrangThaiChung, resetDryRunTheo,
  type CauHinhReset, type KetQuaChayReset, type KetQuaDryRun, type LyDoHoan, type TrangThaiReset,
} from './reset-toan-app'

export const MA_RESET_HOA2 = KHOA_JOB_HOA2.maReset
export const KHOA_HUY_HOA2 = KHOA_JOB_HOA2.khoaHuy
export const KHOA_CHO_PHEP_HOA2 = KHOA_JOB_HOA2.khoaChoPhep
/** Ca đo tải (`do-tai.ts`): không phải ca thi thật — không làm HOÃN job (vẫn bị xoá cùng bảng `ca`; "Mở sẵn ca đo" tự dựng lại khi cần). */
export const CA_KHONG_TINH_HOAN = 'DOTAI'

/**
 * 13 BẢNG CA THI XOÁ (đã soát từng bảng trong schema/migration — mọi bảng đều khoá theo `ma_ca` hoặc là dữ liệu của một lượt thi):
 * `ca`, `luot`, `chi_tiet_cau` (điểm từng câu), `ban_do_sai`, `phong_cho`, `chan_vao`, `trang_thai` (em đang làm bài), `phieu` (sổ tra phiếu; nội dung ở R2 giữ nguyên),
 * `kho_ca_them`, `nhan_xet` (điểm/xếp loại ghi lúc chấm một lượt), `de_rieng`, `nop_khac_phuc` (nộp phiếu khắc phục của ca), `tien_do_ca`.
 * `ca` ĐỨNG CUỐI: xoá dở giữa chừng thì ca vẫn còn để kiểm "ca đang mở" và nạp mã lại được.
 * KHÔNG có `dong_bo`: đó là DẤU đồng bộ `ca_day_du` (app thầy chỉ đọc danh sách ca từ D1 khi có dấu này) — GIỮ.
 */
export const BANG_CA_THI_HOA2: readonly string[] = [
  'luot', 'bai_bo_sung', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'chan_vao', 'trang_thai', 'phieu', 'kho_ca_them', 'nhan_xet', 'de_rieng', 'nop_khac_phuc', 'tien_do_ca', 'nhan_xet_ca_em', 'ca',
]

/** XOÁ — theo lệnh thầy 27/09. Thứ tự = thứ tự xoá. */
export const BANG_XOA_HOA2: readonly string[] = [
  // Mọi bảng XOÁ của lần 21/09 (BTVN, bài giao, luyện đề, kế hoạch ngày, lên bảng, giữ chỗ, trao đổi, game + thú + EXP + khiên, Đoàn, CNH ví, vinh danh, tin PH)
  ...BANG_XOA,
  // GAME HÓA 2.0 (migration-2709-game-hoa-2.sql): kế hoạch ngày ĐÃ CHỐT (chỉ là đệm, lập lại từ sổ) và rương đã mở — trạng thái chơi, về 0.
  'srs2_ke_hoach', 'ruong_bat_linh',
  // CỬA HÀNG PHỤ KIỆN (migration-2109-shop-phu-kien.sql): thầy chốt 27/09 "xoá cả vàng và phụ kiện luôn nhé vì cho chọn lại thần thú từ đầu chơi cho công bằng".
  'vang_so', 'phu_kien_so_huu', 'phu_kien_dang_mac',
  // BI-A PHẢN ỨNG (migration-2809-bi-a.sql): ván, ghế, lời mời, có mặt, Điểm bàn — trạng thái chơi, về 0 như game. Câu đã trả lời nằm ở sổ `su_kien_hoc` (GIỮ).
  'bi_a_ghe', 'bi_a_van', 'bi_a_moi', 'bi_a_co_mat', 'bi_a_diem_ban',
  // MỌI CA THI cũ (thầy 27/09: "xoá toàn bộ các ca thi cũ"). `ca` cuối cùng.
  ...BANG_CA_THI_HOA2,
]

/** GIỮ — không bao giờ vào SQL xoá. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng vài dòng ở bước chốt (mùa game, `exp_moi`, xoá khoá P08). */
export const BANG_GIU_HOA2: readonly string[] = [
  // Tài khoản, lớp, phụ huynh (tài khoản giữ để khôi phục được dù bỏ app PH), kho đề, chỉ mục game, cấu hình, cài đặt em, đăng ký đẩy, thống kê dùng app, mã đã dùng.
  'hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope',
  'study_preferences', 'student_push', 'app_presence', 'ma_da_dung', 'khien_truoc_reset_2109', 'ph_truy_cap',
  // SỔ + HỒ SƠ của từng em (thầy 27/09: "giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh"). `su_kien_hoc` là NGUỒN: hồ sơ dựng lại từ sổ.
  'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'tien_do_hs', 'qid_da_lam', 'skill_snapshot', 'nang_luc_cursor', 'learner_scope', 'quyen_hoc_sinh', 'cau_snapshot',
  // DẤU ĐỒNG BỘ ca (`dong_bo.ca_day_du`): app thầy CHỈ đọc danh sách ca từ D1 khi có dấu này; xoá ⇒ app quay về Google Sheet và CA CŨ HIỆN LẠI. Không phải dữ liệu ca.
  'dong_bo',
  // GAME HÓA 2.0 do thầy chủ động tạo: chiến dịch luyện, mốc "Chữa xong" của buổi chữa.
  'chien_dich', 'srs2_day_lai',
  // Nhãn "Thầy đã chữa" của Kiểm tra đầu giờ (dau-gio.ts, 29/09) — đi cùng mốc dạy lại.
  'thay_da_chua',
  // Lời giải từng bước (loi-giai.ts, 29/09): hồ sơ thầy duyệt + chỉ mục câu + hàng soạn — học liệu ⇒ GIỮ.
  'loi_giai', 'loi_giai_cau', 'loi_giai_viec',
  // Em đọc lời giải thế nào (migration-0210-doc-loi-giai.sql, GĐ1 v2 02/10) — hồ sơ học tập của em ⇒ GIỮ (như sổ su_kien_hoc).
  'doc_loi_giai',
  // Vòng học v2 (migration-0210-v2.sql): học liệu bổ trợ (học liệu ⇒ GIỮ), thẻ nút thắt + lời thầy gỡ + câu kiểm em làm (hồ sơ học tập ⇒ GIỮ).
  'cau_bo_tro', 'nut_that', 'loi_go', 'cau_kiem_lam',
  // Bàn gỡ nút thắt (ban-go-nut-that.ts, 02/10): em đã đọc lời thầy gỡ nào — hồ sơ học tập ⇒ GIỮ.
  'loi_go_doc',
  // TU LUYỆN (migration-2909-tu-luyen.sql, 29/09): lượt em tự luyện — hồ sơ học tập của em, độc lập với game ⇒ GIỮ (như sổ su_kien_hoc).
  'tu_luyen_luot', 'tu_luyen_cau',
  // TU LUYỆN v3 (migration-3009-tu-luyen-khac-phuc.sql, 30/09): ôn cách quãng + câu đã chấm từng câu — cùng hồ sơ Tu luyện ⇒ GIỮ.
  'tu_luyen_khac_phuc', 'tu_luyen_cham_cau',
  // Bảng vận hành đã GIỮ lần 21/09: bộ não A.I, bảng lưu em đã gỡ, nhật ký máy, thử thách riêng (kết quả ở sổ).
  'ai_ho_so_ngay', 'ai_dieu_chinh', 'ai_ban_tin', 'hoc_sinh_da_go', 'danh_sach_da_go', 'nhat_ky_may', 'thu_thach_rieng',
]

/** Có ca thi đang mở (`trang_thai = 'mo'`, trừ ca đo tải)? MỘT truy vấn. Không đọc được bảng `ca` ⇒ HOÃN cho chắc (không chắc là không có ca mở). */
export async function kiemCaDangMo(env: Env): Promise<LyDoHoan | null> {
  try {
    const r = await env.DB.prepare("SELECT ma_ca, COALESCE(loai, 'thi') AS loai FROM ca WHERE trang_thai = 'mo' AND ma_ca <> ? ORDER BY ma_ca LIMIT 50").bind(CA_KHONG_TINH_HOAN).all<{ ma_ca: string; loai: string }>()
    const ds = (r.results ?? []).map((x) => String(x.ma_ca))
    if (ds.length === 0) return null
    const baiTap = (r.results ?? []).filter((x) => x.loai === 'baitap').length
    return { lyDo: `Đang có ${ds.length} ca mở${baiTap ? ` (${baiTap} ca loại bài tập)` : ''}: ${ds.join(', ')} — đóng hết ca rồi job tự chạy ở phút sau (trong 60 phút kể từ lúc lên đạn)`, caDangMo: ds }
  } catch (e) {
    return { lyDo: `Không đọc được bảng ca (${e instanceof Error ? e.message.slice(0, 120) : 'lỗi'}) — hoãn cho chắc`, caDangMo: [] }
  }
}

/** Cấu hình job reset LẦN 2. */
export const RESET_HOA2: CauHinhReset = {
  ...KHOA_JOB_HOA2,
  ten: 'reset-hoa2',
  bangXoa: BANG_XOA_HOA2,
  bangGiu: BANG_GIU_HOA2,
  loaiMaNap: ['ca', 'btvn', 'mom'],
  // Chờ mọi isolate hết đệm cổng đóng băng (30 giây) + 5 giây dư: sau đó không máy nào còn nhận lệnh mở ca/nộp bài mà chưa thấy đóng băng.
  choBangMs: HAN_DEM_MS + 5_000,
  kiemHoan: kiemCaDangMo,
}

/** CHẠY THỬ (chỉ đếm, không ghi gì, ≤ 40 truy vấn) — kèm `hoan`: job có bị hoãn vì ca đang mở không. */
export async function resetHoa2DryRun(env: Env): Promise<KetQuaDryRun> {
  return resetDryRunTheo(RESET_HOA2, env)
}

/** Một lượt job (cron). Không ném lỗi. */
export async function chayResetHoa2(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  try {
    return await chayResetTheo(RESET_HOA2, env, nowMs)
  } catch (e) {
    console.error('[reset-hoa2] lỗi ngoài dự kiến:', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi', soTruyVan: 0 }
  }
}

/**
 * Cho `scheduled` (mỗi phút), gọi SAU job 21/09: trả `true` khi job đang làm (các việc cron khác NGHỈ lượt này, như 21/09); `hoan`/không lên đạn/đã xong ⇒ `false`
 * (cron chạy việc thường lệ). Chưa lên đạn / đã xong: đúng MỘT truy vấn. Ghi log khi chạy, lỗi, hoãn, quá giờ.
 */
export async function cronResetHoa2(env: Env, nowMs: number): Promise<boolean> {
  const r = await chayResetHoa2(env, nowMs)
  if (r.chay || r.lyDo === 'loi' || r.lyDo === 'qua_gio' || r.lyDo === 'hoan') {
    console.log('[reset-hoa2] cron', JSON.stringify({ chay: r.chay, lyDo: r.lyDo, trangThai: r.trangThai?.trangThai, buoc: r.trangThai?.buoc, soTruyVan: r.soTruyVan, loi: r.trangThai?.loi, hoan: r.hoan?.lyDo }))
  }
  return r.chay || r.lyDo === 'dang_chay' || r.lyDo === 'cho_tiep'
}

export interface TrangThaiResetHoa2 {
  ok: true
  choPhep: boolean
  huy: boolean
  lenDanLuc: string | null
  hanTuChay: string | null
  /** Khoá trạng thái của job (null = chưa bắt đầu). */
  khoa: TrangThaiReset | null
  /** Nếu cron chạy lúc này job có HOÃN không (ca nào đang mở). */
  hoan: LyDoHoan | null
  /** Một câu cho người đọc: đang ở đâu, cần làm gì. */
  tomTat: string
  soTruyVan: number
}

/** TRẠNG THÁI (chỉ đọc, 2 truy vấn): cờ, hạn, khoá, ca đang mở. */
export async function trangThaiResetHoa2(env: Env, nowMs: number): Promise<TrangThaiResetHoa2> {
  const c = await docTrangThaiChung(env, KHOA_JOB_HOA2)
  const hoan = await kiemCaDangMo(env)
  const han = c.lenDanMs === null ? null : c.lenDanMs + CUA_SO_MS
  const k = c.khoa
  const tomTat = k?.trangThai === 'xong' ? `Đã xong lúc ${k.xongLuc} (mốc ${k.mocReset}); không bao giờ chạy lại`
    : c.huy ? 'Cờ HUỶ đang bật: job không chạy'
    : !c.choPhep ? 'Chưa lên đạn (cờ reset_hoa2_cho_phep chưa bật): job không chạy, không đóng băng'
    : c.lenDanMs !== null && nowMs < c.lenDanMs ? 'Đã lên đạn, chưa tới giờ'
    : han !== null && nowMs > han ? `Quá 60 phút kể từ lúc lên đạn${k ? ` (khoá: ${k.trangThai}, bước ${k.buoc})` : ''}: không tự chạy nữa — lên đạn lại để làm tiếp`
    : hoan && !(k?.trangThai === 'dang_chay' || k?.trangThai === 'cho_tiep') ? `HOÃN: ${hoan.lyDo}`
    : k ? `Đang chạy: khoá ${k.trangThai}, bước ${k.buoc}${k.loi ? `, lỗi: ${k.loi}` : ''}`
    : 'Đã lên đạn, cron phút tới sẽ bắt đầu'
  return {
    ok: true,
    choPhep: c.choPhep,
    huy: c.huy,
    lenDanLuc: c.lenDanMs === null ? null : new Date(c.lenDanMs).toISOString(),
    hanTuChay: han === null ? null : new Date(han).toISOString(),
    khoa: k,
    hoan,
    tomTat,
    soTruyVan: 2,
  }
}

/** Lệnh TAY của thầy (đã qua cổng mã bí mật ở `index.ts`): `/reset-hoa2/chay-thu` (dryRun), `/reset-hoa2/trang-thai`. Cả hai CHỈ ĐỌC. */
export async function xuLyLenhResetHoa2(env: Env, p: string, nowMs: number): Promise<Record<string, unknown>> {
  if (p === '/reset-hoa2/chay-thu') return { ...(await resetHoa2DryRun(env)) }
  if (p === '/reset-hoa2/trang-thai') return { ...(await trangThaiResetHoa2(env, nowMs)) }
  return { ok: false, error: `Không có lệnh "${p}" (chỉ có /reset-hoa2/chay-thu, /reset-hoa2/trang-thai)` }
}

/** Chuỗi xác nhận BẮT BUỘC của lệnh lên đạn qua API (chống gọi nhầm: lệnh này mở đường XOÁ DỮ LIỆU THẬT). */
export const XAC_NHAN_LEN_DAN_HOA2 = 'XOA-THAT-GAME-HOA-2'

/**
 * Lệnh GHI của thầy (đã qua cổng mã bí mật ở `index.ts`) — thay cho câu `wrangler d1 execute` trong docs/reset-hoa2-2709.md mục 5, để lên đạn/huỷ được
 * từ nơi không có khoá Cloudflare (thầy 27/09: "tự gọi API chạy thử … mọi thứ chính xác 100% thì tự gọi Reset Thật").
 *   · `/reset-hoa2/len-dan` (`xacNhan` = XAC_NHAN_LEN_DAN_HOA2): chạy thử lại NGAY TRONG LỆNH; chỉ ghi cờ `reset_hoa2_cho_phep` khi sẵn sàng, mọi bảng đã
 *     phân loại, KHÔNG có ca mở, chưa xong, không cờ huỷ, đọc được sổ `su_kien_hoc`. Ghi lại khi đã lên đạn = mở cửa sổ 60 phút mới (làm tiếp sau `qua_gio`).
 *   · `/reset-hoa2/huy`: bật cờ huỷ (thắng cờ lên đạn; bước đã xoá không lùi — khôi phục theo tài liệu mục 6).
 * Việc xoá vẫn do cron làm theo lượt (≤ 40 truy vấn), vẫn HOÃN khi có ca mở, vẫn chờ băng 35 giây và kiểm ca lần nữa trước khi xoá.
 */
export async function lenhGhiResetHoa2(env: Env, p: string, b: Record<string, unknown>, nowMs: number): Promise<Record<string, unknown>> {
  const luc = new Date(nowMs).toISOString()
  const ghiCo = (khoa: string) => env.DB.prepare('INSERT OR REPLACE INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)').bind(khoa, 'true', luc).run()
  if (p === '/reset-hoa2/huy') {
    await ghiCo(KHOA_HUY_HOA2)
    return { ok: true, huy: true, luc, tomTat: 'Đã bật cờ HUỶ: job không chạy nữa (bảng đã xoá không tự lùi — khôi phục theo docs/reset-hoa2-2709.md mục 6)' }
  }
  if (p !== '/reset-hoa2/len-dan') return { ok: false, error: `Không có lệnh "${p}"` }
  if (String(b.xacNhan ?? '') !== XAC_NHAN_LEN_DAN_HOA2) return { ok: false, error: `Lệnh này mở đường XOÁ DỮ LIỆU THẬT: gửi kèm "xacNhan": "${XAC_NHAN_LEN_DAN_HOA2}"` }
  const thu = await resetHoa2DryRun(env)
  const chan: string[] = []
  if (thu.daXong) chan.push('job đã XONG — không bao giờ chạy lại')
  if (thu.huy) chan.push('cờ HUỶ đang bật')
  if (!thu.sanSang) chan.push(...thu.lyDo)
  if (thu.chuaPhanLoai.length > 0) chan.push(`còn bảng chưa phân loại XOÁ/GIỮ: ${thu.chuaPhanLoai.join(', ')}`)
  if (thu.hoan) chan.push(`HOÃN: ${thu.hoan.lyDo}`)
  if (thu.giu.find((x) => x.bang === 'su_kien_hoc')?.dong == null) chan.push('không đếm được sổ su_kien_hoc (hồ sơ phải GIỮ)')
  if (chan.length > 0) return { ok: false, error: `Không lên đạn: ${chan.join('; ')}`, chayThu: thu }
  await ghiCo(KHOA_CHO_PHEP_HOA2)
  return {
    ok: true, lenDan: true, lenDanLuc: luc, hanTuChay: new Date(nowMs + CUA_SO_MS).toISOString(),
    tongDongSeXoa: thu.tongDongSeXoa, tongDongGiu: thu.tongDongGiu, maSeGiuLai: thu.maSeGiuLai,
    tomTat: 'Đã lên đạn: cron phút tới giành khoá, chờ băng ~35 giây, kiểm ca mở lần nữa rồi xoá theo lượt — theo dõi /reset-hoa2/trang-thai tới "Đã xong"',
  }
}
