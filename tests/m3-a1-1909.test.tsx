// Việc C · nhóm A1 (Code 4): tấm "Vào phòng thi" + chuông/tấm thông báo của học sinh mặc bộ mặt M3.
// Phần chung của thư viện `src/components/m3/`: hook `dungM3()` (cô lập app giáo viên), không có bảng màu thứ hai,
// không mã màu # trong thư mục.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import PhongVaoThi from '../src/components/PhongVaoThi'
import ThongBaoHocSinh from '../src/components/ThongBaoHocSinh'
import { dungM3 } from '../src/components/m3'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const M3_DIR = path.join(process.cwd(), 'src/components/m3')
const tepM3 = fs.readdirSync(M3_DIR)

function datDuong(duong: string) {
  window.history.replaceState(null, '', duong)
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  datDuong('/')
})

describe('dungM3(): chỉ vùng học sinh / phụ huynh mới mặc M3', () => {
  it.each([
    ['', '/hs', true],
    ['', '/hs/abc12345XYZ', true],
    ['', '/ph', true],
    ['?vai=hocsinh', '/', true],
    ['?vai=phuhuynh', '/', true],
    ['?examCode=123456', '/', true],
    ['?vai=phieu', '/', true],
    ['', '/', false],
    ['', '/gv', false],
    ['?vai=gv', '/', false],
  ])('search=%s path=%s → %s', (search, duong, mong) => {
    expect(dungM3(search, duong)).toBe(mong)
  })

  it('không tham số: đọc location hiện tại (vitest jsdom ở "/" = app giáo viên = false; đổi sang /hs = true)', () => {
    datDuong('/')
    expect(dungM3()).toBe(false)
    datDuong('/hs')
    expect(dungM3()).toBe(true)
  })
})

describe('thư viện m3/: một nguồn màu', () => {
  it('không khai lại biến màu --m3-* nào (chỉ đọc), không có mã màu # ở bất kỳ tệp nào', () => {
    for (const ten of tepM3) {
      const nd = fs.readFileSync(path.join(M3_DIR, ten), 'utf8')
      expect(nd, ten).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      // khai biến vai trò màu của m3-theme.css = bảng màu thứ hai (đọc thì được, khai thì không)
      expect(nd, ten).not.toMatch(/--m3-(primary|secondary|tertiary|error|surface|on-[a-z-]+|outline)[a-z-]*\s*:/)
    }
  })

  it('mọi khai báo màu trong .css là biến hoặc rgb(...)/transparent; .tsx không có style màu cứng', () => {
    for (const ten of tepM3.filter((t) => t.endsWith('.tsx'))) {
      const nd = fs.readFileSync(path.join(M3_DIR, ten), 'utf8')
      expect(nd, ten).not.toMatch(/(rgb|rgba|hsl)\(/)
    }
  })
})

describe('PhongVaoThi (tấm phủ vào phòng thi)', () => {
  it('có lớp m3 ở gốc, giữ aria-label "Vào phòng thi", thanh trên có nút Quay lại 48px bấm được, con vẫn hiện', () => {
    datDuong('/hs')
    const onClose = vi.fn()
    render(
      <PhongVaoThi onClose={onClose}>
        <button type="button">Bắt đầu</button>
      </PhongVaoThi>,
    )
    const hop = screen.getByRole('dialog', { name: 'Vào phòng thi' })
    expect(hop.classList.contains('m3')).toBe(true)
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeTruthy()
    const quay = screen.getByRole('button', { name: 'Quay lại' })
    expect(quay.className).toContain('m3-nut-tron')
    fireEvent.click(quay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape đóng; đóng xong trả overflow của body như cũ', () => {
    datDuong('/hs')
    document.body.style.overflow = 'auto'
    const onClose = vi.fn()
    const { unmount } = render(<PhongVaoThi onClose={onClose}>x</PhongVaoThi>)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })
})

const DS = [
  { id: 'n1', title: 'BTVN Ancol mới', body: 'Thầy vừa giao lô 2/4', target: 'btvn', created_at: new Date().toISOString(), read_at: null },
  { id: 'n2', title: 'Bài của Mẹ', body: 'Mẹ giao 8 câu', target: 'mom', created_at: new Date().toISOString(), read_at: null },
  { id: 'n3', title: 'Bài cũ', body: 'Đã đọc rồi', target: 'btvn', created_at: new Date(Date.now() - 3 * 86400_000).toISOString(), read_at: new Date().toISOString() },
]

function giaLapMayChu(items: any[], loi = false) {
  const cuoc: { duong: string; body: any }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const duong = new URL(String(url)).pathname
      cuoc.push({ duong, body: JSON.parse(init?.body || '{}') })
      if (loi) throw new Error('mất mạng')
      return { ok: true, status: 200, json: async () => ({ ok: true, items, publicKey: '' }) }
    }),
  )
  return cuoc
}

