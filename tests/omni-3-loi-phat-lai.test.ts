// @vitest-environment node
// OMNI 3 · GĐ A — PHÁT LẠI TẤT ĐỊNH sổ một em (omni-p-vkn `phatLaiEm`): mọi luật của hợp đồng + cùng tập sự kiện mọi thứ tự ⇒ deep-equal.
import { describe, expect, it } from 'vitest'
import { PHIEN_BAN_OMNI, THAM_SO_OMNI, type QCau, type SuKienOmni, type XacNhanThay } from '../server/src/omni-kieu'
import { capNhatHoi, phatLaiEm, MS_SAU_DOC_LOI_GIAI, type DauVaoPhatLai } from '../server/src/omni-p-vkn'
import { buocSprt, nguongSprt } from '../server/src/omni-sprt'
import { uocTau } from '../server/src/omni-toc-do'
import { msVn, mulberry32, sk } from './omni-3-loi-chung'

const ts = THAM_SO_OMNI
const P0 = ts.P0
const HOM_NAY = '2026-10-05'
const qc = (qid: string, vkn: string[], them: Partial<QCau> = {}): QCau => ({ qid, phan: 'I', maDang: 'D', mucDo: null, vkn, nguon: 'thay', ...them })
const mapQ = (...ds: QCau[]): Map<string, QCau> => new Map(ds.map((q) => [q.qid, q]))
const chay = (suKien: SuKienOmni[], q: Map<string, QCau>, them: Partial<DauVaoPhatLai> = {}) => phatLaiEm('T1', { suKien, q, homNay: HOM_NAY, ...them })
const sEmCua = (nSai: number, nVung: number): number => (nSai + ts.S0 * ts.S_AO) / (nVung + ts.S_AO)
const DUNG_I = Math.log(ts.SPRT.p1 / ts.SPRT.p0)
const DUNG_Y = Math.log(ts.SPRT.p1Y / ts.SPRT.p0)

describe('phatLaiEm — khởi đầu và một quan sát', () => {
  it('sổ rỗng ⇒ hồ sơ prior: sơ ý S0, không vi kỹ năng, con trỏ rỗng', () => {
    expect(chay([], new Map())).toEqual({
      sbd: 'T1', vkn: {}, sEm: ts.S0, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0,
      khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } },
      luotHomNay: 0, cursor: '', phienBan: PHIEN_BAN_OMNI,
    })
  })
  it('một lượt đúng Phần I cần 2 vi kỹ năng ⇒ đúng capNhatHoi(G.I, S0, T) + đếm + SPRT', () => {
    const e = sk('q1')
    const hs = chay([e], mapQ(qc('q1', ['a', 'b'])))
    const ky = capNhatHoi({ a: P0, b: P0 }, ['a', 'b'], true, ts.G.I, ts.S0, ts.T)
    expect(hs.vkn.a!.p).toBe(ky.a)
    expect(hs.vkn.b!.p).toBe(ky.b)
    expect(hs.vkn.a).toMatchObject({ vkn: 'a', nTuLam: 1, nCau: 1, nNgay: 1, nTroiChay: 0, nCauLaDung: 0, trangThai: 'chua_du', ngayCuoi: HOM_NAY, dayLai: false })
    expect(hs.vkn.a!.diemSprt).toBeCloseTo(DUNG_I, 12)
    expect(hs.cursor).toBe(`${e.receivedAt}|${e.khoa}`)
    expect(Object.keys(hs.vkn)).toEqual(['a', 'b'])
  })
  it('Phần III dùng G.III; prior `p0` theo vi kỹ năng được dùng và có mặt trong hồ sơ dù chưa làm', () => {
    const hs = chay([sk('q1', { phan: 'III', ketQua: 0 })], mapQ(qc('q1', ['a'], { phan: 'III' })), { p0: new Map([['a', 0.6], ['z', 0.7]]) })
    expect(hs.vkn.a!.p).toBe(capNhatHoi({ a: 0.6 }, ['a'], false, ts.G.III, ts.S0, ts.T).a)
    expect(hs.vkn.z).toMatchObject({ p: 0.7, nTuLam: 0, trangThai: 'chua_du', ngayCuoi: null })
  })
})

