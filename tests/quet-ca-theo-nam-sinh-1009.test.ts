// RÚT CÂU SAI KHÔNG RA CÂU NÀO — nghiệm thu bốn chỗ vừa sửa (10/09/2026).
//
// Bốn phép kiểm này ứng đúng bốn tầng đã hỏng, đi từ ngoài vào trong:
//   1. Xác định năm sinh của ca KHÔNG được phụ thuộc cái nhãn thầy gõ ở tên ca.
//   2. Quét phải lấy CẢ thư mục, không bốc ngẫu nhiên ba ca của cả trung tâm.
//   3. Chặn "ba ca" phải nằm ở chỗ ĐÃ BIẾT em nào nộp ca nào.
//   4. Câu em từng sai phải lấy được kể cả khi kho đã đổi id vì nạp lại đề.
import { describe, expect, it, vi } from 'vitest'
import { namSinhDaSo, namSinhTuTenCa } from '../src/lib/nam-sinh-ca'
import { chonCauLapChoEm, type CaTruocDaCham } from '../src/lib/de-rieng'
import { cauHinhDeRieng } from '../src/lib/cau-hinh-de-rieng'

describe('1. Năm sinh của ca — lấy từ hồ sơ em, không lấy từ nhãn tên ca', () => {
  it('đa số thắng, một dòng gõ sai không kéo cả ca sang thư mục khác', () => {
    expect(namSinhDaSo(['2009', '2009', '2009', '2011'])).toBe('2009')
  })
  it('không năm nào quá nửa thì trả null — không chắc thì KHÔNG đoán', () => {
    expect(namSinhDaSo(['2009', '2009', '2011', '2011'])).toBeNull()
  })
  it('rỗng hoặc toàn rác thì trả null', () => {
    expect(namSinhDaSo([])).toBeNull()
    expect(namSinhDaSo(['', null, undefined, 'abc'])).toBeNull()
  })
  it('đọc được năm nằm trong chuỗi ngày sinh đầy đủ', () => {
    expect(namSinhDaSo(['12/05/2009', '2009', '01/01/2009'])).toBe('2009')
  })
  it('ĐÚNG CHỖ ĐÃ HỎNG: tên ca đổi nhãn thì tên ca vô dụng, hồ sơ em vẫn đúng', () => {
    expect(namSinhTuTenCa('Lớp 1 - L3 - 2009')).toBeNull()
    expect(namSinhDaSo(['2009', '2009', '2009'])).toBe('2009')
  })
})

describe('3. "Ba ca" phải là ba ca CỦA CHÍNH EM, không phải ba ca bốc bừa', () => {
  const ch = cauHinhDeRieng({ PHAM_VI_HOI_LAI: 'ba_ca', TRAN_CA_QUET: 60 })

  /** 6 ca; em 'A' chỉ nộp ca 1, 3, 5, 6 — vắng ca 2 và 4. */
  const dsCa: CaTruocDaCham[] = [
    { maCa: 'ca1', daLamCua: { A: ['q1'] }, saiCua: { A: ['q1'] } },
    { maCa: 'ca2', daLamCua: { B: ['q9'] }, saiCua: { B: ['q9'] } },
    { maCa: 'ca3', daLamCua: { A: ['q3'] }, saiCua: { A: ['q3'] } },
    { maCa: 'ca4', daLamCua: { B: ['q8'] }, saiCua: { B: ['q8'] } },
    { maCa: 'ca5', daLamCua: { A: ['q5'] }, saiCua: { A: ['q5'] } },
    { maCa: 'ca6', daLamCua: { A: ['q6'] }, saiCua: { A: ['q6'] } },
  ]

  it('gom đúng 3 ca đầu tiên em CÓ NỘP, bỏ qua ca em vắng', () => {
    const r = chonCauLapChoEm('A', dsCa, 40, {}, ch)
    expect(r.tuCa).toBe('ca1 + ca3 + ca5')
    expect(r.soSaiCaTruoc).toBe(3)
  })

  it('ca thứ tư em có nộp KHÔNG được lấy — trần là 3 ca mỗi em', () => {
    const r = chonCauLapChoEm('A', dsCa, 40, {}, ch)
    expect(r.tuCa).not.toContain('ca6')
  })

  it('em chưa từng có tên trong ca nào vẫn ra moi_vao, không ra bừa', () => {
    const r = chonCauLapChoEm('Z', dsCa, 40, {}, ch)
    expect(r.lyDo).toBe('moi_vao')
    expect(r.qids).toEqual([])
  })

  it('em có tên mà ca nào cũng vắng thì là khong_nop, KHÁC moi_vao', () => {
    const vang: CaTruocDaCham[] = [{ maCa: 'ca1', daLamCua: { A: [] }, saiCua: { A: [] } }]
    expect(chonCauLapChoEm('A', vang, 40, {}, ch).lyDo).toBe('khong_nop')
  })
})
