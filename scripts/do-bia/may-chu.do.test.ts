// @vitest-environment node
// ĐO MÁY CHỦ BI-A (30/09 — tối ưu chuyên sâu Bi-a): p50/p95 + số lượt D1 cho các route nóng, và phòng đấu `BanBiA` (Durable Object) trong
// một ván online trọn vẹn: số tin WebSocket, cỡ tin, số lần ghi kho, thời gian xử lý mỗi gói. KHÔNG gọi máy chủ thật: D1 = node:sqlite trong bộ nhớ
// (tests/_d1-that.ts) bọc thêm ĐỘ TRỄ GIẢ mỗi lượt D1 (DO_BIA_TRE_MS, mặc định 4 ms ~ Worker → D1 cùng vùng) ⇒ p95 phản ánh số lượt NỐI TIẾP.
//   npx vitest run --config scripts/do-bia/vitest.config.mjs   (DO_BIA_RA=kq.json để ghi kết quả; DO_BIA_LAN=30 số lần mỗi route)
import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { taoD1That } from '../../tests/_d1-that'
import { gvChienDich } from '../../server/src/srs2-gv'
import { biaAction, biaChoSanh } from '../../server/src/bi-a'
import { gameV2 } from '../../server/src/game-v2'
import { gameToken } from '../../server/src/game-v2-auth'
import { ghiSuKien, type SuKien } from '../../server/src/su-kien-hoc'
import { BanBiA } from '../../server/src/bi-a-phong'
import { kyVe } from '../../server/src/bi-a-ve'
import type { D1PreparedStatement, Env, WsMayChu } from '../../server/src/kieu'
import { banTu, randHat, type CauBi, type TranCongKhai } from '../../src/game/bi-a/tran'
import { aiDatBi, aiTinh } from '../../src/game/bi-a/ai'
import { biCuaGhe, chiaBi, type BangBi, type CheDo } from '../../src/game/bi-a/luat'
import { tocDo } from '../../src/game/bi-a/vat-ly'

const TRE = Number(process.env.DO_BIA_TRE_MS ?? '4')
const LAN = Number(process.env.DO_BIA_LAN ?? '30')
const NGAY = 86_400_000
const ngu = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve())
const tv = (a: number[], q: number) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(q * b.length))]! : 0 }
const tron = (x: number) => Math.round(x * 10) / 10

