"""Phổ neon: giữ đỉnh1% nhỏ, isotope xếp tầng và mọi chú thích nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())if r['i']==1187)
def line(x,y,xx,yy,w=2):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="{w}" fill="none"/>'
def isotope(x,y,mass,percent):return F.label(x,y,'Ne ('+percent+'%)',26,'start')+F.label(x-4,y-14,str(mass),18,'end')+F.label(x-4,y+8,'10',18,'end')
b='<g transform="translate(50 50) scale(1.25)">'+line(106,5,106,535)+line(106,535,775,535)
for v,y in[(100,31),(75,160),(50,288),(25,416)]:b+=line(90,y,106,y)+F.label(84,y+7,str(v),25,'end')
for v,x in[(10,237),(20,371),(30,505),(40,638)]:b+=line(x,535,x,554)+F.label(x,582,str(v),26)
b+=F.label(99,582,'0',26)
for x,top in[(371,71),(388,526),(403.5,481)]:b+=line(x,535,x,top,2.8)
b+=isotope(345,46,20,'90,0')+isotope(223,508,21,'1,0')+isotope(414,460,22,'9,0')+line(345,506,382,523,1.2)+'<path d="M387 526L379 524L382 519Z" fill="#252440"/>'
b+=F.label(30,245,'Tỉ lệ % số nguyên tử',28,extra='transform="rotate(-90 30 245)"')+F.label(718,580,'m/z',26,'start')+F.label(766,565,'(*)',16,'start')
prefix='Hình 2.4. ';b+=F.label(94,653,prefix,30,'start',weight='dam')+F.label(94+F.advance(prefix,30,weight='dam'),653,'Phổ khối lượng của neon',30,'start')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="940" viewBox="0 0 1100 940"><title>Phổ khối lượng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='neon-ms-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='Giữpixelpeak371y71/388y526/403.5y481,cảđỉnh1%rấtnhỏ. Khôngtựchuẩnhoáheighttheovalue;isotope20/21/22trên10xếptầng,pathDDH;caption/dấum/z(*)/leader21đủ.')
(M/'cau-truc-neon-ms-ddh-lo-114-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
