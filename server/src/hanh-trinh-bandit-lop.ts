// BẢNG BANDIT CẢ LỚP CỘNG SẴN (12/11 tối — H3 đợt 3 giảm chi phí D1, thầy «chỉ 5 đô một tháng»). Cùng khuôn với cạnh lớp của G1 (hanh-trinh-canh-lop.ts).
// Số đo D1 thật 24 giờ tới 12/11 21:24 VN: câu cộng «đúng / sai theo (ngữ cảnh, cách cứu)» của `docTruocDongCo` (hanh-trinh-dong-co.ts) 13.760 lượt × ~1.048 hàng
// ≈ 14,4 triệu hàng đọc/ngày — số CẢ LỚP 90 ngày, đổi rất chậm, mà mỗi lần lập kế hoạch cộng lại từ đầu.
// Nay: cron mỗi phút (index.ts `scheduled`, cạnh cron cạnh lớp) đọc MỘT dòng mốc; mốc cũ ≥ 30 phút (khung học 18–24h VN) / ≥ 120 phút (ngoài khung) ⇒ dựng
// lại `hanh_trinh_v4_bandit_lop` trong MỘT lô nguyên khối có giành mốc (hai cron chồng nhau thì lô sau không giành được nên không làm gì).
// Lệnh lập kế hoạch đọc bảng nhỏ này (vài chục dòng) thay cho cộng lại. Lệch số liệu: tối đa một chu kỳ dựng (30 phút trong khung học, 120 phút ngoài khung) —
// lượt can thiệp vừa chấm sau lúc dựng chưa vào số đếm, cửa sổ 90 ngày tính từ lúc dựng. Bảng chưa dựng / mốc quá 6 giờ (cron hỏng) ⇒ câu cũ y nguyên,
// CÙNG MỘT lượt D1 (UNION ALL có điều kiện hằng — nhánh không dùng không đọc hàng nào).
import type { Env, D1Result } from './kieu'
import type { BangBandit } from './bandit'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'
import { chuKyDungCanhLop, HAN_DUNG_CANH_LOP_MS } from './hanh-trinh-canh-lop'

/** Cửa sổ số liệu bandit: 90 ngày (như câu cũ `now − 90 ngày`). */
export const CUA_SO_BANDIT_MS = 90 * 86_400_000
/** Mốc dựng quá hạn này ⇒ lệnh lập kế hoạch lùi về câu cộng cũ. */
export const HAN_DUNG_BANDIT_MS = HAN_DUNG_CANH_LOP_MS
/** Chu kỳ dựng lại: như cạnh lớp (khung học 30 phút, ngoài khung 120 phút). */
export const chuKyDungBandit = chuKyDungCanhLop

/** Câu cộng CŨ (y nguyên trong `docTruocDongCo` trước 12/11). ?1 = now − 90 ngày. */
export const SQL_BANDIT_CU = `SELECT context,cach,SUM(CASE WHEN ket_qua=1 THEN 1 ELSE 0 END) dung,SUM(CASE WHEN ket_qua=0 THEN 1 ELSE 0 END) sai FROM hanh_trinh_v4_can_thiep WHERE do_luc>=? AND ket_qua IS NOT NULL GROUP BY context,cach`
/** Dựng: cùng điều kiện câu cũ tại mốc ?1 (chỉ khi lô này vừa giành mốc). */
export const SQL_DUNG_BANDIT = `INSERT INTO hanh_trinh_v4_bandit_lop(context,cach,dung,sai) SELECT context,cach,SUM(CASE WHEN ket_qua=1 THEN 1 ELSE 0 END),SUM(CASE WHEN ket_qua=0 THEN 1 ELSE 0 END) FROM hanh_trinh_v4_can_thiep WHERE do_luc>=?1-${CUA_SO_BANDIT_MS} AND ket_qua IS NOT NULL AND (SELECT luc FROM hanh_trinh_v4_bandit_lop_moc WHERE id=1)=?1 GROUP BY context,cach`

