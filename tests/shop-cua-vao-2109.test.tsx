// CỬA HÀNG PHỤ KIỆN · B4 (cửa vào) + B5 phía máy em (nối 5 lệnh thật): nút "Cửa hàng" CHỈ có khi máy chủ báo `shopBat` (kèm recommendations / thanThu của kế hoạch ngày —
// không thêm lượt gọi); cờ tắt / Worker cũ / phụ huynh ⇒ không có cửa vào. Bộ nối `taoShopApiThat` trả đúng hình ShopApi, lỗi ném LoiShopApi, rớt mạng ⇒ mat_mang.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import type { DaoKetQua, DaoProfile, DaoThanThuProps } from '../src/game/than-thu-v2/dao/kieu'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { docThanThu, dungBangNhiemVu, type DuLieuBangNhiemVu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import { HAN_GOI_SHOP_MS, taoShopApiThat } from '../src/game/than-thu-v2/shop/may-chu-that'
import { LoiShopApi, MA_MAT_MANG } from '../src/game/than-thu-v2/shop/kieu'
import { chuCuaHang, chuLoiKhongRo, loiMayChu } from '../src/game/than-thu-v2/shop/chu-shop'

vi.mock('../src/game/than-thu-v2/dao/ManShopThat', () => ({
  default: (p: { token: string; pet: number; cap: number; tenThu?: string; onDong: () => void }) => (
    <div data-testid="man-shop" data-token={p.token} data-pet={p.pet} data-cap={p.cap} data-ten={p.tenThu}>
      <button type="button" onClick={p.onDong}>ĐÓNG-SHOP</button>
    </div>
  ),
}))

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div role="img" aria-label="Thần thú" /> }))

configure({ asyncUtilTimeout: 8000 })
afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const hoSo = (): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 10, wallet: 0, mastery: [], shields: { used: 0, activeUntil: 0 } } as unknown as DaoProfile)
const mayChu = (tra: Partial<DaoKetQua>) => vi.fn(async (action: string): Promise<DaoKetQua> => ({ ok: true, ...(action === 'recommendations' ? tra : {}) }))
const dung = (p: Partial<DaoThanThuProps> & Pick<DaoThanThuProps, 'call'>) => render(<DaoThanThu sbd="12121212" profile={hoSo()} doanMo={false} onMoDoan={() => {}} onDong={() => {}} {...p} />)
const nhanNav = (v: ReturnType<typeof render>) => [...v.container.querySelectorAll('.dao-nav button')].map((b) => b.textContent)

