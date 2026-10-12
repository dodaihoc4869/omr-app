// HÀNH TRÌNH › BÀI HẰNG NGÀY + TẤM HỒ SƠ LÀM BÀI (trùng tu) — thầy 12/10 (nguyên văn): "tôi cần biết lịch sử học sinh làm bài tập hàng ngày, tính
// từ 12/10. Học sinh thiếu nhiều ngày nhất hiển thị lên đầu, làm thiếu nhiều câu nhất trong từng ngày" · "Khi tôi bấm vào học sinh tôi muốn biết mọi
// thông tin làm bài của học sinh, câu sai, câu đúng, câu đã làm, câu đã ôn … chăm chỉ hay lười biếng hay đối phó". Kiểm:
//   · thẻ "Bài hằng ngày" đứng ngay sau Nhịp học; Hôm nay đặt `{ the: 'bai-hang-ngay' }` ⇒ mở đúng thẻ;
//   · bảng nhiệt giữ thứ tự máy chủ (thiếu nhiều ngày nhất đầu), ô "đã làm/mức" tô bốn mức, cột tổng; bấm đầu cột một ngày ⇒ em thiếu nhiều câu nhất
//     ngày ấy lên đầu; lọc khối / lớp / tìm; ghi chú mức ước tính;
//   · bấm em ⇒ tấm hồ sơ gọi `/gv/ho-so-thai-do` + `/gv/lich-su-lam-cau` cùng SBD; nhãn thái độ + lý do bằng số; năm ô số; lịch ngày; sáu tín hiệu;
//     thẻ con Câu sai · Câu đúng · Câu đã ôn · Toàn bộ lịch sử; lệnh hồ sơ thái độ lỗi ⇒ một dòng trạng thái, lịch sử vẫn đủ.
// SỐ TỪ MÁY CHỦ GIẢ (không số bịa); tên em là tên giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { EmBaiHangNgay, KetQuaBaiHangNgay, KetQuaHoSoThaiDo, NgayBaiEm } from '../src/lib/bai-hang-ngay-api'
import type { KetQuaLichSuLamCau } from '../src/lib/lich-su-lam-cau-api'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: vi.fn(async () => []), danhSachCauHoi: vi.fn(async () => []), xoaNhieuCa: vi.fn(), khoiPhucCa: vi.fn(), xoaVinhVienCa: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/components/day-hoc/DayHocLenBang', () => ({ default: () => <section>Giả: Bài hôm nay</section> }))
vi.mock('../src/components/day-hoc/KiemTraDauGio', () => ({ default: () => <p>Giả: Kiểm tra đầu giờ</p> }))

import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { useSoDemGv } from '../src/lib/so-dem-gv'
import { useAppStore } from '../src/store/appStore'
import { docBaiHangNgay, docHoSoThaiDo, NGAY_BAT_DAU_BAI_HANG_NGAY } from '../src/lib/bai-hang-ngay-api'
import { mucO, ngayNgan, xepTheoNgay } from '../src/components/chien-dich/bai-hang-ngay-ui'
import { MOC_THEO_DOI } from '../server/src/ph-con-tong-quan-kieu'
import { readFileSync } from 'node:fs'
const { default: TheBaiHangNgay } = await import('../src/components/chien-dich/TheBaiHangNgay')
const { default: ChienDichScreen } = await import('../src/screens/ChienDichScreen')

