// BÌNH PHẢN ỨNG — LƯỚI TÊN TRÊN BẢNG CHIẾU (thuần, có test tests/bpu-luoi-0711.test.ts). Sân khấu 1920×1080.
/** LƯỚI TÊN (thầy 07/11 «chữ bị chèn rối … mỗi ô hiện đủ tên»): dải 828–1060 dưới nội dung, tự chọn số cột theo sĩ số để ô rộng ~1,6 lần cao. */
export const DINH_LUOI = 828, DAY_LUOI = 1060, KHE = 8, RONG_LUOI = 1792
export interface Luoi { cot: number; hang: number; w: number; h: number; top: number }
export function boLuoi(n: number): Luoi {
  let tot: (Luoi & { diem: number }) | null = null
  for (let cot = 10; cot <= 28; cot += 2) {
    const hang = Math.max(1, Math.ceil(n / cot)), h = Math.min(84, Math.floor((DAY_LUOI - DINH_LUOI - (hang - 1) * KHE) / hang)), w = (RONG_LUOI - (cot - 1) * KHE) / cot
    const diem = Math.min(w / 1.6, h)
    if (!tot || diem > tot.diem + 0.01) tot = { cot, hang, w, h, top: DAY_LUOI - (hang * h + (hang - 1) * KHE), diem }
  }
  const { diem: _d, ...l } = tot!
  void _d
  return l
}
/** Tên gọi trên ô: chữ cuối của họ tên («Đỗ Đại Học» ⇒ «Học»); trùng trong lớp ⇒ hai chữ cuối («Minh Anh»); vẫn trùng ⇒ thêm số thứ tự. */
export function tenGoiLop(ds: { sbd: string; ten: string }[]): Map<string, string> {
  const chu = (t: string) => t.trim().split(/\s+/).filter(Boolean)
  const dem = (f: (t: string[]) => string) => { const m = new Map<string, number>(); for (const e of ds) { const k = f(chu(e.ten)).toLowerCase(); m.set(k, (m.get(k) ?? 0) + 1) } return m }
  const mot = (t: string[]) => t.at(-1) ?? '', hai = (t: string[]) => t.slice(-2).join(' ')
  const d1 = dem(mot), d2 = dem(hai), ra = new Map<string, string>()
  ds.forEach((e, i) => { const t = chu(e.ten); const a = mot(t); if (!a) { ra.set(e.sbd, e.sbd); return } if ((d1.get(a.toLowerCase()) ?? 0) < 2) { ra.set(e.sbd, a); return } const b = hai(t); ra.set(e.sbd, (d2.get(b.toLowerCase()) ?? 0) < 2 ? b : `${b} ${i + 1}`) })
  return ra
}
