// BẢNG TIN KIỂU SÀN GIAO DỊCH · cụm (c): BẢN ĐỒ LỚP 3D (Boss giao 21/09). Phần THUẦN (bố cục cột, chiều cao, màu, nhãn không đè), bản lùi isometric, và thành phần BanDo3D
// (three.js nạp lười, lùi 2D khi không có WebGL / hỏng / mất ngữ cảnh, dừng khi tab ẩn, giải phóng khi rời màn, gợi ý khi rê chuột).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { boTriLop, datNhanChongLap, docRgb, mauTheoTiLe, tiLeLop, tyLeCao, type ViTriNhan } from '../src/lib/bang-tin-san/ban-do-chung'
import { veIso, type MauIso } from '../src/lib/bang-tin-san/ban-do-iso'
import { taoDuLieuGia } from '../src/lib/bang-tin-san/mau-gia'
import type { LopSan } from '../src/lib/bang-tin-san/kieu'
import type { MauSan } from '../src/components/bang-tin-san/hooks'

const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
const NAY = Date.parse('2026-09-21T08:28:36.000Z')
const MAU: MauSan = {
  nen: 'rgb(255,255,255)', mat: 'rgb(2,2,2)', 'mat-2': 'rgb(3,3,3)', vien: 'rgb(4,4,4)', chu: 'rgb(5,5,5)', 'chu-phu': 'rgb(6,6,6)', 'chu-mo': 'rgb(7,7,7)', duong: 'rgb(8,8,255)',
  la: 'rgb(0,200,0)', do: 'rgb(200,0,0)', vang: 'rgb(200,200,0)', 'xam-o': 'rgb(13,13,13)', luoi: 'rgb(14,14,14)', 'tren-gia': 'rgb(15,15,15)',
}
const lop = (ten: string, soCau: number, soCauDung: number, siSo = 30, daHoc = 5): LopSan => ({ lop: ten, siSo, daHoc, soCau, soCauDung })

describe('boTriLop — lưới cột quanh gốc', () => {
  it('0 lớp ⇒ rỗng; 1 lớp ⇒ ở gốc; 6 lớp ⇒ 3 cột × 2 hàng đối xứng; 5 lớp ⇒ hàng cuối canh giữa', () => {
    expect(boTriLop(0)).toEqual([])
    expect(boTriLop(-3)).toEqual([])
    expect(boTriLop(1)).toEqual([{ x: 0, z: 0 }])
    expect(boTriLop(6)).toEqual([{ x: -1, z: -0.5 }, { x: 0, z: -0.5 }, { x: 1, z: -0.5 }, { x: -1, z: 0.5 }, { x: 0, z: 0.5 }, { x: 1, z: 0.5 }])
    expect(boTriLop(5).slice(3)).toEqual([{ x: -0.5, z: 0.5 }, { x: 0.5, z: 0.5 }])
    expect(boTriLop(2)).toEqual([{ x: -0.5, z: 0 }, { x: 0.5, z: 0 }])
  })
  it('mọi ô KHÁC nhau; lưới canh giữa gốc (hàng trên cùng và dưới cùng đối xứng qua gốc) với 1…12 lớp', () => {
    for (let n = 1; n <= 12; n++) {
      const v = boTriLop(n)
      expect(new Set(v.map((p) => `${p.x},${p.z}`)).size).toBe(n)
      expect(Math.min(...v.map((p) => p.z))).toBeCloseTo(-Math.max(...v.map((p) => p.z)), 9)
      expect(Math.min(...v.map((p) => p.x))).toBeCloseTo(-Math.max(...v.map((p) => p.x)), 9)
    }
  })
})

