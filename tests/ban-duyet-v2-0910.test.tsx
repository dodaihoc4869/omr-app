// BẢN DUYỆT V2 (thầy 09/10/2026) — khoá hành vi các màn mới: Hôm nay V2 (00/01), Thần thú (06), trận (08/09: nhãn môn), Hành trình thầy (14), Ma trận đề (18).
// Số trên màn phải là số máy chủ gửi (không số minh hoạ); lỗi màn V2 ⇒ rơi về Sảnh cũ.
// SỬA CÓ CHỦ Ý (bản vẽ tối giản thầy chốt 09/10, canvas-v3 HS-HomNay/HS-HanhTrinh/HS-ThanThu/HS-CauDaLam/BoGop):
//   · Hôm nay: bỏ bước "Thử thách +1 bậc", bỏ thẻ Rương có thanh riêng (rương thành bước 3), bỏ "Đang mạnh lên", Túi đồ/Cửa hàng/Đăng xuất,
//     Ca gần nhất, Tu luyện, Bi-a; ca đang mở ⇒ CHỈ một dải "Vào thi" (trước có 2 nút cùng mở vào thi); Thần thú một lối vào (thanh dưới).
//   · Hành trình: tầng của từng bài (`hanhTrinh.bai`, đọc phòng thủ) + "Luyện thêm" (Thử sức thêm bật lại, Vé, Đề thử, Tu luyện, Bi-a).
//   · Thần thú: nút vàng "Cửa hàng" cạnh "Túi đồ" + hàng chữ "Đăng xuất". Câu đã làm: thẻ "Ca kiểm tra gần nhất" ở đầu màn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import SanhV2, { baBuoc, dongAnhHung, khoiTuLop, soCauHomNay, tenGoi, trangThaiTang } from '../src/components/ban-duyet-v2/SanhV2'
import { docBaiHanhTrinh, docSanh, type KetQuaSanh, type SanhHoa2 } from '../src/components/hoa2/api'
import { monCau } from '../src/game/than-thu-v2/dao2/TrongAi'
import ThanThuV2, { docVang } from '../src/game/than-thu-v2/dao/ThanThuV2'
import CauDaLam from '../src/components/hoa2/CauDaLam'
import { chiSoNhip, chuongCuaKhoi, khoiCuaHanhTrinh } from '../src/components/chien-dich/HanhTrinhV2'
import { CHUA_GAN_CHUYEN_DE, dungMaTranDe } from '../src/lib/ma-tran-de'
import type { TeacherExamSource } from '../src/data/examContent'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

const SANH = {
  ok: true, cheDo2: true, ngay: '2026-10-09',
  hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 },
  chienDich: null, theLuc: { con: 18, tong: 30 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: true, loiKhoaDao: 'Gỡ xong lỗi cũ để mở cầu.',
  ruong: { daLam: 12, tong: 30, moDuoc: false, daMo: false, qua: null }, bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 12,
}
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 5, b: 8 }, conDangDe8: 2, sEm: 0.06, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: true, soCau: 14, phut: 25 } }
const BAI = [
  { khoa: 'b1', ten: 'Bài 1 · Ester', tangMo: 2, vung: { a: 5, b: 8 } },
  { khoa: 'b2', ten: 'Bài 2 · Lipid', tangMo: 1, vung: null },
]
const sanh = (o: Record<string, unknown> = {}) => (docSanh({ ...SANH, ...o }) as Extract<KetQuaSanh, { sanh: SanhHoa2 }>).sanh

function ve(o: Record<string, unknown> = {}, them: Record<string, unknown> = {}) {
  const props = {
    tenEm: 'Nguyễn Minh Anh', lop: '12A1', ketQua: docSanh({ ...SANH, ...o }) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 5, cap: 7, ten: 'Linh Hồ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 12, caDangMo: false, now: Date.now(), token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(), onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai: vi.fn(),
    onTuLuyen: vi.fn(), onChoiBia: vi.fn(), caGanNhat: { chu: 'Ca kiểm tra gần nhất: 8,0 điểm · 03/10', coDiem: true }, onLichSuCa: vi.fn(),
    ...them,
  }
  const kq = render(<SanhV2 {...(props as never)} />)
  return { ...props, container: kq.container }
}

