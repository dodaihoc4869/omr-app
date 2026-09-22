// VỎ ĐO cho BỘ BẮN TẢI GIẢ (Code 1, 21/09/2026; Boss: đếm số truy vấn D1, dòng đọc, thời gian TỪNG LỆNH) — CHỈ chạy trong `wrangler dev --local` (scripts/ban-tai-gia/wrangler.toml), KHÔNG được đẩy lên Worker thật.
//
// Vỏ bọc Worker THẬT (`server/src/index.ts`, không sửa một dòng): bọc `env.DB` MỘT LẦN (giữ nguyên các bộ đệm mô-đun khoá theo `env.DB`, vd reset-toan-app) và gán mỗi truy vấn cho ĐÚNG lượt gọi đang chạy bằng
// AsyncLocalStorage — kể cả việc phụ chạy sau khi đã trả lời (`ctx.waitUntil`). Ghi: số truy vấn, dòng đọc (`meta.rows_read` của D1 cục bộ), dòng ghi, thời gian D1 và tường; khung câu SQL rút gọn để lập bảng "truy vấn tốn nhất".
//   GET /__do/dump  → mọi lượt đã ghi (JSON)      GET /__do/reset → xoá sổ đo
// Máy khách gửi `x-tai-gia-lenh: <tên lệnh>` để gom nhóm; nếu thiếu thì lấy đường dẫn.
// GHI CHÚ ĐO: D1 cục bộ (miniflare) đếm `rows_read` như SQLite thật (quét bảng = đọc mọi dòng); `first()` được đo bằng `all()` (D1 thật dừng sớm hơn ⇒ số đo có thể CAO hơn thật với truy vấn không LIMIT trả nhiều dòng).
import { AsyncLocalStorage } from 'node:async_hooks'
import worker from '../../server/src/index'

interface CauLenh { khung: string; doc: number; ghi: number; msD1: number; msTuong: number; theoBatch: boolean }
interface LuotGoi {
  id: string
  lenh: string
  duong: string
  batDau: number
  traLoiLuc: number | null
  xongLuc: number | null
  ma: number
  loi: string | null
  cau: CauLenh[]
}

const nhatKy = new Map<string, LuotGoi>()
const als = new AsyncLocalStorage<LuotGoi>()
const TRAN_LUOT = 60_000
const TRAN_CAU_MOI_LUOT = 400

/** Rút gọn câu SQL thành "khung": bỏ khoảng trắng thừa, cắt 240 ký tự. Số/chuỗi hằng vẫn nằm trong câu (D1 dùng tham số `?` nên ít khi có). */
const khungSql = (sql: string): string => sql.replace(/\s+/g, ' ').trim().slice(0, 240)

/** Câu SQL ĐẦY ĐỦ theo khung (mỗi khung một bản, ≤ 6.000 ký tự) — để `explain.mjs` chạy EXPLAIN các truy vấn tốn nhất. */
const sqlDayDu = new Map<string, string>()

function ghiCau(sql: string, meta: Record<string, unknown> | undefined, msTuong: number, theoBatch: boolean): void {
  const luot = als.getStore()
  if (!luot) return
  const kh = khungSql(sql)
  if (!sqlDayDu.has(kh) && sqlDayDu.size < 3000) sqlDayDu.set(kh, sql.slice(0, 6000))
  if (luot.cau.length >= TRAN_CAU_MOI_LUOT) return
  luot.cau.push({
    khung: khungSql(sql),
    doc: Number(meta?.rows_read ?? 0) || 0,
    ghi: Number(meta?.rows_written ?? 0) || 0,
    msD1: Number(meta?.duration ?? 0) || 0,
    msTuong,
    theoBatch,
  })
}

type CauGoc = { bind(...a: unknown[]): CauGoc; all(): Promise<{ results?: unknown[]; meta?: Record<string, unknown> }>; run(): Promise<{ meta?: Record<string, unknown> }>; first(c?: string): Promise<unknown>; raw(o?: unknown): Promise<unknown> }

