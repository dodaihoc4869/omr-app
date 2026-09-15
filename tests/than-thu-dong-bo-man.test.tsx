/**
 * LUỒNG ĐỒNG BỘ TRÊN MÀN THẬT.
 *
 * Bẫy lớn nhất ở đây: **đẩy lên trước khi nuốt xong bản máy chủ**. Làm thế là
 * lấy bản trong máy đè lên bản máy chủ — đúng cái lỗi đang đi sửa, chỉ khác là
 * lần này tự mình gây ra.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import { KHOA_LUU_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('omr_than_thu_khong_3d', '1')
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => { vi.useRealTimers(); cleanup(); vi.restoreAllMocks() })

const doc = () => JSON.parse(localStorage.getItem(KHOA_LUU_THAN_THU) ?? '{}')

function gan(p: {
  trongMay?: Record<string, unknown>
  mayChu?: unknown
  docLoi?: boolean
  ghi?: (h: unknown) => Promise<unknown>
} = {}) {
  if (p.trongMay !== undefined) localStorage.setItem(KHOA_LUU_THAN_THU, JSON.stringify(p.trongMay))
  const doc2 = p.docLoi === true
    ? () => Promise.reject(new Error('máy chủ bận'))
    : () => Promise.resolve(p.mayChu ?? null)
  return render(
    <ThanThuHoaHocGame
      dsLichSu={[]} dsBtvn={[]}
      docThanThuMayChu={doc2}
      ghiThanThuMayChu={p.ghi}
      onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
    />,
  )
}

describe('Nuốt bản máy chủ khi mở game', () => {
  it('máy chủ có thú cấp cao hơn thì màn hình đổi theo', async () => {
    gan({
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 1, soExp: { caThi: 0 } },
      mayChu: { idThanhThuChon: 'hoa_long', capDo: 7, soExp: { caThi: 9000 }, tangThapCaoNhat: 12 },
    })
    await waitFor(() => expect(doc().capDo).toBe(7))
    expect(doc().tangThapCaoNhat).toBe(12)
  })

  it('máy này đang cao hơn thì KHÔNG bị máy chủ kéo tụt', async () => {
    gan({
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 9, soExp: { caThi: 9000 }, tangThapCaoNhat: 30 },
      mayChu: { idThanhThuChon: 'hoa_long', capDo: 2, soExp: { caThi: 100 }, tangThapCaoNhat: 3 },
    })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    expect(doc().capDo).toBe(9)
    expect(doc().tangThapCaoNhat).toBe(30)
  })

  it('máy chủ chưa có gì thì giữ nguyên bản trong máy', async () => {
    gan({ trongMay: { idThanhThuChon: 'loi_kim', capDo: 4, soExp: { btvn: 800 } }, mayChu: null })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    expect(doc().capDo).toBe(4)
    expect(doc().idThanhThuChon).toBe('loi_kim')
  })

  it('máy chủ lỗi thì game vẫn chạy bằng bản trong máy', async () => {
    gan({ trongMay: { idThanhThuChon: 'hoa_long', capDo: 5, soExp: { caThi: 900 } }, docLoi: true })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    expect(doc().capDo).toBe(5)
  })

  it('không truyền hàm đồng bộ thì game chạy y như cũ', async () => {
    render(
      <ThanThuHoaHocGame
        dsLichSu={[]} dsBtvn={[]}
        onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
        onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByText('Chọn thần thú đồng hành của em')).toBeTruthy())
  })
})

describe('Đẩy lên máy chủ', () => {
  it('KHÔNG đẩy trước khi nuốt xong bản máy chủ', async () => {
    const ghi = vi.fn(() => Promise.resolve({ ok: true, daGhi: true }))
    let moKhoa: (v: unknown) => void = () => {}
    const chờ = new Promise((res) => { moKhoa = res })
    render(
      <ThanThuHoaHocGame
        dsLichSu={[]} dsBtvn={[]}
        docThanThuMayChu={() => chờ}
        ghiThanThuMayChu={ghi}
        onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
        onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
      />,
    )
    // Đang chờ máy chủ: dù 10 giây trôi qua cũng không được đẩy.
    await vi.advanceTimersByTimeAsync(10_000)
    expect(ghi).not.toHaveBeenCalled()

    moKhoa({ idThanhThuChon: 'hoa_long', capDo: 3, soExp: { caThi: 500 } })
    await waitFor(() => expect(doc().capDo).toBe(3))
    await vi.advanceTimersByTimeAsync(3000)
    expect(ghi).toHaveBeenCalled()
  })

  it('gộp nhiều thay đổi liên tiếp thành một lần đẩy', async () => {
    const ghi = vi.fn(() => Promise.resolve({ ok: true, daGhi: true }))
    gan({
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 1, khoExp: 0, soExp: {} },
      mayChu: null, ghi,
    })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    ghi.mockClear()
    // Ba lần bấm trong vòng một giây. Dùng đúng nút rót — chữ "Ống rỗng" cũng
    // xuất hiện trong nút nạp, nên khớp bằng biểu thức là dính hai phần tử.
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Rót việc học vào ống'))
      await vi.advanceTimersByTimeAsync(300)
    }
    await vi.advanceTimersByTimeAsync(3000)
    expect(ghi.mock.calls.length).toBeLessThanOrEqual(1)
  })

  it('máy chủ từ chối vì có bản nhỉnh hơn thì máy này NUỐT LẠI', async () => {
    const ghi = vi.fn(() => Promise.resolve({
      ok: true, daGhi: false, lyDo: 'may_chu_moi_hon',
      hoSo: { idThanhThuChon: 'hoa_long', capDo: 11, soExp: { caThi: 50_000 }, tangThapCaoNhat: 44 },
    }))
    gan({
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 2, soExp: { caThi: 300 } },
      mayChu: null, ghi,
    })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    await vi.advanceTimersByTimeAsync(3000)
    await waitFor(() => expect(doc().capDo).toBe(11))
    expect(doc().tangThapCaoNhat).toBe(44)
  })

  it('đẩy hỏng vì mất mạng thì game không vỡ', async () => {
    const ghi = vi.fn(() => Promise.reject(new Error('mất mạng')))
    gan({ trongMay: { idThanhThuChon: 'hoa_long', capDo: 3 }, mayChu: null, ghi })
    await waitFor(() => expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy())
    await vi.advanceTimersByTimeAsync(4000)
    expect(screen.getByText('Chỉ Số Chiến Đấu')).toBeTruthy()
    expect(doc().capDo).toBe(3)
  })
})
