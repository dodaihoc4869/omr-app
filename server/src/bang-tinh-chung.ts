// BẢN TÍNH SẴN DÙNG CHUNG THEO DẤU BẢNG (12/11 H2, hoá đơn D1 hàng đọc — đích ≤ 5 đô/tháng).
// Vì sao: vài câu đọc KHO (gần như tĩnh) chạy hàng nghìn lượt/ngày, mỗi lượt đọc lại vài trăm – vài nghìn hàng y hệt lần trước: ma trận nhãn Gói 7
// (5.553 × 4.502), β câu (29.039 × 797), câu của tờ (4.297 × 2.469), chỉ mục câu theo dạng (80.916 × 109). Đệm trong isolate không cứu được (rất nhiều
// isolate ngắn hạn — xem kho-chung.ts). Nay: KẾT QUẢ THÔ của câu (đúng các dòng D1 trả) cất MỘT dòng trong `bang_tinh_chung`, khoá theo (tên câu + băm câu
// SQL + tham số), gắn DẤU của đúng các bảng nguồn (`dau_bang`, trigger giữ — migration-z-1211-h2-goi-nhieu.sql: dấu đổi ⇔ có ghi vào bảng).
//   · Trúng: MỘT câu đọc (dấu từng bảng + dòng cất) ≈ 1 + số bảng hàng — thay cho cả câu cũ; cùng số đợt D1 như câu cũ.
//   · Trượt (dấu đổi / chưa cất): câu cũ chạy CÙNG LÔ với câu đọc dấu (một giao dịch ⇒ dữ liệu cũ không bao giờ mang dấu mới), trả ngay, cất NỀN. Thêm một
//     đợt D1 — chỉ lần đầu sau mỗi lần kho đổi.
//   · Dòng cất là ĐÚNG các dòng câu cũ trả (JSON giữ nguyên chuỗi/số/null, cùng thứ tự) ⇒ nơi gọi xử lý y hệt; câu SQL đổi ⇒ băm đổi ⇒ khoá mới.
//   · Thiếu bảng dấu / bảng cất (D1 chưa chạy migration) hay thiếu dòng dấu ⇒ chạy câu cũ như trước, không cất.
// Công tắc: tắt dưới vitest (test cũ giữ đường cũ, không phụ thuộc bảng cất); test riêng bật bằng `batBangTinhChung`.
import type { D1PreparedStatement, Env } from './kieu'
import { envGhiRieng } from './doc-d1-theo-luot'
import { giaiNen, nen } from './kho-chung'

let bat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
/** Câu dò lỗi (thiếu bảng — D1 chưa chạy migration) ⇒ tạm không dùng tới mốc này (ms), đi thẳng đường cũ. */
let tatDen = 0
const TAT_KHI_LOI_MS = 60_000
export function batBangTinhChung(b: boolean): void { bat = b; tatDen = 0 }

export const LENH_BANG_TINH_CHUNG = ['CREATE TABLE IF NOT EXISTS bang_tinh_chung (khoa TEXT PRIMARY KEY, dau TEXT NOT NULL, json TEXT NOT NULL, luc INTEGER NOT NULL)'] as const
/** Trên ngưỡng này (ký tự JSON) thì nén gzip ⇒ base64 (tiền tố `z`); sau nén vẫn quá trần thì không cất (D1: dòng ≤ 2 MB). */
const NGUONG_NEN = 200_000
const TRAN_CAT = 1_800_000

