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
import { choTamXong, moGap } from './_ho-so-6-muc'
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
import { chuGiay, doiGiay, GIOI_HAN_KHUNG_DAU, giayCacLanSai, gomTheoNgay, tenMucDo, xoaDemHoSoLamCau } from '../src/components/chien-dich/HoSoLamCauEm'
const { default: HanhTrinhV2 } = await import('../src/components/chien-dich/HanhTrinhV2')
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
  xoaDemHoSoLamCau()
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

// SỬA CÓ CHỦ ĐÍCH 12/10 — thầy: "lịch sử học sinh làm bài tập hàng ngày, tính từ 12/10" ⇒ thẻ Bài hằng ngày ngay sau Nhịp học.
// SỬA CÓ CHỦ ĐÍCH 12/10 (chiều) — thầy 12/10: Hành trình còn 2 mục ("thu gọn tối giản hết lại thành 2 mục": Dạy học & đầu giờ · Chữa bài). Nhịp học
// chuyển sang màn Hôm nay (làn Hôm nay); thẻ `TheNhipHoc` đã gỡ khỏi src/ 27/10 (không màn nào dùng) ⇒ các test vẽ thẻ + tấm qua thẻ ấy bỏ theo (tấm HoSoLamCauEm còn kiểm ở test ho-so-* khác). Khoá cũ `{ the: 'nhip' }` ⇒ mục Dạy học & đầu giờ.
// SỬA CÓ CHỦ ĐÍCH 21/10 (thầy duyệt bản vẽ docs/ban-ve-hanh-trinh-2110): Hành trình thành MỘT trang 4 bước, không còn thẻ / mục.
describe('Hành trình: thẻ Nhịp học', () => {
  it('Hành trình không còn thẻ; Hôm nay đặt khoá cũ { the: nhip, khoi: 12 } ⇒ ChienDichScreen mở trang 4 bước, không đọc nhịp, rồi xoá yêu cầu', async () => {
    mayChu()
    useSoDemGv.getState().datMoHanhTrinh({ the: 'nhip', khoi: 12 })
    render(<ChienDichScreen />)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(screen.queryByText(/^(Nhịp học|Bài hằng ngày|Bài mới trong 7 ngày|Kiểm tra đầu giờ)$/)).toBeNull()
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
    expect(m.goi.mock.calls.some(([d]) => d === '/gv/chien-dich')).toBe(false)
  })

})

describe('bấm một em ⇒ tấm Lịch sử làm câu', () => {
  // SỬA CÓ CHỦ ĐÍCH (thầy 12/10: Hành trình còn 2 mục) — không còn thẻ Nhịp học trong Hành trình; mục mặc định không đọc nhịp.
  it('HanhTrinhV2 là trang 4 bước và KHÔNG đọc nhịp (Nhịp học đã sang màn Hôm nay)', async () => {
    mayChu()
    render(<HanhTrinhV2 />)
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(m.goi.mock.calls.some(([d]) => d === '/gv/chien-dich')).toBe(false)
  })
})
