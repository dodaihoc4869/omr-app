// @vitest-environment node
// BI-A PHẢN ỨNG GĐ2 · LÕI TRẬN ONLINE (src/game/bi-a/tran.ts) — phòng đấu là quyền quyết, máy em vẽ trước bằng cùng bước chuẩn.
// Nghiệm thu (đặc tả §12 "GĐ2 thêm"): 2 máy đánh hết 1 ván, băm trùng sau mỗi cú; câu sai đổi lượt ngay; Điểm bàn đúng Elo K = 24.
import { describe, expect, it } from 'vitest'
import {
  apCau, apCu, apGheAi, apGiaiTruoc, apHan, apRoi, aiDung, bamTran, bamVi, banTu, ballsTu, buocChuan, congKhai, doiElo, randHat, taoTran,
  type DauVaoGhe, type TranBia,
} from '../src/game/bi-a/tran'
import { aiTinh, aiDatBi } from '../src/game/bi-a/ai'
import { biCuaGhe, chiaBi } from '../src/game/bi-a/luat'
import { suKienMoi, tocDo, danhBiV, type Ban } from '../src/game/bi-a/vat-ly'
import type { KiHieu } from '../src/game/bi-a/nguyen-to'

const T0 = 1_790_000_000_000
const nguoi = (ten: string, sbd: string, cheDo: 'don' | 'doi', ghe: number, muc = 'TH'): DauVaoGhe => {
  const bi: DauVaoGhe['bi'] = {}
  for (const id of biCuaGhe(chiaBi(cheDo), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc, giay: 90 }
  return { ten, ai: false, sbd, bi, chot: { qid: `chot-${sbd}`, muc: 'VD', giay: 180 } }
}
const may = (ten: string): DauVaoGhe => ({ ten, ai: true, sbd: null, bi: {}, chot: null })
const sao = (t: TranBia): TranBia => JSON.parse(JSON.stringify(t)) as TranBia

/** Máy em vẽ trước một cú: đúng cách màn chơi làm — mỗi khung ≤ 24 bước, mỗi bước là `buocChuan`. */
function mayVeTruoc(balls: TranBia['balls'], cu: { dx: number; dy: number; v: number; sx: number; sy: number; datBi?: { x: number; y: number } }): TranBia['balls'] {
  const st: Ban = banTu(balls)
  const c = st.balls.find((b) => b.id === 'cue')!
  if (cu.datBi) { c.x = cu.datBi.x; c.y = cu.datBi.y }
  const d = Math.hypot(cu.dx, cu.dy)
  danhBiV(c, cu.dx / d, cu.dy / d, cu.v, cu.sx, cu.sy)
  const ev = suKienMoi()
  let xong = false
  for (let khung = 0; khung < 3000 && !xong; khung++) for (let k = 0; k < 24 && !xong; k++) xong = buocChuan(st, ev, null)
  return ballsTu(st)
}
/** Cú của ghế hiện tại theo A.I (thay người bấm), có đặt bi cái khi được. */
function cuCua(t: TranBia, rand: () => number) {
  const st = banTu(t.balls), doi = t.ghe[t.cur]!.doi
  let datBi: { x: number; y: number } | undefined
  if (t.ballInHand) { aiDatBi(st, doi, t.bi, t.isBreak, rand); const c = st.balls.find((b) => b.id === 'cue')!; datBi = { x: c.x, y: c.y } }
  const k = aiTinh(st, doi, t.bi, t.isBreak, { x: 0, y: -1 }, rand)
  return { dx: k.aim.x, dy: k.aim.y, v: tocDo(k.p), sx: 0, sy: 0, ...(datBi ? { datBi } : {}) }
}

describe('Lõi trận online — phòng quyết, hai máy vẽ trước', () => {
  it('đấu đơn 2 người: đánh HẾT một ván, sau MỖI cú băm của 2 máy trùng băm phòng; có người thắng; điểm ván khớp', () => {
    let t = taoTran({ van: 'van-thu-1', cheDo: 'don', loai: 'ban', ghe: [nguoi('Khánh Linh', 'S1', 'don', 0), nguoi('Minh Châu', 'S2', 'don', 1)], now: T0 })
    const rand = randHat('kich-ban'), tl = randHat('tra-loi')
    let soCu = 0, now = T0
    for (let vong = 0; vong < 600 && !t.over; vong++) {
      now += 5000
      if (t.cho.length) { const c = t.cho[0]!; t = sao(t); apCau(t, c.ghe, c.ki, tl() < 0.75, now); continue }
      const cu = cuCua(t, rand)
      const may1 = mayVeTruoc(t.balls, cu), may2 = mayVeTruoc(t.balls, cu)
      const t2 = sao(t)
      const e = apCu(t2, t2.cur, cu, now)
      soCu++
      // máy vẽ trước (khung 24 bước) trùng tuyệt đối với phòng (chạy liền) lúc bi vừa dừng, trước khi áp luật
      expect(e.k === 'cu' && e.bamVa).toBe(bamVi(may1))
      expect(may2).toEqual(may1)
      // bi đặt lại chân bàn / bi cái đầu bàn là quyết định của phòng: máy lấy trạng thái phòng
      t = t2
    }
    expect(t.over).not.toBeNull()
    expect(t.over!.doiThang === 0 || t.over!.doiThang === 1).toBe(true)
    expect(soCu).toBeGreaterThan(5)
    const an = t.tk.reduce((s, x) => s + x.an, 0)
    expect(an).toBeGreaterThan(0)
    expect(t.diem[t.over!.doiThang!]).toBeGreaterThan(0)
  })

  it('câu SAI ⇒ lượt sang NGAY, bi đó và bi còn chờ về chân bàn; câu ĐÚNG ⇒ ăn bi, +điểm, +1 Mắt thần, đánh tiếp', () => {
    const t = taoTran({ van: 'v2', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0, 'NB'), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    t.isBreak = false
    t.cho = [{ ghe: 0, ki: 'Na', loai: 'bi', han: T0 + 99_000 }, { ghe: 0, ki: 'Mg', loai: 'bi', han: 0 }]
    t.ctx = { p: 0, kq: { maLoi: null, loi: null, datLai: [], datBiCai: false, anNgay: [], hang: [], thangNgay: false, cuaBan: [] }, ketQua: [] }
    t.balls = t.balls.map((b) => (b[0] === 'Na' || b[0] === 'Mg' ? [b[0], b[1], b[2], 0] : b))
    const a = sao(t)
    apCau(a, 0, 'Na', true, T0)
    expect(a.bi.Na.an).toBe(true); expect(a.diem[0]).toBe(10); expect(a.matThan[0]).toBe(1); expect(a.cho[0]!.ki).toBe('Mg'); expect(a.cur).toBe(0)
    apCau(a, 0, 'Mg', true, T0)
    expect(a.cho).toEqual([]); expect(a.cur).toBe(0) // ăn hết bi trong cú ⇒ đánh tiếp
    const b = sao(t)
    apCau(b, 0, 'Na', false, T0)
    expect(b.cur).toBe(1) // sang lượt NGAY
    expect(b.cho).toEqual([])
    expect(b.balls.find((x) => x[0] === 'Na')![3]).toBe(1) // Na về bàn
    expect(b.balls.find((x) => x[0] === 'Mg')![3]).toBe(1) // Mg còn chờ cũng về bàn, không mở câu
    expect(b.bi.Mg.an).toBe(false); expect(b.tk[0]!.sai).toBe(1)
    expect(() => apCau(sao(t), 1, 'Na', true, T0)).toThrow(/không phải câu đang chờ/)
  })

  it('phạm luật (bi cái rơi / không chạm bi) ⇒ người kế tiếp được đặt bi cái; đặt chỗ đè bi ⇒ phòng từ chối', () => {
    const t = taoTran({ van: 'v3', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    t.isBreak = false
    const a = sao(t)
    const e = apCu(a, 0, { dx: 0, dy: 1, v: 400, sx: 0, sy: 0 }, T0) // đánh ra xa khỏi dàn bi ⇒ không chạm bi nào
    expect(e.k === 'cu' && e.kq.maLoi).toBe('P2')
    expect(a.cur).toBe(1); expect(a.ballInHand).toBe(true)
    const na = a.balls.find((b) => b[0] === 'Na')!
    expect(() => apCu(sao(a), 1, { dx: 0, dy: -1, v: 800, sx: 0, sy: 0, datBi: { x: na[1], y: na[2] } }, T0)).toThrow(/đặt bi cái/)
    expect(() => apCu(sao(a), 0, { dx: 0, dy: -1, v: 800, sx: 0, sy: 0 }, T0)).toThrow(/Chưa tới lượt/)
  })

  it('hạn: 30 giây (+2 giây trễ mạng) không đánh ⇒ sang lượt; câu quá giờ + 10 giây ⇒ tính sai', () => {
    const t = taoTran({ van: 'v4', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    expect(apHan(t, T0 + 31_000)).toBeNull()
    expect(apHan(t, T0 + 32_000)).toEqual({ k: 'het_gio', ghe: 0 })
    expect(t.cur).toBe(1)
    t.cho = [{ ghe: 1, ki: 'N', loai: 'bi', han: T0 + 50_000 }]
    t.ctx = { p: 1, kq: { maLoi: null, loi: null, datLai: [], datBiCai: false, anNgay: [], hang: [], thangNgay: false, cuaBan: [] }, ketQua: [] }
    const e = apHan(t, T0 + 50_000)
    expect(e).toMatchObject({ k: 'cau', ghe: 1, ki: 'N', dung: false, hetGio: true })
    expect(t.cur).toBe(0)
  })

  it('giải trước: chỉ bi của mình, lúc người khác đang nhắm; đúng ⇒ bi vàng', () => {
    const t = taoTran({ van: 'v5', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    expect(() => apGiaiTruoc(sao(t), 0, 'Na', true)).toThrow(/người khác đang nhắm/)
    expect(() => apGiaiTruoc(sao(t), 1, 'Na', true)).toThrow(/không giải trước/)
    apGiaiTruoc(t, 1, 'N', true)
    expect(t.bi.N.vang).toBe(true); expect(t.tk[1]).toMatchObject({ dung: 1, vang: 1 })
  })

  it('rớt mạng / bỏ ván: đấu đơn ⇒ người còn lại thắng; đánh đôi ⇒ ghế chuyển A.I, ván thôi tính Điểm bàn (G14)', () => {
    const d = taoTran({ van: 'v6', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    apRoi(d, 1, 'roi_mang')
    expect(d.over).toEqual({ doiThang: 0, nguoiHa: null, lyDo: 'roi_mang' })
    const q = taoTran({ van: 'v7', cheDo: 'doi', loai: 'ban', ghe: [nguoi('An', 'S1', 'doi', 0), nguoi('Bình', 'S2', 'doi', 1), nguoi('Chi', 'S3', 'doi', 2), nguoi('Dũng', 'S4', 'doi', 3)], now: T0 })
    expect(q.khongElo).toBe(false)
    apRoi(q, 2, 'roi_mang')
    expect(q.over).toBeNull()
    expect(q.ghe[2]).toMatchObject({ ai: true, sbd: 'S3' })
    expect(q.khongElo).toBe(true)
    const biChi = biCuaGhe(q.bi, 2)
    for (const id of biChi) { expect(q.cau[id as KiHieu]).toBeUndefined(); expect(q.muc[id as KiHieu]).toBeTruthy() }
    expect(typeof aiDung(q, biChi[0]!, 'bi', randHat('x'))).toBe('boolean')
    // bàn có A.I từ đầu thì không tính Điểm bàn
    expect(taoTran({ van: 'v8', cheDo: 'doi', loai: 'ban', ghe: [nguoi('An', 'S1', 'doi', 0), may('A.I 2'), nguoi('Chi', 'S3', 'doi', 2), may('A.I 4')], now: T0 }).khongElo).toBe(true)
    apGheAi(q, 3, 'bo')
    expect(q.ghe.filter((g) => g.ai)).toHaveLength(2)
  })

  it('Bàn giao hữu với bạn: mọi bi là bi trống, không Câu chốt, không Điểm bàn', () => {
    const t = taoTran({ van: 'v9', cheDo: 'don', loai: 'giao_huu', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    expect([...Object.values(t.bi)].filter((s) => s.chu >= 0).every((s) => s.trong)).toBe(true)
    expect(t.chot).toEqual([null, null]); expect(t.khongElo).toBe(true); expect(t.cau).toEqual({})
  })

  it('trạng thái gửi mọi máy không có mã câu; có băm; cùng mã ván ⇒ cùng bàn xếp', () => {
    const t = taoTran({ van: 'v10', cheDo: 'don', loai: 'ban', ghe: [nguoi('An', 'S1', 'don', 0), nguoi('Bình', 'S2', 'don', 1)], now: T0 })
    const ck = congKhai(t, T0 + 1000)
    const s = JSON.stringify(ck)
    expect(s).not.toMatch(/q-S1|chot-S1|qid/)
    expect(ck.bam).toBe(bamTran(t)); expect(ck.conCuMs).toBe(31_000); expect(ck.chotCo).toEqual([true, true])
    expect(taoTran({ van: 'v10', cheDo: 'don', loai: 'ban', ghe: [nguoi('X', 'S9', 'don', 0), nguoi('Y', 'S8', 'don', 1)], now: T0 }).balls).toEqual(t.balls)
  })

  it('Điểm bàn Elo K = 24, khởi đầu 1000: ngang điểm thắng +12; mạnh hơn thắng được ít hơn; đội tính theo trung bình', () => {
    expect(doiElo([1000], [1000], 0)).toEqual([12, -12])
    expect(doiElo([1000], [1000], 1)).toEqual([-12, 12])
    const [d] = doiElo([1200], [1000], 0)
    expect(d).toBe(Math.round(24 * (1 - 1 / (1 + Math.pow(10, -200 / 400)))))
    expect(d).toBeLessThan(12)
    expect(doiElo([1100, 900], [1000, 1000], 1)).toEqual([-12, 12])
  })
})
