// MA TRẬN ĐỀ (BẢN DUYỆT V2 · màn 18, thầy 09/10/2026): đếm câu của bộ đề theo CHUYÊN ĐỀ × MỨC ĐỘ — đúng dữ liệu câu có trên máy thầy.
// Mức độ dùng nhãn chuẩn của câu trên phiếu/đề (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md A2): Nhận biết · Thông hiểu · Vận dụng.
// Bản duyệt có thêm cột "Vận dụng cao": kho câu của thầy CHƯA có trường phân biệt vận dụng cao (chỉ biet/hieu/van_dung) ⇒ không bịa cột ấy;
// câu chưa gắn mức / chưa gắn chuyên đề được đếm vào ô "Chưa gắn" để thầy thấy và bổ sung — tổng luôn khớp số câu.
import type { TeacherExamSource } from '../data/examContent'

export const COT_MUC_DO = [
  { k: 'biet', nhan: 'Nhận biết' },
  { k: 'hieu', nhan: 'Thông hiểu' },
  { k: 'van_dung', nhan: 'Vận dụng' },
  { k: 'chua', nhan: 'Chưa gắn mức' },
] as const
export type KhoaMuc = (typeof COT_MUC_DO)[number]['k']
export const CHUA_GAN_CHUYEN_DE = 'Chưa gắn chuyên đề'

export interface HangMaTran {
  chuyenDe: string
  o: Record<KhoaMuc, number>
  tong: number
}
export interface MaTranDe {
  hang: HangMaTran[]
  cot: Record<KhoaMuc, number>
  tong: number
}

const rong = (): Record<KhoaMuc, number> => ({ biet: 0, hieu: 0, van_dung: 0, chua: 0 })

/** Ma trận của MỌI câu (ba phần) trong các tờ đã lọc. Hàng xếp theo số câu giảm dần; "Chưa gắn chuyên đề" luôn ở cuối. */
export function dungMaTranDe(nguon: readonly TeacherExamSource[]): MaTranDe {
  const theoCd = new Map<string, HangMaTran>()
  const cot = rong()
  let tong = 0
  for (const de of nguon) {
    for (const c of [...de.phanI, ...de.phanII, ...de.phanIII] as { chuyenDe?: string; mucDo?: string }[]) {
      const cd = (c.chuyenDe ?? '').trim() || CHUA_GAN_CHUYEN_DE
      const k: KhoaMuc = c.mucDo === 'biet' || c.mucDo === 'hieu' || c.mucDo === 'van_dung' ? c.mucDo : 'chua'
      const h = theoCd.get(cd) ?? { chuyenDe: cd, o: rong(), tong: 0 }
      h.o[k] += 1
      h.tong += 1
      theoCd.set(cd, h)
      cot[k] += 1
      tong += 1
    }
  }
  const hang = [...theoCd.values()].sort((a, b) => Number(a.chuyenDe === CHUA_GAN_CHUYEN_DE) - Number(b.chuyenDe === CHUA_GAN_CHUYEN_DE) || b.tong - a.tong || a.chuyenDe.localeCompare(b.chuyenDe, 'vi'))
  return { hang, cot, tong }
}
