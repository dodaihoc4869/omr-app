// ĐƯỜNG VÀO APP — repo này CHỈ còn app của thầy.
//
// App học sinh và app phụ huynh đã tách sang hai repo riêng (TACHAPPHSPH.md),
// nên ở đây không còn `/hs/<token>`, `/ph/<token>`, `?vai=hs`, `?vai=ph`.
// Còn đúng hai đường:
//   /gv        → app giáo viên
//   /t/<mã ca> → màn LÀM BÀI, giữ lại để lớp vẫn thi và làm bài tập được
//                trong lúc app học sinh mới chưa xong.
//
// Vì sao phải test đường dẫn chứ không chỉ tham số truy vấn: `public/404.html`
// — thứ đổi /t/<mã ca> thành ?examCode= — CHỈ chạy khi GitHub Pages trả 404.
// Máy đã cài service worker thì mọi lần điều hướng được service worker trả
// thẳng index.html, 404.html KHÔNG BAO GIỜ chạy. Đây chính là lỗi thầy đã báo.
import { beforeEach, describe, expect, it } from 'vitest'
import { chuanHoaDuongDan, docDuongVao, docVaiTuDuongDan } from '../src/lib/vai-tro'
import manifest from '../public/manifest.json'

beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '/')
})

describe('Chỉ còn một app trong repo này', () => {
  it('manifest mở thẳng gốc app, không mang tham số vai nào', () => {
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(JSON.stringify(manifest)).not.toContain('vai=')
  })

  it('vai học sinh và phụ huynh KHÔNG còn được nhận', () => {
    for (const v of ['hs', 'ph', 'admin']) {
      expect(docDuongVao(`?vai=${v}`).vai).toBe(null)
    }
  })

  it('đường /hs/… và /ph/… không còn ý nghĩa gì trong app này', () => {
    const t = 'a'.repeat(32)
    expect(docVaiTuDuongDan(`/omr-app/hs/${t}`).vai).toBe(null)
    expect(docVaiTuDuongDan(`/omr-app/ph/${t}`).vai).toBe(null)
  })
})

describe('Đọc vai TỪ ĐƯỜNG DẪN (service worker nuốt 404.html)', () => {
  it('/omr-app/gv → vai thầy, có hay không dấu / cuối đều được', () => {
    expect(docVaiTuDuongDan('/omr-app/gv').vai).toBe('gv')
    expect(docVaiTuDuongDan('/omr-app/gv/').vai).toBe('gv')
  })

  it('/omr-app/t/<mã ca> → mã ca, để link vào thi mở được cả khi mất mạng', () => {
    expect(docVaiTuDuongDan('/omr-app/t/984033')).toEqual({ vai: null, maCa: '984033' })
    expect(docVaiTuDuongDan('/omr-app/t/984033/').maCa).toBe('984033')
  })

  it('đường thường thì không đoán ra gì', () => {
    for (const d of ['/omr-app/', '/omr-app/index.html', '/', '/omr-app/t/abc']) {
      expect(docVaiTuDuongDan(d)).toEqual({ vai: null, maCa: '' })
    }
  })

  it('docDuongVao lấy được mã ca từ đường dẫn khi không có tham số', () => {
    expect(docDuongVao('', '/omr-app/t/760435').maCa).toBe('760435')
  })

  it('tham số truy vấn thắng đường dẫn (404.html đã chuyển hướng rồi)', () => {
    expect(docDuongVao('?examCode=111111', '/omr-app/t/222222').maCa).toBe('111111')
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

  it('/gv → ?vai=gv', () => {
    history.replaceState(null, '', '/omr-app/gv')
    chuanHoaDuongDan('/omr-app/')
    expect(location.pathname).toBe('/omr-app/')
    expect(new URLSearchParams(location.search).get('vai')).toBe('gv')
  })

  it('giữ nguyên tham số sẵn có, ví dụ ?api=', () => {
    history.replaceState(null, '', '/omr-app/t/123456?api=https%3A%2F%2Fvi.du%2Fexec')
    chuanHoaDuongDan('/omr-app/')
    const q = new URLSearchParams(location.search)
    expect(q.get('api')).toBe('https://vi.du/exec')
    expect(q.get('examCode')).toBe('123456')
  })

  it('đường thường thì không đụng vào', () => {
    history.replaceState(null, '', '/omr-app/?nguon=pwa')
    chuanHoaDuongDan('/omr-app/')
    expect(location.pathname + location.search).toBe('/omr-app/?nguon=pwa')
  })
})
