// Đọc nhẹ lịch kiểm cho Tự sửa lỗi, kể cả câu chưa có chua_loi_dot.
// Gắn statement này vào batch danh sách đang có; không gọi từng câu, không phát lời giải/đáp án.
// ?1 = SBD đã xác thực, ?2 = giờ máy chủ ms.
export const SQL_LICH_KIEM_HOI_THAY = `SELECT DISTINCT k.qid_goc qid,
  COALESCE(json_extract(q.json,'$.tenDang'),'') ten,
  COALESCE(json_extract(q.json,'$.phan'),'') phan,
  CASE WHEN k.trang_thai='dang_lam' THEN 'dang_lam'
       WHEN k.den_han<=?2 THEN 'den_han' ELSE 'cho_kiem_lai' END trangThai,
  k.den_han denHan
  FROM hoi_thay_kiem k
  JOIN game_v2_question q ON q.qid=k.qid_goc AND q.version=k.version_goc AND q.content_group=k.nhom_goc
  JOIN de_kho d ON d.ma_de=q.ma_de AND COALESCE(d.da_xoa,0)=0
  JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc
  WHERE k.sbd=?1 AND json_extract(q.json,'$.reviewed')=1
    AND NOT EXISTS(SELECT 1 FROM chua_loi_dot d WHERE d.sbd=k.sbd AND d.dong_luc IS NULL
      AND d.trang_thai_day<>'da_tu_sua' AND (d.qid_chuan=k.qid_goc OR (d.content_group<>'' AND d.content_group=k.nhom_goc)))
    AND ((k.trang_thai='dang_lam' AND k.het_han_luc>?2) OR (k.trang_thai='da_nop' AND k.den_han IS NOT NULL))
    AND NOT EXISTS(SELECT 1 FROM hoi_thay_kiem n WHERE n.sbd=k.sbd AND n.qid_goc=k.qid_goc
      AND ((n.trang_thai='da_nop' AND (n.phat_luc>k.phat_luc OR (n.phat_luc=k.phat_luc AND n.id>k.id)))
        OR (k.trang_thai<>'dang_lam' AND n.trang_thai='dang_lam' AND n.het_han_luc>?2)))
  ORDER BY CASE WHEN k.trang_thai='dang_lam' THEN 0 WHEN k.den_han<=?2 THEN 1 ELSE 2 END,k.den_han,k.qid_goc
  LIMIT 12`

export function lichKiemHoiThayCongKhai(rows: readonly Record<string, unknown>[]) {
  return rows.map(r => ({
    qid: String(r.qid ?? ''), ten: String(r.ten ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 100),
    phan: r.phan === 'I' || r.phan === 'II' || r.phan === 'III' ? r.phan : '',
    trangThai: r.trangThai === 'dang_lam' || r.trangThai === 'den_han' ? r.trangThai : 'cho_kiem_lai',
    ...(r.denHan != null && Number.isFinite(Number(r.denHan)) ? { denHan: new Date(Number(r.denHan)).toISOString() } : {}),
  })).filter(r => r.qid)
}
