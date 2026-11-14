// SINH TỒN bản 2 — BƯỚC GHÉP ĐỢT 4, phía MÀN (jsdom): bé ma mặc đồ nướng theo mũ + áo (kiểu phẳng chỉ mũ, có trần số ảnh), bảng tên mang danh hiệu,
// máy em đọc [mã đồ, danh hiệu] trong `lop-ds`, máy thầy (máy chiếu) cũng nhận đồ từ `lop-ds`.
import { describe, expect, it, vi } from 'vitest'
import { BoHinh, TRAN_DO, taoBangMau, type Rgb } from '../src/components/live-khoi/sinh-ton-hinh'
import { BoTen, type NvVe } from '../src/components/live-khoi/sinh-ton-ve'

const bm = taoBangMau((_b: string, m: Rgb) => m, [200, 200, 200])
const nv = (o: Partial<NvVe>): NvVe => ({ id: 'S1', x: 0, y: 0, mau: 100, doi: 0, cap: 1, goc: 0, ban: false, dx: 0, dy: 0, toi: false, dong: false, mo: 1, ten: 'Gia Bảo', an: false, hien: -1, song: false, batTu: false, tk: false, khien: false, nhanh: false, gio: NaN, bc: '', thay: false, mac: '', dh: '', cv: false, ...o })

describe('bé ma mặc đồ (BoHinh.maDo)', () => {
  it('không đồ / chỉ vệt đạn + khi hạ ⇒ đúng ảnh bé ma trơn; ảnh chỉ phụ thuộc mũ + áo; ảnh đồ cao thêm lề trên cho mũ', () => {
    const h = new BoHinh(bm, 1, false, () => {})
    expect(h.maDo(0, false, 0, '')).toBe(h.ma(0, false, 0))
    expect(h.maDo(0, false, 0, '0068')).toBe(h.ma(0, false, 0))
    const a = h.maDo(0, false, 0, '3567'), b = h.maDo(0, false, 0, '3500')
    expect(a).toBe(b)
    expect(a).not.toBe(h.ma(0, false, 0))
    expect(a.h).toBeGreaterThan(h.ma(0, false, 0).h); expect(a.oy - a.h).toBe(h.ma(0, false, 0).oy - h.ma(0, false, 0).h) // chân giữ nguyên chỗ
  })
  it('kiểu phẳng (máy yếu) ⇒ CHỈ MŨ: áo bỏ qua, không mũ thì trơn', () => {
    const h = new BoHinh(bm, 1, true, () => {})
    expect(h.maDo(1, true, 1, '1500')).toBe(h.maDo(1, true, 0, '1000'))
    expect(h.maDo(1, true, 0, '0500')).toBe(h.ma(1, true, 0))
  })
  it(`trần ${TRAN_DO} ảnh đồ mỗi bộ hình: quá trần ⇒ bé ma trơn (đồ chỉ là hình); không có hàm vẽ đồ ⇒ trơn`, () => {
    const h = new BoHinh(bm, 1, false, () => {})
    let tron = 0
    for (const mu of '123') for (const ao of '045') for (let doi = 0; doi < 4; doi++) for (const trai of [false, true]) for (const kh of [0, 1]) {
      if (h.maDo(doi, trai, kh, `${mu}${ao}00`) === h.ma(doi, trai, kh)) tron++
    }
    expect(tron).toBe(9 * 16 - TRAN_DO)
    const k = new BoHinh(bm, 1, false)
    expect(k.maDo(0, false, 0, '3500')).toBe(k.ma(0, false, 0))
  })
})

describe('bảng tên mang danh hiệu', () => {
  it('đổi danh hiệu ⇒ nướng lại bảng tên; cùng danh hiệu ⇒ dùng lại', () => {
    const t = new BoTen(bm, 1, 13)
    const a = t.lay(nv({})), b = t.lay(nv({ dh: 'Thợ săn tuần' })), c = t.lay(nv({ dh: 'Thợ săn tuần' }))
    expect(b).not.toBe(a); expect(c).toBe(b)
    expect(b.khoa).toContain('Thợ săn tuần')
    // tên dài hơn ⇒ bảng tên rộng hơn (chữ «Gia Bảo · Thợ săn tuần»)
    expect(b.w).toBeGreaterThan(a.w)
  })
})

describe('máy em đọc đồ + danh hiệu trong `lop-ds`', () => {
  it('[sbd, tên, đội, kJ, mã đồ, danh hiệu] ⇒ NguoiLop có `c` + `dh`; phòng cũ (4 phần tử) ⇒ không có', async () => {
    vi.resetModules()
    const m = await import('../src/components/live-khoi/em-khoi')
    const nghe: ((e: MessageEvent) => void)[] = []
    const w = { readyState: 1, send() {}, addEventListener: (k: string, f: (e: MessageEvent) => void) => { if (k === 'message') nghe.push(f) } } as unknown as WebSocket
    m.noiKhoi(w)
    const ds = [['S1', 'Gia Bảo', 0, 10, '3567', 0], ['S2', 'Hải Đăng', 1, 0], ['S3', 'Lan', 2, 0, '1000']]
    for (const f of nghe) f({ data: JSON.stringify({ t: 'lop-ds', ds, kj: [0, 0, 0, 0] }) } as MessageEvent)
    expect(m.layKho().ds).toEqual([
      { sbd: 'S1', ten: 'Gia Bảo', doi: 0, kj: 10, c: '3567', dh: 0 },
      { sbd: 'S2', ten: 'Hải Đăng', doi: 1, kj: 0 },
      { sbd: 'S3', ten: 'Lan', doi: 2, kj: 0, c: '1000' },
    ])
    m.dongKhoi()
  })
})
