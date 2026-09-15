/**
 * CHỌN THẦN THÚ MỘT LẦN, KHÔNG ĐỔI.
 *
 * Thầy chốt 15-09. Trước đây mặc định sẵn Hoả Long và có nút đổi tự do, nên
 * vòng tương khắc thành vô nghĩa: gặp trùm hệ nào thì đổi sang hệ khắc hệ ấy
 * rồi đánh. Phép kiểm này giữ cho cái nút đó không mọc lại.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import {
  vaHoSo, layHoSoThanThuMacDinh, DANH_SACH_THAN_THU, KHOA_LUU_THAN_THU,
} from '../src/game/than-thu-hoa-hoc/he-thong-pet'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

function gan() {
  return render(
    <ThanThuHoaHocGame
      dsLichSu={[]} dsBtvn={[]}
      onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
    />,
  )
}

describe('Hồ sơ: rỗng nghĩa là chưa chọn', () => {
  it('hồ sơ mặc định KHÔNG gán sẵn thần thú nào', () => {
    expect(layHoSoThanThuMacDinh().idThanhThuChon).toBe('')
    expect(layHoSoThanThuMacDinh().ngayChonThu).toBe('')
  })

  it('hồ sơ cũ đã có thần thú thì giữ nguyên, không bắt chọn lại', () => {
    expect(vaHoSo({ idThanhThuChon: 'thuy_quai', capDo: 3 }).idThanhThuChon).toBe('thuy_quai')
  })

  it('id lạ thì về rỗng chứ không im lặng đổi sang con khác', () => {
    expect(vaHoSo({ idThanhThuChon: 'rong_lua_giay' }).idThanhThuChon).toBe('')
  })
})

describe('Màn chọn lần đầu', () => {
  it('chưa chọn thì hiện màn chọn và KHÔNG có tab nào bấm được', () => {
    gan()
    expect(screen.getByText('Chọn thần thú đồng hành của em')).toBeTruthy()
    expect(screen.getByText(/Chọn một lần duy nhất và không đổi được/)).toBeTruthy()
    // Nội dung các tab chưa được dựng.
    expect(screen.queryByText('Chỉ Số Chiến Đấu')).toBeNull()
    expect(screen.queryByText(/Tháp Tri Thức 100 Tầng/)).toBeNull()
  })

  it('bày đủ sáu con, mỗi con nói rõ khắc ai và bị ai khắc', () => {
    gan()
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      expect(screen.getByText(pet.ten), pet.id).toBeTruthy()
    }
    expect(screen.getAllByText('Khắc được:')).toHaveLength(6)
    expect(screen.getAllByText('Bị khắc bởi:')).toHaveLength(6)
  })

  it('bấm chọn thì vào game, và hồ sơ ghi lại mốc chọn', async () => {
    gan()
    fireEvent.click(screen.getByText('Mộc Tinh Ester Polymer'))
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    expect(screen.queryByText('Chọn thần thú đồng hành của em')).toBeNull()

    const luu = JSON.parse(localStorage.getItem(KHOA_LUU_THAN_THU) ?? '{}')
    expect(luu.idThanhThuChon).toBe('moc_tinh')
    expect(String(luu.ngayChonThu).length).toBeGreaterThan(10)
  })
})

describe('Chọn rồi thì KHÔNG đổi được', () => {
  it('không còn nút đổi thần thú nào trên màn', async () => {
    gan()
    fireEvent.click(screen.getByText('Lôi Kim Thú Điện Cực'))
    await waitFor(() => expect(screen.getByText('Sáu Hệ Thần Thú')).toBeTruthy())

    // Tiêu đề cũ "Chọn Thần Thú Đồng Hành" là cái thẻ cho đổi tự do — phải biến mất.
    expect(screen.queryByText('Chọn Thần Thú Đồng Hành')).toBeNull()
    expect(screen.getByText(/không đổi được/)).toBeTruthy()

    // Sáu hệ giờ chỉ để ĐỌC: tên con khác không nằm trong thẻ bấm được nào.
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      const el = screen.getAllByText(pet.ten)[0]!
      expect(el.closest('button'), pet.id).toBeNull()
    }
  })

  it('màn hình nói rõ hệ nào khắc em, hệ nào em khắc', async () => {
    gan()
    // Base khắc 4 hệ, bị Hoả khắc — nhiều quan hệ nhất, dễ thấy cả ba nhãn.
    fireEvent.click(screen.getByText('Bảo Thần Base Tinh Thể'))
    await waitFor(() => expect(screen.getByText('Sáu Hệ Thần Thú')).toBeTruthy())
    expect(screen.getByText('Thần thú của em')).toBeTruthy()
    expect(screen.getAllByText('Em khắc hệ này +50%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Hệ này khắc em −30%').length).toBeGreaterThanOrEqual(1)
  })

  it('mã nguồn không còn hàm đổi thú tự do', async () => {
    const { readFileSync } = await import('node:fs')
    const ma = readFileSync('src/components/ThanThuHoaHocGame.tsx', 'utf8')
    expect(ma.includes('doiThanhThu')).toBe(false)
  })
})
