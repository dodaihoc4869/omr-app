"""Ba đơn vị polymer có đầu tiếp diễn; mỗi vòng chỉ cạnh ngang trước là đậm."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-polyglucose-lo-152.json').read_text())if r['i']==1406);g=r['geometry']
def line(p,q,w=1.1):return f'<path d="M{p[0]} {p[1]}L{q[0]} {q[1]}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round"/>'
b='<g transform="translate(30 30) scale(4)">'
for u in g['units']:
 v=u['vertices'];order=u['ringOrder']
 for a,z in zip(order,order[1:]):
  p,q=v[a][:],v[z][:]
  if a=='ringO':
   d=math.dist(p,q);p=[p[k]+(q[k]-p[k])*10/d for k in[0,1]]
  if z=='ringO':
   d=math.dist(p,q);q=[q[k]+(p[k]-q[k])*10/d for k in[0,1]]
  b+=line(p,q,3.5 if {a,z}=={'C3','C2'}else 1.1)
 x,y=v['ringO'];b+=F.label(x,y+6,'O',16)
 z=u['CH2OH'];b+=line(*z['bond']);x,y=z['bond'][-1];b+=F.label(x-F.advance('C',16)/2,y-3,'CH₂OH',16,'start')
 for name in['OH_C3','OH_C2']:
  z=u[name];b+=line(*z['bond']);x,y=z['bond'][-1];baseline=y-5 if name=='OH_C3'else y+19;b+=F.label(x-F.advance('O',16)/2,baseline,'OH',16,'start')
for z in g['bridges']:
 for ps in z['bonds']:b+=line(*ps)
 x,y=z['oxygen']['anchor'];b+=F.label(x,y+6,'O',16)
for key in['leftContinuation','rightContinuation']:
 z=g[key];b+=line(*z['bond'])
 if z.get('oxygen'):
  x,y=z['oxygen']['anchor'];b+=F.label(x,y+6,'O',16)
 for x,y in z['ellipsisCenters']:b+=f'<circle cx="{x}" cy="{y}" r="2.1" fill="#252440"/>'
for z in g['carbonNumbers']:
 x,y=z['anchor'];b+=F.label(x,y+5,z['text'],13)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="2120" height="780" viewBox="0 0 2120 780"><title>Đoạn polymer ba vòng với hai đầu tiếp diễn theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polyglucose-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3unit6ring/3CH2OH/6OH/3ringO/2bridgeO/1externalrightO/num1unit1C1và4unit2C4/2stub+ellipsis. CHỈC3–C2horizontalfrontđậm(mỗivòng),cạnhkhácthườngALLsingle/noCIP-extraH/nrepeat-brackets-caption/finiteoligosaccharide.')
(M/'cau-truc-polyglucose-ddh-lo-153-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
