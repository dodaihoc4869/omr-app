// Câu SQL ảnh chụp đêm omni_p_vkn (13/11, tách khỏi omni-d1.ts — cổng cỡ tệp): chỉ ghi nhãn ĐỔI SỐ, xoá đúng nhãn rời hồ sơ.
/** 13/11: xoá nhãn của em không còn trong hồ sơ mới (?1 sbd, ?2 JSON mã nhãn). */
export const SQL_XOA_NHAN_ROI = 'DELETE FROM omni_p_vkn WHERE sbd = ?1 AND vkn_id NOT IN (SELECT value FROM json_each(?2))'
/** 13/11: chèn / sửa điểm nhãn CHỈ KHI ĐỔI SỐ (?1 sbd, ?2 JSON [vkn_id, p, n_tu_lam, n_cau, n_ngay, n_troi_chay, n_cau_la_dung, diem_sprt, trang_thai, day_lai], ?3 phiên bản, ?4 mốc). */
export const SQL_GHI_NHAN_DOI = `INSERT INTO omni_p_vkn (sbd, vkn_id, p, n_tu_lam, n_cau, n_ngay, n_troi_chay, n_cau_la_dung, diem_sprt, trang_thai, day_lai, phien_ban, cap_nhat_luc)
  SELECT ?1, json_extract(value,'$[0]'), json_extract(value,'$[1]'), json_extract(value,'$[2]'), json_extract(value,'$[3]'), json_extract(value,'$[4]'), json_extract(value,'$[5]'),
    json_extract(value,'$[6]'), json_extract(value,'$[7]'), json_extract(value,'$[8]'), json_extract(value,'$[9]'), ?3, ?4 FROM json_each(?2) WHERE 1
  ON CONFLICT(sbd, vkn_id) DO UPDATE SET p = excluded.p, n_tu_lam = excluded.n_tu_lam, n_cau = excluded.n_cau, n_ngay = excluded.n_ngay, n_troi_chay = excluded.n_troi_chay,
    n_cau_la_dung = excluded.n_cau_la_dung, diem_sprt = excluded.diem_sprt, trang_thai = excluded.trang_thai, day_lai = excluded.day_lai, phien_ban = excluded.phien_ban, cap_nhat_luc = excluded.cap_nhat_luc
  WHERE p IS NOT excluded.p OR n_tu_lam IS NOT excluded.n_tu_lam OR n_cau IS NOT excluded.n_cau OR n_ngay IS NOT excluded.n_ngay OR n_troi_chay IS NOT excluded.n_troi_chay
    OR n_cau_la_dung IS NOT excluded.n_cau_la_dung OR diem_sprt IS NOT excluded.diem_sprt OR trang_thai IS NOT excluded.trang_thai OR day_lai IS NOT excluded.day_lai OR phien_ban IS NOT excluded.phien_ban`
