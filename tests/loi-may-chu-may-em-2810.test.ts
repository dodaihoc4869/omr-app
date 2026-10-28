// Máy em (thầy chụp 28/10): không bao giờ hiện chữ lỗi tiếng Anh / mã kỹ thuật; máy chủ bận ⇒ câu nhẹ + tự gửi lại lùi dần.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHU_LOI_CHUNG, CHU_MAT_MANG, CHU_MAY_CHU_BAN_EM, choLuiDanMs, chuCuaLoi, chuLoiAnToan, guiLaiKhiBan, laChuLoiHienDuoc, laLoiTamThoi } from '../src/lib/loi-may-chu'
import { LoiHoa2, goiHoa2 } from '../src/components/hoa2/api'
import { CHU_MAY_CHU_BAN } from '../server/src/loi-may-chu'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('bảng dịch lỗi (lớp chặn thứ hai ở màn nạp khi bấm)', () => {
  it('chữ kỹ thuật ⇒ câu Việt; câu Việt / mã có tên ⇒ giữ', () => {
    expect(chuLoiAnToan('D1_ERROR: Currently processing a long-running export.')).toBe(CHU_LOI_CHUNG)
    expect(chuLoiAnToan("TypeError: Cannot read properties of undefined (reading 'a')", 'Chưa tải được.')).toBe('Chưa tải được.')
    expect(chuLoiAnToan('Em mở chặng trước khi lưu bài.')).toBe('Em mở chặng trước khi lưu bài.')
    expect(laChuLoiHienDuoc('het_tran')).toBe(true)
    expect(chuCuaLoi(new TypeError('Failed to fetch'))).toBe(CHU_MAT_MANG)
    expect(chuCuaLoi(new LoiHoa2('x', 'MAY_CHU_BAN'))).toBe(CHU_MAY_CHU_BAN_EM)
  })
  it('lùi dần 1, 2, 4, 8, 15, 30 giây, trần 30', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(choLuiDanMs)).toEqual([1000, 2000, 4000, 8000, 15000, 30000, 30000])
  })
})

describe('goiHoa2 (không đổi byte nào) nhận máy chủ bận qua `ma`', () => {
  it('503 + ma MAY_CHU_BAN ⇒ LoiHoa2 mã MAY_CHU_BAN, câu nhẹ của máy chủ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, error: CHU_MAY_CHU_BAN, ma: 'MAY_CHU_BAN', maLoi: 'MAY_CHU_BAN', thuLaiSau: 2 }), { status: 503 })))
    const e = await goiHoa2('hoc-tap-ktcn-luu', 't').catch((x) => x)
    expect(e).toBeInstanceOf(LoiHoa2)
    expect(e.ma).toBe('MAY_CHU_BAN')
    expect(e.message).toBe(CHU_MAY_CHU_BAN)
    expect(laLoiTamThoi(e)).toBe(true)
  })
  it('guiLaiKhiBan: bận 2 lần rồi được ⇒ gửi 3 lượt, chờ 1 s rồi 2 s', async () => {
    const cho = vi.fn(async () => {})
    let n = 0
    const r = await guiLaiKhiBan(async () => { if (n++ < 2) throw new LoiHoa2('bận', 'MAY_CHU_BAN'); return 'ok' }, cho)
    expect(r).toBe('ok')
    expect(n).toBe(3)
    expect(cho.mock.calls.map((c) => (c as unknown[])[0])).toEqual([1000, 2000])
  })
  it('guiLaiKhiBan: bận mãi ⇒ dừng sau 5 lượt chờ (~30 s); lỗi khác ném ngay', async () => {
    const cho = vi.fn(async () => {})
    const e = await guiLaiKhiBan(async () => { throw new LoiHoa2(CHU_MAY_CHU_BAN_EM, 'MAY_CHU_BAN') }, cho).catch((x) => x)
    expect(cho).toHaveBeenCalledTimes(5)
    expect(e.message).toBe(CHU_MAY_CHU_BAN_EM)
    const cho2 = vi.fn(async () => {})
    await expect(guiLaiKhiBan(async () => { throw new LoiHoa2('Câu không hợp lệ.', 'sai') }, cho2)).rejects.toThrow('Câu không hợp lệ.')
    expect(cho2).not.toHaveBeenCalled()
  })
})
