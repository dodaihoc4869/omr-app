// GOM LỆNH D1 (31/10, thử tải 2000 em ảo — `wrangler tail`: «D1_ERROR: D1 DB is overloaded. Too many requests for the same object within a 10 second
// window» + «Requests queued for too long», trong khi D1 chỉ bận 1,6 s / 180 s). D1 giới hạn SỐ YÊU CẦU tới cơ sở dữ liệu chứ không phải độ nặng: mỗi
// `.all() / .first() / .run()` rời là một yêu cầu; Sảnh lần đầu của một em ~150 yêu cầu ⇒ 17 em mới / giây là vượt trần.
// Cách gom (như DataLoader): mọi lệnh phát ra trong cùng một lượt vòng sự kiện (tới `setTimeout 0`) ⇒ MỘT `batch()` = MỘT yêu cầu. Kết quả y hệt:
// lô lỗi (một câu hỏng, bảng chưa có …) ⇒ chạy lại TỪNG câu riêng như cũ (lô D1 là một giao dịch — lỗi thì không câu nào đã ghi) ⇒ đúng kết quả / đúng lỗi
// của từng câu; câu từng lỗi khi chạy riêng thì về sau chạy riêng luôn (không kéo cả lô chạy lại). D1 quá tải ⇒ chờ ngẫu nhiên rồi gửi lại cả lô (tối đa 3 lần),
// KHÔNG tách lẻ từng câu (tách lẻ chỉ dồn thêm yêu cầu).
// `batch()` tường minh của mã giữ nguyên khối (một giao dịch) nhưng đi chung lô với việc khác cùng lượt. Đệm theo D1 gốc (`dbGoc`) không đổi.
import type { D1Database, D1PreparedStatement, D1Result } from './kieu'
import { D1_GOC, dbGoc } from './cau-hinh-dem'

type Kieu = 'all' | 'first' | 'run'
/** Một việc trong hàng: một câu rời (`mot`) hoặc một `batch()` tường minh của mã (`mot` = null — giữ nguyên khối, kết quả trả cả mảng). */
interface Viec { ds: (CauGom | D1PreparedStatement)[]; mot: { kieu: Kieu; cot?: string } | null; khoa: string; ok: (v: unknown) => void; loi: (e: unknown) => void; lan?: number }

/** Số câu tối đa một lô. */
export const LO_TOI_DA = 40
const RE_QUA_TAI = /overloaded|queued for too long|too many requests/i
/** Việc (theo chữ SQL) từng lỗi khi chạy riêng ⇒ không đưa vào lô nữa. */
const cauHayLoi = new Set<string>()
const that = (x: CauGom | D1PreparedStatement): D1PreparedStatement => (x instanceof CauGom ? x.that() : x)

/** Bộ đếm theo lệnh (đo): số câu D1 và các lượt xả (≈ số vòng chờ D1 nối tiếp) mà lệnh đã dùng. */
export interface DemLenhD1 { cau: number; vong: Set<number> }

class CauGom {
  constructor(readonly g: Gom, readonly q: string, readonly v: unknown[] | null, readonly dem?: DemLenhD1) {}
  bind(...v: unknown[]): CauGom { return new CauGom(this.g, this.q, v, this.dem) }
  all<T = unknown>(): Promise<D1Result<T>> { return this.g.xep([this], { kieu: 'all' }, this.q, this.dem) as Promise<D1Result<T>> }
  first<T = unknown>(cot?: string): Promise<T | null> { return this.g.xep([this], { kieu: 'first', cot }, this.q, this.dem) as Promise<T | null> }
  run<T = unknown>(): Promise<D1Result<T>> { return this.g.xep([this], { kieu: 'run' }, this.q, this.dem) as Promise<D1Result<T>> }
  /** Câu thật của D1 gốc (dựng lúc chạy — giá trị gắn giữ riêng trong câu gom). */
  that(): D1PreparedStatement { const st = this.g.goc.prepare(this.q); return this.v ? st.bind(...this.v) : st }
}

