// MỞ APP ĐÃ CÀI phải vào ĐÚNG APP CỦA VAI.
//
// Lỗi đã dính: `start_url` của manifest là `?vai=hs&nguon=pwa` — không có token
// (token là của riêng từng em, không nhét vào file manifest chung được), mà
// docDuongVao lại đòi token hợp lệ mới nhận vai. Kết quả: em bấm biểu tượng app
// trên màn hình chính thì vào thẳng MÀN QUẢN LÝ CỦA THẦY.
import { beforeEach, describe, expect, it } from 'vitest'
import { chuanHoaDuongDan, docDuongVao, docVaiTuDuongDan, manDauCua, xoaDauVetToken } from '../src/lib/vai-tro'
import manifestHS from '../public/manifest-hs.json'
import manifestPH from '../public/manifest-ph.json'

const TOKEN = 'a'.repeat(32)

beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '/')
})

describe('Vai đọc từ đường link', () => {
  it('app đã cài (start_url, KHÔNG token) vẫn vào đúng app của vai', () => {
    for (const m of [manifestHS, manifestPH]) {
      const search = m.start_url.slice(m.start_url.indexOf('?'))
      expect(search).not.toContain('token')
      const d = docDuongVao(search)
      expect(d.vai).toBe(m === manifestHS ? 'hs' : 'ph')
    }
  })

  it('mở app học sinh KHÔNG rơi vào màn của thầy', () => {
    expect(manDauCua(docDuongVao('?vai=hs&nguon=pwa').vai!)).toBe('studentprofile')
    expect(manDauCua(docDuongVao('?vai=ph&nguon=pwa').vai!)).toBe('parent')
  })

  it('link riêng có token thì vẫn nhận token để lưu vào máy', () => {
    expect(docDuongVao(`?vai=hs&token=${TOKEN}`)).toEqual({ vai: 'hs', token: TOKEN, maCa: '' })
  })

  it('token BỊA trong link thì bỏ, không lưu vào máy — vai vẫn đúng', () => {
    for (const rac of ['abc', 'a'.repeat(31), 'a'.repeat(33), 'a'.repeat(31) + '!']) {
      const d = docDuongVao(`?vai=ph&token=${rac}`)
      expect(d.vai).toBe('ph')
      expect(d.token).toBe('')
    }
  })

  it('vai lạ thì không nhận', () => {
    expect(docDuongVao('?vai=admin').vai).toBe(null)
    expect(docDuongVao('').vai).toBe(null)
  })

  it('link vào thi thắng: mã ca vẫn đọc được kèm vai', () => {
    expect(docDuongVao('?vai=hs&examCode=123456').maCa).toBe('123456')
  })
})

// LỖI THẦY BÁO: bấm link riêng thì vào thẳng app quản lý của giáo viên, và vì
// không phải vai em/phụ huynh nên dải "Cài đặt" cũng không hiện ra.
// Gốc: public/404.html — thứ đổi /hs/<token> thành ?vai=hs&token=… — chỉ chạy
// khi GitHub Pages trả 404. Máy đã cài service worker thì mọi lần điều hướng
// được service worker trả thẳng index.html, 404.html KHÔNG BAO GIỜ chạy.
describe('Đọc vai TỪ ĐƯỜNG DẪN (service worker nuốt 404.html)', () => {
  it('/omr-app/hs/<token> → vai học sinh, lấy được token', () => {
    expect(docVaiTuDuongDan(`/omr-app/hs/${TOKEN}`)).toEqual({ vai: 'hs', token: TOKEN, maCa: '' })
  })

  it('/omr-app/ph/<token> → vai phụ huynh, có hay không dấu / cuối đều được', () => {
    expect(docVaiTuDuongDan(`/omr-app/ph/${TOKEN}`).vai).toBe('ph')
    expect(docVaiTuDuongDan(`/omr-app/ph/${TOKEN}/`).token).toBe(TOKEN)
  })

  it('/omr-app/gv → vai thầy', () => {
    expect(docVaiTuDuongDan('/omr-app/gv').vai).toBe('gv')
    expect(docVaiTuDuongDan('/omr-app/gv/').vai).toBe('gv')
  })

  it('/omr-app/t/<mã ca> → mã ca, để link vào thi mở được cả khi mất mạng', () => {
    expect(docVaiTuDuongDan('/omr-app/t/984033')).toEqual({ vai: null, token: '', maCa: '984033' })
  })

  it('đường thường thì không đoán ra vai', () => {
    for (const d of ['/omr-app/', '/omr-app/index.html', '/', '/omr-app/hs/abc', `/omr-app/hs/${TOKEN}x`]) {
      expect(docVaiTuDuongDan(d).vai).toBe(null)
    }
  })

  it('docDuongVao lấy vai từ đường dẫn khi không có tham số — ĐÚNG LỖI ĐÃ BÁO', () => {
    const d = docDuongVao('', `/omr-app/hs/${TOKEN}`)
    expect(d.vai).toBe('hs')
    expect(d.token).toBe(TOKEN)
    expect(manDauCua(d.vai!)).not.toBe('examhub')
  })

  it('tham số truy vấn thắng đường dẫn (404.html đã chuyển hướng rồi)', () => {
    expect(docDuongVao('?vai=ph', `/omr-app/hs/${TOKEN}`).vai).toBe('ph')
  })

  it('mã ca trên đường dẫn mở thẳng màn thi', () => {
    expect(docDuongVao('', '/omr-app/t/760435').maCa).toBe('760435')
  })
})