describe('phatLaiEm — lượt nào là quan sát', () => {
  it('bỏ: đọc lời giải, lướt, bỏ trống, có hỗ trợ, hỗ trợ không rõ — không đụng vi kỹ năng', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['b']), qc('q3', ['c']), qc('q4', ['d']), qc('q5', ['e']))
    const hs = chay([
      sk('q1', { purpose: 'xem_loi_giai', ketQua: 0, assistance: 'assisted' }),
      sk('q2', { purpose: 'luot', ketQua: null }),
      sk('q3', { ketQua: null }),
      sk('q4', { assistance: 'assisted' }),
      sk('q5', { assistance: 'unknown' }),
    ], q)
    expect(hs.vkn).toEqual({})
    expect(hs.sEm).toBe(ts.S0)
  })
  it('MỘT quan sát / câu / ngày: sai rồi làm lại đúng cùng ngày ⇒ chỉ tính lần sai; ngày sau tính tiếp', () => {
    const q = mapQ(qc('q1', ['a']))
    const hs = chay([sk('q1', { ketQua: 0, gio: 9 }), sk('q1', { ketQua: 1, gio: 15 }), sk('q1', { ketQua: 1, ngayVn: '2026-10-06', gio: 9 })], q)
    const p1 = capNhatHoi({ a: P0 }, ['a'], false, ts.G.I, ts.S0, ts.T)
    const p2 = capNhatHoi(p1, ['a'], true, ts.G.I, ts.S0, ts.T)
    expect(hs.vkn.a!.p).toBe(p2.a)
    expect(hs.vkn.a).toMatchObject({ nTuLam: 2, nNgay: 2, nCau: 1, ngayCuoi: '2026-10-06' })
  })
  it('lượt đầu ngày là có hỗ trợ / bỏ trống / lướt ⇒ ngày đó không có quan sát của câu (lượt sau trong ngày không độc lập)', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['b']), qc('q3', ['c']))
    const hs = chay([
      sk('q1', { assistance: 'assisted', gio: 9 }), sk('q1', { gio: 11 }),
      sk('q2', { ketQua: null, gio: 9 }), sk('q2', { gio: 11 }),
      sk('q3', { purpose: 'luot', ketQua: null, gio: 9 }), sk('q3', { gio: 11 }),
      sk('q1', { ngayVn: '2026-10-06', gio: 11 }),
    ], q)
    expect(hs.vkn.b).toBeUndefined()
    expect(hs.vkn.c).toBeUndefined()
    expect(hs.vkn.a).toMatchObject({ nTuLam: 1, ngayCuoi: '2026-10-06' })
  })
  it('lượt trong 12 giờ sau khi đọc lời giải của chính câu ấy không độc lập (kể cả qua nửa đêm); sau 12 giờ thì tính', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['b']))
    const xem = sk('q1', { purpose: 'xem_loi_giai', ketQua: 0, assistance: 'assisted', ngayVn: '2026-10-05', gio: 22 })
    const lam = sk('q1', { ngayVn: '2026-10-06', gio: 8 })
    const hs = chay([xem, lam, sk('q2', { purpose: 'xem_loi_giai', ketQua: 0, assistance: 'assisted', ngayVn: '2026-10-05', gio: 7 }), sk('q2', { ngayVn: '2026-10-06', gio: 8 })], q)
    expect(lam.receivedAt - xem.receivedAt).toBeLessThanOrEqual(MS_SAU_DOC_LOI_GIAI)
    expect(hs.vkn.a).toBeUndefined()
    expect(hs.vkn.b).toMatchObject({ nTuLam: 1 })
  })
  it('song sinh dùng qid gốc: câu gốc và song sinh cùng ngày là MỘT câu', () => {
    const q = mapQ(qc('q1', ['a']))
    const hs = chay([sk('q1', { ketQua: 0, gio: 9 }), sk('q1', { songSinh: true, ketQua: 1, gio: 10 })], q)
    expect(hs.vkn.a).toMatchObject({ nTuLam: 1 })
    expect(hs.vkn.a!.p).toBe(capNhatHoi({ a: P0 }, ['a'], false, ts.G.I, ts.S0, ts.T).a)
  })
  it('câu không có Q ⇒ không bịa vi kỹ năng (vẫn tính khung giờ); sự kiện của SBD khác bị bỏ', () => {
    const hs = chay([sk('khong-co-q', { ketQua: 0, tuTin: 'chac' }), sk('q1', { sbd: 'T2' })], mapQ(qc('q1', ['a'])))
    expect(hs.vkn).toEqual({})
    expect(hs.khungGio.truoc18).toEqual({ n: 1, soY: 1 })
  })
})

