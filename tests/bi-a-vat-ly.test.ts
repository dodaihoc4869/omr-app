// @vitest-environment node
// BI-A PHẢN ỨNG — vật lý: số đo đặc tả 7.2 (nghiệm thu 1) + tất định (nghiệm thu 2).
import { describe, expect, it } from 'vitest'
import { HS, R, bamBan, biMoi, chayHet, danhBi, danhBiV, dangChay, step, tocDo, VMAX, W, H, suKienMoi, xepBan, type Ban, type Bi } from '../src/game/bi-a/vat-ly'

const q0 = () => 0.5
const bi = (id: Bi['id'], x: number, y: number): Bi => biMoi(id, x, y, q0)

// Tốc độ của "lực 45%" theo thang lực CŨ (trần 2600) — test đo luật trượt/lăn/xoáy, không đo thang lực (thầy 05/10 nhân đôi lực tối đa).
const V45 = 2600 * (0.05 + 0.95 * Math.pow(0.45, 1.2))

describe('Bi-a — vật lý thật', () => {
  it('đánh giữa tâm: trượt rồi chuyển sang lăn ở 5/7 tốc độ (0,707–0,721)', () => {
    const c = bi('cue', 250, 850)
    danhBiV(c, 0, -1, V45, 0, 0)
    const v0 = -c.vy, st: Ban = { balls: [c] }, ev = suKienMoi()
    let tiLe = 0
    for (let i = 0; i < 240; i++) {
      step(st, ev, null)
      if (Math.abs(c.vy - R * c.wx) < 1) { tiLe = -c.vy / v0; break }
    }
    expect(tiLe).toBeGreaterThanOrEqual(0.707)
    expect(tiLe).toBeLessThanOrEqual(0.721)
  })

  it('va thẳng bi cách 150, lực 45%, 0,6 giây sau va: xoáy trên đi theo > 100, đánh giữa < 60, xoáy dưới lùi > 60', () => {
    const doSau = (sy: number) => {
      const c = bi('cue', 250, 600), o = bi('Na', 250, 600 - 150 - 2 * R)
      danhBiV(c, 0, -1, V45, 0, sy)
      const st: Ban = { balls: [c, o] }, ev = suKienMoi()
      let tva = -1, yva = 0
      for (let i = 0; i < 240 * 4; i++) {
        step(st, ev, null)
        if (tva < 0 && o.vy) { tva = i; yva = c.y }
        if (tva >= 0 && (i - tva) * HS >= 0.6) break
      }
      return yva - c.y // dương: đi theo; âm: lùi
    }
    expect(doSau(0.8)).toBeGreaterThan(100)
    expect(Math.abs(doSau(0))).toBeLessThan(60)
    expect(-doSau(-0.8)).toBeGreaterThan(60)
  })

  it('xoáy phải/trái 0,8 đập băng thẳng, lực 50%: bật lệch phải/trái > 100, đối xứng ± 2', () => {
    const qua300 = (sx: number) => {
      const c = bi('cue', 250, 500)
      danhBi(c, 0, -1, 0.5, sx, 0)
      const st: Ban = { balls: [c] }, ev = suKienMoi()
      for (let i = 0; i < 240 * 6; i++) { step(st, ev, null); if (c.vy > 0 && c.y > 300) return c.x }
      return NaN
    }
    const phai = qua300(0.8), trai = qua300(-0.8)
    expect(phai - 250).toBeGreaterThan(100)
    expect(250 - trai).toBeGreaterThan(100)
    expect(Math.abs((phai - 250) - (250 - trai))).toBeLessThanOrEqual(2)
  })

  it('phá bàn lực 100% dừng trong 3–7 giây', () => {
    const st = xepBan(q0), c = st.balls.find((b) => b.id === 'cue')!
    danhBi(c, 0.004, -1, 1, 0, 0)
    const ev = suKienMoi()
    const buoc = chayHet(st, ev, 12)
    expect(dangChay(st)).toBe(false)
    expect(buoc * HS).toBeGreaterThanOrEqual(3)
    expect(buoc * HS).toBeLessThanOrEqual(7)
    expect(ev.firstHit).not.toBeNull()
  })

  it('tất định: 200 cú ngẫu nhiên (seed cố định) chạy 2 lần cho cùng băm từng cú', () => {
    const chay = () => {
      let s = 12345
      const rand = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296 }
      const bams: string[] = []
      for (let k = 0; k < 200; k++) {
        const st = xepBan(q0), c = st.balls.find((b) => b.id === 'cue')!
        const a = rand() * Math.PI * 2
        danhBi(c, Math.cos(a), Math.sin(a), 0.2 + rand() * 0.8, (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6)
        chayHet(st, suKienMoi(), 8)
        bams.push(bamBan(st))
      }
      return bams
    }
    const a = chay(), b = chay()
    expect(a).toEqual(b)
    expect(new Set(a).size).toBeGreaterThan(150) // các cú thật sự khác nhau
  })

  it('hướng quay (để vẽ) không ảnh hưởng vật lý', () => {
    const a = xepBan(() => 0.1), b = xepBan(() => 0.9)
    for (const st of [a, b]) danhBi(st.balls.find((x) => x.id === 'cue')!, 0.004, -1, 0.9, 0.2, -0.3)
    chayHet(a, suKienMoi()); chayHet(b, suKienMoi())
    expect(bamBan(a)).toBe(bamBan(b))
  })
})

describe('Bi-a — lực đánh gấp đôi (thầy 05/10)', () => {
  it('lực tối đa = 2 × cũ (5200); lực nhỏ nhất giữ như cũ (130) ⇒ cú chạm nhẹ không đổi', () => {
    expect(VMAX).toBe(5200)
    expect(tocDo(1)).toBe(2 * 2600)
    expect(tocDo(0)).toBe(2600 * 0.05)
  })
  it('lực tối đa không xuyên: cú CẮT MỎNG (lệch 40,7–41,9 px) vẫn chạm bi đích; bi cái không lọt qua băng', () => {
    // bước 1/240 giây ở 5200 px/s = 21,7 px ⇒ không chia bước thì bi lệch > 40,6 px bị "đi xuyên" qua
    for (const lech of [40.7, 41.2, 41.9]) {
      const c = bi('cue', 250, 700), o = bi('Na', 250 + lech, 300)
      danhBi(c, 0, -1, 1, 0, 0)
      const st: Ban = { balls: [c, o] }, ev = suKienMoi()
      for (let i = 0; i < 240 * 2; i++) step(st, ev, null)
      expect(ev.firstHit).toBe('Na')
    }
    // bắn thẳng vào băng giữa hai lỗ, góc lệch nhẹ: bi cái luôn trong bàn
    for (const dx of [0.3, -0.3, 0.6]) {
      const c = bi('cue', 250, 450), d = Math.hypot(dx, 1)
      danhBi(c, dx / d, 1 / d, 1, 0, 0)
      const st: Ban = { balls: [c] }, ev = suKienMoi()
      for (let i = 0; i < 240 * 6 && dangChay(st); i++) {
        step(st, ev, null)
        if (c.on) { expect(c.x).toBeGreaterThanOrEqual(0); expect(c.x).toBeLessThanOrEqual(W); expect(c.y).toBeGreaterThanOrEqual(0); expect(c.y).toBeLessThanOrEqual(H) }
      }
    }
  })
})
