// BONG BÓNG CHAT «A.I ĐỖ ĐẠI HỌC» (thầy 24/10: «bong bóng chat a.i DDH gắn với văn phòng Javis DDH… giống hiện tại của văn phòng… ẩn ở bài kiểm tra»;
// đặc tả docs/DAC-TA-AI-DDH-APP-HS-2410.md, bản vẽ docs/ban-ve-ai-ddh-2410/). Máy chủ app KHÔNG tự giải: tin em vào HÀNG CHỜ; văn phòng (Mac mini, chỉ gọi
// ra ngoài) hỏi hàng chờ bằng mã GV, giải đúng luồng Zalo của mình (giai_bai / de_nhanh), rồi gửi trả lời về đây.
// Phần app thêm (văn phòng chưa có): khoá khi em đang có ca kiểm tra mở hoặc chặng kiểm tra cá nhân đang chạy; câu khớp kho mà đang được bảo vệ (ca chưa
// công bố, bài còn làm được, kiểm tra cá nhân chưa nộp) ⇒ văn phòng chỉ gợi ý (`/gv/ai-ddh/kiem-cau`); danh sách câu cần tránh khi rút đề (`/gv/ai-ddh/tranh`).
// Bảng CHỈ-THÊM (DDL lúc chạy). Ảnh em gửi cất R2 `ai-ddh/<sbd>/<mã>.jpg`, văn phòng tải qua `/gv/ai-ddh/anh` (mã GV), không có địa chỉ công khai.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { chayDdlMotLan } from './ddl-mot-lan'
import { coCaDangMo } from './ca-dang-mo'
import { protectedQuestions } from './game-v2-bank'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x))
const num = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0

const SQL_AI_DDH = [
  `CREATE TABLE IF NOT EXISTS ai_ddh_tin (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, ben TEXT NOT NULL, chu TEXT NOT NULL DEFAULT '', anh_json TEXT NOT NULL DEFAULT '[]',
     nguon TEXT NOT NULL DEFAULT '', chi_goi_y INTEGER NOT NULL DEFAULT 0, trang_url TEXT NOT NULL DEFAULT '', bo_de_json TEXT NOT NULL DEFAULT '',
     trang_thai TEXT NOT NULL DEFAULT '', tra_loi_cho TEXT NOT NULL DEFAULT '', lay_luc INTEGER NOT NULL DEFAULT 0, luc INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_ddh_em ON ai_ddh_tin(sbd, luc)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_ddh_cho ON ai_ddh_tin(trang_thai, luc)`,
] as const
export const damBaoAiDdh = (env: Env) => chayDdlMotLan(env, 'ai_ddh_v1', SQL_AI_DDH)

/** Trần mỗi em mỗi ngày (giờ VN) — như trần câu bài tập của văn phòng qua Zalo (50 câu thật). */
export const TRAN_TIN_NGAY = 50
/** Văn phòng không hỏi hàng chờ quá ngần này ⇒ «văn phòng đang nghỉ». */
export const VP_NGHI_SAU_MS = 60_000
/** Tin đã lấy mà quá ngần này chưa trả lời ⇒ trả về hàng chờ (văn phòng tắt giữa chừng). */
const LAY_LAI_SAU_MS = 15 * 60_000
const TOI_DA_ANH = 8
/** Số thứ tự ảnh tải trước: 0…15 (em bỏ bớt ảnh rồi chọn thêm ⇒ số không liền nhau). Đường cũ đánh số từ 16. */
const TOI_DA_SO_ANH = 16
const TOI_DA_BYTE_ANH = 3 * 1024 * 1024
const TOI_DA_CHU = 4000

export type CheDoAiDdh = 'tat' | 'thu' | 'bat'
export interface CauHinhAiDdh { cheDo: CheDoAiDdh; lop: string[] }
const KHOA_CH = 'ai_ddh'
const KHOA_VP = 'ai_ddh_vp_luc'

