// @vitest-environment node
// ĐO GIÂY TỪNG CÂU QUA PHIẾU HTML — PHÍA MÁY CHỦ (thầy 20/10/2026, docs/dac-ta-muc-lam-bai-2010.md mục 4). Phần (d) của bộ test; phần phiếu / máy em ở
// tests/do-giay-phieu-2010.test.ts (môi trường jsdom, không nạp được node:sqlite).
//
// Chạy trên SQLite THẬT với lược đồ THẬT (tests/_d1-that.ts): giay + raw.doc vào sổ cho ba nguồn btvn · khac_phuc · btvn_lo. Máy em CHỈ gửi giây; kích thước
// đề (số từ, có hình, phần) do máy chủ tự đo từ câu nó vừa lấy để chấm. Thiếu doGiay (phiếu bản cũ) ⇒ sổ y như hôm nay, KHÔNG thêm lệnh D1 nào.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { nopKhacPhuc } from '../server/src/goi-cu'
import { cauKhoDangGoc, cauLuyenDangGoc, ganDoGiay } from '../server/src/btvn-nang-do-d1'
import { docDoGiayNhieu } from '../server/src/do-giay-luot'
import type { SuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, cauThay, dung, giao, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const NOP_LUC = '2026-09-20T02:00:00.000Z'
const HAN_XA = '2099-01-01T00:00:00.000Z'
/** Tờ kho khuôn THẬT (de / pa / y / hinh[{vi_tri}]) — số từ đếm tay: I-1 = 6 + 4 = 10 · II-1 = 7 + 4 + 5 + 5 + 7 = 28 · III-1 = 7 (+ hình trong đề) · III-2 = 4 (chỉ hình lời giải). */
const KHO = {
  ma_de: 'DE1',
  cau: [
    { phan: 'I', so: 1, de: 'Chất nào sau đây là ester?', pa: { A: 'CH3COOCH3', B: 'HCOOH', C: 'C2H5OH', D: 'CH3CHO' }, dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet' },
    { phan: 'II', so: 1, de: 'Xét các phát biểu về chất béo', y: { a: 'Chất béo là trieste', b: 'Chất béo nhẹ hơn nước', c: 'Chất béo tan trong nước', d: 'Chất béo có phản ứng thuỷ phân' }, dap_an: 'DSDS', chuyen_de: 'Lipid', muc_do: 'hieu' },
    { phan: 'III', so: 1, de: 'Tính khối lượng m (gam) của este', dap_an: '0.39', chuyen_de: 'Este', muc_do: 'van_dung', hinh: [{ tep: 'x.png', vi_tri: 'trong_de', du_lieu: 'AAA' }, { tep: 'y.png', vi_tri: 'sau_loi_giai', du_lieu: 'BBB' }] },
    { phan: 'III', so: 2, de: 'Tính số mol este', dap_an: '0.5', chuyen_de: 'Este', muc_do: 'biet', hinh: [{ tep: 'y.png', vi_tri: 'sau_loi_giai', du_lieu: 'BBB' }] },
  ],
}
const DAP_AN_BTVN = { 'DE1-I-1': 'A', 'DE1-II-1': 'DSDS', 'DE1-III-1': '0,39', 'DE1-III-2': '0,5' }
const DOC_DUNG = { 'DE1-I-1': { t: 10, h: 0, p: 'I' }, 'DE1-II-1': { t: 28, h: 0, p: 'II' }, 'DE1-III-1': { t: 7, h: 1, p: 'III' } }

function seedBtvn(d: D1That) {
  d.objects.set('kho/DE1.json', KHO)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run('B1', 'CA1', 'DE1', 4, NOP_LUC, HAN_XA, NOP_LUC)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run('B1|S1', 'B1', 'S1', 'Em Một')
}
type Dong = { qid: string; giay: number | null; raw_json: string | null; nguon: string; lan: number }
const so = (d: D1That, dk = '1=1') => (d.sql.prepare(`SELECT qid, giay, raw_json, nguon, lan FROM su_kien_hoc WHERE ${dk} ORDER BY qid`).all() as Dong[])
const docRaw = (x: Dong) => (x.raw_json ? JSON.parse(x.raw_json) : null)
/** Lời khai gian của máy em: số từ / hình / phần sai bét — máy chủ phải bỏ hết. */
const GIAY_GIAN = (g: number) => ({ g, t: 99999, h: 1, p: 'III' })

describe('(d) máy chủ: BTVN nộp qua phiếu (nopKhacPhuc → nopBtvnQuaPhieu, nguồn btvn)', () => {
  it('giay vào cột; raw.doc là kích thước đề do MÁY CHỦ đo (số từ, hình, phần), không theo lời máy em; câu không có giây giữ NULL', async () => {
    const d = taoD1That()
    seedBtvn(d)
    const r = await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, doGiay: { 'DE1-I-1': GIAY_GIAN(42), 'DE1-II-1': GIAY_GIAN(90), 'DE1-III-1': { g: 15 } } })
    expect(r.ok).toBe(true)
    const dong = so(d, "nguon='btvn'")
    expect(dong.map((x) => [x.qid, x.giay])).toEqual([['DE1-I-1', 42], ['DE1-II-1', 90], ['DE1-III-1', 15], ['DE1-III-2', null]])
    for (const x of dong.slice(0, 3)) expect(docRaw(x)).toEqual({ doc: DOC_DUNG[x.qid as keyof typeof DOC_DUNG] })
    expect(dong[3]!.raw_json).toBeNull()
  })

  it('KHÔNG có doGiay (phiếu bản cũ): sổ y như hôm nay — giay NULL, raw_json NULL, cùng số lệnh D1', async () => {
    const lan = async (doGiay?: unknown) => {
      const d = taoD1That()
      seedBtvn(d)
      const truoc = d.soLenh.prepare
      await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, ...(doGiay ? { doGiay } : {}) })
      return { d, p: d.soLenh.prepare - truoc }
    }
    const khong = await lan()
    const co = await lan({ 'DE1-I-1': { g: 5 } })
    expect(so(khong.d, "nguon='btvn'").every((x) => x.giay === null && x.raw_json === null)).toBe(true)
    expect(so(co.d, "nguon='btvn'").filter((x) => x.giay !== null).map((x) => x.qid)).toEqual(['DE1-I-1'])
    expect(co.p).toBe(khong.p) // không thêm lệnh D1 nào
  })

  it('giây hỏng (0, âm, > 900, không phải số) bị bỏ ⇒ NULL; cụm không phải đối tượng ⇒ như không có', async () => {
    const d = taoD1That()
    seedBtvn(d)
    await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, doGiay: { 'DE1-I-1': { g: 0 }, 'DE1-II-1': { g: 901 }, 'DE1-III-1': { g: 'abc' }, 'DE1-III-2': { g: 900 } } })
    expect(so(d, "nguon='btvn'").map((x) => [x.qid, x.giay])).toEqual([['DE1-I-1', null], ['DE1-II-1', null], ['DE1-III-1', null], ['DE1-III-2', 900]])
    const e = taoD1That()
    seedBtvn(e)
    await nopKhacPhuc(e.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, doGiay: 'x' })
    expect(so(e, "nguon='btvn'").every((x) => x.giay === null)).toBe(true)
  })

  it('làm lại (lượt 2) có giây riêng; gửi lại y hệt lượt cũ không ghi đè giây đã có', async () => {
    const d = taoD1That()
    seedBtvn(d)
    await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, doGiay: { 'DE1-I-1': { g: 30 } } })
    await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: DAP_AN_BTVN, doGiay: { 'DE1-I-1': { g: 77 } } }) // mất mạng gửi lại: daNhan
    expect(so(d, "nguon='btvn' AND qid='DE1-I-1'").map((x) => [x.lan, x.giay])).toEqual([[1, 30]])
    await nopKhacPhuc(d.env, { ma: 'B1', sbd: 'S1', dapAn: { ...DAP_AN_BTVN, 'DE1-I-1': 'B' }, doGiay: { 'DE1-I-1': { g: 11 } } })
    expect(so(d, "nguon='btvn' AND qid='DE1-I-1'").map((x) => [x.lan, x.giay])).toEqual([[1, 30], [2, 11]])
  })
})

