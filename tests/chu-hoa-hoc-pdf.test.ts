// IN CÔNG THỨC HOÁ HỌC RA PDF.
//
// Bản đầu in thẳng chuỗi thô, ra giấy thành `CH3COOC2H5 + NaOH ->[t^o] ...`.
// Thầy bắt được ngay khi thử. Sai kiểu này nguy hiểm hơn sai bố cục: em cầm
// phiếu về học theo đúng cái sai đó.
import { describe, expect, it } from 'vitest'
import { chuThuanTuDoan, doanCongThuc, goDauLatex } from '../src/lib/chu-hoa-hoc-pdf'

describe('goDauLatex', () => {
  it('gỡ \\ce{} mà giữ nguyên công thức bên trong', () => {
    expect(goDauLatex('Cho $\\ce{H2SO4}$ tác dụng')).toBe('Cho H2SO4 tác dụng')
  })

  it('ĐIỀU KIỆN TRÊN MŨI TÊN đưa xuống ngoặc, không được nuốt mất', () => {
    expect(goDauLatex('CH3COOC2H5 + NaOH ->[t^o] CH3COONa + C2H5OH')).toBe('CH3COOC2H5 + NaOH -> (t°) CH3COONa + C2H5OH')
    expect(goDauLatex('A ->[xt, t^o] B')).toContain('(xt, t°)')
  })

  it('mũi tên hai chiều và điều kiện trên dưới', () => {
    expect(goDauLatex('A <=>[men] B')).toBe('A <=> (men) B')
    expect(goDauLatex('A <=>[tren][duoi] B')).toBe('A <=> (tren, duoi) B')
  })

  it('đổi lệnh LaTeX hay gặp sang ký tự đọc được', () => {
    expect(goDauLatex('A \\to B')).toBe('A -> B')
    expect(goDauLatex('2 \\times 3')).toBe('2 × 3')
    expect(goDauLatex('\\Delta H')).toBe('Δ H')
    expect(goDauLatex('25 ^\\circ C')).toBe('25 ° C')
  })

  it('chữ thường không bị đụng tới', () => {
    const s = 'Ester nào sau đây có mùi chuối chín?'
    expect(goDauLatex(s)).toBe(s)
  })

  it('chuỗi rỗng hoặc thiếu không làm vỡ', () => {
    expect(goDauLatex('')).toBe('')
    expect(goDauLatex(undefined as unknown as string)).toBe('')
  })
})

describe('doanCongThuc', () => {
  it('tách chỉ số dưới của công thức — đây là thứ bản cũ in sai', () => {
    const ds = doanCongThuc('$\\ce{H2SO4}$')
    expect(ds.some((d) => d.t === 'sub' && d.v === '2')).toBe(true)
    expect(ds.some((d) => d.t === 'sub' && d.v === '4')).toBe(true)
    expect(chuThuanTuDoan(ds)).toBe('H2SO4')
  })

  it('mũi tên tách thành đoạn riêng để bên vẽ vẽ bằng nét', () => {
    const ds = doanCongThuc('CH3COOC2H5 + NaOH ->[t^o] CH3COONa + C2H5OH')
    expect(ds.filter((d) => d.t === 'mui')).toHaveLength(1)
    expect(ds.find((d) => d.t === 'mui')?.v).toBe('→')
    // Điều kiện phản ứng vẫn còn trong chữ, không bị nuốt.
    expect(chuThuanTuDoan(ds)).toContain('(t°)')
  })

  it('mũi tên hai chiều nhận đúng ký tự', () => {
    expect(doanCongThuc('A <=> B').find((d) => d.t === 'mui')?.v).toBe('⇌')
  })

  it('điện tích thành số mũ', () => {
    const ds = doanCongThuc('$\\ce{Na+}$')
    expect(ds.some((d) => d.t === 'sup')).toBe(true)
  })

  it('KHÔNG còn ký tự đánh dấu LaTeX nào lọt ra giấy', () => {
    for (const s of ['$\\ce{H2SO4}$', 'A ->[t^o] B', '$\\Delta H = -10$', '\\text{Ester}']) {
      const ra = chuThuanTuDoan(doanCongThuc(s))
      expect(ra).not.toContain('\\')
      expect(ra).not.toContain('$')
      expect(ra).not.toContain('{')
      expect(ra).not.toContain('->')
    }
  })

  it('câu chữ thuần giữ nguyên từng chữ', () => {
    const s = 'Đun nóng carboxylic acid với alcohol khi có mặt xúc tác'
    expect(chuThuanTuDoan(doanCongThuc(s))).toBe(s)
  })

  it('chuỗi rỗng trả mảng rỗng, không đẩy đoạn rỗng xuống bộ vẽ', () => {
    expect(doanCongThuc('')).toEqual([])
  })
})
