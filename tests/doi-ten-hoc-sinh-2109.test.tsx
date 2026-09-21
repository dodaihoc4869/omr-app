// NÚT "ĐỔI TÊN HỌC SINH" trong hồ sơ (thầy lệnh 21/09; hợp đồng docs/hop-dong-doi-ten-hoc-sinh-2109.md mục 2).
// Máy chủ chưa có lệnh / lỗi / từ chối ⇒ báo thật, KHÔNG đổi riêng ở máy thầy (tránh hai nơi lệch tên).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import type { EmTomTat, HoSoEm } from '../src/lib/exam-api'
import DoiTenHocSinh from '../src/components/DoiTenHocSinh'
import { chuanHoaTen } from '../src/lib/doi-ten-hs-api'

const m = vi.hoisted(() => ({
  doiTen: vi.fn(),
  hoSoEm: vi.fn(),
  toast: vi.fn(),
  moHoSoEm: vi.fn(),
  setClassList: vi.fn(),
  doiTenLop: vi.fn(),
  sbd: { v: '' },
  classList: [{ sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1' }, { sbd: '002', hoTen: 'Trần Thu Hà', lop: '12A1' }],
}))

// ---------------------------------------------------------------- chuẩn hoá
describe('chuanHoaTen — cùng luật với máy chủ', () => {
  it('cắt đầu/cuối, gộp khoảng trắng liền nhau, giữ dấu tiếng Việt', () => {
    expect(chuanHoaTen('  Lê   Minh \t Đạt ')).toEqual({ ok: true, ten: 'Lê Minh Đạt' })
  })
  it('2..60 ký tự; ngoài khoảng → từ chối bằng lời; ký tự điều khiển → từ chối', () => {
    expect(chuanHoaTen('A')).toMatchObject({ ok: false, loi: 'Tên phải từ 2 đến 60 ký tự.' })
    expect(chuanHoaTen('   ')).toMatchObject({ ok: false })
    expect(chuanHoaTen('Ạ'.repeat(60))).toMatchObject({ ok: true })
    expect(chuanHoaTen('Ạ'.repeat(61))).toMatchObject({ ok: false, loi: 'Tên phải từ 2 đến 60 ký tự.' })
    expect(chuanHoaTen(`Lê${String.fromCharCode(7)}Đạt`)).toEqual({ ok: false, loi: 'Tên có ký tự không hợp lệ.' })
  })
})

// ---------------------------------------------------------------- lệnh máy chủ
describe('doiTenHocSinh — không giả thành công', () => {
  const goi = vi.fn()
  const stub = (res: () => Promise<unknown>) =>
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi(url, init)
      return res()
    })
  beforeEach(() => {
    goi.mockClear()
    vi.resetModules()
    vi.doMock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
    vi.doMock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
  })
  afterEach(() => vi.unstubAllGlobals())
  const chay = async (ten = 'Lê Minh Đạt') => (await vi.importActual<typeof import('../src/lib/doi-ten-hs-api')>('../src/lib/doi-ten-hs-api')).doiTenHocSinh('001', ten)

  it('POST /hoc-sinh/doi-ten {sbd, hoTen} kèm x-ma-bi-mat; trả tên cũ/mới và số dòng đã đổi', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', soDong: { danh_sach: 1, hoc_sinh: 1, luot: 3, btvn_em: 2, phong_cho: 0 } }) }))
    const k = await chay()
    expect(goi.mock.calls[0][0]).toBe('https://may.test/hoc-sinh/doi-ten')
    expect(JSON.parse(String(goi.mock.calls[0][1].body))).toEqual({ sbd: '001', hoTen: 'Lê Minh Đạt' })
    expect(goi.mock.calls[0][1].headers['x-ma-bi-mat']).toBe('mat-thu')
    expect(k).toMatchObject({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: false })
    expect(k.soDong.luot).toBe(3)
  })

  it('máy chủ chưa có lệnh (404) → lỗi thật "chưa đổi tên ở đâu cả"', async () => {
    stub(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    await expect(chay()).rejects.toThrow('Máy chủ chưa có lệnh Đổi tên — chưa đổi tên ở đâu cả.')
  })

  it('từ chối → NGUYÊN VĂN lý do của máy chủ (SBD lạ, tên không hợp lệ…)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: 'Không tìm thấy học sinh có số báo danh này.' }) }))
    await expect(chay()).rejects.toThrow('Không tìm thấy học sinh có số báo danh này.')
  })

  it('trùng tên cũ: máy chủ báo khongDoi → trả cờ (màn nói "không có gì để đổi", không cập nhật máy thầy)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, khongDoi: true, sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đức' }) }))
    expect((await chay('Lê Minh Đức')).khongDoi).toBe(true)
  })

  it('trùng tên theo máy chủ thật: {ok:false, khongDoi:true, error} → trả cờ khongDoi (không ném lỗi, không ghi)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, khongDoi: true, error: 'Tên mới trùng tên cũ.' }) }))
    expect((await chay('Lê Minh Đức')).khongDoi).toBe(true)
  })

  it('mất mạng / quá 15 s bị huỷ / trả lời không đọc được → "chưa chắc đã đổi tên" (không khẳng định chưa đổi)', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(chay()).rejects.toThrow(/chưa chắc đã đổi tên/)
    vi.stubGlobal('fetch', async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    })
    await expect(chay()).rejects.toThrow(/Máy chủ trả lời chậm — chưa chắc đã đổi tên/)
    stub(async () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError('x')) }))
    await expect(chay()).rejects.toThrow(/chưa chắc đã đổi tên/)
  })
})

