// GỌI LÊN BẢNG — khoá đúng những chỗ sai là thầy chỉ phát hiện lúc đứng lớp.
import { describe, expect, it } from 'vitest'
import { chuanChuyenDe, chuyenDeYeuNhat, phanCongCauHoi, bangPhanCongChu, type CauCoTheGoi, type EmDeGoi } from '../src/lib/goi-len-bang'

const cau = (id: string, phan: 'I' | 'II' | 'III', so: number, chuyenDe: string, mucDo?: 'biet' | 'hieu' | 'van_dung'): CauCoTheGoi => ({
  id,
  phan,
  so,
  chuyenDe,
  mucDo,
  tomTat: `câu ${so}`,
})

const KHO: CauCoTheGoi[] = [
  cau('a1', 'I', 1, 'Ester – lipid', 'biet'),
  cau('a2', 'I', 2, 'Ester – lipid', 'van_dung'),
  cau('a3', 'I', 3, 'Ester – lipid', 'hieu'),
  cau('b1', 'I', 4, 'Carbohydrate', 'hieu'),
  cau('c1', 'III', 5, 'Polymer', 'van_dung'),
]

const em = (sbd: string, hoTen: string, cd: EmDeGoi['chuyenDeCaGanNhat']): EmDeGoi => ({ sbd, hoTen, chuyenDeCaGanNhat: cd })

describe('Chuyên đề yếu nhất', () => {
  it('lấy chuyên đề sai NHIỀU CÂU nhất', () => {
    const e = em('1', 'A', [
      { ten: 'Ester – lipid', soCau: 10, soSai: 4 },
      { ten: 'Carbohydrate', soCau: 4, soSai: 2 },
    ])
    expect(chuyenDeYeuNhat(e)?.ten).toBe('Ester – lipid')
  })

  it('bằng số câu sai thì lấy chuyên đề có tỉ lệ sai cao hơn', () => {
    const e = em('1', 'A', [
      { ten: 'Ester – lipid', soCau: 10, soSai: 3 },
      { ten: 'Carbohydrate', soCau: 4, soSai: 3 },
    ])
    expect(chuyenDeYeuNhat(e)?.ten).toBe('Carbohydrate')
  })

  it('chuyên đề không sai câu nào thì bỏ qua — chữa chỗ em làm đúng là phí giờ', () => {
    const e = em('1', 'A', [{ ten: 'Ester – lipid', soCau: 10, soSai: 0 }])
    expect(chuyenDeYeuNhat(e)).toBeNull()
  })

  it('chưa thi ca nào thì trả null, KHÔNG đoán', () => {
    expect(chuyenDeYeuNhat(em('1', 'A', []))).toBeNull()
  })
})

describe('So tên chuyên đề', () => {
  it('gạch en và gạch thường là một', () => {
    expect(chuanChuyenDe('Ester – lipid')).toBe(chuanChuyenDe('Ester - lipid'))
  })
  it('bỏ dấu và không phân biệt hoa thường', () => {
    expect(chuanChuyenDe('ĐẠI CƯƠNG kim loại')).toBe(chuanChuyenDe('Đại cương Kim Loại'))
  })
})

describe('Phân công câu lên bảng', () => {
  it('mỗi em nhận câu ĐÚNG chuyên đề mình yếu', () => {
    const ds = [
      em('1', 'An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
      em('2', 'Bình', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
    ]
    const kq = phanCongCauHoi(ds, KHO)
    expect(kq[0].cau?.chuyenDe).toBe('Ester – lipid')
    expect(kq[1].cau?.chuyenDe).toBe('Carbohydrate')
    expect(kq.every((p) => p.lyDo === 'dung_chuyen_de_yeu')).toBe(true)
  })

  it('KHÔNG hai em cùng một câu', () => {
    const ds = ['An', 'Bình', 'Chi'].map((t, i) => em(String(i + 1), t, [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]))
    const kq = phanCongCauHoi(ds, KHO)
    const ids = kq.map((p) => p.cau?.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('ưu tiên câu KHÓ hơn lên bảng', () => {
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }])], KHO)
    expect(kq[0].cau?.mucDo).toBe('van_dung')
  })

  // Đây là chỗ dễ hỏng nhất: em yếu chuyên đề hiếm câu mà bị xếp sau thì mất
  // câu cuối cùng vào tay em có cả chục câu để chọn.
  it('em yếu chuyên đề hiếm câu được ưu tiên, dù tích sau', () => {
    const ds = [
      em('1', 'Nhiều lựa chọn', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
      em('2', 'Ít lựa chọn', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
    ]
    // chỉ còn ĐÚNG MỘT câu Carbohydrate trong đề
    const kq = phanCongCauHoi(ds, KHO)
    expect(kq[1].cau?.chuyenDe).toBe('Carbohydrate')
    expect(kq[1].lyDo).toBe('dung_chuyen_de_yeu')
  })

  it('đề không có chuyên đề đó thì NÓI THẲNG, không im lặng đưa câu lạc đề', () => {
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Pin điện và điện phân', soCau: 5, soSai: 3 }])], KHO)
    expect(kq[0].lyDo).toBe('de_khong_co_chuyen_de_nay')
    expect(kq[0].ghiChu).toContain('Pin điện và điện phân')
    expect(kq[0].cau).not.toBeNull()
  })

  it('em chưa có dữ liệu thì ghi rõ, không đoán chuyên đề', () => {
    const kq = phanCongCauHoi([em('9', 'Mới', [])], KHO)
    expect(kq[0].lyDo).toBe('chua_co_du_lieu')
    expect(kq[0].chuyenDeYeu).toBeNull()
    expect(kq[0].cau).toBeNull()
  })

  it('giữ ĐÚNG thứ tự thầy tích, không phải thứ tự nội bộ của thuật toán', () => {
    const ds = [
      em('1', 'An', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
      em('2', 'Bình', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
    ]
    expect(phanCongCauHoi(ds, KHO).map((p) => p.sbd)).toEqual(['1', '2'])
  })

  it('nhiều em hơn số câu thì em cuối không có câu, chứ không trùng câu', () => {
    const ds = Array.from({ length: 7 }, (_, i) => em(String(i), `Em ${i}`, [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]))
    const kq = phanCongCauHoi(ds, KHO)
    const co = kq.filter((p) => p.cau)
    expect(co.length).toBe(KHO.length)
    expect(new Set(co.map((p) => p.cau!.id)).size).toBe(KHO.length)
  })
})

describe('Bảng chữ để copy', () => {
  it('có tên em, phần và số câu, chuyên đề kèm số câu sai', () => {
    const kq = phanCongCauHoi([em('1', 'Nguyễn An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }])], KHO)
    const t = bangPhanCongChu(kq, '12-C1-B1')
    expect(t).toContain('12-C1-B1')
    expect(t).toContain('Nguyễn An')
    expect(t).toContain('Phần I câu 2')
    expect(t).toContain('sai 4/10')
  })
})
