// GAME TỰ VÀO TOÀN MÀN HÌNH (thầy lệnh 21/09) — không nút; xin ngay trong cú chạm mở game; vào thẳng/lazy mất cử chỉ ⇒ xin ở lần chạm đầu tiên (một lần/lượt);
// từ chối/không API ⇒ im lặng; em tự thoát ⇒ không ép lại; Về app học sinh / rời game ⇒ thoát. Không đụng ExamTakeScreen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
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
  giaApi('ok')
})
afterEach(() => {
  cleanup()
  const goc = document.documentElement as unknown as Record<string, unknown>
  delete goc.requestFullscreen
  delete goc.webkitRequestFullscreen
  localStorage.clear()
  vi.unstubAllGlobals()
})

// ─── cổng học sinh THẬT ───
const KE_HOACH = {
  ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [], canhBao: [], quaHan: [], tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date().toISOString(),
  thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' },
}


// ─── khoá nguồn: mọi cửa vào game đều đi qua moGame / xin trong cú chạm ───


// 10/10: cổng học sinh không còn mở game/toàn màn hình; thư viện game lưu trữ vẫn kiểm ở trên.
it('cổng học tập không tự gọi toàn màn hình hoặc tải màn game',()=>{const c=doc('src/screens/StudentPortalScreen.tsx');expect(c).not.toContain('useToanManHinhGame(');expect(c).not.toContain("import('../game/than-thu-v2/Game')");expect(c).toContain("t === 'thanthu' || t === 'bia' ? 'hoctap' : t");expect(doc('src/screens/ExamTakeScreen.tsx')).not.toContain('toan-man-hinh-game')})