describe('Hôm nay V2 · hàm thuần', () => {
  it('tên gọi + khối từ lớp', () => {
    expect(tenGoi('Nguyễn Minh Anh')).toBe('Minh Anh')
    expect(tenGoi('An Bình')).toBe('An Bình')
    expect(tenGoi('  ')).toBe('')
    expect(khoiTuLop('12A1')).toBe(12)
    expect(khoiTuLop('11 - Tinh Hoa')).toBe(11)
    expect(khoiTuLop('Lớp 10B')).toBe(10)
    expect(khoiTuLop('9A')).toBeNull()
    expect(khoiTuLop('112')).toBeNull()
  })
  it('số câu hôm nay: Hành trình ⇒ đã làm/tối thiểu; chiến dịch ⇒ thể lực đã dùng/tổng', () => {
    expect(soCauHomNay(sanh())).toEqual({ da: 12, tong: 30 })
    expect(soCauHomNay(sanh({ hanhTrinh: undefined, theLuc: { con: 26, tong: 40 } }))).toEqual({ da: 14, tong: 40 })
  })
  it('khối anh hùng: "Hoá {khối} · tầng …" + số lớn + chặng — đúng số máy chủ', () => {
    expect(dongAnhHung(sanh(), 12)).toEqual({ nhan: 'Hoá 12 · tầng Hiểu', da: 12, tong: 30, chang: 'Chặng 3/5 · còn 6 câu trong chặng', thieu: null })
    expect(dongAnhHung(sanh(), null).nhan).toBe('Hoá · tầng Hiểu')
    expect(dongAnhHung(sanh({ hanhTrinh: { ...SANH.hanhTrinh, daLam: 30 } }), 12).chang).toBe('Đã đủ mức tối thiểu hôm nay')
    expect(dongAnhHung(sanh({ hanhTrinh: { ...SANH.hanhTrinh, conThieu: 6 } }), 12).thieu).toBe('Còn thiếu 6 câu phù hợp cho kế hoạch hôm nay.')
    const cd = { id: 'cd1', ten: 'Ester', hanNop: '2026-10-20', D: 5, tong: 100, coXat: 10, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: null }
    expect(dongAnhHung(sanh({ hanhTrinh: undefined, chienDich: cd, theLuc: { con: 26, tong: 40 } }), 11)).toMatchObject({ nhan: 'Hoá 11 · Chiến dịch Ester', da: 14, tong: 40, chang: null })
  })
  it('ba bước (bản vẽ tối giản 09/10): Gỡ lỗi cũ → câu mới → Mở rương; KHÔNG còn "Thử thách +1 bậc"', () => {
    const [b1, b2, b3] = baBuoc(sanh())
    expect(b1).toMatchObject({ nhan: 'Gỡ 2 lỗi cũ', phu: 'Câu từng sai, đến lịch ôn lại · Đoàn Hộ Tống', tt: 'dang', chip: 'Làm ngay' })
    expect(b2).toMatchObject({ nhan: '16 câu mới', phu: 'Mở sau bước 1 · Bát Linh Đảo', them: 'Gỡ xong lỗi cũ để mở cầu.', tt: 'khoa', chip: 'Chờ' })
    expect(b3).toMatchObject({ nhan: 'Mở rương hôm nay', phu: 'Khi đủ 30 câu · vàng để dùng ở Cửa hàng', tt: 'cho', chip: 'Còn 18 câu' })
    const moDuoc = baBuoc(sanh({ theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: false }, thuSucThem: { duoc: true, soCau: 6 } }))
    expect(moDuoc.map((b) => b.chip)).toEqual(['Xong', 'Xong', 'Mở được'])
    const daMo = baBuoc(sanh({ theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: true } }))
    expect(daMo[2]).toMatchObject({ tt: 'xong', chip: 'Đã mở' })
    expect(JSON.stringify([...moDuoc, ...daMo])).not.toMatch(/Thử thách/)
    // hết lỗi cũ, Đảo không khoá ⇒ bước 2 là việc làm ngay
    expect(baBuoc(sanh({ doan: { con: 0 }, khoaDao: false }))[1]).toMatchObject({ nhan: '16 câu mới', tt: 'dang', chip: 'Làm ngay' })
  })
  it('hanhTrinh.bai đọc phòng thủ: sai kiểu bỏ qua, vung sai kiểu chỉ bỏ vung; vắng ⇒ không có trường', () => {
    expect(docBaiHanhTrinh(undefined)).toBeNull()
    expect(docBaiHanhTrinh('x')).toBeNull()
    expect(docBaiHanhTrinh([])).toBeNull()
    expect(docBaiHanhTrinh([{ khoa: 'b1', ten: 'Bài 1', tangMo: 5 }, { khoa: '', ten: 'x', tangMo: 1 }, null, { khoa: 'b2', ten: 'Bài 2', tangMo: '2' }])).toBeNull()
    expect(docBaiHanhTrinh([{ khoa: 'b1', ten: ' Bài 1 ', tangMo: 3, vung: { a: 9, b: 6 } }, { khoa: 'b2', ten: 'Bài 2', tangMo: 1, vung: { a: 'x', b: 4 } }])).toEqual([
      { khoa: 'b1', ten: 'Bài 1', tangMo: 3, vung: { a: 6, b: 6 } },
      { khoa: 'b2', ten: 'Bài 2', tangMo: 1 },
    ])
    expect(sanh().hanhTrinh!.bai).toBeUndefined()
    expect(sanh({ hanhTrinh: { ...SANH.hanhTrinh, bai: BAI } }).hanhTrinh!.bai).toEqual([
      { khoa: 'b1', ten: 'Bài 1 · Ester', tangMo: 2, vung: { a: 5, b: 8 } },
      { khoa: 'b2', ten: 'Bài 2 · Lipid', tangMo: 1 },
    ])
    expect([1, 2, 3, 4].map((t) => trangThaiTang(t, 2))).toEqual(['vung', 'dang', 'khoa', 'khoa'])
  })
})

