// BI-A PHẢN ỨNG GĐ2 · PHÒNG ĐẤU `BanBiA` (Durable Object lớp SQLite, WebSocket Hibernation — đặc tả 6.2, 6.3, 9.4).
// Mỗi bàn một phòng, khoá theo mã ván. Phòng là QUYỀN QUYẾT: mô phỏng lại mọi cú bằng lõi `tran.ts` (vat-ly + luat), giữ lượt, hạn giờ,
// đối chiếu câu trả lời với `game_v2_attempt` (1 lần đọc D1 mỗi câu), ghi kết thúc ván + Điểm bàn trong MỘT lô. Vào bàn bằng vé ký (không đọc D1).
// Luồng: vao(vé sảnh) → phòng chờ (đánh đôi: thêm A.I, đổi chỗ, Bắt đầu; đấu đơn: đủ 2 người là bắt đầu) → bat_dau(vé ghế) → em gọi
// `bia-xep-ban` lấy câu → san_sang(vé trận) → đủ người ⇒ ván chạy: cu / cau_xong / cau_ai / giai_truoc_ai / doi_cau / nhan / bo_van.
import type { DurableObjectState, Env, WsMayChu } from './kieu'
import { docVe, kyVe } from './bi-a-ve'
import {
  apCau, apCu, apDoiCau, apGiaiTruoc, apHan, apRoi, congKhai, doiElo, taoTran, laBiThuong, ELO_DAU,
  type CauBi, type DauVaoGhe, type GoiCu, type LoaiBan, type SuKienTran, type TranBia,
} from '../../src/game/bi-a/tran'
import type { CheDo, Doi } from '../../src/game/bi-a/luat'
import { CHOT, laKiHieu, type KiHieu } from '../../src/game/bi-a/nguyen-to'

declare const WebSocketPair: new () => { 0: WsMayChu; 1: WsMayChu }
declare const WebSocketRequestResponsePair: (new (a: string, b: string) => unknown) | undefined

export const GIAY_ROI = 60
export const GIAY_SAN_SANG = 90
export const HAN_PHONG_MS = 2 * 3_600_000
export const HAN_VE_GHE_MS = 10 * 60_000
export const CAU_NHAN = ['Cú đẹp!', 'Suýt nữa!', 'Tới lượt tớ nhé', 'Hay đấy', 'Chờ tớ giải câu', 'Đấu lại không?'] as const

export interface GhePhong { sbd: string | null; ten: string; ai: boolean }
export interface Phong {
  van: string; cheDo: CheDo; loai: LoaiBan; ma: string | null; chuBan: string; tao: number
  ghe: (GhePhong | null)[]
  trangThai: 'cho' | 'bat_dau' | 'dang' | 'xong' | 'huy'
  hanSanSang: number
  daGhi: boolean
}
interface GheVao { session: string | null; bi: Record<string, CauBi>; chot: CauBi | null }
interface Gan { sbd: string; ghe: number }
type Goi = Record<string, unknown>

const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

export class BanBiA {
  private state: DurableObjectState
  private env: Env
  private phong: Phong | null | undefined = undefined
  private tran: TranBia | null = null
  private vao: Record<number, GheVao> = {}
  private roi: Record<number, number> = {}
  private nhanCuoi: Record<number, number> = {}
  /** Đồng hồ (test đè). */
  now: () => number = () => Date.now()

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    try { if (state.setWebSocketAutoResponse && typeof WebSocketRequestResponsePair === 'function') state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong')) } catch { /* máy không hỗ trợ: em tự trả lời 'ping' ở dưới */ }
  }

  // ───────────── nạp / lưu (phòng có thể ngủ giữa hai gói) ─────────────
  private async nap(): Promise<void> {
    if (this.phong !== undefined) return
    const s = this.state.storage
    const [p, t, v, r] = await Promise.all([s.get<Phong>('phong'), s.get<TranBia>('tran'), s.get<Record<number, GheVao>>('vao'), s.get<Record<number, number>>('roi')])
    this.phong = p ?? null; this.tran = t ?? null; this.vao = v ?? {}; this.roi = r ?? {}
  }
  private async luu(): Promise<void> {
    const s = this.state.storage
    await Promise.all([s.put('phong', this.phong ?? null), s.put('tran', this.tran), s.put('vao', this.vao), s.put('roi', this.roi)])
    await this.henGio()
  }
  private async henGio(): Promise<void> {
    const p = this.phong, t = this.tran
    if (!p || p.trangThai === 'xong' || p.trangThai === 'huy') { await this.state.storage.deleteAlarm(); return }
    const moc: number[] = [p.tao + HAN_PHONG_MS]
    for (const r of Object.values(this.roi)) moc.push(r + GIAY_ROI * 1000)
    if (p.trangThai === 'bat_dau') moc.push(p.hanSanSang)
    if (t && !t.over) moc.push(t.cho[0] ? t.cho[0].han : t.hanCu)
    await this.state.storage.setAlarm(Math.max(this.now() + 50, Math.min(...moc)))
  }

