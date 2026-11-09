// @vitest-environment node
// Bình Phản Ứng — CHỌN CÂU KHÁC ⇒ BỎ LƯỢT DỞ (thầy 10/11 «chọn câu khác ⇒ bắt đầu lượt mới tự động và xoá lượt câu cũ: lượt đang dở chưa mở đáp án
// thì bỏ, không chấm, không cộng / trừ kJ … lượt đã mở đáp án thì giữ kết quả»). Luật thuần (phong.ts) + Durable Object thật (lệnh /luot kèm `bo`).
import { beforeAll, describe, expect, it } from 'vitest'
import { boLuot, diemDoi, goiLenBang, moDapAn, moLuot, nhanTra, taoPhong, viewEm } from '../src/lib/bpu/phong'
import { PhongBinhPhanUng } from '../server/src/phong-binh-phan-ung'

const T0 = 1_000_000
const chamSo = (a: string, b: string) => a === b
const cau = (qid: string, dung = 'B') => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, text: 'Đề', choices: ['a', 'b', 'c', 'd'] }, dung, hanGiay: 0 })
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [
  { sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S3', ten: 'Trần Gia Bảo', coMat: true, luc: T0 },
] })

describe('boLuot (luật thuần)', () => {
  it('lượt dở có em đã gửi + đang gọi em ⇒ bỏ hẳn: không chấm, kJ / đội / chuỗi / tổng kết giữ nguyên, đáp án không ra máy em', () => {
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0 + 1000); nhanTra(st, 'S2', 'B', T0 + 2000); moDapAn(st, T0 + 3000, chamSo)
    moLuot(st, cau('q2'), T0 + 4000); nhanTra(st, 'S1', 'B', T0 + 5000); nhanTra(st, 'S3', 'A', T0 + 6000); goiLenBang(st, 'S1', ['lý do'], T0 + 7000)
    const kj = st.ds.map((e) => e.kj), doi = [0, 1].map((d) => diemDoi(st, d)), chuoi = st.ds.map((e) => e.chuoi), dungSo = st.ds.map((e) => e.dungSo)
    const lichSu = st.lichSu.length, bd = (st.bienDong ?? []).length, so = st.soLuot
    expect(boLuot(st, T0 + 8000)).toBe(true)
    expect(st.luot).toBeNull()
    expect(st.ds.map((e) => e.kj)).toEqual(kj)
    expect([0, 1].map((d) => diemDoi(st, d))).toEqual(doi)
    expect(st.ds.map((e) => e.chuoi)).toEqual(chuoi)
    expect(st.ds.map((e) => e.dungSo)).toEqual(dungSo)
    expect(st.lichSu).toHaveLength(lichSu)
    expect(st.bienDong ?? []).toHaveLength(bd)
    expect(st.soLuot).toBe(so) // số lượt không lùi: lượt mới mang số mới
    expect(JSON.stringify(viewEm(st, 'S1'))).not.toContain('"dung"')
    const l = moLuot(st, cau('q3'), T0 + 9000)
    expect(l.so).toBe(so + 1)
    expect(l.tra).toEqual({})
    expect(l.goi).toBeNull()
  })
  it('lượt ĐÃ mở đáp án ⇒ giữ nguyên kết quả (false); không có lượt ⇒ false', () => {
    const st = phong()
    expect(boLuot(st, T0)).toBe(false)
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0 + 1000); moDapAn(st, T0 + 2000, chamSo)
    const kq = JSON.stringify(st.luot)
    expect(boLuot(st, T0 + 3000)).toBe(false)
    expect(JSON.stringify(st.luot)).toBe(kq)
    expect(st.lichSu).toHaveLength(1)
  })
})

