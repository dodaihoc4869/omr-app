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
// Khối 12 thiếu nguồn đã duyệt cho kỹ năng nền "dùng giá trị trung bình" (mô phỏng của Codex 52/53): tờ nào có câu gắn kỹ năng này, đã duyệt chưa.
in1('giaTriTrungBinh', await doc(`SELECT q.ma_de,COALESCE(json_extract(q.json,'$.reviewed'),0) duyet,COUNT(*) n FROM omni_q o JOIN game_v2_question q ON q.qid=o.qid
  WHERE o.vkn_json LIKE '%gia_tri_trung_binh%' GROUP BY 1,2 ORDER BY 1,2`))
// Lý do lịch đề Hóa 2026 còn "chuẩn bị": gom mã phần thiếu (tên kỹ năng/ô ma trận, không có danh tính) theo lớp. Chỉ lịch bản 3, một lần đọc.
in1('thieuV3', await doc(`SELECT k.lop,t.value ma,COUNT(DISTINCT k.sbd) em FROM kiem_tra_ca_nhan k JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id,json_each(k.json,'$.thieu') t
  WHERE k.trang_thai='cho_nguon' AND json_extract(km.meta_json,'$.phienBan')=3 AND k.han_luc>${now} GROUP BY 1,2 ORDER BY 1,3 DESC LIMIT 60`))
// Vì sao câu khối 12 có kỹ năng "dùng giá trị trung bình" (tờ DH-12-…) không vào được đề: phần, mức, duyệt, chỉ mục đúng bản, đã dạy ở lớp 12 nào,
// đang nghi sai đáp án, loại câu. Chỉ in thuộc tính câu (không có học sinh).
in1('cau12GTTB', await doc(`SELECT q.qid,q.ma_de,json_extract(q.json,'$.phan') phan,json_extract(q.json,'$.mucDo') muc_do,COALESCE(json_extract(q.json,'$.reviewed'),0) duyet,
  q.dang,o.y,o.nguon,o.duyet_luc IS NOT NULL omni_duyet,length(q.json) dai,
  EXISTS(SELECT 1 FROM de_kho d JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc WHERE d.ma_de=q.ma_de AND COALESCE(d.da_xoa,0)=0) chi_muc_dung,
  (SELECT group_concat(DISTINCT b.lop) FROM bai_da_day b WHERE b.bo_tick_luc IS NULL AND b.ma_to_json LIKE '%'||q.ma_de||'%') day_o_lop,
  EXISTS(SELECT 1 FROM cau_nghi_dap_an n WHERE n.qid=q.qid AND n.trang_thai='nghi') nghi_dap_an
  FROM omni_q o JOIN game_v2_question q ON q.qid=o.qid WHERE o.vkn_json LIKE '%gia_tri_trung_binh%' AND q.ma_de LIKE 'DH-12-%'`))
in1('phamVi12', await doc(`SELECT b.lop,COUNT(*) bai,SUM(b.ma_to_json LIKE '%DH-12-C1-B1%') co_b1 FROM bai_da_day b WHERE b.bo_tick_luc IS NULL AND b.lop LIKE '12%' GROUP BY 1`))
in1('scope12', await doc(`SELECT COUNT(*) em,SUM(json_array_length(COALESCE(json_extract(s.json,'$.types'),'[]'))>0) gioi_han_dang,SUM(json_array_length(COALESCE(json_extract(s.json,'$.blocked'),'[]'))>0) co_chan FROM game_v2_scope s JOIN hoc_sinh h ON h.sbd=s.sbd WHERE h.lop LIKE '12%' OR h.ten_lop LIKE '12%'`))
// Câu khối 12 có kỹ năng giá trị trung bình đang bị nghi đáp án: vì sao (số lượt làm/sai hay máy giải lại lệch). Không in đề/đáp án.
in1('nghi12', await doc(`SELECT n.qid,n.so_lan,n.so_sai,n.ty_le_sai,n.trang_thai,substr(COALESCE(n.ghi_chu,''),1,160) ghi_chu,n.luc FROM cau_nghi_dap_an n WHERE n.qid IN(SELECT o.qid FROM omni_q o JOIN game_v2_question q ON q.qid=o.qid WHERE o.vkn_json LIKE '%gia_tri_trung_binh%' AND q.ma_de LIKE 'DH-12-%')`))
in1('phamViLop12', await doc(`SELECT lop,COUNT(*) bai,SUM(ma_de_json LIKE '%DH-12-C1-B1%') co_b1 FROM pham_vi_lop WHERE lop LIKE '12%' GROUP BY 1`))
// Hỏi thêm Thầy (Gemini, PR268) báo "đang gặp lỗi" (thầy gửi ảnh 13/10 18:2x): lỗi máy chủ ghi ở cột `loi` — chỉ in giờ, model, ms, lỗi (không sbd, không câu hỏi).
in1('hoiThemLoi', await doc(`SELECT luc,model,ms,substr(loi,1,260) loi FROM hoi_tro_ly WHERE loi IS NOT NULL ORDER BY id DESC LIMIT 8`))
in1('hoiThemDem', await doc(`SELECT ngay_vn,COUNT(*) n,SUM(loi IS NULL) ok,SUM(loi IS NOT NULL) loi FROM hoi_tro_ly GROUP BY 1 ORDER BY 1 DESC LIMIT 3`))
in1('hoiThemCauHinh', await doc(`SELECT gia_tri,cap_nhat_luc FROM cau_hinh WHERE khoa LIKE '%hoi_them%' OR khoa LIKE '%hoi_tro_ly%'`))