const MOC_TUOI = 'SELECT 1 FROM hanh_trinh_v4_bandit_lop_moc WHERE id=1 AND luc>=?1'
/**
 * Câu đọc của lệnh lập kế hoạch — MỘT lượt D1. ?1 mốc tươi tối thiểu (now − 6 giờ), ?2 mốc cửa sổ câu cũ (now − 90 ngày).
 *  - nhánh 2: một dòng báo «bảng đã dựng và còn tươi»; nhánh 1: số cộng sẵn (chỉ khi đã dựng); nhánh 0: câu cũ y nguyên (chỉ khi CHƯA dựng / quá hạn).
 * Bắt đầu bằng SELECT (lớp gộp đọc theo lượt chỉ coi câu `SELECT` là câu đọc). Xếp (context, cach) như GROUP BY của câu cũ.
 */
export const SQL_BANDIT_DOC = `SELECT nguon,context,cach,dung,sai FROM (SELECT 2 nguon,NULL context,NULL cach,NULL dung,NULL sai FROM hanh_trinh_v4_bandit_lop_moc WHERE id=1 AND luc>=?1
UNION ALL SELECT 1,context,cach,dung,sai FROM hanh_trinh_v4_bandit_lop WHERE EXISTS(${MOC_TUOI})
UNION ALL SELECT 0,context,cach,SUM(CASE WHEN ket_qua=1 THEN 1 ELSE 0 END),SUM(CASE WHEN ket_qua=0 THEN 1 ELSE 0 END) FROM hanh_trinh_v4_can_thiep WHERE do_luc>=?2 AND ket_qua IS NOT NULL AND NOT EXISTS(${MOC_TUOI}) GROUP BY context,cach) ORDER BY nguon DESC,context,cach`

/** Bảng bandit cả lớp — cùng hình kết quả câu cũ (`results` = các dòng context, cach, dung, sai). */
export async function docBanditLop(env: Env, now: number): Promise<D1Result<BangBandit>> {
  const r = (await env.DB.prepare(SQL_BANDIT_DOC).bind(now - HAN_DUNG_BANDIT_MS, now - CUA_SO_BANDIT_MS).all<{ nguon: number } & BangBandit>()).results ?? []
  const results: BangBandit[] = []
  for (const x of r) if (Number(x.nguon) !== 2) results.push({ context: x.context, cach: x.cach, dung: x.dung, sai: x.sai })
  return { results, success: true, meta: {} } as unknown as D1Result<BangBandit>
}

/** Cron mỗi phút: một câu đọc mốc; cũ ⇒ dựng lại trong MỘT lô nguyên khối có giành mốc. Trả `dung=true` khi lượt này đã dựng. */
export async function dungBanditLopNeuCu(env: Env, now: number): Promise<{ dung: boolean; soDong?: number }> {
  await chayDdlMotLan(env, 'hanh_trinh_v4', SQL_DONG_CO_HANH_TRINH)
  const chuKy = chuKyDungBandit(now)
  const moc = await env.DB.prepare('SELECT luc FROM hanh_trinh_v4_bandit_lop_moc WHERE id=1').first<{ luc: number }>()
  if (moc && now >= Number(moc.luc) && now - Number(moc.luc) < chuKy) return { dung: false }
  const r = await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO hanh_trinh_v4_bandit_lop_moc(id,luc) VALUES(1,0)'),
    env.DB.prepare('UPDATE hanh_trinh_v4_bandit_lop_moc SET luc=?1 WHERE id=1 AND (luc<=?1-?2 OR luc>?1)').bind(now, chuKy),
    env.DB.prepare('DELETE FROM hanh_trinh_v4_bandit_lop WHERE (SELECT luc FROM hanh_trinh_v4_bandit_lop_moc WHERE id=1)=?1').bind(now),
    env.DB.prepare(SQL_DUNG_BANDIT).bind(now),
  ])
  const gianh = Number(r[1]?.meta?.changes ?? 0) > 0
  return gianh ? { dung: true, soDong: Number(r[3]?.meta?.changes ?? 0) } : { dung: false }
}
