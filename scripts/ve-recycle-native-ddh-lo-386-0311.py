"""Sáu ký hiệu tái chế theo nguồn467; từng bộ phận giữ khung riêng từ native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-recycle-lo-386.json').read_text());h=p['hash'];b=''
# Các path vẽ tay theo macro native, không dò nét tự động.
paths=[
'M44 32 L55 15 C60 7 70 7 75 15 L87 34 L96 29 L91 48 L72 43 L79 39 L68 20 C66 16 63 16 61 20 L51 36 Z',
'M41 39 L24 44 L30 48 L20 66 C14 76 20 87 31 87 L52 87 L52 78 L32 78 C26 78 24 74 27 69 L38 52 L47 57 Z',
'M98 52 L91 56 L101 73 C104 78 100 79 96 79 L74 79 L74 69 L60 82 L74 94 L74 87 L99 87 C111 87 115 76 109 66 Z']
# xMin/xMax từng phần đọc riêng; không lấy chu kỳ x=128 làm geometry mặc định.
boxes=[[[44,96],[18,52],[60,112]],[[172,224],[146,180],[189,240]],[[300,352],[274,308],[316,367]],[[428,480],[401,436],[444,495]],[[555,607],[529,563],[572,622]],[[684,736],[657,692],[700,751]]]
for j,row in enumerate(boxes):
 for z,(lo,hi) in enumerate(row):
  a,c=boxes[0][z];sx=(hi-lo)/(c-a);tx=lo-a*sx
  sy=43/42 if z==2 and j in [1,2,4]else 1;ty=52*(1-sy)
  b+=f'<path d="{paths[z]}" fill="#000000" transform="matrix({sx} 0 0 {sy} {tx} {ty})"/>'
for j,(x,cap) in enumerate(zip([65,193,321,449,577,705],['PET','HDPE','PVC','LDPE','PP','PS'])):
 b+=F.label(x,61,str(j+1),25,weight='dam',fill='#000000')
 b+=F.label(x,121,cap,26,weight='dam',fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="791" height="131" viewBox="0 0 791 131"><title>Sáu ký hiệu tái chế theo nguồn467</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='recycle-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=467,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6recycleicons18FILLEDheads3EACH/6nums1-6TRUEdamUPRIGHT/6captionsEXACTPET-HDPE-PVC-LDPE-PP-PS-TRUEdamUPRIGHT/6separatenativeparts-noPeriodicAlias/0chemicalbonds-charge-captiontitle/NOadded7OTHER-polymerformulas-answer-noalias1192/1source2fullIFpass')
(K/'cau-truc-recycle-native-ddh-lo-386-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
