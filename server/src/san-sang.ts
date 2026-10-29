// SẴN SÀNG — SẢNH + CHẶNG KẾ TIẾP CHUẨN BỊ TRƯỚC (thầy 27/10: «tức thì mọi khung giờ, không sai sót»; Boss: sảnh ≤ 2–3 đợt D1, mở chặng ≤ 2).
//
// Vì sao: Sảnh / Mở chặng phải LẬP KẾ HOẠCH Gói 7 (gói → câu gói + sổ → hồ sơ → khối → ghi động cơ) — 5 đợt D1 nối tiếp mỗi lần (14 ở lượt đầu ngày); giờ cao
// điểm mỗi đợt ~1,3 s. Nay kết quả lập kế hoạch (phần Sảnh + bộ câu chặng kế tiếp, CHƯA lưu phiên) được ghi sẵn vào `hoc_tap_san_sang` NGOÀI đường chờ của em:
// sau câu cuối của chặng, sau lượt Sảnh chậm, cron đêm. Lượt sau đọc lại cùng đợt với mật khẩu, chỉ dùng khi DẤU còn khớp.
//
// DẤU (`dauSanSang`): MỘT câu đọc gom mọi đầu vào của kế hoạch có thể đổi giữa hai lượt — lượt trả lời / sổ học / học cách giải / xem lời giải / đợt Tự sửa lỗi
// / lịch kiểm tra của em; gói của em; lớp, phạm vi thầy đặt; cấu hình; kho câu (lập chỉ mục); ca thi (mở, công bố); câu nghi đáp án; BTVN; chiến dịch. Dấu khác
// ⇒ không dùng bản sẵn (đi đường cũ, lập lại). KHÔNG gồm bảng do chính việc lập kế hoạch ghi (quota ngày, mức ngày, động cơ) — nếu không sẽ không bao giờ khớp.
// Ngày VN khác ⇒ không dùng. Lỗi đọc (bảng chưa có…) ⇒ không dùng. Mọi thứ phụ thuộc giờ (Kiểm tra ôn tập, chuỗi ngày) nơi dùng vẫn đọc TƯƠI.
import type { Env } from './kieu'
import { ngayVn7 } from './goi-bai-7-loi'
import { lamMoiNiemChoCau } from './niem-cau'

type Row = Record<string, unknown>

