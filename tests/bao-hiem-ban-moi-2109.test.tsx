// P1 21/09 — LỚP BẢO HIỂM "MÁY EM KẸT BẢN CŨ" (Boss ra lệnh; thầy chụp iPhone 12:13 vẫn thấy chữ của bản trước 513f408 sau ≥ 3 giờ, 8 lượt Pages).
// Khoá: (1) tự hỏi sw-version.json rồi so với giờ dựng trong gói; mới hơn ⇒ update() ⇒ 20 giây vẫn cũ ⇒ ÉP (xoá kho SW + huỷ SW + nạp lại `_moi`);
// rào: không ép lúc làm bài / mỗi bản tối đa 2 lần / không đụng IndexedDB-localStorage / mạng phải ok mới xoá / chạy thử tắt;
// (2) precache nhỏ + kho chạy-lúc không cất HTML; (3) số bản ở cuối menu ba chấm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { batBaoHiemBanMoi, CHO_BAN_MOI_TU_LEN_MS, epLenBanMoi, GIAN_CACH_KIEM_MS, kiemTraBanMoi, moiTruongThat, NHIP_BAO_HIEM_MS, TOI_DA_EP_MOI_BAN, type MoiTruongBaoHiem } from '../src/lib/bao-hiem-ban-moi'
import { chuBanApp, datDangLamBai, datDangMoKhoa } from '../src/lib/cap-nhat-app'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
// Chỉ bỏ dòng chú thích `//` (tệp cấu hình có chuỗi kiểu glob mà bộ bỏ chú thích khối sẽ ăn nhầm).
const boDong = (s: string) => s.replace(/^\s*\/\/.*$/gm, '')

const KHO = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
/** Môi trường giả: gói đang chạy bản 1000, máy chủ đang phục vụ bản `may`. `ghi` ghi lại thứ tự việc đã làm. */
function moiTruong(tuy: Partial<MoiTruongBaoHiem> & { may?: number | null | (() => number | null) } = {}) {
  const ghi: string[] = []
  const { may = 2000, ...roi } = tuy
  const env: MoiTruongBaoHiem = {
    banDangChay: 1000,
    layBanMayChu: async () => {
      ghi.push('hoi')
      return typeof may === 'function' ? may() : may
    },
    capNhatSW: async () => void ghi.push('update'),
    epLen: async () => {
      ghi.push('ep')
      return true
    },
    hoan: () => false,
    cho: async (ms) => void ghi.push(`cho:${ms}`),
    kho: KHO(),
    ...roi,
  }
  return { env, ghi }
}

