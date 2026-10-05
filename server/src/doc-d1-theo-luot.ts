// Gộp CHỈ SELECT độc lập của MỘT lượt game/hồ sơ. Không có kho/Promise dùng chung giữa các HTTP request.
// Ghi/CAS giữ nguyên lô và thứ tự; xả nhóm đọc trước khi gửi ghi. Không gộp ghi vào nhóm đọc.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { gan } from './cau-hinh-dem'
const DA_GOP = Symbol('omr.docD1TheoLuot')
/** Sổ nhớ ĐỌC của MỘT lượt (tối ưu 05/10): khoá → Promise kết quả. Chỉ bản gộp đọc (`gopDocD1(db, true)`) có; MỌI lệnh GHI của lượt xoá sạch. */
const NHO = Symbol('omr.nhoTheoLuot')
type SoNho = Map<string, Promise<unknown>>
const soNho = (db: D1Database): SoNho | undefined => (db as unknown as Record<symbol, SoNho | undefined>)[NHO]
/**
 * Đọc NHỚ THEO LƯỢT: cùng `khoa` trong CÙNG một request (cùng bản `gopDocD1`) và chưa có lệnh ghi nào xen giữa ⇒ dùng lại đúng Promise lần đọc trước
 * (trước: cùng một câu SELECT chạy lại nối tiếp — mùa game, cờ `exp_moi`, lớp của em… — mỗi lần một đợt D1). Ngoài bản gộp (D1 thô, bản Bi-a) ⇒ gọi thẳng `f`
 * (không nhớ chéo request). Lỗi ⇒ bỏ khỏi sổ (lần sau đọc lại như cũ). Giá trị nhớ dùng chung ⇒ nơi gọi KHÔNG được sửa đối tượng trả về.
 */
export function nhoTheoLuot<T>(db: D1Database, khoa: string, f: () => Promise<T>): Promise<T> {
  const m = soNho(db)
  if (!m) return f()
  const co = m.get(khoa)
  if (co) return co as Promise<T>
  const p = f()
  m.set(khoa, p)
  p.catch(() => { if (m.get(khoa) === p) m.delete(khoa) })
  return p
}
/** Gieo sẵn sổ nhớ bằng giá trị CHÍNH lượt này vừa đọc theo đường khác (vd. lô mùa + hồ sơ của `loadProfile`). Ngoài bản gộp ⇒ không làm gì. */
export function gieoNho(db: D1Database, khoa: string, giaTri: unknown): void {
  const m = soNho(db)
  if (m && !m.has(khoa)) m.set(khoa, Promise.resolve(giaTri))
}
/** Dòng mùa game (`game_v2_settings.season`) — đọc một lần mỗi lượt (hồ sơ, EXP, Đoàn, đồng bộ học tập đều cần). Không có dòng ⇒ null. */
export function docDongMua(db: D1Database): Promise<{ json: string } | null> {
  return nhoTheoLuot(db, 'mua', () => db.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{ json: string }>())
}
/** Lớp (`hoc_sinh.lop`) của em — đọc một lần mỗi lượt (cờ Hoá 2.0, Bi-a, Sảnh Đoàn). Không có dòng ⇒ null. */
export function docDongLop(db: D1Database, sbd: string): Promise<{ lop: string | null } | null> {
  return nhoTheoLuot(db, `lop|${sbd}`, () => db.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string | null }>())
}
export function gopDocD1(db: D1Database, bat = true): D1Database {
  if ((db as unknown as Record<symbol, unknown>)[DA_GOP]) return db
  if (typeof db.batch !== 'function') return db
  // Một số lệnh Bi-a đã đọc song song tối ưu: gộp hàm hồ sơ con thêm đợt chờ.
  // Đánh dấu RIÊNG request để hàm con giữ đường đọc cũ, không đánh dấu DB gốc.
  if (!bat) {
    const wrapped = gan({ prepare: db.prepare.bind(db), batch: db.batch.bind(db) }, db)
    Object.defineProperty(wrapped, DA_GOP, { value: true })
    return wrapped
  }
  type Cho = { st: D1PreparedStatement; xong: (r: D1Result) => void; loi: (e: unknown) => void }
  let ds: Cho[] = []
  const nho: SoNho = new Map()
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
      all: <T>() => { if (!laDoc) { nho.clear(); xa(); return gui(() => st.all<T>()) }; return doc(st) as Promise<D1Result<T>> },
      first: async <T>(cot?: string) => {
        if (!laDoc) { nho.clear(); xa(); return gui(() => st.first<T>(cot)) }
        const r = await doc(st), dong = r.results[0]
        return (cot ? (dong as Record<string, unknown> | undefined)?.[cot] ?? null : dong ?? null) as T | null
      },
      run: <T>() => { nho.clear(); xa(); return gui(() => st.run<T>()) },
    }
    goc.set(p, { st, doc: laDoc })
    return p
  }
  const wrapped = gan({
    prepare: (sql: string) => boc(db.prepare(sql), /^\s*SELECT\b/i.test(sql)),
    batch: <T>(cau: D1PreparedStatement[]) => {
      const that = cau.map(st => goc.get(st) ?? { st, doc: false })
      if (that.length && that.every(x => x.doc)) return Promise.all(that.map(x => doc(x.st))) as Promise<D1Result<T>[]>
      nho.clear()
      xa()
      return gui(() => db.batch<T>(that.map(x => x.st)))
    },
  }, db)
  Object.defineProperty(wrapped, DA_GOP, { value: true })
  Object.defineProperty(wrapped, NHO, { value: nho })
  return wrapped
}
