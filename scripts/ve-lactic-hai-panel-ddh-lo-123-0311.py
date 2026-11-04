"""Giữ cả công thức lập thể và mô hình12quảcầu; không suy nguyên tố bằng màu."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=json.loads((M/'doc-lactic-model-1254.json').read_text());q=r['panelRight'];atoms={v['id']:v for v in q['spheres']}
def line(x,y,xx,yy,w=2,color='#252440'):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" stroke="{color}" stroke-width="{w}" fill="none" stroke-linecap="round"/>'
b='<defs><radialGradient id="dark" cx="32%" cy="25%" r="78%"><stop offset="0" stop-color="#606060"/><stop offset="0.35" stop-color="#3b3b3b"/><stop offset="1" stop-color="#202020"/></radialGradient><radialGradient id="light" cx="28%" cy="25%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="#eeeeee"/><stop offset="0.7" stop-color="#bbbbbb"/><stop offset="1" stop-color="#707070"/></radialGradient></defs><g transform="translate(30 40) scale(2)">'
g=r['panelLeft']['geometryPixel']
for p1,p2 in g['singleBonds']+g['carbonylDouble']:b+=line(*p1,*p2,2.5)
wedge=g['solidWedge'];v=[wedge['from'],wedge['baseLeft'],wedge['baseRight']];b+='<polygon points="'+' '.join(f'{x},{y}'for x,y in v)+'" fill="#252440"/>'
b+=F.label(152,48,'O',44)+F.label(201,150,'OH',42,'start')+F.label(75,235,'OH',42,'start')
for bond in q['connections']:
 aa,bb=atoms[bond['a']],atoms[bond['b']];x,y=aa['fitCircle']['center'];xx,yy=bb['fitCircle']['center'];dx,dy=xx-x,yy-y;d=math.hypot(dx,dy);nx,ny=-dy/d,dx/d
 if bond['order']==2:
  for shift in[-4,4]:
   b+=line(x+nx*shift,y+ny*shift,xx+nx*shift,yy+ny*shift,5.5,'#363636')+line(x+nx*(shift-.8),y+ny*(shift-.8),xx+nx*(shift-.8),yy+ny*(shift-.8),1.3,'#909090')
 else:
  light=aa['element']=='H'or bb['element']=='H';b+=line(x,y,xx,yy,12 if light else 14,'#363636')+line(x-.7,y-.7,xx-.7,yy-.7,6 if light else 8,'#d0d0d0'if light else'#505050')
order=['H_methyl_top','H_methyl_left','H_alpha','C_methyl','C_carboxyl','O_carbonyl','H_acidOH','O_acidOH','H_methyl_front','C_alpha','H_alphaOH','O_alphaOH']
for key in order:
 aa=atoms[key];x,y=aa['fitCircle']['center'];rad=aa['fitCircle']['radius'];kind='light'if aa['element']=='H'else'dark';b+=f'<circle cx="{x}" cy="{y}" r="{rad}" fill="url(#{kind})" stroke="#686772" stroke-width="0.5"/>'
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="550" viewBox="0 0 1250 550"><title>Hai cách biểu diễn theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lactic-hai-panel-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2DSnêmOHđặc/nguyêntửCimplicit/Halphaẩn.3Dđủ12sphere3C3O6Hgrayscale/11connections12rods/C=O2rodskhetrắng;HalphasauCalpha,HmethylfronttrướcCmethyl,OalphaOHcheHalphaOH. Centersfitcósaisốghiởreport,khôngkhẳngđịnhtọađộkhônggian3Dthật. No sphereletters/caption/extrapanels.')
(M/'cau-truc-lactic-hai-panel-ddh-lo-123-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