afterEach(() => {
  cleanup()
  datDangLamBai(false)
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

describe('kiemTraBanMoi — một lượt kiểm', () => {
  it('máy chủ MỚI hơn gói: hỏi → update() → chờ đúng 20 giây → hỏi lại → ÉP (theo đúng thứ tự)', async () => {
    const { env, ghi } = moiTruong()
    expect(await kiemTraBanMoi(env)).toBe('da-ep')
    expect(ghi).toEqual(['hoi', 'update', `cho:${CHO_BAN_MOI_TU_LEN_MS}`, 'hoi', 'ep'])
    expect(CHO_BAN_MOI_TU_LEN_MS).toBe(20_000)
  })

  it('cùng bản hoặc máy chủ cũ hơn: KHÔNG update, KHÔNG ép', async () => {
    for (const may of [1000, 999]) {
      const { env, ghi } = moiTruong({ may })
      expect(await kiemTraBanMoi(env)).toBe('cung-ban')
      expect(ghi).toEqual(['hoi'])
    }
  })

  it('không hỏi được máy chủ (mất mạng / sai dạng): không làm gì, không ép', async () => {
    const { env, ghi } = moiTruong({ may: null })
    expect(await kiemTraBanMoi(env)).toBe('loi-mang')
    expect(ghi).toEqual(['hoi'])
  })

  it('RÀO 1 — em đang làm bài: không hỏi mạng, không update, không ép', async () => {
    const { env, ghi } = moiTruong({ hoan: () => true })
    expect(await kiemTraBanMoi(env)).toBe('hoan')
    expect(ghi).toEqual([])
  })

  it('RÀO 1 — em VÀO làm bài trong 20 giây chờ: không ép (bài đang dở không bị nạp lại)', async () => {
    let dem = 0
    const { env, ghi } = moiTruong({ hoan: () => ++dem > 1 }) // lần 1 (đầu lượt) rảnh, lần 2 (sau chờ) đang làm bài
    expect(await kiemTraBanMoi(env)).toBe('hoan')
    expect(ghi).toEqual(['hoi', 'update', 'cho:20000'])
    expect(ghi).not.toContain('ep')
  })

  it('trang đã tự lên bản mới trong 20 giây (máy chủ hỏi lại bằng gói này): KHÔNG ép', async () => {
    let lan = 0
    const { env, ghi } = moiTruong({ may: () => (++lan === 1 ? 2000 : 1000) })
    expect(await kiemTraBanMoi(env)).toBe('cung-ban')
    expect(ghi).not.toContain('ep')
  })

  it('RÀO 3 — mỗi bản tối đa 2 lần ép; lần 3 bỏ; sang bản KHÁC thì đếm lại từ đầu', async () => {
    expect(TOI_DA_EP_MOI_BAN).toBe(2)
    const kho = KHO()
    let may = 2000
    const { env, ghi } = moiTruong({ kho, may: () => may })
    expect(await kiemTraBanMoi(env)).toBe('da-ep')
    expect(await kiemTraBanMoi(env)).toBe('da-ep')
    expect(await kiemTraBanMoi(env)).toBe('het-luot')
    expect(ghi.filter((x) => x === 'ep').length).toBe(2)
    may = 3000
    expect(await kiemTraBanMoi(env)).toBe('da-ep')
    expect(ghi.filter((x) => x === 'ep').length).toBe(3)
  })

  it('máy chặn lưu sessionStorage (kho null / ném lỗi): vẫn ép được, không ném', async () => {
    expect(await kiemTraBanMoi(moiTruong({ kho: null }).env)).toBe('da-ep')
    const hong = { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') } }
    expect(await kiemTraBanMoi(moiTruong({ kho: hong }).env)).toBe('da-ep')
  })

  it('RÀO 4 — ép không được (mạng không đưa được trang mới): trả `ep-khong-duoc`, không nói dối là đã ép', async () => {
    const { env } = moiTruong({ epLen: async () => false })
    expect(await kiemTraBanMoi(env)).toBe('ep-khong-duoc')
  })

  it('RÀO 5 — chạy thử (giờ dựng = 0): tắt hẳn, không hỏi mạng', async () => {
    const { env, ghi } = moiTruong({ banDangChay: 0 })
    expect(await kiemTraBanMoi(env)).toBe('chay-thu')
    expect(ghi).toEqual([])
  })

  it('update() ném lỗi thì vẫn đi tiếp tới bước chờ 20 giây rồi ép (đường bình thường hỏng là lý do tồn tại của lớp này)', async () => {
    const { env, ghi } = moiTruong({ capNhatSW: async () => { throw new Error('mạng rớt') } })
    expect(await kiemTraBanMoi(env)).toBe('da-ep')
    expect(ghi).toContain('ep')
  })
})

describe('dây nối với rào có sẵn (moiTruongThat)', () => {
  it('`hoan()` = ĐÚNG rào của cap-nhat-app: em đang làm bài (ExamTakeScreen → datDangLamBai) ⇒ hoãn; rời màn ⇒ hết hoãn', () => {
    const env = moiTruongThat()
    expect(env.hoan()).toBe(false)
    datDangLamBai(true)
    expect(env.hoan()).toBe(true)
    datDangLamBai(false)
    expect(env.hoan()).toBe(false)
  })

  it('thầy đang mở khoá mà KHÔNG giữ được phiên ⇒ hoãn (như tuTaiLaiKhiDoiBan); có phiên thì thôi', () => {
    const env = moiTruongThat()
    datDangMoKhoa(true)
    try {
      expect(env.hoan()).toBe(true) // jsdom: chưa có gói phiên
    } finally {
      datDangMoKhoa(false)
    }
    expect(env.hoan()).toBe(false)
  })

  it('giờ dựng lấy từ gói (`__SW_BUILT_AT__`); chạy thử (vitest không định nghĩa) = 0 ⇒ lớp bảo hiểm tự tắt', () => {
    expect(moiTruongThat().banDangChay).toBe(0)
  })

  it('hỏi máy chủ bằng `sw-version.json?t=…` với `cache: no-store`; đọc CHẶT: không phải số dương ⇒ null', async () => {
    const goi: Array<[string, RequestInit | undefined]> = []
    for (const [thanTra, mong] of [[{ builtAt: 1789967629 }, 1789967629], [{ builtAt: 0 }, null], [{ builtAt: 'x' }, null], [{}, null], [null, null]] as const) {
      vi.stubGlobal('fetch', vi.fn(async (u: string, o?: RequestInit) => (goi.push([u, o]), { ok: true, json: async () => thanTra })))
      expect(await moiTruongThat().layBanMayChu()).toBe(mong)
    }
    expect(goi[0][0]).toMatch(/^\/sw-version\.json\?t=\d+$/)
    expect(goi[0][1]).toEqual({ cache: 'no-store' })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ builtAt: 9 }) })))
    expect(await moiTruongThat().layBanMayChu()).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await moiTruongThat().layBanMayChu()).toBeNull()
  })
})

