"""Nguồn901: công thức Lewis và mô hình ammonia; chỉ hai chấm phía a)."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a595bc8007c602f48369a113c539c68b2a60398ae3b923b3217f18891d2eb4fe';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="butt"/>'
def italic(x,y,t,size,weight='de'):
 return f'<g transform="translate({math.tan(math.radians(10))*y:.5f} 0) skewX(-10)">'+F.label(x,y,t,size,'start',weight=weight)+'</g>'
b=line('M399 36H437 M472 36H510 M455 57V89',4)
b+='<circle cx="450" cy="6" r="4" fill="#252440"/><circle cx="460" cy="6" r="4" fill="#252440"/>'
for x,y,t in [(455,43,'N'),(383,43,'H'),(528,43,'H'),(455,116,'H'),(728,44,'N'),(659,103,'H'),(792,106,'H'),(728,134,'H')]:b+=F.label(x,y,t,39)
b+=line('M707 54L677 80',5)+'<path d="M727 61L722 99H732Z" fill="#252440"/>'
# Các nhát nêm đứt được ghi sau khi đối chiếu phóng đại nguồn.
for x,y,length in [(747,54,2),(751.5,58.5,3.2),(756.5,63,4.3),(761.5,67,5.4),(766.5,71.5,6.4),(773,76.5,7.7)]:
 dx=-.663*length/2;dy=.749*length/2;b+=line(f'M{x-dx:.3f} {y-dy:.3f}L{x+dx:.3f} {y+dy:.3f}',2.8)
b+=italic(448,175,'a)',38)+italic(714,175,'b)',38)
prefix='Hình 5.1. ';tail='Công thức Lewis (a) và dạng hình học (b) của phân tử ammonia';size=31.4
b+=italic(29,235,prefix,size,'dam')+italic(29+F.advance(prefix,size,'dam'),235,tail,size)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1158" height="247" viewBox="0 0 1158 247"><title>Hai cách biểu diễn ammonia theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ammonia-lewis-khong-gian-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=901,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2N6H/3bondseach/ONLY2dotsaboveaN/a)b)italic/bLEFTboldUNIFORM-downfilledTAPERnarrowN-rightgradedhash/wholecaptionitalic-prefixactualdam/exactHình 5.1. Công thức Lewis (a) và dạng hình học (b) của phân tử ammonia/noaddedlonepairb-charge-angle-answer.')
(K/'cau-truc-ammonia-lewis-khong-gian-ddh-lo-278-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
