"""Bốn Haworth rõ nguồn: giữ từng nhánh H/OH và phối cảnh cạnh trước."""
from pathlib import Path
import json,hashlib,math,importlib.util,sys
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);inputName=sys.argv[1]if len(sys.argv)>1 else'doc-haworth-cau-truc-6.json';outName=sys.argv[2]if len(sys.argv)>2 else'cau-truc-haworth-ddh-lo-26-ban-dung.json';data=json.loads((M/inputName).read_text());sources=data['records']if isinstance(data,dict)else data;rows=[]
def line(x,y,xx,yy,w=2.5):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round"/>'
def wedge(p,q,w1,w2):
 x,y=p;xx,yy=q;dx=xx-x;dy=yy-y;n=math.hypot(dx,dy);nx=-dy/n;ny=dx/n;pts=[(x+nx*w1/2,y+ny*w1/2),(xx+nx*w2/2,yy+ny*w2/2),(xx-nx*w2/2,yy-ny*w2/2),(x-nx*w1/2,y-ny*w1/2)]
 return '<polygon points="'+' '.join(f'{a:.4f},{b:.4f}'for a,b in pts)+'" fill="#252440"/>'
coords={'C1':(500,260),'C2':(395,340),'C3':(225,340),'C4':(120,260),'C5':(225,180)}
for r in sources:
 if len(sys.argv)==1 and r['i']not in[294,337,434,648]:continue
 assert r['panels'][0]['ringSize']==6 and not r['panels'][0].get('carbonNumbers')and not r['panels'][0].get('annotationArrows')
 b=line(225,180,377,180)+line(410,192,500,260)+line(120,260,225,180)
 b+=wedge(coords['C4'],coords['C3'],2,9)+line(225,340,395,340,9)+wedge(coords['C2'],coords['C1'],9,2)+F.label(395,190,'O',32)
 for c,branches in r['panels'][0]['branches'].items():
  x,y=coords[c]
  for direction,group in branches.items():
   if direction=='up':
    baseline=y-42 if c in['C2','C3']else y-68;end=y-28 if c in['C2','C3']else y-52
   else:baseline=y+52 if c=='C5'else y+80;end=y+22 if c=='C5'else y+52
   b+=line(x,y,x,end);label=group.replace('CH2OH','CH₂OH');atom='C'if label.startswith('C')else label[0];b+=F.label(x-F.advance(atom,30)/2,baseline,label,30,'start')
 svg=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="490" viewBox="0 0 700 490"><title>Công thức vòng theo hình nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='haworth-ddh-'+h+'.svg';(M/fn).write_bytes(svg);a=dict(r);a.update(svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap');rows.append(a)
(M/outName).write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng',len(rows),'nguồnHaworth, chờsoát.')
