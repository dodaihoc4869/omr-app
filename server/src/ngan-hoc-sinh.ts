// NGĂN RIÊNG TỪNG HỌC SINH (thầy 30/10 22:30: «PHẢI SỬA NHƯ DOLIGO … HÀNG TRĂM NGHÌN HS LÀM MỘT LÚC CÒN ĐƯỢC, ĐÂY CÓ MẤY TRĂM HỌC SINH KO LÀM NỔI»).
// Đo máy thật 30/10 21:40 (wrangler tail 95 giây): Cloudflare rải lệnh ra ≥ 200 isolate, mỗi isolate ~1 lệnh / phút (`[bo-nho]` soYc p50 = 1) ⇒ mọi đệm
// trong isolate (Sảnh, kế hoạch, kho câu, xác thực …) gần như KHÔNG BAO GIỜ trúng: lệnh nào cũng là «lần đầu» và đọc lại D1 (Sảnh lần đầu 148 câu SQL,
// lần sau 3 câu — đo tests/do-tai-nong-3010.test.ts). D1 chính nghẽn ⇒ «Máy chủ đang bận», «Chưa nộp được câu».
// Cách các app lớn làm trên Cloudflare: MỖI EM MỘT Durable Object (idFromName(sbd)) — mọi lệnh của em luôn vào CÙNG một chỗ chạy ⇒ đệm của em luôn ấm,
// D1 chỉ còn phần thật sự đổi. Mã xử lý KHÔNG đổi: ngăn gọi lại đúng `fetch` của Worker (dấu `x-trong-ngan-hs` ⇒ đi thẳng, không vòng lại).
// An toàn: thiếu binding (test, bản cũ) / công tắc `TAT_NGAN_HS` / không đọc được SBD ⇒ đường cũ y nguyên; ngăn lỗi ⇒ tự quay về đường cũ với ĐÚNG thân gói.
// Không đi qua ngăn: đăng nhập, thi (vào thi / lưu tạm / nộp), lệnh thầy / phụ huynh, GET.
import type { DurableObjectState, Env, ExecutionContext, KhoEm, SqlNgan } from './kieu'

type XuLy = (req: Request, env: Env, ctx?: ExecutionContext) => Promise<Response>
let xuLy: XuLy | null = null
/** index.ts gán `fetch` của Worker (tránh vòng nhập). */
export const datXuLyNgan = (f: XuLy): void => { xuLy = f }
export const DAU_TRONG_NGAN = 'x-trong-ngan-hs'
/** SBD của ngăn (Worker ghi khi chuyển vào) — kho riêng chỉ phục vụ đúng em này. */
export const DAU_SBD_NGAN = 'x-ngan-sbd'
/** Tiền tố tên ngăn: đổi ⇒ mọi em sang ngăn mới (tạo lại đúng vùng theo `locationHint`). */
export const TIEN_TO_NGAN = 'apac|'

/**
 * KHO RIÊNG CỦA EM trong SQLite của ngăn: dòng sổ (`su_kien_hoc` của em, đúng các cột omni-d1 đọc) + mốc (n = số dòng, r = received_at lớn nhất).
 * Đệm trong bộ nhớ isolate có trần dòng (chống tràn 128 MB) nên em ngoài đệm phải đọc lại CẢ SỔ từ D1 (1.256 dòng TB, 8.473 lần / 2,5 giờ cao điểm 30/10);
 * kho này nằm trên đĩa của ngăn ⇒ không tốn bộ nhớ, còn nguyên sau khi ngăn ngủ ⇒ chỉ đọc phần MỚI từ D1. Lỗi bất kỳ ⇒ null / bỏ qua (đọc D1 như cũ).
 */