describe('phatLaiEm — Phần II theo ý', () => {
  const cauII = qc('d1', ['a', 'b', 'c'], { phan: 'II', vknY: [['a'], ['b'], ['c'], ['a']] })
  it('có kết quả từng ý ⇒ mỗi ý một quan sát trên vknY[i] với G.Y (tuần tự); ý null bỏ qua', () => {
    const hs = chay([sk('d1', { phan: 'II', ketQua: 0, y: [1, 1, 0, null] })], mapQ(cauII))
    let P: Record<string, number> = { a: P0, b: P0, c: P0 }
    P = capNhatHoi(P, ['a'], true, ts.G.Y, ts.S0, ts.T)
    P = capNhatHoi(P, ['b'], true, ts.G.Y, ts.S0, ts.T)
    P = capNhatHoi(P, ['c'], false, ts.G.Y, ts.S0, ts.T)
    expect(hs.vkn.a!.p).toBe(P.a)
    expect(hs.vkn.b!.p).toBe(P.b)
    expect(hs.vkn.c!.p).toBe(P.c)
    expect(hs.vkn.a).toMatchObject({ nTuLam: 1 })
    expect(hs.vkn.a!.diemSprt).toBeCloseTo(DUNG_Y, 12)
    expect(hs.vkn.c!.diemSprt).toBeCloseTo(Math.log((1 - ts.SPRT.p1Y) / (1 - ts.SPRT.p0)), 12)
  })
  it('một vi kỹ năng ở hai ý ⇒ hai quan sát (SPRT ý cộng hai lần)', () => {
    const hs = chay([sk('d1', { phan: 'II', ketQua: 1, y: [1, 1, 1, 1] })], mapQ(cauII))
    expect(hs.vkn.a).toMatchObject({ nTuLam: 2, nCau: 1, nNgay: 1 })
    expect(hs.vkn.a!.diemSprt).toBeCloseTo(2 * DUNG_Y, 12)
  })
  it('không có kết quả từng ý ⇒ một quan sát cả câu trên vkn với G.II_CA_CAU', () => {
    const hs = chay([sk('d1', { phan: 'II', ketQua: 1 })], mapQ(cauII))
    const ky = capNhatHoi({ a: P0, b: P0, c: P0 }, ['a', 'b', 'c'], true, ts.G.II_CA_CAU, ts.S0, ts.T)
    expect(hs.vkn.b!.p).toBe(ky.b)
    expect(hs.vkn.a!.diemSprt).toBeCloseTo(DUNG_I, 12)
    const hs2 = chay([sk('d1', { phan: 'II', ketQua: 1, y: [null, null, null, null] })], mapQ(cauII))
    expect(hs2.vkn).toEqual(hs.vkn)
  })
})