export const BANG_SAN_SANG = 'hoc_tap_san_sang'
/** Bảng (CHỈ-THÊM). `sanh_json` = phần Sảnh không phụ thuộc giờ; `chang_json` = {refs, questions (đề công khai, KHÔNG đáp án), goi7} của chặng kế tiếp CHƯA lưu phiên. */
export const SQL_SAN_SANG: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS ${BANG_SAN_SANG} (sbd TEXT PRIMARY KEY, ngay TEXT NOT NULL, luc INTEGER NOT NULL, dau TEXT NOT NULL, sanh_json TEXT, chang_json TEXT)`,
]

/**
 * Câu đọc DẤU — chạy CÙNG đợt với mật khẩu ở nơi gọi. ?1 = sbd.
 * Phần CỦA EM (`em`): chỉ đọc theo chỉ mục của riêng em — DÒNG CUỐI theo (sbd, mốc giờ) (`ORDER BY … DESC LIMIT 1`, một lần dò chỉ mục, không đếm),
 * hoặc vài dòng của em qua chỉ mục sbd (bảng nhỏ theo em: kiểm tra cá nhân, gói, BTVN, chiến dịch theo em). EXPLAIN QUERY PLAN: tests/dau-san-sang-chi-muc-2810.
 * Phần CHUNG (cấu hình thầy, kho, ca, chiến dịch…): đếm / quét bảng dùng chung ⇒ KHÔNG đọc mỗi lượt Sảnh mà lấy từ ĐỆM ISOLATE 5 phút (như #531);
 * hết hạn ⇒ ghép vào CHÍNH câu dấu của lượt ấy (không thêm lệnh / đợt D1), lượt đồng thời dùng bản cũ trong lúc làm mới.
 */
type Phan = readonly [khoa: string, bang: string, sql: string, chung?: 1]
/** Khoá `cau_hinh` KHÔNG vào dấu (28/10 chiều): bản đệm / con trỏ / mốc giờ của việc nền — không phải công tắc, không đầu vào kế hoạch của em. Trước: Bảng tin của
 *  thầy tính lại «sai nhanh» mỗi 10 phút (`sai_nhanh_gv`), nhắc tự động ghi mốc mỗi 30 phút… ⇒ dấu chung đổi ⇒ MỌI bản sẵn của mọi em hỏng cùng lúc. */
export const KHOA_CH_KHONG_DAU: readonly string[] = ['sai_nhanh_gv', 'nhac_tu_dong_lan', 'may_soan_em_sai_luc', 'ai_ddh_vp_luc', 'omni_dem_con_tro', 'omni_gan_con_tro', 'omni_kiem_q_tuan',
  'danh_gia_hoc_that_con_tro', 'tu_sua_dong_cu', 'chot_exp_ngay_qua', 'thuong_cron_ngay', 'khien_mat_ngay', 'giai_tuan_chot']
const PHAN_DAU: readonly Phan[] = [
  ['a', 'game_v2_attempt', 'SELECT created_at FROM game_v2_attempt WHERE sbd=?1 ORDER BY created_at DESC LIMIT 1'], // game_v2_attempt_student(sbd,created_at)
  ['s', 'su_kien_hoc', 'SELECT received_at FROM su_kien_hoc WHERE sbd=?1 ORDER BY received_at DESC LIMIT 1'], // idx_skh_tiep_nhan(sbd,received_at,khoa)
  ['g', 'goi_bai_7_gap', 'SELECT luc FROM goi_bai_7_gap WHERE sbd=?1 ORDER BY luc DESC LIMIT 1'], // goi_bai_7_gap_sbd_luc (mới, chỉ-thêm)
  ['lg', 'loi_giai_hoi', 'SELECT luc FROM loi_giai_hoi WHERE sbd=?1 ORDER BY luc DESC LIMIT 1'], // idx_lg_hoi_em_luc(sbd,luc)
  ['cl', 'chua_loi_dot', 'SELECT cap_nhat_luc FROM chua_loi_dot WHERE sbd=?1 ORDER BY cap_nhat_luc DESC LIMIT 1'], // idx_cld_em_cap_nhat (mới, chỉ-thêm)
  ['kt', 'kiem_tra_ca_nhan', "SELECT group_concat(x,',') FROM (SELECT id||'~'||ngay||'~'||trang_thai||'~'||COALESCE(nop_luc,'') AS x FROM kiem_tra_ca_nhan WHERE sbd=?1 ORDER BY ngay)"], // ktcn_em_ngay(sbd,ngay) — UNIQUE(sbd,ngay), thứ tự chỉ mục,
  ['goi', 'goi_bai_7_em', "SELECT group_concat(x,',') FROM (SELECT goi_id||'~'||bat_dau||'~'||han AS x FROM goi_bai_7_em WHERE sbd=?1 ORDER BY han, goi_id)"], // goi_bai_7_em_sbd(sbd,han),
  ['gg', 'goi_bai_7', "SELECT COUNT(*)||'|'||COALESCE(MAX(tao_luc),'') FROM goi_bai_7", 1],
  ['hs', 'hoc_sinh', "SELECT COALESCE(lop,'')||'|'||COALESCE(ten_lop,'')||'|'||COALESCE(trang_thai,'') FROM hoc_sinh WHERE sbd=?1"],
  ['pv', 'game_v2_scope', 'SELECT json FROM game_v2_scope WHERE sbd=?1'],
  ['ch', 'cau_hinh', `SELECT COUNT(*)||'|'||COALESCE(MAX(cap_nhat_luc),'') FROM cau_hinh WHERE khoa NOT IN (${KHOA_CH_KHONG_DAU.map((k) => `'${k}'`).join(',')})`, 1],
  ['kho', 'game_v2_index', "SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') FROM game_v2_index", 1],
  ['dk', 'de_kho', "SELECT COUNT(*)||'|'||COALESCE(MAX(cap_nhat_luc),'') FROM de_kho", 1],
  ['ca', 'ca', "SELECT COUNT(*)||'|'||COALESCE(MAX(cap_nhat_luc),'')||'|'||COALESCE(SUM(trang_thai='mo'),0) FROM ca", 1],
  ['ng', 'cau_nghi_dap_an', "SELECT COUNT(*) FROM cau_nghi_dap_an WHERE trang_thai='nghi'", 1],
  ['bt', 'btvn_em', "SELECT COUNT(*)||'|'||COALESCE(MAX(nop_luc),'') FROM btvn_em WHERE sbd=?1"], // idx_btvn_em(sbd): vài chục dòng / em
  ['cd', 'chien_dich', "SELECT COUNT(*)||'|'||COALESCE(SUM(length(COALESCE(sbd_json,''))+length(COALESCE(qid_json,''))+length(COALESCE(ma_de_json,''))),0)||'|'||COALESCE(MAX(tao_luc),'')||'|'||COALESCE(group_concat(trang_thai||COALESCE(han_nop,''),''),'') FROM chien_dich", 1],
  ['cde', 'chien_dich_em', "SELECT COUNT(*)||'|'||COALESCE(MAX(COALESCE(them_luc,'')),'')||'|'||COALESCE(MAX(COALESCE(bot_luc,'')),'') FROM chien_dich_em WHERE sbd=?1"],
  ['bdd', 'bai_da_day', "SELECT COUNT(*)||'|'||COALESCE(MAX(tick_luc),'') FROM bai_da_day", 1],
]
/** Phiên bản cách tính dấu (đầu chuỗi): đổi cách tính ⇒ bản sẵn cũ không khớp, cron đêm lập lại (xem `cronSanSangDem`).
 *  v4 (28/10): «đã làm hôm nay» không còn đếm câu Tự sửa lỗi ⇒ bỏ mọi bản sẵn lập theo cách đếm cũ (sảnh «Đủ 14/12 · 2/2 chặng» khi chưa học chặng cuối).
 *  v5 (29/10): em ĐÃ đủ mức nay có chặng «học thêm câu mới» (goi-bai-7.ts `hocThem`) thay cho chặng RỖNG ⇒ bỏ mọi bản cũ mang chặng rỗng. */
export const BAN_DAU = 'v5'
/** Câu đọc DẤU (bỏ phần của bảng chưa có — `vang`; `coChung` = có kèm phần chung). ?1 = sbd. */
export function sqlDauSanSang(vang: ReadonlySet<string> = new Set(), coChung = true): string {
  return 'SELECT ' + PHAN_DAU.filter((p) => coChung || !p[3]).map(([k, bang, q]) => (vang.has(bang) ? `'-' AS ${k}` : `(${q}) AS ${k}`)).join(',\n  ')
}
export const SQL_DAU_SAN_SANG = sqlDauSanSang()
/** Câu dấu khi phần chung lấy từ đệm (đường nóng của lượt Sảnh / Mở chặng). */
export const SQL_DAU_SAN_SANG_EM = sqlDauSanSang(new Set(), false)

/** Chuỗi dấu từ một dòng đọc bằng `sqlDauSanSang`; `chung` (đệm) thay cho phần chung khi câu không kèm phần ấy. */
export function chuoiDau(r: Row | null | undefined, chung?: Row | null): string | null {
  if (!r) return null
  return BAN_DAU + '§' + PHAN_DAU.map(([k, , , c]) => String((c && chung ? chung[k] : r[k]) ?? '')).join('§')
}
/** Bảng isolate này đã thấy «chưa có» (bảng tạo lúc chạy: chiến dịch theo em, câu nghi…) — phần ấy coi là rỗng; bảng có lại thì dấu đổi ⇒ lập lại, an toàn. */
const bangVang = new Set<string>()

// ĐỆM PHẦN CHUNG (isolate). Tắt dưới vitest (test đổi cấu hình / kho rồi đọc dấu ngay); test riêng bật bằng `batDemDauChung`.
const HAN_CHUNG_MS = 5 * 60_000, CHO_LAM_MOI_MS = 15_000
let demChungBat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
let demChung: { v: Row; luc: number } | null = null, dangLamMoi = 0
export function batDemDauChung(b: boolean): void { demChungBat = b; demChung = null; dangLamMoi = 0 }
/** Phần chung dùng được cho lượt này (null ⇒ câu dấu phải kèm phần chung). Hết hạn: lượt đầu làm mới, lượt đồng thời (≤ 15 s) dùng bản cũ. */
function layChung(now: number): Row | null {
  if (!demChungBat || !demChung) return null
  if (now - demChung.luc < HAN_CHUNG_MS) return demChung.v
  if (dangLamMoi && now - dangLamMoi < CHO_LAM_MOI_MS) return demChung.v
  dangLamMoi = now
  return null
}
function ghiChung(r: Row | null | undefined, now: number): void {
  dangLamMoi = 0
  if (!demChungBat || !r) return
  const v: Row = {}
  for (const [k, , , c] of PHAN_DAU) if (c) v[k] = r[k]
  demChung = { v, luc: now }
}

/** Đọc DẤU hiện tại của em; lỗi (bảng chưa có…) ⇒ null (nơi gọi đi đường cũ). Không bao giờ ném. */
export async function dauSanSang(env: Env, sbd: string, now: number): Promise<string | null> {
  for (let lan = 0; lan < 4; lan++) {
    const chung = layChung(now)
    try {
      const r = await env.DB.prepare(sqlDauSanSang(bangVang, !chung)).bind(sbd).first<Row>()
      if (!chung) ghiChung(r, now)
      return chuoiDau(r, chung)
    } catch (e) {
      if (!chung) dangLamMoi = 0
      const m = /no such table:\s*(?:main\.)?([A-Za-z_][A-Za-z0-9_]*)/i.exec(e instanceof Error ? e.message : String(e))
      if (!m || !PHAN_DAU.some(([, b]) => b === m[1]) || bangVang.has(m[1]!)) return null
      bangVang.add(m[1]!)
    }
  }
  return null
}
/** Xoá đệm bảng vắng (test). */
export const xoaBangVangSanSang = () => bangVang.clear()

export interface BanSanSang { ngay: string; luc: number; dau: string; sanh: Row | null; chang: { refs: unknown[]; questions: unknown[]; goi7: unknown; rong?: Row } | null
  /** Giờ (ms) của đợt học MỚI NHẤT của em lúc đọc — có đợt mới hơn bản sẵn (mở chặng chạy song song / đường cũ) ⇒ không dùng phần chặng. */ phienMoi: number }

/** Bản sẵn của em (hoặc null). Không bao giờ ném. */
export async function docSanSang(env: Env, sbd: string): Promise<BanSanSang | null> {
  try {
    const r = await env.DB.prepare(`SELECT ngay, luc, dau, sanh_json, chang_json, (SELECT g.created_at FROM game_v2_session g WHERE g.sbd=s.sbd ORDER BY g.created_at DESC LIMIT 1) AS phien_moi FROM ${BANG_SAN_SANG} s WHERE sbd=?`).bind(sbd).first<Row>()
    if (!r) return null
    const doc = (v: unknown) => { try { return typeof v === 'string' && v ? JSON.parse(v) : null } catch { return null } }
    return { ngay: String(r.ngay), luc: Number(r.luc) || 0, dau: String(r.dau), sanh: doc(r.sanh_json), chang: doc(r.chang_json), phienMoi: r.phien_moi ? Date.parse(String(r.phien_moi)) || 0 : 0 }
  } catch { return null }
}

/** Cột bản sẵn đọc KÈM câu dấu (một lệnh D1 cho cả hai — lượt Sảnh / Mở chặng không thêm lệnh nào cho phần dấu). */
export const COT_BAN = `, (SELECT ngay FROM ${BANG_SAN_SANG} WHERE sbd=?1) AS ss_ngay, (SELECT luc FROM ${BANG_SAN_SANG} WHERE sbd=?1) AS ss_luc,
  (SELECT dau FROM ${BANG_SAN_SANG} WHERE sbd=?1) AS ss_dau, (SELECT sanh_json FROM ${BANG_SAN_SANG} WHERE sbd=?1) AS ss_sanh,
  (SELECT chang_json FROM ${BANG_SAN_SANG} WHERE sbd=?1) AS ss_chang, (SELECT created_at FROM game_v2_session WHERE sbd=?1 ORDER BY created_at DESC LIMIT 1) AS ss_phien_moi`
/** DẤU + BẢN SẴN trong MỘT lệnh D1 (đường Sảnh / Mở chặng). Bảng bản sẵn chưa có ⇒ chỉ dấu. Không bao giờ ném. */
export async function docDauVaBan(env: Env, sbd: string, now: number): Promise<[string | null, BanSanSang | null]> {
  let coBan = !bangVang.has(BANG_SAN_SANG)
  for (let lan = 0; lan < 5; lan++) {
    const chung = layChung(now)
    try {
      const r = await env.DB.prepare(sqlDauSanSang(bangVang, !chung) + (coBan ? COT_BAN : '')).bind(sbd).first<Row>()
      if (!chung) ghiChung(r, now)
      const dau = chuoiDau(r, chung)
      if (!r || !coBan || r.ss_dau == null) return [dau, null]
      const doc = (v: unknown) => { try { return typeof v === 'string' && v ? JSON.parse(v) : null } catch { return null } }
      return [dau, { ngay: String(r.ss_ngay), luc: Number(r.ss_luc) || 0, dau: String(r.ss_dau), sanh: doc(r.ss_sanh), chang: doc(r.ss_chang), phienMoi: r.ss_phien_moi ? Date.parse(String(r.ss_phien_moi)) || 0 : 0 }]
    } catch (e) {
      if (!chung) dangLamMoi = 0
      const m = /no such table:\s*(?:main\.)?([A-Za-z_][A-Za-z0-9_]*)/i.exec(e instanceof Error ? e.message : String(e))
      if (m && m[1] === BANG_SAN_SANG && coBan) { coBan = false; continue } // isolate mới, bảng đang được tạo (DDL gửi cùng lúc) ⇒ lượt này chỉ dấu
      if (!m || !PHAN_DAU.some(([, b]) => b === m[1]) || bangVang.has(m[1]!)) return [null, null]
      bangVang.add(m[1]!)
    }
  }
  return [null, null]
}

/** Bản sẵn DÙNG ĐƯỢC: cùng ngày VN, dấu khớp (dấu đọc lỗi ⇒ không). */
export function dungDuoc(ban: BanSanSang | null, dau: string | null, ngay: string): ban is BanSanSang {
  return !!ban && !!dau && ban.dau === dau && ban.ngay === ngay
}

/** Ghi bản sẵn (thay cả dòng). `dau` PHẢI là dấu đọc TRƯỚC khi lập kế hoạch (đổi giữa chừng ⇒ lần sau lệch dấu ⇒ lập lại, an toàn). */
export function lenhGhiSanSang(env: Env, sbd: string, b: { ngay: string; luc: number; dau: string; sanh: Row | null; chang: BanSanSang['chang'] }) {
  return env.DB.prepare(`INSERT INTO ${BANG_SAN_SANG}(sbd, ngay, luc, dau, sanh_json, chang_json) VALUES(?,?,?,?,?,?)
    ON CONFLICT(sbd) DO UPDATE SET ngay=excluded.ngay, luc=excluded.luc, dau=excluded.dau, sanh_json=excluded.sanh_json, chang_json=excluded.chang_json`)
    .bind(sbd, b.ngay, b.luc, b.dau, b.sanh ? JSON.stringify(b.sanh) : null, b.chang ? JSON.stringify(b.chang) : null)
}

/** Bỏ phần chặng đã phát (một bản sẵn chỉ thành MỘT phiên). */
export function lenhBoChangSanSang(env: Env, sbd: string, luc: number) {
  return env.DB.prepare(`UPDATE ${BANG_SAN_SANG} SET chang_json=NULL WHERE sbd=? AND luc=?`).bind(sbd, luc)
}

/** Phần Sảnh KHÔNG phụ thuộc giờ (Kiểm tra ôn tập / chuỗi ngày nơi dùng đọc tươi). Cùng các trường như nhánh Sảnh Gói 7 của game-v2. */
export function phanSanh(t7: { ngay: string } & Row, con: number, daLamNgay: number): Row {
  return { ngay: t7.ngay, goi7: t7, theLuc: { con, tong: daLamNgay + con }, dao: { con } }
}

/**
 * CHUẨN BỊ (chạy NỀN — waitUntil / cron, không ai chờ): đọc dấu TRƯỚC, lập kế hoạch Gói 7, lập chặng kế tiếp KHÔNG lưu phiên, cất cả hai.
 * `lapSan` (tuỳ chọn): kế hoạch vừa lập ở lượt Sảnh chậm (cùng dấu `dauSan` đọc trước khi lập) ⇒ khỏi lập lại. Không bao giờ ném.
 */
export async function chuanBiSanSang(env: Env, sbd: string, now: number, san?: { dau: string | null; lap: unknown }): Promise<boolean> {
  try {
    const { chayDdlMotLan } = await import('./ddl-mot-lan')
    await chayDdlMotLan(env, BANG_SAN_SANG, SQL_SAN_SANG)
    const g7 = await import('./goi-bai-7')
    if (!(await g7.coGoi7(env)).bat) return false
    const dau = san ? san.dau : await dauSanSang(env, sbd, now)
    if (!dau) return false
    const lap = (san?.lap ?? await g7.lapGoi7(env, sbd, now)) as Awaited<ReturnType<typeof g7.lapGoi7>>
    if (!lap) return false
    if (!san) g7.nhoLapSanh7(env, sbd, now, lap) // chặng kế tiếp dưới dùng lại đúng kế hoạch này (như mở chặng ngay sau Sảnh)
    const con = lap.plan.viec.length, t7 = g7.tomTatGoi7(lap, now)
    const st = await g7.startGoi7(env, sbd, now, undefined, { khongLuu: true }).catch(() => null)
    const chang = (st?.chuanBi ?? null) as BanSanSang['chang']
    await lenhGhiSanSang(env, sbd, { ngay: ngayVn7(now), luc: now, dau, sanh: phanSanh(t7 as { ngay: string } & Row, con, lap.daLamNgay), chang }).run()
    return true
  } catch (e) { console.error('[san-sang] chuẩn bị lỗi:', e instanceof Error ? e.message : e); return false }
}

/**
 * MỞ CHẶNG TỪ BẢN SẴN: lưu phiên với đúng bộ câu đã lập (cùng cổng «gói còn nhận em» như lượt thật) và bỏ phần chặng của bản sẵn — MỘT lô D1.
 * Không lưu được (gói vừa đổi…) ⇒ null ⇒ nơi gọi đi đường cũ.
 */
export async function moChangSanSang(env: Env, sbd: string, now: number, ban: BanSanSang): Promise<Record<string, unknown> | null> {
  const c = ban.chang as (BanSanSang['chang'] & { goiIds?: unknown; phienCu?: unknown; rong?: unknown }) | null
  if (ban.phienMoi >= ban.luc) return null // đợt mới hơn bản sẵn (vd. mở chặng chạy song song với Sảnh) ⇒ đường thường tự dùng lại đúng đợt ấy
  // Chặng RỖNG lập sẵn (em đã xong phần hôm nay — goi-bai-7.ts `startGoi7` khongLuu): dấu khớp ⇒ cùng kết quả, không ghi gì (đường thường cũng không lưu phiên).
  if (c && c.rong && typeof c.rong === 'object' && !Array.isArray(c.rong)) return c.rong as Record<string, unknown>
  if (!c || !Array.isArray(c.refs) || !c.refs.length || !Array.isArray(c.questions) || !Array.isArray(c.goiIds)) return null
  // Đợt cũ còn nguyên (lập sẵn trả đúng đợt ấy, như đường thường): dấu khớp ⇒ chưa câu nào được trả lời từ lúc lập ⇒ trả lại đợt đó (còn hạn 2 giờ), không tạo đợt mới.
  if (typeof c.phienCu === 'string' && c.phienCu) {
    const cu = await env.DB.prepare("SELECT json_extract(json,'$.created') AS t FROM game_v2_session WHERE id=? AND sbd=?").bind(c.phienCu, sbd).first<Row>()
    if (!cu || now - Number(cu.t) > 100 * 60_000) return null
    return { ok: true, id: c.phienCu, questions: await lamMoiNiemChoCau(env, sbd, c.questions, now), goi7: c.goi7 }
  }
  const { sqlCacGoiConNhan7 } = await import('./goi-bai-7-quyen')
  const { sqlTenLopHs } = await import('./goi-bai-7')
  const id = crypto.randomUUID()
  const [ins] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO game_v2_session(id,sbd,json,created_at) SELECT ?,?,?,? WHERE ${sqlCacGoiConNhan7('?', '?', sqlTenLopHs('h'))}`)
      .bind(id, sbd, JSON.stringify({ mode: 'adventure', created: now, hoa2: 1, hocTap: 1, goi7: 1, questions: c.refs }), new Date(now).toISOString(), JSON.stringify(c.goiIds), sbd),
    lenhBoChangSanSang(env, sbd, ban.luc),
  ])
  if (!Number(ins?.meta.changes)) return null
  return { ok: true, id, questions: await lamMoiNiemChoCau(env, sbd, c.questions, now), goi7: c.goi7 } // tem niêm phong làm MỚI lúc mở (niem-cau.ts)
}

