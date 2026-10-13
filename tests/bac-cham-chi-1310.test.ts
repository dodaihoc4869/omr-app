// @vitest-environment node
// Thầy 13/10: "tính toán tối ưu sắp xếp mức độ lười biếng theo cấu trúc sau và hiển thị luôn nhé. 12 BẬC TỪ LƯỜI BIẾNG ĐẾN CHĂM CHỈ …". Khoá:
//  · đúng 12 bậc, đúng tên, đúng biểu tượng, đúng thứ tự thầy đưa;
//  · KHÔNG BAO GIỜ mâu thuẫn nhóm thầy đã duyệt: Lười 1–5 · Chưa đều 6–7 · Chăm 8–12 · Chưa đủ dữ liệu ⇒ chưa xếp bậc (thử 3.000 dãy ngẫu nhiên);
//  · làm thêm câu ở bất kỳ ngày nào thì điểm KHÔNG tụt (đơn điệu) — em không bao giờ bị phạt vì chăm hơn;
//  · gần đây nặng hơn: cùng số ngày đủ, đủ ở tuần này cao điểm hơn đủ ở tuần trước;
//  · ví dụ chốt: không làm gì ⇒ bậc 1; đủ mức 10 ngày liền ⇒ bậc 11; đủ 10 ngày liền + làm vượt ~20% ⇒ bậc 12; đủ điểm mà chuỗi < 7 ngày ⇒ vẫn 11.
import { describe, expect, it } from 'vitest'
import { BAC_CHAM_CHI, bacChamChi, bacTuDiem, diemChamChi, NGUONG_BAC } from '../server/src/bac-cham-chi'
import { tomTatNhip } from '../server/src/nhip-hoc-luat'
import type { NgayNhipEm } from '../server/src/nhip-hoc-kieu'

const HOM_NAY = '2026-10-20'
/** Dãy ngày liền nhau kết thúc hôm qua (+ hôm nay nếu có), từ mảng [mức, đã làm] cũ → mới. */
function day(ds: [number, number][], homNay?: [number, number]): NgayNhipEm[] {
  const h = Date.parse(`${HOM_NAY}T00:00:00Z`)
  const ra = ds.map(([muc, lam], i) => ({ ngay: new Date(h - (ds.length - i) * 86_400_000).toISOString().slice(0, 10), muc, lam }))
  return homNay ? [...ra, { ngay: HOM_NAY, muc: homNay[0], lam: homNay[1] }] : ra
}
const bac = (ds: NgayNhipEm[]) => bacChamChi(ds, HOM_NAY, tomTatNhip(ds, HOM_NAY))
const KHOANG = { luoi: [1, 5], 'chua-deu': [6, 7], cham: [8, 12] } as const