// ---------------------------------------------------------------- danh sách lớp trên máy thầy
describe('classlist-db · doiTenEmTrongDanhSachLop', () => {
  it('chỉ đổi tên đúng em; em khác y nguyên; máy không có em đó → false (không thêm em lạ)', async () => {
    const kho = new Map<string, Record<string, unknown>>([
      ['001', { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008' }],
      ['002', { sbd: '002', hoTen: 'Trần Thu Hà', lop: '12A1' }],
    ])
    vi.resetModules()
    vi.doMock('idb', () => ({ openDB: async () => ({ get: async (_s: string, k: string) => kho.get(k), put: async (_s: string, v: { sbd: string }) => void kho.set(v.sbd, v as never) }) }))
    const { doiTenEmTrongDanhSachLop } = await vi.importActual<typeof import('../src/lib/classlist-db')>('../src/lib/classlist-db') // bản THẬT (cả tệp đã mock cho khối màn hình)
    expect(await doiTenEmTrongDanhSachLop('001', 'Lê Minh Đạt')).toBe(true)
    expect(kho.get('001')).toEqual({ sbd: '001', hoTen: 'Lê Minh Đạt', lop: '12A1', namSinh: '2008' })
    expect(kho.get('002')?.hoTen).toBe('Trần Thu Hà')
    expect(await doiTenEmTrongDanhSachLop('999', 'X Y')).toBe(false)
    expect(kho.has('999')).toBe(false)
    vi.doUnmock('idb')
  })
})

// ---------------------------------------------------------------- thành phần
vi.mock('../src/lib/doi-ten-hs-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/doi-ten-hs-api')>()), doiTenHocSinh: (...a: unknown[]) => m.doiTen(...a) }))

