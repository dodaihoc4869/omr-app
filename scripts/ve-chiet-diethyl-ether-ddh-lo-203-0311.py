"""Nguồn93: sơ đồ chiết literal, giữ S/Đ và từng nhãn/caption."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1241eaf0cb21af2b27c69d8ebc9cf9ea5458200de1d2fac6a5f42a214c136cc1';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.6,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=22):return F.label(x,y,t,z)
b=''
for x,top,two in [(80,154,False),(324,77,True),(504,77,True),(742,156,False),(918,156,False)]:
 b+=path(f'M{x} {top}H{x+140}V240H{x}Z',1.5,'#dedede')+path(f'M{x-6} 42Q{x} 42 {x} 51V240H{x+140}V51Q{x+140} 42 {x+148} 42',1.5)
 if two:b+=path(f'M{x} 155H{x+140}',1.5)
b+=path('M245 137H284V125L306 144L284 163V150H245Z',1.7,'white')+path('M667 138H706V126L728 145L706 164V151H667Z',1.7,'white')
b+=path('M372 178V133M367 141L372 133L377 141',1.7)+path('M367 141L372 133L377 141Z',1,'#252440')
b+=label(111,195,'S')+label(178,195,'Đ')+label(146,220,'(nước)')
b+=label(394,123,'(diethyl ether)',18.5)+label(357,195,'S')+label(425,195,'Đ')+label(393,220,'(nước)')
b+=label(574,110,'(diethyl ether)',18.5)+label(574,139,'S')+label(574,195,'Đ')+label(574,220,'(nước)')
b+=label(812,194,'S')+label(812,221,'(diethyl ether)',18.5)+label(983,193,'Đ')+label(989,220,'(nước)')
for x,lines,ys in [(150,['Hỗn hợp sau phản','ứng gồm sản phẩm','(S) và các chất ban','đầu (Đ) còn dư'],[297,331,365,399]),(480,['Dung môi diethyl ether được','thêm vào để chiết sản phẩm','hữu cơ ra khỏi hỗn hợp'],[297,331,365]),(900,['Sản phẩm là ethyl acetate đã','được tách ra khỏi hỗn hợp'],[297,331])]:
 for t,y in zip(lines,ys):b+=label(x,y,t,22)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1101" height="425" viewBox="0 0 1101 425"><title>Sơ đồ chiết theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chiet-diethyl-ether-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=93,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5openbeakers/2hollowRIGHTarrows/1phaseUParrow/S-Đlabels/diethylether-nước/3captionblocks/literaldata/DDHpath.');(K/'cau-truc-chiet-diethyl-ether-ddh-lo-203-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
