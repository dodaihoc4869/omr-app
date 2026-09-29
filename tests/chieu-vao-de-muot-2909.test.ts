// Máy yếu đợt 2 (29/09): tờ chiếu chia cột phương án không ép bố cục từng cái; màn thi dựng đề dần; phiếu phụ huynh nạp lười.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoHtmlMayChieu } from '../src/lib/html-may-chieu'

const doc = (p: string) => readFileSync(p, 'utf8')

describe('tờ chiếu: chia cột phương án gom đọc/ghi', () => {
  const html = taoHtmlMayChieu([], { tenBuoi: 'x' })
  const than = html.slice(html.indexOf('function fitOptions'), html.indexOf("window.addEventListener('resize',function(){fitOptions()})"))
  it('không còn chèn-đo-gỡ từng phương án (mỗi phương án một lần bố cục cả tờ)', () => {
    expect(than).not.toContain('grid.appendChild(copy);maxWidth=Math.max(maxWidth,copy.getBoundingClientRect().width);copy.remove()')
    // Thứ tự: chèn mọi bản sao → đọc mọi bề rộng → gỡ.
    const chen = than.indexOf('v.grid.appendChild(copy)')
    const doc1 = than.indexOf('c.getBoundingClientRect().width')
    const go = than.indexOf('c.remove()')
    expect(chen).toBeGreaterThan(0)
    expect(doc1).toBeGreaterThan(chen)
    expect(go).toBeGreaterThan(doc1)
  })
  it('luật chọn số cột giữ nguyên (4 / 2 / 1 theo phương án dài nhất + khe)', () => {
    expect(than).toContain('v.maxWidth*4+v.gap*3<=v.available?4:v.maxWidth*2+v.gap<=v.available?2:1')
    expect(than).toContain("if(option.querySelector('img,table')){v.maxWidth=v.available;return;}")
    // Duyệt BẢN CHỤP danh sách con (không duyệt HTMLCollection sống trong lúc chèn bản sao ⇒ vòng lặp vô tận).
    expect(than).toContain('Array.prototype.slice.call(v.grid.children)')
  })
})

describe('màn thi: dựng đề dần ở bố cục dọc', () => {
  const m = doc('src/screens/ExamTakeScreen.tsx')
  it('dựng vài thẻ đầu ngay, phần còn lại thêm dần lúc rảnh (startTransition), bố cục ngang dựng hết', () => {
    expect(m).toMatch(/const SO_THE_DAU = \d+/)
    expect(m).toMatch(/const BUOC_THE = \d+/)
    expect(m).toContain("const soTheDung = boCuc !== 'doc' ? Infinity : theDaDung.khoa === assignment ? theDaDung.n : SO_THE_DAU")
    expect(m).toContain('startTransition(() => setTheDaDung({ khoa: assignment, n: soTheDung + BUOC_THE }))')
    expect((m.match(/stt \+= 1\n\s+if \(stt > soTheDung\) return null/g) || []).length).toBe(3)
  })
  it('bấm tới câu chưa dựng ⇒ dựng hết rồi mới cuộn; mọi lối cuộn trong màn làm bài đi qua toiCau', () => {
    expect(m).toContain('if (so > soTheDung) flushSync(() => setTheDaDung({ khoa: assignment, n: Infinity }))')
    const sauToiCau = m.slice(m.indexOf('const toiCau = (so: number)') + 200)
    expect(sauToiCau).not.toContain('cuonToiCau(')
    expect(sauToiCau).toContain('onToiCau={toiCau}')
  })
  it('thẻ dựng thêm được gắn vào bộ đếm giây từng câu đang chạy (không dựng lại bộ đếm)', () => {
    expect(m).toContain('ioCauRef.current = io')
    expect(m).toMatch(/const io = ioCauRef\.current\s+if \(phase !== 'exam' \|\| !io\) return/)
  })
})

describe('phiếu phụ huynh nạp lười + nạp trước từ HTML', () => {
  it('App không nhập tĩnh PhieuScreen; đường /p có Suspense', () => {
    const a = doc('src/App.tsx')
    expect(a).not.toContain("import PhieuScreen from './screens/PhieuScreen'")
    expect(a).toContain("const PhieuScreen = lazy(() => import('./screens/PhieuScreen'))")
    expect(a).toMatch(/<Suspense fallback=\{<ChoManEm \/>\}>\s*<PhieuScreen \/>/)
    expect(doc('vite.config.ts')).toContain("phieu: dsCua('/src/screens/PhieuScreen.tsx')")
  })
})