describe('(d) máy chủ: phiếu khắc phục (nopKhacPhuc, nguồn khac_phuc)', () => {
  it('phiếu lưu trên R2 (khuôn CauLuyen): giay + raw.doc tự đo; đề chỉ có ảnh tính cỡ một đề trung bình (40 từ) và có hình', async () => {
    const d = taoD1That()
    d.objects.set('phieu/PH1.json', {
      maCa: 'CA1',
      phieu: {
        cau: [
          { id: 'DE1-I-1', phan: 'I', dapAn: 'A', chuyenDe: 'Este', mucDo: 'biet', text: 'Chất nào sau đây là ester?', luaChon: ['CH3COOCH3', 'HCOOH', 'C2H5OH', 'CH3CHO'] },
          { id: 'DE1-III-1', phan: 'III', dapAn: '0.39', chuyenDe: 'Este', mucDo: 'biet', text: '', anhThanCau: 'data:image/png;base64,AAA', luaChon: null },
        ],
      },
    })
    const r = await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'B', 'DE1-III-1': '0,39' }, doGiay: { 'DE1-I-1': GIAY_GIAN(33), 'DE1-III-1': { g: 61 } } })
    expect(r.ok).toBe(true)
    const dong = so(d, "nguon='khac_phuc'")
    expect(dong.map((x) => [x.qid, x.giay])).toEqual([['DE1-I-1', 33], ['DE1-III-1', 61]])
    expect(docRaw(dong[0]!)).toEqual({ doc: { t: 10, h: 0, p: 'I' } })
    expect(docRaw(dong[1]!)).toEqual({ doc: { t: 40, h: 1, p: 'III' } })
  })

  it('phiếu máy em tự sinh (sua_loi_*, không có phiếu trên R2): chấm bằng tờ kho, kích thước đề từ câu kho', async () => {
    const d = taoD1That()
    d.objects.set('kho/DE1.json', KHO)
    const r = await nopKhacPhuc(d.env, { ma: 'sua_loi_S1_1789794169079', sbd: 'S1', dapAn: { 'DE1-II-1': 'DSDS', 'DE1-III-1': '0,39' }, doGiay: { 'DE1-II-1': { g: 120 }, 'DE1-III-1': { g: 25 } } })
    expect(r.ok).toBe(true)
    const dong = so(d, "nguon='khac_phuc'")
    expect(dong.map((x) => [x.qid, x.giay])).toEqual([['DE1-II-1', 120], ['DE1-III-1', 25]])
    expect(docRaw(dong[0]!)).toEqual({ doc: DOC_DUNG['DE1-II-1'] })
    expect(docRaw(dong[1]!)).toEqual({ doc: DOC_DUNG['DE1-III-1'] })
  })

  it('không doGiay: sổ khắc phục y như cũ', async () => {
    const d = taoD1That()
    d.objects.set('kho/DE1.json', KHO)
    await nopKhacPhuc(d.env, { ma: 'sua_loi_S1_1789794169079', sbd: 'S1', dapAn: { 'DE1-II-1': 'DSDS' } })
    expect(so(d, "nguon='khac_phuc'").every((x) => x.giay === null && x.raw_json === null)).toBe(true)
  })
})

