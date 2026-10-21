// KÍCH THƯỚC ĐỀ TỪNG CÂU TÍNH SẴN (thầy 21/10: "phải tìm cách đo lại hết" — đo lại lượt cũ chưa từng ghi kích thước đề `raw_json.doc`).
// Mức làm cần số từ + có hình + phần của câu. Lượt mới ghi kèm (`doc`); lượt CŨ không có ⇒ tính lúc đọc từ chính câu. Đọc JSON đầy đủ của từng câu mỗi lần mở hồ sơ là quá nặng
// (câu kèm ảnh tới 290.000 ký tự — sự cố 14/10 isolate vượt 128 MB) ⇒ bảng DẪN XUẤT `cau_doc_giay(qid → so_tu, co_hinh, phan)` tính bằng CHÍNH `noiDungTuCauGoc` (hàm của màn lên bảng
// và của đường ghi `boSungKichThuocDe` ⇒ một định nghĩa) trên câu RÚT GỌN (`SQL_CAU_GON`, không ảnh / lời giải). Cron mỗi phút lấp dần (ngoài cao điểm); đường ĐỌC chỉ `SELECT` theo mã câu gốc,
// bảng chưa có / lỗi ⇒ rỗng ⇒ lượt cũ vẫn "Chưa có số đo" như trước (không bao giờ làm hỏng hồ sơ). Bảng chỉ là ĐỆM (xoá đi thì cron dựng lại); schema chỉ-thêm: server/migration-z-2110-cau-doc-giay.sql.
import type { Env } from './kieu'
import { SQL_CAU_GON, cauGonTuDong } from './cau-gon'
import { noiDungTuCauGoc } from '../../src/lib/thoi-gian-len-bang'
import { SO_TU_TOI_DA } from './do-giay-luot'
import type { PhanMucLam } from './muc-lam'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()

export interface KichThuocCau {
  soTu: number
  coHinh: boolean
  phan: PhanMucLam
}

export const SQL_CAU_DOC_GIAY: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS cau_doc_giay(qid TEXT PRIMARY KEY, so_tu INTEGER NOT NULL, co_hinh INTEGER NOT NULL, phan TEXT NOT NULL, tinh_luc TEXT)',
]

const laPhan = (p: unknown): p is PhanMucLam => p === 'I' || p === 'II' || p === 'III'

/** Các cột thêm vào `SQL_CAU_GON` cho phần câu rút gọn bỏ đi mà `noiDungTuCauGoc` còn hỏi: ảnh thân câu, ảnh dữ liệu, bảng (chỉ ĐỌC KIỂU, không sao chép nội dung nặng). */
const COT_THEM = `json_extract(game_v2_question.json,'$.phan') AS phan,
  json_type(game_v2_question.json,'$.thanCauImg') AS t_than, json_type(game_v2_question.json,'$.imageDataUrl') AS t_url,
  CASE WHEN json_type(game_v2_question.json,'$.table') = 'array' THEN json_array_length(game_v2_question.json,'$.table') ELSE 0 END AS n_bang`

/** Kích thước đề của MỘT dòng đọc bằng `SQL_CAU_GON` + `COT_THEM`. Câu không đọc được / phần lạ / hàm đếm ném lỗi ⇒ null (không bao giờ ném). Thuần. */
export function kichThuocTuDong(x: Row): KichThuocCau | null {
  const phan = str(x.phan)
  if (!laPhan(phan)) return null
  try {
    const c = cauGonTuDong(x)
    if (!c) return null
    const them: Row = { ...c }
    // Phần câu rút gọn đã bỏ: `thanCauImg` / `imageDataUrl` / `table` — chỉ cần biết CÓ hay không (`noiDungTuCauGoc`).
    if (str(x.t_than) === 'text') them.thanCauImg = 'x'
    if (str(x.t_url) === 'text') them.imageDataUrl = 'x'
    if (Number(x.n_bang) > 0) them.table = [1]
    const nd = noiDungTuCauGoc(phan, them)
    return { soTu: Math.min(SO_TU_TOI_DA, Math.max(0, nd.soTu)), coHinh: nd.coHinh, phan }
  } catch {
    return null
  }
}

