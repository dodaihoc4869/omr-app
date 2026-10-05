// @vitest-environment node
// BI-A PHẢN ỨNG GĐ2 · MÁY EM + PHÒNG ĐẤU THẬT: hai (hoặc ba) bộ điều khiển `VanMang` (đúng lớp màn chơi dùng) nối qua kênh giả tới lớp phòng
// `BanBiA` thật (D1 thật node:sqlite). Máy em tự vẽ trước từng khung 1/60 giây, mở tấm câu, gửi cau_xong; máy chủ bàn chạy A.I.
// Nghiệm thu đặc tả §12 "GĐ2 thêm": 2 máy đánh hết 1 ván (vẽ trước khớp băm phòng sau MỌI cú), nối lại sau 10 giây, Điểm bàn Elo; đánh đôi có A.I.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { BanBiA } from '../server/src/bi-a-phong'
import { kyVe } from '../server/src/bi-a-ve'
import type { Env, WsMayChu } from '../server/src/kieu'
import { VanMang, type GoiTT } from '../src/game/bi-a/dieu-khien-mang'
import type { CauBia, KetThucVan, SuKienVan, YeuCauCau } from '../src/game/bi-a/dieu-khien'
import { bamTran, bamVi, ballsTu, randHat, type CauBi, type TranBia } from '../src/game/bi-a/tran'
import { aiDatBi, aiTinh } from '../src/game/bi-a/ai'
import { biCuaGhe, chiaBi, type CheDo } from '../src/game/bi-a/luat'
import type { KiHieu } from '../src/game/bi-a/nguyen-to'

const VAN = '99999999-2222-4333-8444-555555555555'
const T0 = 1_790_000_000_000
type Goi = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const sao = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)))

/** Đồng hồ giả chung cho máy em (hẹn giờ của ván) và phòng (now). */
class DongHo {
  t = 0
  private hen: { t: number; fn: () => void; huy: boolean }[] = []
  dat = (fn: () => void, ms: number) => { const h = { t: this.t + ms, fn, huy: false }; this.hen.push(h); return () => { h.huy = true } }
  chay(ms: number) {
    this.t += ms
    for (;;) {
      const den = this.hen.filter((h) => !h.huy && h.t <= this.t).sort((a, b) => a.t - b.t)[0]
      if (!den) break
      den.huy = true
      den.fn()
    }
    this.hen = this.hen.filter((h) => !h.huy)
  }
}
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
  gan: unknown = null
  dong = false
  constructor(private st: StateGia, private nghe: (m: Goi) => void) { st.acceptWebSocket(this) }
  send(s: string) { if (this.dong) throw new Error('đã đóng'); this.nghe(JSON.parse(s)) }
  close() { this.dong = true; this.st.ws = this.st.ws.filter((x) => x !== this) }
  serializeAttachment(v: unknown) { this.gan = sao(v) }
  deserializeAttachment() { return sao(this.gan) }
}

