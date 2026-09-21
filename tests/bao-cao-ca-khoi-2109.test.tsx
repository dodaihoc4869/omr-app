// XEM ĐIỂM BẢN 2 · GV-1 — khối VẼ "Báo cáo cả lớp" ở Chi tiết ca (components/xem-diem-gv/BaoCaoCaLop.tsx) + chỗ nối vào ExamMonitorScreen.
// Số đã có test riêng ở bao-cao-ca-lop-2109.test.ts; ở đây soi: gập/mở theo trạng thái ca, không số trùng, không bịa khi thiếu đáp án, chạm em ⇒ báo cáo của em.
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import BaoCaoCaLopKhoi, { chuDapAn } from '../src/components/xem-diem-gv/BaoCaoCaLop'
import type { BaoCaoCaLop } from '../src/lib/bao-cao-ca-lop'

const PHO = ['0–2', '2–4', '4–5', '5–6', '6–7', '7–8', '8–9', '9–10'].map((nhan, i) => ({ nhan, soEm: [1, 0, 0, 2, 3, 2, 3, 1][i] }))
const DAY: BaoCaoCaLop = {
  nop: 12,
  daVao: 15,
  chuaNop: 3,
  tb: 6.15,
  cao: 10,
  thap: 0.5,
  phutTB: 27,
  pho: PHO,
  baPhan: [
    { ma: 'I', ten: 'Trắc nghiệm', diemTB: 2.81, toiDa: 4.5, dungTB: 4, tong: 6 },
    { ma: 'II', ten: 'Đúng–sai', diemTB: 2.33, toiDa: 4, dungTB: 1, tong: 2 },
  ],
  dang: [
    { ten: 'Glycerol', tiLeDung: 46, soEmSai: 10, soEmLam: 12 },
    { ten: 'Lipid', tiLeDung: 67, soEmSai: 6, soEmLam: 12 },
  ],
  cauSai: [
    { qid: 'q1', phan: 'I', soCau: 1, dang: 'Glycerol', soSai: 9, soLam: 12, tiLeSai: 75, dapAnDung: 'D', dapAnSaiNhieu: { dapAn: 'C', soEm: 7 } },
    { qid: 't1', phan: 'II', soCau: 1, dang: 'Lipid', soSai: 6, soLam: 12, tiLeSai: 50, dapAnDung: 'DDSS', dapAnSaiNhieu: { dapAn: 'SSDD', soEm: 6 } },
  ],
  emCanYY: [
    { sbd: '12121007', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', lyDo: ['Đúng 0/10 câu (0%) — điểm 0', 'Rời màn làm bài 4 lần, tổng 1 phút 24 giây'] },
    { sbd: '12121011', hoTen: '', lop: '', lyDo: ['Điểm 0,5, dưới 5'] },
  ],
  coBangCham: true,
}
const KHONG_DAP_AN: BaoCaoCaLop = { ...DAY, baPhan: [], dang: [], cauSai: [], coBangCham: false }

const ve = (bc: BaoCaoCaLop, moSan: boolean, onMoEm = vi.fn()) => ({ ...render(<BaoCaoCaLopKhoi bc={bc} phutDe={45} moSan={moSan} onMoEm={onMoEm} />), onMoEm })

describe('GV-1 · gập/mở theo trạng thái ca', () => {
  it('chưa ai nộp ⇒ không vẽ gì (không khối rỗng)', () => {
    const r = ve({ ...DAY, nop: 0, tb: null }, true)
    expect(r.container.firstChild).toBeNull()
  })

  it('ca đang mở (moSan=false): chỉ một nút 48+ px kèm tóm tắt điểm trung bình và số em đã nộp; nội dung chưa dựng; bấm ⇒ mở, bấm lại ⇒ gập', () => {
    const r = ve(DAY, false)
    const nut = r.getByRole('button', { name: /Báo cáo cả lớp/ })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(nut.hasAttribute('aria-controls')).toBe(false) // không trỏ tới vùng chưa dựng
    expect(nut.textContent).toContain('Điểm trung bình 6,15 · 12 em đã nộp')
    expect(r.queryByText('Phổ điểm của lớp')).toBeNull()
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(r.container.querySelector(`#${nut.getAttribute('aria-controls')}`)).toBeTruthy()
    expect(r.getByText('Phổ điểm của lớp')).toBeTruthy()
    expect(nut.textContent).not.toContain('Điểm trung bình 6,15 ·') // đã mở thì bỏ dòng tóm tắt (số nằm ngay bên dưới, không nói hai lần)
    fireEvent.click(nut)
    expect(r.queryByText('Phổ điểm của lớp')).toBeNull()
  })

  it('ca đã đóng (moSan=true): mở sẵn, thấy đủ các khối', () => {
    const r = ve(DAY, true)
    for (const t of ['Phổ điểm của lớp', 'Ba phần của bài (trung bình cả lớp)', 'Dạng cả lớp đang vấp', 'Câu cả lớp sai nhiều nhất', 'Em cần thầy để ý']) expect(r.getByText(t)).toBeTruthy()
  })
})

describe('GV-1 · số hiện ra và không bịa', () => {
  it('bốn số có nhãn; KHÔNG lặp "đã vào/đã nộp" (thẻ ca bên cạnh đã có)', () => {
    const r = ve(DAY, true)
    const tq = r.container.querySelector('[data-khoi="tong-quan-lop"]') as HTMLElement
    expect(within(tq).getByText('Điểm trung bình').nextSibling?.textContent).toContain('6,15')
    expect(within(tq).getByText('Điểm cao nhất').nextSibling?.textContent).toBe('10')
    expect(within(tq).getByText('Điểm thấp nhất').nextSibling?.textContent).toBe('0,5')
    expect(within(tq).getByText('Thời gian làm trung bình').nextSibling?.textContent).toContain('27phút (ca cho 45 phút)')
    expect(r.container.textContent).not.toMatch(/em đã vào|Còn \d+ em chưa nộp/)
  })

  it('số liệu thiếu (không nên xảy ra khi đã có bài nộp) ⇒ "—", không in 0 giả', () => {
    const r = ve({ ...DAY, tb: null, cao: null, thap: null }, true)
    const tq = r.container.querySelector('[data-khoi="tong-quan-lop"]') as HTMLElement
    for (const nhan of ['Điểm trung bình', 'Điểm cao nhất', 'Điểm thấp nhất']) expect(within(tq).getByText(nhan).nextSibling?.textContent).toBe('—')
  })

  it('thiếu thời gian trung bình ⇒ ẩn thẻ đó, không hiện "0 phút"', () => {
    const r = ve({ ...DAY, phutTB: null }, true)
    expect(r.queryByText('Thời gian làm trung bình')).toBeNull()
  })

  it('máy chưa có đáp án: ẩn "Ba phần" và "Câu sai nhiều nhất"; dạng nói thật vì sao chưa tính; phổ điểm + em cần để ý vẫn có', () => {
    const r = ve(KHONG_DAP_AN, true)
    expect(r.queryByText('Ba phần của bài (trung bình cả lớp)')).toBeNull()
    expect(r.queryByText('Câu cả lớp sai nhiều nhất')).toBeNull()
    expect(r.getByText('Chưa tính được: máy này chưa có đáp án của ca nên không chấm lại từng câu.')).toBeTruthy()
    expect(r.getByText('Phổ điểm của lớp')).toBeTruthy()
    expect(r.getByText('Em cần thầy để ý')).toBeTruthy()
  })

  it('có đáp án nhưng chưa dạng nào đủ ba lượt ⇒ câu khác, không nói "máy chưa có đáp án"', () => {
    const r = ve({ ...DAY, dang: [] }, true)
    expect(r.getByText('Chưa có dạng nào đủ ba lượt câu để nói cả lớp đang vấp.')).toBeTruthy()
    expect(r.container.textContent).not.toContain('chưa có đáp án của ca')
  })

  it('dạng dưới 60% có nhãn "Cả lớp còn vấp"; dạng từ 60% trở lên thì không', () => {
    const r = ve(DAY, true)
    const dong = (ten: string) => r.getAllByText(ten).map((e) => e.closest('.xd-dang')).find(Boolean) as HTMLElement // tên dạng còn xuất hiện dưới thẻ câu sai
    expect(within(dong('Glycerol')).getByText('Cả lớp còn vấp')).toBeTruthy()
    expect(within(dong('Lipid')).queryByText('Cả lớp còn vấp')).toBeNull()
    expect(dong('Glycerol').classList.contains('xd-dang--vap')).toBe(true)
    expect(dong('Lipid').classList.contains('xd-dang--vap')).toBe(false)
    expect(dong('Glycerol').textContent).toContain('Cả lớp đúng 46% số câu · 10/12 em sai ít nhất một câu')
  })

  it('"Nhiều em chọn" chỉ nêu đáp án + số em; Phần II đọc thành "a Đ · b S …"; không suy diễn lý do', () => {
    const r = ve(DAY, true)
    expect(r.getByText('C (7 em)')).toBeTruthy()
    expect(r.getByText('a S · b S · c Đ · d Đ (6 em)')).toBeTruthy()
    expect(r.getByText('a Đ · b Đ · c S · d S')).toBeTruthy()
    expect(r.container.textContent).not.toMatch(/vì sao|do em|nhầm|hiểu sai|lý do em/i)
  })

  it('câu sai đều do bỏ trống (không có đáp án sai đông nhất) ⇒ không hiện dòng "Nhiều em chọn"', () => {
    const r = ve({ ...DAY, cauSai: [{ ...DAY.cauSai[0], dapAnSaiNhieu: null }] }, true)
    expect(r.getByText('Đáp án đúng')).toBeTruthy()
    expect(r.queryByText('Nhiều em chọn')).toBeNull()
  })

  it('chuDapAn: chỉ Phần II 4 ký tự mới đổi; chỗ trống là "–"', () => {
    expect(chuDapAn('I', 'C')).toBe('C')
    expect(chuDapAn('III', '92')).toBe('92')
    expect(chuDapAn('II', 'DS-D')).toBe('a Đ · b S · c – · d Đ')
    expect(chuDapAn('II', 'abc')).toBe('abc')
    expect(chuDapAn('I', 'DDSS')).toBe('DDSS') // chỉ Phần II mới đọc theo ý a–d
  })

  it('không emoji, không mã nội bộ (qid) trên màn', () => {
    const r = ve(DAY, true)
    expect(r.container.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(r.container.textContent).not.toMatch(/\bq1\b|\bt1\b/)
  })
})

describe('GV-1 · em cần thầy để ý', () => {
  it('mỗi em là MỘT nút; chạm ⇒ mở báo cáo của em đó trong ca; lý do bằng số; em thiếu tên thì hiện "SBD …"', () => {
    const r = ve(DAY, true)
    fireEvent.click(r.getByRole('button', { name: /Nguyễn Minh Khôi/ }))
    expect(r.onMoEm).toHaveBeenCalledWith('12121007')
    expect(r.getByText('Rời màn làm bài 4 lần, tổng 1 phút 24 giây')).toBeTruthy()
    fireEvent.click(r.getByRole('button', { name: /SBD 12121011/ }))
    expect(r.onMoEm).toHaveBeenLastCalledWith('12121011')
    expect(r.getByText('SBD 12121011', { selector: 'h4' })).toBeTruthy() // thiếu tên ⇒ tên dòng là SBD, không để trống
  })

  it('không em nào cần để ý ⇒ nói rõ mốc, không để trống im lặng', () => {
    const r = ve({ ...DAY, emCanYY: [] }, true)
    expect(r.getByText('Không có em nào điểm dưới 5 hoặc rời màn làm bài từ 3 lần trở lên.')).toBeTruthy()
  })
})

describe('GV-1 · chỗ nối ở ExamMonitorScreen (chỉ phần nhìn)', () => {
  const nguon = readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')

  it('khối đứng trong cột danh sách em, ngay trên "Học sinh trong ca"; ca đang mở thì gập, đóng thì mở; đổi ca thì dựng lại', () => {
    expect(nguon).toContain("<BaoCaoCaLopKhoi key={chiTiet.ca.maCa} bc={baoCaoLop} phutDe={chiTiet.ca.thoiGianPhut} moSan={chiTiet.ca.trangThai !== 'mo'} onMoEm={setSbdHoSo} />")
    expect(nguon.indexOf('<BaoCaoCaLopKhoi')).toBeLessThan(nguon.indexOf('Học sinh trong ca ({dsEm.length})'))
  })

  it('chỉ GOM số đã có: không chấm lại, không gọi mạng, không đụng công bố/khoá/rời màn', () => {
    const i = nguon.indexOf('const baoCaoLop = useMemo')
    const khoi = nguon.slice(i, nguon.indexOf('}, [chiTiet, dsEm, teacherBank, soCauCa, boTheoEmDung])', i))
    expect(khoi).not.toMatch(/gradeSubmissionFull|fetch|await|ghiDiem|khoaCa|moKhoa|congBo|setLoi|useState/)
    expect(khoi).toContain('taoChiTietCau')
    expect(khoi).toContain('tinhBaoCaoCaLop')
  })
})
