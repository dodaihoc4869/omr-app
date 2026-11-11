"""Mạch acid xanh nguồn617: dựng riêng theo native, giữ hai chân carbonyl trên nhánh xiên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='728e3cfe0ffaf4749bc3727dc3d3cf065ebf9a54032453f9346c1501212e263e';b=''
vertices=[(9,17),(39,67),(70,17),(100,67),(131,17),(161,67),(222,67),(253,17),(284,67),(345,67),(376,17),(406,67),(437,17),(468,67),(499,17),(529,67),(560,17),(591,67)]
def line(v,w):return f'<path d="M{v[0]} {v[1]}L{w[0]} {w[1]}" stroke="#0000ff" stroke-width="2.7" stroke-linecap="round" fill="none"/>'
for v,w in zip(vertices,vertices[1:]):b+=line(v,w)
for v,w in [((167,59),(218,59)),((290,59),(341,59)),((591,67),(611,35)),((587,60.5484),(587,103)),((595,60.6),(595,103))]:b+=line(v,w)
b+=F.label(591,132,'O',32,fill='#0000ff')+F.label(621-F.advance('O',32)/2,30,'OH',32,anchor='start',fill='#0000ff')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="664" height="139" viewBox="0 0 664 139"><title>Mạch acid xanh theo nguồn617</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-xanh617-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=617,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='18bareC2O/2CCdouble1COdoubleDOWN2raysCONTACT2slopingarms-nativeVapexNOcrossbar/BLUEuniformthin-roundends/regularUPRIGHTO-OHfirstOanchor/0stereo0arrows/noaddedH-name-formula-omegaanswer-noalias321')
(K/'cau-truc-acid-xanh617-native-ddh-lo-364-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
