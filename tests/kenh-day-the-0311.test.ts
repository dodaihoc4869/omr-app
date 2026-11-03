// ĐỒNG BỘ TỨC THÌ MỌI CHỖ (thầy 03/11 «đồng bộ các thiết bị chưa được tức thì … làm kĩ chỗ này»): src/lib/kenh-day.ts
//   · THẺ KHÁC CÙNG MÁY: máy chủ bỏ qua máy vừa làm (chung token) ⇒ BroadcastChannel; thẻ gọi THÀNH CÔNG lệnh làm đổi tiến độ ⇒ báo thẻ khác (gom một tin);
//   · danh sách đường máy khách = đúng LENH_DOI của máy chủ (hai bên khớp);
//   · điểm danh + màn Kiểm tra ôn tập (đang ở danh sách) nghe tin «máy khác vừa đổi».
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CHO_BC_MS, LENH_DOI_DUONG, SU_KIEN_DOI, moKenhDay } from '../src/lib/kenh-day'
import { LENH_DOI } from '../server/src/kenh-day'

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('danh sách lệnh làm đổi tiến độ', () => {
  it('khớp đúng LENH_DOI của máy chủ (mọi đường có, đường đọc / lạ không)', () => {
    for (const d of Object.keys(LENH_DOI)) expect(LENH_DOI_DUONG.test(d), d).toBe(true)
    for (const d of ['/hs/thuong', '/hs/ke-hoach-ngay', '/game-v2/hoc-tap-ktcn-trang-thai', '/hs/kenh-ve', '/hs/diem-danh/x', '/hs/chua-cau-sai/danh-sach']) expect(LENH_DOI_DUONG.test(d), d).toBe(false)
  })
})

describe('thẻ khác cùng máy (BroadcastChannel)', () => {
  it('lệnh ghi thành công ⇒ MỘT tin sau CHO_BC_MS (gom); lệnh đọc / lỗi ⇒ không; thẻ nhận tin ⇒ phát SU_KIEN_DOI; đóng kênh trả lại fetch gốc', async () => {
    vi.useFakeTimers()
    const gui: unknown[] = []
    let nhan: ((e: unknown) => void) | null = null
    class BC { onmessage: ((e: unknown) => void) | null = null; constructor() { queueMicrotask(() => { nhan = (e) => this.onmessage?.(e) }) } postMessage(x: unknown) { gui.push(x) } close() {} }
    vi.stubGlobal('BroadcastChannel', BC)
    vi.stubGlobal('WebSocket', class {})
    const goc = vi.fn(async (u: string) => new Response('{}', { status: String(u).includes('loi') ? 500 : 200 }))
    vi.stubGlobal('fetch', goc)
    window.fetch = goc as unknown as typeof fetch
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }) // máy ẩn ⇒ không nối WebSocket, chỉ thử phần thẻ
    const dong = moKenhDay('tok')
    expect(window.fetch).not.toBe(goc)
    await window.fetch('https://x.dev/game-v2/answer', { method: 'POST' })
    await window.fetch('https://x.dev/hs/chua-cau-sai/nop-item', { method: 'POST' })
    await window.fetch('https://x.dev/hs/ke-hoach-ngay', { method: 'POST' })
    await vi.advanceTimersByTimeAsync(CHO_BC_MS + 10)
    expect(gui).toHaveLength(1)
    await window.fetch('https://x.dev/hs/thuong/mo-ruong?loi=1', { method: 'POST' })
    await vi.advanceTimersByTimeAsync(CHO_BC_MS + 10)
    expect(gui).toHaveLength(1) // lỗi 500 ⇒ không báo
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    const nghe = vi.fn(); window.addEventListener(SU_KIEN_DOI, nghe)
    await Promise.resolve(); nhan!({ data: 1 })
    await vi.advanceTimersByTimeAsync(500)
    expect(nghe).toHaveBeenCalledTimes(1)
    window.removeEventListener(SU_KIEN_DOI, nghe)
    dong()
    expect(window.fetch).toBe(goc)
  })
})

describe('màn nghe tin máy khác', () => {
  it('điểm danh hỏi lại; Kiểm tra ôn tập đọc lại khi đang ở danh sách chặng', () => {
    expect(doc('src/components/diem-danh/diem-danh-hs.ts')).toMatch(/addEventListener\('ddh:doi-may-khac', ve\)/)
    expect(doc('src/components/hoc-tap/ManKiemTraCaNhan.tsx')).toMatch(/if\(sttRef\.current===null&&!document\.hidden\)void taiRef\.current\(\)/)
  })
})
