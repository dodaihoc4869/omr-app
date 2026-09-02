import { describe, it, expect } from 'vitest'
import { parseKhoDeJsonText, buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'

const OK_JSON = JSON.stringify({
  ma_de: '100',
  nguon: 'de1.pdf',
  cau: [
    { phan: 'I', so: 1, de: 'Cho phản ứng...', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'D' },
    { phan: 'II', so: 1, de: 'Ý nào đúng...', y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS' },
    { phan: 'III', so: 1, de: 'Tính khối lượng...', dap_an: '12,5', can_xem: true },
  ],
})

describe('parseKhoDeJsonText', () => {
  it('parse đúng JSON hợp lệ', () => {
    const r = parseKhoDeJsonText(OK_JSON)
    expect(r.ok).toBe(true)
    expect(r.json?.ma_de).toBe('100')
    expect(r.json?.cau).toHaveLength(3)
  })

  it('báo lỗi JSON hỏng cú pháp', () => {
    const r = parseKhoDeJsonText('{ không phải json')
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/JSON/)
  })

  it('báo lỗi thiếu ma_de', () => {
    const r = parseKhoDeJsonText(JSON.stringify({ cau: [] }))
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/ma_de/)
  })

  it('báo lỗi câu thiếu dap_an', () => {
    const r = parseKhoDeJsonText(JSON.stringify({ ma_de: '100', cau: [{ phan: 'I', so: 1, de: 'x', pa: { A: 'a', B: 'b', C: 'c', D: 'd' } }] }))
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/dap_an/)
  })
})

describe('buildTeacherSourceFromKhoDe', () => {
  it('build đủ 3 phần từ JSON hợp lệ, đúng đáp án, giữ can_xem', async () => {
    const parsed = parseKhoDeJsonText(OK_JSON)
    expect(parsed.ok).toBe(true)
    const { source, errors, canXemList } = await buildTeacherSourceFromKhoDe(parsed.json!)
    expect(errors).toHaveLength(0)
    expect(source.phanI).toHaveLength(1)
    expect(source.phanI[0].correct).toBe('D')
    expect(source.phanII).toHaveLength(1)
    expect(source.phanII[0].correct).toEqual(['D', 'S', 'D', 'S'])
    expect(source.phanIII).toHaveLength(1)
    expect(source.phanIII[0].correct).toBe('12,5')
    expect(canXemList).toEqual(['Phần III câu 1'])
  })

  it('chặn câu Phần I thiếu phương án — không đẩy vào source, có lỗi', async () => {
    const json = { ma_de: '100', cau: [{ phan: 'I' as const, so: 1, de: 'x', pa: { A: 'a', B: 'b', C: 'c' }, dap_an: 'A' }] }
    const { source, errors } = await buildTeacherSourceFromKhoDe(json)
    expect(errors.length).toBeGreaterThan(0)
    expect(source.phanI).toHaveLength(0)
  })

  it('chặn Phần II dap_an sai định dạng', async () => {
    const json = { ma_de: '100', cau: [{ phan: 'II' as const, so: 1, de: 'x', y: { a: '1', b: '2', c: '3', d: '4' }, dap_an: 'XYZ' }] }
    const { errors } = await buildTeacherSourceFromKhoDe(json)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('Phần II nhận dap_an dạng object {a,b,c,d}', async () => {
    const json = { ma_de: '100', cau: [{ phan: 'II' as const, so: 1, de: 'x', y: { a: '1', b: '2', c: '3', d: '4' }, dap_an: { a: 'D' as const, b: 'S' as const, c: 'D' as const, d: 'S' as const } }] }
    const { source, errors } = await buildTeacherSourceFromKhoDe(json)
    expect(errors).toHaveLength(0)
    expect(source.phanII[0].correct).toEqual(['D', 'S', 'D', 'S'])
  })

  it('câu có "hinh" nhưng không truyền resolveHinh -> cảnh báo, không chặn lưu', async () => {
    const json = { ma_de: '100', cau: [{ phan: 'III' as const, so: 1, de: 'x', dap_an: '5', hinh: { trang: 1, x0: 0, y0: 0, x1: 0.5, y1: 0.5 } }] }
    const { source, errors, warnings } = await buildTeacherSourceFromKhoDe(json)
    expect(errors).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
    expect(source.phanIII).toHaveLength(1)
    expect(source.phanIII[0].imageDataUrl).toBeUndefined()
  })

  it('câu có "hinh" và resolveHinh thành công -> gán imageDataUrl', async () => {
    const json = { ma_de: '100', cau: [{ phan: 'III' as const, so: 1, de: 'x', dap_an: '5', hinh: { trang: 1, x0: 0, y0: 0, x1: 0.5, y1: 0.5 } }] }
    const { source, warnings } = await buildTeacherSourceFromKhoDe(json, async () => 'data:image/png;base64,AAA')
    expect(warnings).toHaveLength(0)
    expect(source.phanIII[0].imageDataUrl).toBe('data:image/png;base64,AAA')
  })
})
