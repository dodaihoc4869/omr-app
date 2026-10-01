// Gộp CHỈ SELECT độc lập của MỘT lượt đọc hồ sơ. Không có kho/Promise dùng chung giữa các HTTP request.
// Chỉ dùng trong docHoSo2 (không ghi). Các câu vẫn giữ thứ tự và kết quả first/all như D1 gốc.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { gan } from './cau-hinh-dem'
export function gopDocD1(db: D1Database): D1Database {
  if (typeof db.batch !== 'function') return db
  type Cho = { st: D1PreparedStatement; xong: (r: D1Result) => void; loi: (e: unknown) => void }
  let ds: Cho[] = []
  function doc(st: D1PreparedStatement): Promise<D1Result> {
    return new Promise((xong, loi) => {
      ds.push({ st, xong, loi })
      if (ds.length !== 1) return
      queueMicrotask(() => {
        const lo = ds; ds = []
        void db.batch(lo.map(x => x.st)).then(rs => {
          for (let i = 0; i < lo.length; i++) lo[i].xong(rs[i])
        }, () => {
          // Bảng phụ/cột của bản cũ có thể chưa dựng: lỗi một SELECT không được làm mất các SELECT hợp lệ.
          // Đọc riêng khi batch thất bại; giữ nguyên fallback ở từng hàm gọi.
          for (const x of lo) void x.st.all().then(x.xong, x.loi)
        })
      })
    })
  }
  function boc(st: D1PreparedStatement): D1PreparedStatement {
    return {
      bind: (...tham) => boc(st.bind(...tham)),
      all: <T>() => doc(st) as Promise<D1Result<T>>,
      first: async <T>(cot?: string) => {
        const r = await doc(st), dong = r.results[0]
        return (cot ? (dong as Record<string, unknown> | undefined)?.[cot] ?? null : dong ?? null) as T | null
      },
      run: <T>() => st.run<T>(),
    }
  }
  return gan({ prepare: (sql: string) => boc(db.prepare(sql)), batch: db.batch.bind(db) }, db)
}
