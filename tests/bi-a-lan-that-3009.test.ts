// BI-A · LĂN THẬT (thầy 30/09 "muốn bi lăn thật, không phải dừng lại xong lại hiện chữ"): bi đã lăn thì dừng lại vẫn vẽ ĐÚNG hướng quay lúc dừng
// (kí hiệu lệch / nghiêng / khuất giữ nguyên), không quay về dáng gốc; bi đứng yên chỉ tô ảnh đệm MỘT lần rồi drawImage; bi chưa lăn dùng ảnh gốc.
import { describe, expect, it } from 'vitest'
import { BoVe } from '../src/game/bi-a/ve-ban'
import { VanBia } from '../src/game/bi-a/dieu-khien'
import { tinhKhungBan } from '../src/game/bi-a/bo-cuc'
import { NGHIENG_TOI_DA, datHuongKhoiTao, huongKhoiTao, taoBong, taoMatNa, toBiLan, type MatNa } from '../src/game/bi-a/ve-bi'
import { kieuBi } from '../src/game/bi-a/nguyen-to'
import { DAI_DICH, DAI_DICH_MT, DAI_TIEP_MT, duongMatThan, nhamInfo } from '../src/game/bi-a/du-doan'
import { R, type Ban } from '../src/game/bi-a/vat-ly'

/** Tài liệu giả có canvas 2D tối thiểu: ghi lại mọi putImageData (ảnh bi lăn) theo canvas. */
function taiLieuGia() {
  const tô: { cv: object; data: Uint8ClampedArray }[] = []
  const rong = (): unknown => new Proxy(() => rong(), { get: () => rong() })
  const doc = {
    createElement: () => {
      const cv: Record<string, unknown> = { width: 0, height: 0 }
      const ctx = new Proxy({ canvas: cv } as Record<string, unknown>, {
        get: (t, k: string) => {
          if (k in t) return t[k]
          if (k === 'createImageData') return (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })
          if (k === 'getImageData') return (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })
          if (k === 'putImageData') return (img: { data: Uint8ClampedArray }) => { tô.push({ cv, data: new Uint8ClampedArray(img.data) }) }
          if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} })
          return () => rong()
        },
        set: (t, k: string, v) => { t[k] = v; return true },
      })
      cv.getContext = () => ctx
      return cv
    },
  } as unknown as Document
  return { doc, tô }
}
function vanMoi() {
  let s = 11
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const v = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [], chot: null, rand }, { moCau: () => {}, ketThuc: () => {}, am: () => {}, gomVa: () => {} })
  v.datHen(() => () => {})
  return v
}

describe('huongKhoiTao: ngẫu nhiên tự nhiên nhưng ổn định, kí hiệu vẫn nhìn thấy', () => {
  it('cùng hạt giống ⇒ cùng hướng; khác bi/ván ⇒ khác; ô kí hiệu nghiêng khỏi hướng nhìn ≤ 55°; quaternion đơn vị', () => {
    expect(huongKhoiTao('V1|Na')).toEqual(huongKhoiTao('V1|Na'))
    expect(huongKhoiTao('V1|Na')).not.toEqual(huongKhoiTao('V1|Mg'))
    expect(huongKhoiTao('V1|Na')).not.toEqual(huongKhoiTao('V2|Na'))
    let khac = 0
    for (let i = 0; i < 300; i++) {
      const [w, x, y, z] = huongKhoiTao(`V${i}|Cl`)
      expect(Math.hypot(w, x, y, z)).toBeCloseTo(1, 9)
      // hướng màn của ô kí hiệu = R(q)·(1,0,0); người xem ở −z
      const nz = 2 * (x * z - w * y)
      expect(-nz).toBeGreaterThanOrEqual(Math.cos(NGHIENG_TOI_DA) - 1e-9)
      if (-nz < 0.99) khac++
    }
    expect(khac).toBeGreaterThan(200) // đa số bi nghiêng thật, không thẳng mặt
  })
})

describe('Mắt thần đơn giản (bản vẽ thử): hình học thuần, không mô phỏng', () => {
  const st = { balls: [{ id: 'cue', x: 250, y: 700, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, q: [1, 0, 0, 0], ver: 0 }, { id: 'Na', x: 262, y: 400, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, q: [1, 0, 0, 0], ver: 0 }] } as unknown as Ban
  const aim = { x: 0, y: -1 }
  it('đường bi đích: từ mép bi đích theo hướng bi ma → tâm bi đích; 190 khi có Mắt thần, 55 khi không', () => {
    const info = nhamInfo(st, aim)!
    expect(info.loai).toBe('bi')
    const co = duongMatThan(info, aim, true)!, khong = duongMatThan(info, aim, false)!
    const b = st.balls[1]!, ux = (b.x - (info as { gx: number }).gx) / 42, uy = (b.y - (info as { gy: number }).gy) / 42
    expect(co.dich.x0).toBeCloseTo(b.x + ux * R, 6); expect(co.dich.y0).toBeCloseTo(b.y + uy * R, 6)
    expect(Math.hypot(co.dich.x1 - co.dich.x0, co.dich.y1 - co.dich.y0)).toBeCloseTo(DAI_DICH_MT, 6)
    expect(Math.hypot(khong.dich.x1 - khong.dich.x0, khong.dich.y1 - khong.dich.y0)).toBeCloseTo(DAI_DICH, 6)
    expect(khong.tiep).toBeNull()
  })
  it('hướng bi cái đi tiếp: vuông góc hướng bi đích, dài 120, chỉ khi có Mắt thần; va thẳng tâm ⇒ không có', () => {
    const info = nhamInfo(st, aim)!, co = duongMatThan(info, aim, true)!
    const tx = co.tiep!.x1 - co.tiep!.x0, ty = co.tiep!.y1 - co.tiep!.y0, dx = co.dich.x1 - co.dich.x0, dy = co.dich.y1 - co.dich.y0
    expect(Math.hypot(tx, ty)).toBeCloseTo(DAI_TIEP_MT, 6)
    expect(tx * dx + ty * dy).toBeCloseTo(0, 6)
    const thang = { balls: [st.balls[0]!, { ...st.balls[1]!, x: 250 }] } as unknown as Ban
    expect(duongMatThan(nhamInfo(thang, aim), aim, true)!.tiep).toBeNull()
    expect(duongMatThan(nhamInfo(st, { x: 1, y: 0 }), { x: 1, y: 0 }, true)).toBeNull() // không trúng bi ⇒ chỉ nét tới băng
  })
})

