// BẢN VẼ TỐI GIẢN APP THẦY — THẦY CHỐT 09/10 (GV-HomNay · GV-HanhTrinh · BoGop cột Giáo viên), chế độ Game Hóa 2.0:
//   · thanh bên / thanh đáy còn 5 mục Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề (+ Cài đặt), không nút riêng "Mở ca kiểm tra";
//   · màn Hôm nay: 4 ô số + "Việc cần thầy · xếp theo độ gấp" (mỗi việc một nút) + "Nhịp theo khối" — SỐ TỪ API GIẢ (không số bịa), lệnh lỗi ⇒ không vẽ ô;
//   · Hành trình: thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao; MỘT nút "Bổ sung bài"; không còn "Giao theo bài";
//     SỬA CÓ CHỦ ĐÍCH 09/10 tối (thầy: "chỉ cần giữ lại phần dạy học" + "kiểm tra đầu giờ giữ lại nữa nhé" + "phần câu cần chữa trùng tu lại"):
//     Hành trình còn BA thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa; Cần thầy chữa = MỘT danh sách xếp theo số em, mỗi dòng một nút đúng việc;
//     Chiến dịch đã giao thành trang riêng (lối vào ở Cài đặt); Hôm nay › "Xem danh sách" / dòng khối ⇒ màn Học sinh lọc sẵn khối;
//   · lỗi tái hiện: Hành trình (hạn giả 9999-12-31) bị in "còn ~2,9 triệu ngày" ở Tổng quan ⇒ nay không ghi hạn nộp.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { BangChienDich, ChienDichTom } from '../src/components/chien-dich/api'

