import { describe, expect, it, beforeEach } from 'vitest'
import { docDuongVao, laManThayQuanLy, nhoVaiDaDung, vaiDaDung } from '../src/lib/vai-tro'
import manifestHs from '../public/manifest-hs.json'
import manifestPh from '../public/manifest-ph.json'

beforeEach(() => {
  localStorage.clear()
})

describe('Sửa triệt để lỗi iOS thêm vào màn hình chính bị nhảy vào app giáo viên', () => {
  it('manifest học sinh có start_url trỏ tới cổng học sinh', () => {
    // ĐỔI 14/09: đường dẫn trần `./hoc-sinh` vẫn bắt app phải TRA localStorage
    // ở vài lối vào; app đã cài trên iOS có kho lưu riêng nên tra ra rỗng. Nay
    // vai nằm thẳng trong địa chỉ, không phụ thuộc kho lưu nào.
    //
    // ĐỔI TIẾP 14/09 lượt 12: vai chuyển từ THAM SỐ sang ĐƯỜNG DẪN (`./hs`).
    // Ý ĐỊNH của phép kiểm giữ nguyên — biểu tượng phải mở đúng cổng của em,
    // không bao giờ mở `/` trần — nhưng đường dẫn không bị Zalo hay trình rút
    // gọn cắt mất như phần sau dấu `?`. Xem `src/lib/khoa-vai.ts`.
    expect(manifestHs.start_url).toBe('./hs')
    expect(manifestHs.name).toContain('Học Sinh')
    expect(manifestHs.display).toBe('standalone')
  })

  it('manifest phụ huynh có start_url trỏ tới cổng phụ huynh', () => {
    expect(manifestPh.start_url).toBe('./ph')
    expect(manifestPh.name).toContain('Phụ Huynh')
    expect(manifestPh.display).toBe('standalone')
  })

  it('đường /hoc-sinh và /phu-huynh nhận đúng vai', () => {
    expect(docDuongVao('', '/hoc-sinh').vai).toBe('hocsinh')
    expect(docDuongVao('', '/phu-huynh').vai).toBe('phuhuynh')
  })

  // ĐỔI 15/09 — lỗi tệp này canh nay chặn ở CHỖ KHÁC, chắc hơn.
  //
  // Hai phép cũ đòi: máy đã nhớ vai 'hs'/'ph' thì `/` trần không phải màn thầy.
  // Cách ấy dựa vào một khoá localStorage CHUNG GỐC cho cả ba app — máy mở hai
  // cổng thì nó là của cổng mở sau, nên chính nó là cửa để hai cổng nhảy sang
  // nhau (thầy bắt được 15/09).
  //
  // Nay: biểu tượng của em mở THẲNG `/hs` (`start_url: './hs'`) nên không còn
  // rơi vào `/` trần; và `/` trần về app thầy thì cũng vô hại, vì app ấy đã
  // khoá cứng sau mã bí mật. Ý ĐỊNH giữ nguyên — em không vào được app thầy —
  // nhưng không còn phải đoán để đạt được điều đó.
  it('biểu tượng của em mở thẳng cổng của em, không qua `/` trần', () => {
    nhoVaiDaDung('hs')
    expect(manifestHs.start_url).toBe('./hs')
    expect(laManThayQuanLy('', '/hs')).toBe(false)
    expect(laManThayQuanLy('', '/omr-app/hs')).toBe(false)
  })

  it('biểu tượng của phụ huynh cũng vậy', () => {
    nhoVaiDaDung('ph')
    expect(manifestPh.start_url).toBe('./ph')
    expect(laManThayQuanLy('', '/ph')).toBe(false)
    expect(laManThayQuanLy('', '/omr-app/ph')).toBe(false)
  })

  it('cờ `vaiDaDung` KHÔNG còn quyền đổi kết quả của `/` trần', () => {
    nhoVaiDaDung('hs')
    const a = laManThayQuanLy('', '/')
    nhoVaiDaDung('ph')
    expect(laManThayQuanLy('', '/')).toBe(a)
    nhoVaiDaDung('gv')
    expect(laManThayQuanLy('', '/')).toBe(a)
  })

  it('mở có tham số ?vai=gv vẫn luôn thắng cờ', () => {
    nhoVaiDaDung('hs')
    expect(laManThayQuanLy('?vai=gv', '/omr-app/')).toBe(true)
  })
})
