// Sinh điều kiện công bố từ CHÍNH luật dùng chung, tránh viết một luật thi khác trong trigger.
import { writeFileSync } from 'node:fs'
import { SQL_DA_CONG_BO } from '../server/src/cong-bo-diem.ts'
const qid = `CASE WHEN instr(COALESCE(json_extract(NEW.raw_json,'$.tc'),NEW.qid),'~ss')>0 THEN substr(COALESCE(json_extract(NEW.raw_json,'$.tc'),NEW.qid),1,instr(COALESCE(json_extract(NEW.raw_json,'$.tc'),NEW.qid),'~ss')-1) ELSE COALESCE(json_extract(NEW.raw_json,'$.tc'),NEW.qid) END`
const nhom = `COALESCE((SELECT content_group FROM game_v2_question WHERE qid=(${qid}) LIMIT 1),'')`
const ver = `COALESCE((SELECT version FROM game_v2_question WHERE qid=(${qid}) LIMIT 1),'')`
const than = `
 INSERT OR IGNORE INTO chua_loi_dot(id,sbd,qid_chuan,content_group,phien_ban_cau,cohort_id,nguon_sai,mo_luc,sai_cuoi_luc,trang_thai_day,ly_do_thieu,policy_snapshot,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc)
 SELECT 'cl-'||lower(hex(randomblob(16))),NEW.sbd,(${qid}),${nhom},${ver},COALESCE(json_extract(c.gia_tri,'$.cohortId'),'pilot-chua-cau-sai-v1'),NEW.nguon,
   CAST((julianday(NEW.luc)-2440587.5)*86400000 AS INTEGER),CAST((julianday(NEW.luc)-2440587.5)*86400000 AS INTEGER),'thieu_hoc_lieu','can_kiem_hoc_lieu',c.gia_tri,
   CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)+86400000*max(7,min(30,COALESCE(json_extract(c.gia_tri,'$.cuaSoDoNgay'),7))),
   CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)
 FROM cau_hinh c JOIN hoc_sinh h ON h.sbd=NEW.sbd
 WHERE c.khoa='chua_cau_sai_v1' AND CASE WHEN json_valid(c.gia_tri) THEN json_extract(c.gia_tri,'$.bat') ELSE 0 END=1
   AND (json_extract(c.gia_tri,'$.phamVi')='tat_ca' OR NEW.sbd IN (SELECT value FROM json_each(c.gia_tri,'$.sbd')) OR h.lop IN (SELECT value FROM json_each(c.gia_tri,'$.lop')))
   AND (NEW.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca cb WHERE cb.ma_ca=NEW.ma_nguon AND cb.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('cb')}))
   AND (NEW.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 WHERE id=NEW.ma_nguon AND sbd=NEW.sbd AND status='submitted'))
   AND NOT EXISTS(SELECT 1 FROM chua_loi_dot d WHERE d.sbd=NEW.sbd AND (d.qid_chuan=(${qid}) OR (d.content_group<>'' AND d.content_group=${nhom})) AND d.dong_luc IS NULL)`
const dieuKien = `COALESCE(NEW.ket_qua,0)=0 AND COALESCE(NEW.assistance,'none') IN ('none','')
  AND COALESCE(NEW.visibility,'released')<>'embargoed' AND NEW.ngay_vn>='2026-09-29'
  AND COALESCE(NEW.purpose,'') NOT IN ('xem_loi_giai','luot','chan_doan','chua_buoc')`
const dongCu = `
 UPDATE chua_loi_dot SET dong_luc=CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) WHERE sbd=NEW.sbd AND (qid_chuan=(${qid}) OR (content_group<>'' AND content_group=${nhom})) AND trang_thai_day='da_tu_sua' AND dong_luc IS NULL
   AND CAST((julianday(NEW.luc)-2440587.5)*86400000 AS INTEGER)>(SELECT MAX(nop_luc) FROM chua_loi_nop WHERE dot_id=chua_loi_dot.id)
   AND EXISTS(SELECT 1 FROM cau_hinh c JOIN hoc_sinh h ON h.sbd=NEW.sbd WHERE c.khoa='chua_cau_sai_v1' AND CASE WHEN json_valid(c.gia_tri) THEN json_extract(c.gia_tri,'$.bat') ELSE 0 END=1 AND (json_extract(c.gia_tri,'$.phamVi')='tat_ca' OR NEW.sbd IN (SELECT value FROM json_each(c.gia_tri,'$.sbd')) OR h.lop IN (SELECT value FROM json_each(c.gia_tri,'$.lop'))))   AND (NEW.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca cb WHERE cb.ma_ca=NEW.ma_nguon AND cb.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('cb')}))
   AND (NEW.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 WHERE id=NEW.ma_nguon AND sbd=NEW.sbd AND status='submitted'))`
const mot = (
  ten,
  su,
) => `CREATE TRIGGER IF NOT EXISTS ${ten} AFTER ${su} ON su_kien_hoc
WHEN ${dieuKien}
BEGIN${dongCu}; ${than.trimStart()}; END;\n`
writeFileSync(
  'server/migration-z-0710-chua-giao-tu-so.sql',
  `-- Tự sinh bằng scripts/tao-migration-chua-giao.mjs; chạy sau các migration CNH-1 và vòng chữa 0710.
-- Sai đã công bố vào đợt giao cùng giao dịch ghi sổ, kể cả em không mở màn chữa.
-- Toàn trường phải ghi rõ phamVi='tat_ca'; cờ mặc định tắt.
${mot('chua_giao_sai_sau_ghi', 'INSERT')}${mot('chua_giao_sai_sau_cong_bo', 'UPDATE OF visibility')}`,
)
