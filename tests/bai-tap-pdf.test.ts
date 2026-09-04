// PHIẾU BÀI TẬP RIÊNG (PDF) — chọn câu và bậc tiến bộ.
//
// Ba luật phải giữ, sai cái nào cũng thành "phát cho em một tờ giấy vô dụng":
//   1. Chỉ lấy câu thuộc chuyên đề em đang yếu.
//   2. Ưu tiên câu em CHƯA làm; phải lấy lại câu cũ thì nói ra bằng con số.
//   3. Câu có hình bị loại — in ra không có hình là câu không làm được.
import { describe, expect, it } from 'vitest'
import { chonCauLuyen, chuThuan, mucKhoiDiem, tenTepBaiTap, thangBac } from '../src/lib/bai-tap-pdf'
import type { TeacherExamSource } from '../src/data/examContent'

function mcq(id: string, chuyenDe: string, mucDo: string, hinh = false) {
  return {
    id,
    text: `Câu ${id}`,
    choices: ['A1', 'B1', 'C1', 'D1'] as [string, string, string, string],
    correct: 'A' as const,
    chuyenDe,
    mucDo: mucDo as 'biet' | 'hieu' | 'van_dung',
    loiGiai: { chot: `Chốt ${id}` },
    ...(hinh ? { thanCauImg: 'data:image/png;base64,AAAA' } : {}),
  }
}

const nguon: TeacherExamSource[] = [
  {
    maDe: 'X',
    phanI: [
      mcq('b1', 'Ester – lipid', 'biet'),
      mcq('b2', 'Ester – lipid', 'biet'),
      mcq('b3', 'Ester – lipid', 'biet'),
      mcq('h1', 'Ester – lipid', 'hieu'),
      mcq('h2', 'Ester – lipid', 'hieu'),
      mcq('h3', 'Ester – lipid', 'hieu'),
      mcq('v1', 'Ester – lipid', 'van_dung'),
      mcq('v2', 'Ester – lipid', 'van_dung'),
      mcq('v3', 'Ester – lipid', 'van_dung'),
      mcq('v4', 'Ester – lipid', 'van_dung'),
      mcq('kh1', 'Carbohydrate', 'biet'),
      mcq('kh2', 'Carbohydrate', 'hieu'),
      mcq('hinh1', 'Ester – lipid', 'biet', true),
    ],
    phanII: [],
    phanIII: [],
  },
]

const deu = () => 0.5

describe('mucKhoiDiem', () => {
  it('sai càng nhiều thì bắt đầu càng thấp', () => {
    expect(mucKhoiDiem(0.9)).toBe('biet')
    expect(mucKhoiDiem(0.6)).toBe('biet')
    expect(mucKhoiDiem(0.45)).toBe('hieu')
    expect(mucKhoiDiem(0.3)).toBe('hieu')
    expect(mucKhoiDiem(0.1)).toBe('van_dung')
  })
})

describe('thangBac', () => {
  it('trong một phiếu đi từ dễ lên khó, quá nửa ở mức khởi điểm', () => {
    const b = thangBac('biet', 10)
    expect(b).toHaveLength(10)
    expect(b.filter((x) => x === 'biet').length).toBe(5)
    expect(b[0]).toBe('biet')
    expect(b[9]).toBe('van_dung')
  })

  it('khởi điểm đã là vận dụng thì không tràn ra ngoài thang', () => {
    expect(new Set(thangBac('van_dung', 6))).toEqual(new Set(['van_dung']))
  })
})

