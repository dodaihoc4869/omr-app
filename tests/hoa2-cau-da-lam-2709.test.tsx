// GAME HÓA 2.0 — màn "Câu đã làm" (src/components/hoa2/CauDaLam.tsx): 5 bộ lọc có đếm, lời giải bằng ĐÚNG TheCau `xem_lai`
// (qua chuanHoaLoiGiaiCau — không khối lời giải thứ hai), Tải PDF = chi tiết ≤ 60 câu/lượt → dungPhieu → hộp In của phiếu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import CauDaLam, { themInTuDong, xepCau } from '../src/components/hoa2/CauDaLam'
import { cauLuyenTuChiTiet, loiGiaiChoTheCau, propsTheCau, tachDungSai } from '../src/components/hoa2/cau-chuyen'
import { docChiTiet, type CauDaLamMuc } from '../src/components/hoa2/api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const LOI_GIAI_I = {
  chot: 'CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH; tỉ lệ mol ester : muối = 1 : 1.',
  tung_pa: {
    A: { dung: false, vi_sao: 'Tính nhầm n(ester) = 0,05 mol.' },
    B: { dung: true, vi_sao: 'n(ester) = 0,1 mol → 8,2 gam.' },
    C: { dung: false, vi_sao: 'Lấy nhầm gốc C₂H₅–.' },
    D: { dung: false, vi_sao: 'Sai gốc acid.' },
  },
}
const CT_17 = {
  de: { qid: 'q17', maDe: 'DE1', version: '1', group: 'g', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH dư. Khối lượng muối thu được là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'van_dung', sao: 1, kienThuc: [] },
  dapAn: 'B',
  loiGiai: LOI_GIAI_I,
  emTraLoi: 'C',
}
const CAU = [
  { qid: 'q17', chienDichId: 'cd1', stt: 17, phan: 'I', mucDo: 'VD', tenDang: 'Thuỷ phân ester', trangThai: 'can_day_lai', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-09-29', dung: false, coGoiY: false }, { ngay: '2026-10-01', dung: false, coGoiY: true }] },
  { qid: 'q5', chienDichId: 'cd1', stt: 5, phan: 'II', mucDo: 'hieu', tenDang: 'Chất béo', trangThai: 'dang_on', lanCuoiDung: true, henOn: '2026-10-05', lichSu: [{ ngay: '2026-09-30', dung: true, coGoiY: false }] },
  { qid: 'q31', chienDichId: 'cd1', stt: 31, phan: 'III', mucDo: 'hieu', tenDang: 'Đồng phân ester', trangThai: 'thanh_thao', lanCuoiDung: true, henOn: null, lichSu: [{ ngay: '2026-09-28', dung: true, coGoiY: false }] },
  { qid: 'x1', chienDichId: 'cd0', stt: 1, phan: 'I', mucDo: 'biet', tenDang: 'Glucose', trangThai: 'dang_on', lanCuoiDung: false, henOn: '2026-10-03', lichSu: [{ ngay: '2026-09-20', dung: false, coGoiY: false }] },
]
const DANH_SACH = {
  ok: true,
  chienDich: [
    { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', tong: 120 },
    { id: 'cd0', ten: 'Carbohydrate', hanNop: '2026-09-25', tong: 60 },
  ],
  cau: CAU,
}

type Tra = { body?: any; nem?: boolean } | ((body: any) => { body?: any })
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra> = {}
beforeEach(() => {
  tra = {}
  cuocGoi = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const body = JSON.parse(init?.body || '{}')
      cuocGoi.push({ url: String(url), body })
      const t = tra[new URL(String(url)).pathname]
      const r = typeof t === 'function' ? t(body) : t
      if (r && 'nem' in r && r.nem) throw new Error('mất mạng')
      return { ok: true, status: 200, json: async () => r?.body ?? { ok: false, error: 'không có' } }
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
const goiTheo = (duong: string) => cuocGoi.filter((c) => new URL(c.url).pathname === duong)

describe('đổi câu sang khuôn chuẩn (không khối lời giải thứ hai)', () => {
  it('lời giải thô của kho → LoiGiaiCauTruc của TheCau qua chuanHoaLoiGiaiCau (I: tungPa; II: tungY; III: buoc + kết quả; thiếu ⇒ undefined)', () => {
    const lg = loiGiaiChoTheCau(JSON.stringify(LOI_GIAI_I), 'I', 'B')!
    expect(lg.chot).toContain('CH₃COONa')
    expect(lg.tungPa?.B).toEqual({ dung: true, viSao: 'n(ester) = 0,1 mol → 8,2 gam.' })
    expect(loiGiaiChoTheCau({ chot: 'x', tung_y: { a: { dung: true, vi_sao: 'Đúng' } } }, 'II', 'DSSD')!.tungY?.a?.viSao).toBe('Đúng')
    expect(loiGiaiChoTheCau({ chot: 'x', buoc: ['n = 0,1', 'm = 8,2'] }, 'III', '8,2')).toEqual({ chot: 'x', buoc: ['n = 0,1', 'm = 8,2'], ketQua: '8,2' })
    expect(loiGiaiChoTheCau(null, 'I', 'B')).toBeUndefined()
  })
  it('propsTheCau: chế độ xem_lai, đáp án đúng + lựa chọn của em; Đúng–sai tách 4 ý', () => {
    const p = propsTheCau(docChiTiet(CT_17)!, 17)
    expect(p).toMatchObject({ cheDo: 'xem_lai', phan: 'I', stt: 17, selected: 'C', correct: 'B', choicePerm: [0, 1, 2, 3] })
    expect(tachDungSai('ĐSSĐ')).toEqual(['D', 'S', 'S', 'D'])
    expect(tachDungSai('DS')).toBeNull()
  })
  it('cauLuyenTuChiTiet: câu sai lần gần nhất mang nhãn "đề của em" + em chọn; mức độ đổi về khoá chuẩn', () => {
    const c = cauLuyenTuChiTiet(docChiTiet(CT_17)!, CAU[0] as CauDaLamMuc)
    expect(c).toMatchObject({ id: 'q17', phan: 'I', dapAn: 'B', mucDo: 'van_dung', luaChon: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'] })
    expect(c.chuaCho).toMatchObject({ laDeCuaEm: true, daChon: 'C', soCau: 17 })
    expect(c.lyDo?.length).toBe(4)
  })
  it('xếp theo lần làm gần nhất; chèn lệnh In tự động trước </body> cuối', () => {
    expect(xepCau(CAU.slice(0, 3) as CauDaLamMuc[]).map((c) => c.qid)).toEqual(['q17', 'q5', 'q31'])
    const h = themInTuDong('<html><body>a</body></html>')
    expect(h).toMatch(/getElementById\('pdf-giai'\)[\s\S]*<\/script><\/body><\/html>$/)
  })
})

describe('CauDaLam — theo bản vẽ HS-CauDaLam', () => {
  it('chọn chiến dịch mới nhất, 5 bộ lọc có đếm, lọc đổi danh sách; thẻ có nhãn câu + trạng thái + lịch ôn', async () => {
    tra['/game-v2/hoa2-cau-da-lam'] = { body: DANH_SACH }
    const { container } = render(<CauDaLam token="tk" hoTen="Nguyễn An" sbd="123" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Tất cả 3' })
    expect(goiTheo('/game-v2/hoa2-cau-da-lam')[0].body).toEqual({ token: 'tk' })
    expect((screen.getByLabelText('Chiến dịch') as HTMLSelectElement).value).toBe('cd1')
    for (const n of ['Sai lần gần nhất 1', 'Đang ôn 1', 'Thành thạo 1', 'Cần thầy dạy lại 1']) expect(screen.getByRole('button', { name: n })).toBeTruthy()
    expect(container.querySelectorAll('.h2-the').length).toBe(3)
    expect(container.textContent).toContain('Câu 17 · Trắc nghiệm · Vận dụng')
    expect(container.textContent).toContain('Đến lịch ôn lại: Thứ Hai 05/10')
    expect(container.textContent).not.toContain('q17') // không mã nội bộ trên màn
    fireEvent.click(screen.getByRole('button', { name: 'Sai lần gần nhất 1' }))
    expect(screen.getByRole('button', { name: 'Sai lần gần nhất 1' }).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelectorAll('.h2-the').length).toBe(1)
    expect(screen.getByRole('button', { name: /Tải PDF · 1 câu đang lọc/ })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Chiến dịch'), { target: { value: 'cd0' } })
    expect(container.textContent).toContain('Glucose')
  })

  it('bấm thẻ ⇒ hoa2-cau-chi-tiet (qid) ⇒ đề + LỜI GIẢI chuẩn của TheCau (Kiến thức cốt lõi, ✓✗ từng phương án) + lịch sử', async () => {
    tra['/game-v2/hoa2-cau-da-lam'] = { body: DANH_SACH }
    tra['/game-v2/hoa2-cau-chi-tiet'] = { body: { ok: true, cau: [CT_17] } }
    const { container } = render(<CauDaLam token="tk" hoTen="Nguyễn An" sbd="123" onVe={() => {}} />)
    const nut = await screen.findByRole('button', { name: /Câu 17 · Trắc nghiệm · Vận dụng/ })
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    await screen.findByText(/Thuỷ phân hoàn toàn 8,8 gam/)
    expect(goiTheo('/game-v2/hoa2-cau-chi-tiet')[0].body).toEqual({ token: 'tk', qid: 'q17' })
    const mo = container.querySelector('.h2-the-mo') as HTMLElement
    expect(mo.querySelector('.m3 .loi-giai')).not.toBeNull()
    expect(within(mo).getByText('LỜI GIẢI')).toBeTruthy()
    expect(within(mo).getByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(mo.querySelectorAll('.lg-y').length).toBe(4)
    expect(mo.querySelectorAll('.loi-giai').length).toBe(1)
    expect(mo.textContent).toContain('Sai 01/10 · có gợi ý')
    expect(container.querySelector('.h2-the[data-mo="true"]')!.textContent).toContain('Thầy chữa câu này trên lớp')
  })

  it('Tải PDF: lấy chi tiết ≤ 60 câu/lượt, dựng phiếu bằng dungPhieu, mở khung phiếu kèm lệnh In của chính phiếu', async () => {
    const nhieu = Array.from({ length: 61 }, (_, i) => ({ ...CAU[1], qid: `n${i}`, stt: i + 1 }))
    tra['/game-v2/hoa2-cau-da-lam'] = { body: { ok: true, chienDich: [DANH_SACH.chienDich[0]], cau: nhieu } }
    tra['/game-v2/hoa2-cau-chi-tiet'] = (b: any) => ({
      body: { ok: true, cau: (b.qids ?? [b.qid]).map((q: string) => ({ ...CT_17, de: { ...CT_17.de, qid: q } })) },
    })
    const { container } = render(<CauDaLam token="tk" hoTen="Nguyễn An" sbd="123" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Tải PDF · 61 câu đang lọc/ }))
    await waitFor(() => expect(document.querySelector('iframe')).not.toBeNull(), { timeout: 5000 })
    const lo = goiTheo('/game-v2/hoa2-cau-chi-tiet')
    expect(lo.length).toBe(2)
    expect(lo[0].body.qids).toHaveLength(60)
    expect(lo[1].body).toEqual({ token: 'tk', qid: 'n60' })
    const html = document.querySelector('iframe')!.getAttribute('srcdoc') || ''
    expect(html).toContain('CÂU ĐÃ LÀM')
    expect(html).toContain('id="pdf-giai"')
    expect(html).toContain("getElementById('pdf-giai')")
    expect(html).toContain('Thuỷ phân hoàn toàn 8,8 gam')
    expect(container.querySelectorAll('.h2-cdl-nut-chinh').length).toBe(1)
  })

  it('lỗi mạng ⇒ nói thật + nút Thử lại; cờ tắt ⇒ báo mục chưa mở', async () => {
    tra['/game-v2/hoa2-cau-da-lam'] = { nem: true }
    render(<CauDaLam token="tk" hoTen="" sbd="1" onVe={() => {}} />)
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa kết nối được máy chủ')
    tra['/game-v2/hoa2-cau-da-lam'] = { body: { ok: true, cheDo2: false } }
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByText(/Mục Câu đã làm chưa mở cho em/)
  })
})
