// DANH SÁCH EM ĐANG NHẬN GÓI 7 + CÁC CÂU QUÉT CẢ LỚP CỦA GÓI 7 — bản đọc ít dòng (12/11, nhóm G4 giảm chi phí D1).
// Đo D1 thật 24h (12/11): `SQL_GOI7_EM` (bảng Bài hằng ngày / Bốn bảng / Nhịp học) 1.971 lượt × 28.217 dòng, danh sách em của cron Sảnh (san-sang.ts)
// 1.908 lượt × 28.495 dòng — gần hết là `json_each(danh sách tick)` chạy lại cho TỪNG dòng gói×em (sqlQuyetDinhNhan7), cộng dòng của gói đã bỏ tick.
// Bản này: (1) đi từ tick CÒN HOẠT ĐỘNG → gói → dòng em của gói → hồ sơ em (CROSS JOIN giữ thứ tự, không chạm dòng gói đã bỏ tick);
// (2) danh sách tick bung một lần (`te7`, goi-bai-7-quyen.ts). Kết quả Y HỆT câu cũ (tests/goi7-em-nhan-it-dong-1211.test.ts so cũ↔mới + khoá EXPLAIN).
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { sqlTenLopHs } from './goi-bai-7'
import { SQL_TE7, sqlEmDangNhan7Te, sqlQuyetDinhNhan7Te } from './goi-bai-7-quyen'

/** sbd → ngày bắt đầu Gói 7 sớm nhất của mọi em đang nhận ≥ 1 gói (đúng điều kiện `docGoiCuaEm7`), xếp theo sbd như câu cũ. */
export const SQL_EM_NHAN7 = `WITH ${SQL_TE7}
  SELECT e.sbd AS sbd, MIN(e.bat_dau) AS bat_dau FROM bai_da_day b CROSS JOIN goi_bai_7 g CROSS JOIN goi_bai_7_em e CROSS JOIN hoc_sinh h
  WHERE b.bo_tick_luc IS NULL AND g.tick_id = b.id AND e.goi_id = g.id AND h.sbd = e.sbd AND ${sqlTenLopHs('h')} = g.lop AND ${sqlEmDangNhan7Te('e', 'g', 'h')}
  GROUP BY e.sbd ORDER BY e.sbd`

export interface EmNhan7 { sbd: string; bat_dau: string }
/** Đọc danh sách em đang nhận Gói 7 (một câu). Lỗi ⇒ ném (nơi gọi tự xử lý như câu cũ). */
export async function docEmNhan7(env: Env): Promise<EmNhan7[]> {
  return ((await env.DB.prepare(SQL_EM_NHAN7).all<EmNhan7>()).results ?? []).map((r) => ({ sbd: String(r.sbd ?? ''), bat_dau: String(r.bat_dau ?? '') }))
}

// ------------------------------------------------------------------ BẢN DÙNG CHUNG CHO CRON (lệch tối đa TUOI_DEM_CRON_MS)
// Hai cron mỗi phút cần cùng danh sách này: lập sẵn Sảnh (san-sang.ts, cả ngày) và Bốn bảng (bon-chi-so-d1.ts, ngoài 18:00–23:30) — ~2.500 lượt/ngày.
// Cron là việc NỀN (lập sẵn / tính sẵn; em mở app vẫn tự lập, lệnh thầy đọc thẳng `docEmNhan7`), nên dùng chung MỘT bản tính ≤ 5 phút qua một dòng D1
// (đệm trong isolate trượt vì mỗi lượt cron có thể rơi vào isolate khác). Em vừa được giao / vừa thôi nhận gói được cron thấy chậm tối đa 5 phút.
// Bảng đệm chưa có / đọc lỗi ⇒ tính thẳng như cũ (không bao giờ sai hơn câu thẳng). Ghi đệm tối đa ~288 lần/ngày, mỗi lần một dòng.
export const BANG_EM_NHAN7_DEM = 'goi_bai_7_em_nhan_dem'
export const SQL_EM_NHAN7_DEM: readonly string[] = [`CREATE TABLE IF NOT EXISTS ${BANG_EM_NHAN7_DEM} (khoa TEXT PRIMARY KEY, luc INTEGER NOT NULL, json TEXT NOT NULL)`]
export const TUOI_DEM_CRON_MS = 5 * 60_000
export async function docEmNhan7Cron(env: Env, now: number, tuoiMs = TUOI_DEM_CRON_MS): Promise<EmNhan7[]> {
  try {
    await chayDdlMotLan(env, BANG_EM_NHAN7_DEM, SQL_EM_NHAN7_DEM)
    const r = await env.DB.prepare(`SELECT luc, json FROM ${BANG_EM_NHAN7_DEM} WHERE khoa = 'ds'`).first<{ luc: number; json: string }>()
    const tuoi = now - Number(r?.luc)
    if (r && tuoi >= 0 && tuoi < tuoiMs) {
      const a: unknown = JSON.parse(String(r.json))
      if (Array.isArray(a) && a.every((x) => Array.isArray(x) && x.length === 2)) return (a as unknown[][]).map(([sbd, bat_dau]) => ({ sbd: String(sbd ?? ''), bat_dau: String(bat_dau ?? '') }))
    }
  } catch { /* đệm hỏng / chưa có bảng ⇒ tính thẳng */ }
  const ds = await docEmNhan7(env)
  try {
    await env.DB.prepare(`INSERT INTO ${BANG_EM_NHAN7_DEM}(khoa, luc, json) VALUES('ds', ?, ?) ON CONFLICT(khoa) DO UPDATE SET luc = excluded.luc, json = excluded.json`)
      .bind(now, JSON.stringify(ds.map((x) => [x.sbd, x.bat_dau]))).run()
  } catch { /* ghi đệm lỗi: lượt sau tính lại */ }
  return ds
}

