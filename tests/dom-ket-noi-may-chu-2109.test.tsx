// DỌN DƯ THỪA G4 (Boss soát): khối "Cấu hình (1 lần)" (địa chỉ máy chủ + mã bí mật kho đề) DỜI NGUYÊN từ cuối màn Ngân hàng đề sang màn CÀI ĐẶT → Kết nối máy chủ.
// Một việc chỉ nằm MỘT chỗ: Ngân hàng đề không còn ô nhập; thiếu kết nối thì báo và chỉ đường bằng MỘT nút "Mở Cài đặt".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'

const m = vi.hoisted(() => ({
  url: { v: '' },
  mat: { v: '' },
  saveUrl: vi.fn(),
  saveMat: vi.fn(),
  toast: vi.fn(),
  setScreen: vi.fn(),
}))

vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => m.url.v,
  loadTeacherSecret: async () => m.mat.v,
  saveScriptUrl: (...a: unknown[]) => m.saveUrl(...a),
  saveTeacherSecret: (...a: unknown[]) => m.saveMat(...a),
  loadExamSources: async () => [],
  loadAllSessionTeacherBanks: async () => [],
  saveExamSource: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
  deleteExamSource: vi.fn(),
  loadSoSuaDang: async () => ({}),
  saveSoSuaDang: vi.fn(),
  xoaSessionTeacherBank: vi.fn(),
  loadCauHinhMayChu: async () => ({ BAT: false, URL: '', HAN_GIAY: 10, SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: true, GIAN_VAO_THI_GIAY: 3 }),
  saveCauHinhMayChu: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => ({ moi: [], capNhat: [], loi: [], canXem: [] }), capNhatCaDaMo: async () => 0, caDungDe: async () => [] }))
vi.mock('../src/lib/exam-api', () => ({ capNhatKeyBank: vi.fn(), luuDe: vi.fn(), xoaDe: vi.fn(), dungChiMuc: vi.fn(async () => 0), xoaDeTrenKho: vi.fn(), maCaConTrenMayChu: vi.fn(async () => null) }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: m.setScreen, showToast: m.toast }),
}))
vi.mock('../src/components/NutCapNhatApp', () => ({ default: () => null }))
vi.mock('../src/components/KhoiBoNaoCaiDat', () => ({ default: () => null }))

const { default: KhoiKetNoiKhoDe } = await import('../src/components/KhoiKetNoiKhoDe')
const { default: CaiDatScreen } = await import('../src/screens/CaiDatScreen')
const { default: NganHangDeScreen } = await import('../src/screens/NganHangDeScreen')

