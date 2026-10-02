// GĐ1 v2 (02/10): khung lời giải báo thao tác em làm lên trang mẹ ⇒ đóng hộp gửi máy chủ một lần; màn thầy không gửi.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { act, cleanup, render } from '@testing-library/react'

const bao = vi.fn()
vi.mock('../src/lib/loi-giai-api', () => ({ baoDocLoiGiai: (...a: unknown[]) => bao(...a) }))
import KhungLoiGiai from '../src/components/loi-giai/KhungLoiGiai'

const CAU = { qid: 'Q1', so: 'Câu 1', nguon: '', chuong: '', de: 'x', y: {} }
const HO_SO = { qid: 'Q1', bam: 'b', dang: 'ds' as const, ten: 't' }

function gui(src: Window | null, data: unknown) {
  act(() => { window.dispatchEvent(new MessageEvent('message', { data, source: src })) })
}

afterEach(() => { cleanup(); bao.mockReset() })

describe('KhungLoiGiai — gom thao tác, đóng thì gửi', () => {
  it('nhận kiểu đã biết từ đúng khung, bỏ kiểu lạ và nguồn lạ; đóng ⇒ gửi một lần', () => {
    const { container, unmount } = render(<KhungLoiGiai hoSo={HO_SO} cau={CAU} nguon="on_lai" onDong={() => undefined} />)
    const w = (container.ownerDocument.querySelector('iframe') as HTMLIFrameElement).contentWindow
    gui(w, { loai: 'khung-su-kien', kieu: 'chon', y: 'a', dung: true })
    gui(w, { loai: 'khung-su-kien', kieu: 'goi_y', y: 'b', muc: 2 })
    gui(w, { loai: 'khung-su-kien', kieu: 'xoa_bang' })
    gui(window, { loai: 'khung-su-kien', kieu: 'chon', y: 'z', dung: true })
    expect(bao).not.toHaveBeenCalled()
    unmount()
    expect(bao).toHaveBeenCalledTimes(1)
    const [qid, nguon, giay, ds] = bao.mock.calls[0] as [string, string, number, { k: string; y?: string; d?: boolean; m?: number }[]]
    expect([qid, nguon, giay >= 0]).toEqual(['Q1', 'on_lai', true])
    expect(ds.map(({ k, y, d, m }) => ({ k, y, d, m }))).toEqual([{ k: 'chon', y: 'a', d: true, m: undefined }, { k: 'goi_y', y: 'b', d: undefined, m: 2 }])
  })

  it('màn thầy (thay) ⇒ không gửi', () => {
    const { unmount } = render(<KhungLoiGiai hoSo={HO_SO} cau={CAU} thay onDong={() => undefined} />)
    unmount()
    expect(bao).not.toHaveBeenCalled()
  })

  it('khung.html báo đủ 6 kiểu thao tác, vẫn không gọi mạng', () => {
    const h = fs.readFileSync(path.resolve(__dirname, '../public/loi-giai/khung.html'), 'utf8')
    for (const k of ['chon', 'goi_y', 'gan', 'tuong_tu', 'tra_loi_so', 'chot']) expect(h).toContain(`bao('${k}'`)
    expect(h).toContain("connect-src 'none'")
    expect(h).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon/)
  })
})
