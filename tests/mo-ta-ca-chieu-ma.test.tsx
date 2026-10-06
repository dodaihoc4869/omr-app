// Màn Chiếu mã "Ca này kiểm tra gì": hàm thuần xác định chế độ + số (không bịa), và component vẽ đúng chữ / số / aria.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { cheDoCuaCa, moTaCaChieuMa, tranOnLai } from '../src/lib/mo-ta-ca-chieu-ma'
import { MA_TRAN_HOA_2026 } from '../src/lib/ma-tran-hoa-2026'
import { TI_LE_MUC_DICH_CA } from '../src/lib/rut-de-v2'
import { PHUT_TOI_DA_LEN_BANG } from '../src/lib/rut-de'
import TamPhuChieuMa from '../src/components/TamPhuChieuMa'

afterEach(cleanup)
const SC14 = { I: 9, II: 2, III: 3 }

describe('cheDoCuaCa — từ trường thật của ca', () => {
  it('đủ 5 chế độ', () => {
    expect(cheDoCuaCa({ phamViHoiLai: 'da_dung', deRieng: true, lenBang: true })).toBe('da_dung')
    expect(cheDoCuaCa({ phamViHoiLai: 'gan_nhat', deRieng: true, lenBang: true })).toBe('diem_yeu')
    expect(cheDoCuaCa({ phamViHoiLai: 'khong', deRieng: true, lenBang: false })).toBe('khong')
    expect(cheDoCuaCa({ phamViHoiLai: 'gan_nhat', deRieng: true, lenBang: false })).toBe('rut_sai')
    expect(cheDoCuaCa({ phamViHoiLai: 'ba_ca', deRieng: true })).toBe('rut_sai')
    expect(cheDoCuaCa({ phamViHoiLai: 'gan_nhat', deRieng: false, lenBang: true })).toBe('chung')
    expect(cheDoCuaCa({})).toBe('chung')
  })
})

