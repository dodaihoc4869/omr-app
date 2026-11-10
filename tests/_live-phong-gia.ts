// Đồ dùng chung cho các test LIVE BẢNG (10/11): Durable Object THẬT của phòng (server/src/phong-binh-phan-ung.ts) với ctx giả — kho `structuredClone`
// (giữ được Uint8Array như storage thật), kết nối WebSocket giả ghi lại mọi tin (chữ lẫn nhị phân) — và đồng hồ / hẹn giờ giả cho thư viện máy khách.
import { PhongBinhPhanUng } from '../server/src/phong-binh-phan-ung'
import type { KenhPhong, MoiTruongLive } from '../src/lib/live'

export type TinGia = string | Uint8Array
export interface WsGia { tin: TinGia[]; att: unknown; tag: string; dong: boolean; nhan?: (d: string | ArrayBuffer) => void; send(d: string | ArrayBuffer | ArrayBufferView): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown }
export function taoWs(): WsGia {
  return {
    tin: [], att: null, tag: '', dong: false,
    send(d) {
      if (this.dong) throw new Error('kết nối đã đóng')
      // Bản sao riêng cho mỗi máy nhận (như mạng thật) — phòng gửi CÙNG một vùng nhớ cho mọi máy.
      const ban: string | ArrayBuffer = typeof d === 'string' ? d : (d instanceof ArrayBuffer ? d.slice(0) : (d.buffer as ArrayBuffer).slice(d.byteOffset, d.byteOffset + d.byteLength))
      this.tin.push(typeof ban === 'string' ? ban : new Uint8Array(ban))
      this.nhan?.(ban)
    },
    close() { this.dong = true },
    serializeAttachment(v) { this.att = structuredClone(v) },
    deserializeAttachment() { return structuredClone(this.att) },
  }
}

export function datWebSocketPairGia(): void {
  ;(globalThis as unknown as { WebSocketPair: unknown }).WebSocketPair = class { 0 = taoWs(); 1 = taoWs() }
}

export interface KhoGia { du: Map<string, unknown>; ghi: number }
/** Phòng thật trên kho giả. Truyền `kho` + `dsWs` của phòng trước để giả «phòng ngủ rồi thức lại» (đối tượng mới, storage + kết nối cũ). */
export function taoPhongGia(cu?: { kho: KhoGia; dsWs: WsGia[] }) {
  const kho: KhoGia = cu?.kho ?? { du: new Map(), ghi: 0 }, dsWs: WsGia[] = cu?.dsWs ?? []
  const ctx = {
    storage: {
      get: async (k: string) => { const v = kho.du.get(k); return v === undefined ? undefined : structuredClone(v) },
      put: async (k: string, v: unknown) => { kho.ghi += 1; kho.du.set(k, structuredClone(v)) },
      delete: async (k: string) => kho.du.delete(k),
      setAlarm: async () => {}, getAlarm: async () => null, deleteAlarm: async () => {},
    },
    acceptWebSocket: (ws: WsGia, tags?: string[]) => { ws.tag = tags?.[0] ?? ''; dsWs.push(ws) },
    getWebSockets: (tag?: string) => dsWs.filter((w) => !w.dong && (!tag || w.tag === tag)),
    waitUntil: () => {},
  }
  const p = new PhongBinhPhanUng(ctx as never, { MA_BI_MAT: 'x' } as never)
  const noi = async (vai: 'gv' | 'hs', sbd = ''): Promise<WsGia> => {
    const truoc = dsWs.length
    await p.fetch(new Request('https://bpu/bpu/phong', { headers: { upgrade: 'websocket', 'x-bpu-vai': vai, 'x-bpu-sbd': sbd } })).catch(() => null)
    return dsWs[truoc]!
  }
  const post = (duong: string, b: unknown) => p.fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b) })).then((r) => r.json() as Promise<Record<string, unknown>>)
  /** Máy gửi một tin chữ lên phòng. */
  const gui = (ws: WsGia, tin: Record<string, unknown>) => p.webSocketMessage(ws as never, JSON.stringify(tin))
  /** Máy gửi một khung nhị phân lên phòng (bản sao riêng, như mạng thật). */
  const guiNp = (ws: WsGia, k: Uint8Array) => p.webSocketMessage(ws as never, (k.buffer as ArrayBuffer).slice(k.byteOffset, k.byteOffset + k.byteLength))
  const dong = async (ws: WsGia) => { ws.dong = true; await p.webSocketClose(ws as never) }
  /** Mở phòng buổi `b1` với các em (mặc định đã điểm danh) + công tắc live. */
  const khoi = (ds: { sbd: string; ten?: string; coMat?: boolean }[], live: { cho: boolean; sfu: boolean } | null = { cho: true, sfu: false }) =>
    post('/khoi', { buoiId: 'b1', lop: '12A1', ds: ds.map((x, i) => ({ sbd: x.sbd, ten: x.ten ?? `Em ${x.sbd}`, coMat: x.coMat !== false, luc: i + 1 })), ...(live ? { live } : {}) })
  return { p, ctx, kho, dsWs, noi, post, gui, guiNp, dong, khoi }
}
export type PhongGia = ReturnType<typeof taoPhongGia>