const NGAY = ['2026-10-12', '2026-10-13', '2026-10-14']
const n = (ngay: string, daLam: number, muc = 24, o: Partial<NgayBaiEm> = {}): NgayBaiEm => ({
  ngay, mucToiThieu: muc, daLam, thieu: Math.max(0, muc - daLam), datMuc: daLam >= muc, mucUocTinh: true, nguonMuc: 'mac-dinh', tang: 1, cheDo: 'goi7', homNay: ngay === '2026-10-14', ...o,
})
const em = (sbd: string, hoTen: string, khoi: string, lop: string, ds: NgayBaiEm[]): EmBaiHangNgay => {
  const qua = ds.filter((x) => !x.homNay)
  let lon: { ngay: string; thieu: number } | null = null
  for (const x of qua) if (x.thieu > 0 && (!lon || x.thieu >= lon.thieu)) lon = { ngay: x.ngay, thieu: x.thieu }
  return {
    sbd, hoTen, khoi, lop, ngay: ds, soNgayThieu: qua.filter((x) => !x.datMuc).length, tongCauThieu: qua.reduce((t, x) => t + x.thieu, 0), ngayThieuNhieuNhat: lon,
    soNgayDu: ds.filter((x) => x.datMuc).length, soNgayKhongLam: qua.filter((x) => x.daLam === 0).length, tongDaLam: ds.reduce((t, x) => t + x.daLam, 0),
    thieuHomNay: ds.find((x) => x.homNay)?.thieu ?? 0,
  }
}
// thứ tự MÁY CHỦ (hôm nay 14/10 chưa cộng vào tổng): số ngày thiếu ↓ → câu thiếu ↓ → thiếu hôm nay ↓ → tên
const EM = [
  em('11', 'Trần An', '12', '12 - Tinh Hoa', [n(NGAY[0]!, 0, 30, { nguonMuc: 'tang-gan-nhat', tang: 2, cheDo: 'hanh-trinh' }), n(NGAY[1]!, 3, 36, { mucUocTinh: false, nguonMuc: 'da-chot', tang: 3, cheDo: 'hanh-trinh' }), n(NGAY[2]!, 0, 36)]),
  em('31', 'Vũ Phương', '10', '10 - Nền tảng', [n(NGAY[0]!, 20), n(NGAY[1]!, 0), n(NGAY[2]!, 5)]),
  em('12', 'Lê Bình', '12', '12 - Tinh Hoa', [n(NGAY[0]!, 24), n(NGAY[1]!, 3), n(NGAY[2]!, 0)]),
  em('13', 'Phạm Chi', '12', '12 - Chuyên', [n(NGAY[0]!, 24), n(NGAY[1]!, 30), n(NGAY[2]!, 24)]),
]
const BANG: KetQuaBaiHangNgay = {
  ok: true, tu: '2026-10-12', den: '2026-10-14', homNay: '2026-10-14', ngay: NGAY, em: EM,
  lop: [{ tenLop: '12 - Chuyên', khoi: '12', soEm: 1 }, { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 2 }, { tenLop: '10 - Nền tảng', khoi: '10', soEm: 1 }],
  soOUocTinh: 11, soO: 12, canhBao: [],
}
const THAI_DO: KetQuaHoSoThaiDo = {
  ok: true, em: { sbd: '12', hoTen: 'Lê Bình', lop: '12 - Tinh Hoa', khoi: '12' }, tu: '2026-10-12', den: '2026-10-14', homNay: '2026-10-14',
  ketLuan: { nhan: 'doi-pho', chu: 'Có dấu hiệu đối phó', lyDo: ['Trả lời quá nhanh: Quá nhanh 16/40 lượt (40%) · nhóm quá nhanh đúng 25% · lượt thường đúng 92%.'] },
  tinHieu: [
    { ma: 'ngay-du-muc', ten: 'Ngày đủ mức', muc: 'chua-du', giaTri: 50, tu: 1, mau: 2, chu: 'Đủ mức 1/2 ngày (50%)', nguong: 'Tốt từ 80%' },
    { ma: 'qua-nhanh', ten: 'Trả lời quá nhanh', muc: 'xau', giaTri: 40, tu: 16, mau: 40, chu: 'Quá nhanh 16/40 lượt (40%)', nguong: 'Đáng lo khi từ 30%' },
    { ma: 'don-bai', ten: 'Dồn bài cuối ngày', muc: 'tot', giaTri: 0, tu: 0, mau: 40, chu: '0/40 lượt làm trong 23:00–04:59 (0%)', nguong: 'Đáng lo từ 50%' },
    { ma: 'goi-y', ten: 'Dùng gợi ý, đọc lời giải', muc: 'tot', giaTri: 5, tu: 1, mau: 20, chu: '1/20 câu', nguong: 'Đáng lo từ 50%' },
    { ma: 'chon-lap', ten: 'Chọn lặp một phương án', muc: 'chu-y', giaTri: 6, tu: 2, mau: 30, chu: '2/30 lượt', nguong: 'chuỗi từ 6' },
    { ma: 'xu-huong', ten: 'Độ đúng theo thời gian', muc: 'chua-du', giaTri: null, tu: 40, mau: 0, chu: '7 ngày gần nhất đúng 60% (40 lượt) · trước đó — (0 lượt)', nguong: 'giảm từ 15' },
  ],
  dem: { soLuot: 40, soCau: 20, soDung: 24, soSai: 15, soBoTrong: 1, soCauOn: 3, soLuotOn: 5, giayTb: 21, giayTrungVi: 9, soLuotCoGiay: 40 },
  ngay: [
    { ...n(NGAY[0]!, 24), soLuot: 24, soDung: 20, soSai: 4, tiLeDung: 83 },
    { ...n(NGAY[1]!, 3), soLuot: 16, soDung: 4, soSai: 11, tiLeDung: 27 },
    { ...n(NGAY[2]!, 0), soLuot: 0, soDung: 0, soSai: 0, tiLeDung: null },
  ],
  phanBoGiay: [
    { nhan: 'Dưới 8 giây', tu: 0, den: 8, soLuot: 16, soDung: 4, soNhanh: 16 },
    { nhan: '8–14 giây', tu: 8, den: 15, soLuot: 4, soDung: 3, soNhanh: 0 },
    { nhan: '15–29 giây', tu: 15, den: 30, soLuot: 20, soDung: 17, soNhanh: 0 },
  ],
  cauDung: [
    { qid: 'Q7', tieuDe: 'Câu 7 · Thuỷ phân ester', mucDo: 'hieu', soLan: 3, soDung: 1, soSai: 2, dungLanDau: false, lanCuoiDung: true, lanCuoi: '2026-10-13T03:00:00Z', soLanOn: 2 },
    { qid: 'Q8', tieuDe: '', mucDo: 'biet', soLan: 1, soDung: 1, soSai: 0, dungLanDau: true, lanCuoiDung: true, lanCuoi: '2026-10-12T03:00:00Z', soLanOn: 0 },
  ],
  cauDaOn: [{ qid: 'Q9', tieuDe: 'Câu 9 · Chất béo', mucDo: 'VD', soLan: 2, soDung: 0, soSai: 2, dungLanDau: false, lanCuoiDung: false, lanCuoi: '2026-10-13T04:00:00Z', soLanOn: 1 }],
  catBot: false, canhBao: [],
}
const LICH_SU: KetQuaLichSuLamCau = {
  ok: true, em: { sbd: '12', hoTen: 'Lê Bình', lop: '12 - Tinh Hoa' },
  tong: { soLuot: 2, soDung: 1, soSai: 1, soBoTrong: 0, soCau: 2, soCauSai: 1, giayTb: 30, tongGiay: 60 },
  lan: [
    { luc: '2026-10-13T04:00:00Z', ngay: '2026-10-13', qid: 'Q9', tieuDe: 'Câu 9 · Chất béo', mucDo: 'VD', noi: 'Ôn lại', dung: false, chon: 'B', giay: 40, nguonGiay: 'do', coGoiY: false },
    { luc: '2026-10-12T03:00:00Z', ngay: '2026-10-12', qid: 'Q8', tieuDe: '', mucDo: 'biet', noi: 'Đảo', dung: true, chon: 'A', giay: 20, nguonGiay: 'do', coGoiY: false },
  ],
  cauSai: [{ qid: 'Q9', tieuDe: 'Câu 9 · Chất béo', mucDo: 'VD', soLan: 2, soSai: 2, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-13T04:00:00Z', giaySai: [35, 40] }],
  conNua: false, catBot: false,
}

function mayChu({ thaiDo = { ok: true as const, du: THAI_DO } as unknown, bang = { ok: true as const, du: BANG } as unknown } = {}) {
  m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/bai-hang-ngay') return bang
    if (duong === '/gv/ho-so-thai-do') return thaiDo
    if (duong === '/gv/lich-su-lam-cau') return { ok: true, du: { ...LICH_SU, em: { ...LICH_SU.em, sbd: String(b.sbd) } } }
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-14', chienDich: [] } }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
}
const tenHang = (c: HTMLElement) => [...c.querySelectorAll('.gvv2-bhn-ten b')].map((b) => b.textContent)

beforeEach(() => {
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useSoDemGv.setState({ moHanhTrinh: null, canThayChua: null })
  useAppStore.getState().setScreen('chiendich')
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  useCoHoa2.getState().dat(null)
})

describe('phép thuần + lớp nối', () => {
  it('bốn mức ô: đủ · thiếu ít (từ 50% mức) · thiếu nhiều · không làm; xếp theo một ngày', () => {
    expect([n('2026-10-12', 24), n('2026-10-12', 12), n('2026-10-12', 11), n('2026-10-12', 0)].map(mucO)).toEqual(['du', 'thieu-it', 'thieu-nhieu', 'khong-lam'])
    expect([...EM].sort(xepTheoNgay('2026-10-13')).map((e) => e.hoTen)).toEqual(['Trần An', 'Vũ Phương', 'Lê Bình', 'Phạm Chi'])
    expect([...EM].sort(xepTheoNgay('2026-10-14')).map((e) => e.hoTen)).toEqual(['Trần An', 'Lê Bình', 'Vũ Phương', 'Phạm Chi'])
  })

  it('đọc trả lời phòng thủ: thiếu khung ⇒ null; ô sai kiểu bị bỏ; thiếu/đủ tính lại từ hai số', () => {
    expect(docBaiHangNgay({ ok: true })).toBeNull()
    const r = docBaiHangNgay({ ...BANG, em: [{ ...EM[0], ngay: [{ ...EM[0]!.ngay[0], thieu: 999 }, { ngay: 'hỏng', mucToiThieu: 24 }] }, { hoTen: 'Không SBD' }] } as never)!
    expect(r.em).toHaveLength(1)
    expect(r.em[0]!.ngay.map((x) => [x.ngay, x.thieu, x.datMuc])).toEqual([['2026-10-12', 30, false]])
    expect(docHoSoThaiDo({ ok: true, em: {} })).toBeNull()
    expect(docHoSoThaiDo(THAI_DO as never)!.ketLuan).toEqual(THAI_DO.ketLuan)
  })
})

describe('thẻ Bài hằng ngày', () => {
  // SỬA CÓ CHỦ ĐÍCH — thầy 12/10: Hành trình còn 2 mục (Dạy học & đầu giờ · Chữa bài); thẻ Bài hằng ngày chuyển sang màn Hôm nay (làn Hôm nay).
  // `TheBaiHangNgay` giữ nguyên (các test dưới); khoá cũ `{ the: 'bai-hang-ngay' }` không gãy: mở mục Dạy học & đầu giờ, không gọi lệnh bảng nhiệt.
  it('khoá cũ { the: bai-hang-ngay } ⇒ Hành trình mở mục Dạy học & đầu giờ (không còn thẻ Bài hằng ngày), xoá yêu cầu', async () => {
    mayChu()
    useSoDemGv.getState().datMoHanhTrinh({ the: 'bai-hang-ngay' })
    render(<ChienDichScreen />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Dạy học & đầu giờ', 'Chữa bài'])
    expect(screen.getByRole('tab', { name: 'Dạy học & đầu giờ' }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: Bài hôm nay')).toBeTruthy()
    await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/bai-hang-ngay')).toHaveLength(0)
  })

  it('bảng nhiệt: thứ tự máy chủ, ô "đã làm/mức" tô bốn mức, ô hôm nay, cột tổng, ghi chú mức ước tính', async () => {
    mayChu()
    const { container } = render(<TheBaiHangNgay />)
    await waitFor(() => expect(tenHang(container)).toEqual(['Trần An', 'Vũ Phương', 'Lê Bình', 'Phạm Chi']))
    const vung = screen.getByRole('region', { name: /^Bài hằng ngày/ })
    expect(vung.querySelector('.gvv2-cc-tom')?.textContent).toBe('3/4 em thiếu ít nhất một ngày đã qua · 3 em chưa đủ mức hôm nay · từ 12/10 đến 14/10 (3 ngày)')
    expect([...container.querySelectorAll('thead th')].map((t) => t.textContent)).toEqual([
      'Học sinh · 4 em', '12/10T2', '13/10T3', '14/10Hôm nay', 'Số ngày thiếu', 'Câu thiếu', 'Ngày thiếu nhiều nhất',
    ])
    const hang = [...container.querySelectorAll<HTMLTableRowElement>('.gvv2-bhn-hang')]
    const o = (h: HTMLTableRowElement) => [...h.querySelectorAll('.gvv2-bhn-o')].map((x) => [x.querySelector('span')!.textContent, x.getAttribute('data-muc')])
    expect(o(hang[0]!)).toEqual([['0/30', 'khong-lam'], ['3/36', 'thieu-nhieu'], ['0/36', 'khong-lam']])
    expect(o(hang[1]!)).toEqual([['20/24', 'thieu-it'], ['0/24', 'khong-lam'], ['5/24', 'thieu-nhieu']])
    expect(o(hang[3]!)).toEqual([['24/24', 'du'], ['30/24', 'du'], ['24/24', 'du']])
    expect(hang[0]!.querySelectorAll('.gvv2-bhn-o')[2]!.getAttribute('data-hom-nay')).toBe('true')
    expect([...hang[0]!.querySelectorAll('.gvv2-bhn-tong')].map((x) => x.textContent)).toEqual(['2/2 ngày', '63 câu', '13/10 · thiếu 33 câu'])
    expect(hang[3]!.querySelectorAll('.gvv2-bhn-tong')[2]!.textContent).toBe('Không thiếu ngày nào')
    // màu không là kênh duy nhất: câu đầy đủ cho trình đọc màn hình
    expect(hang[0]!.querySelectorAll('.gvv2-bhn-o')[1]!.getAttribute('title')).toBe('Thứ Ba 13/10: đã làm 3/36 câu — thiếu 33 câu')
    expect(hang[0]!.querySelectorAll('.gvv2-bhn-o')[0]!.getAttribute('title')).toBe('Thứ Hai 12/10: đã làm 0/30 câu — thiếu 30 câu · mức ước tính')
    expect(container.textContent).toContain('11/12 ô dùng mức ước tính')
    expect([...container.querySelectorAll('.gvv2-bhn-mau li')].map((x) => x.textContent)).toEqual([
      'Đủ mức', 'Thiếu ít (đạt từ 50% mức)', 'Thiếu nhiều (dưới 50% mức)', 'Không làm câu nào', 'Hôm nay (tính tới lúc tải, chưa cộng vào tổng)',
    ])
    // mỗi em MỘT nút (≥ 48 px theo CSS), nhãn đọc được
    expect(screen.getByRole('button', { name: 'Trần An, SBD 11: thiếu 2 ngày, 63 câu; hôm nay còn thiếu 36 câu — xem hồ sơ làm bài' })).toBeTruthy()
  })

  it('bấm đầu cột một ngày ⇒ em thiếu nhiều câu nhất ngày ấy lên đầu; "Xếp lại theo tổng" trả về thứ tự chung', async () => {
    mayChu()
    const { container } = render(<TheBaiHangNgay />)
    await waitFor(() => expect(tenHang(container)).toHaveLength(4))
    const nut = screen.getByRole('button', { name: /^Hôm nay 14\/10|^Thứ Tư 14\/10 \(hôm nay\)/ })
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-pressed')).toBe('true')
    expect(nut.closest('th')!.getAttribute('aria-sort')).toBe('descending')
    expect(tenHang(container)).toEqual(['Trần An', 'Lê Bình', 'Vũ Phương', 'Phạm Chi'])
    expect(screen.getByText(/Đang xếp em thiếu nhiều câu nhất ngày/).textContent).toContain('Thứ Tư 14/10')
    fireEvent.click(screen.getByRole('button', { name: 'Xếp lại theo tổng' }))
    expect(tenHang(container)).toEqual(['Trần An', 'Vũ Phương', 'Lê Bình', 'Phạm Chi'])
  })

  it('lọc khối / lớp / tìm (không dấu); không khớp ⇒ nói rõ', async () => {
    mayChu()
    const { container } = render(<TheBaiHangNgay />)
    await waitFor(() => expect(tenHang(container)).toHaveLength(4))
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Tất cả4 em', 'Khối 101 em', 'Khối 123 em'])
    fireEvent.click(screen.getByRole('radio', { name: /Khối 12/ }))
    expect(tenHang(container)).toEqual(['Trần An', 'Lê Bình', 'Phạm Chi'])
    const lop = screen.getByRole('combobox', { name: 'Lớp' })
    expect([...lop.querySelectorAll('option')].map((x) => x.textContent)).toEqual(['Mọi lớp', '12 - Chuyên · 1 em', '12 - Tinh Hoa · 2 em'])
    fireEvent.change(lop, { target: { value: '12 - Tinh Hoa' } })
    expect(tenHang(container)).toEqual(['Trần An', 'Lê Bình'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'le binh' } })
    expect(tenHang(container)).toEqual(['Lê Bình'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'không ai' } })
    expect(screen.getByText('Không có em nào khớp bộ lọc ở Khối 12 · lớp 12 - Tinh Hoa.')).toBeTruthy()
  })

  it('lỗi ⇒ câu dễ hiểu + Thử lại; rỗng ⇒ nói vì sao + việc làm tiếp', async () => {
    mayChu({ bang: { ok: false, loai: 'mang', chu: 'TypeError: Failed to fetch' } })
    render(<TheBaiHangNgay />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được bài hằng ngày của các em.')
    expect(loi.textContent).not.toMatch(/TypeError|fetch/)
    mayChu({ bang: { ok: true, du: { ...BANG, em: [], lop: [], soO: 0, soOUocTinh: 0 } } })
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText(/Chưa có em nào nhận bài hằng ngày/)).toBeTruthy()
  })
})

describe('bấm em ⇒ tấm Hồ sơ làm bài (trùng tu)', () => {
  it('gọi đúng hai lệnh; nhãn thái độ + lý do bằng số; năm ô số; lịch; sáu tín hiệu; bốn thẻ con; Esc đóng, focus về nút em', async () => {
    mayChu()
    render(<TheBaiHangNgay />)
    const nut = await screen.findByRole('button', { name: /^Lê Bình, SBD 12/ })
    nut.focus()
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: 'Lê Bình' })
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/ho-so-thai-do').map(([, b]) => b)).toEqual([{ sbd: '12' }])
    expect(m.goi.mock.calls.filter(([d]) => d === '/gv/lich-su-lam-cau').map(([, b]) => b)).toEqual([{ sbd: '12' }])
    const dau = await within(tam).findByRole('region', { name: 'Có dấu hiệu đối phó' })
    expect(dau.getAttribute('data-nhan')).toBe('doi-pho')
    expect(dau.textContent).toContain('Thái độ làm bài · 12/10 – 14/10')
    expect(dau.textContent).toContain('Quá nhanh 16/40 lượt (40%) · nhóm quá nhanh đúng 25%')
    expect(within(tam).getByText('SBD 12 · Lớp 12 - Tinh Hoa')).toBeTruthy()
    // Hôm nay lấy từ lịch hồ sơ (mở từ Bài hằng ngày): 0/24
    expect(tam.querySelector('.gvv2-hs-hn')?.textContent).toContain('Hôm nay0/24 câu')
    expect(tam.querySelector('.gvv2-hs-hn')?.textContent).toContain('Chưa làm câu nào')
    expect([...tam.querySelectorAll('.gvv2-tdo-o')].map((o) => o.textContent)).toEqual([
      'Đã làm40 lượt20 câu khác nhau',
      'Đúng24 lượt62% lượt có kết quả',
      'Sai15 lượt1 lượt bỏ trống',
      'Đã ôn3 câu5 lượt ôn',
      'Giây trung bình21 giâytrung vị 9 giây · 40 lượt có số giây',
    ])
    expect([...tam.querySelectorAll('.gvv2-tdo-ngay')].map((x) => [x.getAttribute('data-muc'), x.querySelector('b')!.textContent])).toEqual([
      ['du', '24/24'], ['thieu-nhieu', '3/24'], ['khong-lam', '0/24'],
    ])
    expect([...tam.querySelectorAll('.gvv2-tdo-cot-so')].map((x) => x.textContent)).toEqual(['83%', '27%', '—'])
    expect(tam.querySelector('.gvv2-tdo-giay-thanh i[data-nhanh="true"]')).toBeTruthy()
    expect([...tam.querySelectorAll('.gvv2-tdo-th-o')].map((x) => [x.getAttribute('data-ma'), x.querySelector('.gvv2-tdo-chip')!.textContent])).toEqual([
      ['ngay-du-muc', 'Chưa đủ dữ liệu'], ['qua-nhanh', 'Vượt ngưỡng'], ['don-bai', 'Trong ngưỡng'], ['goi-y', 'Trong ngưỡng'], ['chon-lap', 'Cần để mắt'], ['xu-huong', 'Chưa đủ dữ liệu'],
    ])
    expect(tam.textContent).toContain('Ngưỡng: Đáng lo khi từ 30%.')
    // bốn thẻ con, mặc định Câu sai
    expect(within(tam).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Câu sai · 1', 'Câu đúng · 2', 'Câu đã ôn · 1', 'Toàn bộ lịch sử · 2'])
    expect(within(tam).getByRole('tab', { name: /Câu sai/ }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(within(tam).getByRole('tab', { name: /Câu đúng/ }))
    const dung = [...tam.querySelectorAll('.gvv2-hs-cau')].map((x) => x.textContent)
    expect(dung[0]).toContain('Câu 7 · Thuỷ phân ester')
    expect(dung[0]).toContain('Đúng sau 2 lần sai')
    expect(dung[1]).toContain('Câu Q8')
    expect(dung[1]).toContain('Đúng ngay lần đầu')
    fireEvent.click(within(tam).getByRole('tab', { name: /Câu đã ôn/ }))
    const on = tam.querySelector('.gvv2-hs-cau')!
    expect(on.textContent).toContain('Chưa sửa được')
    expect(on.textContent).toContain('Vận dụng · ôn 1 lần · làm 2 lần · đúng 0 · sai 2')
    // vẫn giữ Mở hồ sơ đầy đủ
    expect(within(tam).getByRole('button', { name: 'Mở hồ sơ đầy đủ' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Lê Bình, SBD 12/ }))
  })

  it('máy chủ cũ chưa có lệnh hồ sơ thái độ ⇒ một dòng trạng thái (không báo lỗi đỏ) + Tải lại; lịch sử toàn bộ sổ vẫn đủ', async () => {
    mayChu({ thaiDo: { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh Hồ sơ thái độ làm bài — cần đẩy bản máy chủ mới.' } })
    render(<TheBaiHangNgay />)
    fireEvent.click(await screen.findByRole('button', { name: /^Lê Bình, SBD 12/ }))
    const tam = await screen.findByRole('dialog')
    expect((await within(tam).findByText(/Chưa tải được hồ sơ thái độ làm bài của em/)).textContent).toContain('cần đẩy bản máy chủ mới')
    expect(within(tam).queryByRole('alert')).toBeNull()
    expect(await within(tam).findByText('Số lượt làm câu')).toBeTruthy()
    expect(within(tam).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Câu sai · 1', 'Câu đúng ', 'Câu đã ôn ', 'Toàn bộ lịch sử · 2'])
    mayChu()
    fireEvent.click(within(tam).getByRole('button', { name: 'Tải lại hồ sơ thái độ' }))
    expect(await within(tam).findByRole('region', { name: 'Có dấu hiệu đối phó' })).toBeTruthy()
  })
})

// ------------------------------------------------------------------ 12/10C: NHÓM NHỊP HỌC LÀ NHÃN CHÍNH CỦA TẤM (thầy chốt "6 ngày liền làm đủ mới thoát
// nhóm lười"; `/gv/ho-so-thai-do` CHỈ THÊM nhomNhip · coDoiPho · chuoiDuGanNhat — cùng hàm với Hôm nay › Nhịp học). Thiếu trường ⇒ nhãn cũ (test trên).
describe('tấm Hồ sơ làm bài — nhóm Nhịp học + cờ đối phó (12/10C)', () => {
  it('đọc trả lời: giữ ba trường mới đúng kiểu; giá trị lạ ⇒ bỏ trường (lùi về nhãn cũ)', () => {
    expect(docHoSoThaiDo({ ...THAI_DO, nhomNhip: 'luoi', coDoiPho: true, chuoiDuGanNhat: 2 } as never)).toMatchObject({ nhomNhip: 'luoi', coDoiPho: true, chuoiDuGanNhat: 2 })
    const la = docHoSoThaiDo({ ...THAI_DO, nhomNhip: 'gioi', coDoiPho: 'co', chuoiDuGanNhat: 'x' } as never)!
    expect('nhomNhip' in la || 'coDoiPho' in la || 'chuoiDuGanNhat' in la).toBe(false)
  })
  it('Lười + có dấu hiệu đối phó ⇒ nhãn chính "Lười", chip đối phó riêng, "Đủ mức liền 2/6 ngày để thoát"; lý do bằng số giữ nguyên', async () => {
    mayChu({ thaiDo: { ok: true, du: { ...THAI_DO, nhomNhip: 'luoi', coDoiPho: true, chuoiDuGanNhat: 2 } } })
    render(<TheBaiHangNgay />)
    fireEvent.click(await screen.findByRole('button', { name: /^Lê Bình, SBD 12/ }))
    const tam = await screen.findByRole('dialog', { name: 'Lê Bình' })
    const dau = await within(tam).findByRole('region', { name: 'Lười' })
    expect(dau.getAttribute('data-nhan')).toBe('luoi')
    expect(dau.querySelector('.gvv2-tdo-co-doi-pho')!.textContent).toBe('Có dấu hiệu đối phó')
    expect(dau.querySelector('.gvv2-tdo-thoat')!.textContent).toBe('Đủ mức liền 2/6 ngày để thoát')
    expect(dau.textContent).toContain('thoát khi đủ mức 6 ngày liền')
    expect(dau.textContent).toContain('Quá nhanh 16/40 lượt (40%) · nhóm quá nhanh đúng 25%')
  })
  it('Chăm, không đối phó ⇒ nhãn "Chăm", không chip, không dòng thoát', async () => {
    mayChu({ thaiDo: { ok: true, du: { ...THAI_DO, ketLuan: { nhan: 'cham-chi', chu: 'Chăm chỉ', lyDo: ['Ngày đủ mức: Đủ mức 9/11 ngày (82%).'] }, nhomNhip: 'cham', coDoiPho: false, chuoiDuGanNhat: 7 } } })
    render(<TheBaiHangNgay />)
    fireEvent.click(await screen.findByRole('button', { name: /^Lê Bình, SBD 12/ }))
    const tam = await screen.findByRole('dialog', { name: 'Lê Bình' })
    const dau = await within(tam).findByRole('region', { name: 'Chăm' })
    expect(dau.getAttribute('data-nhan')).toBe('cham-chi')
    expect(dau.querySelector('.gvv2-tdo-co-doi-pho')).toBeNull()
    expect(dau.querySelector('.gvv2-tdo-thoat')).toBeNull()
    expect(dau.textContent).toContain('Ngày đủ mức: Đủ mức 9/11 ngày (82%).')
  })
})

// ------------------------------------------------------------------ MỐC 01/10 (thầy 12/10: "dữ liệu phần này tính từ 1/10 cho tôi nhé")
describe('mốc 01/10 — chữ ba app khớp một hằng', () => {
  it('máy chủ thầy + phụ huynh cùng mốc 2026-10-01; lối vào Hôm nay, chữ chờ của thẻ, mốc dự phòng app phụ huynh đọc đúng mốc ấy', async () => {
    expect(NGAY_BAT_DAU_BAI_HANG_NGAY).toBe('2026-10-01')
    expect(MOC_THEO_DOI).toBe(NGAY_BAT_DAU_BAI_HANG_NGAY)
    const moc = ngayNgan(NGAY_BAT_DAU_BAI_HANG_NGAY)
    expect(moc).toBe('01/10')
    // SỬA CÓ CHỦ ĐÍCH 12/10 — thầy duyệt bản vẽ Hôm nay: nút "Xem bài hằng ngày từ 01/10" thay bằng khối Nhịp học (nút "Xem bảng từng ngày" mở bảng
    // này ngay tại Hôm nay). Mốc trên khối đọc từ `tu` máy chủ trả (`/gv/nhip-hoc` dùng cùng hằng mốc) — không còn chữ ngày viết tay để lệch hằng.
    const homNay = readFileSync('src/screens/GvHomNayScreen.tsx', 'utf8')
    const nhip = readFileSync('src/components/hom-nay-thay/NhipHocThay.tsx', 'utf8')
    expect(homNay).not.toContain('aria-label="Xem bài hằng ngày từ')
    expect(nhip).toContain('Từ {ngayNgan(kq.tu)}')
    expect(nhip).toContain("{moBang ? 'Ẩn bảng từng ngày' : 'Xem bảng từng ngày'}")
    expect(homNay + nhip).not.toMatch(/bài hằng ngày từ 12\/10/)
    expect(readFileSync('src/lib/ph-v3/con-tong-quan.ts', 'utf8')).toContain(`|| '${MOC_THEO_DOI}'`)
    // thẻ đang chờ máy chủ ⇒ câu chờ ghi đúng mốc
    m.goi.mockImplementation(() => new Promise(() => {}))
    const { container } = render(<TheBaiHangNgay />)
    expect(container.querySelector('.gvv2-cc-tom')?.textContent).toBe(`Bài hằng ngày từ ${moc}: em thiếu nhiều ngày nhất đứng trước`)
  })

  it('tấm hồ sơ: tiêu đề "Làm bài từ … đến …" theo khoảng máy chủ trả (không còn "Làm bài từ 12/10 – …")', async () => {
    mayChu()
    render(<TheBaiHangNgay />)
    fireEvent.click(await screen.findByRole('button', { name: /^Lê Bình, SBD 12/ }))
    const tam = await screen.findByRole('dialog', { name: 'Lê Bình' })
    expect(await within(tam).findByRole('heading', { name: 'Làm bài từ 12/10 đến 14/10' })).toBeTruthy()
  })
})
