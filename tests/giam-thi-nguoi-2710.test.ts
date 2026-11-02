// @vitest-environment jsdom
// GIÁM THỊ (02/11 bản «sống động», thầy duyệt bản vẽ docs/ban-ve-giam-thi-moi-0211; trước: hình người v3 27/10): đủ phản ứng cho mọi trạng thái, giữ
// nhận diện 4 người, không màu thô trong mã, mọi biến màu dùng tới đều khai ở giam-thi.css, bản tĩnh xám mờ, dọn sạch khi huỷ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { GT_DANG_SONG, THU_TU_NGUOI, taoGiamThi } from '../src/components/giam-thi/giam-thi-nguoi'
import { veNguoi } from '../src/components/giam-thi/giam-thi-hinh'
import type { TrangThaiGT } from '../src/components/giam-thi/giam-thi-ve'

const TT: TrangThaiGT[] = ['yen', 'doc', 'cho', 'soi', 'dong-ho', 'nghi-ngo', 'nop', 'dung', 'sai', 'chua-tinh', 'combo', 'xong']
const css = readFileSync('src/components/giam-thi/giam-thi.css', 'utf8')
afterEach(() => { vi.useRealTimers(); document.documentElement.classList.remove('may-yeu') })

describe('giám thị sống động', () => {
  it('giữ nhận diện từng người (đạo cụ / kính / tóc của bản vẽ)', () => {
    const h = (m: 'nb' | 'th' | 'vd' | 'vdc') => veNguoi(m, 'x_')
    expect(h('nb')).toContain('gn-quai') // Tí: kính bảo hộ trên trán (quai vòng qua đầu)
    expect(h('th')).toMatch(/circle cx="0" cy="-219" r="21"/) // Cô Cốc: búi tóc
    expect(h('th')).toMatch(/r="19.5" class="gn gn-gong"/) // kính tròn
    expect(h('vd')).toContain('gf-tap') // Chú Tam: tạp dề cam
    expect(h('vd')).toContain('gn-kinh-v') // kính ôm mắt
    expect(h('vdc')).toContain('gtay-but-g') // Giáo sư Kíp: búi tóc cài bút chì
    expect(h('vdc')).toMatch(/A18,13 0 0 1/) // kính nửa vầng trăng
    for (const m of THU_TU_NGUOI) expect(h(m)).toContain('data-k="ma"') // má hồng
  })
  it('mọi mức × trạng thái chạy được (sống và tĩnh), có lò xo động; huỷ thì dọn sạch', () => {
    vi.useFakeTimers()
    for (const m of THU_TU_NGUOI) for (const tinh of [false, true]) {
      const el = document.createElement('div'); document.body.appendChild(el)
      const g = taoGiamThi(el, { muc: m, tinh })
      for (const t of TT) { g.datTrangThai(t); vi.advanceTimersByTime(700) }
      g.datTrangThai('sai', { lien: true }); vi.advanceTimersByTime(3000)
      for (const p of ['chon', 'nop', 'voi', 'dung', 'dungLien', 'sai', 'saiLien', 'choc'] as const) { g.phanUng(p, { diem: { x: 300, y: 400 } }); vi.advanceTimersByTime(900) }
      g.noi('Học với hành!', { cam: 'sai' })
      expect(el.querySelector('.gt-loi[data-cam="sai"]')).toBeTruthy()
      g.huy()
      expect(el.innerHTML).toBe('')
      el.remove()
    }
    expect(GT_DANG_SONG.size).toBe(0)
  })
  it('lúc thi (đèn pha): không dáng đúng / sai, chạm ô ⇒ soi; rời màn ⇒ phản ứng riêng', () => {
    vi.useFakeTimers()
    const el = document.createElement('div'); document.body.appendChild(el)
    const g = taoGiamThi(el, { muc: 'th', den: true })
    const ban = () => [...el.querySelectorAll('[data-b]')].find((x) => x.getAttribute('display') === 'inline')?.getAttribute('data-b')
    vi.advanceTimersByTime(800)
    expect(ban()).toBe('den')
    g.datTrangThai('dung'); g.phanUng('dung'); vi.advanceTimersByTime(300)
    expect(ban()).toBe('den') // không giơ ngón cái lúc thi
    const o = document.createElement('button'); document.body.appendChild(o)
    g.soiVao(o); vi.advanceTimersByTime(500)
    expect(ban()).toBe('den')
    g.phanUng('roi'); vi.advanceTimersByTime(4000)
    expect(ban()).toBe('den')
    g.huy(); el.remove(); o.remove()
  })
  it('máy yếu: không vòng rAF, không động tác đứng chờ', () => {
    vi.useFakeTimers()
    document.documentElement.classList.add('may-yeu')
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const el = document.createElement('div'); document.body.appendChild(el)
    const g = taoGiamThi(el, { muc: 'vd' })
    for (const t of TT) { g.datTrangThai(t); vi.advanceTimersByTime(1000) }
    g.phanUng('chon'); vi.advanceTimersByTime(5000)
    expect(raf).not.toHaveBeenCalled()
    raf.mockRestore(); g.huy(); el.remove()
  })
  it('không mã màu thô trong mã vẽ; mọi biến --gm-* dùng tới đều khai ở giam-thi.css', () => {
    for (const tep of ['src/components/giam-thi/giam-thi-nguoi.ts', 'src/components/giam-thi/giam-thi-hinh.ts']) expect(readFileSync(tep, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g), tep).toBeNull()
    const dinh = new Set([...css.matchAll(/(--gm-[\w-]+):/g)].map((m) => m[1]!))
    const dung = new Set([...css.matchAll(/var\((--gm-[\w-]+)\)/g)].map((m) => m[1]!))
    expect(dung.size).toBeGreaterThan(40)
    for (const k of dung) expect(dinh.has(k), k).toBe(true)
    // mọi lớp màu trong hình đều có luật CSS
    const lop = new Set<string>()
    for (const m of THU_TU_NGUOI) for (const x of veNguoi(m, 'x_').matchAll(/class="([^"$]*)"/g)) for (const t of x[1]!.split(/\s+/)) if (/^g[fns]-|^gtay-/.test(t)) lop.add(t)
    for (const t of lop) expect(css.includes(`.gtm .${t} {`) || css.includes(`.gtm .${t}{`), t).toBe(true)
    // áo thân 4 người dùng lại 4 màu thân sẵn có
    for (const [m, k] of [['nb', 'ao'], ['th', 'ao'], ['vd', 'tap'], ['vdc', 'ao']]) expect(css).toMatch(new RegExp(`\\.gtm\\[data-muc='${m}'\\] \\{[^}]*--gm-${k}: var\\(--gt-mau-${m}\\)`))
  })
  it('bản tĩnh xám mờ (Lộ trình) gắn lớp, huỷ thì dọn sạch', () => {
    const el = document.createElement('div')
    const g = taoGiamThi(el, { muc: 'th', tinh: true, xam: true, mo: true })
    expect(el.classList.contains('gt-xam') && el.classList.contains('gt-mo-nhat') && el.classList.contains('gt-tinh')).toBe(true)
    expect(el.querySelector('.gtm[data-muc="th"] svg')).toBeTruthy()
    expect(css).toContain('.gt-xam .gtm { filter: grayscale(1); }')
    g.huy()
    expect(el.innerHTML).toBe('')
  })
})
