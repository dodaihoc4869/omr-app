// @vitest-environment node
// Màn Lịch sử ca + báo cáo chi tiết của em (28/09) dùng API SẴN CÓ: khoá rằng máy chủ chỉ trả ca/câu của CHÍNH em và lọc ca chưa công bố. SQLite thật.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'

describe('máy chủ: /hs/lich-su và /hs/cau-da-thi chỉ trả của CHÍNH em, lọc chưa công bố', () => {
  const NOP = '2026-09-26T02:42:00.000Z'
  const dung = () => {
    const d = taoD1That()
    for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(s, `Em ${s}`)
    for (const [ma, cb] of [['CA-CB', 'ngay'], ['CA-CHO', 'khong']] as const) {
      d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,'dong','thi',?,'x')").run(ma, `Ca ${ma}`, cb)
      for (const s of ['S1', 'S2']) {
        d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten) VALUES(?,?,?,1,?,?,'da_nop','x',?,1,1,1,?)").run(`${ma}|${s}|1`, ma, s, NOP, NOP, s === 'S1' ? 7.25 : 9.5, `Em ${s}`)
        d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dap_an_chon,dap_an_dung,dung_sai,cap_nhat_luc) VALUES(?,?,?,1,'I',1,?,'A','B',0,'x')").run(`${ma}|${s}|1|1`, ma, s, `q-${ma}`)
      }
    }
    return d
  }
  it('/hs/lich-su: chỉ ca của S1; ca chưa công bố không điểm', async () => {
    const r = (await goiWorker(worker, dung().env, '/hs/lich-su', { sbd: 'S1' })) as any
    expect(r.ok).toBe(true)
    expect(r.items.map((x: any) => [x.maCa, x.tong])).toEqual([['CA-CB', 7.25]])
    expect(JSON.stringify(r)).not.toContain('9.5')
    expect(r.chuaCongBo.map((x: any) => x.maCa)).toEqual(['CA-CHO'])
    expect(JSON.stringify(r.chuaCongBo)).not.toMatch(/tong|7\.25/)
  })
  it('/hs/cau-da-thi: câu của S1 ở ca đã công bố; không câu ca chờ, không câu em khác', async () => {
    const r = (await goiWorker(worker, dung().env, '/hs/cau-da-thi', { sbd: 'S1', dsMaCa: ['CA-CB', 'CA-CHO'] })) as any
    expect(r.ok).toBe(true)
    expect(r.items.map((x: any) => x.maCa)).toEqual(['CA-CB'])
    expect(r.items.every((x: any) => x.qid === 'q-CA-CB')).toBe(true)
  })
})