const m = vi.hoisted(() => ({ danhSachCa: vi.fn(), danhSachCauHoi: vi.fn(), goi: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => m.danhSachCa(...a),
  // Trung tu 09/10: Hôm nay đọc thêm câu em hỏi (màn Học sinh hỏi vào từ "Việc cần thầy").
  danhSachCauHoi: (...a: unknown[]) => m.danhSachCauHoi(...a),
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
// Thẻ ghép màn sẵn có: thay bằng bản giả nhỏ — ở đây chỉ kiểm đường nối (màn thật có test riêng của chúng). Bản giả in lại prop nhận được.
vi.mock('../src/components/chien-dich/LenBangChienDich', () => ({
  KHOA_CHON_CHIEN_DICH: 'ddh.chienDichChon',
  default: (p: { chienDichId?: string; chiChua?: boolean }) => <p>Giả: Bảng chiến dịch và buổi chữa{p.chienDichId ? ` · ghim ${p.chienDichId}` : ''}{p.chiChua ? ' · chỉ khối chữa' : ''}</p>,
}))
vi.mock('../src/components/chua-cau-sai/CauCanChuaTrenLop', () => ({ default: (p: { gon?: boolean; chonDau?: string }) => <p>Giả: Bước cuối trên lớp{p.gon ? ' · gọn' : ''}{p.chonDau ? ` · chọn ${p.chonDau}` : ''}</p> }))
vi.mock('../src/screens/BanGoNutThatScreen', () => ({ default: (p: { nhung?: boolean; chonDau?: string | null }) => <p>Giả: Bàn gỡ nút thắt{p.nhung ? ' · nhúng' : ''}{p.chonDau ? ` · chọn ${p.chonDau}` : ''}</p> }))
// Hai nguồn "Cần thầy chữa" ngoài chiến dịch (thẻ Cần thầy chữa đọc thêm): bước cuối trên lớp + thẻ nút thắt.
const nguon = vi.hoisted(() => ({ goiChuaThay: vi.fn(), gvDsNutThat: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-thay-api', () => ({ goiChuaThay: (...a: unknown[]) => nguon.goiChuaThay(...a) }))
vi.mock('../src/lib/nut-that-api', () => ({ gvDsNutThat: () => nguon.gvDsNutThat(), gvGoNutThat: vi.fn() }))
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
const { default: TheCanThayChua, gomCanChua, khoiLoc } = await import('../src/components/chien-dich/TheCanThayChua')

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

// Bước cuối trên lớp (`/gv/chua-cau-sai/hang-chieu`) + thẻ nút thắt (`/gv/nut-that/ds`) — thẻ Cần thầy chữa ghép vào cùng danh sách.
const BUOC_CUOI = [
  { id: 'g1', lop: '12A1', qid: 'q40', buocId: 'b2', tieuDe: 'Câu 40 · Bảo toàn khối lượng', maLoi: null, diemVuong: 'Quên cộng khối lượng H2O', cauGoc: { text: '' }, buoc: [], em: [{ dotId: 'd1', sbd: '1', hoTen: 'Em 1', revision: 1, daHieu: [], traLoi: '', hoi: '', soVongHoTro: 1 }, { dotId: 'd2', sbd: '2', hoTen: 'Em 2', revision: 1, daHieu: [], traLoi: '', hoi: '', soVongHoTro: 2 }], guiLuc: 1 },
]
const nhomNut = (khoa: string, qidMau: string, so: string, buoc: number, soEm: number, nhieuEmVuong = false) => ({ khoa, bam: khoa, buoc, qidMau, so, de: '', chuBuoc: '', nhanNen: '', cauKiemHoi: '', soEm, em: [], soCauCungChuyenDe: 0, hanGanNhat: null, diem: soEm, nhieuEmVuong })
const NUT_THAT = {
  ok: true,
  nhom: [nhomNut('B25|1', 'q25', 'Câu 25', 1, 3), nhomNut('B6|0', '12-THU-I-6', 'Câu 6', 0, 7, true)],
  kemRieng: [{ sbd: 'E9', hoTen: 'Phạm Dũng', qid: 'Q7', buoc: 1, so: 'Câu 7', chuBuoc: '' }],
  tong: { soThe: 10, soNhom: 2, theNgayDongNhat: 3, quaTai: false },
}

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
  nguon.goiChuaThay.mockResolvedValue({ ok: true, bat: true, ds: BUOC_CUOI, conNua: false })
  nguon.gvDsNutThat.mockResolvedValue(NUT_THAT)
  m.danhSachCauHoi.mockResolvedValue([])
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useSoDemGv.setState({ caMo: null, chienDichChay: null, canDayLai: null, canThayChua: null, giaoTuCa: null, moHanhTrinh: null, khoiHocSinh: null })
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
  // SỬA CÓ CHỦ Ý 09/10 — TRUNG TU GIAO DIỆN (thầy duyệt bản vẽ GV-HomNay, "build luôn"): BỎ bốn ô số lặp danh sách việc (C4); nút chính gọn ở góc
  // phải = việc gấp nhất (ca đang mở ⇒ "Theo dõi ca đang mở"); thẻ "Nhịp theo khối" thành thẻ "Đủ mức tối thiểu hôm nay a/b em" + mỗi khối một
  // dòng bấm được; lỗi tải thành MỘT dòng việc nói dễ hiểu + Thử lại (không in lỗi kỹ thuật thô).
  it('việc xếp theo độ gấp (mỗi việc MỘT nút viền) + thẻ Đủ mức tối thiểu; không còn ô số lặp; nút chính = việc gấp nhất; ghi số cho thanh bên', async () => {
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6'), ca('DH-CU', { trangThai: 'dong', batDau: '2026-10-07T02:00:00Z', moLuc: '2026-10-07T02:00:00Z' })])
    mayChu()
    const { container } = render(<GvHomNayScreen />)
    expect(await screen.findByRole('heading', { name: 'Việc cần thầy · xếp theo độ gấp' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Hôm nay của thầy' })).toBeTruthy()
    expect(container.textContent).toContain('Thứ Sáu 09/10/2026 · 2 khối · 6 em đang chạy Hành trình')

    // không còn bốn ô số (lặp danh sách việc)
    expect(screen.queryByRole('region', { name: 'Số liệu hôm nay' })).toBeNull()
    expect(container.querySelector('.gvhn-so')).toBeNull()

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
    for (const d of dong) expect(within(d).getByRole('button').className).toContain('gvv2-nut-vien')
    // MỘT nút chính trên màn, ở đầu màn: có ca đang mở ⇒ "Theo dõi ca đang mở"
    const chinh = [...container.querySelectorAll('.gvv2-nut-chinh')]
    expect(chinh).toHaveLength(1)
    expect(chinh[0]!.textContent).toBe('Theo dõi ca đang mở')
    expect(chinh[0]!.closest('header')).toBeTruthy()
    expect(dong[0]!.textContent).toContain('Đã vào 40 em · đã nộp 38 em')
    // K12 hành trình: 1 câu cần dạy lại (cùng nghĩa câu sai từ 4 lần) + chiến dịch cd-a: 2 câu sai từ 4 lần, 1 câu nút thắt, 1 em sơ ý (Bảng bài OMNI)
    expect(dong[1]!.textContent).toContain('3 câu sai từ 4 lần trở lên · 1 câu có thẻ nút thắt · 1 em sơ ý cao')
    expect(dong[3]!.textContent).toContain('Khối 10: 1 em · Khối 12: 2 em')
    // "Cần thầy chữa": cùng màu hổ phách với số cạnh Hành trình ở thanh bên
    expect(dong[1]!.querySelector('.gvhn-dau-o')?.getAttribute('data-mau')).toBe('hp')
    // một khái niệm một tên ở màn mới
    expect(container.textContent).not.toMatch(/dạy lại|Cần chữa|Chữa trên lớp|Tổng quan/)
    // thứ tự DOM = thứ tự mắt: việc trước, thẻ đủ mức sau (không column-reverse)
    const du = screen.getByRole('complementary', { name: 'Đủ mức tối thiểu hôm nay' })
    expect(viec.compareDocumentPosition(du) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(du.querySelector('.gvhn-du-so')?.textContent).toBe('2/5 em')
    expect([...du.querySelectorAll('.gvhn-khoi-dong')].map((x) => x.textContent)).toEqual(['Khối 101/3', 'Khối 121/2'])

    await waitFor(() => expect(useSoDemGv.getState()).toMatchObject({ caMo: 1, canThayChua: 5 }))
    // Hành trình chỉ đọc bảng — KHÔNG hỏi Bảng bài OMNI (như Lên bảng chiến dịch); lớp chờ bài mới hỏi đúng các lớp của công tắc OMNI.
    expect(m.goi.mock.calls.filter(([d, b]) => d === '/gv/omni' && b.action === 'bang').map(([, b]) => b.chienDichId)).toEqual(['cd-a'])
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/bai-da-day').map(([, b]) => b.lop).sort()).toEqual(['12A1', '12A2'])
    // câu em hỏi: MỘT lệnh cho mọi ca (mã ca rỗng), không vào thùng rác
    expect(m.danhSachCauHoi.mock.calls.map((c) => [c[2], c[3]])).toEqual([['', false]])
  })

  // SỬA CÓ CHỦ ĐÍCH 09/10 tối: thẻ Nhịp hôm nay đã bỏ ⇒ "Xem danh sách" (em chưa làm) và dòng khối mở màn Học sinh (cột "Hôm nay a/b câu"),
  // lọc sẵn khối (nhiều khối có em chưa làm ⇒ không lọc, không giấu khối nào); "Bổ sung bài" ⇒ thẻ Dạy học (tên thẻ mới).
  it('mỗi nút đưa đúng chỗ: nút chính · Theo dõi ca · Hành trình › Cần thầy chữa / Dạy học · em chưa làm & dòng khối ⇒ Học sinh lọc khối', async () => {
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6')])
    mayChu()
    render(<GvHomNayScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^Xếp buổi chữa:/ }))
    expect(useAppStore.getState().screen).toBe('chiendich')
    expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'can-chua' })
    fireEvent.click(screen.getByRole('button', { name: /^Bổ sung bài:/ }))
    expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'day-hoc', boSungBai: true })
    useSoDemGv.getState().datMoHanhTrinh(null)
    // Khối 10: 1 em + Khối 12: 2 em chưa làm ⇒ mở cả danh sách Học sinh (không lọc khối)
    fireEvent.click(screen.getByRole('button', { name: /^Xem danh sách:/ }))
    expect(useAppStore.getState().screen).toBe('hocsinh')
    expect(useSoDemGv.getState()).toMatchObject({ khoiHocSinh: null, moHanhTrinh: null })
    fireEvent.click(screen.getByRole('button', { name: /^Khối 10: 1\/3 em đủ mức — xem từng em khối 10 ở màn Học sinh/ }))
    expect(useAppStore.getState().screen).toBe('hocsinh')
    expect(useSoDemGv.getState().khoiHocSinh).toBe(10)
    fireEvent.click(screen.getByRole('button', { name: /^Theo dõi ca:/ }))
    expect(useAppStore.getState().screen).toBe('exammonitor')
    expect(useAppStore.getState().maCaTheoDoi).toBe('DH-12-C2-B6')
    useAppStore.getState().setScreen('tongquan')
    fireEvent.click(screen.getByRole('button', { name: 'Theo dõi ca đang mở' }))
    expect(useAppStore.getState().screen).toBe('exammonitor')
  })

  it('không có ca đang mở ⇒ nút chính "Bổ sung bài hôm nay"; Cần thầy chữa = 0 ⇒ một dòng ✓ không nút; em hỏi bài ⇒ việc "Học sinh hỏi" mở màn cauhoi', async () => {
    m.danhSachCa.mockResolvedValue([])
    const cau = (sbd: string, daChua: boolean) => ({ maCa: 'C1', tenCa: 'Kiểm tra 12A1', sbd, hoTen: `Em ${sbd}`, qids: ['q1'], ghiChu: '', guiLuc: '2026-10-09T01:00:00Z', daChua, chuaLuc: '' })
    m.danhSachCauHoi.mockResolvedValue([cau('1', false), cau('2', false), cau('3', true)])
    mayChu({ omni: false })
    BANG['ht-12'] = bang(HT12, { hanhTrinhNgay: { em: [em('4', 36, 40), em('5', 36, 0), em('6', null, 0)] } })
    try {
      const { container } = render(<GvHomNayScreen />)
      const viec = await screen.findByRole('region', { name: 'Việc cần thầy · xếp theo độ gấp' })
      const nut = [...container.querySelectorAll('.gvv2-nut-chinh')]
      expect(nut.map((n) => n.textContent)).toEqual(['Bổ sung bài hôm nay'])
      const b = [...viec.querySelectorAll('li b')].map((x) => x.textContent)
      expect(b).toEqual(['Học sinh hỏi: 2 lượt chờ thầy chữa', '3 em chưa làm câu nào hôm nay', 'Không có chỗ cần thầy chữa hôm nay.'])
      const ok = viec.querySelector('li[data-viec="khong-chua"]')!
      expect(within(ok as HTMLElement).queryByRole('button')).toBeNull()
      expect(viec.textContent).toContain('Kiểm tra 12A1')
      fireEvent.click(screen.getByRole('button', { name: /^Xem câu hỏi:/ }))
      expect(useAppStore.getState().screen).toBe('cauhoi')
      // thanh bên: Học sinh hỏi thuộc mục Hôm nay
      render(<ThanhBenTrai />)
      expect(screen.getByRole('button', { name: 'Hôm nay' }).getAttribute('aria-current')).toBe('page')
      fireEvent.click(screen.getByRole('button', { name: 'Bổ sung bài hôm nay' }))
      expect(useSoDemGv.getState().moHanhTrinh).toEqual({ the: 'day-hoc', boSungBai: true })
    } finally {
      BANG['ht-12'] = bang(HT12, { hanhTrinhNgay: { em: [em('4', 36, 40), em('5', 36, 0), em('6', null, 0)] }, canDayLai: [{ qid: 'q9', stt: 9, dang: 'Ester', soEm: 4 } as BangChienDich['canDayLai'][number]] })
    }
  })

  it('lệnh lỗi ⇒ phần của lệnh ấy KHÔNG vẽ (không số 0 giả) + MỘT dòng việc nói dễ hiểu + Thử lại; OMNI tắt ⇒ không hỏi lớp chờ bài mới', async () => {
    m.danhSachCa.mockRejectedValue(new Error('Hết thời gian chờ máy chủ'))
    mayChu({ omni: false, loiDanhSach: true })
    const { container } = render(<GvHomNayScreen />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được danh sách ca kiểm tra · Hành trình và chiến dịch')
    expect(loi.textContent).toContain('Hết thời gian chờ máy chủ.')
    expect(loi.textContent).toContain('Không nối được máy chủ.')
    expect(within(loi).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(container.querySelector('.gvhn-so')).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Đủ mức tối thiểu hôm nay' })).toBeNull()
    // chỉ còn đúng dòng báo lỗi trong danh sách việc
    expect([...container.querySelectorAll('.gvhn-viec-dong')].map((d) => d.getAttribute('data-viec'))).toEqual(['loi'])
    expect(m.goi.mock.calls.some(([d]) => d === '/gv/bai-da-day')).toBe(false)
    await waitFor(() => expect(useSoDemGv.getState()).toMatchObject({ caMo: null, canThayChua: null }))
  })

  it('lỗi kỹ thuật thô (TypeError của mã) KHÔNG in ra màn — thay bằng câu dễ hiểu; chờ tải là khung xương, không chữ "Đang tải…"', async () => {
    let tra: (v: unknown) => void = () => {}
    m.danhSachCa.mockReturnValue(new Promise((r) => (tra = r)))
    mayChu()
    const { container } = render(<GvHomNayScreen />)
    const xuong = screen.getByRole('status', { name: 'Đang tải việc hôm nay' })
    expect(xuong.querySelectorAll('.tt-xuong').length).toBeGreaterThan(4)
    expect(container.textContent).not.toMatch(/Đang tải/)
    tra(undefined) // máy chủ trả thiếu trường ⇒ trước đây "Cannot read properties of undefined (reading 'map')"
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được danh sách ca kiểm tra')
    expect(loi.textContent).toContain('Mạng có thể đang chập chờn.')
    expect(container.textContent).not.toMatch(/Cannot read|undefined|TypeError/)
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

// SỬA CÓ CHỦ ĐÍCH 09/10 tối — thầy: "phần này phải tối ưu lại, tôi chỉ cần giữ lại phần dạy học. Phần câu cần chữa trùng tu lại bỏ hết những thứ
// không cần thiết, thiết kế trực quan khoa học phù hợp với các chức năng hiện tại" + "kiểm tra đầu giờ giữ lại nữa nhé". Bốn thẻ cũ (Nhịp hôm nay ·
// Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao) ⇒ BA thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa; ba thẻ con của Cần thầy chữa (Buổi chữa ·
// Bước cuối trên lớp · Gỡ nút thắt) ⇒ MỘT danh sách câu/dạng cần chữa, mỗi dòng mở đúng chỗ làm việc SẴN CÓ; Chiến dịch đã giao ⇒ trang riêng.
describe('Hành trình: BA thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa', () => {
  it('ba thẻ, mặc định Dạy học; "Bổ sung bài" là nút chính DUY NHẤT và chỉ ở thẻ Dạy học; không còn Nhịp hôm nay / Chiến dịch đã giao / ba thẻ khối', async () => {
    mayChu()
    useSoDemGv.getState().datSo({ canThayChua: 7 })
    const { container } = render(<HanhTrinhV2 />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Dạy học', 'Kiểm tra đầu giờ', 'Cần thầy chữa · 7'])
    expect(screen.getByRole('tab', { name: 'Dạy học' }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    expect(screen.queryByRole('tab', { name: /Nhịp hôm nay|Chiến dịch đã giao|Bài đã dạy|Tổng quan/ })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Chỉ số hôm nay' })).toBeNull()
    expect(screen.queryByRole('radiogroup', { name: 'Chọn khối' })).toBeNull()
    expect(container.querySelector('.gvv2-khoi-nut, .gvv2-kpi, .gvv2-bang')).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Bổ sung bài' })).toHaveLength(1)
    expect(container.querySelectorAll('.gvv2-nut-chinh')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Giao theo bài' })).toBeNull()
    // thẻ Dạy học không đọc bảng/nhịp nào của máy chủ
    expect(m.goi).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('tab', { name: 'Kiểm tra đầu giờ' }))
    expect(await screen.findByText('Giả: Kiểm tra đầu giờ')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bổ sung bài' })).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: /^Cần thầy chữa/ }))
    expect(await screen.findByRole('region', { name: 'Cần thầy chữa · nhiều em sai trước' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bổ sung bài' })).toBeNull()
    // danh sách đọc xong (8 chỗ: gồm cả bước cuối, thẻ nút thắt, kèm riêng) ⇒ số cạnh tên thẻ khớp số trong thẻ
    await waitFor(() => expect(screen.getByRole('tab', { name: /^Cần thầy chữa/ }).textContent).toBe('Cần thầy chữa · 8'))
    // không còn ba thẻ con cũ
    expect(screen.queryByRole('tab', { name: /Buổi chữa|Bước cuối trên lớp|Gỡ nút thắt/ })).toBeNull()
  })

  it('"Bổ sung bài" cuộn tới bước Bài hôm nay của thẻ Dạy học — chỉ khi bấm (hoặc vào từ Hôm nay với boSungBai)', async () => {
    const cuon = vi.fn()
    const goc = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = cuon
    try {
      const { unmount } = render(<TheBaiDaDay />)
      await screen.findByText('Giả: Bài hôm nay')
      expect(cuon).not.toHaveBeenCalled()
      unmount()
      render(<HanhTrinhV2 boSungBai />)
      await screen.findByText('Giả: Bài hôm nay')
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(1))
      fireEvent.click(screen.getByRole('button', { name: 'Bổ sung bài' }))
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(2))
    } finally {
      Element.prototype.scrollIntoView = goc
    }
  })

  it('ChienDichScreen: Hôm nay đặt thẻ ⇒ mở đúng thẻ rồi xoá yêu cầu; không yêu cầu ⇒ Dạy học; Chiến dịch đã giao là trang riêng có nút quay lại', async () => {
    mayChu()
    useSoDemGv.getState().datMoHanhTrinh({ the: 'can-chua' })
    const { unmount } = render(<ChienDichScreen />)
    expect(screen.getByRole('tab', { name: /^Cần thầy chữa/ }).getAttribute('aria-selected')).toBe('true')
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
    unmount()

    const lan2 = render(<ChienDichScreen />)
    expect(screen.getByRole('tab', { name: 'Dạy học' }).getAttribute('aria-selected')).toBe('true')
    lan2.unmount()

    // lối vào từ Cài đặt › "Mở danh sách chiến dịch"
    useSoDemGv.getState().datMoHanhTrinh({ the: 'chien-dich' })
    render(<ChienDichScreen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Chiến dịch đã giao' })).toBeTruthy()
    expect(screen.queryByRole('tablist', { name: 'Hành trình' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Giao chiến dịch mới' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Giao theo bài' })).toBeNull()
    expect(await screen.findByText(HT12.ten)).toBeTruthy()
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    expect(screen.getByRole('tab', { name: 'Dạy học' }).getAttribute('aria-selected')).toBe('true')

    // Cài đặt (2.0) có lối vào gọn tới trang này
    const caiDat = readFileSync(resolve(__dirname, '../src/screens/CaiDatScreen.tsx'), 'utf8')
    expect(caiDat).toContain("datMoHanhTrinh({ the: 'chien-dich' })")
    expect(caiDat).toContain('Mở danh sách chiến dịch')
  })
})

describe('Hành trình › Cần thầy chữa: MỘT danh sách, nhiều em sai trước', () => {
  it('gộp mọi nguồn (câu sai từ 4 lần · vi kỹ năng · sơ ý · bước cuối · nút thắt · kèm riêng), xếp theo số em; mỗi dòng tên · nơi · lý do · số em · MỘT nút viền', async () => {
    mayChu()
    const { container } = render(<TheCanThayChua />)
    // chờ tải = khung xương đúng hình dòng, không chữ "Đang tải…"
    expect(screen.getByRole('status', { name: 'Đang tải danh sách cần chữa' }).querySelectorAll('.tt-xuong').length).toBeGreaterThan(3)
    expect(container.textContent).not.toMatch(/Đang tải/)

    const ds = await screen.findByRole('list')
    const dong = [...ds.querySelectorAll<HTMLElement>('li[data-khoa]')]
    expect(dong.map((d) => d.querySelector('.gvv2-cc-chu > b')?.textContent)).toEqual([
      'Câu 25 · Hiệu suất ester hoá',
      'Câu 6 · bước 1',
      'Câu 31 · Chỉ số xà phòng hoá',
      'Câu 12 · Hỗn hợp ester',
      'Câu 9 · Ester',
      'Câu 40 · Bảo toàn khối lượng',
      'Kèm riêng trên lớp',
      'Trần Đức Huy: sơ ý 12%',
    ])
    expect(dong.map((d) => d.querySelector('.gvv2-cc-so b')?.textContent)).toEqual(['9', '7', '6', '5', '4', '2', '1', '1'])
    // MỖI dòng đúng MỘT nút viền = việc chính của dòng
    for (const d of dong) expect(d.querySelectorAll('.gvv2-nut-vien')).toHaveLength(1)
    expect(dong.map((d) => d.querySelector('.gvv2-nut-vien')?.textContent)).toEqual([
      'Chiếu lên bảng',
      'Gỡ nút thắt',
      'Chiếu lên bảng',
      'Chữa trên lớp',
      'Chiếu lên bảng',
      'Chữa trên lớp',
      'Xem các em',
      'Xem các em',
    ])
    // thẻ nút thắt CÙNG câu 25 ⇒ nút phụ của dòng ấy, không lặp thành dòng riêng
    expect(within(dong[0]!).getByRole('button', { name: 'Gỡ nút thắt · 3 em' }).className).toContain('gvv2-nut-chu')
    expect(dong.filter((d) => /Câu 25/.test(d.textContent ?? ''))).toHaveLength(1)
    // nơi (khối/lớp) + lý do gấp bằng chữ thật
    expect(dong[4]!.querySelector('.gvv2-cc-meta')?.textContent).toBe('Khối 12Sai từ 4 lần')
    expect(dong[0]!.querySelector('.gvv2-cc-meta')?.textContent).toBe('12A1Sai từ 4 lần')
    expect(dong[1]!.querySelector('.gvv2-cc-meta')?.textContent).toBe('Khối 12Nhiều em vướng')
    expect(dong[0]!.querySelector('.gvv2-cc-ly-do')?.getAttribute('data-gap')).toBe('true')
    expect(dong[3]!.querySelector('.gvv2-cc-ly-do')?.getAttribute('data-gap')).toBe('false')
    expect(container.querySelector('.gvv2-cc-tom')?.textContent).toBe('8 chỗ cần chữa · 35 lượt em · nhiều em sai đứng trước')
    // không còn ô chọn chiến dịch, bảng từng em kiểu Nhịp, ba thẻ con
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Đang học|Đã làm hôm nay|Chặng|Dự phòng|Độ bao phủ/)
    // đọc đúng các lệnh sẵn có: Bảng bài OMNI chỉ cho chiến dịch thường đang chạy; bước cuối mọi lớp; thẻ nút thắt
    expect(m.goi.mock.calls.filter(([d, b]) => d === '/gv/omni' && b.action === 'bang').map(([, b]) => b.chienDichId)).toEqual(['cd-a'])
    expect(nguon.goiChuaThay).toHaveBeenCalledWith('hang-chieu', { lop: '' })
    expect(nguon.gvDsNutThat).toHaveBeenCalledTimes(1)
  })

  it('thanh phân đoạn Khối (kèm số em của Hành trình khối) lọc danh sách; khối trống nói rõ; dòng chưa rõ khối không bị giấu âm thầm', async () => {
    mayChu()
    render(<TheCanThayChua />)
    const loc = await screen.findByRole('radiogroup', { name: 'Lọc theo khối' })
    expect(within(loc).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Tất cả8 chỗ', 'Khối 103 em', 'Khối 123 em'])
    expect(within(loc).getByRole('radio', { name: /Tất cả/ }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(within(loc).getByRole('radio', { name: /Khối 12/ }))
    const ds = screen.getByRole('list')
    expect(ds.querySelectorAll('li[data-khoa]')).toHaveLength(7)
    expect(ds.textContent).toContain('1 chỗ chưa rõ khối — xem ở Tất cả')
    fireEvent.click(within(loc).getByRole('radio', { name: /Khối 10/ }))
    expect(ds.querySelectorAll('li[data-khoa]')).toHaveLength(0)
    expect(ds.textContent).toContain('Chưa có câu nào cần thầy chữa ở Khối 10.')
    fireEvent.click(within(ds).getByRole('button', { name: 'Tất cả' }))
    expect(screen.getByRole('list').querySelectorAll('li[data-khoa]')).toHaveLength(8)
  })

  it('bấm nút của dòng ⇒ đúng chỗ làm việc SẴN CÓ (ghim chiến dịch, chỉ khối chữa · bước cuối gọn · nút thắt chọn sẵn); "Danh sách cần chữa" quay lại, nạp lại, trả focus', async () => {
    mayChu()
    render(<TheCanThayChua />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu lên bảng: Câu 9 · Ester' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Chiếu lên bảng · Hành trình giỏi hoá · Khối 12' })).toBeTruthy()
    expect(await screen.findByText('Giả: Bảng chiến dịch và buổi chữa · ghim ht-12 · chỉ khối chữa')).toBeTruthy()
    const ve = screen.getByRole('button', { name: 'Danh sách cần chữa' })
    expect(document.activeElement).toBe(ve)
    const truoc = m.goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length
    fireEvent.click(ve)
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Chiếu lên bảng'))
    expect((document.activeElement as HTMLElement).closest('li')?.textContent).toContain('Câu 9 · Ester')
    expect(m.goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length).toBe(truoc + 1)

    fireEvent.click(screen.getByRole('button', { name: 'Gỡ nút thắt · 3 em' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Gỡ nút thắt' })).toBeTruthy()
    expect(await screen.findByText('Giả: Bàn gỡ nút thắt · nhúng · chọn B25|1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách cần chữa' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Chữa trên lớp: Câu 40 · Bảo toàn khối lượng' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Chữa bước cuối trên lớp' })).toBeTruthy()
    expect(await screen.findByText('Giả: Bước cuối trên lớp · gọn · chọn g1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách cần chữa' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Xem các em: Kèm riêng trên lớp' }))
    expect(await screen.findByText('Giả: Bàn gỡ nút thắt · nhúng')).toBeTruthy()
  })

  it('trống ⇒ "Chưa có câu nào cần thầy chữa."; mọi phần lỗi ⇒ câu dễ hiểu + Thử lại (không lỗi kỹ thuật thô); một phần lỗi ⇒ phần khác vẫn hiện', async () => {
    m.goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => (b.action === 'danh-sach' ? { ok: true, du: { homNay: '2026-10-09', chienDich: [] } } : { ok: false, loai: 'tu_choi', chu: 'lạ' }))
    nguon.goiChuaThay.mockResolvedValue({ ok: true, bat: false, ds: [], conNua: false })
    nguon.gvDsNutThat.mockResolvedValue({ ok: true, nhom: [], kemRieng: [] })
    const lan1 = render(<TheCanThayChua />)
    expect(await screen.findByText('Chưa có câu nào cần thầy chữa.')).toBeTruthy()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    lan1.unmount()

    m.goi.mockImplementation(async () => ({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }))
    nguon.goiChuaThay.mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'ds')"))
    nguon.gvDsNutThat.mockResolvedValue({ ok: false, error: 'Chưa nối được máy chủ.' })
    const lan2 = render(<TheCanThayChua />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được danh sách cần chữa. Không nối được máy chủ.')
    expect(within(loi).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(lan2.container.textContent).not.toMatch(/Cannot read|TypeError|undefined/)
    lan2.unmount()

    mayChu()
    nguon.goiChuaThay.mockResolvedValue({ ok: true, bat: true, ds: BUOC_CUOI, conNua: false })
    nguon.gvDsNutThat.mockResolvedValue({ ok: false, error: 'Chưa nối được máy chủ.' })
    render(<TheCanThayChua />)
    const motPhan = await screen.findByRole('alert')
    expect(motPhan.textContent).toContain('Chưa tải được thẻ nút thắt')
    expect(within(motPhan).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chiếu lên bảng: Câu 9 · Ester' })).toBeTruthy()
  })

  it('phép gom thuần: chiến dịch HẾT HẠN NỘP ⇒ "Xếp buổi chữa"; không có Hành trình ⇒ khối lọc đọc từ chính danh sách', () => {
    const cu = cd('cd-cu', { lop: '11A2', hetHan: true })
    const dong = gomCanChua({
      chienDich: [{ c: cu, b: bang(cu, { hetHan: true, canDayLai: [{ qid: 'q1', stt: 1, dang: 'Peptide', soEm: 3 } as BangChienDich['canDayLai'][number]] }), omni: [] }],
      buocCuoi: [],
      nutThat: [],
      kemRieng: [],
    })
    expect(dong).toHaveLength(1)
    expect(dong[0]).toMatchObject({ ten: 'Câu 1 · Peptide', noi: '11A2', khoi: 11, lyDo: 'Sai từ 4 lần · hết hạn nộp', gap: true, nut: { chu: 'Xếp buổi chữa', mo: { loai: 'chien-dich', id: 'cd-cu', hetHan: true } } })
    expect(khoiLoc([cu], dong)).toEqual([{ khoi: 11, soEm: null }])
    expect(khoiLoc([HT10, HT12, cu], dong)).toEqual([{ khoi: 10, soEm: 3 }, { khoi: 12, soEm: 3 }])
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
