// GAME TỰ VÀO TOÀN MÀN HÌNH (thầy lệnh 21/09) — không nút; xin ngay trong cú chạm mở game; vào thẳng/lazy mất cử chỉ ⇒ xin ở lần chạm đầu tiên (một lần/lượt);
// từ chối/không API ⇒ im lặng; em tự thoát ⇒ không ép lại; Về app học sinh / rời game ⇒ thoát. Không đụng ExamTakeScreen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import { useToanManHinhGame } from '../src/components/useToanManHinhGame'
import { batTatToanManHinh, datLaiLuotToanManHinh, dangToanManHinh, ketThucLuotToanManHinh, theoDoiToanManHinh, xinToanManHinh } from '../src/lib/toan-man-hinh-game'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div data-testid="thu" /> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
// Game v2 giả: soi lối ra "Về app học sinh" (onDong) của cổng. 28/09 lần 2: nút toàn màn hình nằm TRONG thanh đầu của từng màn game
// (không còn nút nổi ở cổng) ⇒ game giả đặt NutToanManHinh thật trong <header> như các màn thật.
vi.mock('../src/game/than-thu-v2/Game', async () => {
  const { default: NutToanManHinh } = await import('../src/components/NutToanManHinh')
  return { default: (p: { onDong: () => void }) => <div data-testid="game"><header><NutToanManHinh /></header><button onClick={p.onDong}>Về app học sinh</button></div> }
})
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<Record<string, unknown>>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<Record<string, unknown>>()), momApi: async () => ({ ok: true, items: [] }) }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: vi.fn() }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: vi.fn() }))

const doc = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

// ─── giả API toàn màn hình của jsdom ───
let dangDau: Element | null = null
let xin: ReturnType<typeof vi.fn>
let thoat: ReturnType<typeof vi.fn>
const datToanMan = (v: Element | null) => {
  dangDau = v
  document.dispatchEvent(new Event('fullscreenchange'))
}
function giaApi(kieu: 'ok' | 'tuChoi' | 'nem' | 'khongApi' | 'webkit' = 'ok') {
  const goc = document.documentElement as HTMLElement & Record<string, unknown>
  xin = vi.fn(async () => {
    if (kieu === 'tuChoi') throw new Error('Permissions check failed')
    if (kieu === 'nem') throw new TypeError('nem')
    if (kieu === 'ok') datToanMan(document.documentElement)
  })
  thoat = vi.fn(async () => datToanMan(null))
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => dangDau })
  delete goc.requestFullscreen
  delete goc.webkitRequestFullscreen
  if (kieu === 'khongApi') {
    ;(document as unknown as Record<string, unknown>).exitFullscreen = undefined
  } else if (kieu === 'webkit') {
    goc.webkitRequestFullscreen = xin
    ;(document as unknown as Record<string, unknown>).exitFullscreen = thoat
  } else if (kieu === 'nem') {
    goc.requestFullscreen = () => {
      xin()
      throw new TypeError('nem đồng bộ')
    }
    ;(document as unknown as Record<string, unknown>).exitFullscreen = thoat
  } else {
    goc.requestFullscreen = xin
    ;(document as unknown as Record<string, unknown>).exitFullscreen = thoat
  }
}
const nhoDe = () => act(async () => { await Promise.resolve() })

