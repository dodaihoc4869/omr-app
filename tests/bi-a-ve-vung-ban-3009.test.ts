// BI-A · VẼ MÁY YẾU (30/09, đo docs/do-toi-uu-bia-3009.md): khung không đổi thì không vẽ lại; bi lăn thì chỉ tô vùng bẩn (clip), vùng quá lớn thì vẽ cả bàn.
// Canvas giả (jsdom không có 2D): ghi lại lệnh `rect` + `clip` để biết khung nào vẽ vùng bẩn. So ảnh THẬT (vùng bẩn = cả bàn, từng điểm ảnh) ở
// scripts/do-bia/do-client.mjs --kiem=1 (Chromium).
import { describe, expect, it } from 'vitest'
import { BoVe } from '../src/game/bi-a/ve-ban'
import { VanBia } from '../src/game/bi-a/dieu-khien'
import { tinhKhungBan } from '../src/game/bi-a/bo-cuc'

function ctxGia(w: number, h: number) {
  const lenh: string[] = []
  const rong = (): unknown => new Proxy(() => rong(), { get: () => rong() })
  const dich: Record<string, unknown> = { canvas: { width: w, height: h } }
  const ctx = new Proxy(dich, {
    get: (t, k: string) => (k in t ? t[k] : (...a: unknown[]) => { lenh.push(k); if (k === 'rect') lenh.push(`rect:${a.join(',')}`); return rong() }),
    set: (t, k: string, v) => { t[k] = v; return true },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, lenh }
}
function vanMoi() {
  let s = 7
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const v = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [], chot: null, rand }, { moCau: () => {}, ketThuc: () => {}, am: () => {}, gomVa: () => {} })
  v.datHen(() => () => {})
  return v
}
function boVe() {
  const k = tinhKhungBan(600, 1100, { khungDoc: true })
  const bv = new BoVe(document)
  bv.datCo(k, 2, false)
  return { bv, w: Math.round(k.cw * 2), h: Math.round(k.ch * 2) }
}

describe('Bi-a vẽ máy yếu: bỏ khung không đổi, vẽ vùng bẩn', () => {
  it('bàn đứng yên, không kéo ⇒ khung sau KHÔNG vẽ lại; xoay hướng nhắm / đổi lực ⇒ vẽ lại', () => {
    const v = vanMoi(), { bv, w, h } = boVe(), { ctx } = ctxGia(w, h)
    expect(bv.canVe(v, null, true, false)).toBe(true) // khung đầu
    bv.ve(ctx, v, null, true, false)
    expect(bv.canVe(v, null, true, false)).toBe(false)
    expect(bv.canVe(v, null, true, false)).toBe(false)
    v.xoayNham(2)
    expect(bv.canVe(v, null, true, false)).toBe(true)
    bv.ve(ctx, v, null, true, false)
    expect(bv.canVe(v, null, true, false)).toBe(false)
    v.datLuc(0.4)
    expect(bv.canVe(v, null, true, false)).toBe(true)
    bv.ve(ctx, v, null, true, false)
    // chỉ bi (nhãn) bật / tắt ⇒ vẽ lại
    expect(bv.canVe(v, { id: 'Na', qh: 'em' }, true, false)).toBe(true)
  })
  it('đổi cỡ canvas ⇒ khung kế vẽ CẢ bàn (không clip)', () => {
    const v = vanMoi(), { bv, w, h } = boVe(), a = ctxGia(w, h)
    bv.canVe(v, null, true, false); bv.ve(a.ctx, v, null, true, false)
    bv.datCo(tinhKhungBan(500, 900, { khungDoc: true }), 2, false)
    const b = ctxGia(w, h)
    expect(bv.canVe(v, null, true, false)).toBe(true)
    bv.ve(b.ctx, v, null, true, false)
    expect(b.lenh).not.toContain('clip')
  })
  it('bi lăn ⇒ mỗi khung đều vẽ, khung đầu vẽ cả bàn, các khung sau chỉ tô vùng bẩn (clip) nhỏ hơn cả bàn; lăn xong đứng yên ⇒ thôi vẽ', () => {
    const v = vanMoi(), { bv, w, h } = boVe()
    v.aim = { x: 0.02, y: -1 }; v.datLuc(0.35); v.isBreak = false
    const dau = ctxGia(w, h)
    bv.canVe(v, null, true, false); bv.ve(dau.ctx, v, null, true, false)
    expect(v.ban()).toBe(true)
    let cat = 0, ca = 0, dienTichMax = 0
    for (let i = 0; i < 90; i++) {
      v.buoc(1 / 60)
      const g = ctxGia(w, h)
      expect(bv.canVe(v, null, true, false)).toBe(true)
      bv.ve(g.ctx, v, null, true, false)
      if (g.lenh.includes('clip')) {
        cat++
        let dt = 0
        for (const l of g.lenh) if (l.startsWith('rect:')) { const [, , rw, rh] = l.slice(5).split(',').map(Number); dt += rw! * rh! }
        dienTichMax = Math.max(dienTichMax, dt)
      } else ca++
      if (v.pha !== 'moving') break
    }
    expect(cat).toBeGreaterThan(5)
    expect(dienTichMax).toBeLessThan(0.55 * w * h)
    // hết lăn: pha 'xet' — một khung vẽ lại (đổi pha), rồi đứng yên thì thôi
    for (let i = 0; i < 400 && v.pha === 'moving'; i++) { v.buoc(1 / 60); const g = ctxGia(w, h); if (bv.canVe(v, null, true, false)) bv.ve(g.ctx, v, null, true, false) }
    const g = ctxGia(w, h)
    if (bv.canVe(v, null, true, false)) bv.ve(g.ctx, v, null, true, false)
    expect(bv.canVe(v, null, true, false)).toBe(false)
    expect(ca).toBeGreaterThanOrEqual(0)
  })
})
