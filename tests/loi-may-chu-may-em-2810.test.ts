// Máy em (thầy chụp 28/10): không bao giờ hiện chữ lỗi tiếng Anh / mã kỹ thuật; máy chủ bận ⇒ câu nhẹ + tự gửi lại lùi dần.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHU_LOI_CHUNG, CHU_MAT_MANG, CHU_MAY_CHU_BAN_EM, choLuiDanMs, chuCuaLoi, chuLoiAnToan, laChuLoiHienDuoc, laLoiTamThoi } from '../src/lib/loi-may-chu'
import { LoiHoa2, goiHoa2, guiLaiKhiKetMang } from '../src/components/hoa2/api'
import { loiCuaKetQua } from '../src/game/than-thu-v2/loi-het-tran'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('bảng dịch lỗi', () => {
  it('chữ kỹ thuật ⇒ câu Việt; câu Việt / mã có tên ⇒ giữ', () => {
    expect(chuLoiAnToan('D1_ERROR: Currently processing a long-running export.')).toBe(CHU_LOI_CHUNG)
    expect(chuLoiAnToan("TypeError: Cannot read properties of undefined (reading 'a')", 'Chưa tải được.')).toBe('Chưa tải được.')
    expect(chuLoiAnToan('Em mở chặng trước khi lưu bài.')).toBe('Em mở chặng trước khi lưu bài.')
    expect(laChuLoiHienDuoc('het_tran')).toBe(true)
    expect(loiCuaKetQua({ ok: false, error: 'D1_ERROR: overloaded' })).toBe(CHU_LOI_CHUNG)
    expect(chuCuaLoi(new TypeError('Failed to fetch'))).toBe(CHU_MAT_MANG)
    expect(chuCuaLoi(new LoiHoa2('x', 'MAY_CHU_BAN'))).toBe(CHU_MAY_CHU_BAN_EM)
  })
  it('lùi dần 1, 2, 4, 8, 15, 30 giây, trần 30', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(choLuiDanMs)).toEqual([1000, 2000, 4000, 8000, 15000, 30000, 30000])
  })
})

describe('goiHoa2 gặp máy chủ bận', () => {
  it('503 MAY_CHU_BAN ⇒ LoiHoa2 mã MAY_CHU_BAN, câu nhẹ, không chữ gốc', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'Máy chủ đang bận. Thử lại sau ít giây.', maLoi: 'MAY_CHU_BAN', thuLaiSau: 2 }), { status: 503 })))
    const e = await goiHoa2('hoc-tap-ktcn-luu', 't').catch((x) => x)
    expect(e).toBeInstanceOf(LoiHoa2)
    expect(e.ma).toBe('MAY_CHU_BAN')
    expect(e.message).toBe(CHU_MAY_CHU_BAN_EM)
    expect(laLoiTamThoi(e)).toBe(true)
  })
  it('máy chủ cũ trả chữ D1 thô 200 ⇒ câu Việt chung', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'D1_ERROR: Currently processing a long-running export.' }), { status: 200 })))
    const e = await goiHoa2('answer', 't').catch((x) => x)
    expect(e.message).not.toMatch(/D1|export/)
  })
  it('guiLaiKhiKetMang: bận 2 lần rồi được ⇒ gửi 3 lượt, chờ 1 s rồi 2 s', async () => {
    const cho = vi.fn(async () => {})
    let n = 0
    const r = await guiLaiKhiKetMang(async () => { if (n++ < 2) throw new LoiHoa2('bận', 'MAY_CHU_BAN'); return 'ok' }, 2, cho)
    expect(r).toBe('ok')
    expect(n).toBe(3)
    expect(cho.mock.calls.map((c) => (c as unknown[])[0])).toEqual([1000, 2000])
  })
  it('guiLaiKhiKetMang: bận mãi ⇒ dừng sau 5 lượt chờ (~30 s) và báo câu nhẹ', async () => {
    const cho = vi.fn(async () => {})
    const e = await guiLaiKhiKetMang(async () => { throw new LoiHoa2(CHU_MAY_CHU_BAN_EM, 'MAY_CHU_BAN') }, 2, cho).catch((x) => x)
    expect(cho).toHaveBeenCalledTimes(5)
    expect(e.message).toBe(CHU_MAY_CHU_BAN_EM)
  })
})
