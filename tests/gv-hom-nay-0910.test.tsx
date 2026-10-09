// BẢN VẼ TỐI GIẢN APP THẦY — THẦY CHỐT 09/10 (GV-HomNay · GV-HanhTrinh · BoGop cột Giáo viên), chế độ Game Hóa 2.0:
//   · thanh bên / thanh đáy còn 5 mục Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề (+ Cài đặt), không nút riêng "Mở ca kiểm tra";
//   · màn Hôm nay: 4 ô số + "Việc cần thầy · xếp theo độ gấp" (mỗi việc một nút) + "Nhịp theo khối" — SỐ TỪ API GIẢ (không số bịa), lệnh lỗi ⇒ không vẽ ô;
//   · Hành trình: thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao; MỘT nút "Bổ sung bài"; không còn "Giao theo bài";
//   · lỗi tái hiện: Hành trình (hạn giả 9999-12-31) bị in "còn ~2,9 triệu ngày" ở Tổng quan ⇒ nay không ghi hạn nộp.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { BangChienDich, ChienDichTom } from '../src/components/chien-dich/api'

const m = vi.hoisted(() => ({ danhSachCa: vi.fn(), goi: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => m.danhSachCa(...a),
  xoaNhieuCa: vi.fn(),
  khoiPhucCa: vi.fn(),
  xoaVinhVienCa: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://gia/exec',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [],
}))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-10-09T03:00:00Z').getTime() }))
// Thẻ ghép màn sẵn có: thay bằng bản giả nhỏ — ở đây chỉ kiểm đường nối (màn thật có test riêng của chúng).
vi.mock('../src/components/chien-dich/LenBangChienDich', () => ({ KHOA_CHON_CHIEN_DICH: 'ddh.chienDichChon', default: () => <p>Giả: Bảng chiến dịch và buổi chữa</p> }))
vi.mock('../src/components/chua-cau-sai/CauCanChuaTrenLop', () => ({ default: () => <p>Giả: Bước cuối trên lớp</p> }))
vi.mock('../src/screens/BanGoNutThatScreen', () => ({ default: () => <p>Giả: Bàn gỡ nút thắt</p> }))
vi.mock('../src/components/day-hoc/DayHocLenBang', () => ({ default: () => <section data-khoi="bai-hom-nay">Giả: Bài hôm nay</section> }))
vi.mock('../src/components/day-hoc/KiemTraDauGio', () => ({ default: () => <p>Giả: Kiểm tra đầu giờ</p> }))

import ThanhBenTrai from '../src/components/ThanhBenTrai'
import BottomNav from '../src/components/BottomNav'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { useSoDemGv } from '../src/lib/so-dem-gv'
import { useAppStore } from '../src/store/appStore'
import { chuHan } from '../src/components/chien-dich/DsChienDichDaGiao'
import { coHanNop, conLai, hienHanNop, laHanGia } from '../src/components/chien-dich/ngay'
const { default: GvHomNayScreen, chuCanThayChua, demCanThayChua, tongNhip } = await import('../src/screens/GvHomNayScreen')
const { default: TongQuanScreen } = await import('../src/screens/TongQuanScreen')
const { default: ChienDichScreen } = await import('../src/screens/ChienDichScreen')
const { default: HanhTrinhV2 } = await import('../src/components/chien-dich/HanhTrinhV2')
const { default: TheBaiDaDay } = await import('../src/components/chien-dich/TheBaiDaDay')
const { default: TheCanThayChua } = await import('../src/components/chien-dich/TheCanThayChua')

const ca = (maCa: string, o: Partial<CaTomTat> = {}): CaTomTat =>
  ({
    maCa,
    tenCa: `Kiểm tra ${maCa}`,
    lop: '12A1',
    thoiGianPhut: 45,
    moLuc: '2026-10-09T02:45:00Z',
    batDau: '2026-10-09T02:45:00Z',
    hetHanVao: '2026-10-09T04:00:00Z',
    trangThai: 'mo',
    phamVi: 'tu_do',
    congBo: 'ca_lop_xong',
    loai: 'thi',
    hanNop: '',
    lenBang: true,
    daVao: 40,
    daNop: 38,
    canhBao: 0,
    ...o,
  }) as CaTomTat

