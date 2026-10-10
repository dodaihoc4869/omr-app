// AI ĐÃ LÀM SAI CÂU NÀY (thầy 05/10: nút X trên tờ chiếu — "hiển thị ra toàn bộ học sinh đã làm sai câu đó, giờ nào, ca nào, làm trong bao lâu").
// Lệnh thầy `POST /gv/ai-sai-cau {qids: string[]}` (các bản cùng nội dung của MỘT câu; ≤ 20). CHỈ ĐỌC sổ `su_kien_hoc`:
//   · lượt TỰ LÀM sai (ket_qua = 0, hoặc bỏ trống ở ca thi), mọi kênh, kể cả câu song sinh (`<qid>~ss0..3`); bỏ sự kiện "đọc lời giải";
//   · mỗi lượt: em · lúc · nơi ("Ca <tên ca>" / Đoàn / Bi-a / Lên bảng / Đầu giờ / BTVN…) · số giây làm. THỨ TỰ (thầy 09/10 "hiển thị cả số giây
//     từng làm câu đó", không bịa): cột `giay` của sổ > 0 ⇒ `raw_json.ms` máy em đo (> 0, làm tròn giây, tối thiểu 1) ⇒ ca thi: `chi_tiet_cau.giay`
//     ⇒ lượt game cũ không đo: ƯỚC TÍNH (`uocTinh`, `giayUocTinhGame`) ⇒ còn lại null;
//   · xếp theo em (tên), trong một em mới trước; tối đa 300 lượt. Chỉ thầy (mã bí mật). Đọc theo chỉ mục `idx_skh_qid` (migration-su-kien-hoc-qid-0510.sql).
import type { Env } from './kieu'
import { loaiGameCua } from './dau-gio'
import { cacQidSongSinh } from './loi-hoc-luat'
import { tenNguonNgan } from '../../src/lib/dau-gio'

type Row = Record<string, unknown>
const str = (x: unknown) => (x == null ? '' : String(x)).trim()
export const TOI_DA_LUOT_AI_SAI = 300

/** `uocTinh` = số giây ƯỚC TÍNH (lượt game CŨ, sổ không có `raw_json.ms` — lấy khoảng cách từ lần trả lời trước / lúc mở lượt tới lần này). Vắng = số đo thật / null. */
export interface LuotSai { sbd: string; ten: string; luc: string; noi: string; giay: number | null; uocTinh?: boolean }

/** Khoảng cách quá 15 phút ⇒ coi là em rời máy, KHÔNG đoán. */
export const TRAN_GIAY_UOC_TINH = 900

/** Giây ĐO THẬT của một lượt sổ: cột `giay` (> 0) trước, rồi `raw_json.ms` (> 0, làm tròn giây, tối thiểu 1). Không có ⇒ null (không đoán). */
export function giayDoCuaLuot(giay: unknown, ms: unknown): number | null {
  const g = giay === null || giay === undefined || giay === '' ? NaN : Number(giay)
  if (Number.isFinite(g) && g > 0) return Math.max(1, Math.round(g))
  const m = ms === null || ms === undefined || ms === '' ? NaN : Number(ms)
  if (Number.isFinite(m) && m > 0) return Math.max(1, Math.round(m / 1000))
  return null
}

/** Nơi làm của lượt ca thi: "Ca <tên ca>" (tên đã bắt đầu bằng "Ca " thì giữ); không có tên ⇒ "Ca kiểm tra". */
export const noiCuaCa = (tenCa: string): string => (tenCa ? (/^ca\s/i.test(tenCa) ? tenCa : `Ca ${tenCa}`) : 'Ca kiểm tra')

/** Dòng `chi_tiet_cau` của các lượt ca thi (đáp án em chọn + số giây) — MỘT truy vấn lô (chỉ mục `idx_ctc_em`).
 *  Khoá `${maCa}|${sbd}|${qid}|${lanThu}`, kèm khoá lần bất kỳ `${maCa}|${sbd}|${qid}|*` (lần lớn nhất) cho dòng sổ thiếu số lần. */
