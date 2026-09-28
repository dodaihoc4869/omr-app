// @vitest-environment node
// BI-A PHẢN ỨNG GĐ2 · PHÒNG ĐẤU `BanBiA` (server/src/bi-a-phong.ts) — chạy thật lớp phòng với trạng thái Durable Object + WebSocket giả lập,
// D1 thật (node:sqlite, đủ migration). Nghiệm thu đặc tả §12 "GĐ2 thêm": 2 máy đánh hết 1 ván, băm trùng sau mỗi cú; nối lại sau 10 giây;
// gói cau_xong giả bị từ chối; đọc D1 mỗi ván ≤ số câu đã trả lời + 2; Điểm bàn đúng Elo K = 24; rớt > 60 giây; phòng chờ đánh đôi.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { BanBiA, CAU_NHAN } from '../server/src/bi-a-phong'
import { kyVe } from '../server/src/bi-a-ve'
import type { Env, WsMayChu } from '../server/src/kieu'
import { bamVi, banTu, ballsTu, buocChuan, type CauBi, type TranCongKhai } from '../src/game/bi-a/tran'
import { aiDatBi, aiTinh } from '../src/game/bi-a/ai'
import { biCuaGhe, chiaBi, type BangBi, type CheDo } from '../src/game/bi-a/luat'
import { danhBiV, suKienMoi, tocDo } from '../src/game/bi-a/vat-ly'
import { randHat } from '../src/game/bi-a/tran'

const VAN = '11111111-2222-4333-8444-555555555555'
const T0 = 1_790_000_000_000
type Goi = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const sao = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)))

class StateGia {
  ws: WsGia[] = []
  kho = new Map<string, unknown>()
  bao: number | null = null
  storage = {
    get: async <T,>(k: string) => sao(this.kho.get(k)) as T | undefined,
    put: async (k: string, v: unknown) => { this.kho.set(k, sao(v)) },
    delete: async (k: string) => this.kho.delete(k),
    setAlarm: async (t: number) => { this.bao = t },
    getAlarm: async () => this.bao,
    deleteAlarm: async () => { this.bao = null },
  }
  acceptWebSocket(ws: WsMayChu) { this.ws.push(ws as WsGia) }
  getWebSockets() { return [...this.ws] }
}
class WsGia implements WsMayChu {
  hop: Goi[] = []
  gan: unknown = null
  dong = false
  constructor(private st: StateGia) { st.acceptWebSocket(this) }
  send(s: string) { if (this.dong) throw new Error('đã đóng'); this.hop.push(JSON.parse(s)) }
  close() { this.dong = true; this.st.ws = this.st.ws.filter((x) => x !== this) }
  serializeAttachment(v: unknown) { this.gan = sao(v) }
  deserializeAttachment() { return sao(this.gan) }
  cuoi(t: string): Goi | undefined { return [...this.hop].reverse().find((m) => m.t === t) }
}

function dungPhong(o: { cheDo?: CheDo } = {}) {
  const d = taoD1That()
  const env = d.env as Env
  let doc = 0
  const goc = env.DB
  // Đếm lần ĐỌC D1 của phòng (first/all), không tính lệnh ghi.
  env.DB = { ...goc, prepare(q: string) { const st = goc.prepare(q); const bd = st.bind.bind(st); const boc = (s: typeof st): typeof st => ({ ...s, bind: (...v: unknown[]) => boc(bd(...v)), first: (...a: []) => { doc++; return s.first(...a) }, all: () => { doc++; return s.all() }, run: () => s.run() }) as typeof st; return boc(st) }, batch: goc.batch.bind(goc) } as Env['DB']
  d.sql.exec(`INSERT INTO bi_a_van (id, loai, che_do, ngay, chu_ban, trang_thai, tao_luc) VALUES ('${VAN}', 'ban', '${o.cheDo ?? 'don'}', '2026-09-30', 'S1', 'cho', 'x')`)
  const st = new StateGia()
  const dh = { now: T0 }
  const phong = new BanBiA(st as never, env)
  phong.now = () => dh.now
  return { d, env, st, dh, phong, soDoc: () => doc, datDoc: (n: number) => { doc = n } }
}
type PhongThu = ReturnType<typeof dungPhong>

