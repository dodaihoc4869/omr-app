// "GIỮ ĐỂ ĐỌC" KHÔNG CHẠY TRÊN MỘT SỐ IPHONE — thầy báo 09/09:
// "một số iphone không hoạt động mặc dù tôi đã bật. Android và một số iphone
// khác hoạt động bình thường."
//
// NGUYÊN NHÂN GỐC: cơ chế bật hay không hoàn toàn dựa vào LỜI KHAI của máy —
// `navigator.maxTouchPoints > 0`. Khai 0 là màn hình `return` ngay, không gắn
// một tai nghe nào, và im lặng: không báo lỗi, không dấu vết.
//
// Con số đó CÓ THỂ bằng 0 trên chính iPhone. Safari bật "Yêu cầu trang web dành
// cho máy tính" thì giả làm Safari máy Mac: `maxTouchPoints` về 0 và
// `ontouchstart` không tồn tại. Bài vẫn làm được bình thường (chạm thành click)
// nên em không thấy gì lạ — chỉ riêng "giữ để đọc" không chạy. Đúng hình dạng
// thầy mô tả: cùng là iPhone, máy chạy máy không.
//
// SỬA GỐC: đừng hỏi máy, HỎI BẰNG CHỨNG. Một `touchstart` thật là chứng cứ
// không cãi được, và không lời khai nào giả được nó. Máy tính để bàn không bao
// giờ bắn `touchstart` nên vẫn không bị bật nhầm.
//
// KÈM THEO: từ nay luôn gửi hai con số tắt đề khi cơ chế CÓ CHẠY, kể cả khi
// bằng 0 — để lần sau thầy hỏi "máy nào không chạy" thì đọc được từ dữ liệu
// chứ không phải đoán như lần này.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { coCamUng, coCamUngThat, coMat, chamXuong, chamLen, moTrangThaiGiu } from '../src/lib/giu-de-doc'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

describe('coCamUng — không chỉ tin mỗi maxTouchPoints', () => {
  it('máy khai maxTouchPoints > 0 thì nhận ngay (đường cũ, không được mất)', () => {
    expect(coCamUng({ maxTouchPoints: 5 }, {})).toBe(true)
  })

  it('CỐ Ý KHÔNG hỏi ontouchstart — Chrome máy tính cũng có nó', () => {
    // Hỏi `'ontouchstart' in window` là bật nhầm cơ chế ở máy tính. Bản vá đầu
    // của tôi có hỏi, và phép kiểm cũ `giu-de-doc.test.ts` mục 8 bắt được ngay.
    expect(coCamUng({ maxTouchPoints: 0 }, { ontouchstart: null, matchMedia: () => ({ matches: false }) })).toBe(false)
  })

  it('khai 0, không ontouchstart, nhưng con trỏ THÔ thì vẫn là máy cảm ứng', () => {
    expect(coCamUng({ maxTouchPoints: 0 }, { matchMedia: () => ({ matches: true }) })).toBe(true)
  })

  it('máy tính thật: khai 0, không chạm, con trỏ mịn ⇒ KHÔNG bật', () => {
    expect(coCamUng({ maxTouchPoints: 0 }, { matchMedia: () => ({ matches: false }) })).toBe(false)
  })

  it('matchMedia ném lỗi thì coi như không có, KHÔNG làm sập màn thi', () => {
    expect(
      coCamUng({ maxTouchPoints: 0 }, {
        matchMedia: () => {
          throw new Error('hỏng')
        },
      }),
    ).toBe(false)
  })
})

describe('coCamUngThat — bằng chứng thắng lời khai', () => {
  it('IPHONE KHAI DỐI (chế độ máy tính): khai 0 nhưng đã có cú chạm ⇒ BẬT', () => {
    expect(coCamUngThat(true, false)).toBe(true)
  })

  it('máy khai đúng thì chạy ngay từ giây đầu, không phải đợi chạm', () => {
    expect(coCamUngThat(false, true)).toBe(true)
  })

  it('máy tính để bàn: không khai, không bao giờ chạm ⇒ KHÔNG bật', () => {
    expect(coCamUngThat(false, false)).toBe(false)
  })
})

describe('TÁI HIỆN ĐÚNG CA IPHONE KHAI DỐI, chạy qua lõi thật', () => {
  const anHanMs = 3000

  it('trước bản vá: khai 0 ⇒ đề KHÔNG BAO GIỜ tắt dù đã nhả tay rất lâu', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 10, 10, 0)
    chamLen(tt, 1, 100)
    // Lời khai cũ là thứ duy nhất được hỏi ⇒ luôn "có mặt".
    expect(coMat(tt, 100_000, { coCamUng: false, dangGoO: false, anHanMs })).toBe(true)
  })

  it('sau bản vá: cùng máy đó, đã thấy cú chạm ⇒ nhả tay quá ân hạn là TẮT', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 10, 10, 0)
    chamLen(tt, 1, 100)
    const co = coCamUngThat(true, false)
    expect(coMat(tt, 100, { coCamUng: co, dangGoO: false, anHanMs })).toBe(true) // còn ân hạn
    expect(coMat(tt, 100 + anHanMs + 1, { coCamUng: co, dangGoO: false, anHanMs })).toBe(false)
  })

  it('tay CÒN trên màn thì không tắt, dù đã bật bằng bằng chứng', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 10, 10, 0)
    expect(tt.ngon.length).toBe(1)
    expect(coMat(tt, 100_000, { coCamUng: coCamUngThat(true, false), dangGoO: false, anHanMs })).toBe(true)
  })
})

describe('màn thi nối đúng dây', () => {
  it('KHÔNG còn `return` sớm theo lời khai của máy', () => {
    expect(MAN).not.toContain('if (!coCamUng()) return')
  })

  it('cú chạm đầu tiên bật cờ bằng chứng', () => {
    expect(MAN).toContain('daThayCham = true')
    expect(MAN).toContain('const khaiCoCamUng = coCamUng()')
  })

  it('lõi được hỏi bằng `coCamUngThat`, không phải hằng `true`', () => {
    expect(MAN).toContain('coCamUng: coCamUngThat(daThayCham, khaiCoCamUng),')
    expect(MAN).not.toContain('coCamUng: true, dangGoO')
  })

  it('hai con số tắt đề gửi lên kể cả khi bằng 0, miễn cơ chế CÓ CHẠY', () => {
    expect(MAN).toContain('const integrity = dem.coChay ?')
    expect(MAN).not.toContain('const integrity = dem.soLan > 0 ?')
  })

  it('cờ `coChay` bật đúng lúc thấy chạm, không bật sẵn', () => {
    expect(MAN).toContain('useRef({ soLan: 0, giay: 0, coChay: false })')
    expect(MAN).toContain('demTatDe.current.coChay = true')
  })
})
