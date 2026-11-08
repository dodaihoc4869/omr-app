"""Nguồn987: hai vòng đường, giữ nguyên X và Y chưa xác định."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b162a9cd81d6f2696084260fa6626362671d7d1eac5d4bd877cd8003e076b441';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M60 148L112 108H184 M208 115L249 148L277 181 M298 181L324 148L374 107H442 M468 114L511 148 M60 148V186 M112 108V74 M112 184V154 M196 192V225 M374 107V74 M375 184V153 M458 191V225 M511 148V186',2.2)
for points in ['60,148 113,184 113,192','196,184 249,148 196,192','324,148 375,184 375,192','458,184 511,148 458,192']:b+=f'<polygon points="{points}" fill="#252440"/>'
b+=line('M112 188H196 M374 188H458',7)
for x,y,t,z,a in [(101,69,'CH₂OH',28,'start'),(199,113,'O',28,'middle'),(287,198,'O',28,'middle'),(455,113,'O',28,'middle'),(48,212,'OH',28,'start'),(103,149,'OH',28,'start'),(185,251,'OH',28,'start'),(365,149,'OH',28,'start'),(447,251,'OH',28,'start'),(374,69,'X',28,'middle'),(511,212,'Y',28,'middle')]:b+=F.label(x,y,t,z,a)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="565" height="284" viewBox="0 0 565 284"><title>Cấu tạo hai vòng đường với vị trí X và Y theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-vong-duong-xy-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=987,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Haworth6memberrings/2ringO1bridgeO/4TAPER2frontbold/1CH2OHleftUP/5freeOHleft3right2/XrightUP-YrightDOWNliteral/regularDDHlabels/noaddedH-captions-answerXY.')
(K/'cau-truc-hai-vong-duong-xy-ddh-lo-284-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
