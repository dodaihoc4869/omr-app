// BI-A · CẦM GẬY ĐỂ XOAY (thầy lệnh 29/09): bắt trúng gậy, góc theo ngón, không giật khi chạm ngoài gậy, chỉnh tinh.
import { describe, expect, it } from 'vitest'
import { batDauCam, chinhTinh, chuanGoc, dauGay, DAI_GAY, huongKhiKeo, nuaBeRongBat, trungGay } from '../src/game/bi-a/gay'
import { R } from '../src/game/bi-a/vat-ly'

const c = { x: 250, y: 700 }
const len = { x: 0, y: -1 } // bắn lên ⇒ gậy nằm phía dưới bi cái
const gan = (a: { x: number; y: number }, b: { x: number; y: number }) => { expect(a.x).toBeCloseTo(b.x, 6); expect(a.y).toBeCloseTo(b.y, 6) }

describe('trungGay', () => {
  it('chạm trên thân gậy (phía ngược hướng bắn) ⇒ trúng; phía trước bi cái hay lệch xa ⇒ không', () => {
    const nua = 12
    expect(trungGay(c, len, 0, { x: 250, y: 700 + dauGay(0) + 50 }, nua)).toBe(true)
    expect(trungGay(c, len, 0, { x: 250 + 10, y: 700 + 200 }, nua)).toBe(true)
    expect(trungGay(c, len, 0, { x: 250 + 30, y: 700 + 200 }, nua)).toBe(false)
    expect(trungGay(c, len, 0, { x: 250, y: 700 - 80 }, nua)).toBe(false) // phía hướng bắn
    expect(trungGay(c, len, 0, { x: 250, y: 700 + dauGay(0) + DAI_GAY + 40 }, nua)).toBe(false) // quá đuôi gậy
  })
  it('gậy lùi theo lực: đầu gậy lúc lực 1 xa hơn lúc lực 0 đúng 80', () => {
    expect(dauGay(1) - dauGay(0)).toBe(80)
    expect(trungGay(c, len, 1, { x: 250, y: 700 + dauGay(1) + DAI_GAY - 5 }, 12)).toBe(true)
  })
  it('vùng bắt ≥ 44 px CSS (22 px mỗi bên) ở mọi cỡ bàn, tối thiểu 10 đơn vị', () => {
    for (const S of [0.3, 0.5, 0.8, 1.2]) expect(nuaBeRongBat(S) * S).toBeGreaterThanOrEqual(22 - 1e-9)
    expect(nuaBeRongBat(10)).toBe(10)
  })
  it('gậy xoay theo hướng nhắm (bắn sang phải ⇒ gậy nằm bên trái)', () => {
    expect(trungGay(c, { x: 1, y: 0 }, 0, { x: 250 - 100, y: 700 }, 12)).toBe(true)
    expect(trungGay(c, { x: 1, y: 0 }, 0, { x: 250 + 100, y: 700 }, 12)).toBe(false)
  })
})

describe('xoay khi cầm gậy', () => {
  it('cầm đúng trục gậy rồi kéo ngón sang trái bi cái ⇒ bắn sang phải (gậy theo ngón, hướng bắn đối diện)', () => {
    const cam = batDauCam(c, len, { x: 250, y: 900 })
    expect(cam.lech).toBeCloseTo(0, 9)
    gan(huongKhiKeo(c, cam, { x: 100, y: 700 }, len), { x: 1, y: 0 })
    gan(huongKhiKeo(c, cam, { x: 250, y: 500 }, len), { x: 0, y: 1 })
  })
  it('cầm lệch mép gậy ⇒ không giật: ngay lúc cầm hướng giữ nguyên', () => {
    const p = { x: 262, y: 900 }
    const cam = batDauCam(c, len, p)
    gan(huongKhiKeo(c, cam, p, len), len)
  })
  it('ngón quá sát tâm bi cái ⇒ giữ hướng cũ', () => {
    const cam = batDauCam(c, len, { x: 250, y: 900 })
    expect(huongKhiKeo(c, cam, { x: 251, y: 701 }, len)).toBe(len)
    expect(R).toBeGreaterThan(2)
  })
})

describe('kéo ngoài gậy: chỉnh tinh, không nhảy', () => {
  it('quét ngón 40° quanh bi cái ⇒ hướng chỉ xoay 10° (× 0,25), cùng chiều', () => {
    const a = (d: number) => ({ x: c.x + 200 * Math.cos(d * Math.PI / 180), y: c.y + 200 * Math.sin(d * Math.PI / 180) })
    const moi = chinhTinh(c, len, a(0), a(40))
    const doi = chuanGoc(Math.atan2(moi.y, moi.x) - Math.atan2(len.y, len.x)) * 180 / Math.PI
    expect(doi).toBeCloseTo(10, 6)
    expect(Math.hypot(moi.x, moi.y)).toBeCloseTo(1, 9)
  })
  it('chạm một điểm (không kéo) ⇒ hướng y nguyên', () => {
    const p = { x: 100, y: 200 }
    gan(chinhTinh(c, len, p, p), len)
  })
  it('chuanGoc đưa về (−π, π]', () => {
    expect(chuanGoc(3 * Math.PI)).toBeCloseTo(Math.PI, 9)
    expect(chuanGoc(-Math.PI)).toBeCloseTo(Math.PI, 9)
    expect(chuanGoc(0.5)).toBe(0.5)
  })
})