const cd = (id: string, o: Partial<ChienDichTom> = {}): ChienDichTom => ({
  id,
  ten: `Chiến dịch ${id}`,
  lop: '12A1',
  maDe: [],
  hanNop: '2026-10-20',
  theLucNgay: 40,
  huyetChien: false,
  maCa: null,
  taoLuc: '2026-10-01T00:00:00Z',
  trangThai: 'dang_chay',
  soCau: 20,
  soEm: 3,
  hetHan: false,
  ...o,
})
const ht = (id: string, khoi: string) => cd(id, { ten: `Hành trình giỏi hoá · Khối ${khoi}`, lop: `Khối ${khoi}`, hanhTrinh: true, hanNop: '9999-12-31' })
const em = (sbd: string, toiThieu: number | null, daLam: number) => ({ sbd, ten: `Em ${sbd}`, tang: 1, toiThieu, daLam, daXep: 24, conThieu: 0 })

const bang = (c: ChienDichTom, o: Partial<BangChienDich> = {}): BangChienDich =>
  ({
    chienDich: c,
    homNay: '2026-10-09',
    hetHan: false,
    lop: { coXat: 0, thanhThao: 0.3, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0 },
    dang: [],
    em: [],
    canDayLai: [],
    ...o,
  }) as BangChienDich

const HT10 = ht('ht-10', '10')
const HT12 = ht('ht-12', '12')
const CDA = cd('cd-a')
const BANG: Record<string, BangChienDich> = {
  'ht-10': bang(HT10, { hanhTrinhNgay: { em: [em('1', 24, 24), em('2', 24, 0), em('3', 24, 10)] } }),
  'ht-12': bang(HT12, { hanhTrinhNgay: { em: [em('4', 36, 40), em('5', 36, 0), em('6', null, 0)] }, canDayLai: [{ qid: 'q9', stt: 9, dang: 'Ester', soEm: 4 } as BangChienDich['canDayLai'][number]] }),
  'cd-a': bang(CDA),
}
const OMNI_CDA = [
  { loai: 'cat_tia', tieuDe: 'Câu 25 · Hiệu suất ester hoá', phu: '9 em sai từ 4 lần', soEm: 9, qids: ['q25'] },
  { loai: 'cat_tia', tieuDe: 'Câu 31 · Chỉ số xà phòng hoá', phu: '6 em sai từ 4 lần', soEm: 6, qids: ['q31'] },
  { loai: 'nut_that', tieuDe: 'Câu 12 · Hỗn hợp ester', phu: '5 em gửi thẻ nút thắt', soEm: 5, qids: ['q12'] },
  { loai: 'so_y', tieuDe: 'Trần Đức Huy: sơ ý 12%', phu: 'Kiến thức vững', soEm: 1, sbd: ['9'] },
]

/** Máy chủ giả đủ lệnh màn Hôm nay dùng. `omni` = công tắc OMNI. */
function mayChu({ omni = true, loiDanhSach = false }: { omni?: boolean; loiDanhSach?: boolean } = {}) {
  m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach')
      return loiDanhSach ? { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' } : { ok: true, du: { homNay: '2026-10-09', chienDich: [HT10, HT12, CDA, cd('cd-b', { trangThai: 'da_dong' })] } }
    if (duong === '/gv/chien-dich' && b.action === 'bang') return BANG[String(b.id)] ? { ok: true, du: BANG[String(b.id)] } : { ok: false, loai: 'tu_choi', chu: 'không có' }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: omni, lop: ['12A2', '12A1'], sbd: [] } } }
    if (duong === '/gv/omni' && b.action === 'bang') return { ok: true, du: { ok: true, chienDich: { id: b.chienDichId }, em: [], dang: [], o: {}, canThayChua: b.chienDichId === 'cd-a' ? OMNI_CDA : [] } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [], choBaiMoi: { soNgay: b.lop === '12A2' ? 3 : 1 } } }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
}