describe('phatLaiEm — sơ ý riêng (lượt vững), tự tin', () => {
  const p0 = new Map([['a', 0.95], ['b', 0.95]])
  it('lượt vững: mọi vi kỹ năng ≥ 0,9 TRƯỚC lượt ⇒ nVung; sai ⇒ nSaiVung; sEm tính lại ngay và dùng cho chính lần cập nhật ấy', () => {
    const q = mapQ(qc('q1', ['a', 'b']), qc('q2', ['a', 'b']))
    const hs = chay([sk('q1', { ketQua: 1, gio: 9 }), sk('q2', { ketQua: 0, gio: 10 })], q, { p0 })
    expect(hs.nVung).toBe(2)
    expect(hs.nSaiVung).toBe(1)
    expect(hs.sEm).toBeCloseTo(sEmCua(1, 2), 12)
    const p1 = capNhatHoi({ a: 0.95, b: 0.95 }, ['a', 'b'], true, ts.G.I, sEmCua(0, 1), ts.T)
    const p2 = capNhatHoi(p1, ['a', 'b'], false, ts.G.I, sEmCua(1, 2), ts.T)
    expect(hs.vkn.a!.p).toBe(p2.a)
  })
  it('chắc mà sai ở câu vững ⇒ nhân đôi trọng số (nVung + 2, nSaiVung + 2); tuTin vắng ⇒ không nhân đôi', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['b']))
    const hs = chay([sk('q1', { ketQua: 0, tuTin: 'chac', gio: 9 }), sk('q2', { ketQua: 0, gio: 10 })], q, { p0 })
    expect(hs.nVung).toBe(3)
    expect(hs.nSaiVung).toBe(3)
    expect(hs.sEm).toBeCloseTo(sEmCua(3, 3), 12)
    expect(hs.sEm).toBeLessThanOrEqual(1)
  })
  it('chưa vững (P < 0,9) ⇒ không đo sơ ý', () => {
    const hs = chay([sk('q1', { ketQua: 0, tuTin: 'chac' })], mapQ(qc('q1', ['a'])))
    expect(hs.nVung).toBe(0)
    expect(hs.sEm).toBe(ts.S0)
  })
  it('đúng mà "Chưa chắc" ⇒ G × 2 (kẹp ≤ 0,5) trong cập nhật, KHÔNG cộng SPRT / trôi chảy', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['b'], { phan: 'II' }))
    const hs = chay([sk('q1', { tuTin: 'chua_chac', nhanTocDo: 'troi_chay' }), sk('q2', { phan: 'II', y: [1, 1, 1, 1], tuTin: 'chua_chac' })], q)
    expect(hs.vkn.a!.p).toBe(capNhatHoi({ a: P0 }, ['a'], true, 0.5, ts.S0, ts.T).a)
    expect(hs.vkn.a!.diemSprt).toBe(0)
    expect(hs.vkn.a!.nTroiChay).toBe(0)
    let P: Record<string, number> = { b: P0 }
    for (let i = 0; i < 4; i++) P = capNhatHoi(P, ['b'], true, 0.5, ts.S0, ts.T)
    expect(hs.vkn.b!.p).toBe(P.b)
    const sai = chay([sk('q1', { ketQua: 0, tuTin: 'chua_chac' })], q)
    expect(sai.vkn.a!.p).toBe(capNhatHoi({ a: P0 }, ['a'], false, ts.G.I, ts.S0, ts.T).a)
    expect(sai.vkn.a!.diemSprt).toBeCloseTo(Math.log(0.1 / 0.3), 12)
  })
})