type WsGia = { tin: string[]; att: unknown; send(d: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown; tag: string }
const taoWs = (): WsGia => ({ tin: [], att: null, tag: '', send(d) { this.tin.push(d) }, close() {}, serializeAttachment(v) { this.att = v }, deserializeAttachment() { return this.att } })
beforeAll(() => { (globalThis as unknown as { WebSocketPair: unknown }).WebSocketPair = class { 0 = taoWs(); 1 = taoWs() } })
function taoDo() {
  const kho = new Map<string, unknown>(), dsWs: WsGia[] = []
  const ctx = {
    storage: { get: async (k: string) => kho.get(k), put: async (k: string, v: unknown) => { kho.set(k, JSON.parse(JSON.stringify(v))) }, delete: async (k: string) => kho.delete(k), setAlarm: async () => {}, getAlarm: async () => null, deleteAlarm: async () => {} },
    acceptWebSocket: (ws: WsGia, tags?: string[]) => { ws.tag = tags?.[0] ?? ''; dsWs.push(ws) },
    getWebSockets: (tag?: string) => dsWs.filter((w) => !tag || w.tag === tag),
    waitUntil: () => {},
  }
  const p = new PhongBinhPhanUng(ctx as never, { MA_BI_MAT: 'x' } as never)
  const noi = async (vai: 'gv' | 'hs', sbd = '') => { const truoc = dsWs.length; await p.fetch(new Request('https://bpu/bpu/phong', { headers: { upgrade: 'websocket', 'x-bpu-vai': vai, 'x-bpu-sbd': sbd } })).catch((e) => e); return dsWs[truoc]! }
  const post = (duong: string, b: unknown) => p.fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b) })).then((r) => r.json() as Promise<Record<string, unknown>>)
  return { p, noi, post, kho }
}

describe('Durable Object: /luot kèm bo', () => {
  it('bo = true ⇒ lượt dở bỏ (không ghi, không kJ), máy em nhận ngay câu mới; không có bo ⇒ chốt như cũ', async () => {
    const { p, noi, post, kho } = taoDo()
    await post('/khoi', { buoiId: 'b9', lop: 'L', ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: 1 }] })
    const em = await noi('hs', 'S1')
    await post('/luot', { ...cau('q1', 'A'), hanGiay: 90 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'tra', chon: 'A' }))
    em.tin.length = 0
    const r = await post('/luot', { ...cau('q2', 'B'), hanGiay: 90, bo: true })
    expect(r.ok).toBe(true)
    expect(kho.get('ghi') ?? []).toHaveLength(0)
    const st = kho.get('st') as { ds: { kj: number }[]; luot: { qid: string; tra: object }; lichSu: unknown[] }
    expect(st.luot.qid).toBe('q2')
    expect(st.luot.tra).toEqual({})
    expect(st.lichSu).toHaveLength(0)
    const kjSauBo = st.ds[0]!.kj
    // Máy em: tin mới nhất là câu q2, chưa có đáp án.
    const cuoi = JSON.parse(em.tin[em.tin.length - 1]!) as { luot?: { qid?: string; so?: number } }
    expect(JSON.stringify(cuoi)).not.toMatch(/"dung"/)
    expect(cuoi.luot?.so).toBe(2)
    // Không kèm bo (→ / «Câu tiếp») ⇒ chốt lượt dở như cũ (em không mất kJ).
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'tra', chon: 'B' }))
    await post('/luot', { ...cau('q3', 'C'), hanGiay: 90 })
    expect(kho.get('ghi')).toHaveLength(1)
    expect((kho.get('st') as { ds: { kj: number }[] }).ds[0]!.kj).toBeGreaterThan(kjSauBo)
  })
  it('bo = true mà lượt đã mở đáp án ⇒ giữ kết quả, chỉ mở lượt mới', async () => {
    const { p, noi, post, kho } = taoDo()
    await post('/khoi', { buoiId: 'b8', lop: 'L', ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: 1 }] })
    const em = await noi('hs', 'S1'), gv = await noi('gv')
    await post('/luot', { ...cau('q1', 'A'), hanGiay: 90 })
    await p.webSocketMessage(em as never, JSON.stringify({ t: 'tra', chon: 'A' }))
    await p.webSocketMessage(gv as never, JSON.stringify({ t: 'mo' }))
    const kj = (kho.get('st') as { ds: { kj: number }[] }).ds[0]!.kj
    expect(kj).toBeGreaterThan(0)
    await post('/luot', { ...cau('q2', 'B'), hanGiay: 90, bo: true })
    const st = kho.get('st') as { ds: { kj: number }[]; luot: { qid: string }; lichSu: unknown[] }
    expect(st.luot.qid).toBe('q2')
    expect(st.lichSu).toHaveLength(1)
    expect(st.ds[0]!.kj).toBe(kj)
  })
})
