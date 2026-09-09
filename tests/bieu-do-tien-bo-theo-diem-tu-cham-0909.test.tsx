// BIỂU ĐỒ TIẾN BỘ NÓI KHÁC ĐẦU MÀN — nửa còn lại của ảnh thầy gửi 09/09 14:31.
//
//   đầu màn Hồ sơ : "5,75 điểm ca này"
//   biểu đồ ngay dưới : "1 bài đã chấm · trung bình chung 2,50", chấm vẽ ở ~2,5
//
// Cùng một em, cùng một ca, hai con số trên CÙNG MỘT MÀN HÌNH.
//
// NGUYÊN NHÂN GỐC: `chuoiTienBo` đọc ô `tong` của từng ca trong hồ sơ — tức ô
// điểm trên Sheet. Ô đó máy em bản cũ ghi đè được (đã truy ra và đo 08/09).
// Đầu màn thì in `graded.score.total`, số màn này TỰ CHẤM từ đáp án thô.
//
// SỬA: `chuoiTienBo(ca, deTheoCa)` nhận bản đè mã ca → điểm tự chấm. Màn Ca thi
// đưa điểm nó vừa chấm cho ĐÚNG ca đang mở. Ca khác giữ ô Sheet, vì máy này
// không có bộ đề của chúng để chấm lại — và nói dối bằng cách bịa ra điểm cho
// chúng thì tệ hơn.
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { chuoiTienBo, trungBinhCongDon } from '../src/lib/tien-bo'
import KhoiTienBo from '../src/components/KhoiTienBo'
import type { HoSoEm } from '../src/lib/exam-api'

afterEach(cleanup)

/** Hai ca của một em. Ca `778899` là ca thầy đang mở, ô Sheet ghi 2,50 trong
 * khi màn tự chấm ra 5,75. Ca `112233` là ca cũ, máy này không chấm lại được. */
const CA: HoSoEm['ca'] = [
  {
    maCa: '112233',
    tenCa: 'Ca cũ',
    lop: '12',
    lanThu: 1,
    nopLuc: '2026-09-01T10:00:00.000Z',
    trangThai: 'da_nop',
    diemI: null,
    diemII: null,
    diemIII: null,
    tong: 8.0,
    hang: null,
    siSo: null,
    soLanRoiMan: 0,
  },
  {
    maCa: '778899',
    tenCa: '2009 - Lớp 2 - L1',
    lop: '12',
    lanThu: 1,
    nopLuc: '2026-09-08T13:10:00.000Z',
    trangThai: 'da_nop',
    diemI: 1,
    diemII: 1,
    diemIII: 0.5,
    tong: 2.5,
    hang: null,
    siSo: null,
    soLanRoiMan: 0,
  },
]

describe('chuoiTienBo — bản đè điểm tự chấm', () => {
  it('KHÔNG đưa bản đè thì giữ nguyên ô Sheet — hành vi cũ không đổi', () => {
    expect(chuoiTienBo(CA).map((d) => d.diem)).toEqual([8, 2.5])
    expect(chuoiTienBo(CA, null).map((d) => d.diem)).toEqual([8, 2.5])
    expect(chuoiTienBo(CA, {}).map((d) => d.diem)).toEqual([8, 2.5])
  })

  it('TÁI HIỆN: đè đúng ca đang mở, ca còn lại giữ ô Sheet', () => {
    expect(chuoiTienBo(CA, { '778899': 5.75 }).map((d) => d.diem)).toEqual([8, 5.75])
  })

  it('đè ca nào thì chỉ ca đó đổi — không lây sang ca khác', () => {
    expect(chuoiTienBo(CA, { '112233': 1 }).map((d) => d.diem)).toEqual([1, 2.5])
  })

  it('mã ca lạ trong bản đè thì bỏ qua, không đẻ thêm điểm', () => {
    const ds = chuoiTienBo(CA, { khong_co_ca_nay: 9 })
    expect(ds.map((d) => d.diem)).toEqual([8, 2.5])
    expect(ds).toHaveLength(2)
  })

  it('giá trị rác trong bản đè thì giữ ô Sheet, KHÔNG vẽ NaN lên biểu đồ', () => {
    const rac = { '778899': Number.NaN } as Record<string, number>
    expect(chuoiTienBo(CA, rac).map((d) => d.diem)).toEqual([8, 2.5])
    const vc = { '778899': Number.POSITIVE_INFINITY } as Record<string, number>
    expect(chuoiTienBo(CA, vc).map((d) => d.diem)).toEqual([8, 2.5])
  })

  it('điểm 0 THẬT vẫn đè được — 0 không phải là "không có điểm"', () => {
    expect(chuoiTienBo(CA, { '778899': 0 }).map((d) => d.diem)).toEqual([8, 0])
  })

  it('trung bình cộng dồn đổi theo bản đè — đây chính là số 2,50 thầy chụp', () => {
    const cu = trungBinhCongDon(chuoiTienBo(CA).map((d) => d.diem))
    const moi = trungBinhCongDon(chuoiTienBo(CA, { '778899': 5.75 }).map((d) => d.diem))
    expect(cu[cu.length - 1]).toBe(5.25)
    expect(moi[moi.length - 1]).toBe(6.88)
  })
})

describe('KhoiTienBo dựng thật — chữ hiện ra phải khớp đầu màn', () => {
  it('TÁI HIỆN ĐÚNG ẢNH: một ca, ô Sheet 2,50 ⇒ biểu đồ in "trung bình chung 2,50"', () => {
    render(<KhoiTienBo ca={[CA[1]]} />)
    expect(screen.getByText(/trung bình chung 2,50/)).toBeTruthy()
  })

  it('ĐƯA ĐIỂM TỰ CHẤM ⇒ biểu đồ in 5,75, hết cảnh hai số trên một màn', () => {
    render(<KhoiTienBo ca={[CA[1]]} diemDe={{ '778899': 5.75 }} />)
    expect(screen.getByText(/trung bình chung 5,75/)).toBeTruthy()
    expect(screen.queryByText(/trung bình chung 2,50/)).toBeNull()
  })

  it('nhãn cho người khiếm thị cũng nói số đã đè, không nói số cũ', () => {
    const { container } = render(<KhoiTienBo ca={CA} diemDe={{ '778899': 5.75 }} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-label')).toContain('2 bài')
  })
})

describe('màn Ca thi đưa đúng bản đè xuống biểu đồ', () => {
  it('lấy mã ca ĐANG MỞ và điểm tự chấm của đúng em đang xem', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(ma).toContain('diemDe={chiTiet && emTrongCa?.graded ? { [chiTiet.ca.maCa]: emTrongCa.graded.score.total } : null}')
  })
})