async function vao(p: PhongThu, sbd: string, ten: string, chu: boolean, cheDo: CheDo = 'don') {
  const ws = new WsGia(p.st)
  const ve = await kyVe(p.env, { k: 'sanh', van: VAN, sbd, ten, cheDo, loai: 'ban', chu, ma: '4821', het: p.dh.now + 3_600_000 })
  await p.phong.webSocketMessage(ws, JSON.stringify({ t: 'vao', ve }))
  return { ws, ve, sbd }
}
const cauGhe = (sbd: string, cheDo: CheDo, ghe: number): { bi: Record<string, CauBi>; chot: CauBi } => {
  const bi: Record<string, CauBi> = {}
  for (const id of biCuaGhe(chiaBi(cheDo), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc: 'TH', giay: 90 }
  return { bi, chot: { qid: `chot-${sbd}`, muc: 'VD', giay: 180 } }
}
async function sanSang(p: PhongThu, m: { ws: WsGia; sbd: string }, cheDo: CheDo = 'don') {
  const bd = m.ws.cuoi('bat_dau')!
  expect(bd.veGhe).toBeTruthy()
  const ve = await kyVe(p.env, { k: 'tran', van: VAN, ghe: bd.ghe, sbd: m.sbd, session: `ses-${m.sbd}`, ...cauGhe(m.sbd, cheDo, bd.ghe), het: p.dh.now + 3_600_000 })
  await p.phong.webSocketMessage(m.ws, JSON.stringify({ t: 'san_sang', ve }))
  return bd.ghe as number
}
/** Ghi lượt trả lời như lệnh `answer` thật (khoá phiên|câu). */
function traLoi(p: PhongThu, sbd: string, qid: string, dung: boolean) {
  p.d.sql.prepare('INSERT OR REPLACE INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`ses-${sbd}|${qid}`, sbd, `ses-${sbd}`, qid, `g-${qid}`, JSON.stringify({ correct: dung, attempt: { correct: dung } }), 'x')
}
const S = (ws: WsGia): TranCongKhai => ws.cuoi('tt')!.S
function veTruoc(balls: TranCongKhai['balls'], cu: Goi) {
  const st = banTu(balls), c = st.balls.find((b) => b.id === 'cue')!
  if (cu.datBi) { c.x = cu.datBi.x; c.y = cu.datBi.y }
  danhBiV(c, cu.dx, cu.dy, cu.v, cu.sx, cu.sy)
  const ev = suKienMoi()
  let xong = false
  for (let k = 0; k < 4000 && !xong; k++) for (let i = 0; i < 24 && !xong; i++) xong = buocChuan(st, ev, null)
  return bamVi(ballsTu(st))
}
function cuCua(s: TranCongKhai, rand: () => number) {
  const st = banTu(s.balls), doi = s.ghe[s.cur]!.doi
  let datBi: { x: number; y: number } | undefined
  if (s.ballInHand) { aiDatBi(st, doi, s.bi as BangBi, s.isBreak, rand); const c = st.balls.find((b) => b.id === 'cue')!; datBi = { x: c.x, y: c.y } }
  const k = aiTinh(st, doi, s.bi as BangBi, s.isBreak, { x: 0, y: -1 }, rand)
  return { t: 'cu', dx: k.aim.x, dy: k.aim.y, v: tocDo(k.p), sx: 0, sy: 0, ...(datBi ? { datBi } : {}) }
}

describe('Phòng đấu BanBiA — đấu đơn online', () => {
  it('2 máy đánh HẾT 1 ván qua phòng: băm vẽ-trước của máy trùng phòng sau MỌI cú; D1 đọc ≤ số câu đã trả lời + 2; ghi 1 lô: ván, ghế, Điểm bàn Elo ±12', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true)
    expect(A.ws.cuoi('phong')!.phong.ghe[0]).toMatchObject({ ten: 'Khánh Linh', ai: false })
    const B = await vao(p, 'S2', 'Minh Châu', false)
    expect(A.ws.cuoi('bat_dau')!.ghe).toBe(0) // đủ 2 người là bắt đầu (đấu đơn không có phòng chờ)
    expect(B.ws.cuoi('bat_dau')!.ghe).toBe(1)
    await sanSang(p, A); await sanSang(p, B)
    expect(S(A.ws).cur).toBe(0)
    expect(JSON.stringify(A.ws.cuoi('tt'))).not.toMatch(/q-S2|chot-S2/) // không lộ mã câu của bạn
    const may = { 0: A, 1: B } as Record<number, typeof A>
    const rand = randHat('ban-tay'), tl = randHat('tra-loi')
    let soCu = 0, soCau = 0, lech = 0
    p.datDoc(0)
    for (let vong = 0; vong < 800; vong++) {
      const s = S(A.ws)
      expect(S(B.ws).bam).toBe(s.bam) // hai máy luôn cùng trạng thái phòng
      if (s.over) break
      p.dh.now += 3000
      const c = s.cho[0]
      if (c) {
        const m = may[c.ghe]!
        const qid = c.loai === 'chot' ? `chot-${m.sbd}` : `q-${m.sbd}-${c.ki}`
        traLoi(p, m.sbd, qid, tl() < 0.75)
        await p.phong.webSocketMessage(m.ws, JSON.stringify({ t: 'cau_xong', ki: c.ki, qid, loai: c.loai }))
        soCau++
        continue
      }
      const cu = cuCua(s, rand)
      const du = veTruoc(s.balls, cu)
      await p.phong.webSocketMessage(may[s.cur]!.ws, JSON.stringify(cu))
      const su = A.ws.cuoi('tt')!.su
      expect(su.k).toBe('cu')
      if (su.bamVa !== du) lech++
      soCu++
    }
    const s = S(A.ws)
    expect(s.over).not.toBeNull()
    expect(lech).toBe(0)
    expect(soCu).toBeGreaterThan(5)
    expect(p.soDoc()).toBeLessThanOrEqual(soCau + 2)
    const thang = s.over!.doiThang as 0 | 1
    expect(p.d.dem('bi_a_van', `id='${VAN}' AND trang_thai='xong' AND doi_thang=${thang}`)).toBe(1)
    expect(p.d.dem('bi_a_ghe', `van='${VAN}' AND sbd IS NOT NULL`)).toBe(2)
    const nguoiThang = thang === 0 ? 'S1' : 'S2', nguoiThua = thang === 0 ? 'S2' : 'S1'
    expect(p.d.dem('bi_a_diem_ban', `sbd='${nguoiThang}' AND diem=1012 AND so_van=1`)).toBe(1)
    expect(p.d.dem('bi_a_diem_ban', `sbd='${nguoiThua}' AND diem=988`)).toBe(1)
  }, 120_000)

  it('gói cau_xong GIẢ bị từ chối: chưa có lượt trả lời trên máy chủ / sai mã câu / trả lời thay bạn', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    await sanSang(p, A); await sanSang(p, B)
    // dựng thế: A vừa đánh Na vào lỗ, đang chờ A trả lời
    const tr = p.st.kho.get('tran') as Goi
    tr.isBreak = false; tr.cho = [{ ghe: 0, ki: 'Na', loai: 'bi', han: T0 + 99_000 }]; tr.ctx = { p: 0, kq: { maLoi: null, loi: null, datLai: [], datBiCai: false, anNgay: [], hang: [], thangNgay: false, cuaBan: [] }, ketQua: [] }
    p.st.kho.set('tran', tr)
    const phong2 = new BanBiA(p.st as never, p.env); phong2.now = () => p.dh.now // phòng thức dậy từ bộ nhớ (Hibernation)
    await phong2.webSocketMessage(A.ws, JSON.stringify({ t: 'cau_xong', ki: 'Na', qid: 'q-S1-Na', loai: 'bi' }))
    expect(A.ws.cuoi('loi')!.chu).toMatch(/chưa thấy câu trả lời/)
    await phong2.webSocketMessage(A.ws, JSON.stringify({ t: 'cau_xong', ki: 'Na', qid: 'q-S1-Mg', loai: 'bi' }))
    expect(A.ws.cuoi('loi')!.chu).toMatch(/không khớp bi/)
    traLoi(p, 'S1', 'q-S1-Na', true)
    await phong2.webSocketMessage(B.ws, JSON.stringify({ t: 'cau_xong', ki: 'Na', qid: 'q-S1-Na', loai: 'bi' }))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/không phải câu đang chờ|không trả lời câu/)
    expect((p.st.kho.get('tran') as Goi).cho).toHaveLength(1) // chưa đổi gì
    await phong2.webSocketMessage(A.ws, JSON.stringify({ t: 'cau_xong', ki: 'Na', qid: 'q-S1-Na', loai: 'bi' }))
    expect(S(A.ws).bi.Na.an).toBe(true)
    // cú đánh sai lượt
    await phong2.webSocketMessage(B.ws, JSON.stringify({ t: 'cu', dx: 0, dy: -1, v: 900, sx: 0, sy: 0 }))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/Chưa tới lượt/)
  })

  it('câu SAI qua phòng ⇒ đổi lượt NGAY khi nhận cau_xong', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    await sanSang(p, A); await sanSang(p, B)
    const tr = p.st.kho.get('tran') as Goi
    tr.isBreak = false; tr.cho = [{ ghe: 0, ki: 'Mg', loai: 'bi', han: T0 + 99_000 }]; tr.ctx = { p: 0, kq: { maLoi: null, loi: null, datLai: [], datBiCai: false, anNgay: [], hang: [], thangNgay: false, cuaBan: [] }, ketQua: [] }
    p.st.kho.set('tran', tr)
    const phong2 = new BanBiA(p.st as never, p.env); phong2.now = () => p.dh.now
    traLoi(p, 'S1', 'q-S1-Mg', false)
    await phong2.webSocketMessage(A.ws, JSON.stringify({ t: 'cau_xong', ki: 'Mg', qid: 'q-S1-Mg', loai: 'bi' }))
    expect(B.ws.cuoi('tt')!.su).toMatchObject({ k: 'cau', ghe: 0, ki: 'Mg', dung: false })
    expect(S(B.ws).cur).toBe(1)
  })

  it('nối lại sau 10 giây: vào lại bằng vé cũ nhận trạng thái đầy đủ, ghế giữ nguyên; rớt quá 60 giây (đấu đơn) ⇒ bạn thắng, ghi Điểm bàn', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    await sanSang(p, A); await sanSang(p, B)
    B.ws.close(); await p.phong.webSocketClose(B.ws)
    expect(S(A.ws).ghe[1]!.roi).toBe(true)
    p.dh.now += 10_000
    const B2 = new WsGia(p.st)
    await p.phong.webSocketMessage(B2, JSON.stringify({ t: 'vao', ve: B.ve }))
    const s = S(B2)
    expect(B2.cuoi('tt')!.toi).toBe(1)
    expect(s.ghe[1]!.roi).toBe(false)
    expect(s.balls).toHaveLength(16)
    expect(s.over).toBeNull()
    // lần này rớt hẳn
    B2.close(); await p.phong.webSocketClose(B2)
    p.dh.now += 61_000
    p.dh.now = Math.max(p.dh.now, p.st.bao ?? 0)
    await p.phong.alarm()
    expect(S(A.ws).over).toMatchObject({ doiThang: 0, lyDo: 'roi_mang' })
    expect(p.d.dem('bi_a_diem_ban', "sbd='S1' AND diem=1012")).toBe(1)
  })

  it('mất tín hiệu CÂM (không có gói đóng): quá 70 giây không ping ⇒ phòng tự đóng kết nối, tính rời TỪ PING CUỐI ⇒ đấu đơn: bạn thắng; máy vẫn ping thì không sao', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    await sanSang(p, A); await sanSang(p, B)
    // Durable Object thật tự trả lời ping và nhớ lúc trả lời cuối của từng kết nối
    const ping = new Map<unknown, number>()
    Object.assign(p.st, { getWebSocketAutoResponseTimestamp: (ws: unknown) => (ping.has(ws) ? new Date(ping.get(ws)!) : null) })
    ping.set(B.ws, T0 + 5_000) // B ping một lần rồi mất tín hiệu câm
    let dongLuc = 0
    for (let t = 0; t <= 150_000 && !S(A.ws).over; t += 1_000) {
      p.dh.now = T0 + t
      if (t % 25_000 === 0) ping.set(A.ws, p.dh.now) // A vẫn ping đều
      if (p.st.bao !== null && p.dh.now >= p.st.bao) { await p.phong.alarm(); if (B.ws.dong && !dongLuc) dongLuc = t }
    }
    expect(A.ws.dong).toBe(false)
    expect(B.ws.dong).toBe(true)
    expect(dongLuc).toBeGreaterThanOrEqual(75_000) // ping cuối 5 giây + 70 giây
    expect(dongLuc).toBeLessThanOrEqual(5_000 + 70_000 + 35_000) // phòng thức ít nhất mỗi 35 giây để soát
    expect(S(A.ws).over).toMatchObject({ doiThang: 0, lyDo: 'roi_mang' }) // rời từ giây 5 ⇒ quá 60 giây ngay lúc phát hiện
    expect(p.d.dem('bi_a_diem_ban', "sbd='S1' AND diem=1012")).toBe(1)
  })

  it('hết 30 giây không đánh ⇒ phòng tự sang lượt (hẹn giờ của Durable Object)', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    await sanSang(p, A); await sanSang(p, B)
    expect(p.st.bao).toBe(T0 + 32_000)
    p.dh.now = T0 + 32_000
    await p.phong.alarm()
    expect(B.ws.cuoi('tt')!.su).toEqual({ k: 'het_gio', ghe: 0 })
    expect(S(B.ws).cur).toBe(1)
  })

  it('6 câu nhắn soạn sẵn: gửi cho cả bàn; mã lạ bị từ chối', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true), B = await vao(p, 'S2', 'Minh Châu', false)
    expect(CAU_NHAN).toEqual(['Cú đẹp!', 'Suýt nữa!', 'Tới lượt tớ nhé', 'Hay đấy', 'Chờ tớ giải câu', 'Đấu lại không?'])
    await p.phong.webSocketMessage(B.ws, JSON.stringify({ t: 'nhan', id: 1 }))
    expect(A.ws.cuoi('nhan')).toEqual({ t: 'nhan', tu: 1, id: 1 })
    await p.phong.webSocketMessage(B.ws, JSON.stringify({ t: 'nhan', id: 9 }))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/Câu nhắn không hợp lệ/)
  })

  it('vé giả / hết hạn / bàn đủ người đều bị từ chối', async () => {
    const p = dungPhong()
    const A = await vao(p, 'S1', 'Khánh Linh', true)
    const ws = new WsGia(p.st)
    await p.phong.webSocketMessage(ws, JSON.stringify({ t: 'vao', ve: A.ve.slice(0, -3) + 'abc' }))
    expect(ws.cuoi('loi')!.chu).toMatch(/không hợp lệ/)
    await vao(p, 'S2', 'Minh Châu', false)
    const C = await vao(p, 'S3', 'Chi', false)
    expect(C.ws.cuoi('loi')!.chu).toMatch(/Ván đã bắt đầu|đủ người/)
    const het = await kyVe(p.env, { k: 'sanh', van: VAN, sbd: 'S9', ten: 'X', cheDo: 'don', loai: 'ban', chu: false, ma: null, het: p.dh.now - 1 })
    await p.phong.webSocketMessage(ws, JSON.stringify({ t: 'vao', ve: het }))
    expect(ws.cuoi('loi')!.chu).toMatch(/hết hạn/)
  })
})

