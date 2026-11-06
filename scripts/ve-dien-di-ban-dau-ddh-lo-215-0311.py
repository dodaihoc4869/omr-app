"""Nguồn453: sơ đồ vệt ban đầu và nguồn điện; giữ nguyên cathode/anode cùng dấu cực."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='522db1ea2927fdebe22966738da203feaa908459051c23040dd56ca3ecd7e7da';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.5,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=18,a='middle'):return F.label(x,y,t,z,a)
b=''
b+=path('M254 32H134C56 32 55 141 134 141H193M401 32H524C602 32 602 141 524 141H463',1.5)
b+=path('M263 2H393V61H263Z',1.8)+label(328,38,'Nguồn điện',18)+label(251,19,'−',21)+label(402,19,'+',21)
for x in [254,401]:b+=f'<circle cx="{x}" cy="32" r="7" fill="#777777" stroke="#252440" stroke-width="1.3"/>'
b+=path('M168 76H489V206H168Z',1.6)+path('M193 101V182M463 101V182',1)
for x in [324]:b+=f'<path d="M{x} 101H{x+14}V179H{x}Z" fill="#a1a1a1" stroke="#777777" stroke-width=".7"/>'
b+=label(205,96,'cathode',18)+label(458,95,'anode',18)+label(181,115,'−',19)+label(475,115,'+',19)
b+=label(1,93,'Ban đầu',17,'start')
b+=label(329,199,'Môi trường có pH = 6',18)+path('M340 153L552 217',1.1)+label(447,237,'Vệt có chứa Ala, Lys, Glu',17,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="760" height="255" viewBox="0 0 760 255"><title>Vệt ban đầu trong sơ đồ theo nguồn</title>'+'<g transform="translate(5 -1)">'+b+'</g></svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-di-ban-dau-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=453,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1grayband/closedrectcell/cathode−LEFT-anode+RIGHT/2roundterminals/sourceboxminusLplusR/wires/1leader/MôitrườngcópH=6/Ala-Lys-Glu/Nguồnđiện-Banđầu/noliquid-added/DDHpath.');(K/'cau-truc-dien-di-ban-dau-ddh-lo-215-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
