// OMNI 3 — MA TRẬN Q: A.I Đỗ Đại Học GỢI vi kỹ năng cho câu từ nhãn sẵn có của kho (kienThuc[], nhãn nền từng bước); lùi về một vi kỹ năng = dạng. LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" hoàn thiện + test. Đặc tả mục 4.1 (ma trận Q) + 8.
import type { Phan, QCau, Vkn } from './omni-kieu'

/** Vi kỹ năng mặc định của một dạng (khi chưa có nhãn): `dang:<ma_dang>`; không có dạng ⇒ `cd:<chuyên đề>`; không có gì ⇒ `cau:<qid>`. */
export function vknMacDinh(maDang: string | null | undefined, chuyenDe?: string | null, qid?: string): string {
  if (maDang) return `dang:${maDang}`
  if (chuyenDe) return `cd:${chuyenDe}`
  return `cau:${qid ?? ''}`
}
export function qMacDinh(qid: string, phan: Phan, maDang: string | null, mucDo: string | null, chuyenDe?: string | null): QCau {
  return { qid, phan, maDang, mucDo, vkn: [vknMacDinh(maDang, chuyenDe, qid)], nguon: 'mac_dinh' }
}
/**
 * Gợi Q cho một câu: ánh xạ `kienThuc[]` và nhãn nền từng bước (`nhan_nen`) sang vi kỹ năng của dạng (`vknDang`, khớp theo tên/nhãn đã chuẩn hoá
 * bỏ dấu, viết thường); không khớp gì ⇒ qMacDinh. Phần II: mỗi ý dùng kienThuc riêng của ý nếu kho có (`kienThucY`), không thì dùng vkn của câu.
 */
export function goiYQ(cau: { qid: string; phan: Phan; maDang: string | null; mucDo: string | null; chuyenDe?: string | null; kienThuc?: readonly string[]; kienThucY?: readonly (readonly string[])[]; nhanNen?: readonly { buoc: number; nen: string }[] }, vknDang: readonly Vkn[]): QCau {
  void vknDang
  return qMacDinh(cau.qid, cau.phan, cau.maDang, cau.mucDo, cau.chuyenDe)
}