describe('tyLeCao · docRgb · mauTheoTiLe · tiLeLop', () => {
  it('cột cao nhất chạm 4,2; sàn 320 câu (buổi sáng ít câu không kéo cột vọt)', () => {
    expect(tyLeCao(0)).toBeCloseTo(4.2 / 320, 9)
    expect(tyLeCao(300)).toBeCloseTo(4.2 / 320, 9)
    expect(tyLeCao(1000)).toBeCloseTo(4.2 / 1050, 9)
    expect(1000 * tyLeCao(1000)).toBeLessThan(4.2)
    expect(tyLeCao(1000, 8)).toBeCloseTo(8 / 1050, 9)
  })
  it('docRgb đọc hex 3/6 chữ số, rgb(), rgb với khoảng trắng; rác ⇒ đen', () => {
    expect(docRgb('#1a73e8')).toEqual([26, 115, 232])
    expect(docRgb('#fff')).toEqual([255, 255, 255])
    expect(docRgb('rgb(10, 20, 30)')).toEqual([10, 20, 30])
    expect(docRgb('rgb(10 20 30 / 0.5)')).toEqual([10, 20, 30])
    expect(docRgb('không phải màu')).toEqual([0, 0, 0])
  })
  it('màu theo tỉ lệ đúng: ≤ 72 ⇒ đỏ, 83 ⇒ vàng, ≥ 94 ⇒ xanh lá; giữa đoạn nội suy; ngoài khoảng bị kẹp', () => {
    const m = (p: number) => mauTheoTiLe(p, '#c80000', '#c8c800', '#00c800')
    expect(m(72)).toEqual([200, 0, 0])
    expect(m(40)).toEqual([200, 0, 0])
    expect(m(83)).toEqual([200, 200, 0])
    expect(m(94)).toEqual([0, 200, 0])
    expect(m(100)).toEqual([0, 200, 0])
    expect(m(77.5)).toEqual([200, 100, 0]) // nửa đoạn đỏ → vàng
    expect(m(88.5)).toEqual([100, 200, 0]) // nửa đoạn vàng → xanh
  })
  it('tiLeLop: chưa có câu nào ⇒ null (cột xám, không bịa màu); có câu ⇒ %', () => {
    expect(tiLeLop({ soCau: 0, soCauDung: 0 })).toBeNull()
    expect(tiLeLop({ soCau: 200, soCauDung: 150 })).toBe(75)
  })
})

