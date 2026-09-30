// THẦY BÁO 30/09 "Bi a đang chơi thoát luôn" — em đang giữa ván Bi-a thì bị văng ra.
// NGUYÊN NHÂN GỐC: app tự TẢI LẠI TRANG khi có bản mới (controllerchange / lớp bảo hiểm bản mới) — chỉ hoãn khi đang LÀM BÀI THI, không hoãn khi đang chơi
// Bi-a. Mỗi lượt đẩy Pages (hôm nay: PR #93, #94…), máy em giữa ván nhận bản mới ⇒ `location.reload()` ⇒ về Bảng nhiệm vụ, mất ván, 8 câu bàn bị giữ.
// Tái hiện bằng CHÍNH dây tự tải lại của app (`tuTaiLaiKhiDoiBan`) + màn chơi thật: đang ở màn chơi thì không được tải lại; rời màn thì bản mới vào.
// Kèm: xoay máy / đổi cỡ / toàn màn hình không gỡ màn chơi; lỗi vẽ một khung không dừng vòng khung hình; lỗi React ở màn chơi không gỡ cả cổng học sinh.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, act } from '@testing-library/react'
import BiaGame from '../src/game/bi-a/BiaGame'
import ManChoi from '../src/game/bi-a/ManChoi'
import TraLoiCau from '../src/game/bi-a/TraLoiCau'
import { datBoGoiBia, NHIP_GIU_BAN_MS } from '../src/game/bi-a/api'
import { dangLamBaiKhong, tuTaiLaiKhiDoiBan } from '../src/lib/cap-nhat-app'
import { VanBia, type CauBia } from '../src/game/bi-a/dieu-khien'

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })
const cau = (i: number, mucDo = 'biet'): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], dang: 'd', tenDang: 'Khái niệm', mucDo, sao: 1 } as unknown as CauBia)
const SANH = { ok: true, bat: true, chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: 26, tong: 40 }, doan: { con: 6 }, dao: { con: 20 }, tran: { con: 18, tong: 18, conDoan: 6, conDao: 12 }, giaoHuu: { mo: false, con: 0, toiDa: 2 }, online: false, diemBan: { diem: 1000, soVan: 0 } }
let goi: ReturnType<typeof vi.fn>
const lenh = (ten: string) => goi.mock.calls.filter((c) => c[0] === ten).map((c) => c[2] as Record<string, unknown>)
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  goi = vi.fn(async (l: string) => ({
    ok: true,
    ...(l === 'bia-sanh' ? SANH : l === 'bia-xep-ban' ? { van: 'v1', session: 's1', bi: Array.from({ length: 7 }, (_, i) => cau(i + 1)), chot: cau(9, 'van_dung'), tran: { con: 10, tong: 18 } }
      : l === 'bia-tra-loi' ? { session: 'tl1', cau: [cau(1)], tran: { con: 17, tong: 18 } } : l === 'bia-giu-ban' ? { conMo: true } : {}),
  }))
  datBoGoiBia(goi as never)
})
afterEach(() => { cleanup(); datBoGoiBia(null); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks() })

/** Dây tự tải lại THẬT của app, với service worker giả: `doiBan()` = bản mới vừa chiếm quyền. */
function dayTaiLai() {
  const nghe: Array<() => void> = []
  const taiLai = vi.fn()
  vi.stubGlobal('navigator', { ...navigator, serviceWorker: { controller: {} } })
  tuTaiLaiKhiDoiBan({ addEventListener: (_t, f) => nghe.push(f), taiLai })
  return { taiLai, doiBan: () => nghe.forEach((f) => f()) }
}
const vaoVan = async () => {
  render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Đấu đơn với A.I' }))
  await screen.findByRole('img', { name: /Bàn bi-a/ })
}

