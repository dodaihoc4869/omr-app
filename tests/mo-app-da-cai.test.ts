// MỞ APP ĐÃ CÀI phải vào ĐÚNG APP CỦA VAI.
//
// Lỗi đã dính: `start_url` của manifest là `?vai=hs&nguon=pwa` — không có token
// (token là của riêng từng em, không nhét vào file manifest chung được), mà
// docDuongVao lại đòi token hợp lệ mới nhận vai. Kết quả: em bấm biểu tượng app
// trên màn hình chính thì vào thẳng MÀN QUẢN LÝ CỦA THẦY.
import { beforeEach, describe, expect, it } from 'vitest'
import { docDuongVao, manDauCua, nhoVai, quenVai, vaiDaNho, xoaDauVetToken } from '../src/lib/vai-tro'
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
    xoaDauVetToken()
    expect(location.search).toBe('?vai=ph&nguon=pwa')
  })
})

describe('Nhớ vai trên máy em / máy phụ huynh', () => {
  it('nhớ rồi thì mở đường trống vẫn vào đúng app', () => {
    nhoVai('hs')
    expect(vaiDaNho(false)).toBe('hs')
  })

  it('MÁY THẦY (có mã bí mật) bỏ qua vai đã nhớ — thầy mở thử link phụ huynh không biến máy thầy thành máy phụ huynh', () => {
    nhoVai('ph')
    expect(vaiDaNho(true)).toBe(null)
  })

  it('không nhớ vai thầy', () => {
    nhoVai('gv')
    expect(vaiDaNho(false)).toBe(null)
  })

  it('quên vai thì về mặc định', () => {
    nhoVai('hs')
    quenVai()
    expect(vaiDaNho(false)).toBe(null)
  })

  it('chưa nhớ gì thì trả null, không đoán bừa', () => {
    expect(vaiDaNho(false)).toBe(null)
  })
})
