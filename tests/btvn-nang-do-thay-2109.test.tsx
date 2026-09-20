// BTVN "NÂNG ĐỠ" — PHÍA APP THẦY (Code 4, 21/09; bản vẽ docs/ban-ve-btvn-nang-do-2109/ thầy duyệt).
// Công tắc Cá nhân hoá (mặc định BẬT, tắt = như cũ) · ghim câu TUỲ CHỌN (ghim=[] vẫn giao/xem trước được) · Xem trước phân bổ (máy chủ tính, chưa có lệnh ⇒ nói thật).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import type { CauGiao, TomTatBo } from '../src/lib/btvn-nang-do'
import type { TeacherExamSource } from '../src/data/examContent'
import { EM_MOI_LUOT, GHIM_TOI_DA, maDangCuaThay, mucSo, nhanCuaCau, taoCauGiao, taoHatGiong } from '../src/lib/btvn-nang-do-thay'
import KhoiCaNhanHoa from '../src/components/KhoiCaNhanHoa'
import XemTruocPhanBo from '../src/components/XemTruocPhanBo'

const m = vi.hoisted(() => ({ xemTruoc: vi.fn(), chonLoi: vi.fn() }))
vi.mock('../src/lib/btvn-nang-do', () => ({ chonLoi: (...a: unknown[]) => m.chonLoi(...a) }))
vi.mock('../src/lib/btvn-nang-do-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/btvn-nang-do-thay')>()), xemTruocPhanBo: (...a: unknown[]) => m.xemTruoc(...a) }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const cauMau = (n: number): CauGiao[] =>
  Array.from({ length: n }, (_, i) => ({ qid: `Q${i + 1}`, dang: i % 3 === 0 ? null : `D${i % 4}`, chuyenDe: `Chuyên đề ${i % 3}`, mucDo: (i % 3) as 0 | 1 | 2, sao: 1, phan: 'I' as const }))

// ---------------------------------------------------------------- lớp nối
describe('taoCauGiao — câu của các tờ đề đã tick, kèm dạng/mức/sao đọc trên máy thầy', () => {
  const de = (maDe: string, o: Partial<TeacherExamSource>): TeacherExamSource => ({ maDe, nhom: 'n', nguon: 'x', phanI: [], phanII: [], phanIII: [], ...o }) as TeacherExamSource
  it('thứ tự tờ đề rồi phần I → II → III; dạng/mức/sao/chuyên đề lấy đúng; thiếu thì null/rỗng/0/Biết — không đoán', () => {
    const c = taoCauGiao([
      de('A', {
        phanI: [{ id: 'A-I-1', chuyenDe: 'Ester', mucDo: 'van_dung', dang: { ma: 'ESTE_THUY_PHAN', ten: 'Thuỷ phân ester' }, canChua: { sao: 2 } }, { id: 'A-I-2' }] as never,
        phanII: [{ id: 'A-II-3', mucDo: 'hieu' }] as never,
        phanIII: [{ id: 'A-III-4', mucDo: 'lạ', correct: '0,5' }] as never,
      }),
      de('B', { phanI: [{ id: 'B-I-1', chuyenDe: 'Lipid', dang: null }] as never }),
    ])
    expect(c.map((x) => x.qid)).toEqual(['A-I-1', 'A-I-2', 'A-II-3', 'A-III-4', 'B-I-1'])
    expect(c[0]).toEqual({ qid: 'A-I-1', dang: 'ESTE_THUY_PHAN', chuyenDe: 'Ester', mucDo: 2, sao: 2, phan: 'I' })
    expect(c[1]).toEqual({ qid: 'A-I-2', dang: null, chuyenDe: '', mucDo: 0, sao: 0, phan: 'I' })
    expect(c.map((x) => x.phan)).toEqual(['I', 'I', 'II', 'III', 'I'])
    expect(c[2].mucDo).toBe(1)
    expect(c[3].mucDo).toBe(0)
  })
  it('mucSo / maDangCuaThay / nhãn câu', () => {
    expect([mucSo('biet'), mucSo('hieu'), mucSo('van_dung'), mucSo(undefined), mucSo('x')]).toEqual([0, 1, 2, 0, 0])
    expect(maDangCuaThay({ dang: 'D1', chuyenDe: 'Ester' })).toBe('D1')
    expect(maDangCuaThay({ dang: null, chuyenDe: 'Ester' })).toBe('CD:Ester')
    expect(nhanCuaCau('khoi_dong').chu).toBe('Khởi động')
    expect(nhanCuaCau('loi').chu).toBe('Cốt lõi')
    expect(nhanCuaCau('dang_yeu').chu).toBe('Dành riêng cho em')
    expect(nhanCuaCau('cung_co').chu).toBe('Dành riêng cho em')
    expect(nhanCuaCau('thu_thach').chu).toBe('Thử thách · sai không sao')
    expect(nhanCuaCau('loi_cao').chu).toBe('Cốt lõi · câu thưởng') // câu lõi cao hơn bậc em (Boss thêm 21/09)
    expect(taoHatGiong().length).toBeLessThanOrEqual(40)
    expect(taoHatGiong()).not.toBe(taoHatGiong())
  })
})

