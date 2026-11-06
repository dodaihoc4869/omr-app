"""Nguồn177: sơ đồ ba vệt và nguồn điện; giữ nguyên cathode/anode cùng dấu cực."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1e9a44c613c53a831d642904515b353e99744f5a54957e92ba98da3a6a8268d1';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
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
for x in [255,323,390]:b+=f'<path d="M{x} 101H{x+14}V179H{x}Z" fill="#a1a1a1" stroke="#777777" stroke-width=".7"/>'
b+=label(205,96,'cathode',18)+label(458,95,'anode',18)+label(181,115,'−',19)+label(475,115,'+',19)
b+=label(1,93,'Kết thúc',16,'start')
b+=path('M249 182L203 223M328 182V236M404 182L454 226',1.1)
b+=label(183,253,'(1)',18)+label(328,253,'(2)',18)+label(466,253,'(3)',18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="610" height="276" viewBox="0 0 610 276"><title>Ba vệt trong sơ đồ theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-di-ba-vet-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=177,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3graybands/closedrectcell/cathode−LEFT-anode+RIGHT/2roundterminals/sourceboxminusLplusR/wires/3leaders(1)(2)(3)/Nguồnđiện-Kếtthúc/noliquid-added/DDHpath.');(K/'cau-truc-dien-di-ba-vet-ddh-lo-215-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
