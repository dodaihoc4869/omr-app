"""Các nét vòng Haworth dùng chung; chỉ dựng các nhánh được chỉ rõ từ nguồn."""
from pathlib import Path
import math,importlib.util
G=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
COORDS={'C1':(500,260),'C2':(395,340),'C3':(225,340),'C4':(120,260),'C5':(225,180)}
def line(x,y,xx,yy,w=2.5):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round"/>'
def wedge(p,q,w1,w2):
 x,y=p;xx,yy=q;dx=xx-x;dy=yy-y;n=math.hypot(dx,dy);nx=-dy/n;ny=dx/n;pts=[(x+nx*w1/2,y+ny*w1/2),(xx+nx*w2/2,yy+ny*w2/2),(xx-nx*w2/2,yy-ny*w2/2),(x-nx*w1/2,y-ny*w1/2)]
 return '<polygon points="'+' '.join(f'{a:.4f},{b:.4f}'for a,b in pts)+'" fill="#252440"/>'
def body(branches):
 b=line(225,180,377,180)+line(410,192,500,260)+line(120,260,225,180)+wedge(COORDS['C4'],COORDS['C3'],2,9)+line(225,340,395,340,9)+wedge(COORDS['C2'],COORDS['C1'],9,2)+F.label(395,190,'O',32)
 for c,items in branches.items():
  x,y=COORDS[c]
  for direction,group in items.items():
   if not group:continue
   if direction=='up':baseline=y-42 if c in['C2','C3']else y-68;end=y-28 if c in['C2','C3']else y-52
   elif direction=='down':baseline=y+52 if c=='C5'else y+80;end=y+22 if c=='C5'else y+52
   else:raise ValueError('Hướng nhánh chưa xác định')
   group=group.replace('CH2OH','CH₂OH');atom='C'if group.startswith('C')else group[0];b+=line(x,y,x,end)+F.label(x-F.advance(atom,30)/2,baseline,group,30,'start')
 return b