class Gom {
  private hang: Viec[] = []
  private hen = false
  /** Số yêu cầu D1 thật đã gửi / số lệnh đã nhận (đo). */
  soYeuCau = 0
  soLenh = 0
  /** Số lượt xả hàng (mỗi lượt ≥ một yêu cầu D1). */
  lanXa = 0
  constructor(readonly goc: D1Database) {}
  xep(ds: (CauGom | D1PreparedStatement)[], mot: Viec['mot'], khoa: string, dem?: DemLenhD1): Promise<unknown> {
    this.soLenh++
    if (dem) { dem.cau += ds.length; dem.vong.add(this.lanXa + 1) }
    return new Promise((ok, loi) => {
      this.hang.push({ ds, mot, khoa, ok, loi })
      if (!this.hen) { this.hen = true; setTimeout(() => this.xa(), 0) }
    })
  }
  private xa(): void {
    this.hen = false
    this.lanXa++
    const ds = this.hang.splice(0)
    let lo: Viec[] = [], n = 0
    for (const x of ds) {
      if (cauHayLoi.has(x.khoa) || x.ds.length >= LO_TOI_DA) { this.chayRieng(x); continue }
      if (n + x.ds.length > LO_TOI_DA) { this.chayLo(lo); lo = []; n = 0 }
      lo.push(x); n += x.ds.length
    }
    if (lo.length) this.chayLo(lo)
  }
  /** Trả kết quả cho một việc từ mảng kết quả của nó. */
  private tra(x: Viec, kq: D1Result<Record<string, unknown>>[]): void {
    if (!x.mot) return x.ok(kq)
    const r = kq[0]!
    if (x.mot.kieu !== 'first') return x.ok(r)
    const dong = r?.results?.[0] ?? null
    x.ok(dong && x.mot.cot !== undefined ? (dong[x.mot.cot] ?? null) : dong)
  }
  private chayRieng(x: Viec): void {
    this.soYeuCau++
    let p: Promise<unknown>
    try {
      if (!x.mot) p = this.goc.batch(x.ds.map(that))
      else {
        const st = that(x.ds[0]!)
        p = x.mot.kieu === 'all' ? st.all() : x.mot.kieu === 'run' ? st.run() : st.first(x.mot.cot)
      }
    } catch (e) { p = Promise.reject(e) }
    p.then(x.ok, (e) => {
      if (RE_QUA_TAI.test(String(e))) { if (!this.choLai([x], e)) x.loi(e); return }
      if (cauHayLoi.size > 500) cauHayLoi.clear()
      cauHayLoi.add(x.khoa)
      x.loi(e)
    })
  }
  /**
   * D1 QUÁ TẢI («Too many requests … within a 10 second window», «Requests queued for too long» — yêu cầu bị từ chối TRƯỚC khi chạy) ⇒ chờ một lúc ngẫu nhiên
   * rồi xếp lại (tối đa 3 lần: ~0,3 / 0,9 / 2 s) thay vì báo «Máy chủ đang bận» ngay: dồn tải lúc mở app được trải ra, em chỉ chờ lâu hơn chút.
   */
  private choLai(ds: Viec[], e: unknown): boolean {
    const lan = Math.max(...ds.map((x) => x.lan ?? 0))
    if (lan >= 3) return false
    const cho = [300, 900, 2000][lan]! * (0.5 + Math.random())
    setTimeout(() => { for (const x of ds) { x.lan = lan + 1; this.hang.push(x) } if (!this.hen) { this.hen = true; setTimeout(() => this.xa(), 0) } }, cho)
    void e
    return true
  }
  private chayLo(lo: Viec[]): void {
    if (lo.length === 1) { this.chayRieng(lo[0]!); return }
    this.soYeuCau++
    const cau = lo.flatMap((x) => x.ds)
    let p: Promise<D1Result<Record<string, unknown>>[]>
    try { p = this.goc.batch<Record<string, unknown>>(cau.map(that)) } catch (e) { p = Promise.reject(e) }
    p.then(
      (kq) => {
        if (!Array.isArray(kq) || kq.length !== cau.length) { const e = new Error('D1_ERROR: lô trả thiếu kết quả'); for (const x of lo) x.loi(e); return }
        let i = 0
        for (const x of lo) { this.tra(x, kq.slice(i, i + x.ds.length)); i += x.ds.length }
      },
      (e) => {
        // Lô D1 là MỘT giao dịch: lỗi ⇒ không câu nào đã ghi ⇒ chạy lại từng việc riêng cho đúng kết quả / lỗi của nó. Quá tải ⇒ báo luôn, không dồn thêm.
        if (RE_QUA_TAI.test(String(e))) { if (!this.choLai(lo, e)) for (const x of lo) x.loi(e); return }
        for (const x of lo) this.chayRieng(x)
      },
    )
  }
}

export interface D1Gom extends D1Database {
  readonly gom: { soYeuCau: number; soLenh: number }
  /** Bản xem đếm câu / vòng của MỘT lệnh (đo), dùng chung bộ gom và khoá đệm D1 gốc. */
  voiDem(dem: DemLenhD1): D1Database
}

/** Bọc D1: lệnh rời + batch() tường minh trong cùng lượt ⇒ một lô. Sessions API giữ nguyên nghĩa. */
export function gomD1(goc: D1Database): D1Gom {
  const g = new Gom(goc)
  const xem = (dem: DemLenhD1): D1Database => {
    const v: D1Database = {
      prepare: (q: string) => new CauGom(g, q, null, dem) as unknown as D1PreparedStatement,
      batch: <T = unknown>(ds: D1PreparedStatement[]) => (ds.length ? g.xep(ds as (CauGom | D1PreparedStatement)[], null, ds.map((x) => (x instanceof CauGom ? x.q : '?')).join('\n'), dem) : goc.batch<T>([])) as Promise<D1Result<T>[]>,
      ...(db.withSession ? { withSession: db.withSession } : {}),
    }
    ;(v as unknown as Record<symbol, unknown>)[D1_GOC] = dbGoc(goc as unknown as object)
    return v
  }
  const db: D1Gom = {
    gom: g,
    voiDem: (dem) => xem(dem),
    prepare: (q: string) => new CauGom(g, q, null) as unknown as D1PreparedStatement,
    // batch() tường minh: giữ nguyên khối (một giao dịch), đi chung lô với việc khác cùng lượt.
    batch: <T = unknown>(ds: D1PreparedStatement[]) => (ds.length ? g.xep(ds as (CauGom | D1PreparedStatement)[], null, ds.map((x) => (x instanceof CauGom ? x.q : '?')).join('\n')) : goc.batch<T>([])) as Promise<D1Result<T>[]>,
    ...(goc.withSession ? { withSession: (c?: string) => { const s = goc.withSession!(c as never); return s === (goc as unknown) ? db : gomD1(s as unknown as D1Database) } } : {}),
  }
  ;(db as unknown as Record<symbol, unknown>)[D1_GOC] = dbGoc(goc as unknown as object)
  return db
}
