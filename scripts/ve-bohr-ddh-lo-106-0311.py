"""Mô hình lớp electron: giữ số hạt, vị trí và nhãn hạt nhân từng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())};rows=[]
for i in[816,1411,456,1326]:
 p=i in[816,1411];radii=[120,200,280]if p else[150,220,280];angles=[[-90,90],[-90,-45,0,45,90,135,180,225],[-115,-58,15,112,180]]if p else[[-58,122],[-90,-45,0,45,90,135,180,225],[-138,-42,90]]
 b=''.join(f'<circle cx="340" cy="340" r="{r}" fill="none" stroke="#252440" stroke-width="3"/>'for r in radii)
 b+=f'<circle cx="340" cy="340" r="{60 if p else 48}" fill="#c1c1c1"'+(''if p else' stroke="#252440" stroke-width="2"')+'/>'
 if p:b+=F.label(340,355,'+15',42)
 for r,aa in zip(radii,angles):
  for angle in aa:
   t=math.radians(angle);x=340+r*math.cos(t);y=340+r*math.sin(t);b+=f'<circle cx="{x:.5f}" cy="{y:.5f}" r="{18 if p else 11}" fill="'+('#252440'if p else'#a0a0a0')+'" stroke="#252440" stroke-width="2"/>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="680" height="680" viewBox="0 0 680 680"><title>Các lớp electron theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bohr-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='P2/8/5+nucleus+15;Al2/8/3+nucleusKHÔNGchữ,khôngtựthêmAl/+13/sốhạt;mọichấmđượcđếmtừngshell.'))
(M/'cau-truc-bohr-ddh-lo-106-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
