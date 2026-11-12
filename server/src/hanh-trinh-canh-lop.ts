// CẠNH TIÊN QUYẾT CẢ LỚP CỘNG SẴN (12/11 tối — G1 giảm chi phí D1, thầy «chỉ 5 đô một tháng»).
// Số đo D1 thật 24 giờ tới 12/11 19:08 VN: câu cộng cả lớp của `docCanhLop` (hanh-trinh-dong-co.ts) 11.606 lượt × ~14.088 hàng ≈ 163,5 triệu hàng đọc/ngày —
// đệm theo isolate (10–30 phút) trượt gần hết vì Cloudflare mở nhiều isolate.
// Nay: cron mỗi phút (index.ts `scheduled`) đọc MỘT dòng mốc; mốc cũ ≥ 30 phút (khung học 18–24h VN) / ≥ 120 phút (ngoài khung) ⇒ dựng lại bảng
// `hanh_trinh_v4_canh_lop` bằng MỘT lô nguyên khối: giành mốc (UPDATE có điều kiện) ⇒ xoá ⇒ INSERT…SELECT GROUP BY — hai cron chồng nhau thì lô sau
// không giành được mốc nên không làm gì. Lệnh lập kế hoạch đọc bảng nhỏ này theo `den IN (...)` thay cho cộng lại từ đầu.
// GIỮ ĐÚNG: bảng chỉ giữ cạnh đạt ngưỡng `CANH_HOC_TOI_THIEU` (≥ 20 em, ≥ 30 lượt có / chưa có nền) — người dùng DUY NHẤT của cạnh lớp là `canhDangHoc`,
// vốn bỏ mọi cạnh dưới ngưỡng ⇒ `learned` / `soCanhHoc` y hệt câu cũ tại cùng mốc (cửa sổ 7 ngày tính từ lúc dựng). Lệch số liệu: tối đa 30 phút trong khung
// học, 120 phút ngoài khung (trước: tối đa 30 / 10 phút theo isolate). Bảng chưa dựng / mốc quá 6 giờ (cron hỏng) ⇒ câu cũ, CÙNG MỘT lượt D1 (UNION ALL có
// điều kiện hằng — SQLite xét điều kiện trước vòng quét nên nhánh không dùng không đọc hàng nào).
import type { Env } from './kieu'
import type { CanhHoc } from './do-thi-tien-quyet'
import { CANH_HOC_TOI_THIEU } from './do-thi-tien-quyet'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'

const NGAY_MS = 86_400_000
/** Cửa sổ số liệu cả lớp: 7 ngày tính từ lúc dựng (như câu cũ: tính từ lúc nhớ đệm). */
export const CUA_SO_CANH_LOP_MS = 7 * NGAY_MS
/** Mốc dựng quá hạn này (cron hỏng / dừng) ⇒ lệnh lập kế hoạch lùi về câu cộng cũ. */
export const HAN_DUNG_CANH_LOP_MS = 6 * 3_600_000
/** Chu kỳ dựng lại: khung học 18:00–23:59 VN 30 phút; ngoài khung 120 phút (ít em lập kế hoạch, mỗi lần dựng quét cả bảng cạnh). */
export const chuKyDungCanhLop = (now: number): number => new Date(now + 7 * 3_600_000).getUTCHours() >= 18 ? 1_800_000 : 7_200_000

const M = CANH_HOC_TOI_THIEU
/** Câu cộng CŨ (y nguyên `SQL_CANH_LOP` trước 12/11) — ?1 danh sách `den` (JSON), ?2 mốc cửa sổ. */
export const SQL_CANH_LOP_CU = `SELECT tu,den,SUM(n_co) nCo,SUM(dung_co) dungCo,SUM(n_chua) nChua,SUM(dung_chua) dungChua,COUNT(DISTINCT sbd) soEm FROM hanh_trinh_v4_canh WHERE den IN (SELECT value FROM json_each(?)) AND cap_nhat_luc>=? AND n_co+n_chua>0 GROUP BY tu,den`
/** Phần cộng dùng khi dựng: cùng điều kiện câu cũ trên MỌI `den`, thêm HAVING đúng ngưỡng của `canhDangHoc`. ?1 = lúc dựng. */
export const SQL_DUNG_CANH_LOP = `INSERT INTO hanh_trinh_v4_canh_lop(tu,den,n_co,dung_co,n_chua,dung_chua,so_em) SELECT tu,den,SUM(n_co),SUM(dung_co),SUM(n_chua),SUM(dung_chua),COUNT(DISTINCT sbd) FROM hanh_trinh_v4_canh WHERE cap_nhat_luc>=?1-${CUA_SO_CANH_LOP_MS} AND n_co+n_chua>0 AND (SELECT luc FROM hanh_trinh_v4_canh_lop_moc WHERE id=1)=?1 GROUP BY tu,den HAVING COUNT(DISTINCT sbd)>=${M.soEm} AND SUM(n_co)>=${M.nCo} AND SUM(n_chua)>=${M.nChua}`

