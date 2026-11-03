"""Phổ đồng vị, giữ đúng m/z và phần trăm nguồn; dùng phông DDH Rounded."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(spec);spec.loader.exec_module(F)
P=G/'docs/hinh-vector-0311';M=P/'kiem';A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def line(x,y,xx,yy,w=2,color='#252440'):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" stroke="{color}" stroke-width="{w}" fill="none"/>'
for ids,lo,hi,ticks,points,xlabel in [([234,1230],18,23,[19,20,21,22,23],[(20,90.9,'90,9'),(21,.3,'0,3'),(22,8.8,'8,8')],'Tỉ số nguyên tử khối/điện tích (m/z)'),([192,1333],51,62,[54,56,57,58],[(54,5.84,'5,84'),(56,91.68,'91,68'),(57,2.17,'2,17'),(58,.31,'0,31')],'m/z')]:
 x=lambda v:150+(v-lo)/(hi-lo)*700;y=lambda v:400-v*3.2;b=line(150,80,150,400)+line(150,400,860,400)
 for v in [20,40,60,80,100]:b+=line(140,y(v),150,y(v))+F.label(129,y(v)+8,str(v),22,'end')
 for v in ticks:b+=line(x(v),400,x(v),410)+F.label(x(v),442,str(v),22)
 for mass,value,s in points:b+=line(x(mass),400,x(mass),y(value),5,'#087f8e')+F.label(x(mass),y(value)-14,s,23)
 b+=F.label(510,492,xlabel,23)+F.label(38,240,'Phần trăm số nguyên tử đồng vị (%)',23,extra='transform="rotate(-90 38 240)"')
 svg=('<svg xmlns="http://www.w3.org/2000/svg" width="930" height="530" viewBox="0 0 930 530"><title>Phổ đồng vị theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='ms-ddh-'+h+'.svg';(M/fn).write_bytes(svg)
 for i in ids:
  a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',points=points,xTicks=ticks,yTicks=[20,40,60,80,100],ghiChu='Không có nhãn0 hoặc mũi tên; khoảng m/z đúng tỷ lệ. Chữ đã thành nét phông app, tự chứa/offline.'))
(M/'cau-truc-ms-lo-11-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng4nguồn, đúngphôngapp; chờsoát.')