describe('Đảo: nút Cửa hàng chỉ khi máy chủ báo shopBat', () => {
  it('shopBat:true + có token ⇒ có mục "Cửa hàng" sau Túi đồ; chạm ⇒ mở Cửa hàng (thú CỦA EM + cấp + tên + token), đóng ⇒ về Đảo', async () => {
    const call = mayChu({ suggestions: [], shopBat: true })
    const v = dung({ call, token: 'tok-hs' })
    await waitFor(() => expect(nhanNav(v)).toEqual(['Đảo', 'Sổ tay', 'Túi đồ', chuCuaHang]))
    fireEvent.click(screen.getByRole('button', { name: chuCuaHang }))
    const shop = await screen.findByTestId('man-shop')
    expect(shop.getAttribute('data-token')).toBe('tok-hs')
    expect(shop.getAttribute('data-cap')).toBe('34')
    expect(shop.getAttribute('data-ten')).toBe('Lửa Nhỏ')
    expect(Number(shop.getAttribute('data-pet'))).toBeGreaterThanOrEqual(0)
    fireEvent.click(screen.getByText('ĐÓNG-SHOP'))
    await waitFor(() => expect(screen.queryByTestId('man-shop')).toBeNull())
    expect(nhanNav(v)).toContain(chuCuaHang) // về Đảo, nút vẫn còn
  })
  it('cờ tắt / Worker cũ không có khoá / shopBat không phải true / thiếu token ⇒ KHÔNG có cửa vào và không tải mã cửa hàng', async () => {
    for (const tra of [{ shopBat: false }, {}, { shopBat: 'true' as unknown as boolean }, { shopBat: 1 as unknown as boolean }]) {
      cleanup()
      const call = mayChu({ suggestions: [], ...tra })
      const v = dung({ call, token: 'tok' })
      await waitFor(() => expect(call).toHaveBeenCalledWith('recommendations', undefined))
      await new Promise((r) => setTimeout(r, 30))
      expect(nhanNav(v)).toEqual(['Đảo', 'Sổ tay', 'Túi đồ'])
    }
    cleanup()
    const call = mayChu({ suggestions: [], shopBat: true })
    const v = dung({ call }) // không token ⇒ không nối được máy chủ thật ⇒ không nút
    await waitFor(() => expect(call).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 30))
    expect(nhanNav(v)).toEqual(['Đảo', 'Sổ tay', 'Túi đồ'])
  })
  it('không thêm lượt gọi máy chủ: chỉ recommendations (đã có sẵn) mang shopBat; không có lệnh vang-xem / shop-* khi mở Đảo', async () => {
    const call = mayChu({ suggestions: [], shopBat: true })
    const v = dung({ call, token: 'tok' })
    await waitFor(() => expect(nhanNav(v)).toContain(chuCuaHang))
    const lenh = call.mock.calls.map((c) => c[0])
    expect(lenh.some((l) => /vang|shop|thu-mac-do/.test(l))).toBe(false)
  })
  it('moShopLucDau (từ Bảng nhiệm vụ) + shopBat ⇒ mở thẳng Cửa hàng ĐÚNG MỘT LẦN (đóng rồi không tự mở lại); shopBat false ⇒ ở lại Đảo', async () => {
    const call = mayChu({ suggestions: [], shopBat: true })
    dung({ call, token: 'tok', moShopLucDau: true })
    await screen.findByTestId('man-shop')
    fireEvent.click(screen.getByText('ĐÓNG-SHOP'))
    await waitFor(() => expect(screen.queryByTestId('man-shop')).toBeNull())
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByTestId('man-shop')).toBeNull()
    cleanup()
    const call2 = mayChu({ suggestions: [], shopBat: false })
    dung({ call: call2, token: 'tok', moShopLucDau: true })
    await waitFor(() => expect(call2).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByTestId('man-shop')).toBeNull()
  })
})

describe('Bảng nhiệm vụ: thanThu.shopBat', () => {
  it('docThanThu giữ shopBat CHỈ khi === true; các trường hợp khác giữ đúng hình cũ (không thêm khoá)', () => {
    expect(docThanThu({ pet: 'lua_phuong', cap: 3, shopBat: true })).toEqual({ kieu: 'co', pet: 'lua_phuong', cap: 3, ten: undefined, shopBat: true })
    for (const shopBat of [false, 'true', 1, null, undefined]) {
      const r = docThanThu({ pet: 'lua_phuong', cap: 3, shopBat }) as Record<string, unknown>
      expect('shopBat' in r).toBe(false)
    }
    expect(docThanThu(null)).toEqual({ kieu: 'chua_chon' })
    expect(docThanThu({ shopBat: true })).toEqual({ kieu: 'chua_chon' })
  })
  it('khoá nguồn: nút chỉ cho học sinh có thần thú + shopBat; phụ huynh không có; cổng đặt khoá màn đầu "shop" rồi mở game; bản nhớ KHÔNG khôi phục shopBat', () => {
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    expect(b).toMatch(/!laPh && onMoShop && duLieu\.thanThu\.kieu === 'co' && duLieu\.thanThu\.shopBat === true/)
    expect(b).toMatch(/data-vung="mo-cua-hang"/)
    const cong = doc('src/screens/StudentPortalScreen.tsx')
    expect(cong).toMatch(/sessionStorage\.setItem\(KHOA_MAN_DAU_GAME, 'shop'\)/)
    expect(doc('src/screens/ParentPortalScreen.tsx')).not.toMatch(/onMoShop|shopBat|Cửa hàng/)
    const ad = doc('src/lib/nhiem-vu-adapter.ts')
    const ph = ad.slice(ad.indexOf('export function phucHoiBanNho'))
    expect(ph.slice(0, 2600)).not.toMatch(/shopBat/)
    const game = doc('src/game/than-thu-v2/Game.tsx')
    expect(game).toMatch(/shop:prop==='shop'\|\|luu==='shop'/)
    expect(game).toMatch(/moShopLucDau=\{manDauDoc\.shop\}/)
  })
})

