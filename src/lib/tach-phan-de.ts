// TÁCH MỘT MÃ ĐỀ THÀNH BA MÃ THEO PHẦN.
//
// Vì sao: một bài trong kho là 90–190 câu gộp cả ba phần. Thầy muốn mở ca chỉ
// gồm trắc nghiệm, hoặc chỉ đúng sai, hoặc chỉ trả lời ngắn — trước đây phải
// chọn cả mã rồi vào màn Rút đề đặt hai phần kia về 0, ba thao tác cho một
// việc lẽ ra một chạm.
//
// TÁCH Ở TẦNG HIỂN THỊ, KHÔNG TÁCH TRONG KHO. `id` của từng câu giữ NGUYÊN,
// nên mọi thứ dựa vào id vẫn đúng y như cũ: chấm bài, `locNguonTheoId`,
// `qidDaRaTuCacCa`, bảng chi tiết từng câu, lịch sử ca đã mở. Chỉ `maDe` mang
// thêm hậu tố để thầy phân biệt trên màn chọn. Tách trong kho thì phải đẩy lại
// toàn bộ 8 tệp và mọi ca cũ mất dấu vết đề gốc — không đáng.
import type { TeacherExamSource } from '../data/examContent'

export type PhanDe = 'I' | 'II' | 'III'

export const PHAN_DE_TACH: PhanDe[] = ['I', 'II', 'III']

/** Hậu tố gắn vào mã đề gốc. Viết tắt quen tay của thầy, không dùng số La Mã
 * (mã đề đã có số, thêm I/II/III nữa là đọc nhầm). */
export const HAU_TO_PHAN: Record<PhanDe, string> = { I: 'TN', II: 'DS', III: 'TLN' }

export const TEN_PHAN_TACH: Record<PhanDe, string> = {
  I: 'Trắc nghiệm',
  II: 'Đúng sai',
  III: 'Trả lời ngắn',
}

export function maDeTheoPhan(maDe: string, phan: PhanDe): string {
  return `${maDe}-${HAU_TO_PHAN[phan]}`
}

/** Từ mã đã tách suy ngược ra mã gốc và phần. Mã không mang hậu tố thì
 * `phan = null` — dùng để đọc lại các ca mở trước khi có tính năng này. */
export function goMaDeTachRa(maDe: string): { goc: string; phan: PhanDe | null } {
  for (const p of PHAN_DE_TACH) {
    const duoi = `-${HAU_TO_PHAN[p]}`
    if (maDe.endsWith(duoi)) return { goc: maDe.slice(0, -duoi.length), phan: p }
  }
  return { goc: maDe, phan: null }
}

function chiPhan(s: TeacherExamSource, phan: PhanDe): TeacherExamSource {
  return {
    ...s,
    maDe: maDeTheoPhan(s.maDe, phan),
    phanI: phan === 'I' ? s.phanI : [],
    phanII: phan === 'II' ? s.phanII : [],
    phanIII: phan === 'III' ? s.phanIII : [],
  }
}

/** Ba mã con của một đề. Phần rỗng thì KHÔNG sinh mã — thầy không phải nhìn
 * "12-C1-B2-TLN · 0 câu" rồi chọn nhầm. */
export function tachTheoPhan(s: TeacherExamSource): TeacherExamSource[] {
  const ra: TeacherExamSource[] = []
  for (const p of PHAN_DE_TACH) {
    const n = p === 'I' ? s.phanI.length : p === 'II' ? s.phanII.length : s.phanIII.length
    if (n > 0) ra.push(chiPhan(s, p))
  }
  return ra
}

/** Cả kho, đã tách. Giữ nguyên thứ tự đề gốc, trong mỗi đề là I → II → III. */
export function tachNhieuTheoPhan(ds: TeacherExamSource[]): TeacherExamSource[] {
  return ds.flatMap(tachTheoPhan)
}