describe('ThongBaoHocSinh (chuông + tấm thông báo)', () => {
  beforeEach(() => datDuong('/hs'))

  it('gốc có lớp m3; chuông là nút 48px, nhãn nói số chưa đọc; bấm mở tấm có tên "Thông báo của em"', async () => {
    giaLapMayChu(DS)
    const { container } = render(<ThongBaoHocSinh token="tok" onOpen={() => {}} />)
    expect((container.firstElementChild as HTMLElement).classList.contains('m3')).toBe(true)
    const chuong = await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' })
    expect(chuong.className).toContain('m3-nut-tron')
    expect(chuong.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(chuong)
    expect(chuong.getAttribute('aria-expanded')).toBe('true')
    const tam = screen.getByRole('dialog', { name: 'Thông báo của em' })
    expect(tam.className).toContain('m3-hop')
    expect(screen.getByText('2 tin chưa đọc')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đóng thông báo' })).toBeTruthy()
  })

  it('bấm một thông báo: gọi onOpen(target, id), đánh dấu đã đọc lên máy chủ, đóng tấm', async () => {
    const cuoc = giaLapMayChu(DS)
    const onOpen = vi.fn()
    render(<ThongBaoHocSinh token="tok" onOpen={onOpen} />)
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 2 chưa đọc/ }))
    const muc = (await screen.findByText('BTVN Ancol mới')).closest('button') as HTMLElement
    expect(muc.className).toContain('m3-the')
    expect(muc.getAttribute('data-vai-tro')).toBe('primary') // chưa đọc = tonal primary
    const cu = screen.getByText('Bài cũ').closest('button') as HTMLElement
    expect(cu.className).toContain('m3-the--nhat') // đã đọc = thẻ trung tính
    expect(cu.getAttribute('data-vai-tro')).toBeNull()
    fireEvent.click(muc)
    expect(onOpen).toHaveBeenCalledWith('btvn', 'n1')
    await waitFor(() => expect(cuoc.some((c) => c.duong === '/notifications/read' && c.body.id === 'n1')).toBe(true))
    expect(screen.queryByRole('dialog', { name: 'Thông báo của em' })).toBeNull()
  })

  it('"Đã đọc" đánh dấu hết; Escape đóng tấm', async () => {
    const cuoc = giaLapMayChu(DS)
    render(<ThongBaoHocSinh token="tok" onOpen={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 2 chưa đọc/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Đã đọc' }))
    await waitFor(() => expect(cuoc.filter((c) => c.duong === '/notifications/read').map((c) => c.body.id).sort()).toEqual(['n1', 'n2']))
    expect(screen.getByText('Không có tin mới')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Thông báo của em' })).toBeNull()
  })

  it('đang tải: skeleton (không spinner) + chữ "Đang đồng bộ thông báo..."; rồi trống: nguyên văn "Chưa có thông báo nào"', async () => {
    let xong: (v: unknown) => void = () => {}
    const cho = new Promise((r) => (xong = r))
    vi.stubGlobal('fetch', vi.fn(async () => { await cho; return { ok: true, status: 200, json: async () => ({ ok: true, items: [], publicKey: '' }) } }))
    render(<ThongBaoHocSinh token="tok" onOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo, 0 chưa đọc' }))
    expect(screen.getByText('Đang đồng bộ thông báo...')).toBeTruthy()
    expect(document.querySelector('.m3-xuong')).toBeTruthy()
    expect(document.querySelector('.animate-spin')).toBeNull()
    xong(null)
    expect(await screen.findByText('Chưa có thông báo nào')).toBeTruthy()
    expect(screen.getByText('Bài tập Thầy giao và bài luyện từ Phụ huynh sẽ hiển thị ngay tại đây.')).toBeTruthy()
  })

  it('lỗi mạng: thẻ báo lỗi vai trò error, chữ nguyên văn', async () => {
    giaLapMayChu([], true)
    render(<ThongBaoHocSinh token="tok" onOpen={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 0 chưa đọc/ }))
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được thông báo')
    expect(loi.getAttribute('data-vai-tro')).toBe('error')
  })

  it('công tắc thông báo đẩy: nút "Bật ngay" 48px còn đó (bấm khi máy không hỗ trợ → báo lỗi chữ, không ném)', async () => {
    giaLapMayChu(DS)
    render(<ThongBaoHocSinh token="tok" onOpen={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 2 chưa đọc/ }))
    const bat = await screen.findByRole('button', { name: 'Bật ngay' })
    expect(bat.className).toContain('m3-nut-chinh')
    fireEvent.click(bat)
    expect(await screen.findByRole('status')).toBeTruthy()
  })
})
