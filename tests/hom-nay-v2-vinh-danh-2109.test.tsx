// HÔM NAY BẢN 2 · bước 4 — ô "VINH DANH HÔM NAY" (thầy lệnh 21/09; bản vẽ docs/ban-ve-hom-nay-v2-2109/; chuẩn chữ docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md).
// Nói thật: chỉ dựng bục nào máy chủ CÓ SỐ; không số ⇒ ô thu gọn MỘT dòng; chưa có lệnh ⇒ lời thật. "Chiếu vinh danh" = tấm phủ chữ to, Esc/Đóng để thoát.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import VinhDanh, { cacBia } from '../src/components/hom-nay/VinhDanh'
import { docVinhDanh, layVinhDanhNgay } from '../src/lib/hom-nay-v2'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean }
function dungMayChu(bang: Record<string, (body: Record<string, unknown>) => Tra>) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    goi(duong, JSON.parse(String(init.body ?? '{}')))
    const h = bang[duong]
    if (!h) return { status: 404, ok: false, json: async () => ({}) }
    const r = h({})
    if (r.cham) {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    }
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const DAY_DU = {
  ok: true,
  ngay: '2026-09-21',
  chamNhat: { sbd: '1', hoTen: 'Nguyễn Văn Minh', lop: '12A1', exp: 385 },
  tienBoNhat: { sbd: '2', hoTen: 'Trần Thị Lan', lop: '12A1', soDangLenBac: 4, soCauDungLai: 12 },
  benBiNhat: { sbd: '3', hoTen: 'Đỗ Khánh Linh', lop: '11B1', chuoiNgay: 21 },
  diemCao: { sbd: '4', hoTen: 'Lê Minh Đức', lop: '12A1', diem: 9.5, tenCa: 'Chương 1' },
  soTruyVan: 3,
}

describe('lớp nối /gv/vinh-danh-ngay', () => {
  it('docVinhDanh: bục thiếu số ⇒ null (không bịa 0); người không tên lẫn SBD bị bỏ; số sai kiểu bị bỏ', () => {
    const r = docVinhDanh({ ngay: '2026-09-21', chamNhat: { sbd: '1', hoTen: 'A', lop: 'x' }, tienBoNhat: { sbd: '2', hoTen: 'B', lop: 'x', soDangLenBac: 'nhieu' }, benBiNhat: {}, diemCao: { sbd: '4', hoTen: 'D', lop: 'x', diem: 8 } })
    expect(r.chamNhat).toBeNull() // thiếu exp ⇒ không có bục
    expect(r.tienBoNhat).toBeNull() // bục "tiến bộ" không có số nào đọc được ⇒ không dựng (không điền 0)
    expect(docVinhDanh({ tienBoNhat: { sbd: '2', hoTen: 'B', lop: 'x', soCauDungLai: 7 } }).tienBoNhat).toMatchObject({ soDangLenBac: null, soCauDungLai: 7 })
    expect(cacBia(docVinhDanh({ tienBoNhat: { sbd: '2', hoTen: 'B', lop: 'x', soCauDungLai: 7 } }))[0].dong).toBe('x · đúng lại 7 câu / 7 ngày') // chỉ nói phần máy chủ có
    expect(r.benBiNhat).toBeNull()
    expect(r.diemCao).toMatchObject({ diem: 8, tenCa: '' })
  })

  it('layVinhDanhNgay: POST /gv/vinh-danh-ngay; 404 ⇒ lời thật', async () => {
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ json: DAY_DU }) })
    const a = await layVinhDanhNgay()
    expect(a.ok && a.du.chamNhat?.exp).toBe(385)
    expect(goi.mock.calls[0][0]).toBe('/gv/vinh-danh-ngay')
    dungMayChu({})
    const l = await layVinhDanhNgay()
    expect(l).toMatchObject({ ok: false, loai: 'chua_co_lenh' })
  })

  it('cacBia: chỉ dựng bục có số; dòng phụ đúng chữ; điểm dùng dấu phẩy', () => {
    const bia = cacBia(docVinhDanh(DAY_DU))
    expect(bia.map((b) => b.tieuDe)).toEqual(['Chăm nhất', 'Tiến bộ nhất', 'Bền bỉ nhất', 'Điểm cao ca kiểm tra gần nhất'])
    expect(bia.map((b) => b.dong)).toEqual(['12A1 · +385 EXP hôm nay', '12A1 · 4 dạng lên bậc · đúng lại 12 câu / 7 ngày', '11B1 · chuỗi 21 ngày liền', '12A1 · 9,5 điểm · Chương 1'])
    expect(cacBia(docVinhDanh({ ngay: 'x' }))).toEqual([])
  })
})