export const chu = (ws: WsGia): Record<string, unknown>[] => ws.tin.filter((t): t is string => typeof t === 'string').map((t) => JSON.parse(t) as Record<string, unknown>)
export const nhiPhan = (ws: WsGia): Uint8Array[] => ws.tin.filter((t): t is Uint8Array => typeof t !== 'string')
/** View mới nhất (`t: 'bang'` / `'em'`) máy đã nhận. */
export const viewCuoi = (ws: WsGia): Record<string, any> => { const ds = chu(ws).filter((m) => m.t === 'bang' || m.t === 'em'); return ds[ds.length - 1] as Record<string, any> }

/** Đồng hồ + hẹn giờ giả cho thư viện máy khách (`moiTruong`). `tien(ms)` chạy các hẹn tới hạn theo thứ tự. */
export function taoDongHoGia(batDau = 1000) {
  let gio = batDau, dem = 0
  let hen: { id: number; t: number; f: () => void }[] = []
  const mt: Partial<MoiTruongLive> = {
    dongHo: () => gio,
    hen: (f, ms) => { const id = ++dem; hen.push({ id, t: gio + Math.max(0, ms), f }); return id },
    huyHen: (h) => { hen = hen.filter((x) => x.id !== h) },
    ngauNhien: () => 0,
    fetch: (async () => new Response(JSON.stringify({ ok: false, lyDo: 'chua-cau-hinh' }))) as typeof fetch,
  }
  return {
    mt,
    gio: () => gio,
    tien(ms: number): void {
      const dich = gio + ms
      for (;;) {
        const ke = hen.filter((x) => x.t <= dich).sort((a, b) => a.t - b.t || a.id - b.id)[0]
        if (!ke) break
        hen = hen.filter((x) => x !== ke); gio = Math.max(gio, ke.t); ke.f()
      }
      gio = dich
    },
  }
}

/** Kênh phòng cho thư viện máy khách: gửi thẳng vào phòng giả; `xong()` chờ phòng xử lý hết các tin đã gửi. */
export function taoKenhGia(ph: PhongGia, ws: WsGia) {
  let cho: Promise<unknown> = Promise.resolve()
  const kenh: KenhPhong = {
    gui: (tin) => { cho = cho.then(() => ph.gui(ws, tin)) },
    guiNhiPhan: (k) => { const ban = k.slice(); cho = cho.then(() => ph.guiNp(ws, ban)) },
  }
  return { kenh, xong: async (): Promise<void> => { let truoc: Promise<unknown> | null = null; while (truoc !== cho) { truoc = cho; await cho } } }
}
