import {readFileSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {soanHieuSuat,QID_HIEU_SUAT} from './soan-mau-hieu-suat'
import {giaiDeHieuSuat} from './kiem-doc-lap-hieu-suat'
import {probeDuyNhat,deChoKiemMu,bamDeMu,kiemBangMay} from '../../server/src/chua-hoc-lieu-kiem-may'
import type {BangKiemMay} from '../../server/src/chua-hoc-lieu-kiem-may'
const source=JSON.parse(readFileSync(process.argv[2],'utf8'))
const q=source.nguon.find((x:{cau:{qid:string}})=>x.cau.qid===QID_HIEU_SUAT)?.cau
const h=soanHieuSuat(q)
if(!h) throw Error('Không có đúng nguồn đã soát; không sinh theo câu khác.')
const luotSoan=randomUUID(),luotKiem=randomUUID()
const tra=await Promise.all(probeDuyNhat(h).map(async p=>{
  const r=giaiDeHieuSuat(deChoKiemMu(p))
  if(!r) throw Error('Bộ giải độc lập chưa hiểu một đề; không tự nhận đạt.')
  return {qid:p.qid,phienBan:p.phienBan,bamDe:await bamDeMu(p),...r,chac:true}
}))
const kiemMay:BangKiemMay={phienBan:1,luotSoan,luotKiem,tra,chuyenMon:{
  dungKhoaHoc:true,tuongDuong:true,dungDoKho:true,duBuoc:true,
  lyDo:'Soát mẫu ethanol + acetic acid 1:1: đủ đổi V×D/M, chọn min số mol, đổi mol ester theo M=88 và tính thực tế/lí thuyết. Bốn bản toàn bài giữ ba bước và yêu cầu làm tròn phần mười; hai bước chất giới hạn thay đổi độc lập. Đáp án từng probe do bộ giải riêng đọc chữ đề, không đọc đáp án lượt soạn. Kiểm lý do theo các mệnh đề chuẩn của mẫu; không có người duyệt thủ công.'}}
const errors=await kiemBangMay(h,kiemMay)
if(errors.length) throw Error(errors.join(', '))
writeFileSync(process.argv[3],JSON.stringify({hocLieu:h,kiemMay,nguonKiem:'mau_hieu_suat_0710_tinh_doc_lap'},null,2))
console.log(JSON.stringify({qid:h.qidGoc,soProbe:tra.length,datKiem:true}))
