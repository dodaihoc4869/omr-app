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
  // SỬA CÓ CHỦ ĐÍCH 09/11 (lần 2, luật chặt): rời màn TRỪ đội −50 và em −50 (kẹp 0) — bảng thấy em ĐANG RỜI (`roiNay`) + mục biến động; `ve` gỡ.
  it('rời màn: máy em báo ⇒ bảng thấy (đang rời, trừ kJ, biến động); em quay lại (ve) ⇒ gỡ', async () => {
    const { p, noi, post } = taoPhong()
    await post('/khoi', { buoiId: 'b2', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const gv = await noi('gv'), em = await noi('hs', 'S1')
    await post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'roi' }))
    const b = JSON.parse(gv.tin.at(-1)!)
    expect(b.ds[0].roi).toBe(1)
    expect(b.luot.roiMe).toEqual(['S1'])
    expect(b.roiNay).toEqual(['S1'])
    expect(b.doiThuong.reduce((x: number, y: number) => x + y, 0)).toBe(10 + 50 - 50) // vào lớp + đủ quân − rời màn
    expect(b.ds[0].kj).toBe(0) // em đang 0 kJ ⇒ kẹp 0
    expect(b.bienDong.at(-1)).toMatchObject({ sbd: 'S1', kjEm: 0, kjDoi: -50, lyDo: 'Rời màn hình' })
    expect(JSON.parse(em.tin.at(-1)!).bienDongEm.at(-1)).toMatchObject({ sbd: 'S1', kjDoi: -50 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 've' }))
    expect(JSON.parse(gv.tin.at(-1)!).roiNay).toEqual([])
    expect(JSON.parse(gv.tin.at(-1)!).luot.roiMe).toEqual(['S1']) // lịch sử lượt vẫn ghi em đã rời
    // Rớt kết nối WebSocket KHÔNG tính rời màn.
    const truoc = gv.tin.length
    await p.webSocketClose()
    expect(gv.tin.length).toBe(truoc)
  })
  it('10/11 «cảnh báo tức thì»: `roi` ⇒ bảng nhận NGAY trong cùng lần xử lý tin (không gom 250 ms như tiếp sức), đo ms', async () => {
    const { p, noi, post } = taoPhong()
    await post('/khoi', { buoiId: 'b3', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const gv = await noi('gv'), em = await noi('hs', 'S1')
    await post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    const truoc = gv.tin.length
    const t0 = performance.now()
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'roi' }))
    const ms = performance.now() - t0
    expect(gv.tin.length).toBe(truoc + 1) // đã phát cho bảng khi lệnh xử lý xong — không hẹn giờ
    expect(JSON.parse(gv.tin.at(-1)!).roiNay).toEqual(['S1'])
    expect(ms).toBeLessThan(50)
    console.info(`[đo] phòng: nhận roi → gửi bảng = ${ms.toFixed(2)} ms (gồm ghi kho giả)`)
  })
  it('em vào muộn qua /vao kèm năng lực ⇒ phòng nhận số năng lực', async () => {
    const { p, post } = taoPhong()
    await post('/khoi', { buoiId: 'b8', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1, nangLuc: 0.9 }] })
    await post('/vao', { sbd: 'S2', ten: 'C D', nangLuc: 0.2 })
    const st = (p as unknown as { st: { ds: { sbd: string; nangLuc: number; doi: number }[] } }).st
    expect(st.ds.map((e) => [e.sbd, e.nangLuc])).toEqual([['S1', 0.9], ['S2', 0.2]])
    expect(new Set(st.ds.map((e) => e.doi)).size).toBe(2)
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
  it('buổi «Mọi lớp» (phòng mở không có danh sách lớp): em điểm danh kèm họ tên ⇒ phòng tự thêm em, có mặt, hiện trên bảng (thầy 07/11)', async () => {
    const { p, post } = taoPhong()
    await post('/khoi', { buoiId: 'b7', lop: 'Buổi học 07/11/2026', ds: [] })
    expect((await post('/vao', { sbd: '12121212', ten: 'Đỗ Đại Học' })).ok).toBe(true)
    expect((await post('/vao', { sbd: '99999999' })).ok).toBe(false) // không tên, không có trong danh sách ⇒ như cũ
    const st = (p as unknown as { st: { ds: { sbd: string; ten: string; vao: boolean }[] } }).st
    expect(st.ds.map((e) => [e.sbd, e.ten, e.vao])).toEqual([['12121212', 'Đỗ Đại Học', true]])
    // thầy mở lại bảng: em mới của lớp (chưa điểm danh) được thêm nhưng CHƯA có mặt
    await post('/khoi', { buoiId: 'b7', lop: 'L', ds: [{ sbd: 'S9', ten: 'Lê Chi', coMat: false, luc: null }] })
    expect(st.ds.find((e) => e.sbd === 'S9')?.vao).toBe(false)
  })
  it('tiến trình buổi (bước + hoạt động): lưu trong phòng, ghi sau thắng ghi trước, dữ liệu sai bị từ chối', async () => {
    const { post } = taoPhong()
    expect((await post('/tt-doc', {})).tt).toBeNull()
    await post('/tt-ghi', { tt: { buoc: 3, hoatDong: 'day-hoc', luc: 200 } })
    await post('/tt-ghi', { tt: { buoc: 2, hoatDong: '', luc: 100 } }) // máy chậm gửi bản cũ hơn ⇒ không đè
    expect((await post('/tt-doc', {})).tt).toEqual({ buoc: 3, hoatDong: 'day-hoc', luc: 200 })
    expect((await post('/tt-ghi', { tt: { buoc: 9, hoatDong: 'x', luc: 300 } })).ok).toBe(false)
    await post('/tt-ghi', { tt: { buoc: 4, hoatDong: 'day-hoc', luc: 300 } })
    expect((await post('/tt-doc', {})).tt).toMatchObject({ buoc: 4 })
  })
  it('điều khiển từ xa: máy thầy gửi «dk» ⇒ mọi bảng khác nhận; máy em gửi thì không có tác dụng', async () => {
    const { p, noi, post } = taoPhong()
    await post('/khoi', { buoiId: 'b6', lop: 'L', ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    const dienThoai = await noi('gv'), bang = await noi('gv'), em = await noi('hs', 'S1')
    await p.webSocketMessage(dienThoai as never, JSON.stringify({ t: 'dk', lenh: 'toi' }))
    expect(bang.tin.at(-1)).toBe('{"t":"dk","lenh":"toi"}')
    expect(dienThoai.tin.some((t) => t.includes('"dk"'))).toBe(false)
    const truoc = bang.tin.length
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'dk', lenh: 'toi' }))
    expect(bang.tin.length).toBe(truoc)
  })
})
