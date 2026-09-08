// BIÊN BẢN CŨ VẪN NÓI SAI — VÁ LÚC ĐỌC, KHÔNG SỬA BẢN ĐÃ CẤT.
//
// Biên bản rút câu hỏi lại được cất lúc bấm Bắt đầu. Ba trường sinh ra SAU khi
// mấy ca đầu đã chạy:
//   · `phamVi`   — thầy chốt "ca gần nhất" hay "3 ca ngẫu nhiên",
//   · `tuCaCua`  — mã ca thật sự lấy câu sai của từng em,
//   · lý do `het_cho` — đề không còn chỗ, khác hẳn "ngoài kho".
// Biên bản cất trước đó không có ba thứ ấy, nên màn Ca thi in ra "lấy từ ca —"
// và dán nhãn "câu em từng sai không nằm trong kho ca này" cho những em thật ra
// chỉ hết chỗ trong đề. Thầy đọc và hỏi lại đúng chỗ đó (08/09).
//
// Không đi sửa bản đã cất: bản đã cất là BẰNG CHỨNG của lượt rút, sửa nó là mất
// dấu vết. Vá lúc đọc, và chỉ vá những gì suy ra được CHẮC CHẮN từ dữ liệu máy
// chủ. `tuCaCua` không suy lại được nên để trống — và chỗ hiển thị phải im,
// không in dấu gạch giả vờ là "không lấy từ ca nào".

import type { BienBanDeRieng } from './exam-db'
import type { LyDoThieuLap } from './de-rieng'

export interface NguonVaBienBan {
  /** Phạm vi ghi trên bản ghi CA ở máy chủ. */
  phamViCa?: 'gan_nhat' | 'ba_ca' | null
  /** sbd → qid câu hỏi lại của em, do máy chủ giữ. */
  lapTheoEm?: Record<string, string[]> | null
  /** Mọi qid CÓ TRONG KHO đề của ca. Dùng để phân biệt "ngoài kho" với
   * "hết chỗ": câu nằm trong kho mà vẫn không vào được đề là hết chỗ. */
  qidTrongKho?: Set<string> | null
}

/** Tính lại lý do thiếu câu hỏi lại theo ĐÚNG luật hiện hành (de-rieng.ts).
 * Trả về lý do cũ khi không đủ dữ kiện để kết luận khác. */
export function lyDoDung(cu: string, soLap: number, qids: string[] | null, kho: Set<string> | null): string {
  // Chỉ vá đúng một nhãn: 'ngoai_kho'. Các lý do khác (mới vào lớp, không nộp,
  // ca trước đúng hết, sai ít hơn cần) không phụ thuộc kho nên vẫn đúng.
  if (cu !== 'ngoai_kho') return cu
  if (!qids || !kho) return cu
  const coTrongKho = qids.filter((q) => kho.has(q)).length
  if (soLap < coTrongKho) return 'het_cho' satisfies LyDoThieuLap
  return cu
}

/** Vá một biên bản đọc từ máy. Trả bản MỚI, không đụng bản gốc. */
export function vaBienBanCu(bb: BienBanDeRieng, nguon: NguonVaBienBan): BienBanDeRieng {
  const kho = nguon.qidTrongKho ?? null
  const lap = nguon.lapTheoEm ?? null
  return {
    ...bb,
    phamVi: bb.phamVi ?? nguon.phamViCa ?? undefined,
    thieu: bb.thieu.map((t) => ({ ...t, lyDo: lyDoDung(t.lyDo, t.soLap, lap?.[t.sbd] ?? null, kho) })),
  }
}

/** Có mã ca để in không. Biên bản cũ không có `tuCaCua`; in dấu gạch ở đó là
 * nói dối rằng máy đã tra và không thấy. */
export function maCaLay(bb: BienBanDeRieng, sbd: string): string | null {
  const v = bb.tuCaCua?.[sbd]
  return v ? v : null
}
