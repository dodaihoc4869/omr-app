// Gộp CHỈ SELECT độc lập của MỘT lượt game/hồ sơ. Không có kho/Promise dùng chung giữa các HTTP request.
// Ghi/CAS giữ nguyên lô và thứ tự; xả nhóm đọc trước khi gửi ghi. Không gộp ghi vào nhóm đọc.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { gan } from './cau-hinh-dem'
const DA_GOP = Symbol('omr.docD1TheoLuot')
export function gopDocD1(db: D1Database): D1Database {
  if ((db as unknown as Record<symbol, unknown>)[DA_GOP]) return db
  if (typeof db.batch !== 'function') return db
  type Cho = { st: D1PreparedStatement; xong: (r: D1Result) => void; loi: (e: unknown) => void }
  let ds: Cho[] = []
  // Hàng rào chỉ thuộc request này: SELECT độc lập được song song; ghi chờ các đọc trước nó,
  // đọc sau ghi chờ ghi xong. Giữ nguyên CAS/lô ghi, không chặn đọc bởi đọc khác.
  let truoc: Promise<void> = Promise.resolve(), ghi: Promise<void> = Promise.resolve()
  function gui<T>(chay: () => Promise<T>): Promise<T> {
    const p = truoc.then(chay)
    ghi = p.then(() => undefined, () => undefined)
    truoc = ghi
    return p
  }
  const goc = new WeakMap<D1PreparedStatement, { st: D1PreparedStatement; doc: boolean }>()
  function xa(): void {
    const lo = ds; ds = []
    if (!lo.length) return
    const p = ghi.then(async () => {
      try {
        const rs = await db.batch(lo.map(x => x.st))
        for (let i = 0; i < lo.length; i++) lo[i].xong(rs[i])
      } catch {
        // Bảng/cột phụ chưa có: lỗi một SELECT không làm mất những SELECT hợp lệ.
        await Promise.all(lo.map(x => x.st.all().then(x.xong, x.loi)))
      }
    })
    truoc = Promise.all([truoc, p]).then(() => undefined)
  }
  function doc(st: D1PreparedStatement): Promise<D1Result> {
    return new Promise((xong, loi) => {
      ds.push({ st, xong, loi })
      if (ds.length !== 1) return
      queueMicrotask(xa)
    })
  }
  function boc(st: D1PreparedStatement, laDoc: boolean): D1PreparedStatement {
    const p: D1PreparedStatement = {
      bind: (...tham) => boc(st.bind(...tham), laDoc),
      all: <T>() => { if (!laDoc) { xa(); return gui(() => st.all<T>()) }; return doc(st) as Promise<D1Result<T>> },
      first: async <T>(cot?: string) => {
        if (!laDoc) { xa(); return gui(() => st.first<T>(cot)) }
        const r = await doc(st), dong = r.results[0]
        return (cot ? (dong as Record<string, unknown> | undefined)?.[cot] ?? null : dong ?? null) as T | null
      },
      run: <T>() => { xa(); return gui(() => st.run<T>()) },
    }
    goc.set(p, { st, doc: laDoc })
    return p
  }
  const wrapped = gan({
    prepare: (sql: string) => boc(db.prepare(sql), /^\s*SELECT\b/i.test(sql)),
    batch: <T>(cau: D1PreparedStatement[]) => {
      const that = cau.map(st => goc.get(st) ?? { st, doc: false })
      if (that.length && that.every(x => x.doc)) return Promise.all(that.map(x => doc(x.st))) as Promise<D1Result<T>[]>
      xa()
      return gui(() => db.batch<T>(that.map(x => x.st)))
    },
  }, db)
  Object.defineProperty(wrapped, DA_GOP, { value: true })
  return wrapped
}
