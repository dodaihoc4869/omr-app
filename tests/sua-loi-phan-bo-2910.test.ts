// @vitest-environment node
// SỬA LỖI 12–36 CÂU/NGÀY (thầy 29/10) — phần tính thuần: số câu mỗi ngày + cách chọn câu (đủ dạng, đủ mức, câu cũ trước).
import { describe, expect, it } from 'vitest'
import { bacMucSua, chonViecSuaNgay, soCauSuaNgay, SUA_NGAY_TOI_DA, SUA_NGAY_TOI_THIEU, type UngVienSua } from '../server/src/sua-loi-phan-bo'

const NAY = Date.parse('2026-10-29T03:00:00Z') // 10:00 VN 29/10
const NGAY = 86_400_000

describe('soCauSuaNgay: kẹp 12…36, ⌈0,8 × tổng / 12⌉', () => {
  it('ít câu ⇒ tối thiểu 12; ranh giới 12/13', () => {
    expect(soCauSuaNgay({ can: 0, cho: 0, daSua: 0 })).toBe(12)
    expect(soCauSuaNgay({ can: 157, cho: 0, daSua: 0 })).toBe(11 > SUA_NGAY_TOI_THIEU ? 11 : 12) // 157/15 = 10,5 ⇒ 11 ⇒ kẹp lên 12
    expect(soCauSuaNgay({ can: 180, cho: 0, daSua: 0 })).toBe(12) // 180/15 = 12
    expect(soCauSuaNgay({ can: 181, cho: 0, daSua: 0 })).toBe(13)
  })
  it('đếm cả câu chờ gặp lại và câu đã sửa gần đây', () => {
    expect(soCauSuaNgay({ can: 100, cho: 100, daSua: 100 })).toBe(20) // 300/15
  })
  it('trần 36 (540 câu trở lên), không bao giờ vượt', () => {
    expect(soCauSuaNgay({ can: 540, cho: 0, daSua: 0 })).toBe(36)
    expect(soCauSuaNgay({ can: 541, cho: 0, daSua: 0 })).toBe(36)
    expect(soCauSuaNgay({ can: 5000, cho: 0, daSua: 0 })).toBe(SUA_NGAY_TOI_DA)
  })
  it('đầu vào hỏng (âm / lẻ) không ra số lạ', () => {
    expect(soCauSuaNgay({ can: -5, cho: 2.9, daSua: 0 })).toBe(12)
  })
})

describe('cam kết: trong 12 ngày sửa xong ≥ 80% số câu sai đang có (khi chưa chạm trần 36)', () => {
  // Mô phỏng: mỗi ngày sửa đúng N câu cũ nhất; câu sai mới đến cuối ngày; F = câu đã sửa trong 11 ngày trước.
  function chay(b0: number, moiMoiNgay: (ngay: number) => number) {
    const cau: { den: number; xong: number | null }[] = Array.from({ length: b0 }, () => ({ den: 0, xong: null }))
    for (let t = 0; t < 12; t++) {
      const con = cau.filter((c) => c.xong === null && c.den <= t)
      const daSua = cau.filter((c) => c.xong !== null && t - c.xong <= 11).length
      const n = soCauSuaNgay({ can: con.length, cho: 0, daSua })
      for (const c of con.slice(0, n)) c.xong = t // con đã xếp cũ → mới
      for (let k = 0; k < moiMoiNgay(t); k++) cau.push({ den: t + 1, xong: null })
    }
    const goc = cau.filter((c) => c.den === 0)
    return goc.filter((c) => c.xong !== null).length / goc.length
  }
  for (const b0 of [30, 100, 157, 250, 400, 530]) {
    it(`tồn ${b0} câu, không câu sai mới ⇒ xong ≥ 80%`, () => { expect(chay(b0, () => 0)).toBeGreaterThanOrEqual(0.8) })
    it(`tồn ${b0} câu, mỗi ngày sai thêm 0–6 câu ⇒ vẫn xong ≥ 80% số câu có từ đầu`, () => { expect(chay(b0, (t) => (t * 5) % 7)).toBeGreaterThanOrEqual(0.8) })
  }
  it('mỗi ngày số câu tự tính lại: sai nhiều thêm ⇒ N hôm sau tăng', () => {
    const truoc = soCauSuaNgay({ can: 200, cho: 0, daSua: 20 })
    const sau = soCauSuaNgay({ can: 200 - 14 + 80, cho: 0, daSua: 20 + 14 })
    expect(sau).toBeGreaterThan(truoc)
  })
})

let dem = 0
const cau = (dang: string, muc: number, tuoiNgay: number | null, khac: Partial<UngVienSua> = {}): UngVienSua => {
  const k = ++dem
  return { d: `D${k}`, q: `Q${k}`, t: 'can_chan_doan', h: '', lan: 0, sai: tuoiNgay === null ? 0 : NAY - tuoiNgay * NGAY, dang, muc, ...khac }
}

