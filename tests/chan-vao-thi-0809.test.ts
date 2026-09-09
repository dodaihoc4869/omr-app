// 17/36 EM BỊ CHẶN Ở CA 447479 — thầy báo tối 08/09.
//
// "17 bạn học sinh/ 36 bạn bị lỗi này mặc dù đã có tên và sbd chuẩn."
//
// BẰNG CHỨNG ĐỌC TỪ MÁY CHỦ (sổ ChanVao của ca 447479, 40 dòng, 24 số báo danh):
//   · `hoTenGoi` RỖNG ở 37/40 dòng
//   · `namSinhGoi` RỖNG ở 40/40 dòng
//   · lý do: lech_ho_ten 33 · lech_nam_sinh 3 · khong_co_sbd 4
//
// Không em nào gõ sai. Máy em gửi lên CHUỖI RỖNG, còn máy chủ đem chuỗi rỗng đi
// so với tên trong danh sách rồi kết luận là lệch.
//
// Gốc: 07/09 gỡ hai ô họ tên và năm sinh khỏi màn vào thi, thay bằng xác nhận
// bằng mắt. Từ đó cổng chỉ mở bằng `xacNhanTen`. Nhưng `handleJoin` còn một lối
// vào KHÔNG qua bước xác nhận — phím Enter trong ô số báo danh — và ở lối đó
// client gửi `xacNhanTen: false` cùng hai chuỗi rỗng.
//
// Sửa hai tầng, tệp này khoá cả hai.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { moTaLyDoChan } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

/** Lấy nguyên văn một hàm trong .gs rồi chạy thật — kiểm chính đoạn mã sẽ dán
 * lên máy chủ, không kiểm một bản chép tay của nó. */
function layHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten} trong apps-script-kiem-tra.gs`)
  let sau = dau
  let ngoac = 0
  let daVao = false
  while (sau < GS.length) {
    const c = GS[sau]
    if (c === '{') {
      ngoac++
      daVao = true
    } else if (c === '}') {
      ngoac--
      if (daVao && ngoac === 0) return GS.slice(dau, sau + 1)
    }
    sau++
  }
  throw new Error(`Hàm ${ten} không đóng ngoặc`)
}

type Ket = { tenKhop: boolean; namKhop: boolean; khongGuiGi: boolean }
type Goi = { hoTen?: string; namSinh?: string; xacNhanTen?: boolean }
type Dong = { hoTen?: string; namSinh?: string }

const khop = new Function(
  `${layHam('chuanTen_')}\n${layHam('chuanNamSinh_')}\n${layHam('tenKhopNhau_')}\n${layHam('khopHoSoDanhSach_')}\nreturn khopHoSoDanhSach_`,
)() as (body: Goi, dong: Dong) => Ket

const qua = (k: Ket) => k.tenKhop && k.namKhop

// Ba dòng THẬT lấy nguyên từ sổ ChanVao của ca 447479.
const BA_DONG_THAT = [
  { sbd: '12006', hoTenDs: 'Nguyễn Công Huy', namSinhDs: '2009', lyDoCu: 'lech_ho_ten' },
  { sbd: '12044', hoTenDs: 'Nguyễn Ngọc Thuận', namSinhDs: '2009', lyDoCu: 'lech_ho_ten' },
  { sbd: '12036', hoTenDs: 'Nguyễn Hồng Sơn', namSinhDs: '2009', lyDoCu: 'lech_ho_ten' },
]

describe('MÁY CHỦ: không gửi thì không có gì để so', () => {
  it('TÁI HIỆN ĐÚNG BA DÒNG THẬT — máy gửi rỗng thì em PHẢI vào được', () => {
    for (const d of BA_DONG_THAT) {
      const k = khop({ hoTen: '', namSinh: '', xacNhanTen: false }, { hoTen: d.hoTenDs, namSinh: d.namSinhDs })
      expect(qua(k), `${d.sbd} ${d.hoTenDs} vẫn bị chặn`).toBe(true)
      // Vẫn phải để lại dấu vết cho thầy: em qua cổng vì máy không gửi gì.
      expect(k.khongGuiGi).toBe(true)
    }
  })

  it('BA DÒNG lech_nam_sinh: có tên nhớ sẵn nhưng không có năm sinh, vẫn phải vào được', () => {
    const k = khop({ hoTen: 'Bùi Hồng Hân', namSinh: '', xacNhanTen: false }, { hoTen: 'Bùi Hồng Hân', namSinh: '2009' })
    expect(qua(k)).toBe(true)
    // Có gửi tên nên KHÔNG phải "không gửi gì".
    expect(k.khongGuiGi).toBe(false)
  })

  it('đã xác nhận bằng mắt thì qua, kể cả khi không gửi tên', () => {
    const k = khop({ hoTen: '', namSinh: '', xacNhanTen: true }, { hoTen: 'Nguyễn Công Huy', namSinh: '2009' })
    expect(qua(k)).toBe(true)
    expect(k.khongGuiGi).toBe(false)
  })

  it('CỔNG KHÔNG YẾU ĐI: em GỬI tên mà lệch thật thì vẫn chặn', () => {
    const k = khop({ hoTen: 'Trần Văn Bình', namSinh: '2009', xacNhanTen: false }, { hoTen: 'Nguyễn Công Huy', namSinh: '2009' })
    expect(k.tenKhop).toBe(false)
  })

  it('CỔNG KHÔNG YẾU ĐI: em GỬI năm sinh mà lệch thật thì vẫn chặn', () => {
    const k = khop({ hoTen: 'Nguyễn Công Huy', namSinh: '2008', xacNhanTen: false }, { hoTen: 'Nguyễn Công Huy', namSinh: '2009' })
    expect(k.namKhop).toBe(false)
  })

  it('ô trong DANH SÁCH trống thì không lấy làm cớ chặn (vế cũ, không được mất)', () => {
    expect(qua(khop({ hoTen: 'Ai Đó', namSinh: '2009' }, { hoTen: '', namSinh: '2009' }))).toBe(true)
    expect(qua(khop({ hoTen: 'Nguyễn Công Huy', namSinh: '2008' }, { hoTen: 'Nguyễn Công Huy', namSinh: '' }))).toBe(true)
  })

  it('bẫy chuẩn hoá tên cũ vẫn nuốt được (không nới, không siết)', () => {
    const ds = { hoTen: 'Nguyễn Thành Đồng', namSinh: '2009' }
    // chữ eth ð thay cho đ
    expect(qua(khop({ hoTen: 'Nguyễn Thành Ðồng', namSinh: '2009' }, ds))).toBe(true)
    // ký tự tàng hình
    expect(qua(khop({ hoTen: 'Nguyễn​Thành Đồng', namSinh: '2009' }, ds))).toBe(true)
    // gõ dính
    expect(qua(khop({ hoTen: 'NguyễnThànhĐồng', namSinh: '2009' }, ds))).toBe(true)
    // em KHÁC thì vẫn chặn
    expect(khop({ hoTen: 'Trần Quốc Bảo', namSinh: '2009' }, ds).tenKhop).toBe(false)
  })

  it('GIỚI HẠN ĐÃ BIẾT, khai thẳng: tên chỉ khác DẤU THANH thì cổng coi là một', () => {
    // `chuanTen_` cố ý bỏ dấu thanh để nuốt bẫy "nhìn y hệt mà khác mã" (chữ eth,
    // ký tự tàng hình, bản chuyển mã). Cái giá: "Đông" và "Đồng" cùng ra "dong".
    // KHÔNG siết lại: siết là hồi sinh đúng lỗi 07/09 (hai em gõ đúng vẫn bị chặn),
    // trong khi cổng tên nay chỉ còn là lưới dự phòng — client bắt em nhìn tên
    // trên màn xác nhận rồi mới cho bấm Bắt đầu.
    const ds = { hoTen: 'Nguyễn Thành Đồng', namSinh: '2009' }
    expect(khop({ hoTen: 'Nguyễn Thành Đông', namSinh: '2009' }, ds).tenKhop).toBe(true)
  })

  it('năm sinh dạng ngày trong Sheet vẫn đọc ra 4 chữ số', () => {
    expect(qua(khop({ hoTen: 'A', namSinh: '01/01/2009' }, { hoTen: 'A', namSinh: '2009' }))).toBe(true)
  })
})

describe('MÁY EM: mọi lối vào đều phải qua màn xác nhận', () => {
  it('HÀNG RÀO TẠI NGUỒN trong handleJoin — chưa xác nhận thì quay về bước 1', () => {
    expect(MAN).toContain("if (!laXemDiem && !xacNhan) return void traTenRoiHoi()")
  })

  it('phím Enter KHÔNG còn gọi thẳng handleJoin', () => {
    expect(MAN).not.toContain("if (e.key === 'Enter') handleJoin()")
  })

  // VIẾT LẠI 09/09 17:34, KHÔNG XOÁ LẶNG. Bản cũ đòi phím Enter "tôn trọng điều
  // kiện toàn màn hình". Điều kiện đó nay đã GỠ khỏi cả nút lẫn phím Enter: trên
  // iPhone mở link từ Zalo thì không có đường nào đạt được toàn màn hình, nên nó
  // chặn đúng những em ngoan nhất (bấm thẳng link thầy gửi) mà không chặn được
  // ai gian lận. Xem `tests/vao-thi-tu-zalo-iphone-0909.test.ts`.
  //
  // Ý ĐỊNH của phép kiểm cũ vẫn giữ nguyên và là phần quan trọng hơn: phím Enter
  // phải đi ĐÚNG ĐƯỜNG của nút (qua màn xác nhận tên), không gọi tắt.
  it('phím Enter đi đúng đường của nút, và cùng điều kiện với nút', () => {
    const than = MAN.slice(MAN.indexOf('placeholder="Số báo danh"'), MAN.indexOf('placeholder="Số báo danh"') + 1100)
    expect(than).toContain('if (laXemDiem || dangTraTen) return')
    expect(than).toContain('void traTenRoiHoi()')
    // Cùng điều kiện với nút — lệch nhau là em bấm được mà gõ Enter thì không.
    expect(MAN).toContain('disabled={dangTraTen}>')
  })

  it('gói gửi máy chủ vẫn mang xacNhanTen', () => {
    expect(MAN).toContain('xacNhanTen: xacNhan !== null')
  })
})

describe('THẦY ĐỌC ĐƯỢC lý do mới', () => {
  it('khong_gui_ten có chữ, và nói rõ em VẪN VÀO ĐƯỢC', () => {
    const s = moTaLyDoChan('khong_gui_ten')
    expect(s).not.toBe('khong_gui_ten')
    expect(s).toContain('vẫn vào được')
  })

  it('ba lý do cũ giữ nguyên chữ', () => {
    expect(moTaLyDoChan('khong_co_sbd')).toContain('không có trong danh sách')
    expect(moTaLyDoChan('lech_ho_ten')).toContain('Họ tên')
    expect(moTaLyDoChan('lech_nam_sinh')).toContain('Năm sinh')
  })
})