describe('chonCauLuyen', () => {
  it('chỉ lấy câu thuộc chuyên đề đang yếu', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], soCau: 6, ngauNhien: deu })
    expect(kq.cau.every((c) => c.chuyenDe === 'Ester – lipid')).toBe(true)
  })

  it('LOẠI câu có hình — in ra không có hình là câu không làm được', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], soCau: 10, ngauNhien: deu })
    expect(kq.cau.some((c) => c.id === 'hinh1')).toBe(false)
  })

  it('không lấy trùng một câu hai lần trong cùng phiếu', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], soCau: 10, ngauNhien: deu })
    expect(new Set(kq.cau.map((c) => c.id)).size).toBe(kq.cau.length)
  })

  it('tránh câu em đã làm khi kho còn câu mới', () => {
    const daLam = ['b1', 'b2', 'h1']
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], qidDaLam: daLam, soCau: 5, ngauNhien: deu })
    expect(kq.cau.some((c) => daLam.includes(c.id))).toBe(false)
    expect(kq.lapLai).toBe(0)
  })

  it('kho hết câu mới thì ĐẾM ĐÚNG số câu phải lấy lại, không im lặng', () => {
    const tatCa = ['b1', 'b2', 'b3', 'h1', 'h2', 'h3', 'v1', 'v2', 'v3', 'v4']
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], qidDaLam: tatCa, soCau: 5, ngauNhien: deu })
    expect(kq.cau).toHaveLength(5)
    expect(kq.lapLai).toBe(5)
  })

  it('kho không đủ câu thì báo THIẾU bao nhiêu, không dựng câu giả', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Carbohydrate', tiLeSai: 0.8 }], soCau: 6, ngauNhien: deu })
    expect(kq.cau).toHaveLength(2)
    expect(kq.thieu).toBe(4)
  })

  it('câu trong phiếu xếp từ nhận biết lên vận dụng', () => {
    const bac = { biet: 0, hieu: 1, van_dung: 2 } as Record<string, number>
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], soCau: 8, ngauNhien: deu })
    const so = kq.cau.map((c) => bac[c.mucDo] ?? 0)
    expect([...so].sort((a, b) => a - b)).toEqual(so)
  })

  it('em yếu nặng bắt đầu bằng nhận biết, em yếu nhẹ bắt đầu cao hơn', () => {
    const nang = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.85 }], soCau: 4, ngauNhien: deu })
    const nhe = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.1 }], soCau: 4, ngauNhien: deu })
    expect(nang.cau[0].mucDo).toBe('biet')
    expect(nhe.cau.every((c) => c.mucDo === 'van_dung')).toBe(true)
  })

  it('mang theo đáp án và lời giải để in phần chữa', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.8 }], soCau: 2, ngauNhien: deu })
    expect(kq.cau[0].dapAn).toBe('A')
    expect(kq.cau[0].chot).toContain('Chốt')
    expect(kq.cau[0].luaChon).toHaveLength(4)
  })

  it('chưa có chuyên đề yếu nào thì rút từ cả kho, không trả phiếu rỗng', () => {
    const kq = chonCauLuyen(nguon, { chuyenDe: [], soCau: 4, ngauNhien: deu })
    expect(kq.cau).toHaveLength(4)
  })
})

describe('chuThuan — đưa công thức về chữ in được', () => {
  it('bỏ đánh dấu mhchem, GIỮ NGUYÊN công thức', () => {
    expect(chuThuan('Cho $\\ce{H2SO4}$ tác dụng')).toBe('Cho H2SO4 tác dụng')
    expect(chuThuan('$\\ce{CH3COOC2H5}$')).toBe('CH3COOC2H5')
  })

  it('đổi mũi tên và dấu nhân sang ký tự đọc được', () => {
    expect(chuThuan('A \\to B')).toBe('A → B')
    expect(chuThuan('2 \\times 3')).toBe('2 × 3')
  })

  it('không làm mất chữ thường', () => {
    const s = 'Ester nào sau đây có mùi chuối chín?'
    expect(chuThuan(s)).toBe(s)
  })

  it('chuỗi rỗng hoặc thiếu không làm vỡ', () => {
    expect(chuThuan('')).toBe('')
    expect(chuThuan(undefined as unknown as string)).toBe('')
  })
})

describe('tenTepBaiTap', () => {
  it('bỏ dấu tiếng Việt, ghép ngày, đuôi .pdf', () => {
    expect(tenTepBaiTap('Nguyễn Thị Hồng Nhung', '12034', new Date('2026-09-04T03:00:00Z'))).toBe('baitap-Nguyen-Thi-Hong-Nhung-20260904.pdf')
  })

  it('em chưa có tên thì lấy số báo danh', () => {
    expect(tenTepBaiTap('', '12050', new Date('2026-09-04T03:00:00Z'))).toBe('baitap-SBD-12050-20260904.pdf')
  })
})
