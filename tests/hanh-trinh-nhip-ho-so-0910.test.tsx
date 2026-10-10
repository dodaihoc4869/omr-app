// HÀNH TRÌNH › NHỊP HỌC + TẤM LỊCH SỬ LÀM CÂU CỦA MỘT EM — thầy 09/10 khuya (nguyên văn): "hành trình để lại chỗ nhịp học, học sinh chưa làm và
// chưa hoàn thành đủ ưu tiên hiện lên đầu nhé, bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu, mọi thứ về
// học sinh đó". Kiểm:
//   · bốn thẻ Dạy học · Nhịp học · Kiểm tra đầu giờ · Cần thầy chữa; Hôm nay đặt `{ the: 'nhip', khoi }` ⇒ mở đúng thẻ, khối chọn sẵn;
//   · thứ tự ưu tiên: Chưa làm câu nào → Chưa đủ mức → Đủ mức → Chưa có mức hôm nay (tiêu đề + số); lọc khối; ô tìm (gõ không dấu);
//   · mỗi dòng là MỘT nút ⇒ tấm hồ sơ gọi đúng lệnh `/gv/lich-su-lam-cau {sbd}`; câu sai + số giây ("≈" ước tính, "chưa đo giờ");
//     toàn bộ lịch sử gom theo ngày, lọc "Chỉ lần sai", 100 lần đầu + "Xem thêm"; Esc đóng, focus về dòng; lỗi ⇒ câu dễ hiểu + Thử lại.
// SỐ TỪ MÁY CHỦ GIẢ (không số bịa); tên em là tên giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { BangChienDich, ChienDichTom } from '../src/components/chien-dich/api'
import type { KetQuaLichSuLamCau, LanLamCau } from '../src/lib/lich-su-lam-cau-api'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: vi.fn(async () => []), danhSachCauHoi: vi.fn(async () => []), xoaNhieuCa: vi.fn(), khoiPhucCa: vi.fn(), xoaVinhVienCa: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/components/day-hoc/DayHocLenBang', () => ({ default: () => <section data-khoi="bai-hom-nay">Giả: Bài hôm nay</section> }))
vi.mock('../src/components/day-hoc/KiemTraDauGio', () => ({ default: () => <p>Giả: Kiểm tra đầu giờ</p> }))

import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { useSoDemGv } from '../src/lib/so-dem-gv'
import { useAppStore } from '../src/store/appStore'
import { khopTim, xepNhomNhip } from '../src/components/chien-dich/nhip-hanh-trinh'
import { chuGiay, doiGiay, giayCacLanSai, gomTheoNgay, tenMucDo } from '../src/components/chien-dich/HoSoLamCauEm'
const { default: HanhTrinhV2, THE_HANH_TRINH } = await import('../src/components/chien-dich/HanhTrinhV2')
const { default: TheNhipHoc } = await import('../src/components/chien-dich/TheNhipHoc')
const { default: ChienDichScreen } = await import('../src/screens/ChienDichScreen')

const cd = (id: string, khoi: string): ChienDichTom => ({
  id,
  ten: `Hành trình giỏi hoá · Khối ${khoi}`,
  lop: `Khối ${khoi}`,
  hanhTrinh: true,
  maDe: [],
  hanNop: '9999-12-31',
  theLucNgay: 30,
  huyetChien: false,
  maCa: null,
  taoLuc: '2026-10-01T00:00:00Z',
  trangThai: 'dang_chay',
  soCau: 0,
  soEm: 3,
  hetHan: false,
})
const em = (sbd: string, ten: string, toiThieu: number | null, daLam: number, o: Record<string, unknown> = {}) => ({ sbd, ten, tang: toiThieu ? 2 : null, toiThieu, daLam, daXep: 30, conThieu: 0, ...o })
const HT10 = cd('ht-10', '10')
const HT12 = cd('ht-12', '12')
const BANG: Record<string, Partial<BangChienDich>> = {
  'ht-10': { hanhTrinhNgay: { em: [em('1', 'Nguyễn Văn An', 24, 24), em('2', 'Trần Bình', 24, 0), em('3', 'Lê Chi', 24, 10)] } },
  'ht-12': {
    hanhTrinhNgay: {
      em: [
        em('4', 'Phạm Dũng', 36, 40),
        em('5', 'Đỗ Em', 36, 0),
        em('6', 'Vũ Giang', null, 0),
        em('7', 'Hồ Hạnh', null, 5),
        em('8', 'Bùi Khoa', 36, 3, { conThieu: 4, canBoSung: [{ dang: 'ES', ten: 'Thuỷ phân ester', mucDo: 'hieu', lyDo: 'can_sua_nen' }] }),
      ],
    },
  },
}

