// KIỂM TRA ÔN TẬP THEO CHU KỲ BÀI (khối B — thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, đặc tả mục 0 điểm 1: «lịch hằng tuần chuyển sang theo chu kỳ
// bài, không chạy cả hai»; 10/11 «Bỏ codex tự làm lại ko chờ gì cả»). Thay luật «lần trước + 7 ngày» trong `lapKtCn` (kiem-tra-ca-nhan.ts) cho em ĐANG CÓ gói:
//  · mỗi gói bài MỘT ngày Kiểm tra ôn tập: em đã gặp hết câu mới của gói ⇒ ngày mai; chưa hết ⇒ muộn nhất 2 ngày trước hạn chung của gói (`goi_bai_7_em.han`);
//  · 3 tháng cuối trước kỳ thi (từ 22/03/2027) mỗi gói HAI ngày — lần hai muộn nhất 1 ngày trước hạn;
//  · lịch chỉ dựng khi ngày ấy còn ≤ 2 ngày (em làm hết câu mới sớm ⇒ lượt cron kế dựng ngày mai, không giữ chỗ ngày hạn − 2 quá sớm);
//  · gói đã có lịch (mã gói ghi trong `json.goiId` của lịch) không dựng lần nữa; em có gói mà mọi gói đã đủ ⇒ KHÔNG lịch tuần; em không có gói ⇒ lịch tuần như cũ.
// Lịch đã lập / bài đã nộp giữ nguyên (lapKtCn trả lịch đã có trước khi tới luật này). Thuần CPU; dữ liệu gói đọc CÙNG câu đọc hạn bài sẵn có.
import { congNgayKt } from './kiem-tra-ca-nhan-loi'

export const MOC_HAI_KT_MOI_BAI = '2027-03-22'
export interface GoiKt { id: string; han: string; conMoi: number; daKt: number }
export type QuyetKtBai = { ngay: string; goiId: string } | { cho: true } | null

/** null ⇒ em không có gói (giữ lịch tuần cũ); { cho } ⇒ có gói nhưng chưa tới lúc / đã đủ (không dựng lịch); { ngay, goiId } ⇒ dựng lịch ngày ấy cho gói ấy. */
export function ngayKtTheoBai(homNay: string, goi: readonly GoiKt[]): QuyetKtBai {
  if (!goi.length) return null
  const can = homNay >= MOC_HAI_KT_MOI_BAI ? 2 : 1
  const g = goi.filter((x) => x.id && x.han && x.daKt < can).sort((a, b) => a.han.localeCompare(b.han) || a.id.localeCompare(b.id))[0]
  if (!g) return { cho: true }
  const mai = congNgayKt(homNay, 1)
  let ngay = g.daKt >= 1 ? congNgayKt(g.han, -1) : g.conMoi <= 0 ? mai : congNgayKt(g.han, -2)
  if (ngay < mai) ngay = mai
  return ngay > congNgayKt(homNay, 2) ? { cho: true } : { ngay, goiId: g.id }
}