describe('xemTruocPhanBo + giaoBtvn — hợp đồng máy chủ, không giả số', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
    vi.doMock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
  })
  const goi = vi.fn()
  const stub = (res: () => Promise<unknown>) =>
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi(url, init)
      return res()
    })
  const tomTat = { tong: 46, soLoi: 26, soRieng: 15, soThuThach: 5, soLoiCao: 0, soBiet: 24, soHieu: 17, soVanDung: 5, soChang: 7, soDangYeu: 3, soDangYeuDuCau: 3, nganSachCau: 50 }
  const chay = async (o: Record<string, unknown> = {}) =>
    (await vi.importActual<typeof import('../src/lib/btvn-nang-do-thay')>('../src/lib/btvn-nang-do-thay')).xemTruocPhanBo({ dsSbd: ['1', '2'], dsMaDe: ['D1'], cau: cauMau(3), ghim: [], hanNop: '2026-09-27T15:00:00Z', hatGiong: 'gHAT', ...o })

  it('POST /btvn/xem-truoc {dsSbd, dsMaDe, cau, ghim, hanNop, hatGiong} kèm x-ma-bi-mat; ghim rỗng hợp lệ; parse ds + chiTiet', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, hatGiong: 'gHAT', soCauBai: 80, soLoi: 26, loi: ['Q1', 'Q2'], ds: [{ sbd: '1', hoTen: 'A', daChot: false, coHoSo: false, nganSach: { soNgay: 7 }, tomTat }, { sbd: '', tomTat }, { sbd: '3' }], chiTiet: { sbd: '1', chang: [['Q1', 'Q2'], ['Q3']], nhan: { Q1: 'loi' } } }) }))
    const kq = await chay({ sbdChiTiet: '1' })
    expect(goi.mock.calls[0][0]).toBe('https://may.test/btvn/xem-truoc')
    const than = JSON.parse(String(goi.mock.calls[0][1].body))
    expect(than).toMatchObject({ dsSbd: ['1', '2'], dsMaDe: ['D1'], ghim: [], hatGiong: 'gHAT', hanNop: '2026-09-27T15:00:00Z', sbdChiTiet: '1' })
    expect(than.cau).toHaveLength(3)
    expect(goi.mock.calls[0][1].headers['x-ma-bi-mat']).toBe('mat-thu')
    expect(kq).toMatchObject({ hatGiong: 'gHAT', soCauBai: 80, soLoi: 26, loi: ['Q1', 'Q2'] })
    expect(kq.ds).toHaveLength(1) // dòng thiếu sbd / tomTat bị bỏ
    expect(kq.ds[0]).toMatchObject({ sbd: '1', coHoSo: false, daChot: false })
    expect(kq.chiTiet).toEqual({ sbd: '1', chang: [['Q1', 'Q2'], ['Q3']], nhan: { Q1: 'loi' } })
  })
  it('không xin chi tiết thì thân KHÔNG có sbdChiTiet; tối đa 50 em mỗi lượt (cắt ở nguồn)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, ds: [] }) }))
    await chay({ dsSbd: Array.from({ length: 80 }, (_, i) => `S${i}`) })
    const than = JSON.parse(String(goi.mock.calls[0][1].body))
    expect('sbdChiTiet' in than).toBe(false)
    expect(than.dsSbd).toHaveLength(EM_MOI_LUOT)
  })
  it('máy chủ chưa có lệnh (404) / từ chối / mất mạng / quá hạn / không đọc được → lỗi thật bằng lời', async () => {
    stub(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    await expect(chay()).rejects.toThrow('Máy chủ chưa có lệnh Xem trước phân bổ — chưa có số nào để hiện.')
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: 'Tính năng đang tắt.' }) }))
    await expect(chay()).rejects.toThrow('Tính năng đang tắt.')
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('x')
    })
    await expect(chay()).rejects.toThrow('Không nối được máy chủ — chưa xem trước được.')
    vi.stubGlobal('fetch', async () => {
      throw Object.assign(new Error('a'), { name: 'AbortError' })
    })
    await expect(chay()).rejects.toThrow(/Máy chủ trả lời chậm/)
    stub(async () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError('x')) }))
    await expect(chay()).rejects.toThrow('Máy chủ trả lời không đọc được — chưa xem trước được.')
  })

  const giao = async (nangDo?: { cau: unknown[]; ghim: string[]; hatGiong?: string }) => (await vi.importActual<typeof import('../src/lib/btvn-may-chu-moi')>('../src/lib/btvn-may-chu-moi')).giaoBtvn({ URL: 'https://may.test', BAT: true, HAN_GIAY: 5 } as never, 'mat', ['C1'], ['D1'], undefined, undefined, undefined, nangDo)
  it('giao KHÔNG nâng đỡ: thân gửi y như cũ (không thêm khoá nào); giao nâng đỡ: thêm caNhan/cau/ghim/hatGiong (ghim rỗng hợp lệ)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, maBtvn: 'B1', soEm: 3, soCau: 80, hanNop: 'x' }) }))
    await giao()
    expect(Object.keys(JSON.parse(String(goi.mock.calls[0][1].body))).sort()).toEqual(['dsMaCa', 'dsMaDe'])
    goi.mockClear()
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, maBtvn: 'B1', soEm: 3, soCau: 80, hanNop: 'x', caNhan: true, soLoi: 26, canhBao: 'loi_it_hon_6', boQuaQid: ['Z9'], thieuMeta: 2 }) }))
    const kq = await giao({ cau: cauMau(2), ghim: [], hatGiong: 'gHAT' })
    const than = JSON.parse(String(goi.mock.calls[0][1].body))
    expect(than).toMatchObject({ caNhan: true, ghim: [], hatGiong: 'gHAT' })
    expect(than.cau).toHaveLength(2)
    expect(kq).toMatchObject({ caNhan: true, soLoi: 26, canhBao: 'loi_it_hon_6', boQuaQid: ['Z9'], thieuMeta: 2 })
  })
  it('máy chủ chưa hỗ trợ (không trả caNhan) → kết quả caNhan=false để màn cảnh báo "giao như cũ"', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, maBtvn: 'B1', soEm: 3, soCau: 80, hanNop: 'x' }) }))
    expect((await giao({ cau: cauMau(2), ghim: [] })).caNhan).toBe(false)
  })
})