describe('NGUYÊN NHÂN GỐC: bản mới tự tải lại trang giữa ván Bi-a', () => {
  it('đang giữa ván ⇒ bản mới chiếm quyền KHÔNG tải lại trang; rời ván về Sảnh Bi-a ⇒ tải lại đúng một lần', async () => {
    const { taiLai, doiBan } = dayTaiLai()
    await vaoVan()
    expect(dangLamBaiKhong()).toBe(true)
    doiBan()
    expect(taiLai).not.toHaveBeenCalled() // trước khi sửa: tải lại NGAY ⇒ em văng khỏi ván
    expect(screen.getByRole('img', { name: /Bàn bi-a/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Về Sảnh Bi-a' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Rời ván' }))
    await screen.findByText('Bi-a Phản Ứng')
    expect(dangLamBaiKhong()).toBe(false)
    expect(taiLai).toHaveBeenCalledTimes(1)
  })
  it('chế độ "Trả lời câu hỏi" cũng giữ trang; đóng màn thì thả', async () => {
    const { unmount } = render(<TraLoiCau token="tk" onVe={() => {}} />)
    expect(dangLamBaiKhong()).toBe(true)
    unmount()
    expect(dangLamBaiKhong()).toBe(false)
  })
})

describe('Xoay máy / đổi cỡ / toàn màn hình không gỡ màn chơi', () => {
  it('đổi khung dọc ↔ ngang ↔ máy tính, bật/tắt toàn màn hình, bàn phím hiện: vẫn đúng ván (cùng một bàn, không về Sảnh)', async () => {
    await vaoVan()
    const ban = screen.getByRole('img', { name: /Bàn bi-a/ })
    for (const [w, h] of [[844, 390], [390, 844], [1280, 720], [390, 500], [740, 360]] as const) {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: w }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
      act(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('orientationchange')); document.dispatchEvent(new Event('fullscreenchange')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')) })
    }
    expect(screen.getByRole('img', { name: /Bàn bi-a/ })).toBe(ban)
    expect(screen.queryByRole('button', { name: 'Đấu đơn với A.I' })).toBeNull()
    expect(lenh('bia-ket-van')).toHaveLength(0)
  })
})

describe('Lỗi không đóng game', () => {
  it('một khung hình vẽ lỗi ⇒ vòng khung hình chạy tiếp (khung sau vẫn được hẹn)', async () => {
    const hang: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { hang.push(f); return hang.length })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ve = vi.spyOn(VanBia.prototype, 'buoc').mockImplementation(() => { throw new Error('khung hỏng (NaN, canvas hết bộ nhớ…)') })
    render(<ManChoi token="tk" tenEm="Em" van="v1" session="s1" cheDo="don" loai="ai" cauEm={[cau(1)]} chot={null} onVeSanh={() => {}} onChoiLai={() => {}} />)
    for (let i = 0; i < 5; i++) { const f = hang.shift(); expect(f).toBeTruthy(); f!(performance.now() + i * 16) }
    expect(ve).toHaveBeenCalled()
    expect(hang.length).toBeGreaterThan(0) // trước khi sửa: khung lỗi ném ra, không hẹn khung sau ⇒ bàn đứng im
  })
  it('màn chơi ném lỗi lúc vẽ React ⇒ chỉ đóng bàn (lớp chắn riêng Bi-a, có nút về Sảnh Bi-a), không gỡ cả cổng học sinh', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await vaoVan()
    const v = (window as unknown as { __biaVan: { ghe: unknown[] } }).__biaVan
    act(() => { v.ghe = []; (v as unknown as { doi: () => void }).doi?.() })
    expect(await screen.findByText('Bàn bi-a vừa gặp lỗi')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Về Sảnh Bi-a' }))
    expect(await screen.findByRole('button', { name: 'Đấu đơn với A.I' })).toBeTruthy()
  })
})

describe('Giữ bàn ở máy chủ theo hoạt động', () => {
  it('màn chơi ván A.I báo "còn ở bàn" mỗi 3 phút (bia-giu-ban kèm phiên), ẩn app thì thôi', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<ManChoi token="tk" tenEm="Em" van="v1" session="s1" cheDo="don" loai="ai" cauEm={[cau(1)]} chot={null} onVeSanh={() => {}} onChoiLai={() => {}} />)
    await act(async () => { vi.advanceTimersByTime(NHIP_GIU_BAN_MS + 10) })
    expect(lenh('bia-giu-ban')).toEqual([{ session: 's1' }])
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    await act(async () => { vi.advanceTimersByTime(NHIP_GIU_BAN_MS + 10) })
    expect(lenh('bia-giu-ban')).toHaveLength(1)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  })
})
