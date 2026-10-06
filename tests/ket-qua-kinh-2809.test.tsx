// (e) HỌC SINH XEM KẾT QUẢ — kính sáng/tối (ca thi 28/09). Khoá: ô từng câu + "đã lo cho em" CHỈ khi đã công bố; chưa công bố thì "Em đã nộp bài" + số câu đã LÀM,
// KHÔNG một điểm / ô đúng-sai / đáp án nào — kể cả khi màn cha lỡ truyền `cau`, `diem`, `phan`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import KetQuaSauNop, { type OCauKq } from '../src/components/xem-diem/KetQuaSauNop'

afterEach(() => cleanup())
const CAU: OCauKq[] = [
  { phan: 'I', so: 1, kq: 'dung' },
  { phan: 'I', so: 2, kq: 'sai' },
  { phan: 'II', so: 1, kq: 'mot_phan' },
  { phan: 'III', so: 1, kq: 'trong' },
]
const PHAN = [{ ma: 'I' as const, ten: 'Phần I · Trắc nghiệm', dung: 1, tong: 2, motPhan: 0, diem: 0.25, toiDa: 4.5 }]

describe('KetQuaSauNop kính (ca thi 28/09)', () => {
  it('đã công bố: gốc có lớp kính, ô từng câu theo phần; bấm câu sai/bỏ trống ⇒ mở báo cáo có lời giải', () => {
    const onXem = vi.fn()
    const { container } = render(<KetQuaSauNop kieu="da_cong_bo" tenCa="KT" gioNop="09:08 · Thứ Hai 28/09/2026" diem={7.5} phan={PHAN} dung={1} tong={4} cau={CAU} onXemBaoCao={onXem} />)
    expect(container.querySelector('.kq-kinh')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Câu 1 Phần I: đúng' })).toBeTruthy()
    // 06/10 (thầy: hiển thị câu sai phải chính xác tuyệt đối): câu Phần II ĐÚNG MỘT PHẦN cũng là câu CHƯA đúng trọn — hệ thống ghi nó vào hàng ôn lại
    // (`dung_sai = 0`) nên ô của nó bấm được để xem lời giải, và khối "đã lo cho em" đếm nó. Trước đây chỉ đếm sai + bỏ trống nên nói THIẾU câu.
    fireEvent.click(screen.getByRole('button', { name: /Câu 1 Phần II: đúng một phần/ }))
    fireEvent.click(screen.getByRole('button', { name: /Câu 2 Phần I: sai/ }))
    fireEvent.click(screen.getByRole('button', { name: /Câu 1 Phần III: bỏ trống/ }))
    expect(onXem).toHaveBeenCalledTimes(3)
    expect(container.textContent).toContain('3 câu chưa đúng trọn (1 sai, 1 bỏ trống, 1 đúng một phần)')
    expect(container.textContent).not.toContain('câu sai hoặc bỏ trống')
  })
  for (const kieu of ['ca_lop', 'khong'] as const) {
    it(`chưa công bố (${kieu}): "Em đã nộp bài" + câu đã làm; KHÔNG điểm, KHÔNG ô đúng/sai dù màn cha lỡ truyền`, () => {
      const { container } = render(<KetQuaSauNop kieu={kieu} tenCa="KT" gioNop="09:08 · Thứ Hai 28/09/2026" diem={7.5} phan={PHAN} dung={1} tong={4} cau={CAU} soDaLam={27} tongCau={28} lam2="38 phút 5 giây" daNop={27} daVao={34} />)
      const t = container.textContent ?? ''
      expect(t).toContain('Em đã nộp bài')
      expect(t).toContain('27/28')
      expect(t).not.toMatch(/7,5|Từng câu|câu sai|đúng một phần|Phần I ·/)
      expect(container.querySelectorAll('.kq-cau')).toHaveLength(0)
      expect(screen.queryByRole('img', { name: /Điểm/ })).toBeNull()
    })
  }
})