/** Phiên `id` của em đã trả lời HẾT câu (kể cả câu làm lại cuối chặng)? — sau câu cuối mới chuẩn bị chặng kế tiếp. Lỗi ⇒ false. */
export async function phienDaXong(env: Env, sbd: string, id: string): Promise<boolean> {
  try {
    const r = await env.DB.prepare(`SELECT json_array_length(s.json,'$.questions') AS n,
        (SELECT COUNT(DISTINCT a.qid) FROM game_v2_attempt a WHERE a.session=s.id AND a.sbd=s.sbd) AS d FROM game_v2_session s WHERE s.id=? AND s.sbd=?`).bind(id, sbd).first<Row>()
    return !!r && Number(r.n) > 0 && Number(r.d) >= Number(r.n)
  } catch { return false }
}

/**
 * CHUẨN BỊ KHI EM RỜI APP GIỮA CHỪNG (thầy 29/10 «mở app tức thì mọi lúc»): bản lập sẵn hết hạn ngay khi em làm một câu (dấu đổi) — chỉ lượt sau câu CUỐI chặng mới lập lại. Em bỏ
 * giữa chặng (khoá máy / đổi ứng dụng) rồi mở lại ⇒ Sảnh đi đường lập kế hoạch ~3 s. Máy em báo lúc app bị ẩn (`hoc-tap-chuan-bi`) ⇒ lập lại NỀN một lần, tối đa 1 lượt / 90 s mỗi em
 * (đệm isolate; lượt trùng ở isolate khác chỉ tốn thêm một lần lập). Không đụng hồ sơ / kết quả của em — chỉ bảng lập sẵn.
 */
