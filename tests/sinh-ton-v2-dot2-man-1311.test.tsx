// TRÒ «SINH TỒN» bản 2 ĐỢT 2 · PHẦN MÀN (thầy duyệt bản vẽ 13/11: docs/ban-ve-sinh-ton-v2-1311/ ảnh 06 · 07 · 08 · 09 · 13 · 14; hợp đồng màn ở
// src/lib/live-khoi/kieu.ts «HỢP ĐỒNG CHO MÀN»). Khoá: truy nã thủ khoa (dải báo, con dấu, +2 cấp), «đánh trượt đại học», hộp 4 loại (`apHop`, thẻ báo,
// Pháo Sao tạm), gói gửi mang `capSung`, biểu cảm (chạm bé ma của em mở nhãn, chạm chỗ khác vẫn đi), bảng vàng (thẻ em + bục máy thầy, máy bù không lên),
// bản êm không chữ «trượt», ảnh mỏng giữ dòng nhưng KHÔNG tính sát thương, «vào đội» chỉ đọc từ danh sách lớp, khung nhìn ≤ 840.
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TroSinhTon from '../src/components/live-khoi/TroSinhTon'
import { NUA_CHEO_TOI_DA, camNhin, chamMaEm, diemMaEm, taoGoi, tiMan, bamSo } from '../src/components/live-khoi/sinh-ton-ve'
import { SAO_MS, VAN_MS, loaiHop, taoBanDo, taoToi, type LoaiHop } from '../src/lib/live-khoi/sinh-ton-loi'
import type { KenhLop, NguoiLop, SinhTonGui, TinLop } from '../src/lib/live-khoi/kieu'

function ctxGia(): CanvasRenderingContext2D {
  const dich: Record<string | symbol, unknown> = {}
  return new Proxy(dich, {
    get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : k === 'createPattern' ? () => ({}) : () => undefined),
    set: (t, k, v) => { t[k] = v; return true },
  }) as unknown as CanvasRenderingContext2D
}
const DS: NguoiLop[] = [{ sbd: 'S0', ten: 'Nguyễn Thị Hà', doi: 0 }, { sbd: 'S2', ten: 'Lê Gia Huy', doi: 1 }]
const soHopLoai = (l: LoaiHop): number => { for (let n = 1; ; n++) if (loaiHop(n) === l) return n }
/** Ảnh chụp cơ bản: em S0 + bạn S2 (khác đội) ở xa nhau, không ai bắn. */
const ANH = { ds: { S0: [400, 400, 100, 0, 1], S2: [1400, 400, 100, 1, 1] }, an: [], d: [0, 0, 0, 0], v: 1, c: 0, h: [-1, ''] }

function moTro(p: { banEm?: boolean; xemThoi?: boolean; ds?: NguoiLop[] } = {}) {
  const nghe: ((t: TinLop) => void)[] = []
  const goi: SinhTonGui[] = []
  const kenh: KenhLop = { gui: (_k, x) => { goi.push(x as SinhTonGui) }, nghe: (_k, f) => { nghe.push(f); return () => {} } }
  const ds = p.ds ?? DS
  const el = (d: NguoiLop[]) => <TroSinhTon toi={p.xemThoi ? null : d[0]} ds={d} kenh={kenh} soEm={d.length} xemThoi={p.xemThoi} banEm={p.banEm} />
  const r = render(el(ds))
  const anh = (x: unknown) => act(() => { for (const f of nghe) f({ t: 'lop', k: 'tro', x, l: Date.now() } as unknown as TinLop) })
  return { ...r, anh, goi, doiDs: (d: NguoiLop[]) => r.rerender(el(d)) }
}
const chu = (c: HTMLElement, sel: string) => c.querySelector(sel)?.textContent ?? ''