describe('chonViecSuaNgay: độ phủ kiến thức + mức độ + câu cũ trước', () => {
  it('mọi dạng đã sai có mặt trước khi dạng nào được chọn lần hai (dạng lớn không nuốt cả ngày)', () => {
    dem = 0
    const ung = [
      ...Array.from({ length: 40 }, (_, i) => cau('Amine', i % 4, 30 - (i % 20))),
      ...['Este', 'Lipit', 'Peptit', 'Polime', 'Kim loại', 'Điện phân', 'Axit', 'Bazơ'].flatMap((d) => [cau(d, 0, 5), cau(d, 2, 3)]),
    ]
    const ra = chonViecSuaNgay(ung, 12, NAY)
    expect(ra).toHaveLength(12)
    expect(new Set(ra.map((x) => x.dang)).size).toBe(9) // 9 dạng, mỗi dạng ≥ 1
    expect(ra.filter((x) => x.dang === 'Amine').length).toBeLessThanOrEqual(4)
    expect(new Set(ra.map((x) => x.d)).size).toBe(12) // không trùng
  })
  it('đủ các mức: 12 dạng × 4 mức ⇒ chọn 12 câu ra 3 câu mỗi mức', () => {
    dem = 0
    const ung = Array.from({ length: 12 }, (_, g) => [0, 1, 2, 3].map((m) => cau(`D${g}`, m, 4 + m))).flat()
    const ra = chonViecSuaNgay(ung, 12, NAY)
    expect([0, 1, 2, 3].map((m) => ra.filter((x) => x.muc === m).length)).toEqual([3, 3, 3, 3])
  })
  it('hết dạng mới thì quay vòng: 3 dạng, 12 câu ⇒ mỗi dạng 4 câu', () => {
    dem = 0
    const ung = ['A', 'B', 'C'].flatMap((d) => Array.from({ length: 10 }, (_, i) => cau(d, i % 4, 10 + i)))
    const ra = chonViecSuaNgay(ung, 12, NAY)
    expect(['A', 'B', 'C'].map((d) => ra.filter((x) => x.dang === d).length)).toEqual([4, 4, 4])
  })
  it('chưa sửa được hôm qua ⇒ hôm sau lên đầu: câu sai lâu nhất trước, câu vừa sai HÔM NAY xuống cuối', () => {
    dem = 0
    const cu = cau('A', 1, 20), giua = cau('A', 1, 6), homNay = cau('A', 1, 0.2), khongRo = cau('A', 1, null)
    const ra = chonViecSuaNgay([homNay, giua, khongRo, cu], 4, NAY)
    expect(ra.map((x) => x.d)).toEqual([cu.d, giua.d, khongRo.d, homNay.d])
  })
  it('câu đã sửa dở (gặp lại ≥ 1) đứng trước câu mới cùng tuổi', () => {
    dem = 0
    const moi = cau('A', 1, 10), dangDo = cau('A', 1, 10, { lan: 1, t: 'cho_gap_lai_2', h: '2026-10-28' })
    expect(chonViecSuaNgay([moi, dangDo], 1, NAY).map((x) => x.d)).toEqual([dangDo.d])
  })
  it('ít câu hơn mục tiêu ⇒ trả đúng số có; n ≤ 0 hoặc rỗng ⇒ rỗng', () => {
    dem = 0
    expect(chonViecSuaNgay([cau('A', 0, 3), cau('B', 1, 3)], 12, NAY)).toHaveLength(2)
    expect(chonViecSuaNgay([cau('A', 0, 3)], 0, NAY)).toEqual([])
    expect(chonViecSuaNgay([], 12, NAY)).toEqual([])
  })
  it('bù thêm cho danh sách đã có: không chọn lại câu đã có; dạng đã có nhiều câu nhường dạng khác', () => {
    dem = 0
    const daCo = Array.from({ length: 6 }, (_, i) => cau('A', i % 4, 9 + i))
    const ung = [...daCo, ...Array.from({ length: 10 }, (_, i) => cau('A', i % 4, 3)), ...['B', 'C', 'D'].map((d) => cau(d, 1, 2))]
    const ra = chonViecSuaNgay(ung, 3, NAY, daCo)
    expect(ra.map((x) => x.dang).sort()).toEqual(['B', 'C', 'D'])
    expect(ra.some((x) => daCo.some((c) => c.d === x.d))).toBe(false)
  })
  it('xác định: cùng dữ liệu ⇒ cùng danh sách (hai máy cùng ngày không lệch), kể cả đảo thứ tự đầu vào', () => {
    dem = 0
    const ung = Array.from({ length: 50 }, (_, i) => cau(`D${i % 7}`, i % 4, 1 + (i % 13)))
    const a = chonViecSuaNgay(ung, 20, NAY).map((x) => x.d)
    const b = chonViecSuaNgay([...ung].reverse(), 20, NAY).map((x) => x.d)
    expect(b).toEqual(a)
  })
  it('mức không rõ chỉ được chọn khi nhóm hết câu biết mức', () => {
    dem = 0
    const khong = cau('A', -1, 30), biet = cau('A', 2, 1)
    expect(chonViecSuaNgay([khong, biet], 1, NAY).map((x) => x.d)).toEqual([biet.d])
  })
  it('hiệu năng: 2000 câu, chọn 36 dưới 100 ms', () => {
    dem = 0
    const ung = Array.from({ length: 2000 }, (_, i) => cau(`D${i % 60}`, i % 4, i % 40))
    const t0 = performance.now()
    expect(chonViecSuaNgay(ung, 36, NAY)).toHaveLength(36)
    expect(performance.now() - t0).toBeLessThan(100)
  })
})

describe('bacMucSua', () => {
  it('đọc mọi cách viết mức độ của kho câu; lạ ⇒ -1', () => {
    expect(['NB', 'Thông hiểu', 'van_dung', 'VDC'].map(bacMucSua)).toEqual([0, 1, 2, 3])
    expect([null, '', 'xyz', 5].map(bacMucSua)).toEqual([-1, -1, -1, -1])
  })
})
