/**
 * THẦN THÚ TRÊN TỜ CHIẾU LÊN BẢNG.
 *
 * Thầy chốt 15-09: *"nối thông tin hình ảnh của thú, cấp độ, các thông tin cần
 * thiết vào góc bên phải của mục chiếu lên bảng."*
 *
 * Luật cốt lõi của tệp này: **việc gọi em lên bảng không được phụ thuộc vào
 * một thứ trang trí.** Máy chủ chậm, mất mạng, hồ sơ hỏng, em chưa chọn thú —
 * tờ chiếu vẫn phải mở, chỉ thiếu con thú.
 */
// GỌN MÃ 06/10 (lần 2, docs/gon-ma-0610-lan-2.md): `src/lib/anh-than-thu.ts` (vẽ thú v1 ra ảnh, đọc hồ sơ cho tờ chiếu) và `he-thong-pet.ts` bị xoá — tờ chiếu nay lấy thú v2 qua `anh-than-thu-v2.ts`.
// Đã gỡ ĐÚNG ba khối dùng chúng ("Vẽ thú ra ảnh", "Ảnh 3D", "Đọc hồ sơ cho tờ chiếu"); khối "Tờ chiếu in ra góc thần thú" khoá `taoHtmlMayChieu` (mã còn sống) giữ NGUYÊN.
import { describe, it, expect } from 'vitest'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

function oMau(them: Partial<OBang> = {}): OBang {
  return {
    sbd: '12121212',
    hoTen: 'Nguyễn Văn A',
    soCau: 7,
    cau: { phan: 'I', text: 'Cho phản ứng nhiệt nhôm', luaChon: [], dapAn: 'A', loiGiai: '' } as unknown as OBang['cau'],
    ...them,
  }
}

describe('Tờ chiếu in ra góc thần thú', () => {
  const thu = {
    anh: 'data:image/png;base64,iVBORw0KGgo=',
    ten: 'Lôi Kim Thú Điện Cực',
    danhHieu: 'Chúa Tể Dãy Điện Hoá',
    he: 'Điện hoá',
    capDo: 6,
    hinhThai: 'Thức Tỉnh Hào Quang',
    tangThapCaoNhat: 14,
    soCauDaThanhTay: 27,
  }

  it('có thú thì in đủ tên, hình thái, tầng tháp và ẢNH', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(html).toContain('<aside class="mc-thu">')
    expect(html).toContain('Lôi Kim Thú Điện Cực')
    expect(html).toContain('Cấp 6/120')
    expect(html).toContain('Thức Tỉnh Hào Quang')
    expect(html).toContain('Tháp tầng 14')
    expect(html).toContain('thanh tẩy 27 câu')
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=')
  })

  it('KHÔNG có thú thì không chừa ô rỗng nào', () => {
    // CSS của góc thú luôn nằm trong tờ (một bản dùng chung); thứ phải vắng là
    // KHỐI ĐÁNH DẤU, không phải mấy dòng kiểu dáng.
    const html = taoHtmlMayChieu([oMau()])
    expect(html).not.toContain('<aside class="mc-thu">')
    expect(html).toContain('Nguyễn Văn A')     // tờ chiếu vẫn in đủ như cũ
  })

  it('vẽ được ảnh thì dùng thẻ img, không vẽ được thì dùng ô giữ chỗ', () => {
    const co = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(co).toContain('<img class="mc-thu-anh"')
    const khong = taoHtmlMayChieu([oMau({ thanThu: { ...thu, anh: '' } })])
    expect(khong).not.toContain('<img class="mc-thu-anh"')
    expect(khong).toContain('mc-thu-trong')
    expect(khong).toContain('Lôi Kim Thú Điện Cực')   // chữ vẫn in
  })

  it('tên thú có ký tự đặc biệt vẫn được thoát, không vỡ HTML', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: { ...thu, ten: '<script>x</script>' } })])
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('CSS của góc thú có mặt, và tiêu đề em thành hai cột', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(html).toContain('.mc-thu-anh')
    expect(html).toContain('.mc-em-trai')
  })
})