export async function chiTietCauCuaLuot(
  env: Env,
  maCa: readonly string[],
  sbd: readonly string[],
  qids?: readonly string[],
): Promise<Map<string, { chon: string | null; giay: number | null }>> {
  const ra = new Map<string, { chon: string | null; giay: number | null; lan: number }>()
  const ca = [...new Set(maCa.filter(Boolean))], em = [...new Set(sbd.filter(Boolean))]
  if (!ca.length || !em.length) return ra
  const locQid = qids && qids.length ? ' AND qid IN (SELECT value FROM json_each(?3))' : ''
  const bind = [JSON.stringify(ca), JSON.stringify(em), ...(locQid ? [JSON.stringify([...new Set(qids)])] : [])]
  const r = await env.DB.prepare(`SELECT ma_ca, sbd, qid, lan_thu, dap_an_chon, giay FROM chi_tiet_cau
      WHERE ma_ca IN (SELECT value FROM json_each(?1)) AND sbd IN (SELECT value FROM json_each(?2))${locQid}`).bind(...bind).all<Row>()
  for (const x of r.results ?? []) {
    const g = Number(x.giay)
    const chon = str(x.dap_an_chon)
    const v = { chon: chon ? chon.slice(0, 40) : null, giay: Number.isFinite(g) && g > 0 ? Math.max(1, Math.round(g)) : null, lan: Number(x.lan_thu) || 1 }
    const goc = `${str(x.ma_ca)}|${str(x.sbd)}|${str(x.qid)}`
    ra.set(`${goc}|${v.lan}`, v)
    const cu = ra.get(`${goc}|*`)
    if (!cu || v.lan >= cu.lan) ra.set(`${goc}|*`, v)
  }
  return ra
}

/**
 * GIÂY ƯỚC TÍNH cho lượt game KHÔNG có số đo (thầy 05/10: "chỗ làm trong chưa hiển thị"; lượt có `raw_json.ms` dùng số đo — `giayDoCuaLuot`): mỗi lần trả lời có mốc
 * `at` chính xác ⇒ giây ≈ at(lần này) − at(lần trả lời liền trước trong cùng lượt) (câu đầu lượt: − lúc mở lượt). Ngoài 1..900 giây ⇒ null.
 * Khoá: `${session}|${ms}` (ms = mốc trả lời, cũng là `luc` của sự kiện sổ). Dòng `game_v2_attempt.json` là KẾT QUẢ trả về em (`{attempt:{at,…},…}`)
 * ⇒ mốc nằm ở `$.attempt.at`. Một truy vấn lượt + một truy vấn các lần trả lời.
 */
