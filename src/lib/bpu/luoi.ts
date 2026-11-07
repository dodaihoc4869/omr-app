// BÌNH PHẢN ỨNG — LƯỚI TÊN TRÊN BẢNG CHIẾU (thuần, có test tests/bpu-luoi-0711.test.ts). Sân khấu 1920×1080.
/** LƯỚI TÊN (thầy 07/11): chỉ các em CÓ MẶT, TỐI ĐA HAI HÀNG như bản vẽ («danh sách học sinh có mặt tự động điều chỉnh chỉ hiện tối đa hai hàng»);
 *  ≤ 12 em ⇒ một hàng. Ô bám đáy sân khấu (trên đáy 16 px), rộng chia đều 1856 px (lề 32 px — dải tên rộng nhất có thể để chữ to). Cỡ chữ do bảng đo theo ô (chữ đơn dài nhất nằm trọn một dòng). */
export const DAY_LUOI = 1064, KHE = 6, TRAI_LUOI = 32, RONG_LUOI = 1856, CAO_O = 78
export interface Luoi { cot: number; hang: number; w: number; h: number; top: number }
export function boLuoi(n: number): Luoi {
  const so = Math.max(1, n), cot = so <= 12 ? Math.max(8, so) : Math.ceil(so / 2), hang = Math.ceil(so / cot), h = CAO_O
  return { cot, hang, w: (RONG_LUOI - (cot - 1) * KHE) / cot, h, top: DAY_LUOI - (hang * h + (hang - 1) * KHE) }
}
/** Tên gọi trên ô: chữ cuối của họ tên («Đỗ Đại Học» ⇒ «Học»); trùng trong lớp ⇒ hai chữ cuối («Minh Anh»); vẫn trùng ⇒ thêm số thứ tự. */
export function tenGoiLop(ds: { sbd: string; ten: string }[]): Map<string, string> {
  const chu = (t: string) => t.trim().split(/\s+/).filter(Boolean)
  const dem = (f: (t: string[]) => string) => { const m = new Map<string, number>(); for (const e of ds) { const k = f(chu(e.ten)).toLowerCase(); m.set(k, (m.get(k) ?? 0) + 1) } return m }
  const mot = (t: string[]) => t[t.length - 1] ?? '', hai = (t: string[]) => t.slice(-2).join(' ')
  const d1 = dem(mot), d2 = dem(hai), ra = new Map<string, string>()
  ds.forEach((e, i) => { const t = chu(e.ten); const a = mot(t); if (!a) { ra.set(e.sbd, e.sbd); return } if ((d1.get(a.toLowerCase()) ?? 0) < 2) { ra.set(e.sbd, a); return } const b = hai(t); ra.set(e.sbd, (d2.get(b.toLowerCase()) ?? 0) < 2 ? b : `${b} ${i + 1}`) })
  return ra
}
