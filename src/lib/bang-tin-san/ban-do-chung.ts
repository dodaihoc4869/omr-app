// BẢN ĐỒ LỚP 3D — phần THUẦN (không three, không DOM) dùng chung cho bản three.js và bản lùi isometric Canvas 2D: bố trí cột, chiều cao, màu theo tỉ lệ đúng, đặt nhãn không đè nhau.
import type { LopSan } from './kieu'

/** Bố trí `n` lớp thành lưới (cột × hàng) quanh gốc: trả (x, z) theo đơn vị lưới, hàng cuối canh giữa. */
export function boTriLop(n: number): { x: number; z: number }[] {
  if (n <= 0) return []
  const cot = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : 5
  const hang = Math.ceil(n / cot)
  return Array.from({ length: n }, (_, i) => {
    const h = Math.floor(i / cot)
    const trongHang = h === hang - 1 ? n - h * cot : cot
    return { x: (i % cot) - (trongHang - 1) / 2, z: h - (hang - 1) / 2 }
  })
}

/** Chiều cao cột theo số câu: cột cao nhất chạm `caoToiDa`; sàn 320 câu để buổi sáng ít câu không kéo cột cao vọt. */
export function tyLeCao(maxCau: number, caoToiDa = 4.2): number {
  return caoToiDa / Math.max(320, maxCau * 1.05)
}

const kep = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

/** Chuỗi màu CSS (hex hoặc rgb()) → [r, g, b] 0–255. */
export function docRgb(mau: string): [number, number, number] {
  const s = mau.trim()
  if (s.startsWith('#')) {
    const h = s.slice(1)
    const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0]
  }
  const m = s.match(/[\d.]+/g)
  return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0]
}

/** Màu cột theo tỉ lệ đúng (%): đỏ (≤ 72) → vàng → xanh lá (≥ 94), nội suy tuyến tính trong khoảng đó. */
export function mauTheoTiLe(p: number, do_: string, vang: string, la: string): [number, number, number] {
  const t = kep((p - 72) / 22, 0, 1)
  const a = docRgb(t < 0.5 ? do_ : vang)
  const b = docRgb(t < 0.5 ? vang : la)
  const k = t < 0.5 ? t * 2 : (t - 0.5) * 2
  return [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * k)) as [number, number, number]
}

/** Tỉ lệ đúng (%) của một lớp; chưa có câu nào ⇒ null (cột xám, không bịa màu). */
export const tiLeLop = (l: Pick<LopSan, 'soCau' | 'soCauDung'>): number | null => (l.soCau > 0 ? (l.soCauDung / l.soCau) * 100 : null)

export interface ViTriNhan {
  x: number
  y: number
  /** Bề rộng nhãn (px). */
  w: number
  /** Độ gần camera (lớn = gần) — quyết định nhãn nào nằm trên. */
  gan: number
}

/**
 * Đặt nhãn HTML nổi trên đầu cột: kẹp trong khung, đẩy LÊN khi hai nhãn chồng nhau (`cao` px mỗi nhãn), không nhãn nào che đầu cột của lớp khác quá mức.
 * Hết chỗ phía trên (nhãn chạm mép trên) thì DỜI NGANG sang chỗ trống kế bên thay vì dồn đè lên nhau — `x0` là vị trí gốc (đầu cột) để vẽ dây dẫn kéo lệch về đúng cột.
 * Trả `y0` / `x0` (vị trí gốc) và `x` / `y` (vị trí sau khi đặt). Hết mọi cách (quá nhiều nhãn cho khung) mới để chồng.
 */
export function datNhanChongLap<T extends ViTriNhan>(vt: readonly T[], w: number, cao = 33): (T & { y0: number; x0: number })[] {
  const ra = vt.map((p) => ({ ...p, x: kep(p.x, p.w / 2 + 2, Math.max(p.w / 2 + 2, w - p.w / 2 - 2)), y0: p.y, x0: p.x }))
  const daDat: typeof ra = []
  const chong = (p: { x: number; y: number; w: number }, q: { x: number; y: number; w: number }) => Math.abs(p.x - q.x) < (p.w + q.w) / 2 + 4 && Math.abs(p.y - q.y) < cao
  ra
    .map((_, i) => i)
    .sort((a, b) => ra[b]!.y - ra[a]!.y)
    .forEach((i) => {
      const p = ra[i]!
      let lap = true
      let vong = 0
      while (lap && vong++ < 8) {
        lap = false
        for (const q of daDat) {
          if (chong(p, q)) {
            p.y = q.y - cao
            lap = true
          }
        }
      }
      if (p.y < cao || daDat.some((q) => chong(p, q))) {
        // hết chỗ phía trên: thử dời ngang (và các tầng cao thấp hơn), chọn cách ít lệch nhất mà không chồng nhãn nào
        const bienTrai = p.w / 2 + 2
        const bienPhai = Math.max(bienTrai, w - p.w / 2 - 2)
        const xs = new Set<number>([p.x])
        for (const q of daDat) for (const d of [-1, 1]) xs.add(kep(q.x + d * ((p.w + q.w) / 2 + 4.5), bienTrai, bienPhai)) // +0,5 để khỏi dính đúng biên (sai số số thực)
        let tot: { x: number; y: number; gia: number } | null = null
        for (let k = 0; k < 6; k++) {
          const y = Math.max(cao, p.y0 - k * cao)
          if (k > 0 && y === Math.max(cao, p.y0 - (k - 1) * cao)) break
          for (const x of xs) {
            if (daDat.some((q) => chong({ x, y, w: p.w }, q))) continue
            const gia = Math.abs(x - p.x0) + 0.7 * (p.y0 - y)
            if (!tot || gia < tot.gia) tot = { x, y, gia }
          }
        }
        if (tot) { p.x = tot.x; p.y = tot.y }
      }
      p.y = Math.max(cao, p.y)
      daDat.push(p)
    })
  return ra
}

/** Sau khi đặt nhãn: còn cặp nào CHỒNG nhau không (hết chỗ dù đã đẩy lên + dời ngang)? Dùng để chuyển nhãn sang bản NGẮN (chỉ tên lớp). */
export function conNhanChong(dat: readonly { x: number; y: number; w: number }[], cao: number): boolean {
  for (let i = 0; i < dat.length; i++) {
    for (let j = i + 1; j < dat.length; j++) {
      if (Math.abs(dat[i]!.x - dat[j]!.x) < (dat[i]!.w + dat[j]!.w) / 2 + 4 && Math.abs(dat[i]!.y - dat[j]!.y) < cao) return true
    }
  }
  return false
}
