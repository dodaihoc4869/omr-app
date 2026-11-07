// @vitest-environment node
// Bình Phản Ứng — Durable Object thật (server/src/phong-binh-phan-ung.ts) với ctx giả: một máy thầy + hai máy em qua WebSocket.
// Khoá: (1) mọi tin tới máy em KHÔNG có đáp án trước khi thầy mở; (2) vai do vé quyết định (vé em không thành vé thầy); (3) mở đáp án chỉ từ máy thầy.
import { beforeAll, describe, expect, it } from 'vitest'
import { PhongBinhPhanUng, kiemVeBpu, kyVeBpu } from '../server/src/phong-binh-phan-ung'

type WsGia = { tin: string[]; att: unknown; send(d: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown; tag: string }
const taoWs = (): WsGia => ({ tin: [], att: null, tag: '', send(d) { this.tin.push(d) }, close() {}, serializeAttachment(v) { this.att = v }, deserializeAttachment() { return this.att } })

beforeAll(() => {
  ;(globalThis as unknown as { WebSocketPair: unknown }).WebSocketPair = class { 0 = taoWs(); 1 = taoWs() }
})

function taoPhong() {
  const kho = new Map<string, unknown>(), dsWs: WsGia[] = [], hen: number[] = []
  const ctx = {
    storage: { get: async (k: string) => kho.get(k), put: async (k: string, v: unknown) => { kho.set(k, JSON.parse(JSON.stringify(v))) }, delete: async (k: string) => kho.delete(k), setAlarm: async (t: number) => { hen.push(t) }, getAlarm: async () => null, deleteAlarm: async () => {} },
    acceptWebSocket: (ws: WsGia, tags?: string[]) => { ws.tag = tags?.[0] ?? ''; dsWs.push(ws) },
    getWebSockets: (tag?: string) => dsWs.filter((w) => !tag || w.tag === tag),
    waitUntil: () => {},
  }
  const p = new PhongBinhPhanUng(ctx as never, { MA_BI_MAT: 'x' } as never)
  const noi = async (vai: 'gv' | 'hs', sbd = '') => {
    const truoc = dsWs.length
    const r = await p.fetch(new Request('https://bpu/bpu/phong', { headers: { upgrade: 'websocket', 'x-bpu-vai': vai, 'x-bpu-sbd': sbd } })).catch((e) => e)
    void r
    return dsWs[truoc]!
  }
  const post = (duong: string, b: unknown) => p.fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b) })).then((r) => r.json() as Promise<Record<string, unknown>>)
  return { p, noi, post, hen, kho }
}