export async function giayUocTinhGame(env: Env, dong: readonly { sbd: string; phien: string }[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  const phien = [...new Set(dong.map((x) => x.phien).filter(Boolean))]
  if (!phien.length) return ra
  const sbd = [...new Set(dong.map((x) => x.sbd))]
  const [rS, rA] = await env.DB.batch([
    env.DB.prepare("SELECT id, json_extract(json, '$.created') AS tao FROM game_v2_session WHERE id IN (SELECT value FROM json_each(?))").bind(JSON.stringify(phien)),
    env.DB.prepare("SELECT session, COALESCE(json_extract(json, '$.attempt.at'), json_extract(json, '$.at')) AS at FROM game_v2_attempt WHERE sbd IN (SELECT value FROM json_each(?1)) AND session IN (SELECT value FROM json_each(?2))").bind(JSON.stringify(sbd), JSON.stringify(phien)),
  ])
  const tao = new Map(((rS?.results ?? []) as Row[]).map((x) => [str(x.id), Number(x.tao)]))
  const theoPhien = new Map<string, number[]>()
  for (const x of (rA?.results ?? []) as Row[]) {
    const at = Number(x.at)
    if (Number.isFinite(at)) theoPhien.set(str(x.session), [...(theoPhien.get(str(x.session)) ?? []), at])
  }
  for (const [p, ds] of theoPhien) {
    ds.sort((a, b) => a - b)
    ds.forEach((at, i) => {
      const truoc = i > 0 ? ds[i - 1]! : tao.get(p)
      if (truoc === undefined || !Number.isFinite(truoc)) return
      const g = Math.round((at - truoc) / 1000)
      if (g >= 1 && g <= TRAN_GIAY_UOC_TINH) ra.set(`${p}|${at}`, g)
    })
  }
  return ra
}

export async function aiSaiCau(env: Env, b: Row): Promise<Row> {
  const qids = [...new Set((Array.isArray(b.qids) ? b.qids : [b.qid]).map(str).filter((q) => q && q.length <= 120))].slice(0, 20)
  if (!qids.length) return { ok: false, error: 'Thiếu mã câu.' }
  // Bản mới đọc thêm `raw_json.ms` (máy em đo giờ làm câu); D1 cũ thiếu cột chuẩn ⇒ lùi câu cột gốc.
  const sql = (moi: boolean) => `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.lan, s.giay, s.luc, d.ho_ten AS ten, c.ten_ca AS ten_ca${moi ? ", CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.ms') END AS ms" : ''}
      FROM su_kien_hoc s LEFT JOIN danh_sach d ON d.sbd = s.sbd LEFT JOIN ca c ON s.nguon = 'thi' AND c.ma_ca = s.ma_nguon
     WHERE s.qid IN (SELECT value FROM json_each(?1))
       AND (s.ket_qua = 0 OR (s.ket_qua IS NULL AND s.nguon = 'thi'))
       ${moi ? "AND COALESCE(s.purpose, '') <> 'xem_loi_giai'" : ''}
     ORDER BY s.luc DESC LIMIT ${TOI_DA_LUOT_AI_SAI + 1}`
  // Câu gốc + mọi câu song sinh (`~ss0` … `~ss3`, `cacQidSongSinh`) — danh sách đúng, để đọc theo chỉ mục (không LIKE).
  const bind = [JSON.stringify(qids.flatMap(cacQidSongSinh))]
  let rows: Row[]
  try { rows = (await env.DB.prepare(sql(true)).bind(...bind).all<Row>()).results ?? [] } catch {
    rows = (await env.DB.prepare(sql(false)).bind(...bind).all<Row>()).results ?? []
  }
  const conNua = rows.length > TOI_DA_LUOT_AI_SAI
  rows = rows.slice(0, TOI_DA_LUOT_AI_SAI)
  // Giây đo thật (cột sổ ⇒ raw ms); thiếu thì ca thi tra `chi_tiet_cau.giay`, game cũ ƯỚC TÍNH — chỉ tra cho đúng các lượt còn thiếu.
  const doThat = rows.map((x) => giayDoCuaLuot(x.giay, x.ms))
  const thieu = rows.filter((_, i) => doThat[i] === null)
  const thiThieu = thieu.filter((x) => str(x.nguon) === 'thi')
  const dongGame = rows.filter((x) => str(x.nguon) === 'game').map((x) => ({ sbd: str(x.sbd), phien: str(x.ma_nguon) }))
  const gameThieu = thieu.filter((x) => str(x.nguon) === 'game').map((x) => ({ sbd: str(x.sbd), phien: str(x.ma_nguon) }))
  const [loai, uoc, ct] = await Promise.all([
    loaiGameCua(env, dongGame.map((x) => x.phien)).catch(() => new Map<string, 'doan' | 'bia' | 'dao'>()),
    giayUocTinhGame(env, gameThieu).catch(() => new Map<string, number>()),
    chiTietCauCuaLuot(env, thiThieu.map((x) => str(x.ma_nguon)), thiThieu.map((x) => str(x.sbd)), thiThieu.map((x) => str(x.qid))).catch(() => new Map<string, { chon: string | null; giay: number | null }>()),
  ])
  const ds: LuotSai[] = rows.map((x, i) => {
    const nguon = str(x.nguon)
    const noi = nguon === 'thi' ? noiCuaCa(str(x.ten_ca)) : tenNguonNgan(nguon, nguon === 'game' ? (loai.get(str(x.ma_nguon)) ?? 'dao') : null)
    const chung = { sbd: str(x.sbd), ten: str(x.ten) || str(x.sbd), luc: str(x.luc), noi }
    const g = doThat[i]
    if (g !== null && g !== undefined) return { ...chung, giay: g }
    if (nguon === 'thi') {
      const k = `${str(x.ma_nguon)}|${str(x.sbd)}|${str(x.qid)}`
      const c = ct.get(`${k}|${Number(x.lan) || 1}`) ?? ct.get(`${k}|*`)
      return { ...chung, giay: c?.giay ?? null }
    }
    const u = nguon === 'game' ? uoc.get(`${str(x.ma_nguon)}|${Date.parse(str(x.luc))}`) : undefined
    return { ...chung, giay: u ?? null, ...(u !== undefined ? { uocTinh: true } : {}) }
  })
  ds.sort((a, b2) => a.ten.localeCompare(b2.ten, 'vi') || (a.luc < b2.luc ? 1 : a.luc > b2.luc ? -1 : 0))
  return { ok: true, ds, soEm: new Set(ds.map((x) => x.sbd)).size, conNua }
}
