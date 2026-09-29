// Nạp trước mảnh màn em từ HTML (máy yếu 29/09): chọn đúng mảnh theo đường vào, đoạn mã nội tuyến chạy được và chỉ thêm thẻ link.
import { describe, expect, it } from 'vitest'
import { chonMangNapTruoc, taoMaNapTruoc } from '../src/lib/nap-truoc-man-em'
import { docDuongVao } from '../src/lib/vai-tro'

describe('chọn mảnh nạp trước theo đường vào', () => {
  const ca: [string, string, 'thi' | 'hs' | 'ph' | 'phieu' | null][] = [
    ['/t/123456', '', 'thi'],
    ['/t/123456/', '', 'thi'],
    ['/d/1234', '', 'thi'],
    ['/', '?vai=diem&examCode=123456', 'thi'],
    ['/', '?examCode=123456', 'thi'],
    ['/hs', '', 'hs'],
    ['/hoc-sinh/', '', 'hs'],
    ['/', '?vai=hocsinh', 'hs'],
    ['/ph', '', 'ph'],
    ['/phu-huynh', '', 'ph'],
    ['/', '?vai=phuhuynh', 'ph'],
    ['/gv', '', null],
    ['/', '', null],
    ['/p', '', 'phieu'],
    ['/', '?vai=phieu', 'phieu'],
    ['/', '?vai=gv&examCode=123456', null],
    ['/hs/abcdefgh1234', '', null],
  ]
  it.each(ca)('%s%s ⇒ %s', (duong, q, mong) => {
    expect(chonMangNapTruoc(duong, q)).toBe(mong)
  })

  it('khớp luật docDuongVao của app (thi = có mã ca hoặc xem điểm; hs = cổng học sinh)', () => {
    for (const [duong, q] of ca) {
      const dv = docDuongVao(q, duong)
      const app = dv.vai === 'gv' ? null : dv.vai === 'phieu' ? 'phieu' : dv.vai === 'phuhuynh' ? 'ph' : dv.maCa || dv.vai === 'diem' ? 'thi' : dv.vai === 'hocsinh' ? 'hs' : null
      expect(chonMangNapTruoc(duong, q)).toBe(app)
    }
  })

  it('không dùng nhìn lùi (Safari cũ sập)', () => {
    const ma = taoMaNapTruoc({ thi: [], hs: [], ph: [], phieu: [] })
    expect(ma).not.toMatch(/\(\?<[=!]/)
  })
})

describe('đoạn mã nội tuyến', () => {
  function chay(duong: string, q: string) {
    const them: { rel: string; as?: string; href: string; crossOrigin: string | null }[] = []
    const document = {
      head: { appendChild: (l: (typeof them)[number]) => them.push(l) },
      createElement: () => ({ rel: '', href: '', crossOrigin: null as string | null }) as (typeof them)[number],
    }
    const location = { pathname: duong, search: q }
    const ma = taoMaNapTruoc({ thi: ['/assets/ExamTakeScreen-a.js', '/assets/ExamTakeScreen-b.css'], hs: ['/assets/StudentPortalScreen-c.js'], ph: ['/assets/ParentPortalScreen-d.js'], phieu: ['/assets/PhieuScreen-e.js'] })
    new Function('document', 'location', ma)(document, location)
    return them
  }
  it('màn thi: modulepreload cho JS, preload as=style cho CSS, cùng crossorigin với thẻ của Vite', () => {
    const t = chay('/t/123456', '')
    expect(t).toEqual([
      { rel: 'modulepreload', href: '/assets/ExamTakeScreen-a.js', crossOrigin: '' },
      { rel: 'preload', as: 'style', href: '/assets/ExamTakeScreen-b.css', crossOrigin: '' },
    ])
  })
  it('mỗi cổng chỉ nạp mảnh của mình; app thầy / `/` trần không nạp gì', () => {
    expect(chay('/hs', '').map((x) => x.href)).toEqual(['/assets/StudentPortalScreen-c.js'])
    expect(chay('/ph', '').map((x) => x.href)).toEqual(['/assets/ParentPortalScreen-d.js'])
    expect(chay('/gv', '')).toEqual([])
    expect(chay('/p', '').map((x) => x.href)).toEqual(['/assets/PhieuScreen-e.js'])
    expect(chay('/', '')).toEqual([])
  })
})