interface CauBoc {
  bind(...a: unknown[]): CauBoc
  all(): Promise<unknown>
  run(): Promise<unknown>
  first(c?: string): Promise<unknown>
  raw(o?: unknown): Promise<unknown>
  __goc(): CauGoc
  __sql: string
}

/** ĐỘ TRỄ GIẢ D1 (`--tre-d1=<ms>` ở chay.mjs ⇒ biến TRE_D1_MS): mỗi truy vấn (và mỗi `batch` MỘT lần) chờ thêm chừng ấy ms như đường mạng tới D1 thật. KHÔNG mô hình hàng đợi một luồng của D1. Để so Promise.all với truy vấn tuần tự. */
let treD1Ms = 0
const treGia = (): Promise<void> | void => (treD1Ms > 0 ? new Promise<void>((ok) => setTimeout(ok, treD1Ms)) : undefined)

function bocCau(goc: CauGoc, sql: string): CauBoc {
  let cur = goc
  const p: CauBoc = {
    __sql: sql,
    __goc: () => cur,
    bind(...a) { cur = cur.bind(...a); return p },
    async all() { const t = Date.now(); await treGia(); const r = await cur.all(); ghiCau(sql, r.meta, Date.now() - t, false); return r },
    async run() { const t = Date.now(); await treGia(); const r = await cur.run(); ghiCau(sql, r.meta, Date.now() - t, false); return r },
    async first(col?: string) {
      const t = Date.now()
      await treGia()
      const r = await cur.all()
      ghiCau(sql, r.meta, Date.now() - t, false)
      const dong = ((r.results ?? [])[0] ?? null) as Record<string, unknown> | null
      return col ? (dong ? (dong[col] ?? null) : null) : dong
    },
    async raw(o?: unknown) { const t = Date.now(); await treGia(); const r = await cur.raw(o); ghiCau(sql, undefined, Date.now() - t, false); return r },
  }
  return p
}

const boc = new WeakMap<object, object>()
function bocD1(db: any): any {
  const da = boc.get(db)
  if (da) return da
  const moi = {
    prepare(sql: string) { return bocCau(db.prepare(sql), sql) },
    async batch(ds: CauBoc[]) {
      const t = Date.now()
      await treGia()
      const r = (await db.batch(ds.map((s) => (s.__goc ? s.__goc() : s)))) as { meta?: Record<string, unknown> }[]
      const ms = Date.now() - t
      r.forEach((x, i) => ghiCau(ds[i]?.__sql ?? '(batch)', x?.meta, i === 0 ? ms : 0, true))
      return r
    },
    async exec(sql: string) { const t = Date.now(); await treGia(); const r = await db.exec(sql); ghiCau(sql, undefined, Date.now() - t, false); return r },
    dump: (...a: unknown[]) => db.dump(...a),
    // SESSIONS API (Boss 22/09, lượt 2): `env.DB.withSession(...)` trả một đối tượng D1 RIÊNG (bản sao) — bọc LẠI nó bằng chính bocD1 (đệ quy, WeakMap chống bọc hai lần)
    // để truy vấn đi qua Sessions API VẪN được đếm; nếu bỏ bọc ở đây, mọi route dùng withSession (Boss danh sách 16+, docs/do-tai-d1/phan-loai-route-doc-ghi-2209.md) sẽ lọt khỏi số đo.
    // Miniflare cục bộ (wrangler dev --local) hiện KHÔNG có `withSession` nên nhánh này chưa từng chạy thật ở bench — để sẵn cho khi D1 preview/binding thật có.
    withSession: db.withSession ? (...a: unknown[]) => bocD1(db.withSession(...a)) : undefined,
  }
  boc.set(db, moi)
  return moi
}
// R2 CỤC BỘ TRỐNG (bản sao lưu chỉ có D1): tờ kho `kho/<mã tờ>.json` được DỰNG LẠI từ `game_v2_question` (cùng nội dung câu) bằng D1 GỐC — không bọc, nên KHÔNG tính vào số truy vấn. Khoá khác ⇒ null như R2 trống.
const goiKho = new Map<string, string | null>()
async function dungGoiKho(db: any, goc: string): Promise<string | null> {
  if (goiKho.has(goc)) return goiKho.get(goc) ?? null
  const r = await db.prepare('SELECT qid, json FROM game_v2_question WHERE ma_de = ?').bind(goc).all()
  const cau: Record<string, unknown>[] = []
  for (const x of (r.results ?? []) as { qid: string; json: string }[]) {
    let q: Record<string, unknown>
    try { q = JSON.parse(x.json) } catch { continue }
    const m = /-(I{1,3})-(\d+)$/.exec(String(q.qid ?? x.qid))
    cau.push({ phan: q.phan ?? m?.[1], so: m ? Number(m[2]) : cau.length + 1, de: q.text, pa: q.choices, y: q.ideas, dap_an: q.correct, loi_giai: q.solution, dang: q.dang, muc_do: q.mucDo })
  }
  const js = cau.length ? JSON.stringify({ ma_de: goc, cau }) : null
  goiKho.set(goc, js)
  return js
}
function bocR2(de: any, db: any): any {
  return new Proxy(de, {
    get(t, p) {
      if (p === 'get') {
        return async (key: string, ...a: unknown[]) => {
          const thuc = await t.get(key, ...a)
          if (thuc) return thuc
          const m = /^kho\/(.+)\.json$/.exec(key)
          const js = m ? await dungGoiKho(db, m[1]!) : null
          if (!js) return null
          return { key, httpEtag: '"gia"', get body() { return new Response(js).body }, json: async () => JSON.parse(js), text: async () => js, arrayBuffer: async () => new TextEncoder().encode(js).buffer }
        }
      }
      const v = t[p]
      return typeof v === 'function' ? v.bind(t) : v
    },
  })
}
const envBoc = new WeakMap<object, object>()
const bocEnv = (env: any): any => {
  const da = envBoc.get(env)
  if (da) return da
  treD1Ms = Number(env.TRE_D1_MS) || 0
  const moi = { ...env, DB: bocD1(env.DB), DE: bocR2(env.DE, env.DB) }
  envBoc.set(env, moi)
  return moi
}

