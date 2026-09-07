// CỔNG DANH SÁCH LỚP Ở LỆNH VÀO THI — thầy báo 07/09.
//
// "Có hai học sinh hôm nay đúng số báo danh, nhập đúng tên năm sinh nhưng báo
// là thông tin không đúng: Phạm Thành Nam 2009, Nguyễn Thành Đồng 2009."
//
// Đối chiếu ba nguồn (bảng chủ đã xuất bản, sheet DanhSachLop, bản sao trong
// máy thầy) thì dòng của cả hai em ĐỀU ĐÚNG: 12034 Phạm Thành Nam 2009 và
// 12042 Nguyễn Thành Đồng 2009. Vậy lệch nằm ở CHUỖI EM GÕ, mà bản cũ không
// giữ lại gì để lần ra.
//
// Hai việc phải khoá từ đây:
//   1. Chuẩn hoá tên phải nuốt được các bẫy "nhìn y hệt mà khác mã": chữ eth
//      ð Ð lẫn với đ Đ, ký tự tàng hình, dấu câu thừa, dính chữ.
//      Nhưng KHÔNG được nới tới mức hai em khác nhau cùng vào được.
//   2. Mỗi lượt bị chặn phải để lại bằng chứng cho thầy đọc.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { moTaLyDoChan } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

/** Lấy nguyên văn một hàm trong tệp .gs rồi chạy thật — kiểm chính đoạn mã sẽ
 * dán lên máy chủ, không kiểm một bản chép tay của nó. */
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

const chay = new Function(`${layHam('chuanTen_')}\n${layHam('tenKhopNhau_')}\nreturn { chuanTen_, tenKhopNhau_ }`)() as {
  chuanTen_: (v: unknown) => string
  tenKhopNhau_: (a: unknown, b: unknown) => boolean
}
const { chuanTen_, tenKhopNhau_ } = chay

describe('chuanTen_ — bẫy "nhìn y hệt mà khác mã"', () => {
  it('bỏ dấu và thường hoá như cũ', () => {
    expect(chuanTen_('Nguyễn Thành Đồng')).toBe('nguyen thanh dong')
    expect(chuanTen_('PHẠM THÀNH NAM')).toBe('pham thanh nam')
    expect(chuanTen_('pham thanh nam')).toBe('pham thanh nam')
  })

  it('chữ eth ð Ð (U+00F0 / U+00D0) về cùng một chữ với đ Đ', () => {
    // Ð và Đ hiện lên màn hình GIỐNG HỆT nhau. Bản cũ chỉ đổi U+0110 nên em gõ
    // trúng eth là trượt cổng, mà thầy soi vào danh sách không thấy sai chỗ nào.
    expect(chuanTen_('Nguyễn Thành Ðồng')).toBe(chuanTen_('Nguyễn Thành Đồng'))
    expect(chuanTen_('ðỗ Quốc Tư')).toBe(chuanTen_('đỗ Quốc Tư'))
  })

  it('nuốt ký tự tàng hình: zero-width space, word joiner, BOM, soft hyphen', () => {
    for (const bay of ['​', '‌', '‍', '⁠', '﻿', '­']) {
      expect(chuanTen_(`Phạm${bay} Thành Nam`)).toBe('pham thanh nam')
      expect(chuanTen_(`Phạm Thành Nam${bay}`)).toBe('pham thanh nam')
    }
  })

  it('bỏ dấu câu thừa em gõ kèm', () => {
    expect(chuanTen_('Nguyễn Thành Đồng.')).toBe('nguyen thanh dong')
    expect(chuanTen_('Nguyen-Thanh-Dong')).toBe('nguyen thanh dong')
    expect(chuanTen_("Nguyễn Thành Đồng'")).toBe('nguyen thanh dong')
  })
})

describe('tenKhopNhau_ — nới ĐÚNG chỗ, không nới quá', () => {
  it('khớp khi em gõ dính chữ hoặc thừa khoảng trắng', () => {
    expect(tenKhopNhau_('NguyễnThànhĐồng', 'Nguyễn Thành Đồng')).toBe(true)
    expect(tenKhopNhau_('Nguyễn  Thành   Đồng', 'Nguyễn Thành Đồng')).toBe(true)
    expect(tenKhopNhau_('  phạm thành nam  ', 'Phạm Thành Nam')).toBe(true)
  })

  it('HAI EM KHÁC NHAU VẪN PHẢI BỊ CHẶN', () => {
    // Đây là ranh giới. Trong danh sách 2009 có cả "Phạm Thành Nam" (12034) và
    // "Triệu Thành Nam" (12037) — nới thêm một bậc "gần giống" nữa là hai em
    // này vào được bằng số báo danh của nhau.
    expect(tenKhopNhau_('Triệu Thành Nam', 'Phạm Thành Nam')).toBe(false)
    expect(tenKhopNhau_('Thành Nam', 'Phạm Thành Nam')).toBe(false)
    expect(tenKhopNhau_('Phạm Thành Nam', 'Phạm Thành Nam Anh')).toBe(false)
    expect(tenKhopNhau_('', 'Phạm Thành Nam')).toBe(false)
  })

  it('SAI DẤU thì VẪN CHO QUA — đó là luật cũ, cố ý giữ', () => {
    // "Đồng" và "Đông" cùng về "dong". Đây không phải lỗ hổng mới: cổng này
    // bỏ dấu từ đầu vì em gõ tên mình trên điện thoại, sai một dấu là trượt —
    // mục đích của nó là chặn gõ nhầm số báo danh và chặn em lạ, không phải
    // làm mật khẩu. Ghi ra đây để lần sau không ai "sửa" nhầm thành chặt hơn.
    expect(tenKhopNhau_('Nguyễn Thành Đông', 'Nguyễn Thành Đồng')).toBe(true)
    expect(tenKhopNhau_('Nguyen Thanh Dong', 'Nguyễn Thành Đồng')).toBe(true)
  })
})

describe('nhật ký bị chặn', () => {
  it('cổng vào thi ghi lại CẢ HAI kiểu chặn', () => {
    const doan = GS.slice(GS.indexOf('const coDs = coDanhSachHocSinh_()'))
    expect(doan).toContain("'lech_ho_ten'")
    expect(doan).toContain("'lech_nam_sinh'")
    expect(doan).toContain("'khong_co_sbd'")
    // Cổng phải dùng hàm so mới, không so bằng hai chuỗi thô như bản cũ.
    expect(doan).toContain('tenKhopNhau_(body.hoTen, dong.hoTen)')
  })

  it('ghi nhật ký hỏng KHÔNG được chặn em vào thi', () => {
    // Em đang đứng chờ; nhật ký là chuyện phụ. Hàm phải bọc try/catch.
    const ham = layHam('ghiChanVao_')
    expect(ham).toContain('try {')
    expect(ham).toContain('catch (err)')
  })

  it('chiTietCa trả nhật ký về cho màn Theo dõi', () => {
    expect(GS).toContain('biChan: docChanVao_(maCa)')
  })

  it('mỗi lý do có một câu tiếng Việt nói rõ sai ở đâu', () => {
    expect(moTaLyDoChan('khong_co_sbd')).toMatch(/không có trong danh sách/i)
    expect(moTaLyDoChan('lech_ho_ten')).toMatch(/họ tên/i)
    expect(moTaLyDoChan('lech_nam_sinh')).toMatch(/năm sinh/i)
    expect(moTaLyDoChan('gi_do_la')).toMatch(/không khớp/i)
  })
})
