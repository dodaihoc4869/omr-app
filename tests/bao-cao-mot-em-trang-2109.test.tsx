// XEM ĐIỂM BẢN 2 · GV-2 — trang VẼ "Báo cáo một em" của thầy (components/xem-diem-gv/BaoCaoMotEm.tsx). Số đã có test riêng ở bao-cao-mot-em-2109.test.ts.
// Soi ở đây: khối nào không có dữ liệu thì ẨN (không bịa), hạng chỉ ở đây (thầy), ô câu không chỉ dựa vào màu, một nút chính, đóng bằng Esc, không mã nội bộ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import BaoCaoMotEmTrang, { chuNopLuc } from '../src/components/xem-diem-gv/BaoCaoMotEm'
import type { BaoCaoMotEm } from '../src/lib/bao-cao-mot-em'

afterEach(() => cleanup())

const DAY: BaoCaoMotEm = {
  daNop: true,
  tong: 7.5,
  dung: 21,
  tongCau: 28,
  motPhan: 1,
  chuThoiGian: '32 phút 10 giây',
  phan: [
    { ma: 'I', ten: 'Trắc nghiệm', dung: 2, tong: 3, motPhan: 0, diem: 3, toiDa: 4.5, cau: [{ soCau: 1, kq: 'dung' }, { soCau: 2, kq: 'sai' }, { soCau: 3, kq: 'dung' }] },
    { ma: 'II', ten: 'Đúng–sai', dung: 0, tong: 1, motPhan: 1, diem: 1, toiDa: 4, cau: [{ soCau: 1, kq: 'mot_phan' }] },
    { ma: 'III', ten: 'Trả lời ngắn', dung: 0, tong: 1, motPhan: 0, diem: 0, toiDa: 1.5, cau: [{ soCau: 1, kq: 'trong' }] },
  ],
  dang: [
    { ten: 'Xà phòng hoá chất béo', dung: 1, tong: 3, canOn: true },
    { ten: 'Danh pháp ester', dung: 2, tong: 2, canOn: false },
  ],
  cauXemLai: [
    { qid: 'q9', phan: 'I', soCau: 2, dang: 'Bài toán thuỷ phân ester', loai: 'sai', de: 'Thuỷ phân hoàn toàn 8,8 g ethyl acetate', dapAnChon: 'C', dapAnDung: 'B', giay: 108, tbGiayLop: 69, loiGiai: { chot: 'm = 0,1 × 82 = 8,2 g' } },
    { qid: 'q3', phan: 'III', soCau: 1, dang: 'Xà phòng hoá chất béo', loai: 'sai', de: 'Đun nóng 17,8 g tristearin', dapAnChon: '', dapAnDung: '1,8', giay: null, tbGiayLop: null, loiGiai: null },
    { qid: 'q12', phan: 'II', soCau: 1, dang: 'Nhận biết', loai: 'dung_lau', de: 'Trong các chất sau', dapAnChon: 'DDSS', dapAnDung: 'DDSS', giay: 140, tbGiayLop: 69, loiGiai: null },
  ],
  soVoiLop: { tbLop: 6.8, hieu: 0.7, hang: 9, siSo: 40, dangTotHon: ['Danh pháp ester', 'Chỉ số chất béo'] },
  coBangCham: true,
}
const KHONG_BANG_CHAM: BaoCaoMotEm = { ...DAY, dung: 8, tongCau: 12, motPhan: 0, phan: DAY.phan.map((p) => ({ ...p, cau: [] })), dang: [], cauXemLai: [], coBangCham: false }

const props = (o: Partial<Parameters<typeof BaoCaoMotEmTrang>[0]> = {}) => ({
  bc: DAY,
  hoTen: 'Nguyễn Minh Anh',
  sbd: '12121007',
  maCa: 'C1',
  lop: '12 - Tinh Hoa',
  tenCa: 'Ester – lipid',
  thoiGianPhut: 45,
  nopLuc: '2026-09-19T02:12:00Z',
  trangThai: 'da_nop' as const,
  soLanRoiMan: 0,
  tongGiayRoiMan: 0,
  onDong: vi.fn(),
  onToanCanh: vi.fn(),
  onGiaoRieng: vi.fn(),
  ...o,
})
const ve = (o: Partial<Parameters<typeof BaoCaoMotEmTrang>[0]> = {}) => {
  const p = props(o)
  const r = render(<BaoCaoMotEmTrang {...p} />)
  const trang = document.querySelector('.gv2-trang') as HTMLElement
  return { ...r, p, trang, q: within(trang) }
}