async function docCauHinh(env: Env): Promise<{ ch: CauHinhAiDdh; vpLuc: number }> {
  const r = await env.DB.prepare('SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (?, ?)').bind(KHOA_CH, KHOA_VP).all<Row>().catch(() => ({ results: [] as Row[] }))
  let ch: CauHinhAiDdh = { cheDo: 'tat', lop: [] }
  let vpLuc = 0
  for (const x of r.results ?? []) {
    if (str(x.khoa) === KHOA_CH) {
      try {
        const j = JSON.parse(str(x.gia_tri)) as Partial<CauHinhAiDdh>
        ch = { cheDo: j.cheDo === 'bat' || j.cheDo === 'thu' ? j.cheDo : 'tat', lop: Array.isArray(j.lop) ? j.lop.map(str).filter(Boolean).slice(0, 50) : [] }
      } catch { /* hỏng ⇒ tắt */ }
    } else vpLuc = num(x.gia_tri)
  }
  return { ch, vpLuc }
}
const SQL_GHI_CH = 'INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc'
const ghiCauHinh = (env: Env, khoa: string, v: string) => env.DB.prepare(SQL_GHI_CH).bind(khoa, v, new Date().toISOString()).run()

/** Em có được dùng bong bóng: «bật» = mọi em; «thử» = chỉ lớp trong danh sách. */
export const choEm = (ch: CauHinhAiDdh, lopEm: string, tenLop: string): boolean =>
  ch.cheDo === 'bat' || (ch.cheDo === 'thu' && ch.lop.some((l) => l === lopEm || l === tenLop))

/** Đầu ngày giờ VN (ms) của `nowMs`. */
export const dauNgayVn = (nowMs: number) => { const t = nowMs + 7 * 3600_000; return t - (t % 86_400_000) - 7 * 3600_000 }

/** Em đang làm một chặng kiểm tra cá nhân (chặng mở, chưa chốt, còn hạn). */
async function coChangKtcnMo(env: Env, sbd: string, nowMs: number): Promise<boolean> {
  try {
    const r = await env.DB.prepare(`SELECT 1 AS co FROM kiem_tra_ca_nhan k JOIN kiem_tra_ca_nhan_chang c ON c.bai_id = k.id
      WHERE k.sbd = ? AND k.nop_luc IS NULL AND c.chot_luc IS NULL AND c.bat_dau <= ? AND c.han > ? LIMIT 1`).bind(sbd, nowMs, nowMs).first<Row>()
    return !!r
  } catch { return false }
}

const tinRa = (x: Row) => ({
  id: str(x.id), ben: str(x.ben), chu: str(x.chu), anh: (() => { try { return (JSON.parse(str(x.anh_json) || '[]') as unknown[]).length } catch { return 0 } })(),
  nguon: str(x.nguon), chiGoiY: num(x.chi_goi_y) === 1, trangUrl: str(x.trang_url),
  boDe: (() => { try { return x.bo_de_json ? JSON.parse(str(x.bo_de_json)) : null } catch { return null } })(),
  // 25/10: tin văn phòng mang mã tin em nó trả lời ⇒ máy em tắt «Thầy đang soạn» của đúng tin ấy (lệnh /tin chỉ trả tin MỚI, không trả tin em vừa đổi trạng thái).
  traLoiCho: str(x.tra_loi_cho), trangThai: str(x.trang_thai), luc: num(x.luc),
})

/**
 * TRẢ LỜI NGAY (25/10, thầy: "tốc độ nhắn chậm quá, tối ưu tức thì"): chào hỏi / cảm ơn / «ok, dạ» không cần văn phòng (văn phòng phải lấy hàng chờ rồi
 * hỏi não ~1 phút) ⇒ máy chủ trả luôn. Giọng BẠN BÈ (25/10 thầy: "a.i trong app học sinh xưng hô bạn bè, cho hs thoải mái nói chia sẻ tâm sự"; 25/10 tối: "xưng tôi và bạn"): tôi / bạn; văn phong Thầy nhắn Zalo (25/10: "nhắn tin theo văn phong của tôi"): ngắn, thẳng, bớt nhé / nha, teencode ko / đc. Chỉ khi KHÔNG ảnh, ngắn, không số (câu có số là đề). Thuần — test được.
 */
