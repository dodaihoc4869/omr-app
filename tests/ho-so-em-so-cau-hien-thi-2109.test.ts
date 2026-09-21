// Hồ sơ em (màn thầy) — dòng "Đã làm N câu hôm nay" ở kế hoạch của em đọc MỘT định nghĩa câu đã làm (`soCauDaLamHienThi`, src/lib/so-cau-hien-thi.ts; Boss 21/09, đề bài
// prompt-mot-dinh-nghia-cau-da-lam-2109.md): cùng con số với ô Thi đua và thẻ Hôm nay của em. Máy chủ cũ (chưa có soCauHienThi) ⇒ rơi về daLamCau như trước.
import { describe, expect, it } from 'vitest'
import { tomTatKeHoach, type KeHoachEm } from '../src/lib/ho-so-em-thay'

const kh = (tienBo: KeHoachEm['tienBo']): KeHoachEm => ({ ngay: '2026-09-21', nganSach: { mucTieuCau: 8 }, viec: [], tienBo })

describe('tomTatKeHoach — "Đã làm N câu hôm nay" theo MỘT định nghĩa', () => {
  it('có soCauHienThi ⇒ dùng nó (78), không dùng daLamCau rộng hơn (93: cả câu bỏ trống, cả ngày)', () => {
    expect(tomTatKeHoach(kh({ daLamCau: 93, soCauHienThi: 78 })).tienDo).toBe('Đã làm 78 câu hôm nay')
  })
  it('soCauHienThi = 0 là ĐÚNG (em chưa trả lời câu nào) ⇒ không rơi về daLamCau', () => {
    expect(tomTatKeHoach(kh({ daLamCau: 5, soCauHienThi: 0 })).tienDo).toBe('Đã làm 0 câu hôm nay')
  })
  it('máy chủ cũ (không soCauHienThi) ⇒ daLamCau như trước; kèm số câu lên bậc khi có', () => {
    expect(tomTatKeHoach(kh({ daLamCau: 12, lenBac: 3 })).tienDo).toBe('Đã làm 12 câu hôm nay · 3 câu lên bậc')
  })
  it('trường hỏng ⇒ rơi về daLamCau; không có số nào ⇒ không dòng tiến độ (không bịa 0)', () => {
    expect(tomTatKeHoach(kh({ daLamCau: 7, soCauHienThi: -1 as unknown as number })).tienDo).toBe('Đã làm 7 câu hôm nay')
    expect(tomTatKeHoach(kh({ lenBac: 2 })).tienDo).toBe('')
    expect(tomTatKeHoach(kh(undefined)).tienDo).toBe('')
  })
})
