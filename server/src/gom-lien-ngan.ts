// NGĂN GOM D1 LIÊN ISOLATE (31/10, thầy «máy chủ chạy cả trăm ngàn em cùng lúc»). Thử tải lượt 14 (10.000 em mở app dồn): D1 nhận ~500–600 LƯỢT GỬI / giây
// thì báo quá tải («Too many requests … queued») trong khi mỗi lượt chỉ chạy 0,5 ms (p50) / 5 ms (p99) — ở 2.000 em 320 lượt / giây vẫn 0 lỗi. Trần là SỐ LƯỢT
// GỬI, không phải số câu. Bộ gom trong isolate (gom-d1.ts) chỉ gộp được lệnh của 4–5 em chung isolate; ngăn này gộp lô của MỌI isolate gửi tới nó thành MỘT
// lượt gửi D1 (lô ≤ LO_GOM câu, chờ ≤ CHO_GOM_MS), rồi chia kết quả trả từng nơi gửi.
// Kết quả y hệt gửi thẳng: lô D1 là MỘT giao dịch — lô chung lỗi (không phải quá tải) ⇒ không câu nào đã ghi ⇒ chạy lại RIÊNG lô của từng nơi gửi (đúng kết quả /
// đúng lỗi của lô ấy; nơi gửi tự tách lẻ từng câu như cũ). D1 quá tải ⇒ báo nguyên lỗi cho mọi nơi gửi (bộ gom nơi gửi tự chờ rồi gửi lại).
// Chỉ nhận câu mang chữ SQL + tham số kiểu JSON an toàn (chuỗi, số hữu hạn, null, đúng / sai); câu khác nơi gửi tự chạy thẳng.
// Công tắc `BAT_GOM_LIEN_NGAN` (mặc định TẮT) + binding `GOM_D1`; thiếu một trong hai ⇒ đường cũ.
import type { D1Result, DurableObjectNamespace, DurableObjectState, Env } from './kieu'

/** Một câu gửi qua ngăn gom. */
export interface CauGui { q: string; v: unknown[] | null }
/** Số câu tối đa một lượt gửi D1 của ngăn gom. */
export const LO_GOM = 100
/** Chờ gom tối đa (ms) trước khi gửi. */
export const CHO_GOM_MS = 4
/** Số ngăn gom (mỗi isolate gửi về một ngăn cố định chọn ngẫu nhiên lúc thức). */
export const SO_NGAN_GOM = 8
const RE_QUA_TAI = /overloaded|queued for too long|too many requests/i

/** Tham số gửi được qua JSON mà không đổi nghĩa (số không hữu hạn, nhị phân, đối tượng ⇒ không). */
export function thamSoAnToan(v: unknown[] | null): boolean {
  if (!v) return true
  for (const x of v) {
    if (x === null || typeof x === 'string' || typeof x === 'boolean') continue
    if (typeof x === 'number' && Number.isFinite(x)) continue
    return false
  }
  return true
}

interface Cho { cau: CauGui[]; ok: (kq: D1Result[]) => void; loi: (e: string) => void }

export class NganGomD1 {
  private hang: Cho[] = []
  private soCau = 0
  private hen: ReturnType<typeof setTimeout> | null = null
  /** Đo: số lượt gửi D1 / số lượt nhận. */
  soGui = 0
  soNhan = 0
  constructor(private readonly state: DurableObjectState, private readonly env: Env) { void this.state }
  async fetch(req: Request): Promise<Response> {
    let cau: CauGui[]
    try { cau = ((await req.json()) as { cau: CauGui[] }).cau } catch { return Response.json({ loi: 'D1_ERROR: lô gom hỏng' }, { status: 400 }) }
    if (!Array.isArray(cau) || !cau.length) return Response.json({ kq: [] })
    this.soNhan++
    return new Promise<Response>((tra) => {
      this.hang.push({ cau, ok: (kq) => tra(Response.json({ kq })), loi: (e) => tra(Response.json({ loi: e })) })
      this.soCau += cau.length
      if (this.soCau >= LO_GOM) this.xa()
      else if (!this.hen) this.hen = setTimeout(() => this.xa(), CHO_GOM_MS)
    })
  }
  private xa(): void {
    if (this.hen) { clearTimeout(this.hen); this.hen = null }
    const ds = this.hang.splice(0)
    this.soCau = 0
    let lo: Cho[] = [], n = 0
    for (const x of ds) {
      if (lo.length && n + x.cau.length > LO_GOM) { void this.gui(lo); lo = []; n = 0 }
      lo.push(x); n += x.cau.length
    }
    if (lo.length) void this.gui(lo)
  }
  private chuanBi(cau: CauGui[]) {
    return cau.map((c) => { const st = this.env.DB.prepare(c.q); return c.v ? st.bind(...c.v) : st })
  }
  private async gui(lo: Cho[]): Promise<void> {
    this.soGui++
    const cau = lo.flatMap((x) => x.cau)
    try {
      const kq = await this.env.DB.batch(this.chuanBi(cau))
      if (!Array.isArray(kq) || kq.length !== cau.length) throw new Error('D1_ERROR: lô trả thiếu kết quả')
      let i = 0
      for (const x of lo) { x.ok(kq.slice(i, i + x.cau.length) as D1Result[]); i += x.cau.length }
    } catch (e) {
      const chu = String((e as Error)?.message ?? e)
      // quá tải ⇒ báo luôn (nơi gửi tự chờ rồi gửi lại); một nơi gửi ⇒ đó chính là lỗi của lô ấy
      if (RE_QUA_TAI.test(chu) || lo.length === 1) { for (const x of lo) x.loi(chu); return }
      // lô chung lỗi (giao dịch — chưa câu nào ghi) ⇒ chạy lại RIÊNG lô của từng nơi gửi
      await Promise.all(lo.map(async (x) => {
        this.soGui++
        try { x.ok(await this.env.DB.batch(this.chuanBi(x.cau)) as D1Result[]) } catch (e2) { x.loi(String((e2 as Error)?.message ?? e2)) }
      }))
    }
  }
}

/** Đường gửi qua ngăn gom cho bộ gom trong isolate (gom-d1.ts). Thiếu binding / công tắc ⇒ undefined (gửi thẳng như cũ). */
export function duongGuiQuaNganGom(env: Env): ((cau: CauGui[]) => Promise<D1Result[]>) | undefined {
  const ns = (env as { GOM_D1?: DurableObjectNamespace }).GOM_D1
  if (!env.BAT_GOM_LIEN_NGAN || !ns) return undefined
  const so = Math.max(1, Math.min(64, Number(env.BAT_GOM_LIEN_NGAN) > 1 ? Number(env.BAT_GOM_LIEN_NGAN) : SO_NGAN_GOM))
  const ten = `gom|${Math.floor(Math.random() * so)}`
  // Đầu nối tạo TRONG MỖI lần gửi (đúng ngăn đang gửi): bộ gom dùng chung cả isolate ⇒ đầu nối tạo sẵn ở ngăn A mà ngăn B dùng ⇒ Cloudflare báo
  // «Cannot perform I/O on behalf of a different Durable Object» (thử tải lượt 15, 31/10).
  return async (cau) => {
    const stub = ns.get(ns.idFromName(ten))
    const r = await stub.fetch(new Request('https://gom/lo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cau }) }))
    const j = (await r.json()) as { kq?: D1Result[]; loi?: string }
    if (j.loi !== undefined || !Array.isArray(j.kq)) throw new Error(j.loi ?? 'D1_ERROR: ngăn gom không trả kết quả')
    return j.kq
  }
}