describe('(d) máy chủ: /btvn/xong-lo', () => {
  afterEach(() => vi.useRealTimers())
  const chang0 = (d: D1That) => boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
  const DOC_MAU = (q: string) => (/-II-/.test(q) ? { t: 6, h: 0, p: 'II' } : /-III-/.test(q) ? { t: 2, h: 1, p: 'III' } : { t: 6, h: 0, p: 'I' }) // tờ mẫu: "Câu I.n" + a/b/c/d · III có hình trong đề

  async function chuanBi() {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    return d
  }

  it('nộp CHẶNG bài cá nhân hoá (btvn_lo): giay + raw.doc; lời khai t/h/p của máy em bị bỏ', async () => {
    const d = await chuanBi()
    const qs = chang0(d)
    const dapAn = Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)]))
    const doGiay = Object.fromEntries(qs.map((q, i) => [q, i === 0 ? GIAY_GIAN(10) : { g: 10 + i }]))
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd: 'S1', chiSo: 0, dapAn, doGiay })
    expect(r.ok).toBe(true)
    const dong = so(d, "nguon='btvn_lo'")
    expect(dong.length).toBe(qs.length)
    for (const x of dong) {
      const i = qs.indexOf(x.qid)
      expect([x.qid, x.giay]).toEqual([x.qid, 10 + i])
      expect(docRaw(x)).toEqual({ doc: DOC_MAU(x.qid) })
    }
  })

  it('KHÔNG doGiay: sổ btvn_lo y như cũ (NULL) và SỐ LỆNH D1 bằng nhau (không thêm vòng chờ)', async () => {
    // Dựng D1 rồi gọi NGAY, lần lượt từng cái: `taoD1That` xoá đệm cấp mô-đun, nên mỗi lượt đo bắt đầu từ cùng một trạng thái nguội (dựng cả hai trước rồi
    // mới gọi thì lượt thứ hai hưởng đệm của lượt đầu và rẻ hơn vài lệnh — không liên quan tới doGiay).
    const lan = async (voiGiay: boolean) => {
      const d = await chuanBi()
      const qs = chang0(d)
      const truoc = { p: d.soLenh.prepare, b: d.soLenh.batch }
      await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd: 'S1', chiSo: 0, dapAn: Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])), ...(voiGiay ? { doGiay: Object.fromEntries(qs.map((q) => [q, { g: 20 }])) } : {}) })
      return { d, p: d.soLenh.prepare - truoc.p, b: d.soLenh.batch - truoc.b }
    }
    const khong = await lan(false)
    const co = await lan(true)
    expect(so(khong.d, "nguon='btvn_lo'").every((x) => x.giay === null && x.raw_json === null)).toBe(true)
    expect(so(co.d, "nguon='btvn_lo'").every((x) => x.giay === 20)).toBe(true)
    expect(co.p).toBe(khong.p)
    expect(co.b).toBe(khong.b)
  })

  it('nộp một phần chặng: chỉ câu mới nộp mang giây; lần nộp bù thêm câu còn lại có giây của nó, câu cũ giữ giây lần đầu', async () => {
    const d = await chuanBi()
    const qs = chang0(d)
    expect(qs.length).toBeGreaterThanOrEqual(2)
    const dau = qs.slice(0, Math.ceil(qs.length / 2))
    await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd: 'S1', chiSo: 0, dapAn: Object.fromEntries(dau.map((q) => [q, DAP_AN_DUNG(q)])), doGiay: Object.fromEntries(dau.map((q, i) => [q, { g: 31 + i }])) })
    expect(so(d, "nguon='btvn_lo'").map((x) => [x.qid, x.giay])).toEqual(dau.map((q, i) => [q, 31 + i]).sort())
    const con = qs.slice(dau.length)
    expect(con.length).toBeGreaterThanOrEqual(1)
    const r2 = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd: 'S1', chiSo: 0, dapAn: Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])), doGiay: { [con[0]!]: { g: 44 }, [dau[0]!]: { g: 999 } } })
    expect(r2.ok).toBe(true)
    const dong = so(d, "nguon='btvn_lo'")
    expect(dong.find((x) => x.qid === dau[0])!.giay).toBe(31) // đáp án + giây đầu thắng
    expect(dong.find((x) => x.qid === con[0])!.giay).toBe(44)
    expect(dong.filter((x) => con.slice(1).includes(x.qid)).every((x) => x.giay === null)).toBe(true)
  })

  it('nộp "thử sức thêm" (chặng ảo chiSo = soChang): giây vào sổ btvn_lo của câu đúng', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    d.sql.exec("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S2|DA-4','S2','DA-4',10,1,9,0,0,2,'x')")
    expect((await giao(d, { cau: cauThay().map((c) => (c.dang === 'DA-4' ? { ...c, mucDo: 2 } : c)) })).ok).toBe(true)
    await mo(d, 'S1')
    const emSo = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd='S1'").get() as { so_chang: number }).so_chang)
    gio('2026-09-29T02:00:00.000Z')
    for (let c = 0; c < emSo - 1; c++) {
      const qs = boCuaEm(d).filter((x) => x.chang === c).map((x) => x.qid)
      expect((await nopChang(d, c, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])))).ok).toBe(true)
    }
    const CAU_THU = 'DE1-III-1'
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd: 'S1', chiSo: emSo, dapAn: { [CAU_THU]: DAP_AN_DUNG(CAU_THU) }, doGiay: { [CAU_THU]: GIAY_GIAN(77) } })
    expect(r.ok).toBe(true)
    const x = so(d, `nguon='btvn_lo' AND qid='${CAU_THU}'`)[0]!
    expect(x.giay).toBe(77)
    expect(docRaw(x)).toEqual({ doc: { t: 2, h: 1, p: 'III' } })
  })

  it('đường "báo xong lô" CŨ có kèm đáp án (bài thường): chỉ ghi giây — không có câu trong tay thì KHÔNG có raw.doc, lời khai t/h/p bị bỏ', async () => {
    const d = taoD1That()
    seedBtvn(d)
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 1, dapAn: { 'DE1-I-1': 'A', 'DE1-II-1': 'DSDS' }, doGiay: { 'DE1-I-1': GIAY_GIAN(20), 'DE1-II-1': { g: 0, t: 5 } } })
    expect(r).toMatchObject({ ok: true, suKien: 2 })
    const dong = so(d, "nguon='btvn_lo'")
    expect(dong.map((x) => [x.qid, x.giay, x.raw_json])).toEqual([['DE1-I-1', 20, null], ['DE1-II-1', null, null]])
  })

  it('đường "báo xong lô" KHÔNG đáp án (KhungXemPhieu hiện gửi như vậy): không ghi sổ gì, như cũ', async () => {
    const d = taoD1That()
    seedBtvn(d)
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, doGiay: { 'DE1-I-1': { g: 20 } } })
    expect(r).toMatchObject({ ok: true, loDaXong: 1 })
    expect(d.dem('su_kien_hoc')).toBe(0)
  })
})