export function traLoiNgay(chu: string, soAnh: number): string | null {
  if (soAnh > 0) return null
  const s = chu.normalize('NFC').toLowerCase().replace(/[!?.,~:;…"'()*\-_/\\]+/g, ' ').replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!s || s.length > 40 || /\d/.test(chu)) return null
  if (/^(?:(?:em|e)\s+)?(?:xin\s+)?ch[aà]o(?:\s+(?:thầy|thay|ạ|a|ad|anh|chị|bạn|cậu|mọi người))*$|^(?:hi|hello|helo|hey|alo|a lô)(?:\s+(?:thầy|thay|ạ|a|bạn|cậu))*$/.test(s))
    return 'Chào bạn:)) cần gì cứ quăng đây, tôi cân hết: hỏi bài, xin đề, xin câu luyện, tâm sự cũng đc'
  if (/^(?:(?:em|e)\s+)?(?:(?:xin\s+)?c[ảáa]m\s+[ơo]n|thanks?|thank you|tks|thx)(?:\s+(?:thầy|thay|bạn|cậu|ạ|a|nhiều|nhieu|nha|nhé|nhe))*$/.test(s))
    return 'Ko có gì:)) còn gì cứ nhắn tôi'
  if (/^(?:ok|oke|okay|okela|ừ|ừm|uhm|dạ|da|vâng|vang|em hiểu rồi|e hiểu rồi|hiểu rồi)(?:\s+(?:thầy|thay|bạn|cậu|ạ|a|ạ thầy|nha|nhé|rồi))*$/.test(s))
    return 'Ok, có gì nhắn tôi'
  return null
}

async function emCua(env: Env, b: Row): Promise<string> {
  try { return await gameIdentity(env, b) } catch { return '' }
}

/** `POST /hs/ai-ddh/mo {token}` — mở tấm: công tắc, khoá, văn phòng trực/nghỉ, 40 tin gần nhất, lượt còn. Một đợt chờ D1 sau xác thực. */
export async function hsMoAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = await emCua(env, b)
  if (!sbd) return { ok: false, error: 'Em cần đăng nhập lại.' }
  await damBaoAiDdh(env)
  const [{ ch, vpLuc }, hs, ds, caMo, ktcn, dem] = await Promise.all([
    docCauHinh(env),
    env.DB.prepare('SELECT lop, ten_lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<Row>().catch(() => null),
    env.DB.prepare('SELECT * FROM ai_ddh_tin WHERE sbd = ? ORDER BY luc DESC LIMIT 40').bind(sbd).all<Row>(),
    coCaDangMo(env, sbd, nowMs),
    coChangKtcnMo(env, sbd, nowMs),
    env.DB.prepare("SELECT COUNT(*) AS n FROM ai_ddh_tin WHERE sbd = ? AND ben = 'em' AND luc >= ?").bind(sbd, dauNgayVn(nowMs)).first<Row>(),
  ])
  if (!choEm(ch, str(hs?.lop), str(hs?.ten_lop))) return { ok: true, bat: false }
  return {
    ok: true, bat: true,
    khoa: caMo || ktcn ? 'kiem_tra' : null,
    vanPhongTruc: nowMs - vpLuc < VP_NGHI_SAU_MS,
    conLuot: Math.max(0, TRAN_TIN_NGAY - num(dem?.n)), tranLuot: TRAN_TIN_NGAY,
    tin: (ds.results ?? []).reverse().map(tinRa),
  }
}

/** `POST /hs/ai-ddh/tin {token, sau}` — tin mới sau mốc `sau` (ms) + văn phòng trực. Nhẹ: một lệnh đọc theo chỉ mục. */
export async function hsTinAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = await emCua(env, b)
  if (!sbd) return { ok: false, error: 'Em cần đăng nhập lại.' }
  await damBaoAiDdh(env)
  const sau = Math.max(0, num(b.sau))
  const [ds, { vpLuc }] = await Promise.all([
    env.DB.prepare('SELECT * FROM ai_ddh_tin WHERE sbd = ? AND luc > ? ORDER BY luc LIMIT 40').bind(sbd, sau).all<Row>(),
    docCauHinh(env),
  ])
  return { ok: true, vanPhongTruc: nowMs - vpLuc < VP_NGHI_SAU_MS, tin: (ds.results ?? []).map(tinRa) }
}

const b64 = (s: string): Uint8Array | null => {
  try {
    const raw = atob(s.replace(/^data:[^,]*,/, ''))
    const u = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i)
    return u
  } catch { return null }
}

