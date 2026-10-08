// Gộp CHỈ SELECT độc lập của MỘT lượt game/hồ sơ. Không có kho/Promise dùng chung giữa các HTTP request.
// Ghi/CAS giữ nguyên lô và thứ tự; xả nhóm đọc trước khi gửi ghi. Không gộp ghi vào nhóm đọc.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { gan } from './cau-hinh-dem'
import { dangKyXoaDem } from './dem-chung'
const DA_GOP = Symbol('omr.docD1TheoLuot')
/** Sổ nhớ ĐỌC của MỘT lượt (tối ưu 05/10): khoá → Promise kết quả (+ các BẢNG mà lượt đọc ấy đọc). Chỉ bản gộp đọc (`gopDocD1(db, true)`) có.
 *  Lệnh GHI của lượt xoá: mục KHÔNG khai bảng ⇒ mọi lệnh ghi xoá (như trước); mục có khai bảng ⇒ chỉ lệnh ghi mà câu SQL CÓ NHẮC tới một trong các bảng ấy mới xoá
 *  (lược đồ không có trigger/khoá ngoại cascade ⇒ một lệnh ghi chỉ đổi đúng bảng nó nhắc tên; so khớp nguyên từ, thà xoá thừa). */
const NHO = Symbol('omr.nhoTheoLuot')
type SoNho = Map<string, { p: Promise<unknown>; bang?: readonly string[] }>
const soNho = (db: D1Database): SoNho | undefined => (db as unknown as Record<symbol, SoNho | undefined>)[NHO]
const nhacBang = (sql: string, bang: string): boolean => new RegExp(`\\b${bang}\\b`, 'i').test(sql)
/** Xoá khỏi sổ nhớ các mục có thể bị lệnh ghi `sql` (cả lô: nối các câu) làm cũ. */
function xoaNhoSauGhi(nho: SoNho, sql: string): void {
  for (const [k, v] of nho) if (!v.bang || v.bang.some((b) => nhacBang(sql, b))) nho.delete(k)
}
/**
 * Đọc NHỚ THEO LƯỢT: cùng `khoa` trong CÙNG một request (cùng bản `gopDocD1`) và chưa có lệnh ghi nào (đụng `bang`) xen giữa ⇒ dùng lại đúng Promise lần đọc trước
 * (trước: cùng một câu SELECT chạy lại nối tiếp — mùa game, cờ `exp_moi`, lớp của em… — mỗi lần một đợt D1). Ngoài bản gộp (D1 thô, bản Bi-a) ⇒ gọi thẳng `f`
 * (không nhớ chéo request). Lỗi ⇒ bỏ khỏi sổ (lần sau đọc lại như cũ). Giá trị nhớ dùng chung ⇒ nơi gọi KHÔNG được sửa đối tượng trả về.
 * `bang`: các bảng câu đọc của `f` đọc (vắng ⇒ mọi lệnh ghi đều xoá mục này).
 */
export function nhoTheoLuot<T>(db: D1Database, khoa: string, f: () => Promise<T>, bang?: readonly string[]): Promise<T> {
  const m = soNho(db)
  if (!m) return f()
  const co = m.get(khoa)
  if (co) return co.p as Promise<T>
  const p = f()
  const muc = { p, bang }
  m.set(khoa, muc)
  p.catch(() => { if (m.get(khoa) === muc) m.delete(khoa) })
  return p
}
/** Gieo sẵn sổ nhớ bằng giá trị CHÍNH lượt này vừa đọc theo đường khác (vd. lô mùa + hồ sơ của `loadProfile`). Ngoài bản gộp ⇒ không làm gì.
 *  `giaTri` là Promise (lượt đọc ĐANG bay của chính lượt này) ⇒ người hỏi sau dùng chung lượt ấy; lỗi ⇒ bỏ khỏi sổ (hỏi lại thì đọc lại như cũ). */