/** Bọc D1: đếm lượt (first/all/run = 1, batch = 1) + độ trễ giả mỗi lượt. */
function bocD1(env: Env, dem: { luot: number; ghi: number }) {
  const goc = env.DB
  const boc = (st: D1PreparedStatement): D1PreparedStatement => {
    const w: D1PreparedStatement = {
      bind: (...v: unknown[]) => boc(st.bind(...v)),
      first: async (...a: []) => { dem.luot++; await ngu(TRE); return st.first(...a) },
      all: async () => { dem.luot++; await ngu(TRE); return st.all() },
      run: async () => { dem.luot++; dem.ghi++; await ngu(TRE); return st.run() },
    } as D1PreparedStatement
    ;(w as unknown as { _q?: string })._q = (st as unknown as { _q?: string })._q
    ;(w as unknown as { _goc: D1PreparedStatement })._goc = st
    return w
  }
  const db = {
    prepare: (q: string) => boc(goc.prepare(q)),
    batch: async (ds: D1PreparedStatement[]) => { dem.luot++; dem.ghi++; await ngu(TRE); return goc.batch(ds.map((s) => (s as unknown as { _goc?: D1PreparedStatement })._goc ?? s)) },
    withSession: () => db,
  }
  env.DB = db as unknown as Env['DB']
}

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi của ${qid}`, tungPa: {} },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')
const dapAnSai = (i: number) => (i % 4 === 0 ? 'SDSD' : i % 5 === 0 ? '9' : 'A')

/** Lớp 12A1: 30 em (S1 đo), kho 400 câu, chiến dịch giao cả lớp, 30 câu ôn (sai hôm qua) ⇒ kế hoạch ngày có cả câu mới lẫn câu ôn. */
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const hs = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
  for (let i = 1; i <= 30; i++) hs.run(`S${i}`, `Học sinh ${i}`, '12A1', `mk${i}`, 'x')
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',400,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 400; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 7}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 7}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
  const now = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(now + 5 * NGAY).toISOString().slice(0, 10) }, now - 3 * NGAY)
  expect(r.ok).toBe(true)
  const sk: SuKien[] = []
  for (const sbd of ['S1', 'S2', 'S3', 'S4']) for (let i = 1; i <= 30; i++) sk.push({ nguon: 'game', maNguon: `phien-${sbd}-${i}`, sbd, qid: `Q${i}`, lan: 1, ketQua: 0, luc: new Date(now - NGAY).toISOString() })
  await ghiSuKien(env, sk)
  ;(env as { BAN_BIA?: unknown }).BAN_BIA = { idFromName: () => ({}), get: () => ({ fetch: async () => new Response(null) }) }
  const dem = { luot: 0, ghi: 0 }
  bocD1(env, dem)
  return { d, env, dem }
}

type KetRoute = { p50: number; p95: number; max: number; luotD1: number; ghiD1: number; n: number }
async function doRoute(dem: { luot: number; ghi: number }, n: number, truoc: (() => Promise<unknown>) | null, f: () => Promise<unknown>): Promise<KetRoute> {
  const t: number[] = [], luot: number[] = [], ghi: number[] = []
  for (let i = 0; i < n + 2; i++) {
    if (truoc) await truoc()
    const l0 = dem.luot, g0 = dem.ghi, a = performance.now()
    await f()
    const ms = performance.now() - a
    if (i >= 2) { t.push(ms); luot.push(dem.luot - l0); ghi.push(dem.ghi - g0) } // 2 lượt đầu: làm nóng isolate (đệm cờ, bảng)
  }
  return { p50: tron(tv(t, 0.5)), p95: tron(tv(t, 0.95)), max: tron(Math.max(...t)), luotD1: tv(luot, 0.5), ghiD1: tv(ghi, 0.5), n }
}

// ───────────── phòng đấu giả (như tests/bi-a-phong.test.ts) ─────────────
const VAN = '11111111-2222-4333-8444-555555555555'
type Goi = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const sao = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)))
class StateGia {
  ws: WsGia[] = []
  kho = new Map<string, unknown>()
  bao: number | null = null
  dem = { put: 0, putByte: 0, get: 0, alarm: 0 }
  storage = {
    get: async <T,>(k: string) => { this.dem.get++; return sao(this.kho.get(k)) as T | undefined },
    put: async (k: string, v: unknown) => { this.dem.put++; this.dem.putByte += JSON.stringify(v ?? null).length; this.kho.set(k, sao(v)) },
    delete: async (k: string) => this.kho.delete(k),
    setAlarm: async (t: number) => { this.dem.alarm++; this.bao = t },
    getAlarm: async () => this.bao,
    deleteAlarm: async () => { this.bao = null },
  }
  acceptWebSocket(ws: WsMayChu) { this.ws.push(ws as WsGia) }
  getWebSockets() { return [...this.ws] }
}
const guiDem = { tin: 0, byte: 0, tt: 0, ttByte: 0 }
class WsGia implements WsMayChu {
  hop: Goi[] = []
  gan: unknown = null
  dong = false
  constructor(private st: StateGia) { st.acceptWebSocket(this) }
  send(s: string) { if (this.dong) throw new Error('đã đóng'); guiDem.tin++; guiDem.byte += s.length; const m = JSON.parse(s); if (m.t === 'tt') { guiDem.tt++; guiDem.ttByte += s.length } this.hop.push(m) }
  close() { this.dong = true; this.st.ws = this.st.ws.filter((x) => x !== this) }
  serializeAttachment(v: unknown) { this.gan = sao(v) }
  deserializeAttachment() { return sao(this.gan) }
  cuoi(t: string): Goi | undefined { for (let i = this.hop.length - 1; i >= 0; i--) if (this.hop[i]!.t === t) return this.hop[i]; return undefined }
}
const cauGhe = (sbd: string, cheDo: CheDo, ghe: number): { bi: Record<string, CauBi>; chot: CauBi } => {
  const bi: Record<string, CauBi> = {}
  for (const id of biCuaGhe(chiaBi(cheDo), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc: 'TH', giay: 90 }
  return { bi, chot: { qid: `chot-${sbd}`, muc: 'VD', giay: 180 } }
}
function cuCua(s: TranCongKhai, rand: () => number) {
  const st = banTu(s.balls), doi = s.ghe[s.cur]!.doi
  let datBi: { x: number; y: number } | undefined
  if (s.ballInHand) { aiDatBi(st, doi, s.bi as BangBi, s.isBreak, rand); const c = st.balls.find((b) => b.id === 'cue')!; datBi = { x: c.x, y: c.y } }
  const k = aiTinh(st, doi, s.bi as BangBi, s.isBreak, { x: 0, y: -1 }, rand)
  return { t: 'cu', dx: k.aim.x, dy: k.aim.y, v: tocDo(k.p), sx: 0, sy: 0, ...(datBi ? { datBi } : {}) }
}

async function doPhong() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const dem = { luot: 0, ghi: 0 }
  bocD1(env, dem)
  d.sql.exec(`INSERT INTO bi_a_van (id, loai, che_do, ngay, chu_ban, trang_thai, tao_luc) VALUES ('${VAN}', 'ban', 'don', '2026-09-30', 'S1', 'cho', 'x')`)
  const st = new StateGia()
  const dh = { now: 1_790_000_000_000 }
  const phong = new BanBiA(st as never, env)
  phong.now = () => dh.now
  const thoiGian: Record<string, number[]> = {}
  const gui = async (ws: WsGia, m: Goi) => { const a = performance.now(); await phong.webSocketMessage(ws, JSON.stringify(m)); (thoiGian[m.t] ??= []).push(performance.now() - a) }
  const vao = async (sbd: string, ten: string, chu: boolean) => {
    const ws = new WsGia(st)
    const ve = await kyVe(env, { k: 'sanh', van: VAN, sbd, ten, cheDo: 'don', loai: 'ban', chu, ma: '4821', het: dh.now + 3_600_000 })
    await gui(ws, { t: 'vao', ve })
    return { ws, sbd }
  }
  const A = await vao('S1', 'Khánh Linh', true), B = await vao('S2', 'Minh Châu', false)
  for (const m of [A, B]) {
    const bd = m.ws.cuoi('bat_dau')!
    const ve = await kyVe(env, { k: 'tran', van: VAN, ghe: bd.ghe, sbd: m.sbd, session: `ses-${m.sbd}`, ...cauGhe(m.sbd, 'don', bd.ghe), het: dh.now + 3_600_000 })
    await gui(m.ws, { t: 'san_sang', ve })
  }
  const may = { 0: A, 1: B } as Record<number, typeof A>
  const rand = randHat('ban-tay'), tl = randHat('tra-loi')
  const t0 = dh.now
  let soCu = 0, soCau = 0
  const g0 = { ...guiDem }, s0 = { ...st.dem }, l0 = dem.luot
  for (let vong = 0; vong < 800; vong++) {
    const s = A.ws.cuoi('tt')!.S as TranCongKhai
    if (s.over) break
    const c = s.cho[0]
    if (c) {
      dh.now += 12_000 // em đọc + trả lời câu
      const m = may[c.ghe]!
      const qid = c.loai === 'chot' ? `chot-${m.sbd}` : `q-${m.sbd}-${c.ki}`
      d.sql.prepare('INSERT OR REPLACE INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`ses-${m.sbd}|${qid}`, m.sbd, `ses-${m.sbd}`, qid, `g-${qid}`, JSON.stringify({ correct: tl() < 0.75 }), 'x')
      await gui(m.ws, { t: 'cau_xong', ki: c.ki, qid, loai: c.loai })
      soCau++
      continue
    }
    dh.now += 8_000 // nhắm + bi lăn
    await gui(may[s.cur]!.ws, cuCua(s, rand))
    soCu++
  }
  const giay = (dh.now - t0) / 1000
  const tin = guiDem.tin - g0.tin, byte = guiDem.byte - g0.byte, tt = guiDem.tt - g0.tt, ttByte = guiDem.ttByte - g0.ttByte
  const goiVao = soCu + soCau
  const tg = (k: string) => ({ p50: tron(tv(thoiGian[k] ?? [], 0.5)), p95: tron(tv(thoiGian[k] ?? [], 0.95)), n: (thoiGian[k] ?? []).length })
  return {
    ketThuc: !!(A.ws.cuoi('tt')!.S as TranCongKhai).over, soCu, soCau, giayVan: tron(giay),
    tinGui: tin, tinMoiGiay: tron(tin / giay), byteMoiTin: Math.round(byte / Math.max(1, tin)), byteTt: Math.round(ttByte / Math.max(1, tt)), kbMoiPhut: tron((byte / 1024) / (giay / 60)),
    ghiKhoMoiGoi: tron((st.dem.put - s0.put) / goiVao), byteGhiKhoMoiGoi: Math.round((st.dem.putByte - s0.putByte) / goiVao), henGioMoiGoi: tron((st.dem.alarm - s0.alarm) / goiVao),
    d1MoiVan: dem.luot - l0,
    xuLy: { cu: tg('cu'), cau_xong: tg('cau_xong'), vao: tg('vao'), san_sang: tg('san_sang') },
  }
}

describe('ĐO máy chủ Bi-a', () => {
  it('route nóng + phòng đấu', async () => {
    const ket: Record<string, unknown> = { treD1Ms: TRE, lan: LAN, luc: new Date().toISOString() }
    const { env, dem } = await dung()
    const token = await gameToken(env, 'S1')
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    const now = () => Date.now()
    const route: Record<string, KetRoute> = {}
    route['vao-sanh (bia-sanh)'] = await doRoute(dem, LAN, null, () => biaAction(env, 'S1', 'bia-sanh', {}, now()))
    route['cua-sanh Bat Linh (biaChoSanh)'] = await doRoute(dem, LAN, null, () => biaChoSanh(env, 'S1', now()))
    route['xep-ban A.I (bia-xep-ban)'] = await doRoute(dem, LAN, null, async () => { const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, now()); expect(r.ok).toBe(true); expect((r.bi as unknown[]).length).toBeGreaterThan(0) })
    route['lay-cau chi tra loi (bia-tra-loi)'] = await doRoute(dem, LAN, null, async () => { const r = await biaAction(env, 'S1', 'bia-tra-loi', {}, now()); expect((r.cau as unknown[]).length).toBeGreaterThan(0) })
    // trả lời câu (lệnh `answer` CHUNG — ngoài làn Bi-a, đo để biết) + đổi câu sau câu sai + kết thúc ván
    // Route trả lời câu tiêu trần Bi-a (40% kế hoạch) ⇒ mỗi route một em riêng, số lần ≤ 10 (trần mỗi em ~ 20 câu).
    let ban: Record<string, unknown> = {}
    let cauSai = ''
    const LAN_TL = Math.min(LAN, 10)
    const tok: Record<string, string> = {}
    for (const e of ['S2', 'S3', 'S4']) { tok[e] = await gameToken(env, e); await gameV2(env, 'choose', { token: tok[e], pet: 'dat_quy' }) }
    const moBan = (e: string) => async () => { ban = await biaAction(env, e, 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, now()); expect((ban.bi as unknown[] | undefined)?.length).toBeGreaterThan(0) }
    route['tra-loi (answer chung)'] = await doRoute(dem, LAN_TL, moBan('S2'), async () => {
      const q = (ban.bi as { qid: string }[])[0]!
      const a = await gameV2(env, 'answer', { token: tok.S2, session: ban.session, qid: q.qid, answer: dapAnSai(Number(q.qid.slice(1))) })
      expect(a.ok).toBe(true)
    })
    route['doi-cau sau cau sai (bia-doi-cau)'] = await doRoute(dem, LAN_TL, async () => {
      await moBan('S3')(); const q = (ban.bi as { qid: string }[])[0]!; cauSai = q.qid
      await gameV2(env, 'answer', { token: tok.S3, session: ban.session, qid: q.qid, answer: dapAnSai(Number(q.qid.slice(1))) })
    }, async () => { const r = await biaAction(env, 'S3', 'bia-doi-cau', { session: ban.session, qidCu: cauSai }, now()); expect(r.ok).toBe(true) })
    route['ket-van (bia-ket-van)'] = await doRoute(dem, LAN, moBan('S4'), async () => {
      const r = await biaAction(env, 'S4', 'bia-ket-van', { van: ban.van, ketQua: { doiThang: 0, diem: [90, 20], lyDo: 'thang' }, ghe: [{ ghe: 1, doi: 0, ai: false, an: 3, vang: 0 }, { ghe: 2, doi: 1, ai: true, dung: 2, sai: 1, an: 1, vang: 0 }] }, now())
      expect(r.ok).toBe(true)
    })
    route['loi-moi 6 giay/lan (bia-loi-moi)'] = await doRoute(dem, LAN, null, async () => { const r = await biaAction(env, 'S1', 'bia-loi-moi', { con: 5 }, now()); expect(r.ok).toBe(true) })
    route['tao-ban online (bia-tao-ban)'] = await doRoute(dem, LAN, null, async () => { const r = await biaAction(env, 'S1', 'bia-tao-ban', { cheDo: 'don', loai: 'ban' }, now()); expect(r.ok).toBe(true) })
    route['vao-sanh qua gameV2 (token + ho so + bia-sanh)'] = await doRoute(dem, LAN, null, () => gameV2(env, 'bia-sanh', { token }))
    ket.route = route
    ket.phong = await doPhong()
    console.log(JSON.stringify(ket, null, 1))
    if (process.env.DO_BIA_RA) writeFileSync(process.env.DO_BIA_RA, JSON.stringify(ket, null, 2))
  })
})