const daChuanBiKhiThoat = new Map<string, number>()
export const HAN_CHUAN_BI_THOAT_MS = 90_000
export function chuanBiKhiThoat(env: Env, sbd: string, ctx: { waitUntil(p: Promise<unknown>): void } | undefined, now: number = Date.now()): { ok: true; dang: boolean } {
  const cu = daChuanBiKhiThoat.get(sbd)
  if (!ctx || (cu !== undefined && now - cu < HAN_CHUAN_BI_THOAT_MS)) return { ok: true, dang: false }
  daChuanBiKhiThoat.delete(sbd); daChuanBiKhiThoat.set(sbd, now)
  while (daChuanBiKhiThoat.size > 500) daChuanBiKhiThoat.delete(daChuanBiKhiThoat.keys().next().value as string)
  ctx.waitUntil(chuanBiSanSang(env, sbd, now).catch(() => false))
  return { ok: true, dang: true }
}
export const xoaChuanBiKhiThoat = (): void => daChuanBiKhiThoat.clear()

/** Khung cron ĐÊM của bản lập sẵn (giờ VN): từ 00:15 (sau việc 00:01 đổi ngày) tới HẾT 03:59 — thầy 29/10: «mỗi ngày load trước cho học sinh TRƯỚC 4h sáng». */
export const DEM_BAT_DAU_PHUT = 15, DEM_KET_GIO = 4
/** Số em lập sẵn mỗi phút theo khung giờ VN: đêm 00:15–03:59 → 10 (D1 vắng); 04:00–12:59 → 6; chiều 13:00–18:59 → 16 (trước giờ học — thầy 29/10 «nạp hết sẵn cho 100% học sinh»; ~30 lệnh D1/em,
 *  trần ~1000 lệnh D1 mỗi lượt cron ⇒ không quá 16); tối 19:00–23:59 → 6 (chỉ để vá bản bị đổi dấu khi thầy giao bài giữa giờ — D1 bận nên ít); 00:00–00:14 → 0 (việc đổi ngày 00:01). */
