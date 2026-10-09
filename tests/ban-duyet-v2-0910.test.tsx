// BẢN DUYỆT V2 (thầy 09/10/2026) — khoá hành vi các màn mới: Hôm nay V2 (00/01), Thần thú (06), trận (08/09: nhãn môn), Hành trình thầy (14), Ma trận đề (18).
// Số trên màn phải là số máy chủ gửi (không số minh hoạ); lỗi màn V2 ⇒ rơi về Sảnh cũ.
import { describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import SanhV2, { baBuoc, khoiTuLop, soCauHomNay, tenGoi } from '../src/components/ban-duyet-v2/SanhV2'
import { docSanh, type KetQuaSanh, type SanhHoa2 } from '../src/components/hoa2/api'
import { monCau } from '../src/game/than-thu-v2/dao2/TrongAi'
import { docVang } from '../src/game/than-thu-v2/dao/ThanThuV2'
import { chiSoNhip, chuongCuaKhoi, khoiCuaHanhTrinh } from '../src/components/chien-dich/HanhTrinhV2'
import { CHUA_GAN_CHUYEN_DE, dungMaTranDe } from '../src/lib/ma-tran-de'
import type { TeacherExamSource } from '../src/data/examContent'

const SANH = {
  ok: true, cheDo2: true, ngay: '2026-10-09',
  hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 },
  chienDich: null, theLuc: { con: 18, tong: 30 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: true, loiKhoaDao: 'Gỡ xong lỗi cũ để mở cầu.',
  ruong: { daLam: 12, tong: 30, moDuoc: false, daMo: false, qua: null }, bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 12,
}
const sanh = (o: Record<string, unknown> = {}) => (docSanh({ ...SANH, ...o }) as Extract<KetQuaSanh, { sanh: SanhHoa2 }>).sanh

function ve(o: Record<string, unknown> = {}, them: Record<string, unknown> = {}) {
  const props = {
    tenEm: 'Nguyễn Minh Anh', lop: '12A1', ketQua: docSanh({ ...SANH, ...o }) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 5, cap: 7, ten: 'Linh Hồ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 12, caDangMo: false, now: Date.now(), token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(), onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai: vi.fn(),
    ...them,
  }
  render(<SanhV2 {...(props as never)} />)
  return props
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
  it('ba bước dựng đúng từ số máy chủ (không bịa số đã làm từng bước)', () => {
    const [b1, b2, b3] = baBuoc(sanh())
    expect(b1).toMatchObject({ nhan: 'Gỡ 2 lỗi cũ', tt: 'dang' })
    expect(b2).toMatchObject({ nhan: 'Luyện 16 câu mới', tt: 'khoa' })
    expect(b3).toMatchObject({ tt: 'cho', phu: 'Mở khi xong kế hoạch' })
    const xong = baBuoc(sanh({ theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, thuSucThem: { duoc: true, soCau: 6 } }))
    expect(xong.map((b) => b.tt)).toEqual(['xong', 'xong', 'dang'])
    expect(xong[2]!.phu).toBe('6 câu · không bắt buộc')
  })
})

describe('Hôm nay V2 · màn thật', () => {
  it('số trên thẻ = số máy chủ; nút vàng gỡ lỗi cũ mở Đoàn; Đảo khoá kèm lời máy chủ; thanh dưới 4 mục', () => {
    const p = ve()
    expect(screen.getByText('Chào Minh Anh')).toBeTruthy()
    expect(screen.getByText('Chuỗi 12 ngày')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: /Hôm nay · 12\/30 câu/ })).toBeTruthy()
    expect(screen.getByText(/Chặng 3\/5 · còn 6 câu trong chặng/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu · gỡ 2 lỗi cũ/ }))
    expect(p.onPhaPhucKich).toHaveBeenCalledTimes(1)
    const dao = screen.getByRole('button', { name: /Khám phá Bát Linh Đảo · 16 câu/ }) as HTMLButtonElement
    expect(dao.disabled).toBe(true)
    expect(screen.getByText('Gỡ xong lỗi cũ để mở cầu.')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Câu đã làm để mở rương' }).getAttribute('aria-valuenow')).toBe('12')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect([...nav.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Hôm nay', 'Hành trình', 'Thần thú', 'Câu đã làm'])
    fireEvent.click(screen.getByRole('button', { name: 'Thần thú' }))
    expect(p.onMoThanThu).toHaveBeenCalledTimes(1)
    // không có số minh hoạ máy chủ chưa gửi
    expect(screen.queryByText(/phút/)).toBeNull()
    expect(screen.queryByText(/Mục tiêu 8,5/)).toBeNull()
    cleanup()
  })
  it('vẫn giữ lối vào ca kiểm tra: ca đang mở ⇒ dải "Vào thi"; nút Ca kiểm tra ở đầu màn', () => {
    const p = ve({}, { caDangMo: true })
    fireEvent.click(screen.getByRole('button', { name: 'Vào thi' }))
    expect(p.onVaoThi).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Ca đang mở · Vào thi/ })).toBeTruthy()
    cleanup()
  })
  it('"Đang mạnh lên" chỉ hiện khi máy chủ gửi Dạng vững (OMNI)', () => {
    ve()
    expect(screen.queryByText('Đang mạnh lên')).toBeNull()
    cleanup()
    ve({ omni: { bat: true, baiDangLuyen: [], dangVung: { a: 5, b: 8 }, conDangDe8: 2, sEm: 0.06, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } } })
    expect(screen.getByText('Đang mạnh lên')).toBeTruthy()
    expect(screen.getByText('Dạng vững 5/8')).toBeTruthy()
    cleanup()
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
