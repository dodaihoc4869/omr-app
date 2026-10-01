// Gộp CHỈ SELECT độc lập của MỘT lượt game/hồ sơ. Không có kho/Promise dùng chung giữa các HTTP request.
// Ghi/CAS giữ nguyên lô và thứ tự; xả nhóm đọc trước khi gửi ghi. Không gộp ghi vào nhóm đọc.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { gan } from './cau-hinh-dem'
export function gopDocD1(db: D1Database): D1Database {
  if (typeof db.batch !== 'function') return db
  type Cho = { st: D1PreparedStatement; xong: (r: D1Result) => void; loi: (e: unknown) => void }
  let ds: Cho[] = []
  const goc = new WeakMap<D1PreparedStatement, { st: D1PreparedStatement; doc: boolean }>()
  function xa(): void {
    const lo = ds; ds = []
    if (!lo.length) return
    void db.batch(lo.map(x => x.st)).then(rs => {
      for (let i = 0; i < lo.length; i++) lo[i].xong(rs[i])
    }, () => {
      // Bảng/cột phụ chưa có: lỗi một SELECT không làm mất những SELECT hợp lệ.
      for (const x of lo) void x.st.all().then(x.xong, x.loi)
    })
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
      all: <T>() => { if (!laDoc) { xa(); return st.all<T>() }; return doc(st) as Promise<D1Result<T>> },
      first: async <T>(cot?: string) => {
        if (!laDoc) { xa(); return st.first<T>(cot) }
        const r = await doc(st), dong = r.results[0]
        return (cot ? (dong as Record<string, unknown> | undefined)?.[cot] ?? null : dong ?? null) as T | null
      },
      run: <T>() => { xa(); return st.run<T>() },
    }
    goc.set(p, { st, doc: laDoc })
    return p
  }
  return gan({
    prepare: (sql: string) => boc(db.prepare(sql), /^\s*SELECT\b/i.test(sql)),
    batch: <T>(cau: D1PreparedStatement[]) => {
      const that = cau.map(st => goc.get(st) ?? { st, doc: false })
      if (that.length && that.every(x => x.doc)) return Promise.all(that.map(x => doc(x.st))) as Promise<D1Result<T>[]>
      xa()
      return db.batch<T>(that.map(x => x.st))
    },
  }, db)
}