export function gieoNho(db: D1Database, khoa: string, giaTri: unknown, bang?: readonly string[]): void {
  const m = soNho(db)
  if (!m || m.has(khoa)) return
  const p = giaTri instanceof Promise ? giaTri : Promise.resolve(giaTri)
  const muc = { p, bang }
  m.set(khoa, muc)
  p.catch(() => { if (m.get(khoa) === muc) m.delete(khoa) })
}
/** Sổ nhớ của lượt ĐÃ có `khoa` (đang bay hoặc xong) chưa? Ngoài bản gộp ⇒ false. Chỉ để nơi gọi quyết có ĐỌC ĐOÁN TRƯỚC hay không (không đổi kết quả). */
export function daNho(db: D1Database, khoa: string): boolean {
  return !!soNho(db)?.has(khoa)
}
/** Bảng của các mục nhớ dùng chung (khai MỘT chỗ). */
export const BANG_MUA: readonly string[] = ['game_v2_settings']
export const BANG_LOP: readonly string[] = ['hoc_sinh']
export const BANG_CAU_HINH: readonly string[] = ['cau_hinh']
export const BANG_HO_SO: readonly string[] = ['game_v2_settings', 'game_v2_profile']
/** Dòng mùa game (`game_v2_settings.season`) — đọc một lần mỗi lượt (hồ sơ, EXP, Đoàn, đồng bộ học tập đều cần). Không có dòng ⇒ null. */
export function docDongMua(db: D1Database): Promise<{ json: string } | null> {
  return nhoTheoLuot(db, 'mua', () => db.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{ json: string }>(), BANG_MUA)
}
/** Lớp (`hoc_sinh.lop`) của em — đọc một lần mỗi lượt (cờ Hoá 2.0, Bi-a, Sảnh Đoàn). Không có dòng ⇒ null. */
export function docDongLop(db: D1Database, sbd: string): Promise<{ lop: string | null } | null> {
  return nhoTheoLuot(db, `lop|${sbd}`, () => db.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string | null }>(), BANG_LOP)
}
/**
 * RÀO GHI (tối ưu 05/10 — lệnh game khi đệm "cổng đóng băng" của reset vừa hết hạn, index.ts): mọi lệnh GHI qua bản này CHỜ `rao` (lượt đọc cổng đang bay);
 * cổng báo đang đóng băng ⇒ `rao` bị từ chối ⇒ lệnh ghi bị từ chối, KHÔNG tới D1. Lệnh ĐỌC (SELECT) đi ngay — nhờ vậy lượt đọc cổng chạy CÙNG đợt với
 * các lượt đọc đầu của lệnh thay vì một đợt riêng trước. Khoá trên `env`: `RAO_GHI` (index.ts đặt, `gameV2` dùng).
 */
export const RAO_GHI = Symbol('omr.raoGhi')
export function raoGhiD1(db: D1Database, rao: Promise<unknown>): D1Database {
  const goc = new WeakMap<D1PreparedStatement, { st: D1PreparedStatement; doc: boolean }>()
  const boc = (st: D1PreparedStatement, doc: boolean): D1PreparedStatement => {
    const p: D1PreparedStatement = {
      bind: (...tham) => boc(st.bind(...tham), doc),
      first: <T>(cot?: string) => (doc ? st.first<T>(cot) : rao.then(() => st.first<T>(cot))),
      all: <T>() => (doc ? st.all<T>() : rao.then(() => st.all<T>())),
      run: <T>() => rao.then(() => st.run<T>()),
    }
    goc.set(p, { st, doc })
    return p
  }
  return gan({
    prepare: (sql: string) => boc(db.prepare(sql), /^\s*SELECT\b/i.test(sql)),
    batch: <T>(cau: D1PreparedStatement[]) => {
      const that = cau.map((st) => goc.get(st) ?? { st, doc: false })
      const chay = () => db.batch<T>(that.map((x) => x.st))
      return that.length && that.every((x) => x.doc) ? chay() : rao.then(chay)
    },
  }, db)
}
/**
 * ĐỆM ISOLATE "BẢNG CHƯA CÓ" (tối ưu 05/10): một câu ĐỌC nhắc bảng phụ chưa được tạo (bảng dựng lười bằng DDL, vd. `chien_dich_em`, `loi_giai_hoi`)
 * làm HỎNG CẢ LÔ đọc gộp ⇒ trước: mọi câu của lô chạy lại từng câu ở MỘT ĐỢT SAU. Nay: bảng D1 báo "no such table: X" được nhớ trong isolate
 * `HAN_BANG_VANG` ms; trong thời gian ấy câu nhắc X đi RIÊNG (song song với lô, không vào lô) ⇒ lô của các câu còn lại không hỏng theo. Câu đi riêng
 * vẫn ra ĐÚNG kết quả như cũ (bảng đã có ⇒ đọc bình thường; chưa có ⇒ lỗi ở đúng câu ấy, nơi gọi tự bắt như cũ). Chỉ đổi cách GỬI, không đổi kết quả.
 */
