// SAO CẦN CHỮA đi từ kho lên app — đặc tả CA-THI-VA-GOI-LEN-BANG mục 4.1.
//
// Vì sao phải có test: 1944 câu trong kho đã gắn sao bằng tay, mà importer cũ
// lặng lẽ vứt trường `can_chua` đi. Mất sao thì thuật toán gọi lên bảng không
// có gì để xếp thứ tự câu, và mất im lặng — không lỗi, không cảnh báo.
import { describe, it, expect } from 'vitest'
import { parseCanChua, parseKhoDeJsonText, buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'
import { mergeAndStrip, soSao } from '../src/data/examContent'
import { dungUngVien } from '../src/lib/rut-de'

const cauI = (so: number, canChua?: unknown) => ({
  phan: 'I',
  so,
  de: `Câu ${so}`,
  pa: { A: 'a', B: 'b', C: 'c', D: 'd' },
  dap_an: 'A',
  ...(canChua === undefined ? {} : { can_chua: canChua }),
})

const kho = (cau: unknown[]) => JSON.stringify({ ma_de: '12-TEST', cau })

describe('parseCanChua', () => {
  it('giữ đủ trường của một câu hai sao', () => {
    expect(parseCanChua({ sao: 2, dk: ['nen', 'bay'], ly_do: 'Câu nền', bay: 'Quên trừ nước' })).toEqual({
      sao: 2,
      dk: ['nen', 'bay'],
      ly_do: 'Câu nền',
      bay: 'Quên trừ nước',
    })
  })

  it('giữ y_can_chua của Phần II và cờ thong_hieu', () => {
    const r = parseCanChua({ sao: 1, dk: [], ly_do: 'x', bay: null, y_can_chua: ['b', 'd'], thong_hieu: true })
    expect(r?.y_can_chua).toEqual(['b', 'd'])
    expect(r?.thong_hieu).toBe(true)
  })

  it('bỏ điều kiện lạ, không bịa thêm', () => {
    expect(parseCanChua({ sao: 1, dk: ['nen', 'linh_tinh'], ly_do: 'x', bay: null })?.dk).toEqual(['nen'])
  })

  it('bay rỗng hoặc thiếu thì về null, không thành chuỗi rỗng', () => {
    expect(parseCanChua({ sao: 1, dk: [], ly_do: 'x', bay: '   ' })?.bay).toBeNull()
    expect(parseCanChua({ sao: 1, dk: [], ly_do: 'x' })?.bay).toBeNull()
  })

  it('sao sai kiểu thì BỎ CẢ trường, không hạ về 0 rồi giữ lý do', () => {
    expect(parseCanChua({ sao: 3, dk: [], ly_do: 'x', bay: null })).toBeUndefined()
    expect(parseCanChua({ sao: '2', dk: [], ly_do: 'x', bay: null })).toBeUndefined()
    expect(parseCanChua(null)).toBeUndefined()
    expect(parseCanChua('2 sao')).toBeUndefined()
  })
})

describe('soSao', () => {
  it('câu chưa gắn sao tính 0, không undefined', () => {
    expect(soSao({})).toBe(0)
    expect(soSao({ canChua: { sao: 2, dk: [], ly_do: '', bay: null } })).toBe(2)
  })
})

describe('nạp kho giữ sao', () => {
  const raw = kho([
    cauI(1, { sao: 2, dk: ['nen', 'bay'], ly_do: 'Câu nền', bay: 'Bẫy A' }),
    cauI(2, { sao: 1, dk: [], ly_do: 'Thuần thông hiểu', bay: null, thong_hieu: true }),
    cauI(3, { sao: 0, dk: [], ly_do: 'Trùng câu 1', bay: null }),
    cauI(4),
  ])

  it('mỗi câu giữ đúng số sao, câu thiếu can_chua vẫn nạp được và tính 0 sao', () => {
    const p = parseKhoDeJsonText(raw)
    expect(p.ok).toBe(true)
    const r = buildTeacherSourceFromKhoDe(p.json!)
    expect(r.errors).toEqual([])
    expect(r.source.phanI.map((q) => soSao(q))).toEqual([2, 1, 0, 0])
    expect(r.source.phanI[0].canChua?.bay).toBe('Bẫy A')
    expect(r.source.phanI[1].canChua?.thong_hieu).toBe(true)
    expect(r.source.phanI[3].canChua).toBeUndefined()
  })

  it('can_chua hỏng KHÔNG chặn nạp đề — mất sao một câu, không mất cả đề', () => {
    const p = parseKhoDeJsonText(kho([cauI(1, { sao: 9 }), cauI(2, { sao: 2, dk: [], ly_do: 'x', bay: null })]))
    expect(p.ok).toBe(true)
    const r = buildTeacherSourceFromKhoDe(p.json!)
    expect(r.errors).toEqual([])
    expect(r.source.phanI.map((q) => soSao(q))).toEqual([0, 2])
  })

  it('sao vào được ứng viên rút đề để thầy nhìn thấy khi chọn câu', () => {
    const r = buildTeacherSourceFromKhoDe(parseKhoDeJsonText(raw).json!)
    const uv = dungUngVien([r.source])
    expect(uv.I.map((c) => c.sao)).toEqual([2, 1, 0, 0])
    expect(uv.I[0].lyDoSao).toBe('Câu nền')
  })

  it('SAO KHÔNG BAO GIỜ ra khỏi máy thầy: gói gửi máy chủ không có canChua', () => {
    const r = buildTeacherSourceFromKhoDe(parseKhoDeJsonText(raw).json!)
    const goi = JSON.stringify(mergeAndStrip([r.source]))
    expect(goi).not.toContain('canChua')
    expect(goi).not.toContain('Câu nền')
    expect(goi).not.toContain('Bẫy A')
  })
})