const lanGia = (o: Partial<LanLamCau>): LanLamCau => ({ luc: '2026-10-09T02:30:00Z', ngay: '2026-10-09', qid: 'q25', tieuDe: 'Câu 25 · Hiệu suất ester hoá', mucDo: 'VD', noi: 'Đảo', dung: false, chon: 'B', giay: 65, nguonGiay: 'uoc', coGoiY: false, ...o })
const LAN: LanLamCau[] = [
  lanGia({}),
  lanGia({ luc: '2026-10-09T01:00:00Z', noi: 'Ca Kiểm tra 15 phút 12A1', chon: 'C', giay: null, nguonGiay: null }),
  lanGia({ luc: '2026-10-08T03:00:00Z', ngay: '2026-10-08', qid: 'q31', tieuDe: '', mucDo: 'hieu', noi: 'Đoàn', dung: true, chon: 'A', giay: 45, nguonGiay: 'do' }),
  lanGia({ luc: '2026-10-08T02:00:00Z', ngay: '2026-10-08', qid: 'q40', tieuDe: 'Câu 40 · Bảo toàn khối lượng', mucDo: '', noi: 'Lên bảng', dung: null, chon: null, giay: 46, nguonGiay: 'do', coGoiY: true }),
]
const LICH_SU: KetQuaLichSuLamCau = {
  ok: true,
  em: { sbd: '8', hoTen: 'Bùi Khoa', lop: '12A1' },
  tong: { soLuot: 7, soDung: 3, soSai: 3, soBoTrong: 1, soCau: 4, soCauSai: 2, giayTb: 52, tongGiay: 260 },
  lan: LAN,
  cauSai: [
    { qid: 'q25', tieuDe: 'Câu 25 · Hiệu suất ester hoá', mucDo: 'VD', soLan: 2, soSai: 2, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-09T02:30:00Z', giaySai: [null, 65] },
    { qid: 'q12', tieuDe: '', mucDo: 'biet', soLan: 3, soSai: 1, soDung: 2, lanCuoiDung: true, lanCuoi: '2026-10-07T02:00:00Z', giaySai: [30] },
  ],
  conNua: false,
  catBot: false,
}

function mayChu({ lichSu = { ok: true as const, du: LICH_SU } as unknown }: { lichSu?: unknown } = {}) {
  m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-09', chienDich: [HT12, HT10, { ...cd('cd-x', '12'), hanhTrinh: false }] } }
    if (duong === '/gv/chien-dich' && b.action === 'bang') return BANG[String(b.id)] ? { ok: true, du: { chienDich: b.id === 'ht-10' ? HT10 : HT12, homNay: '2026-10-09', hetHan: false, dang: [], em: [], canDayLai: [], ...BANG[String(b.id)] } } : { ok: false, loai: 'tu_choi', chu: 'không có' }
    if (duong === '/gv/lich-su-lam-cau') return typeof lichSu === 'function' ? (lichSu as () => unknown)() : lichSu
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
}

const tenNhom = (c: HTMLElement) => [...c.querySelectorAll('.gvv2-nh-nhom-tieu')].map((h) => h.textContent)
const tenEm = (c: HTMLElement) => [...c.querySelectorAll('.gvv2-nh-ten b')].map((b) => b.textContent)

beforeEach(() => {
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useSoDemGv.setState({ caMo: null, chienDichChay: null, canDayLai: null, canThayChua: null, giaoTuCa: null, moHanhTrinh: null, khoiHocSinh: null })
  useAppStore.getState().setScreen('chiendich')
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  useCoHoa2.getState().dat(null)
})

describe('phép thuần: nhóm ưu tiên + chữ số giây', () => {
  it('Chưa làm câu nào (có mức trước, rồi chưa có mức) → Chưa đủ mức (ít câu trước) → Đủ mức → Chưa có mức hôm nay; bỏ nhóm rỗng', () => {
    const ds = [...BANG['ht-10']!.hanhTrinhNgay!.em, ...BANG['ht-12']!.hanhTrinhNgay!.em]
    const n = xepNhomNhip(ds)
    expect(n.map((x) => [x.loai, x.em.map((e) => e.ten)])).toEqual([
      ['chua-lam', ['Đỗ Em', 'Trần Bình', 'Vũ Giang']],
      ['chua-du', ['Bùi Khoa', 'Lê Chi']],
      ['du', ['Nguyễn Văn An', 'Phạm Dũng']],
      ['chua-co-muc', ['Hồ Hạnh']],
    ])
    expect(xepNhomNhip([em('1', 'A', 10, 10)]).map((x) => x.loai)).toEqual(['du'])
    // ô tìm: không dấu vẫn khớp; SBD khớp
    expect(khopTim({ sbd: '11010', ten: 'Nguyễn Văn An' }, 'nguyen van')).toBe(true)
    expect(khopTim({ sbd: '11010', ten: 'Đỗ Em' }, 'do em')).toBe(true)
    expect(khopTim({ sbd: '11010', ten: 'Đỗ Em' }, '1101')).toBe(true)
    expect(khopTim({ sbd: '11010', ten: 'Đỗ Em' }, 'Bình')).toBe(false)
  })

  it('số giây: đo thật trơn · ước tính "≈" · không đo được "chưa đo giờ"; mức độ chữ chương trình; gom theo ngày giữ thứ tự', () => {
    expect(chuGiay(45, 'do')).toBe('45 giây')
    expect(chuGiay(65, 'uoc')).toBe('≈ 1 phút 5 giây')
    expect(chuGiay(null, null)).toBe('chưa đo giờ')
    expect(chuGiay(30, 'khong-ro')).toBe('30 giây')
    expect(doiGiay(120)).toBe('2 phút')
    expect([tenMucDo('biet'), tenMucDo('hieu'), tenMucDo('VD'), tenMucDo('VDC'), tenMucDo('')]).toEqual(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao', ''])
    expect(gomTheoNgay(LAN).map((n) => [n.ngay, n.lan.length])).toEqual([
      ['2026-10-09', 2],
      ['2026-10-08', 2],
    ])
    // câu sai: khớp lần sai trong lịch sử (cũ → mới) ⇒ biết nguồn; không khớp ⇒ số trơn
    expect(giayCacLanSai(LICH_SU.cauSai[0]!, LAN)).toEqual([
      { giay: null, nguon: null },
      { giay: 65, nguon: 'uoc' },
    ])
    expect(giayCacLanSai(LICH_SU.cauSai[1]!, LAN)).toEqual([{ giay: 30, nguon: 'khong-ro' }])
  })
})

describe('Hành trình: thẻ Nhịp học', () => {
  it('bốn thẻ đúng thứ tự; Hôm nay đặt { the: nhip, khoi: 12 } ⇒ ChienDichScreen mở Nhịp học, Khối 12 chọn sẵn, rồi xoá yêu cầu', async () => {
    expect(THE_HANH_TRINH.map(([, t]) => t)).toEqual(['Dạy học', 'Nhịp học', 'Kiểm tra đầu giờ', 'Cần thầy chữa'])
    mayChu()
    useSoDemGv.getState().datMoHanhTrinh({ the: 'nhip', khoi: 12 })
    const { container } = render(<ChienDichScreen />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Dạy học', 'Nhịp học', 'Kiểm tra đầu giờ', 'Cần thầy chữa'])
    expect(screen.getByRole('tab', { name: 'Nhịp học' }).getAttribute('aria-selected')).toBe('true')
    // thẻ Nhịp học không có nút chính "Bổ sung bài" (nút ấy chỉ thuộc thẻ Dạy học)
    expect(screen.queryByRole('button', { name: 'Bổ sung bài' })).toBeNull()
    await waitFor(() => expect(screen.getByRole('radio', { name: /Khối 12/ }).getAttribute('aria-checked')).toBe('true'))
    expect(tenEm(container)).toEqual(['Đỗ Em', 'Vũ Giang', 'Bùi Khoa', 'Phạm Dũng', 'Hồ Hạnh'])
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
  })

  it('dòng tóm tắt + nhóm có tiêu đề và số, em chưa làm / chưa đủ đứng đầu; lọc khối; ô tìm; không dựng lại bốn ô số', async () => {
    mayChu()
    const { container } = render(<TheNhipHoc />)
    await waitFor(() => expect(tenNhom(container).length).toBeGreaterThan(0))
    const vung = screen.getByRole('region', { name: /^Nhịp học/ })
    expect(vung.querySelector('.gvv2-cc-tom')?.textContent).toBe('2/6 em đủ mức hôm nay · 3 em chưa làm câu nào')
    expect(tenNhom(container)).toEqual(['Chưa làm câu nào · 3 em', 'Chưa đủ mức · 2 em', 'Đủ mức · 2 em', 'Chưa có mức hôm nay · 1 em'])
    expect(tenEm(container)).toEqual(['Đỗ Em', 'Trần Bình', 'Vũ Giang', 'Bùi Khoa', 'Lê Chi', 'Nguyễn Văn An', 'Phạm Dũng', 'Hồ Hạnh'])
    expect(container.querySelector('.gvv2-kpi, .gvv2-the-so, .gvv2-chuong')).toBeNull()
    // mỗi dòng là MỘT nút; số có nhãn ("Hôm nay", "Đã xếp")
    const dong = [...container.querySelectorAll<HTMLButtonElement>('.gvv2-nh-dong')]
    expect(dong).toHaveLength(8)
    for (const d of dong) expect(d.tagName).toBe('BUTTON')
    expect(dong[3]!.textContent).toContain('Hôm nay3/36 câu')
    expect(dong[3]!.textContent).toContain('Thiếu 4 câu phù hợp')
    expect(dong[3]!.textContent).toContain('Đã xếp 30 câu · 1 kiến thức cần bổ sung')
    expect(dong[3]!.getAttribute('aria-label')).toBe('Bùi Khoa, SBD 8, Khối 12: hôm nay 3/36 câu · Thiếu 4 câu phù hợp — xem lịch sử làm câu')

    // thanh phân đoạn khối: Tất cả 8 em · Khối 10: 3 em · Khối 12: 5 em
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Tất cả8 em', 'Khối 103 em', 'Khối 125 em'])
    fireEvent.click(screen.getByRole('radio', { name: /Khối 10/ }))
    expect(tenNhom(container)).toEqual(['Chưa làm câu nào · 1 em', 'Chưa đủ mức · 1 em', 'Đủ mức · 1 em'])
    expect(vung.querySelector('.gvv2-cc-tom')?.textContent).toBe('1/3 em đủ mức hôm nay · 1 em chưa làm câu nào')
    fireEvent.click(screen.getByRole('radio', { name: /Tất cả/ }))

    // ô tìm: gõ không dấu
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm học sinh theo tên hoặc số báo danh' }), { target: { value: 'do em' } })
    expect(tenEm(container)).toEqual(['Đỗ Em'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'không ai' } })
    expect(screen.getByText('Không có em nào khớp ô tìm.')).toBeTruthy()
  })

  it('lỗi tải danh sách ⇒ câu dễ hiểu (không lỗi kỹ thuật thô) + Thử lại; một khối lỗi ⇒ khối khác vẫn hiện', async () => {
    m.goi.mockResolvedValueOnce({ ok: false, loai: 'mang', chu: 'TypeError: Failed to fetch' })
    render(<TheNhipHoc />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được nhịp học của các em. Mạng có thể đang chập chờn.')
    expect(loi.textContent).not.toMatch(/TypeError|fetch/)
    mayChu()
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(3))
    cleanup()

    m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-09', chienDich: [HT10, HT12] } }
      if (b.action === 'bang' && b.id === 'ht-10') return { ok: true, du: { chienDich: HT10, ...BANG['ht-10'] } }
      return { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }
    })
    const { container } = render(<TheNhipHoc />)
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa tải được nhịp học Khối 12. Không nối được máy chủ. Khối khác vẫn đúng.')
    expect(tenEm(container)).toEqual(['Trần Bình', 'Lê Chi', 'Nguyễn Văn An'])
  })
})

