// @vitest-environment node
// «ĐẤU NGUYÊN TỬ» 3 ĐẤU 3 · MƯỢT HẲN + XOAY SÂN (thầy 01/11: «bắn hiện tại vẫn hơi giật lag làm mượt hẳn», «xoay ngang to tràn điện thoại»).
// Khoá: (1) bốn khung xoay là phép QUAY, đổi qua đổi lại khớp nhau (điểm chạm, hướng kéo, góc nòng); (2) máy em vẽ bạn khác theo DÒNG THỜI GIAN CỦA PHÒNG:
// gói đến dồn cục (mạng 120 ± 40 ms) mà hình vẫn chạy đều — không lùi, không đứng > 80 ms, không bước nhảy; đệm trễ trong 100–200 ms; mất ảnh ⇒ ngoại suy
// ≤ 120 ms rồi mới đứng; (3) súng CỦA EM bắn ngay tại máy theo nhịp cấp, loạt phòng gửi về không vẽ đôi; đạn em chạm đối thủ ⇒ `cham` ngay.
import { describe, expect, it } from 'vitest'
import { maAnh, docAnh } from '../src/lib/dau-ion/goi'
import { BUOC, CAP, SAN_H, SAN_W, taoTran } from '../src/lib/dau-ion/loi'
import { DEM_MAX, DEM_MIN, NGOAI_SUY, TranMang } from '../src/components/phong-cho/dau-ion-tran'
import { coSan, diemVao, gocRa, huongRa, huongVao, ra, vatRa, type Xoay } from '../src/components/phong-cho/dau-ion-xoay'

const KHUNG: Xoay[] = [{ doc: false, lat: false }, { doc: false, lat: true }, { doc: true, lat: false }, { doc: true, lat: true }]

describe('Xoay sân khi vẽ (phe em trái / dưới)', () => {
  it('bốn khung: điểm sân ⇄ điểm vẽ khớp; hướng kéo ⇄ hướng đi khớp; góc nòng quay cùng hướng đạn; cỡ sân đổi rộng ↔ cao khi dọc', () => {
    for (const k of KHUNG) {
      const c = coSan(k)
      expect(c).toEqual(k.doc ? { w: SAN_H, h: SAN_W } : { w: SAN_W, h: SAN_H })
      for (const [x, y] of [[0, 0], [130, 470], [1040, 520], [777, 33]]) {
        const [X, Y] = ra(x, y, k)
        expect(X).toBeGreaterThanOrEqual(0); expect(X).toBeLessThanOrEqual(c.w); expect(Y).toBeGreaterThanOrEqual(0); expect(Y).toBeLessThanOrEqual(c.h)
        const [x2, y2] = diemVao(X, Y, k)
        expect(x2).toBeCloseTo(x, 9); expect(y2).toBeCloseTo(y, 9)
      }
      for (const a of [0, 0.7, 2, -2.5]) {
        const [dx, dy] = huongRa(Math.cos(a), Math.sin(a), k), g = gocRa(a, k)
        expect(dx).toBeCloseTo(Math.cos(g), 9); expect(dy).toBeCloseTo(Math.sin(g), 9)
        const [ex, ey] = huongVao(dx, dy, k)
        expect(ex).toBeCloseTo(Math.cos(a), 9); expect(ey).toBeCloseTo(Math.sin(a), 9)
      }
    }
  })
  it('phe em (Bazơ trái / Axit phải trên sân) luôn hiện ở TRÁI khi ngang, DƯỚI khi dọc; tường chắn của phe em đánh dấu `cuaEm`', () => {
    const beBazo: [number, number] = [62, 260], beAxit: [number, number] = [978, 260]
    expect(ra(...beBazo, { doc: false, lat: false })[0]).toBeLessThan(SAN_W / 2)
    expect(ra(...beAxit, { doc: false, lat: true })[0]).toBeLessThan(SAN_W / 2)
    expect(ra(...beBazo, { doc: true, lat: false })[1]).toBeGreaterThan(SAN_W / 2)
    expect(ra(...beAxit, { doc: true, lat: true })[1]).toBeGreaterThan(SAN_W / 2)
    for (const k of KHUNG) {
      const pheEm = k.lat ? 1 : 0, w = coSan(k)
      const tuong = vatRa(k, pheEm).filter((v) => v.k === 'cn' && v.ve === 'gia-ong')
      const cuaEm = tuong.find((v) => v.cuaEm)!
      if (cuaEm.k !== 'cn') throw new Error('giá ống')
      if (k.doc) expect(cuaEm.y + cuaEm.h / 2).toBeGreaterThan(w.h / 2); else expect(cuaEm.x + cuaEm.w / 2).toBeLessThan(w.w / 2)
    }
  })
})