/** `POST /hs/ai-ddh/anh {token, maTin, so, anh: base64}` — TẢI ẢNH TRƯỚC (25/10, thầy: "gửi ảnh lên a.i quá chậm, tối ưu tốc độ tức thì"): máy em tải từng ảnh
 *  ngay lúc chọn, cất R2 `ai-ddh/<sbd>/<maTin>-<so>.jpg`; bấm Gửi chỉ còn gửi chữ + số thứ tự ảnh (`anhSo`). Chưa thành tin — tin chỉ có khi `gui`. */
export async function hsAnhAiDdh(env: Env, b: Row): Promise<Row> {
  const sbd = await emCua(env, b)
  if (!sbd) return { ok: false, error: 'Bạn cần đăng nhập lại.' }
  const maTin = str(b.maTin).slice(0, 60), so = Number(b.so)
  if (!/^[A-Za-z0-9_-]{8,60}$/.test(maTin) || !Number.isInteger(so) || so < 0 || so >= TOI_DA_SO_ANH) return { ok: false, error: 'Ảnh không hợp lệ, bạn chọn lại nhé.' }
  const u = b64(str(b.anh))
  if (!u || !u.length) return { ok: false, error: 'Ảnh hỏng, bạn chụp lại nhé.' }
  if (u.length > TOI_DA_BYTE_ANH) return { ok: false, error: 'Ảnh quá lớn, bạn chụp lại gần hơn nhé.' }
  await env.DE.put(khoaAnh(sbd, maTin, so), u, { httpMetadata: { contentType: 'image/jpeg' } })
  return { ok: true }
}
const khoaAnh = (sbd: string, maTin: string, so: number) => `ai-ddh/${sbd}/${maTin}-${so}.jpg`

