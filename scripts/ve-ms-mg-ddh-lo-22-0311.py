"""Phổ nguồn602: giữ m/z12/12,5/13 và nhãn đồng vị Mg, không thêm điện tích."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[602]
def line(x,y,xx,yy,w=2,c='#252440'):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{c}" stroke-width="{w}"/>'
x=lambda m:390+(m-12)*220;y=lambda v:400-v*3.6
b=line(110,40,110,400)+line(110,400,930,400)
for v in[20,40,60,80]:b+=line(100,y(v),110,y(v))+F.label(87,y(v)+8,str(v),22,'end')
for m,label in[(12,'12'),(12.5,'12,5'),(13,'13')]:b+=F.label(x(m),437,label,23)
points=[(12,78.99,'24','78,99%',352,90),(12.5,10,'25','10%',430,328),(13,11.01,'26','11,01%',610,328)]
for m,v,mass,pct,lx,ly in points:
 b+=line(x(m),400,x(m),y(v),4,'#087f8e')+F.label(lx,ly-9,mass,15,'start')+F.label(lx+F.advance(mass,15)+2,ly,'Mg ('+pct+')',22,'start')
b+=F.label(35,235,'Tỉ lệ % số nguyên tử',23,extra='transform="rotate(-90 35 235)"')+F.label(930,484,'m/z',26,'end')
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="520" viewBox="0 0 1000 520"><title>Phổ đồng vị theo hình nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='ms-mg-ddh-'+h+'.svg';(M/fn).write_bytes(svg);r=dict(i=602,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',points=[[m,v,mass,pct]for m,v,mass,pct,lx,ly in points],xTicks=['12','12,5','13'],yTicks=[20,40,60,80],ghiChu='Nguồn là Mg, không thay theo stem nhắc Cu; giữ số khối phía trên tráiMg, không tự thêm2+ hoặc gấp đôi m/z.')
(M/'cau-truc-ms-mg-ddh-lo-22-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng nguồn602, chờsoát.')
