// @vitest-environment node
// /hs/lich-su KHÔNG trả ca thầy đã XOÁ MỀM (ca.trang_thai = 'da_xoa'): trước đây học sinh vẫn thấy điểm của ca đã xoá (tài khoản thử 12121212: 8/8 ca đều đã xoá ⇒ thẻ "ca gần nhất" hiện ca ma).
// Không đổi luật công bố. SQLite thật.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NOP = '2026-09-21T03:00:00.000Z'
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em S1','12','mk','x')").run()
  for (const [ma, tt] of [['CA-SONG', 'mo'], ['CA-DONG', 'dong'], ['CA-XOA', 'da_xoa']] as const) {
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,'thi','ngay','x')").run(ma, `Ca ${ma}`, tt)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten) VALUES(?,?,'S1',1,?,?, 'da_nop','x',7.5,2.5,2.5,2.5,'Em S1')").run(`${ma}|S1|1`, ma, NOP, NOP)
  }
  return d
}
const lichSu = (d: D1That) => goiWorker(worker, d.env, '/hs/lich-su', { sbd: 'S1' }) as Promise<{ ok: boolean; items: { maCa: string }[] }>

describe('/hs/lich-su và ca đã xoá mềm', () => {
  it('ca da_xoa KHÔNG có trong items; ca đang mở / đã đóng vẫn có', async () => {
    const r = await lichSu(dung())
    expect(r.ok).toBe(true)
    expect(r.items.map((x) => x.maCa).sort()).toEqual(['CA-DONG', 'CA-SONG'])
  })
  it('em chỉ có ca đã xoá ⇒ items rỗng (thẻ ca gần nhất không còn ca ma)', async () => {
    const d = dung()
    d.sql.exec("DELETE FROM luot WHERE ma_ca <> 'CA-XOA'")
    expect((await lichSu(d)).items).toEqual([])
  })
})
