// Chỉ đọc production, chỉ in số tổng hợp; không danh tính, câu hỏi hay đáp án.
const token=process.env.CLOUDFLARE_API_TOKEN?.trim(),account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
async function query(sql,params=[]){
 if(!/^\s*(SELECT|WITH)\b/i.test(sql)||/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(sql))throw new Error('Công cụ nguồn chỉ đọc.')
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params}),signal:AbortSignal.timeout(30000)})
 const j=await r.json();if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không đọc được nguồn (${r.status}).`);return j.result[0].results
}
const ca=(await query("SELECT (SELECT COUNT(*) FROM ca WHERE trang_thai='mo') soCaMo"))[0]
const scope=await query(`SELECT ma_to_json AS ds FROM bai_da_day WHERE bo_tick_luc IS NULL UNION ALL SELECT p.ma_de_json AS ds FROM pham_vi_lop p WHERE p.vi_tri<(SELECT MAX(b.vi_tri) FROM bai_da_day b WHERE b.lop=p.lop AND b.bo_tick_luc IS NULL)`)
const roots=[...new Set(scope.flatMap(r=>{try{return JSON.parse(r.ds)}catch{return[]}}).map(m=>String(m).replace(/-(TN|DS|TLN)$/,'')).filter(m=>!/(?:-VD|-DT|-TL)$/.test(m)))]
const nguon=(await query(`SELECT COUNT(*) soCau,SUM(CASE WHEN json_extract(q.json,'$.reviewed')=1 THEN 1 ELSE 0 END) daDuyet,SUM(CASE WHEN NOT EXISTS(SELECT 1 FROM omni_q o WHERE o.qid=q.qid AND json_array_length(o.vkn_json)>0) THEN 1 ELSE 0 END) thieuMaTran FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.ma_de IN(SELECT value FROM json_each(?)) AND COALESCE(json_extract(q.json,'$.tuLuan'),0)=0`,[JSON.stringify(roots)]))[0]
const em=(await query(`SELECT COUNT(*) soEmCoBai FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM bai_da_day b WHERE b.bo_tick_luc IS NULL AND b.lop=COALESCE(NULLIF(TRIM(h.ten_lop),''),CASE TRIM(COALESCE(h.lop,'')) WHEN '12' THEN '12 - Lớp Thường' WHEN '' THEN 'Chưa xếp lớp' ELSE TRIM(h.lop) END))`))[0]
console.log(JSON.stringify({kiemNguonKtCn:true,chiDoc:true,...ca,...em,soNguon:roots.length,...nguon}))
if((await query("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='kiem_tra_ca_nhan'"))[0]?.n){
 const kt=(await query(`SELECT COUNT(*) soLich,COUNT(DISTINCT sbd) soEmCoLich,SUM(CASE WHEN trang_thai<>'cho_nguon' THEN 1 ELSE 0 END) lichSanSang,SUM(CASE WHEN trang_thai='cho_nguon' THEN 1 ELSE 0 END) choNguon,MIN(ngay) ngaySomNhat,MAX(ngay) ngayMuonNhat,MIN(json_array_length(json_extract(json,'$.cau'))) cauItNhat,MAX(json_array_length(json_extract(json,'$.cau'))) cauNhieuNhat FROM kiem_tra_ca_nhan WHERE ngay>=date('now','+7 hours')`))[0]
 console.log(JSON.stringify({kiemLichKtCn:true,chiDoc:true,...kt}))
 const audit=(await query(`SELECT COUNT(*) daThu,SUM(CASE WHEN loi<>'' THEN 1 ELSE 0 END) loiLap FROM kiem_tra_ca_nhan_dieu_phoi`))[0]
 const cfg=(await query("SELECT gia_tri FROM cau_hinh WHERE khoa='kiem_tra_ca_nhan_v1'"))[0]
 console.log(JSON.stringify({kiemKichHoatKtCn:true,chiDoc:true,bat:cfg?JSON.parse(cfg.gia_tri).bat===true:false,...audit}))
}
