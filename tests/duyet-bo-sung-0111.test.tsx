// @vitest-environment jsdom
// DUYỆT BÀI BỔ SUNG (thầy chốt bản vẽ 01/11, docs/ban-ve-trong-2610/gv-duyet-bo-sung.html): bỏ khối chữ to ở màn Theo dõi ca; duyệt ở MỘT chỗ —
// Hôm nay › Việc cần thầy › tấm «Bài bổ sung chờ duyệt», xếp theo ca, mỗi em một dòng, Bỏ / Nhận, «Nhận cả N bài» (gọi tuần tự).
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { BaiBoSung } from '../src/lib/bai-bo-sung'

const m = vi.hoisted(() => ({ xuLy: vi.fn() }))
vi.mock('../src/lib/bai-bo-sung', () => ({ xuLyBaiBoSung: (...a: unknown[]) => m.xuLy(...a), layBaiBoSung: vi.fn(async () => []) }))
const { default: DuyetBoSung, gomTheoCa, sauChot, gioNgay } = await import('../src/components/hom-nay-thay/DuyetBoSung')
afterEach(() => { cleanup(); m.xuLy.mockReset() })

const B = (khoa: string, maCa: string, tenCa: string, hoTen: string, soCauMoi: number, guiLuc: string, nopLuc: string): BaiBoSung =>
  ({ khoa, maCa, tenCa, sbd: `9${khoa}`, hoTen, lanThu: 1, soCauMoi, guiLuc, nopLuc })
const DS: BaiBoSung[] = [
  B('1', 'C2', '12L1-L5', 'Lê Minh Khoa', 3, '2026-10-30T12:22:00Z', '2026-10-30T12:20:00Z'),
  B('2', 'C1', 'LD3 – Đồ thị', 'Đỗ Thanh Tùng', 1, '2026-10-25T12:55:00Z', '2026-10-25T12:54:00Z'),
  B('3', 'C1', 'LD3 – Đồ thị', 'Vũ Ngọc Ánh', 2, '2026-10-25T12:55:30Z', '2026-10-25T12:54:00Z'),
  B('4', 'C1', 'LD3 – Đồ thị', 'Mai Khánh Linh', 1, '2026-10-25T12:56:00Z', '2026-10-25T12:54:00Z'),
]

describe('thuần', () => {
  it('gom theo ca: ca có bài gửi sớm nhất lên đầu; giờ VN; «sau chốt …»', () => {
    const g = gomTheoCa(DS)
    expect(g.map((x) => [x.tenCa, x.bai.length])).toEqual([['LD3 – Đồ thị', 3], ['12L1-L5', 1]])
    expect(gioNgay('2026-10-25T12:54:00Z')).toBe('19:54 · 25/10')
    expect(sauChot('2026-10-25T12:55:00Z', '2026-10-25T12:54:00Z')).toBe('sau chốt 1 phút')
    expect(sauChot('2026-10-30T11:26:00Z', '2026-10-09T10:57:00Z')).toBe('sau chốt 21 ngày')
  })
})

describe('tấm duyệt', () => {
  it('xếp theo ca, mỗi em một dòng; Nhận / Bỏ báo kết quả tại chỗ; «Nhận cả N bài» gọi tuần tự; Esc đóng', async () => {
    m.xuLy.mockImplementation(async (_m: string, khoa: string, nhan: boolean) => ({ chamLai: nhan && khoa !== '4' }))
    const dong = vi.fn()
    render(<DuyetBoSung ds={DS} matKhau={async () => 'mat'} onDong={dong} />)
    const tam = screen.getByRole('dialog', { name: 'Bài bổ sung chờ duyệt' })
    expect(tam.textContent).toContain('4 bài chờ · 2 ca kiểm tra · cũ nhất 25/10')
    const ca1 = within(screen.getByRole('region', { name: 'Ca LD3 – Đồ thị' }))
    expect(ca1.getByText(/Máy chủ chốt bài 19:54 · 25\/10/)).toBeTruthy()
    expect(tam.querySelector('.dbs-dong .dbs-mo')?.textContent).toBe('1 câu làm thêm · gửi 19:55 · 25/10, sau chốt 1 phút')
    // Bỏ một em
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ bài bổ sung của Lê Minh Khoa' }))
    await screen.findByText('Đã bỏ · giữ điểm cũ')
    expect(m.xuLy).toHaveBeenCalledWith('mat', '1', false)
    // Nhận cả 3 bài của ca LD3 — tuần tự, đúng thứ tự gửi
    fireEvent.click(ca1.getByRole('button', { name: 'Nhận cả 3 bài' }))
    await waitFor(() => expect(m.xuLy).toHaveBeenCalledTimes(4))
    expect(m.xuLy.mock.calls.slice(1).map((c) => c[1])).toEqual(['2', '3', '4'])
    await waitFor(() => expect(tam.querySelectorAll('.dbs-xong')).toHaveLength(4))
    expect(tam.textContent).toContain('Đã nhận · đã chấm lại ca LD3 – Đồ thị')
    expect(tam.textContent).toContain('Đã nhận · điểm chấm khi ca đóng')
    expect(tam.textContent).toContain('0 bài chờ')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dong).toHaveBeenCalled()
  })
  it('máy chủ báo lỗi ⇒ dòng giữ nút, hiện lý do; thử lại được', async () => {
    m.xuLy.mockRejectedValueOnce(new Error('Máy chủ bận')).mockResolvedValueOnce({ chamLai: true })
    render(<DuyetBoSung ds={DS.slice(0, 1)} matKhau={async () => 'mat'} onDong={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Nhận bài bổ sung của Lê Minh Khoa' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Chưa xử lý được: Máy chủ bận')
    fireEvent.click(screen.getByRole('button', { name: 'Nhận bài bổ sung của Lê Minh Khoa' }))
    await screen.findByText('Đã nhận · đã chấm lại ca 12L1-L5')
  })
})

describe('một chỗ duyệt', () => {
  it('màn Theo dõi ca KHÔNG còn khối bài bổ sung; Hôm nay có việc «Bài bổ sung chờ duyệt» mở tấm nạp lười', () => {
    expect(readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')).not.toMatch(/KhungBaiBoSung|bai-bo-sung/)
    const hn = readFileSync('src/screens/GvHomNayScreen.tsx', 'utf8')
    expect(hn).toMatch(/lazy\(\(\) => import\('\.\.\/components\/hom-nay-thay\/DuyetBoSung'\)\)/)
    expect(hn).toMatch(/Bài bổ sung chờ duyệt · \$\{n\} bài/)
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/\{NhipHocThay,BangChungBon,DuyetBoSung\}-\*\.\{js,css\}/)
  })
})
