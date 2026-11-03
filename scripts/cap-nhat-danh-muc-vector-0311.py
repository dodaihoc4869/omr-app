"""Hợp nhất CHỈ tài sản đã soát. Đếm riêng câu đủ mọi hình và câu mới xong một phần."""
from pathlib import Path
import json,hashlib,gzip
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';SRC=json.loads((P/'nguon/kiem-ke.json').read_text());mapping={};alternatives={}
def add(h,f,kind,proof=None):
 b=(M/f).read_bytes();digest=hashlib.sha256(b).hexdigest()
 if proof and proof!=digest:raise ValueError('Bản vẽ đã đổi sau soát: '+f)
 obj={'tep':f,'hashSvg':digest,'byteSvg':len(b),'byteGzip':len(gzip.compress(b,mtime=0)),'trangThai':kind,'canNenSang':True}
 if h in mapping and mapping[h]['hashSvg']!=digest:raise ValueError('Một nguồn được gán hai bản vẽ khác nhau: '+h)
 mapping[h]=obj
for h,f in json.loads((M/'mau-da-duyet.json').read_text()).items():add(h,f,'mau-thay-duyet')
for file in ['hoa-ve-thu-cong.json','orbital-ve-thu-cong.json','orbital-nhan-ve-thu-cong.json','cung-noi-dung-da-soat.json']:
 p=M/file
 if not p.exists():continue
 for r in json.loads(p.read_text()):
  if r.get('trangThai')=='da-soat-doc-lap':add(r['hash'],r['svg'],'da-soat-doc-lap',r.get('hashSvgDaSoat'))
for file in M.glob('cau-truc-*-ban-dung.json'):
 for r in json.loads(file.read_text()):
  if r.get('trangThai')!='da-soat-doc-lap':continue
  # Mẫu đã soát dùng chung được ưu tiên; bản dựng khác vẫn lưu bằng chứng,
  # không âm thầm ghi đè ánh xạ hoặc trộn hai phiên bản dưới cùng URL.
  if r['hash'] in mapping and mapping[r['hash']]['hashSvg']!=r['hashSvgDaSoat']:
   if hashlib.sha256((M/r['svg']).read_bytes()).hexdigest()!=r['hashSvgDaSoat']:raise ValueError('Bản thay thế đã đổi sau soát')
   if r.get('font')=='DDH Rounded' and mapping[r['hash']].get('font')!='DDH Rounded':
    alternatives.setdefault(r['hash'],[]).append(dict(mapping[r['hash']]));del mapping[r['hash']]
   else:
    alternatives.setdefault(r['hash'],[]).append({'tep':r['svg'],'hashSvg':r['hashSvgDaSoat']});continue
  add(r['hash'],r['svg'],'cau-truc-da-soat-doc-lap',r['hashSvgDaSoat'])
  if r.get('font'):mapping[r['hash']]['font']=r['font']
qs=[];full=[];partial=[]
for q in SRC['questions']:
 matched=[dict(h,vector=mapping[h['hash']]['tep'])for h in q['hinh']if h['hash']in mapping]
 if not matched:continue
 done=len(matched)==len(q['hinh']);qs.append({'qid':q['qid'],'duMoiHinh':done,'soHinhNguon':len(q['hinh']),'soHinhDaKiem':len(matched),'hinh':matched})
 (full if done else partial).append(q['qid'])
manifest={'ghiChu':'Tài sản đã đối chiếu để chuẩn bị tích hợp; CHƯA được app dùng, CHƯA phát hành, không có đáp án. Câu chỉ được tính xong khi đủ mọi hình nguồn.','theoHashNguon':mapping,'theoCau':qs,'cauDuMoiHinh':full,'cauMoiXongMotPhan':partial,'bienTheKhacDaSoat':alternatives}
(M/'danh-muc-da-kiem.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
p=P/'tien-do.json';d=json.loads(p.read_text());unique={a['tep']:a for a in mapping.values()};d['tongDaDoiChieu']={'soAnhNguon':len(mapping),'soSvgRieng':len(unique),'soCauDungHinh':len(qs),'soCauDuMoiHinh':len(full),'soCauMoiXongMotPhan':len(partial),'byteSvg':sum(a['byteSvg']for a in unique.values()),'byteGzip':sum(a['byteGzip']for a in unique.values()),'soAnhNguonConLai':SRC['soAnhRieng']-len(mapping),'daTichHop':False};d['cachDem']='soCauDuMoiHinh = đủ TẤT CẢ hình nguồn; soCauDungHinh chỉ là câu có ít nhất một hình đã đạt, không phải số câu hoàn tất.';d['daDatPhongApp']={'soNguon':sum(v.get('font')=='DDH Rounded'for v in mapping.values()),'soCauDuHinhVaPhong':sum(all(h['hash']in mapping and mapping[h['hash']].get('font')=='DDH Rounded'for h in q['hinh'])for q in SRC['questions']if q['hinh']),'ghiChu':'Các số tổngDaDoiChieu vẫn mô tả nội dung đã kiểm; bản cũ chưa đổi phông không được coi đạt yêu cầu phông mới.'};p.write_text(json.dumps(d,ensure_ascii=False,indent=2));print(json.dumps(d['tongDaDoiChieu'],ensure_ascii=False))
