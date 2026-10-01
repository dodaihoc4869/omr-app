// @vitest-environment node
// 01/10: "Chuỗi N ngày" trên Sảnh Hoá 2.0 luôn = 0 cả trung tâm (cron không còn chốt `ke_hoach_ngay.ket_qua='dat'`).
// Chuỗi mới = số ngày VN liên tiếp em có làm ≥ 1 câu (sổ `su_kien_hoc`); hôm nay chưa làm ⇒ giữ tới hôm qua.
// D1 thật = node:sqlite (tests/_d1-that).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { demChuoiNgayHoc, docChuoiNgayHoc } from '../server/src/chuoi-ngay-hoc'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { sanh2 } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

const VN = (s: string) => Date.parse(`${s}+07:00`)
let dem = 0
const sk = (sbd: string, lucVn: string, nguon: SuKien['nguon'] = 'game', ketQua: 0 | 1 | null = 1): SuKien => ({
  nguon, maNguon: `m${++dem}`, sbd, qid: `Q${dem}`, lan: 1, ketQua, luc: new Date(VN(lucVn)).toISOString(),
})
function dung() {
  const d = taoD1That()
  return { d, env: d.env as unknown as Env }
}

describe('demChuoiNgayHoc (hàm thuần)', () => {
  it('hôm nay có ⇒ đếm từ hôm nay; không ⇒ từ hôm qua; đứt ⇒ dừng', () => {
    expect(demChuoiNgayHoc(['2026-09-27', '2026-09-29', '2026-09-30'], '2026-10-01')).toBe(2)
    expect(demChuoiNgayHoc(['2026-09-27', '2026-09-29', '2026-09-30', '2026-10-01'], '2026-10-01')).toBe(3)
    expect(demChuoiNgayHoc(['2026-09-29', '2026-09-30'], '2026-10-02')).toBe(0)
    expect(demChuoiNgayHoc([], '2026-10-01')).toBe(0)
    expect(demChuoiNgayHoc(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2) // qua đầu tháng
  })
})

describe('docChuoiNgayHoc (D1 thật, kiểu SBD 11064)', () => {
  it('học 27, 29, 30/09; 01/10 chưa làm ⇒ 2; làm hôm nay ⇒ 3', async () => {
    const { env } = dung()
    await ghiSuKien(env, [sk('11064', '2026-09-27T20:00:00'), sk('11064', '2026-09-29T19:00:00'), sk('11064', '2026-09-29T19:05:00', 'luyen'), sk('11064', '2026-09-30T21:00:00')])
    expect(await docChuoiNgayHoc(env, '11064', VN('2026-10-01T06:30:00'))).toBe(2) // sáng sớm chưa làm: KHÔNG về 0
    await ghiSuKien(env, [sk('11064', '2026-10-01T07:10:00', 'on_lai')])
    expect(await docChuoiNgayHoc(env, '11064', VN('2026-10-01T07:15:00'))).toBe(3)
  })
  it('bỏ trọn một ngày ⇒ chuỗi về 0; làm lại ⇒ bắt đầu 1', async () => {
    const { env } = dung()
    await ghiSuKien(env, [sk('S1', '2026-09-29T10:00:00'), sk('S1', '2026-09-30T10:00:00')])
    expect(await docChuoiNgayHoc(env, 'S1', VN('2026-10-02T09:00:00'))).toBe(0)
    await ghiSuKien(env, [sk('S1', '2026-10-02T09:30:00')])
    expect(await docChuoiNgayHoc(env, 'S1', VN('2026-10-02T10:00:00'))).toBe(1)
  })
  it('múi giờ VN: làm lúc 23:30 VN (16:30 UTC) vẫn tính đúng ngày VN đó', async () => {
    const { env } = dung()
    await ghiSuKien(env, [sk('S1', '2026-09-29T23:30:00'), sk('S1', '2026-09-30T23:30:00')])
    // 00:20 VN 01/10 (= 17:20 UTC 30/09): hôm nay VN là 01/10, chưa làm ⇒ giữ 29 + 30 = 2.
    expect(await docChuoiNgayHoc(env, 'S1', VN('2026-10-01T00:20:00'))).toBe(2)
    // 23:40 VN 30/09: hôm nay VN là 30/09, đã làm ⇒ 2.
    expect(await docChuoiNgayHoc(env, 'S1', VN('2026-09-30T23:40:00'))).toBe(2)
  })
  it('câu bỏ trống (ket_qua NULL) không tính là đã học; em khác không lẫn', async () => {
    const { env } = dung()
    await ghiSuKien(env, [sk('S1', '2026-09-30T10:00:00', 'game', null), sk('S2', '2026-09-30T10:00:00')])
    expect(await docChuoiNgayHoc(env, 'S1', VN('2026-10-01T08:00:00'))).toBe(0)
    expect(await docChuoiNgayHoc(env, 'S2', VN('2026-10-01T08:00:00'))).toBe(1)
  })
})

describe('sanh2 trả `chuoiNgay`', () => {
  it('Sảnh Hoá 2.0 mang chuỗi ngày học của em', async () => {
    const { d, env } = dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('11064','Em','12A1','mk','x')")
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
    await ghiSuKien(env, [sk('11064', '2026-09-29T19:00:00'), sk('11064', '2026-09-30T21:00:00')])
    const r = await sanh2(env, '11064', VN('2026-10-01T06:30:00'))
    expect(r.chuoiNgay).toBe(2)
  })
})