export const TOI_DA_DEM = 10, TOI_DA_SANG = 6, TOI_DA_CHIEU = 16, TOI_DA_TOI = 6, SONG_SONG_CRON = 4
/** Em vừa trả lời trong vòng này ⇒ đang học: cron KHÔNG lập lại bản của em (lượt cuối chặng / lúc rời app đã lo, tránh lập đi lập lại khi em làm từng câu). */
export const EM_DANG_HOC_MS = 10 * 60_000
/** Giờ này (VN) có thuộc khung chuẩn bị đêm không? */
export const trongKhungDem = (now: number): boolean => { const d = new Date(now + 7 * 3600000), g = d.getUTCHours(); return g >= 1 && g < DEM_KET_GIO || (g === 0 && d.getUTCMinutes() >= DEM_BAT_DAU_PHUT) }
/** Khung chiều: 13:00–18:59 VN. */
export const trongKhungChieu = (now: number): boolean => { const g = new Date(now + 7 * 3600000).getUTCHours(); return g >= 13 && g < 19 }
/** Hạn mức số em lập sẵn cho phút này (0 = nghỉ). */
export function toiDaCron(now: number): number {
  const g = new Date(now + 7 * 3600000).getUTCHours()
  if (g >= 19) return TOI_DA_TOI
  if (g >= 13) return TOI_DA_CHIEU
  if (g >= 4) return TOI_DA_SANG
  return trongKhungDem(now) ? TOI_DA_DEM : 0
}

