"""Hai nguồn phổCl: giữ nguyên75,77/24,23, ký hiệu đồng vị xếp tầng và mọi tick."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
sources={r['i']:r for r in json.loads((M/'doc-dung-moi-lo-80.json').read_text())}
def line(x,y,xx,yy,w=2):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def isotope(x,y,mass,percent):
 return F.label(x,y,'Cl ('+percent+'%)',29,'start')+F.label(x-4,y-16,str(mass),19,'end')+F.label(x-4,y+7,'17',19,'end')
x=lambda v:150+v*16;y=lambda v:460-v*3.9
b=line(150,30,150,460)+line(150,460,1100,460)
for v in[10,20,30,40]:b+=line(x(v),460,x(v),472)+F.label(x(v),510,str(v),28)
for v in[25,50,75,100]:b+=line(138,y(v),150,y(v))+F.label(128,y(v)+8,str(v),28,'end')
for mass,value,percent in[(35,75.77,'75,77'),(37,24.23,'24,23')]:
 b+=line(x(mass),460,x(mass),y(value),4)+isotope(x(mass)+12,y(value)-14,mass,percent)
b+=F.label(50,245,'Tỉ lệ % số nguyên tử',30,extra='transform="rotate(-90 50 245)"')+F.label(1130,515,'m/z = A',30,'end')+F.label(600,575,'Phổ khối lượng của chlorine',30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="610" viewBox="0 0 1200 610"><title>Phổ theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows=[]
for i in[522,563]:rows.append(dict(sources[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Hai chữ số khối35/37 đặt trên17 bằng các path DDH xếp tầng; không dùng ký tự Unicode nối ngang sai bố cục. Không thêm0/arrow/grid/đáp án trung bình.'))
(M/'cau-truc-ms-chlorine-ddh-lo-81-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
