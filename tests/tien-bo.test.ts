// BIỂU ĐỒ TIẾN BỘ — khối đầu tiên trong hồ sơ mỗi em.
//
// Đây là chỗ thầy nhìn để kết luận "em đang lên hay đang xuống", nên sai ở đây
// là kết luận sai về một đứa trẻ. Hai luật: chưa đủ dữ liệu thì NÓI CHƯA ĐỦ, và
// mọi câu kết luận phải kèm con số.
import { describe, expect, it } from 'vitest'
import { chuoiTienBo, moc, NGUONG_LECH, nhanXetTienBo, trungBinhCongDon } from '../src/lib/tien-bo'
import type { HoSoEm } from '../src/lib/exam-api'

function ca(maCa: string, ngay: string, tong: number | null): HoSoEm['ca'][number] {
  return {
    maCa,
    tenCa: `Ca ${maCa}`,
    lop: '12',
    lanThu: 1,
    nopLuc: ngay,
    trangThai: 'da_nop',
    diemI: null,
    diemII: null,
    diemIII: null,
    tong,
    hang: 3,
    siSo: 30,
    soLanRoiMan: 0,
  }
}

describe('chuoiTienBo', () => {
  it('sắp cũ trước mới sau dù dữ liệu về lộn xộn', () => {
    const ds = chuoiTienBo([ca('c3', '2026-09-03T00:00:00Z', 8), ca('c1', '2026-09-01T00:00:00Z', 5), ca('c2', '2026-09-02T00:00:00Z', 6)])
    expect(ds.map((d) => d.maCa)).toEqual(['c1', 'c2', 'c3'])
  })

  it('BỎ ca chưa chấm — vẽ nó vào là bịa ra một cú tụt điểm không có thật', () => {
    const ds = chuoiTienBo([ca('c1', '2026-09-01T00:00:00Z', 5), ca('c2', '2026-09-02T00:00:00Z', null)])
    expect(ds.map((d) => d.maCa)).toEqual(['c1'])
  })

  it('danh sách rỗng không làm vỡ', () => {
    expect(chuoiTienBo([])).toEqual([])
  })
})

describe('trungBinhCongDon', () => {
  it('phần tử thứ i là trung bình từ đầu tới i', () => {
    expect(trungBinhCongDon([4, 6, 8])).toEqual([4, 5, 6])
  })

  it('làm tròn 2 chữ số, không ra số lẻ dài dằng dặc', () => {
    expect(trungBinhCongDon([5, 6])).toEqual([5, 5.5])
    expect(trungBinhCongDon([1, 2, 2])).toEqual([1, 1.5, 1.67])
  })
})

describe('nhanXetTienBo', () => {
  const d = (xs: number[]) => xs.map((v, i) => ({ maCa: `c${i}`, tenCa: '', ngay: `2026-09-0${i + 1}T00:00:00Z`, diem: v, hang: null, siSo: null }))

  it('chưa có bài hoặc mới 1 bài thì NÓI THẲNG là chưa đủ, không vẽ mũi tên', () => {
    expect(nhanXetTienBo([]).chieu).toBe('chua_du')
    expect(nhanXetTienBo(d([6])).chieu).toBe('chua_du')
    expect(nhanXetTienBo(d([6])).lech).toBeNull()
  })

  it('điểm tăng rõ thì kết luận đang lên, kèm đúng số chênh lệch', () => {
    const r = nhanXetTienBo(d([3, 4, 7, 8]))
    expect(r.chieu).toBe('len')
    expect(r.lech).toBeCloseTo(4, 5)
    expect(r.cau).toContain('tăng')
    expect(r.cau).toMatch(/\d/)
  })

  it('điểm giảm rõ thì kết luận đang xuống', () => {
    const r = nhanXetTienBo(d([9, 8, 4, 3]))
    expect(r.chieu).toBe('xuong')
    expect(r.cau).toContain('giảm')
  })

  it('dao động nhỏ hơn ngưỡng thì coi là đi ngang, KHÔNG thổi thành tiến bộ', () => {
    const r = nhanXetTienBo(d([6, 6.2, 6.1, 6.3]))
    expect(r.chieu).toBe('deu')
    expect(Math.abs(r.lech as number)).toBeLessThan(NGUONG_LECH)
  })

  it('đúng hai bài thì so bài sau với bài trước', () => {
    expect(nhanXetTienBo(d([4, 8])).chieu).toBe('len')
    expect(nhanXetTienBo(d([8, 4])).chieu).toBe('xuong')
  })

  it('mọi kết luận đều kèm con số', () => {
    for (const xs of [[4, 8], [3, 4, 7, 8], [9, 8, 4, 3], [6, 6.2, 6.1, 6.3]]) {
      expect(nhanXetTienBo(d(xs)).cau).toMatch(/\d/)
    }
  })
})

describe('moc', () => {
  const d = (xs: number[]) => xs.map((v, i) => ({ maCa: `c${i}`, tenCa: '', ngay: '', diem: v, hang: null, siSo: null }))

  it('tìm đúng bài cao nhất và thấp nhất', () => {
    const m = moc(d([5, 9, 2, 7]))
    expect(m.cao?.diem).toBe(9)
    expect(m.thap?.diem).toBe(2)
  })

  it('rỗng thì trả null chứ không trả bài giả', () => {
    expect(moc([])).toEqual({ cao: null, thap: null })
  })
})
