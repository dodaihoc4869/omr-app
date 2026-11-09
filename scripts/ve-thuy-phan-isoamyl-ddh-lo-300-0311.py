from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='668d587c2d30bb9da5f5f0db0cab5d1865f303d06695182dd66a670857b4647c';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M7 16L47 39L73 24 M47 39V73 M41 42V73 M102 24L131 40L172 16L213 40L255 16 M213 40V89 M566 16L606 39L633 24 M606 39V73 M600 42V73 M802 32L843 56L884 32L925 56L951 42 M843 56V103" fill="none" stroke="#171717" stroke-width="2.2" stroke-linejoin="miter"/>'
for x,y,t,z in [(47,97,'O',27),(88,24,'O',27),(280,65,'+',27),(317,65,'NaOH',27),(606,97,'O',27),(638,24,'ONa',27),(735,65,'+',27),(956,41,'OH',27)]:b+=F.label(x,y,t,z,anchor='start'if t in ['NaOH','ONa','OH']else'middle',fill='#111111')
b+='<path d="M409 55H524" stroke="#111111" stroke-width="2.1"/><path d="M521 50L539 55L521 60Z" fill="#111111"/>'
b+=F.label(477,45,'t',27,fill='#111111')+F.label(484,32,'o',16,fill='#111111')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1004" height="110" viewBox="0 0 1004 110"><title>Sơ đồ thủy phân theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thuy-phan-isoamyl-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=544,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7C2Oester+NaOH→2C2OONa+5C1Oalcohol/2COdouble/2plus1filledRIGHT/t-small-supo/regularDDH/noaddedH-coeff-caption-answer')
(K/'cau-truc-thuy-phan-isoamyl-ddh-lo-300-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