describe('Hôm nay V2 · màn thật', () => {
  it('đầu màn + 3 bước + MỘT nút vàng gỡ lỗi cũ; Đảo khoá chỉ nói ở bước 2 kèm lời máy chủ; thanh dưới 4 mục', () => {
    const p = ve()
    expect(screen.getByRole('heading', { level: 1, name: 'Chào Minh Anh' })).toBeTruthy()
    expect(screen.getByText('Chuỗi 12 ngày')).toBeTruthy()
    expect(screen.getByText('Hoá 12 · tầng Hiểu')).toBeTruthy()
    expect(p.container.querySelector('.v2s-so-lon')!.textContent).toBe('Hôm nay em đã làm 12/30 câu')
    expect(screen.getByText('Chặng 3/5 · còn 6 câu trong chặng')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Thần thú của em: Linh Hồ' })).toBeTruthy()
    const buoc = within(screen.getByRole('region', { name: 'Ba bước hôm nay' })).getAllByRole('listitem')
    expect(buoc.map((b) => b.querySelector('b')!.textContent)).toEqual(['Bước 1: Gỡ 2 lỗi cũ', 'Bước 2: 16 câu mới', 'Bước 3: Mở rương hôm nay'])
    expect(screen.getByText('Gỡ xong lỗi cũ để mở cầu.')).toBeTruthy()
    expect(screen.getByText('Còn 18 câu')).toBeTruthy()
    expect(p.container.querySelectorAll('.v2-nut-chinh').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu · gỡ 2 lỗi cũ' }))
    expect(p.onPhaPhucKich).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /Khám phá Bát Linh Đảo/ })).toBeNull()
    // không thanh rương riêng, không "Thử thách +1 bậc", không số minh hoạ
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/Thử thách/)).toBeNull()
    expect(screen.queryByText(/phút/)).toBeNull()
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect([...nav.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Hôm nay', 'Hành trình', 'Thần thú', 'Câu đã làm'])
    fireEvent.click(screen.getByRole('button', { name: 'Thần thú' }))
    expect(p.onMoThanThu).toHaveBeenCalledTimes(1)
  })
  it('đã chuyển khỏi Hôm nay: Túi đồ, Cửa hàng, Đăng xuất, Ca gần nhất, Tu luyện, Bi-a, Đang mạnh lên; Thần thú chỉ MỘT lối vào', () => {
    const p = ve({ omni: OMNI, bia: { bat: true, con: 4, tong: 6, giaoHuu: { mo: false, con: 0 }, lyDoKhoa: null } })
    for (const ten of [/Túi đồ/, /Cửa hàng/, /Đăng xuất/, /Ca kiểm tra gần nhất/, /Tu luyện/, /Bi-a/, /Vé thử thách/, /Đề thử/]) expect(screen.queryByRole('button', { name: ten })).toBeNull()
    expect(screen.queryByText('Đang mạnh lên')).toBeNull()
    // lối vào Thần thú duy nhất là mục "Thần thú" của thanh dưới (ảnh đại diện + ảnh lớn không còn là nút)
    expect(screen.queryAllByRole('button', { name: /Linh Hồ|thần thú/i }).map((b) => !!b.closest('nav'))).toEqual([true])
    expect(p.container.querySelectorAll('.v2-nut-chinh').length).toBe(1)
  })
  it('hết lỗi cũ, Đảo không khoá ⇒ nút vàng mở Đảo; còn lỗi cũ mà Đảo không khoá ⇒ thêm nút phụ vào Đảo', () => {
    const a = ve({ doan: { con: 0 }, khoaDao: false })
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu · 16 câu mới' }))
    expect(a.onKhamPhaDao).toHaveBeenCalledTimes(1)
    cleanup()
    const b = ve({ khoaDao: false })
    fireEvent.click(screen.getByRole('button', { name: 'Khám phá Bát Linh Đảo · 16 câu' }))
    expect(b.onKhamPhaDao).toHaveBeenCalledTimes(1)
    expect(b.container.querySelectorAll('.v2-nut-chinh').length).toBe(1)
  })
  it('lối vào ca kiểm tra: không có ca ⇒ nút tròn "Ca kiểm tra"; ca đang mở ⇒ CHỈ một dải "Vào thi"', () => {
    const a = ve()
    fireEvent.click(screen.getByRole('button', { name: 'Ca kiểm tra' }))
    expect(a.onVaoThi).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Ca kiểm tra đang mở')).toBeNull()
    cleanup()
    const b = ve({}, { caDangMo: true })
    expect(screen.getAllByRole('button', { name: /Vào thi|Ca kiểm tra/ })).toHaveLength(1)
    expect(screen.getByText('Ca kiểm tra đang mở')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Vào thi' }))
    expect(b.onVaoThi).toHaveBeenCalledTimes(1)
  })
  it('xong kế hoạch ⇒ giữ màn xong + MỞ RƯƠNG (một nút vàng), không nút Thử sức thêm ở Hôm nay; nút phụ sang Luyện thêm', () => {
    const p = ve({ theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, hanhTrinh: { ...SANH.hanhTrinh, daLam: 30 }, ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: false, qua: null }, thuSucThem: { duoc: true, soCau: 6 } })
    expect(p.container.textContent).toContain('Hôm nay em xong rồi')
    expect(screen.getByRole('button', { name: /MỞ RƯƠNG BÁT LINH/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Thử sức thêm/ })).toBeNull()
    expect(screen.getByText('Mở được')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Luyện thêm · không bắt buộc' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Hành trình Hoá 12' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Thử sức thêm/ })).toBeTruthy()
  })
  it('Hành trình KHÔNG vẽ thẻ chiến dịch lần hai; chiến dịch cũ (không Hành trình) giữ thẻ có HẠN NỘP; Huyết Chiến giữ', () => {
    const cd = { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-20', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: null }
    const a = ve({ chienDich: cd })
    expect(a.container.querySelector('.h2-cd')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Hành trình hôm nay' })).toBeNull()
    cleanup()
    const b = ve({ hanhTrinh: undefined, chienDich: cd })
    expect(b.container.querySelector('.h2-cd-han')!.textContent).toMatch(/^Hạn nộp: /)
    cleanup()
    ve({ hanhTrinh: undefined, chienDich: cd, huyetChien: true, theLuc: { con: 80, tong: 80 } })
    expect(screen.getByRole('region', { name: 'Huyết Chiến' }).textContent).toContain('Hôm nay em cần 80 câu')
  })
})