describe('màn trò đợt 2 (jsdom, không chạy vòng khung)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctxGia()) as never)
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    localStorage.clear()
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('TRUY NÃ: `tk` = bạn khác ⇒ dải «THỦ KHOA <tên> · n lượt hạ» + «Cả lớp đang truy nã…» + dòng tin; em là `tk` ⇒ con dấu vàng «EM LÀ THỦ KHOA!»', () => {
    const { container, anh } = moTro()
    anh(ANH)
    anh({ ...ANH, an: [['S2', '~1-1', 0, 1, 0], ['S2', '~1-2', 0, 2, 0], ['S2', '~1-3', 0, 3, 0]], tk: 'S2' })
    expect(chu(container, '.st-truy b')).toBe('THỦ KHOA Gia Huy · 3 lượt hạ')
    expect(chu(container, '.st-truy span')).toBe('Cả lớp đang truy nã · hạ bạn ấy là súng lên cấp ngay')
    expect(chu(container, '.st-tin')).toContain('Gia Huy thành thủ khoa ván 1!')
    anh({ ...ANH, tk: 'S0' })
    expect(chu(container, '.st-truy b')).toContain('EM LÀ THỦ KHOA')
    expect(chu(container, '.st-dau b')).toBe('EM LÀ THỦ KHOA!')
    expect(container.querySelector('.st-dau')!.getAttribute('data-vang')).toBe('1')
  })

  it('em hạ THỦ KHOA (an[i][4] = 1) ⇒ «ĐÃ TIÊU DIỆT THỦ KHOA!», súng lên 2 cấp một lần (1 → 3), tin «Em diệt thủ khoa!»; hạ người có chuỗi ≥ 3 ⇒ «ĐÁNH TRƯỢT ĐẠI HỌC!»', () => {
    const { container, anh } = moTro()
    anh({ ...ANH, tk: 'S2' })
    anh({ ...ANH, an: [['S0', 'S2', 4, 1, 1]] })
    expect(chu(container, '.st-dau b')).toBe('ĐÃ TIÊU DIỆT THỦ KHOA!')
    expect(container.querySelectorAll('.st-sung .st-vach i[data-co]')).toHaveLength(3)
    expect(chu(container, '.st-tin')).toContain('Em diệt thủ khoa!')
    expect(container.querySelector('.st-truy')).toBeNull() // `tk` vắng ⇒ hết truy nã
    anh({ ...ANH, an: [['S0', '~2-1', 3, 2, 0]] })
    expect(chu(container, '.st-dau b')).toBe('ĐÁNH TRƯỢT ĐẠI HỌC!')
    // Chuỗi thấp, không phải thủ khoa ⇒ câu chuỗi theo chuỗi CỦA PHÒNG (an[i][3]).
    anh({ ...ANH, an: [['S0', '~2-2', 0, 3, 0]] })
    expect(chu(container, '.st-dau b')).toBe('ĐỖ ĐẠI HỌC!')
  })

  it('BẢN ÊM: truy nã vẫn có (dải nhẹ), nhưng không con dấu, không chữ «trượt» ở bất cứ đâu', () => {
    const { container, anh } = moTro({ banEm: true })
    anh({ ...ANH, an: [['S2', '~1-1', 0, 1, 0], ['S2', '~1-2', 0, 2, 0], ['S2', '~1-3', 0, 3, 0]], tk: 'S2' })
    expect(container.querySelector('.st-truy')).not.toBeNull()
    anh({ ...ANH, an: [['S0', 'S2', 3, 1, 1]] })
    anh({ ...ANH, an: [['S0', '~2-1', 5, 2, 0]], tk: 'S0' })
    expect(container.querySelector('.st-dau')).toBeNull()
    expect(container.textContent!.toLowerCase()).not.toContain('trượt')
  })

  it('HỘP 4 LOẠI: em nhặt (h[1] = em) ⇒ thẻ báo theo `loaiHop(h[0])`; Pháo Sao ⇒ vạch súng cấp 6 TẠM + đếm 10 giây (cấp thật giữ); máy bù nhặt ⇒ không thẻ', () => {
    const { container, anh } = moTro()
    anh(ANH)
    const nK = soHopLoai('khien')
    anh({ ...ANH, h: [nK, 'S0'] })
    expect(chu(container, '.st-the-hop')).toBe('Khiên 5 giây · đạn không trúng được em')
    expect(container.querySelector('.st-the-hop')!.getAttribute('data-loai')).toBe('khien')
    expect(chu(container, '.st-tin')).toContain('Em nhặt hộp Khiên 5 giây')
    const nS = soHopLoai('sao')
    anh({ ...ANH, h: [nS, 'S0'] })
    expect(chu(container, '.st-the-hop')).toContain('Pháo Sao 10 giây')
    const sung = container.querySelector('.st-sung')!
    expect(sung.getAttribute('data-tam')).toBe('1')
    expect(sung.querySelectorAll('.st-vach i[data-co]')).toHaveLength(6)
    expect(sung.textContent).toContain(`còn ${SAO_MS / 1000} giây`)
    // Hộp không còn «đầy máu + lên cấp»: cấp thật vẫn 1 (không có dòng «Súng lên cấp»).
    expect(container.textContent).not.toContain('Súng lên cấp')
    const truoc = chu(container, '.st-the-hop')
    anh({ ...ANH, h: [soHopLoai('mau') + 40, '~1-1'] })
    expect(chu(container, '.st-the-hop')).toBe(truoc) // thẻ của máy bù không có
    expect(chu(container, '.st-tin')).not.toContain('nhặt hộp Hồi')
  })

  it('gói gửi: `p[3]` = `capSung` (đang Pháo Sao ⇒ 6, hết ⇒ cấp thật); không bắn ⇒ không có `t`', () => {
    const bd = taoBanDo(0), nay = 1_000_000
    const tt = { ...taoToi(bd, 0, nay), cap: 2, saoDen: nay + SAO_MS }
    expect(taoGoi(tt, nay, false, '').p[3]).toBe(6)
    expect(taoGoi(tt, nay + SAO_MS + 1, false, '').p[3]).toBe(2)
    expect(taoGoi(tt, nay, false, '')).not.toHaveProperty('t')
    expect(taoGoi(tt, nay, true, 'S2')).toMatchObject({ t: 'S2', p: [Math.round(tt.x), Math.round(tt.y), 0, 6] })
  })

  it('BẢNG VÀNG máy em (ảnh 14): `bv` + `hg` ⇒ thẻ cuối ván «Em: n lượt hạ · hạng hg trong lớp» + top 3 (dòng của em đánh dấu); máy bù trong `bv` không hiện', () => {
    const { container, anh } = moTro()
    anh({ ...ANH, an: [['S0', '~1-1', 0, 1, 0], ['S2', '~1-2', 0, 1, 0], ['S2', '~1-3', 0, 2, 0]], d: [1, 2, 0, 0] })
    anh({ ...ANH, d: [1, 2, 0, 0], bv: [['S2', 2], ['~3-1', 9], ['S0', 1]], hg: 2 })
    const kq = container.querySelector('.st-kq[data-vang]') as HTMLElement
    expect(kq).not.toBeNull()
    expect(kq.querySelector('h2')!.textContent).toBe('Đội Kali đỗ thủ khoa ván 1!')
    expect(kq.textContent).toContain('Em: 1 lượt hạ · hạng 2 trong lớp')
    const dong = [...kq.querySelectorAll('ol li')].map((li) => li.textContent)
    expect(dong).toEqual(['Gia Huy · 2 lượt hạ', 'Thị Hà (em) · 1 lượt hạ'])
    expect(kq.querySelector('li[data-toi]')!.textContent).toContain('(em)')
    expect(kq.querySelector('.st-kq-dau')!.textContent).toBe('Đỗ á khoa')
    expect(kq.textContent).not.toMatch(/Máy|~3/)
  })

  it('BẢNG VÀNG máy thầy (ảnh 13): bục 3 khối (thứ tự 2 · 1 · 3), tên + lượt hạ, «thủ khoa» cạnh người đang giữ vương miện, ai diệt thủ khoa; máy bù không bao giờ có mặt', () => {
    const ds: NguoiLop[] = [...DS, { sbd: 'S3', ten: 'Trần Minh Anh', doi: 2 }, { sbd: 'S4', ten: 'Ngô Bảo Ngọc', doi: 3 }]
    const { container, anh } = moTro({ xemThoi: true, ds })
    anh({ ...ANH, an: [['S3', 'S4', 0, 1, 0]], tk: 'S2', d: [0, 3, 1, 0] })
    anh({ ...ANH, an: [['S3', 'S2', 0, 2, 1]], d: [0, 3, 2, 0] })
    anh({ ...ANH, tk: 'S0', d: [0, 3, 2, 0], bv: [['S0', 4], ['~2-7', 8], ['S2', 3], ['S3', 2]] })
    const vv = container.querySelector('.st-vv') as HTMLElement
    expect(vv).not.toBeNull()
    const buc = [...vv.querySelectorAll('.st-buc-o')].map((o) => [o.getAttribute('data-hang'), o.querySelector('.st-buc-ten')!.textContent])
    expect(buc).toEqual([['2', 'Gia Huy3 lượt hạ'], ['1', 'Thị Hà4 lượt hạ · thủ khoa'], ['3', 'Minh Anh2 lượt hạ']])
    expect(vv.textContent).toContain('Đội Kali đỗ thủ khoa ván 1 · 3 lượt hạ')
    expect(vv.textContent).toContain('Đã tiêu diệt thủ khoa: Minh Anh')
    expect(vv.textContent).not.toMatch(/Máy|~2/)
  })

  it('máy thầy: sang ván mới (`v` đổi) ⇒ lượt hạ đếm lại — dải truy nã ván 2 ghi số của ván 2, không cộng dồn', () => {
    const { container, anh } = moTro({ xemThoi: true })
    const ba = [['S2', '~1-1', 0, 1, 0], ['S2', '~1-2', 0, 2, 0], ['S2', '~1-3', 0, 3, 0]]
    anh({ ...ANH, an: ba, tk: 'S2' })
    expect(chu(container, '.st-truy b')).toBe('THỦ KHOA Gia Huy · 3 lượt hạ')
    anh({ ...ANH, v: 2 })
    expect(container.querySelector('.st-truy')).toBeNull()
    anh({ ...ANH, v: 2, an: ba, tk: 'S2' })
    expect(chu(container, '.st-truy b')).toBe('THỦ KHOA Gia Huy · 3 lượt hạ')
    expect(chu(container, '.st-dau b')).toBe('MỞ BÀI!')
  })

  it('người mới lọt vào ảnh chụp («chỉ gửi gần») KHÔNG báo «vào đội» ở người nghe', () => {
    const { container, anh } = moTro()
    anh(ANH)
    anh({ ...ANH, ds: { ...ANH.ds, S7: [500, 420, 100, 2, 1] } })
    expect(container.textContent).not.toMatch(/ vào Đội/)
  })
})

