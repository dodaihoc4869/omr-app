// Câu chọn em cho bước kiểm chỉ đọc «ba hành trình» (kiem-dong-co-hanh-trinh-song.ts, chạy ở mỗi lần phát hành).
// 12/11 (đo D1 thật 24h: 258 lượt × 543.881 dòng = 140 triệu dòng): câu cũ ĐẾM MỌI sự kiện học của MỌI em mỗi lượt, và bung danh sách em của
// từng chiến dịch lại cho TỪNG em. Nay: (1) danh sách em ba hành trình bung MỘT lần (IN … json_each, không nhân dòng khi sbd lặp);
// (2) chỉ đếm `?1` sự kiện MỚI NHẤT của cả sổ (theo rowid) ⇒ chọn em học NHIỀU NHẤT GẦN ĐÂY (đọc tối đa ?1 dòng sổ thay vì cả sổ).
// ?1 = -1 (không giới hạn, LIMIT -1 của SQLite) cho kết quả Y HỆT câu cũ — tests/goi7-em-nhan-it-dong-1211.test.ts khoá điều đó.
// Đây là đổi NGỮ NGHĨA DUY NHẤT của nhóm: em được kiểm là em nặng nhất gần đây thay vì nặng nhất mọi thời — mục đích bước kiểm (chạy động cơ trên một em
// có lịch sử lớn) giữ nguyên; số `lichSuLonNhat` vẫn là TỔNG lịch sử của em được chọn (SQL_LICH_SU_EM).
export const SO_SU_KIEN_GAN_KIEM = 5000
export const SQL_CHON_EM_KIEM = `SELECT h.sbd,COUNT(s.khoa) n FROM hoc_sinh h
  LEFT JOIN (SELECT sbd,khoa FROM su_kien_hoc ORDER BY rowid DESC LIMIT ?1) s ON s.sbd=h.sbd
  WHERE COALESCE(h.trang_thai,'')<>'khoa'
    AND h.sbd IN (SELECT j.value FROM chien_dich c,json_each(c.sbd_json) j WHERE c.id LIKE 'hanh-trinh-v3-khoi-%' AND c.trang_thai='dang_chay')
  GROUP BY h.sbd ORDER BY n DESC,h.sbd LIMIT 1`
/** Tổng số sự kiện học của MỘT em (chỉ mục theo sbd). */
export const SQL_LICH_SU_EM = `SELECT COUNT(khoa) n FROM su_kien_hoc WHERE sbd=?1`
