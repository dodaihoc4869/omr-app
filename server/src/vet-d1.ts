// VẾT D1 (CHỈ Worker SAO thử tải — biến VET=1 do scripts/thu-tai/tao-cau-hinh.mjs thêm; bản thật không có biến này ⇒ không chạy).
// Yêu cầu có đầu `x-vet: 1` ⇒ ghi từng lượt D1 của yêu cầu (bắt đầu / xong theo đồng hồ Worker, số dòng, thời gian D1 tự báo) ⇒ đầu trả `x-vet`.
// Không SQL tham số, không dữ liệu em: chỉ 60 ký tự đầu câu SQL.
import type { Env } from './kieu'
import { D1_GOC, dbGoc } from './cau-hinh-dem'

type Ban = [number, number, string, number, number]
const rut = (q: string) => q.replace(/\s+/g, ' ').trim().slice(0, 60)
const cauCua = new WeakMap<object, string>()
export function taoVet(env: Env): { env: Env; tom: () => string } {
  const t0 = Date.now()
  const ds: Ban[] = []
  const sv = new Set<string>()
  const ghi = (s: string, a: number, r: unknown) => {
    const arr = Array.isArray(r) ? r : [r]
    let n = 0, d = 0
    for (const x of arr as { results?: unknown[]; meta?: { duration?: number } & Record<string, unknown> }[]) {
      n += Array.isArray(x?.results) ? x.results.length : 0; d += Number(x?.meta?.duration ?? 0)
      const m = x?.meta
      if (m && sv.size < 6) { const t = ['served_by_region', 'served_by_colo', 'served_by_primary', 'served_by'].map((k) => (m[k] != null ? `${k.replace('served_by', 'sb')}=${String(m[k])}` : '')).filter(Boolean).join(','); if (t) sv.add(t) }
    }
    ds.push([a - t0, Date.now() - t0, s, n, Math.round(d * 10) / 10])
  }
  const vaSt = <T extends object>(st: T, q: string): T => {
    const o = st as unknown as Record<string, (...a: unknown[]) => unknown>
    try { cauCua.set(st, q) } catch { /* */ }
    try {
      const bind = o.bind?.bind(st)
      if (bind) o.bind = (...a: unknown[]) => vaSt(bind(...a) as object, q)
      for (const m of ['first', 'all', 'run', 'raw']) {
        const f = o[m]?.bind(st)
        if (f) o[m] = async (...a: unknown[]) => { const s = Date.now(); try { const r = await f(...a); ghi(q, s, r); return r } catch (e) { ghi('LOI ' + q, s, null); throw e } }
      }
    } catch { /* không vá được ⇒ bỏ vết câu này */ }
    return st
  }
  const vaDb = (db: Env['DB']): Env['DB'] => new Proxy(db as object, {
    get(t, k) {
      if (k === D1_GOC) return dbGoc(t)
      const v = Reflect.get(t, k)
      if (k === 'prepare') return (q: string) => vaSt((v as (q: string) => object).call(t, q), rut(q))
      if (k === 'batch') return async (sts: unknown[]) => { const s = Date.now(); const r = await (v as (x: unknown[]) => Promise<unknown>).call(t, sts); ghi(`LO${sts.length} ` + sts.slice(0, 4).map((x) => (x && typeof x === 'object' ? cauCua.get(x) ?? '?' : '?').slice(0, 40)).join(' | '), s, r); return r }
      if (k === 'withSession') return (...a: unknown[]) => vaDb((v as (...x: unknown[]) => Env['DB']).apply(t, a))
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(t) : v
    },
  }) as Env['DB']
  return {
    env: { ...env, DB: vaDb(env.DB) },
    tom: () => { let s = JSON.stringify({ w: Date.now() - t0, sv: [...sv], d: ds }); if (s.length > 7000) s = JSON.stringify({ w: Date.now() - t0, sv: [...sv], cat: ds.length, d: ds.slice(0, 60) }); return encodeURIComponent(s) },
  }
}