describe('epLenBanMoi — việc ép', () => {
  const dung = (tuy: Partial<Parameters<typeof epLenBanMoi>[0]> = {}) => {
    const xoa: string[] = []
    const huy: string[] = []
    const nap: string[] = []
    const moi = {
      fetch: vi.fn(async () => ({ ok: true })),
      caches: { keys: async () => ['workbox-precache-v2-x', 'omr-manh-chay-lan', 'omr-anh-chay-lan'], delete: async (k: string) => (xoa.push(k), true) },
      layDangKy: async () => [{ unregister: async () => (huy.push('a'), true) }, { unregister: async () => (huy.push('b'), true) }],
      diaChi: () => 'https://app.test/hs?x=1#h',
      nap: (u: string) => void nap.push(u),
      now: () => 1234567,
      ...tuy,
    }
    return { moi, xoa, huy, nap }
  }

  it('xoá MỌI kho, huỷ MỌI đăng ký, nạp lại bằng `_moi=<giờ>` (giữ nguyên tham số khác + #hash)', async () => {
    const { moi, xoa, huy, nap } = dung()
    expect(await epLenBanMoi(moi)).toBe(true)
    expect(xoa.sort()).toEqual(['omr-anh-chay-lan', 'omr-manh-chay-lan', 'workbox-precache-v2-x'])
    expect(huy.sort()).toEqual(['a', 'b'])
    expect(nap).toEqual(['https://app.test/hs?x=1&_moi=1234567#h'])
    // Kiểm mạng bằng CHÍNH địa chỉ `_moi` no-store, TRƯỚC khi xoá.
    expect(moi.fetch).toHaveBeenCalledWith('https://app.test/hs?x=1&_moi=1234567#h', { cache: 'no-store' })
  })

  it('RÀO 4 — mạng không ok (HTTP 503 hoặc ném lỗi): KHÔNG xoá gì, KHÔNG huỷ SW, KHÔNG nạp lại — bản cũ vẫn chạy được offline', async () => {
    for (const hong of [async () => ({ ok: false }), async () => { throw new Error('offline') }]) {
      const { moi, xoa, huy, nap } = dung({ fetch: hong })
      expect(await epLenBanMoi(moi)).toBe(false)
      expect([xoa, huy, nap]).toEqual([[], [], []])
    }
  })

  it('một kho xoá lỗi / huỷ đăng ký lỗi vẫn KHÔNG chặn việc nạp lại (đường `_moi` đã vượt SW)', async () => {
    const { moi, nap } = dung({
      caches: { keys: async () => ['k1', 'k2'], delete: async (k: string) => { if (k === 'k1') throw new Error('x'); return true } },
      layDangKy: async () => [{ unregister: async () => { throw new Error('y') } }],
    })
    expect(await epLenBanMoi(moi)).toBe(true)
    expect(nap.length).toBe(1)
  })

  it('RÀO 2 — mã nguồn KHÔNG có đường nào tới IndexedDB / localStorage / removeItem / clear (bài làm dở nằm ở IndexedDB)', () => {
    const ma = boChuThich(doc('src/lib/bao-hiem-ban-moi.ts'))
    for (const cam of ['indexedDB', 'localStorage', 'removeItem', '.clear(', 'deleteDatabase']) expect(ma, cam).not.toContain(cam)
    // sessionStorage chỉ để ĐẾM lượt ép (getItem/setItem), không xoá.
    expect(ma).toMatch(/kho\?\.setItem\(KHOA_DEM/)
  })

  it('ÉP KHÔNG dùng `navigate`/`reload` kiểu cũ: nạp lại bằng location.replace có `_moi` (SW không chặn đường `_moi`)', () => {
    const ma = boChuThich(doc('src/lib/bao-hiem-ban-moi.ts'))
    expect(ma).toContain('location.replace(u)')
    expect(ma).toContain("searchParams.set('_moi'")
    expect(boDong(doc('src/sw.ts'))).toContain('/[?&]_moi=/') // denylist của NavigationRoute
  })
})

describe('batBaoHiemBanMoi — khi nào kiểm', () => {
  function cua() {
    const nghe = new Map<string, Set<() => void>>()
    return {
      nghe,
      addEventListener: (t: string, f: () => void) => void (nghe.get(t) ?? nghe.set(t, new Set()).get(t)!).add(f),
      removeEventListener: (t: string, f: () => void) => void nghe.get(t)?.delete(f),
      document: { visibilityState: 'visible' as DocumentVisibilityState },
      bat: (t: string) => nghe.get(t)?.forEach((f) => f()),
    }
  }
  function hen() {
    const nhip: Array<{ f: () => void; ms: number }> = []
    const hen1: Array<{ f: () => void; ms: number }> = []
    return {
      nhip,
      hen1,
      h: {
        datNhip: (f: () => void, ms: number) => (nhip.push({ f, ms }), nhip.length),
        goNhip: vi.fn(),
        datHen: (f: () => void, ms: number) => (hen1.push({ f, ms }), hen1.length),
        goHen: vi.fn(),
      },
    }
  }
  const nhoLai = () => new Promise((r) => setTimeout(r, 0))

  it('mở app: kiểm sau 2 giây; mỗi 10 phút: kiểm lại; quay lại app / hiện lại từ bộ nhớ đệm / có mạng lại: kiểm', async () => {
    const { env, ghi } = moiTruong({ may: 1000 })
    const c = cua()
    const { h, nhip, hen1 } = hen()
    let t = 0
    batBaoHiemBanMoi(env, c as never, () => t, h)
    expect(hen1[0].ms).toBe(2000)
    expect(nhip[0].ms).toBe(NHIP_BAO_HIEM_MS)
    expect(NHIP_BAO_HIEM_MS).toBe(10 * 60 * 1000)
    hen1[0].f()
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(1)
    t += GIAN_CACH_KIEM_MS + 1
    c.bat('visibilitychange')
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(2)
    t += GIAN_CACH_KIEM_MS + 1
    c.bat('pageshow')
    await nhoLai()
    t += GIAN_CACH_KIEM_MS + 1
    c.bat('online')
    await nhoLai()
    t += GIAN_CACH_KIEM_MS + 1
    c.bat('focus')
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(5)
    nhip[0].f() // nhịp 10 phút: kiểm bất kể gián cách
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(6)
  })

  it('bật tắt màn hình dồn dập (< 30 giây): chỉ kiểm một lần; màn hình đang ẨN thì không kiểm', async () => {
    const { env, ghi } = moiTruong({ may: 1000 })
    const c = cua()
    const { h } = hen()
    let t = 5000
    batBaoHiemBanMoi(env, c as never, () => t, h)
    c.bat('visibilitychange')
    c.bat('visibilitychange')
    c.bat('focus')
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(1)
    // Lượt trước đã XONG nhưng mới 10 giây trôi qua: vẫn chặn (đây là rào gián cách, khác rào "đang kiểm dở" ở trên).
    t += 10_000
    c.bat('visibilitychange')
    c.bat('online')
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(1)
    t += GIAN_CACH_KIEM_MS
    c.bat('online')
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(2)
    const c2 = cua()
    c2.document.visibilityState = 'hidden'
    const { env: e2, ghi: g2 } = moiTruong({ may: 1000 })
    batBaoHiemBanMoi(e2, c2 as never, () => 5000, hen().h)
    c2.bat('visibilitychange')
    await nhoLai()
    expect(g2).toEqual([])
  })

  it('đang chờ 20 giây của lượt trước thì lượt mới không chồng lên (không update/ép hai lần)', async () => {
    let mo!: () => void
    const cho = new Promise<void>((r) => (mo = r))
    const { env, ghi } = moiTruong({ cho: async () => cho })
    const c = cua()
    const { h, nhip } = hen()
    batBaoHiemBanMoi(env, c as never, () => 0, h)
    nhip[0].f()
    await nhoLai()
    nhip[0].f()
    c.bat('online')
    await nhoLai()
    expect(ghi.filter((x) => x === 'update').length).toBe(1)
    mo()
    await nhoLai()
    await nhoLai()
    expect(ghi.filter((x) => x === 'ep').length).toBe(1)
  })

  it('vừa RỜI màn làm bài: kiểm ngay (bản mới đã chờ suốt buổi làm bài); hàm gỡ dọn sạch', async () => {
    const { env, ghi } = moiTruong({ may: 1000 })
    const c = cua()
    const { h } = hen()
    const go = batBaoHiemBanMoi(env, c as never, () => 0, h)
    datDangLamBai(true)
    datDangLamBai(false)
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(1)
    go()
    expect([...c.nghe.values()].every((s) => s.size === 0)).toBe(true)
    expect(h.goNhip).toHaveBeenCalled()
    expect(h.goHen).toHaveBeenCalled()
    datDangLamBai(true)
    datDangLamBai(false)
    await nhoLai()
    expect(ghi.filter((x) => x === 'hoi').length).toBe(1) // đã gỡ: không kiểm nữa
  })

  it('chạy thử (giờ dựng 0): không đăng ký gì', () => {
    const { env } = moiTruong({ banDangChay: 0 })
    const c = cua()
    const { h, nhip, hen1 } = hen()
    batBaoHiemBanMoi(env, c as never, () => 0, h)
    expect(c.nghe.size + nhip.length + hen1.length).toBe(0)
  })

  it('main.tsx bật lớp bảo hiểm ngay sau registerSW, TRƯỚC khi dựng React', () => {
    const main = boChuThich(doc('src/main.tsx'))
    expect(main).toContain("import { batBaoHiemBanMoi } from './lib/bao-hiem-ban-moi'")
    expect(main.indexOf('batBaoHiemBanMoi()')).toBeGreaterThan(main.indexOf('registerSW({'))
    expect(main.indexOf('batBaoHiemBanMoi()')).toBeLessThan(main.indexOf('createRoot('))
  })
})

describe('precache nhỏ + kho chạy-lúc (vite.config.ts · sw.ts · kiem-sw.mjs)', () => {
  const vite = boDong(doc('vite.config.ts'))
  const sw = boDong(doc('src/sw.ts'))
  const kiem = doc('scripts/kiem-sw.mjs')

  it('màn thầy, game, máy chiếu, phiếu, phông trùng (ttf/woff), biểu tượng 512 và logo app thầy KHÔNG nằm trong precache', () => {
    for (const ten of ['GoiLenBangScreen', 'ExamMonitorScreen', 'HocSinhScreen', 'PhanCongScreen', 'ExamSetupScreen', 'ExamHubScreen', 'Game', 'DoanHoTong', 'DaoThanThu', 'html-may-chieu']) expect(vite, ten).toContain(ten)
    expect(vite).toContain("'**/html-phieu-*.js'")
    expect(vite).toContain("'**/*-512*.png'")
    expect(vite).toContain("'**/logo-gv-*'")
    expect(vite).toMatch(/globPatterns: \['\*\*\/\*\.\{js,css,html,ico,png,svg,wasm,data,woff2\}'\]/) // bỏ woff + ttf
  })

  it('`includeAssets` (KHÔNG bị globIgnores lọc) không còn liệt kê icon 512 / logo app thầy', () => {
    const khoi = vite.slice(vite.indexOf('includeAssets: ['), vite.indexOf(']', vite.indexOf('includeAssets: [')))
    expect(khoi).not.toMatch(/512/)
    expect(khoi).not.toMatch(/logo-gv|logo-\*/)
    expect(khoi).toContain("'logo-hs-v3.svg'")
    expect(khoi).toContain("'logo-ph-v3.svg'")
  })

  it('kho chạy-lúc: mảnh /assets/ băm tên = CacheFirst; ảnh không băm = StaleWhileRevalidate; KHÔNG bắt âm thanh (Range); có hạn mục + dọn khi đầy máy', () => {
    expect(sw).toContain("cacheName: 'omr-manh-chay-lan'")
    expect(sw).toContain("cacheName: 'omr-anh-chay-lan'")
    expect(sw).toMatch(/new CacheFirst\(\{\s*cacheName: 'omr-manh-chay-lan'/)
    expect(sw).toMatch(/new StaleWhileRevalidate\(\{\s*cacheName: 'omr-anh-chay-lan'/)
    expect(sw).not.toMatch(/mp3|ogg|wav/)
    expect((sw.match(/purgeOnQuotaError: true/g) || []).length).toBe(2)
    expect((sw.match(/maxEntries: \d+/g) || []).length).toBe(2)
  })

  it('kho chạy-lúc KHÔNG cất phản hồi HTML dưới tên mảnh (chốt cacheWillUpdate) và cả hai route dùng chốt ấy', () => {
    expect(sw).toMatch(/cacheWillUpdate: async \(\{ response \}[^)]*\) => \{[\s\S]*response\.status === 200 && !\/text\\\/html\/i/)
    expect((sw.match(/plugins: \[KHONG_LUU_HTML/g) || []).length).toBe(2)
  })

  it('chốt cacheWillUpdate chạy đúng: HTML 200 ⇒ null; JS 200 ⇒ giữ; 404 ⇒ null', async () => {
    const m = /const KHONG_LUU_HTML = (\{[\s\S]*?\n\})\n/.exec(doc('src/sw.ts'))
    expect(m).toBeTruthy()
    // eslint-disable-next-line no-new-func
    const chot = new Function(`return (${m![1].replace(/\(\{ response \}: \{ response: Response \}\)/, '({ response })')})`)() as { cacheWillUpdate: (a: { response: Response }) => Promise<Response | null> }
    const r = (status: number, loai: string) => new Response('x', { status, headers: { 'content-type': loai } })
    expect(await chot.cacheWillUpdate({ response: r(200, 'text/html; charset=utf-8') })).toBeNull()
    expect(await chot.cacheWillUpdate({ response: r(404, 'text/javascript') })).toBeNull()
    const ok = r(200, 'text/javascript')
    expect(await chot.cacheWillUpdate({ response: ok })).toBe(ok)
  })

  it('scripts/kiem-sw.mjs chặn precache phình to lại (trần tệp + KB) và đòi kho chạy-lúc', () => {
    expect(kiem).toMatch(/const TOI_DA_TEP_PRECACHE = \d+/)
    expect(kiem).toMatch(/const TOI_DA_KB_PRECACHE = \d+/)
    expect(kiem).toContain('omr-manh-chay-lan')
    expect(kiem).toContain('KHÔNG cất trang HTML')
    const tep = Number(/TOI_DA_TEP_PRECACHE = (\d+)/.exec(kiem)![1])
    const kb = Number(/TOI_DA_KB_PRECACHE = (\d+)/.exec(kiem)![1])
    expect(tep).toBeLessThanOrEqual(170)
    expect(kb).toBeLessThanOrEqual(3000) // trước P1: 245 tệp / 5344 KB
  })
})

describe('số bản ở cuối menu ba chấm', () => {
  it('chuBanApp: giờ Việt Nam (UTC+7) + mã commit; chạy thử/rỗng ⇒ "Bản chạy thử"', () => {
    // 1789967629 s = 21/09/2026 12:13:49 giờ Việt Nam (đúng bản Pages 1d3a61f6).
    expect(chuBanApp(1789967629, '8cf7739 · 2026-09-21 05:13')).toBe('Bản app 21/09 12:13 · 8cf7739')
    expect(chuBanApp(1789967629, 'dev')).toBe('Bản app 21/09 12:13')
    // Qua nửa đêm: 21/09 17:30 UTC = 22/09 00:30 giờ VN.
    expect(chuBanApp(Date.UTC(2026, 8, 21, 17, 30) / 1000, 'abc1234 · x')).toBe('Bản app 22/09 00:30 · abc1234')
    expect(chuBanApp(0, 'abc')).toBe('Bản chạy thử')
    expect(chuBanApp(Number.NaN, 'abc')).toBe('Bản chạy thử')
  })

  beforeEach(() => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }) })))
    localStorage.setItem('omr_ph_sbd', '12121212')
  })

  it('cổng phụ huynh (một màn một nút, 21/09; màn chính kiểu Apple B): KHÔNG còn menu ba chấm; số bản KHÔNG còn ở chân màn — chỉ ở menu nút tròn tài khoản, dưới mục "Đổi số báo danh" (chữ xám rất nhỏ)', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Mở menu' })).toBeNull()
    expect(container.querySelector('.bnv-menu')).toBeNull()
    expect(container.querySelector('[data-vung="chan-ph"]')).toBeNull()
    expect(container.textContent).not.toContain(chuBanApp())
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản: mở để đổi số báo danh' }))
    const menu = container.querySelector('[role="menu"]') as HTMLElement
    expect((menu.querySelector('[data-vung="ban-app"]') as HTMLElement).textContent).toBe(chuBanApp())
    expect((menu.querySelector('[role="menuitem"]') as HTMLElement).textContent).toBe('Đổi số báo danh')
  })

  it('cổng học sinh và phụ huynh dùng CHUNG một DauTrang ⇒ một chỗ sửa (khoá nguồn); chữ tiếng Việt, số có nhãn "Bản app"', () => {
    const dt = doc('src/components/bang-nhiem-vu/DauTrang.tsx')
    expect(dt).toContain("import { chuBanApp } from '../../lib/cap-nhat-app'")
    expect(dt).toContain('<p className="bnv-menu-ban">{chuBanApp()}</p>')
    expect(doc('src/components/bang-nhiem-vu/bang-nhiem-vu.css')).toMatch(/\.bnv-menu-ban \{[^}]*color: var\(--m3-on-surface-variant\)/)
  })
})
