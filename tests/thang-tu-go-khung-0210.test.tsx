// Vòng học v2 GĐ2 (02/10): trang mẹ chuyển câu kiểm của khung lên máy chủ (/hs/cau-kiem) rồi trả kết quả vào ĐÚNG khung;
// gửi `kiem` kèm hồ sơ khi khung sẵn sàng; thanh thang tự gỡ chỉ ở màn học sinh; khung.html có "Đọc từng bước" mà vẫn không gọi mạng.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { act, cleanup, render, screen } from '@testing-library/react'

const bao = vi.fn()
const kiemTra = vi.fn()
const thang = vi.fn()
vi.mock('../src/lib/loi-giai-api', () => ({
  baoDocLoiGiai: (...a: unknown[]) => bao(...a),
  guiCauKiem: (...a: unknown[]) => kiemTra(...a),
  thangGo: (...a: unknown[]) => thang(...a),
  guiThay: vi.fn(), luyenNen: vi.fn(), nopLuyenNen: vi.fn(),
}))
import KhungLoiGiai from '../src/components/loi-giai/KhungLoiGiai'
import { viecConThieu } from '../src/components/loi-giai/ThanhThangGo'

const CAU = { qid: 'Q1', so: 'Câu 1', nguon: '', chuong: '', de: 'x', y: {} }
const HO_SO = { qid: 'Q1', bam: 'b', dang: 'tln' as const, ten: 't' }
const KIEM = { buoc: ['n = 0,25 mol', 'm = 3 gam'], cauKiem: [{ buoc: 0, kieu: 'so' as const, hoi: 'Số mol?' }], loiGo: [] }
const THANG = {
  bac: 2, coTheGui: false, soBuoc: 2,
  cong: [{ ma: 'tu_lam', dat: true, viec: '' }, { ma: 'doc_het', dat: false, viec: 'Em đọc nốt bước 2' }, { ma: 'lam_lai', dat: false, viec: 'Em thử câu tương tự này trước' },
    { ma: 'chi_buoc', dat: false, viec: 'Em chọn bước em chưa hiểu' }, { ma: 'khong_bua', dat: true, viec: '' }],
}

function gui(src: Window | null, data: unknown) {
  act(() => { window.dispatchEvent(new MessageEvent('message', { data, source: src })) })
}
const cho = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })

afterEach(() => { cleanup(); bao.mockReset(); kiemTra.mockReset(); thang.mockReset() })