describe('Bảng nhiệm vụ: nút Cửa hàng dưới đầu trang', () => {
  const NOW = Date.parse('2026-09-21T19:00:00+07:00')
  const co = (shopBat?: true): TrangThaiThanThu => ({ kieu: 'co', pet: 'lua_phuong', cap: 12, ten: 'Hoả Long', ...(shopBat ? { shopBat } : {}) })
  const duLieu = (t: TrangThaiThanThu): DuLieuBangNhiemVu => ({
    ...dungBangNhiemVu({ keHoachNgay: null, keHoachTroLy: tongHopKeHoachTroLy({ sbd: 't', hoTen: 'Minh', dsBtvn: [], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now: NOW }), now: NOW }),
    thanThu: t,
  })
  const ve = (t: TrangThaiThanThu, o: { onMoShop?: () => void; vaiTro?: 'hocsinh' | 'phuhuynh' } = {}) =>
    render(<BangNhiemVu vaiTro={o.vaiTro ?? 'hocsinh'} hoTen="Đỗ Minh" now={NOW} duLieu={duLieu(t)} taiVinhDanh={async () => ({ day: '2026-09-21', live: true, winners: [] })} onHanhDong={() => {}} onVaoThi={() => {}} onMoThanThu={() => {}} onMoShop={o.onMoShop} />)
  const nut = (v: ReturnType<typeof render>) => v.container.querySelector<HTMLButtonElement>('[data-vung="mo-cua-hang"]')

  it('shopBat:true + có thần thú ⇒ có nút "Cửa hàng" (chữ ở chu-shop.ts); chạm ⇒ onMoShop', () => {
    const onMoShop = vi.fn()
    const v = ve(co(true), { onMoShop })
    expect(nut(v)?.textContent).toBe(chuCuaHang)
    fireEvent.click(nut(v)!)
    expect(onMoShop).toHaveBeenCalledTimes(1)
  })
  it('cờ tắt (không shopBat) / chưa chọn thú / không có onMoShop / app phụ huynh ⇒ KHÔNG có nút', () => {
    expect(nut(ve(co(), { onMoShop: () => {} }))).toBeNull()
    cleanup()
    expect(nut(ve({ kieu: 'chua_chon' }, { onMoShop: () => {} }))).toBeNull()
    cleanup()
    expect(nut(ve(co(true)))).toBeNull()
    cleanup()
    expect(nut(ve(co(true), { onMoShop: () => {}, vaiTro: 'phuhuynh' }))).toBeNull()
  })
})

