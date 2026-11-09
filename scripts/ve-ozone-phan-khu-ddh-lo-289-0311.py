"""Nguồn1091: sơ đồ ozone phân khử tổng quát; giữ R và các chỉ số trên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c4488ecaee3d09e591263df6e81dc57e6aad1698bc5c8e87d372ab29da2c3294';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M72 69L101 97H144L174 69 M72 126L101 97 M144 97L174 126 M105 90H140 M664 65L690 90H721 M664 124L690 97H721 M946 64L920 89H890 M946 123L920 96H890 M310 96H533" fill="none" stroke="#252440" stroke-width="2.5" stroke-linejoin="round"/>'
b+='<polygon points="515,91 555,96 515,101" fill="#252440"/>'
for x,y,t,z,a in [(40,68,'R¹',30,'start'),(31,147,'R²',30,'start'),(180,69,'R³',30,'start'),(180,146,'R⁴',30,'start'),(632,65,'R¹',30,'start'),(623,144,'R²',30,'start'),(956,65,'R³',30,'start'),(956,143,'R⁴',30,'start'),(734,106,'O',30,'middle'),(875,104,'O',30,'middle'),(801,103,'+',28,'middle'),(415,84,'1. O₃',28,'middle'),(420,134,'2. (CH₃)₂S',28,'middle')]:b+=F.label(x,y,t,z,a)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1037" height="182" viewBox="0 0 1037 182"><title>Sơ đồ ozone phân khử theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ozone-phan-khu-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1091,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3barestructures4C2O/8RtokensRsup1-2-3-4EACHtwice/1CCdouble2COdouble/2carbonylsplitfeetNOverticalbridge/1filledRIGHT/1plus/1.O3ABOVE-2.(CH3)2SBELOW/regularDDH/noaddedRvalues-X-Y-Br2-answer.')
(K/'cau-truc-ozone-phan-khu-ddh-lo-289-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
