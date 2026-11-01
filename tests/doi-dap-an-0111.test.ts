// Đợt 2 đánh giá 99% (01/11): bộ đếm THUẦN của máy em (src/lib/doi-dap-an.ts) — đổi / dò đáp án, rời app ngay trước lựa chọn cuối, mã máy ngắn.
import { describe, expect, it } from 'vitest'
import { chotHanhVi, ghiAn, ghiChon, ghiHien, giayAnTruocChon, maMayNgan, taoDem } from '../src/lib/doi-dap-an'

describe('đổi / dò đáp án — Phần I', () => {
  it('chọn lần đầu không tính đổi; mỗi lần sang chữ khác +1; dq = số chữ khác nhau', () => {
    const d = taoDem('', 'I', 0)
    ghiChon(d, 'I', 'A', 1000)
    expect(chotHanhVi(d, 'I')).toMatchObject({ dd: 0, dq: 1 })
    ghiChon(d, 'I', 'C', 2000)
    ghiChon(d, 'I', 'A', 3000)
    ghiChon(d, 'I', 'D', 4000)
    expect(chotHanhVi(d, 'I')).toMatchObject({ dd: 3, dq: 3 }) // A→C→A→D: 3 lần đổi, thử 3 chữ ⇒ «dò đáp án»
  })
  it('bấm lại đúng chữ đang chọn / bỏ chọn rồi chọn lại chữ cũ không tính; giá trị lạ bị bỏ qua', () => {
    const d = taoDem('', 'I', 0)
    ghiChon(d, 'I', 'B', 1)
    ghiChon(d, 'I', 'B', 2)
    ghiChon(d, 'I', '', 3)
    ghiChon(d, 'I', 'B', 4)
    ghiChon(d, 'I', 'X', 5)
    ghiChon(d, 'I', 'AB', 6)
    expect(chotHanhVi(d, 'I')).toMatchObject({ dd: 0, dq: 1 })
  })
  it('đáp án nháp khôi phục là điểm xuất phát (không tính đổi), đổi khỏi nó thì tính', () => {
    const d = taoDem('B', 'I', 0)
    expect(chotHanhVi(d, 'I')).toEqual({ dd: 0, dq: 1, rn: 0 }) // chưa chọn ở lần mở này ⇒ không gửi ar
    ghiChon(d, 'I', 'C', 10)
    expect(chotHanhVi(d, 'I')).toMatchObject({ dd: 1, dq: 2, ar: 0 })
  })
})

describe('đổi đáp án — Phần II / III (chỉ đếm đổi, không có dq)', () => {
  it('Phần II: chọn ý mới không tính; đổi Đ↔S ở ý đã chọn +1', () => {
    const d = taoDem('', 'II', 0)
    ghiChon(d, 'II', 'D---', 1)
    ghiChon(d, 'II', 'DS--', 2)
    ghiChon(d, 'II', 'SS--', 3) // ý 1 đổi Đ→S
    ghiChon(d, 'II', 'SSDD', 4)
    ghiChon(d, 'II', 'SSDS', 5) // ý 4 đổi
    const k = chotHanhVi(d, 'II')
    expect(k.dd).toBe(2)
    expect(k.dq).toBeUndefined()
  })
  it('Phần III: gõ thêm không tính; một đợt xoá / sửa = một lần đổi', () => {
    const d = taoDem('', 'III', 0)
    for (const v of ['1', '12', '123']) ghiChon(d, 'III', v, 1)
    expect(d.dd).toBe(0)
    ghiChon(d, 'III', '12', 2)
    ghiChon(d, 'III', '1', 3) // vẫn cùng đợt xoá
    ghiChon(d, 'III', '15', 4)
    expect(d.dd).toBe(1)
    ghiChon(d, 'III', '', 5) // xoá hết = đợt mới
    ghiChon(d, 'III', '7', 6)
    ghiChon(d, 'III', '-7', 7) // đổi dấu = sửa
    expect(chotHanhVi(d, 'III')).toMatchObject({ dd: 3, rn: 0 })
    expect(chotHanhVi(d, 'III').dq).toBeUndefined()
  })
})

