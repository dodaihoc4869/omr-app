// @vitest-environment node
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'

const phieu = { ma: 'MA-PHIEU-THU', maCa: 'CA1', sbd: 'HS1', loai: 'ketqua', phieu: { cauSai: [], soCauSai: 0, tongSoCau: 1 } }
function kho() {
  const d = taoD1That()
  const tho = JSON.stringify(phieu, null, 2)
  d.env.DE.get = async () => ({ body: new Response(tho).body!, httpEtag: 'v1' })
  return { d, tho, lay: () => worker.fetch(new Request('https://may-thu/phieu/MA-PHIEU-THU'), d.env) }
}

describe('phiếu phụ huynh vẫn đọc được khi bước tự sửa gặp lỗi', () => {
  it('D1 chưa đọc được chi tiết câu thì trả nguyên phiếu đã có', async () => {
    const k = kho(), prepare = k.d.env.DB.prepare.bind(k.d.env.DB)
    k.d.env.DB.prepare = sql => {
      if (!sql.includes('FROM chi_tiet_cau')) return prepare(sql)
      const st = { bind: () => st, all: async () => { throw new Error('D1 DB is overloaded') } }
      return st as never
    }
    const r = await k.lay()
    expect(r.status).toBe(200)
    expect(await r.text()).toBe(k.tho)
  })

  it('R2 chưa ghi được bản chữa thì không làm mất phiếu cũ hoặc thay điểm thật', async () => {
    const k = kho()
    k.d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('K1','CA1','HS1','I',1,'Q1',0,'x')").run()
    k.d.env.DE.put = async () => { throw new Error('R2 chưa ghi được') }
    const r = await k.lay()
    expect(r.status).toBe(200)
    expect(await r.text()).toBe(k.tho)
    expect(k.d.sql.prepare("SELECT dung_sai FROM chi_tiet_cau WHERE khoa='K1'").get()).toEqual({ dung_sai: 0 })
  })

  it('khi tự sửa thành công vẫn giữ luật cũ, ghi R2 một lần và trả bản đã sửa', async () => {
    const k = kho()
    k.d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('K1','CA1','HS1','I',1,'Q1',0,'x')").run()
    let soGhi = 0, daGhi = ''
    k.d.env.DE.put = async (_k, than) => { soGhi++; daGhi = String(than) }
    const r = await k.lay()
    expect(r.status).toBe(200)
    expect(await r.text()).toBe(daGhi)
    expect(JSON.parse(daGhi).phieu).toMatchObject({ soCauSai: 1, tongSoCau: 1, cauSai: [{ qid: 'Q1' }] })
    expect(soGhi).toBe(1)
  })
})
