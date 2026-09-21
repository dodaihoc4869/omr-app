// @vitest-environment node
// `len_bang.giay_thuc` (hợp đồng docs/hop-dong-giay-thuc-len-bang-1909.md): POST /len-bang đọc `giayThuc`, hợp lệ 20..1800 thì ghi, còn lại NULL, KHÔNG BAO GIỜ từ chối vì trường này.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const ghi = (d: D1That, o: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: true, ...o }, true)
const giay = (d: D1That) => (d.sql.prepare('SELECT giay_thuc AS g FROM len_bang ORDER BY id').all() as { g: number | null }[]).map((x) => x.g)

describe('POST /len-bang đọc giayThuc', () => {
  it('không gửi ⇒ NULL, ghi thành công; gửi 95.5 ⇒ 95.5; biên 20 và 1800 hợp lệ', async () => {
    const d = taoD1That()
    for (const o of [{}, { giayThuc: 95.5 }, { giayThuc: 20 }, { giayThuc: 1800 }]) expect(await ghi(d, o)).toMatchObject({ ok: true })
    expect(giay(d)).toEqual([null, 95.5, 20, 1800])
  })
  it('19, 1801, chuỗi "90", null, true, mảng, đối tượng, số âm, 0 ⇒ NULL và VẪN ghi thành công (kết quả Đạt/Chưa đạt quan trọng hơn số đo)', async () => {
    const d = taoD1That()
    const xau = [19, 1801, '90', null, true, [], {}, -5, 0, 19.99, 1800.01]
    for (const v of xau) expect(await ghi(d, { giayThuc: v }), JSON.stringify(v)).toMatchObject({ ok: true })
    expect(giay(d)).toEqual(xau.map(() => null))
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM len_bang WHERE dat = 1').get()).toEqual({ n: xau.length })
  })
  it('phản hồi không đổi; sổ su_kien_hoc, qid_da_lam, ban_do_sai vẫn được ghi như cũ', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,chuyen_de,so_lan_sai,da_chua,cap_nhat_luc) VALUES('CA|S1|Q1','CA','S1','Q1','Este',1,0,'x')").run()
    const r = await ghi(d, { giayThuc: 60 })
    expect(Object.keys(r).filter((k) => k !== 'serverNow').sort()).toEqual(['ok'])
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'len_bang' AND sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ n: 1 })
    expect(d.sql.prepare("SELECT so_lan FROM qid_da_lam WHERE sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ so_lan: 1 })
    expect(d.sql.prepare("SELECT da_chua FROM ban_do_sai WHERE sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ da_chua: 1 })
    const { serverNow: _dongHo, ...phanHoi } = r // `serverNow` là mili giây đồng hồ (có lúc chứa chuỗi "60"): chỉ kiểm phần phản hồi của lệnh, không kiểm đồng hồ
    expect(JSON.stringify(phanHoi)).not.toContain('60')
  })
  it('chưa chạy migration (cột giay_thuc chưa có): vẫn ghi như cũ, không ghi đôi, không lỗi', async () => {
    const d = taoD1That()
    d.sql.exec('ALTER TABLE len_bang DROP COLUMN giay_thuc')
    expect(await ghi(d, { giayThuc: 95.5 })).toMatchObject({ ok: true })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM len_bang').get()).toEqual({ n: 1 })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'len_bang'").get()).toEqual({ n: 1 })
  })
  it('lỗi D1 KHÁC (không phải thiếu cột) không bị nuốt: báo lỗi, không ghi gì, không thử lại', async () => {
    const d = taoD1That()
    let lan = 0
    const batch = d.env.DB.batch.bind(d.env.DB)
    d.env.DB.batch = (async (c: never) => { lan++; throw new Error('D1 hỏng tạm') }) as never
    const r = await ghi(d, { giayThuc: 95.5 }).then((x) => x, (e) => ({ ok: false, error: String(e) })) // lỗi có thể nổ ra ngoài `fetch` hoặc thành ok:false
    expect(r.ok).toBe(false)
    expect(lan).toBe(1)
    d.env.DB.batch = batch
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM len_bang').get()).toEqual({ n: 0 })
  })
  it('vẫn đòi mã bí mật của thầy và vẫn từ chối thiếu SBD/chuyên đề', async () => {
    const d = taoD1That()
    expect((await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'Este', giayThuc: 50 })).ok).not.toBe(true)
    expect(await ghi(d, { sbd: '' })).toMatchObject({ ok: false })
    expect(await ghi(d, { chuyenDe: '' })).toMatchObject({ ok: false })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM len_bang').get()).toEqual({ n: 0 })
  })
})