/** `POST /hs/ai-ddh/gui {token, maTin, chu?, anhSo?: number[], anh?: base64[]}` — em gửi một tin (chữ và/hoặc ảnh). `anhSo` = ảnh đã tải trước (`/hs/ai-ddh/anh`); `anh` = đường cũ (ảnh kèm thân). `maTin` do máy em tạo ⇒ bấm lặp / gửi lại khi có mạng không ra hai tin. */
export async function hsGuiAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = await emCua(env, b)
  if (!sbd) return { ok: false, error: 'Em cần đăng nhập lại.' }
  const maTin = str(b.maTin).slice(0, 60)
  if (!/^[A-Za-z0-9_-]{8,60}$/.test(maTin)) return { ok: false, error: 'Tin không hợp lệ, bạn gửi lại nhé.' }
  const chu = str(b.chu).trim().slice(0, TOI_DA_CHU)
  const anhVao = (Array.isArray(b.anh) ? b.anh : []).map(str).filter(Boolean).slice(0, TOI_DA_ANH)
  const anhSo = [...new Set((Array.isArray(b.anhSo) ? b.anhSo : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < TOI_DA_SO_ANH))].slice(0, TOI_DA_ANH)
  if (!chu && !anhVao.length && !anhSo.length) return { ok: false, error: 'Em gõ đề hoặc gửi ảnh đề nhé.' }
  await damBaoAiDdh(env)
  const id = `${sbd}-${maTin}`
  const daTai = anhSo.map((n) => khoaAnh(sbd, maTin, n))
  const [{ ch }, hs, caMo, ktcn, dem, cu, coAnh] = await Promise.all([
    docCauHinh(env),
    env.DB.prepare('SELECT lop, ten_lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<Row>().catch(() => null),
    coCaDangMo(env, sbd, nowMs),
    coChangKtcnMo(env, sbd, nowMs),
    env.DB.prepare("SELECT COUNT(*) AS n FROM ai_ddh_tin WHERE sbd = ? AND ben = 'em' AND luc >= ?").bind(sbd, dauNgayVn(nowMs)).first<Row>(),
    env.DB.prepare('SELECT * FROM ai_ddh_tin WHERE id = ?').bind(id).first<Row>(),
    // Ảnh đã tải trước: kiểm có thật trên R2 — CÙNG đợt với các lượt đọc D1 (không thêm vòng chờ).
    Promise.all(daTai.map((k) => (env.DE.head ? env.DE.head(k) : env.DE.get(k)).then((o) => !!o, () => false))),
  ])
  if (cu) return { ok: true, tin: tinRa(cu) }
  if (!choEm(ch, str(hs?.lop), str(hs?.ten_lop))) return { ok: false, error: 'Thầy chưa mở A.I Đỗ Đại Học cho lớp bạn.' }
  if (caMo || ktcn) return { ok: false, khoa: 'kiem_tra', error: 'Em đang có bài kiểm tra mở. Nộp bài xong, A.I Đỗ Đại Học mở lại.' }
  if (num(dem?.n) >= TRAN_TIN_NGAY) return { ok: false, khoa: 'het_luot', error: `Hôm nay bạn đã nhắn đủ ${TRAN_TIN_NGAY} lượt. 0 giờ đêm nay nhắn tiếp được.` }
  if (coAnh.some((x) => !x)) return { ok: false, error: 'Ảnh chưa tải lên xong, bạn gửi lại nhé.' }
  // Đường cũ (ảnh kèm thân): giải mã hết rồi cất R2 SONG SONG.
  const tho = anhVao.map(b64)
  if (tho.some((u) => !u || !u.length)) return { ok: false, error: 'Ảnh hỏng, bạn chụp lại nhé.' }
  if (tho.some((u) => u!.length > TOI_DA_BYTE_ANH)) return { ok: false, error: 'Ảnh quá lớn, bạn chụp lại gần hơn nhé.' }
  const cuMoi = tho.map((_, i) => khoaAnh(sbd, maTin, TOI_DA_SO_ANH + i))
  await Promise.all(tho.map((u, i) => env.DE.put(cuMoi[i]!, u!, { httpMetadata: { contentType: 'image/jpeg' } })))
  const dsKhoaAnh = [...daTai, ...cuMoi]
  const ngay = traLoiNgay(chu, dsKhoaAnh.length)
  const lenh = [env.DB.prepare(`INSERT OR IGNORE INTO ai_ddh_tin (id, sbd, ben, chu, anh_json, trang_thai, luc) VALUES (?, ?, 'em', ?, ?, ?, ?)`)
    .bind(id, sbd, chu, JSON.stringify(dsKhoaAnh), ngay ? 'xong' : 'cho', nowMs)]
  if (ngay) lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO ai_ddh_tin (id, sbd, ben, chu, nguon, trang_thai, tra_loi_cho, luc) VALUES (?, ?, 'vp', ?, 'ngay', 'xong', ?, ?)`)
    .bind(`${id}~0`, sbd, ngay, id, nowMs + 1))
  // Một đợt: ghi (+ trả lời ngay) rồi đọc lại — không thêm vòng chờ nối tiếp.
  // Đọc theo chỉ mục (sbd, luc) từ mốc tin này — rồi lọc đúng tin em + trả lời của nó (tra_loi_cho không có chỉ mục).
  const kq = await env.DB.batch([...lenh, env.DB.prepare('SELECT * FROM ai_ddh_tin WHERE sbd = ? AND luc >= ? ORDER BY luc LIMIT 20').bind(sbd, nowMs)])
  const ds = ((kq[kq.length - 1]?.results ?? []) as Row[]).filter((x) => str(x.id) === id || str(x.tra_loi_cho) === id).map(tinRa)
  return { ok: true, tin: ds.find((x) => x.id === id) ?? null, them: ds.filter((x) => x.id !== id) }
}

// ───────────────────────── LỆNH VĂN PHÒNG (mã GV) ─────────────────────────

/** `POST /gv/ai-ddh/hang-cho {toiDa?}` — văn phòng lấy tin chờ (đánh dấu «đang», ghi mốc văn phòng trực). Kèm họ tên, lớp, 10 tin gần nhất của em. */
export async function gvHangChoAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  await damBaoAiDdh(env)
  const toiDa = Math.max(1, Math.min(20, num(b.toiDa) || 10))
  await env.DB.batch([
    // Mốc «văn phòng trực» ghi lại tối đa 30 giây/lần (văn phòng hỏi vài giây một lần ⇒ không ghi D1 mỗi lượt).
    env.DB.prepare(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?1, ?2, ?3) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc
      WHERE CAST(cau_hinh.gia_tri AS INTEGER) < ?4`).bind(KHOA_VP, String(nowMs), new Date(nowMs).toISOString(), nowMs - 30_000),
    env.DB.prepare("UPDATE ai_ddh_tin SET trang_thai = 'cho' WHERE trang_thai = 'dang' AND lay_luc < ?").bind(nowMs - LAY_LAI_SAU_MS),
  ])
  const cho = (await env.DB.prepare("SELECT * FROM ai_ddh_tin WHERE trang_thai = 'cho' ORDER BY luc LIMIT ?").bind(toiDa).all<Row>()).results ?? []
  if (!cho.length) return { ok: true, tin: [] }
  const ids = cho.map((x) => str(x.id)), sbds = [...new Set(cho.map((x) => str(x.sbd)))]
  const [, hs, ngCanh] = await Promise.all([
    env.DB.prepare(`UPDATE ai_ddh_tin SET trang_thai = 'dang', lay_luc = ? WHERE id IN (SELECT value FROM json_each(?)) AND trang_thai = 'cho'`).bind(nowMs, JSON.stringify(ids)).run(),
    env.DB.prepare('SELECT sbd, ho_ten, lop, ten_lop FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbds)).all<Row>(),
    env.DB.prepare(`SELECT * FROM (SELECT t.*, ROW_NUMBER() OVER (PARTITION BY sbd ORDER BY luc DESC) AS rn FROM ai_ddh_tin t WHERE sbd IN (SELECT value FROM json_each(?))) WHERE rn <= 10 ORDER BY luc`)
      .bind(JSON.stringify(sbds)).all<Row>(),
  ])
  const ten = new Map((hs.results ?? []).map((x) => [str(x.sbd), x]))
  const nc = ngCanh.results ?? []
  return {
    ok: true,
    tin: cho.map((x) => {
      const h = ten.get(str(x.sbd))
      return {
        id: str(x.id), sbd: str(x.sbd), hoTen: str(h?.ho_ten), lop: str(h?.ten_lop) || str(h?.lop), chu: str(x.chu),
        anh: (() => { try { return JSON.parse(str(x.anh_json)) as string[] } catch { return [] } })(), luc: num(x.luc),
        truoc: nc.filter((y) => str(y.sbd) === str(x.sbd) && num(y.luc) < num(x.luc)).map((y) => ({ ben: str(y.ben), chu: str(y.chu), luc: num(y.luc) })),
      }
    }),
  }
}