describe('phatLaiEm — bằng chứng "vững": trôi chảy, câu khác nhau, ngày, câu lạ bài khác, SPRT', () => {
  it('nTroiChay đếm lượt đúng có nhãn trôi chảy; nCau đếm content_group khác nhau (thiếu ⇒ qid)', () => {
    const q = mapQ(qc('q1', ['a'], { contentGroup: 'g1' }), qc('q2', ['a'], { contentGroup: 'g1' }), qc('q3', ['a']))
    const hs = chay([
      sk('q1', { nhanTocDo: 'troi_chay', gio: 9 }),
      sk('q2', { nhanTocDo: 'troi_chay', gio: 10 }),
      sk('q3', { nhanTocDo: 'cham', gio: 11 }),
      sk('q3', { ketQua: 0, nhanTocDo: 'troi_chay', ngayVn: '2026-10-06' }),
    ], q)
    expect(hs.vkn.a).toMatchObject({ nTroiChay: 2, nCau: 2, nNgay: 2, nTuLam: 4 })
  })
  it('nCauLaDung: câu CHƯA GẶP thuộc bài khác bài đa số, làm đúng ngay lần đầu', () => {
    const q = mapQ(qc('b1a', ['a']), qc('b1b', ['a']), qc('b2a', ['a']), qc('b2b', ['a']), qc('b2c', ['a']), qc('b1c', ['a']), qc('b3a', ['a']))
    const bai = new Map([['b1a', 'B1'], ['b1b', 'B1'], ['b1c', 'B1'], ['b2a', 'B2'], ['b2b', 'B2'], ['b2c', 'B2'], ['b3a', 'B3']])
    const hs = chay([
      sk('b1a', { gio: 8 }),                       // câu đầu tiên: chưa có "đa số" ⇒ không tính
      sk('b1b', { gio: 9 }),                       // cùng bài đa số ⇒ không
      sk('b2a', { gio: 10 }),                      // bài khác, chưa gặp, đúng ⇒ +1
      sk('b2b', { purpose: 'xem_loi_giai', ketQua: 0, assistance: 'assisted', ngayVn: '2026-10-01' }), // đã gặp (đọc lời giải từ trước)
      sk('b2b', { gio: 11 }),                      // đã gặp ⇒ không
      sk('b1c', { gio: 12 }),                      // B1 2 câu = B2 2 câu: hoà ở mức cao nhất ⇒ không phải "bài khác"
      sk('b2c', { ketQua: 0, gio: 13 }),           // sai ⇒ không
      sk('b3a', { gio: 14, tuTin: 'chua_chac' }),  // đoán ⇒ không
    ], q, { baiCuaQid: bai })
    expect(hs.vkn.a!.nCauLaDung).toBe(1)
  })
  it('bài lấy từ khoaBai của sự kiện / Q khi baiCuaQid vắng', () => {
    const q = mapQ(qc('x1', ['a'], { khoaBai: 'B1' }), qc('x2', ['a']))
    const hs = chay([sk('x1', { gio: 8 }), sk('x2', { gio: 9, khoaBai: 'B2' })], q)
    expect(hs.vkn.a!.nCauLaDung).toBe(1)
  })
  it('SPRT theo vi kỹ năng: 9 câu đúng (mỗi câu một quan sát) ⇒ vững; sai liền không xuống dưới ngưỡng dưới', () => {
    const qs = Array.from({ length: 9 }, (_, i) => qc(`v${i}`, ['a']))
    const hs = chay(qs.map((q, i) => sk(q.qid, { gio: 8 + i })), mapQ(...qs))
    expect(hs.vkn.a!.trangThai).toBe('vung')
    expect(hs.vkn.a!.diemSprt).toBeCloseTo(9 * DUNG_I, 10)
    const sai = chay(qs.slice(0, 4).map((q, i) => sk(q.qid, { gio: 8 + i, ketQua: 0 })), mapQ(...qs))
    expect(sai.vkn.a!.trangThai).toBe('chua_vung')
    expect(sai.vkn.a!.diemSprt).toBe(nguongSprt().duoi)
    const hoi = chay([...qs.slice(0, 4).map((q, i) => sk(q.qid, { gio: 8 + i, ketQua: 0 })), sk('v5', { gio: 14 })], mapQ(...qs))
    expect(hoi.vkn.a!.trangThai).toBe('chua_du')
    expect(hoi.vkn.a!.diemSprt).toBeCloseTo(buocSprt(nguongSprt().duoi, true, false), 12)
  })
})