/**
 * DẤU HIỆN TẠI của nhiều em (cron): em đầu đọc kèm phần CHUNG (tươi), các em còn lại chỉ phần của em, theo lô ≤ 50 lệnh — ghép bằng `chuoiDau` y như lượt Sảnh.
 * Đồng thời làm tươi đệm phần chung của isolate để `chuanBiSanSang` ngay sau đó ghi dấu khớp. Trả `a` = mốc trả lời cuối của em. Lỗi ⇒ null (bỏ lượt làm mới này).
 */
async function dauNhieuEm(env: Env, sbds: readonly string[], now: number): Promise<Map<string, { dau: string; a: number }> | null> {
  const ra = new Map<string, { dau: string; a: number }>()
  if (!sbds.length) return ra
  const mocA = (r: Row) => { const t = Date.parse(String(r.a ?? '')); return Number.isFinite(t) ? t : 0 }
  for (let lan = 0; lan < 4; lan++) {
    try {
      const r0 = await env.DB.prepare(sqlDauSanSang(bangVang, true)).bind(sbds[0]).first<Row>()
      if (!r0) return null
      ghiChung(r0, now)
      const d0 = chuoiDau(r0); if (d0) ra.set(sbds[0]!, { dau: d0, a: mocA(r0) })
      const con = sbds.slice(1)
      for (let i = 0; i < con.length; i += 50) {
        const lo = con.slice(i, i + 50)
        const rs = await env.DB.batch(lo.map((sbd) => env.DB.prepare(sqlDauSanSang(bangVang, false)).bind(sbd)))
        lo.forEach((sbd, j) => { const r = rs[j]?.results?.[0] as Row | undefined; const d = chuoiDau(r, r0); if (r && d) ra.set(sbd, { dau: d, a: mocA(r) }) })
      }
      return ra
    } catch (e) {
      const m = /no such table:\s*(?:main\.)?([A-Za-z_][A-Za-z0-9_]*)/i.exec(e instanceof Error ? e.message : String(e))
      if (!m || !PHAN_DAU.some(([, b]) => b === m[1]) || bangVang.has(m[1]!)) return null
      bangVang.add(m[1]!); ra.clear()
    }
  }
  return null
}