describe('datNhanChongLap — nhãn không đè nhau', () => {
  const nhan = (x: number, y: number, w = 80, gan = 0): ViTriNhan => ({ x, y, w, gan })
  const chong = (a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 4 && Math.abs(a.y - b.y) < 33
  it('hai nhãn cùng chỗ ⇒ đẩy một cái LÊN 33 px (cái thấp hơn giữ chỗ), giữ y0 gốc để vẽ dây dẫn', () => {
    const r = datNhanChongLap([nhan(100, 200), nhan(100, 200)], 500)
    expect(r.some((p) => p.y === 200)).toBe(true)
    expect(r.some((p) => p.y === 167)).toBe(true)
    expect(r.every((p) => p.y0 === 200)).toBe(true)
  })
  it('nhãn THẤP hơn trên màn (y lớn) giữ chỗ, nhãn CAO hơn bị đẩy lên — không đảo ngược thứ tự trên-dưới', () => {
    const r = datNhanChongLap([nhan(100, 190), nhan(100, 200)], 500)
    expect(r[1]!.y).toBe(200)
    expect(r[0]!.y).toBe(167)
  })
  it('nhãn đã cách xa nhau thì KHÔNG bị đẩy', () => {
    const r = datNhanChongLap([nhan(60, 200), nhan(300, 200), nhan(60, 300)], 500)
    expect(r.map((p) => p.y)).toEqual([200, 200, 300])
  })
  it('sau khi đặt, không cặp nhãn nào chồng nhau (nhiều tổ hợp ngẫu nhiên có hạt giống); mọi nhãn nằm trong khung và y ≥ 33', () => {
    let h = 12345
    const rnd = () => ((h = (h * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let lan = 0; lan < 40; lan++) {
      const n = 2 + Math.floor(rnd() * 8)
      const vt = Array.from({ length: n }, () => nhan(rnd() * 500, 40 + rnd() * 300, 60 + rnd() * 60, rnd() * 100))
      const r = datNhanChongLap(vt, 500)
      for (let i = 0; i < n; i++) {
        expect(r[i]!.y).toBeGreaterThanOrEqual(33)
        expect(r[i]!.x - r[i]!.w / 2).toBeGreaterThanOrEqual(1.99)
        expect(r[i]!.x + r[i]!.w / 2).toBeLessThanOrEqual(500 - 1.99 + 1e-9)
        for (let j = i + 1; j < n; j++) if (r[i]!.y > 33 && r[j]!.y > 33) expect(chong(r[i]!, r[j]!), `${i}/${j}`).toBe(false)
      }
    }
  })
  it('nhãn rộng hơn khung vẫn không ném (kẹp về giữa); danh sách rỗng ⇒ rỗng; không sửa đầu vào', () => {
    expect(() => datNhanChongLap([nhan(5, 50, 900)], 300)).not.toThrow()
    expect(datNhanChongLap([], 300)).toEqual([])
    const vao = [nhan(1, 1)]
    datNhanChongLap(vao, 300)
    expect(vao[0]).toEqual({ x: 1, y: 1, w: 80, gan: 0 })
  })
})

describe('veIso — bản lùi isometric Canvas 2D', () => {
  const MI: MauIso = { nen: 'n', matNen: 'sàn', vien: 'v', do: '#c80000', vang: '#c8c800', la: '#00c800', xam: 'xám' }
  const ctxGhi = () => {
    const fill: string[] = []
    const ctx: Record<string, unknown> = { fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1 }
    for (const m of ['beginPath', 'moveTo', 'lineTo', 'closePath', 'stroke']) ctx[m] = () => {}
    ctx.fill = () => fill.push(String(ctx.fillStyle))
    return { ctx: ctx as unknown as CanvasRenderingContext2D, fill }
  }
  it('vẽ 1 nền + 3 mặt cho MỖI cột; trả đúng số vị trí nhãn theo thứ tự lớp; lớp chưa có câu ⇒ cột XÁM', () => {
    const { ctx, fill } = ctxGhi()
    const ds = [lop('A', 100, 95), lop('B', 0, 0), lop('C', 50, 20)]
    const vt = veIso(ctx, 600, 400, ds, [2, 0.1, 1], [0, 0, 0], MI)
    expect(fill).toHaveLength(1 + 3 * 3)
    expect(vt).toHaveLength(3)
    expect(fill.filter((f) => f === 'xám')).toHaveLength(3) // cột B (không câu): cả ba mặt xám
    expect(fill.filter((f) => f.startsWith('rgb(')).length).toBe(6)
    expect(vt.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
  })
  it('cột CAO hơn ⇒ nhãn nằm CAO hơn trên màn (y nhỏ hơn); không lớp ⇒ chỉ vẽ nền', () => {
    const { ctx, fill } = ctxGhi()
    const cao = veIso(ctx, 600, 400, [lop('A', 100, 90)], [3], [0], MI)
    const thap = veIso(ctx, 600, 400, [lop('A', 100, 90)], [1], [0], MI)
    expect(cao[0]!.y).toBeLessThan(thap[0]!.y)
    const g = ctxGhi()
    expect(veIso(g.ctx, 600, 400, [], [], [], MI)).toEqual([])
    expect(g.fill).toHaveLength(1)
    void fill
  })
  it('cột 0 câu vẫn có "tấm" mỏng thấy được (chiều cao tối thiểu 0,05): nhãn ở cùng chỗ với cột cao 0,05', () => {
    const a1 = veIso(ctxGhi().ctx, 600, 400, [lop('A', 0, 0)], [0], [0], MI)
    const a2 = veIso(ctxGhi().ctx, 600, 400, [lop('A', 0, 0)], [0.05], [0], MI)
    expect(a1[0]!.y).toBeCloseTo(a2[0]!.y, 9)
  })

  it('ba mặt của cột có ĐỘ SÁNG khác nhau (mặt phải tối nhất, mặt trước, mặt trên sáng nhất) để nhìn ra khối', () => {
    const g = ctxGhi()
    veIso(g.ctx, 600, 400, [lop('A', 100, 90)], [2], [0], MI)
    const so = (s: string) => s.match(/\d+/g)!.map(Number).reduce((t, x) => t + x, 0)
    const [truoc, phai, tren] = [so(g.fill[1]!), so(g.fill[2]!), so(g.fill[3]!)]
    expect(phai).toBeLessThan(truoc)
    expect(truoc).toBeLessThan(tren)
  })

  it('thứ tự vẽ: XA trước, GẦN sau (5 lớp: cột index 2 và 3 đổi chỗ theo độ sâu x + z)', () => {
    const g = ctxGhi()
    // mỗi lớp một tỉ lệ đúng khác nhau ⇒ mỗi cột một màu mặt trước khác nhau
    const ds = [lop('L0', 100, 75), lop('L1', 100, 80), lop('L2', 100, 85), lop('L3', 100, 90), lop('L4', 100, 95)]
    veIso(g.ctx, 600, 400, ds, [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], MI)
    const truoc = [1, 4, 7, 10, 13].map((i) => g.fill[i]!) // mặt trước của từng cột theo thứ tự VẼ
    const mau = (k: number) => { const c = mauTheoTiLe(75 + 5 * k, MI.do, MI.vang, MI.la); return `rgb(${c.map((v) => Math.round(v * 0.84)).join(',')})` }
    expect(truoc).toEqual([mau(0), mau(1), mau(3), mau(2), mau(4)]) // thứ tự sâu: L0, L1, L3, L2, L4
  })

  it('cột vừa có câu mới (loe > 0) sáng hơn cột thường', () => {
    const a = ctxGhi()
    const b = ctxGhi()
    veIso(a.ctx, 600, 400, [lop('A', 100, 90)], [2], [0], MI)
    veIso(b.ctx, 600, 400, [lop('A', 100, 90)], [2], [1], MI)
    const so = (s: string) => s.match(/\d+/g)!.map(Number).reduce((t, x) => t + x, 0)
    expect(so(b.fill[1]!)).toBeGreaterThan(so(a.fill[1]!))
  })
})

// ───────────────────────────── BanDo3D với three.js GIẢ (module nạp lười được thay) ─────────────────────────────
const fake = vi.hoisted(() => {
  const ban = {
    datLop: vi.fn(), datMau: vi.fn(), buoc: vi.fn(), doiKichThuoc: vi.fn(), setChon: vi.fn(), loe: vi.fn(), giaiPhong: vi.fn(),
    chon: vi.fn(() => -1), vitriNhan: vi.fn((): { x: number; y: number; w: number; gan: number }[] => []),
  }
  return { ban, taoBan3D: vi.fn(() => ban as unknown), che: { loi: false } }
})
vi.mock('../src/components/bang-tin-san/ban-do-3d-three', () => ({
  taoBan3D: (cv: HTMLCanvasElement) => {
    if (fake.che.loi) throw new Error('không tải được three')
    return fake.taoBan3D(cv)
  },
}))

describe('BanDo3D — điều phối', () => {
  let BanDo3D: typeof import('../src/components/bang-tin-san/BanDo3D').BanDo3D
  const dsLop = () => taoDuLieuGia(NAY).theoLop!
  // Đồng hồ khung hình GIẢ: vòng vẽ chỉ chạy khi test gọi chayKhung(n) — không phụ thuộc requestAnimationFrame / timer thật (máy tải nặng không làm test đỏ oan)
  let hangDoi: Array<[number, FrameRequestCallback]> = []
  let idKhung = 0
  let dongHo = 0
  const chayKhung = (n = 1) => act(() => { for (let k = 0; k < n; k++) { const ds = hangDoi; hangDoi = []; dongHo += 16; ds.forEach(([, cb]) => cb(dongHo)) } })
  const hop = (w = 400, h = 300) => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => w })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => h })
  }
  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    hangDoi = []; idKhung = 0; dongHo = performance.now()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { hangDoi.push([++idKhung, cb]); return idKhung })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { hangDoi = hangDoi.filter(([i]) => i !== id) })
    for (const f of Object.values(fake.ban)) if (typeof f === 'function' && 'mockClear' in f) (f as ReturnType<typeof vi.fn>).mockClear()
    fake.taoBan3D.mockClear()
    fake.taoBan3D.mockImplementation(() => fake.ban as unknown)
    fake.ban.chon.mockImplementation(() => -1)
    fake.ban.vitriNhan.mockImplementation(() => [])
    fake.che.loi = false
    hop()
    ;({ BanDo3D } = await import('../src/components/bang-tin-san/BanDo3D'))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
  })
  const dung = async (o: { lop?: readonly LopSan[]; itDong?: boolean } = {}) => {
    const r = render(<BanDo3D lop={o.lop ?? dsLop()} mau={MAU} phienBanMau={1} itDong={o.itDong ?? true} />)
    await waitFor(() => expect(r.container.querySelector('[data-kieu]')!.getAttribute('data-kieu')).not.toBe('cho'))
    await act(async () => {}) // xả nốt hiệu ứng thụ động (vòng vẽ) — không đoán theo thời gian
    return r
  }

  it('three tạo được ⇒ kiểu "webgl"; bản 3D nhận danh sách lớp + màu token; tiêu đề, chú giải thang màu và "Rê chuột để dừng xoay"', async () => {
    const { container } = await dung()
    expect(container.querySelector('[data-kieu]')!.getAttribute('data-kieu')).toBe('webgl')
    expect(fake.ban.datLop).toHaveBeenCalledWith(dsLop())
    expect(fake.ban.datMau).toHaveBeenCalledWith(MAU)
    expect(container.querySelector('h2')!.textContent).toBe('Bản đồ lớp')
    expect(container.textContent).toContain('Cột cao = số câu hôm nay')
    expect(container.textContent).toContain('tỉ lệ đúng thấp')
    expect(container.textContent).toContain('Rê chuột để dừng xoay')
  })

  it('không tạo được WebGL (taoBan3D trả null) HOẶC nạp three hỏng ⇒ lùi bản 2D ("iso"), không ném; bản 2D không nói "dừng xoay"', async () => {
    fake.taoBan3D.mockImplementation(() => null as unknown)
    const a = await dung()
    expect(a.container.querySelector('[data-kieu]')!.getAttribute('data-kieu')).toBe('iso')
    expect(a.container.textContent).not.toContain('Rê chuột để dừng xoay')
    cleanup()
    fake.che.loi = true
    const b = await dung()
    expect(b.container.querySelector('[data-kieu]')!.getAttribute('data-kieu')).toBe('iso')
  })

  it('khi còn CHỜ nạp three (kiểu "cho") KHÔNG được chạm canvas bằng ngữ cảnh 2D (sẽ chặn ngữ cảnh WebGL về sau)', () => {
    const bao = vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 400, height: 300, left: 0, top: 0, right: 400, bottom: 300, x: 0, y: 0, toJSON() {} } as DOMRect)
    const gc = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<BanDo3D lop={dsLop()} mau={MAU} phienBanMau={1} itDong />) // đồng bộ: three chưa nạp xong
    expect(gc).not.toHaveBeenCalled()
    bao.mockRestore()
    gc.mockRestore()
  })

  it('mỗi lớp có MỘT nhãn: tên + "N câu" (số có dấu chấm nghìn)', async () => {
    const ds = [lop('Khối 11', 1298, 1000), lop('12 - Tinh Hoa', 247, 227)]
    const { container } = await dung({ lop: ds })
    const nhan = [...container.querySelectorAll('.bts-nhan3d')].map((e) => e.textContent)
    expect(nhan).toEqual(['Khối 111.298 câu', '12 - Tinh Hoa247 câu'])
  })

  it('dữ liệu đổi ⇒ báo bản 3D; CHỈ lớp vừa tăng câu được "loé"; màu đổi ⇒ datMau lại', async () => {
    const ds = [lop('A', 100, 90), lop('B', 50, 40)]
    const r = await dung({ lop: ds })
    r.rerender(<BanDo3D lop={[lop('A', 100, 90), lop('B', 51, 41)]} mau={MAU} phienBanMau={1} itDong />)
    expect(fake.ban.loe).toHaveBeenCalledTimes(1)
    expect(fake.ban.loe).toHaveBeenCalledWith(1)
    const dem = fake.ban.datMau.mock.calls.length
    r.rerender(<BanDo3D lop={[lop('A', 100, 90), lop('B', 51, 41)]} mau={{ ...MAU, nen: 'rgb(0,0,0)' }} phienBanMau={2} itDong />)
    expect(fake.ban.datMau.mock.calls.length).toBeGreaterThan(dem)
    expect(fake.ban.datLop.mock.calls.at(-1)![0]).toHaveLength(2)
  })

  it('giảm chuyển động ⇒ vẽ TĨNH (buoc với itDong = true, không xoay), KHÔNG chạy vòng requestAnimationFrame', async () => {
    await dung({ itDong: true })
    expect(fake.ban.buoc).toHaveBeenCalled()
    expect(fake.ban.buoc.mock.calls.every((c) => c[2] === true && c[1] === false)).toBe(true)
    await chayKhung(3) // dù "qua" vài khung, không có vòng nào được xin
    expect(idKhung).toBe(0) // không một lần requestAnimationFrame
    expect(hangDoi).toHaveLength(0)
  })

  it('cho phép chuyển động ⇒ có vòng vẽ, camera xoay; RÊ CHUỘT ⇒ dừng xoay; rời chuột ⇒ xoay lại', async () => {
    const { container } = await dung({ itDong: false })
    await chayKhung(3)
    expect(fake.ban.buoc.mock.calls.length).toBe(3) // mỗi khung một lần vẽ
    expect(fake.ban.buoc.mock.calls.at(-1)![1]).toBe(true) // đang xoay
    const ve = container.querySelector('.bts-hop-3d')!
    fireEvent.pointerMove(ve, { clientX: 50, clientY: 60 })
    const n = fake.ban.buoc.mock.calls.length
    await chayKhung(3)
    expect(fake.ban.buoc.mock.calls.length).toBe(n + 3)
    expect(fake.ban.buoc.mock.calls.at(-1)![1]).toBe(false) // dừng xoay
    fireEvent.pointerLeave(ve)
    const n2 = fake.ban.buoc.mock.calls.length
    await chayKhung(3)
    expect(fake.ban.buoc.mock.calls.length).toBe(n2 + 3)
    expect(fake.ban.buoc.mock.calls.at(-1)![1]).toBe(true)
  })

  it('rê chuột lên một cột ⇒ gợi ý: tên lớp, số câu, tỉ lệ đúng, em đã học / sĩ số; ra khỏi cột hoặc rời khung ⇒ ẩn; lớp chưa có câu ⇒ không nói tỉ lệ', async () => {
    const ds = [lop('12 - Tinh Hoa', 247, 227, 38, 7), lop('Mới', 0, 0, 20, 0)]
    fake.ban.chon.mockImplementation(() => 0)
    const { container } = await dung({ lop: ds, itDong: true })
    fireEvent.pointerMove(container.querySelector('.bts-hop-3d')!, { clientX: 120, clientY: 130 })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeTruthy())
    const t = container.querySelector('.bts-goi-y')!.textContent!
    expect(t).toContain('12 - Tinh Hoa')
    expect(t).toContain('247 câu hôm nay')
    expect(t).toContain('đúng 91,9 %')
    expect(t).toContain('7 / 38 em đã học')
    expect(fake.ban.setChon).toHaveBeenCalledWith(0)
    fake.ban.chon.mockImplementation(() => 1)
    fireEvent.pointerMove(container.querySelector('.bts-hop-3d')!, { clientX: 130, clientY: 140 })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain('Mới'))
    expect(container.querySelector('.bts-goi-y')!.textContent).not.toContain('đúng ')
    fireEvent.pointerLeave(container.querySelector('.bts-hop-3d')!)
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeNull())
    expect(fake.ban.setChon).toHaveBeenLastCalledWith(-1)
  })

  it('tab ẩn ⇒ vòng vẽ NGỪNG (không gọi buoc thêm); hiện lại ⇒ chạy tiếp', async () => {
    await dung({ itDong: false })
    await chayKhung(2)
    expect(fake.ban.buoc).toHaveBeenCalled()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await chayKhung(1)
      const n = fake.ban.buoc.mock.calls.length
      await chayKhung(5)
      expect(fake.ban.buoc.mock.calls.length).toBe(n)
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
      await chayKhung(1)
      expect(fake.ban.buoc.mock.calls.length).toBeGreaterThan(n)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    }
  })

  it('rời màn ⇒ GIẢI PHÓNG WebGL đúng một lần và gỡ canvas; mất ngữ cảnh WebGL ⇒ giải phóng rồi lùi 2D bằng canvas MỚI', async () => {
    const a = await dung()
    a.unmount()
    expect(fake.ban.giaiPhong).toHaveBeenCalledTimes(1)
    fake.ban.giaiPhong.mockClear()
    const b = await dung()
    const cv = b.container.querySelector('.bts-hop-3d canvas')!
    await act(async () => { cv.dispatchEvent(new Event('webglcontextlost', { cancelable: true })) })
    await waitFor(() => expect(b.container.querySelector('[data-kieu]')!.getAttribute('data-kieu')).toBe('iso'))
    expect(fake.ban.giaiPhong).toHaveBeenCalledTimes(1)
    expect(b.container.querySelector('.bts-hop-3d canvas')).not.toBe(cv)
    b.unmount()
    expect(fake.ban.giaiPhong).toHaveBeenCalledTimes(1) // đã giải phóng rồi, không gọi lần hai
  })

  it('nhãn được đặt theo vị trí bản 3D trả về (transform + dây dẫn --bts-day + zIndex theo độ gần); nhãn chồng nhau bị đẩy lên', async () => {
    fake.ban.vitriNhan.mockImplementation(() => [{ x: 100, y: 150, w: 0, gan: 5 }, { x: 100, y: 150, w: 0, gan: 9 }])
    const { container } = await dung({ lop: [lop('A', 10, 9), lop('B', 20, 19)] })
    const els = [...container.querySelectorAll<HTMLElement>('.bts-nhan3d')]
    expect(els).toHaveLength(2)
    expect(els.every((e) => /translate\(/.test(e.style.transform))).toBe(true)
    expect(els.map((e) => e.style.zIndex)).toEqual(['6', '10'])
    expect(els.some((e) => e.style.getPropertyValue('--bts-day') !== '0px')).toBe(true)
  })
})