let dem = 0
/** Tên lệnh máy khách gửi đã mã hoá phần trăm (header chỉ nhận ASCII; tên có dấu tiếng Việt). */
const nhanLenh = (v: string | null): string => { if (!v) return ''; try { return decodeURIComponent(v) } catch { return v } }
export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/__do/dump') return Response.json({ luot: [...nhatKy.values()], sql: Object.fromEntries(sqlDayDu) })
    if (url.pathname === '/__do/reset') { nhatKy.clear(); return Response.json({ ok: true }) }
    const id = req.headers.get('x-tai-gia-id') || `l${++dem}`
    const luot: LuotGoi = { id, lenh: nhanLenh(req.headers.get('x-tai-gia-lenh')) || url.pathname, duong: url.pathname, batDau: Date.now(), traLoiLuc: null, xongLuc: null, ma: 0, loi: null, cau: [] }
    if (nhatKy.size >= TRAN_LUOT) nhatKy.delete(nhatKy.keys().next().value as string)
    nhatKy.set(id, luot)
    const cho: Promise<unknown>[] = []
    const ctxBoc = {
      waitUntil(p: Promise<unknown>) { cho.push(p.catch(() => undefined)); ctx.waitUntil(p) },
      passThroughOnException() { ctx.passThroughOnException() },
    } as unknown as ExecutionContext
    return als.run(luot, async () => {
      try {
        const r = await worker.fetch(req, bocEnv(env), ctxBoc)
        luot.traLoiLuc = Date.now()
        luot.ma = r.status
        const nhan = new Headers(r.headers)
        nhan.set('x-d1-truy-van', String(luot.cau.length))
        nhan.set('x-d1-dong-doc', String(luot.cau.reduce((t, c) => t + c.doc, 0)))
        void Promise.all(cho).then(() => { luot.xongLuc = Date.now() })
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: nhan })
      } catch (e) {
        luot.traLoiLuc = Date.now(); luot.ma = 500; luot.loi = e instanceof Error ? e.message : String(e)
        throw e
      }
    })
  },
}