describe('(d) hàm thuần của máy chủ', () => {
  const sk = (qid: string, raw?: unknown): SuKien => ({ nguon: 'btvn', maNguon: 'B', sbd: 'S', qid, lan: 1, ketQua: 1, luc: NOP_LUC, ...(raw === undefined ? {} : { raw }) })

  it('ganDoGiay: không có cụm ⇒ trả đúng mảng đưa vào; có cụm ⇒ chỉ đổi câu có giây hợp lệ; raw cũ được giữ', () => {
    const ds = [sk('a'), sk('b', { ms: 9000 }), sk('c')]
    expect(ganDoGiay(ds, null)).toBe(ds)
    expect(ganDoGiay(ds, new Map())).toBe(ds)
    const m = docDoGiayNhieu({ doGiay: { a: { g: 12 }, b: { g: 30, t: 5 }, c: { g: 0, t: 8 } } })
    const cauGoc = new Map([['b', { phan: 'I', text: 'một hai ba', choices: ['x', 'y', 'z', 'w'] }]])
    const ra = ganDoGiay(ds, m, cauGoc)
    expect(ra[0]).toMatchObject({ qid: 'a', giay: 12 })
    expect(ra[0]).not.toHaveProperty('raw') // không có câu trong tay ⇒ chỉ giây
    expect(ra[1]).toMatchObject({ qid: 'b', giay: 30, raw: { ms: 9000, doc: { t: 7, h: 0, p: 'I' } } })
    expect(ra[2]).toBe(ds[2]) // giây 0 ⇒ bỏ cả cụm, lời khai t bị bỏ
  })

  it('cauKhoDangGoc / cauLuyenDangGoc: đổi khuôn kho / phiếu về khuôn đo từ; ảnh lời giải không phải đề', () => {
    expect(cauKhoDangGoc(KHO.cau[0] as never)).toMatchObject({ phan: 'I', text: 'Chất nào sau đây là ester?', choices: ['CH3COOCH3', 'HCOOH', 'C2H5OH', 'CH3CHO'], hinhAnh: [] })
    expect(cauKhoDangGoc(KHO.cau[2] as never).hinhAnh).toHaveLength(1)
    expect(cauKhoDangGoc(KHO.cau[3] as never).hinhAnh).toEqual([])
    expect(cauLuyenDangGoc({ phan: 'II', text: 'đề', luaChon: ['a', 'b', 'c', 'd'], anhLuaChon: [null, 'x', null, null], hinh: [{ viTri: 'sau_loi_giai' }, { viTri: 'trong_de' }] } as never)).toMatchObject({
      phan: 'II',
      ideas: ['a', 'b', 'c', 'd'],
      ideaImgs: [null, 'x', null, null],
      hinhAnh: [{ viTri: 'trong_de' }],
    })
    expect(cauLuyenDangGoc({ phan: 'III', text: 'đề', luaChon: null } as never)).not.toHaveProperty('choices')
  })
})