const BANG_VANG = new Map<string, number>()
export const HAN_BANG_VANG = 60_000
const RE_BANG_VANG = /no such table:\s*(?:main\.)?([A-Za-z_][A-Za-z0-9_]*)/i
function ghiBangVang(e: unknown): void {
  const m = RE_BANG_VANG.exec(e instanceof Error ? e.message : String(e))
  if (m) BANG_VANG.set(m[1]!.toLowerCase(), Date.now() + HAN_BANG_VANG)
}
function nhacBangVang(sql: string): boolean {
  if (!BANG_VANG.size || !sql) return false
  const bay = Date.now()
  for (const [bang, het] of BANG_VANG) {
    if (het <= bay) { BANG_VANG.delete(bang); continue }
    if (new RegExp(`\\b${bang}\\b`, 'i').test(sql)) return true
  }
  return false
}
/** Xoá đệm "bảng chưa có" (test; `xoaMoiDem()` cũng gọi — mỗi D1 giả mới của test bắt đầu sạch). */
export function xoaDemBangVang(): void { BANG_VANG.clear() }
dangKyXoaDem(xoaDemBangVang)
/** `db` đã là bản gộp đọc của một lượt (có hàng rào + sổ nhớ của lượt)? */
export const laBanGop = (db: D1Database): boolean => !!(db as unknown as Record<symbol, unknown>)[DA_GOP]
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
  type Cho = { st: D1PreparedStatement; xong: (r: D1Result) => void; loi: (e: unknown) => void; sql: string }
  let ds: Cho[] = []
  const nho: SoNho = new Map()
  // Hàng rào chỉ thuộc request này: SELECT độc lập được song song; ghi chờ các đọc trước nó,
  // đọc sau ghi chờ ghi xong. Giữ nguyên CAS/lô ghi, không chặn đọc bởi đọc khác.
  let truoc: Promise<void> = Promise.resolve(), ghi: Promise<void> = Promise.resolve()
  // Một request đã gặp quá tải phải dừng cả các bước sau; không ghi kế hoạch
  // từ dữ liệu rỗng do tầng gọi bắt lỗi đọc. Request mới vẫn được thử bình thường.
  let loiQuaTai: unknown = null
  const laQuaTai = (e: unknown) => /overloaded|requests queued for too long|too many requests|SQLITE_BUSY/i.test(e instanceof Error ? e.message : String(e))
  const nhanLoi = (e: unknown) => { if (laQuaTai(e)) loiQuaTai = e }
  function gui<T>(chay: () => Promise<T>): Promise<T> {
    const p = truoc.then(() => { if (loiQuaTai) throw loiQuaTai; return chay() }).catch(e => { nhanLoi(e); throw e })
    ghi = p.then(() => undefined, () => undefined)
    truoc = ghi
    return p
  }
  const goc = new WeakMap<D1PreparedStatement, { st: D1PreparedStatement; doc: boolean; sql: string }>()
  function xa(): void {
    const lo = ds; ds = []
    if (!lo.length) return
    const p = ghi.then(async () => {
      if (loiQuaTai) { for (const x of lo) x.loi(loiQuaTai); return }
      // Câu nhắc bảng isolate này đã thấy "chưa có" ⇒ đi riêng, song song với lô (đệm `BANG_VANG`); lô chỉ gồm câu còn lại.
      const motMinh = (x: Cho) => x.st.all().then(x.xong, (e: unknown) => { nhanLoi(e); ghiBangVang(e); x.loi(e) })
      const rieng = BANG_VANG.size ? lo.filter((x) => nhacBangVang(x.sql)) : []
      const chung = rieng.length ? lo.filter((x) => !rieng.includes(x)) : lo
      const chayRieng = rieng.map(motMinh)
      try {
        if (chung.length) {
          const rs = await db.batch(chung.map(x => x.st))
          for (let i = 0; i < chung.length; i++) chung[i].xong(rs[i])
        }
      } catch (e) {
        nhanLoi(e)
        // CHỈ tách lô khi bảng/cột phụ thiếu. Quá tải/mất kết nối/lỗi khác:
        // không nhân một lô lỗi thành hàng chục truy vấn gửi lại vào D1.
        if (/no such (?:table|column):/i.test(e instanceof Error ? e.message : String(e)) && !loiQuaTai) {
          ghiBangVang(e)
          await Promise.all(chung.map(motMinh))
        } else {
          for (const x of chung) x.loi(e)
        }
      }
      await Promise.all(chayRieng)
    })
    truoc = Promise.all([truoc, p]).then(() => undefined)
  }
  function doc(st: D1PreparedStatement, sql = ''): Promise<D1Result> {
    if (loiQuaTai) return Promise.reject(loiQuaTai)
    return new Promise((xong, loi) => {
      ds.push({ st, xong, loi, sql })
      if (ds.length !== 1) return
      queueMicrotask(xa)
    })
  }
  function boc(st: D1PreparedStatement, laDoc: boolean, sql: string): D1PreparedStatement {
    const p: D1PreparedStatement = {
      bind: (...tham) => boc(st.bind(...tham), laDoc, sql),
      all: <T>() => { if (!laDoc) { xoaNhoSauGhi(nho, sql); xa(); return gui(() => st.all<T>()) }; return doc(st, sql) as Promise<D1Result<T>> },
      first: async <T>(cot?: string) => {
        if (!laDoc) { xoaNhoSauGhi(nho, sql); xa(); return gui(() => st.first<T>(cot)) }
        const r = await doc(st, sql), dong = r.results[0]
        return (cot ? (dong as Record<string, unknown> | undefined)?.[cot] ?? null : dong ?? null) as T | null
      },
      run: <T>() => { xoaNhoSauGhi(nho, sql); xa(); return gui(() => st.run<T>()) },
    }
    goc.set(p, { st, doc: laDoc, sql })
    return p
  }
  const wrapped = gan({
    prepare: (sql: string) => boc(db.prepare(sql), /^\s*SELECT\b/i.test(sql), sql),
    batch: <T>(cau: D1PreparedStatement[]) => {
      // Câu không qua `prepare` của bản này (không biết SQL) ⇒ coi như nhắc MỌI bảng (xoá cả sổ nhớ, như trước).
      const that = cau.map(st => goc.get(st) ?? { st, doc: false, sql: '' })
      if (that.length && that.every(x => x.doc)) return Promise.all(that.map(x => doc(x.st, x.sql))) as Promise<D1Result<T>[]>
      if (that.some(x => !x.sql)) nho.clear()
      else xoaNhoSauGhi(nho, that.map(x => x.sql).join(' ;; '))
      xa()
      return gui(() => db.batch<T>(that.map(x => x.st)))
    },
  }, db)
  Object.defineProperty(wrapped, DA_GOP, { value: true })
  Object.defineProperty(wrapped, NHO, { value: nho })
  return wrapped
}
