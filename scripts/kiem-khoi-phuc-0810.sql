SELECT (SELECT COUNT(*) FROM ca WHERE trang_thai='mo') AS ca_mo, (SELECT COUNT(*) FROM luot l JOIN ca c ON c.ma_ca=l.ma_ca WHERE c.trang_thai='mo' AND l.trang_thai='dang_lam') AS dang_thi;
SELECT id,lop,trang_thai,han_nop,the_luc_ngay,huyet_chien,tao_luc,dong_luc,json_array_length(sbd_json) AS so_em,json_array_length(qid_json) AS so_cau,ma_de_json FROM chien_dich ORDER BY tao_luc;
SELECT * FROM hanh_trinh_hop_nhat;
SELECT * FROM hanh_trinh_gioi_hoa;
SELECT id,lop,khoa_bai,ma_to_json,tick_luc,chien_dich_id,bo_tick_luc FROM bai_da_day WHERE chien_dich_id IN (SELECT chien_dich_id FROM hanh_trinh_gioi_hoa);
SELECT j.id, (SELECT COUNT(*) FROM json_each(j.qid_json) q WHERE NOT EXISTS (SELECT 1 FROM hanh_trinh_hop_nhat h JOIN chien_dich c ON c.id=h.chien_dich_cu JOIN json_each(c.qid_json) cq WHERE h.chien_dich_moi=j.id AND cq.value=q.value)) AS cau_bo_sung FROM chien_dich j JOIN hanh_trinh_gioi_hoa m ON m.chien_dich_id=j.id;
SELECT khoa,gia_tri FROM cau_hinh WHERE khoa IN ('chien_dich_phut_v1','hanh_trinh_gioi_hoa_hop_nhat_0810_v1');
