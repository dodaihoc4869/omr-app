// @vitest-environment node
// SỨC KHOẺ MÁY CHỦ (M3): p50/p95 trong bộ nhớ ⇒ mức tốt/bận/nghẽn ⇒ hệ số nhịp `nhipDeNghi` ở MỌI phản hồi JSON + lệnh /gv/suc-khoe-may-chu (chỉ thầy, không chạm D1).
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { CUA_SO_MS, NGUONG_BAN_MS, NGUONG_NGHEN_MS, TOI_DA_MAU, TOI_THIEU_MAU, ghiDoLenh, nhipDeNghi, sucKhoeMay, tenLenh, xoaSucKhoe } from '../server/src/suc-khoe-may'
import { goiWorker, taoD1That } from './_d1-that'

const T = 1_000_000
beforeEach(() => xoaSucKhoe())
const dat = (n: number, ms: number, duong = '/hs/ke-hoach-ngay', at = T) => { for (let i = 0; i < n; i++) ghiDoLenh(duong, ms, at + i) }

describe('mức sức khoẻ', () => {
  it('ít hơn 20 mẫu ⇒ tốt dù chậm (chưa đủ số liệu để kết tội); từ 20 mẫu nhanh ⇒ tốt, hệ số 1', () => {
    dat(TOI_THIEU_MAU - 1, 9000); expect(sucKhoeMay(T + 100)).toMatchObject({ muc: 'tot', heSo: 1, soLuot: TOI_THIEU_MAU - 1 })
    xoaSucKhoe(); dat(30, 200); expect(sucKhoeMay(T + 100)).toMatchObject({ muc: 'tot', heSo: 1, p50Ms: 200, p95Ms: 200 })
  })
  it(`p95 > ${NGUONG_BAN_MS} ms ⇒ bận (×2); > ${NGUONG_NGHEN_MS} ms ⇒ nghẽn (×4); đúng ngưỡng vẫn ở mức dưới`, () => {
    dat(30, NGUONG_BAN_MS); expect(sucKhoeMay(T + 100).muc).toBe('tot')
    xoaSucKhoe(); dat(30, NGUONG_BAN_MS + 1); expect(sucKhoeMay(T + 100)).toMatchObject({ muc: 'ban', heSo: 2 })
    xoaSucKhoe(); dat(30, NGUONG_NGHEN_MS); expect(sucKhoeMay(T + 100).muc).toBe('ban')
    xoaSucKhoe(); dat(30, NGUONG_NGHEN_MS + 1); expect(sucKhoeMay(T + 100)).toMatchObject({ muc: 'nghen', heSo: 4 })
  })
  it('p95 chịu được vài lượt chậm lẻ tẻ: 30 lượt nhanh + 1 lượt 20 giây ⇒ vẫn tốt; 25 nhanh + 6 chậm ⇒ bận', () => {
    dat(30, 200); ghiDoLenh('/x', 20_000, T + 50); expect(sucKhoeMay(T + 100).muc).toBe('tot')
    xoaSucKhoe(); dat(25, 200); dat(6, 2000, '/y', T + 50); expect(sucKhoeMay(T + 100).muc).toBe('ban')
  })
  it('cửa sổ 2 phút: mẫu cũ hơn bị bỏ ⇒ máy hồi phục thì hệ số về 1; giờ lùi không tính', () => {
    dat(30, 5000); expect(sucKhoeMay(T + 100).muc).toBe('nghen')
    expect(sucKhoeMay(T + CUA_SO_MS + 1000)).toMatchObject({ muc: 'tot', soLuot: 0 })
    expect(sucKhoeMay(T - 5000).soLuot).toBe(0)
  })
  it('đệm 2 giây nhưng ghi mẫu mới làm số liệu mới hiện ngay; trần số mẫu', () => {
    dat(30, 200); expect(sucKhoeMay(T + 100).muc).toBe('tot')
    dat(60, 9000, '/z', T + 200); expect(sucKhoeMay(T + 300).muc).toBe('nghen')
    xoaSucKhoe(); dat(TOI_DA_MAU + 200, 100); expect(sucKhoeMay(T + TOI_DA_MAU + 300).soLuot).toBeLessThanOrEqual(TOI_DA_MAU)
  })
  it('theoLenh: gom theo lệnh, nhiều lượt nhất trước, tối đa 8; lệnh tự hỏi sức khoẻ và giá trị lạ KHÔNG được ghi', () => {
    dat(10, 100, '/a'); dat(5, 900, '/b', T + 20); dat(3, 50, '/gv/suc-khoe-may-chu', T + 40); ghiDoLenh('/c', Number.NaN, T + 50); ghiDoLenh('/c', -5, T + 51)
    const s = sucKhoeMay(T + 100)
    expect(s.soLuot).toBe(15); expect(s.theoLenh.map((x) => x.duong)).toEqual(['/a', '/b']); expect(s.theoLenh[1]).toMatchObject({ soLuot: 5, p50Ms: 900 })
    xoaSucKhoe(); for (let i = 0; i < 12; i++) dat(i + 1, 10, `/l${i}`, T + i * 100); expect(sucKhoeMay(T + 5000).theoLenh).toHaveLength(8)
  })
  it('tenLenh: giữ tên hành động game, gộp mã dài của phiếu/đề', () => {
    expect(tenLenh('/game-v2/answer')).toBe('/game-v2/answer'); expect(tenLenh('/hs/ke-hoach-ngay/')).toBe('/hs/ke-hoach-ngay'); expect(tenLenh('/phieu/ABC123')).toBe('/phieu/*'); expect(tenLenh('/de/DH-12-C1')).toBe('/de/*')
    expect(tenLenh('/' + 'x'.repeat(200)).length).toBeLessThanOrEqual(60)
  })
  it('nhipDeNghi: {heSo, muc} theo đúng mức', () => {
    dat(30, 5000); expect(nhipDeNghi(T + 100)).toEqual({ heSo: 4, muc: 'nghen' })
    xoaSucKhoe(); expect(nhipDeNghi(T + 100)).toEqual({ heSo: 1, muc: 'tot' })
  })
})

