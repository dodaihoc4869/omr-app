// MÁY TÍNH FX4869 — dãy mã phím ⇒ CÂY để vẽ kiểu sách (nhóm lồng nhau, con trỏ, số mũ của ×10).
export type Nut = { k: 'c'; c: string; lop?: string } | { k: 'tro' } | { k: 'n'; loai: string; o: Nut[][] }
const CHU: Record<string, [string, string?]> = {
  '-': ['−'], neg: ['-', 'mtx-am'], pi: ['π'], e: ['e', 'mtx-nghieng'], 'asin(': ['sin⁻¹('], 'acos(': ['cos⁻¹('], 'atan(': ['tan⁻¹('], 'abs(': ['Abs('], nCr: ['C', 'mtx-am'], nPr: ['P', 'mtx-am'],
  x: ['x', 'mtx-nghieng'], y: ['y', 'mtx-nghieng'],
}
/** Dãy mã ⇒ cây để vẽ. `ct` = vị trí con trỏ (−1 = không vẽ). Dãy lệch nhóm (tin mạng hỏng) vẫn vẽ được phần đọc được. */
export function cayBt(bt: readonly string[], ct: number): Nut[] {
  let i = 0
  const doc = (): Nut[] => {
    const ra: Nut[] = []
    for (;;) {
      if (i === ct) ra.push({ k: 'tro' })
      const t = bt[i]
      if (t === undefined || t === '|' || t === '}') return ra
      i += 1
      if (t.endsWith('{')) {
        const o: Nut[][] = [doc()]
        while (bt[i] === '|') { i += 1; o.push(doc()) }
        if (bt[i] === '}') i += 1
        ra.push({ k: 'n', loai: t, o })
      } else if (t === 'e10') { // ×10 và số mũ đi liền sau (dấu + tối đa 3 chữ số) vẽ thành số mũ
        const mu: Nut[] = []
        for (let dem = 0; dem < 4; dem += 1) {
          const x = bt[i], laDau = dem === 0 && (x === 'neg' || x === '-' || x === '+')
          if (!laDau && !(x !== undefined && x.length === 1 && x >= '0' && x <= '9')) break
          if (i === ct) mu.push({ k: 'tro' })
          mu.push({ k: 'c', c: x === 'neg' || x === '-' ? '−' : x }); i += 1
        }
        ra.push({ k: 'n', loai: 'e10', o: [mu] })
      } else { const c = CHU[t]; ra.push({ k: 'c', c: c ? c[0] : t, lop: c?.[1] }) }
    }
  }
  const ra = doc()
  while (i < bt.length) { i += 1; ra.push(...doc()) } // '|' hoặc '}' lạc: bỏ qua, vẽ tiếp
  return ra
}