const dem = new Map<string, { luc: number; v: KichThuocCau }>()
const HAN_DEM_MS = 10 * 60_000
export function xoaDemKichThuocCau(): void { dem.clear() }

/**
 * Kích thước đề các câu GỐC (`goc` đã bỏ hậu tố song sinh); câu chưa tính / bảng chưa có / lỗi đọc ⇒ vắng khỏi kết quả. MỘT lệnh `SELECT` (cho cả tập chưa có trong đệm 10 phút của isolate),
 * chạy CÙNG đợt với các lượt đọc khác của nơi gọi. Không bao giờ ném.
 */
export async function docKichThuocCau(env: Env, goc: readonly string[]): Promise<Map<string, KichThuocCau>> {
  const ra = new Map<string, KichThuocCau>()
  const now = Date.now()
  const can: string[] = []
  for (const q of new Set(goc.filter(Boolean))) {
    const c = dem.get(q)
    if (c && now - c.luc < HAN_DEM_MS) ra.set(q, c.v)
    else can.push(q)
  }
  for (let i = 0; i < can.length; i += 800) {
    const r = await env.DB.prepare('SELECT qid, so_tu, co_hinh, phan FROM cau_doc_giay WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(can.slice(i, i + 800))).all<Row>().catch(() => null)
    for (const x of r?.results ?? []) {
      const phan = str(x.phan)
      if (!laPhan(phan)) continue // dòng DẤU "không tính được" (phan '?'): có mặt để cron không tính lại, không dùng
      const v: KichThuocCau = { soTu: Math.max(0, Number(x.so_tu) || 0), coHinh: Number(x.co_hinh) === 1, phan }
      ra.set(str(x.qid), v)
      dem.set(str(x.qid), { luc: now, v })
    }
  }
  return ra
}

const daTao = new WeakMap<object, Promise<void>>()
function damBaoBang(env: Env): Promise<void> {
  const db = env.DB as unknown as object
  let p = daTao.get(db)
  if (!p) {
    p = env.DB.batch(SQL_CAU_DOC_GIAY.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(db))
    daTao.set(db, p)
  }
  return p
}

/**
 * Cron mỗi phút: tính tối đa `toiDa` câu CHƯA có dòng trong `cau_doc_giay` (lấp dần, ngoài cao điểm). Câu không tính được vẫn ghi dòng DẤU (`phan = '?'`) để không tính lại mãi.
 * Chỉ THÊM dòng (INSERT OR IGNORE) — không sửa dòng đã có. Lỗi ⇒ ném cho nơi gọi ghi log (cron đã bắt).
 */
export async function dongBoCauDocGiay(env: Env, toiDa: number): Promise<{ them: number; conNua: boolean }> {
  await damBaoBang(env)
  const r = await env.DB.prepare(
    `SELECT game_v2_question.qid AS qid, ${COT_THEM}, ${SQL_CAU_GON}
       FROM game_v2_question
      WHERE json_valid(game_v2_question.json) AND NOT EXISTS (SELECT 1 FROM cau_doc_giay c WHERE c.qid = game_v2_question.qid)
      LIMIT ?1`,
  ).bind(toiDa + 1).all<Row>()
  const dong = r.results ?? []
  const them = new Map<string, KichThuocCau | null>()
  for (const x of dong.slice(0, toiDa)) {
    const q = str(x.qid)
    if (q && !them.has(q)) them.set(q, kichThuocTuDong(x))
  }
  if (!them.size) return { them: 0, conNua: false }
  const luc = new Date().toISOString()
  await env.DB.batch([...them].map(([q, v]) => env.DB.prepare('INSERT OR IGNORE INTO cau_doc_giay(qid, so_tu, co_hinh, phan, tinh_luc) VALUES (?1, ?2, ?3, ?4, ?5)').bind(q, v?.soTu ?? 0, v?.coHinh ? 1 : 0, v?.phan ?? '?', luc)))
  return { them: them.size, conNua: dong.length > toiDa }
}