export function taoKhoEm(sql: SqlNgan, sbd: string): KhoEm {
  let san = false
  const dung = () => {
    if (san) return
    sql.exec('CREATE TABLE IF NOT EXISTS so(khoa TEXT PRIMARY KEY, tt INTEGER NOT NULL, j TEXT NOT NULL)')
    sql.exec('CREATE TABLE IF NOT EXISTS so_moc(id INTEGER PRIMARY KEY, sbd TEXT NOT NULL, n INTEGER NOT NULL, r INTEGER NOT NULL)')
    san = true
  }
  return {
    sbd,
    docSo() {
      try {
        dung()
        const m = sql.exec('SELECT sbd, n, r FROM so_moc WHERE id = 1').toArray()[0]
        if (!m || m.sbd !== sbd) return null
        const rows = sql.exec('SELECT j FROM so ORDER BY tt').toArray().map((x) => JSON.parse(String(x.j)) as Record<string, unknown>)
        const n = Number(m.n), r = Number(m.r)
        return rows.length === n ? { rows, n, r } : null
      } catch (e) {
        console.error('[ngan-hs] đọc kho sổ lỗi:', e instanceof Error ? e.message : e)
        return null
      }
    },
    ghiSo(rows, n, r, chiThem) {
      try {
        dung()
        let tt = 0
        if (chiThem) tt = Number(sql.exec('SELECT COALESCE(MAX(tt), -1) + 1 AS t FROM so').toArray()[0]?.t ?? 0)
        else sql.exec('DELETE FROM so')
        for (const x of rows) sql.exec('INSERT OR REPLACE INTO so(khoa, tt, j) VALUES (?, ?, ?)', String(x.khoa), tt++, JSON.stringify(x))
        sql.exec('INSERT OR REPLACE INTO so_moc(id, sbd, n, r) VALUES (1, ?, ?, ?)', sbd, n, r)
      } catch (e) {
        console.error('[ngan-hs] ghi kho sổ lỗi:', e instanceof Error ? e.message : e)
        try { sql.exec('DELETE FROM so_moc') } catch { /* kho hỏng ⇒ lần sau đọc D1 */ }
      }
    },
  }
}

/**
 * MỘT `env` dùng chung cho mọi ngăn trong isolate: đệm của máy chủ khoá theo đối tượng D1 gốc (`dbGoc`) — nếu mỗi ngăn mang `env` riêng thì dữ liệu CHUNG
 * (kho câu, siêu dữ liệu câu, chiến dịch …) bị nhân bản theo từng em ⇒ tràn 128 MB của isolate. Ràng buộc (D1, R2, biến) như nhau ở mọi ngăn cùng lớp.
 */
let envChung: Env | null = null
export const xoaEnvChungNgan = (): void => { envChung = null }

/**
 * ĐO VỊ TRÍ NGĂN (31/10 sáng: lưu một câu Kiểm tra ôn tập 1,1–2,1 s dù ít em ⇒ nghi ngăn đặt XA D1, mỗi vòng D1 đi xa). Mỗi isolate: trạm Cloudflare đang chạy
 * (`/cdn-cgi/trace`, một lần) + thời gian một câu `SELECT 1` tới D1 (tối đa một lần / phút). Gắn vào phản hồi dạng header — không lộ gì của em.
 */
let tram = ''
let d1Ms = -1, d1Luc = 0
function doViTri(env: Env, ctx: ExecutionContext): void {
  const now = Date.now()
  if (!tram) { tram = '…'; ctx.waitUntil(fetch('https://cloudflare.com/cdn-cgi/trace').then((r) => r.text()).then((t) => { tram = /colo=([A-Z]+)/.exec(t)?.[1] ?? '?' }).catch(() => { tram = '?' })) }
  if (now - d1Luc > 60_000) { d1Luc = now; const t0 = Date.now(); ctx.waitUntil(env.DB.prepare('SELECT 1').first().then(() => { d1Ms = Date.now() - t0 }).catch(() => {})) }
}

export class NganHocSinh {
  private kho: KhoEm | null = null
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}
  async fetch(req: Request): Promise<Response> {
    if (!xuLy) return new Response(JSON.stringify({ ok: false, error: 'Máy chủ đang khởi động, em thử lại nhé.', maLoi: 'MAY_CHU_BAN' }), { status: 503, headers: { 'content-type': 'application/json' } })
    const state = this.state
    const ctx = { waitUntil: (p: Promise<unknown>) => state.waitUntil(p), passThroughOnException() {} } as unknown as ExecutionContext
    const sbd = req.headers.get(DAU_SBD_NGAN) ?? ''
    if (sbd && state.storage?.sql && (!this.kho || this.kho.sbd !== sbd)) this.kho = taoKhoEm(state.storage.sql, sbd)
    const env = (envChung ??= this.env)
    doViTri(env, ctx)
    const t0 = Date.now()
    const res = await xuLy(req, this.kho ? { ...env, KHO_EM: this.kho } : env, ctx)
    // Dấu «đã qua ngăn» (đo được trên máy thật, không lộ gì): 1 = ngăn có kho sổ · trạm chạy ngăn · ms một vòng D1 · ms xử lý trong ngăn.
    const h = new Headers(res.headers)
    h.set('x-ngan', this.kho ? '1' : '0')
    h.set('x-ngan-do', `${tram || '-'};d1=${d1Ms};xl=${Date.now() - t0}`)
    const ex = h.get('access-control-expose-headers'); h.set('access-control-expose-headers', ex ? `${ex}, x-ngan, x-ngan-do` : 'x-ngan, x-ngan-do')
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h })
  }
}

