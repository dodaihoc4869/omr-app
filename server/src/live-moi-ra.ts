// SỔ «MỜI RA KHỎI LỚP» CỦA BUỔI LIVE (thầy 13/11, luật rời màn — src/lib/bpu/phong-luat.ts). Văn phòng trực live (Javis DDH) cần biết NGAY em nào vừa bị
// mời ra / bị thầy từ chối / được vào lại để nhắn Zalo cho phụ huynh ⇒ phòng ghi từng việc vào bảng `live_moi_ra` (CHỈ-THÊM, DDL lúc chạy) và văn phòng đọc
// qua `POST /gv/bpu/moi-ra` (mã GV như các lệnh văn phòng khác). App KHÔNG tự nhắn phụ huynh. Hợp đồng: docs/hop-dong-live-moi-ra-van-phong-1311.md.
import type { SuKienLuat } from '../../src/lib/bpu/phong-luat'
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'

type Row = Record<string, unknown>
const num = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x))

const SQL_MOI_RA = [
  `CREATE TABLE IF NOT EXISTS live_moi_ra (stt INTEGER PRIMARY KEY AUTOINCREMENT, ma TEXT NOT NULL UNIQUE, buoi_id TEXT NOT NULL, phong TEXT NOT NULL DEFAULT '',
     khoi INTEGER NOT NULL DEFAULT 0, sbd TEXT NOT NULL, ten TEXT NOT NULL DEFAULT '', loai TEXT NOT NULL, lan INTEGER NOT NULL DEFAULT 0, n INTEGER NOT NULL DEFAULT 0, luc INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_live_moi_ra_buoi ON live_moi_ra(buoi_id, stt)`,
] as const
const damBao = (env: Env) => chayDdlMotLan(env, 'live_moi_ra_v1', SQL_MOI_RA)

export interface BuoiMoiRa { buoiId: string; phong: string; khoi: number; ten: (sbd: string) => string }
/** Phòng gọi (ngoài đường nóng, `waitUntil`) mỗi khi luật vừa mời ra / từ chối / cho vào lại một em. Trùng mã ⇒ bỏ qua (gọi lại không nhân đôi). */
export async function ghiMoiRa(env: Env, b: BuoiMoiRa, ds: readonly SuKienLuat[]): Promise<number> {
  if (!ds.length || !env.DB) return 0
  await damBao(env)
  const SQL = 'INSERT OR IGNORE INTO live_moi_ra (ma, buoi_id, phong, khoi, sbd, ten, loai, lan, n, luc) VALUES (?,?,?,?,?,?,?,?,?,?)'
  await env.DB.batch(ds.map((x) => env.DB.prepare(SQL).bind(`${b.buoiId}|${x.sbd}|${x.loai}|${x.luc}`, b.buoiId, b.phong, b.khoi, x.sbd, b.ten(x.sbd), x.loai, x.lan ?? 0, x.n ?? 0, x.luc)))
  return ds.length
}

const gioVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(11, 16)
const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
/** `POST /gv/bpu/moi-ra { sau?, toiDa?, buoiId? }` — văn phòng đọc các việc MỚI hơn mốc `sau` (số thứ tự của dòng cuối đã đọc; 0 / bỏ trống = 24 giờ gần nhất).
 *  Trả `{ ok, ds: [{ stt, loai, sbd, ten, lop, lan, n, luc, gio, ngay, buoiId, phong, khoi }], moc }`; lần sau gửi `sau = moc`. Một lệnh đọc, không ghi. */
export async function gvLiveMoiRa(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sau = Math.max(0, Math.floor(num(b.sau))), toiDa = Math.max(1, Math.min(200, num(b.toiDa) || 50)), buoi = str(b.buoiId).trim()
  let dong: Row[] = []
  try {
    dong = (await env.DB.prepare(`SELECT m.stt, m.buoi_id, m.phong, m.khoi, m.sbd, m.ten, m.loai, m.lan, m.n, m.luc, h.ho_ten, COALESCE(NULLIF(h.ten_lop, ''), h.lop, '') AS lop
      FROM live_moi_ra m LEFT JOIN hoc_sinh h ON h.sbd = m.sbd WHERE m.stt > ?1 AND (?1 > 0 OR m.luc >= ?2) AND (?3 = '' OR m.buoi_id = ?3) ORDER BY m.stt LIMIT ?4`)
      .bind(sau, nowMs - 86_400_000, buoi, toiDa).all<Row>()).results ?? []
  } catch (e) { if (!/no such table/i.test(e instanceof Error ? e.message : String(e))) throw e } // chưa buổi nào có em bị mời ra ⇒ chưa có bảng
  const ds = dong.map((r) => ({
    stt: num(r.stt), loai: str(r.loai), sbd: str(r.sbd), ten: str(r.ho_ten) || str(r.ten), lop: str(r.lop), lan: num(r.lan), n: num(r.n),
    luc: num(r.luc), gio: gioVn(num(r.luc)), ngay: ngayVn(num(r.luc)), buoiId: str(r.buoi_id), phong: str(r.phong), khoi: num(r.khoi),
  }))
  return { ok: true, ds, moc: ds.length ? ds[ds.length - 1]!.stt : sau }
}
