// @vitest-environment node
// Bình Phản Ứng — NHỊP PHÁT KHI NHIỀU EM NỘP DỒN (tác tử tốc độ 10/11). Trước: mỗi bài nộp phát view tới thầy + MỌI máy em (10 em nộp = 10 tin tới bảng, 100 tin cả phòng,
// mỗi tin mang cả đề ⇒ bảng vẽ lại 10 lần). Nay: tin đầu đi ngay, các tin kế trong 120 ms gom thành MỘT lần phát cuối (đúng trạng thái mới nhất).
// Khoá: (1) em nộp lẻ KHÔNG trễ (tin đầu đi ngay); (2) 10 em dồn ⇒ bảng nhận ≤ 3 tin, tin cuối có đủ 10 bài; (3) mỗi em nhận `tra-kq` NGAY; (4) máy em nào cũng thấy
// trạng thái cuối; (5) thầy mở đáp án ngay sau lượt dồn ⇒ không có tin gom cũ đè lên (tin cuối là kết quả).
import { beforeAll, describe, expect, it } from 'vitest'
import { PhongBinhPhanUng } from '../server/src/phong-binh-phan-ung'

type WsGia = { tin: string[]; att: unknown; send(d: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown; tag: string }
const taoWs = (): WsGia => ({ tin: [], att: null, tag: '', send(d) { this.tin.push(d) }, close() {}, serializeAttachment(v) { this.att = v }, deserializeAttachment() { return this.att } })
beforeAll(() => { ;(globalThis as unknown as { WebSocketPair: unknown }).WebSocketPair = class { 0 = taoWs(); 1 = taoWs() } })

function taoPhong() {
  const kho = new Map<string, unknown>(), dsWs: WsGia[] = []
  const ctx = {
    storage: { get: async (k: string) => kho.get(k), put: async (k: string, v: unknown) => { kho.set(k, JSON.parse(JSON.stringify(v))) }, delete: async (k: string) => kho.delete(k), setAlarm: async () => {}, getAlarm: async () => null, deleteAlarm: async () => {} },
    acceptWebSocket: (ws: WsGia, tags?: string[]) => { ws.tag = tags?.[0] ?? ''; dsWs.push(ws) },
    getWebSockets: (tag?: string) => dsWs.filter((w) => !tag || w.tag === tag),
    waitUntil: () => {},
  }
  const p = new PhongBinhPhanUng(ctx as never, { MA_BI_MAT: 'x' } as never)
  const noi = async (vai: 'gv' | 'hs', sbd = '') => {
    const truoc = dsWs.length
    await p.fetch(new Request('https://bpu/bpu/phong', { headers: { upgrade: 'websocket', 'x-bpu-vai': vai, 'x-bpu-sbd': sbd } })).catch((e) => e)
    return dsWs[truoc]!
  }
  const post = (duong: string, b: unknown) => p.fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b) })).then((r) => r.json() as Promise<Record<string, unknown>>)
  return { p, noi, post }
}
const cho = (ms: number) => new Promise((r) => setTimeout(r, ms))
const SO_EM = 10
async function lopDangLam() {
  const { p, noi, post } = taoPhong()
  const ds = Array.from({ length: SO_EM }, (_, i) => ({ sbd: `S${i}`, ten: `Em ${i} A`, coMat: true, luc: i + 1 }))
  await post('/khoi', { buoiId: 'b1', lop: '12A1', ds })
  const gv = await noi('gv')
  const em = await Promise.all(ds.map((e) => noi('hs', e.sbd)))
  await post('/luot', { qid: 'q1', phan: 'I', tuLuan: false, cau: { qid: 'q1', text: 'Đề', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 0 })
  await cho(130) // lượt vừa mở đã phát một lần; chờ qua nhịp để đo đúng đợt nộp
  gv.tin.length = 0; em.forEach((w) => { w.tin.length = 0 })
  return { p, gv, em }
}

describe('nhịp phát khi nhiều em nộp dồn', () => {
  it('em nộp lẻ: bảng nhận NGAY (không chờ hẹn giờ)', async () => {
    const { p, gv, em } = await lopDangLam()
    await p.webSocketMessage(em[0] as never, JSON.stringify({ t: 'tra', chon: 'B' }))
    expect(gv.tin).toHaveLength(1)
    expect(JSON.parse(gv.tin[0]!).luot.daGui).toEqual(['S0'])
  })
  it('10 em nộp liên tiếp: bảng nhận ≤ 3 tin, tin cuối có đủ 10 bài; mỗi em nhận tra-kq ngay', async () => {
    const { p, gv, em } = await lopDangLam()
    for (let i = 0; i < SO_EM; i++) await p.webSocketMessage(em[i] as never, JSON.stringify({ t: 'tra', chon: 'AB'[i % 2] }))
    for (const w of em) expect(w.tin.some((t) => t.includes('"tra-kq"'))).toBe(true)
    await cho(200)
    expect(gv.tin.length).toBeLessThanOrEqual(3)
    expect(JSON.parse(gv.tin.at(-1)!).luot.daGui).toHaveLength(SO_EM)
    for (const w of em) expect(JSON.parse(w.tin.filter((t) => t.includes('"t":"em"')).at(-1)!).luot.daGui).toBe(SO_EM)
  })
  it('thầy mở đáp án ngay sau lượt dồn ⇒ tin cuối là kết quả, hẹn giờ gom cũ không phát đè', async () => {
    const { p, gv, em } = await lopDangLam()
    for (let i = 0; i < SO_EM; i++) await p.webSocketMessage(em[i] as never, JSON.stringify({ t: 'tra', chon: 'B' }))
    await p.webSocketMessage(gv as never, JSON.stringify({ t: 'mo' }))
    const n = gv.tin.length
    await cho(200)
    expect(gv.tin.length).toBe(n)
    expect(JSON.parse(gv.tin.at(-1)!).luot.pha).toBe('mo')
  })
})
