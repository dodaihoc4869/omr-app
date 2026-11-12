// CHỈ MỤC TẠO LÚC CHẠY (tối ưu máy chủ 28/09, việc 3) — bản sao của server/migration-2809-chi-muc.sql.
// Chạy MỘT lần mỗi isolate (cờ trong bộ nhớ theo đối tượng D1), qua `ctx.waitUntil` ⇒ không làm chậm phản hồi.
// Lỗi (bảng chưa có ở D1 mới…) chỉ ghi log; KHÔNG thử lại trong cùng isolate (tránh dội D1 mỗi lượt).
// Chỉ thêm chỉ mục cho bảng NHỎ (≤ vài chục nghìn dòng). Bảng lớn (> vài trăm nghìn dòng) chỉ đưa vào migration để Boss chạy tay.
import type { Env } from './kieu'

export const CHI_MUC_LUC_CHAY: readonly string[] = [
  'CREATE INDEX IF NOT EXISTS game_v2_attempt_session ON game_v2_attempt(session, sbd)',
]

const daChay = new WeakMap<object, Promise<void>>()

export function damBaoChiMuc(env: Env): Promise<void> {
  const db = env.DB as unknown as object | undefined
  if (!db) return Promise.resolve()
  let p = daChay.get(db)
  if (!p) {
    p = env.DB.batch(CHI_MUC_LUC_CHAY.map((s) => env.DB.prepare(s)))
      .then(() => undefined, (e: unknown) => { console.error('[chi-muc] không tạo được (bỏ qua):', e instanceof Error ? e.message : e) })
    daChay.set(db, p)
  }
  return p
}

/**
 * CHỈ MỤC CHỈ-THÊM dựng trong cron NGÀY 17:01 UTC (00:01 VN, ngoài cao điểm) — thay cho chạy migration tay (Boss 29/09: CI không chạy migration,
 * không có quyền D1 remote). `IF NOT EXISTS` ⇒ lần đầu dựng, các đêm sau là lệnh rỗng. Bản sao của server/migration-2909-chi-muc-cao-diem.sql.
 * KHÔNG gọi trên đường lệnh của em (dựng chỉ mục bảng luot giữ khoá ghi).
 */