/** Băm ngắn (FNV-1a 32 bit, hệ 36) — đưa nội dung câu SQL vào khoá: câu đổi ⇒ khoá đổi ⇒ không dùng nhầm dòng cất của câu cũ. */
export function bamNgan(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(36)
}
/** Biểu thức SQL: dấu ghép của các bảng nguồn (NULL nếu thiếu dòng dấu nào). Tên bảng là hằng trong mã. */
export function btDauBang(bang: readonly string[]): string {
  if (!bang.length || bang.some((t) => !/^\w+$/.test(t))) throw new Error('bang-tinh-chung: tên bảng nguồn không hợp lệ')
  return bang.map((t) => `(SELECT dau FROM dau_bang WHERE ten = '${t}')`).join(`||'|'||`)
}
export const sqlDocChung = (bang: readonly string[]) =>
  `SELECT s.d AS d, c.json AS j FROM (SELECT ${btDauBang(bang)} AS d) s LEFT JOIN bang_tinh_chung c ON c.khoa = ? AND c.dau = s.d`

async function moJson(j: string): Promise<unknown> {
  return JSON.parse(j.startsWith('z') ? await giaiNen(j.slice(1)) : j)
}
async function cat(env: Env, khoa: string, dau: string, rows: unknown[]): Promise<void> {
  let json = JSON.stringify(rows)
  if (json.length > NGUONG_NEN) json = 'z' + await nen(json)
  if (json.length > TRAN_CAT) return
  await env.DB.prepare(`INSERT INTO bang_tinh_chung (khoa, dau, json, luc) VALUES (?, ?, ?, ?)
    ON CONFLICT(khoa) DO UPDATE SET dau = excluded.dau, json = excluded.json, luc = excluded.luc`).bind(khoa, dau, json, Date.now()).run()
}

/**
 * Kết quả của câu đọc kho `lenh()` qua bản tính sẵn dùng chung. `ten`: tên ngắn của câu (đọc nhật ký); `sql`: nội dung câu (băm vào khoá); `thamSo`: chuỗi
 * định danh tham số (cùng tham số ⇒ cùng dòng ra); `bang`: MỌI bảng câu đọc. `lenh` phải TẠO MỚI câu đã bind mỗi lần gọi.
 */
export async function docChung<R>(env: Env, ten: string, sql: string, thamSo: string, bang: readonly string[], lenh: () => D1PreparedStatement): Promise<{ results: R[] }> {
  if (!bat) return lenh().all<R>()
  return (await docChungNeuCo<R>(env, ten, sql, thamSo, bang, lenh)) ?? lenh().all<R>()
}
/** Như `docChung` nhưng CHỈ khi dùng được bản tính sẵn (công tắc bật, có bảng dấu + dòng dấu): không dùng được ⇒ null (nơi gọi tự đi đường cũ của mình). */
export async function docChungNeuCo<R>(env: Env, ten: string, sql: string, thamSo: string, bang: readonly string[], lenh: () => D1PreparedStatement): Promise<{ results: R[] } | null> {
  if (!bat || Date.now() < tatDen) return null
  const khoa = `${ten}.${bamNgan(sql)}|${thamSo}`
  let d: unknown = null
  try {
    const r = await env.DB.prepare(sqlDocChung(bang)).bind(khoa).first<{ d: string | null; j: string | null }>()
    if (r?.j != null) {
      try { const v = await moJson(String(r.j)); if (Array.isArray(v)) return { results: v as R[] } } catch { /* dòng cất hỏng ⇒ đọc lại, cất đè */ }
    }
    d = r?.d ?? null
  } catch { tatDen = Date.now() + TAT_KHI_LOI_MS; return null } // bảng dấu / bảng cất chưa có ⇒ một phút sau mới thử lại (khỏi thêm một câu hỏng mỗi lượt)
  if (d == null) return null
  const [s, r] = await env.DB.batch<Record<string, unknown>>([env.DB.prepare(`SELECT ${btDauBang(bang)} AS d`), lenh()])
  const rows = (r?.results ?? []) as R[]
  const dMoi = s?.results?.[0]?.d
  if (dMoi != null) void cat(envGhiRieng(env), khoa, String(dMoi), rows).catch((e) => console.error('[bang-tinh-chung] cất lỗi:', ten, e instanceof Error ? e.message : e))
  return { results: rows }
}