beforeEach(() => {
  m.url.v = ''
  m.mat.v = ''
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('KhoiKetNoiKhoDe — địa chỉ máy chủ + mã bí mật kho đề', () => {
  it('nạp giá trị đã lưu vào hai ô; ô mã bí mật là ô mật khẩu, không tự điền', async () => {
    m.url.v = 'https://omr.test'
    m.mat.v = 'bi-mat-thu'
    render(<KhoiKetNoiKhoDe showToast={m.toast} />)
    const url = (await screen.findByLabelText('Địa chỉ máy chủ')) as HTMLInputElement
    const mat = screen.getByLabelText('Mã bí mật kho đề') as HTMLInputElement
    await waitFor(() => expect(url.value).toBe('https://omr.test'))
    expect(mat.value).toBe('bi-mat-thu')
    expect(mat.type).toBe('password')
    expect(mat.getAttribute('autocomplete')).toBe('off')
  })

  it('chưa bấm Lưu thì chưa ghi gì; bấm Lưu ghi ĐÃ CẮT khoảng trắng cả hai giá trị rồi báo "Đã lưu trên máy này"', async () => {
    render(<KhoiKetNoiKhoDe showToast={m.toast} />)
    fireEvent.change(await screen.findByLabelText('Địa chỉ máy chủ'), { target: { value: '  https://omr.moi  ' } })
    fireEvent.change(screen.getByLabelText('Mã bí mật kho đề'), { target: { value: ' ma-moi ' } })
    expect(m.saveUrl).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã lưu trên máy này', 'success'))
    expect(m.saveUrl).toHaveBeenCalledWith('https://omr.moi')
    expect(m.saveMat).toHaveBeenCalledWith('ma-moi')
  })

  it('không in mã bí mật ra chữ nào ngoài chính ô nhập (toast, nhãn)', async () => {
    m.mat.v = 'BI-MAT-KHONG-DUOC-IN'
    const { container } = render(<KhoiKetNoiKhoDe showToast={m.toast} />)
    await waitFor(() => expect((screen.getByLabelText('Mã bí mật kho đề') as HTMLInputElement).value).toBe('BI-MAT-KHONG-DUOC-IN'))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    expect(container.textContent).not.toContain('BI-MAT-KHONG-DUOC-IN')
    expect(JSON.stringify(m.toast.mock.calls)).not.toContain('BI-MAT-KHONG-DUOC-IN')
  })
})

describe('Cài đặt → Kết nối máy chủ', () => {
  it('có mục "Kết nối máy chủ" gồm địa chỉ + mã bí mật kho đề VÀ khối "Máy chủ mới (Cloudflare)"; mật khẩu mở app vẫn còn', async () => {
    render(<CaiDatScreen />)
    const muc = (await screen.findByRole('heading', { name: 'Kết nối máy chủ' })).parentElement as HTMLElement
    expect(within(muc).getByLabelText('Địa chỉ máy chủ')).toBeTruthy()
    expect(within(muc).getByLabelText('Mã bí mật kho đề')).toBeTruthy()
    expect(within(muc).getByText('Máy chủ mới (Cloudflare)')).toBeTruthy()
    expect(fs.readFileSync(path.join(process.cwd(), 'src/screens/CaiDatScreen.tsx'), 'utf8')).toContain('<KhoiMatKhauApp')
  })

  it('mỗi ô nhập kết nối chỉ xuất hiện MỘT lần trên màn Cài đặt', async () => {
    render(<CaiDatScreen />)
    await screen.findByRole('heading', { name: 'Kết nối máy chủ' })
    expect(screen.getAllByLabelText('Địa chỉ máy chủ')).toHaveLength(1)
    expect(screen.getAllByLabelText('Mã bí mật kho đề')).toHaveLength(1)
  })
})

describe('Ngân hàng đề — không còn khối Cấu hình; thiếu kết nối thì chỉ đường', () => {
  it('nguồn: không còn "Cấu hình (1 lần)", ô địa chỉ/mã, KhoiMayChuMoi, KhoiMatKhauApp, luuCauHinh', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/NganHangDeScreen.tsx'), 'utf8')
    for (const cam of ['Cấu hình (1 lần)', 'aria-label="Địa chỉ máy chủ"', 'aria-label="Mã bí mật kho đề"', 'KhoiMayChuMoi', 'KhoiMatKhauApp', 'luuCauHinh', 'setMoCauHinh', 'saveScriptUrl', 'saveTeacherSecret']) {
      expect(src, cam).not.toContain(cam)
    }
    expect(src).not.toMatch(/mục Cấu hình/)
  })

  it('chưa có địa chỉ/mã ⇒ thông báo + MỘT nút "Mở Cài đặt" (sang màn caidat); không có ô nhập ở đây', async () => {
    render(<NganHangDeScreen />)
    const nut = await screen.findByRole('button', { name: 'Mở Cài đặt' })
    expect(screen.getByText(/Vào Cài đặt → Kết nối máy chủ để nhập/)).toBeTruthy()
    expect(screen.queryByLabelText('Địa chỉ máy chủ')).toBeNull()
    expect(screen.queryByLabelText('Mã bí mật kho đề')).toBeNull()
    fireEvent.click(nut)
    expect(m.setScreen).toHaveBeenCalledWith('caidat')
  })

  it('đã có địa chỉ + mã ⇒ KHÔNG hiện thông báo thiếu kết nối', async () => {
    m.url.v = 'https://omr.test'
    m.mat.v = 'bi-mat-thu'
    render(<NganHangDeScreen />)
    await screen.findByRole('heading', { name: 'Ngân hàng câu hỏi' })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('button', { name: 'Mở Cài đặt' })).toBeNull()
  })

  it('thiếu MỘT trong hai (chỉ có địa chỉ) cũng báo thiếu', async () => {
    m.url.v = 'https://omr.test'
    render(<NganHangDeScreen />)
    expect(await screen.findByRole('button', { name: 'Mở Cài đặt' })).toBeTruthy()
  })

  it('trong lúc còn đang đọc cấu hình từ máy thì CHƯA báo thiếu (không nháy thông báo sai)', () => {
    render(<NganHangDeScreen />)
    expect(screen.queryByRole('button', { name: 'Mở Cài đặt' })).toBeNull() // lần vẽ đầu, chưa đọc xong
  })
})