describe('bấm một em ⇒ tấm Lịch sử làm câu', () => {
  it('gọi đúng lệnh; đầu tấm tên · SBD · lớp · hôm nay; bốn ô số có nhãn; Câu sai có số giây ("≈", "chưa đo giờ"); Esc đóng, focus về dòng', async () => {
    mayChu()
    render(<TheNhipHoc />)
    const nut = await screen.findByRole('button', { name: /^Bùi Khoa, SBD 8/ })
    nut.focus()
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: 'Bùi Khoa' })
    expect(tam.getAttribute('aria-modal')).toBe('true')
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/lich-su-lam-cau').map(([, b]) => b)).toEqual([{ sbd: '8' }])
    // mở tấm ⇒ focus vào nút Đóng
    expect(document.activeElement).toBe(within(tam).getByRole('button', { name: 'Đóng' }))
    await within(tam).findByText('SBD 8 · Lớp 12A1')
    expect(tam.querySelector('.gvv2-hs-hn')?.textContent).toContain('Hôm nay3/36 câu')
    expect(tam.querySelector('.gvv2-hs-hn')?.textContent).toContain('Chưa đủ mức')
    expect(tam.textContent).toContain('Kiến thức cần bổ sung')
    expect([...tam.querySelectorAll('.gvv2-hs-o')].map((o) => o.textContent)).toEqual([
      'Số lượt làm câu74 câu khác nhau',
      'Tỉ lệ đúng43%3 đúng · 3 sai · 1 bỏ trống',
      'Câu từng sai21 câu chưa sửa được',
      'Trung bình mỗi câu52 giâylượt đo được, gồm ước tính',
    ])
    // thẻ con mặc định: Câu sai
    expect(within(tam).getByRole('tab', { name: /Câu sai/ }).getAttribute('aria-selected')).toBe('true')
    const cau = [...tam.querySelectorAll('.gvv2-hs-cau')]
    expect(cau).toHaveLength(2)
    expect(cau[0]!.textContent).toContain('Câu 25 · Hiệu suất ester hoá')
    expect(cau[0]!.textContent).toContain('Chưa sửa được')
    expect(cau[0]!.textContent).toContain('Vận dụng · sai 2 lần · đúng 0 lần')
    expect(cau[0]!.querySelector('.gvv2-hs-cau-giay')?.textContent).toBe('Số giây các lần sai: chưa đo giờ · ≈ 1 phút 5 giây')
    expect(cau[1]!.textContent).toContain('Câu q12')
    expect(cau[1]!.textContent).toContain('Đã sửa được')
    expect(cau[1]!.querySelector('.gvv2-hs-cau-giay')?.textContent).toBe('Số giây các lần sai: 30 giây')

    // Tab ở phần tử cuối ⇒ vòng về đầu tấm (giữ focus trong tấm)
    const nutTam = [...tam.querySelectorAll<HTMLElement>('button:not([disabled])')]
    nutTam[nutTam.length - 1]!.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(nutTam[0])
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(nutTam[nutTam.length - 1])

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Bùi Khoa, SBD 8/ }))
  })

  it('Toàn bộ lịch sử: gom theo ngày, mỗi lần giờ · nơi · câu · kết quả · đáp án chọn · số giây; "Chỉ lần sai"; Mở hồ sơ đầy đủ', async () => {
    mayChu()
    render(<TheNhipHoc />)
    fireEvent.click(await screen.findByRole('button', { name: /^Bùi Khoa, SBD 8/ }))
    const tam = await screen.findByRole('dialog')
    fireEvent.click(await within(tam).findByRole('tab', { name: /Toàn bộ lịch sử/ }))
    expect([...tam.querySelectorAll('.gvv2-hs-ngay-tieu')].map((h) => h.textContent)).toEqual(['Thứ Sáu 09/10/2026 · 2 lượt', 'Thứ Năm 08/10/2026 · 2 lượt'])
    const lan = [...tam.querySelectorAll('.gvv2-hs-lan')].map((l) => l.textContent)
    expect(lan).toEqual([
      '09:30Câu 25 · Hiệu suất ester hoáĐảo · Vận dụng · Chọn B · ≈ 1 phút 5 giâySai',
      '08:00Câu 25 · Hiệu suất ester hoáCa Kiểm tra 15 phút 12A1 · Vận dụng · Chọn C · chưa đo giờSai',
      '10:00Câu q31Đoàn · Thông hiểu · Chọn A · 45 giâyĐúng',
      '09:00Câu 40 · Bảo toàn khối lượngLên bảng · 46 giây · có dùng gợi ýBỏ trống',
    ])
    const loc = within(tam).getByRole('button', { name: 'Chỉ lần sai' })
    fireEvent.click(loc)
    expect(loc.getAttribute('aria-pressed')).toBe('true')
    expect(tam.querySelectorAll('.gvv2-hs-lan')).toHaveLength(2)
    expect(tam.textContent).toContain('Đang hiện 2/2 lần sai')

    fireEvent.click(within(tam).getByRole('button', { name: 'Mở hồ sơ đầy đủ' }))
    expect(useAppStore.getState()).toMatchObject({ screen: 'hocsinh', sbdDangXem: '8' })
  })

  it('danh sách dài: 100 lần đầu + "Xem thêm"; lỗi mạng ⇒ câu dễ hiểu + Thử lại gọi lại', async () => {
    const nhieu = Array.from({ length: 150 }, (_, i) => lanGia({ luc: new Date(Date.UTC(2026, 9, 9, 3, 0, 0) - i * 60_000).toISOString(), qid: `q${i}` }))
    mayChu({ lichSu: { ok: true, du: { ...LICH_SU, lan: nhieu, tong: { ...LICH_SU.tong, soLuot: 150 } } } })
    render(<TheNhipHoc />)
    fireEvent.click(await screen.findByRole('button', { name: /^Bùi Khoa, SBD 8/ }))
    let tam = await screen.findByRole('dialog')
    fireEvent.click(await within(tam).findByRole('tab', { name: /Toàn bộ lịch sử/ }))
    expect(tam.querySelectorAll('.gvv2-hs-lan')).toHaveLength(100)
    fireEvent.click(within(tam).getByRole('button', { name: 'Xem thêm 50 lượt (còn 50)' }))
    expect(tam.querySelectorAll('.gvv2-hs-lan')).toHaveLength(150)
    expect(within(tam).queryByRole('button', { name: /^Xem thêm/ })).toBeNull()
    fireEvent.click(within(tam).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    let lan = 0
    mayChu({ lichSu: () => (++lan === 1 ? { ok: false, loai: 'mang', chu: 'Failed to fetch' } : { ok: true, du: LICH_SU }) })
    fireEvent.click(screen.getByRole('button', { name: /^Bùi Khoa, SBD 8/ }))
    tam = await screen.findByRole('dialog')
    const loi = await within(tam).findByRole('alert')
    expect(loi.textContent).toBe('Chưa tải được lịch sử làm câu của em. Mạng có thể đang chập chờn.Thử lại')
    // vẫn mở được hồ sơ đầy đủ khi lệnh lỗi
    expect(within(tam).getByRole('button', { name: 'Mở hồ sơ đầy đủ' })).toBeTruthy()
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    expect(await within(tam).findByText('Câu 25 · Hiệu suất ester hoá')).toBeTruthy()
    expect(lan).toBe(2)
  })

  it('HanhTrinhV2 mặc định vẫn là Dạy học và KHÔNG đọc nhịp khi chưa mở thẻ Nhịp học', async () => {
    mayChu()
    render(<HanhTrinhV2 />)
    expect(screen.getByRole('tab', { name: 'Dạy học' }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    expect(m.goi).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: 'Nhịp học' }))
    expect(await screen.findByRole('region', { name: /^Nhịp học/ })).toBeTruthy()
    await waitFor(() => expect(m.goi.mock.calls.some(([d, b]) => d === '/gv/chien-dich' && b.action === 'danh-sach')).toBe(true))
  })
})