describe('phòng Bình Phản Ứng (Durable Object)', () => {
  it('máy em không nhận đáp án trước khi mở; mở đáp án chỉ máy thầy làm được', async () => {
    const { p, noi, post } = taoPhong()
    await post('/khoi', { buoiId: 'b1', lop: '12A1', ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: 2 }, { sbd: 'S3', ten: 'Lê Chi', coMat: false, luc: null }] })
    const gv = await noi('gv'), em1 = await noi('hs', 'S1'), em2 = await noi('hs', 'S2')
    const r = await post('/luot', { qid: 'q1', phan: 'I', tuLuan: false, cau: { qid: 'q1', text: 'Đề', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 })
    expect(r.ok).toBe(true)
    expect(r.coMat).toEqual(['S1', 'S2'])
    await p.webSocketMessage(em1 as never, JSON.stringify({ t: 'tra', chon: 'B' }))
    await p.webSocketMessage(em2 as never, JSON.stringify({ t: 'tra', chon: 'A' }))
    // Em thử tự mở đáp án ⇒ không có tác dụng.
    await p.webSocketMessage(em2 as never, JSON.stringify({ t: 'mo' }))
    for (const t of [...em1.tin, ...em2.tin]) expect(t).not.toContain('"dung"')
    for (const t of gv.tin) expect(t).not.toContain('"dung"')
    await p.webSocketMessage(gv as never, JSON.stringify({ t: 'goi', sbd: 'S2', lyDo: ['a', 'b', 'c'] }))
    for (const t of em1.tin) expect(t).not.toContain('"dung"')
    await p.webSocketMessage(gv as never, JSON.stringify({ t: 'mo' }))
    const cuoi1 = JSON.parse(em1.tin.at(-1)!), cuoi2 = JSON.parse(em2.tin.at(-1)!)
    expect(cuoi1.luot.dung).toBe('B')
    expect(cuoi1.luot.ketQua.dung).toBe(true)
    expect(cuoi2.luot.ketQua.dung).toBe(false)
    expect(JSON.parse(gv.tin.at(-1)!).luot.chon).toEqual({ S1: 'B', S2: 'A' })
  })
  it('rời màn: máy em báo ⇒ bảng thấy, đội bị trừ', async () => {
    const { p, noi, post } = taoPhong()
    await post('/khoi', { buoiId: 'b2', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const gv = await noi('gv'), em = await noi('hs', 'S1')
    await post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'roi' }))
    const b = JSON.parse(gv.tin.at(-1)!)
    expect(b.ds[0].roi).toBe(1)
    expect(b.luot.roiMe).toEqual(['S1'])
  })
  it('vé: chữ ký đúng mới nhận; vé em không thể là vé thầy', async () => {
    const ve = await kyVeBpu('bi-mat', { b: 'b1', s: 'S1', v: 'hs', h: Date.now() + 60_000 })
    expect((await kiemVeBpu('bi-mat', ve))?.v).toBe('hs')
    expect(await kiemVeBpu('khac', ve)).toBeNull()
    const [than, ky] = ve.split('.')
    const sua = Buffer.from(JSON.stringify({ b: 'b1', s: 'S1', v: 'gv', h: Date.now() + 60_000 })).toString('base64url')
    expect(await kiemVeBpu('bi-mat', `${sua}.${ky}`)).toBeNull()
    expect(than).toBeTruthy()
    expect(await kiemVeBpu('bi-mat', await kyVeBpu('bi-mat', { b: 'b1', s: 'S1', v: 'hs', h: Date.now() - 1 }))).toBeNull()
  })
  it('việc của em không kéo dài phòng; thầy kết thúc buổi ⇒ phòng kết thúc, máy em nhận «kết thúc»', async () => {
    const { p, noi, post, hen } = taoPhong()
    await post('/khoi', { buoiId: 'b3', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const em = await noi('hs', 'S1')
    await post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    const truoc = hen.length
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'tra', chon: 'A' }))
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'roi' }))
    expect(hen.length).toBe(truoc)
    await post('/dong', {})
    expect(JSON.parse(em.tin.at(-1)!).ketThuc).toBe(true)
  })
  it('chuyển câu khi lượt cũ chưa mở đáp án ⇒ phòng tự chấm lượt cũ (không mất kJ) rồi mở lượt mới', async () => {
    const { p, noi, post, kho } = taoPhong()
    await post('/khoi', { buoiId: 'b4', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const em = await noi('hs', 'S1')
    await post('/luot', { qid: 'q1', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 90 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'tra', chon: 'A' }))
    const r = await post('/luot', { qid: 'q2', phan: 'I', tuLuan: false, cau: {}, dung: 'B', hanGiay: 90 })
    expect(r.so).toBe(2)
    const ghi = kho.get('ghi') as { qid: string; dung: number; kj: number }[]
    expect(ghi).toHaveLength(1)
    expect(ghi[0]).toMatchObject({ qid: 'q1', dung: 1 })
    expect(ghi[0]!.kj).toBeGreaterThanOrEqual(100)
  })
  it('phòng sống cùng buổi: thầy thao tác ⇒ hẹn tự mở đáp án sau hạn + 15 phút, không phải tự đóng 45 phút', async () => {
    const { post, hen } = taoPhong()
    await post('/khoi', { buoiId: 'b5', lop: 'L', ds: [] })
    expect(hen.at(-1)! - Date.now()).toBeGreaterThan(23 * 3_600_000)
    await post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 120 })
    const con = hen.at(-1)! - Date.now()
    expect(con).toBeGreaterThan(120_000 + 14 * 60_000)
    expect(con).toBeLessThan(120_000 + 16 * 60_000)
  })
})
