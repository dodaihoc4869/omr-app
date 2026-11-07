"""Đoạn mạch nguồn714, giữ nguyên nhãn và các nhánh đọc trực tiếp."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='4ff8f27b56479540024faa5f7568d62ebf3ab83011018945f679a5e29d70f3ac'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='';x=120;centres=[]
for t in ['CH₂','CH','CH','CH₂','CH₂','CH','CH₂','CH']:
 centres.append(x+F.advance('C',33)/2);b+=F.label(x,137,t,33,'start');x+=F.advance(t,33)+1
for n,up in [(1,False),(2,True),(5,False),(7,True)]:
 cx=centres[n];b+=f'<path d="M{cx} {104 if up else 145}V{79 if up else 168}" stroke="#252440" stroke-width="2"/>';b+=F.label(cx+16,72 if up else 198,'CH₃',33)
b+='<path d="M90 124H115" stroke="#252440" stroke-width="2"/>'
b+=f'<path d="M{x+2} 124H{x+27}" stroke="#252440" stroke-width="2"/>'
for xx in [66,74,82,x+34,x+42,x+50]:b+=f'<circle cx="{xx}" cy="124" r="1.8" fill="#252440"/>'
raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="706" height="259" viewBox="0 0 706 259"><title>Đoạn mạch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='doan-mach-polymer-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=714,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='8backboneC:CH2-CH-CH-CH2-CH2-CH-CH2-CH;4CH3branches2down3up6down8up;2endstubs3dotsEACH/noanswer-caption.')
(K/'cau-truc-doan-mach-polymer-ddh-lo-254-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn,x)
