// Kết nối vận hành riêng: batch gửi MỘT yêu cầu D1, không tách receipt khỏi sổ.
type Stmt = { sql: string; params: unknown[] }
type Result = { success: boolean; results: Record<string, unknown>[]; meta: Record<string, number> }
export function noiThamSo(sql: string, params: unknown[]): string {
  let i = 0
  const result = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?/g, x => {
    if (x !== '?') return x
    if (i >= params.length) throw new Error('Thiếu tham số SQL.')
    const v = params[i++]
    if (v == null) return 'NULL'
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'string' && !v.includes('\0')) return "'" + v.replaceAll("'", "''") + "'"
    throw new Error('Tham số SQL ngoài hợp đồng.')
  })
  if (i !== params.length) throw new Error('Thừa tham số SQL.')
  return result
}
export function taoDbVanHanh(gui: (sql: string) => Promise<Result[]>) {
  const choGhi = (sql: string) => {
    if (/^\s*(SELECT|WITH)\b/i.test(sql)) return
    if (/^\s*CREATE (TABLE|INDEX|UNIQUE INDEX) IF NOT EXISTS\b/i.test(sql)) return
    const table = /^\s*(?:INSERT(?: OR IGNORE)? INTO|UPDATE)\s+(\w+)/i.exec(sql)?.[1]
    if (table && /^(chua_loi_\w+|su_kien_hoc|cau_snapshot|cau_hinh)$/.test(table)) return
    throw new Error('Lệnh ghi ngoài phạm vi vòng chữa.')
  }
  const chay = async (ds: Stmt[]) => {
    const sql = ds.map(s => { choGhi(s.sql); return noiThamSo(s.sql, s.params).replace(/;\s*$/, '') }).join(';\n')
    const r = await gui(sql)
    if (r.length !== ds.length || r.some(x => !x.success)) throw new Error('Batch D1 không hoàn tất.')
    return r
  }
  const db = {
    prepare(sql: string) {
      const st = {
        sql, params: [] as unknown[],
        bind(...params: unknown[]) { st.params = params; return st },
        async first<T>() { return ((await chay([st]))[0].results[0] ?? null) as T | null },
        async all<T>() { return (await chay([st]))[0] as { success: boolean; results: T[]; meta: Record<string, number> } },
        async run() { return (await chay([st]))[0] },
      }
      return st
    },
    async batch(ds: Stmt[]) { return chay(ds) },
    async exec(sql: string) { await chay([{ sql, params: [] }]); return { count: 1, duration: 0 } },
    withSession() { return db },
  }
  return db
}
