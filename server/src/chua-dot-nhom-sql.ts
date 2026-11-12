// ĐỢT CHỮA CỦA MỘT EM CHO «CÂU NÀY HOẶC CÂU CÙNG NHÓM NỘI DUNG» (12/11, hoá đơn D1: ~300 triệu hàng đọc/ngày chỉ riêng mẫu câu này).
// Trước: `sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?))` ⇒ OR khiến SQLite chỉ dùng được cột sbd của chỉ mục
// ⇒ quét MỌI đợt của em (~290 hàng/lượt). Nay tách HAI NHÁNH, mỗi nhánh đi trúng một chỉ mục:
//   · câu  → idx_cld_sbd_qid (sbd, qid_chuan)               (có từ 07/10)
//   · nhóm → idx_cld_sbd_nhom (sbd, content_group, dong_luc) (mới, chỉ-thêm: server/migration-1211-chua-dot-nhom.sql + CHI_MUC_CRON_DEM)
// Nhóm rỗng ⇒ điều kiện hằng `<nhóm><>''` sai, SQLite thoát nhánh trước khi đọc hàng (không quét các đợt nhóm rỗng của em).
// Hai nhánh cùng trúng một đợt ⇒ `rowid IN (…)` tự gộp (không trả trùng). Ngữ nghĩa y hệt câu cũ: tests/chua-dot-nhom-1211.test.ts so cũ↔mới + khoá kế hoạch.

/** Nhóm nội dung của câu `qid` (dòng đầu, như `(SELECT content_group … LIMIT 1)` cũ), bỏ nhóm rỗng ⇒ danh sách 0 hoặc 1 phần tử cho `IN`. */
const nhomCuaCau = (qid: string) => `(SELECT g FROM (SELECT content_group AS g FROM game_v2_question WHERE qid=${qid} LIMIT 1) WHERE g<>'')`

/** `rowid IN (nhánh câu UNION ALL nhánh nhóm)` — thay cho `sbd=… AND (câu OR nhóm) AND dk`. `nhom` phải tự loại nhóm rỗng. */
const rowidDot = (sbd: string, cau: string, nhom: string, dk: string) =>
  `rowid IN (SELECT rowid FROM chua_loi_dot WHERE sbd=${sbd} AND ${cau} AND ${dk} UNION ALL SELECT rowid FROM chua_loi_dot WHERE ${nhom} AND sbd=${sbd} AND ${dk})`

/** Không có đợt nào của em thoả `dk` cho câu/nhóm (hai NOT EXISTS, mỗi cái một chỉ mục). */
const khongCoDot = (sbd: string, qid: string, nhom: string, dk: string) =>
  `NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=${sbd} AND qid_chuan=${qid} AND ${dk}) AND NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE ${nhom}<>'' AND sbd=${sbd} AND content_group=${nhom} AND ${dk})`

/** Đợt CÒN MỞ của em cho câu ?2 hoặc nhóm của câu ?2 (tra game_v2_question), 4 đợt giao sớm nhất. bind(sbd, qid). */
export const SQL_DOT_MO_THEO_CAU = `SELECT id,revision FROM chua_loi_dot WHERE ${rowidDot('?1', 'qid_chuan=?2', `content_group IN ${nhomCuaCau('?2')}`, 'dong_luc IS NULL')} ORDER BY giao_luc ASC,id ASC LIMIT 4`

/** Đợt CÒN MỞ giao sớm nhất của em cho câu ?2 hoặc nhóm ?3. bind(sbd, qid, nhóm). */
export const sqlDotMoDau = (cot: string) =>
  `SELECT ${cot} FROM chua_loi_dot WHERE ${rowidDot('?1', 'qid_chuan=?2', "?3<>'' AND content_group=?3", 'dong_luc IS NULL')} ORDER BY giao_luc ASC,id ASC LIMIT 1`

const COT_THEM = 'id,sbd,qid_chuan,content_group,cohort_id,nguon_sai,phien_ban_cau,mo_luc,sai_cuoi_luc,trang_thai_day,ly_do_thieu,policy_snapshot,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc'
const GIA_TRI_THEM = Array.from({ length: 16 }, (_, i) => `?${i + 1}`).join(',')
/** Thêm đợt khi em chưa có đợt MỞ cho câu/nhóm. bind(16 giá trị cột, sbd, qid, nhóm) — y thứ tự bind cũ. */
export const SQL_THEM_DOT = `INSERT OR IGNORE INTO chua_loi_dot(${COT_THEM})
    SELECT ${GIA_TRI_THEM} WHERE ${khongCoDot('?17', '?18', '?19', 'dong_luc IS NULL')}`
/** Mở lại sau khi đã đóng: chưa có đợt mở, cũng chưa đợt nào đóng từ mốc ?20 trở đi. bind(16 giá trị cột, sbd, qid, nhóm, mốc) — y thứ tự bind cũ. */
export const SQL_THEM_DOT_MO_LAI = `INSERT OR IGNORE INTO chua_loi_dot(${COT_THEM})
    SELECT ${GIA_TRI_THEM} WHERE ${khongCoDot('?17', '?18', '?19', '(dong_luc IS NULL OR dong_luc>=?20)')}`

/** Hỏi thầy đồng bộ sửa (hoi-thay-dong-bo-sua.ts): đợt MỞ của em ?1 cho các câu trong CTE `roots` hoặc nhóm của câu ?2. Cần `${ROOTS}` phía trước. */
export const DOT_MO_EM_ROOTS = rowidDot('?1', 'qid_chuan IN(SELECT qid FROM roots)', `content_group IN ${nhomCuaCau('?2')}`, 'dong_luc IS NULL')