// Chuẩn hoá NGAY khi app khởi động, để mọi màn chỉ thấy một dạng URL. Màn vào
// thi đọc ?examCode= để tự điền 6 ô mã ca — bỏ bước này là em phải gõ tay mã ca
// dù đã bấm đúng link mời.
describe('chuanHoaDuongDan — đổi đường dẫn thành tham số truy vấn', () => {
  it('/t/<mã ca> → ?examCode=, để màn vào thi tự điền mã ca', () => {
    history.replaceState(null, '', '/omr-app/t/984033')
    chuanHoaDuongDan('/omr-app/')
    expect(location.pathname).toBe('/omr-app/')
    expect(new URLSearchParams(location.search).get('examCode')).toBe('984033')
  })

  it('/hs/<token> → ?vai=hs&token=', () => {
    history.replaceState(null, '', `/omr-app/hs/${TOKEN}`)
    chuanHoaDuongDan('/omr-app/')
    const q = new URLSearchParams(location.search)
    expect(q.get('vai')).toBe('hs')
    expect(q.get('token')).toBe(TOKEN)
  })

  it('giữ nguyên tham số sẵn có, ví dụ ?api=', () => {
    history.replaceState(null, '', '/omr-app/t/123456?api=https%3A%2F%2Fvi.du%2Fexec')
    chuanHoaDuongDan('/omr-app/')
    const q = new URLSearchParams(location.search)
    expect(q.get('api')).toBe('https://vi.du/exec')
    expect(q.get('examCode')).toBe('123456')
  })

  it('đường thường thì không đụng vào', () => {
    history.replaceState(null, '', '/omr-app/?vai=ph&nguon=pwa')
    chuanHoaDuongDan('/omr-app/')
    expect(location.pathname + location.search).toBe('/omr-app/?vai=ph&nguon=pwa')
  })
})

describe('Dọn thanh địa chỉ', () => {
  it('xoá TOKEN nhưng GIỮ vai — kéo tải lại trong app không rơi về màn thầy', () => {
    history.replaceState(null, '', `/omr-app/?vai=hs&token=${TOKEN}&nguon=pwa`)
    xoaDauVetToken()
    expect(location.search).not.toContain(TOKEN)
    expect(location.search).not.toContain('token')
    expect(docDuongVao(location.search).vai).toBe('hs')
    expect(location.search).toContain('nguon=pwa')
  })

  it('không có token thì không đụng vào thanh địa chỉ', () => {
    history.replaceState(null, '', '/omr-app/?vai=ph&nguon=pwa')
    xoaDauVetToken('/omr-app/')
    expect(location.search).toBe('?vai=ph&nguon=pwa')
  })

  it('token nằm TRÊN ĐƯỜNG DẪN cũng phải dọn, và giữ lại vai', () => {
    history.replaceState(null, '', `/omr-app/hs/${TOKEN}`)
    xoaDauVetToken('/omr-app/')
    expect(location.pathname).toBe('/omr-app/')
    expect(location.href).not.toContain(TOKEN)
    expect(docDuongVao(location.search, location.pathname).vai).toBe('hs')
  })

  it('link vào thi trên đường dẫn thì để nguyên — không có gì bí mật', () => {
    history.replaceState(null, '', '/omr-app/t/984033')
    xoaDauVetToken('/omr-app/')
    expect(location.pathname).toBe('/omr-app/t/984033')
  })
})

// VAI CHỈ ĐẾN TỪ ĐƯỜNG LINK. Trước có cơ chế nhớ vai trong localStorage để mở
// đường trống vẫn vào đúng app; đã bỏ theo đúng nguyên tắc "localStorage chỉ
// dùng để điền sẵn, KHÔNG dùng để điều hướng". Đường trống nay hiện MÀN CỬA VÀO
// ba vai trò (CuaVaoScreen) chứ không đoán bừa.
describe('Đường trống thì không đoán vai', () => {
  it('không có tham số, không có đường dẫn đặc biệt → vai null', () => {
    expect(docDuongVao('', '/omr-app/').vai).toBe(null)
    expect(docDuongVao('?nguon=pwa', '/omr-app/').vai).toBe(null)
  })
})