describe('taoShopApiThat — nối 5 lệnh thật', () => {
  const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body }) as unknown as Response
  const dung2 = (fetchFn: typeof fetch, hanMs?: number) => taoShopApiThat({ token: 'tok-hs', layDiaChi: async () => 'https://may.test', fetchFn, hanMs })

  it('mỗi lệnh POST /game-v2/<lệnh> đúng thân + token; trả nguyên đáp của máy chủ', async () => {
    const goi: { url: string; body: Record<string, unknown> }[] = []
    const f = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      goi.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      return res({ ok: true, x: goi.length })
    }) as unknown as typeof fetch
    const api = dung2(f)
    await api.vangXem()
    await api.vangDoi(180, 'doi-7f3a-1')
    await api.shopDanhSach()
    await api.shopMua('VD-04', 120, 'mua-91c2-1')
    await api.thuMacDo('vet', 'VD-04')
    await api.thuMacDo('vet', null)
    expect(goi.map((g) => g.url.replace('https://may.test', ''))).toEqual(['/game-v2/vang-xem', '/game-v2/vang-doi', '/game-v2/shop-danh-sach', '/game-v2/shop-mua', '/game-v2/thu-mac-do', '/game-v2/thu-mac-do'])
    expect(goi.map((g) => g.body)).toEqual([
      { token: 'tok-hs' },
      { soExp: 180, khoaYeuCau: 'doi-7f3a-1', token: 'tok-hs' },
      { token: 'tok-hs' },
      { maMon: 'VD-04', giaThay: 120, khoaYeuCau: 'mua-91c2-1', token: 'tok-hs' },
      { oGan: 'vet', maMon: 'VD-04', token: 'tok-hs' },
      { oGan: 'vet', maMon: null, token: 'tok-hs' },
    ])
  })

  it('lỗi hợp đồng {ok:false, ma, loi} ⇒ LoiShopApi(ma, loi) — lời máy chủ đi thẳng; thiếu loi ⇒ dùng error; thiếu cả hai ⇒ chữ chung; thiếu ma ⇒ loi_may_chu', async () => {
    const api1 = dung2((async () => res({ ok: false, ma: 'thieu_vang', loi: 'Chưa đủ vàng — còn thiếu 30 vàng.' })) as unknown as typeof fetch)
    const e1 = await api1.shopMua('VD-04', 120, 'k1234567').catch((e) => e)
    expect(e1).toBeInstanceOf(LoiShopApi)
    expect(e1.ma).toBe('thieu_vang')
    expect(e1.message).toBe('Chưa đủ vàng — còn thiếu 30 vàng.')
    const e2 = await dung2((async () => res({ ok: false, error: 'Phiên game hết hạn' })) as unknown as typeof fetch).vangXem().catch((e) => e)
    expect([e2.ma, e2.message]).toEqual(['loi_may_chu', 'Phiên game hết hạn'])
    const e3 = await dung2((async () => res({ ok: false })) as unknown as typeof fetch).vangXem().catch((e) => e)
    expect([e3.ma, e3.message]).toEqual(['loi_may_chu', chuLoiKhongRo])
    const e4 = await dung2((async () => res('không phải đối tượng')) as unknown as typeof fetch).vangXem().catch((e) => e)
    expect(e4).toBeInstanceOf(LoiShopApi)
  })

  it('rớt mạng / thân không đọc được (HTML 503) ⇒ mat_mang + lời mất mạng; hết giờ ⇒ huỷ lượt gọi ⇒ mat_mang (không treo)', async () => {
    const e1 = await dung2((async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch).shopDanhSach().catch((e) => e)
    expect([e1.ma, e1.message]).toEqual([MA_MAT_MANG, loiMayChu.matMang])
    const e2 = await dung2((async () => ({ ok: false, status: 503, json: async () => { throw new SyntaxError('Unexpected token <') } }) as unknown as Response) as unknown as typeof fetch).vangXem().catch((e) => e)
    expect(e2.ma).toBe(MA_MAT_MANG)
    vi.useFakeTimers()
    try {
      const treo = ((_u: unknown, init?: RequestInit) => new Promise((_r, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))) as unknown as typeof fetch
      const p = dung2(treo, 5000).vangDoi(100, 'khoa-treo-1').catch((e) => e)
      await vi.advanceTimersByTimeAsync(4999)
      let xong = false
      void p.then(() => { xong = true })
      await vi.advanceTimersByTimeAsync(0)
      expect(xong).toBe(false)
      await vi.advanceTimersByTimeAsync(2)
      const e3 = await p
      expect(e3.ma).toBe(MA_MAT_MANG)
      expect(HAN_GOI_SHOP_MS).toBe(20_000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('khoá nguồn: bộ nối không lưu gì ở máy (không localStorage/sessionStorage), không tự thử lại/vòng nền, không màu thô; chữ tiếng Việt chỉ ở chu-shop.ts', () => {
    const s = doc('src/game/than-thu-v2/shop/may-chu-that.ts')
    expect(s).not.toMatch(/localStorage|sessionStorage|indexedDB/)
    expect(s).not.toMatch(/setInterval|batNhipBenVung|batVongTrucTiep/)
    expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const v = doc('src/game/than-thu-v2/dao/ManShopThat.tsx')
    expect(v).toMatch(/ThuMacDo/)
    expect(v).toMatch(/useMemo\(\(\) => taoShopApiThat/) // api ổn định giữa các lần vẽ (ManShop yêu cầu)
    const dao = doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')
    // Gói chính / gói Đảo KHÔNG nhập chu-shop.ts (module dùng chung với gói cửa hàng bị gộp NGUYÊN vào gói chứa nó — đo ở bản dựng): chỉ nhãn nhỏ ở chu-cua-vao.ts
    expect(dao).not.toMatch(/shop\/chu-shop/)
    expect(doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')).not.toMatch(/shop\/chu-shop/)
    expect(doc('src/game/than-thu-v2/shop/chu-shop.ts')).toMatch(/export \{ chuCuaHang \} from '\.\/chu-cua-vao'/)
    expect(dao).toMatch(/lazy\(\(\)=>import\('\.\/ManShopThat'\)\)/)
    expect(doc('src/game/than-thu-v2/shop/ManShop.tsx')).not.toMatch(/phu-kien\/ThuMacDo/) // màn cửa hàng vẫn không import lớp mặc đồ
  })
})

beforeEach(() => {
  sessionStorage.clear()
})
