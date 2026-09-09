// PHIẾU GỬI PHỤ HUYNH IN "0,00 TRÊN 10" — thầy chụp lại 09/09.
//
// Mở đúng link đã gửi phụ huynh (`p#iiBopoadsq`, em Bùi Hồng Hân) trong một thẻ
// KHÔNG nằm trước mặt. Trang hiện:
//
//     0,00
//     trên 10
//     Khá
//     Phần I 3,38/4,50 · Phần II 3,00/4,00 · Phần III 1,50/1,50
//
// Ba dòng điểm phần cộng lại đúng 7,88 và xếp loại cũng tính từ 7,88 ⇒ DỮ LIỆU
// ĐÚNG, chỉ con số to là sai. Gói phiếu đọc từ máy chủ cũng ghi `diem: 7.88`.
//
// NGUYÊN NHÂN GỐC: `VongDiem` chạy số từ 0 lên bằng `requestAnimationFrame`, và
// `so` khởi tạo bằng 0. Trình duyệt DỪNG HẲN rAF khi thẻ không ở trước mặt, nên
// số đứng nguyên ở 0,00. Phụ huynh bấm link trong Zalo rồi chuyển sang việc
// khác là rơi đúng vào đây.
//
// `PhieuV3` đã bỏ vòng chạy số vì đúng lý do này từ 07/09, nhưng màn THẬT SỰ
// phục vụ link `/p#` là `PhieuScreen` thì chưa — nay bỏ nốt.
//
// PHÉP KIỂM QUYẾT ĐỊNH: dựng component trong đúng điều kiện thẻ nền — rAF KHÔNG
// BAO GIỜ chạy — rồi đòi con số phải đúng ngay. Phép kiểm soi chuỗi không bắt
// được lỗi này, vì chuỗi trong tệp lúc nào cũng "đúng".
import { describe, expect, it, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { VongDiem } from '../src/screens/PhieuScreen'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/** Thẻ NỀN: trình duyệt nhận lời hẹn rAF nhưng không bao giờ gọi lại. */
function theNen() {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
}

describe('điểm trên phiếu phụ huynh — thẻ NỀN vẫn phải đúng', () => {
  it('TÁI HIỆN CA THẬT: 7,88 hiện ngay cả khi rAF không bao giờ chạy', () => {
    theNen()
    render(<VongDiem diem={7.88} tat={false} />)
    expect(screen.getByText('7,88')).toBeTruthy()
    expect(screen.queryByText('0,00')).toBeNull()
  })

  it('KHÔNG gọi requestAnimationFrame nữa — không còn đường nào phụ thuộc nó', () => {
    const raf = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    render(<VongDiem diem={5.25} tat={false} />)
    expect(raf).not.toHaveBeenCalled()
  })

  it('điểm 0 THẬT vẫn in 0,00 — không nhầm "chưa chạy xong" với "được 0 điểm"', () => {
    theNen()
    render(<VongDiem diem={0} tat={false} />)
    expect(screen.getByText('0,00')).toBeTruthy()
  })

  it('máy tắt hiệu ứng (prefers-reduced-motion) vẫn đúng số', () => {
    theNen()
    render(<VongDiem diem={10} tat={true} />)
    expect(screen.getByText('10,00')).toBeTruthy()
  })

  it('số lẻ giữ đúng hai chữ số thập phân kiểu Việt', () => {
    theNen()
    render(<VongDiem diem={6.4} tat={false} />)
    expect(screen.getByText('6,40')).toBeTruthy()
  })

  it('vành tròn vẫn vẽ, và vẽ theo ĐÚNG điểm chứ không phải theo số đang chạy', () => {
    theNen()
    const { container } = render(<VongDiem diem={7.88} tat={true} />)
    const vong = container.querySelectorAll('circle')
    expect(vong.length).toBe(2)
    const off = Number(vong[1].getAttribute('stroke-dashoffset'))
    const C = 2 * Math.PI * 51
    // tat=true ⇒ hiện ngay trạng thái cuối: offset = C × (1 − 7,88/10)
    expect(Math.abs(off - C * (1 - 0.788))).toBeLessThan(0.01)
  })
})