/** Đường của app HỌC SINH đi qua ngăn (đều mang `token` game của em). */
export const laDuongNgan = (p: string): boolean =>
  (p.startsWith('/game-v2/') || (p.startsWith('/hs/') && p !== '/hs/dang-nhap') || p === '/presence' || p.startsWith('/notifications/') || p.startsWith('/mom/'))

/** SBD trong phần dữ liệu (chưa kiểm chữ ký — chỉ để CHỌN NGĂN; ngăn vẫn kiểm token đầy đủ như cũ). */
export function sbdChonNgan(b: unknown): string | null {
  if (!b || typeof b !== 'object') return null
  const t = (b as { token?: unknown }).token
  if (typeof t === 'string' && t.includes('.')) {
    try {
      const j = JSON.parse(atob(t.slice(0, t.indexOf('.')))) as { sbd?: unknown }
      if (typeof j.sbd === 'string' && /^[0-9A-Za-z_-]{1,40}$/.test(j.sbd)) return j.sbd
    } catch { /* token hỏng ⇒ đường cũ trả lời lỗi như trước */ }
  }
  return null
}

async function docThan(buf: ArrayBuffer, req: Request): Promise<unknown> {
  const u8 = new Uint8Array(buf)
  if ((u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b) || req.headers.get('content-encoding') === 'gzip') {
    return new Response(new Response(buf).body!.pipeThrough(new DecompressionStream('gzip'))).json()
  }
  return JSON.parse(new TextDecoder().decode(buf))
}

/**
 * Lệnh của học sinh ⇒ chuyển vào ngăn của em, trả `Response`. Không thuộc ngăn ⇒ `null` (dùng `req` gốc). Đã đọc thân mà không vào được ngăn ⇒ trả
 * `Request` mới cùng thân để đường cũ xử lý.
 */
export async function vaoNgan(req: Request, env: Env): Promise<Response | Request | null> {
  const ns = env.NGAN_HS
  if (!ns || env.TAT_NGAN_HS || req.method !== 'POST' || req.headers.has(DAU_TRONG_NGAN)) return null
  const p = new URL(req.url).pathname
  if (!laDuongNgan(p)) return null
  const buf = await req.arrayBuffer()
  const lai = () => new Request(req.url, { method: 'POST', headers: req.headers, body: buf })
  let sbd: string | null = null
  try { sbd = sbdChonNgan(await docThan(buf, req)) } catch { /* thân hỏng ⇒ đường cũ báo lỗi JSON như trước */ }
  if (!sbd) return lai()
  const h = new Headers(req.headers)
  h.set(DAU_TRONG_NGAN, '1')
  h.set(DAU_SBD_NGAN, sbd)
  try {
    // 31/10 (đo x-ngan-do: ngăn tạo theo trạm của lượt gọi ĐẦU TIÊN — ngăn thử nằm ở IAD (Mỹ), mỗi vòng D1 233 ms ⇒ lưu một câu > 1 giây): ngăn LUÔN ở châu Á
    // sát D1 (vùng APAC). Gợi ý vị trí chỉ có tác dụng lúc TẠO ngăn ⇒ đổi tên ngăn (`apac|`) để mọi em có ngăn mới đúng chỗ; ngăn cũ bỏ (kho sổ chỉ là đệm).
    const res = await ns.get(ns.idFromName(`${TIEN_TO_NGAN}${sbd}`), { locationHint: 'apac' }).fetch(new Request(req.url, { method: 'POST', headers: h, body: buf }))
    // Mẫu 1/20 lượt: trạm ngăn + ms một vòng D1 + ms xử lý (wrangler tail gom) — không SBD.
    if (Math.random() < 0.05) console.log('[ngan-do]', new URL(req.url).pathname, res.headers.get('x-ngan-do') ?? '-')
    return res
  } catch (e) {
    console.error('[ngan-hs] không vào được ngăn, chạy đường cũ:', e instanceof Error ? e.message : e)
    return lai()
  }
}