// ── Chạy VÒNG KHUNG thật trong jsdom: rAF tay, khung 844 × 390, giờ máy cố định đầu một ván ──
describe('màn trò đợt 2 · vòng khung (jsdom)', () => {
  let hang: FrameRequestCallback[] = []
  let luc = 0
  const T0 = VAN_MS * 4000 + 5000
  const khung = (n = 1, buoc = 100) => { for (let k = 0; k < n; k++) { luc += buoc; act(() => { const h = hang; hang = []; for (const f of h) f(luc) }) } }
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctxGia()) as never)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(844)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(390)
    hang = []; luc = performance.now()
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { hang.push(f); return hang.length })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    localStorage.clear()
  })
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

  /** Tâm thân bé ma của em trên khung lúc vừa vào (đội 0, sân cỡ 0, đứng yên ở trại). */
  const maEm = () => {
    const bd = taoBanDo(0), tt = taoToi(bd, 0, T0, bamSo('S0') / 997), ti = tiMan(844, 390, window.devicePixelRatio || 1, false, bd)
    return diemMaEm(tt.x, tt.y, camNhin(bd, 844, 390, ti, tt.x, tt.y), ti, 844, 390)
  }
  const cham = (vung: Element, x: number, y: number) => { fireEvent.pointerDown(vung, { clientX: x, clientY: y, pointerId: 1 }); fireEvent.pointerUp(vung, { clientX: x, clientY: y, pointerId: 1 }) }

  it('BIỂU CẢM: chạm bé ma của em ⇒ 4 nhãn tròn; chọn «Theo tớ!» ⇒ gói kế mang `e: 2`; em đứng yên (chạm vào mình không phải «chạy tới»)', () => {
    const { container, goi, anh } = moTro()
    anh(ANH)
    khung(2)
    const p0 = goi.at(-1)!.p
    const m = maEm()
    cham(container.querySelector('.st-vung')!, m.x, m.y)
    const nhan = [...container.querySelectorAll('button.st-nhan')]
    expect(nhan.map((b) => b.textContent)).toEqual(['♥Hay quá!', '!!Cứu với!', '→Theo tớ!', 'haHaha'])
    for (const b of nhan) { const s = (b as HTMLElement).style; expect(parseFloat(s.left)).toBeGreaterThanOrEqual(32); expect(parseFloat(s.top)).toBeGreaterThanOrEqual(32) }
    fireEvent.click(nhan[2])
    expect(container.querySelector('.st-nhan')).toBeNull()
    khung(4, 120)
    expect(goi.filter((g) => g.e !== undefined).map((g) => g.e)).toEqual([2])
    expect(goi.at(-1)!.p.slice(0, 2)).toEqual(p0.slice(0, 2))
  })

  it('BIỂU CẢM không phá cử chỉ: chạm CHỖ KHÁC ⇒ không mở nhãn, bé ma chạy tới; nhãn đang mở mà chạm chỗ khác ⇒ đóng và vẫn chạy', () => {
    const { container, goi, anh } = moTro()
    anh(ANH)
    khung(2)
    const p0 = goi.at(-1)!.p, vung = container.querySelector('.st-vung')!, m = maEm()
    expect(chamMaEm(m.x + 300, m.y, m, 1)).toBe(false)
    cham(vung, m.x, m.y)
    expect(container.querySelectorAll('.st-nhan')).toHaveLength(4)
    cham(vung, m.x + 300, m.y + 40)
    expect(container.querySelector('.st-nhan')).toBeNull()
    khung(8, 100)
    const p1 = goi.at(-1)!.p
    expect(Math.hypot(p1[0] - p0[0], p1[1] - p0[1])).toBeGreaterThan(40)
    expect(goi.some((g) => g.e !== undefined)).toBe(false)
  })

  it('ẢNH MỎNG (`m: 1`): dòng vắng được giữ để VẼ nhưng KHÔNG tính sát thương; ảnh đủ có kẻ bắn thì tính (đối chứng)', () => {
    // Kẻ bắn Pháo Sao (74 máu / giây ⇒ 18,5 mỗi ảnh) đứng trong tầm, bắn thẳng em. Qua 2 giây bất tử rồi mới bắn.
    const BAN = { ...ANH, ds: { S0: [200, 150, 100, 0, 1], S2: [420, 160, 100, 1, 6, 'S0'] } }
    const MONG = { ...ANH, ds: {}, m: 1 }
    for (const mong of [true, false]) {
      vi.setSystemTime(T0)
      const { container, anh, unmount } = moTro()
      khung(1)
      vi.setSystemTime(T0 + 2500)
      anh(BAN)
      for (let k = 0; k < 8; k++) { vi.setSystemTime(T0 + 2600 + k * 250); anh(mong ? MONG : BAN) }
      khung(1)
      expect(!!container.querySelector('.st-ha')).toBe(!mong)
      unmount()
    }
  })

  it('«vào đội» chỉ khi DANH SÁCH LỚP có thêm em (không phải khi người mới lọt vào ảnh chụp)', () => {
    const { container, anh, doiDs } = moTro()
    anh(ANH)
    khung(2)
    anh({ ...ANH, ds: { ...ANH.ds, S7: [500, 420, 100, 2, 1] } })
    khung(6, 100)
    expect(chu(container, '.st-bao')).not.toMatch(/ vào /)
    doiDs([...DS, { sbd: 'S9', ten: 'Phạm Văn Nam', doi: 2 }])
    khung(6, 100)
    expect(chu(container, '.st-bao')).toBe('Văn Nam vào Đội Đồng')
  })
})

describe('khung nhìn máy em ≤ NUA_CHEO_TOI_DA (hợp đồng «chỉ gửi gần»)', () => {
  it('mọi cỡ màn: nửa đường chéo (đơn vị sân) ≤ 840; điện thoại ngang giữ nguyên tỉ lệ cũ', () => {
    const bd = taoBanDo(0)
    for (const [W, H] of [[844, 390], [667, 375], [1180, 820], [1920, 1080], [2560, 1440], [3840, 2160], [390, 844]]) for (const dpr of [1, 2, 3]) {
      const ti = tiMan(W, H, dpr, false, bd)
      expect(Math.hypot(W, H) / 2 / ti).toBeLessThanOrEqual(NUA_CHEO_TOI_DA + 1e-9)
    }
    // 844 × 390: giống công thức đợt 1 (√(W·H / 520 000), làm tròn ô mẫu).
    expect(tiMan(844, 390, 2, false, bd)).toBeCloseTo(Math.round(256 * Math.sqrt((844 * 390) / 520_000) * 2) / 512, 9)
  })
})