describe('VinhDanh — ô VINH DANH HÔM NAY', () => {
  it('CÓ ĐỦ 4 BỤC: tên + dòng phụ; bấm tên mở toàn cảnh em; có nút "Chiếu vinh danh"', async () => {
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ json: DAY_DU }) })
    const moEm = vi.fn()
    const { container } = render(<VinhDanh onMoEm={moEm} />)
    await screen.findByText('12A1 · +385 EXP hôm nay')
    expect(container.querySelectorAll('.hn2-bia')).toHaveLength(4)
    expect(screen.getByText('Bền bỉ nhất')).toBeTruthy()
    expect(screen.getByText('11B1 · chuỗi 21 ngày liền')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Trần Thị Lan — mở toàn cảnh' }))
    expect(moEm).toHaveBeenCalledWith('2')
    expect(screen.getByRole('button', { name: 'Chiếu vinh danh' })).toBeTruthy()
  })

  it('THIẾU BỤC: chỉ hiện bục có số (ví dụ hôm nay chưa có ca ⇒ không có "Điểm cao"), không bịa', async () => {
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ json: { ok: true, ngay: '2026-09-21', chamNhat: DAY_DU.chamNhat } }) })
    const { container } = render(<VinhDanh onMoEm={() => {}} />)
    await screen.findByText('Chăm nhất')
    expect(container.querySelectorAll('.hn2-bia')).toHaveLength(1)
    expect(container.textContent).not.toContain('Điểm cao')
  })

  it('KHÔNG CÓ SỐ / CHƯA CÓ LỆNH / LỖI: thu gọn MỘT dòng nói thật, không nút Chiếu, không tên em nào', async () => {
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ json: { ok: true, ngay: '2026-09-21' } }) })
    const a = render(<VinhDanh onMoEm={() => {}} />)
    await screen.findByText('Hôm nay chưa có số liệu để vinh danh em nào.')
    expect(a.container.querySelector('.hn2-vinh-danh--gon')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Chiếu vinh danh' })).toBeNull()
    cleanup()
    dungMayChu({})
    const b = render(<VinhDanh onMoEm={() => {}} />)
    await screen.findByText('Máy chủ chưa có lệnh vinh danh theo ngày — chưa có số nào để hiện.')
    expect(b.container.querySelectorAll('.hn2-bia')).toHaveLength(0)
    cleanup()
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ cham: true }) })
    render(<VinhDanh onMoEm={() => {}} />)
    expect((await screen.findByText(/chậm/)).textContent).not.toMatch(/chưa có lệnh/)
  })

  it('CHIẾU VINH DANH: tấm phủ toàn màn (dialog) có đủ bục, ngày "Thứ …, dd/mm/yyyy"; Esc và nút Đóng đều thoát', async () => {
    dungMayChu({ '/gv/vinh-danh-ngay': () => ({ json: DAY_DU }) })
    render(<VinhDanh onMoEm={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu vinh danh' }))
    const hop = screen.getByRole('dialog', { name: 'Vinh danh hôm nay — chiếu lên bảng' })
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(within(hop).getByText('Nguyễn Văn Minh')).toBeTruthy()
    expect(within(hop).getAllByText(/^(Chăm|Tiến|Bền|Điểm)/)).toHaveLength(4)
    expect(within(hop).getByText('Thứ Hai, 21/09/2026')).toBeTruthy()
    expect(document.activeElement).toBe(within(hop).getByRole('button', { name: 'Đóng' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu vinh danh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
