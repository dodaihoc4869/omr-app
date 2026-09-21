// @vitest-environment node
// `/gv/bao-cao-ca` + `/gv/bao-cao-ca-em`: đường HTTP thật của Worker — cổng mã bí mật của thầy (không mã ⇒ 403, không rò số), ca chưa có ⇒ lỗi rõ, ca có lượt nộp ⇒ ok với `toiDa` từng phần từ quotaPhan (4,5 / 4 / 1,5 khi đủ ba phần). Thân dựng chi tiết: tests/bao-cao-ca-may-chu-2109.test.ts.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES('CA1','Kiểm tra 15 phút','dong','thi','ngay','x')").run()
  for (const [s, tong] of [['S1', 7.5], ['S2', 4]] as const) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(s, `Em ${s}`)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,tong,cap_nhat_luc) VALUES(?,?,?,1,'2026-09-22T01:00:00.000Z','2026-09-22T01:30:00.000Z','da_nop',?,?,?,?,'x')").run(`CA1|${s}|1`, 'CA1', s, tong - 3, 2, 1, tong)
    let stt = 0
    for (const [phan, n] of [['I', 18], ['II', 4], ['III', 6]] as const) for (let i = 0; i < n; i++) d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,'A','A',?,30,'x')").run(`CA1|${s}|1|${phan}|${++stt}`, 'CA1', s, phan, stt, `Q${stt}`, i % 3 === 0 ? 0 : 1)
  }
  return d
}
const goi = (d: D1That, duong: string, b: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, duong, b, thay) as Promise<any>

describe('đường HTTP', () => {
  it('không mã bí mật ⇒ từ chối, không lộ số; sai/thiếu maCa ⇒ lỗi rõ', async () => {
    const d = dung()
    for (const [duong, b] of [['/gv/bao-cao-ca', { maCa: 'CA1' }], ['/gv/bao-cao-ca-em', { maCa: 'CA1', sbd: 'S1' }]] as const) {
      const r = await goi(d, duong, b, false)
      expect(r.ok).not.toBe(true)
      expect(JSON.stringify(r)).not.toMatch(/tongQuan|ketQua|hocSinh/)
    }
    expect((await goi(d, '/gv/bao-cao-ca', {})).ok).toBe(false)
    expect((await goi(d, '/gv/bao-cao-ca', { maCa: 'KHONG-CO' })).ok).toBe(false)
    expect((await goi(d, '/gv/bao-cao-ca-em', { maCa: 'CA1' })).ok).toBe(false)
  })

  it('có mã: lớp ok (2 em, phanTb có toiDa 4,5/4/1,5) + một em ok (phan có toiDa) — cùng quotaPhan của chấm điểm', async () => {
    const d = dung()
    const lop = await goi(d, '/gv/bao-cao-ca', { maCa: 'CA1' })
    expect(lop.ok).toBe(true)
    expect(lop.tongQuan.soEm).toBe(2)
    expect(lop.tongQuan.phanTb.map((p: any) => [p.ma, p.toiDa])).toEqual([['I', 4.5], ['II', 4], ['III', 1.5]])
    const em = await goi(d, '/gv/bao-cao-ca-em', { maCa: 'CA1', sbd: 'S1' })
    expect(em.ok).toBe(true)
    expect(em.phan.map((p: any) => [p.ma, p.toiDa])).toEqual([['I', 4.5], ['II', 4], ['III', 1.5]])
    expect(em.hangTrongLop).toEqual({ hang: 1, siSo: 2 })
  })
})