// ------------------------------------------------------------------ CÂU CỦA BƯỚC «Áp bài gần nhất» (scripts/ap-goi7-song.ts, chạy ở mỗi lần phát hành)
// Đo 24h: chốt quota 72 lượt × ~317 nghìn dòng; đếm «em đã chọn chưa nhận gói» 8 triệu dòng. Cùng một tham số ?1 = ngày VN hôm nay (câu cũ bind 5 lần cùng giá trị).
// Chốt quota là INSERT OR IGNORE theo khoá (goi_id, sbd, ngay) ⇒ cặp (gói, em) ĐÃ có dòng hôm nay bị bỏ qua NGAY TRƯỚC khi đếm câu (kết quả bảng y hệt;
// từ lần phát hành thứ hai trong ngày câu gần như không đọc gì).
const DA_CO_NGAY = `NOT EXISTS(SELECT 1 FROM goi_bai_7_ngay n WHERE n.goi_id=e.goi_id AND n.sbd=e.sbd AND n.ngay=?1)`
const KHONG_CA = `NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
const EM_GOI_HOAT_DONG = `bai_da_day b CROSS JOIN goi_bai_7 g CROSS JOIN goi_bai_7_em e CROSS JOIN hoc_sinh h`
const NOI_EM_GOI = `b.bo_tick_luc IS NULL AND g.tick_id=b.id AND e.goi_id=g.id AND h.sbd=e.sbd AND ${sqlTenLopHs('h')}=g.lop`
/** Chốt quota hôm nay cho em chưa mở app (câu gốc/bản đã thực sự gặp trước hôm nay không tính). `sqlLuot` = SQL_LUOT_GOI7 (goi-bai-7.ts). */
export const sqlChotQuotaNgay7 = (sqlLuot: string) => `INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota)
  WITH ${SQL_TE7}
  SELECT e.goi_id,e.sbd,?1,CAST((COUNT(c.qid)+MAX(1,CAST(julianday(e.han)-julianday(?1)+1 AS INT))-1)/MAX(1,CAST(julianday(e.han)-julianday(?1)+1 AS INT)) AS INT)
  FROM ${EM_GOI_HOAT_DONG} CROSS JOIN goi_bai_7_cau c
  WHERE ${NOI_EM_GOI} AND c.goi_id=e.goi_id AND ${DA_CO_NGAY} AND ${sqlEmDangNhan7Te('e','g','h')} AND ${KHONG_CA}
    AND NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd=e.sbd AND su_kien_hoc.qid=c.qid AND json_extract(su_kien_hoc.raw_json,'$.ht_cau_version')=c.version AND su_kien_hoc.ket_qua IS NOT NULL
      AND ngay_vn<?1 AND ${sqlLuot})
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_gap x WHERE x.goi_id=e.goi_id AND x.sbd=e.sbd AND x.qid=c.qid AND x.version=c.version AND date(x.luc,'+7 hours')<?1)
  GROUP BY e.goi_id,e.sbd,e.han`
/** Em đang nhận gói mà không còn câu nào phải làm ⇒ quota 0 (giữ dòng để màn em / thầy đọc đúng). */
export const SQL_QUOTA0_NGAY7 = `INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota)
  WITH ${SQL_TE7}
  SELECT e.goi_id,e.sbd,?1,0 FROM ${EM_GOI_HOAT_DONG} WHERE ${NOI_EM_GOI} AND ${DA_CO_NGAY} AND ${sqlEmDangNhan7Te('e','g','h')} AND ${KHONG_CA}`
/** Số em (chưa khoá) thuộc lớp của một gói còn hoạt động, được chọn nhận, mà CHƯA có dòng nhận gói. Dò dòng nhận gói (khoá chính) TRƯỚC quyền nhận. */
export const SQL_CHUA_NHAN7 = `WITH ${SQL_TE7}
  SELECT COUNT(*) n FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(
  SELECT 1 FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
  WHERE g.lop=${sqlTenLopHs('h')} AND NOT EXISTS(SELECT 1 FROM goi_bai_7_em e WHERE e.goi_id=g.id AND e.sbd=h.sbd) AND ${sqlQuyetDinhNhan7Te('g','h.sbd')})`
