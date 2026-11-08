"""Nguồn942: chuỗi carbon với sáu nối đôi, giữ nguyên hình học nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='aa2037842ff1ca13d23b55b8c5a6240122112dae14f783af066524f91729384a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
vertices=[(104,78),(141,42),(170,79),(206,43),(243,43),(272,80),(307,44),(344,44),(374,80),(410,45),(446,45),(475,81),(511,46),(548,46),(577,82),(614,47),(650,47),(679,83),(716,48),(752,48),(782,84),(819,48)]
b=line('M'+'L'.join(f'{x} {y}'for x,y in vertices),2)
b+=line('M76 42L104 78 M101 82V112 M108 82V112',2)
for a in [3,6,9,12,15,18]:
 x,y=vertices[a];xx,yy=vertices[a+1];b+=line(f'M{x+2} {y+7}H{xx-2}',2)
b+=F.label(55,54,'HO',30)+F.label(104,137,'O',29)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="859" height="166" viewBox="0 0 859 166"><title>Công thức cấu tạo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='mach-dha-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=942,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22bareC2O/6flatTOPCCdoubleinnerBELOW/COdoubleDOWN/HOleftOanchor/freeRIGHTend/allthinuniform/noaddedH-nums-omega-caption-answer.')
(K/'cau-truc-mach-dha-ddh-lo-281-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