/**
 * CRON LẬP SẴN (cả ngày, trừ 00:00–00:14): chuẩn bị Sảnh + chặng đầu cho MỌI em còn đang nhận gói — trước hết em CHƯA có bản hôm nay (hoặc bản theo cách tính dấu cũ), rồi (còn chỗ) em có bản
 * nhưng DẤU ĐÃ ĐỔI (thầy giao bài / đổi cấu hình / gói mới… — dấu chung đổi là mọi bản của mọi em lệch cùng lúc ⇒ lượt mở app đầu của em phải lập lại ~3 s; thầy 29/10 «mở app phải tức thì 100%»).
 * Tối đa `toiDaCron` em mỗi phút (~30 lệnh D1/em). Em vừa trả lời < `EM_DANG_HOC_MS` thì bỏ qua (đang học); em học gần đây nhất được lập lại trước.
 * 29/10 chiều: bản cũ chọn theo `goi_bai_7_em.han >= hôm nay` ⇒ bỏ sót ~233 em (hạn là HẠN NỘP, em vẫn «đang nhận» sau hạn — goi-bai-7-quyen.ts). Nay dùng ĐÚNG điều kiện của
 * `docDanhSachGoi7` (lớp hiệu lực, tick còn hoạt động, quyền nhận), không điều kiện ngày.
 */