describe('phatLaiEm — thầy xác nhận dạng', () => {
  const q = mapQ(qc('q1', ['D#1', 'D#2']), qc('q2', ['D#2', 'E#1']), qc('q3', ['E#1'], { maDang: 'E' }), qc('q4', ['tu_dat'], { maDang: 'D' }))
  const xn = (ket: XacNhanThay['ket'], luc: string, maDang = 'D'): XacNhanThay => ({ sbd: 'T1', maDang, ket, luc })
  it("'vung' ⇒ P = 0,95 cho mọi vi kỹ năng của dạng (không đụng vi kỹ năng dạng khác), SPRT ≥ ngưỡng trên", () => {
    const e = sk('q2', { ketQua: 0, gio: 9 })
    const hs = chay([e], q, { xacNhan: [xn('vung', new Date(msVn(HOM_NAY, 10)).toISOString())] })
    for (const k of ['D#1', 'D#2', 'tu_dat']) {
      expect(hs.vkn[k]!.p).toBe(ts.XAC_NHAN.vung)
      expect(hs.vkn[k]!.trangThai).toBe('vung')
    }
    expect(hs.vkn['D#2']!.diemSprt).toBeCloseTo(nguongSprt().tren, 12)
    expect(hs.vkn['E#1']!.p).toBe(capNhatHoi({ 'D#2': P0, 'E#1': P0 }, ['D#2', 'E#1'], false, ts.G.I, ts.S0, ts.T)['E#1'])
    expect(hs.vkn['D#1']!.nTuLam).toBe(0)
  })
  it('vi kỹ năng kiến thức nền `nen:*` dùng chung mọi dạng ⇒ xác nhận một dạng không đụng tới', () => {
    const qn = mapQ(qc('n1', ['dang:D', 'nen:bao_toan_khoi_luong']), qc('n2', ['dang:E', 'nen:bao_toan_khoi_luong'], { maDang: 'E' }))
    const hs = chay([sk('n1', { gio: 9 })], qn, { xacNhan: [xn('day_lai', new Date(msVn(HOM_NAY, 10)).toISOString())] })
    expect(hs.vkn['dang:D']).toMatchObject({ p: ts.XAC_NHAN.dayLai, dayLai: true })
    expect(hs.vkn['nen:bao_toan_khoi_luong']).toMatchObject({ dayLai: false, nTuLam: 1 })
    expect(hs.vkn['nen:bao_toan_khoi_luong']!.p).toBe(capNhatHoi({ 'dang:D': P0, 'nen:bao_toan_khoi_luong': P0 }, ['dang:D', 'nen:bao_toan_khoi_luong'], true, ts.G.I, ts.S0, ts.T)['nen:bao_toan_khoi_luong'])
    expect(hs.vkn['dang:E']).toBeUndefined()
  })
  it("'day_lai' ⇒ P = 0,10, chưa vững, dayLai = true; hết khi có lượt ĐÚNG tự làm sau đó (lượt sai không đóng)", () => {
    const luc = new Date(msVn(HOM_NAY, 8)).toISOString()
    const mo = chay([], q, { xacNhan: [xn('day_lai', luc)] })
    expect(mo.vkn['D#1']).toMatchObject({ p: ts.XAC_NHAN.dayLai, dayLai: true, trangThai: 'chua_vung' })
    const sai = chay([sk('q1', { ketQua: 0, gio: 9 })], q, { xacNhan: [xn('day_lai', luc)] })
    expect(sai.vkn['D#1']!.dayLai).toBe(true)
    const dung = chay([sk('q1', { ketQua: 1, gio: 9 })], q, { xacNhan: [xn('day_lai', luc)] })
    expect(dung.vkn['D#1']!.dayLai).toBe(false)
    expect(dung.vkn['D#1']!.p).toBe(capNhatHoi({ 'D#1': 0.1, 'D#2': 0.1 }, ['D#1', 'D#2'], true, ts.G.I, ts.S0, ts.T)['D#1'])
    expect(dung.vkn['tu_dat']!.dayLai).toBe(true)
  })
  it('xác nhận theo dòng thời gian: cùng mốc ⇒ sau sự kiện; trước sự kiện ⇒ sự kiện cập nhật từ P xác nhận; dạng chưa có vi kỹ năng ⇒ dang:<ma>', () => {
    const t = msVn(HOM_NAY, 9)
    const e = sk('q3', { ketQua: 0, receivedAt: t, maDang: 'E' })
    const cungMoc = chay([e], q, { xacNhan: [xn('vung', new Date(t).toISOString(), 'E')] })
    expect(cungMoc.vkn['E#1']!.p).toBe(ts.XAC_NHAN.vung)
    const truoc = chay([e], q, { xacNhan: [xn('vung', new Date(t - 1).toISOString(), 'E')] })
    expect(truoc.vkn['E#1']!.p).toBe(capNhatHoi({ 'E#1': 0.95 }, ['E#1'], false, ts.G.I, sEmCua(1, 1), ts.T)['E#1'])
    const la = chay([], q, { xacNhan: [xn('vung', new Date(t).toISOString(), 'ZZ')] })
    expect(Object.keys(la.vkn)).toEqual(['dang:ZZ'])
    const hong = chay([], q, { xacNhan: [{ sbd: 'T1', maDang: 'D', ket: 'vung', luc: 'khong-phai-ngay' }, { sbd: 'T2', maDang: 'D', ket: 'vung', luc: new Date(t).toISOString() }] })
    expect(hong.vkn).toEqual({})
  })
})

