/** Một nguồn quyền nhận câu mới: override gói×SBD trước, lựa chọn khi tick sau, tick cũ mặc định cả lớp. */
export function sqlQuyetDinhNhan7(goi: string, sbd: string): string {
  return `COALESCE((SELECT x.nhan FROM goi_bai_7_chon_em x WHERE x.goi_id=${goi}.id AND x.sbd=${sbd}),
    CASE WHEN EXISTS(SELECT 1 FROM goi_bai_7_tick_em t WHERE t.tick_id=${goi}.tick_id)
    THEN EXISTS(SELECT 1 FROM goi_bai_7_tick_em t,json_each(t.sbd_json) j WHERE t.tick_id=${goi}.tick_id AND j.value=${sbd}) ELSE 1 END)=1`
}

/** Đã JOIN lớp hiệu lực và tick còn hoạt động ở nơi gọi; không sửa lịch sử của em khóa/chuyển lớp. */
export const sqlEmDangNhan7 = (em: string, goi: string, hs: string) =>
  `COALESCE(${hs}.trang_thai,'') NOT IN ('khoa', 'da_nghi') AND ${sqlQuyetDinhNhan7(goi, `${em}.sbd`)}`

/**
 * BẢN DÙNG CHO CÂU QUÉT NHIỀU EM (12/11, đo D1 thật 24h: câu danh sách Gói 7 đọc ~28 nghìn dòng/lượt × ~4.000 lượt/ngày — gần hết là `json_each`
 * của danh sách tick chạy lại cho TỪNG dòng gói×em). Bảng phụ `te7` bung danh sách em được chọn của MỌI tick CÒN HOẠT ĐỘNG đúng MỘT lần mỗi câu
 * (MATERIALIZED — bắt buộc: CTE dùng một lần sẽ bị gộp vào câu ngoài ⇒ `json_each` lại chạy theo từng dòng), dò bằng chỉ mục tự động (tick_id, sbd).
 * Ngữ nghĩa Y HỆT `sqlQuyetDinhNhan7`: cùng thứ tự ưu tiên chọn riêng → danh sách tick → mặc định cả lớp; cùng phép so `j.value = sbd`; EXISTS trả 0/1
 * (không JOIN ⇒ sbd lặp trong danh sách không nhân dòng). CHỈ dùng khi câu ngoài đã JOIN `bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL`
 * (te7 chỉ chứa tick còn hoạt động). Câu dùng: `WITH ${SQL_TE7} SELECT …` (đứng đầu danh sách WITH).
 */
export const SQL_TE7 = `te7 AS MATERIALIZED (SELECT DISTINCT t.tick_id AS tick_id, j.value AS sbd FROM bai_da_day tb JOIN goi_bai_7_tick_em t ON t.tick_id=tb.id, json_each(t.sbd_json) j WHERE tb.bo_tick_luc IS NULL)`
export function sqlQuyetDinhNhan7Te(goi: string, sbd: string): string {
  return `COALESCE((SELECT x.nhan FROM goi_bai_7_chon_em x WHERE x.goi_id=${goi}.id AND x.sbd=${sbd}),
    CASE WHEN EXISTS(SELECT 1 FROM goi_bai_7_tick_em t WHERE t.tick_id=${goi}.tick_id)
    THEN EXISTS(SELECT 1 FROM te7 WHERE te7.tick_id=${goi}.tick_id AND te7.sbd=${sbd}) ELSE 1 END)=1`
}
export const sqlEmDangNhan7Te = (em: string, goi: string, hs: string) =>
  `COALESCE(${hs}.trang_thai,'') NOT IN ('khoa', 'da_nghi') AND ${sqlQuyetDinhNhan7Te(goi, `${em}.sbd`)}`
/**
 * Thêm em mới chuyển/đăng ký lớp vào gói còn hoạt động (goi-bai-7.ts dongBoThat7, mỗi phút). 12/11 (đo D1 thật ~27 nghìn dòng/lượt): cặp (gói, em) ĐÃ có
 * dòng ⇒ bỏ bằng MỘT lần dò khoá chính TRƯỚC quyền nhận; danh sách tick bung một lần (te7). INSERT OR IGNORE vốn bỏ cặp đã có ⇒ bảng sau lệnh y hệt câu cũ
 * (tests/goi7-em-nhan-it-dong-1211.test.ts). `tenLop` = sqlTenLopHs('h'), `khongCa` = điều kiện không có ca mở.
 */
export const sqlThemEmGoi7 = (tenLop: string, khongCa: string) => `INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han)
    WITH ${SQL_TE7} SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON ${tenLop}=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
    WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_em e WHERE e.goi_id=g.id AND e.sbd=h.sbd) AND ${sqlQuyetDinhNhan7Te('g','h.sbd')} AND ${khongCa}`

/** Khóa ghi tính sẵn/cấp phiên từ ảnh đọc trước: chỉ cần một gói ngừng nhận thì không ghi bản kế hoạch cũ. */
export function sqlCacGoiConNhan7(ids: string, sbd: string, tenLop: string): string {
  return `NOT EXISTS(SELECT 1 FROM json_each(${ids}) j LEFT JOIN goi_bai_7 g ON g.id=j.value
    LEFT JOIN goi_bai_7_em e ON e.goi_id=g.id AND e.sbd=${sbd}
    LEFT JOIN hoc_sinh h ON h.sbd=e.sbd AND ${tenLop}=g.lop
    LEFT JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
    WHERE g.id IS NULL OR e.sbd IS NULL OR h.sbd IS NULL OR b.id IS NULL OR NOT (${sqlEmDangNhan7('e','g','h')}))`
}
