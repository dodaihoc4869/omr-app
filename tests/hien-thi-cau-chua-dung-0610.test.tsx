// HIỂN THỊ CÂU CHƯA ĐÚNG Ở CA "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (thầy 06/10: "hiển thị những câu học sinh sai … phải chính xác tuyệt đối để hs không bị ảnh hưởng").
// Khoá: khối "Sai lại câu đã làm đúng" nói ĐÚNG loại từng câu (sai · bỏ trống · đúng một phần) và các số cộng khớp nhau; dữ liệu cũ không có loại thì không bịa.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { KhoiSaiLaiDaDung } from '../src/components/ca-thi/KhoiDaDung'
import KetQuaSauNop, { type OCauKq } from '../src/components/xem-diem/KetQuaSauNop'
import { chuKetQuaCau } from '../src/lib/ph-v3/chu-ket-qua-cau'
import { chuChiTietChuaDung, chuHauToLoai, type CauSaiLaiDaDung, type EmSaiLaiDaDung } from '../src/lib/rut-de-da-dung'

afterEach(cleanup)

const cau = (soCau: number, phan: 'I' | 'II' | 'III', loai?: CauSaiLaiDaDung['loai']): CauSaiLaiDaDung => ({
  soCau,
  phan,
  qid: `q${phan}${soCau}`,
  nhan: 'Ca Tuần 1 · 28/09 · Thông hiểu',
  ...(loai ? { loai } : {}),
})
const em = (sai: CauSaiLaiDaDung[]): EmSaiLaiDaDung => ({ sbd: '7', hoTen: 'An', tong: 14, sai })
const dong = (c: HTMLElement, soCau: number, phan: string): string =>
  [...c.querySelectorAll('li[data-sbd] div div')].map((x) => x.textContent ?? '').find((t) => t.startsWith(`Câu ${soCau} Phần ${phan}`)) ?? ''

describe('chữ loại câu chưa đúng', () => {
  it('hậu tố chỉ cho bỏ trống / đúng một phần; sai thường và thiếu loại không có', () => {
    expect(chuHauToLoai('trong')).toBe(' (bỏ trống)')
    expect(chuHauToLoai('mot_phan')).toBe(' (đúng một phần)')
    expect(chuHauToLoai('sai')).toBe('')
    expect(chuHauToLoai(undefined)).toBe('')
  })
  it('đếm theo loại khi MỌI câu đều có loại; có câu thiếu loại ⇒ để trống (không để số trong ngoặc lệch số bên ngoài)', () => {
    expect(chuChiTietChuaDung([cau(1, 'I', 'sai'), cau(2, 'I', 'trong'), cau(1, 'II', 'mot_phan')])).toBe('1 sai · 1 bỏ trống · 1 đúng một phần')
    expect(chuChiTietChuaDung([cau(1, 'I', 'sai'), cau(2, 'I')])).toBe('')
    expect(chuChiTietChuaDung([])).toBe('')
  })
})