export const CHI_MUC_CRON_DEM: readonly string[] = [
  'CREATE INDEX IF NOT EXISTS idx_luot_ca_tt ON luot(ma_ca, trang_thai, het_gio_luc)',
  // Quét tối ưu 30/09 (bản sao server/migration-3009-chi-muc-quet-cuoi.sql; EXPLAIN trước = "SCAN <bảng>"):
  //  · EXP hôm nay (`docExpHomNay`, mỗi lần em mở app qua /hs/ke-hoach-ngay) lọc game_v2_reward theo sbd + ngày — bảng ≈ một dòng mỗi câu game.
  'CREATE INDEX IF NOT EXISTS idx_game_v2_reward_sbd ON game_v2_reward(sbd, created_at)',
  //  · Sảnh Bi-a hỏi 6 s/lần: lời mời em ĐÃ GỬI (tu_sbd) — chỉ mục cũ chỉ theo người nhận.
  'CREATE INDEX IF NOT EXISTS bi_a_moi_tu ON bi_a_moi(tu_sbd, tao_luc)',
  //  · Vào bàn bằng mã / cấp mã bàn mới: bàn đang chờ trong hạn vé.
  'CREATE INDEX IF NOT EXISTS bi_a_van_cho ON bi_a_van(trang_thai, tao_luc)',
  // 27/10 (thầy «tức thì mọi khung giờ»; Analytics D1 27/10 19–23h, EXPLAIN bản thật): sổ học theo em + mốc giờ (`sbd = ? AND luc >= ?`, 4,9 % thời gian D1 khung
  // học, ~2.250 dòng đọc mỗi lần) đang đi chỉ mục (sbd, received_at) ⇒ quét hết sổ của em. Bảng ~300 nghìn dòng: dựng ở cron 00:01 VN, ngoài giờ học.
  'CREATE INDEX IF NOT EXISTS idx_skh_em_luc ON su_kien_hoc(sbd, luc)',
  //  · Lượt xem lời giải theo em + mốc giờ (`loi_giai_hoi WHERE sbd=? AND … AND luc>=?`, 24 nghìn lần khung học): chỉ mục cũ (sbd, qid, luc) ⇒ quét mọi câu.
  'CREATE INDEX IF NOT EXISTS idx_lg_hoi_em_luc ON loi_giai_hoi(sbd, luc)',
  // 28/10 (nghiệm thu: câu DẤU của Sảnh đếm cả sổ của em mỗi lượt): dấu nay chỉ đọc DÒNG CUỐI theo (sbd, mốc giờ). Đã chạy --remote 28/10 (chỉ-thêm);
  // bản sao server/migration-2810-chi-muc-dau-san-sang.sql. Chỉ mục cùng loại của goi_bai_7_gap (bảng tạo lúc chạy) ở SQL_GOI7 (goi-bai-7-schema.ts).
  'CREATE INDEX IF NOT EXISTS idx_cld_em_cap_nhat ON chua_loi_dot(sbd, cap_nhat_luc)',
  // 28/10 (Tự sửa lỗi theo đề xuất, chua-gon-dem.ts): cron đêm 00:30–05:59 duyệt đợt CÒN MỞ theo id ⇒ chỉ mục bộ phận chỉ chứa đợt mở (đợt đã đóng không quét).
  "CREATE INDEX IF NOT EXISTS idx_cld_mo_cu ON chua_loi_dot(id, sai_cuoi_luc, mo_luc) WHERE dong_luc IS NULL AND trang_thai_day<>'da_tu_sua'",
  // 11/11 (hoá đơn Cloudflare — D1 hàng đọc): cron gói sửa MỖI PHÚT (goi-sua-dem.ts cronGoiSuaDem) quét cả bảng chua_loi_dot (~98 nghìn hàng/lượt,
  // 133 triệu hàng/ngày) chỉ để tìm em còn đợt MỞ ⇒ chỉ mục bộ phận chỉ chứa đợt mở, theo em (đủ cột cho GROUP BY sbd + MAX(cap_nhat_luc)).
  "CREATE INDEX IF NOT EXISTS idx_cld_mo_em ON chua_loi_dot(sbd, cap_nhat_luc) WHERE dong_luc IS NULL AND trang_thai_day<>'da_tu_sua'",
  // 12/11 (hoá đơn D1 hàng đọc, ~300 triệu/ngày): nhánh NHÓM của «đợt của em cho câu hoặc cùng nhóm» (chua-dot-nhom-sql.ts). Bản sao server/migration-1211-chua-dot-nhom.sql.
  'CREATE INDEX IF NOT EXISTS idx_cld_sbd_nhom ON chua_loi_dot(sbd, content_group, dong_luc)',
  // 12/11 tối (H3 đợt 3, hoá đơn D1 hàng đọc): bảng LỚN ⇒ dựng 00:01 VN. Bản sao server/migration-z-1211-h3-doc-bang-phu.sql (+ -h3-skh-dong-tg.sql).
  //  · hồ sơ câu khi lập kế hoạch (ke-hoach-ngay-d1.ts docHoSoD1): câu tới hạn / đếm câu chưa khắc phục chỉ đọc đúng dòng cần.
  "CREATE INDEX IF NOT EXISTS nkc_em_toi_han ON nam_kt_cau(sbd, moc_on_ke) WHERE trang_thai IN ('moi_sai','dang_on','da_khac_phuc','chua_thay_sai') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL",
  "CREATE INDEX IF NOT EXISTS nkc_em_chua_kp ON nam_kt_cau(sbd, trang_thai) WHERE trang_thai IN ('dang_on','moi_sai')",
  //  · tổng EXP mùa của em (exp-d1.ts lenhTongSo / CAS / đọc sớm) + EXP dòng thời gian: chỉ mục phủ.
  'CREATE INDEX IF NOT EXISTS exp_so_em_luc ON exp_so(sbd, luc, exp, ngay_vn)',
  //  · dòng thời gian em ở màn thầy (gv-hom-nay-v2.ts): chỉ mục phủ bộ phận của nhánh sổ học.
  "CREATE INDEX IF NOT EXISTS skh_em_dong_tg ON su_kien_hoc(sbd, nguon, ma_nguon, ngay_vn, luc, ket_qua, giay) WHERE nguon NOT IN ('thi','len_bang')",
]
/** Chạy từng câu riêng (một câu lỗi không chặn câu khác). Trả số câu lỗi; nơi gọi ghi nhật ký máy. */
export async function dungChiMucCronDem(env: Env): Promise<number> {
  let loi = 0
  for (const s of CHI_MUC_CRON_DEM) {
    try { await env.DB.prepare(s).run() } catch (e) { loi++; console.error('[chi-muc] cron đêm không dựng được:', s, e instanceof Error ? e.message : e) }
  }
  return loi
}