describe('KhungLoiGiai — câu kiểm đi qua trang mẹ', () => {
  it('khung sẵn sàng ⇒ gửi kèm kiem; câu kiểm ⇒ máy chủ chấm ⇒ trả kết quả vào khung; thanh thang hiện bậc + việc còn thiếu', async () => {
    kiemTra.mockResolvedValue({ ok: true, dung: false, dapAn: '0,25', tenNen: 'Đổi số mol ↔ khối lượng' })
    thang.mockResolvedValue(THANG)
    const { container } = render(<KhungLoiGiai hoSo={HO_SO} cau={CAU} kiem={KIEM} nguon="on_lai" onDong={() => undefined} />)
    const w = (container.ownerDocument.querySelector('iframe') as HTMLIFrameElement).contentWindow!
    const post = vi.spyOn(w, 'postMessage').mockImplementation(() => undefined)
    gui(w, { loai: 'khung-san-sang' })
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ loai: 'loi-giai', kiem: KIEM }), '*')
    gui(w, { loai: 'khung-su-kien', kieu: 'mo_buoc', y: '0' })
    gui(window, { loai: 'khung-cau-kiem', buoc: 0, traLoi: '9' }) // nguồn lạ ⇒ bỏ
    gui(w, { loai: 'khung-cau-kiem', buoc: 0, traLoi: ' 0,3 ' })
    await cho()
    expect(kiemTra).toHaveBeenCalledTimes(1)
    expect(kiemTra.mock.calls[0].slice(0, 3)).toEqual(['Q1', 0, '0,3'])
    expect(post).toHaveBeenLastCalledWith({ loai: 'cau-kiem-kq', buoc: 0, dung: false, dapAn: '0,25', tenNen: 'Đổi số mol ↔ khối lượng' }, '*')
    // Thang tải khi mở + sau câu kiểm; gửi kèm thao tác của lần đọc đang mở.
    expect(thang.mock.calls.length).toBeGreaterThanOrEqual(2)
    const [qid, dang] = thang.mock.calls.at(-1) as [string, { giay: number; suKien: { k: string; y?: string }[] }]
    expect(qid).toBe('Q1')
    expect(dang.suKien.map((x) => [x.k, x.y])).toEqual([['mo_buoc', '0']])
    expect(screen.getByText('Thang tự gỡ · bậc 2/5: Đọc lời giải từng bước')).toBeTruthy()
    expect(screen.getByText('Em đọc nốt bước 2')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Gửi thầy' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('máy chủ báo lỗi ⇒ trả lỗi vào khung', async () => {
    kiemTra.mockResolvedValue({ ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' })
    thang.mockResolvedValue(null)
    const { container } = render(<KhungLoiGiai hoSo={HO_SO} cau={CAU} kiem={KIEM} onDong={() => undefined} />)
    const w = (container.ownerDocument.querySelector('iframe') as HTMLIFrameElement).contentWindow!
    const post = vi.spyOn(w, 'postMessage').mockImplementation(() => undefined)
    gui(w, { loai: 'khung-cau-kiem', buoc: 0, traLoi: '1' })
    await cho()
    expect(post).toHaveBeenLastCalledWith({ loai: 'cau-kiem-kq', buoc: 0, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }, '*')
    expect(screen.getByText('Chưa tải được thang tự gỡ của câu này.')).toBeTruthy()
  })

  it('màn thầy / câu không có kiem ⇒ không chuyển câu kiểm, không gửi kiem, không có thanh', async () => {
    for (const p of [{ thay: true, kiem: KIEM }, { thay: false, kiem: undefined }]) {
      const { container, unmount } = render(<KhungLoiGiai hoSo={HO_SO} cau={CAU} kiem={p.kiem} thay={p.thay} onDong={() => undefined} />)
      const w = (container.ownerDocument.querySelector('iframe') as HTMLIFrameElement).contentWindow!
      const post = vi.spyOn(w, 'postMessage').mockImplementation(() => undefined)
      gui(w, { loai: 'khung-san-sang' })
      expect(post.mock.calls[0][0]).not.toHaveProperty('kiem')
      gui(w, { loai: 'khung-cau-kiem', buoc: 0, traLoi: '1' })
      await cho()
      expect(kiemTra).not.toHaveBeenCalled()
      expect(thang).not.toHaveBeenCalled()
      expect(screen.queryByText(/Thang tự gỡ/)).toBeNull()
      unmount()
    }
  })

  it('việc hiện trên thanh: việc đầu còn thiếu; đủ cổng ⇒ nhắc chọn bước rồi gửi', () => {
    expect(viecConThieu(THANG as never)).toBe('Em đọc nốt bước 2')
    const du = { ...THANG, coTheGui: true, cong: THANG.cong.map((c) => (c.ma === 'chi_buoc' ? c : { ...c, dat: true, viec: '' })) }
    expect(viecConThieu(du as never)).toBe('Em đã tự gỡ đủ các bậc. Chọn bước em còn vướng rồi gửi thầy.')
  })

  it('khung.html có "Đọc từng bước": báo mo_buoc / kiem, gửi câu kiểm lên trang mẹ, nghe kết quả — vẫn không gọi mạng, không chứa đáp án', () => {
    const h = fs.readFileSync(path.resolve(__dirname, '../public/loi-giai/khung.html'), 'utf8')
    for (const s of ["bao('mo_buoc'", "bao('kiem'", "loai: 'khung-cau-kiem'", "'cau-kiem-kq'", 'Thầy gỡ', 'Đã hiểu, sang bước sau']) expect(h).toContain(s)
    expect(h).toContain("connect-src 'none'")
    expect(h).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon/)
  })
})
