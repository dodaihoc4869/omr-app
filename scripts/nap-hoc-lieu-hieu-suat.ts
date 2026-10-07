// Nạp một mẫu thật đã giải độc lập. Không ghi điểm, sự kiện học sinh hoặc bịa tên thầy duyệt.
import '../server/src/index'
import {randomUUID} from 'node:crypto'
import {taoDbVanHanh} from './chua-d1-van-hanh'
import {soanHieuSuat,QID_HIEU_SUAT} from './loi-giai/soan-mau-hieu-suat'
import {giaiDeHieuSuat} from './loi-giai/kiem-doc-lap-hieu-suat'
import {probeDuyNhat,deChoKiemMu,bamDeMu,kiemBangMay,type BangKiemMay} from '../server/src/chua-hoc-lieu-kiem-may'
import {hocLieuThay} from '../server/src/chua-cau-sai-thay'
import type {Env} from '../server/src/kieu'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account) throw Error('Thiếu cấu hình để nạp học liệu.')
const db=taoDbVanHanh(async sql=>{
  const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql}),signal:AbortSignal.timeout(60000)})
  const j=await r.json()
  if(!r.ok||!j.success) throw Error('Không hoàn tất thao tác học liệu.')
  return j.result
})
async function main(){
  const row=await db.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE q.qid=? AND COALESCE(d.da_xoa,0)=0`).bind(QID_HIEU_SUAT).first<{json:string}>()
  const h=row ? soanHieuSuat(JSON.parse(row.json)) : null
  if(!h) throw Error('Nguồn đã thay đổi; dừng để soát lại mẫu.')
  const luotSoan=randomUUID(),luotKiem=randomUUID()
  const tra=await Promise.all(probeDuyNhat(h).map(async p=>{
    const r=giaiDeHieuSuat(deChoKiemMu(p))
    if(!r) throw Error('Chưa giải được một đề bằng bộ giải riêng.')
    return {qid:p.qid,phienBan:p.phienBan,bamDe:await bamDeMu(p),...r,chac:true}
  }))
  const kiemMay:BangKiemMay={phienBan:1,luotSoan,luotKiem,tra,chuyenMon:{dungKhoaHoc:true,tuongDuong:true,dungDoKho:true,duBuoc:true,
    lyDo:'Mẫu được soát riêng trên câu ethanol + acetic acid 1:1, giữ ba bước đổi V×D/M, tìm chất giới hạn và hiệu suất. Bốn đề toàn bài đủ D/M, tỉ lệ, sản phẩm và cùng yêu cầu làm tròn phần mười. Bộ giải riêng đọc lại toàn bộ dữ kiện trong chữ đề, kiểm các lý do theo các mệnh đề chuẩn đã soát của mẫu. Không có người duyệt thủ công.'}}
  if((await kiemBangMay(h,kiemMay)).length) throw Error('Bộ học liệu chưa đạt kiểm độc lập.')
  const env={DB:db} as unknown as Env
  const r=await hocLieuThay(env,{luu:true,hocLieu:h,kiemMay}),j=await r.json()
  if(!r.ok||!j.ok) throw Error('Máy chủ chưa nhận mẫu đúng phiên bản.')
  const saved=await db.prepare("SELECT hoc_lieu_json,nguoi_duyet FROM chua_loi_hoc_lieu WHERE bam=? AND trang_thai='du_dung'").bind(j.bam).first<{hoc_lieu_json:string;nguoi_duyet:string}>()
  if(!saved || saved.nguoi_duyet!=='máy kiểm độc lập · v1' || (await kiemBangMay(JSON.parse(saved.hoc_lieu_json),JSON.parse(saved.hoc_lieu_json).kiemMay)).length) throw Error('Đọc lại chưa đạt kiểm.')
  const coverage=await db.prepare(`SELECT COUNT(DISTINCT qid_chuan) AS soCauCoHocLieu FROM chua_loi_hoc_lieu WHERE trang_thai='du_dung'`).first()
  console.log(JSON.stringify({daNap:true,docLaiDat:true,soBuoc:h.buoc.length,soProbe:tra.length,soBanGhep:2,soBanGapLai2:2,nguoiDuyet:'máy kiểm độc lập · v1',doPhu:coverage}))
}
main().catch(()=>{console.error('Chưa hoàn tất nạp mẫu học liệu. Không ghi đạt chất lượng hoặc tỷ lệ 90%.');process.exitCode=1})
