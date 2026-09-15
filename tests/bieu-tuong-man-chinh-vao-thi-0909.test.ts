// THÊM VÀO MÀN HÌNH CHÍNH RỒI MỞ RA LẠI VÀO APP GIÁO VIÊN — thầy báo 09/09
// 17:45, GIỮA CA THI, kèm video quay màn hình.
//
// Em làm ĐÚNG hướng dẫn của chính app ("Thêm app vào màn hình chính rồi mở lại
// từ đó"), bấm biểu tượng, và rơi vào màn quản lý của thầy.
//
// NGUYÊN NHÂN GỐC: `public/manifest.json` đặt `"start_url": "./"`, nên biểu
// tượng LUÔN mở `/omr-app/` TRẦN — mất sạch `/t/<mã ca>` mà em đã thêm từ đó.
// Mà `laManThayQuanLy()` coi `/` trần là app của thầy. Hai cái cộng lại: hướng
// dẫn của app dẫn em vào đúng ngõ cụt.
//
// SỬA: `/` trần hỏi máy "lần gần nhất máy này vào bằng vai nào". Máy từng vào
// thi thì `/` trần là màn thi. Máy chưa từng dùng GIỮ NGUYÊN hành vi cũ.
import { describe, expect, it, beforeEach } from 'vitest'
import { laManThayQuanLy, vaiDaDung, nhoVaiDaDung } from '../src/lib/vai-tro'

beforeEach(() => localStorage.clear())

describe('`/` trần đi theo vai máy này đã dùng', () => {
  it('MÁY CHƯA TỪNG DÙNG: `/` trần KHÔNG phải màn thầy', () => {
    // ĐỔI 15/09. Lỗi gốc tệp này canh (biểu tượng của em mở ra app giáo viên)
    // nay được chặn mạnh hơn hẳn: `/` trần KHÔNG dẫn tới app thầy cho BẤT KỲ
    // AI, không cần biết máy đã dùng vai nào. Thầy chốt: "app giáo viên khoá
    // cứng lại không thể chạm vào được bằng cách nào."
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
  })

  it('TÁI HIỆN LỖI: máy em đã vào thi ⇒ biểu tượng KHÔNG còn mở màn thầy', () => {
    nhoVaiDaDung('hs')
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
  })

  it('kể cả máy THẦY đã vào bằng ?vai=gv, `/` trần vẫn KHÔNG là màn thầy', () => {
    // ĐỔI 15/09: cờ trong localStorage không còn quyền quyết định gì. Nó là
    // khoá CHUNG GỐC của cả ba app — chính nó là cửa để hai cổng nhảy sang
    // nhau. Thầy vào app của mình bằng link `/gv`.
    nhoVaiDaDung('gv')
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
  })

  it('cờ chỉ quyết `/` TRẦN — đường có vai rõ ràng luôn thắng', () => {
    nhoVaiDaDung('hs')
    // Thầy gõ thẳng ?vai=gv trên chính máy đó vẫn vào được màn quản lý.
    expect(laManThayQuanLy('?vai=gv', '/omr-app/')).toBe(true)
    nhoVaiDaDung('gv')
    // Và em mở link thi trên máy thầy vẫn ra màn thi.
    expect(laManThayQuanLy('?examCode=522123', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('', '/omr-app/t/522123')).toBe(false)
  })

  it('đường của phụ huynh và màn xem điểm không đổi', () => {
    nhoVaiDaDung('gv')
    expect(laManThayQuanLy('?vai=phieu', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('?vai=diem&examCode=522123', '/omr-app/')).toBe(false)
  })
})

describe('vaiDaDung / nhoVaiDaDung', () => {
  it('chưa ghi thì null', () => {
    expect(vaiDaDung()).toBe(null)
  })

  it('ghi rồi đọc lại đúng', () => {
    nhoVaiDaDung('hs')
    expect(vaiDaDung()).toBe('hs')
    nhoVaiDaDung('gv')
    expect(vaiDaDung()).toBe('gv')
  })

  it('giá trị rác trong máy thì coi như chưa từng dùng, không vỡ', () => {
    localStorage.setItem('ddh.vaiDaDung', 'linh tinh')
    expect(vaiDaDung()).toBe(null)
    // ĐỔI 15/09: rác hay sạch đều không đổi gì — `/` trần không bao giờ là
    // màn thầy nữa.
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
  })
})

describe('main.tsx ghi cờ ở ĐÚNG lúc', () => {
  it('ghi khi đường vào NÓI RÕ vai, `/` trần không tự ghi gì', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/main.tsx'), 'utf8')
    expect(ma).toContain("if (dv.vai === 'gv') nhoVaiDaDung('gv')")
    expect(ma).toContain("else if (dv.maCa || dv.vai === 'diem') nhoVaiDaDung('hs')")
    // Ghi SAU khi chuẩn hoá đường dẫn, nếu không thì `/t/<mã>` chưa thành examCode.
    expect(ma.indexOf('chuanHoaDuongDan(')).toBeLessThan(ma.indexOf('nhoVaiDaDung('))
  })
})
