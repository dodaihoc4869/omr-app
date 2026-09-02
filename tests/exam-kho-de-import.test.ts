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

  it('câu có "hinh" thiếu du_lieu -> cảnh báo, không chặn lưu, không có ảnh', () => {
    const json = { ma_de: '100', cau: [{ phan: 'III' as const, so: 1, de: 'x', dap_an: '5', hinh: [{ tep: 'III_1.png', vi_tri: 'sau_de' as const }] }] }
    const { source, errors, warnings } = buildTeacherSourceFromKhoDe(json)
    expect(errors).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
    expect(source.phanIII).toHaveLength(1)
    expect(source.phanIII[0].hinhAnh).toBeUndefined()
  })

  it('câu có "hinh" kèm du_lieu base64 -> gán hinhAnh đúng vị trí', () => {
    const json = {
      ma_de: '100',
      cau: [{ phan: 'I' as const, so: 16, de: 'x', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'D', hinh: [{ tep: 'I_16.png', vi_tri: 'sau_de' as const, du_lieu: 'data:image/png;base64,AAA' }] }],
    }
    const { source, warnings } = buildTeacherSourceFromKhoDe(json)
    expect(warnings).toHaveLength(0)
    expect(source.phanI[0].hinhAnh).toEqual([{ src: 'data:image/png;base64,AAA', viTri: 'sau_de', alt: 'Hình Phần I câu 16 (I_16.png)' }])
  })

  it('parse: "hinh" sai vi_tri -> lỗi; "de" chứa $$ -> lỗi', () => {
    const sai = parseKhoDeJsonText(JSON.stringify({ ma_de: '1', cau: [{ phan: 'III', so: 1, de: 'x', dap_an: '5', hinh: [{ tep: 'a.png', vi_tri: 'giua' }] }] }))
    expect(sai.ok).toBe(false)
    expect(sai.errors.join(' ')).toMatch(/vi_tri/)
    const khoi = parseKhoDeJsonText(JSON.stringify({ ma_de: '1', cau: [{ phan: 'III', so: 1, de: 'x $$a$$', dap_an: '5' }] }))
    expect(khoi.ok).toBe(false)
    expect(khoi.errors.join(' ')).toMatch(/\$\$/)
  })

  it('loi_giai -> explanation + trạng thái + đáp án tự giải; nguon/ngay_nap giữ trên source', () => {
    const json = {
      ma_de: '100', nguon: 'de.pdf', ngay_nap: '2026-09-02T10:00:00+07:00',
      cau: [{ phan: 'I' as const, so: 16, de: 'x', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'D',
        loi_giai: { noi_dung: 'Glu về cực (+).', dap_an_de: 'D', dap_an_tu_giai: 'C', trang_thai: 'nghi_dap_an_sai' as const, ghi_chu: 'lệch' } }],
    }
    const parsed = parseKhoDeJsonText(JSON.stringify(json))
    expect(parsed.ok).toBe(true)
    const { source } = buildTeacherSourceFromKhoDe(parsed.json!)
    expect(source.nguon).toBe('de.pdf')
    expect(source.ngayNap).toBe('2026-09-02T10:00:00+07:00')
    const q = source.phanI[0]
    expect(q.correct).toBe('D') // chấm vẫn theo đáp án đề
    expect(q.explanation).toBe('Glu về cực (+).')
    expect(q.loiGiaiTrangThai).toBe('nghi_dap_an_sai')
    expect(q.dapAnTuGiai).toBe('C')
    expect(q.ghiChuLoiGiai).toBe('lệch')
  })
})

describe('loi_giai có cấu trúc (THIẾT KẾ LẠI Ô LỜI GIẢI)', () => {
  it('Phần I: chot + tung_pa -> loiGiai.tungPa theo chữ GỐC; vi_sao > 25 từ -> cảnh báo, không chặn', () => {
    const dai = Array.from({ length: 26 }, (_, i) => `t${i}`).join(' ')
    const json = {
      ma_de: '100', cau: [{ phan: 'I' as const, so: 1, de: 'x', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C',
        loi_giai: { chot: 'Nước làm lạnh đi ngược chiều hơi.', tung_pa: { A: { dung: false, vi_sao: 'vào (1) ra (2)' }, B: { dung: false, vi_sao: dai }, C: { dung: true, vi_sao: 'đúng chiều' }, D: { dung: false, vi_sao: 'sai' } } } }],
    }
    const { source, errors, warnings } = buildTeacherSourceFromKhoDe(parseKhoDeJsonText(JSON.stringify(json)).json!)
    expect(errors).toEqual([])
    expect(warnings.join(' ')).toMatch(/tung_pa\.B dài 26 từ/)
    const q = source.phanI[0]
    expect(q.loiGiai?.chot).toBe('Nước làm lạnh đi ngược chiều hơi.')
    expect(q.loiGiai?.tungPa?.C).toEqual({ dung: true, viSao: 'đúng chiều' })
    expect(q.explanation).toBeUndefined()
  })
  it('Phần II thiếu ý d -> cảnh báo; Phần III buoc + ket_qua giữ nguyên', () => {
    const json = {
      ma_de: '100', cau: [
        { phan: 'II' as const, so: 2, de: 'x', y: { a: '1', b: '2', c: '3', d: '4' }, dap_an: 'SDSD', loi_giai: { chot: 'chốt', tung_y: { a: { dung: false, vi_sao: 'a' }, b: { dung: true, vi_sao: 'b' }, c: { dung: false, vi_sao: 'c' } } } },
        { phan: 'III' as const, so: 3, de: 'x', dap_an: '6,8', loi_giai: { chot: 'Bảo toàn khối lượng.', buoc: ['n = 0,1 mol', 'm = 6,8 tấn'], ket_qua: '6,8 tấn' } },
      ],
    }
    const { source, warnings } = buildTeacherSourceFromKhoDe(parseKhoDeJsonText(JSON.stringify(json)).json!)
    expect(warnings.join(' ')).toMatch(/tung_y\.d thiếu lý do/)
    expect(source.phanIII[0].loiGiai).toEqual({ chot: 'Bảo toàn khối lượng.', tungPa: undefined, tungY: undefined, buoc: ['n = 0,1 mol', 'm = 6,8 tấn'], ketQua: '6,8 tấn' })
  })
  it('bản cũ chỉ có noi_dung vẫn parse -> explanation, không có loiGiai', () => {
    const json = { ma_de: '100', cau: [{ phan: 'III' as const, so: 1, de: 'x', dap_an: '1', loi_giai: { noi_dung: 'cũ' } }] }
    const { source } = buildTeacherSourceFromKhoDe(parseKhoDeJsonText(JSON.stringify(json)).json!)
    expect(source.phanIII[0].explanation).toBe('cũ')
    expect(source.phanIII[0].loiGiai).toBeUndefined()
  })
})