export async function cronSanSangDem(env: Env, now: number, toiDa?: number): Promise<number> {
  toiDa ??= toiDaCron(now)
  if (toiDa <= 0) return 0
  try {
    const { chayDdlMotLan } = await import('./ddl-mot-lan')
    await chayDdlMotLan(env, BANG_SAN_SANG, SQL_SAN_SANG)
    const g7 = await import('./goi-bai-7')
    if (!(await g7.coGoi7(env)).bat) return 0
    const { sqlEmDangNhan7 } = await import('./goi-bai-7-quyen')
    const ngay = ngayVn7(now)
    // Em đang nhận ≥ 1 gói (cùng các điều kiện JOIN / quyền như danh sách gói của em), chưa bị khoá.
    const emNhan = `SELECT DISTINCT e.sbd FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id
      JOIN hoc_sinh h ON h.sbd=e.sbd AND ${g7.sqlTenLopHs('h')}=g.lop JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${sqlEmDangNhan7('e', 'g', 'h')}`
    const chua = await env.DB.prepare(`SELECT x.sbd FROM (${emNhan}) x WHERE NOT EXISTS (SELECT 1 FROM ${BANG_SAN_SANG} s WHERE s.sbd=x.sbd AND s.ngay=? AND s.dau LIKE ?) ORDER BY x.sbd LIMIT ?`)
      .bind(ngay, BAN_DAU + '§%', toiDa).all<{ sbd: string }>()
    const ds = (chua.results ?? []).map((r) => String(r.sbd))
    // Còn chỗ ⇒ vá bản đã LỆCH DẤU (so với dấu hiện tại), em học gần đây nhất trước, bỏ em đang học dở.
    if (ds.length < toiDa) {
      const co = await env.DB.prepare(`SELECT x.sbd, s.dau, (SELECT g.created_at FROM game_v2_session g WHERE g.sbd=x.sbd ORDER BY g.created_at DESC LIMIT 1) AS gan FROM (${emNhan}) x
        JOIN ${BANG_SAN_SANG} s ON s.sbd=x.sbd AND s.ngay=? AND s.dau LIKE ?`).bind(ngay, BAN_DAU + '§%').all<{ sbd: string; dau: string; gan: string | null }>()
      const hang = co.results ?? []
      const hienTai = await dauNhieuEm(env, hang.map((r) => String(r.sbd)), now)
      if (hienTai) {
        const lech = hang.filter((r) => { const h = hienTai.get(String(r.sbd)); return !!h && h.dau !== String(r.dau) && now - h.a >= EM_DANG_HOC_MS })
          .sort((a, b) => String(b.gan ?? '').localeCompare(String(a.gan ?? '')))
        ds.push(...lech.slice(0, toiDa - ds.length).map((r) => String(r.sbd)))
      }
    }
    // Từng nhóm 4 em chạy song song (mỗi em ~30 lệnh D1 nối tiếp ⇒ 16 em/phút nối tiếp có thể vượt một phút); chiều/đêm D1 vắng.
    let n = 0
    for (let i = 0; i < ds.length; i += SONG_SONG_CRON) n += (await Promise.all(ds.slice(i, i + SONG_SONG_CRON).map((sbd) => chuanBiSanSang(env, sbd, now)))).filter(Boolean).length
    return n
  } catch (e) { console.error('[san-sang] cron đêm lỗi:', e instanceof Error ? e.message : e); return 0 }
}