describe('DoiTenHocSinh — ô nhập tại chỗ', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })
  const dung = (onXong = vi.fn()) => {
    render(<DoiTenHocSinh sbd="001" hoTen="Lê Minh Đức" onXong={onXong} />)
    return onXong
  }
  const mo = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên học sinh' }))
    return screen.getByLabelText('Tên mới của học sinh') as HTMLInputElement
  }

  it('mặc định: tên + nút bút chì aria-label "Đổi tên học sinh"; bấm → ô nhập ĐIỀN SẴN tên cũ + Lưu/Huỷ + ghi chú', () => {
    dung()
    expect(screen.getByRole('heading', { name: 'Lê Minh Đức' })).toBeTruthy()
    const o = mo()
    expect(o.value).toBe('Lê Minh Đức')
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Huỷ' })).toBeTruthy()
    expect(screen.getByText(/Tên mới hiện ở app học sinh và phụ huynh từ lần mở app kế tiếp\./)).toBeTruthy()
    expect(screen.getByText(/nạp lại danh sách sẽ ghi đè tên/)).toBeTruthy()
  })

  it('Esc = Huỷ (không gọi máy chủ); Huỷ đóng ô và trả lại tên cũ', () => {
    dung()
    const o = mo()
    fireEvent.change(o, { target: { value: 'Tên khác' } })
    fireEvent.keyDown(o, { key: 'Escape' })
    expect(screen.queryByLabelText('Tên mới của học sinh')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Lê Minh Đức' })).toBeTruthy()
    expect(m.doiTen).not.toHaveBeenCalled()
  })

  it('Enter = Lưu: gọi lệnh ĐÚNG MỘT lần với tên đã chuẩn hoá; thành công → onXong(kết quả) và đóng ô', async () => {
    m.doiTen.mockResolvedValue({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: false, soDong: {} })
    const onXong = dung()
    const o = mo()
    fireEvent.change(o, { target: { value: '  Lê   Minh Đạt ' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    await waitFor(() => expect(onXong).toHaveBeenCalledTimes(1))
    expect(m.doiTen).toHaveBeenCalledTimes(1)
    expect(m.doiTen).toHaveBeenCalledWith('001', 'Lê Minh Đạt')
    expect(onXong.mock.calls[0][0]).toMatchObject({ tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt' })
    expect(screen.queryByLabelText('Tên mới của học sinh')).toBeNull()
  })

  it('máy chủ từ chối / chưa có lệnh → hiện ĐÚNG lý do (role=alert), GIỮ ô nhập và chữ đang gõ, KHÔNG onXong', async () => {
    m.doiTen.mockRejectedValue(new Error('Máy chủ chưa có lệnh Đổi tên — chưa đổi tên ở đâu cả.'))
    const onXong = dung()
    const o = mo()
    fireEvent.change(o, { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Máy chủ chưa có lệnh Đổi tên — chưa đổi tên ở đâu cả.')
    expect((screen.getByLabelText('Tên mới của học sinh') as HTMLInputElement).value).toBe('Lê Minh Đạt')
    expect(onXong).not.toHaveBeenCalled()
  })

  it('tên không hợp lệ hoặc trùng tên cũ → báo ngay, KHÔNG gọi máy chủ; máy chủ báo khongDoi → báo trùng, KHÔNG onXong', async () => {
    const onXong = dung()
    const o = mo()
    fireEvent.change(o, { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Tên phải từ 2 đến 60 ký tự.')
    fireEvent.change(o, { target: { value: '  Lê Minh  Đức ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Tên mới trùng tên cũ — không có gì để đổi.')
    expect(m.doiTen).not.toHaveBeenCalled()
    m.doiTen.mockResolvedValue({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: true, soDong: {} })
    fireEvent.change(o, { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(m.doiTen).toHaveBeenCalledTimes(1))
    expect((await screen.findByRole('alert')).textContent).toBe('Tên mới trùng tên cũ — không có gì để đổi.')
    expect(onXong).not.toHaveBeenCalled()
  })

  it('đang lưu: nút Lưu/Huỷ tắt, bấm Lưu lần nữa không gọi thêm', async () => {
    let xong: (v: unknown) => void = () => {}
    m.doiTen.mockImplementation(() => new Promise((r) => (xong = r)))
    dung()
    const o = mo()
    fireEvent.change(o, { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    const dangLuu = await screen.findByRole('button', { name: 'Đang lưu…' })
    expect((dangLuu as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Huỷ' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(m.doiTen).toHaveBeenCalledTimes(1)
    xong({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: false, soDong: {} })
  })
})

// ---------------------------------------------------------------- trên màn Học sinh
const DS: EmTomTat[] = [{ sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008', soCa: 2, diemGanNhat: 7.5, trangThai: 'trong_danh_sach' } as EmTomTat]
const HO_SO = { em: { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008' }, ca: [], chuyenDe: [] } as unknown as HoSoEm

vi.mock('../src/store/appStore', () => {
  const useAppStore = (sel: (s: Record<string, unknown>) => unknown) => sel({ sbdDangXem: m.sbd.v, moHoSoEm: m.moHoSoEm, showToast: m.toast, setScreen: vi.fn(), moChiTietCa: vi.fn(), datSbdGiaoRieng: vi.fn() })
  useAppStore.getState = () => ({ classList: m.classList, setClassList: m.setClassList })
  return { useAppStore }
})
vi.mock('../src/lib/classlist-db', () => ({ doiTenEmTrongDanhSachLop: (...a: unknown[]) => m.doiTenLop(...a) }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://x', loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => DS,
  hoSoEm: (...a: unknown[]) => m.hoSoEm(...a),
  deleteStudentRegistration: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/ho-so-em-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/ho-so-em-thay')>()), layHoSoNamKt: async () => null, layKeHoachEm: async () => null }))
vi.mock('../src/components/NutDongBoDanhSach', () => ({ default: () => null }))
vi.mock('../src/components/NutThemHocSinh', () => ({ default: () => null }))
vi.mock('../src/components/NutBaiTapPdf', () => ({ default: () => null }))
vi.mock('../src/components/KhoiTienBo', () => ({ default: () => null }))
const { default: HocSinhScreen } = await import('../src/screens/HocSinhScreen')

describe('HocSinhScreen · đổi tên trong hồ sơ', () => {
  beforeEach(() => {
    m.sbd.v = '001'
    m.hoSoEm.mockImplementation(async () => HO_SO)
    m.doiTenLop.mockResolvedValue(true)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })
  const moHoSo = async () => {
    const r = render(<HocSinhScreen />)
    await screen.findByRole('button', { name: 'Đổi tên học sinh' })
    return r
  }

  it('thành công: cập nhật danh sách lớp Ở MÁY THẦY + tải lại hồ sơ + toast «cũ» → «mới»', async () => {
    m.doiTen.mockResolvedValue({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: false, soDong: {} })
    await moHoSo()
    const truoc = m.hoSoEm.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên học sinh' }))
    fireEvent.change(screen.getByLabelText('Tên mới của học sinh'), { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã đổi tên: «Lê Minh Đức» → «Lê Minh Đạt»', 'success'))
    expect(m.doiTenLop).toHaveBeenCalledWith('001', 'Lê Minh Đạt')
    const moi = m.setClassList.mock.calls[0][0] as { sbd: string; hoTen: string }[]
    expect(moi.find((h) => h.sbd === '001')?.hoTen).toBe('Lê Minh Đạt')
    expect(moi.find((h) => h.sbd === '002')?.hoTen).toBe('Trần Thu Hà') // em khác y nguyên
    await waitFor(() => expect(m.hoSoEm.mock.calls.length).toBeGreaterThan(truoc)) // tải lại hồ sơ
  })

  it('máy chủ lỗi: KHÔNG đổi riêng ở máy thầy (không classlist, không toast thành công, không tải lại), lý do hiện ở ô', async () => {
    m.doiTen.mockRejectedValue(new Error('Máy chủ chưa có lệnh Đổi tên — chưa đổi tên ở đâu cả.'))
    await moHoSo()
    const truoc = m.hoSoEm.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên học sinh' }))
    fireEvent.change(screen.getByLabelText('Tên mới của học sinh'), { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Máy chủ chưa có lệnh Đổi tên')
    expect(m.doiTenLop).not.toHaveBeenCalled()
    expect(m.setClassList).not.toHaveBeenCalled()
    expect(m.toast).not.toHaveBeenCalledWith(expect.stringContaining('Đã đổi tên'), 'success')
    expect(m.hoSoEm.mock.calls.length).toBe(truoc)
  })

  it('máy chủ đã đổi nhưng danh sách lớp trên máy thầy ghi lỗi → vẫn báo đã đổi + cảnh báo nói thật', async () => {
    m.doiTen.mockResolvedValue({ sbd: '001', tenCu: 'Lê Minh Đức', tenMoi: 'Lê Minh Đạt', khongDoi: false, soDong: {} })
    m.doiTenLop.mockRejectedValue(new Error('IndexedDB lỗi'))
    await moHoSo()
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên học sinh' }))
    fireEvent.change(screen.getByLabelText('Tên mới của học sinh'), { target: { value: 'Lê Minh Đạt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã đổi tên: «Lê Minh Đức» → «Lê Minh Đạt»', 'success'))
    expect(m.toast).toHaveBeenCalledWith(expect.stringContaining('danh sách lớp trên máy này chưa cập nhật được'), 'warn')
  })
})

describe('nguồn', () => {
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
  it('màn Học sinh dùng DoiTenHocSinh; lệnh đúng đường; không hex trong css/tệp mới', () => {
    expect(doc('src/screens/HocSinhScreen.tsx')).toContain('<DoiTenHocSinh sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} onXong={xongDoiTen} />')
    expect(doc('src/lib/doi-ten-hs-api.ts')).toContain('/hoc-sinh/doi-ten')
    for (const f of ['src/screens/hoc-sinh-m3.css', 'src/components/DoiTenHocSinh.tsx', 'src/lib/doi-ten-hs-api.ts']) expect(doc(f), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(doc('src/screens/hoc-sinh-m3.css')).not.toContain('!important')
  })
})
