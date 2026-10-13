// CHỈ ĐỌC (Claude 13/10) — đếm lịch kiểm tra riêng theo phiên bản · trạng thái · thời điểm, để lên đường bật lại cờ sau khi gộp đề Hóa 2026.
// Chỉ in số tổng hợp và tên lớp; không in danh tính học sinh, không đọc đề/đáp án. Mọi lệnh phải là SELECT/WITH.
import { query } from './kiem-phat-hanh-chua.mjs'
const now = Date.now()
const doc = (sql) => { if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('Chỉ đọc.'); return query(sql) }
const in1 = (nhan, x) => console.log(nhan, JSON.stringify(x))
in1('co', await doc(`SELECT gia_tri,cap_nhat_luc FROM cau_hinh WHERE khoa='kiem_tra_ca_nhan_v1'`))
in1('nhom', await doc(`SELECT COALESCE(json_extract(km.meta_json,'$.phienBan'),1) pb,k.trang_thai tt,
  CASE WHEN k.han_luc<=${now} THEN 'qua' WHEN k.mo_luc<=${now} THEN 'hom_nay' ELSE 'tuong_lai' END khi,
  (k.nop_luc IS NOT NULL) nop,EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang c WHERE c.bai_id=k.id) bat_dau,k.da_ghi,
  json_extract(km.meta_json,'$.tong') tong,COUNT(*) n,COUNT(DISTINCT k.sbd) em,MIN(k.ngay) tu,MAX(k.ngay) den
  FROM kiem_tra_ca_nhan k LEFT JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id GROUP BY 1,2,3,4,5,6,7 ORDER BY 3,1,2`))
in1('lop', await doc(`SELECT k.lop,k.trang_thai tt,COUNT(*) n FROM kiem_tra_ca_nhan k WHERE k.han_luc>${now} GROUP BY 1,2 ORDER BY 1,2`))
in1('emDuDieuKien', await doc(`SELECT COUNT(*) n FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa'`))
in1('soDoKtcn', await doc(`SELECT COUNT(*) n,COUNT(DISTINCT sbd) em FROM su_kien_hoc WHERE ma_nguon LIKE 'ktcn:%'`))
