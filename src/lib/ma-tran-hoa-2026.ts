import type { TeacherExamSource, LoiGiaiMeta } from '../data/examContent'
import { khuTrungNguon } from './khu-trung-cau'
import { hashSeed, seededPermutation } from './exam-shuffle'
import { laCauRutDuoc } from './cau-tu-luan'

// 09/11/2026 — THEO BLUEPRINT THẦY (docs/de-xuat-28-cau-v5-0911.md; phân tích đề chính thức 2026 mã 0326 & 0339, bảng 1.3):
// Phần I 12 Biết · 4 Hiểu · 2 VD; Phần III 0 · 3 · 3. Phần II blueprint chấm theo ý (5/7/4 trên 16 ý) — kho chỉ gắn mức cả câu ⇒ theo mức
// cao nhất của câu: C1 phức chất Hiểu, C2 tinh bột Hiểu, C3 chuẩn độ VD, C4 chất béo VD ⇒ 0 · 2 · 2. (Bản cũ 16/09: 11·4·3 · 0·3·1 · 1·2·3 từ đề 0305/0330/0332/0344.)
export const MA_TRAN_HOA_2026 = {
  id: 'hoa-2026-blueprint-0911', phut: 50,
  I: { biet: 12, hieu: 4, van_dung: 2 },
  II: { biet: 0, hieu: 2, van_dung: 2 },
  III: { biet: 0, hieu: 3, van_dung: 3 },
} as const
export const SO_CAU_CHUAN_2026 = { I: 18, II: 4, III: 6 }
export const SO_CAU_TONG_2026 = 28
export const GHI_CHU_MA_TRAN = 'Ma trận mức độ theo bản phân tích đề chính thức 2026 (mã 0326, 0339) thầy duyệt 09/11/2026. Phần đúng/sai xếp mức theo cả câu.'
export function laBoDe12(s: Pick<TeacherExamSource, 'nhom'>): boolean {
  return /^12\s*·\s*bộ đề(?:\s|\/|$)/i.test((s.nhom || '').normalize('NFC').trim())
}
const MUC = ['biet', 'hieu', 'van_dung'] as const
export function cauDuDieuKien(q: LoiGiaiMeta & { canXem?: boolean }): boolean {
  return !q.canXem && (!q.loiGiaiTrangThai || q.loiGiaiTrangThai === 'khop') && !!q.mucDo && MUC.includes(q.mucDo)
}
/** «Giá lệch» khi đặt câu ô (phần c, mức m) vào suất ô (phần P, mức M) — luật thầy 09/11 «đủ 28, chuẩn nhất có thể»:
 *  cùng phần = số bậc mức chênh; khác phần = 10 + số bậc chênh (giữ hình dạng đề 18 TN · 4 ĐS · 6 TLN trước, mức sau). */
export function giaLech2026(P: 'I' | 'II' | 'III', M: (typeof MUC)[number], c: 'I' | 'II' | 'III', m: (typeof MUC)[number]): number {
  const d = Math.abs(MUC.indexOf(M) - MUC.indexOf(m))
  return P === c ? d : 10 + d
}
/** Rút đề 28 câu theo ma trận: khớp đúng ô trước; ô thiếu lấy câu thừa của ô có giá lệch nhỏ nhất (cùng phần trước); chỉ báo lỗi khi cả kho
 *  không đủ 28 câu sạch (thầy 09/11: «nếu các câu không chuẩn mức độ thì rút chuẩn sao cho đủ 28 câu là được»). Câu tự luận không bao giờ được rút. */
export function rutDeChuan2026(nguon: TeacherExamSource[], seed: string): TeacherExamSource[] {
  const ds = khuTrungNguon(nguon.filter(laBoDe12)).nguon
  const ids = new Set<string>()
  const con = new Map<string, string[]>(), thieu = new Map<string, number>()
  const PHAN = ['I', 'II', 'III'] as const
  for (const phan of PHAN) {
    const qs = ds.flatMap(s => s[`phan${phan}`] as (LoiGiaiMeta & {id:string;canXem?:boolean})[]).filter(cauDuDieuKien).filter((q) => laCauRutDuoc(q, phan)) // cấm rút câu tự luận (thầy lệnh 21/09)
    for (const muc of MUC) {
      const need = MA_TRAN_HOA_2026[phan][muc]
      const pool = qs.filter(q => q.mucDo === muc)
      const tron = seededPermutation(pool.length, hashSeed(`${seed}:${phan}:${muc}`)).map(i => pool[i].id)
      const lay = tron.slice(0, need); lay.forEach(id => ids.add(id))
      con.set(`${phan}|${muc}`, tron.slice(lay.length))
      if (lay.length < need) thieu.set(`${phan}|${muc}`, need - lay.length)
    }
  }
  for (const [o, n0] of thieu) {
    let n = n0
    const [P, M] = o.split('|') as ['I' | 'II' | 'III', (typeof MUC)[number]]
    const gan = PHAN.flatMap(c => MUC.map(m => [c, m] as const)).filter(([c, m]) => `${c}|${m}` !== o)
      .sort((x, y) => giaLech2026(P, M, x[0], x[1]) - giaLech2026(P, M, y[0], y[1]))
    for (const [c, m] of gan) {
      const k = con.get(`${c}|${m}`)!
      while (n > 0 && k.length) { ids.add(k.shift()!); n-- }
      if (!n) break
    }
    if (n) throw new Error(`BỘ ĐỀ lớp 12 chưa đủ ${SO_CAU_TONG_2026} câu sạch (có ${ids.size}). Thầy bổ sung câu hoặc chọn thêm bộ đề.`)
  }
  return ds.map(s => ({ ...s, phanI:s.phanI.filter(q=>ids.has(q.id)), phanII:s.phanII.filter(q=>ids.has(q.id)), phanIII:s.phanIII.filter(q=>ids.has(q.id)) })).filter(s=>s.phanI.length+s.phanII.length+s.phanIII.length)
}
