"""Nguồn940: vòng lactam bảy cạnh và đơn vị capron, giữ nguyên nhãn nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a9d3a006eeaa99c8720d604caf43e5cd3fb243f54419088e6e5f4dad1c826ac9';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M154 120L176 108L214 127L223 168L198 201H155L129 167L135 145 M172 108V82 M180 108V82 M282 163H413 M481 181L518 167 M546 168L568 181L604 161L640 181L677 161L713 181L750 161L800 185 M746 161V134 M754 161V134 M532 124V143')
b+='<path d="M405 158L421 163L405 168Z" fill="#252440"/>'
b+=line('M508 135C496 155 496 178 508 197 M773 136C785 156 785 179 773 198',2.6)
for x,y,t,z in [(91,164,'n',27),(128,135,'HN',29),(176,74,'O',30),(350,150,'t°',26),(532,123,'H',29),(532,166,'N',29),(750,126,'O',30),(787,198,'n',24),(162,248,'caprolactam',33),(638,248,'capron',33)]:b+=F.label(x,y,t,z)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="865" height="304" viewBox="0 0 865 304"><title>Phương trình caprolactam thành capron theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='caprolactam-capron-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=940,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7member6C1Nring/2COdouble/5bareCH2inpolymer/NwithHverticalbond/1filledRIGHT/t°above/ncoefficient+roundpair+nsub/exactlowercasecaprolactam-capron/noaddedH2O-condition-answer.')
(K/'cau-truc-caprolactam-capron-ddh-lo-281-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
