// @vitest-environment node
// SẢNH HIỆN NGAY, LÀM TƯƠI Ở NỀN (31/10 — kiểu Duolingo): thầy sửa đề / giao bài / đổi cấu hình (phần CHUNG của dấu) ⇒ bản sẵn của em vẫn HIỆN NGAY, lập lại ở nền;
// em làm gì mới (phần RIÊNG) / ca kiểm tra đổi / câu nghi đáp án đổi / sang ngày mới ⇒ KHÔNG hiện bản cũ.
import { describe, expect, it } from 'vitest'
import { chuoiDau, hienDuocNgay, dungDuoc, type BanSanSang } from '../server/src/san-sang'

const KHOA = ['a', 's', 'g', 'lg', 'cl', 'kt', 'goi', 'gg', 'hs', 'pv', 'ch', 'kho', 'dk', 'ca', 'ng', 'bt', 'cd', 'cde', 'bdd']
const dong = (doi: Record<string, string> = {}) => Object.fromEntries(KHOA.map((k) => [k, doi[k] ?? `${k}0`]))
const ban = (dau: string, ngay = '2026-10-31') => ({ ngay, luc: 0, dau, sanh: { x: 1 }, chang: null }) as unknown as BanSanSang

describe('Sảnh hiện ngay khi chỉ phần chung đổi', () => {
  const goc = chuoiDau(dong())!
  it('dấu khớp đủ ⇒ hiện (và dùng được cho mở chặng)', () => {
    expect(hienDuocNgay(ban(goc), goc, '2026-10-31')).toBe(true)
    expect(dungDuoc(ban(goc), goc, '2026-10-31')).toBe(true)
  })
  for (const k of ['kho', 'dk', 'ch', 'gg', 'cd', 'bdd']) it(`phần chung «${k}» đổi ⇒ vẫn hiện ngay (mở chặng thì không)`, () => {
    const moi = chuoiDau(dong({ [k]: 'khac' }))!
    expect(hienDuocNgay(ban(goc), moi, '2026-10-31')).toBe(true)
    expect(dungDuoc(ban(goc), moi, '2026-10-31')).toBe(false)
  })
  for (const k of ['a', 's', 'g', 'kt', 'goi', 'hs', 'pv', 'bt', 'cde', 'ca', 'ng']) it(`«${k}» đổi ⇒ không hiện bản cũ`, () => {
    expect(hienDuocNgay(ban(goc), chuoiDau(dong({ [k]: 'khac' }))!, '2026-10-31')).toBe(false)
  })
  it('sang ngày mới / dấu đọc lỗi / khác phiên bản cách tính ⇒ không hiện', () => {
    expect(hienDuocNgay(ban(goc, '2026-10-30'), goc, '2026-10-31')).toBe(false)
    expect(hienDuocNgay(ban(goc), null, '2026-10-31')).toBe(false)
    expect(hienDuocNgay(ban('v4' + goc.slice(2)), goc, '2026-10-31')).toBe(false)
  })
})