describe('qua Worker', () => {
  it('MỌI phản hồi JSON mang nhipDeNghi {heSo, muc}; lệnh lỗi cũng có', async () => {
    const d = taoD1That()
    const a = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONGCO' }, false, true)
    expect(a.ok).toBe(false); expect(a.nhipDeNghi).toEqual({ heSo: 1, muc: 'tot' })
    const r = await worker.fetch(new Request('https://test/khoe'), d.env); expect((await r.json() as any).nhipDeNghi).toBeDefined()
  })
  it('máy chậm ⇒ phản hồi kế tiếp mang hệ số cao hơn; hồi phục thì về 1', async () => {
    const d = taoD1That(); const now = Date.now()
    for (let i = 0; i < 40; i++) ghiDoLenh('/hs/ke-hoach-ngay', 6000, now)
    expect((await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONGCO' }, false, true)).nhipDeNghi).toEqual({ heSo: 4, muc: 'nghen' })
    xoaSucKhoe(); expect((await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONGCO' }, false, true)).nhipDeNghi.heSo).toBe(1)
  })
  it('/gv/suc-khoe-may-chu: chỉ thầy (thiếu mã ⇒ 403), đúng hình dạng hợp đồng, không tốn truy vấn D1, không tự đếm chính nó', async () => {
    const d = taoD1That(); let dem = 0; const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { dem++; return goc(q) }) as typeof d.env.DB.prepare
    const sai = await goiWorker(worker, d.env, '/gv/suc-khoe-may-chu', {}); expect(sai.ok).toBe(false)
    const truoc = sucKhoeMay().soLuot; dem = 0
    const r = await goiWorker(worker, d.env, '/gv/suc-khoe-may-chu', {}, true, true)
    expect(r).toMatchObject({ ok: true, muc: 'tot', heSo: 1, cuaSoGiay: 120, nguong: { banMs: 1500, nghenMs: 3500, toiThieuMau: 20 } })
    expect(Array.isArray(r.theoLenh)).toBe(true); expect(typeof r.p95Ms).toBe('number'); expect(typeof r.ghiChu).toBe('string')
    expect(dem).toBeLessThanOrEqual(3)                                         // chỉ phần cổng chung (cờ reset / mã bí mật), KHÔNG truy vấn của lệnh
    expect(r.theoLenh.some((x: { duong: string }) => x.duong === '/gv/suc-khoe-may-chu')).toBe(false); void truoc
  })
  it('OPTIONS không được đếm; lượt thường được đếm', async () => {
    const d = taoD1That(); xoaSucKhoe()
    await worker.fetch(new Request('https://test/hs/ke-hoach-ngay', { method: 'OPTIONS' }), d.env); expect(sucKhoeMay().soLuot).toBe(0)
    await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONGCO' }, false, true); expect(sucKhoeMay().soLuot).toBe(1)
  })
})