describe('khối "Sai lại câu đã làm đúng" — nói đúng loại từng câu', () => {
  it('dòng tổng nêu từng loại; nhãn từng câu có hậu tố đúng loại', () => {
    const { container } = render(<KhoiSaiLaiDaDung ds={[em([cau(1, 'I', 'sai'), cau(2, 'I', 'trong'), cau(1, 'II', 'mot_phan'), cau(3, 'III', 'sai')])]} soEmDaCham={1} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('Chưa đúng 4/14 câu em đã làm đúng trước đây (2 sai · 1 bỏ trống · 1 đúng một phần)')
    expect(dong(container, 2, 'I')).toContain('(bỏ trống)')
    expect(dong(container, 1, 'II')).toContain('(đúng một phần)')
    expect(dong(container, 1, 'I')).not.toMatch(/bỏ trống|đúng một phần/)
    expect(dong(container, 3, 'III')).not.toMatch(/bỏ trống|đúng một phần/)
    expect(chu).not.toContain('Sai 4/14') // chữ cũ gộp mọi loại vào "sai"
  })
  it('dữ liệu cũ không có loại: chỉ nêu số câu chưa đúng, không bịa phân loại', () => {
    const { container } = render(<KhoiSaiLaiDaDung ds={[em([cau(1, 'I'), cau(2, 'I')])]} soEmDaCham={1} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('Chưa đúng 2/14 câu em đã làm đúng trước đây · kể cả câu thay số')
    expect(chu).not.toMatch(/\(\d+ sai/)
  })
})

describe('màn học sinh sau nộp — khối "đã lo cho em" đếm ĐÚNG số câu chưa đúng trọn, kể cả khi KHÔNG có câu sai hẳn', () => {
  const PHAN = [{ ma: 'I' as const, ten: 'Phần I · Trắc nghiệm', dung: 1, tong: 2, motPhan: 0, diem: 0.25, toiDa: 4.5 }]
  const ve = (cau: OCauKq[]) => render(<KetQuaSauNop kieu="da_cong_bo" tenCa="KT" gioNop="09:08" diem={7.5} phan={PHAN} dung={1} tong={cau.length} cau={cau} onXemBaoCao={() => {}} />).container.textContent ?? ''

  it('chỉ có câu đúng một phần ⇒ vẫn có khối, nêu "1 đúng một phần" và không nêu loại vắng mặt', () => {
    const t = ve([{ phan: 'I', so: 1, kq: 'dung' }, { phan: 'II', so: 1, kq: 'mot_phan' }])
    expect(t).toContain('1 câu chưa đúng trọn (1 đúng một phần)')
    expect(t).not.toMatch(/\b0 (sai|bỏ trống)/)
  })
  it('chỉ có câu bỏ trống ⇒ "1 bỏ trống"; toàn đúng ⇒ không có khối', () => {
    expect(ve([{ phan: 'I', so: 1, kq: 'dung' }, { phan: 'III', so: 1, kq: 'trong' }])).toContain('1 câu chưa đúng trọn (1 bỏ trống)')
    cleanup()
    expect(ve([{ phan: 'I', so: 1, kq: 'dung' }, { phan: 'I', so: 2, kq: 'dung' }])).not.toContain('chưa đúng trọn')
  })
})

describe('màn phụ huynh — chữ kết quả từng câu', () => {
  const c = (phan: 'I' | 'II' | 'III', dapAnChon: string, dapAnDung: string, laDungNhungLau = false) => ({ phan, dapAnChon, dapAnDung, laDungNhungLau })
  it('Phần II bỏ trống ("----") là BỎ TRỐNG, không in "Con chọn ----"; Phần I/III bỏ trống cũng vậy', () => {
    expect(chuKetQuaCau(c('II', '----', 'DSDS'))).toBe('Con bỏ trống · Đáp án đúng DSDS')
    expect(chuKetQuaCau(c('I', '', 'A'))).toBe('Con bỏ trống · Đáp án đúng A')
    expect(chuKetQuaCau(c('III', '  ', '0,54'))).toBe('Con bỏ trống · Đáp án đúng 0,54')
  })
  it('Phần II đúng một phần nói rõ; sai hẳn thì không; câu đúng nhưng lâu giữ nguyên lời', () => {
    expect(chuKetQuaCau(c('II', 'DS-S', 'DSDS'))).toBe('Con chọn DS-S (đúng một phần) · Đáp án đúng DSDS')
    expect(chuKetQuaCau(c('II', 'SDSD', 'DSDS'))).toBe('Con chọn SDSD · Đáp án đúng DSDS')
    expect(chuKetQuaCau(c('I', 'B', 'A'))).toBe('Con chọn B · Đáp án đúng A')
    expect(chuKetQuaCau(c('I', 'A', 'A', true))).toBe('Con làm đúng nhưng lâu hơn thường lệ')
  })
})
