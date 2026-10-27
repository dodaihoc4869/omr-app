// @vitest-environment node
// LỖ HỔNG «CHẶNG NGẮN» (đo 27/10: 34/382 chặng xong < 6 câu, 22 «hoàn hảo» < 6 câu, 8 em-ngày ăn «Xong 2 chặng» chỉ nhờ chặng ngắn) — từ 28/10 chặng < 6 câu
// không tính «Xong N chặng», «Chặng hoàn hảo», mục tiêu ngày theo chặng; chuỗi đúng / câu khó vẫn tính. Ngày cũ giữ. D1 thật.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { docNgayEm } from '../server/src/thuong-d1'
import { changDu, NGAY_CHANG_DU } from '../server/src/thuong-luat'

function kho() {
  const d = taoD1That()
  const bai = d.sql.prepare("INSERT INTO thuong_bai_xong(em,phien,ngay,so_cau,so_dung,chuoi_max,kho_dung,hoan_hao,nguyen_tu,luc) VALUES('S1',?,?,?,?,?,?,?,0,?)")
  return { env: d.env as unknown as Env, bai }
}
describe('chặng ngắn không ăn thưởng chặng (từ 28/10)', () => {
  it('luật', () => {
    expect(NGAY_CHANG_DU).toBe('2026-10-28')
    expect(changDu('2026-10-27', 2)).toBe(true); expect(changDu('2026-10-28', 5)).toBe(false); expect(changDu('2026-10-28', 6)).toBe(true)
  })
  it('28/10: một chặng 6 câu + hai chặng 2 câu hoàn hảo ⇒ 1 chặng xong, 0 hoàn hảo; chuỗi đúng / câu khó vẫn lấy từ mọi chặng', async () => {
    const k = kho()
    k.bai.run('p1', '2026-10-28', 6, 4, 3, 0, 0, '2026-10-28T03:00:00Z')
    k.bai.run('p2', '2026-10-28', 2, 2, 7, 1, 1, '2026-10-28T03:10:00Z')
    k.bai.run('p3', '2026-10-28', 2, 2, 2, 1, 1, '2026-10-28T03:20:00Z')
    const d = await docNgayEm(k.env, 'S1', '2026-10-28')
    expect(d.soLieu).toMatchObject({ baiXong: 1, hoanHao: 0, chuoiMax: 7, khoDung: 2 })
    expect(d.nhiemVu.find((n) => n.ma === 'xong_bai')?.xong).toBe(false)
  })
  it('ngày cũ (27/10) giữ luật cũ', async () => {
    const k = kho()
    k.bai.run('p1', '2026-10-26', 2, 2, 2, 0, 1, '2026-10-26T03:00:00Z')
    k.bai.run('p2', '2026-10-26', 3, 3, 3, 0, 1, '2026-10-26T03:10:00Z')
    expect((await docNgayEm(k.env, 'S1', '2026-10-26')).soLieu).toMatchObject({ baiXong: 2, hoanHao: 2 })
  })
})