describe('nguồn (c)', () => {
  it('three CHỈ được nạp lười: chỉ ban-do-3d-three.ts import "three"; BanDo3D dùng import() động; không ai khác kéo three vào gói chính', () => {
    const tep = ['BangTinSan', 'BanDo3D', 'NenHoc', 'OSo', 'ThanhTren', 'BangChay', 'SoLan', 'TiaCanvas'].map((f) => doc(`src/components/bang-tin-san/${f}.tsx`))
    for (const t of tep) expect(t).not.toMatch(/from 'three'|require\('three'\)/)
    expect(doc('src/components/bang-tin-san/hooks.ts')).not.toMatch(/'three'/)
    for (const f of ['ban-do-chung', 'ban-do-iso', 'kieu', 'trang-thai', 'mau-gia']) expect(doc(`src/lib/bang-tin-san/${f}.ts`)).not.toMatch(/'three'/)
    expect(doc('src/components/bang-tin-san/ban-do-3d-three.ts')).toMatch(/import \* as T from 'three'/)
    expect(doc('src/components/bang-tin-san/BanDo3D.tsx')).toMatch(/import\('\.\/ban-do-3d-three'\)/)
    expect(doc('src/components/bang-tin-san/BanDo3D.tsx')).not.toMatch(/^import (?!type)[^\n]*from '\.\/ban-do-3d-three'/m) // chỉ được import KIỂU (bị xoá lúc dựng), không import giá trị
  })
  it('giải phóng: three dispose renderer + vật liệu + hình; forceContextLoss; không mã màu thô', () => {
    const t = doc('src/components/bang-tin-san/ban-do-3d-three.ts')
    expect(t).toMatch(/rd\.dispose\(\)/)
    expect(t).toMatch(/forceContextLoss/)
    expect(t).toMatch(/material.*dispose|\.dispose\(\)/)
    expect(t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(doc('src/components/bang-tin-san/BanDo3D.tsx')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(doc('src/lib/bang-tin-san/ban-do-iso.ts')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