describe('phatLaiEm — tốc độ riêng, khung giờ, lướt hôm nay, con trỏ', () => {
  it('τ từ lượt đúng tự làm có ms và có β lớp (thiếu β, sai, chưa chắc, ms hỏng ⇒ bỏ mẫu)', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['a']), qc('q3', ['a']), qc('q4', ['a']), qc('q5', ['a']), qc('q6', ['a']))
    const beta = new Map([['q1', Math.log(100_000)], ['q2', Math.log(80_000)], ['q4', Math.log(60_000)], ['q5', Math.log(60_000)], ['q6', Math.log(60_000)]])
    const hs = chay([
      sk('q1', { msLam: 50_000, gio: 8 }),
      sk('q2', { msLam: 40_000, gio: 9 }),
      sk('q3', { msLam: 10_000, gio: 10 }),                     // thiếu β
      sk('q4', { msLam: 1_000, ketQua: 0, gio: 11 }),           // sai
      sk('q5', { msLam: 1_000, tuTin: 'chua_chac', gio: 12 }),  // chưa chắc
      sk('q6', { msLam: 950_000, gio: 13 }),                    // quá 900 s
    ], q, { beta })
    const ky = uocTau([{ betaLn: Math.log(100_000), ms: 50_000 }, { betaLn: Math.log(80_000), ms: 40_000 }])
    expect(hs.nTau).toBe(2)
    expect(hs.tau).toBeCloseTo(ky.tau, 12)
    expect(hs.tau).toBeCloseTo((Math.log(2) * 2) / 12, 12)
  })
  it('khung giờ VN: lượt thật (tự làm + lướt) và lượt sơ ý (lướt + chắc-mà-sai + nhãn lướt); lướt hôm nay', () => {
    const q = mapQ(qc('q1', ['a']))
    const hs = chay([
      sk('q1', { gio: 10 }),
      sk('q1', { gio: 19, ketQua: 0, tuTin: 'chac' }),
      sk('q1', { gio: 21, ketQua: 0, tuTin: 'chua_chac' }),
      sk('q1', { gio: 23, purpose: 'luot', ketQua: null }),
      sk('q1', { gio: 2, ngayVn: '2026-10-06', purpose: 'luot', ketQua: null }),
      sk('q1', { gio: 3, ngayVn: '2026-10-06', ketQua: 0, nhanTocDo: 'luot' }),
      sk('q1', { gio: 4, ngayVn: '2026-10-06', assistance: 'assisted' }),
      sk('q1', { gio: 5, ngayVn: '2026-10-06', purpose: 'xem_loi_giai', ketQua: 0, assistance: 'assisted' }),
    ], q)
    expect(hs.khungGio).toEqual({ truoc18: { n: 1, soY: 0 }, '18_20': { n: 1, soY: 1 }, '20_22': { n: 1, soY: 0 }, '22_24': { n: 1, soY: 1 }, sau24: { n: 2, soY: 2 } })
    expect(hs.luotHomNay).toBe(1)
    expect(chay([], q, { homNay: '2026-10-06', suKien: [sk('q1', { ngayVn: '2026-10-06', purpose: 'luot', ketQua: null })] }).luotHomNay).toBe(1)
  })
  it('thiếu receivedAt ⇒ dùng luc; con trỏ = receivedAt|khoa của sự kiện cuối theo thứ tự phát lại', () => {
    const q = mapQ(qc('q1', ['a']), qc('q2', ['a']))
    const a = sk('q1', { gio: 9, khoa: 'z-truoc' })
    const b = { ...sk('q2', { gio: 10, khoa: 'a-sau' }), receivedAt: Number.NaN }
    const hs = chay([b, a], q)
    expect(hs.cursor).toBe(`${Date.parse(b.luc)}|a-sau`)
    expect(hs.vkn.a!.nTuLam).toBe(2)
  })
})