// ---------------------------------------------------------------- khối Cá nhân hoá
describe('KhoiCaNhanHoa — công tắc + ghim tuỳ chọn', () => {
  const dung = (o: Partial<Parameters<typeof KhoiCaNhanHoa>[0]> = {}) => {
    const p = { bat: true, doi: vi.fn(), cau: cauMau(12), ghim: [] as string[], doiGhim: vi.fn(), onXemTruoc: vi.fn(), ...o }
    const r = render(<KhoiCaNhanHoa {...p} />)
    return { ...r, ...p }
  }
  beforeEach(() => {
    m.chonLoi.mockImplementation(() => {
      throw new Error('chưa cài')
    })
  })

  it('công tắc role=switch "Cá nhân hoá (khuyên dùng)": bật → doi(false); TẮT → nói cả lớp nhận đủ N câu như cũ và ẩn ghim/xem trước', () => {
    const { doi, rerender, container } = dung()
    expect(screen.getByRole('switch', { name: 'Cá nhân hoá (khuyên dùng)' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('switch'))
    expect(doi).toHaveBeenCalledWith(false)
    rerender(<KhoiCaNhanHoa bat={false} doi={doi} cau={cauMau(12)} ghim={[]} doiGhim={vi.fn()} onXemTruoc={vi.fn()} />)
    expect(screen.getByText('Đang tắt — cả lớp nhận đủ 12 câu như cũ.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Xem trước phân bổ/ })).toBeNull()
    expect(container.querySelector('.bn-ghim')).toBeNull()
  })

  it('ghi rõ: "Bộ câu của em chốt khi em mở bài lần đầu" + không sửa thứ tự câu sau khi giao', () => {
    dung()
    expect(screen.getByRole('note').textContent).toContain('Bộ câu của em chốt khi em mở bài lần đầu')
    expect(screen.getByRole('note').textContent).toContain('không sửa thứ tự câu trong đề')
  })

  it('GHIM LÀ TUỲ CHỌN: tiêu đề "Ghim câu cả lớp bắt buộc (không bắt buộc ghim)"; ghim=0 → ô "0 câu ghim", KHÔNG cảnh báo; Xem trước KHÔNG bị khoá', () => {
    const { onXemTruoc, container } = dung({ ghim: [] })
    expect(screen.getByText('Ghim câu cả lớp bắt buộc (không bắt buộc ghim)')).toBeTruthy()
    const o = [...container.querySelectorAll('.bn-o')].find((x) => x.textContent?.includes('câu ghim')) as HTMLElement
    expect(o.querySelector('.bn-o-so')?.textContent).toBe('0')
    expect(container.querySelector('.bn-phu--canh')).toBeNull()
    expect(container.textContent).not.toMatch(/chưa ghim|phải ghim|cần ghim|thiếu ghim/i)
    const nut = screen.getByRole('button', { name: /Xem trước phân bổ/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(false)
    fireEvent.click(nut)
    expect(onXemTruoc).toHaveBeenCalledTimes(1)
  })

  it('lõi tính được (lõi thuần đã cài) → "26/80"; chưa cài / lỗi → "≈ 30 %", không bịa số', () => {
    m.chonLoi.mockImplementation((cau: CauGiao[]) => cau.slice(0, 4).map((c) => c.qid))
    const { container, unmount } = dung({ cau: cauMau(12) })
    expect(container.querySelector('.bn-o--tot .bn-o-so')?.textContent).toBe('4/12')
    unmount()
    m.chonLoi.mockImplementation(() => {
      throw new Error('chưa cài')
    })
    const r2 = dung({ cau: cauMau(12) })
    expect(r2.container.querySelector('.bn-o--tot .bn-o-so')?.textContent).toBe('≈ 30 %')
  })

  it('chọn câu để ghim: tick → doiGhim; tối đa 10 (câu thứ 11 bị tắt + báo); bỏ ghim bằng nút ×', () => {
    const cau = cauMau(14)
    const ghim = cau.slice(0, GHIM_TOI_DA).map((c) => c.qid)
    const { doiGhim } = dung({ cau, ghim })
    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu để ghim…' }))
    expect(screen.getByText(`Đã ghim tối đa ${GHIM_TOI_DA} câu — bỏ bớt một câu để ghim câu khác.`)).toBeTruthy()
    const hop = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(hop).toHaveLength(14)
    expect(hop[10].disabled).toBe(true)
    expect(hop[0].disabled).toBe(false)
    fireEvent.click(hop[0])
    expect(doiGhim).toHaveBeenLastCalledWith(ghim.slice(1)) // bỏ tick = bỏ ghim
    fireEvent.click(screen.getAllByRole('button', { name: /^Bỏ ghim/ })[1])
    expect(doiGhim).toHaveBeenLastCalledWith(ghim.filter((q) => q !== ghim[1]))
  })

  it('còn chỗ: tick câu mới → thêm vào cuối; chưa có câu nào (chưa tick đề) → nút Chọn câu / Xem trước tắt', () => {
    const { doiGhim, unmount } = dung({ cau: cauMau(3), ghim: ['Q1'] })
    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu để ghim…' }))
    fireEvent.click(screen.getAllByRole('checkbox')[2])
    expect(doiGhim).toHaveBeenLastCalledWith(['Q1', 'Q3'])
    unmount()
    dung({ cau: [] })
    expect((screen.getByRole('button', { name: 'Chọn câu để ghim…' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /Xem trước phân bổ/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})

// ---------------------------------------------------------------- Xem trước phân bổ
const tt = (tong: number, o: Partial<TomTatBo> = {}): TomTatBo => ({ tong, soLoi: 26, soRieng: tong - 31, soThuThach: 5, soLoiCao: 0, soBiet: 24, soHieu: 17, soVanDung: 5, soChang: 7, soDangYeu: 3, soDangYeuDuCau: 3, nganSachCau: 50, ...o })
const em = (sbd: string, hoTen: string, tomTat: TomTatBo, coHoSo = true) => ({ sbd, hoTen, daChot: false, coHoSo, tomTat })
const CT = { sbd: '007', chang: [['Q1', 'Q3'], ['Q2', 'Q4', 'Q5']], nhan: { Q1: 'khoi_dong', Q3: 'dang_yeu', Q2: 'loi', Q4: 'thu_thach', Q5: 'loi_cao' } }
const KQ = {
  hatGiong: 'gHAT',
  soCauBai: 80,
  soLoi: 26,
  loi: ['Q1', 'Q2'],
  ds: [em('007', 'Trần Thu Hà', tt(46)), em('034', 'Nguyễn Minh Khôi', tt(58, { soDangYeu: 0 })), em('015', 'Đỗ Khánh Linh', tt(40, { soDangYeu: 0, soVanDung: 0 }), false)],
  chiTiet: CT as typeof CT | null,
}
describe('XemTruocPhanBo — bảng từng em + danh sách câu', () => {
  const dau = { dsMaDe: ['D1'], cau: cauMau(5), ghim: [] as string[], hanNop: '2026-09-27T15:00:00Z', hatGiong: 'gHAT' }
  const dsSbd = ['007', '034', '015']
  const dung = (o: Partial<Parameters<typeof XemTruocPhanBo>[0]> = {}) => {
    const p = { dau, dsSbd, cau: cauMau(5), dangGiao: false, onDong: vi.fn(), onGiao: vi.fn(), ...o }
    return { ...render(<XemTruocPhanBo {...p} />), ...p }
  }

  it('gọi máy chủ MỘT lần với đúng lượt đầu + xin luôn chi tiết em đầu; ghim rỗng hợp lệ; bảng theo THỨ TỰ người nhận (không xếp hạng)', async () => {
    m.xemTruoc.mockResolvedValue(KQ)
    const { container } = dung()
    await screen.findByRole('button', { name: /Trần Thu Hà/ })
    expect(m.xemTruoc).toHaveBeenCalledTimes(1)
    expect(m.xemTruoc).toHaveBeenCalledWith({ ...dau, dsSbd, sbdChiTiet: '007' })
    const hang = [...container.querySelectorAll('.bn-tp-hang:not(.bn-tp-hang--dau)')]
    expect(hang.map((h) => h.querySelector('.bn-tp-ten b')?.textContent)).toEqual(['Trần Thu Hà', 'Nguyễn Minh Khôi', 'Đỗ Khánh Linh'])
    expect(hang[0].querySelector('.bn-tp-tong')?.textContent).toBe('46')
    expect(hang[0].querySelector('.bn-tp-thanh small')?.textContent).toBe('26 lõi · 20 riêng') // riêng = soRieng 15 + thử thách 5
    expect([...hang[0].querySelectorAll('.bn-tp-bac-o b')].map((x) => x.textContent)).toEqual(['24', '17', '5'])
    expect(hang[0].querySelector('.bn-tp-chang b')?.textContent).toBe('7')
    expect(hang[0].textContent).toContain('đang yếu 3 dạng')
    expect(hang[2].textContent).toContain('chưa có hồ sơ')
    expect(screen.getByText('Lõi chung 26 câu')).toBeTruthy()
    expect(screen.getByText('Xem trước — chưa ghi gì')).toBeTruthy()
    expect(container.textContent).not.toMatch(/xếp hạng|top \d|thứ nhất/i)
  })

  it('em đầu có sẵn danh sách câu theo chặng + nhãn lý do (Khởi động / Cốt lõi / Dành riêng / Thử thách / Cốt lõi · câu thưởng); em khác → gọi lại xin chi tiết đúng em ấy', async () => {
    m.xemTruoc.mockResolvedValueOnce(KQ).mockResolvedValueOnce({ ...KQ, ds: [KQ.ds[1]], chiTiet: { sbd: '034', chang: [['Q1']], nhan: { Q1: 'khoi_dong' } } })
    const { container } = dung()
    await screen.findByRole('button', { name: /Trần Thu Hà/ })
    const ct = () => container.querySelector('.bn-tp-chi-tiet') as HTMLElement
    expect([...ct().querySelectorAll('.bn-tp-chang-ten')].map((x) => x.textContent)).toEqual(['Chặng 1 · 2 câu', 'Chặng 2 · 3 câu'])
    expect([...ct().querySelectorAll('.bn-tp-cau .bn-chip')].map((x) => x.textContent)).toEqual(['Khởi động', 'Dành riêng cho em', 'Cốt lõi', 'Thử thách · sai không sao', 'Cốt lõi · câu thưởng'])
    expect(ct().textContent).toContain('dạng em đang yếu · đúng bậc của em')
    expect(ct().textContent).toContain('Câu 1 ·') // số thứ tự trong đề, không lộ qid
    fireEvent.click(screen.getByRole('button', { name: /Nguyễn Minh Khôi/ }))
    await waitFor(() => expect(m.xemTruoc).toHaveBeenCalledTimes(2))
    expect(m.xemTruoc).toHaveBeenLastCalledWith({ ...dau, dsSbd: ['034'], sbdChiTiet: '034' })
    await waitFor(() => expect(ct().querySelector('.bn-tp-em-ten')?.textContent).toContain('Nguyễn Minh Khôi'))
    await waitFor(() => expect([...ct().querySelectorAll('.bn-tp-cau .bn-chip')].map((x) => x.textContent)).toEqual(['Khởi động']))
    fireEvent.click(screen.getByRole('button', { name: /Trần Thu Hà/ })) // đã có trong bộ nhớ → không gọi lại
    expect(m.xemTruoc).toHaveBeenCalledTimes(2)
  })

  it('máy chủ chưa có lệnh → alert thật, KHÔNG bảng số nào; Esc và nút Đóng đóng tấm phủ', async () => {
    m.xemTruoc.mockRejectedValue(new Error('Máy chủ chưa có lệnh Xem trước phân bổ — chưa có số nào để hiện.'))
    const { container, onDong } = dung()
    expect((await screen.findByRole('alert')).textContent).toBe('Máy chủ chưa có lệnh Xem trước phân bổ — chưa có số nào để hiện.')
    expect(container.querySelector('.bn-tp-bang')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Đóng xem trước/ }))
    expect(onDong).toHaveBeenCalledTimes(2)
  })

  it('chưa có người nhận → nói rõ, KHÔNG gọi máy chủ', () => {
    dung({ dsSbd: [] })
    expect(screen.getByText('Chưa có học sinh nào để xem trước — chọn ca, lớp hoặc học sinh nhận bài trước.')).toBeTruthy()
    expect(m.xemTruoc).not.toHaveBeenCalled()
  })

  it('Giao bài ngay trong tấm phủ: nút ghi số người nhận; lỗi giao hiện ở đây; đang giao thì tắt', async () => {
    m.xemTruoc.mockResolvedValue(KQ)
    const { onGiao, rerender, container } = dung()
    fireEvent.click(await screen.findByRole('button', { name: 'Giao bài cho 3 em' }))
    expect(onGiao).toHaveBeenCalledTimes(1)
    rerender(<XemTruocPhanBo dau={dau} dsSbd={dsSbd} cau={cauMau(5)} dangGiao loiGiao="Không giao được bài thử" onDong={vi.fn()} onGiao={vi.fn()} />)
    expect(container.querySelector('.bn-tp-loi')?.textContent).toBe('Không giao được bài thử')
    expect((screen.getByRole('button', { name: 'Đang giao bài…' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('hơn 50 em → tải theo lượt 50; "Xem thêm em" nối lượt kế (đúng lát dsSbd) vào bảng', async () => {
    const tatCa = Array.from({ length: 70 }, (_, i) => `S${String(i).padStart(2, '0')}`)
    m.xemTruoc
      .mockResolvedValueOnce({ ...KQ, ds: tatCa.slice(0, 50).map((s) => em(s, `Em ${s}`, tt(40))), chiTiet: null })
      .mockResolvedValueOnce({ ...KQ, ds: tatCa.slice(50).map((s) => em(s, `Em ${s}`, tt(40))), chiTiet: null })
    const { container } = dung({ dsSbd: tatCa })
    fireEvent.click(await screen.findByRole('button', { name: 'Xem thêm em (20 em nữa)' }))
    await waitFor(() => expect(container.querySelectorAll('.bn-tp-hang:not(.bn-tp-hang--dau)')).toHaveLength(70))
    expect((m.xemTruoc.mock.calls[0][0] as { dsSbd: string[] }).dsSbd).toEqual(tatCa.slice(0, 50))
    expect((m.xemTruoc.mock.calls[1][0] as { dsSbd: string[] }).dsSbd).toEqual(tatCa.slice(50))
    expect(screen.queryByRole('button', { name: /Xem thêm em/ })).toBeNull()
  })
})

// ---------------------------------------------------------------- nối vào màn Giao bài
describe('nguồn: PhanCongScreen', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhanCongScreen.tsx'), 'utf8')
  it('công tắc mặc định BẬT; giao gửi nangDo CHỈ khi bật; ghim rỗng không chặn; máy chủ không trả caNhan ⇒ cảnh báo "giao NHƯ CŨ"', () => {
    expect(src).toContain('const [caNhan, setCaNhan] = useState(true)')
    expect(src).toContain('const nangDo = caNhan && cauDaChon.length > 0 ? { cau: cauDaChon, ghim: ghimHopLe, hatGiong: hatGiongRef.current } : undefined')
    expect(src).toContain('if (nangDo && kq.caNhan !== true) canh.push(')
    expect(src).toContain('bài này đã giao NHƯ CŨ')
    expect(src).toContain('hatGiong: hatGiongRef.current') // cùng hạt giống cho Xem trước và Giao
    expect(src).toContain("kq.canhBao === 'loi_it_hon_6'")
    expect(src).not.toMatch(/ghim(?:HopLe)?\.length\s*(?:===|<)\s*[01]/) // không có điều kiện bắt buộc ghim
    expect(src).toContain('<KhoiCaNhanHoa bat={caNhan}')
    expect(src).toContain('<XemTruocPhanBo')
  })
  it('css/tệp mới: không hex, không !important', () => {
    for (const f of ['src/screens/btvn-nang-do-m3.css', 'src/components/KhoiCaNhanHoa.tsx', 'src/components/XemTruocPhanBo.tsx', 'src/lib/btvn-nang-do-thay.ts']) {
      const t = fs.readFileSync(path.join(process.cwd(), f), 'utf8')
      expect(t, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      if (f.endsWith('.css')) expect(t).not.toContain('!important')
    }
  })
})