/** `POST /gv/ai-ddh/anh {khoa}` — văn phòng tải một ảnh em gửi (base64). Chỉ khoá `ai-ddh/…`. */
export async function gvAnhAiDdh(env: Env, b: Row): Promise<Row> {
  const k = str(b.khoa)
  if (!/^ai-ddh\/[^/]{1,40}\/[A-Za-z0-9_-]{8,60}-\d\.jpg$/.test(k)) return { ok: false, error: 'Khoá ảnh không hợp lệ.' }
  const o = await env.DE.get(k)
  if (!o) return { ok: false, error: 'Không thấy ảnh.' }
  const u = new Uint8Array(await new Response(o.body).arrayBuffer())
  let s = ''
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return { ok: true, mime: 'image/jpeg', base64: btoa(s) }
}

/** Câu đang được bảo vệ với MỘT em: ca chưa công bố / bài còn làm được (cả trường) + đề kiểm tra cá nhân em chưa nộp. */
async function cauBaoVeEm(env: Env, sbd: string): Promise<Set<string>> {
  const [tap, kt] = await Promise.all([
    protectedQuestions(env).catch(() => null),
    env.DB.prepare('SELECT json FROM kiem_tra_ca_nhan WHERE sbd = ? AND nop_luc IS NULL').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const ra = new Set<string>(tap ?? [])
  for (const r of kt.results ?? []) {
    try { for (const c of ((JSON.parse(str(r.json)) as { cau?: { q?: { qid?: string } }[] }).cau ?? [])) if (c.q?.qid) ra.add(c.q.qid) } catch { /* bỏ */ }
  }
  return ra
}

/** `POST /gv/ai-ddh/kiem-cau {sbd, qids[]}` — sau khi văn phòng khớp câu trong kho: câu nào em CHỈ được gợi ý. Lỗi đọc ⇒ coi mọi câu là chỉ gợi ý. */
export async function gvKiemCauAiDdh(env: Env, b: Row): Promise<Row> {
  const sbd = str(b.sbd)
  const qids = (Array.isArray(b.qids) ? b.qids : []).map(str).filter(Boolean).slice(0, 50)
  if (!sbd) return { ok: false, error: 'Thiếu SBD.' }
  try {
    const tap = await cauBaoVeEm(env, sbd)
    return { ok: true, chiGoiY: qids.filter((q) => tap.has(q) || tap.has(q.replace(/~.*$/, ''))) }
  } catch {
    return { ok: true, chiGoiY: qids }
  }
}

/** `POST /gv/ai-ddh/tranh {sbd?}` — mã câu KHÔNG được rút vào đề soạn cho em (ca chưa công bố, bài còn làm được, kiểm tra cá nhân chưa nộp của em). */
export async function gvTranhAiDdh(env: Env, b: Row): Promise<Row> {
  const sbd = str(b.sbd)
  const tap = sbd ? await cauBaoVeEm(env, sbd) : new Set(await protectedQuestions(env))
  return { ok: true, qids: [...tap] }
}

/** `POST /gv/ai-ddh/tra-loi {id, tin: [{chu, nguon?, chiGoiY?, trangUrl?, boDe?}], xong?}` — văn phòng gửi trả lời cho tin `id` của em. */
export async function gvTraLoiAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  await damBaoAiDdh(env)
  const id = str(b.id)
  const goc = await env.DB.prepare("SELECT sbd FROM ai_ddh_tin WHERE id = ? AND ben = 'em'").bind(id).first<Row>()
  if (!goc) return { ok: false, error: 'Không thấy tin của em.' }
  const ds = (Array.isArray(b.tin) ? b.tin : []).slice(0, 12) as Row[]
  const lenh = ds.map((t, i) => env.DB.prepare(`INSERT OR IGNORE INTO ai_ddh_tin (id, sbd, ben, chu, nguon, chi_goi_y, trang_url, bo_de_json, tra_loi_cho, luc)
      VALUES (?, ?, 'vp', ?, ?, ?, ?, ?, ?, ?)`).bind(`${id}~${str(t.ma) || i}`, str(goc.sbd), str(t.chu).slice(0, 6000), str(t.nguon).slice(0, 80), t.chiGoiY === true ? 1 : 0,
    /^https:\/\//.test(str(t.trangUrl)) ? str(t.trangUrl).slice(0, 500) : '', t.boDe && typeof t.boDe === 'object' ? JSON.stringify(t.boDe).slice(0, 4000) : '', id, nowMs + i))
  if (b.xong !== false) lenh.push(env.DB.prepare("UPDATE ai_ddh_tin SET trang_thai = 'xong' WHERE id = ?").bind(id))
  if (lenh.length) await env.DB.batch(lenh)
  return { ok: true, soTin: ds.length }
}

/** `POST /gv/ai-ddh/che-do {cheDo?, lop?[]}` — thầy đọc / đặt công tắc (tắt · thử theo lớp · bật). */
export async function gvCheDoAiDdh(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const v = str(b.cheDo)
  if (v) {
    if (v !== 'tat' && v !== 'thu' && v !== 'bat') return { ok: false, error: 'Chế độ không hợp lệ.' }
    const lop = (Array.isArray(b.lop) ? b.lop : []).map(str).map((x) => x.trim()).filter(Boolean).slice(0, 50)
    await ghiCauHinh(env, KHOA_CH, JSON.stringify({ cheDo: v, lop }))
  }
  const { ch, vpLuc } = await docCauHinh(env)
  return { ok: true, ...ch, vanPhongTruc: nowMs - vpLuc < VP_NGHI_SAU_MS, vanPhongLuc: vpLuc || null }
}
