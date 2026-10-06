// VIỆC #48 — ĐO TỪNG BƯỚC `chanDoanEm` (server/src/srs2-d1.ts) TRÊN D1 THẬT, CHỈ ĐỌC: vì sao lệnh `chan-doan-em` của tài khoản thử 12121212 treo > 5 phút
// còn em khác 1,5 giây. Chạy ĐÚNG mã máy chủ, nhưng `env.DB` là lớp mỏng gọi D1 qua API REST của Cloudflare:
//   · CHỈ nhận SELECT / WITH — mọi lệnh khác bị chặn tại đây (không bao giờ ghi D1 thật);
//   · ghi MỖI truy vấn ra stdout bằng `writeSync` (không đệm: dù tiến trình bị ngắt giữa chừng vẫn thấy truy vấn cuối cùng): số thứ tự, bắt đầu/xong, ms, số dòng,
//     50 ký tự đầu câu SQL — KHÔNG in giá trị tham số, KHÔNG in nội dung dòng trả về (repo công khai, nhật ký ai cũng đọc được);
//   · đo khoảng chặn vòng lặp sự kiện (CPU thuần của JS giữa hai truy vấn).
// Dùng: node do-treo.mjs <sbd> (đã gói bằng esbuild — xem .github/workflows/kiem-em-treo-0610.yml). Chế độ thử cục bộ: OMR_D1_CHE_DO=local (D1 giả trong bộ nhớ).
import { writeSync } from 'node:fs'
import { chanDoanEm } from '../server/src/srs2-d1'

type Row = Record<string, unknown>
const CHE_DO = process.env.OMR_D1_CHE_DO === 'local' ? 'local' : 'rest'
const GIOI_HAN_MS = Number(process.env.OMR_GIOI_HAN_MS) || 120_000
const sbd = (process.argv[2] ?? '').trim()
if (!sbd) { writeSync(1, 'thiếu sbd\n'); process.exit(2) }

const t0 = Date.now()
const ra = (s: string): void => { writeSync(1, `${String((Date.now() - t0) / 1000).padStart(7).slice(0, 7)}s ${s}\n`) }
const rutGon = (q: string): string => q.replace(/\s+/g, ' ').trim().slice(0, 50)

let soTruyVan = 0, tongMs = 0
const cham: { n: number; ms: number; sql: string; dong: number }[] = []
let lanCuoi = Date.now()
setInterval(() => {
  const lech = Date.now() - lanCuoi - 1000
  if (lech > 1500) ra(`! vòng lặp bị chặn ~${lech} ms (CPU thuần JS) — sau truy vấn #${soTruyVan}`)
  lanCuoi = Date.now()
  if (Date.now() - t0 > GIOI_HAN_MS) { ra(`GIỚI HẠN ${GIOI_HAN_MS} ms — dừng; đã chạy ${soTruyVan} truy vấn, tổng ${Math.round(tongMs)} ms chờ D1`); tomTat(); process.exit(3) }
}, 1000).unref()

function tomTat(): void {
  const dau = [...cham].sort((a, b) => b.ms - a.ms).slice(0, 8)
  ra(`TÓM TẮT: ${soTruyVan} truy vấn · tổng chờ D1 ${Math.round(tongMs)} ms · tổng thời gian ${Date.now() - t0} ms`)
  for (const c of dau) ra(`  chậm #${c.n}: ${Math.round(c.ms)} ms · ${c.dong} dòng · ${c.sql}`)
}

async function hoiRest(sql: string, params: unknown[]): Promise<Row[]> {
  const tai = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN, db = process.env.OMR_D1_ID
  if (!tai || !token || !db) throw new Error('thiếu CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / OMR_D1_ID')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${tai}/d1/database/${db}/query`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ sql, params }),
  })
  const j = (await r.json()) as { success?: boolean; errors?: { message?: string }[]; result?: { results?: Row[] }[] }
  if (!j.success) throw new Error(`D1 REST ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  return j.result?.[0]?.results ?? []
}

let hoiLocal: ((sql: string, params: unknown[]) => Row[]) | null = null
async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error(`CHỈ ĐỌC: chặn câu không phải SELECT (${rutGon(sql)})`)
  const n = ++soTruyVan
  ra(`#${n} bắt đầu · ${rutGon(sql)}`)
  const b = Date.now()
  try {
    const rows = CHE_DO === 'local' ? hoiLocal!(sql, params) : await hoiRest(sql, params)
    const ms = Date.now() - b
    tongMs += ms
    cham.push({ n, ms, sql: rutGon(sql), dong: rows.length })
    ra(`#${n} xong ${ms} ms · ${rows.length} dòng`)
    return rows
  } catch (e) {
    ra(`#${n} LỖI ${Date.now() - b} ms · ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`)
    throw e
  }
}

function lopMong(query: string) {
  let values: unknown[] = []
  const st = {
    bind(...a: unknown[]) { values = a; return st },
    async first<T>() { return ((await hoi(query, values))[0] ?? null) as T | null },
    async all<T>() { return { results: (await hoi(query, values)) as T[], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } } },
    async run() { throw new Error(`CHỈ ĐỌC: chặn run() (${rutGon(query)})`) },
    _q: query,
  }
  return st
}
const db = {
  prepare: lopMong,
  async batch(ds: { all: () => Promise<unknown> }[]) { const r = []; for (const s of ds) r.push(await s.all()); return r },
  withSession() { return db },
}
const env = { MA_BI_MAT: 'khong-dung', DB: db, DE: { async get() { return null }, async put() { return {} }, async delete() {} } } as never

if (CHE_DO === 'local') {
  const { taoD1That } = await import('../tests/_d1-that')
  const k = taoD1That()
  k.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'','x')").run(sbd, 'Em thử')
  hoiLocal = (sql, params) => k.sql.prepare(sql).all(...(params as never[])) as Row[]
}

ra(`BẮT ĐẦU chanDoanEm · chế độ ${CHE_DO} · giới hạn ${GIOI_HAN_MS} ms`)
try {
  const kq = await chanDoanEm(env, sbd, Date.now())
  ra(`XONG chanDoanEm · ok=${String((kq as { ok?: unknown }).ok)} · soCauTrongHoSo=${String((kq as { soCauTrongHoSo?: unknown }).soCauTrongHoSo)} · soCauChienDich=${String((kq as { soCauChienDich?: unknown }).soCauChienDich)}`)
} catch (e) {
  ra(`chanDoanEm NÉM LỖI: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`)
}
tomTat()
process.exit(0)