describe('12 bậc của thầy', () => {
  it('đúng tên, biểu tượng, thứ tự; nhóm của bậc khớp khoảng', () => {
    expect(BAC_CHAM_CHI.map((b) => `${b.so}. ${b.bieuTuong} ${b.ten}`)).toEqual([
      '1. 🦥 Lười Vô Cực', '2. 🛌 Thánh Bất Động', '3. 💤 Vua Ngủ Nướng', '4. 🐌 Chúa Tể Trì Hoãn', '5. 🐢 Cao Thủ Né Việc', '6. 🐼 Lười Có Tính Toán',
      '7. ⚖️ Đại Sư Cân Bằng', '8. 🚶 Tân Binh Siêng Năng', '9. 📚 Chiến Binh Cần Cù', '10. 🔥 Cao Thủ Chăm Chỉ', '11. ⚡ Chiến Thần Năng Suất', '12. 👑 Thần Chăm Chỉ Tối Thượng',
    ])
    for (const b of BAC_CHAM_CHI) expect(b.so >= KHOANG[b.nhom][0] && b.so <= KHOANG[b.nhom][1]).toBe(true)
    for (const [nhom, k] of Object.entries(NGUONG_BAC)) expect(k.dau + k.nguong.length).toBe(KHOANG[nhom as keyof typeof KHOANG][1])
  })

  it('3.000 dãy ngẫu nhiên: bậc luôn nằm trong khoảng của nhóm; chưa đủ dữ liệu ⇒ null; điểm 0–100', () => {
    let s = 7
    const r = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
    const daGap = new Set<number>()
    for (let k = 0; k < 3000; k++) {
      // Mỗi em một "tính chăm" p (em chăm thì ngày nào cũng chăm — sát thực tế hơn trộn ngẫu nhiên từng ngày): ngày đủ mức (có khi vượt) với xác suất
      // ~p, còn lại làm dở hoặc bỏ hẳn.
      const n = 1 + Math.floor(r() * 20), p = r()
      const ds = day(Array.from({ length: n }, () => { const muc = 24 + Math.floor(r() * 3) * 6; const u = r(); return [muc, u < p * 0.9 ? Math.floor(muc * (1 + r() * 0.5 * p)) : u < p ? Math.floor(r() * muc) : r() < 0.5 ? 0 : Math.floor(r() * muc)] as [number, number] }), r() < 0.5 ? [24, Math.floor(r() * 30)] : undefined)
      const t = tomTatNhip(ds, HOM_NAY)
      const b = bacChamChi(ds, HOM_NAY, t)
      if (t.nhom === 'chua-du') { expect(b).toBeNull(); continue }
      expect(b).not.toBeNull()
      expect(b!.bac).toBeGreaterThanOrEqual(KHOANG[t.nhom][0])
      expect(b!.bac).toBeLessThanOrEqual(KHOANG[t.nhom][1])
      expect(b!.diem).toBeGreaterThanOrEqual(0)
      expect(b!.diem).toBeLessThanOrEqual(100)
      daGap.add(b!.bac)
    }
    expect(daGap.size).toBe(12) // phép tính trải đủ 12 bậc, không dồn cục
  })

  it('làm thêm câu ở bất kỳ ngày nào thì điểm không tụt', () => {
    const goc: [number, number][] = [[24, 10], [24, 24], [24, 0], [24, 30], [24, 12], [24, 24], [24, 5], [24, 24]]
    for (let i = 0; i < goc.length; i++) for (const them of [1, 6, 24]) {
      const sau = goc.map((x, j) => (j === i ? [x[0], x[1] + them] : x)) as [number, number][]
      const a = day(goc), b = day(sau)
      expect(diemChamChi(b, HOM_NAY, tomTatNhip(b, HOM_NAY).chuoiDuGanNhat)).toBeGreaterThanOrEqual(diemChamChi(a, HOM_NAY, tomTatNhip(a, HOM_NAY).chuoiDuGanNhat))
    }
  })

  it('gần đây nặng hơn: đủ ở tuần này > đủ ở tuần trước (cùng số ngày đủ)', () => {
    const cu = day([...Array(7).fill([24, 24]), ...Array(7).fill([24, 6])] as [number, number][])
    const moi = day([...Array(7).fill([24, 6]), ...Array(7).fill([24, 24])] as [number, number][])
    expect(diemChamChi(moi, HOM_NAY, tomTatNhip(moi, HOM_NAY).chuoiDuGanNhat)).toBeGreaterThan(diemChamChi(cu, HOM_NAY, tomTatNhip(cu, HOM_NAY).chuoiDuGanNhat))
  })

  it('ví dụ chốt', () => {
    expect(bac(day(Array(8).fill([24, 0]) as [number, number][]))?.bac).toBe(1) // không làm gì 8 ngày
    expect(bac(day(Array(10).fill([24, 24]) as [number, number][]))).toMatchObject({ bac: 11, diem: 95 }) // đủ mức đúng 10 ngày liền
    expect(bac(day(Array(10).fill([24, 29]) as [number, number][]))?.bac).toBe(12) // đủ 10 ngày liền + vượt ~20%
    expect(bac(day([[24, 0], [24, 0], [24, 0], [24, 0], [24, 29], [24, 29], [24, 29], [24, 29], [24, 29]] as [number, number][]))).toBeTruthy()
    expect(bacTuDiem('cham', 99, 5)).toEqual({ bac: 11, diemLenBac: null }) // đủ điểm nhưng chuỗi chưa 7 ngày
    expect(bacTuDiem('cham', 80, 9)).toEqual({ bac: 9, diemLenBac: 2 })
    expect(bacTuDiem('luoi', 40, 0)).toEqual({ bac: 5, diemLenBac: null }) // bậc kế thuộc nhóm khác ⇒ lên theo luật nhóm
    expect(bac(day([[24, 24], [24, 24]] as [number, number][]))).toBeNull() // dưới 3 ngày đã qua
  })

  it('đang bỏ học (ngày liền không làm tính tới hôm qua) bị trừ ngay', () => {
    const deu = day(Array(9).fill([24, 24]).concat([[24, 24]]) as [number, number][])
    const bo = day(Array(9).fill([24, 24]).concat([[24, 0]]) as [number, number][])
    expect(diemChamChi(deu, HOM_NAY, 10) - diemChamChi(bo, HOM_NAY, 0)).toBeGreaterThan(20)
  })
})