describe('phatLaiEm — TẤT ĐỊNH tuyệt đối', () => {
  const rng = mulberry32(20261005)
  const qs: QCau[] = [
    ...Array.from({ length: 8 }, (_, i) => qc(`i${i}`, [`D#${i % 3}`, `E#${i % 2}`], { maDang: i % 2 ? 'E' : 'D', contentGroup: `g${i % 5}` })),
    ...Array.from({ length: 3 }, (_, i) => qc(`y${i}`, [`D#${i}`], { phan: 'II', vknY: [[`D#${i}`], ['E#0'], [`D#${(i + 1) % 3}`], ['E#1']] })),
  ]
  const q = mapQ(...qs)
  const ngay = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']
  const suKien: SuKienOmni[] = []
  for (let n = 0; n < 90; n++) {
    const c = qs[Math.floor(rng() * qs.length)]!
    const r = rng()
    suKien.push(sk(c.qid, {
      ngayVn: ngay[Math.floor(rng() * ngay.length)]!, gio: 6 + Math.floor(rng() * 18), phut: Math.floor(rng() * 60),
      phan: c.phan, ketQua: r < 0.08 ? null : rng() < 0.7 ? 1 : 0,
      y: c.phan === 'II' ? [0, 1, 2, 3].map(() => (rng() < 0.75 ? 1 : 0)) as (0 | 1)[] : null,
      assistance: rng() < 0.1 ? 'assisted' : 'none',
      purpose: r > 0.95 ? 'luot' : r > 0.9 ? 'xem_loi_giai' : null,
      tuTin: rng() < 0.2 ? 'chua_chac' : rng() < 0.5 ? 'chac' : null,
      msLam: 20_000 + Math.floor(rng() * 200_000), nhanTocDo: rng() < 0.3 ? 'troi_chay' : 'thuong',
      contentGroup: rng() < 0.5 ? c.contentGroup ?? null : null,
    }))
  }
  // vài dòng CÙNG mốc receivedAt ⇒ phân xử bằng khoa
  suKien.push(sk('i1', { receivedAt: suKien[3]!.receivedAt, ngayVn: suKien[3]!.ngayVn, khoa: 'aaa' }))
  suKien.push(sk('i2', { receivedAt: suKien[3]!.receivedAt, ngayVn: suKien[3]!.ngayVn, khoa: 'zzz', ketQua: 0 }))
  const xacNhan: XacNhanThay[] = [
    { sbd: 'T1', maDang: 'D', ket: 'day_lai', luc: '2026-10-02T03:00:00.000Z' },
    { sbd: 'T1', maDang: 'E', ket: 'vung', luc: '2026-10-04T12:00:00.000Z' },
  ]
  const dv = { q, xacNhan, beta: new Map(qs.map((c, i) => [c.qid, Math.log(60_000 + 1000 * i)])), baiCuaQid: new Map(qs.map((c, i) => [c.qid, `B${i % 3}`])), homNay: '2026-10-05' }
  const goc = phatLaiEm('T1', { ...dv, suKien })
  it('phát lại hai lần cùng số', () => {
    expect(phatLaiEm('T1', { ...dv, suKien })).toEqual(goc)
    expect(Object.keys(goc.vkn).length).toBeGreaterThan(3)
    expect(goc.nVung + Object.values(goc.vkn).reduce((s, v) => s + v.nTuLam, 0)).toBeGreaterThan(20)
  })
  it('cùng tập sự kiện + xác nhận theo 12 thứ tự khác nhau ⇒ deep-equal (cả thứ tự khoá)', () => {
    const tron = mulberry32(99)
    for (let lan = 0; lan < 12; lan++) {
      const ds = [...suKien]
      for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(tron() * (i + 1)); [ds[i], ds[j]] = [ds[j]!, ds[i]!] }
      const ra = phatLaiEm('T1', { ...dv, suKien: ds, xacNhan: lan % 2 ? [...xacNhan].reverse() : xacNhan })
      expect(ra).toEqual(goc)
      expect(JSON.stringify(ra)).toBe(JSON.stringify(goc))
    }
  })
  it('dòng trùng y hệt (gộp lô chồng nhau) chỉ tính một lần', () => {
    expect(phatLaiEm('T1', { ...dv, suKien: [...suKien, ...suKien.slice(0, 30)] })).toEqual(goc)
  })
})