const cauGhe = (sbd: string, cheDo: CheDo, ghe: number): { bi: Record<string, CauBi>; chot: CauBi } => {
  const bi: Record<string, CauBi> = {}
  for (const id of biCuaGhe(chiaBi(cheDo), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc: 'TH', giay: 90 }
  return { bi, chot: { qid: `chot-${sbd}`, muc: 'VD', giay: 180 } }
}
const cauMay = (qid: string): CauBia => ({ qid, phan: 'I', tenDang: `Dạng ${qid}` }) as unknown as CauBia

/** Một máy học sinh: định tuyến gói phòng như `BanOnline`, tấm câu trả lời tự động, cú đánh do bàn tay A.I thay người bấm. */
class May {
  ws!: WsGia
  v: VanMang | null = null
  cheDo: CheDo = 'don'
  sheet: YeuCauCau | null = null
  loi: string[] = []
  ket: KetThucVan | null = null
  soGoiTT = 0
  cuoiTT: Goi | null = null
  mat = false
  private cauTheoBi: Partial<Record<KiHieu, CauBia>> = {}
  private chot: CauBia | null = null
  constructor(readonly b: Ban, readonly sbd: string, readonly ten: string, readonly chu: boolean, private tl: () => number) {}
  async vao(cheDo: CheDo) {
    this.cheDo = cheDo
    this.ws = new WsGia(this.b.st, (m) => this.nhan(m))
    this.mat = false
    const ve = await kyVe(this.b.env, { k: 'sanh', van: VAN, sbd: this.sbd, ten: this.ten, cheDo, loai: 'ban', chu: this.chu, ma: '4821', het: T0 + 3_600_000 })
    this.b.gui(this, { t: 'vao', ve })
    await this.b.bom()
  }
  rot() { this.mat = true; this.ws.close(); this.b.hang.push({ may: this, dong: true }) }
  gui(o: Goi) { if (this.mat) return false; this.b.gui(this, o); return true }
  private nhan(m: Goi) {
    if (m.t === 'bat_dau') {
      const { bi, chot } = cauGhe(this.sbd, this.cheDo, m.ghe)
      for (const [ki, c] of Object.entries(bi)) this.cauTheoBi[ki as KiHieu] = cauMay(c.qid)
      this.chot = cauMay(chot.qid)
      void kyVe(this.b.env, { k: 'tran', van: VAN, ghe: m.ghe, sbd: this.sbd, session: `ses-${this.sbd}`, bi, chot, het: T0 + 3_600_000 }).then((ve) => this.gui({ t: 'san_sang', ve }))
    } else if (m.t === 'tt') {
      this.soGoiTT++
      this.cuoiTT = m
      if (!this.v) {
        const sk: SuKienVan = { moCau: (y) => { this.sheet = y }, am: () => {}, gomVa: () => {}, ketThuc: (k) => { this.ket = k } }
        this.v = new VanMang({ cheDo: this.cheDo, loaiMang: 'ban', em: m.toi, tenEm: this.ten, cauTheoBi: this.cauTheoBi, chot: this.chot, rand: randHat(`may-${this.sbd}`), now: () => T0 + this.b.dh.t },
          sk, { gui: (o) => this.gui(o) }, m as GoiTT)
        this.v.datHen(this.b.dh.dat)
      } else this.v.apTT(m as GoiTT)
    } else if (m.t === 'loi') { this.loi.push(`${m.ma}: ${m.chu}`); this.v?.apLoi(m.ma, String(m.chu ?? '')) }
    else if (m.t === 'nhan') this.v?.apNhan(Number(m.tu), Number(m.id))
  }
  /** Một khung hình của máy em: trả lời tấm câu đang mở (ghi lượt `answer` thật), hoặc đánh khi tới lượt. */
  khung(rand: () => number) {
    const v = this.v
    if (!v) return
    const y = this.sheet
    if (y && v.sheet?.ma === y.ma) {
      const dung = this.tl() < 0.75
      this.b.traLoi(this.sbd, y.cau.qid, dung)
      v.xongCau(y.ma, dung, false)
      v.xongCau(y.ma, dung, true)
      this.sheet = null
    } else if (v.nguoiDuocDanh()) {
      const doi = v.ghe[v.em]!.doi
      if (v.S.ballInHand) { aiDatBi(v.st, doi, v.bi, v.isBreak, rand); const c = v.st.balls.find((b) => b.id === 'cue')!; c.on = true }
      const k = aiTinh(v.st, doi, v.bi, v.isBreak, v.aim, rand)
      v.aim = k.aim
      v.power = Math.max(0.05, k.p)
      v.ban()
    }
    v.buoc(1 / 60)
  }
}

class Ban {
  d = taoD1That()
  env = this.d.env as Env
  st = new StateGia()
  dh = new DongHo()
  phong: BanBiA
  hang: { may: May; s?: string; dong?: boolean }[] = []
  soCu: Record<number, number> = {}
  demGoi: Record<string, number> = {}
  constructor(cheDo: CheDo) {
    this.d.sql.exec(`INSERT INTO bi_a_van (id, loai, che_do, ngay, chu_ban, trang_thai, tao_luc) VALUES ('${VAN}', 'ban', '${cheDo}', '2026-09-30', 'S1', 'cho', 'x')`)
    this.phong = new BanBiA(this.st as never, this.env)
    this.phong.now = () => T0 + this.dh.t
  }
  gui(may: May, o: Goi) { this.demGoi[o.t] = (this.demGoi[o.t] ?? 0) + 1; if (o.t === 'cu') this.soCu[may.v?.cur ?? -1] = (this.soCu[may.v?.cur ?? -1] ?? 0) + 1; this.hang.push({ may, s: JSON.stringify(o) }) }
  /** Phòng xử lý lần lượt mọi gói đang chờ (như Durable Object: một luồng). */
  async bom() {
    for (let i = 0; i < 1000 && this.hang.length; i++) {
      const h = this.hang.shift()!
      if (h.dong) await this.phong.webSocketClose(h.may.ws)
      else if (!h.may.ws.dong) await this.phong.webSocketMessage(h.may.ws, h.s!)
    }
  }
  traLoi(sbd: string, qid: string, dung: boolean) {
    this.d.sql.prepare('INSERT OR REPLACE INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`ses-${sbd}|${qid}`, sbd, `ses-${sbd}`, qid, `g-${qid}`, JSON.stringify({ correct: dung, attempt: { correct: dung } }), 'x')
  }
  /** Chạy `ms` mili-giây theo khung 1/60 giây: máy em vẽ/đánh/trả lời, phòng nhận gói, báo thức phòng khi tới giờ. */
  async chay(may: May[], ms: number, rand: () => number, dung?: () => boolean) {
    for (let t = 0; t < ms; t += 1000 / 60) {
      this.dh.chay(1000 / 60)
      for (const m of may) if (!m.mat) m.khung(rand)
      await new Promise((r) => setImmediate(r)) // cho vé ký (WebCrypto) kịp xong
      await this.bom()
      if (this.st.bao !== null && T0 + this.dh.t >= this.st.bao) { this.st.bao = null; await this.phong.alarm(); await this.bom() }
      if (dung?.()) return
    }
  }
}

describe('Máy em (VanMang) + phòng đấu thật — đấu đơn', () => {
  it('2 máy đánh HẾT 1 ván từng khung 1/60 giây: vẽ trước khớp băm phòng mọi cú (lech 0); nối lại sau 10 giây; nhắn nhanh; Điểm bàn ±12', async () => {
    const b = new Ban('don')
    const A = new May(b, 'S1', 'Khánh Linh', true, randHat('tl-A')), B = new May(b, 'S2', 'Minh Châu', false, randHat('tl-B'))
    await A.vao('don'); await B.vao('don')
    await b.chay([A, B], 200, randHat('x'))
    expect(A.v?.em).toBe(0)
    expect(B.v?.em).toBe(1)
    expect(A.v!.S.bam).toBe(B.v!.S.bam)
    // nhắn nhanh: A gửi "Cú đẹp!" ⇒ B hiện bong bóng ghế 0
    A.v!.guiNhan(1); await b.bom()
    expect(B.v!.nhanDen.at(-1)).toMatchObject({ tu: 0, id: 1 })

    const rand = randHat('ban-tay')
    let daRot = false, soGoiTruocRot = 0
    for (let vong = 0; vong < 400 && !(A.v!.S.over && B.v!.S.over); vong++) {
      await b.chay([A, B], 1000, rand, () => !!A.v!.S.over)
      // B rớt mạng lúc A đang nhắm cú thứ 4 trở đi, 10 giây sau vào lại bằng vé cũ
      if (!daRot && A.v!.S.soCu >= 3 && A.v!.S.cur === 0 && !A.v!.S.cho.length && !A.v!.S.over) {
        daRot = true
        B.rot(); await b.bom()
        soGoiTruocRot = B.soGoiTT
        await b.chay([A], 10_000, rand)
        expect(A.v!.roiGhe[1]).toBe(true) // A thấy ghế B "đang nối lại"
        await B.vao('don')
        expect(B.soGoiTT).toBeGreaterThan(soGoiTruocRot)
        // gói vào lại: đủ trạng thái phòng (su = null); B còn vẽ nốt cú cũ thì gói xếp hàng, vẽ xong mới áp
        expect(B.cuoiTT?.su).toBeNull()
        expect(B.cuoiTT?.S.bam).toBe(bamTran(b.st.kho.get('tran') as TranBia))
        expect(A.v!.roiGhe[1]).toBe(false)
      }
    }
    await b.chay([A, B], 3000, rand) // chờ hiệu ứng kết thúc (1,5 giây) gọi ketThuc
    expect(daRot).toBe(true)
    const s = A.v!.S
    expect(s.over).not.toBeNull()
    expect(B.v!.S.bam).toBe(s.bam)
    expect(A.v!.lech).toBe(0)
    expect(B.v!.lech).toBe(0)
    expect(A.loi.concat(B.loi)).toEqual([])
    expect(s.soCu).toBeGreaterThan(5)
    expect(bamVi(ballsTu(A.v!.st))).toBe(bamVi(s.balls)) // bàn hiện trên máy = bàn phòng
    expect(A.ket).not.toBeNull(); expect(B.ket).not.toBeNull()
    expect(A.v!.ketMang?.doiThang).toBe(s.over!.doiThang)
    const thang = s.over!.doiThang, nguoiThang = thang === 0 ? 'S1' : 'S2', nguoiThua = thang === 0 ? 'S2' : 'S1'
    expect(b.d.dem('bi_a_diem_ban', `sbd='${nguoiThang}' AND diem=1012 AND so_van=1`)).toBe(1)
    expect(b.d.dem('bi_a_diem_ban', `sbd='${nguoiThua}' AND diem=988`)).toBe(1)
  }, 180_000)

  it('cú của em MẤT cùng kết nối cũ (phòng chưa nhận): vào lại ⇒ bi về đúng chỗ phòng giữ, vẫn lượt em — không đứng "Đang chờ phòng đấu…"', async () => {
    const b = new Ban('don')
    const A = new May(b, 'S1', 'Khánh Linh', true, randHat('tl-A3')), B = new May(b, 'S2', 'Minh Châu', false, randHat('tl-B3'))
    await A.vao('don'); await B.vao('don')
    await b.chay([B], 200, randHat('x3'))
    A.khung(randHat('tay'))
    const cu = b.hang.findIndex((h) => h.may === A && h.s?.includes('"t":"cu"'))
    expect(cu).toBeGreaterThanOrEqual(0)
    b.hang.splice(cu, 1) // gói cú rơi cùng kết nối
    A.rot(); await b.bom()
    for (let i = 0; i < 600; i++) { b.dh.chay(1000 / 60); A.v!.buoc(1 / 60) } // máy A vẫn vẽ nốt cú, rồi chờ phòng
    expect(A.v!.pha).toBe('xet')
    await A.vao('don')
    await b.chay([B], 100, randHat('x3'))
    for (let i = 0; i < 30; i++) { b.dh.chay(1000 / 60); A.v!.buoc(1 / 60) }
    const tr = b.st.kho.get('tran') as TranBia
    expect(tr.soCu).toBe(0)
    expect(A.v!.S.bam).toBe(bamTran(tr))
    expect(bamVi(ballsTu(A.v!.st))).toBe(bamVi(tr.balls)) // bi quay về chỗ phòng giữ
    expect(A.v!.pha).toBe('aim')
    expect(A.v!.nguoiDuocDanh()).toBe(true)
  })
})

describe('Máy em (VanMang) + phòng đấu thật — đánh đôi 2 người + 2 A.I', () => {
  it('chủ bàn thêm 2 A.I, Bắt đầu; máy chủ bàn đánh + trả lời thay A.I; hai máy khớp băm, hết ván, không tính Điểm bàn', async () => {
    const b = new Ban('doi')
    const A = new May(b, 'S1', 'Khánh Linh', true, randHat('tl-A2')), B = new May(b, 'S2', 'Minh Châu', false, randHat('tl-B2'))
    await A.vao('doi'); await B.vao('doi')
    const cho = (b.st.kho.get('phong') as Goi).ghe as (Goi | null)[]
    const trong = cho.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0)
    expect(trong).toHaveLength(2)
    for (const i of trong) A.gui({ t: 'ghe', lam: 'them_ai', ghe: i })
    A.gui({ t: 'bat_dau' })
    await b.bom()
    await b.chay([A, B], 200, randHat('x2'))
    expect(A.v).not.toBeNull(); expect(B.v).not.toBeNull()
    expect(A.v!.laChuMay).toBe(true)
    expect(B.v!.laChuMay).toBe(false)
    const rand = randHat('ban-tay-2')
    let daRot = false
    for (let vong = 0; vong < 900 && !A.v!.S.over; vong++) {
      await b.chay([A, B], 1000, rand, () => !!A.v!.S.over)
      // chủ bàn (ghế 0) rớt 40 giây ⇒ máy B (ghế người nhỏ nhất còn nối) chạy A.I thay; A vào lại ⇒ A lại là máy chủ bàn
      // rớt đúng lúc tới lượt A.I (không chờ câu hỏi) ⇒ kiểm được A.I vẫn đánh qua máy B, không phụ thuộc diễn biến từng cú
      if (!daRot && A.v!.S.soCu >= 6 && !A.v!.S.over && trong.includes(A.v!.S.cur) && !A.v!.S.cho.length) {
        daRot = true
        const aiTruoc = trong.reduce((n, i) => n + (b.soCu[i] ?? 0), 0)
        A.rot(); await b.bom()
        await b.chay([B], 10_000, rand, () => B.v!.laChuMay) // B đang vẽ dở cú thì gói phòng xếp hàng tới khi vẽ xong
        expect(B.v!.laChuMay).toBe(true)
        await b.chay([B], 40_000, rand, () => !!B.v!.S.over)
        if (!B.v!.S.over) expect(trong.reduce((n, i) => n + (b.soCu[i] ?? 0), 0)).toBeGreaterThan(aiTruoc) // A.I vẫn đánh, qua máy B
        await A.vao('doi')
        await b.chay([A, B], 10_000, rand, () => (A.v!.laChuMay && !B.v!.laChuMay) || !!A.v!.S.over)
        if (!A.v!.S.over) { expect(A.v!.laChuMay).toBe(true); expect(B.v!.laChuMay).toBe(false) }
      }
    }
    expect(daRot).toBe(true)
    await b.chay([A, B], 3000, rand)
    const s = A.v!.S
    expect(s.over).not.toBeNull()
    expect(B.v!.S.bam).toBe(s.bam)
    expect(A.v!.lech + B.v!.lech).toBe(0)
    // lúc đổi máy chủ bàn, gói A.I tự động của máy cũ có thể bị từ chối (máy kia đã làm) — máy em không báo gì; ngoài ra không lỗi nào
    expect(A.loi.concat(B.loi).filter((l) => !/^(cau_ai|giai_truoc_ai|cu): /.test(l))).toEqual([])
    // A.I (ghế trống cũ) có đánh thật, qua máy chủ bàn
    for (const i of trong) expect(b.soCu[i] ?? 0).toBeGreaterThan(0)
    expect(b.demGoi.cau_ai ?? 0).toBeGreaterThan(0) // A.I trả lời câu qua máy chủ bàn
    expect(b.demGoi.giai_truoc_ai ?? 0).toBeGreaterThan(0) // A.I giải trước cả khi người khác đang nhắm (G5)
    expect(b.d.dem('bi_a_diem_ban', '1=1')).toBe(0) // có A.I ⇒ không tính Điểm bàn
    expect(b.d.dem('bi_a_van', `id='${VAN}' AND trang_thai='xong'`)).toBe(1)
  }, 240_000)
})
