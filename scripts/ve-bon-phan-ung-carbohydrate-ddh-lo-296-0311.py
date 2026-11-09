"""Nguồn1238: giữ bốn phản ứng nguyên văn, không thêm điều kiện hay đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e089fb1c595e8b851e3ff72fa35052cdc2dac1607bda960306b1f201702be266';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def formula(x,y,t):
 global b
 # Dấu gạch dưới đánh dấu đúng một nhóm chỉ số dưới; không xuất ký tự gạch dưới.
 import re
 for a in re.findall(r'_[0-9n]+|[^_]+?(?=_|$)',t):
  sub=a.startswith('_');a=a[1:]if sub else a;z=18 if sub else 28
  b+=F.label(x,y+(6 if sub else 0),a,z,anchor='start',fill='#292929');x+=F.advance(a,z)
 return x
rows=[(64,81,'(C_6H_10O_5)_n + nH_2O',342,482,495,'nC_6H_12O_6'),(125,81,'C_12H_22O_11 + H_2O',316,450,463,'2C_6H_12O_6'),(186,81,'C_6H_12O_6',206,340,354,'2C_2H_5OH + 2CO_2'),(247,81,'C_2H_5OH + O_2',270,404,418,'CH_3COOH + H_2O')]
for i,(y,x,left,a,z,right,product)in enumerate(rows,1):
 formula(39,y,str(i)+')');formula(x,y,left);formula(right,y,product)
 b+=f'<path d="M{a} {y-8}H{z} M{z-8} {y-15}L{z} {y-8}L{z-8} {y-1}" fill="none" stroke="#292929" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="687" height="301" viewBox="0 0 687 301"><title>Bốn phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-phan-ung-carbohydrate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1238,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4numberedreactionrows1)..4)/4openVRIGHT/regularDDH/subscripts2-3-5-6-10-11-12-22-n/(C6H10O5)n+nH2O→nC6H12O6;C12H22O11+H2O→2C6H12O6;C6H12O6→2C2H5OH+2CO2;C2H5OH+O2→CH3COOH+H2O/noaddedconditions-enzyme-caption-answer.')
(K/'cau-truc-bon-phan-ung-carbohydrate-ddh-lo-296-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
