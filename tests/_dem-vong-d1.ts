// Bộ đếm VÒNG D1 cho test đo tối ưu (28/09). Bọc `env.DB`:
//  - `vong`: số lần đi-về D1 (mỗi first/all/run/raw ngoài batch = 1, mỗi batch = 1);
//  - `dot`: số ĐỢT NỐI TIẾP ≈ độ trễ thật (mỗi đợt ≈ 300–400 ms trên D1 thật). Mỗi lượt gọi trễ giả TRE_MS; dot = (lúc xong cuối − lúc gọi đầu) / TRE_MS
//    làm tròn ⇒ lượt song song (Promise.all) tính MỘT đợt, lượt nối tiếp cộng dồn (đường găng thật).
import type { Env } from '../server/src/kieu'

export type DemVong = { vong: number; dot: number; sql: string[] }
export const TRE_MS = 25

export function demVongD1<E extends Env>(env: E): { env: E; d: DemVong } {
  const d: DemVong = { vong: 0, dot: 0, sql: [] }
  let dau = -1
  const goc = env.DB as any
  const thatCua = new WeakMap<object, any>()
  const sqlCua = new WeakMap<object, string>()
  const boc = <T>(sql: string, f: () => Promise<T>): Promise<T> => {
    if (dau < 0) dau = performance.now()
    d.vong++
    d.sql.push(sql)
    return new Promise<void>((r) => setTimeout(r, TRE_MS)).then(f).finally(() => { d.dot = Math.round((performance.now() - dau) / TRE_MS) })
  }
  const bocStmt = (st: any, sql: string): any => {
    const p: any = new Proxy(st, {
      get(t, k) {
        const v = t[k]
        if (k === 'bind') return (...a: unknown[]) => bocStmt(v.apply(t, a), sql)
        if (k === 'first' || k === 'all' || k === 'run' || k === 'raw') return (...a: unknown[]) => boc(sql, () => v.apply(t, a))
        return typeof v === 'function' ? v.bind(t) : v
      },
    })
    thatCua.set(p, st)
    sqlCua.set(p, sql)
    return p
  }
  const db: any = {
    prepare: (sql: string) => bocStmt(goc.prepare(sql), sql),
    batch: (ds: any[]) => boc(`batch[${ds.map((x) => sqlCua.get(x) ?? '?').join(' ;; ')}]`, () => goc.batch(ds.map((x) => thatCua.get(x) ?? x))),
    exec: (s: string) => boc(s, () => goc.exec(s)),
    withSession: () => db,
    [Symbol.for('omr.d1Goc')]: goc, // như bản withSession: đệm theo isolate khoá theo D1 gốc
  }
  return { env: { ...env, DB: db }, d }
}