describe('GV-2 · khung trang', () => {
  it('là hộp thoại phủ kín có tên em; thanh trên: nút quay lại 48 px + "Báo cáo · tên" + dòng phụ (ca, lớp, SBD, số phút)', () => {
    const { trang, q } = ve()
    expect(trang.getAttribute('role')).toBe('dialog')
    expect(trang.getAttribute('aria-modal')).toBe('true')
    expect(trang.getAttribute('aria-label')).toBe('Báo cáo của Nguyễn Minh Anh')
    expect(q.getByRole('heading', { level: 1 }).textContent).toBe('Báo cáo · Nguyễn Minh Anh')
    expect(trang.textContent).toContain('Ester – lipid · 12 - Tinh Hoa · SBD 12121007 · 45 phút')
    expect(q.getByRole('button', { name: 'Quay lại ca' })).toBeTruthy()
  })

  it('thiếu tên ⇒ dùng "SBD …"; nút quay lại và phím Esc đều đóng; cuộn nền bị khoá khi mở và trả lại khi đóng', () => {
    document.body.style.overflow = 'auto'
    const { p, q, unmount } = ve({ hoTen: '' })
    expect(q.getByRole('heading', { level: 1 }).textContent).toBe('Báo cáo · SBD 12121007')
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(q.getByRole('button', { name: 'Quay lại ca' }))
    expect(p.onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(p.onDong).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(p.onDong).toHaveBeenCalledTimes(2)
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(p.onDong).toHaveBeenCalledTimes(2) // gỡ bộ nghe phím khi đóng
  })

  it('chỉ MỘT nút chính ("Xem toàn cảnh em này") + một nút phụ; bấm gọi đúng hàm', () => {
    const { p, q } = ve()
    const chinh = q.getByRole('button', { name: 'Xem toàn cảnh em này' })
    const phu = q.getByRole('button', { name: 'Giao bài riêng cho em này' })
    expect(chinh.className).toContain('xd-nut--chinh')
    expect(phu.className).toContain('xd-nut--tonal')
    expect(q.getAllByRole('button').filter((b) => b.className.includes('xd-nut--chinh'))).toHaveLength(1)
    fireEvent.click(chinh)
    fireEvent.click(phu)
    expect(p.onToanCanh).toHaveBeenCalledTimes(1)
    expect(p.onGiaoRieng).toHaveBeenCalledTimes(1)
  })
})

describe('GV-2 · kết quả + so với cả lớp', () => {
  it('kết quả: điểm trên 10, "Em ấy làm đúng 21/28 câu", thời gian làm (ca cho 45 phút), giờ nộp 24 giờ theo múi giờ Việt Nam', () => {
    const { trang } = ve()
    expect(trang.textContent).toContain('Em ấy làm đúng 21/28 câu')
    expect(trang.textContent).toContain('Thời gian làm 32 phút 10 giây (ca cho 45 phút)')
    expect(trang.textContent).toContain('Nộp lúc 09:12 · Thứ Bảy 19/09/2026')
    expect(trang.querySelector('.xd-vong')!.getAttribute('aria-label')).toBe('Điểm 7,5 trên 10')
  })

  it('thiếu số câu / thời gian / giờ nộp ⇒ bỏ đúng dòng đó, không in "0" hay "null"', () => {
    const { trang } = ve({ bc: { ...DAY, dung: null, tongCau: null, chuThoiGian: null }, nopLuc: '' })
    expect(trang.textContent).not.toMatch(/Em ấy làm đúng|Thời gian làm|Nộp lúc|null|NaN|undefined/)
    expect(trang.querySelector('.xd-vong')).toBeTruthy()
    expect(trang.querySelectorAll('.xd-kq__dong, .xd-kq__phu')).toHaveLength(0) // không để lại dòng trống
  })

  it('so với cả lớp: nhãn "Chỉ thầy thấy mục này", điểm em ấy, trung bình lớp, +0,7 cao hơn (mũi tên + dấu + chữ), hạng, dạng làm tốt hơn', () => {
    const { q, trang } = ve()
    const muc = trang.querySelector('#gv2-lop') as HTMLElement
    expect(within(muc).getByText('Chỉ thầy thấy mục này')).toBeTruthy()
    expect(within(muc).getByText('Điểm của em ấy').nextSibling?.textContent).toBe('7,5')
    expect(within(muc).getByText('Trung bình cả lớp').nextSibling?.textContent).toBe('6,8')
    expect(muc.textContent).toContain('+0,7 cao hơn trung bình lớp')
    expect(muc.textContent).toContain('Đứng thứ 9 trong 40 em đã nộp.')
    expect(muc.textContent).toContain('2 dạng em ấy làm tốt hơn cả lớp: Danh pháp ester, Chỉ số chất béo.')
    expect(q.getByRole('link', { name: 'So với lớp' })).toBeTruthy()
  })

  it('thấp hơn ⇒ dấu − và "thấp hơn trung bình lớp"; bằng ⇒ "bằng trung bình lớp"; một dạng ⇒ "Dạng em ấy…"; không dạng ⇒ không nhắc dạng', () => {
    const thap = ve({ bc: { ...DAY, soVoiLop: { ...DAY.soVoiLop!, hieu: -1.25, dangTotHon: ['Este'] } } })
    expect(thap.trang.querySelector('#gv2-lop')!.textContent).toContain('−1,25 thấp hơn trung bình lớp')
    expect(thap.trang.querySelector('#gv2-lop')!.textContent).toContain('Dạng em ấy làm tốt hơn cả lớp: Este.')
    cleanup()
    const bang = ve({ bc: { ...DAY, soVoiLop: { ...DAY.soVoiLop!, hieu: 0, dangTotHon: [] } } })
    expect(bang.trang.querySelector('#gv2-lop')!.textContent).toContain('bằng trung bình lớp')
    expect(bang.trang.querySelector('#gv2-lop')!.textContent).not.toContain('làm tốt hơn cả lớp')
  })

  it('không có dữ liệu so sánh ⇒ ẨN cả mục (và mục lục không có "So với lớp")', () => {
    const { trang, q } = ve({ bc: { ...DAY, soVoiLop: null } })
    expect(trang.querySelector('#gv2-lop')).toBeNull()
    expect(q.queryByRole('link', { name: 'So với lớp' })).toBeNull()
  })

  it('hạng KHÔNG xuất hiện ở đâu khác ngoài mục "So với cả lớp"', () => {
    const { trang } = ve()
    const ngoai = (trang.textContent || '').replace((trang.querySelector('#gv2-lop') as HTMLElement).textContent || '', '')
    expect(ngoai).not.toMatch(/Đứng thứ|hạng/i)
  })
})

describe('GV-2 · ba phần + ô từng câu', () => {
  it('mỗi phần có điểm/trần điểm, thanh, "đúng x/y câu"; Phần II nói đúng trọn + đúng một phần', () => {
    const { trang } = ve()
    const muc = trang.querySelector('#gv2-ba-phan') as HTMLElement
    expect(muc.textContent).toContain('Phần I · Trắc nghiệm')
    expect(muc.textContent).toContain('đúng 2/3 câu')
    expect(muc.textContent).toContain('đúng trọn 0/1 câu, 1 câu đúng một phần')
    expect(muc.textContent).toContain('/4,5 điểm')
  })

  it('có bảng chấm: mỗi phần mở ra được, ô câu có tên "Câu n: đúng/sai/đúng một phần/bỏ trống", KHÔNG chỉ dựa vào màu (có biểu tượng), có chú giải', () => {
    const { trang } = ve()
    const phan1 = trang.querySelectorAll('.gv2-phan')[0] as HTMLDetailsElement
    expect(phan1.open).toBe(false)
    fireEvent.click(phan1.querySelector('summary') as HTMLElement)
    const o = Array.from(phan1.querySelectorAll('li.xd-o')).map((li) => [li.getAttribute('aria-label'), li.className.includes('xd-o--dung'), li.className.includes('xd-o--sai'), !!li.querySelector('svg')])
    expect(o).toEqual([['Câu 1: đúng', true, false, true], ['Câu 2: sai', false, true, true], ['Câu 3: đúng', true, false, true]])
    const phan2 = trang.querySelectorAll('.gv2-phan')[1]
    expect(phan2.querySelector('li.xd-o--mot-phan')!.getAttribute('aria-label')).toBe('Câu 1: đúng một phần')
    expect(phan2.querySelector('li.xd-o--mot-phan svg')).toBeTruthy() // đúng một phần cũng có biểu tượng riêng, không chỉ màu
    const phan3 = trang.querySelectorAll('.gv2-phan')[2]
    expect(phan3.querySelector('li.xd-o')!.getAttribute('aria-label')).toBe('Câu 1: bỏ trống')
    expect(trang.querySelector('.xd-chu-giai')!.textContent).toContain('Phần II đúng một phần')
    expect(trang.textContent).toContain('Chạm một phần để xem từng câu')
  })

  it('không có bảng chấm: ba phần chỉ có thanh (không mở ra), không hứa "chạm để xem", và nói thật vì sao thiếu câu', () => {
    const { trang } = ve({ bc: KHONG_BANG_CHAM })
    expect(trang.querySelectorAll('.gv2-phan')).toHaveLength(0)
    expect(trang.textContent).not.toContain('Chạm một phần')
    expect(trang.querySelector('.xd-chu-giai')).toBeNull()
    expect(trang.textContent).toContain('Chưa xem được từng câu: máy này chưa có đáp án của ca nên không dựng lại được bảng chấm của em ấy.')
    expect(trang.textContent).toContain('đúng 2/3 câu') // vẫn có số thật từ bảng điểm
    expect(trang.querySelector('#gv2-dang')).toBeNull()
    expect(trang.querySelector('#gv2-cau')).toBeNull()
  })

  it('không có phần nào (chưa có bảng điểm) ⇒ ẨN mục Ba phần', () => {
    const { trang, q } = ve({ bc: { ...DAY, phan: [], coBangCham: false, dang: [], cauXemLai: [] } })
    expect(trang.querySelector('#gv2-ba-phan')).toBeNull()
    expect(q.queryByRole('link', { name: 'Ba phần' })).toBeNull()
    expect(q.queryByRole('link', { name: 'Theo dạng bài' })).toBeNull()
  })
})

describe('GV-2 · theo dạng bài', () => {
  it('mỗi dạng: tên, "Trong ca này đúng a/b câu", nhãn "Cần ôn thêm" chỉ ở dạng vấp; không mã dạng, không bậc bịa', () => {
    const { trang } = ve()
    const muc = trang.querySelector('#gv2-dang') as HTMLElement
    const vap = within(muc).getByText('Xà phòng hoá chất béo').closest('.xd-dang') as HTMLElement
    expect(vap.className).toContain('xd-dang--vap')
    expect(vap.textContent).toContain('Trong ca này đúng 1/3 câu')
    expect(within(vap).getByText('Cần ôn thêm')).toBeTruthy()
    const on = within(muc).getByText('Danh pháp ester').closest('.xd-dang') as HTMLElement
    expect(on.className).not.toContain('xd-dang--vap')
    expect(within(on).queryByText('Cần ôn thêm')).toBeNull()
    expect(muc.textContent).not.toMatch(/Biết|Hiểu|Vận dụng|bậc/)
  })
})

describe('GV-2 · câu cần xem lại', () => {
  it('thẻ câu: số câu + phần + dạng, chip Sai / Bỏ trống / Đúng nhưng làm lâu, đề, "Em ấy chọn" + "Đáp án"; giây làm + trung bình lớp', () => {
    const { trang } = ve()
    const the = Array.from(trang.querySelectorAll('.xd-cau')) as HTMLElement[]
    expect(the).toHaveLength(3)
    expect(the[0].textContent).toContain('Câu 2 · Phần I · Trắc nghiệm')
    expect(the[0].textContent).toContain('Bài toán thuỷ phân ester')
    expect(within(the[0]).getByText('Sai')).toBeTruthy()
    expect(the[0].textContent).toContain('Thuỷ phân hoàn toàn 8,8 g ethyl acetate')
    expect(the[0].textContent).toMatch(/Em ấy chọnC/)
    expect(the[0].textContent).toMatch(/Đáp ánB/)
    expect(the[0].textContent).toContain('Làm 1 phút 48 giây')
    expect(the[0].textContent).toContain('Trung bình cả lớp 1 phút 09 giây')
    // bỏ trống: không có "Em ấy chọn", có "bỏ trống"
    expect(within(the[1]).getByText('Bỏ trống')).toBeTruthy()
    expect(the[1].textContent).toContain('bỏ trống')
    expect(the[1].textContent).not.toContain('Em ấy chọn')
    expect(the[1].textContent).not.toContain('Làm ') // không có số giây ⇒ không dòng thời gian
    // đúng nhưng làm lâu: không có dòng "Đáp án" (em ấy đã đúng); Phần II đọc thành a Đ · b Đ …
    expect(within(the[2]).getByText('Đúng nhưng làm lâu')).toBeTruthy()
    expect(the[2].textContent).not.toMatch(/Đáp án/)
    expect(the[2].textContent).toContain('a Đ · b Đ · c S · d S')
  })

  it('lời giải: chỉ có nút "Xem lời giải" ở câu kho CÓ lời giải; câu thiếu thì không có nút và đầu mục nói số câu chưa có', () => {
    const { trang } = ve()
    expect(trang.querySelectorAll('details.xd-giai')).toHaveLength(1)
    const muc = trang.querySelector('#gv2-cau') as HTMLElement
    expect(muc.textContent).toContain('2 câu chưa có lời giải trong kho nên không có mục "Xem lời giải".')
    expect(muc.textContent).toContain('m = 0,1 × 82 = 8,2 g')
  })

  it('câu không có đề (máy chưa có kho) không bị tính là "thiếu lời giải" và không có nút lời giải', () => {
    const cau0 = DAY.cauXemLai[0]
    const { trang } = ve({ bc: { ...DAY, cauXemLai: [{ ...cau0, de: null, loiGiai: null }] } })
    expect(trang.querySelector('details.xd-giai')).toBeNull()
    expect(trang.textContent).not.toContain('chưa có lời giải trong kho')
    expect(trang.querySelector('.xd-cau__de')).toBeNull()
  })

  it('có số giây của em nhưng lớp chưa đủ số để lấy trung bình ⇒ chỉ nói giây của em, không in "trung bình" trống', () => {
    const c = DAY.cauXemLai[0]
    const { trang } = ve({ bc: { ...DAY, cauXemLai: [{ ...c, tbGiayLop: null }] } })
    expect(trang.textContent).toContain('Làm 1 phút 48 giây')
    expect(trang.textContent).not.toContain('Trung bình cả lớp 1')
    expect(trang.querySelector('.xd-cau__meta')!.querySelectorAll('span')).toHaveLength(1)
  })

  it('không câu nào cần xem lại ⇒ ẨN mục', () => {
    const { trang, q } = ve({ bc: { ...DAY, cauXemLai: [] } })
    expect(trang.querySelector('#gv2-cau')).toBeNull()
    expect(q.queryByRole('link', { name: 'Câu cần xem lại' })).toBeNull()
  })

  it('không lộ mã nội bộ (qid) và không emoji', () => {
    const { trang } = ve()
    expect(trang.textContent).not.toMatch(/\bq9\b|\bq3\b|\bq12\b/)
    expect(trang.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})

describe('GV-2 · em chưa có báo cáo', () => {
  it('đang làm ⇒ "Chưa có báo cáo" + câu nói rõ; còn nút quay lại và hai nút việc tiếp; không mục lục, không điểm', () => {
    const { trang, q } = ve({ bc: { ...DAY, daNop: false, tong: null }, trangThai: 'dang_lam' })
    expect(q.getByText('Chưa có báo cáo')).toBeTruthy()
    expect(trang.textContent).toContain('Em ấy đang làm bài — báo cáo sẽ có sau khi em ấy nộp.')
    expect(trang.querySelector('.xd-muc-luc')).toBeNull()
    expect(trang.querySelector('.xd-vong')).toBeNull()
    expect(q.getByRole('button', { name: 'Xem toàn cảnh em này' })).toBeTruthy()
  })

  it('chờ thi lại / bị khoá chưa điểm: câu riêng; có số lần rời màn thì nêu số + thời gian', () => {
    const a = ve({ bc: { ...DAY, daNop: false, tong: null }, trangThai: 'duoc_duyet_lai' })
    expect(a.trang.textContent).toContain('Em ấy đang chờ thi lại — chưa có bài nộp để báo cáo.')
    cleanup()
    const b = ve({ bc: { ...DAY, daNop: false, tong: null }, trangThai: 'khoa', soLanRoiMan: 4, tongGiayRoiMan: 130 })
    expect(b.trang.textContent).toContain('Bài của em ấy chưa có điểm — chưa có gì để báo cáo.')
    expect(b.trang.textContent).toContain('Rời màn làm bài 4 lần, tổng 2 phút 10 giây.')
    cleanup()
    const c = ve({ bc: { ...DAY, daNop: false, tong: null }, trangThai: 'dang_lam', soLanRoiMan: 0 })
    expect(c.trang.textContent).not.toContain('Rời màn')
  })
})

describe('GV-2 · Tiến bộ qua các ca (lịch sử ca sẵn có; tải lười; lỗi ⇒ ẩn khối, không chặn trang)', () => {
  const LICH_SU = [
    { maCa: 'C0', tenCa: 'Ca trước', nopLuc: '2026-09-10T02:00:00Z', tong: 6, lanThu: 1 },
    { maCa: 'C1', tenCa: 'Ester – lipid', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5, lanThu: 1 },
  ]
  const co = (ds: unknown[] | null) => vi.fn(() => Promise.resolve(ds as never))

  it('có lịch sử ⇒ khối "Tiến bộ qua các ca" (nhãn "Chỉ so với chính em ấy") dựng bằng thẻ TheTienBo dùng chung, và mục lục có "Tiến bộ"', async () => {
    const lay = co(LICH_SU)
    const { trang, q } = ve({ layLichSu: lay })
    await waitFor(() => expect(trang.querySelector('#gv2-tien-bo')).toBeTruthy())
    const muc = trang.querySelector('#gv2-tien-bo') as HTMLElement
    expect(within(muc).getByRole('heading', { name: 'Tiến bộ qua các ca' })).toBeTruthy()
    expect(muc.textContent).toContain('Chỉ so với chính em ấy')
    expect(muc.querySelector('.animate-google-fade')).toBeTruthy() // thẻ chung TheTienBo (một bản cho mọi báo cáo)
    expect(q.getByRole('link', { name: 'Tiến bộ' })).toBeTruthy()
    expect(lay).toHaveBeenCalledTimes(1)
  })

  it('đang tải ⇒ dòng chờ có vai trò status, CHƯA có mục trong mục lục; tải xong ⇒ dòng chờ biến mất', async () => {
    let xong!: (v: unknown[]) => void
    const lay = vi.fn(() => new Promise<never>((r) => (xong = r as never)))
    const { trang, q } = ve({ layLichSu: lay })
    await waitFor(() => expect(q.getByText('Đang lấy điểm các ca trước của em ấy…')).toBeTruthy())
    expect(q.getByText('Đang lấy điểm các ca trước của em ấy…').getAttribute('role')).toBe('status')
    expect(q.queryByRole('link', { name: 'Tiến bộ' })).toBeNull()
    await act(async () => xong(LICH_SU))
    await waitFor(() => expect(trang.querySelector('#gv2-tien-bo')).toBeTruthy())
    expect(q.queryByText('Đang lấy điểm các ca trước của em ấy…')).toBeNull()
  })

  it('lỗi mạng hoặc máy chủ không trả ⇒ ẨN khối (không thông báo lỗi chặn trang, không mục lục), phần còn lại của trang vẫn đủ', async () => {
    const hong = vi.fn(() => Promise.reject(new Error('mạng')))
    const a = ve({ layLichSu: hong })
    await waitFor(() => expect(hong).toHaveBeenCalled())
    await waitFor(() => expect(a.q.queryByText('Đang lấy điểm các ca trước của em ấy…')).toBeNull())
    expect(a.trang.querySelector('#gv2-tien-bo')).toBeNull()
    expect(a.q.queryByRole('link', { name: 'Tiến bộ' })).toBeNull()
    expect(a.trang.querySelector('#gv2-ket-qua')).toBeTruthy()
    expect(a.trang.querySelector('#gv2-cau')).toBeTruthy()
    cleanup()
    const trong = co(null)
    const b = ve({ layLichSu: trong })
    await waitFor(() => expect(trong).toHaveBeenCalled())
    await waitFor(() => expect(b.q.queryByText('Đang lấy điểm các ca trước của em ấy…')).toBeNull())
    expect(b.trang.querySelector('#gv2-tien-bo')).toBeNull()
  })

  it('không đưa hàm lấy lịch sử, hoặc em chưa nộp ⇒ KHÔNG tải gì và không có khối', async () => {
    const a = ve()
    expect(a.trang.querySelector('#gv2-tien-bo')).toBeNull()
    cleanup()
    const lay = co(LICH_SU)
    const b = ve({ bc: { ...DAY, daNop: false, tong: null }, trangThai: 'dang_lam', layLichSu: lay })
    await new Promise((r) => setTimeout(r, 30))
    expect(lay).not.toHaveBeenCalled()
    expect(b.trang.querySelector('#gv2-tien-bo')).toBeNull()
  })

  it('đổi sang em khác khi lượt tải của em trước CHƯA về ⇒ tải lại cho em mới, và kết quả muộn của em trước KHÔNG đè lên', async () => {
    const cho: Array<(v: unknown[]) => void> = []
    const lay = vi.fn(() => new Promise<never>((r) => cho.push(r as never)))
    const a = ve({ layLichSu: lay, sbd: 'A' })
    await waitFor(() => expect(lay).toHaveBeenCalledTimes(1))
    a.rerender(<BaoCaoMotEmTrang {...props({ layLichSu: lay, sbd: 'B' })} />)
    await waitFor(() => expect(lay).toHaveBeenCalledTimes(2)) // đổi em ⇒ tải lại
    await act(async () => cho[0](LICH_SU)) // kết quả MUỘN của em A
    expect(document.querySelector('#gv2-tien-bo')).toBeNull()
    expect(screen.getByText('Đang lấy điểm các ca trước của em ấy…')).toBeTruthy() // vẫn đang chờ em B
    await act(async () => cho[1](LICH_SU))
    await waitFor(() => expect(document.querySelector('#gv2-tien-bo')).toBeTruthy())
  })

  it('điểm ca ĐANG XEM luôn có mặt trong biểu đồ dù lịch sử máy chủ chưa kịp có ca này', async () => {
    const lay = co([{ maCa: 'C0', tenCa: 'Ca trước', nopLuc: '2026-09-10T02:00:00Z', tong: 6, lanThu: 1 }]) // không có C1
    const { trang } = ve({ layLichSu: lay })
    await waitFor(() => expect(trang.querySelector('#gv2-tien-bo')).toBeTruthy())
    expect(trang.querySelector('#gv2-tien-bo')!.textContent).toContain('7,5')
  })

  it('kết quả về SAU khi thầy đã đóng trang (gỡ) thì không cập nhật gì (không lỗi)', async () => {
    let xong!: (v: unknown[]) => void
    const lay = vi.fn(() => new Promise<never>((r) => (xong = r as never)))
    const a = ve({ layLichSu: lay })
    await waitFor(() => expect(lay).toHaveBeenCalled())
    a.unmount()
    await act(async () => xong(LICH_SU))
    expect(document.querySelector('#gv2-tien-bo')).toBeNull()
  })
})

describe('GV-2 · mục lục', () => {
  it('chỉ liệt kê mục CÓ mặt; bấm mục không đổi địa chỉ trang (chặn mặc định) mà cuộn tới mục', () => {
    const { trang, q } = ve()
    const cuon = vi.fn()
    ;(trang.querySelector('#gv2-dang') as HTMLElement).scrollIntoView = cuon
    const mucLuc = within(trang.querySelector('.xd-muc-luc') as HTMLElement)
    expect(mucLuc.getAllByRole('link').map((a) => a.textContent)).toEqual(['Kết quả', 'So với lớp', 'Ba phần', 'Theo dạng bài', 'Câu cần xem lại'])
    const rong = fireEvent.click(q.getByRole('link', { name: 'Theo dạng bài' }))
    expect(rong).toBe(false) // preventDefault đã gọi
    expect(cuon).toHaveBeenCalledTimes(1)
  })
})

describe('GV-2 · chuNopLuc', () => {
  it('giờ 24, múi giờ Việt Nam, thứ viết hoa chữ đầu; mốc hỏng ⇒ null', () => {
    expect(chuNopLuc('2026-09-19T02:12:00Z')).toBe('Nộp lúc 09:12 · Thứ Bảy 19/09/2026')
    expect(chuNopLuc(Date.parse('2026-09-19T16:30:00Z'))).toBe('Nộp lúc 23:30 · Thứ Bảy 19/09/2026')
    expect(chuNopLuc('2026-09-19T20:05:00Z')).toBe('Nộp lúc 03:05 · Chủ Nhật 20/09/2026') // qua nửa đêm giờ Việt Nam
    expect(chuNopLuc('')).toBeNull()
    expect(chuNopLuc('không phải giờ')).toBeNull()
    expect(chuNopLuc(undefined)).toBeNull()
  })
})