describe('moTaCaChieuMa', () => {
  it('trần ôn lại = ceil(hằng × số câu phần): 14 câu 9/2/3 ⇒ 3/1/1, không số cứng thứ hai', () => {
    expect(tranOnLai(9)).toBe(Math.ceil(9 * TI_LE_MUC_DICH_CA))
    expect([9, 2, 3].map(tranOnLai)).toEqual([3, 1, 1])
    const m = moTaCaChieuMa({ deRieng: true, phamViHoiLai: 'gan_nhat', thoiGianPhut: 45, soCau: SC14 })
    expect(m.cheDo).toBe('rut_sai')
    expect(m.vong.doan.map((d) => d.so)).toEqual([5, 9])
    expect(m.vong.tong).toBe(14)
    if (m.chiTiet.kieu !== 'thanh') throw new Error('phải là thanh')
    expect(m.chiTiet.thanh.map((b) => b.doan.map((d) => d.so))).toEqual([[3, 6], [1, 1], [1, 2]])
    expect(m.chiTiet.thanh[0]!.ghiChu).toBe('Ôn lại nhiều nhất 3 câu · mới ít nhất 6 câu')
    expect(m.soLieu).toEqual([{ so: '14', nhan: 'câu' }, { so: '45', nhan: 'phút' }, { so: '3,2', nhan: 'phút mỗi câu' }])
    expect(m.why).toHaveLength(3)
  })
  it('không rút câu sai: toàn câu mới', () => {
    const m = moTaCaChieuMa({ deRieng: true, phamViHoiLai: 'khong', thoiGianPhut: 45, soCau: SC14 })
    expect(m.tieuDe).toBe('Hôm nay toàn câu em chưa gặp')
    expect(m.vong.doan).toEqual([{ nhan: 'Câu mới em chưa gặp', so: 14, mau: 'moi' }])
    if (m.chiTiet.kieu !== 'thanh') throw new Error('phải là thanh')
    expect(m.chiTiet.thanh.map((b) => b.tong)).toEqual([9, 2, 3])
  })
  it('kiểm tra điểm yếu: thang 4 bước, thời gian cắt ở trần lên bảng', () => {
    const m = moTaCaChieuMa({ deRieng: true, lenBang: true, phamViHoiLai: 'gan_nhat', thoiGianPhut: 45, soCau: { I: 7, II: 1, III: 2 } })
    expect(m.cheDo).toBe('diem_yeu')
    expect(m.phut).toBe(PHUT_TOI_DA_LEN_BANG)
    expect(m.soLieu[1]).toEqual({ so: String(PHUT_TOI_DA_LEN_BANG), nhan: 'phút' })
    if (m.chiTiet.kieu !== 'thang') throw new Error('phải là thang')
    expect(m.chiTiet.thang.map((t) => t.n)).toEqual([1, 2, 3, 4])
    expect(m.vong.doan.map((d) => d.so)).toEqual([7, 1, 2])
    expect(moTaCaChieuMa({ deRieng: true, lenBang: true, thoiGianPhut: 10, soCau: SC14 }).phut).toBe(10)
  })
  it('đã đúng: lưới theo MA_TRAN_HOA_2026 (28 câu = 18/4/6 đúng ma trận; 14 câu = 9/2/3)', () => {
    const m = moTaCaChieuMa({ phamViHoiLai: 'da_dung', deRieng: true, thoiGianPhut: 45, soCau: { I: 18, II: 4, III: 6 } })
    if (m.chiTiet.kieu !== 'luoi') throw new Error('phải là lưới')
    expect(m.chiTiet.hang.map((h) => h.o)).toEqual([
      [MA_TRAN_HOA_2026.I.biet, MA_TRAN_HOA_2026.I.hieu, MA_TRAN_HOA_2026.I.van_dung],
      [MA_TRAN_HOA_2026.II.biet, MA_TRAN_HOA_2026.II.hieu, MA_TRAN_HOA_2026.II.van_dung],
      [MA_TRAN_HOA_2026.III.biet, MA_TRAN_HOA_2026.III.hieu, MA_TRAN_HOA_2026.III.van_dung],
    ])
    expect(m.chiTiet.hang.map((h) => h.o)).toEqual([[11, 4, 3], [0, 3, 1], [1, 2, 3]])
    expect(m.vong.doan.map((d) => d.so)).toEqual([18, 4, 6])
    expect(m.chiTiet.cot).toEqual(['Nhận biết', 'Thông hiểu', 'Vận dụng'])
    const m14 = moTaCaChieuMa({ phamViHoiLai: 'da_dung', soCau: SC14 })
    expect(m14.vong.doan.map((d) => d.so)).toEqual([9, 2, 3])
  })
  it('đề chung: vòng + thanh theo phần, số lấy đúng từ ca; không có số câu thì không vẽ số', () => {
    const m = moTaCaChieuMa({ lenBang: true, thoiGianPhut: 50, soCau: { I: 18, II: 4, III: 6 } })
    expect(m.cheDo).toBe('chung')
    expect(m.tieuDe).toBe('Hôm nay làm đề của thầy')
    expect(m.vong.doan.map((d) => d.so)).toEqual([18, 4, 6])
    expect(m.soLieu[0]).toEqual({ so: '28', nhan: 'câu' })
    expect(m.why).toHaveLength(3)
    const trong = moTaCaChieuMa({ thoiGianPhut: 45, soCau: null })
    expect(trong.vong.doan).toEqual([])
    expect(trong.soLieu[0]!.so).toBe('—')
  })
})

describe('TamPhuChieuMa + kiemTraGi', () => {
  const ve = (mo?: ReturnType<typeof moTaCaChieuMa>) =>
    render(<TamPhuChieuMa maCa="482917" tenCa="Kiểm tra tuần 3" lop="12 - Tinh Hoa" diaChi="omr.test/t/482917" soEmCho={null} onDong={() => {}} kiemTraGi={mo} />)
  it('có prop: tiêu đề, số câu, aria, nút Đóng', () => {
    ve(moTaCaChieuMa({ deRieng: true, phamViHoiLai: 'gan_nhat', thoiGianPhut: 45, soCau: SC14 }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hôm nay hỏi lại những câu em từng sai')
    expect(screen.getByLabelText(/Đề của mỗi em: 14 câu/)).toBeTruthy()
    expect(screen.getByLabelText('Số câu từng phần, trong đó câu ôn lại')).toBeTruthy()
    expect(screen.getByLabelText('Vì sao ca này quan trọng')).toBeTruthy()
    expect(screen.getByLabelText('Ba con số của ca').textContent).toContain('14')
    expect(screen.getByLabelText('Mã ca 482917')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeTruthy()
    expect(within(screen.getByLabelText('Mã vào thi')).getByText('Quét mã QR, hoặc mở', { exact: false })).toBeTruthy()
  })
  it('lưới đã đúng có bảng với tiêu đề cột', () => {
    ve(moTaCaChieuMa({ phamViHoiLai: 'da_dung', soCau: { I: 18, II: 4, III: 6 } }))
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toContain('Thông hiểu')
  })
  it('vắng prop: bố cục cũ (không có cột Ca này kiểm tra gì)', () => {
    const { container } = ve(undefined)
    expect(container.querySelector('.km')).toBeNull()
    expect(container.querySelector('.cm-luoi')).not.toBeNull()
  })
})