  // ───────────── kết nối ─────────────
  async fetch(req: Request): Promise<Response> {
    if ((req.headers.get('upgrade') ?? '').toLowerCase() !== 'websocket') return new Response('Phòng đấu Bi-a chỉ nhận WebSocket.', { status: 426 })
    const cap = new WebSocketPair()
    this.state.acceptWebSocket(cap[1])
    return new Response(null, { status: 101, webSocket: cap[0] } as ResponseInit)
  }
  private gan(ws: WsMayChu): Gan | null {
    try { const g = ws.deserializeAttachment() as Gan | null; return g && typeof g.sbd === 'string' && typeof g.ghe === 'number' ? g : null } catch { return null }
  }
  private cacKetNoi(): { ws: WsMayChu; gan: Gan | null }[] { return this.state.getWebSockets().map((ws) => ({ ws, gan: this.gan(ws) })) }
  private gheDangNoi(): Set<number> { return new Set(this.cacKetNoi().filter((k) => k.gan).map((k) => k.gan!.ghe)) }
  private gui(ws: WsMayChu, o: Goi): void { try { ws.send(JSON.stringify(o)) } catch { /* kết nối đã đóng */ } }
  /** Máy chủ bàn = ghế NGƯỜI nhỏ nhất đang nối — chạy A.I của các ghế A.I (đặc tả 6.2). */
  private chuMay(): number {
    const t = this.tran, noi = this.gheDangNoi()
    const ghe = t ? t.ghe.map((g) => !g.ai) : (this.phong?.ghe ?? []).map((g) => !!g && !g.ai)
    for (let i = 0; i < ghe.length; i++) if (ghe[i] && noi.has(i)) return i
    return -1
  }
  private goiPhong(toi: number): Goi {
    const p = this.phong!, noi = this.gheDangNoi()
    return { t: 'phong', toi, phong: { van: p.van, cheDo: p.cheDo, loai: p.loai, ma: p.ma, trangThai: p.trangThai, chuBan: p.ghe.findIndex((g) => g?.sbd === p.chuBan), ghe: p.ghe.map((g, i) => (g ? { ten: g.ten, ai: g.ai, noi: g.ai || noi.has(i), sanSang: !!this.vao[i] } : null)) } }
  }
  private goiTT(toi: number, su: SuKienTran | null): Goi {
    return { t: 'tt', toi, su, S: congKhai(this.tran!, this.now()), chuMay: this.chuMay() }
  }
  private phat(su: SuKienTran | null = null): void {
    for (const { ws, gan } of this.cacKetNoi()) {
      if (!gan) continue
      if (this.tran && this.phong?.trangThai !== 'cho' && this.phong?.trangThai !== 'bat_dau') this.gui(ws, this.goiTT(gan.ghe, su))
      else if (this.phong) this.gui(ws, this.goiPhong(gan.ghe))
    }
  }