describe('Phòng đấu BanBiA — đánh đôi: phòng chờ 4 ghế, A.I ghế trống do máy chủ bàn chạy', () => {
  it('chủ bàn thêm A.I, đổi chỗ, chỉ chủ bàn bấm Bắt đầu khi đủ 4 ghế; A.I trả lời chỉ nhận từ máy chủ bàn; bàn có A.I không tính Điểm bàn', async () => {
    const p = dungPhong({ cheDo: 'doi' })
    const A = await vao(p, 'S1', 'Khánh Linh', true, 'doi')
    const B = await vao(p, 'S2', 'Minh Châu', false, 'doi')
    expect(B.ws.cuoi('phong')!.toi).toBe(1)
    await p.phong.webSocketMessage(B.ws, JSON.stringify({ t: 'ghe', lam: 'them_ai', ghe: 2 }))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/Chỉ chủ bàn/)
    await p.phong.webSocketMessage(A.ws, JSON.stringify({ t: 'bat_dau' }))
    expect(A.ws.cuoi('loi')!.chu).toMatch(/Còn ghế trống/)
    await p.phong.webSocketMessage(A.ws, JSON.stringify({ t: 'ghe', lam: 'them_ai', ghe: 2 }))
    await p.phong.webSocketMessage(A.ws, JSON.stringify({ t: 'ghe', lam: 'them_ai', ghe: 3 }))
    await p.phong.webSocketMessage(A.ws, JSON.stringify({ t: 'ghe', lam: 'doi_cho', ghe: 1, ghe2: 2 })) // Minh Châu sang ghế 3 = đồng đội Kim loại
    const ph = A.ws.cuoi('phong')!.phong
    expect(ph.ghe.map((g: Goi) => g && (g.ai ? 'AI' : g.ten))).toEqual(['Khánh Linh', 'AI', 'Minh Châu', 'AI'])
    expect(B.ws.cuoi('phong')!.toi).toBe(2)
    await p.phong.webSocketMessage(B.ws, JSON.stringify({ t: 'bat_dau' }))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/Chỉ chủ bàn bấm Bắt đầu/)
    await p.phong.webSocketMessage(A.ws, JSON.stringify({ t: 'bat_dau' }))
    await sanSang(p, A, 'doi'); await sanSang(p, B, 'doi')
    const tt = A.ws.cuoi('tt')!
    expect(tt.S.ghe.map((g: Goi) => g.ai)).toEqual([false, true, false, true])
    expect(tt.S.khongElo).toBe(true)
    expect(tt.chuMay).toBe(0)
    expect(biCuaGhe(tt.S.bi, 2)).toHaveLength(3) // G11: người 2 của phe giữ 3 bi
    // A đánh xong (lượt sang ghế A.I 1) — ghế A.I chỉ nhận cú từ máy chủ bàn
    const rand = randHat('doi')
    await p.phong.webSocketMessage(A.ws, JSON.stringify(cuCua(S(A.ws), rand)))
    let s = S(A.ws)
    for (let i = 0; i < 40 && !s.ghe[s.cur]!.ai && !s.over; i++) {
      p.dh.now += 3000
      const c = s.cho[0]
      if (c) { const m = c.ghe === 0 ? A : B; const qid = c.loai === 'chot' ? `chot-${m.sbd}` : `q-${m.sbd}-${c.ki}`; traLoi(p, m.sbd, qid, true); await p.phong.webSocketMessage(m.ws, JSON.stringify({ t: 'cau_xong', ki: c.ki, qid, loai: c.loai })) }
      else await p.phong.webSocketMessage((s.cur === 0 ? A : B).ws, JSON.stringify(cuCua(s, rand)))
      s = S(A.ws)
    }
    expect(s.ghe[s.cur]!.ai).toBe(true)
    await p.phong.webSocketMessage(B.ws, JSON.stringify(cuCua(s, rand)))
    expect(B.ws.cuoi('loi')!.chu).toMatch(/Chưa tới lượt/)
    await p.phong.webSocketMessage(A.ws, JSON.stringify(cuCua(s, rand)))
    expect(S(A.ws).soCu).toBe(s.soCu + 1)
  })
})
