// BẢNG TRA «EM THUỘC CHIẾN DỊCH NÀO» (31/10, thầy: «máy chủ chạy cả trăm ngàn em cùng lúc»). Thử tải 10.000 em (lượt 12): câu đọc CẢ DÒNG `chien_dich`
// (cột sbd_json của chiến dịch khối dài hàng trăm KB) chiếm 53% thời gian D1 khi isolate lạnh dồn — mỗi isolate đọc lại cả danh sách em của mọi chiến dịch chỉ để
// biết MỘT em thuộc chiến dịch nào. Nay: bảng tra (sbd, chiến dịch) có khoá chính theo sbd. Dấu `chien_dich_tv_dau` = chiến dịch đã lập chỉ mục ĐÚNG sbd_json hiện tại;
// trigger xoá dấu mỗi khi dòng chiến dịch được thêm / xoá / đổi sbd_json ⇒ đường đọc (srs2-d1.ts) thấy thiếu dấu thì đi đường cũ (đọc cả dòng) — kết quả luôn y hệt.
// Lập chỉ mục chạy ở cron mỗi phút (chỉ chiến dịch thiếu dấu; thường ngày một câu đọc nhẹ), mỗi chiến dịch MỘT lô nguyên tử chỉ ghi phần chênh.
// Thành viên = phần tử CHUỖI ở cấp đầu của mảng JSON hợp lệ (đúng `tapChuoiJson`: JSON hỏng / không phải mảng ⇒ không em nào).
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { TU_NGAY } from './loi-hoc-luat'

export const DDL_CHIEN_DICH_TV: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS chien_dich_tv (sbd TEXT NOT NULL, chien_dich_id TEXT NOT NULL, PRIMARY KEY (sbd, chien_dich_id)) WITHOUT ROWID',
  'CREATE INDEX IF NOT EXISTS idx_chien_dich_tv_cd ON chien_dich_tv(chien_dich_id)',
  'CREATE TABLE IF NOT EXISTS chien_dich_tv_dau (chien_dich_id TEXT PRIMARY KEY, luc TEXT NOT NULL)',
  `CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_them AFTER INSERT ON chien_dich BEGIN
    DELETE FROM chien_dich_tv_dau WHERE chien_dich_id = NEW.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_sua AFTER UPDATE ON chien_dich WHEN OLD.id IS NOT NEW.id OR OLD.sbd_json IS NOT NEW.sbd_json BEGIN
    DELETE FROM chien_dich_tv_dau WHERE chien_dich_id IN (OLD.id, NEW.id);
  END`,
  `CREATE TRIGGER IF NOT EXISTS chien_dich_tv_sau_xoa AFTER DELETE ON chien_dich BEGIN
    DELETE FROM chien_dich_tv_dau WHERE chien_dich_id = OLD.id;
  END`,
]

/** Phạm vi chiến dịch mà đường đọc của em dùng (đúng điều kiện câu đọc cũ trong srs2-d1.ts). Bí danh bảng `c`. */
export const DK_PHAM_VI_TV = `(c.trang_thai <> 'da_huy' OR (c.trang_thai = 'da_huy' AND COALESCE(c.dong_luc, '') >= '${TU_NGAY}'))`
/** Dấu của MỌI chiến dịch đã lập chỉ mục (id:lúc, theo id) — một câu đọc thấy dấu và dữ liệu cùng một ảnh chụp. */
export const SQL_DAU_TV = "(SELECT COALESCE(group_concat(x, ','), '') FROM (SELECT chien_dich_id || ':' || luc AS x FROM chien_dich_tv_dau ORDER BY chien_dich_id))"
/** Các chiến dịch của MỘT em + dấu (dòng `k = 'd'`) trong cùng câu đọc. */
export const SQL_TV_CUA_EM = `SELECT 'c' AS k, chien_dich_id AS v FROM chien_dich_tv WHERE sbd = ?1 UNION ALL SELECT 'd', ${SQL_DAU_TV}`
const MANG = "CASE WHEN json_valid(c.sbd_json) AND json_type(c.sbd_json) = 'array' THEN c.sbd_json ELSE '[]' END"

const loiGanDay = new Map<string, number>()
/**
 * Lập chỉ mục cho chiến dịch thiếu dấu (trong phạm vi đọc), tối đa `toiDa` chiến dịch mỗi lượt. Mỗi chiến dịch MỘT lô nguyên tử: xoá dòng không còn là thành viên,
 * thêm dòng thiếu, ghi dấu — sbd_json đổi giữa chừng ⇒ trigger xoá dấu ⇒ lượt sau lập lại. Chiến dịch lỗi ⇒ nghỉ 30 phút trong isolate (không chặn cái khác).
 */
export async function lapChiMucTv(env: Env, nowMs: number, toiDa = 20): Promise<{ lap: number; loi: number }> {
  await chayDdlMotLan(env, 'chien_dich_tv', DDL_CHIEN_DICH_TV)
  const r = await env.DB.prepare(`SELECT c.id FROM chien_dich c WHERE ${DK_PHAM_VI_TV}
    AND NOT EXISTS (SELECT 1 FROM chien_dich_tv_dau d WHERE d.chien_dich_id = c.id) ORDER BY c.tao_luc DESC`).all<{ id: string }>()
  const can = (r.results ?? []).map((x) => String(x.id)).filter((id) => !((loiGanDay.get(id) ?? 0) > nowMs)).slice(0, toiDa)
  let lap = 0, loi = 0
  const luc = new Date(nowMs).toISOString()
  for (const id of can) {
    try {
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM chien_dich_tv WHERE chien_dich_id = ?1 AND sbd NOT IN (SELECT j.value FROM chien_dich c, json_each(${MANG}) j WHERE c.id = ?1 AND j.type = 'text')`).bind(id),
        env.DB.prepare(`INSERT OR IGNORE INTO chien_dich_tv (sbd, chien_dich_id) SELECT j.value, c.id FROM chien_dich c, json_each(${MANG}) j WHERE c.id = ?1 AND j.type = 'text'`).bind(id),
        env.DB.prepare(`INSERT INTO chien_dich_tv_dau (chien_dich_id, luc) SELECT ?1, ?2 WHERE EXISTS (SELECT 1 FROM chien_dich WHERE id = ?1)
          ON CONFLICT(chien_dich_id) DO UPDATE SET luc = excluded.luc`).bind(id, luc),
      ])
      lap++
    } catch (e) {
      loi++
      loiGanDay.set(id, nowMs + 30 * 60_000)
      console.error('[chien-dich-tv] lập chỉ mục lỗi', id, e)
    }
  }
  return { lap, loi }
}