beforeEach(() => {
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useSoDemGv.setState({ caMo: null, chienDichChay: null, canDayLai: null, canThayChua: null, giaoTuCa: null, moHanhTrinh: null })
  useAppStore.getState().setScreen('tongquan')
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
})

describe('khung 2.0 · 5 mục (bản vẽ tối giản thầy chốt 09/10)', () => {
  it('thanh bên: Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề + Cài đặt ở đáy; không nút riêng "Mở ca kiểm tra"', () => {
    render(<ThanhBenTrai />)
    expect([...document.querySelectorAll('.ben-trai-danh-sach .ben-trai-muc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Hôm nay', 'Hành trình', 'Ca kiểm tra', 'Học sinh', 'Kho đề'])
    expect([...document.querySelectorAll('.ben-trai-cuoi .ben-trai-muc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Cài đặt'])
    expect(screen.queryByRole('button', { name: 'Mở ca kiểm tra' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Hôm nay' }).getAttribute('aria-current')).toBe('page')
  })

  it('thanh đáy điện thoại ≤ 5 mục, cùng danh sách', () => {
    render(<BottomNav />)
    expect([...document.querySelectorAll('.day-thay-thanh .day-thay-muc')].map((b) => b.textContent?.trim())).toEqual(['Hôm nay', 'Hành trình', 'Ca kiểm tra', 'Học sinh', 'Kho đề'])
  })

  it('App: mã màn `tongquan` dựng Hôm nay; Ca kiểm tra 2.0 có nút "Mở ca kiểm tra" ở đầu màn; mảnh mới ngoài precache', () => {
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8')
    expect(app).toContain("screen === 'tongquan' && <GvHomNayScreen />")
    expect(app).toContain("lazy(() => import('./screens/GvHomNayScreen'))")
    expect(app).toMatch(/className="ca-hoa2-mo-ca" onClick=\{\(\) => setScreen\('examsetup'\)\}/)
    expect(app).toContain("tongquan: 'Hôm nay', chiendich: 'Hành trình'")
    const vite = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf8')
    for (const manh of ['GvHomNayScreen', 'TheCanThayChua', 'TheBaiDaDay']) expect(vite).toContain(manh)
  })
})

describe('màn Hôm nay của thầy — số từ API', () => {
  it('4 ô số + việc xếp theo độ gấp (mỗi việc MỘT nút) + nhịp theo khối; ghi số cho thanh bên', async () => {
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6'), ca('DH-CU', { trangThai: 'dong', batDau: '2026-10-07T02:00:00Z', moLuc: '2026-10-07T02:00:00Z' })])
    mayChu()
    const { container } = render(<GvHomNayScreen />)
    expect(await screen.findByRole('heading', { name: 'Việc cần thầy · xếp theo độ gấp' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Hôm nay của thầy' })).toBeTruthy()
    expect(container.textContent).toContain('Thứ Sáu 09/10/2026 · 2 khối · 6 em đang chạy Hành trình')

    const so = screen.getByRole('region', { name: 'Số liệu hôm nay' })
    const o = [...so.querySelectorAll('.gvhn-so')].map((x) => x.textContent)
    // Hành trình K10: 1/3 đủ mức, 1 chưa làm · K12: 1/2 đủ mức (em không có mức không tính), 2 chưa làm.
    expect(o).toEqual(['Đủ mức tối thiểu hôm nay2/5 em', 'Chưa làm câu nào3 em', 'Cần thầy chữa5 chỗ', 'Ca kiểm tra đang mở1 ca'])

    const viec = screen.getByRole('region', { name: 'Việc cần thầy · xếp theo độ gấp' })
    const dong = [...viec.querySelectorAll('li')]
    expect(dong.map((d) => d.querySelector('b')?.textContent)).toEqual([
      'Ca đang mở: Kiểm tra DH-12-C2-B6 · 12A1',
      'Cần thầy chữa: 5 chỗ',
      '12A2: 3 ngày chưa có bài mới',
      '3 em chưa làm câu nào hôm nay',
    ])
    for (const d of dong) expect(within(d).getAllByRole('button')).toHaveLength(1)
    expect(dong.map((d) => within(d).getByRole('button').textContent)).toEqual(['Theo dõi ca', 'Xếp buổi chữa', 'Bổ sung bài', 'Xem danh sách'])
    // một nút chính trên màn (việc gấp nhất), còn lại nút viền
    expect(container.querySelectorAll('.gvv2-nut-chinh')).toHaveLength(1)
    expect(dong[0]!.textContent).toContain('Đã vào 40 em · đã nộp 38 em')
    // K12 hành trình: 1 câu cần dạy lại (cùng nghĩa câu sai từ 4 lần) + chiến dịch cd-a: 2 câu sai từ 4 lần, 1 câu nút thắt, 1 em sơ ý (Bảng bài OMNI)
    expect(dong[1]!.textContent).toContain('3 câu sai từ 4 lần trở lên · 1 câu có thẻ nút thắt · 1 em sơ ý cao')
    expect(dong[3]!.textContent).toContain('Khối 10: 1 em · Khối 12: 2 em')
    // một khái niệm một tên ở màn mới
    expect(container.textContent).not.toMatch(/dạy lại|Cần chữa|Chữa trên lớp|Tổng quan/)

    const khoi = screen.getByRole('complementary', { name: 'Nhịp theo khối' })
    expect([...khoi.querySelectorAll('.gvhn-khoi-chu')].map((x) => x.textContent)).toEqual(['Khối 101/3 em đủ mức', 'Khối 121/2 em đủ mức'])

    await waitFor(() => expect(useSoDemGv.getState()).toMatchObject({ caMo: 1, canThayChua: 5 }))
    // Hành trình chỉ đọc bảng — KHÔNG hỏi Bảng bài OMNI (như Lên bảng chiến dịch); lớp chờ bài mới hỏi đúng các lớp của công tắc OMNI.
    expect(m.goi.mock.calls.filter(([d, b]) => d === '/gv/omni' && b.action === 'bang').map(([, b]) => b.chienDichId)).toEqual(['cd-a'])
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/bai-da-day').map(([, b]) => b.lop).sort()).toEqual(['12A1', '12A2'])
  })

  it('mỗi nút đưa đúng chỗ: Theo dõi ca · Hành trình › Cần thầy chữa / Bài đã dạy (cuộn Bài hôm nay) / Nhịp hôm nay (khối nhiều em chưa làm nhất)', async () => {
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6')])
    mayChu()
    render(<GvHomNayScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^Xếp buổi chữa:/ }))
    expect(useAppStore.getState().screen).toBe('chiendich')
    expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'can-chua' })
    fireEvent.click(screen.getByRole('button', { name: /^Bổ sung bài:/ }))
    expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'bai-da-day', boSungBai: true })
    fireEvent.click(screen.getByRole('button', { name: /^Xem danh sách:/ }))
    expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'nhip', chienDichId: 'ht-12' })
    fireEvent.click(screen.getByRole('button', { name: /^Theo dõi ca:/ }))
    expect(useAppStore.getState().screen).toBe('exammonitor')
    expect(useAppStore.getState().maCaTheoDoi).toBe('DH-12-C2-B6')
  })

  it('lệnh lỗi ⇒ ô của lệnh ấy KHÔNG vẽ (không số 0 giả) + một dòng nói thật + Thử lại; OMNI tắt ⇒ không hỏi lớp chờ bài mới', async () => {
    m.danhSachCa.mockRejectedValue(new Error('Hết thời gian chờ máy chủ'))
    mayChu({ omni: false, loiDanhSach: true })
    const { container } = render(<GvHomNayScreen />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Danh sách ca: Hết thời gian chờ máy chủ')
    expect(loi.textContent).toContain('Hành trình và chiến dịch: Không nối được máy chủ.')
    expect(within(loi).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Số liệu hôm nay' })).toBeNull()
    expect(container.querySelector('.gvhn-so')).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Nhịp theo khối' })).toBeNull()
    expect(container.querySelectorAll('.gvhn-viec-dong')).toHaveLength(0)
    expect(m.goi.mock.calls.some(([d]) => d === '/gv/bai-da-day')).toBe(false)
    await waitFor(() => expect(useSoDemGv.getState()).toMatchObject({ caMo: null, canThayChua: null }))
  })

  it('phép tính thuần: cộng nhịp các khối đã đọc được; Cần thầy chữa đếm đúng ba nhóm', () => {
    expect(tongNhip([])).toBeNull()
    expect(tongNhip([{ cd: HT10, khoi: '10', cs: null }])).toBeNull()
    expect(tongNhip([{ cd: HT10, khoi: '10', cs: { tong: 3, duMuc: 1, coMuc: 3, chuaLam: 1, thieuCau: 0, tangCao: 0 } }, { cd: HT12, khoi: '12', cs: null }])).toEqual({ duMuc: 1, coMuc: 3, chuaLam: 1, tong: 3 })
    const d = demCanThayChua([{ canDayLai: [], omni: OMNI_CDA as never }, { canDayLai: [{ qid: 'q', stt: 1, dang: 'Ester', soEm: 2 } as never], omni: [] }])
    expect(d).toEqual({ catTia: 3, nutThat: 1, soY: 1, tong: 5 })
    expect(chuCanThayChua({ catTia: 0, nutThat: 2, soY: 0, tong: 2 })).toBe('2 câu có thẻ nút thắt')
  })
})

describe('Hành trình: bốn thẻ, MỘT nút "Bổ sung bài"', () => {
  it('thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao; số Cần thầy chữa cạnh tên thẻ; "Bổ sung bài" mở Bài đã dạy', async () => {
    mayChu()
    useSoDemGv.getState().datSo({ canThayChua: 7 })
    render(<HanhTrinhV2 chienDichDaGiao={<p>Danh sách đã giao</p>} />)
    expect(await screen.findByRole('region', { name: 'Chỉ số hôm nay' })).toBeTruthy()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Nhịp hôm nay', 'Cần thầy chữa · 7', 'Bài đã dạy', 'Chiến dịch đã giao'])
    expect(screen.queryByRole('tab', { name: 'Tổng quan' })).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Bổ sung bài' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Giao theo bài' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Bổ sung bài' }))
    expect(screen.getByRole('tab', { name: 'Bài đã dạy' }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    expect(screen.getAllByRole('tab', { name: /Dạy học|Kiểm tra đầu giờ/ }).map((t) => t.textContent)).toEqual(['Dạy học', 'Kiểm tra đầu giờ'])

    fireEvent.click(screen.getByRole('tab', { name: /^Cần thầy chữa/ }))
    expect(await screen.findByText('Giả: Bảng chiến dịch và buổi chữa')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Chiến dịch đã giao' }))
    expect(screen.getByText('Danh sách đã giao')).toBeTruthy()
  })

  it('ChienDichScreen: Hôm nay đặt thẻ ⇒ mở đúng thẻ rồi xoá yêu cầu; thẻ Chiến dịch đã giao không còn "Giao theo bài"', async () => {
    mayChu()
    useSoDemGv.getState().datMoHanhTrinh({ the: 'can-chua' })
    const { unmount } = render(<ChienDichScreen />)
    expect(screen.getByRole('tab', { name: /^Cần thầy chữa/ }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: Bảng chiến dịch và buổi chữa')).toBeTruthy()
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
    fireEvent.click(screen.getByRole('tab', { name: 'Chiến dịch đã giao' }))
    expect(screen.getByRole('button', { name: 'Giao chiến dịch mới' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Giao theo bài' })).toBeNull()
    unmount()
    // lần mở sau không có yêu cầu ⇒ thẻ đầu Nhịp hôm nay
    render(<ChienDichScreen />)
    expect(screen.getByRole('tab', { name: 'Nhịp hôm nay' }).getAttribute('aria-selected')).toBe('true')
  })

  it('thẻ Cần thầy chữa ghép ba phần sẵn có; thẻ Bài đã dạy cuộn tới Bài hôm nay chỉ khi bấm "Bổ sung bài"', async () => {
    render(<TheCanThayChua />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Buổi chữa', 'Bước cuối trên lớp', 'Gỡ nút thắt'])
    expect(await screen.findByText('Giả: Bảng chiến dịch và buổi chữa')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Gỡ nút thắt' }))
    expect(await screen.findByText('Giả: Bàn gỡ nút thắt')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Bước cuối trên lớp' }))
    expect(await screen.findByText('Giả: Bước cuối trên lớp')).toBeTruthy()
    cleanup()

    const cuon = vi.fn()
    const goc = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = cuon
    try {
      const { unmount } = render(<TheBaiDaDay />)
      await screen.findByText('Giả: Bài hôm nay')
      expect(cuon).not.toHaveBeenCalled()
      unmount()
      render(<TheBaiDaDay lanBoSung={1} />)
      await screen.findByText('Giả: Bài hôm nay')
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(1))
    } finally {
      Element.prototype.scrollIntoView = goc
    }
  })
})

describe('lỗi hạn nộp Hành trình (hạn giả 9999-12-31 bị in "còn ~2,9 triệu ngày")', () => {
  it('hàm ngày: hạn giả ⇒ không chữ hạn, không "còn … ngày"', () => {
    expect(laHanGia('9999-12-31')).toBe(true)
    expect(laHanGia('2026-10-20')).toBe(false)
    expect(chuHan('9999-12-31', '2026-10-09')).toBe('')
    expect(chuHan('2026-10-12', '2026-10-09')).toBe('còn 3 ngày')
    expect(conLai('9999-12-31', Date.parse('2026-10-09T03:00:00Z'))).toBe('')
    expect(hienHanNop('9999-12-31')).toBe('Học mỗi ngày')
    expect(coHanNop({ hanNop: '9999-12-31' })).toBe(false)
    expect(coHanNop({ hanNop: '2026-10-20', hanhTrinh: true })).toBe(false)
    expect(coHanNop({ hanNop: '2026-10-20' })).toBe(true)
  })

  it('Tổng quan: dòng Hành trình KHÔNG ghi hạn nộp; chiến dịch thường vẫn ghi', async () => {
    m.danhSachCa.mockResolvedValue([])
    m.goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-09', chienDich: [HT12, CDA] } }
      if (b.action === 'bang') return { ok: true, du: BANG[String(b.id)] }
      return { ok: false, loai: 'tu_choi', chu: 'lạ' }
    })
    render(<TongQuanScreen />)
    const dongHt = (await screen.findByRole('button', { name: HT12.ten })).closest('li') as HTMLElement
    expect(dongHt.textContent).not.toContain('Hạn nộp')
    expect(dongHt.textContent).not.toMatch(/còn \d{4,} ngày|triệu|31\/12/)
    const dongCd = screen.getByRole('button', { name: CDA.ten }).closest('li') as HTMLElement
    expect(dongCd.textContent).toContain('Hạn nộp')
    expect(dongCd.textContent).toContain('còn 11 ngày')
    expect(dongCd.textContent).toContain('23:59 · 20/10')
  })
})
