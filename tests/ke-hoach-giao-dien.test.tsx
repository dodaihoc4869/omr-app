import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { mkdirSync, writeFileSync } from 'node:fs'
import BangTroLyHocSinh from '../src/components/BangTroLyHocSinh'
import BangTroLyPhuHuynh from '../src/components/BangTroLyPhuHuynh'
import NhanHanBaiTap from '../src/components/NhanHanBaiTap'
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({default: () => <div>Thần thú</div>}))
afterEach(() => { cleanup(); vi.useRealTimers() })
const save = (name: string, html: string) => {
  if (!process.env.STUDY_PREVIEW_DIR) return
  mkdirSync(process.env.STUDY_PREVIEW_DIR, { recursive:true })
  writeFileSync(`${process.env.STUDY_PREVIEW_DIR}/${name}.html`, html)
}
it('nút việc cần làm giữ đúng payload và cập nhật khi tới hạn mà không tải lại', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-18T12:00:00+07:00'))
  const action = vi.fn()
  const bt = {maBtvn:'B1',tenBtvn:'Bài luyện este',soCau:16,giaoLuc:'2026-09-18T12:00:00+07:00',hanNop:'2026-09-18T12:00:15+07:00'}
  const {container} = render(<BangTroLyHocSinh sbd="test" hoTen="An" dsBtvn={[bt]} dsMomGiao={[]} dsLichSu={[]} tongSoCauSai={3} onAction={action} />)
  fireEvent.click(screen.getByRole('button',{name:'Làm Lô 1'}))
  // Thay Vòng 1/2 (mục 3 SO-VIEC.md 19/09): payload chỉ còn `bt` gốc — phiếu tự
  // tính lại lịch lô từ đó, không còn `vong`/`soCau` cứng trong payload.
  expect(action.mock.calls[0][0].payload).toEqual({bt})
  expect(container.textContent!.indexOf('Việc nên làm trước')).toBeLessThan(container.textContent!.indexOf('Thần Thú Hiện Hành'))
  save('hoc-sinh', container.innerHTML)
  act(() => { vi.advanceTimersByTime(15_000) })
  expect(screen.queryByRole('button', {name:'Làm Lô 1'})).toBeNull()
  expect(screen.getByText('1 bài quá hạn')).toBeDefined()
})
it('phụ huynh không được báo con nắm chắc kiến thức từ một điểm cao', () => {
  const noop = () => {}
  const {container} = render(<BangTroLyPhuHuynh sbd="test" hoTen="An" dsBaiThi={[{diem:9}]} caGanNhat={{diem:9}} tongCauSai={0} dsMomGiao={[]} onGiaoBaiKhacPhuc={noop} onXemChiTietCa={noop} onXemBangDiem={noop} />)
  expect(container.textContent).not.toContain('nắm rất chắc')
  expect(container.textContent).not.toContain('Đã bịt sạch')
  expect(container.textContent).toContain('Cần xem thêm lỗi sai')
  save('phu-huynh',container.innerHTML)
})
it('nhãn bài đã nộp không cảnh báo quá hạn và luôn ghi giờ Việt Nam', () => {
  render(<NhanHanBaiTap han="2026-09-17T13:00:00Z" now={Date.parse('2026-09-18T00:00:00Z')} daNop />)
  expect(screen.getByText(/Đã nộp:/).textContent).toContain('20:00')
  expect(screen.queryByText(/Quá hạn/)).toBeNull()
})
