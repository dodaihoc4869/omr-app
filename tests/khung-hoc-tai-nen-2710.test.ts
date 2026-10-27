// @vitest-environment node
// KHUNG HỌC 18:00–23:59 VN (thầy 27/10 «App phải tức thì ở mọi khung giờ»; Analytics D1 27/10 19–23h: D1 bận ~20 % thời gian, lệnh em chờ ~1,3 s/đợt):
// việc nền không ai chờ nghỉ cả khung (lấp kích thước đề, chuẩn bị nguồn câu, máy soạn sơ đồ); câu đóng tự động đợt Tự sửa lỗi (8,4 % thời gian D1 khung ấy)
// giãn 10 → 60 phút mỗi em.
import { afterEach, expect, it } from 'vitest'
import { denLuotDong, xoaLuotDong } from '../server/src/chua-gon'
import { laKhungHocVn } from '../server/src/index'

afterEach(() => xoaLuotDong())
const VN = (gio: string) => Date.parse(`2026-10-28T${gio}:00+07:00`)

it('laKhungHocVn: 18:00–23:59 VN là khung học; 17:59 và 00:00 không', () => {
  expect(laKhungHocVn(VN('17:59'))).toBe(false)
  expect(laKhungHocVn(VN('18:00'))).toBe(true)
  expect(laKhungHocVn(VN('23:59'))).toBe(true)
  expect(laKhungHocVn(Date.parse('2026-10-29T00:00:00+07:00'))).toBe(false)
})

it('đóng tự động: ngoài khung 10 phút một lượt mỗi em; trong khung 60 phút', () => {
  expect(denLuotDong('A', VN('10:00'))).toBe(true)
  expect(denLuotDong('A', VN('10:05'))).toBe(false)
  expect(denLuotDong('A', VN('10:11'))).toBe(true)
  expect(denLuotDong('B', VN('20:00'))).toBe(true)
  expect(denLuotDong('B', VN('20:15'))).toBe(false)
  expect(denLuotDong('B', VN('20:59'))).toBe(false)
  expect(denLuotDong('B', VN('21:01'))).toBe(true)
})

it('chỉ mục chỉ-thêm (cron 00:01 VN): sổ học và lượt xem lời giải theo em + mốc giờ đi chỉ mục (sbd, luc)', async () => {
  const { taoD1That } = await import('./_d1-that')
  const { dungChiMucCronDem } = await import('../server/src/chi-muc-luc-chay')
  const d = taoD1That()
  await dungChiMucCronDem(d.env as never)
  const ke = (q: string) => (d.sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((r) => r.detail).join(' | ')
  expect(ke("SELECT qid FROM su_kien_hoc WHERE sbd = 'x' AND luc >= '2026-10-01'")).toContain('idx_skh_em_luc')
  expect(ke("SELECT qid FROM loi_giai_hoi WHERE sbd = 'x' AND co_ho_so = 1 AND luc >= '2026-10-01'")).toContain('idx_lg_hoi_em_luc')
})