/** Phòng giả: ghế 1 = em (Bazơ) đứng yên, ghế 2 = bạn phe kia chạy ngang đều 140 đơn vị/giây (trong sân). Mỗi bước 50 ms một ảnh; mạng trễ 120 ± 40 ms giữ thứ tự. */
function tranMau(hat = 1) {
  const tr = taoTran([{ id: 1, nt: 3, phe: 0 }, { id: 2, nt: 1, phe: 1 }], 1)
  let s = hat
  const ngau = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  const tm = new TranMang({ toi: 1, so: 1, con: 60, ghe: [[1, 'Em', 3, 0, 0], [2, 'Quốc Bảo', 1, 0, 1]], vp: [] }, () => {}, 0)
  const goi: { den: number; b: Uint8Array }[] = []
  let truoc = 0
  for (let k = 1; k <= 120; k++) {
    Object.assign(tr.ghe[0], { x: 60, y: 60 }); Object.assign(tr.ghe[1], { x: 100 + k * 7, y: 470, cho: 0 })
    const den = Math.max(k * 50 + 80 + ngau() * 80, truoc); truoc = den
    goi.push({ den, b: maAnh(k, 60, tr.ghe, [], k, [0, 0]) })
  }
  return { tm, goi }
}

describe('Máy em nội suy theo dòng thời gian của phòng', () => {
  it('gói đến dồn cục (120 ± 40 ms) ⇒ bạn khác vẫn chạy ĐỀU trên hình: không lùi, không đứng > 80 ms, bước khung đều (≤ 2 × trung vị)', () => {
    for (const hat of [1, 7, 42]) {
      const { tm, goi } = tranMau(hat)
      const x: number[] = []
      let i = 0
      for (let nay = 0; nay < 6500; nay += 16) {
        while (i < goi.length && goi[i].den <= nay) { tm.nhanAnh(docAnh(goi[i].b)!, goi[i].den); i++ }
        tm.buoc(0.016, 0, 0, nay)
        const g = tm.canh(nay).ghe.find((q) => q.id === 2)
        if (g && nay > 1500 && nay < 6000) x.push(g.x)
      }
      const buoc = x.slice(1).map((v, j) => v - x[j])
      expect(Math.min(...buoc)).toBeGreaterThanOrEqual(-1e-6)
      let dung = 0, dai = 0
      for (const b of buoc) { if (b < 0.05) { dung += 16; dai = Math.max(dai, dung) } else dung = 0 }
      expect(dai).toBeLessThanOrEqual(80)
      const tv = [...buoc].sort((a, b) => a - b)[Math.floor(buoc.length / 2)]
      expect(tv).toBeGreaterThan(1.8); expect(tv).toBeLessThan(2.8) // 140 đơn vị/giây × 16 ms = 2,24
      expect(Math.max(...buoc)).toBeLessThanOrEqual(2 * tv)
      expect(tm.demTre).toBeGreaterThanOrEqual(DEM_MIN); expect(tm.demTre).toBeLessThanOrEqual(DEM_MAX)
    }
  })
  it('mất ảnh ⇒ ngoại suy theo vận tốc tối đa 120 ms rồi mới đứng (không đứng ngay, không chạy mãi)', () => {
    const { tm, goi } = tranMau(3)
    let nay = 0, i = 0
    for (; nay < 3000; nay += 16) { while (i < goi.length && goi[i].den <= nay && i < 50) { tm.nhanAnh(docAnh(goi[i].b)!, goi[i].den); i++ } tm.buoc(0.016, 0, 0, nay) }
    // Ảnh cuối nhận: bước 50 (x = 450). Sau đó không còn ảnh.
    const x = tm.canh(nay).ghe.find((q) => q.id === 2)!.x
    expect(x).toBeGreaterThan(450) // đã ngoại suy quá ảnh cuối
    expect(x).toBeLessThanOrEqual(450 + 140 * (NGOAI_SUY / 1000) + 1e-6) // nhưng không quá 120 ms
  })
})

describe('Súng của em bắn tại máy', () => {
  it('thấy đối thủ lộ ⇒ bắn NGAY tại máy theo nhịp cấp (không chờ phòng); loạt phòng gửi về cho em không vẽ đôi; đạn em chạm ⇒ `cham` ngay', () => {
    const tr = taoTran([{ id: 1, nt: 3, phe: 0 }, { id: 2, nt: 1, phe: 1 }], 1)
    Object.assign(tr.ghe[0], { x: 60, y: 470, che: 0, cap: 2 }); Object.assign(tr.ghe[1], { x: 400, y: 470, che: 0 })
    const tm = new TranMang({ toi: 1, so: 1, con: 60, ghe: [[1, 'Em', 3, 0, 0], [2, 'Quốc Bảo', 1, 0, 1]], vp: [] }, () => {}, 0)
    let nay = 0, k = 0
    const anh = (su: Parameters<typeof maAnh>[3] = []) => { k++; tm.nhanAnh(docAnh(maAnh(k, 60, tr.ghe, su, k, [0, 0]))!, nay) }
    for (let i = 0; i < 6; i++) { anh(); nay += 50; tm.buoc(0.05, 0, 0, nay) }
    const su: string[] = []
    let banTaiMay = 0
    for (let i = 0; i < 40; i++) {
      nay += 16; tm.buoc(0.016, 0, 0, nay)
      for (const s of tm.laySu()) { su.push(s.t); if (s.t === 'ban' && s.chu === 1) banTaiMay++ }
      if (i === 5) anh([{ t: 'ban', chu: 1, cap: 2, x: 84, y: 470, ngam: 0 }]) // phòng báo loạt của em ⇒ đã vẽ rồi, bỏ
    }
    expect(banTaiMay).toBeGreaterThanOrEqual(1)
    expect(banTaiMay).toBeLessThanOrEqual(Math.ceil((40 * 16) / 1000 / CAP[2].nhip) + 1)
    expect(su).toContain('cham')
    void BUOC
  })
})
