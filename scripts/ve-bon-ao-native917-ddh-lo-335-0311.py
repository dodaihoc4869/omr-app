"""Mạch acid nguồn889: đếm đỉnh theo nguồn, COOH giữ nguyên dạng chữ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a7512bfa2bfd20cac1afd9a8e20e16d71f2c2a210d2b7704c95c5de341090b8e';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<defs><radialGradient id="shade" cx="30%" cy="32%" r="75%"><stop offset="0" stop-color="#aaa"/><stop offset="1" stop-color="#797979"/></radialGradient></defs>'
b+='<path d="M33 63L38 64" stroke="#aaa" stroke-width="1"/>'
b+='<circle cx="133.5" cy="138" r="50.5" fill="url(#shade)"/>'
paths=['M380 137 C350 129 311 107 301 120 C286 138 299 165 320 159 C341 155 364 143 380 137 Z','M380 137 C408 128 448 106 460 121 C473 137 463 165 443 159 C420 155 396 142 380 137 Z','M642 142 C653 115 664 75 684 76 C707 77 718 102 701 117 C685 131 661 137 642 142 Z','M642 142 C616 151 579 161 575 181 C570 205 594 219 612 202 C627 186 635 160 642 142 Z','M879 138 C869 113 849 77 860 61 C872 45 895 51 900 67 C906 83 888 119 879 138 Z','M879 138 C868 165 850 197 860 212 C873 231 896 221 901 207 C905 191 889 159 879 138 Z']
for path in paths:b+='<path d="'+path+'" fill="url(#shade)"/>'
axes=[((63,141),(204,141),(133,212),(133,72),(184,91),(83,191)),((283,137),(492,137),(380,212),(380,72),(428,91),(328,191)),((570,142),(712,142),(642,212),(642,72),(713,72),(566,219)),((808,138),(949,138),(879,227),(879,38),(929,88),(830,187))]
for a in axes:
 d=''
 for j in range(0,6,2):
  x,y=a[j];X,Y=a[j+1];d+=f'M{x} {y}L{X} {Y} '
  import math
  ux,uy=(X-x)/math.hypot(X-x,Y-y),(Y-y)/math.hypot(X-x,Y-y)
  d+=f'M{X-ux*5-uy*4:.2f} {Y-uy*5+ux*4:.2f}L{X} {Y}L{X-ux*5+uy*4:.2f} {Y-uy*5-ux*4:.2f} '
 b+='<path d="'+d+'" fill="none" stroke="#777" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>'
for x,y,t in [(195,165,'x'),(99,207,'y'),(150,86,'z'),(480,165,'x'),(345,210,'y'),(397,86,'z'),(700,165,'x'),(582,238,'y'),(658,86,'z'),(938,165,'x'),(841,211,'y'),(894,52,'z')]:b+=F.label(x,y,t,26,fill='#606060')
for x,t in [(145,'(1)'),(383,'(2)'),(645,'(3)'),(880,'(4)')]:b+=F.label(x,285,t,36,fill='#606060')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1019" height="322" viewBox="0 0 1019 322"><title>Bốn hình AO theo nguồn917</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-ao-native917-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=917,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4panels1sphere6graylobes/12axes12OPENVheads12xyz4captions/axisOVERshapes/xRIGHT-zUP-yDOWNLEFT/0phaseSigns0nucleus/noaddedAOname-answer/theoryfix/tinyLEFTspeckintentUNKNOWNretained')
(K/'cau-truc-bon-ao-native917-ddh-lo-335-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