  async webSocketMessage(ws: WsMayChu, raw: string | ArrayBuffer): Promise<void> {
    await this.nap()
    let m: Goi
    try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) as Goi } catch { return }
    if (m.t === 'ping') { this.gui(ws, { t: 'pong' }); return }
    try { await this.xuLy(ws, m) } catch (e) {
      this.gui(ws, { t: 'loi', ma: m.t, chu: e instanceof Error ? e.message : 'Phòng đấu gặp lỗi.' })
      const g = this.gan(ws)
      if (g && this.tran && this.phong?.trangThai === 'dang') this.gui(ws, this.goiTT(g.ghe, null)) // lệch ⇒ gửi lại trạng thái đầy đủ
    }
  }
  async webSocketClose(ws: WsMayChu): Promise<void> { await this.nap(); await this.dong(ws) }
  async webSocketError(ws: WsMayChu): Promise<void> { await this.nap(); await this.dong(ws) }
  private async dong(ws: WsMayChu): Promise<void> {
    const g = this.gan(ws), p = this.phong
    if (!g || !p) return
    const conNoi = this.cacKetNoi().some((k) => k.ws !== ws && k.gan?.sbd === g.sbd)
    if (conNoi) return
    try { ws.serializeAttachment(null) } catch { /* đã đóng */ }
    if (p.trangThai === 'cho' && g.sbd !== p.chuBan) p.ghe[g.ghe] = null // phòng chờ: bạn rời thì nhả ghế (vào lại bằng vé cũ)
    else if (p.trangThai !== 'xong' && p.trangThai !== 'huy') { this.roi[g.ghe] = this.now(); if (this.tran) this.tran.ghe[g.ghe]!.roi = true }
    await this.luu()
    this.phat()
  }

  // ───────────── gói từ máy em ─────────────
  private async xuLy(ws: WsMayChu, m: Goi): Promise<void> {
    if (m.t === 'vao') return this.vaoBan(ws, m.ve)
    const gan = this.gan(ws), p = this.phong
    if (!gan || !p) throw new Error('Em chưa vào bàn.')
    switch (m.t) {
      case 'ghe': return this.suaGhe(gan, m)
      case 'bat_dau': if (gan.sbd !== p.chuBan) throw new Error('Chỉ chủ bàn bấm Bắt đầu.'); return this.batDau()
      case 'san_sang': return this.sanSang(gan, m.ve)
      case 'cu': return this.cu(gan, m)
      case 'cau_xong': return this.cauXong(gan, m)
      case 'cau_ai': return this.cauAi(gan, m)
      case 'giai_truoc_ai': return this.giaiTruocAi(gan, m)
      case 'doi_cau': return this.doiCau(gan, m.ve)
      case 'nhan': return this.nhan(gan, m.id)
      case 'bo_van': return this.boVan(gan)
      default: throw new Error('Gói không hợp lệ.')
    }
  }

  private async vaoBan(ws: WsMayChu, veChu: unknown): Promise<void> {
    const now = this.now()
    const v = await docVe(this.env, veChu, 'sanh', now)
    if (!this.phong) {
      if (!v.chu) throw new Error('Bàn chưa mở hoặc đã đóng.')
      this.phong = { van: v.van, cheDo: v.cheDo, loai: v.loai, ma: v.ma, chuBan: v.sbd, tao: now, ghe: Array.from({ length: v.cheDo === 'doi' ? 4 : 2 }, () => null), trangThai: 'cho', hanSanSang: 0, daGhi: false }
    }
    const p = this.phong
    if (p.van !== v.van) throw new Error('Vé không phải của bàn này.')
    let g = p.ghe.findIndex((x) => x?.sbd === v.sbd)
    if (g < 0) {
      if (p.trangThai !== 'cho') throw new Error(p.trangThai === 'xong' || p.trangThai === 'huy' ? 'Bàn đã đóng.' : 'Ván đã bắt đầu.')
      g = v.sbd === p.chuBan && !p.ghe[0] ? 0 : p.ghe.findIndex((x) => x === null)
      if (g < 0) throw new Error('Bàn đã đủ người.')
      p.ghe[g] = { sbd: v.sbd, ten: v.ten, ai: false }
    }
    for (const k of this.cacKetNoi()) if (k.ws !== ws && k.gan?.sbd === v.sbd) { try { k.ws.serializeAttachment(null); k.ws.close(4000, 'Em đã vào bàn ở máy khác.') } catch { /* đã đóng */ } }
    ws.serializeAttachment({ sbd: v.sbd, ghe: g } satisfies Gan)
    delete this.roi[g]
    if (this.tran) this.tran.ghe[g]!.roi = false
    if (p.trangThai === 'cho' && p.cheDo === 'don' && p.ghe.every((x) => x && !x.ai)) { await this.batDau(); return }
    await this.luu()
    this.phat()
    if (p.trangThai === 'bat_dau' && !this.vao[g]) await this.guiVeGhe(ws, g)
  }
  private async suaGhe(gan: Gan, m: Goi): Promise<void> {
    const p = this.phong!
    if (gan.sbd !== p.chuBan) throw new Error('Chỉ chủ bàn xếp ghế.')
    if (p.trangThai !== 'cho') throw new Error('Ván đã bắt đầu.')
    const a = so(m.ghe), n = p.ghe.length
    if (a === null || a < 0 || a >= n) throw new Error('Ghế không hợp lệ.')
    if (m.lam === 'them_ai') { if (p.ghe[a]) throw new Error('Ghế này đã có người.'); p.ghe[a] = { sbd: null, ten: `A.I ${a + 1}`, ai: true } }
    else if (m.lam === 'bo_ai') { if (!p.ghe[a]?.ai) throw new Error('Ghế này không phải A.I.'); p.ghe[a] = null }
    else if (m.lam === 'doi_cho') {
      const b = so(m.ghe2)
      if (b === null || b < 0 || b >= n || b === a) throw new Error('Ghế không hợp lệ.')
      ;[p.ghe[a], p.ghe[b]] = [p.ghe[b]!, p.ghe[a]!]
      for (const k of this.cacKetNoi()) if (k.gan) { const moi = p.ghe.findIndex((x) => x?.sbd === k.gan!.sbd); if (moi >= 0 && moi !== k.gan.ghe) k.ws.serializeAttachment({ sbd: k.gan.sbd, ghe: moi } satisfies Gan) }
    } else throw new Error('Thao tác ghế không hợp lệ.')
    await this.luu()
    this.phat()
  }
  private async guiVeGhe(ws: WsMayChu, g: number): Promise<void> {
    const p = this.phong!, x = p.ghe[g]
    if (!x || x.ai || !x.sbd) return
    const veGhe = await kyVe(this.env, { k: 'ghe', van: p.van, ghe: g, sbd: x.sbd, cheDo: p.cheDo, loai: p.loai, het: this.now() + HAN_VE_GHE_MS })
    this.gui(ws, { t: 'bat_dau', ghe: g, veGhe })
  }
  private async batDau(): Promise<void> {
    const p = this.phong!
    if (p.trangThai !== 'cho') throw new Error('Ván đã bắt đầu.')
    if (p.ghe.some((x) => !x)) throw new Error('Còn ghế trống: mời bạn hoặc thêm A.I.')
    if (!p.ghe.some((x) => x && !x.ai)) throw new Error('Bàn cần ít nhất một người.')
    p.trangThai = 'bat_dau'
    p.hanSanSang = this.now() + GIAY_SAN_SANG * 1000
    await this.luu()
    this.phat()
    for (const k of this.cacKetNoi()) if (k.gan) await this.guiVeGhe(k.ws, k.gan.ghe)
  }
  private async sanSang(gan: Gan, veChu: unknown): Promise<void> {
    const p = this.phong!
    if (p.trangThai !== 'bat_dau') throw new Error(p.trangThai === 'dang' ? 'Ván đã chạy.' : 'Chưa bắt đầu.')
    const v = await docVe(this.env, veChu, 'tran', this.now())
    if (v.van !== p.van || v.ghe !== gan.ghe || v.sbd !== gan.sbd || p.ghe[gan.ghe]?.sbd !== v.sbd) throw new Error('Vé trận không khớp ghế.')
    this.vao[gan.ghe] = { session: v.session, bi: v.bi, chot: v.chot }
    if (p.ghe.every((x, i) => !x || x.ai || this.vao[i])) this.khoiTran()
    await this.luu()
    this.phat()
  }
  private khoiTran(): void {
    const p = this.phong!
    const ghe: DauVaoGhe[] = p.ghe.map((x, i) => {
      const v = x && !x.ai ? this.vao[i] : undefined
      return v && x ? { ten: x.ten, ai: false, sbd: x.sbd, bi: v.bi as Partial<Record<KiHieu, CauBi>>, chot: v.chot } : { ten: x?.ai ? x.ten : `A.I ${i + 1}`, ai: true, sbd: null, bi: {}, chot: null }
    })
    this.tran = taoTran({ van: p.van, cheDo: p.cheDo, loai: p.loai, ghe, now: this.now() })
    const noi = this.gheDangNoi()
    this.tran.ghe.forEach((g, i) => { g.roi = !g.ai && !noi.has(i) })
    p.trangThai = 'dang'
  }

  // ───────────── trong ván ─────────────
  private tranDang(): TranBia {
    if (this.phong?.trangThai !== 'dang' || !this.tran) throw new Error('Ván chưa chạy.')
    if (this.tran.over) throw new Error('Ván đã kết thúc.')
    return this.tran
  }
  private async ap(f: (t: TranBia) => SuKienTran | SuKienTran[]): Promise<void> {
    const t2 = clone(this.tranDang())
    const r = f(t2)
    t2.seq++
    this.tran = t2
    const ds = Array.isArray(r) ? r : [r]
    if (t2.over) await this.ketThuc()
    await this.luu()
    for (const su of ds) this.phat(su)
  }
  private async cu(gan: Gan, m: Goi): Promise<void> {
    const t = this.tranDang()
    const nguoiDanh = t.ghe[t.cur]!
    if (nguoiDanh.ai ? gan.ghe !== this.chuMay() : gan.ghe !== t.cur) throw new Error('Chưa tới lượt em.')
    const dx = so(m.dx), dy = so(m.dy), v = so(m.v), sx = so(m.sx) ?? 0, sy = so(m.sy) ?? 0
    if (dx === null || dy === null || v === null) throw new Error('Cú đánh không hợp lệ.')
    const db = m.datBi && typeof m.datBi === 'object' ? m.datBi as Goi : null
    const cu: GoiCu = { dx, dy, v, sx, sy, ...(db && so(db.x) !== null && so(db.y) !== null ? { datBi: { x: so(db.x)!, y: so(db.y)! } } : {}) }
    await this.ap((t2) => apCu(t2, t2.cur, cu, this.now()))
  }
  /** Em báo đã trả lời qua `answer`: phòng đọc `game_v2_attempt` (id = phiên|câu) để biết đúng/sai THẬT. Không thấy ⇒ gói giả, từ chối. */
  private async cauXong(gan: Gan, m: Goi): Promise<void> {
    const t = this.tranDang(), g = gan.ghe, gh = t.ghe[g]!
    if (gh.ai || gh.sbd !== gan.sbd) throw new Error('Ghế này không trả lời câu.')
    const loai = m.loai === 'chot' ? 'chot' : m.loai === 'giai_truoc' ? 'giai_truoc' : 'bi'
    const ki = m.ki, qid = typeof m.qid === 'string' ? m.qid : ''
    if (!laKiHieu(ki)) throw new Error('Bi không hợp lệ.')
    if (loai === 'giai_truoc') apGiaiTruoc(clone(t), g, ki, false) // kiểm luật trước khi tốn một lần đọc D1
    else { const c = t.cho[0]; if (!c || c.ghe !== g || c.ki !== ki || c.loai !== loai) throw new Error('Câu này không phải câu đang chờ.') }
    const mong = loai === 'chot' ? t.chot[g]?.qid : t.cau[ki]?.qid
    if (!qid || qid !== mong) throw new Error('Câu không khớp bi.')
    const session = this.vao[g]?.session
    if (!session) throw new Error('Ghế này không có phiên câu.')
    const r = await this.env.DB.prepare("SELECT json_extract(json,'$.correct') AS c FROM game_v2_attempt WHERE id = ? AND sbd = ?").bind(`${session}|${qid}`, gan.sbd).first<{ c: unknown }>()
    if (!r) throw new Error('Phòng chưa thấy câu trả lời của em trên máy chủ.')
    const dung = r.c === 1 || r.c === true || r.c === '1'
    await this.ap((t2) => (loai === 'giai_truoc' ? apGiaiTruoc(t2, g, ki, dung) : apCau(t2, g, ki, dung, this.now())))
  }
  private async cauAi(gan: Gan, m: Goi): Promise<void> {
    const t = this.tranDang(), g = so(m.ghe)
    if (gan.ghe !== this.chuMay()) throw new Error('Chỉ máy chủ bàn trả lời thay A.I.')
    if (g === null || !t.ghe[g]?.ai || !laKiHieu(m.ki)) throw new Error('Ghế này không phải A.I.')
    const ki = m.ki as KiHieu
    await this.ap((t2) => apCau(t2, g, ki, m.dung === true, this.now()))
  }
  private async giaiTruocAi(gan: Gan, m: Goi): Promise<void> {
    const t = this.tranDang(), g = so(m.ghe)
    if (gan.ghe !== this.chuMay()) throw new Error('Chỉ máy chủ bàn giải thay A.I.')
    if (g === null || !t.ghe[g]?.ai || !laBiThuong(m.ki)) throw new Error('Ghế này không phải A.I.')
    const ki = m.ki
    await this.ap((t2) => apGiaiTruoc(t2, g, ki, m.dung === true))
  }
  private async doiCau(gan: Gan, veChu: unknown): Promise<void> {
    const t = this.tranDang()
    const v = await docVe(this.env, veChu, 'cau', this.now())
    if (v.van !== t.van || v.sbd !== gan.sbd || t.ghe[gan.ghe]?.sbd !== gan.sbd || !laKiHieu(v.ki)) throw new Error('Vé câu không khớp ghế.')
    const ki = v.ki as KiHieu
    await this.ap((t2) => apDoiCau(t2, gan.ghe, ki === CHOT ? CHOT : ki, v.cau))
  }
  private async nhan(gan: Gan, id: unknown): Promise<void> {
    const n = so(id), now = this.now()
    if (n === null || n < 1 || n > CAU_NHAN.length) throw new Error('Câu nhắn không hợp lệ.')
    if (now - (this.nhanCuoi[gan.ghe] ?? 0) < 2000) return
    this.nhanCuoi[gan.ghe] = now
    for (const k of this.cacKetNoi()) if (k.gan) this.gui(k.ws, { t: 'nhan', tu: gan.ghe, id: n })
  }
  private async boVan(gan: Gan): Promise<void> {
    const p = this.phong!
    if (p.trangThai === 'cho' || p.trangThai === 'bat_dau') {
      if (gan.sbd === p.chuBan) { p.trangThai = 'huy'; await this.ghiHuy() }
      else { p.ghe[gan.ghe] = null; delete this.vao[gan.ghe] }
      await this.luu(); this.phat(); return
    }
    await this.ap((t2) => apRoi(t2, gan.ghe, 'bo'))
  }

  // ───────────── hạn giờ ─────────────
  async alarm(): Promise<void> {
    await this.nap()
    const p = this.phong, now = this.now()
    if (!p || p.trangThai === 'xong' || p.trangThai === 'huy') return
    if (now >= p.tao + HAN_PHONG_MS) {
      if (this.tran && p.trangThai === 'dang' && !this.tran.over) { this.tran.over = { doiThang: null, nguoiHa: null, lyDo: 'het_han' }; this.tran.seq++; await this.ketThuc(); await this.luu(); this.phat({ k: 'ket_thuc', ket: this.tran.over }); return }
      p.trangThai = 'huy'; await this.ghiHuy(); await this.luu(); this.phat(); return
    }
    if (p.trangThai === 'cho') {
      const chu = p.ghe.findIndex((x) => x?.sbd === p.chuBan)
      if (chu >= 0 && this.roi[chu] && now - this.roi[chu]! >= GIAY_ROI * 1000) { p.trangThai = 'huy'; await this.ghiHuy() }
      await this.luu(); this.phat(); return
    }
    if (p.trangThai === 'bat_dau') {
      if (now < p.hanSanSang) { await this.luu(); return }
      const sanSang = p.ghe.filter((x, i) => x && !x.ai && this.vao[i]).length
      if (!sanSang) { p.trangThai = 'huy'; await this.ghiHuy(); await this.luu(); this.phat(); return }
      p.ghe.forEach((x, i) => { if (x && !x.ai && !this.vao[i]) p.ghe[i] = { sbd: null, ten: `A.I ${i + 1}`, ai: true } }) // em không sẵn sàng kịp ⇒ ghế thành A.I
      this.khoiTran(); await this.luu(); this.phat(); return
    }
    const t = this.tran
    if (!t || t.over) return
    const ds: SuKienTran[] = []
    const t2 = clone(t)
    for (let i = 0; i < 8; i++) { const su = apHan(t2, now); if (!su) break; ds.push(su) }
    for (const [gs, luc] of Object.entries(this.roi)) {
      const g = Number(gs)
      if (!t2.over && now - luc >= GIAY_ROI * 1000 && !t2.ghe[g]!.ai) { ds.push(apRoi(t2, g, 'roi_mang')); delete this.roi[g] }
    }
    if (ds.length) { t2.seq++; this.tran = t2; if (t2.over) await this.ketThuc() }
    await this.luu()
    for (const su of ds) this.phat(su)
  }

  // ───────────── kết thúc ván: MỘT lô ghi D1 (+ 1 lần đọc Điểm bàn khi ván tính Điểm bàn) ─────────────
  private async ghiHuy(): Promise<void> {
    const p = this.phong!
    await this.env.DB.prepare("UPDATE bi_a_van SET trang_thai = 'bo', xong_luc = ? WHERE id = ? AND trang_thai IN ('cho','mo')").bind(new Date(this.now()).toISOString(), p.van).run().catch(() => undefined)
  }
  private async ketThuc(): Promise<void> {
    const p = this.phong!, t = this.tran!
    if (p.daGhi || !t.over) return
    p.daGhi = true
    p.trangThai = 'xong'
    const luc = new Date(this.now()).toISOString(), ket = t.over
    const nguoi = t.ghe.map((g, i) => ({ g, i })).filter((x) => x.g.sbd)
    const tinhElo = !t.khongElo && t.loai === 'ban' && ket.doiThang !== null && ket.lyDo !== 'het_han' && nguoi.length === t.ghe.length
    const q = [
      this.env.DB.prepare('UPDATE bi_a_van SET trang_thai = ?, doi_thang = ?, diem_0 = ?, diem_1 = ?, json = ?, xong_luc = ? WHERE id = ?')
        .bind(ket.lyDo === 'het_han' ? 'bo' : 'xong', ket.doiThang, t.diem[0], t.diem[1], JSON.stringify({ lyDo: ket.lyDo, soCu: t.soCu, online: 1, khongElo: t.khongElo }), luc, p.van),
      this.env.DB.prepare('DELETE FROM bi_a_ghe WHERE van = ?').bind(p.van),
      ...t.ghe.map((g, i) => this.env.DB.prepare('INSERT INTO bi_a_ghe (van, ghe, doi, sbd, session, dung, sai, an, vang) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(p.van, i + 1, g.doi, g.sbd, this.vao[i]?.session ?? null, t.tk[i]!.dung, t.tk[i]!.sai, t.tk[i]!.an, t.tk[i]!.vang)),
      ...Object.entries(this.vao).filter(([, v]) => v.session).map(([gs, v]) => this.env.DB.prepare("UPDATE game_v2_session SET json = json_set(json, '$.dong', 1) WHERE id = ? AND sbd = ?").bind(v.session, t.ghe[Number(gs)]!.sbd)),
    ]
    if (tinhElo) {
      const sbd = nguoi.map((x) => x.g.sbd!)
      const r = await this.env.DB.prepare(`SELECT sbd, diem FROM bi_a_diem_ban WHERE sbd IN (${sbd.map(() => '?').join(',')})`).bind(...sbd).all<{ sbd: string; diem: number }>()
      const cu = new Map((r.results ?? []).map((x) => [x.sbd, Number(x.diem) || ELO_DAU]))
      const diemCua = (doi: Doi) => nguoi.filter((x) => x.g.doi === doi).map((x) => cu.get(x.g.sbd!) ?? ELO_DAU)
      const doi = doiElo(diemCua(0), diemCua(1), ket.doiThang!)
      for (const x of nguoi) {
        const moi = (cu.get(x.g.sbd!) ?? ELO_DAU) + doi[x.g.doi]
        q.push(this.env.DB.prepare('INSERT INTO bi_a_diem_ban (sbd, diem, so_van, cap_nhat) VALUES (?, ?, 1, ?) ON CONFLICT(sbd) DO UPDATE SET diem = excluded.diem, so_van = so_van + 1, cap_nhat = excluded.cap_nhat').bind(x.g.sbd, moi, luc))
      }
    }
    await this.env.DB.batch(q)
  }
}

/** Định tuyến Worker: `GET /bi-a/phong/<mã ván>` (nâng cấp WebSocket) ⇒ phòng đấu của đúng ván. Chưa có Durable Object ⇒ 503 (Sảnh ghi "Sắp mở"). */
export async function denPhongBiA(req: Request, env: Env): Promise<Response> {
  const van = decodeURIComponent(new URL(req.url).pathname.slice('/bi-a/phong/'.length))
  if (!/^[0-9a-f-]{36}$/.test(van)) return new Response('Mã bàn không hợp lệ.', { status: 400 })
  if (!env.BAN_BIA) return new Response('Phòng đấu Bi-a chưa mở.', { status: 503 })
  return env.BAN_BIA.get(env.BAN_BIA.idFromName(van)).fetch(req)
}
