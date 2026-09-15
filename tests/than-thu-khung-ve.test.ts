/**
 * KHUNG VẼ PHẢI ÔM TRỌN CON THÚ.
 *
 * Bản trước lấy tâm giữa khung, bán kính `min(w,h) * 0,32`: ĐUÔI bị cắt ở mép
 * trái từ cấp 4, CÁNH bị cắt ở mép trên ở cấp 8 lúc tung chiêu. Chỉ chụp ảnh
 * mới thấy, nên khoá lại bằng phép kiểm số học ở đây.
 *
 * Bộ số `HOP_BAO_THAN_THU` là ĐO THẬT trên Chromium (4 thần thú × 12 cấp × 4 cờ
 * × 12 mốc thời gian, quét điểm ảnh đặc alpha > 190). Sửa hình vẽ thì ĐO LẠI.
 */
import { describe, it, expect } from 'vitest'
import { HOP_BAO_THAN_THU, khungVeThanThu } from '../src/game/than-thu-hoa-hoc/ve-than-thu'

const B = HOP_BAO_THAN_THU
const KHUNG: [number, number][] = [
  [260, 200], // canvas màn đấu
  [280, 260], // canvas Đảo Thần Thú
  [200, 200], [320, 180], [140, 320], [400, 400], [90, 70],
]

describe('khungVeThanThu', () => {
  it('hình nằm trọn trong khung, chừa ít nhất 3 điểm ảnh mỗi mép', () => {
    for (const [w, h] of KHUNG) {
      const k = khungVeThanThu(w, h)
      expect(k.cx - B.trai * k.banKinh, `trái ${w}x${h}`).toBeGreaterThanOrEqual(3)
      expect(k.cy - B.tren * k.banKinh, `trên ${w}x${h}`).toBeGreaterThanOrEqual(3)
      expect(w - (k.cx + B.phai * k.banKinh), `phải ${w}x${h}`).toBeGreaterThanOrEqual(3)
      expect(h - (k.cy + B.duoi * k.banKinh), `dưới ${w}x${h}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('hình được canh giữa khung theo cả hai chiều', () => {
    for (const [w, h] of KHUNG) {
      const k = khungVeThanThu(w, h)
      const leTrai = k.cx - B.trai * k.banKinh
      const lePhai = w - (k.cx + B.phai * k.banKinh)
      const leTren = k.cy - B.tren * k.banKinh
      const leDuoi = h - (k.cy + B.duoi * k.banKinh)
      expect(Math.abs(leTrai - lePhai), `ngang ${w}x${h}`).toBeLessThan(0.001)
      expect(Math.abs(leTren - leDuoi), `dọc ${w}x${h}`).toBeLessThan(0.001)
    }
  })

  it('khung to hơn thì thú vẽ to hơn, không bao giờ nhỏ đi', () => {
    let truoc = 0
    for (const canh of [80, 120, 160, 200, 260, 320, 420]) {
      const r = khungVeThanThu(canh, canh).banKinh
      expect(r).toBeGreaterThan(truoc)
      truoc = r
    }
  })

  it('khung bé tí cũng không ra bán kính âm hay bằng 0', () => {
    for (const [w, h] of [[10, 10], [1, 1], [20, 4]] as [number, number][]) {
      expect(khungVeThanThu(w, h).banKinh).toBeGreaterThan(0)
    }
  })

  it('đuôi vươn sang trái xa hơn thân sang phải — tâm vẽ phải lệch phải', () => {
    expect(B.trai).toBeGreaterThan(B.phai)
    const k = khungVeThanThu(260, 200)
    expect(k.cx).toBeGreaterThan(130)
  })

  it('bộ số hộp bao không bị sửa vu vơ', () => {
    expect(B).toEqual({ trai: 2.43, phai: 2.04, tren: 2.11, duoi: 1.97 })
  })
})