describe('Hành trình V2 · tầng từng bài + Luyện thêm', () => {
  it('có hanhTrinh.bai ⇒ mỗi bài 4 ô Vững/Đang luyện/Khoá + "Dạng vững a/b"', () => {
    ve({ hanhTrinh: { ...SANH.hanhTrinh, bai: BAI } })
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Hành trình Hoá 12' })).toBeTruthy()
    expect(screen.getByText('Mỗi bài mở tầng kế khi em đã vững 80% tầng trước.')).toBeTruthy()
    const t1 = screen.getByRole('list', { name: 'Tầng của Bài 1 · Ester' })
    expect([...t1.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Nền: Vững', 'Hiểu: Đang luyện', 'Vận dụng: Khoá', 'Tổng hợp: Khoá'])
    expect(screen.getByText('Dạng vững 5/8')).toBeTruthy()
    const t2 = screen.getByRole('list', { name: 'Tầng của Bài 2 · Lipid' })
    expect([...t2.querySelectorAll('li')].map((li) => li.getAttribute('data-tt'))).toEqual(['dang', 'khoa', 'khoa', 'khoa'])
    // không còn bản đồ, không bịa trạng thái khi vắng số
    expect(screen.queryByText('Bản đồ hành trình')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    expect(screen.getByText('Hoá 12 · tầng Hiểu')).toBeTruthy()
  })
  it('vắng hanhTrinh.bai ⇒ chỉ tầng chung + chặng (Dạng vững khi OMNI gửi)', () => {
    ve({ omni: OMNI })
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    expect(screen.getByText('Hiểu', { selector: 'b' })).toBeTruthy()
    expect(screen.getByText('Hôm nay: Chặng 3/5 · còn 6 câu trong chặng')).toBeTruthy()
    expect(screen.getByText('Dạng vững 5/8')).toBeTruthy()
    expect(screen.queryByText('Vững')).toBeNull()
    expect(screen.queryByRole('list', { name: /Tầng của/ })).toBeNull()
  })
  it('Luyện thêm: Thử sức thêm mờ khi chưa xong; Vé/Đề thử mở Đảo đúng việc OMNI; Tu luyện; Bi-a theo logic cửa Bi-a', () => {
    const p = ve({ omni: OMNI, bia: { bat: true, con: 4, tong: 6, giaoHuu: { mo: false, con: 0 }, lyDoKhoa: null } })
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    const lt = screen.getByRole('region', { name: 'Luyện thêm' })
    expect(within(lt).getByText('không bắt buộc')).toBeTruthy()
    const thuSuc = within(lt).getByRole('button', { name: /Thử sức thêm/ }) as HTMLButtonElement
    expect(thuSuc.disabled).toBe(true)
    expect(thuSuc.textContent).toContain('Mở khi xong kế hoạch hôm nay')
    fireEvent.click(within(lt).getByRole('button', { name: /Vé thử thách 2\/2/ }))
    expect(sessionStorage.getItem('game-v2:omni-dao')).toBe('ve')
    fireEvent.click(within(lt).getByRole('button', { name: /Đề thử/ }))
    expect(sessionStorage.getItem('game-v2:omni-dao')).toBe('de-thu')
    expect(p.onKhamPhaDao).toHaveBeenCalledTimes(2)
    expect(within(lt).getByRole('button', { name: /Đề thử/ }).textContent).toContain('14 câu · 25 phút')
    const tl = within(lt).getByRole('button', { name: /Tu luyện/ })
    expect(tl.textContent).toContain('Chỉ dành cho học sinh Nỗ lực')
    fireEvent.click(tl)
    expect(p.onTuLuyen).toHaveBeenCalledTimes(1)
    fireEvent.click(within(lt).getByRole('button', { name: /Bi-a Phản Ứng · còn 4\/6 câu/ }))
    expect(p.onChoiBia).toHaveBeenCalledTimes(1)
  })
  it('Thử sức thêm (máy chủ cho): gọi hoa2-thu-suc-them bằng token, tải lại Sảnh rồi về Hôm nay', async () => {
    const goi: { url: string; body: any }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
      goi.push({ url: String(url), body: JSON.parse(init?.body || '{}') })
      return { ok: true, status: 200, json: async () => ({ ok: true, them: 6 }) }
    }))
    const p = ve({ theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: true, qua: { vang: 20 } }, thuSucThem: { duoc: true, soCau: 6 } })
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    const nut = screen.getByRole('button', { name: /Thử sức thêm/ })
    expect(nut.textContent).toContain('Lấy trước 6 câu mới của ngày mai')
    fireEvent.click(nut)
    await waitFor(() => expect(p.onTaiLai).toHaveBeenCalled())
    expect(goi.map((g) => new URL(g.url).pathname)).toEqual(['/game-v2/hoa2-thu-suc-them'])
    expect(goi[0]!.body).toEqual({ token: 'tk' })
    await waitFor(() => expect(screen.getByText('Hoá 12 · tầng Hiểu')).toBeTruthy())
  })
})

