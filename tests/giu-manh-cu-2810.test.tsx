// GIỮ MẢNH CŨ TRÊN PAGES (thầy chụp 28/10: «Failed to fetch dynamically imported module …StudentPortalScreen-BEU0ucly.js»).
// Phát hành B thay TRỌN bản sống A ⇒ mảnh băm tên của A mất ⇒ máy còn chạy A mở màn tải lười là văng.
// scripts/giu-manh-cu.mjs chép lại mảnh của các bản gần đây vào dist trước khi đẩy; phía máy: tải lại ngay, không in chữ lỗi tiếng Anh.
import { render, screen } from '@testing-library/react'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error tệp .mjs không có khai báo kiểu
import { chonBanGiu, giuManhCu, timTenManh, GIU_TRONG_MS, SO_BAN_TOI_THIEU } from '../scripts/giu-manh-cu.mjs'
import ChanLoi from '../src/components/ChanLoi'

type Tep = { loai: string; than: Buffer }
/** Bản sống giả kiểu Pages: tệp có thật thì trả, không có thì trả index.html 200 (dòng `/* /index.html 200`). */
function banSongGia(tep: Record<string, string>) {
  const goi: string[] = []
  const lay = async (url: string): Promise<Tep | null> => {
    const p = new URL(url).pathname.replace(/^\//, '') || 'index.html'
    goi.push(p)
    if (p in tep) return { loai: p.endsWith('.json') ? 'application/json' : p.endsWith('.html') ? 'text/html' : 'application/javascript', than: Buffer.from(tep[p]) }
    return { loai: 'text/html; charset=utf-8', than: Buffer.from('<!doctype html><html></html>') }
  }
  return { lay, goi }
}
function distGia(tep: Record<string, string>) {
  const d = mkdtempSync(join(tmpdir(), 'giu-manh-'))
  mkdirSync(join(d, 'assets'))
  for (const [t, nd] of Object.entries(tep)) writeFileSync(join(d, t), nd)
  return d
}

describe('timTenManh: bắt mọi cách mã đã dựng gọi tên mảnh', () => {
  it('assets/…, ./… (import động, url() CSS), chuỗi trần (new URL)', () => {
    const ma = `const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/StudentPortalScreen-BEU0ucly.js","assets/chung-Ab_c-123.css"])));
      import("./ManTuLuyen-x1Y2z3W4.js"); src:url(./nunito-AAAAAAAA.woff2) format("woff2"); new URL("bi-ZZZZZZZZ.png",import.meta.url)`
    expect([...timTenManh(ma)].sort()).toEqual([
      'assets/ManTuLuyen-x1Y2z3W4.js', 'assets/StudentPortalScreen-BEU0ucly.js', 'assets/bi-ZZZZZZZZ.png', 'assets/chung-Ab_c-123.css', 'assets/nunito-AAAAAAAA.woff2',
    ])
  })
  it('không nhận chữ thường không có mã băm', () => {
    expect(timTenManh('import("./react.js"); "hello-world.js"').size).toBe(0)
  })
})

describe('chonBanGiu: ≥5 bản gần nhất + mọi bản trong 72 giờ, bản quá cũ bị dọn', () => {
  const nay = Date.parse('2026-10-28T12:00:00Z')
  const ban = (i: number, gioTruoc: number) => ({ id: `b${i}`, luc: new Date(nay - gioTruoc * 3600e3).toISOString(), tep: [`assets/a${i}-AAAAAAAA.js`] })
  it('bản cũ hơn 72 giờ chỉ giữ khi còn trong 4 bản cũ gần nhất (bản đang đẩy là bản thứ 5)', () => {
    const ds = [ban(1, 100), ban(2, 200), ban(3, 300), ban(4, 400), ban(5, 500), ban(6, 600)]
    expect(chonBanGiu(ds, nay).map((b: { id: string }) => b.id)).toEqual(['b1', 'b2', 'b3', 'b4'])
    expect(SO_BAN_TOI_THIEU).toBe(5)
  })
  it('đêm phát hành 12 lần: giữ cả 12 vì cùng trong 72 giờ', () => {
    const ds = Array.from({ length: 12 }, (_, i) => ban(i, i * 0.5))
    expect(chonBanGiu(ds, nay)).toHaveLength(12)
    expect(GIU_TRONG_MS).toBe(72 * 3600e3)
  })
  it('danh sách hỏng thì bỏ qua, không nổ', () => {
    expect(chonBanGiu(null, nay)).toEqual([])
    expect(chonBanGiu([{ id: 1 }, { id: 'x', tep: [] }], nay)).toEqual([{ id: 'x', tep: [] }])
  })
})

describe('giuManhCu: phát hành B mang theo mảnh của A', () => {
  it('lần đầu (bản sống chưa có manh-cu.json): dò từ index.html + sw.js, chép mảnh A vào dist B, ghi danh sách', async () => {
    const A = {
      'index.html': '<script type="module" src="/assets/index-AAAAAAAA.js"></script>',
      'sw.js': 'self.__WB_MANIFEST=[{url:"assets/index-AAAAAAAA.js"}]',
      'assets/index-AAAAAAAA.js': 'const d=["assets/StudentPortalScreen-BEU0ucly.js"];import("./chung-CCCCCCCC.js")',
      'assets/StudentPortalScreen-BEU0ucly.js': 'export default 1',
      'assets/chung-CCCCCCCC.js': 'export const c=1',
    }
    const song = banSongGia(A)
    const dist = distGia({ 'index.html': 'B', 'assets/index-BBBBBBBB.js': 'b', 'assets/chung-CCCCCCCC.js': 'export const c=1' })
    const kq = await giuManhCu({ dist, goc: 'https://song.test', id: 'shaB', layTep: song.lay, ghi: () => {} })
    expect(readdirSync(join(dist, 'assets')).sort()).toEqual(['StudentPortalScreen-BEU0ucly.js', 'chung-CCCCCCCC.js', 'index-AAAAAAAA.js', 'index-BBBBBBBB.js'])
    expect(readFileSync(join(dist, 'assets/StudentPortalScreen-BEU0ucly.js'), 'utf8')).toBe('export default 1')
    expect(kq.tepCuThieu).toBe(0)
    const ds = JSON.parse(readFileSync(join(dist, 'manh-cu.json'), 'utf8'))
    expect(ds.ban[0]).toMatchObject({ id: 'shaB', tep: ['assets/chung-CCCCCCCC.js', 'assets/index-BBBBBBBB.js'] })
    expect(ds.ban[1].tep).toContain('assets/StudentPortalScreen-BEU0ucly.js')
  })

  it('đã có danh sách: chép đủ mảnh mọi bản được giữ; Pages trả HTML (tệp đã mất) thì KHÔNG ghi HTML thành .js', async () => {
    const nay = Date.parse('2026-10-28T12:00:00Z')
    const danhSach = { ban: [
      { id: 'A2', luc: new Date(nay - 3600e3).toISOString(), tep: ['assets/x-22222222.js'] },
      { id: 'A1', luc: new Date(nay - 7200e3).toISOString(), tep: ['assets/y-11111111.js', 'assets/mat-00000000.js'] },
    ] }
    const song = banSongGia({ 'manh-cu.json': JSON.stringify(danhSach), 'assets/x-22222222.js': 'x', 'assets/y-11111111.js': 'y' })
    const dist = distGia({ 'index.html': 'B', 'assets/b-BBBBBBBB.js': 'b' })
    const kq = await giuManhCu({ dist, goc: 'https://song.test', id: 'B', nay, layTep: song.lay, ghi: () => {} })
    expect(readdirSync(join(dist, 'assets')).sort()).toEqual(['b-BBBBBBBB.js', 'x-22222222.js', 'y-11111111.js'])
    expect(kq).toMatchObject({ banGiu: 3, tepCuCanLay: 3, tepCuDaLay: 2, tepCuThieu: 1 })
    const ds = JSON.parse(readFileSync(join(dist, 'manh-cu.json'), 'utf8'))
    expect(ds.ban.map((b: { id: string }) => b.id)).toEqual(['B', 'A2', 'A1'])
    expect(ds.ban[2].tep).toEqual(['assets/y-11111111.js']) // tệp đã mất được gạch khỏi danh sách
  })

  it('bản sống không trả lời: vẫn ghi danh sách bản mới, không ném lỗi (không chặn phát hành)', async () => {
    const dist = distGia({ 'index.html': 'B', 'assets/b-BBBBBBBB.js': 'b' })
    const kq = await giuManhCu({ dist, goc: 'https://song.test', id: 'B', layTep: async () => null, ghi: () => {} })
    expect(kq.banGiu).toBe(1)
    expect(JSON.parse(readFileSync(join(dist, 'manh-cu.json'), 'utf8')).ban).toHaveLength(1)
  })
})

describe('deploy.yml: bước giữ mảnh nằm SAU build, TRƯỚC khi đẩy Pages; không chặn phát hành', () => {
  const wf = readFileSync('.github/workflows/deploy.yml', 'utf8')
  it('thứ tự và cờ', () => {
    const iBuild = wf.indexOf('npm run build:cf')
    const iGiu = wf.indexOf('node scripts/giu-manh-cu.mjs dist')
    const iPages = wf.indexOf('pages deploy dist')
    expect(iBuild).toBeGreaterThan(0)
    expect(iGiu).toBeGreaterThan(iBuild)
    expect(iPages).toBeGreaterThan(iGiu)
    const buoc = wf.slice(wf.lastIndexOf('- name:', iGiu), iGiu)
    expect(buoc).toMatch(/continue-on-error: true/)
  })
})

describe('Màn thiếu mảnh: chỉ câu tiếng Việt, không in chữ lỗi tiếng Anh cho em', () => {
  function Vo(): React.ReactElement {
    throw new TypeError('Failed to fetch dynamically imported module: https://omr-app-b3u.pages.dev/assets/StudentPortalScreen-BEU0ucly.js')
  }
  it('không có dòng "Failed to fetch", có câu tiếng Việt + nút Tải lại app', () => {
    const im = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('location', { href: 'https://x/hs', replace: () => {}, reload: () => {} })
    try {
      const { container } = render(<ChanLoi o="Cổng học sinh"><Vo /></ChanLoi>)
      expect(screen.getByText('Đang tải bản mới của app')).toBeTruthy()
      expect(container.textContent).not.toMatch(/Failed|dynamically|assets\//)
      expect(container.querySelector('pre')).toBeNull()
      expect(screen.getByRole('button', { name: 'Tải lại app' })).toBeTruthy()
      expect(im).toHaveBeenCalled() // chi tiết vẫn ở console
    } finally {
      vi.unstubAllGlobals()
      im.mockRestore()
      try { sessionStorage.clear() } catch { /* */ }
    }
  })
})
