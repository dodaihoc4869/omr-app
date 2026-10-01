// @vitest-environment node
// EXP TRÊN TRANG THẦY = sổ EXP + THƯỞNG NẤC HỌC TRONG GAME (thầy 01/10: SBD 12006 màn em "+461 EXP hôm nay", trang thầy "301 EXP").
// Thưởng nấc (`game_v2_reward`) cộng THẬT vào thú nhưng không ghi `exp_so`; màn em (`docExpHomNay`) cộng cả hai, trang thầy chỉ đọc sổ ⇒ báo thiếu.
// Khoá: /gv/em-toan-canh (expHomNay, expTong, dòng "EXP ngày") và /gv/vinh-danh-ngay (chăm nhất) cộng cả thưởng nấc; thưởng 0 không tính;
// thưởng hôm qua không vào hôm nay; vẫn đọc-chỉ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const H = 3_600_000, D = 86_400_000
const NAY = BAY_GIO.getTime() // 22/09/2026 10:00 giờ VN
const luc = (soNgayTruoc: number, gioTrongNgay = 0) => new Date(NAY - soNgayTruoc * D + gioTrongNgay * H).toISOString()
const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, d.env, duong, b, true)

function truong(): D1That {
  gio(BAY_GIO)
  const d = taoD1That()
  for (const [sbd, ten] of [['1001', 'Nguyễn Văn An'], ['1002', 'Trần Thị Bình']]) d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')").run(sbd, ten)
  const so = (k: string, sbd: string, ngay: string, exp: number, l: string) => d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,?,'cau','q','m',?,?,'')").run(k, sbd, ngay, exp, l)
  const thuong = (id: string, sbd: string, n: number, l: string) => d.sql.prepare('INSERT INTO game_v2_reward(id,sbd,amount,created_at) VALUES(?,?,?,?)').run(id, sbd, n, l)
  so('a1', '1001', '2026-09-22', 30, luc(0, -2)); so('a0', '1001', '2026-09-21', 50, luc(1))
  thuong('r1', '1001', 20, luc(0, -1)); thuong('r2', '1001', 15, luc(0, -0.5)); thuong('r0', '1001', 0, luc(0, -0.4)); thuong('rq', '1001', 7, luc(1, 1))
  // 1002: sổ nhiều hơn 1001 nhưng không có thưởng nấc ⇒ chăm nhất phải là 1001 (30 + 35 = 65 > 40)
  so('b1', '1002', '2026-09-22', 40, luc(0, -3))
  return d
}

describe('EXP trang thầy cộng thưởng nấc game', () => {
  it('em-toan-canh: hôm nay = sổ hôm nay + thưởng nấc hôm nay; tổng = toàn bộ sổ + toàn bộ thưởng; thưởng 0 không tính', async () => {
    const d = truong()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1001' })
    expect(r.ok).toBe(true)
    expect(r.em.expHomNay).toBe(30 + 20 + 15)
    expect(r.em.expTong).toBe(30 + 50 + 20 + 15 + 7)
  })
  it('em-toan-canh: dòng "EXP ngày" gộp cả thưởng nấc theo NGÀY GIỜ VN', async () => {
    const d = truong()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1001' })
    const exp = r.dong.filter((x: { loai: string }) => x.loai === 'exp').map((x: { chiTiet: { ngay: string; exp: number } }) => [x.chiTiet.ngay, x.chiTiet.exp])
    expect(exp).toEqual([['2026-09-22', 65], ['2026-09-21', 57]])
  })
  it('vinh-danh-ngay: chăm nhất tính cả thưởng nấc', async () => {
    const d = truong()
    const r = await goi(d, '/gv/vinh-danh-ngay', {})
    expect(r.chamNhat).toEqual({ sbd: '1001', hoTen: 'Nguyễn Văn An', lop: '12A', exp: 65 })
  })
  it('em không có sổ lẫn thưởng ⇒ khoá EXP vẫn vắng', async () => {
    const d = truong()
    d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('1003','Lê C','12A','mk','x')").run()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1003' })
    expect(r.em.expTong).toBeUndefined()
    expect(r.em.expHomNay).toBeUndefined()
  })
})
