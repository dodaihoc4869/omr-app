import type { TeacherExamSource, LoiGiaiMeta } from '../data/examContent'
import { khuTrungNguon } from './khu-trung-cau'
import { hashSeed, seededPermutation } from './exam-shuffle'
import { laCauRutDuoc } from './cau-tu-luan'

// Phân tích 16 trang đề 0305, 0330, 0332, 0344, ngày 16/09/2026.
// Đây là phân loại chuyên môn của ứng dụng, KHÔNG phải ma trận Bộ công bố.
// Phần II phân loại theo yêu cầu cao nhất của cả câu, không suy thành số ý.
export const MA_TRAN_HOA_2026 = {
  id: 'hoa-2026-phan-tich-v1', phut: 50,
  I: { biet: 11, hieu: 4, van_dung: 3 },
  II: { biet: 0, hieu: 3, van_dung: 1 },
  III: { biet: 1, hieu: 2, van_dung: 3 },
} as const
export const SO_CAU_CHUAN_2026 = { I: 18, II: 4, III: 6 }
export const GHI_CHU_MA_TRAN = 'Ma trận mức độ do ứng dụng phân tích từ đề 0305, 0330, 0332, 0344 năm 2026; không phải ma trận chính thức do Bộ công bố. Phần đúng/sai xếp mức theo cả câu.'
export function laBoDe12(s: Pick<TeacherExamSource, 'nhom'>): boolean {
  return /^12\s*·\s*bộ đề(?:\s|\/|$)/i.test((s.nhom || '').normalize('NFC').trim())
}
const MUC = ['biet', 'hieu', 'van_dung'] as const
const TEN = { biet: 'Biết', hieu: 'Hiểu', van_dung: 'Vận dụng' }
export function cauDuDieuKien(q: LoiGiaiMeta & { canXem?: boolean }): boolean {
  return !q.canXem && (!q.loiGiaiTrangThai || q.loiGiaiTrangThai === 'khop') && !!q.mucDo && MUC.includes(q.mucDo)
}
export function rutDeChuan2026(nguon: TeacherExamSource[], seed: string): TeacherExamSource[] {
  const ds = khuTrungNguon(nguon.filter(laBoDe12)).nguon
  const ids = new Set<string>()
  const thieu: string[] = []
  for (const phan of ['I', 'II', 'III'] as const) {
    const qs = ds.flatMap(s => s[`phan${phan}`] as (LoiGiaiMeta & {id:string;canXem?:boolean})[]).filter(cauDuDieuKien).filter((q) => laCauRutDuoc(q, phan)) // cấm rút câu tự luận (thầy lệnh 21/09)
    for (const muc of MUC) {
      const need = MA_TRAN_HOA_2026[phan][muc]
      const pool = qs.filter(q => q.mucDo === muc)
      if (pool.length < need) thieu.push(`Phần ${phan}, ${TEN[muc]}: cần ${need}, có ${pool.length}`)
      for (const i of seededPermutation(pool.length, hashSeed(`${seed}:${phan}:${muc}`)).slice(0, need)) ids.add(pool[i].id)
    }
  }
  if (thieu.length) throw new Error('BỘ ĐỀ lớp 12 chưa đủ câu đúng ma trận. ' + thieu.join('; '))
  return ds.map(s => ({ ...s, phanI:s.phanI.filter(q=>ids.has(q.id)), phanII:s.phanII.filter(q=>ids.has(q.id)), phanIII:s.phanIII.filter(q=>ids.has(q.id)) })).filter(s=>s.phanI.length+s.phanII.length+s.phanIII.length)
}
