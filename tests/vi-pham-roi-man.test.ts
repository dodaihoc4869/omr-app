// BẰNG CHỨNG RỜI MÀN — số trong báo cáo gửi phụ huynh phải khớp nhật ký thô.
//
// Đây là chỗ dễ sai nhất trong cả tính năng: chuyển tab bắn CẢ `hidden` lẫn
// `blur`, quay lại bắn cả `visible` lẫn `focus`. Đếm thẳng là ra gấp đôi số
// lần, và phụ huynh nhận một con số sai về con mình.
import { describe, expect, it } from 'vitest'
import { mocRoiMan } from '../src/lib/chong-gian-lan'
import { dungViPham, MOC_TOI_DA } from '../src/lib/phieu-du-lieu'

const t = (s: number) => new Date(Date.UTC(2026, 8, 4, 8, 0, s)).toISOString()

describe('mocRoiMan', () => {
  it('gộp hidden + blur cùng một lần rời thành MỘT mốc', () => {
    const m = mocRoiMan([
      { type: 'hidden', at: t(10) },
      { type: 'blur', at: t(10) },
      { type: 'visible', at: t(25) },
      { type: 'focus', at: t(25) },
    ])
    expect(m).toEqual([{ luc: t(10), giay: 15 }])
  })

  it('đếm đúng nhiều lần rời liên tiếp', () => {
    const m = mocRoiMan([
      { type: 'blur', at: t(5) },
      { type: 'focus', at: t(9) },
      { type: 'hidden', at: t(30) },
      { type: 'visible', at: t(90) },
    ])
    expect(m.map((x) => x.giay)).toEqual([4, 60])
  })

  it('lần rời còn dở (không quay lại) vẫn ghi mốc, giây = null — không bịa số', () => {
    const m = mocRoiMan([{ type: 'hidden', at: t(12) }])
    expect(m).toEqual([{ luc: t(12), giay: null }])
  })

  it('sự kiện rỗng, null, hoặc giờ hỏng thì trả mảng rỗng chứ không ném lỗi', () => {
    expect(mocRoiMan(null)).toEqual([])
    expect(mocRoiMan([])).toEqual([])
    expect(mocRoiMan([{ type: 'hidden', at: 'không phải giờ' }])).toEqual([])
  })

  it('visible thừa lúc đang ở trong bài thì bỏ qua, không đẻ mốc âm', () => {
    const m = mocRoiMan([
      { type: 'focus', at: t(1) },
      { type: 'visible', at: t(2) },
      { type: 'blur', at: t(3) },
      { type: 'focus', at: t(8) },
    ])
    expect(m).toEqual([{ luc: t(3), giay: 5 }])
  })
})

describe('dungViPham', () => {
  it('KHÔNG rời màn lần nào và không bị khoá thì trả null — báo cáo không mọc nút Vi phạm rỗng', () => {
    expect(dungViPham(null)).toBeNull()
    expect(dungViPham({ soLan: 0, tongGiay: 0, daKhoa: false })).toBeNull()
  })

  it('bài bị khoá thì luôn có khối bằng chứng, kể cả khi số lần về 0', () => {
    const v = dungViPham({ soLan: 0, tongGiay: 0, daKhoa: true, lyDoKhoa: 'roi_qua_lau' })
    expect(v).not.toBeNull()
    expect(v!.daKhoa).toBe(true)
    expect(v!.lyDoKhoa).toBe('roi_qua_lau')
  })

  it('giữ nguyên số lần và số giây thầy đo được, kèm mốc từng lần', () => {
    const v = dungViPham({
      soLan: 2,
      tongGiay: 47,
      daKhoa: false,
      nguong: { lan: 3, giay: 10 },
      events: [
        { type: 'hidden', at: t(10) },
        { type: 'visible', at: t(25) },
        { type: 'blur', at: t(40) },
        { type: 'focus', at: t(72) },
      ],
    })
    expect(v!.soLan).toBe(2)
    expect(v!.tongGiay).toBe(47)
    expect(v!.nguong).toEqual({ lan: 3, giay: 10 })
    expect(v!.moc.map((m) => m.giay)).toEqual([15, 32])
  })

  it('nhật ký quá dài thì cắt và NÓI RA số mốc đã cắt', () => {
    const ev: { type: string; at: string }[] = []
    for (let i = 0; i < MOC_TOI_DA + 7; i++) {
      ev.push({ type: 'hidden', at: t(i * 4) }, { type: 'visible', at: t(i * 4 + 1) })
    }
    const v = dungViPham({ soLan: MOC_TOI_DA + 7, tongGiay: 999, daKhoa: false, events: ev })
    expect(v!.moc).toHaveLength(MOC_TOI_DA)
    expect(v!.mocBiCat).toBe(7)
  })
})