describe('bi lăn thật: dừng thì giữ hướng quay', () => {
  it('sau khi lăn rồi dừng, ảnh vẽ = hướng lúc dừng (không về gốc); đứng yên thì không tô lại mỗi khung', () => {
    const { doc, tô } = taiLieuGia(), v = vanMoi(), bv = new BoVe(doc)
    const k = tinhKhungBan(600, 1100, { khungDoc: true })
    bv.datCo(k, 1, false)
    const ctx = doc.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
    const cue = v.bi_('cue')
    v.aim = { x: 0.03, y: -1 }; v.datLuc(0.25); v.isBreak = false
    expect(v.ban()).toBe(true)
    for (let i = 0; i < 2000 && v.pha === 'moving'; i++) { v.buoc(1 / 60); if (bv.canVe(v, null, true, false)) bv.ve(ctx, v, null, true, false) }
    expect(v.pha).not.toBe('moving')
    // khung sau khi dừng: tô ảnh bi cái theo đúng hướng lúc dừng
    bv.canVe(v, null, true, false); (bv as unknown as { phaiVe: boolean }).phaiVe = true; bv.ve(ctx, v, null, true, false)
    const B = taoBong(Math.max(12, Math.ceil(2 * 21 * k.S) + 2)), mong = new Uint8ClampedArray(B.N * B.N * 4)
    toBiLan(B, kieuBi('cue', 0), null as MatNa | null, cue.q, false, mong)
    const cuoi = [...tô].reverse().find((x) => x.data.length === mong.length && x.data.every((c, i) => c === mong[i]))
    expect(cuoi).toBeTruthy() // ảnh bi cái đang hiện đúng là hướng lúc dừng (không phải dáng gốc)
    // đứng yên nhiều khung: không tô lại ảnh nào nữa
    const n = tô.length
    for (let i = 0; i < 30; i++) { v.buoc(1 / 60); (bv as unknown as { phaiVe: boolean }).phaiVe = true; bv.ve(ctx, v, null, true, false) }
    expect(tô.length).toBe(n)
  })
  // Sửa 30/09 (thầy: "màn xếp bi cho hiển thị bi thật luôn, kiểu cũ nhìn bị giả"): bi đầu ván KHÔNG còn dáng gốc phẳng.
  it('bi đầu ván: vẽ 3D theo hướng khởi tạo theo hạt giống (mã ván + kí hiệu), ổn định khi vẽ lại, không về dáng gốc', () => {
    const { doc, tô } = taiLieuGia(), v = vanMoi(), bv = new BoVe(doc)
    const k = tinhKhungBan(600, 1100, { khungDoc: true })
    datHuongKhoiTao(v.st.balls, 'VAN-7')
    bv.datCo(k, 1, false)
    const ctx = doc.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
    bv.canVe(v, null, true, false); bv.ve(ctx, v, null, true, false)
    const cl = v.bi_('Cl'), B = taoBong(Math.max(12, Math.ceil(2 * 21 * k.S) + 2)), mong = new Uint8ClampedArray(B.N * B.N * 4) // bi sọc: thấy được hướng
    expect([...cl.q]).toEqual(huongKhoiTao('VAN-7|Cl'))
    toBiLan(B, kieuBi('Cl', 0), taoMatNa(doc, 'Cl'), huongKhoiTao('VAN-7|Cl'), false, mong)
    expect(tô.some((x) => x.data.length === mong.length && x.data.every((c, i) => c === mong[i]))).toBe(true)
    const goc = new Uint8ClampedArray(mong.length); toBiLan(B, kieuBi('Cl', 0), taoMatNa(doc, 'Cl'), [Math.SQRT1_2, 0, Math.SQRT1_2, 0], false, goc)
    expect(goc.every((c, i) => c === mong[i])).toBe(false) // không phải dáng gốc phẳng
    const n = tô.length
    for (let i = 0; i < 20; i++) { (bv as unknown as { phaiVe: boolean }).phaiVe = true; bv.ve(ctx, v, null, true, false) }
    expect(tô.length).toBe(n) // đứng yên: không tô lại
  })

})