describe('Thần thú V2 · Câu đã làm (bản vẽ tối giản 09/10)', () => {
  const HO_SO = { pet: 'linh-ho', choice: false, cap: 7, exp: 120, wallet: 0, mastery: [], nickname: 'Linh Hồ' }
  it('Thần thú: "Túi đồ" + nút vàng "Cửa hàng" (khi có) + hàng chữ "Đăng xuất"; MỘT nút vàng', () => {
    const p = { onTuiDo: vi.fn(), onCuaHang: vi.fn(), onDongHanh: vi.fn(), onDangXuat: vi.fn() }
    const { container } = render(<ThanThuV2 profile={HO_SO as never} {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Túi đồ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cửa hàng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    expect([p.onTuiDo, p.onCuaHang, p.onDangXuat].map((f) => f.mock.calls.length)).toEqual([1, 1, 1])
    expect(container.querySelectorAll('.v2-nut-chinh')).toHaveLength(1)
    expect(container.querySelector('.v2-nut-chinh')!.textContent).toBe('Cửa hàng')
    cleanup()
    const { container: c2 } = render(<ThanThuV2 profile={HO_SO as never} onTuiDo={vi.fn()} onDongHanh={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Cửa hàng' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).toBeNull()
    expect(c2.querySelector('.v2-nut-chinh')!.textContent).toContain('Đồng hành')
  })
  it('nối Đăng xuất: cổng học sinh → Game → Đảo → Thần thú V2', () => {
    expect(readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')).toMatch(/onChuyenSangVaoThi=\{\(\) => setTab\('vaothi'\)\}\s*onDangXuat=\{hoiDangXuat\}/)
    expect(readFileSync('src/game/than-thu-v2/Game.tsx', 'utf8')).toContain('onDangXuat={onDangXuat} cheDo2={cheDo2}')
    expect(readFileSync('src/game/than-thu-v2/dao/DaoThanThu.tsx', 'utf8')).toContain("onDongHanh={()=>setMan('dao')} onDangXuat={onDangXuat}")
  })
  it('Câu đã làm: thẻ "Ca kiểm tra gần nhất" ở đầu màn, bấm ⇒ Lịch sử ca; vắng dữ liệu ⇒ không thẻ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cheDo2: false }) })))
    const onLichSuCa = vi.fn()
    render(<CauDaLam token="tk" hoTen="Em" sbd="1" onVe={vi.fn()} caGanNhat={{ chu: 'Ca kiểm tra gần nhất: 8,0 điểm · 03/10', coDiem: true }} onLichSuCa={onLichSuCa} />)
    fireEvent.click(screen.getByRole('button', { name: /Ca kiểm tra gần nhất: 8,0 điểm · 03\/10/ }))
    expect(onLichSuCa).toHaveBeenCalledTimes(1)
    await waitFor(() => expect((globalThis.fetch as any).mock.calls.length).toBeGreaterThan(0))
    cleanup()
    render(<CauDaLam token="tk" hoTen="Em" sbd="1" onVe={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Ca kiểm tra gần nhất/ })).toBeNull()
  })
})

describe('Màn trận · Thần thú · thầy', () => {
  it('nhãn môn trên thẻ câu: khối đọc từ mã đề, không đọc được ⇒ "Hoá học"', () => {
    expect(monCau('DH-12-C1-B2-TN')).toBe('Hoá học 12')
    expect(monCau('DH-10-C3')).toBe('Hoá học 10')
    expect(monCau('DH-B6-TN')).toBe('Hoá học')
    expect(monCau(undefined)).toBe('Hoá học')
  })
  it('nút chốt Đảo đồng bộ chữ với Đoàn: "CHỐT ĐÁP ÁN"', () => {
    const ma = readFileSync('src/game/than-thu-v2/dao2/TrongAi.tsx', 'utf8')
    expect(ma).toContain(`'CHỐT ĐÁP ÁN'`)
    expect(ma).not.toContain('TUNG CHIÊU\'')
  })
  it('số vàng: chỉ nhận số thật từ vang-xem; ví tắt / sai kiểu ⇒ không vẽ', () => {
    expect(docVang({ ok: true, bat: true, vang: 340.7 })).toBe(340)
    expect(docVang({ ok: true, bat: false })).toBeNull()
    expect(docVang({ ok: true, bat: true, vang: 'x' })).toBeNull()
    expect(docVang(null)).toBeNull()
  })
  it('Hành trình thầy: khối từ nhãn; bốn chỉ số đếm từ bảng hôm nay; chương cộng bài + câu', () => {
    expect(khoiCuaHanhTrinh({ lop: 'Khối 12', ten: '' })).toBe('12')
    expect(khoiCuaHanhTrinh({ lop: null, ten: 'Hành trình giỏi hoá · Khối 10' })).toBe('10')
    const em = [
      { sbd: '1', ten: 'A', tang: 2, toiThieu: 30, daLam: 30, daXep: 30, conThieu: 0 },
      { sbd: '2', ten: 'B', tang: 3, toiThieu: 36, daLam: 0, daXep: 36, conThieu: 0 },
      { sbd: '3', ten: 'C', tang: 4, toiThieu: 36, daLam: 6, daXep: 30, conThieu: 6 },
      { sbd: '4', ten: 'D', tang: null, toiThieu: null, daLam: 0, daXep: 0, conThieu: 0 },
    ]
    expect(chiSoNhip(em)).toEqual({ tong: 4, duMuc: 1, coMuc: 3, chuaLam: 2, thieuCau: 1, tangCao: 2 })
    const bai = [
      { khoaBai: 'b1', tenBai: 'Bài 1', viTri: 1, chuong: 'C1', soCau: 30, to: [] },
      { khoaBai: 'b2', tenBai: 'Bài 2', viTri: 2, chuong: 'C1', soCau: 12, to: [] },
      { khoaBai: 'b3', tenBai: 'Bài 3', viTri: 3, chuong: 'C2', soCau: 20, to: [] },
    ]
    expect(chuongCuaKhoi(bai)).toEqual([{ chuong: 'C1', soBai: 2, soCau: 42 }, { chuong: 'C2', soBai: 1, soCau: 20 }])
  })
  it('ma trận đề: chuyên đề × Nhận biết/Thông hiểu/Vận dụng; câu thiếu nhãn vào "Chưa gắn"; tổng = số câu', () => {
    const c = (chuyenDe?: string, mucDo?: string) => ({ chuyenDe, mucDo }) as never
    const nguon = [{ maDe: 'D1', phanI: [c('Ester', 'biet'), c('Ester', 'hieu'), c('Ester', 'van_dung'), c('Lipid', 'biet')], phanII: [c('Ester', 'hieu')], phanIII: [c(undefined, undefined), c('Lipid', 'la')] }] as unknown as TeacherExamSource[]
    const mt = dungMaTranDe(nguon)
    expect(mt.tong).toBe(7)
    expect(mt.cot).toEqual({ biet: 2, hieu: 2, van_dung: 1, chua: 2 })
    expect(mt.hang.map((h) => [h.chuyenDe, h.tong])).toEqual([['Ester', 4], ['Lipid', 2], [CHUA_GAN_CHUYEN_DE, 1]])
    expect(mt.hang.reduce((a, h) => a + h.tong, 0)).toBe(mt.tong)
  })
})