beforeEach(() => {
  dangDau = null
  datLaiLuotToanManHinh()
  giaApi('ok')
})
afterEach(() => {
  cleanup()
  datLaiLuotToanManHinh()
  const goc = document.documentElement as unknown as Record<string, unknown>
  delete goc.requestFullscreen
  delete goc.webkitRequestFullscreen
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('lib: xinToanManHinh', () => {
  it('cú chạm mở game: gọi requestFullscreen ĐÚNG MỘT LẦN mỗi lượt, có navigationUI:hide', () => {
    xinToanManHinh('cu-cham-vao')
    xinToanManHinh('cu-cham-vao')
    expect(xin).toHaveBeenCalledTimes(1)
    expect(xin.mock.calls[0]![0]).toEqual({ navigationUI: 'hide' })
    expect(dangToanManHinh()).toBe(true)
  })
  it('lần chạm đầu tiên trong game: chỉ khi CHƯA toàn màn hình, và đúng một lần', () => {
    datToanMan(document.documentElement) // đã toàn màn hình (vd cú chạm mở game xin được)
    xinToanManHinh('cham-dau')
    expect(xin).not.toHaveBeenCalled()
    datToanMan(null)
    xinToanManHinh('cham-dau')
    expect(xin).toHaveBeenCalledTimes(1)
    datToanMan(null)
    xinToanManHinh('cham-dau')
    expect(xin).toHaveBeenCalledTimes(1) // một lần mỗi lượt
  })
  it('cú chạm mở game xin không được (từ chối) ⇒ lần chạm đầu tiên vẫn được xin một lần', async () => {
    giaApi('tuChoi')
    xinToanManHinh('cu-cham-vao')
    await nhoDe()
    expect(dangToanManHinh()).toBe(false)
    xinToanManHinh('cham-dau')
    expect(xin).toHaveBeenCalledTimes(2)
  })
  it('IM LẶNG: bị từ chối (promise reject), ném đồng bộ, không có API, chỉ có webkit', async () => {
    const loi = vi.spyOn(console, 'error').mockImplementation(() => {})
    const canhBao = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chuaXuLy: unknown[] = []
    const bat = (e: PromiseRejectionEvent) => chuaXuLy.push(e)
    process.on('unhandledRejection', bat as never)
    for (const kieu of ['tuChoi', 'nem', 'khongApi'] as const) {
      datLaiLuotToanManHinh()
      giaApi(kieu)
      expect(() => xinToanManHinh('cu-cham-vao')).not.toThrow()
      await nhoDe()
    }
    datLaiLuotToanManHinh()
    giaApi('webkit')
    xinToanManHinh('cu-cham-vao')
    expect(xin).toHaveBeenCalledTimes(1) // đường webkit
    await new Promise((r) => setTimeout(r, 5))
    process.off('unhandledRejection', bat as never)
    expect(chuaXuLy).toEqual([])
    expect(loi).not.toHaveBeenCalled()
    expect(canhBao).not.toHaveBeenCalled()
  })
  it('nuốt promise bị từ chối: luôn gắn .catch vào giá trị requestFullscreen trả về', () => {
    const bat = vi.fn()
    ;(document.documentElement as unknown as Record<string, unknown>).requestFullscreen = () => ({ catch: bat })
    xinToanManHinh('cu-cham-vao')
    expect(bat).toHaveBeenCalledTimes(1)
    expect(bat.mock.calls[0]![0]).toBeTypeOf('function')
  })
  it('em TỰ thoát toàn màn hình giữa lượt ⇒ KHÔNG ép lại (cả hai đường xin)', () => {
    const go = theoDoiToanManHinh()
    xinToanManHinh('cu-cham-vao') // vào toàn màn hình
    expect(dangToanManHinh()).toBe(true)
    datToanMan(null) // em vuốt/ Esc thoát
    xinToanManHinh('cham-dau')
    xinToanManHinh('cu-cham-vao')
    expect(xin).toHaveBeenCalledTimes(1)
    go()
  })
  it('chưa từng vào toàn màn hình (bị từ chối) mà nhận sự kiện đổi ⇒ KHÔNG coi là "em thoát"', async () => {
    giaApi('tuChoi')
    const go = theoDoiToanManHinh()
    xinToanManHinh('cu-cham-vao')
    await nhoDe()
    document.dispatchEvent(new Event('fullscreenchange'))
    xinToanManHinh('cham-dau')
    expect(xin).toHaveBeenCalledTimes(2)
    go()
  })
  it('ketThucLuot: đang toàn màn hình ⇒ thoát (không tính là em thoát); không thì không gọi exit; lượt mới xin lại được', () => {
    const go = theoDoiToanManHinh()
    xinToanManHinh('cu-cham-vao')
    ketThucLuotToanManHinh()
    expect(thoat).toHaveBeenCalledTimes(1)
    expect(dangToanManHinh()).toBe(false)
    xinToanManHinh('cu-cham-vao') // lượt mới: xin lại được (lần thoát trên là do mình, không phải em)
    expect(xin).toHaveBeenCalledTimes(2)
    ketThucLuotToanManHinh()
    ketThucLuotToanManHinh() // không toàn màn hình ⇒ không gọi exit nữa
    expect(thoat).toHaveBeenCalledTimes(2)
    go()
  })
  it('gỡ theoDoi: hết nghe fullscreenchange', () => {
    const them = vi.spyOn(document, 'addEventListener')
    const bo = vi.spyOn(document, 'removeEventListener')
    const go = theoDoiToanManHinh()
    expect(them.mock.calls.filter((c) => c[0] === 'fullscreenchange')).toHaveLength(1)
    go()
    expect(bo.mock.calls.filter((c) => c[0] === 'fullscreenchange')).toHaveLength(1)
    them.mockRestore()
    bo.mockRestore()
  })
})

describe('hook useToanManHinhGame', () => {
  function Khung({ mo }: { mo: boolean }) {
    useToanManHinhGame(mo)
    return <button data-testid="cham">chạm</button>
  }
  const chamNhe = () => document.dispatchEvent(new Event('pointerup', { bubbles: true }))
  // 28/09 thầy đổi luật: "bỏ chế độ tự full màn hình khi vào game, có nút toàn màn hình" ⇒ hook KHÔNG tự xin khi chạm nữa.
  it('game mở: chạm KHÔNG tự xin toàn màn hình (bỏ chế độ tự vào 28/09)', () => {
    render(<Khung mo />)
    chamNhe()
    chamNhe()
    expect(xin).not.toHaveBeenCalled()
  })
  it('gỡ ra là gỡ hết: hết nghe fullscreenchange; không còn nghe pointerup', () => {
    const them = vi.spyOn(document, 'addEventListener')
    const bo = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<Khung mo />)
    expect(them.mock.calls.filter((c) => c[0] === 'pointerup')).toHaveLength(0)
    unmount()
    expect(bo.mock.calls.filter((c) => c[0] === 'fullscreenchange')).toHaveLength(1)
    them.mockRestore()
    bo.mockRestore()
  })
  it('game chưa mở (mo=false): không xin', () => {
    render(<Khung mo={false} />)
    chamNhe()
    expect(xin).not.toHaveBeenCalled()
  })
  it('rời game (mo→false) khi em đã bật toàn màn hình bằng nút ⇒ thoát toàn màn hình', () => {
    const { rerender, unmount } = render(<Khung mo />)
    batTatToanManHinh()
    expect(dangToanManHinh()).toBe(true)
    rerender(<Khung mo={false} />)
    expect(thoat).toHaveBeenCalledTimes(1)
    unmount()
  })
  it('nút bật/tắt: đang toàn màn hình ⇒ thoát; em đã tự thoát vẫn bật lại được bằng nút', () => {
    render(<Khung mo />)
    batTatToanManHinh()
    expect(xin).toHaveBeenCalledTimes(1)
    batTatToanManHinh()
    expect(thoat).toHaveBeenCalledTimes(1)
    batTatToanManHinh()
    expect(xin).toHaveBeenCalledTimes(2)
  })
})

// ─── cổng học sinh THẬT ───
const KE_HOACH = {
  ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [], canhBao: [], quaHan: [], tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date().toISOString(),
  thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' },
}


// ─── khoá nguồn: mọi cửa vào game đều đi qua moGame / xin trong cú chạm ───


describe('CSS: nút "Về app học sinh" luôn hiện, ≥ 48 px, chừa vùng an toàn', () => {
  it('Đảo: nút dính trên cùng (fixed), safe-area top/left, min 48 px; nội dung chừa chỗ bằng padding-top', () => {
    const css = doc('src/game/than-thu-v2/dao/dao.css')
    const dong = css.split('\n').find((l) => l.includes('.dao button.dao-ve-app'))!
    expect(dong).toContain('position:fixed')
    expect(dong).toContain('env(safe-area-inset-top')
    expect(dong).toContain('env(safe-area-inset-left')
    expect(dong).toMatch(/min-height:48px/)
    expect(dong).toMatch(/min-width:48px/)
    expect(css).toContain('.dao-vo:has(>.dao-ve-app){padding-top:calc(60px + max(8px,env(safe-area-inset-top')
  })
  it('khung game cũ (Võ đài…): thanh có nút Về app học sinh dính trên cùng + vùng an toàn + nút ≥ 48 px', () => {
    const css = doc('src/game/than-thu-v2/game.css')
    expect(css).toMatch(/\.spirit-game>\.spirit-header\{position:sticky;top:0;[^}]*env\(safe-area-inset-top/)
    expect(css).toMatch(/\.spirit-game>\.spirit-header>button\{min-height:48px;min-width:48px\}/)
  })
})

// 10/10: cổng học sinh không còn mở game/toàn màn hình; thư viện game lưu trữ vẫn kiểm ở trên.
it('cổng học tập không tự gọi toàn màn hình hoặc tải màn game',()=>{const c=doc('src/screens/StudentPortalScreen.tsx');expect(c).not.toContain('useToanManHinhGame(');expect(c).not.toContain("import('../game/than-thu-v2/Game')");expect(c).toContain("t === 'thanthu' || t === 'bia' ? 'hoctap' : t");expect(doc('src/screens/ExamTakeScreen.tsx')).not.toContain('toan-man-hinh-game')})
