// LINK CŨ CỦA EM VÀ PHỤ HUYNH KHÔNG ĐƯỢC RƠI VÀO APP QUẢN LÝ CỦA THẦY.
//
// Lỗi thầy đã báo nguyên văn: "bấm vào link thì mở trình duyệt nó tự vào app
// quản lý giáo viên của tôi". Nay hai app đó tách sang repo riêng
// (TACHAPPHSPH.md) nên link `/hs/<token>`, `/ph/<token>` và app cũ đã cài
// (`?vai=hs`, `?vai=ph`) đều trỏ về đây — không chặn thì lỗi cũ quay lại,
// nặng hơn: em và phụ huynh cầm trong tay màn quản lý cả trung tâm.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { docDuongVao, laLinkAppCu, laManThayQuanLy } from '../src/lib/vai-tro'
import ma404 from '../public/404.html?raw'

const TOKEN = 'a'.repeat(32)

beforeEach(() => history.replaceState(null, '', '/'))

describe('Nhận diện link cũ', () => {
  it('app cũ đã cài trên máy em/phụ huynh (?vai=hs, ?vai=ph)', () => {
    expect(laLinkAppCu('?vai=hs&nguon=pwa')).toBe(true)
    expect(laLinkAppCu('?vai=ph&nguon=pwa')).toBe(true)
  })

  it('link riêng trên đường dẫn', () => {
    expect(laLinkAppCu('', `/omr-app/hs/${TOKEN}`)).toBe(true)
    expect(laLinkAppCu('', `/omr-app/ph/${TOKEN}/`)).toBe(true)
  })

  it('đường của thầy và link vào thi thì KHÔNG dính', () => {
    expect(laLinkAppCu('?vai=gv')).toBe(false)
    expect(laLinkAppCu('?examCode=984033')).toBe(false)
    expect(laLinkAppCu('', '/omr-app/t/984033')).toBe(false)
    expect(laLinkAppCu('', '/omr-app/')).toBe(false)
  })
})

describe('App dựng gì khi gặp link cũ', () => {
  // Từ 22/10 (thầy: "phụ huynh bấm vào chỉ cần nhập sbd luôn") link cũ vào thẳng cổng của đúng vai — vẫn KHÔNG bao giờ là app thầy.
  it('vào cổng của vai, KHÔNG hiện màn quản lý / màn khoá của thầy', () => {
    for (const [s, p, vai] of [['?vai=ph&nguon=pwa', '/', 'phuhuynh'], ['', `/ph/${TOKEN}`, 'phuhuynh'], ['?vai=hs', '/', 'hocsinh'], ['', `/omr-app/hs/${TOKEN}/`, 'hocsinh']] as const) {
      expect(docDuongVao(s, p).vai, s + p).toBe(vai)
      expect(laManThayQuanLy(s, p), s + p).toBe(false)
    }
    history.replaceState(null, '', `/omr-app/?vai=ph&token=${TOKEN}`)
    render(<App />)
    expect(screen.queryByText(/Máy này chưa được cấp quyền/)).toBeNull()
    expect(screen.queryByText('Kiểm tra tại lớp')).toBeNull()
    expect(screen.queryByText('Quản lý đăng ký')).toBeNull()
  })

  // Link vào thi KHÔNG được dính màn báo tin — lớp còn phải thi tuần này.
  // Không dựng App ở đây vì màn thi mở IndexedDB; kiểm ngay ở bộ đọc đường link.
  it('link vào thi không bị nhận nhầm là link cũ', () => {
    expect(laLinkAppCu('?examCode=984033', '/omr-app/')).toBe(false)
    expect(laLinkAppCu('', '/omr-app/t/984033')).toBe(false)
  })
})

describe('404.html đón link cũ khi máy chưa cài service worker', () => {
  it('đổi /hs/<token> và /ph/<token> thành ?vai= để app hiện màn báo tin', () => {
    expect(ma404).toContain("'?vai=' + c[2]")
    expect(ma404).toMatch(/\(hs\|ph\)/)
  })

  it('vẫn giữ hai đường còn dùng: /t/<mã ca> và /gv', () => {
    expect(ma404).toContain("'?examCode=' + m[2]")
    expect(ma404).toContain("'?vai=gv'")
  })
})