describe('rời app ngay trước lựa chọn cuối (ar) + số lần rời (rn)', () => {
  it('rời 10 giây rồi quay lại chọn ngay ⇒ ar = 10; rn đếm lần ẩn', () => {
    const d = taoDem('', 'I', 0)
    ghiChon(d, 'I', 'A', 1_000)
    ghiAn(d, 20_000); ghiHien(d, 30_000)
    ghiChon(d, 'I', 'C', 33_000)
    expect(chotHanhVi(d, 'I')).toMatchObject({ rn: 1, ar: 10, dd: 1, dq: 2 })
  })
  it('thông báo kéo ra lúc đang đọc đề, quay lại đọc tiếp > 30 giây rồi mới chọn ⇒ ar = 0, rn vẫn tính', () => {
    const d = taoDem('', 'I', 0)
    ghiAn(d, 2_000); ghiHien(d, 12_000)
    ghiChon(d, 'I', 'B', 50_000)
    expect(chotHanhVi(d, 'I')).toMatchObject({ rn: 1, ar: 0 })
  })
  it('chỉ phần lần ẩn nằm trong 30 giây trước lựa chọn được tính; nhiều lần ẩn cộng dồn; trần 30', () => {
    const d = taoDem('', 'I', 0)
    ghiAn(d, 10_000); ghiHien(d, 40_000) // 30 giây ẩn, 20 giây nằm trong cửa sổ [20 000, 50 000]
    ghiAn(d, 42_000); ghiHien(d, 45_000) // +3
    ghiChon(d, 'I', 'D', 50_000)
    expect(giayAnTruocChon(d)).toBe(23)
    const e = taoDem('', 'I', 0)
    ghiAn(e, 0); ghiHien(e, 100_000)
    ghiChon(e, 'I', 'A', 100_500)
    expect(giayAnTruocChon(e)).toBe(30)
  })
  it('ẩn hai lần liền (sự kiện lặp) chỉ tính một; hiện khi chưa ẩn không làm gì; chỉ giữ 8 khoảng gần nhất', () => {
    const d = taoDem('', 'I', 0)
    ghiAn(d, 1_000); ghiAn(d, 2_000); ghiHien(d, 3_000); ghiHien(d, 4_000)
    expect(d.rn).toBe(1)
    expect(d.an).toEqual([1_000, 3_000])
    for (let i = 0; i < 20; i++) { ghiAn(d, 10_000 + i * 1_000); ghiHien(d, 10_500 + i * 1_000) }
    expect(d.an.length).toBe(16)
    expect(d.rn).toBe(21)
  })
  it('màn đang ẩn lúc tạo bộ đếm ⇒ phần ẩn ấy vẫn được tính khi hiện lại', () => {
    const d = taoDem('', 'I', 5_000, true)
    ghiHien(d, 12_000)
    ghiChon(d, 'I', 'A', 14_000)
    expect(giayAnTruocChon(d)).toBe(7)
  })
})

describe('mã máy luyện tập ngắn (tb)', () => {
  it('bỏ dấu, ≤ 16 kí tự [A-Za-z0-9]; rỗng khi không có', () => {
    expect(maMayNgan('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe('3f2504e04f8911d3')
    expect(maMayNgan('')).toBe('')
    expect(maMayNgan('ab_c-d!')).toBe('abcd')
  })
  it('không truyền mã ⇒ lấy mã máy của luồng thi (ổn định giữa các lần gọi)', () => {
    const a = maMayNgan(), b = maMayNgan()
    expect(a).toMatch(/^[A-Za-z0-9]{1,16}$/)
    expect(b).toBe(a)
  })
  it('chotHanhVi chỉ gửi tb khi có', () => {
    const d = taoDem('', 'I', 0)
    expect(chotHanhVi(d, 'I', 'abc123')).toEqual({ dd: 0, dq: 0, rn: 0, tb: 'abc123' })
    expect(chotHanhVi(d, 'II', '')).toEqual({ dd: 0, rn: 0 })
  })
})
