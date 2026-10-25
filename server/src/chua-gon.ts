// CHỮA CÂU GỌN (thầy 25/10: "đề xuất lại việc chữa câu đơn giản và hiệu quả nhất… để học sinh thấy được ghi nhận ngay khi sửa xong" → "BẠN SỬA THEO ĐỀ XUẤT LUÔN").
// Đặc tả: docs/de-xuat-chua-cau-gon-2510.md. Tệp này giữ MỌI luật mới của đường gọn; chỗ cũ chỉ móc một dòng.
//
// LUẬT TỰ LÀM (một luật cho mọi đường — màn sửa câu lẫn game / luyện tập): lượt ĐÚNG chỉ tính "Đã tự sửa" khi đủ cả hai:
//   (a) không gợi ý (assistance none) và không có dấu đọc lời giải câu ấy (`loi_giai_hoi`, dòng sổ `xem_loi_giai`) trong 12 giờ trước lúc nộp;
//   (b) làm BẢN KHÁC (qid "<Q>~…" / "<Q>#…"), HOẶC làm câu gốc ở NGÀY KHÁC ngày sai cuối.
// (b) cần vì game hiện lời giải ngay sau câu sai mà chỉ lượt gọi 7 ghi `loi_giai_hoi` (game-v2.ts) ⇒ không dựa riêng vào (a) được.
//
// ĐÓNG ĐỢT EM ĐÃ LÀM ĐÚNG LẠI (đo 25/10: 2 013 đợt mở 14 ngày có lượt đúng lại câu gốc sau lần sai mà vẫn ghi "Cần sửa"): khi em mở danh sách Tự sửa lỗi,
// câu UPDATE dưới đây chạy ĐẦU lô đọc sẵn có của `danhSach` (cùng một đợt D1, không thêm vòng chờ) và đóng đợt của CHÍNH em theo luật tự làm, so với lần SAI
// CUỐI trong sổ (không so `sai_cuoi_luc`: cột ấy chốt theo cửa sổ đo). Mỗi dòng khoá `dong_luc IS NULL` (đóng một lần). Không đụng em khác, không đụng đợt cũ hơn 14 ngày.
// Giới hạn đã biết: lượt làm trên CÂU ANH EM (qid khác, `raw_json.tc` = Q) không xét — xét `tc` phải quét cả sổ của em (json_extract, không chỉ mục).

/** Cửa sổ đường gọn: chỉ đợt sai trong 14 ngày vào ngày của em / được đóng tự động. */
export const NGAY_CUA_SO_GON = 14
/** Mốc 12 giờ của luật tự làm (a). */
export const GIO_LOI_GIAI_GAN = 12

/** Họ câu trong sổ: câu gốc `q` và mọi bản của nó (~ss/~bt/~yd/~n, #n). Ba khoảng trên chỉ mục (sbd, qid). */
export const sqlHoCau = (cot: string, q: string) =>
  `(${cot}=${q} OR (${cot}>${q}||'~' AND ${cot}<${q}||'~~') OR (${cot}>${q}||'#' AND ${cot}<${q}||'#~'))`

/** Lượt làm thật của em (như SQL_LA_LAN_LAM), không gợi ý, không bị giấu. */
const laLanTuLam = (a: string) =>
  `COALESCE(${a}.purpose,'') NOT IN ('xem_loi_giai','luot','chan_doan','chua_buoc') AND COALESCE(${a}.assistance,'none') IN ('none','') AND COALESCE(${a}.visibility,'released')<>'embargoed'`

/**
 * Điều kiện SQL "đợt `d` đã có lượt đúng qua luật tự làm sau lần sai cuối" (d = alias bảng chua_loi_dot; ?2 = sbd).
 * Dùng chung cho câu đóng tự động (danh sách) và test.
 */
export function sqlDaTuSuaDungLai(d: string): string {
  const Q = `${d}.qid_chuan`
  const saiCuoi = (cot: 'luc' | 'ngay_vn') =>
    `(SELECT w.${cot} FROM su_kien_hoc w WHERE w.sbd=?2 AND ${sqlHoCau('w.qid', Q)} AND COALESCE(w.ket_qua,0)=0 AND ${laLanTuLam('w')} ORDER BY w.luc DESC LIMIT 1)`
  return `EXISTS (SELECT 1 FROM su_kien_hoc c WHERE c.sbd=?2 AND ${sqlHoCau('c.qid', Q)} AND c.ket_qua=1 AND ${laLanTuLam('c')}
    AND c.luc > ${saiCuoi('luc')}
    AND (c.qid<>${Q} OR c.ngay_vn > ${saiCuoi('ngay_vn')})
    AND NOT EXISTS (SELECT 1 FROM loi_giai_hoi g WHERE g.sbd=?2 AND ${sqlHoCau('g.qid', Q)} AND g.luc<=c.luc AND g.luc>=strftime('%Y-%m-%dT%H:%M:%fZ',c.luc,'-${GIO_LOI_GIAI_GAN} hours'))
    AND NOT EXISTS (SELECT 1 FROM su_kien_hoc x WHERE x.sbd=?2 AND ${sqlHoCau('x.qid', Q)} AND x.purpose='xem_loi_giai' AND x.luc<=c.luc AND x.luc>=strftime('%Y-%m-%dT%H:%M:%fZ',c.luc,'-${GIO_LOI_GIAI_GAN} hours')))`
}

/** Câu đóng tự động: ?1 = bây giờ (ms), ?2 = sbd, ?3 = mốc đầu cửa sổ (ms). */
export const SQL_DONG_DA_DUNG_LAI = `UPDATE chua_loi_dot SET trang_thai_day='da_tu_sua',dong_luc=?1,revision=revision+1,cap_nhat_luc=?1
  WHERE sbd=?2 AND dong_luc IS NULL AND trang_thai_day<>'da_tu_sua' AND COALESCE(sai_cuoi_luc,mo_luc)>=?3 AND ${sqlDaTuSuaDungLai('chua_loi_dot')}`


/** Câu đóng tự động tốn ~0,2 giây với em nhiều đợt nhất (đo D1 thật 25/10, run 40177260871: 86 đợt mở, 222 ms) ⇒ mỗi em tối đa MỘT lần / 10 phút
 *  trên mỗi isolate (Hôm nay và Tự sửa lỗi cùng gọi danh sách). Câu em sửa ngay trong app đã được đóng lúc nộp (gon-nop), không chờ câu này. */
export const PHUT_GIAN_CACH_DONG = 10
const lanDong = new Map<string, number>()
export function denLuotDong(sbd: string, nowMs: number): boolean {
  const truoc = lanDong.get(sbd)
  if (truoc !== undefined && nowMs - truoc < PHUT_GIAN_CACH_DONG * 60_000) return false
  lanDong.set(sbd, nowMs)
  if (lanDong.size > 4000) for (const k of lanDong.keys()) { lanDong.delete(k); if (lanDong.size <= 3000) break }
  return true
}
/** Xoá bộ nhớ lượt đóng (test). */
export const xoaLuotDong = () => lanDong.clear()