/**
 * Câu đọc của lệnh lập kế hoạch — MỘT lượt D1 trong mọi trường hợp. ?1 danh sách `den` (JSON), ?2 mốc tươi tối thiểu (now − 6 giờ), ?3 mốc cửa sổ câu cũ.
 *  - nhánh 2: một dòng báo «bảng đã dựng và còn tươi» (kể cả khi bảng không có cạnh nào của các `den` này);
 *  - nhánh 1: cạnh cộng sẵn (SEARCH theo chỉ mục khoá chính (den,tu)) — chỉ khi đã dựng;
 *  - nhánh 0: câu cũ y nguyên — chỉ khi CHƯA dựng / quá hạn.
 */
const MOC_TUOI = 'SELECT 1 FROM hanh_trinh_v4_canh_lop_moc WHERE id=1 AND luc>=?2'
// Câu PHẢI bắt đầu bằng SELECT (không dùng WITH): lớp gộp đọc theo lượt (doc-d1-theo-luot.ts) chỉ nhận câu `SELECT` là câu đọc — câu khác bị coi là ghi
// (chờ rào ghi, không đi chung lô đọc ⇒ thêm một đợt chờ D1).
export const SQL_CANH_LOP_DOC = `SELECT 2 nguon,NULL tu,NULL den,NULL nCo,NULL dungCo,NULL nChua,NULL dungChua,NULL soEm FROM hanh_trinh_v4_canh_lop_moc WHERE id=1 AND luc>=?2
UNION ALL SELECT 1,tu,den,n_co,dung_co,n_chua,dung_chua,so_em FROM hanh_trinh_v4_canh_lop WHERE den IN (SELECT value FROM json_each(?1)) AND EXISTS(${MOC_TUOI})
UNION ALL SELECT 0,tu,den,SUM(n_co),SUM(dung_co),SUM(n_chua),SUM(dung_chua),COUNT(DISTINCT sbd) FROM hanh_trinh_v4_canh WHERE den IN (SELECT value FROM json_each(?1)) AND cap_nhat_luc>=?3 AND n_co+n_chua>0 AND NOT EXISTS(${MOC_TUOI}) GROUP BY tu,den`

type DongDoc = { nguon: number } & CanhHoc
/** Đọc cạnh lớp: `tong=true` ⇒ lấy từ bảng cộng sẵn (đã lọc ngưỡng); `tong=false` ⇒ câu cũ (đầy đủ, nơi gọi được nhớ đệm như trước). */
export async function docCanhLopMotLuot(env: Env, dens: readonly string[], now: number, mocCu: number): Promise<{ tong: boolean; ds: CanhHoc[] }> {
  const r = (await env.DB.prepare(SQL_CANH_LOP_DOC).bind(JSON.stringify(dens), now - HAN_DUNG_CANH_LOP_MS, mocCu).all<DongDoc>()).results ?? []
  const tong = r.some((x) => Number(x.nguon) === 2)
  const ds: CanhHoc[] = []
  for (const x of r) if (Number(x.nguon) !== 2) ds.push({ tu: x.tu, den: x.den, nCo: x.nCo, dungCo: x.dungCo, nChua: x.nChua, dungChua: x.dungChua, soEm: x.soEm })
  return { tong, ds }
}

/** Cron mỗi phút: một câu đọc mốc; cũ ⇒ dựng lại trong MỘT lô nguyên khối có giành mốc. Trả `dung=true` khi lượt này đã dựng. */
export async function dungCanhLopNeuCu(env: Env, now: number): Promise<{ dung: boolean; soCanh?: number }> {
  await chayDdlMotLan(env, 'hanh_trinh_v4', SQL_DONG_CO_HANH_TRINH)
  const chuKy = chuKyDungCanhLop(now)
  const moc = await env.DB.prepare('SELECT luc FROM hanh_trinh_v4_canh_lop_moc WHERE id=1').first<{ luc: number }>()
  if (moc && now >= Number(moc.luc) && now - Number(moc.luc) < chuKy) return { dung: false }
  const r = await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO hanh_trinh_v4_canh_lop_moc(id,luc) VALUES(1,0)'),
    // Giành mốc: chỉ khi mốc cũ ≥ chu kỳ (hoặc ở tương lai do lệch đồng hồ). Lô khác vừa dựng ⇒ không giành được ⇒ hai câu dưới không làm gì.
    env.DB.prepare('UPDATE hanh_trinh_v4_canh_lop_moc SET luc=?1 WHERE id=1 AND (luc<=?1-?2 OR luc>?1)').bind(now, chuKy),
    env.DB.prepare('DELETE FROM hanh_trinh_v4_canh_lop WHERE (SELECT luc FROM hanh_trinh_v4_canh_lop_moc WHERE id=1)=?1').bind(now),
    env.DB.prepare(SQL_DUNG_CANH_LOP).bind(now),
  ])
  const gianh = Number(r[1]?.meta?.changes ?? 0) > 0
  return gianh ? { dung: true, soCanh: Number(r[3]?.meta?.changes ?? 0) } : { dung: false }
}
