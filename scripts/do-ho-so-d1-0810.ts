// Chẩn đoán một hồ sơ bằng đúng hàm dựng hồ sơ, tuyệt đối không ghi D1.
// Log chỉ có dấu vân tay SQL, tên bảng và số đo; không có nội dung/tham số/học sinh.
import { createHash, webcrypto } from 'node:crypto'
import { docHoSo2, ngayVnCua } from '../server/src/srs2-d1'
function noiThamSo(sql: string, params: unknown[]) {
  let highest = 0
  const out = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?\d*/g, token => {
    if (!token.startsWith('?')) return token
    const n = token.length > 1 ? Number(token.slice(1)) : highest + 1
    highest = Math.max(highest, n)
    if (!n || n > params.length) throw new Error('PROBE_PARAMETER_COUNT')
    const v = params[n - 1]
    if (v == null) return 'NULL'
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'string' && !v.includes('\0')) return "'" + v.replaceAll("'", "''") + "'"
    throw new Error('PROBE_PARAMETER_TYPE')
  })
  if (highest !== params.length) throw new Error('PROBE_PARAMETER_COUNT')
  return out
}
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
const root = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`
const start = Date.now()
let total = 0, stop = false, blocked = 0
let fence: Promise<unknown> = Promise.resolve()
type Stmt = { sql: string; params: unknown[] }
async function read(ds: Stmt[]) {
  if (stop || total + ds.length > 100 || Date.now() - start > 65000) throw new Error('STOP_PROBE')
  for (const st of ds) if (!/^\s*SELECT\b/i.test(st.sql) || /;\s*\S/.test(st.sql)) {
    blocked++
    console.log('blocked_non_select')
    throw new Error('READ_ONLY_PROBE')
  }
  total += ds.length
  const before = Date.now()
  const sql = ds.map(st => noiThamSo(st.sql, st.params).replace(/;\s*$/, '')).join(';\n')
  const response = await fetch(root, { method: 'POST', headers: { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }), signal: AbortSignal.timeout(20000) })
  const data = await response.json() as any
  if (!response.ok || !data.success) {
    const message = (data.errors ?? []).map((x: any) => String(x.message ?? '')).join(' ')
    const schema = /no such (?:table|column):\s*(?:main\.)?[A-Za-z_][A-Za-z_0-9.]*/i.exec(message)?.[0]
    const overloaded = /overloaded|requests queued for too long|too many requests|SQLITE_BUSY/i.test(message)
    stop = !schema
    console.log('probe_error', JSON.stringify({status: response.status, codes: data.errors?.map((x: any) => x.code), schema, overloaded}))
    throw new Error(schema ?? (overloaded ? 'D1 DB is overloaded' : 'STOP_PROBE'))
  }
  for (let i = 0; i < ds.length; i++) console.log('query', JSON.stringify({
    fingerprint: createHash('sha256').update(ds[i].sql).digest('hex').slice(0, 12),
    tables: [...new Set([...ds[i].sql.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z_]\w*)/gi)].map(x => x[1]))],
    ms: data.result[i]?.meta?.duration, rowsRead: data.result[i]?.meta?.rows_read,
    rows: data.result[i]?.results?.length, batchHttpMs: Date.now() - before, batchSize: ds.length,
  }))
  return data.result
}
function send(ds: Stmt[]) {
  const p = fence.then(() => read(ds))
  fence = p.catch(() => undefined)
  return p
}
const db = {
  prepare(sql: string) {
    const st = { sql, params: [] as unknown[], bind(...params: unknown[]) { return { ...st, params } },
      async all() { return (await send([this]))[0] },
      async first(column?: string) { const row = (await send([this]))[0].results?.[0] ?? null; return column ? row?.[column] ?? null : row },
      async run() { return (await send([this]))[0] },
    }
    return st
  },
  batch: send,
  async exec(sql: string) { return send([{sql, params: []}]) },
  withSession() { return db },
}
try {
  const profile = await docHoSo2({ DB: db } as any, '11010', ngayVnCua(Date.now()))
  console.log('profile_result', JSON.stringify({ completed: !stop && blocked === 0, ms: Date.now() - start, queries: total, blocked, stopped: stop, fields: Object.keys(profile) }))
  if (stop || blocked) process.exitCode = 1
} catch (e) {
  console.log('profile_result', JSON.stringify({ completed: false, ms: Date.now() - start, queries: total, blocked, stopped: stop, errorType: e instanceof Error ? e.name : 'unknown', frames: e instanceof Error ? e.stack?.split('\n').slice(1, 4) : [] }))
  process.exitCode = 1
}
