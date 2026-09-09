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
// PHÉP KIỂM QUYẾT ĐỊNH: đọc con số NGAY SAU KHI DỰNG, lúc chưa có nhịp hình nào
// chạy. Đó đúng là tình cảnh thẻ nền. Bản cũ khởi tạo 0 và chỉ nhích lên trong
// nhịp `requestAnimationFrame` nên ở mốc này còn 0,00; bản mới vẽ thẳng số.
//
// CỐ Ý KHÔNG thay thế `requestAnimationFrame` toàn cục: `vi.stubGlobal` rò sang
// tệp khác cùng luồng chạy và làm đỏ những phép kiểm chẳng liên quan — bản đầu
// của tệp này làm thế và đã hạ cả bộ kiểm trên CI trong khi máy tôi vẫn xanh.
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { VongDiem } from '../src/screens/PhieuScreen'

afterEach(cleanup)

describe('điểm trên phiếu phụ huynh — đúng ngay từ nhịp vẽ đầu', () => {
  it('TÁI HIỆN CA THẬT: 7,88 hiện ngay, không chờ nhịp hình nào', () => {
    render(<VongDiem diem={7.88} tat={false} />)
    expect(screen.getByText('7,88')).toBeTruthy()
    expect(screen.queryByText('0,00')).toBeNull()
  })

  it('điểm 0 THẬT vẫn in 0,00 — không nhầm "chưa chạy xong" với "được 0 điểm"', () => {
    render(<VongDiem diem={0} tat={false} />)
    expect(screen.getByText('0,00')).toBeTruthy()
  })

  it('máy tắt hiệu ứng (prefers-reduced-motion) vẫn đúng số', () => {
    render(<VongDiem diem={10} tat={true} />)
    expect(screen.getByText('10,00')).toBeTruthy()
  })

  it('số lẻ giữ đúng hai chữ số thập phân kiểu Việt', () => {
    render(<VongDiem diem={6.4} tat={false} />)
    expect(screen.getByText('6,40')).toBeTruthy()
  })

  it('KHÔNG còn chữ requestAnimationFrame nào trong mã màn phiếu', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')
    // Bỏ phần ghi chú rồi mới soi — ghi chú CÓ nhắc tên hàm, và nhắc là đúng.
    const khongGhiChu = ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(khongGhiChu).not.toContain('requestAnimationFrame')
    expect(khongGhiChu).not.toContain('cancelAnimationFrame')
  })

  it('vành tròn vẫn vẽ, và vẽ theo ĐÚNG điểm chứ không theo số đang chạy', () => {
    const { container } = render(<VongDiem diem={7.88} tat={true} />)
    const vong = container.querySelectorAll('circle')
    expect(vong.length).toBe(2)
    const off = Number(vong[1].getAttribute('stroke-dashoffset'))
    const C = 2 * Math.PI * 51
    // tat=true ⇒ hiện ngay trạng thái cuối: offset = C × (1 − 7,88/10)
    expect(Math.abs(off - C * (1 - 0.788))).toBeLessThan(0.01)
  })
})
