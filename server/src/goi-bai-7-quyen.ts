/** Một nguồn quyền nhận câu mới: override gói×SBD trước, lựa chọn khi tick sau, tick cũ mặc định cả lớp. */
export function sqlQuyetDinhNhan7(goi: string, sbd: string): string {
  return `COALESCE((SELECT x.nhan FROM goi_bai_7_chon_em x WHERE x.goi_id=${goi}.id AND x.sbd=${sbd}),
    CASE WHEN EXISTS(SELECT 1 FROM goi_bai_7_tick_em t WHERE t.tick_id=${goi}.tick_id)
    THEN EXISTS(SELECT 1 FROM goi_bai_7_tick_em t,json_each(t.sbd_json) j WHERE t.tick_id=${goi}.tick_id AND j.value=${sbd}) ELSE 1 END)=1`
}

/** Đã JOIN lớp hiệu lực và tick còn hoạt động ở nơi gọi; không sửa lịch sử của em khóa/chuyển lớp. */
export const sqlEmDangNhan7 = (em: string, goi: string, hs: string) =>
  `COALESCE(${hs}.trang_thai,'')<>'khoa' AND ${sqlQuyetDinhNhan7(goi, `${em}.sbd`)}`

/** Khóa ghi tính sẵn/cấp phiên từ ảnh đọc trước: chỉ cần một gói ngừng nhận thì không ghi bản kế hoạch cũ. */
export function sqlCacGoiConNhan7(ids: string, sbd: string, tenLop: string): string {
  return `NOT EXISTS(SELECT 1 FROM json_each(${ids}) j LEFT JOIN goi_bai_7 g ON g.id=j.value
    LEFT JOIN goi_bai_7_em e ON e.goi_id=g.id AND e.sbd=${sbd}
    LEFT JOIN hoc_sinh h ON h.sbd=e.sbd AND ${tenLop}=g.lop
    LEFT JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
    WHERE g.id IS NULL OR e.sbd IS NULL OR h.sbd IS NULL OR b.id IS NULL OR NOT (${sqlEmDangNhan7('e','g','h')}))`
}
