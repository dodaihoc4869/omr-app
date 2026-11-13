// NHƯỜNG SUẤT CHO CÂU DỞ (13/11 — thầy 12/11 «làm luôn 5 em còn lại»: soi ngày Sửa 11/11, 5 em đề thiếu câu trả lời ngắn mà không có câu làm lại / tự luyện).
// Số đo: cả 5 em được giao 30 câu (không phải 28). Phiên chặng đầu 6 câu mở trước; gói cả ngày (goi-ngay.ts → xayGoiNgay7) lập lại đề 28 khi em mới làm một
// phần chặng ấy — câu ĐÃ làm chiếm suất, còn câu ĐÃ GIAO CHƯA LÀM thì không ⇒ ngày Sửa (câu vừa sai thành nguồn mới) đề lập lại chọn câu khác, câu dở của phiên
// cũ thành câu dư (được giao trước), câu trả lời ngắn xếp cuối đề (O_28 phần I → III) bị đẩy quá câu thứ 28.
// Nay: mỗi câu dở KHÔNG có trong đề mới chiếm chỗ một câu của đề mới CÙNG Ô (phần × mức), không có thì CÙNG PHẦN — bỏ câu ưu tiên thấp nhất (cuối danh sách)
// của ô / phần ấy. Không cùng phần ⇒ không bỏ gì (không bao giờ lấy suất của phần khác). Thuần CPU, tất định.

import { oMaTran } from './ma-tran-rut-moi'
import { tachSongSinh } from './loi-hoc-luat'
import { NGAY_DE_28 } from './rut-28'
import { ngayVn7 } from './goi-bai-7-loi'

/** Trả đề mới đã nhường suất cho các câu dở (giữ thứ tự). `oCua(qid)` = ô `phần|mức` (ma-tran-rut-moi.ts `oMaTran`). */
export function nhuongSuatChoCauDo<T extends { qid: string }>(cauDo: readonly { qid: string }[], deMoi: readonly T[], oCua: (qid: string) => string): T[] {
  if (!cauDo.length || !deMoi.length) return [...deMoi]
  const trongDe = new Set(deMoi.map((v) => v.qid)), laDo = new Set(cauDo.map((v) => v.qid))
  const o = deMoi.map((v) => oCua(v.qid))
  const bo = new Set<number>()
  const timCuoi = (khop: (i: number) => boolean): number => { for (let i = deMoi.length - 1; i >= 0; i--) if (!bo.has(i) && !laDo.has(deMoi[i]!.qid) && khop(i)) return i; return -1 }
  for (const v of cauDo) {
    if (trongDe.has(v.qid)) continue
    const oDo = oCua(v.qid), phan = oDo.split('|')[0]
    let j = timCuoi((i) => o[i] === oDo)
    if (j < 0) j = timCuoi((i) => o[i]!.split('|')[0] === phan)
    if (j >= 0) bo.add(j)
  }
  return deMoi.filter((_, i) => !bo.has(i))
}

/** Nối dây cho goi-bai-7.ts (gói cả ngày + lượt mở chặng): câu ĐÃ GIAO CHƯA LÀM của phiên đang mở (`cauDo`, giao trước) chiếm suất đề 28 ⇒ đề mới bỏ câu
 *  cùng ô / cùng phần, tổng ngày vẫn 28. Trước NGAY_DE_28 giữ nguyên. */
export function deNhuongSuat7<T extends { qid: string }>(lap: { hs: { meta: ReadonlyMap<string, { phan?: string | null; mucDo?: string | null }> } }, cauGoi: ReadonlyMap<string, { phan?: string | null; mucDo?: string | null }>, cauDo: readonly { qid: string }[], deMoi: readonly T[], now: number): T[] {
  if (ngayVn7(now) < NGAY_DE_28 || !cauDo.length) return [...deMoi]
  const meta = (q: string) => lap.hs.meta.get(q) ?? cauGoi.get(q)
  const oCua = (q: string) => { const m = meta(q) ?? meta(tachSongSinh(q).goc); return oMaTran(m?.phan, m?.mucDo) }
  return nhuongSuatChoCauDo(cauDo, deMoi, oCua)
}
